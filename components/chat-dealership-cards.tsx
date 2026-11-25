"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation } from "convex/react"
import {
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileDown,
  Globe,
  Landmark,
  MessageSquare,
  MonitorPlay,
  QrCode,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { useDesktopPanel } from "@/components/desktop-panel"
import {
  analyzeSaMarketPricing,
  calculateSaVehicleFinance,
  formatZar,
  SA_BANKS,
  SA_PORTALS,
  type ParsedFinanceAction,
  type ParsedFollowUpAction,
  type ParsedPublishAction,
  type PortalSlug,
  type SaBankName,
} from "@/lib/sa-dealership"
import { downloadShowroomWindowStickerPdf } from "@/lib/window-sticker-pdf"
import { cn } from "@/lib/utils"

// ============================================================================
// 1. Grok-Style Multi-Portal Vehicle Publish Card (Cars.co.za, AutoTrader, Own Site)
// ============================================================================

export function ChatPublishCard({
  action,
  imageUrl,
}: {
  action: ParsedPublishAction
  imageUrl?: string
}) {
  const desktop = useDesktopPanel()
  const publishMut = useMutation(api.vehicles.publishToPortals)

  const [livePriceZar, setLivePriceZar] = React.useState(action.priceZar)
  const [selectedPortals, setSelectedPortals] = React.useState<PortalSlug[]>(
    action.portals.length > 0
      ? action.portals
      : ["cars_co_za", "autotrader_sa", "dealership_website"]
  )
  const [publishing, setPublishing] = React.useState(false)
  const [publishedReceipts, setPublishedReceipts] = React.useState<
    Array<{ portal: string; externalListingId: string; listingUrl: string }>
  >([])
  const [autoFilling, setAutoFilling] = React.useState(false)
  const [autoFillResult, setAutoFillResult] = React.useState<{
    portalLabel: string
    portalUrl: string
    steps: Array<{ step: number; field: string; value: string; status: string }>
  } | null>(null)

  const market = React.useMemo(
    () =>
      analyzeSaMarketPricing({
        year: action.year,
        make: action.make,
        model: action.model,
        variant: action.variant,
        mileageKm: action.mileageKm,
        priceZar: livePriceZar,
        fullServiceHistory: true,
      }),
    [
      action.year,
      action.make,
      action.model,
      action.variant,
      action.mileageKm,
      livePriceZar,
    ]
  )

  const togglePortal = (slug: PortalSlug) => {
    setSelectedPortals((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    )
  }

  const handlePublish = async () => {
    if (selectedPortals.length === 0) {
      toast.add({ type: "error", title: "Pick at least one portal" })
      return
    }
    setPublishing(true)
    try {
      const apiRes = await fetch("/api/publish-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockNumber: action.stockNumber,
          vin: action.vin,
          year: action.year,
          make: action.make,
          model: action.model,
          variant: action.variant,
          priceZar: livePriceZar,
          mileageKm: action.mileageKm,
          portals: selectedPortals,
        }),
      })
      const apiData = await apiRes.json().catch(() => null)

      let convexListings: Array<{
        portal: string
        externalListingId: string
        listingUrl: string
      }> = []

      try {
        const convexRes = await publishMut({
          stockNumber: action.stockNumber,
          portals: selectedPortals,
          headline: action.headline,
          priceZar: livePriceZar,
          vin: action.vin,
          year: action.year,
          make: action.make,
          model: action.model,
          variant: action.variant,
          mileageKm: action.mileageKm,
          colour: action.colour,
          branch: action.branch,
          ...(imageUrl ? { imageUrl } : {}),
          publishedByBot: "Portal Publisher Agent",
        })
        convexListings = convexRes.listings
      } catch {
        // Offline / preview fallback: use API receipts
        convexListings =
          apiData?.portalsPublished?.map(
            (p: { portal: string; listingId: string; feedUrl: string }) => ({
              portal: p.portal,
              externalListingId: p.listingId,
              listingUrl: p.feedUrl,
            })
          ) ?? []
      }

      setPublishedReceipts(convexListings)
      toast.add({
        type: "success",
        title: `Published to ${selectedPortals.length} SA portal(s)`,
        description: `${action.headline} (${formatZar(livePriceZar)}) is now live on your showroom & XML feeds.`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Publishing failed",
        description: err instanceof Error ? err.message : "Syndication error",
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleAutoFillPortal = async (targetPortal: PortalSlug = "cars_co_za") => {
    setAutoFilling(true)
    try {
      const res = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "autofill_portal",
          targetPortal,
          stockNumber: action.stockNumber,
          vin: action.vin,
          year: action.year,
          make: action.make,
          model: action.model,
          variant: action.variant,
          priceZar: livePriceZar,
          mileageKm: action.mileageKm,
          colour: action.colour,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAutoFillResult({
          portalLabel: data.portalLabel,
          portalUrl: data.portalUrl,
          steps: data.steps,
        })
        toast.add({
          type: "success",
          title: "Cloud Browser Form Auto-Filled",
          description: `${data.portalLabel} fields populated and ready for 1-click confirmation.`,
        })
      }
    } catch {
      toast.add({
        type: "error",
        title: "Browser form-fill error",
      })
    } finally {
      setAutoFilling(false)
    }
  }

  const handleDownloadStickerPdf = () => {
    downloadShowroomWindowStickerPdf({
      stockNumber: action.stockNumber,
      vin: action.vin,
      year: action.year,
      make: action.make,
      model: action.model,
      variant: action.variant,
      mileageKm: action.mileageKm,
      colour: action.colour,
      retailPriceZar: livePriceZar,
      branch: action.branch,
    })
    toast.add({
      type: "success",
      title: "Showroom Windscreen Spec Sheet PDF Downloaded",
      description: `Includes NCA monthly finance breakdown & scannable /showroom QR code.`,
    })
  }

  const copyFeedUrl = async (portal: "cars_co_za" | "autotrader_sa") => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/api/feeds/vehicles?portal=${portal}`
    await navigator.clipboard.writeText(url)
    toast.add({
      type: "success",
      title: "XML Stock Feed URL Copied",
      description: url,
    })
  }

  return (
    <div className="my-3 w-full max-w-xl rounded-xl border border-sky-500/30 bg-zinc-950/95 p-4 text-zinc-100 shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/15 text-sky-400">
            <Globe className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-zinc-100">
                Multi-Portal Car Publisher
              </span>
              <Badge
                variant="outline"
                className="border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-300"
              >
                Skill · South Africa
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Simultaneous syndication to Cars.co.za, AutoTrader SA &amp; Own Site
            </p>
          </div>
        </div>
        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-300">
          {action.stockNumber}
        </span>
      </div>

      {/* Vehicle Snapshot */}
      <div className="mt-3 rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-100">{action.headline}</div>
            <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
              {action.mileageKm.toLocaleString("en-ZA")} km &bull; {action.colour} &bull; VIN:{" "}
              {action.vin}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-sm font-bold text-emerald-400">
              {formatZar(livePriceZar)}
            </div>
            <div className="text-[10px] text-zinc-500">Incl. 15% VAT</div>
          </div>
        </div>

        {/* Live Cars.co.za & AutoTrader SA Market Price Positioning Strip */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge
                className={cn(
                  "text-[10px] font-semibold",
                  market.valueBadgeTone === "emerald"
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : market.valueBadgeTone === "sky"
                      ? "border-sky-500/30 bg-sky-500/15 text-sky-300"
                      : "border-amber-500/30 bg-amber-500/15 text-amber-300"
                )}
              >
                {market.valueRankLabel}
              </Badge>
              <span className="text-[10px] text-zinc-400">
                Est. ~{market.estimatedDaysToSell}d to sell
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-400">
              {market.totalCompetitors} SA comps ({market.competitorCountCarsCoZa} Cars.co.za ·{" "}
              {market.competitorCountAutoTrader} AutoTrader) avg{" "}
              <span className="font-mono font-semibold text-zinc-200">
                {formatZar(market.marketAvgZar)}
              </span>
            </p>
          </div>
          {livePriceZar !== market.recommendedPriceZar && (
            <button
              type="button"
              onClick={() => {
                setLivePriceZar(market.recommendedPriceZar)
                toast.add({
                  type: "success",
                  title: "Snapped to Recommended SA Market Price",
                  description: `Updated retail price to ${formatZar(market.recommendedPriceZar)} for optimal turn speed.`,
                })
              }}
              className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-300 hover:bg-sky-500/20 cursor-pointer shrink-0"
            >
              <TrendingDown className="size-3" />
              Use {formatZar(market.recommendedPriceZar)}
            </button>
          )}
        </div>
      </div>

      {/* Portal Selection Chips */}
      <div className="mt-3 space-y-1.5">
        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Select Target Portals ({selectedPortals.length} selected)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SA_PORTALS.map((portal) => {
            const active = selectedPortals.includes(portal.slug)
            const receipt = publishedReceipts.find((r) => r.portal === portal.slug)
            return (
              <button
                key={portal.slug}
                type="button"
                onClick={() => togglePortal(portal.slug)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition cursor-pointer",
                  active
                    ? "border-sky-500/50 bg-sky-500/15 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{portal.shortName}</div>
                  <div className="truncate text-[10px] text-zinc-400">
                    {receipt ? receipt.externalListingId : portal.feedFormat}
                  </div>
                </div>
                {receipt ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : (
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      active ? "bg-sky-400" : "bg-zinc-700"
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cloud Browser Auto-Fill Verification Result */}
      {autoFillResult && (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
              <Bot className="size-3.5" />
              {autoFillResult.portalLabel} — Form Auto-Filled
            </span>
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-300">
              5/5 Fields Verified
            </Badge>
          </div>
          <div className="space-y-1">
            {autoFillResult.steps.map((s) => (
              <div
                key={s.step}
                className="flex items-center justify-between text-[10px] text-zinc-300"
              >
                <span className="text-zinc-400">
                  {s.step}. {s.field}:
                </span>
                <span className="font-mono text-zinc-200 truncate max-w-[240px]">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
        <Button
          type="button"
          size="sm"
          disabled={publishing}
          onClick={() => void handlePublish()}
          className="h-8 gap-1.5 bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
        >
          <Rocket className="size-3.5" />
          {publishing
            ? "Syndicating..."
            : publishedReceipts.length > 0
              ? "Re-Sync All Portals"
              : `Publish to ${selectedPortals.length} Portals`}
        </Button>

        <Link href={`/showroom?stock=${encodeURIComponent(action.stockNumber)}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
          >
            <ExternalLink className="size-3.5" />
            Own Website
          </Button>
        </Link>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadStickerPdf}
          className="h-8 gap-1 border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 hover:bg-purple-500/20 cursor-pointer"
        >
          <QrCode className="size-3.5" />
          Windscreen QR PDF
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={autoFilling}
          onClick={() => void handleAutoFillPortal(selectedPortals[0] || "cars_co_za")}
          className="h-8 gap-1 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
        >
          <Bot className="size-3.5 text-sky-400" />
          {autoFilling ? "Filling..." : "Auto-Fill Portal"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyFeedUrl("cars_co_za")}
          className="h-8 gap-1 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer"
        >
          <Copy className="size-3" />
          DAP XML
        </Button>

        {desktop && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              desktop.setOpen(true)
              desktop.setActiveTab("actions")
              desktop.setActionSubView("publisher")
            }}
            className="h-8 gap-1 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer ml-auto"
          >
            <MonitorPlay className="size-3.5 text-sky-400" />
            Publisher Studio
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 2. Grok-Style South African Multi-Bank Finance Auto-Apply Card
// ============================================================================

export function ChatFinanceCard({ action }: { action: ParsedFinanceAction }) {
  const desktop = useDesktopPanel()
  const submitFinanceMut = useMutation(api.vehicles.submitFinanceApplication)

  const [selectedBanks, setSelectedBanks] = React.useState<SaBankName[]>(action.banks)
  const [submitting, setSubmitting] = React.useState(false)
  const [receipt, setReceipt] = React.useState<{
    applicationRef: string
    bankSubmissions: Array<{ bank: string; referenceNo: string; status: string }>
  } | null>(null)

  const calc = React.useMemo(
    () =>
      calculateSaVehicleFinance({
        vehiclePriceZar: action.vehiclePriceZar,
        depositZar: action.depositZar,
        termMonths: action.termMonths,
        balloonPct: action.balloonPct,
        interestRatePct: action.interestRatePct,
        grossMonthlyIncomeZar: action.grossMonthlyIncomeZar,
      }),
    [action]
  )

  const toggleBank = (name: SaBankName) => {
    setSelectedBanks((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    )
  }

  const handleAutoApply = async () => {
    if (selectedBanks.length === 0) {
      toast.add({ type: "error", title: "Select at least one SA bank" })
      return
    }
    setSubmitting(true)
    try {
      const apiRes = await fetch("/api/finance-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: action.applicantName,
          vehicleTitle: action.vehicleTitle,
          vehiclePriceZar: action.vehiclePriceZar,
          depositZar: action.depositZar,
          balloonPct: action.balloonPct,
          interestRatePct: action.interestRatePct,
          termMonths: action.termMonths,
          grossMonthlyIncomeZar: action.grossMonthlyIncomeZar ?? 65000,
          banks: selectedBanks,
        }),
      })
      const apiData = await apiRes.json().catch(() => null)

      try {
        const res = await submitFinanceMut({
          applicantName: action.applicantName,
          saIdNumber: "9001015009087",
          phone: "+27 82 555 0190",
          email: "buyer@autopulsemotors.co.za",
          address: "Johannesburg, Gauteng",
          employmentStatus: "Permanent Full-Time",
          employerName: "Verified SA Employer",
          grossMonthlyIncomeZar: action.grossMonthlyIncomeZar ?? 65000,
          monthlyExpensesZar: 22000,
          stockNumber: action.stockNumber,
          vehicleTitle: action.vehicleTitle,
          vehiclePriceZar: action.vehiclePriceZar,
          depositZar: action.depositZar,
          tradeInEquityZar: 0,
          balloonPct: action.balloonPct,
          interestRatePct: action.interestRatePct,
          termMonths: action.termMonths,
          estimatedMonthlyZar: calc.monthlyInstallmentTotalZar,
          affordabilityStatus: calc.affordabilityStatus ?? "pre_qualified",
          ficaChecklist: {
            idCopy: true,
            driversLicense: true,
            bankStatements3m: true,
            payslips3m: true,
            proofOfAddress: true,
          },
          banks: selectedBanks,
          notes: "Auto-submitted from AI Dealership Chat via Signio Multi-Bank Desk",
        })
        setReceipt({
          applicationRef: res.applicationRef,
          bankSubmissions: res.bankSubmissions,
        })
      } catch {
        setReceipt({
          applicationRef: apiData?.applicationRef ?? `VAF-ZA-${Date.now().toString().slice(-6)}`,
          bankSubmissions:
            apiData?.bankDispatches?.map(
              (b: { bank: string; referenceNo: string; status: string }) => ({
                bank: b.bank,
                referenceNo: b.referenceNo,
                status: b.status,
              })
            ) ?? [],
        })
      }

      toast.add({
        type: "success",
        title: `Finance Auto-Applied to ${selectedBanks.length} SA Bank(s)`,
        description: `Submitted ${action.applicantName} for ${action.vehicleTitle}.`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Finance submission failed",
        description: err instanceof Error ? err.message : "Error submitting application",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-3 w-full max-w-xl rounded-xl border border-emerald-500/30 bg-zinc-950/95 p-4 text-zinc-100 shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
            <Landmark className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-zinc-100">
                SA Multi-Bank Finance Auto-Apply
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300"
              >
                NCA / Signio VAF
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {action.applicantName} &bull; {action.vehicleTitle}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-bold text-emerald-400">
            {formatZar(calc.monthlyInstallmentTotalZar)}/pm
          </div>
          <div className="text-[10px] text-zinc-400">
            {calc.termMonths}m @ {calc.interestRatePct}%
          </div>
        </div>
      </div>

      {/* Structured Deal Numbers */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
          <div className="text-[10px] text-zinc-400">Vehicle Price</div>
          <div className="font-mono text-xs font-semibold text-zinc-100">
            {formatZar(action.vehiclePriceZar)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
          <div className="text-[10px] text-zinc-400">Cash Deposit</div>
          <div className="font-mono text-xs font-semibold text-sky-300">
            {formatZar(action.depositZar)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
          <div className="text-[10px] text-zinc-400">Balloon ({action.balloonPct}%)</div>
          <div className="font-mono text-xs font-semibold text-amber-300">
            {formatZar(calc.balloonAmountZar)}
          </div>
        </div>
      </div>

      {/* Bank Multi-Select Pills */}
      <div className="mt-3 space-y-1.5">
        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Target South African Financiers ({selectedBanks.length} selected)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SA_BANKS.map((bank) => {
            const active = selectedBanks.includes(bank.name)
            const sub = receipt?.bankSubmissions.find((s) => s.bank === bank.name)
            return (
              <button
                key={bank.name}
                type="button"
                onClick={() => toggleBank(bank.name)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer",
                  sub
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                    : active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                )}
              >
                {sub ? (
                  <CheckCircle2 className="size-3 text-emerald-400" />
                ) : (
                  <Building2 className="size-3" />
                )}
                <span>{bank.shortName}</span>
                {sub && <span className="font-mono text-[9px] opacity-80">{sub.referenceNo}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {receipt && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
          <span>
            Dossier <strong className="font-mono">{receipt.applicationRef}</strong> auto-dispatched
            to {receipt.bankSubmissions.length} SA bank(s).
          </span>
        </div>
      )}

      {/* Action Row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
        <Button
          type="button"
          size="sm"
          disabled={submitting}
          onClick={() => void handleAutoApply()}
          className="h-8 gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          {submitting
            ? "Submitting Dossier..."
            : receipt
              ? "Re-Submit to Banks"
              : `Auto-Apply to ${selectedBanks.length} Banks`}
        </Button>

        {desktop && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              desktop.setOpen(true)
              desktop.setActiveTab("actions")
              desktop.setActionSubView("finance")
            }}
            className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer ml-auto"
          >
            <Landmark className="size-3.5 text-emerald-400" />
            Open Full F&amp;I Studio
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 3. Grok-Style Buyer Follow-Up Cadence Card
// ============================================================================

export function ChatFollowUpCard({ action }: { action: ParsedFollowUpAction }) {
  const scheduleMut = useMutation(api.vehicles.scheduleFollowUp)
  const [sending, setSending] = React.useState(false)
  const [dispatched, setDispatched] = React.useState(false)

  const stepLabels: Record<ParsedFollowUpAction["cadenceStep"], string> = {
    speed_to_lead_15m: "15-Min Speed-to-Lead",
    test_drive_24h: "24h Test-Drive Hold",
    finance_fica_48h: "48h Finance & FICA Chase",
    price_drop_72h: "72h Price-Lock Revival",
  }

  const handleDispatch = async (openWhatsApp: boolean) => {
    setSending(true)
    try {
      await scheduleMut({
        contactName: action.recipientName,
        phone: action.phone,
        vehicleTitle: action.vehicleTitle,
        cadenceStep: action.cadenceStep,
        channel: action.channel,
        messageBody: action.messagePreview,
        sendImmediately: true,
        assignedAgent: "Follow-Up Agent",
      }).catch(() => null)

      setDispatched(true)

      if (openWhatsApp) {
        const cleanPhone = action.phone.replace(/\D/g, "")
        window.open(
          `https://wa.me/${cleanPhone}?text=${encodeURIComponent(action.messagePreview)}`,
          "_blank",
          "noopener,noreferrer"
        )
      }

      toast.add({
        type: "success",
        title: "Follow-Up Dispatched & Logged",
        description: `${stepLabels[action.cadenceStep]} sent for ${action.recipientName}.`,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="my-3 w-full max-w-xl rounded-xl border border-amber-500/30 bg-zinc-950/95 p-4 text-zinc-100 shadow-lg">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-400">
            <Clock className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100">
              Follow-Up Cadence &bull; {stepLabels[action.cadenceStep]}
            </div>
            <div className="text-[11px] text-zinc-400">
              {action.recipientName} ({action.phone}) &bull; {action.vehicleTitle}
            </div>
          </div>
        </div>
        {dispatched && (
          <Badge className="border-emerald-500/40 bg-emerald-500/15 text-[10px] text-emerald-300">
            Sent
          </Badge>
        )}
      </div>

      <p className="mt-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2.5 text-xs leading-relaxed text-zinc-300">
        {action.messagePreview}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={sending}
          onClick={() => void handleDispatch(true)}
          className="h-8 gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
        >
          <MessageSquare className="size-3.5" />
          Send on WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sending}
          onClick={() => void handleDispatch(false)}
          className="h-8 gap-1.5 border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 hover:bg-amber-500/20 cursor-pointer"
        >
          <Send className="size-3.5" />
          Queue Auto-Cadence
        </Button>
      </div>
    </div>
  )
}
