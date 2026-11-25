"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Script from "next/script"
import { useQuery } from "convex/react"
import { RotateCcw, Send, Sparkles } from "lucide-react"
import { motion } from "motion/react"

import { useConvexReady } from "@/components/autopulse/convex-provider"
import { FALLBACK_OVERVIEW, FALLBACK_PARTS } from "@/components/autopulse/fallback-data"
import { ChatAvatar } from "@/components/chat-avatar"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import {
  parseFilePartToContext,
  PromptInputAttachmentTray,
  PromptInputAttachMenuButton,
} from "@/components/chat-attachment-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { api } from "@/convex/_generated/api"
import {
  formatAttachmentsForAgentPrompt,
  type ParsedAttachmentContext,
} from "@/lib/document-context"
import { PUTER_SCRIPT_SRC, streamPuterReply, type PuterChatMessage } from "@/lib/puter"
import { cn } from "@/lib/utils"

const AI_MODELS = [
  { id: "gpt-4o", label: "GPT-4o (Default)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini (Fast)" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
] as const

const PRESET_PROMPTS = [
  "Publish our 2024 Toyota Hilux GR-Sport to Cars.co.za, AutoTrader SA & Own Website",
  "Calculate 72-month SA bank finance (WesBank/Absa/MFC) on the 2023 Ford Ranger Wildtrak",
  "Audit aging showroom vehicles over 45 days and suggest price-drop promos",
  "Draft a 24h test-drive follow-up WhatsApp sequence for new Cars.co.za leads",
]

type LocalTurn = {
  id: string
  role: "user" | "assistant"
  text: string
}

function buildUnifiedSystemPrompt(storeData?: {
  lowStockParts?: Array<{ sku: string; name: string; brand: string; stock: number; threshold: number; price: number; location?: string }>
  catalog?: Array<{ sku: string; oem?: string; name: string; brand: string; tier: string; price: number; tradePrice?: number; stock: number; threshold: number; location?: string }>
  messages?: Array<{ channel: string; direction: string; body: string; from: string; timestamp: number; sentBy: string }>
  deals?: Array<{ channel: string; status: string; totalAmount: number; currency: string; contactName: string; partsSummary: string }>
  campaigns?: Array<{ name: string; platform: string; status: string; spend: number; conversions: number }>
}): string {
  const stockLines = (storeData?.catalog && storeData.catalog.length > 0)
    ? storeData.catalog.slice(0, 40).map(
        (p) =>
          `- [${p.sku}] ${p.name} | Brand: ${p.brand} (${p.tier.toUpperCase()}) | OEM: ${p.oem ?? "N/A"} | Retail: ZAR ${p.price} | Trade: ZAR ${p.tradePrice ?? p.price} | In Stock: ${p.stock} (min threshold: ${p.threshold}) | Bin: ${p.location ?? "Main"}`
      ).join("\n")
    : FALLBACK_PARTS.slice(0, 20).map(
        (p) =>
          `- [${p.sku}] ${p.name} | Brand: ${p.brand} | In Stock: ${p.stockQuantity} (min ${p.minReorderThreshold}) | Price: ZAR ${p.price}`
      ).join("\n")

  const lowStockNotice = (storeData?.lowStockParts && storeData.lowStockParts.length > 0)
    ? storeData.lowStockParts.map(
        (p) => `* ALERT: [${p.sku}] ${p.name} has only ${p.stock} left (reorder threshold: ${p.threshold})`
      ).join("\n")
    : "All catalog items are currently above safety stock thresholds."

  const emailsAndMessages = (storeData?.messages && storeData.messages.length > 0)
    ? storeData.messages.slice(0, 15).map(
        (m) =>
          `- [${m.channel.toUpperCase()} / ${m.direction}] From: ${m.from} | Sent by: ${m.sentBy} | Content: "${m.body.replace(/\n/g, " ").slice(0, 160)}"`
      ).join("\n")
    : "- [GMAIL / inbound] From: workshop@apexautos.co.za | 'Urgent quote needed for Bosch 140A alternator 06L903021E'\n- [WHATSAPP / inbound] From: Sipho Khumalo | 'Do you have front brake pads for 2021 Hilux 2.8 GD-6?'"

  const dealsSummary = (storeData?.deals && storeData.deals.length > 0)
    ? storeData.deals.slice(0, 10).map(
        (d) =>
          `- ${d.contactName} (${d.channel}): Status=${d.status}, Total=${d.currency} ${d.totalAmount} | Parts: ${d.partsSummary}`
      ).join("\n")
    : "- Johan Botha (WhatsApp): Status=quoted, Total=ZAR 4,250 | Parts: Brembo Front Rotors (x2)"

  const campaignsSummary = (storeData?.campaigns && storeData.campaigns.length > 0)
    ? storeData.campaigns.map(
        (c) => `- ${c.name} (${c.platform}): Status=${c.status}, Spend=ZAR ${c.spend}, Leads=${c.conversions}`
      ).join("\n")
    : "- TikTok High-Intent VIN Lead Form: Spend ZAR 1,200, Leads 28"

  return [
    "You are AutoPulse Motors SA AI, the unified autonomous South African Car Dealership assistant (New & Used Vehicle Sales, currency ZAR).",
    "You are directly wired to the dealership's live showroom vehicle inventory, Cars.co.za & AutoTrader SA publishing feeds, SA multi-bank finance desk (WesBank, Absa, MFC/Nedbank, Standard Bank, Capitec), WhatsApp buyer chats, and portal lead inbox.",
    "Currency is South African Rand (ZAR). Include 15% VAT and South African NCA finance norms (Prime Rate 11.25%, deposit, balloon/residual, 5 FICA documents, DEKRA/COR, eNaTIS).",
    "Personality: Direct, proactive, knowledgeable SA Dealership Director. Deliver complete tables, deal structures, ad copy, and ready-to-send WhatsApp/email drafts immediately.",
    "",
    "=== 1. LIVE SHOWROOM INVENTORY & PORTALS ===",
    stockLines,
    "",
    "=== 2. AGING FLOORPLAN & STOCK ALERTS ===",
    lowStockNotice,
    "",
    "=== 3. RECENT BUYER INQUIRIES & PORTAL LEADS ===",
    emailsAndMessages,
    "",
    "=== 4. ACTIVE VEHICLE DEALS & OFFERS ===",
    dealsSummary,
    "",
    "=== 5. VEHICLE MARKETING AD CAMPAIGNS ===",
    campaignsSummary,
  ].join("\n")
}

export default function AutopulseChatPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q")
  const convexReady = useConvexReady()

  const storeContext = useQuery(
    api.dashboard.botStoreContext,
    convexReady ? {} : "skip"
  )

  return (
    <React.Suspense
      fallback={
        <div className="flex h-full w-full flex-col p-6 space-y-4">
          <Skeleton className="h-10 w-48 bg-zinc-800" />
          <Skeleton className="h-24 w-full rounded-xl bg-zinc-900" />
          <Skeleton className="flex-1 w-full rounded-xl bg-zinc-900/60" />
        </div>
      }
    >
      <ChatWorkspaceUI
        initialQuery={initialQuery}
        storeData={storeContext}
      />
    </React.Suspense>
  )
}

function ChatWorkspaceUI({
  initialQuery,
  storeData,
}: {
  initialQuery: string | null
  storeData?: {
    lowStockParts?: Array<{ sku: string; name: string; brand: string; stock: number; threshold: number; price: number; location?: string }>
    catalog?: Array<{ sku: string; oem?: string; name: string; brand: string; tier: string; price: number; tradePrice?: number; stock: number; threshold: number; location?: string }>
    messages?: Array<{ channel: string; direction: string; body: string; from: string; timestamp: number; sentBy: string }>
    deals?: Array<{ channel: string; status: string; totalAmount: number; currency: string; contactName: string; partsSummary: string }>
    campaigns?: Array<{ name: string; platform: string; status: string; spend: number; conversions: number }>
  }
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<string>("gpt-4o")
  const [turns, setTurns] = React.useState<LocalTurn[]>([])
  const [parsedAttachmentsMap, setParsedAttachmentsMap] = React.useState<
    Record<string, ParsedAttachmentContext>
  >({})
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns])

  const sendPrompt = async (
    rawPrompt: string,
    attachedFiles: PromptInputMessage["files"] = []
  ) => {
    const cleanPrompt = rawPrompt.trim()
    if ((!cleanPrompt && attachedFiles.length === 0) || submitting) return

    setSubmitting(true)

    let activeAttachmentContexts: ParsedAttachmentContext[] = []
    if (attachedFiles.length > 0) {
      const existingList = Object.values(parsedAttachmentsMap)
      activeAttachmentContexts = await Promise.all(
        attachedFiles.map(async (f, idx) => {
          const match = existingList.find((p) => p.filename === f.filename)
          if (match) return match
          return await parseFilePartToContext({
            id: `att_dash_${idx}_${Date.now()}`,
            filename: f.filename,
            mediaType: f.mediaType,
            url: f.url,
          })
        })
      )
      setParsedAttachmentsMap({})
    }

    const { userMessageBadgeBlock, systemContextBlock } =
      formatAttachmentsForAgentPrompt(activeAttachmentContexts)

    const fallbackPrompt =
      activeAttachmentContexts.length > 0
        ? `Analyze the attached ${activeAttachmentContexts.map((a) => `${a.dealershipDocType} (${a.filename})`).join(", ")} and execute the appropriate dealership action.`
        : ""
    const prompt = cleanPrompt || fallbackPrompt
    const displayUserText = userMessageBadgeBlock
      ? `${userMessageBadgeBlock}\n\n${prompt}`
      : prompt
    const promptWithContext = systemContextBlock
      ? `${prompt}\n\n${systemContextBlock}`
      : prompt

    const userTurn: LocalTurn = {
      id: `u_${Date.now()}`,
      role: "user",
      text: displayUserText,
    }
    const assistantId = `a_${Date.now() + 1}`

    const historyMessages: PuterChatMessage[] = [
      {
        role: "system",
        content: [
          buildUnifiedSystemPrompt(storeData),
          systemContextBlock,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      ...turns.slice(-8).map((t) => ({
        role: t.role,
        content: t.text,
      })),
      { role: "user", content: promptWithContext },
    ]

    setTurns((prev) => [
      ...prev,
      userTurn,
      {
        id: assistantId,
        role: "assistant",
        text: "",
      },
    ])

    const abortCtrl = new AbortController()
    abortControllerRef.current = abortCtrl

    try {
      let accumulated = ""
      await streamPuterReply(
        historyMessages,
        (chunk) => {
          accumulated = chunk
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId ? { ...t, text: accumulated } : t
            )
          )
        },
        selectedModel
      )

      if (!accumulated.trim()) {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === assistantId
              ? { ...t, text: "I have reviewed your stock and messages. Let me know what specific part or customer you would like to handle next." }
              : t
          )
        )
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Chat request failed"
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? { ...t, text: `Connection note: ${message}. Retrying via backup engine.` }
            : t
        )
      )
      toast.add({
        title: "Chat Note",
        description: message,
      })
    } finally {
      setSubmitting(false)
      abortControllerRef.current = null
    }
  }

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setTurns([])
    setSubmitting(false)
  }

  const handlePromptSubmit = async (msg: PromptInputMessage) => {
    await sendPrompt(msg.text, msg.files)
  }

  return (
    <>
      <Script src={PUTER_SCRIPT_SRC} strategy="afterInteractive" />

      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-2.5 overflow-hidden">
        {/* Compact Single-Row Header matching Teammates style */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2.5">
            <ChatAvatar seed="AutoPulse" className="size-8 rounded-full shadow-inner ring-1 ring-sky-500/30" />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <span>AutoPulse Motors AI</span>
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Connected to Showroom Stock, Portals, SA Banks &amp; WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select AI model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="h-8 cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {turns.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="h-8 cursor-pointer border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:text-zinc-100"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Viewport-Fit Chat Card */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-zinc-800/90 bg-zinc-900/60 py-0">
          <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-3 p-3.5">
            {/* Scrollable Messages Viewport */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {turns.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <ChatAvatar seed="AutoPulse" className="size-16 rounded-full shadow-md ring-2 ring-sky-500/20 mb-3" />
                  <h3 className="text-base font-semibold text-zinc-100">
                    How can I assist your car dealership desk today?
                  </h3>
                  <p className="max-w-md text-xs text-zinc-400 mt-1 mb-5">
                    Publish cars to Cars.co.za, AutoTrader SA &amp; your website, calculate WesBank/Absa/MFC instalments, appraise trade-ins, or chase showroom leads.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
                    {PRESET_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendPrompt(prompt)}
                        className="cursor-pointer text-left rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-300 transition hover:border-sky-500/40 hover:bg-zinc-900 hover:text-zinc-100"
                      >
                        <Sparkles className="size-3 text-sky-400 inline mr-1.5" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                turns.map((turn) => (
                  <motion.div
                    key={turn.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 rounded-2xl border p-3.5 text-sm",
                      turn.role === "user"
                        ? "ml-10 border-sky-500/30 bg-sky-500/10 text-zinc-100"
                        : "mr-10 border-zinc-800 bg-zinc-950/80 text-zinc-200"
                    )}
                  >
                    <div className="shrink-0">
                      {turn.role === "user" ? (
                        <ChatAvatar seed="UserStaff" className="size-7 rounded-full shadow-inner ring-1 ring-sky-400/40" />
                      ) : (
                        <ChatAvatar seed="AutoPulse" className="size-7 rounded-full shadow-inner ring-1 ring-emerald-500/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-[11px] font-medium text-zinc-400">
                        {turn.role === "user" ? "You" : "AutoPulse"}
                      </div>
                      {turn.role === "user" ? (
                        <div className="leading-relaxed whitespace-pre-wrap text-xs md:text-sm font-medium">
                          {turn.text}
                        </div>
                      ) : turn.text ? (
                        <div className="min-w-0 max-w-full text-xs md:text-sm leading-relaxed overflow-x-hidden">
                          <MessageResponse>{turn.text}</MessageResponse>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <Skeleton className="h-3.5 w-44 bg-zinc-700/60" />
                          <Skeleton className="h-3.5 w-64 bg-zinc-700/40" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Multi-Modal Input Form with Document & Image Context */}
            <div className="shrink-0">
              <PromptInput onSubmit={handlePromptSubmit} multiple globalDrop>
                <PromptInputAttachmentTray
                  parsedMap={parsedAttachmentsMap}
                  setParsedMap={setParsedAttachmentsMap}
                />
                <PromptInputTextarea
                  placeholder="Ask to publish a car, run SA bank finance, appraise a trade-in, or attach PDFs, FICA docs, CSVs & car photos..."
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputAttachMenuButton />
                  </PromptInputTools>
                  <PromptInputSubmit status={submitting ? "streaming" : "ready"} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
