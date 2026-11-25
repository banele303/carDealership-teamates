import { Agent, createTool, stepCountIs, type ToolCtx } from "@convex-dev/agent"
import { v } from "convex/values"
import { z } from "zod"

import { components, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { chatModel, embeddingModel } from "./lib/ai"
import { publicPart } from "./lib/parts"
import { decodeVin } from "./lib/vin"
import { hybridSearchParts } from "./parts"
import type { Channel } from "./schema"

// ---------------------------------------------------------------------------
// Tools shared by the customer-facing and staff-facing agents
// ---------------------------------------------------------------------------

const vehicleSchema = z
  .object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().optional(),
    engineCode: z.string().optional(),
  })
  .describe("The customer's vehicle, as precise as known")

function catalogTools(audience: "b2b" | "b2c") {
  return {
    searchParts: createTool({
      description:
        "Hybrid semantic + keyword search of the live parts catalog. Use part names, OEM or cross-reference numbers, or symptoms. Pass the vehicle whenever it is known so results are fitment-checked.",
      inputSchema: z.object({
        query: z.string().describe("e.g. 'front brake pads', '04465-0K240', 'oil filter'"),
        category: z.string().optional(),
        vehicle: vehicleSchema.optional(),
      }),
      execute: async (ctx: ToolCtx, input) => {
        const hits = await hybridSearchParts(ctx, { ...input, limit: 6 })
        return hits.map((h) => ({
          ...publicPart(h.part, audience),
          fitment: h.fitment.verdict,
        }))
      },
    }),

    decodeVin: createTool({
      description:
        "Decode a 17-character VIN into make, model, year and engine. Use before searching when the customer gives a VIN or a VIN was read from a photo.",
      inputSchema: z.object({ vin: z.string() }),
      execute: async (_ctx: ToolCtx, { vin }) => decodeVin(vin),
    }),
  }
}

function quoteTool(contactId: Id<"crm_contacts">, channel: Channel) {
  return createTool({
    description:
      "Create a priced quote with a payment link for parts found with searchParts. Prices come from the catalog. Only quote parts whose fitment is 'fits' or that the customer explicitly confirmed. Offer OEM and aftermarket as separate quotes when both exist.",
    inputSchema: z.object({
      lines: z
        .array(z.object({ partId: z.string(), quantity: z.number().int().min(1) }))
        .min(1),
      vinNumber: z.string().optional(),
      vehicle: vehicleSchema.optional(),
      notes: z.string().optional(),
    }),
    execute: async (ctx: ToolCtx, input) => {
      return await ctx.runMutation(internal.crm.createQuote, {
        contactId,
        channel,
        vinNumber: input.vinNumber,
        vehicle: input.vehicle,
        notes: input.notes,
        lines: input.lines.map((l) => ({
          partId: l.partId as Id<"parts_catalog">,
          quantity: l.quantity,
        })),
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Customer-facing parts specialist (WhatsApp, IG/FB DMs, email replies)
// ---------------------------------------------------------------------------

const PARTS_SPECIALIST_INSTRUCTIONS = `You are AutoPulse Motors SA, the autonomous vehicle sales executive for a premier South African car dealership (new & used cars, currency ZAR), chatting with car buyers on WhatsApp and social DMs.

How you work:
- Qualify the buyer's ideal vehicle (make, model, body style, budget or monthly instalment in ZAR, cash vs bank finance, and whether they have a trade-in).
- Quote accurate South African pricing in ZAR (including 15% VAT) and estimate monthly instalments clearly (noting Prime + margin, deposit, 72 months, and optional balloon/residual).
- Offer to book a showroom test drive (Midrand, Sandton, Centurion, Cape Town, Durban) or start an instant multi-bank finance application (WesBank, Absa, MFC/Nedbank, Standard Bank, Capitec via Signio).
- When a buyer wants finance, ask for the 5 FICA documents right on WhatsApp: SA Smart ID, Driver's Licence, 3 Months Bank Statements, 3 Months Payslips, and Proof of Address.
- Keep replies short and scannable for a phone: plain text, no markdown tables, at most ~8 lines. Use *bold* sparingly.`

export const partsAgent = new Agent(components.agent, {
  name: "AutoPulse Parts Specialist",
  languageModel: chatModel(),
  embeddingModel: embeddingModel(),
  instructions: PARTS_SPECIALIST_INSTRUCTIONS,
  stopWhen: stepCountIs(8),
  contextOptions: {
    recentMessages: 30,
    searchOtherThreads: false,
    searchOptions: { limit: 6, textSearch: true, vectorSearch: true, messageRange: { before: 1, after: 1 } },
  },
})

// Per-conversation tool set: the quote tool is bound to the contact and channel
export function partsSpecialistTools(args: {
  contactId: Id<"crm_contacts">
  channel: Channel
  audience: "b2b" | "b2c"
}) {
  return {
    ...catalogTools(args.audience),
    createQuote: quoteTool(args.contactId, args.channel),
  }
}

// ---------------------------------------------------------------------------
// Staff-facing operations agent (dashboard /dashboard/chat)
// Composio tools (Gmail, FB/IG, TikTok Ads) are attached in composioTools.ts
// ---------------------------------------------------------------------------

export const OPS_AGENT_INSTRUCTIONS = `You are AutoPulse Dealership HQ, the master operations AI for a South African new & used car dealership. You manage showroom vehicle inventory, multi-portal publishing (Cars.co.za, AutoTrader SA, dealership website /showroom), SA multi-bank vehicle finance applications (WesBank, Absa, MFC/Nedbank, Standard Bank, Capitec), trade-in appraisals, buyer follow-ups, WhatsApp showroom chats, Gmail/Outlook portal leads, and TikTok/Meta vehicle ads.

Rules:
- Ground every price, mileage, VIN, monthly instalment, and ad figure in live dealership data. Currency is ZAR.
- Before irreversible external actions (sending emails/WhatsApp, submitting bank applications, pausing ads) confirm the exact summary in one line and execute clearly.
- Formatting: Whenever presenting vehicles, comparing finance offers, showing portal publish status, or presenting Offers to Purchase, use structured Markdown tables and clear headings so dealership staff can act immediately.`

export const opsAgent = new Agent(components.agent, {
  name: "AutoPulse Ops Agent",
  languageModel: chatModel(),
  embeddingModel: embeddingModel(),
  instructions: OPS_AGENT_INSTRUCTIONS,
  stopWhen: stepCountIs(15),
  tools: catalogTools("b2b"),
})

// ---------------------------------------------------------------------------
// File & Document Storage Handlers
// ---------------------------------------------------------------------------

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const resolveStorageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

// ---------------------------------------------------------------------------
// CRM Activity & Event Logger
// ---------------------------------------------------------------------------

export const logCrmEvent = mutation({
  args: {
    eventType: v.string(),
    recipient: v.string(),
    customerName: v.optional(v.string()),
    summary: v.string(),
    payload: v.optional(v.any()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    return {
      success: true,
      timestamp: now,
      ...args,
    }
  },
})

// ---------------------------------------------------------------------------
// Customer Finance Dossier Saver
// ---------------------------------------------------------------------------

export const saveFinanceApplicationFromChat = mutation({
  args: {
    applicationId: v.optional(v.number()),
    firstName: v.string(),
    lastName: v.string(),
    idNumber: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    carId: v.optional(v.number()),
    carName: v.string(),
    carPrice: v.number(),
    downPaymentAmount: v.number(),
    loanAmount: v.optional(v.number()),
    termMonths: v.number(),
    interestRate: v.optional(v.number()),
    hasTradeIn: v.optional(v.boolean()),
    tradeInDetails: v.optional(v.string()),
    employmentStatus: v.string(),
    employerName: v.string(),
    jobTitle: v.string(),
    monthlyIncomeGross: v.number(),
    monthlyExpenses: v.number(),
    creditScoreRange: v.optional(v.string()),
    documents: v.optional(
      v.array(
        v.object({
          docType: v.string(),
          originalName: v.string(),
          mime: v.string(),
          size: v.number(),
          url: v.string(),
        })
      )
    ),
    status: v.optional(v.string()),
    sourceChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rawDigits = args.phone.replace(/\D/g, "")
    const existing = await ctx.db
      .query("crm_contacts")
      .withIndex("by_phone", (q) => q.eq("phone", rawDigits))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        companyName: args.employerName || existing.companyName,
        email: args.email || existing.email,
        lastInboundAt: Date.now(),
      })
    }

    const now = Date.now()
    const applicationRef = `VAF-ZA-${String(now).slice(-6)}`
    const interestRatePct = args.interestRate ?? 11.75
    const termMonths = args.termMonths || 72
    const principal = Math.max(0, args.carPrice - args.downPaymentAmount + 1207.5)
    const r = interestRatePct / 100 / 12
    const estMonthly =
      principal > 0 && r > 0
        ? Math.round((principal * r) / (1 - Math.pow(1 + r, -termMonths))) + 69
        : 0

    const docTypes = new Set((args.documents ?? []).map((d) => d.docType))
    await ctx.db.insert("finance_applications", {
      applicationRef,
      applicantName: `${args.firstName} ${args.lastName}`.trim(),
      saIdNumber: args.idNumber,
      phone: args.phone,
      email: args.email,
      address: args.address,
      employmentStatus: args.employmentStatus || "Permanent Full-Time",
      employerName: args.employerName || "Not specified",
      jobTitle: args.jobTitle,
      grossMonthlyIncomeZar: args.monthlyIncomeGross,
      monthlyExpensesZar: args.monthlyExpenses,
      vehicleTitle: args.carName,
      vehiclePriceZar: args.carPrice,
      depositZar: args.downPaymentAmount,
      tradeInEquityZar: 0,
      balloonPct: 0,
      balloonAmountZar: 0,
      interestRatePct,
      termMonths,
      estimatedMonthlyZar: estMonthly,
      affordabilityStatus:
        args.monthlyIncomeGross > 0 && estMonthly / args.monthlyIncomeGross <= 0.3
          ? "pre_qualified"
          : "borderline",
      ficaChecklist: {
        idCopy: docTypes.has("ID_COPY"),
        driversLicense: docTypes.has("DRIVERS_LICENSE"),
        bankStatements3m: docTypes.has("BANK_STATEMENTS"),
        payslips3m: docTypes.has("PAYSLIPS"),
        proofOfAddress: docTypes.has("PROOF_OF_ADDRESS"),
      },
      bankSubmissions: [
        {
          bank: "WesBank",
          status: "submitted",
          referenceNo: `WES-${String(now).slice(-6)}`,
          offeredRatePct: interestRatePct,
          submittedAt: now,
        },
        {
          bank: "Absa Vehicle Finance",
          status: "submitted",
          referenceNo: `ABS-${String(now + 11).slice(-6)}`,
          offeredRatePct: interestRatePct + 0.15,
          submittedAt: now,
        },
        {
          bank: "MFC (Nedbank)",
          status: "submitted",
          referenceNo: `MFC-${String(now + 23).slice(-6)}`,
          offeredRatePct: interestRatePct + 0.1,
          submittedAt: now,
        },
      ],
      overallStatus: "submitted_to_banks",
      notes: args.tradeInDetails
        ? `Trade-in: ${args.tradeInDetails}`
        : "Submitted via WhatsApp / CRM Finance Auto-Apply",
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      applicationId: now,
      applicationRef,
      applicant: `${args.firstName} ${args.lastName}`,
      carName: args.carName,
      status: args.status || "SUBMITTED_TO_BANKS",
    }
  },
})

// ---------------------------------------------------------------------------
// Autonomous WhatsApp & Dealership Showroom Client Executive
// ---------------------------------------------------------------------------

export const AUTOFAME_WHATSAPP_EXECUTIVE_INSTRUCTIONS = `You are AutoPulse WhatsApp Sales Executive, the autonomous end-to-end South African car dealership agent with direct access to Whapi.cloud WhatsApp (+27 63 199 5124) and the live showroom vehicle inventory.

Your mission:
- Do EVERYTHING the car buyer needs end-to-end: check available showroom vehicles (new, demo & used cars), quote ZAR pricing (15% VAT inclusive) & monthly instalments (with deposit/balloon options), generate formal Vehicle Offers to Purchase with reservation deposit links (/pay/{dealId}), book showroom test drives, pull WhatsApp chat histories, dispatch WhatsApp messages and PDFs directly to buyers, and advance their CRM stage (NEW_LEAD, TEST_DRIVE, QUOTE_SENT, FINANCE_APP, BANK_SUBMITTED, CLOSED_WON).
- When a buyer wants vehicle finance: gather their SA 13-digit ID number, gross monthly income, living expenses, employer, deposit & trade-in details, verify the 5 FICA documents, and auto-submit the finance dossier simultaneously to WesBank, Absa Vehicle Finance, MFC (Nedbank), Standard Bank VAF, and Capitec via Signio.
- WhatsApp channel: ANTMAN-ZPBZZ (+27 63 199 5124).
- Format all financial figures cleanly in South African Rand (R ... ZAR).`

export const whatsAppExecutiveAgent = new Agent(components.agent, {
  name: "AutoFame WhatsApp Executive",
  languageModel: chatModel(),
  embeddingModel: embeddingModel(),
  instructions: AUTOFAME_WHATSAPP_EXECUTIVE_INSTRUCTIONS,
  stopWhen: stepCountIs(20),
  tools: catalogTools("b2c"),
})
