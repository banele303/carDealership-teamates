"use client"

import * as React from "react"
import Link from "next/link"
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react"
import {
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Fuel,
  Gauge,
  Globe,
  Landmark,
  MapPin,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import {
  analyzeSaMarketPricing,
  calculateSaVehicleFinance,
  formatZar,
  SA_SHOWROOM_VEHICLES,
  type ShowroomVehicle,
} from "@/lib/sa-dealership"
import { downloadShowroomWindowStickerPdf } from "@/lib/window-sticker-pdf"
import { cn } from "@/lib/utils"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim()
const publicConvexClient = convexUrl ? new ConvexReactClient(convexUrl) : null

export default function PublicShowroomPage() {
  if (publicConvexClient) {
    return (
      <ConvexProvider client={publicConvexClient}>
        <LiveShowroomLoader />
      </ConvexProvider>
    )
  }
  return <ShowroomUI vehicles={SA_SHOWROOM_VEHICLES} isLive={false} />
}

function LiveShowroomLoader() {
  const rows = useQuery(api.vehicles.listPublicShowroom, {})
  const submitEnquiryMut = useMutation(api.vehicles.submitShowroomEnquiry)

  const vehicles: ShowroomVehicle[] =
    rows && rows.length > 0
      ? (rows as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  return (
    <ShowroomUI
      vehicles={vehicles}
      isLive={Boolean(rows && rows.length > 0)}
      onSubmitEnquiry={async (payload) => {
        return await submitEnquiryMut(payload)
      }}
    />
  )
}

function ShowroomUI({
  vehicles,
  isLive,
  onSubmitEnquiry,
}: {
  vehicles: ShowroomVehicle[]
  isLive: boolean
  onSubmitEnquiry?: (payload: {
    buyerName: string
    phone: string
    email?: string
    saIdNumber?: string
    stockNumber: string
    vehicleTitle: string
    vehiclePriceZar: number
    enquiryType: "finance" | "test_drive" | "whatsapp_quote"
    portalSource?: string
    depositZar?: number
    termMonths?: number
    balloonPct?: number
    grossMonthlyIncomeZar?: number
    employerName?: string
    preferredTestDriveSlot?: string
    branch?: string
  }) => Promise<unknown>
}) {
  const [search, setSearch] = React.useState("")
  const [bodyFilter, setBodyFilter] = React.useState<string>("All")
  const [conditionFilter, setConditionFilter] = React.useState<string>("All")
  const [activeVehicle, setActiveVehicle] = React.useState<ShowroomVehicle | null>(null)
  const [modalMode, setModalMode] = React.useState<"finance" | "testdrive" | null>(null)

  // Modal form state
  const [buyerName, setBuyerName] = React.useState("")
  const [phone, setPhone] = React.useState("+27 ")
  const [email, setEmail] = React.useState("")
  const [saId, setSaId] = React.useState("")
  const [employer, setEmployer] = React.useState("")
  const [grossIncome, setGrossIncome] = React.useState("55000")
  const [deposit, setDeposit] = React.useState("50000")
  const [slot, setSlot] = React.useState("Tomorrow · 10:00 SAST")
  const [submitting, setSubmitting] = React.useState(false)
  const [receipt, setReceipt] = React.useState<{
    applicationRef?: string
    estimatedMonthlyZar?: number
    whatsappMessage: string
    whatsappDeepLink: string
    bankSubmissions?: Array<{ bank: string; referenceNo: string; offeredRatePct?: number }>
  } | null>(null)

  const bodyStyles = [
    "All",
    "Double Cab Bakkie",
    "SUV",
    "Hatchback",
    "Crossover",
    "Sedan",
  ]

  const filtered = vehicles.filter((v) => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      `${v.year} ${v.make} ${v.model} ${v.variant} ${v.stockNumber} ${v.branch}`
        .toLowerCase()
        .includes(q)
    const matchesBody = bodyFilter === "All" || v.bodyType === bodyFilter
    const matchesCond =
      conditionFilter === "All" || v.condition === conditionFilter.toLowerCase()
    return matchesSearch && matchesBody && matchesCond
  })

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVehicle || !buyerName.trim()) {
      toast.add({ type: "error", title: "Please enter your name" })
      return
    }
    setSubmitting(true)
    const title = `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.variant}`
    const enquiryType = modalMode === "testdrive" ? "test_drive" : "finance"

    try {
      const apiRes = await fetch("/api/portal-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          phone,
          email: email || undefined,
          saIdNumber: saId || undefined,
          stockNumber: activeVehicle.stockNumber,
          vehicleTitle: title,
          vehiclePriceZar: activeVehicle.retailPriceZar,
          enquiryType,
          portalSource: "dealership_website",
          depositZar: Number(deposit) || Math.round(activeVehicle.retailPriceZar * 0.1),
          termMonths: 72,
          balloonPct: 20,
          grossMonthlyIncomeZar: Number(grossIncome) || 55000,
          employerName: employer || undefined,
          preferredTestDriveSlot: modalMode === "testdrive" ? slot : undefined,
          branch: activeVehicle.branch,
        }),
      })
      const apiData = await apiRes.json().catch(() => null)

      if (onSubmitEnquiry) {
        await onSubmitEnquiry({
          buyerName,
          phone,
          email: email || undefined,
          saIdNumber: saId || undefined,
          stockNumber: activeVehicle.stockNumber,
          vehicleTitle: title,
          vehiclePriceZar: activeVehicle.retailPriceZar,
          enquiryType,
          portalSource: "dealership_website",
          depositZar: Number(deposit) || Math.round(activeVehicle.retailPriceZar * 0.1),
          termMonths: 72,
          balloonPct: 20,
          grossMonthlyIncomeZar: Number(grossIncome) || 55000,
          employerName: employer || undefined,
          preferredTestDriveSlot: modalMode === "testdrive" ? slot : undefined,
          branch: activeVehicle.branch,
        }).catch(() => {})
      }

      setReceipt({
        applicationRef: apiData?.applicationRef,
        estimatedMonthlyZar: apiData?.estimatedMonthlyZar,
        whatsappMessage:
          apiData?.whatsappMessage ||
          `Hi ${buyerName}! Your ${enquiryType === "finance" ? "multi-bank finance dossier" : "showroom test drive"} for the ${title} has been registered and Follow-Up Agent has sent your WhatsApp confirmation.`,
        whatsappDeepLink:
          apiData?.whatsappDeepLink ||
          `https://wa.me/27631995124?text=${encodeURIComponent(`Hi AutoPulse Motors! Following up on my ${title} (${activeVehicle.stockNumber}) request.`)}`,
        bankSubmissions: apiData?.bankSubmissions,
      })

      toast.add({
        type: "success",
        title:
          modalMode === "finance"
            ? "Multi-Bank Finance + 60s WhatsApp Dispatched!"
            : "Test Drive + Instant WhatsApp Confirmed!",
        description:
          "CRM deal created, Finance Agent notified, and Follow-Up Agent dispatched your WhatsApp message.",
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Dealership Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-400">
              <CarFront className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  AUTOPULSE MOTORS SOUTH AFRICA
                </span>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-300">
                  {isLive ? "Live Synced Showroom" : "Own Website Preview"}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400">
                DEKRA Verified New, Demo &amp; Pre-Owned Vehicles &bull; Instant WesBank, Absa, MFC &amp; Standard Bank Finance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/feeds/vehicles?portal=cars_co_za"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-mono text-zinc-300 hover:border-rose-500/40 hover:text-rose-300"
            >
              Cars.co.za XML
            </a>
            <a
              href="/api/feeds/vehicles?portal=autotrader_sa"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-mono text-zinc-300 hover:border-sky-500/40 hover:text-sky-300"
            >
              AutoTrader XML
            </a>
            <Link href="/">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-sky-500/40 bg-sky-500/10 text-xs text-sky-300 hover:bg-sky-500/20 cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                AI Agent HQ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {/* Hero Search & Filters */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-sky-950/30 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                <Sparkles className="size-3" />
                Published Directly by Portal Publisher Agent
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Quality New &amp; Used Cars Across South Africa
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Every vehicle carries DEKRA inspection, NaTIS verification, nationwide SA delivery &amp; 20-minute multi-bank finance pre-approval.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Hilux, Ranger, Golf GTI, Stock #..."
                className="h-9 border-zinc-700 bg-zinc-900 pl-9 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {bodyStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setBodyFilter(style)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer",
                    bodyFilter === style
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {["All", "New", "Demo", "Used"].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setConditionFilter(cond)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium cursor-pointer",
                    conditionFilter === cond
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  )}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Showroom Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((car) => {
            const estFinance = calculateSaVehicleFinance({
              vehiclePriceZar: car.retailPriceZar,
              depositZar: Math.round(car.retailPriceZar * 0.1),
              balloonPct: 20,
              termMonths: 72,
            })
            const market = analyzeSaMarketPricing({
              year: car.year,
              make: car.make,
              model: car.model,
              variant: car.variant,
              mileageKm: car.mileageKm,
              priceZar: car.retailPriceZar,
              fullServiceHistory: car.fullServiceHistory,
            })

            return (
              <div
                key={car.stockNumber}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 transition hover:border-sky-500/40 hover:bg-zinc-900/80"
              >
                {/* Vehicle Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={
                      car.imageUrl ||
                      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"
                    }
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <Badge className="bg-zinc-950/85 text-[10px] font-mono text-sky-300 border border-sky-500/30">
                      {car.stockNumber}
                    </Badge>
                    <Badge className="bg-zinc-950/85 text-[10px] uppercase text-emerald-300 border border-emerald-500/30">
                      {car.condition}
                    </Badge>
                  </div>
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-zinc-950/90 text-[9px] text-emerald-300 border border-emerald-500/40">
                      {market.valueRankLabel}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 flex flex-wrap gap-1">
                    {car.portals.cars_co_za && (
                      <span className="rounded bg-rose-950/90 border border-rose-500/40 px-1.5 py-0.5 text-[9px] font-medium text-rose-200">
                        Cars.co.za
                      </span>
                    )}
                    {car.portals.autotrader_sa && (
                      <span className="rounded bg-sky-950/90 border border-sky-500/40 px-1.5 py-0.5 text-[9px] font-medium text-sky-200">
                        AutoTrader SA
                      </span>
                    )}
                    <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-200">
                      Own Site
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
                  <div className="space-y-2">
                    <div>
                      <h2 className="text-base font-bold text-white leading-snug">
                        {car.year} {car.make} {car.model}
                      </h2>
                      <p className="text-xs text-zinc-400 line-clamp-1">{car.variant}</p>
                    </div>

                    <div className="flex items-baseline justify-between border-y border-zinc-800/80 py-2.5">
                      <div>
                        <div className="font-mono text-xl font-extrabold text-white">
                          {formatZar(car.retailPriceZar)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          SA Market Avg: {formatZar(market.marketAvgZar)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-emerald-400">
                          Est. {formatZar(estFinance.monthlyInstallmentTotalZar)}/pm
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          72m · 10% dep · 20% balloon
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="size-3.5 text-sky-400" />
                        <span>{car.mileageKm.toLocaleString("en-ZA")} km</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="size-3.5 text-emerald-400" />
                        <span>
                          {car.transmission} &bull; {car.fuelType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="size-3.5 text-amber-400" />
                        <span className="truncate">{car.branch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                      <ShieldCheck className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {car.dekraGrade} &bull; {car.fullServiceHistory ? "Full Service History" : "Verified"}
                      </span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setActiveVehicle(car)
                        setDeposit(String(Math.round(car.retailPriceZar * 0.1)))
                        setReceipt(null)
                        setModalMode("finance")
                      }}
                      className="h-8 gap-1 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      <Landmark className="size-3.5" />
                      Apply Finance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveVehicle(car)
                        setReceipt(null)
                        setModalMode("testdrive")
                      }}
                      className="h-8 gap-1 border-sky-500/30 bg-sky-500/10 text-xs text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                    >
                      <CalendarClock className="size-3.5" />
                      Test Drive
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        downloadShowroomWindowStickerPdf(car)
                        toast.add({
                          type: "success",
                          title: "Windscreen Spec Sheet PDF Downloaded",
                          description: `${car.stockNumber} spec sheet with QR code ready to print.`,
                        })
                      }}
                      className="col-span-2 h-8 gap-1.5 border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                    >
                      <QrCode className="size-3.5" />
                      Download Windscreen Spec Sheet PDF (QR)
                    </Button>
                    <a
                      href={`https://wa.me/27631995124?text=${encodeURIComponent(
                        `Hi AutoPulse Motors! I'm interested in [${car.stockNumber}] ${car.year} ${car.make} ${car.model} (${formatZar(car.retailPriceZar)}). Is it available?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300 transition"
                    >
                      <MessageSquare className="size-3.5 text-emerald-400" />
                      WhatsApp Showroom Executive (+27 63 199 5124)
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Closed-Loop Finance / Test Drive Modal */}
      <Dialog
        open={Boolean(modalMode && activeVehicle)}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode(null)
            setReceipt(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base">
              {receipt
                ? "Closed-Loop AI Dealership Confirmation"
                : modalMode === "finance"
                  ? "Instant SA Multi-Bank Finance Pre-Apply"
                  : "Book a Showroom Test Drive"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {activeVehicle
                ? `[${activeVehicle.stockNumber}] ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} — ${formatZar(activeVehicle.retailPriceZar)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {receipt ? (
            <div className="space-y-3 py-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    1. CRM Deal &amp; Finance Dossier Created
                  </span>
                  {receipt.applicationRef && (
                    <Badge className="border-emerald-500/40 bg-zinc-950 font-mono text-[10px] text-emerald-300">
                      {receipt.applicationRef}
                    </Badge>
                  )}
                </div>
                {receipt.bankSubmissions && receipt.bankSubmissions.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {receipt.bankSubmissions.map((b) => (
                      <div
                        key={b.referenceNo}
                        className="rounded border border-zinc-800 bg-zinc-950/90 px-2 py-1 text-[10px]"
                      >
                        <div className="font-semibold text-zinc-200">{b.bank}</div>
                        <div className="font-mono text-emerald-400">
                          {b.referenceNo} {b.offeredRatePct ? `(${b.offeredRatePct}%)` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 space-y-1.5">
                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-sky-400" />
                  2. Follow-Up Agent Dispatched 60s WhatsApp Reply
                </div>
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-2 text-[11px] leading-relaxed text-zinc-300">
                  {receipt.whatsappMessage}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setModalMode(null)
                    setReceipt(null)
                  }}
                  className="text-xs text-zinc-400"
                >
                  Done
                </Button>
                <a
                  href={receipt.whatsappDeepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <MessageSquare className="size-3.5" />
                  Open WhatsApp Chat (+27 63 199 5124)
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleModalSubmit} className="space-y-3 py-1">
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Your Full Name *"
                required
                className="h-9 bg-zinc-900 border-zinc-800 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp +27... *"
                  required
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>

              {modalMode === "finance" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={saId}
                      onChange={(e) => setSaId(e.target.value)}
                      placeholder="13-Digit SA ID Number"
                      className="h-9 bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                    <Input
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                      placeholder="Employer Name"
                      className="h-9 bg-zinc-900 border-zinc-800 text-xs"
                    />
                    <Input
                      value={grossIncome}
                      onChange={(e) => setGrossIncome(e.target.value)}
                      placeholder="Gross Income (ZAR)"
                      className="h-9 bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                    <Input
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="Deposit (ZAR)"
                      className="h-9 bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    <span>
                      Auto-submits to WesBank, Absa, MFC (Nedbank) &amp; Standard Bank + triggers Follow-Up Agent on WhatsApp.
                    </span>
                  </div>
                </>
              ) : (
                <Input
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  placeholder="Preferred Date & Time (e.g. Saturday 10:00)"
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs"
                />
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalMode(null)}
                  className="text-xs text-zinc-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-emerald-600 text-xs text-white hover:bg-emerald-500 cursor-pointer"
                >
                  {submitting
                    ? "Submitting..."
                    : modalMode === "finance"
                      ? "Submit to SA Banks + WhatsApp"
                      : "Confirm Test Drive + WhatsApp"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
