"use client"

import { useAction, useMutation, useQuery } from "convex/react"
import { useState, useEffect, useMemo } from "react"
import {
  CalculatorIcon,
  CarFrontIcon,
  ClockIcon,
  CrownIcon,
  FileTextIcon,
  LandmarkIcon,
  MailIcon,
  MegaphoneIcon,
  SparklesIcon,
  Trash2,
} from "lucide-react"

import { toast } from "@/components/ui/toast"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeammateBotRecord } from "@/components/bot-dialog"
import { useDesktopPanel } from "@/components/desktop-panel"
import { formatGoogleAccountLabel } from "@/components/gmail-connect-modal"
import { useAgentRunner } from "@/components/agent-runner-provider"
import { parseQuoteFromText } from "@/lib/quote-pdf"
import { ChatQuoteCard } from "@/components/chat-quote-card"
import {
  ChatFinanceCard,
  ChatFollowUpCard,
} from "@/components/chat-dealership-cards"
import {
  ChatCarIntakeModal,
  extractCarDraftFromConversation,
  isCarAddIntakeMessage,
  type ExtractedCarDraft,
} from "@/components/chat-car-intake-modal"
import {
  parseFilePartToContext,
  PromptInputAttachmentTray,
  PromptInputAttachMenuButton,
} from "@/components/chat-attachment-bar"
import {
  formatAttachmentsForAgentPrompt,
  type ParsedAttachmentContext,
} from "@/lib/document-context"
import {
  formatZar,
  parseFinanceIntentFromText,
  parseFollowUpIntentFromText,
  SA_SHOWROOM_VEHICLES,
  type ShowroomVehicle,
} from "@/lib/sa-dealership"
import { cn } from "@/lib/utils"

function detectBotDomain(bot?: TeammateBotRecord) {
  const n = (bot?.name ?? "").toLowerCase()
  const j = (bot?.job ?? "").toLowerCase()
  const cat = (bot?.category ?? "").toLowerCase()
  const skills = new Set(bot?.skills ?? [])

  const isMaster =
    Boolean(bot?.isMaster) ||
    cat === "orchestrator" ||
    n.includes("dealership hq") ||
    n.includes("ops ai")
  const isPublisher =
    cat === "publishing" ||
    n.includes("publisher") ||
    n.includes("portal") ||
    j.includes("cars.co.za") ||
    j.includes("autotrader")
  const isFinance =
    cat === "finance" ||
    n.includes("finance") ||
    n.includes("f&i") ||
    j.includes("wesbank") ||
    j.includes("vaf")
  const isFollowUp =
    cat === "followup" ||
    n.includes("follow-up") ||
    n.includes("followup") ||
    j.includes("follow-up") ||
    j.includes("retention")
  const isWhatsApp =
    cat === "whatsapp" ||
    n.includes("whatsapp") ||
    n.includes("fame") ||
    j.includes("whatsapp")
  const isQuote =
    cat === "sales" ||
    n.includes("quote") ||
    n.includes("deal & quote") ||
    n.includes("craft") ||
    j.includes("offer to purchase")
  const isTradeIn =
    cat === "tradein" ||
    n.includes("trade-in") ||
    n.includes("stock") ||
    n.includes("supplier") ||
    j.includes("transunion") ||
    j.includes("appraisal")
  const isSocial =
    cat === "marketing" ||
    n.includes("social") ||
    n.includes("omni") ||
    j.includes("tiktok") ||
    j.includes("walkaround")
  const isEmail =
    cat === "email" ||
    n.includes("email") ||
    n.includes("leads") ||
    n.includes("aero") ||
    j.includes("gmail")

  return {
    isMaster,
    isPublisher,
    isFinance,
    isFollowUp,
    isWhatsApp,
    isQuote,
    isTradeIn,
    isSocial,
    isEmail,
    hasSkill: (slug: string) => isMaster || skills.has(slug),
  }
}

export function Chat({
  chatId,
  bots = [],
  initialPrompt,
}: {
  chatId: string
  bots?: TeammateBotRecord[]
  initialPrompt?: string
}) {
  const desktop = useDesktopPanel()
  const runner = useAgentRunner()
  const currentRun = runner.getRun(chatId)
  const isWorking = runner.isWorking(chatId)

  const data = useQuery(api.teammates.getChat, {
    chatId: chatId as Id<"teammate_chats">,
  })
  const storeContext = useQuery(api.dashboard.botStoreContext, {})
  const sendMessageMut = useMutation(api.teammates.sendMessage)
  const saveReplyMut = useMutation(api.teammates.saveAssistantReply)
  const deleteMessageMut = useMutation(api.teammates.deleteMessage)
  const sendEmailAction = useAction(api.composioTools.sendOutboundEmail)
  const fetchRecentEmailsAction = useAction(api.composioTools.fetchRecentEmails)

  const activeBots = (data?.bots ?? bots) as TeammateBotRecord[]
  const subAgents = (data?.subAgents ?? []) as TeammateBotRecord[]
  const allKnownBots = (data?.allUserBots ?? activeBots) as TeammateBotRecord[]
  const messages = data?.messages ?? []

  // In Master HQ chat, allow delegating to Master HQ itself OR any sub-agent right inside the unified chat!
  const selectableBots = useMemo(() => {
    if (activeBots[0]?.isMaster && subAgents.length > 0) {
      return [activeBots[0], ...subAgents]
    }
    return activeBots
  }, [activeBots, subAgents])

  const [selectedBotId, setSelectedBotId] = useState<string | undefined>(
    activeBots[0]?.id
  )
  const [initialPromptSent, setInitialPromptSent] = useState(false)
  const [parsedAttachmentsMap, setParsedAttachmentsMap] = useState<
    Record<string, ParsedAttachmentContext>
  >({})
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState<
    string | undefined
  >(undefined)
  const [carIntakeModalOpen, setCarIntakeModalOpen] = useState(false)
  const [carIntakeDraft, setCarIntakeDraft] = useState<ExtractedCarDraft>(() =>
    extractCarDraftFromConversation("")
  )

  const currentBot =
    selectableBots.find((b) => b.id === selectedBotId) ?? activeBots[0]

  const botMap = useMemo(
    () => new Map<string, TeammateBotRecord>(allKnownBots.map((b) => [b.id, b])),
    [allKnownBots]
  )

  const showroomInventory: ShowroomVehicle[] = useMemo(() => {
    if (storeContext?.vehicles && storeContext.vehicles.length > 0) {
      return storeContext.vehicles as unknown as ShowroomVehicle[]
    }
    return SA_SHOWROOM_VEHICLES
  }, [storeContext?.vehicles])

  const currentDomain = detectBotDomain(currentBot)
  const isPrimaryMaster = Boolean(activeBots[0]?.isMaster)

  const handleStop = () => {
    runner.stopTurn(chatId)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMut({
        messageId: messageId as Id<"teammate_messages">,
      })
      toast.add({ type: "success", title: "Message deleted" })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Failed to delete message",
        description: err instanceof Error ? err.message : "Error deleting message",
      })
    }
  }

  const handleSubmit = async (input: PromptInputMessage) => {
    const rawText = input.text.trim()
    const attachedFiles = input.files ?? []
    if ((!rawText && attachedFiles.length === 0) || isWorking) return

    const targetBot = currentBot ?? activeBots[0]
    if (!targetBot) {
      toast.add({ type: "error", title: "No agent selected to answer" })
      return
    }

    // Gather or finish extracting context for any attached documents / images
    const existingParsedList = Object.values(parsedAttachmentsMap)
    let activeAttachmentContexts: ParsedAttachmentContext[] = []

    if (attachedFiles.length > 0) {
      activeAttachmentContexts = await Promise.all(
        attachedFiles.map(async (f, idx) => {
          const matchByName = existingParsedList.find(
            (p) => p.filename === f.filename
          )
          if (matchByName) return matchByName
          try {
            return await parseFilePartToContext({
              id: `att_sub_${idx}_${Date.now()}`,
              filename: f.filename,
              mediaType: f.mediaType,
              url: f.url,
            })
          } catch {
            return {
              id: `att_fb_${idx}`,
              filename: f.filename || "attachment",
              mediaType: f.mediaType || "application/octet-stream",
              category: f.mediaType?.startsWith("image/") ? "image" : "other",
              dealershipDocType: f.mediaType?.startsWith("image/")
                ? "Vehicle Walkaround Photo"
                : "General Dealership Document",
              extractedText: `Attached file "${f.filename || "file"}" (${f.mediaType || "document"}).`,
              summary: "Attached to conversation",
              metadata: {},
              previewDataUrl: f.mediaType?.startsWith("image/") ? f.url : undefined,
              parserEngine: "AutoPulse Context Engine",
            }
          }
        })
      )
      setParsedAttachmentsMap({})
    }

    const {
      userMessageBadgeBlock,
      systemContextBlock,
      primaryImageDataUrl,
    } = formatAttachmentsForAgentPrompt(activeAttachmentContexts)

    if (primaryImageDataUrl) {
      setLastUploadedImageUrl(primaryImageDataUrl)
    }

    const defaultPromptForFiles =
      activeAttachmentContexts.length > 0
        ? `Please analyze the attached ${activeAttachmentContexts.map((a) => `${a.dealershipDocType} (${a.filename})`).join(", ")} using its full extracted context and execute the appropriate dealership action.`
        : ""

    const text = rawText || defaultPromptForFiles
    const displayMessageText = userMessageBadgeBlock
      ? `${userMessageBadgeBlock}\n\n${text}`
      : text
    const promptTextWithAttachmentContext = systemContextBlock
      ? `${text}\n\n${systemContextBlock}`
      : text

    const targetDomain = detectBotDomain(targetBot)

    // Auto-sync DesktopPanel navigation & cloud desktop
    const urlMatch = text.match(
      /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/i
    )
    if (urlMatch && desktop) {
      let candidate = urlMatch[0].replace(/[.,;:!?)]+$/, "")
      if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
        candidate = `https://${candidate}`
      }
      desktop.setCurrentUrl(candidate)
      if (/desktop|screen|live\s?browser|vnc|remote|chromium/i.test(text)) {
        void desktop.launchCloudDesktop(candidate)
      }
    }

    // Auto-open Gmail connect modal if requested
    if (
      desktop &&
      (targetDomain.isEmail || targetDomain.isMaster) &&
      /connect.*gmail|email.*connect|connect.*email/i.test(text)
    ) {
      desktop.openGmailModal?.()
    }

    // Auto-dispatch email if explicitly requested
    const emailMatch = text.match(
      /(?:send|dispatch|shoot)\s+(?:an?\s+)?email\s+(?:to\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    )
    if (emailMatch) {
      const recipient = emailMatch[1]
      const sayMatch = text.match(/say(?:ing)?\s+["']?([^"']+)["']?$/i)
      const emailBody = sayMatch ? sayMatch[1].trim() : text
      const emailSubject = /finance|wesbank|absa|mfc|bank/i.test(text)
        ? "AutoPulse Motors SA — Vehicle Finance Application Dossier"
        : /quote|offer|otp/i.test(text)
          ? "AutoPulse Motors SA — Official Offer to Purchase (OTP)"
          : `Message from ${targetBot.name} · AutoPulse Motors SA`

      void sendEmailAction({
        to: recipient,
        subject: emailSubject,
        body: emailBody,
      })
        .then((res) => {
          if (res.success) {
            toast.add({
              type: "success",
              title: "Email Dispatched",
              description: `Sent directly to ${recipient} via connected Gmail.`,
            })
          } else if (!res.isConnected && desktop) {
            desktop.openGmailModal?.()
            toast.add({
              type: "info",
              title: "Connect Gmail to Send",
              description: `Authorize your Gmail inbox to deliver to ${recipient}.`,
            })
          }
        })
        .catch(() => null)
    }

    // Auto-open relevant Dealership Action Studio in DesktopPanel (never auto-pop publisher modal on chat)
    if (desktop) {
      if (
        /finance|wesbank|absa|mfc|nedbank|standard\s*bank|capitec|signio|instalment|installment|balloon|fica|auto.?apply/i.test(
          text
        ) &&
        (targetDomain.isFinance || targetDomain.isMaster || targetDomain.hasSkill("finance_auto_apply"))
      ) {
        desktop.setOpen(true)
        desktop.setActiveTab("actions")
        desktop.setActionSubView("finance")
      } else if (
        /follow[- ]?up|cadence|test[- ]?drive|cold\s*lead|remind|chase/i.test(text) &&
        (targetDomain.isFollowUp || targetDomain.isMaster || targetDomain.hasSkill("whatsapp_followup"))
      ) {
        desktop.setOpen(true)
        desktop.setActiveTab("actions")
        desktop.setActionSubView("followups")
      } else if (
        /trade[- ]?in|transunion|apprais|valuation|aging|floorplan|webuycars|auction/i.test(text) &&
        (targetDomain.isTradeIn || targetDomain.isMaster || targetDomain.hasSkill("trade_in_valuation"))
      ) {
        desktop.setOpen(true)
        desktop.setActiveTab("actions")
        desktop.setActionSubView("tradein")
      } else if (
        /offer\s*to\s*purchase|otp|quote|quotation|pdf|pro-?forma/i.test(text) &&
        (targetDomain.isQuote || targetDomain.isMaster || targetDomain.hasSkill("vehicle_quote_pdf"))
      ) {
        desktop.setOpen(true)
        desktop.setActiveTab("actions")
        desktop.setActionSubView("quotecraft")
      } else if (
        /tiktok|instagram|reel|walkaround|social.*dm|video\s*script/i.test(text) &&
        (targetDomain.isSocial || targetDomain.isMaster)
      ) {
        desktop.setOpen(true)
        desktop.setActiveTab("actions")
        desktop.setActionSubView("socialdms")
      }
    }

    try {
      await sendMessageMut({
        chatId: chatId as Id<"teammate_chats">,
        text: displayMessageText,
        targetBotId: targetBot.id as Id<"teammate_bots">,
      })

      let liveInboxSummary = ""
      if (
        (targetDomain.isEmail || targetDomain.isMaster) &&
        /(?:email|inbox|gmail|mail|portal\s*lead|cars\.co\.za|autotrader|today|receive)/i.test(
          text
        )
      ) {
        try {
          const inboxRes = await fetchRecentEmailsAction({ maxResults: 8 })
          if (inboxRes?.emails && inboxRes.emails.length > 0) {
            liveInboxSummary = [
              `=== LIVE CONNECTED GMAIL INBOX (${inboxRes.account || "Connected Account"}) ===`,
              ...inboxRes.emails.map(
                (e, idx) =>
                  `${idx + 1}. From: ${e.sender}\n   Subject: ${e.subject}\n   Summary: ${e.preview}`
              ),
            ].join("\n")
          }
        } catch (e) {
          console.warn("[Chat] fetchRecentEmails error:", e)
        }
      }

      // Build rich South African Car Dealership live data context
      const showroomSummary = showroomInventory
        .slice(0, 12)
        .map(
          (v) =>
            `- [${v.stockNumber}] ${v.year} ${v.make} ${v.model} ${v.variant} | ${v.condition.toUpperCase()} | ${v.mileageKm.toLocaleString("en-ZA")} km | ${v.colour} | ${v.transmission} ${v.fuelType} | Retail: ${formatZar(v.retailPriceZar)} (Cost: ${formatZar(v.costPriceZar)}, Days in stock: ${v.daysInStock}d) | VIN: ${v.vin} | Branch: ${v.branch} | Portals: Cars.co.za=${v.portals.cars_co_za ? "LIVE" : "NOT PUBLISHED"}, AutoTrader=${v.portals.autotrader_sa ? "LIVE" : "NOT PUBLISHED"}, OwnSite=${v.portals.dealership_website ? "LIVE" : "OFF"}`
        )
        .join("\n")

      const financeSummary =
        storeContext?.financeApplications && storeContext.financeApplications.length > 0
          ? storeContext.financeApplications
              .slice(0, 6)
              .map(
                (f) =>
                  `- [${f.applicationRef}] ${f.applicantName} | ${f.vehicleTitle} (${formatZar(f.vehiclePriceZar)}) | Deposit ${formatZar(f.depositZar)} | Est ${formatZar(f.estimatedMonthlyZar)}/pm | Status: ${f.overallStatus} | Banks: ${f.bankSubmissions.map((b) => `${b.bank}:${b.status}`).join(", ")}`
              )
              .join("\n")
          : "- [VAF-ZA-884102] Thabo Mokoena | 2024 Toyota Hilux GR-Sport | R949,900 | MFC Approved @ 11.4%, WesBank Approved @ 11.5%\n- [VAF-ZA-884219] Lerato Ndlovu | 2023 VW Golf 8 GTI | R729,900 | FICA Pending (Payslip)"

      const leadsSummary =
        storeContext?.messages && storeContext.messages.length > 0
          ? storeContext.messages
              .slice(0, 8)
              .map(
                (m) =>
                  `- [${m.channel.toUpperCase()}] ${m.from}: "${m.body.replace(/\n/g, " ").slice(0, 150)}"`
              )
              .join("\n")
          : ""

      const customSkillsSummary =
        storeContext?.customSkills && storeContext.customSkills.length > 0
          ? `=== DEALERSHIP CUSTOM SKILLS ===\n${storeContext.customSkills
              .map((sk) => `- ${sk.name} (${sk.category}): ${sk.instructions}`)
              .join("\n")}`
          : ""

      const subAgentsRoster =
        subAgents.length > 0
          ? `=== SPECIALIST AGENTS UNDER YOUR COMMAND (AUTOPULSE DEALERSHIP HQ) ===\n${subAgents
              .map(
                (sa) =>
                  `- **${sa.name}** (${sa.job}) [Skills: ${(sa.skills ?? []).join(", ") || "general"}]`
              )
              .join("\n")}`
          : ""

      // Build domain specialization rules
      let botSpecialization = ""
      if (targetDomain.isMaster) {
        botSpecialization = [
          "=== MASTER ROLE: AUTOPULSE DEALERSHIP HQ (GROK-STYLE SUPER ORCHESTRATOR · SOUTH AFRICA) ===",
          "- You are the single unified South African Car Dealership AI Director. All specialist agents (and every custom agent added by the dealer) report under you AND can run independently.",
          "- You can execute ANY dealership workflow directly from this single chat in one shot:",
          "  1. **Add Car to Databases & Portals**: Keep it simple — confirm the car photos & details provided, ask which places to add it to (Our Database & Website, Cars.co.za, AutoTrader SA, Facebook Marketplace), and ask for any missing info (never output tables).",
          "  2. **SA Multi-Bank Finance Auto-Apply**: Calculate exact NCA monthly instalments (SA Prime 11.25%, deposit, trade-in equity, balloon/residual 0-35%, 48/60/72m, R1,207.50 initiation, R69 admin), verify 5 FICA docs, and auto-submit dossiers to **WesBank, Absa Vehicle Finance, MFC (Nedbank), Standard Bank VAF & Capitec via Signio**.",
          "  3. **Follow-Up & Test-Drive Conversion**: Trigger 15-min Speed-to-Lead, 24h Test-Drive Hold, 48h FICA Chase, and 72h Price-Drop WhatsApp/Email cadences.",
          "  4. **Offer to Purchase (OTP) PDFs**, **TransUnion Trade-In Appraisals**, **Showroom TikTok Walkaround Reels**, and **Live Daytona Cloud Browser** portal actions.",
          "- Always note which specialist agent(s) under your HQ handled each sub-task so the dealer has full visibility.",
          subAgentsRoster,
        ]
          .filter(Boolean)
          .join("\n")
      } else if (targetDomain.isPublisher) {
        botSpecialization = [
          "=== SPECIALIST: VEHICLE LISTING & DATABASE AGENT ===",
          "- Keep adding and listing cars super simple and conversational. NEVER output Markdown tables or long templates.",
          "- When the user wants to add a car to the database or attaches car images/details:",
          "  1. Briefly confirm the car details and photos you already see.",
          "  2. Ask simply which places they want to add it to: Our Database & Website, Cars.co.za, AutoTrader SA, or Facebook Marketplace.",
          "  3. Ask only for the missing details needed (e.g. Make, Model, Year, Price in ZAR, Mileage in km, Colour, Transmission/Fuel, VIN).",
          "  4. Mention they can reply right here or click 'Fill Missing Info & Choose Places' below to type the missing details in the quick modal.",
        ].join("\n")
      } else if (targetDomain.isFinance) {
        botSpecialization = [
          "=== SPECIALIST: FINANCE & F&I AGENT (SA MULTI-BANK VAF AUTO-APPLIER) ===",
          "- You specialize in South African Vehicle & Asset Finance (VAF) regulated by the National Credit Act (NCA) and FAIS.",
          "- Calculate exact ZAR monthly instalments using Prime Rate (11.25% + margin), Deposit, Trade-In Equity, Balloon/Residual (0–35%), 48/60/72m term, NCR Initiation Fee (R1,207.50), and R69 monthly admin fee.",
          "- Always check NCA affordability (instalment vs gross income & living expenses), list the 5 mandatory FICA docs (SA Smart ID, Driver's Licence, 3M Stamped Bank Statements, 3M Payslips, Proof of Address), recommend VAPs (Extended Mechanical Warranty, Credit Shortfall, Tracker/Netstar, Scratch & Dent), and prepare simultaneous multi-bank submission across **WesBank, Absa Vehicle Finance, MFC (Nedbank), Standard Bank VAF & Capitec via Signio**.",
          "- Note that the user can click **'Auto-Apply to Selected Banks'** on the live SA Finance card right below your reply.",
        ].join("\n")
      } else if (targetDomain.isFollowUp) {
        botSpecialization = [
          "=== SPECIALIST: FOLLOW-UP & RETENTION AGENT (24H/48H/72H CAR BUYER CLOSER) ===",
          "- You convert hesitant South African car buyers via high-converting WhatsApp & Email cadences: 15-Min Speed-to-Lead, 24h Test-Drive Hold, 48h FICA & Finance Pre-Approval Nudge, 72h Price-Lock / Alternative Stock Alert, and 12-Month Trade-Up Equity Check-In.",
          "- Always include a ready-to-send WhatsApp message inside a blockquote (`> ...`) and mention the exact showroom vehicle & ZAR price or monthly instalment.",
        ].join("\n")
      } else if (targetDomain.isTradeIn) {
        botSpecialization = [
          "=== SPECIALIST: TRADE-IN & STOCK SOURCING AGENT (TRANSUNION & FLOORPLAN) ===",
          "- You appraise South African trade-ins using TransUnion / Mead & McGrouther trade vs retail bands, mileage & condition adjustments, and realistic recon deductions (DEKRA multi-point check, COR roadworthy, tyres, paint, missing FSH/spare keys).",
          "- You also monitor 45+ day aging floorplan cars (e.g. BMW X3, Chery Tiggo 7 Pro Max, Mercedes C200) and recommend price repricing, Cars.co.za/AutoTrader syndication boosts, or WeBuyCars/auction wholesale sourcing.",
        ].join("\n")
      } else if (targetDomain.isQuote) {
        botSpecialization = [
          "=== SPECIALIST: DEAL & QUOTE AGENT (OFFER TO PURCHASE & PRO-FORMA PDF) ===",
          "- You produce South African 15% VAT-compliant Vehicle Offers to Purchase (OTP) & Pro-Forma Tax Invoices in ZAR.",
          "- Include OTP Reference (e.g. `OTP-2026-2401`), Buyer Name, Vehicle Specs & VIN, a clean bulleted price breakdown covering Vehicle Excl. VAT, On-The-Road (eNaTIS Registration & DEKRA COR), Optional Extras, Subtotal, 15% SA VAT, Grand Total, Reservation Deposit link (`/pay/{dealId}`), and note the interactive **Download PDF** card below. Never output Markdown tables.",
        ].join("\n")
      } else if (targetDomain.isWhatsApp) {
        botSpecialization = [
          "=== SPECIALIST: WHATSAPP SALES AGENT (LIVE WHAPI +27 63 199 5124) ===",
          "- You are connected to live showroom WhatsApp (+27 63 199 5124, Channel ANTMAN-ZPBZZ). Qualify buyers, share showroom stock & monthly ZAR instalments, book test drives, collect the 5 SA FICA documents via WhatsApp, and draft crisp WhatsApp replies in blockquotes (`> ...`).",
        ].join("\n")
      } else if (targetDomain.isSocial) {
        botSpecialization = [
          "=== SPECIALIST: SHOWROOM SOCIAL AGENT (TIKTOK WALKAROUNDS & META VEHICLE ADS) ===",
          "- You manage `@autopulsemotors_za` TikTok & Instagram showroom content. Write punchy 30-second South African car walkaround scripts (hook, interior/spec shots, monthly ZAR instalment CTA, WhatsApp link), answer 'How much per month?' DMs, and optimize Meta/TikTok Vehicle Inventory Ads.",
        ].join("\n")
      } else if (targetDomain.isEmail) {
        botSpecialization = [
          "=== SPECIALIST: EMAIL & PORTAL LEADS AGENT (CARS.CO.ZA / AUTOTRADER INBOX & BANKS) ===",
          "- You triage connected Gmail/Outlook inboxes for inbound Cars.co.za & AutoTrader SA lead emails and WesBank/Absa/MFC finance approval correspondence, drafting ready-to-send replies immediately.",
        ].join("\n")
      } else {
        botSpecialization = [
          `=== SPECIALIST: ${targetBot.name.toUpperCase()} (CUSTOM DEALERSHIP AGENT UNDER AUTOPULSE HQ) ===`,
          `- You operate independently in your own workspace AND report under AutoPulse Dealership HQ.`,
          targetBot.skills?.length
            ? `- Equipped Skills: ${targetBot.skills.join(", ")}`
            : "",
          "- Focus exclusively on South African new & used car dealership operations in ZAR.",
        ]
          .filter(Boolean)
          .join("\n")
      }

      const systemPrompt = [
        `You are ${targetBot.name}, an autonomous South African Car Dealership AI teammate with role: ${targetBot.job}.`,
        targetBot.instructions ? `Playbook Instructions: ${targetBot.instructions}` : "",
        botSpecialization,
        `\n=== LIVE SOUTH AFRICAN SHOWROOM INVENTORY (ZAR) ===\n${showroomSummary}`,
        `\n=== ACTIVE SA VEHICLE FINANCE APPLICATIONS ===\n${financeSummary}`,
        leadsSummary ? `\n=== RECENT BUYER LEADS & PORTAL INQUIRIES ===\n${leadsSummary}` : "",
        liveInboxSummary ? `\n${liveInboxSummary}` : "",
        customSkillsSummary ? `\n${customSkillsSummary}` : "",
        systemContextBlock ? `\n${systemContextBlock}` : "",
        `\nGENERAL DEALERSHIP RULES (MANDATORY):`,
        `- Market: South Africa (Currency: South African Rand ZAR / R, 15% VAT, eNaTIS, DEKRA/COR roadworthy, FICA, NCA, WesBank/Absa/MFC/Standard Bank/Capitec, Cars.co.za, AutoTrader SA).`,
        `- NEVER talk about selling spare auto parts or workshops — we are a New & Used Car Dealership selling vehicles.`,
        `- NEVER output filler/holding phrases like 'Hold on while I fetch...'. Deliver the complete, actionable dealership output immediately in one shot.`,
        `- When the user attaches documents (PDFs, Word .docx, CSV stock lists, FICA payslips/IDs) or images (car photos, NaTIS discs), explicitly acknowledge and use the exact extracted figures, VINs, SA ID numbers, rows, or visual details from the ATTACHED DOCUMENTS & IMAGES section above.`,
        `- NEVER output Markdown tables (no | col | col | pipe tables) in chat responses. Keep replies simple, clean, and conversational with short sentences or plain bullet points.`,
        `- When the user asks to add a car to our databases/website/portals (or attaches car photos + info), keep it simple: confirm what info/photos you received, ask which places they want to add it to (Our Database & Website, Cars.co.za, AutoTrader SA, Facebook Marketplace), and ask for any missing details (price, mileage, year, make/model, colour, VIN). Let them know they can reply in chat or click 'Fill Missing Info & Choose Places' below.`,
        `- Put ready-to-send WhatsApp or Email messages inside clean blockquotes (> ...).`,
      ]
        .filter(Boolean)
        .join("\n")

      const conversationHistory = [
        { role: "system" as const, content: systemPrompt },
        ...messages.slice(-8).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.text,
        })),
        { role: "user" as const, content: promptTextWithAttachmentContext },
      ]

      void runner.startTurn({
        chatId,
        bot: { id: targetBot.id, name: targetBot.name },
        conversationHistory,
        onSaveReply: async (accumulated) => {
          if (accumulated.trim()) {
            await saveReplyMut({
              chatId: chatId as Id<"teammate_chats">,
              text: accumulated.trim(),
              botId: targetBot.id as Id<"teammate_bots">,
            })
          }
        },
      })
    } catch (err: unknown) {
      toast.add({
        type: "error",
        title: "Could not send message",
        description: err instanceof Error ? err.message : "Error sending message",
      })
    }
  }

  useEffect(() => {
    if (
      initialPrompt &&
      !initialPromptSent &&
      !isWorking &&
      data &&
      messages.length <= 1
    ) {
      setInitialPromptSent(true)
      void handleSubmit({ text: initialPrompt, files: [] })
    }
  }, [initialPrompt, initialPromptSent, isWorking, data, messages.length])

  return (
    <div data-slot="chat" className="flex min-h-0 flex-1 flex-col">
      {/* Unified Master Agent Sub-Agent Routing Ribbon (Grok-Style Under-One-Agent Command) */}
      {isPrimaryMaster && subAgents.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-2 no-scrollbar">
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400 mr-1">
            <CrownIcon className="size-3" />
            Under HQ ({subAgents.length}):
          </span>
          <button
            type="button"
            onClick={() => setSelectedBotId(activeBots[0].id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer",
              currentBot?.id === activeBots[0].id
                ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            )}
          >
            <SparklesIcon className="size-3 text-sky-400" />
            All Skills (Master HQ)
          </button>
          {subAgents.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedBotId(sub.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer",
                currentBot?.id === sub.id
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              )}
            >
              <ChatAvatar seed={sub.avatar} className="size-3.5" />
              <span>{sub.name}</span>
            </button>
          ))}
        </div>
      )}

      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.map((message, index) => {
            const author =
              message.role === "assistant" && message.botId
                ? botMap.get(message.botId)
                : undefined

            const addressee =
              message.role === "user" && message.targetBotId
                ? botMap.get(message.targetBotId)
                : undefined

            const previousUserMessage =
              message.role === "assistant"
                ? messages
                    .slice(0, index)
                    .reverse()
                    .find((m) => m.role === "user")?.text ?? ""
                : ""

            const quoteData =
              message.role === "assistant"
                ? parseQuoteFromText(message.text)
                : null
            const showCarIntakeButton =
              message.role === "assistant" &&
              isCarAddIntakeMessage(message.text, previousUserMessage)
            const financeAction =
              message.role === "assistant"
                ? parseFinanceIntentFromText(message.text, showroomInventory)
                : null
            const followUpAction =
              message.role === "assistant" && !financeAction && !showCarIntakeButton
                ? parseFollowUpIntentFromText(message.text, showroomInventory)
                : null

            return (
              <Message
                key={message.id}
                from={message.role}
                className={
                  author
                    ? "group relative flex-row items-start gap-3"
                    : "group relative"
                }
              >
                {author && (
                  <ChatAvatar seed={author.avatar} className="size-8 shrink-0" />
                )}
                <MessageContent>
                  {author && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                      <span>{author.name}</span>
                      {author.isMaster && (
                        <span className="rounded bg-sky-500/15 px-1.5 py-0.2 text-[9px] text-sky-300 border border-sky-500/25">
                          Master HQ
                        </span>
                      )}
                    </div>
                  )}
                  {addressee && (
                    <div className="mb-1.5">
                      <Badge
                        variant="outline"
                        className="mr-1.5 max-w-48 pl-1 align-top cursor-default"
                      >
                        <ChatAvatar seed={addressee.avatar} className="size-3.5" />
                        <span className="truncate">{addressee.name}</span>
                      </Badge>
                    </div>
                  )}
                  <MessageResponse>{message.text}</MessageResponse>

                  {/* Simple trigger to fill missing car details & pick target places */}
                  {showCarIntakeButton && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const recentContext = messages
                            .slice(Math.max(0, index - 4), index + 1)
                            .map((m) => m.text)
                            .join("\n")
                          setCarIntakeDraft(
                            extractCarDraftFromConversation(recentContext)
                          )
                          setCarIntakeModalOpen(true)
                        }}
                        className="h-8 gap-1.5 border-sky-500/35 bg-sky-500/10 text-xs font-medium text-sky-200 hover:bg-sky-500/20 cursor-pointer"
                      >
                        <CarFrontIcon className="size-3.5 text-sky-400" />
                        Fill Missing Info &amp; Choose Places
                      </Button>
                    </div>
                  )}
                  {financeAction && <ChatFinanceCard action={financeAction} />}
                  {followUpAction && <ChatFollowUpCard action={followUpAction} />}
                  {quoteData && <ChatQuoteCard quote={quoteData} />}
                </MessageContent>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(message.id)}
                  title="Delete message"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-red-400 cursor-pointer self-start ml-auto shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Message>
            )
          })}

          {/* Live Streaming Message */}
          {isWorking && (
            <Message from="assistant" className="flex-row items-start gap-3">
              <ChatAvatar
                seed={currentBot?.avatar ?? "default"}
                className="size-8 shrink-0"
              />
              <MessageContent>
                {currentRun.streamingText ? (
                  <MessageResponse>{currentRun.streamingText}</MessageResponse>
                ) : (
                  <div className="space-y-2 py-1 select-none">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-zinc-400">
                        {currentBot?.name ?? "Dealership Agent"} is working...
                      </span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <Skeleton className="h-3.5 w-4/5 bg-zinc-800/80" />
                      <Skeleton className="h-3.5 w-3/5 bg-zinc-800/60" />
                    </div>
                  </div>
                )}
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl p-4 pt-0">
        <PromptInput onSubmit={handleSubmit} multiple globalDrop>
          <PromptInputAttachmentTray
            parsedMap={parsedAttachmentsMap}
            setParsedMap={setParsedAttachmentsMap}
          />
          <PromptInputTextarea
            placeholder={
              currentDomain.isMaster
                ? "Command AutoPulse HQ or drop PDFs, FICA docs, CSV stock sheets & car photos (Drag & Drop or Ctrl+V)..."
                : `Ask ${currentBot?.name ?? "agent"} or attach PDFs, DOCX, CSV & car photos...`
            }
          />
          <PromptInputFooter>
            <PromptInputTools className="flex-wrap">
              <PromptInputAttachMenuButton />
              {currentBot && selectableBots.length > 1 && (
                <PromptInputSelect
                  value={currentBot.id}
                  onValueChange={(val) => setSelectedBotId(val as string)}
                >
                  <PromptInputSelectTrigger
                    aria-label="Specialist to talk to"
                    className="cursor-pointer"
                  >
                    <PromptInputSelectValue>
                      <ChatAvatar seed={currentBot.avatar} className="size-5" />
                      {currentBot.name}
                    </PromptInputSelectValue>
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {selectableBots.map((bot) => (
                      <PromptInputSelectItem
                        key={bot.id}
                        value={bot.id}
                        className="cursor-pointer"
                      >
                        <ChatAvatar seed={bot.avatar} className="size-5" />
                        {bot.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              )}

              {desktop && (currentDomain.isFinance || currentDomain.hasSkill("finance_auto_apply")) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    desktop.setOpen(true)
                    desktop.setActiveTab("actions")
                    desktop.setActionSubView("finance")
                  }}
                  className="h-8 gap-1.5 border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <LandmarkIcon className="size-3.5" />
                  Finance VAF
                </Button>
              )}

              {desktop && (currentDomain.isFollowUp || currentDomain.isWhatsApp || currentDomain.isMaster) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    desktop.setOpen(true)
                    desktop.setActiveTab("actions")
                    desktop.setActionSubView("followups")
                  }}
                  className="h-8 gap-1.5 border border-amber-500/25 bg-amber-500/10 px-2.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                >
                  <ClockIcon className="size-3.5" />
                  Follow-Ups
                </Button>
              )}

              {desktop && (currentDomain.isTradeIn || currentDomain.hasSkill("trade_in_valuation")) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    desktop.setOpen(true)
                    desktop.setActiveTab("actions")
                    desktop.setActionSubView("tradein")
                  }}
                  className="h-8 gap-1.5 border border-orange-500/25 bg-orange-500/10 px-2.5 text-xs font-medium text-orange-300 hover:bg-orange-500/20 cursor-pointer"
                >
                  <CalculatorIcon className="size-3.5" />
                  Trade-In
                </Button>
              )}

              {desktop?.openQuoteModal && (currentDomain.isQuote || currentDomain.isMaster) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    desktop.setActiveTab?.("actions")
                    desktop.openQuoteModal?.()
                  }}
                  className="h-8 gap-1.5 border border-violet-500/20 bg-violet-500/5 px-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/15 cursor-pointer"
                >
                  <FileTextIcon className="size-3.5" />
                  OTP PDF
                </Button>
              )}

              {desktop?.openGmailModal && (currentDomain.isEmail || currentDomain.isMaster) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => desktop.openGmailModal?.()}
                  className={
                    desktop.isGmailActive
                      ? "h-8 gap-1.5 border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 cursor-pointer"
                      : "h-8 gap-1.5 border border-zinc-800 bg-zinc-900/60 px-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                  }
                >
                  {desktop.isGmailActive ? (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span className="max-w-32 truncate">
                        {desktop.gmailAccountLabel
                          ? formatGoogleAccountLabel(desktop.gmailAccountLabel)
                          : "Gmail"}
                      </span>
                    </>
                  ) : (
                    <>
                      <MailIcon className="size-3.5" />
                      Gmail
                    </>
                  )}
                </Button>
              )}

              {desktop && currentDomain.isSocial && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    desktop.setOpen(true)
                    desktop.setActiveTab("actions")
                    desktop.setActionSubView("socialdms")
                  }}
                  className="h-8 gap-1.5 border border-pink-500/20 bg-pink-500/5 px-2.5 text-xs font-medium text-pink-300 hover:bg-pink-500/15 cursor-pointer"
                >
                  <MegaphoneIcon className="size-3.5" />
                  TikTok Reels
                </Button>
              )}
            </PromptInputTools>
            <PromptInputSubmit
              status={isWorking ? "streaming" : "ready"}
              onStop={handleStop}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
      <ChatCarIntakeModal
        open={carIntakeModalOpen}
        onOpenChange={setCarIntakeModalOpen}
        initialDraft={carIntakeDraft}
        initialImageUrl={lastUploadedImageUrl}
        onSaved={async ({ stockNumber, title, priceZar, places }) => {
          const replyBotId = (currentBot?.id ?? activeBots[0]?.id) as
            | Id<"teammate_bots">
            | undefined
          if (!replyBotId) return
          await saveReplyMut({
            chatId: chatId as Id<"teammate_chats">,
            botId: replyBotId,
            text: `Done! **${title}** (${formatZar(priceZar)}, Stock #${stockNumber}) has been added to: ${places.join(", ")}.`,
          }).catch(() => null)
        }}
      />
    </div>
  )
}
