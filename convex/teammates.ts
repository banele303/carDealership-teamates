import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireStaff } from "./lib/auth"
import { writeLog } from "./logs"

export const listWorkspace = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)

    const bots = await ctx.db
      .query("teammate_bots")
      .order("desc")
      .collect()

    const rawChats = await ctx.db
      .query("teammate_chats")
      .order("desc")
      .collect()

    const masterBot =
      bots.find((b) => b.isMaster) ??
      bots.find(
        (b) =>
          b.name.toLowerCase().includes("dealership hq") ||
          b.name.toLowerCase().includes("ops ai")
      )

    const botMap = new Map(bots.map((b) => [b._id, b]))

    const chats = rawChats
      .map((chat) => {
        const activeBotList = chat.botIds
          .map((id) => botMap.get(id))
          .filter((b): b is NonNullable<typeof b> => Boolean(b))

        const chatBots = activeBotList.map((b) => ({
          id: b._id,
          name: b.name,
          avatar: b.avatar,
          job: b.job,
          isMaster: Boolean(b.isMaster),
          parentBotId: b.parentBotId,
          skills: b.skills ?? [],
          category: b.category ?? "custom",
        }))

        if (chatBots.length === 0) return null

        return {
          id: chat._id,
          kind: chat.kind,
          name: chat.name ?? chatBots[0]?.name ?? "Chat",
          bots: chatBots,
          isMasterChat: chat.kind === "direct" && Boolean(chatBots[0]?.isMaster),
          parentBotId: chat.kind === "direct" ? chatBots[0]?.parentBotId : undefined,
          category: chat.kind === "direct" ? chatBots[0]?.category : "team",
          skills: chat.kind === "direct" ? chatBots[0]?.skills ?? [] : [],
          lastMessagePreview: chat.lastMessagePreview,
          lastMessageAt: chat.lastMessageAt,
          createdAt: chat.createdAt,
        }
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))

    return {
      masterBotId: masterBot?._id ?? null,
      bots: bots.map((b) => ({
        id: b._id,
        name: b.name,
        avatar: b.avatar,
        job: b.job,
        instructions: b.instructions,
        parentBotId: b.parentBotId,
        isMaster: Boolean(b.isMaster),
        skills: b.skills ?? [],
        category: b.category ?? "custom",
      })),
      chats,
    }
  },
})

export const getChat = query({
  args: {
    chatId: v.id("teammate_chats"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    const allBots = await ctx.db.query("teammate_bots").collect()
    let chat = await ctx.db.get(args.chatId)
    if (!chat) {
      // Seamlessly fall back to Master Dealership HQ chat if browser tab is on an old pruned chatId
      const masterBot =
        allBots.find((b) => b.isMaster) ??
        allBots.find((b) => b.name.toLowerCase().includes("dealership hq"))
      const allChats = await ctx.db.query("teammate_chats").order("desc").collect()
      chat =
        (masterBot
          ? allChats.find(
              (c) => c.kind === "direct" && c.botIds.includes(masterBot._id)
            )
          : undefined) ??
        allChats.find((c) => c.kind === "direct") ??
        allChats[0] ??
        null
    }
    if (!chat) return null

    const botMap = new Map(allBots.map((b) => [b._id, b]))

    const activeBotList = chat.botIds
      .map((id) => botMap.get(id))
      .filter((b): b is NonNullable<typeof b> => Boolean(b))

    const chatBots = activeBotList.map((b) => ({
      id: b._id,
      name: b.name,
      avatar: b.avatar,
      job: b.job,
      instructions: b.instructions,
      parentBotId: b.parentBotId,
      isMaster: Boolean(b.isMaster),
      skills: b.skills ?? [],
      category: b.category ?? "custom",
    }))

    const rawMessages = await ctx.db
      .query("teammate_messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
      .order("asc")
      .collect()

    const messages = rawMessages.map((m) => ({
      id: m._id,
      role: m.role,
      text: m.text,
      botId: m.botId,
      targetBotId: m.targetBotId,
      createdAt: m.createdAt,
    }))

    const primaryBot = chatBots[0]
    const subAgents = primaryBot?.isMaster
      ? allBots
          .filter((b) => b._id !== primaryBot.id)
          .map((b) => ({
            id: b._id,
            name: b.name,
            avatar: b.avatar,
            job: b.job,
            instructions: b.instructions,
            parentBotId: b.parentBotId,
            isMaster: Boolean(b.isMaster),
            skills: b.skills ?? [],
            category: b.category ?? "custom",
          }))
      : []

    return {
      chat: {
        id: chat._id,
        kind: chat.kind,
        name: chat.name ?? chatBots[0]?.name ?? "Chat",
        botIds: chat.botIds,
        lastMessagePreview: chat.lastMessagePreview,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
        bots: chatBots,
      },
      bots: chatBots,
      subAgents,
      allUserBots: allBots.map((b) => ({
        id: b._id,
        name: b.name,
        avatar: b.avatar,
        job: b.job,
        instructions: b.instructions,
        parentBotId: b.parentBotId,
        isMaster: Boolean(b.isMaster),
        skills: b.skills ?? [],
        category: b.category ?? "custom",
      })),
      messages,
    }
  },
})

// ---------------------------------------------------------------------------
// South African Car Dealership AI Teammates Fleet
// 1 Master Unified Grok-Style Orchestrator + 3 Core Independent Specialists
// (Only the exact agents requested by the user — no extra auto-added agents)
// ---------------------------------------------------------------------------

interface FleetBotSpec {
  name: string
  avatar: string
  job: string
  category: string
  isMaster?: boolean
  skills: string[]
  aliases: string[]
  instructions: string
  welcome: string
}

const FLEET_SPEC: FleetBotSpec[] = [
  {
    name: "AutoPulse Dealership HQ",
    avatar: "AutoPulseHQ",
    job: "Master Dealership AI Orchestrator & Unified Command (Grok-Style)",
    category: "orchestrator",
    isMaster: true,
    skills: [
      "multi_publish",
      "finance_auto_apply",
      "whatsapp_followup",
      "vehicle_quote_pdf",
      "trade_in_valuation",
      "test_drive_booking",
      "social_reel_studio",
      "email_triage",
      "cloud_desktop",
    ],
    aliases: [
      "autopulse dealership hq",
      "autopulse ops",
      "autopulse ops ai",
      "dealership hq",
      "master agent",
    ],
    instructions:
      "You are AutoPulse Dealership HQ, the unified Grok-style Master Car Dealership Director for South Africa (New & Used Vehicle Sales, currency ZAR). Every specialist agent — including any new custom agent the dealer adds — operates independently AND reports directly under your single command. You can execute multi-portal vehicle publishing (Cars.co.za, AutoTrader SA, Own Dealership Website /showroom, Facebook Marketplace), auto-apply South African vehicle finance applications (WesBank, Absa, MFC/Nedbank, Standard Bank, Capitec via Signio), launch 24h/48h/72h buyer follow-ups, generate SA VAT-compliant Offer to Purchase (OTP) PDFs, appraise trade-ins using TransUnion bands, and run cloud browser tasks.",
    welcome:
      "Welcome to **AutoPulse Dealership HQ** — your unified South African Car Dealership Super-Agent. All 3 core specialists (and any new agent you add) report under me.\n\nTell me what to execute right now:\n- **Publish a car** simultaneously to **Cars.co.za**, **AutoTrader SA**, and your **Own Website (`/showroom`)**\n- **Auto-apply vehicle finance** to **WesBank, Absa, MFC, Standard Bank & Capitec** with NCA instalment math\n- **Trigger 24h/48h/72h WhatsApp follow-ups**, book test drives, appraise trade-ins, or generate **Offer to Purchase PDFs**",
  },
  {
    name: "Portal Publisher Agent",
    avatar: "PortalSyncZA",
    job: "Multi-Portal Car Syndicator (Cars.co.za, AutoTrader SA & Own Site)",
    category: "publishing",
    skills: ["multi_publish", "cloud_desktop", "social_reel_studio"],
    aliases: ["portal publisher", "car publisher", "listing agent", "syndicator"],
    instructions:
      "You are Portal Publisher Agent, the dedicated South African Vehicle Listing & Multi-Portal Syndication Specialist. You take any showroom car (Stock #, VIN, Year/Make/Model/Variant, km, Colour, Transmission, FSH, DEKRA grade, Price ZAR) and publish it simultaneously to Cars.co.za (DAP XML Feed), AutoTrader South Africa (DMS XML), the dealership's Own Website (/showroom), and Facebook Marketplace. You write compelling, compliant South African vehicle ad copy highlighting full service history, balance of motorplan/warranty, DEKRA/AA verification, and estimated monthly finance in ZAR.",
    welcome:
      "Hi! I'm **Portal Publisher Agent**. Give me any stock number or vehicle details and I'll craft high-converting South African ad copy, verify VIN/NaTIS readiness, and multi-publish simultaneously to **Cars.co.za**, **AutoTrader SA**, your **Own Website (`/showroom`)**, and **Facebook Marketplace**.",
  },
  {
    name: "Finance & F&I Agent",
    avatar: "FinDeskZA",
    job: "SA Multi-Bank Vehicle Finance Auto-Applier (WesBank, Absa, MFC, StdBank)",
    category: "finance",
    skills: ["finance_auto_apply", "vehicle_quote_pdf", "whatsapp_followup"],
    aliases: ["finance agent", "f&i agent", "finance & f&i", "bank finance", "vaf"],
    instructions:
      "You are Finance & F&I Agent, South Africa's autonomous Vehicle & Asset Finance (VAF) & Multi-Bank Auto-Apply Specialist. You structure deals in ZAR using South African Prime Rate (11.25%), deposits, trade-in equity, balloon/residual values (0-35%), 48/60/72-month terms, NCR initiation fee (R1,207.50) and R69 monthly admin fee. You validate 13-digit SA ID numbers, check NCA affordability ratios, verify the 5 mandatory FICA documents (SA ID, Driver's Licence, 3M Bank Statements, 3M Payslips, Proof of Address), recommend Value-Added Products (Extended Warranty, Credit Shortfall, Tracker/Netstar, Scratch & Dent), and auto-submit dossiers simultaneously to WesBank, Absa Vehicle Finance, MFC (Nedbank), Standard Bank VAF, and Capitec via Signio.",
    welcome:
      "Hi! I'm **Finance & F&I Agent**. I calculate exact South African NCA instalments (deposit + balloon/residual), validate FICA documents, check affordability, and **auto-apply your buyer's finance dossier simultaneously to WesBank, Absa, MFC (Nedbank), Standard Bank & Capitec/Signio**.",
  },
  {
    name: "Follow-Up Agent",
    avatar: "CadenceCloser",
    job: "24h/48h/72h Buyer Follow-Up, WhatsApp Closer & Offer to Purchase PDF",
    category: "followup",
    skills: ["whatsapp_followup", "test_drive_booking", "vehicle_quote_pdf", "email_triage"],
    aliases: ["follow-up agent", "followup agent", "retention agent", "lead chaser"],
    instructions:
      "You are Follow-Up Agent, the relentless yet warm South African Car Dealership Retention, WhatsApp (+27 63 199 5124) & Email Conversion Closer. You execute 15-minute Speed-to-Lead WhatsApp responses for Cars.co.za/AutoTrader inquiries, 24h Test-Drive reminders, 48h Finance & FICA document chases, 72h Price-Drop or alternative showroom stock nudges, and generate formal South African Offer to Purchase (OTP) PDFs. Every follow-up includes a ready-to-dispatch WhatsApp blockquote (> ...) and clear call-to-action to book a test drive or submit finance.",
    welcome:
      "Hi! I'm **Follow-Up Agent**. No car buyer slips through the cracks on my watch. I run **15-min speed-to-lead**, **24h test-drive confirmations**, **48h FICA/finance chases**, **72h cold-lead revivals**, and **Offer to Purchase PDFs** via WhatsApp (+27 63 199 5124) & Email.",
  },
]

const LEGACY_BLOAT_BOT_NAMES = new Set([
  "quote agent",
  "deal & quote agent",
  "quotecraft",
  "titktok  agent",
  "tiktok agent",
  "social media",
  "showroom social agent",
  "omnipulse",
  "supply hunter agent",
  "trade-in & stock agent",
  "supplyhunter",
  "emails agent",
  "email & leads agent",
  "aerocomm",
  "whatsapp sales agent",
  "autofame",
])

export const ensureWorkspaceFleet = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireStaff(ctx)
    const existingBots = await ctx.db.query("teammate_bots").collect()
    const now = Date.now()

    const results = []
    let masterBotId: Id<"teammate_bots"> | undefined

    // Pass 1: Ensure Master Agent exists first so all specialists can link under it
    const masterSpec = FLEET_SPEC.find((s) => s.isMaster)!
    const existingMaster = existingBots.find(
      (b) =>
        b.isMaster ||
        b.name.toLowerCase() === masterSpec.name.toLowerCase() ||
        masterSpec.aliases.some(
          (alias) =>
            b.name.toLowerCase().includes(alias) ||
            b.job.toLowerCase().includes(alias)
        )
    )

    if (existingMaster) {
      masterBotId = existingMaster._id
      await ctx.db.patch(existingMaster._id, {
        name: masterSpec.name,
        avatar: masterSpec.avatar,
        job: masterSpec.job,
        instructions: masterSpec.instructions,
        isMaster: true,
        category: masterSpec.category,
        skills: masterSpec.skills,
        parentBotId: undefined,
      })
    } else {
      masterBotId = await ctx.db.insert("teammate_bots", {
        userId,
        name: masterSpec.name,
        avatar: masterSpec.avatar,
        job: masterSpec.job,
        instructions: masterSpec.instructions,
        isMaster: true,
        category: masterSpec.category,
        skills: masterSpec.skills,
        createdAt: now,
      })
    }

    // Ensure direct chat for Master Agent
    const allDirectChats = await ctx.db
      .query("teammate_chats")
      .filter((q) => q.eq(q.field("kind"), "direct"))
      .collect()

    let masterChat = allDirectChats.find((dc) => dc.botIds.includes(masterBotId!))
    if (masterChat) {
      if (masterChat.name !== masterSpec.name) {
        await ctx.db.patch(masterChat._id, { name: masterSpec.name })
      }
    } else {
      const mChatId = await ctx.db.insert("teammate_chats", {
        userId,
        kind: "direct",
        name: masterSpec.name,
        botIds: [masterBotId],
        lastMessagePreview: masterSpec.welcome.slice(0, 100),
        lastMessageAt: now + 100,
        createdAt: now + 100,
      })
      await ctx.db.insert("teammate_messages", {
        chatId: mChatId,
        role: "assistant",
        text: masterSpec.welcome,
        botId: masterBotId,
        createdAt: now + 100,
      })
      masterChat = (await ctx.db.get(mChatId)) ?? undefined
    }

    results.push({
      botId: masterBotId,
      chatId: masterChat?._id,
      name: masterSpec.name,
      job: masterSpec.job,
      avatar: masterSpec.avatar,
      isMaster: true,
      created: !existingMaster,
    })

    // Pass 2: Ensure all 8 Independent Specialists exist and are attached under Master HQ
    const refreshedBots = await ctx.db.query("teammate_bots").collect()
    const specialistSpecs = FLEET_SPEC.filter((s) => !s.isMaster)

    for (const spec of specialistSpecs) {
      const match = refreshedBots.find(
        (b) =>
          b._id !== masterBotId &&
          (b.name.toLowerCase() === spec.name.toLowerCase() ||
            spec.aliases.some(
              (alias) =>
                b.name.toLowerCase().includes(alias) ||
                b.job.toLowerCase().includes(alias)
            ))
      )

      if (match) {
        await ctx.db.patch(match._id, {
          name: spec.name,
          job: spec.job,
          instructions: spec.instructions,
          avatar: spec.avatar,
          parentBotId: masterBotId,
          isMaster: false,
          category: spec.category,
          skills: spec.skills,
        })

        let directChat = allDirectChats.find((dc) => dc.botIds.includes(match._id))
        if (directChat) {
          if (directChat.name !== spec.name) {
            await ctx.db.patch(directChat._id, { name: spec.name })
          }
        } else {
          const chatId = await ctx.db.insert("teammate_chats", {
            userId,
            kind: "direct",
            name: spec.name,
            botIds: [match._id],
            lastMessagePreview: spec.welcome.slice(0, 100),
            lastMessageAt: now,
            createdAt: now,
          })
          await ctx.db.insert("teammate_messages", {
            chatId,
            role: "assistant",
            text: spec.welcome,
            botId: match._id,
            createdAt: now,
          })
          directChat = (await ctx.db.get(chatId)) ?? undefined
        }

        results.push({
          botId: match._id,
          chatId: directChat?._id,
          name: spec.name,
          job: spec.job,
          avatar: spec.avatar,
          isMaster: false,
          created: false,
        })
      } else {
        const botId = await ctx.db.insert("teammate_bots", {
          userId,
          name: spec.name,
          avatar: spec.avatar,
          job: spec.job,
          instructions: spec.instructions,
          parentBotId: masterBotId,
          isMaster: false,
          category: spec.category,
          skills: spec.skills,
          createdAt: now,
        })

        const chatId = await ctx.db.insert("teammate_chats", {
          userId,
          kind: "direct",
          name: spec.name,
          botIds: [botId],
          lastMessagePreview: spec.welcome.slice(0, 100),
          lastMessageAt: now,
          createdAt: now,
        })

        await ctx.db.insert("teammate_messages", {
          chatId,
          role: "assistant",
          text: spec.welcome,
          botId,
          createdAt: now,
        })

        results.push({
          botId,
          chatId,
          name: spec.name,
          job: spec.job,
          avatar: spec.avatar,
          isMaster: false,
          created: true,
        })
      }
    }

    // Pass 3: Remove legacy duplicate / unrequested auto-generated bots & duplicate direct chats
    const coreBotIds = new Set(results.map((r) => r.botId))
    const allBotsCurrent = await ctx.db.query("teammate_bots").collect()
    for (const b of allBotsCurrent) {
      if (coreBotIds.has(b._id)) continue
      const normalized = b.name.trim().toLowerCase()
      if (LEGACY_BLOAT_BOT_NAMES.has(normalized)) {
        const chatsWithBot = await ctx.db.query("teammate_chats").collect()
        for (const c of chatsWithBot) {
          if (!c.botIds.includes(b._id)) continue
          if (c.kind === "direct") {
            const msgs = await ctx.db
              .query("teammate_messages")
              .withIndex("by_chat", (q) => q.eq("chatId", c._id))
              .collect()
            for (const m of msgs) await ctx.db.delete(m._id)
            await ctx.db.delete(c._id)
          }
        }
        await ctx.db.delete(b._id)
      } else if (b._id !== masterBotId && !b.parentBotId) {
        // Keep any custom user-created agent linked under Master HQ
        await ctx.db.patch(b._id, { parentBotId: masterBotId, isMaster: false })
      }
    }

    // Deduplicate direct chats so each bot has at most 1 direct chat
    const remainingDirectChats = await ctx.db
      .query("teammate_chats")
      .filter((q) => q.eq(q.field("kind"), "direct"))
      .order("desc")
      .collect()
    const seenPrimaryBot = new Set<string>()
    for (const dc of remainingDirectChats) {
      const primaryId = dc.botIds[0]
      if (!primaryId) continue
      if (seenPrimaryBot.has(primaryId)) {
        const msgs = await ctx.db
          .query("teammate_messages")
          .withIndex("by_chat", (q) => q.eq("chatId", dc._id))
          .collect()
        for (const m of msgs) await ctx.db.delete(m._id)
        await ctx.db.delete(dc._id)
      } else {
        seenPrimaryBot.add(primaryId)
      }
    }

    // Ensure unified "Dealership Operations War Room" group chat holds Master HQ + active specialists
    const allBotsAfterFleet = await ctx.db.query("teammate_bots").collect()
    const allTeamBotIds = allBotsAfterFleet.map((b) => b._id)
    const groupChats = await ctx.db
      .query("teammate_chats")
      .filter((q) => q.eq(q.field("kind"), "group"))
      .collect()

    const existingWarRoom = groupChats.find(
      (g) =>
        g.name === "Dealership Operations War Room" ||
        g.name === "WhatsApp & Client Operations Team"
    )

    if (!existingWarRoom && allTeamBotIds.length >= 2) {
      const groupChatId = await ctx.db.insert("teammate_chats", {
        userId,
        kind: "group",
        name: "Dealership Operations War Room",
        botIds: allTeamBotIds,
        lastMessagePreview:
          "All dealership specialists are synced under AutoPulse Dealership HQ.",
        lastMessageAt: now,
        createdAt: now,
      })
      await ctx.db.insert("teammate_messages", {
        chatId: groupChatId,
        role: "assistant",
        text: "Welcome to the **Dealership Operations War Room**! **AutoPulse Dealership HQ** coordinates **Portal Publisher Agent**, **Finance & F&I Agent**, and **Follow-Up Agent** together — plus any custom agents you add.",
        botId: masterBotId,
        createdAt: now,
      })
    } else if (existingWarRoom) {
      await ctx.db.patch(existingWarRoom._id, {
        name: "Dealership Operations War Room",
        botIds: allTeamBotIds,
        lastMessagePreview:
          "All dealership specialists are synced under AutoPulse Dealership HQ.",
      })
    }

    return { fleet: results, masterBotId }
  },
})

export const ensureDefaultBot = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireStaff(ctx)
    const existing = await ctx.db.query("teammate_bots").first()
    if (existing) {
      const chat = await ctx.db
        .query("teammate_chats")
        .filter((q) => q.eq(q.field("kind"), "direct"))
        .first()
      return { botId: existing._id, chatId: chat?._id }
    }

    const masterSpec = FLEET_SPEC[0]
    const now = Date.now()
    const botId = await ctx.db.insert("teammate_bots", {
      userId,
      name: masterSpec.name,
      avatar: masterSpec.avatar,
      job: masterSpec.job,
      instructions: masterSpec.instructions,
      isMaster: true,
      category: "orchestrator",
      skills: masterSpec.skills,
      createdAt: now,
    })

    const chatId = await ctx.db.insert("teammate_chats", {
      userId,
      kind: "direct",
      name: masterSpec.name,
      botIds: [botId],
      lastMessagePreview: masterSpec.welcome.slice(0, 100),
      lastMessageAt: now,
      createdAt: now,
    })

    await ctx.db.insert("teammate_messages", {
      chatId,
      role: "assistant",
      text: masterSpec.welcome,
      botId,
      createdAt: now,
    })

    return { botId, chatId }
  },
})

export const createBot = mutation({
  args: {
    name: v.string(),
    avatar: v.string(),
    job: v.string(),
    instructions: v.optional(v.string()),
    underMaster: v.optional(v.boolean()),
    skills: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireStaff(ctx)
    const now = Date.now()

    // Automatically attach new agents under the unified Master Dealership HQ Agent by default!
    const attachUnderMaster = args.underMaster !== false
    let parentBotId: Id<"teammate_bots"> | undefined
    if (attachUnderMaster) {
      const allBots = await ctx.db.query("teammate_bots").collect()
      const master =
        allBots.find((b) => b.isMaster) ??
        allBots.find((b) => b.name.toLowerCase().includes("dealership hq"))
      if (master) {
        parentBotId = master._id
      }
    }

    const cleanName = args.name.trim()
    const cleanJob = args.job.trim()
    const selectedSkills = args.skills ?? []

    const botId = await ctx.db.insert("teammate_bots", {
      userId,
      name: cleanName,
      avatar: args.avatar.trim(),
      job: cleanJob,
      instructions: args.instructions?.trim() || undefined,
      parentBotId,
      isMaster: false,
      skills: selectedSkills,
      category: args.category ?? "custom",
      createdAt: now,
    })

    const welcomeText = parentBotId
      ? `Hi! I'm **${cleanName}** (${cleanJob}). I work independently in my own workspace AND stay unified under **AutoPulse Dealership HQ**${selectedSkills.length > 0 ? ` with skills: ${selectedSkills.join(", ")}` : ""}. How can I help your dealership today?`
      : `Hi! I'm **${cleanName}** (${cleanJob}). How can I help your dealership today?`

    const chatId = await ctx.db.insert("teammate_chats", {
      userId,
      kind: "direct",
      name: cleanName,
      botIds: [botId],
      lastMessagePreview: welcomeText.slice(0, 100),
      lastMessageAt: now,
      createdAt: now,
    })

    await ctx.db.insert("teammate_messages", {
      chatId,
      role: "assistant",
      text: welcomeText,
      botId,
      createdAt: now,
    })

    // Also enroll into the unified Dealership Operations War Room so Master HQ & Team always stay in sync
    if (parentBotId) {
      const warRoom = await ctx.db
        .query("teammate_chats")
        .filter((q) =>
          q.and(
            q.eq(q.field("kind"), "group"),
            q.eq(q.field("name"), "Dealership Operations War Room")
          )
        )
        .first()
      if (warRoom && !warRoom.botIds.includes(botId)) {
        await ctx.db.patch(warRoom._id, {
          botIds: [...warRoom.botIds, botId],
        })
      }
    }

    return {
      id: chatId,
      chatId,
      botId,
      name: cleanName,
      parentBotId,
    }
  },
})

export const updateBot = mutation({
  args: {
    botId: v.id("teammate_bots"),
    name: v.string(),
    avatar: v.string(),
    job: v.string(),
    instructions: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    underMaster: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const bot = await ctx.db.get(args.botId)
    if (!bot) throw new Error("Bot not found")

    let parentBotId = bot.parentBotId
    if (args.underMaster !== undefined && !bot.isMaster) {
      if (args.underMaster) {
        const allBots = await ctx.db.query("teammate_bots").collect()
        const master = allBots.find((b) => b.isMaster && b._id !== bot._id)
        parentBotId = master?._id
      } else {
        parentBotId = undefined
      }
    }

    await ctx.db.patch(bot._id, {
      name: args.name.trim(),
      avatar: args.avatar.trim(),
      job: args.job.trim(),
      instructions: args.instructions?.trim() || undefined,
      ...(args.skills !== undefined ? { skills: args.skills } : {}),
      parentBotId,
    })

    const directChats = await ctx.db
      .query("teammate_chats")
      .filter((q) => q.eq(q.field("kind"), "direct"))
      .collect()

    for (const c of directChats) {
      if (c.botIds.includes(bot._id)) {
        await ctx.db.patch(c._id, { name: args.name.trim() })
      }
    }

    return { id: bot._id, name: args.name.trim() }
  },
})

export const renameBot = mutation({
  args: {
    botId: v.id("teammate_bots"),
    name: v.string(),
    job: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const bot = await ctx.db.get(args.botId)
    if (!bot) throw new Error("Bot not found")
    const newName = args.name.trim()
    await ctx.db.patch(bot._id, {
      name: newName,
      ...(args.job ? { job: args.job.trim() } : {}),
    })

    const directChats = await ctx.db
      .query("teammate_chats")
      .filter((q) => q.eq(q.field("kind"), "direct"))
      .collect()

    for (const c of directChats) {
      if (c.botIds.includes(bot._id)) {
        await ctx.db.patch(c._id, { name: newName })
      }
    }

    return { id: bot._id, name: newName }
  },
})

export const deleteBot = mutation({
  args: {
    botId: v.id("teammate_bots"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const bot = await ctx.db.get(args.botId)
    if (!bot) throw new Error("Bot not found")

    const chats = await ctx.db.query("teammate_chats").collect()

    for (const chat of chats) {
      if (!chat.botIds.includes(bot._id)) continue

      if (chat.kind === "direct") {
        const messages = await ctx.db
          .query("teammate_messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .collect()
        for (const m of messages) await ctx.db.delete(m._id)
        await ctx.db.delete(chat._id)
      } else {
        const remainingBots = chat.botIds.filter((id) => id !== bot._id)
        if (remainingBots.length < 2) {
          const messages = await ctx.db
            .query("teammate_messages")
            .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
            .collect()
          for (const m of messages) await ctx.db.delete(m._id)
          await ctx.db.delete(chat._id)
        } else {
          await ctx.db.patch(chat._id, { botIds: remainingBots })
        }
      }
    }

    await ctx.db.delete(bot._id)
    return { success: true }
  },
})

export const createGroupChat = mutation({
  args: {
    name: v.string(),
    botIds: v.array(v.id("teammate_bots")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireStaff(ctx)
    if (args.botIds.length < 2) {
      throw new Error("A group chat must have at least 2 bots")
    }
    const now = Date.now()

    const chatId = await ctx.db.insert("teammate_chats", {
      userId,
      kind: "group",
      name: args.name.trim(),
      botIds: args.botIds,
      lastMessagePreview: "Dealership team room created",
      lastMessageAt: now,
      createdAt: now,
    })

    return { id: chatId, chatId, name: args.name.trim() }
  },
})

export const updateGroupChat = mutation({
  args: {
    chatId: v.id("teammate_chats"),
    name: v.string(),
    botIds: v.array(v.id("teammate_bots")),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    await ctx.db.patch(chat._id, {
      name: args.name.trim(),
      botIds: args.botIds,
    })

    return { id: chat._id, name: args.name.trim() }
  },
})

export const deleteGroupChat = mutation({
  args: {
    chatId: v.id("teammate_chats"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    const messages = await ctx.db
      .query("teammate_messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
      .collect()
    for (const m of messages) await ctx.db.delete(m._id)

    await ctx.db.delete(chat._id)
    return { success: true }
  },
})

export const sendMessage = mutation({
  args: {
    chatId: v.id("teammate_chats"),
    text: v.string(),
    targetBotId: v.optional(v.id("teammate_bots")),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    const now = Date.now()
    const messageId = await ctx.db.insert("teammate_messages", {
      chatId: chat._id,
      role: "user",
      text: args.text.trim(),
      targetBotId: args.targetBotId,
      createdAt: now,
    })

    await ctx.db.patch(chat._id, {
      lastMessagePreview: args.text.trim().slice(0, 100),
      lastMessageAt: now,
    })

    return { messageId }
  },
})

export const saveAssistantReply = mutation({
  args: {
    chatId: v.id("teammate_chats"),
    text: v.string(),
    botId: v.id("teammate_bots"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    const now = Date.now()
    const messageId = await ctx.db.insert("teammate_messages", {
      chatId: chat._id,
      role: "assistant",
      text: args.text.trim(),
      botId: args.botId,
      createdAt: now,
    })

    await ctx.db.patch(chat._id, {
      lastMessagePreview: args.text.trim().slice(0, 100),
      lastMessageAt: now,
    })

    return { messageId }
  },
})

export const editMessage = mutation({
  args: {
    messageId: v.id("teammate_messages"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    await ctx.db.patch(args.messageId, { text: args.text.trim() })
    return { success: true }
  },
})

export const createDirectChat = mutation({
  args: {
    botId: v.id("teammate_bots"),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx)
    const bot = await ctx.db.get(args.botId)
    if (!bot) throw new Error("Bot not found")

    const now = Date.now()
    const welcome = `Hi! I'm **${bot.name}** (${bot.job}). How can I help your dealership today?`
    const chatId = await ctx.db.insert("teammate_chats", {
      userId: user.userId,
      kind: "direct",
      name: bot.name,
      botIds: [bot._id],
      lastMessagePreview: welcome.slice(0, 100),
      lastMessageAt: now,
      createdAt: now,
    })

    await ctx.db.insert("teammate_messages", {
      chatId,
      role: "assistant",
      text: welcome,
      botId: bot._id,
      createdAt: now,
    })

    return { chatId }
  },
})

export const clearChatMessages = mutation({
  args: {
    chatId: v.id("teammate_chats"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    const messages = await ctx.db
      .query("teammate_messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect()

    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }

    const now = Date.now()
    let welcome = "Conversation reset. How can I help your dealership today?"
    if (chat.botIds.length > 0) {
      const firstBot = await ctx.db.get(chat.botIds[0])
      if (firstBot) {
        welcome = `Hi! I'm **${firstBot.name}** (${firstBot.job}). How can I help your dealership today?`
        await ctx.db.insert("teammate_messages", {
          chatId: chat._id,
          role: "assistant",
          text: welcome,
          botId: firstBot._id,
          createdAt: now,
        })
      }
    }

    await ctx.db.patch(args.chatId, {
      lastMessagePreview: welcome.slice(0, 100),
      lastMessageAt: now,
    })

    return { success: true }
  },
})

export const deleteChat = mutation({
  args: {
    chatId: v.id("teammate_chats"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const chat = await ctx.db.get(args.chatId)
    if (!chat) throw new Error("Chat not found")

    const messages = await ctx.db
      .query("teammate_messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect()

    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }

    await ctx.db.delete(args.chatId)
    return { success: true }
  },
})

export const deleteMessage = mutation({
  args: {
    messageId: v.id("teammate_messages"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const msg = await ctx.db.get(args.messageId)
    if (msg) {
      await ctx.db.delete(args.messageId)
    }
    return { success: true }
  },
})

export const recordCustomerOutreach = mutation({
  args: {
    recipient: v.string(),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
    subject: v.optional(v.string()),
    body: v.string(),
    quoteRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const receipt = `COMM-${Date.now().toString(36).toUpperCase()}`
    await writeLog(ctx, {
      app: args.channel === "whatsapp" ? "whapi" : "composio",
      actionName:
        args.channel === "whatsapp" ? "whapi_send_buyer_offer" : "gmail_send_message",
      status: "success",
      payload: {
        receipt,
        recipient: args.recipient,
        channel: args.channel,
        subject: args.subject,
        quoteRef: args.quoteRef,
        preview: args.body.slice(0, 120),
      },
    })
    return { receipt }
  },
})

export const recordSupplierRFQ = mutation({
  args: {
    supplier: v.string(),
    sku: v.string(),
    partName: v.string(),
    quantity: v.number(),
    targetPrice: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const poNumber = `BUY-${args.supplier.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    await writeLog(ctx, {
      app: "agent",
      actionName: "stock_acquisition_offer",
      status: "success",
      payload: {
        poNumber,
        source: args.supplier,
        stockOrVin: args.sku,
        vehicleName: args.partName,
        quantity: args.quantity,
        offerPriceZar: args.targetPrice,
        notes: args.notes,
      },
    })
    return { poNumber }
  },
})

export const recordCampaignUpdate = mutation({
  args: {
    platform: v.string(),
    campaignName: v.string(),
    budget: v.number(),
    hook: v.string(),
    script: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const campaignId = `CAMP-${Date.now().toString(36).toUpperCase()}`
    await writeLog(ctx, {
      app: "composio",
      actionName: "showroom_social_campaign_deploy",
      status: "success",
      payload: {
        campaignId,
        platform: args.platform,
        campaignName: args.campaignName,
        dailyBudget: args.budget,
        hook: args.hook,
        scriptPreview: args.script.slice(0, 100),
      },
    })
    return { campaignId }
  },
})
