"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Car,
  CarFront,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  ExternalLink,
  Globe,
  Landmark,
  Layers,
  LineChart as LineChartIcon,
  Mail,
  MessageSquare,
  PieChart as PieChartIcon,
  PlusIcon,
  Rocket,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMutation, useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import {
  formatZar,
  SA_SHOWROOM_VEHICLES,
  type ShowroomVehicle,
} from "@/lib/sa-dealership"

// ============================================================================
// South African Car Dealership Analytics Configurations (ZAR)
// ============================================================================

const DEALERSHIP_REVENUE_DATA = [
  { day: "Mon", revenue: 729900, grossProfit: 71900, units: 1 },
  { day: "Tue", revenue: 1144800, grossProfit: 112500, units: 2 },
  { day: "Wed", revenue: 949900, grossProfit: 84900, units: 1 },
  { day: "Thu", revenue: 1339800, grossProfit: 134000, units: 2 },
  { day: "Fri", revenue: 1659800, grossProfit: 158400, units: 3 },
  { day: "Sat", revenue: 2189700, grossProfit: 214500, units: 4 },
  { day: "Sun", revenue: 549900, grossProfit: 57900, units: 1 },
]

const revenueChartConfig: ChartConfig = {
  revenue: { label: "Vehicle Sales (ZAR)", color: "#0ea5e9" },
  grossProfit: { label: "Front + F&I Gross (ZAR)", color: "#10b981" },
}

const PORTAL_LEADS_DATA = [
  { channel: "Cars.co.za", leads: 94, delivered: 18 },
  { channel: "AutoTrader", leads: 86, delivered: 16 },
  { channel: "WhatsApp", leads: 112, delivered: 24 },
  { channel: "TikTok Reels", leads: 78, delivered: 11 },
  { channel: "Own Site", leads: 54, delivered: 13 },
]

const channelChartConfig: ChartConfig = {
  leads: { label: "Inbound Buyer Leads", color: "#38bdf8" },
  delivered: { label: "Cars Delivered", color: "#34d399" },
}

const BODY_STYLE_SHARE = [
  { name: "Double Cab Bakkies", value: 36, fill: "#38bdf8", models: "Hilux GR-S / Ranger V6" },
  { name: "SUVs & Family 7-Seaters", value: 26, fill: "#10b981", models: "Fortuner VX / BMW X3" },
  { name: "Hatchbacks & Entry", value: 18, fill: "#a855f7", models: "Polo Vivo / Golf 8 GTI / Swift" },
  { name: "Crossovers (Chery/Haval)", value: 12, fill: "#f59e0b", models: "Tiggo 7 Pro / Jolion S" },
  { name: "Luxury Sedans", value: 8, fill: "#ec4899", models: "Mercedes-Benz C200 W206" },
]

const bodyChartConfig: ChartConfig = {
  bakkies: { label: "Double Cab Bakkies", color: "#38bdf8" },
  suvs: { label: "SUVs", color: "#10b981" },
  hatchbacks: { label: "Hatchbacks", color: "#a855f7" },
  crossovers: { label: "Crossovers", color: "#f59e0b" },
  sedans: { label: "Luxury Sedans", color: "#ec4899" },
}

const SALES_FUNNEL_DATA = [
  { stage: "1. Cars.co.za / AutoTrader / WhatsApp Leads", count: 424, percentage: 100, fill: "#0284c7" },
  { stage: "2. Showroom Test Drives Booked", count: 168, percentage: 39.6, fill: "#0ea5e9" },
  { stage: "3. Multi-Bank Finance Approved (WesBank/Absa/MFC)", count: 109, percentage: 25.7, fill: "#38bdf8" },
  { stage: "4. Vehicles Delivered & eNaTIS Transferred", count: 82, percentage: 19.3, fill: "#10b981" },
]

export default function DealershipHomePage() {
  const router = useRouter()
  const data = useQuery(api.teammates.listWorkspace, {})
  const storeContext = useQuery(api.dashboard.botStoreContext, {})

  const ensureFleetMut = useMutation(api.teammates.ensureWorkspaceFleet)
  const seedVehiclesMut = useMutation(api.vehicles.seedDealershipData)
  const publishMut = useMutation(api.vehicles.publishToPortals)
  const createDirectChatMut = useMutation(api.teammates.createDirectChat)

  const [isSyncingFleet, setIsSyncingFleet] = React.useState(false)
  const [publishingStock, setPublishingStock] = React.useState<string | null>(null)
  const [addAgentOpen, setAddAgentOpen] = React.useState(false)

  const bots = data?.bots ?? []
  const chats = data?.chats ?? []

  const vehicles: ShowroomVehicle[] =
    storeContext?.vehicles && storeContext.vehicles.length > 0
      ? (storeContext.vehicles as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  const masterBot = bots.find(
    (b) => b.isMaster || b.name.toLowerCase().includes("dealership hq")
  )
  const specialists = bots.filter((b) => b.id !== masterBot?.id)

  const publisherBot = bots.find((b) =>
    b.name.toLowerCase().includes("portal publisher")
  )
  const financeBot = bots.find((b) => b.name.toLowerCase().includes("finance"))
  const followUpBot = bots.find((b) => b.name.toLowerCase().includes("follow-up"))
  const tradeInBot = bots.find((b) => b.name.toLowerCase().includes("trade-in"))
  const whatsAppBot = bots.find((b) => b.name.toLowerCase().includes("whatsapp"))
  const quoteBot = bots.find((b) => b.name.toLowerCase().includes("quote"))

  const handleSyncFleet = async () => {
    setIsSyncingFleet(true)
    try {
      await Promise.all([ensureFleetMut({}), seedVehiclesMut({})])
      toast.add({
        type: "success",
        title: "Dealership AI Team & Showroom Synced",
        description:
          "Master HQ + your core SA dealership agents & 10 showroom cars are synced.",
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Sync Note",
        description: err instanceof Error ? err.message : "Sync error",
      })
    } finally {
      setIsSyncingFleet(false)
    }
  }

  const openBotWorkspace = async (
    botId: string,
    initialPrompt?: string
  ) => {
    const promptQuery = initialPrompt
      ? `?prompt=${encodeURIComponent(initialPrompt)}`
      : ""
    const existingDirect = chats.find(
      (c) => c.kind === "direct" && c.bots[0]?.id === botId
    )
    if (existingDirect) {
      router.push(`/chats/${existingDirect.id}${promptQuery}`)
      return
    }
    try {
      const res = await createDirectChatMut({
        botId: botId as Id<"teammate_bots">,
      })
      router.push(`/chats/${res.chatId}${promptQuery}`)
    } catch (err) {
      toast.add({
        type: "error",
        title: "Failed to open workspace",
        description: (err as Error).message,
      })
    }
  }

  const handleQuickPublishAll = async (car: ShowroomVehicle) => {
    setPublishingStock(car.stockNumber)
    try {
      await publishMut({
        stockNumber: car.stockNumber,
        portals: ["cars_co_za", "autotrader_sa", "dealership_website", "facebook_marketplace"],
        headline: `${car.year} ${car.make} ${car.model} ${car.variant}`,
        priceZar: car.retailPriceZar,
        publishedByBot: "Portal Publisher Agent",
      })
      toast.add({
        type: "success",
        title: `${car.stockNumber} Published Everywhere`,
        description: "Synced live to Cars.co.za, AutoTrader SA, Own Website (/showroom) & FB Marketplace.",
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Publish failed",
        description: err instanceof Error ? err.message : "Could not publish",
      })
    } finally {
      setPublishingStock(null)
    }
  }

  const agingCars = vehicles.filter(
    (v) => v.status === "available" && v.daysInStock >= 40
  )

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-12">
        {/* Top Dealership Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono"
              >
                AutoPulse Motors SA &bull; New &amp; Used Dealership Hub
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs"
              >
                {bots.length || 9} Agents Online (Unified Under Master HQ)
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-100 md:text-3xl">
              South African Car Dealership Command Center
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Multi-portal publishing (Cars.co.za, AutoTrader SA &amp; Own Site), SA multi-bank finance auto-apply (WesBank, Absa, MFC, Standard Bank) &amp; autonomous buyer follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFleet}
              disabled={isSyncingFleet}
              className="h-9 gap-1.5 border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              {isSyncingFleet ? (
                <Skeleton className="size-3.5 rounded-full bg-emerald-400/80" />
              ) : (
                <RotateCw className="size-3.5 text-emerald-400" />
              )}
              Sync Dealership
            </Button>

            <Link href="/dashboard/crm">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-emerald-500/40 bg-emerald-500/15 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                <Layers className="size-3.5" />
                AutoPulse CRM
              </Button>
            </Link>

            <Link href="/showroom">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-sky-500/30 bg-sky-500/10 text-xs text-sky-300 hover:bg-sky-500/20 cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                Own Website (/showroom)
              </Button>
            </Link>

            {publisherBot && (
              <Button
                size="sm"
                onClick={() =>
                  void openBotWorkspace(
                    publisherBot.id,
                    "Publish our 2024 Toyota Hilux 2.8 GD-6 GR-Sport (APM-2401) simultaneously to Cars.co.za, AutoTrader SA, and our Own Website (/showroom) with high-converting South African ad copy."
                  )
                }
                className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-500 text-xs text-white cursor-pointer shadow-md"
              >
                <Globe className="size-3.5" />
                Publish a Car
              </Button>
            )}

            {financeBot && (
              <Button
                size="sm"
                onClick={() =>
                  void openBotWorkspace(
                    financeBot.id,
                    "Run a South African vehicle finance calculation & prepare a multi-bank auto-application to WesBank, Absa Vehicle Finance, MFC (Nedbank) and Standard Bank for the 2023 Ford Ranger 3.0 V6 Wildtrak (R869,900) with R90,000 deposit and 20% balloon over 72 months."
                  )
                }
                className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white cursor-pointer shadow-md"
              >
                <Landmark className="size-3.5" />
                Auto-Apply Finance
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* 1. GROK-STYLE UNIFIED ONE-AGENT ARCHITECTURE PANEL                 */}
        {/* ================================================================== */}
        <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-950/20 via-zinc-900/60 to-zinc-950 p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-400">
                <Crown className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    AutoPulse Dealership HQ &mdash; Unified One-Agent Architecture
                  </h2>
                  <Badge className="border-sky-500/30 bg-sky-500/15 text-[10px] text-sky-300">
                    Grok-Style Skills
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  Every specialist works independently in parallel AND reports under one Master HQ Agent. Any new agent you add automatically links here too.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {masterBot && (
                <Button
                  size="sm"
                  onClick={() => void openBotWorkspace(masterBot.id)}
                  className="h-8 gap-1.5 bg-sky-600 hover:bg-sky-500 text-xs text-white cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  Command Master HQ
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddAgentOpen(true)}
                className="h-8 gap-1.5 border-zinc-700 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              >
                <PlusIcon className="size-3.5 text-emerald-400" />
                Add Agent Under HQ
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {specialists.map((bot) => (
              <button
                key={bot.id}
                type="button"
                onClick={() => void openBotWorkspace(bot.id)}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 text-left transition hover:border-sky-500/40 hover:bg-zinc-900/90 cursor-pointer"
              >
                <ChatAvatar seed={bot.avatar} className="size-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-zinc-100 group-hover:text-sky-300">
                      {bot.name}
                    </span>
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">
                    {bot.job}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================== */}
        {/* 2. LIVE DEALERSHIP KPI BAR (ZAR)                                   */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sky-400">7-Day Vehicle Sales</span>
              <DollarSign className="size-4 text-sky-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-zinc-100">
              R 8,563,800
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <TrendingUp className="size-3" />
              <span>14 units delivered &bull; +22.4%</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              Avg Gross Profit / Unit (GPU):{" "}
              <strong className="font-mono text-zinc-300">R 59,578</strong>
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">SA Bank Approval Rate</span>
              <Landmark className="size-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-zinc-100">
              74.6%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>WesBank &bull; Absa &bull; MFC &bull; StdBank</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              {storeContext?.financeApplications?.length || 2} active multi-bank dossiers in queue
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-400">Portal Syndication</span>
              <Globe className="size-4 text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-zinc-100">
              {vehicles.length} Cars Live
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
              <Rocket className="size-3" />
              <span>Cars.co.za + AutoTrader + Own Site</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              Zero phantom listings &bull; Hourly XML feed sync
            </p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-400">Speed-to-Lead AI</span>
              <Activity className="size-4 text-purple-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-zinc-100">
              26 seconds
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-purple-400">
              <ShieldCheck className="size-3" />
              <span>24h/48h/72h WhatsApp cadence active</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              Instant portal reply + test drive &amp; FICA intake
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. DEALERSHIP ANALYTICS CHARTS                                     */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <LineChartIcon className="size-4 text-sky-400" />
                  7-Day Showroom Sales &amp; Gross Profit (ZAR)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Daily vehicle retail turnover vs dealership front-end + F&amp;I gross profit.
                </p>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-[10px] text-zinc-400">
                ZAR &bull; Live
              </Badge>
            </div>

            <ChartContainer config={revenueChartConfig} className="h-64 w-full pt-2">
              <AreaChart
                data={DEALERSHIP_REVENUE_DATA}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dealerRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dealerGp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        formatZar(Number(value)),
                        name === "revenue" ? "Vehicle Sales" : "Gross Profit",
                      ]}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#dealerRev)"
                />
                <Area
                  type="monotone"
                  dataKey="grossProfit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#dealerGp)"
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 lg:col-span-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <BarChart3 className="size-4 text-emerald-400" />
                Portal Leads vs Vehicles Delivered
              </h3>
              <p className="text-[11px] text-zinc-400">
                Cars.co.za, AutoTrader SA, WhatsApp, TikTok Reels &amp; Own Site conversion.
              </p>
            </div>

            <ChartContainer config={channelChartConfig} className="h-64 w-full pt-2">
              <BarChart
                data={PORTAL_LEADS_DATA}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="channel" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        value,
                        name === "leads" ? "Buyer Leads" : "Cars Delivered",
                      ]}
                    />
                  }
                />
                <Bar dataKey="leads" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="delivered" fill="#34d399" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Body Style Mix + Sales Conversion Funnel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <PieChartIcon className="size-4 text-purple-400" />
                South African Showroom Stock Mix
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sales share across top-demand SA vehicle segments.
              </p>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
              <div className="flex justify-center sm:col-span-5">
                <ChartContainer config={bodyChartConfig} className="h-48 w-48 aspect-square">
                  <PieChart>
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [`${value}% share`, name]}
                        />
                      }
                    />
                    <Pie
                      data={BODY_STYLE_SHARE}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {BODY_STYLE_SHARE.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} stroke="#18181b" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="space-y-2 sm:col-span-7">
                {BODY_STYLE_SHARE.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-200">
                          {item.name}
                        </div>
                        <div className="truncate text-[10px] text-zinc-500">{item.models}</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Target className="size-4 text-amber-400" />
                    Showroom-to-Delivery Conversion Funnel
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Portal &amp; WhatsApp inquiries converted into bank-approved deliveries.
                  </p>
                </div>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-400">
                  19.3% Close Rate
                </Badge>
              </div>
              <div className="space-y-2.5 pt-3">
                {SALES_FUNNEL_DATA.map((step) => (
                  <div
                    key={step.stage}
                    className="space-y-1.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200">{step.stage}</span>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-zinc-400">{step.count}</span>
                        <span className="font-bold text-sky-400">{step.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${step.percentage}%`, backgroundColor: step.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400" />
                Top converter: <strong className="text-zinc-200">Multi-Bank Signio Auto-Apply</strong>
              </span>
              <Link
                href="/dashboard/crm"
                className="inline-flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300"
              >
                Open Buyer CRM <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. LIVE SHOWROOM STOCK & MULTI-PORTAL PUBLISHING TABLE             */}
        {/* ================================================================== */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <CarFront className="size-4 text-sky-400" />
                Live South African Showroom Stock &amp; Multi-Portal Status
              </h3>
              <p className="text-[11px] text-zinc-400">
                1-click multi-publish to Cars.co.za, AutoTrader SA &amp; Own Website (/showroom) or launch instant bank finance.
              </p>
            </div>
            <Link href="/dashboard/knowledge-base">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-zinc-700 bg-zinc-900 text-xs text-zinc-200 cursor-pointer"
              >
                <Layers className="size-3.5 text-sky-400" />
                Manage Full Stock &amp; Feeds
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="pb-2.5 font-medium">Stock #</th>
                  <th className="pb-2.5 font-medium">Vehicle &amp; Specs</th>
                  <th className="pb-2.5 font-medium text-right">Mileage</th>
                  <th className="pb-2.5 font-medium text-right">Retail (ZAR)</th>
                  <th className="pb-2.5 font-medium">Portals Live</th>
                  <th className="pb-2.5 font-medium text-right">Floor Days</th>
                  <th className="pb-2.5 font-medium text-right">1-Click Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {vehicles.slice(0, 8).map((car) => (
                  <tr key={car.stockNumber} className="transition hover:bg-zinc-900/70">
                    <td className="py-3 font-mono font-semibold text-sky-400">
                      {car.stockNumber}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-zinc-100">
                        {car.year} {car.make} {car.model}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                        <Car className="size-3 text-zinc-500" />
                        <span>
                          {car.variant} &bull; {car.colour}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-300">
                      {car.mileageKm.toLocaleString("en-ZA")} km
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-zinc-100">
                      {formatZar(car.retailPriceZar)}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                            car.portals.cars_co_za
                              ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-600"
                          }`}
                        >
                          Cars.co.za
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                            car.portals.autotrader_sa
                              ? "border-sky-500/30 bg-sky-500/15 text-sky-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-600"
                          }`}
                        >
                          AutoTrader
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                            car.portals.dealership_website
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-600"
                          }`}
                        >
                          Site
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono">
                      <span
                        className={
                          car.daysInStock >= 45
                            ? "font-semibold text-amber-400"
                            : "text-zinc-400"
                        }
                      >
                        {car.daysInStock}d
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={publishingStock === car.stockNumber}
                          onClick={() => void handleQuickPublishAll(car)}
                          className="h-7 gap-1 border-sky-500/30 bg-sky-500/10 px-2 text-[11px] text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                        >
                          <Rocket className="size-3" />
                          {publishingStock === car.stockNumber ? "..." : "Publish All"}
                        </Button>
                        {financeBot && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void openBotWorkspace(
                                financeBot.id,
                                `Structure SA vehicle finance and auto-apply to WesBank, Absa, MFC & Standard Bank for [${car.stockNumber}] ${car.year} ${car.make} ${car.model} (${formatZar(car.retailPriceZar)}).`
                              )
                            }
                            className="h-7 border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            Finance
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 5. LIVE DEALERSHIP OPERATIONS FEED (DIRECT AGENT TRIGGERS)         */}
        {/* ================================================================== */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Live Showroom Alerts, Buyer Inquiries &amp; Bank Finance Queue
            </h2>
            <p className="text-xs text-zinc-400">
              Launch any independent specialist directly on a real dealership alert.
            </p>
          </div>

          <Tabs defaultValue="aging" className="w-full">
            <TabsList className="border border-zinc-800 bg-zinc-900">
              <TabsTrigger
                value="aging"
                className="gap-1.5 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 cursor-pointer"
              >
                <AlertTriangle className="size-3.5" />
                Aging Floorplan ({agingCars.length})
              </TabsTrigger>
              <TabsTrigger
                value="inquiries"
                className="gap-1.5 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-sky-400 cursor-pointer"
              >
                <Mail className="size-3.5" />
                Buyer &amp; Portal Leads ({storeContext?.messages?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="gap-1.5 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 cursor-pointer"
              >
                <Landmark className="size-3.5" />
                SA Bank Finance ({storeContext?.financeApplications?.length ?? 2})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aging" className="mt-4 space-y-3">
              {agingCars.map((car) => (
                <div
                  key={car.stockNumber}
                  className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-amber-400">
                        [{car.stockNumber}]
                      </span>
                      <span className="text-sm font-medium text-zinc-100">
                        {car.year} {car.make} {car.model} {car.variant}
                      </span>
                      <Badge className="border-amber-500/30 bg-amber-500/15 text-[10px] text-amber-300">
                        {car.daysInStock} Days on Floor
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
                      <span>Retail: {formatZar(car.retailPriceZar)}</span>
                      <span>Branch: {car.branch}</span>
                    </div>
                  </div>

                  {tradeInBot && (
                    <Button
                      size="sm"
                      onClick={() =>
                        void openBotWorkspace(
                          tradeInBot.id,
                          `Audit aging stock [${car.stockNumber}] ${car.year} ${car.make} ${car.model} (${car.daysInStock} days on floor at ${formatZar(car.retailPriceZar)}). Recommend TransUnion repricing, Cars.co.za / AutoTrader boost, and a 72h WhatsApp price-drop blast.`
                        )
                      }
                      className="shrink-0 gap-1.5 bg-amber-600 hover:bg-amber-500 text-xs text-white cursor-pointer"
                    >
                      <TrendingUp className="size-3.5" />
                      Reprice &amp; Boost Stock
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="inquiries" className="mt-4 space-y-3">
              {(storeContext?.messages ?? []).slice(0, 6).map((msg) => (
                <div
                  key={msg.id}
                  className="flex flex-col gap-3 rounded-xl border border-sky-500/20 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="border-sky-500/30 bg-sky-500/20 text-[10px] uppercase text-sky-300">
                        {msg.channel}
                      </Badge>
                      <span className="text-sm font-medium text-zinc-100">{msg.from}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-300">
                      &ldquo;{msg.body}&rdquo;
                    </p>
                  </div>
                  {(followUpBot || whatsAppBot) && (
                    <Button
                      size="sm"
                      onClick={() =>
                        void openBotWorkspace(
                          (followUpBot ?? whatsAppBot)!.id,
                          `Follow up immediately with ${msg.from} regarding: "${msg.body}". Offer a showroom test drive and instant SA multi-bank finance pre-approval.`
                        )
                      }
                      className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white cursor-pointer"
                    >
                      <MessageSquare className="size-3.5" />
                      Follow Up Now
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="finance" className="mt-4 space-y-3">
              {(storeContext?.financeApplications ?? []).length > 0 ? (
                storeContext!.financeApplications.map((app) => (
                  <div
                    key={app._id}
                    className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-400">
                          {app.applicationRef}
                        </span>
                        <span className="text-sm font-medium text-zinc-100">
                          {app.applicantName}
                        </span>
                        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-300">
                          {app.overallStatus.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span>{app.vehicleTitle}</span>
                        <span className="font-mono text-emerald-300">
                          {formatZar(app.estimatedMonthlyZar)}/pm
                        </span>
                        <span>
                          Banks: {app.bankSubmissions.map((b) => `${b.bank} (${b.status})`).join(" · ")}
                        </span>
                      </div>
                    </div>
                    {financeBot && (
                      <Button
                        size="sm"
                        onClick={() =>
                          void openBotWorkspace(
                            financeBot.id,
                            `Review finance application ${app.applicationRef} for ${app.applicantName} on ${app.vehicleTitle}. Compare bank offers (${app.bankSubmissions.map((b) => b.bank).join(", ")}) and prepare Signio contract steps.`
                          )
                        }
                        className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white cursor-pointer"
                      >
                        <Landmark className="size-3.5" />
                        Open in F&amp;I Agent
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center text-xs text-zinc-400">
                  Click &ldquo;Sync Dealership&rdquo; above to load live SA multi-bank finance applications (WesBank, Absa, MFC &amp; Standard Bank).
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BotDialog open={addAgentOpen} onOpenChange={setAddAgentOpen} />
    </div>
  )
}
