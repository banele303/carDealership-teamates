"use client"

import * as React from "react"
import Link from "next/link"
import { useAction, useMutation, useQuery } from "convex/react"
import {
  CarFront,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react"

import { useConvexReady } from "@/components/autopulse/convex-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { decodeVin, type DecodedVin } from "@/convex/lib/vin"
import {
  calculateSaVehicleFinance,
  formatZar,
  SA_SHOWROOM_VEHICLES,
  type ShowroomVehicle,
} from "@/lib/sa-dealership"

interface KbDocItem {
  _id: string
  title: string
  fileName: string
  status: "processing" | "ready" | "failed" | "uploaded"
  chunkCount: number
  error?: string
  createdAt: number
}

export default function ShowroomAndKnowledgePage() {
  const convexReady = useConvexReady()
  return convexReady ? <LiveShowroomStock /> : <PreviewShowroomStock />
}

function LiveShowroomStock() {
  const dbVehicles = useQuery(api.vehicles.listVehicles, { limit: 100 })
  const kbDocs = useQuery(api.dashboard.listKbDocuments, {})
  const upsertVehicleMut = useMutation(api.vehicles.upsertVehicle)
  const publishMut = useMutation(api.vehicles.publishToPortals)
  const seedMut = useMutation(api.vehicles.seedDealershipData)
  const decodeVinServer = useAction(api.dashboard.decodeVinAction)
  const generateUploadUrl = useMutation(api.dashboard.generateUploadUrl)
  const registerKbDoc = useMutation(api.dashboard.registerKbDocument)

  const vehicles: ShowroomVehicle[] =
    dbVehicles && dbVehicles.length > 0
      ? (dbVehicles as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  return (
    <ShowroomStockUI
      liveMode
      isSeeded={Boolean(dbVehicles && dbVehicles.length > 0)}
      vehicles={vehicles}
      kbDocs={(kbDocs as KbDocItem[] | undefined) ?? []}
      onSeed={async () => {
        const res = await seedMut({})
        toast.add({
          type: "success",
          title: res.seeded ? "Seeded 10 SA Showroom Vehicles" : "Showroom Ready",
          description: res.seeded
            ? "Loaded Toyota Hilux, Ford Ranger, VW Golf 8 GTI, BMW X3, Polo Vivo & more."
            : res.message,
        })
      }}
      onAddVehicle={async (vPayload) => {
        await upsertVehicleMut(vPayload)
      }}
      onPublishAll={async (car) => {
        await publishMut({
          stockNumber: car.stockNumber,
          portals: ["cars_co_za", "autotrader_sa", "dealership_website", "facebook_marketplace"],
          headline: `${car.year} ${car.make} ${car.model} ${car.variant}`,
          priceZar: car.retailPriceZar,
          publishedByBot: "Portal Publisher Agent",
        })
      }}
      onDecodeVin={(vin) => decodeVinServer({ vin })}
      onUploadFile={async (file) => {
        const uploadUrl = await generateUploadUrl({})
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "text/plain" },
          body: file,
        })
        if (!res.ok) throw new Error(`Storage upload failed (${res.status})`)
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
        await registerKbDoc({
          title: file.name.replace(/\.[^.]+$/, ""),
          fileName: file.name,
          mimeType: file.type || "text/plain",
          storageId,
        })
      }}
    />
  )
}

function PreviewShowroomStock() {
  const [vehicles, setVehicles] = React.useState<ShowroomVehicle[]>(SA_SHOWROOM_VEHICLES)
  return (
    <ShowroomStockUI
      liveMode={false}
      isSeeded
      vehicles={vehicles}
      kbDocs={[
        {
          _id: "kb_1",
          title: "WesBank & MFC 2026 Dealer Rate Card (ZA)",
          fileName: "SA_VAF_Bank_Rate_Card_2026.pdf",
          status: "ready",
          chunkCount: 18,
          createdAt: Date.now() - 86_400_000,
        },
        {
          _id: "kb_2",
          title: "Motorite & Innovation Group Extended Warranty Guide",
          fileName: "SA_VAPs_Warranty_Tiers.pdf",
          status: "ready",
          chunkCount: 24,
          createdAt: Date.now() - 172_800_000,
        },
      ]}
      onAddVehicle={async (vPayload) => {
        setVehicles((prev) => [
          {
            stockNumber: vPayload.stockNumber,
            vin: vPayload.vin,
            year: vPayload.year,
            make: vPayload.make,
            model: vPayload.model,
            variant: vPayload.variant,
            bodyType: vPayload.bodyType as ShowroomVehicle["bodyType"],
            condition: vPayload.condition,
            mileageKm: vPayload.mileageKm,
            transmission: vPayload.transmission as ShowroomVehicle["transmission"],
            fuelType: vPayload.fuelType as ShowroomVehicle["fuelType"],
            colour: vPayload.colour,
            engineSpec: vPayload.engineSpec || "",
            retailPriceZar: vPayload.retailPriceZar,
            costPriceZar: vPayload.costPriceZar,
            tradeInValueZar: vPayload.tradeInValueZar,
            otrFeeZar: 6500,
            daysInStock: 1,
            branch: vPayload.branch,
            fullServiceHistory: vPayload.fullServiceHistory,
            spareKeys: vPayload.spareKeys,
            dekraGrade: "DEKRA Platinum",
            natisStatus: "On Hand",
            status: "available",
            features: vPayload.features,
            description: vPayload.description,
            portals: {
              cars_co_za: true,
              autotrader_sa: true,
              dealership_website: true,
              facebook_marketplace: false,
            },
          },
          ...prev,
        ])
      }}
      onPublishAll={async (car) => {
        setVehicles((prev) =>
          prev.map((v) =>
            v.stockNumber === car.stockNumber
              ? {
                  ...v,
                  portals: {
                    cars_co_za: true,
                    autotrader_sa: true,
                    dealership_website: true,
                    facebook_marketplace: true,
                  },
                }
              : v
          )
        )
      }}
      onDecodeVin={(vin) => decodeVin(vin)}
    />
  )
}

function ShowroomStockUI({
  liveMode,
  isSeeded,
  vehicles,
  kbDocs,
  onSeed,
  onAddVehicle,
  onPublishAll,
  onDecodeVin,
  onUploadFile,
}: {
  liveMode: boolean
  isSeeded: boolean
  vehicles: ShowroomVehicle[]
  kbDocs: KbDocItem[]
  onSeed?: () => Promise<void>
  onAddVehicle: (payload: {
    stockNumber: string
    vin: string
    year: number
    make: string
    model: string
    variant: string
    bodyType: string
    condition: "new" | "used" | "demo"
    mileageKm: number
    transmission: string
    fuelType: string
    colour: string
    engineSpec?: string
    retailPriceZar: number
    costPriceZar: number
    tradeInValueZar: number
    branch: string
    fullServiceHistory: boolean
    spareKeys: boolean
    features: string[]
    description: string
  }) => Promise<void>
  onPublishAll: (car: ShowroomVehicle) => Promise<void>
  onDecodeVin: (vin: string) => Promise<DecodedVin>
  onUploadFile?: (file: File) => Promise<void>
}) {
  const [search, setSearch] = React.useState("")
  const [vinInput, setVinInput] = React.useState("AHTBA3CD703219845")
  const [decoded, setDecoded] = React.useState<DecodedVin | null>(null)
  const [decoding, setDecoding] = React.useState(false)
  const [publishingStock, setPublishingStock] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  // Add Vehicle dialog state
  const [stockNumber, setStockNumber] = React.useState("APM-2411")
  const [vin, setVin] = React.useState("AHTBA3CD703901122")
  const [year, setYear] = React.useState("2024")
  const [make, setMake] = React.useState("Toyota")
  const [model, setModel] = React.useState("Corolla Cross")
  const [variant, setVariant] = React.useState("1.8 GR-Sport Hybrid CVT")
  const [mileageKm, setMileageKm] = React.useState("9200")
  const [retailPrice, setRetailPrice] = React.useState("519900")
  const [colour, setColour] = React.useState("Glacier White / Black Roof")
  const [branch, setBranch] = React.useState("Midrand Flagship, Gauteng")
  const [condition, setCondition] = React.useState<"new" | "used" | "demo">("demo")
  const [saving, setSaving] = React.useState(false)

  const filtered = vehicles.filter((v) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${v.stockNumber} ${v.vin} ${v.year} ${v.make} ${v.model} ${v.variant} ${v.branch}`
      .toLowerCase()
      .includes(q)
  })

  const copyFeedUrl = async (portal: "cars_co_za" | "autotrader_sa" | "website") => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/api/feeds/vehicles?portal=${portal}`
    await navigator.clipboard.writeText(url)
    toast.add({
      type: "success",
      title: "Portal Feed URL Copied",
      description: url,
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const price = Number(retailPrice) || 450000
    try {
      await onAddVehicle({
        stockNumber: stockNumber.trim().toUpperCase(),
        vin: vin.trim().toUpperCase(),
        year: Number(year) || 2024,
        make: make.trim(),
        model: model.trim(),
        variant: variant.trim(),
        bodyType: "Crossover",
        condition,
        mileageKm: Number(mileageKm) || 0,
        transmission: "Automatic",
        fuelType: "Hybrid",
        colour: colour.trim(),
        retailPriceZar: price,
        costPriceZar: Math.round(price * 0.89),
        tradeInValueZar: Math.round(price * 0.84),
        branch: branch.trim(),
        fullServiceHistory: true,
        spareKeys: true,
        features: ["DEKRA Platinum", "Full Service History", "Balance of Factory Plan"],
        description: `${year} ${make} ${model} ${variant} in ${colour} (${Number(mileageKm).toLocaleString()}km). Finance available via WesBank, Absa, MFC & Standard Bank. Trade-ins welcome.`,
      })
      toast.add({
        type: "success",
        title: `${stockNumber.toUpperCase()} Added to Showroom`,
        description: "Click 'Publish All' to syndicate to Cars.co.za, AutoTrader SA & /showroom.",
      })
      setAddOpen(false)
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not add vehicle",
        description: err instanceof Error ? err.message : "Error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              Showroom Inventory, Multi-Portal Feeds &amp; VIN Lookup
            </h1>
            <Badge className="border-sky-500/30 bg-sky-500/15 font-mono text-[10px] text-sky-300">
              {vehicles.length} Vehicles
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Manage South African new &amp; used vehicles, push 1-click XML feeds to Cars.co.za &amp; AutoTrader SA, publish to `/showroom`, and decode 17-char VINs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {liveMode && !isSeeded && onSeed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void onSeed()}
              className="h-9 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 cursor-pointer"
            >
              <Sparkles className="mr-1.5 size-3.5" />
              Seed 10 SA Cars
            </Button>
          )}

          <Link href="/showroom">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-zinc-800 bg-zinc-900 text-xs text-zinc-200 cursor-pointer"
            >
              <ExternalLink className="size-3.5 text-emerald-400" />
              Live /showroom
            </Button>
          </Link>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="h-9 gap-1.5 bg-sky-600 text-xs text-white hover:bg-sky-500 cursor-pointer">
                  <Plus className="size-3.5" />
                  Add Showroom Vehicle
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg border-zinc-800 bg-zinc-950 text-zinc-100">
              <DialogHeader>
                <DialogTitle>Add New / Used Vehicle to Showroom</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Immediately becomes available to Portal Publisher, Finance VAF &amp; WhatsApp agents.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <Input value={stockNumber} onChange={(e) => setStockNumber(e.target.value)} placeholder="Stock # (APM-2411)" className="h-9 text-xs font-mono bg-zinc-900 border-zinc-800" required />
                  <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="17-Char VIN" className="h-9 text-xs font-mono bg-zinc-900 border-zinc-800" required />
                  <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="h-9 text-xs bg-zinc-900 border-zinc-800" required />
                  <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" className="h-9 text-xs bg-zinc-900 border-zinc-800" required />
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="h-9 text-xs bg-zinc-900 border-zinc-800" required />
                  <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="Derivative / Variant" className="h-9 text-xs bg-zinc-900 border-zinc-800" required />
                  <Input value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} placeholder="Retail Price ZAR" className="h-9 text-xs font-mono bg-zinc-900 border-zinc-800" required />
                  <Input value={mileageKm} onChange={(e) => setMileageKm(e.target.value)} placeholder="Mileage km" className="h-9 text-xs font-mono bg-zinc-900 border-zinc-800" required />
                  <Input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="Exterior Colour" className="h-9 text-xs bg-zinc-900 border-zinc-800" />
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "new" | "used" | "demo")}
                    className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-100"
                  >
                    <option value="used">Pre-Owned (Used)</option>
                    <option value="demo">Dealer Demo</option>
                    <option value="new">Brand New</option>
                  </select>
                </div>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch Location" className="h-9 text-xs bg-zinc-900 border-zinc-800" />
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
                    Cancel
                  </DialogClose>
                  <Button type="submit" size="sm" disabled={saving} className="bg-sky-600 text-white hover:bg-sky-500 cursor-pointer">
                    {saving ? "Saving..." : "Save to Showroom"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Live South African Syndication Feed Bar */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5">
          <div>
            <div className="text-xs font-semibold text-rose-200">Cars.co.za DAP XML Feed</div>
            <div className="font-mono text-[10px] text-zinc-400">/api/feeds/vehicles?portal=cars_co_za</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void copyFeedUrl("cars_co_za")}
            className="h-7 gap-1 border-rose-500/30 bg-zinc-950 text-[11px] text-rose-300 cursor-pointer"
          >
            <Copy className="size-3" /> Copy
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-sky-500/25 bg-sky-500/5 p-3.5">
          <div>
            <div className="text-xs font-semibold text-sky-200">AutoTrader SA DMS XML</div>
            <div className="font-mono text-[10px] text-zinc-400">/api/feeds/vehicles?portal=autotrader_sa</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void copyFeedUrl("autotrader_sa")}
            className="h-7 gap-1 border-sky-500/30 bg-zinc-950 text-[11px] text-sky-300 cursor-pointer"
          >
            <Copy className="size-3" /> Copy
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
          <div>
            <div className="text-xs font-semibold text-emerald-200">Own Dealership Website</div>
            <div className="font-mono text-[10px] text-zinc-400">/showroom (Live Public Inventory)</div>
          </div>
          <Link href="/showroom">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-emerald-500/30 bg-zinc-950 text-[11px] text-emerald-300 cursor-pointer"
            >
              <Globe className="size-3" /> Open
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="border border-zinc-800 bg-zinc-900">
          <TabsTrigger value="stock" className="text-xs cursor-pointer">
            <CarFront className="mr-1.5 size-3.5 text-sky-400" />
            Showroom Vehicles ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="vin" className="text-xs cursor-pointer">
            <ShieldCheck className="mr-1.5 size-3.5 text-emerald-400" />
            17-Char VIN &amp; NaTIS Decoder
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-xs cursor-pointer">
            <Database className="mr-1.5 size-3.5 text-violet-400" />
            F&amp;I Rate Cards &amp; Docs ({kbDocs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by stock #, VIN, Hilux, Ranger, Golf GTI, branch..."
              className="h-9 border-zinc-800 bg-zinc-900 pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((car) => {
              const est = calculateSaVehicleFinance({
                vehiclePriceZar: car.retailPriceZar,
                depositZar: Math.round(car.retailPriceZar * 0.1),
                balloonPct: 20,
                termMonths: 72,
              })
              return (
                <div
                  key={car.stockNumber}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {car.stockNumber}
                        </span>
                        <Badge className="border-zinc-700 bg-zinc-800 text-[10px] uppercase text-zinc-200">
                          {car.condition}
                        </Badge>
                        <span className="text-[11px] text-zinc-500">{car.daysInStock}d on floor</span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-white">
                        {car.year} {car.make} {car.model} {car.variant}
                      </h3>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        {car.mileageKm.toLocaleString("en-ZA")} km &bull; {car.transmission} &bull; {car.colour} &bull; VIN: {car.vin}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-base font-bold text-white">
                        {formatZar(car.retailPriceZar)}
                      </div>
                      <div className="font-mono text-[11px] text-emerald-400">
                        Est. {formatZar(est.monthlyInstallmentTotalZar)}/pm
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          ["Cars.co.za", car.portals.cars_co_za, "text-rose-300 border-rose-500/30 bg-rose-500/10"],
                          ["AutoTrader SA", car.portals.autotrader_sa, "text-sky-300 border-sky-500/30 bg-sky-500/10"],
                          ["Own Site", car.portals.dealership_website, "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"],
                          ["FB Market", car.portals.facebook_marketplace, "text-indigo-300 border-indigo-500/30 bg-indigo-500/10"],
                        ] as const
                      ).map(([label, live, activeStyle]) => (
                        <span
                          key={label}
                          className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                            live ? activeStyle : "border-zinc-800 bg-zinc-950 text-zinc-600"
                          }`}
                        >
                          {live ? "✓ " : ""}
                          {label}
                        </span>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      disabled={publishingStock === car.stockNumber}
                      onClick={async () => {
                        setPublishingStock(car.stockNumber)
                        try {
                          await onPublishAll(car)
                          toast.add({
                            type: "success",
                            title: `Published ${car.stockNumber} to All SA Portals`,
                            description: "Live on Cars.co.za XML, AutoTrader SA XML, /showroom & FB Marketplace.",
                          })
                        } finally {
                          setPublishingStock(null)
                        }
                      }}
                      className="h-7 gap-1 bg-sky-600 text-[11px] text-white hover:bg-sky-500 cursor-pointer"
                    >
                      <Rocket className="size-3" />
                      {publishingStock === car.stockNumber ? "Publishing..." : "Publish All"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="vin" className="mt-4">
          <div className="max-w-2xl space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                South African 17-Character VIN Decoder (vPIC + Year Check)
              </h3>
              <p className="text-xs text-zinc-400">
                Verify manufacturer, model year, body class &amp; engine before trade-in appraisal or portal syndication.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value)}
                placeholder="Enter 17-character VIN..."
                className="h-9 font-mono text-xs bg-zinc-950 border-zinc-800"
              />
              <Button
                disabled={decoding}
                onClick={async () => {
                  setDecoding(true)
                  try {
                    const res = await onDecodeVin(vinInput)
                    setDecoded(res)
                  } finally {
                    setDecoding(false)
                  }
                }}
                className="h-9 bg-emerald-600 text-xs text-white hover:bg-emerald-500 cursor-pointer"
              >
                {decoding ? "Decoding..." : "Decode VIN"}
              </Button>
            </div>

            {decoded && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span>
                    VIN {decoded.vin} ({decoded.valid ? "Valid Format" : "Invalid Format"})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-zinc-300">
                  <div>Make: <strong>{decoded.make || "Confirm on NaTIS"}</strong></div>
                  <div>Model: <strong>{decoded.model || "Confirm on NaTIS"}</strong></div>
                  <div>Year: <strong>{decoded.year || "N/A"}</strong></div>
                  <div>Fuel: <strong>{decoded.fuelType || "N/A"}</strong></div>
                  <div>Body: <strong>{decoded.bodyClass || "N/A"}</strong></div>
                  <div>Plant: <strong>{decoded.plantCountry || "N/A"}</strong></div>
                </div>
                {decoded.note && <p className="text-[11px] text-amber-300 pt-1">{decoded.note}</p>}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Dealership Knowledge Base (Bank Rate Cards, Warranty PDFs, Stock Sheets)
              </h3>
              <p className="text-xs text-zinc-400">
                Upload PDFs, CSVs or rate sheets so your AI agents answer F&amp;I and spec questions accurately.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.md,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !onUploadFile) return
                try {
                  await onUploadFile(file)
                  toast.add({ type: "success", title: `Uploaded ${file.name}` })
                } catch (err) {
                  toast.add({
                    type: "error",
                    title: "Upload failed",
                    description: err instanceof Error ? err.message : "Error",
                  })
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500 cursor-pointer"
            >
              <Upload className="size-3.5" />
              Upload Dealership Doc
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {kbDocs.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-4 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-100">{doc.title}</div>
                    <div className="text-[11px] text-zinc-400">
                      {doc.fileName} &bull; {doc.chunkCount} indexed chunks
                    </div>
                  </div>
                </div>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-300">
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
