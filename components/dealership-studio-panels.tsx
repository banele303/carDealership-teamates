"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  Bot,
  Building2,
  Calculator,
  CalendarClock,
  Camera,
  CarFront,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Landmark,
  MessageSquare,
  MonitorPlay,
  Plus,
  QrCode,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Upload,
  Wrench,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import {
  analyzeSaMarketPricing,
  calculateSaVehicleFinance,
  DEALERSHIP_SKILLS,
  estimateSaTradeInValuation,
  formatZar,
  parseSouthAfricanId,
  parseVehicleIntakeSpec,
  SA_BANKS,
  SA_FICA_DOCS,
  SA_PORTALS,
  SA_PRIME_RATE,
  SA_SHOWROOM_VEHICLES,
  type PortalSlug,
  type SaBankName,
  type ShowroomVehicle,
} from "@/lib/sa-dealership"
import { downloadShowroomWindowStickerPdf } from "@/lib/window-sticker-pdf"
import { cn } from "@/lib/utils"

// ============================================================================
// 1. MULTI-PORTAL CAR PUBLISHER STUDIO (Cars.co.za, AutoTrader SA, Own Site)
// ============================================================================

export function PublisherStudioPanel({
  onLaunchCloudDesktop,
}: {
  onLaunchCloudDesktop?: (url: string) => Promise<void>
}) {
  const dbVehicles = useQuery(api.vehicles.listVehicles, { limit: 40 })
  const listings = useQuery(api.vehicles.listPortalListings, {})
  const publishMut = useMutation(api.vehicles.publishToPortals)
  const upsertVehicleMut = useMutation(api.vehicles.upsertVehicle)
  const seedMut = useMutation(api.vehicles.seedDealershipData)

  const vehicles: ShowroomVehicle[] =
    dbVehicles && dbVehicles.length > 0
      ? (dbVehicles as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  const [selectedStock, setSelectedStock] = React.useState(
    vehicles[0]?.stockNumber ?? "APM-2401"
  )
  const activeVehicle =
    vehicles.find((v) => v.stockNumber === selectedStock) ?? vehicles[0]

  const [selectedPortals, setSelectedPortals] = React.useState<PortalSlug[]>([
    "cars_co_za",
    "autotrader_sa",
    "dealership_website",
    "facebook_marketplace",
  ])
  const [priceInput, setPriceInput] = React.useState(
    String(activeVehicle?.retailPriceZar ?? 949900)
  )
  const [headlineInput, setHeadlineInput] = React.useState(
    activeVehicle
      ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.variant}`
      : ""
  )
  const [descriptionInput, setDescriptionInput] = React.useState(
    activeVehicle?.description ?? ""
  )
  const [publishing, setPublishing] = React.useState(false)
  const [showAddCar, setShowAddCar] = React.useState(false)

  // Quick Add Car + Raw Text / NaTIS Decoder + Photo Upload fields
  const [rawIntakeText, setRawIntakeText] = React.useState(
    "2022 VW Polo GTI 2.0 TSI DSG, 38,000km, R489,900, Kings Red Metallic, VIN AAVZZZAWZNU012345, FSH, DEKRA Platinum"
  )
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([])
  const [newMake, setNewMake] = React.useState("Volkswagen")
  const [newModel, setNewModel] = React.useState("Polo GTI")
  const [newVariant, setNewVariant] = React.useState("2.0 TSI DSG (147kW)")
  const [newYear, setNewYear] = React.useState("2022")
  const [newKm, setNewKm] = React.useState("38000")
  const [newPrice, setNewPrice] = React.useState("489900")
  const [newColour, setNewColour] = React.useState("Kings Red Metallic")
  const [newVin, setNewVin] = React.useState("AAVZZZAWZNU012345")

  // Cloud Browser Form Auto-Filler state
  const [autoFilling, setAutoFilling] = React.useState(false)
  const [autoFillResult, setAutoFillResult] = React.useState<{
    portalLabel: string
    portalUrl: string
    steps: Array<{ step: number; field: string; value: string; status: string }>
    playwrightScript?: string
  } | null>(null)

  React.useEffect(() => {
    if (activeVehicle) {
      setPriceInput(String(activeVehicle.retailPriceZar))
      setHeadlineInput(
        `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} ${activeVehicle.variant}`
      )
      setDescriptionInput(activeVehicle.description)
    }
  }, [activeVehicle?.stockNumber])

  const market = React.useMemo(() => {
    const numericPrice =
      Number(priceInput) || activeVehicle?.retailPriceZar || 749900
    return analyzeSaMarketPricing({
      year: activeVehicle?.year ?? 2024,
      make: activeVehicle?.make ?? "Toyota",
      model: activeVehicle?.model ?? "Hilux",
      variant: activeVehicle?.variant,
      mileageKm: activeVehicle?.mileageKm ?? 15000,
      priceZar: numericPrice,
      fullServiceHistory: activeVehicle?.fullServiceHistory ?? true,
    })
  }, [activeVehicle, priceInput])

  const handleDecodeRawIntake = () => {
    if (!rawIntakeText.trim()) return
    const parsed = parseVehicleIntakeSpec(rawIntakeText)
    setNewYear(String(parsed.year))
    setNewMake(parsed.make)
    setNewModel(parsed.model)
    setNewVariant(parsed.variant)
    setNewKm(String(parsed.mileageKm))
    setNewPrice(String(parsed.retailPriceZar))
    setNewColour(parsed.colour)
    setNewVin(parsed.vin)
    toast.add({
      type: "success",
      title: "Specs & NaTIS Details Decoded",
      description: `Extracted ${parsed.year} ${parsed.make} ${parsed.model} (${formatZar(parsed.retailPriceZar)} · ${parsed.mileageKm.toLocaleString()} km).`,
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    files.slice(0, 4).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxW = 800
          const scale = img.width > maxW ? maxW / img.width : 1
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const dataUrl = canvas.toDataURL("image/jpeg", 0.78)
            setUploadedPhotos((prev) => [...prev.slice(-3), dataUrl])
          }
        }
        img.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    })

    toast.add({
      type: "success",
      title: `${files.length} Vehicle Photo(s) Attached`,
      description: "Ready to embed into your /showroom & portal feeds.",
    })
  }

  const togglePortal = (slug: PortalSlug) => {
    setSelectedPortals((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    )
  }

  const handlePublish = async () => {
    if (!activeVehicle || selectedPortals.length === 0) return
    setPublishing(true)
    const finalPrice = Number(priceInput) || activeVehicle.retailPriceZar
    try {
      await fetch("/api/publish-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockNumber: activeVehicle.stockNumber,
          vin: activeVehicle.vin,
          year: activeVehicle.year,
          make: activeVehicle.make,
          model: activeVehicle.model,
          variant: activeVehicle.variant,
          priceZar: finalPrice,
          mileageKm: activeVehicle.mileageKm,
          portals: selectedPortals,
        }),
      })

      await publishMut({
        stockNumber: activeVehicle.stockNumber,
        portals: selectedPortals,
        headline: headlineInput.trim(),
        description: descriptionInput.trim(),
        priceZar: finalPrice,
        publishedByBot: "Portal Publisher Agent",
      })

      toast.add({
        type: "success",
        title: `Published to ${selectedPortals.length} SA Portal(s)`,
        description: `${activeVehicle.stockNumber} synced to Cars.co.za, AutoTrader SA & /showroom.`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Publish failed",
        description: err instanceof Error ? err.message : "Syndication error",
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleAddAndSelectCar = async (e: React.FormEvent) => {
    e.preventDefault()
    const stockNumber = `APM-${String(Date.now()).slice(-4)}`
    const price = Number(newPrice) || 450000
    const primaryPhoto =
      uploadedPhotos[0] ||
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80"
    const desc = `${newYear} ${newMake} ${newModel} ${newVariant} in ${newColour}. Only ${Number(newKm).toLocaleString()}km. Full Service History, DEKRA Platinum roadworthy verified. Finance available via WesBank, Absa, MFC & Standard Bank.`

    try {
      await upsertVehicleMut({
        stockNumber,
        vin: newVin.trim() || "AHTBA3CD703999001",
        year: Number(newYear) || 2024,
        make: newMake.trim(),
        model: newModel.trim(),
        variant: newVariant.trim(),
        bodyType: "Hatchback",
        condition: "used",
        mileageKm: Number(newKm) || 15000,
        transmission: "Automatic",
        fuelType: "Petrol",
        colour: newColour.trim() || "White",
        retailPriceZar: price,
        costPriceZar: Math.round(price * 0.89),
        tradeInValueZar: Math.round(price * 0.84),
        branch: "Midrand Flagship, Gauteng",
        fullServiceHistory: true,
        spareKeys: true,
        features: [
          "Full Franchise Service History (FSH)",
          "DEKRA Platinum 98/100 Verified",
          "Apple CarPlay & Android Auto",
          "WesBank, Absa, MFC & Standard Bank Finance",
        ],
        description: desc,
        imageUrl: primaryPhoto,
        portals: {
          cars_co_za: selectedPortals.includes("cars_co_za"),
          autotrader_sa: selectedPortals.includes("autotrader_sa"),
          dealership_website: true,
          facebook_marketplace: selectedPortals.includes("facebook_marketplace"),
        },
      })

      await publishMut({
        stockNumber,
        portals:
          selectedPortals.length > 0
            ? selectedPortals
            : ["cars_co_za", "autotrader_sa", "dealership_website"],
        headline: `${newYear} ${newMake} ${newModel} ${newVariant}`.trim(),
        description: desc,
        priceZar: price,
        vin: newVin.trim() || "AHTBA3CD703999001",
        year: Number(newYear) || 2024,
        make: newMake.trim(),
        model: newModel.trim(),
        variant: newVariant.trim(),
        mileageKm: Number(newKm) || 15000,
        colour: newColour.trim() || "White",
        imageUrl: primaryPhoto,
        publishedByBot: "Portal Publisher Agent",
      })

      setSelectedStock(stockNumber)
      setShowAddCar(false)
      toast.add({
        type: "success",
        title: `Created & Multi-Published ${stockNumber}`,
        description: `${newYear} ${newMake} ${newModel} is now live on /showroom, Cars.co.za XML & AutoTrader SA XML!`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not add vehicle",
        description: err instanceof Error ? err.message : "Error saving car",
      })
    }
  }

  const handleAutoFillPortal = async (targetPortal: PortalSlug) => {
    if (!activeVehicle) return
    setAutoFilling(true)
    try {
      const res = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "autofill_portal",
          targetPortal,
          stockNumber: activeVehicle.stockNumber,
          vin: activeVehicle.vin,
          year: activeVehicle.year,
          make: activeVehicle.make,
          model: activeVehicle.model,
          variant: activeVehicle.variant,
          priceZar: Number(priceInput) || activeVehicle.retailPriceZar,
          mileageKm: activeVehicle.mileageKm,
          colour: activeVehicle.colour,
          transmission: activeVehicle.transmission,
          dekraGrade: activeVehicle.dekraGrade,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAutoFillResult(data)
        toast.add({
          type: "success",
          title: `${data.portalLabel} Auto-Filled`,
          description: "All 5 dealer portal listing sections populated and verified.",
        })
      }
    } catch {
      toast.add({ type: "error", title: "Could not run browser form-filler" })
    } finally {
      setAutoFilling(false)
    }
  }

  const handleDownloadWindowSticker = () => {
    if (!activeVehicle) return
    downloadShowroomWindowStickerPdf({
      stockNumber: activeVehicle.stockNumber,
      vin: activeVehicle.vin,
      year: activeVehicle.year,
      make: activeVehicle.make,
      model: activeVehicle.model,
      variant: activeVehicle.variant,
      bodyType: activeVehicle.bodyType,
      condition: activeVehicle.condition,
      mileageKm: activeVehicle.mileageKm,
      transmission: activeVehicle.transmission,
      fuelType: activeVehicle.fuelType,
      colour: activeVehicle.colour,
      retailPriceZar: Number(priceInput) || activeVehicle.retailPriceZar,
      branch: activeVehicle.branch,
      fullServiceHistory: activeVehicle.fullServiceHistory,
      spareKeys: activeVehicle.spareKeys,
      dekraGrade: activeVehicle.dekraGrade,
      features: activeVehicle.features,
      description: descriptionInput,
    })
    toast.add({
      type: "success",
      title: "Showroom Windscreen Sticker PDF Generated",
      description: `Downloaded ${activeVehicle.stockNumber} spec sheet with scannable /showroom QR code.`,
    })
  }

  const copyFeedUrl = async (portal: "cars_co_za" | "autotrader_sa" | "website") => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/api/feeds/vehicles?portal=${portal}`
    await navigator.clipboard.writeText(url)
    toast.add({
      type: "success",
      title: "Live Feed URL Copied",
      description: url,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/70 pb-3">
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
            <Globe className="size-3.5 text-sky-400" />
            Multi-Portal Car Publisher (SA)
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Publish once to Cars.co.za DAP, AutoTrader SA, Own Website &amp; Facebook.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(!dbVehicles || dbVehicles.length === 0) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void seedMut({})}
              className="h-7 px-2 text-[10px] border-zinc-800 bg-zinc-900 text-zinc-300 cursor-pointer"
            >
              Seed 10 Cars
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAddCar((v) => !v)}
            className="h-7 gap-1 px-2 text-[11px] border-sky-500/30 bg-sky-500/10 text-sky-300 cursor-pointer"
          >
            <Camera className="size-3" />
            Photo + NaTIS Intake
          </Button>
        </div>
      </div>

      {showAddCar && (
        <form
          onSubmit={handleAddAndSelectCar}
          className="space-y-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-sky-400" />
              Drop Photos + Raw Text / NaTIS Licence Disc Decoder
            </div>
            <Badge className="border-sky-500/30 bg-sky-500/15 text-[9px] text-sky-300">
              1-Click Intake
            </Badge>
          </div>

          {/* Step A: Raw Text / WhatsApp / NaTIS Barcode Decoder */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">
              1. Paste Raw Spec / WhatsApp Note / NaTIS Disc String:
            </label>
            <div className="flex gap-1.5">
              <Input
                value={rawIntakeText}
                onChange={(e) => setRawIntakeText(e.target.value)}
                placeholder="e.g. 2022 VW Polo GTI 2.0 TSI DSG, 38,000km, R489,900, Kings Red, FSH"
                className="h-8 text-xs bg-zinc-950 border-zinc-800"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDecodeRawIntake}
                className="h-8 px-2.5 text-[11px] border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 shrink-0 cursor-pointer"
              >
                Decode
              </Button>
            </div>
          </div>

          {/* Step B: Multi-Photo Dropzone */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">
              2. Drop Car Photos ({uploadedPhotos.length} attached):
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300 hover:border-sky-500/50">
              <Upload className="size-3.5 text-sky-400" />
              <span>Select or Drop Car Walkaround Photos (JPG/PNG)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {uploadedPhotos.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pt-1">
                {uploadedPhotos.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Upload ${idx + 1}`}
                    className="h-12 w-16 rounded-md border border-zinc-700 object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Step C: Decoded Vehicle Fields */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="Year (e.g. 2024)"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
              placeholder="Make (e.g. Toyota)"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Model (e.g. Hilux)"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              placeholder="Variant"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price ZAR"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              placeholder="Mileage km"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newColour}
              onChange={(e) => setNewColour(e.target.value)}
              placeholder="Colour"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={newVin}
              onChange={(e) => setNewVin(e.target.value)}
              placeholder="17-Char VIN"
              className="h-8 text-xs bg-zinc-950 border-zinc-800 font-mono"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 w-full gap-1.5 bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
          >
            <Rocket className="size-3.5" />
            Create &amp; Multi-Publish to Selected Portals
          </Button>
        </form>
      )}

      {/* Vehicle Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">
          Select Showroom Vehicle ({vehicles.length} in stock)
        </label>
        <select
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
          className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-100 outline-none focus:border-sky-500/60"
        >
          {vehicles.map((v) => (
            <option key={v.stockNumber} value={v.stockNumber}>
              [{v.stockNumber}] {v.year} {v.make} {v.model} — {formatZar(v.retailPriceZar)} ({v.mileageKm.toLocaleString()}km)
            </option>
          ))}
        </select>
      </div>

      {/* Live Cars.co.za & AutoTrader SA Market Price Benchmark Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
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
              ~{market.estimatedDaysToSell}d est. turn
            </span>
          </div>
          {Number(priceInput) !== market.recommendedPriceZar && (
            <button
              type="button"
              onClick={() => {
                setPriceInput(String(market.recommendedPriceZar))
                toast.add({
                  type: "success",
                  title: "Applied Recommended SA Market Price",
                  description: `Updated price to ${formatZar(market.recommendedPriceZar)}.`,
                })
              }}
              className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300 hover:bg-sky-500/20 cursor-pointer"
            >
              <TrendingDown className="size-3" />
              Snap {formatZar(market.recommendedPriceZar)}
            </button>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          {market.summaryNote}
        </p>
      </div>

      {/* Listing Copy & Price */}
      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500">
              Ad Headline
            </label>
            <Input
              value={headlineInput}
              onChange={(e) => setHeadlineInput(e.target.value)}
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500">
              Retail (ZAR)
            </label>
            <Input
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500">
            South African Portal Description
          </label>
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Target Portals */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Target Portals
        </span>
        <div className="grid grid-cols-2 gap-2">
          {SA_PORTALS.map((portal) => {
            const checked = selectedPortals.includes(portal.slug)
            const isAlreadyLive = activeVehicle?.portals?.[portal.slug]
            return (
              <button
                key={portal.slug}
                type="button"
                onClick={() => togglePortal(portal.slug)}
                className={cn(
                  "flex flex-col rounded-lg border p-2.5 text-left transition cursor-pointer",
                  checked
                    ? "border-sky-500/50 bg-sky-500/10 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">{portal.shortName}</span>
                  {isAlreadyLive && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-400">
                      Live
                    </span>
                  )}
                </div>
                <span className="mt-0.5 text-[10px] text-zinc-500 truncate">
                  {portal.feedFormat}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={publishing || selectedPortals.length === 0}
          onClick={() => void handlePublish()}
          className="h-9 gap-1.5 bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
        >
          <Rocket className="size-3.5" />
          {publishing
            ? "Publishing..."
            : `Publish to ${selectedPortals.length} Portals`}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadWindowSticker}
          className="h-9 gap-1.5 border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 cursor-pointer"
        >
          <QrCode className="size-3.5" />
          Windscreen QR PDF
        </Button>
      </div>

      {/* Automated Cloud Browser Dealer Portal Form-Filler */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Bot className="size-3.5 text-sky-400" />
            Cloud Browser Portal Form-Filler
          </div>
          <span className="text-[10px] text-zinc-500">Playwright Assisted</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={autoFilling}
            onClick={() => void handleAutoFillPortal("cars_co_za")}
            className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
          >
            Auto-Fill Cars.co.za DAP
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={autoFilling}
            onClick={() => void handleAutoFillPortal("autotrader_sa")}
            className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
          >
            Auto-Fill AutoTrader DMS
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={autoFilling}
            onClick={() => void handleAutoFillPortal("facebook_marketplace")}
            className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
          >
            Auto-Fill FB Marketplace
          </Button>
        </div>

        {autoFillResult && (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300">
                {autoFillResult.portalLabel}
              </span>
              {onLaunchCloudDesktop && (
                <button
                  type="button"
                  onClick={() => void onLaunchCloudDesktop(autoFillResult.portalUrl)}
                  className="text-[10px] font-medium text-sky-400 underline cursor-pointer"
                >
                  Open in Desktop Tab
                </button>
              )}
            </div>
            {autoFillResult.steps.map((s) => (
              <div
                key={s.step}
                className="flex items-center justify-between text-[10px] text-zinc-300"
              >
                <span className="text-zinc-400">
                  {s.step}. {s.field}
                </span>
                <span className="font-mono text-zinc-200 truncate max-w-[180px]">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Dealer Feeds & Cloud Portal Links */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Live Dealer Feeds &amp; Direct Portal Access
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyFeedUrl("cars_co_za")}
            className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
          >
            <Copy className="size-3 text-rose-400" />
            Cars.co.za XML
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyFeedUrl("autotrader_sa")}
            className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
          >
            <Copy className="size-3 text-sky-400" />
            AutoTrader XML
          </Button>
          <Link href="/showroom">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300 cursor-pointer"
            >
              <ExternalLink className="size-3" />
              View /showroom
            </Button>
          </Link>
          {onLaunchCloudDesktop && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onLaunchCloudDesktop("https://www.cars.co.za")}
              className="h-7 gap-1 text-[11px] border-zinc-800 bg-zinc-950 text-zinc-300 cursor-pointer"
            >
              <MonitorPlay className="size-3 text-sky-400" />
              Open Portal Desktop
            </Button>
          )}
        </div>
      </div>

      {/* Recent Syndication Receipts */}
      {listings && listings.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Recent Portal Publications ({listings.length})
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {listings.slice(0, 6).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1.5 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-200">
                    [{item.stockNumber}] {item.portal.replace(/_/g, ".")}
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    {item.externalListingId} &bull; {formatZar(item.priceZar)}
                  </div>
                </div>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-300">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 2. SOUTH AFRICAN MULTI-BANK FINANCE AUTO-APPLY STUDIO (VAF / Signio)
// ============================================================================

export function FinanceStudioPanel() {
  const dbVehicles = useQuery(api.vehicles.listVehicles, { limit: 40 })
  const financeApps = useQuery(api.vehicles.listFinanceApplications, {})
  const submitFinanceMut = useMutation(api.vehicles.submitFinanceApplication)

  const vehicles: ShowroomVehicle[] =
    dbVehicles && dbVehicles.length > 0
      ? (dbVehicles as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  const [selectedStock, setSelectedStock] = React.useState(
    vehicles[0]?.stockNumber ?? "APM-2401"
  )
  const vehicle = vehicles.find((v) => v.stockNumber === selectedStock) ?? vehicles[0]

  const [applicantName, setApplicantName] = React.useState("Thabo Mokoena")
  const [saIdNumber, setSaIdNumber] = React.useState("8904125184080")
  const [phone, setPhone] = React.useState("+27 76 992 3410")
  const [email, setEmail] = React.useState("thabo.mokoena@gmail.com")
  const [employerName, setEmployerName] = React.useState("MTN South Africa")
  const [grossIncome, setGrossIncome] = React.useState("78500")
  const [expenses, setExpenses] = React.useState("24000")
  const [deposit, setDeposit] = React.useState("95000")
  const [tradeInEquity, setTradeInEquity] = React.useState("0")
  const [balloonPct, setBalloonPct] = React.useState("20")
  const [termMonths, setTermMonths] = React.useState("72")
  const [ratePct, setRatePct] = React.useState(String(SA_PRIME_RATE + 0.5))
  const [selectedBanks, setSelectedBanks] = React.useState<SaBankName[]>([
    "WesBank",
    "Absa Vehicle Finance",
    "MFC (Nedbank)",
    "Standard Bank VAF",
  ])
  const [fica, setFica] = React.useState({
    idCopy: true,
    driversLicense: true,
    bankStatements3m: true,
    payslips3m: true,
    proofOfAddress: true,
  })
  const [submitting, setSubmitting] = React.useState(false)

  const idParsed = React.useMemo(() => parseSouthAfricanId(saIdNumber), [saIdNumber])
  const calc = React.useMemo(
    () =>
      calculateSaVehicleFinance({
        vehiclePriceZar: vehicle?.retailPriceZar ?? 750000,
        depositZar: Number(deposit) || 0,
        tradeInEquityZar: Number(tradeInEquity) || 0,
        balloonPct: Number(balloonPct) || 0,
        interestRatePct: Number(ratePct) || SA_PRIME_RATE + 0.5,
        termMonths: Number(termMonths) || 72,
        includeOtrFeeZar: vehicle?.otrFeeZar ?? 6500,
        grossMonthlyIncomeZar: Number(grossIncome) || undefined,
        monthlyExpensesZar: Number(expenses) || undefined,
      }),
    [vehicle, deposit, tradeInEquity, balloonPct, ratePct, termMonths, grossIncome, expenses]
  )

  const toggleBank = (bank: SaBankName) => {
    setSelectedBanks((prev) =>
      prev.includes(bank) ? prev.filter((b) => b !== bank) : [...prev, bank]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicantName.trim() || selectedBanks.length === 0) {
      toast.add({ type: "error", title: "Enter applicant name & pick at least 1 bank" })
      return
    }
    setSubmitting(true)
    try {
      const res = await submitFinanceMut({
        applicantName,
        saIdNumber,
        phone,
        email,
        address: "Gauteng, South Africa",
        employmentStatus: "Permanent Full-Time",
        employerName,
        grossMonthlyIncomeZar: Number(grossIncome) || 0,
        monthlyExpensesZar: Number(expenses) || 0,
        stockNumber: vehicle.stockNumber,
        vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant}`,
        vehiclePriceZar: vehicle.retailPriceZar,
        depositZar: Number(deposit) || 0,
        tradeInEquityZar: Number(tradeInEquity) || 0,
        balloonPct: Number(balloonPct) || 0,
        interestRatePct: Number(ratePct) || 11.75,
        termMonths: Number(termMonths) || 72,
        estimatedMonthlyZar: calc.monthlyInstallmentTotalZar,
        affordabilityStatus: calc.affordabilityStatus ?? "pre_qualified",
        ficaChecklist: fica,
        banks: selectedBanks,
        notes: "Submitted via SA Multi-Bank Finance Auto-Apply Studio",
      })
      toast.add({
        type: "success",
        title: `Application ${res.applicationRef} Submitted`,
        description: `Auto-dispatched to ${selectedBanks.join(", ")}.`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Submission error",
        description: err instanceof Error ? err.message : "Could not submit finance application",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-zinc-800/70 pb-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
          <Landmark className="size-3.5 text-emerald-400" />
          SA Multi-Bank Finance Auto-Apply (VAF)
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          NCA affordability, SA ID validation, FICA checklist &amp; 1-click submission to WesBank, Absa, MFC, Standard Bank &amp; Capitec.
        </p>
      </div>

      {/* Live Monthly Instalment Highlight */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Estimated Monthly Instalment (Incl. R69 NCA Admin)
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-white">
              {formatZar(calc.monthlyInstallmentTotalZar)}
              <span className="text-xs font-normal text-emerald-300"> /month</span>
            </div>
          </div>
          <Badge
            className={cn(
              "text-[10px]",
              calc.affordabilityStatus === "pre_qualified"
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                : calc.affordabilityStatus === "borderline"
                  ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                  : "border-rose-400/40 bg-rose-500/20 text-rose-200"
            )}
          >
            {calc.affordabilityStatus === "pre_qualified"
              ? "NCA Pre-Qualified"
              : calc.affordabilityStatus === "borderline"
                ? "Borderline Ratio"
                : "Needs Deposit/Co-Signer"}
          </Badge>
        </div>
        {calc.affordabilityNote && (
          <p className="mt-1.5 text-[11px] text-emerald-200/80">{calc.affordabilityNote}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500">
            Vehicle to Finance
          </label>
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-100"
          >
            {vehicles.map((v) => (
              <option key={v.stockNumber} value={v.stockNumber}>
                [{v.stockNumber}] {v.year} {v.make} {v.model} ({formatZar(v.retailPriceZar)})
              </option>
            ))}
          </select>
        </div>

        {/* Deal Structure Sliders / Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Cash Deposit (ZAR)</label>
            <Input
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="h-8 text-xs font-mono bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Trade-In Equity (ZAR)</label>
            <Input
              value={tradeInEquity}
              onChange={(e) => setTradeInEquity(e.target.value)}
              className="h-8 text-xs font-mono bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Balloon / Residual (%)</label>
            <Input
              value={balloonPct}
              onChange={(e) => setBalloonPct(e.target.value)}
              className="h-8 text-xs font-mono bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Term &amp; Rate (%)</label>
            <div className="flex gap-1.5">
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="h-8 w-1/2 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 text-xs text-zinc-100"
              >
                <option value="48">48m</option>
                <option value="60">60m</option>
                <option value="72">72m</option>
              </select>
              <Input
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                className="h-8 w-1/2 text-xs font-mono bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Applicant + SA ID */}
        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Buyer &amp; Income Details
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Full Name"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={saIdNumber}
              onChange={(e) => setSaIdNumber(e.target.value)}
              placeholder="13-Digit SA ID"
              className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 Phone"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="Employer Name"
              className="h-8 text-xs bg-zinc-950 border-zinc-800"
            />
            <Input
              value={grossIncome}
              onChange={(e) => setGrossIncome(e.target.value)}
              placeholder="Gross Income ZAR"
              className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
            />
          </div>
          {saIdNumber.length > 0 && (
            <div className="text-[10px] font-mono text-zinc-400">
              SA ID Check:{" "}
              <span className={idParsed.valid ? "text-emerald-400" : "text-amber-400"}>
                {idParsed.valid
                  ? `Valid · DOB ${idParsed.birthDate} · ${idParsed.gender} · ${idParsed.citizenship}`
                  : idParsed.note}
              </span>
            </div>
          )}
        </div>

        {/* 5 Mandatory SA FICA Docs */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            FICA Verification Checklist
          </div>
          <div className="grid grid-cols-1 gap-1">
            {(
              [
                ["idCopy", SA_FICA_DOCS[0].label],
                ["driversLicense", SA_FICA_DOCS[1].label],
                ["bankStatements3m", SA_FICA_DOCS[2].label],
                ["payslips3m", SA_FICA_DOCS[3].label],
                ["proofOfAddress", SA_FICA_DOCS[4].label],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-900/30 px-2.5 py-1.5 text-[11px] text-zinc-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={fica[key]}
                  onChange={(e) => setFica((p) => ({ ...p, [key]: e.target.checked }))}
                  className="accent-emerald-500"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target SA Banks */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Auto-Submit To SA Banks ({selectedBanks.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SA_BANKS.map((bank) => {
              const active = selectedBanks.includes(bank.name)
              return (
                <button
                  key={bank.name}
                  type="button"
                  onClick={() => toggleBank(bank.name)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition cursor-pointer",
                    active
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  )}
                >
                  <Building2 className="size-3" />
                  {bank.shortName}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-9 w-full gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          {submitting
            ? "Auto-Applying Across Banks..."
            : `Auto-Apply to ${selectedBanks.length} SA Bank(s)`}
        </Button>
      </form>

      {/* Active Submissions Log */}
      {financeApps && financeApps.length > 0 && (
        <div className="space-y-1.5 border-t border-zinc-800/70 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Recent Bank Submissions ({financeApps.length})
          </div>
          {financeApps.slice(0, 4).map((app) => (
            <div
              key={app._id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-100">{app.applicantName}</span>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-300">
                  {app.overallStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="mt-0.5 text-zinc-400 truncate">{app.vehicleTitle}</div>
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                <span>{app.applicationRef}</span>
                <span className="text-emerald-400">{formatZar(app.estimatedMonthlyZar)}/pm</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 3. BUYER FOLLOW-UP CADENCE & TEST DRIVE STUDIO
// ============================================================================

export function FollowUpStudioPanel() {
  const followUps = useQuery(api.vehicles.listFollowUps, {})
  const testDrives = useQuery(api.vehicles.listTestDrives, {})
  const scheduleMut = useMutation(api.vehicles.scheduleFollowUp)
  const bookTestDriveMut = useMutation(api.vehicles.bookTestDrive)

  const [buyerName, setBuyerName] = React.useState("Lerato Ndlovu")
  const [phone, setPhone] = React.useState("+27 82 541 8830")
  const [vehicleTitle, setVehicleTitle] = React.useState("2023 VW Golf 8 GTI DSG")
  const [cadence, setCadence] = React.useState<
    "speed_to_lead_15m" | "test_drive_24h" | "finance_fica_48h" | "price_drop_72h" | "trade_up_12m"
  >("test_drive_24h")
  const [message, setMessage] = React.useState(
    "Hi Lerato! Checking in from AutoPulse Motors SA regarding the 2023 VW Golf 8 GTI DSG. Shall we lock in your showroom test drive tomorrow at 10:00 or run instant WesBank/MFC pre-approval?"
  )
  const [branch, setBranch] = React.useState("Sandton Showroom, Gauteng")
  const [slot, setSlot] = React.useState("Saturday · 10:00 SAST")
  const [busy, setBusy] = React.useState(false)

  const templates: Record<typeof cadence, string> = {
    speed_to_lead_15m: `Hi ${buyerName.split(" ")[0]}! Thanks for enquiring on our ${vehicleTitle} via Cars.co.za / AutoTrader. It is available on our floor with full DEKRA report & FSH. Would you like a live WhatsApp walkaround video?`,
    test_drive_24h: `Hi ${buyerName.split(" ")[0]}! Checking in from AutoPulse Motors SA regarding the ${vehicleTitle}. Shall we lock in your test drive at ${branch} (${slot})?`,
    finance_fica_48h: `Hi ${buyerName.split(" ")[0]}! Our F&I desk can auto-apply your ${vehicleTitle} across WesBank, Absa, MFC & Standard Bank simultaneously. Reply here with your SA ID, licence, 3M payslips & bank statements.`,
    price_drop_72h: `Hi ${buyerName.split(" ")[0]}! Special showroom update on the ${vehicleTitle}: confirm this week and we'll include FREE Smash & Grab + On-The-Road Licensing!`,
    trade_up_12m: `Hi ${buyerName.split(" ")[0]}! Your current vehicle has strong South African trade-in equity right now. Want a free 2-minute TransUnion upgrade quote toward the ${vehicleTitle}?`,
  }

  const handleDispatch = async () => {
    setBusy(true)
    try {
      await scheduleMut({
        contactName: buyerName,
        phone,
        vehicleTitle,
        cadenceStep: cadence,
        channel: "whatsapp",
        messageBody: message,
        sendImmediately: true,
        assignedAgent: "Follow-Up Agent",
      })
      const cleanPhone = phone.replace(/\D/g, "")
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      )
      toast.add({
        type: "success",
        title: "Follow-Up Sent & Logged",
        description: `WhatsApp cadence triggered for ${buyerName}.`,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleBookTestDrive = async () => {
    setBusy(true)
    try {
      await bookTestDriveMut({
        buyerName,
        phone,
        vehicleTitle,
        branch,
        scheduledAt: slot,
      })
      toast.add({
        type: "success",
        title: "Test Drive Booked",
        description: `${buyerName} · ${vehicleTitle} at ${branch} (${slot}).`,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-zinc-800/70 pb-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber-400" />
          Buyer Follow-Ups &amp; Test Drives
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          24h/48h/72h SA WhatsApp conversion cadences + showroom test-drive scheduler.
        </p>
      </div>

      <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Buyer Name"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27 Phone"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
        </div>
        <Input
          value={vehicleTitle}
          onChange={(e) => setVehicleTitle(e.target.value)}
          placeholder="Vehicle of Interest"
          className="h-8 text-xs bg-zinc-950 border-zinc-800"
        />

        <div className="flex flex-wrap gap-1">
          {(
            [
              ["speed_to_lead_15m", "15m Speed"],
              ["test_drive_24h", "24h Test Drive"],
              ["finance_fica_48h", "48h FICA"],
              ["price_drop_72h", "72h Price Lock"],
              ["trade_up_12m", "12m Trade-Up"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setCadence(key)
                setMessage(templates[key])
              }}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-medium cursor-pointer transition",
                cadence === key
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Branch"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Input
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="Test-Drive Slot"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void handleDispatch()}
            className="h-8 flex-1 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-500 cursor-pointer"
          >
            <MessageSquare className="size-3.5" />
            Send WhatsApp Follow-Up
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void handleBookTestDrive()}
            className="h-8 gap-1.5 border-sky-500/30 bg-sky-500/10 text-xs text-sky-300 cursor-pointer"
          >
            <CalendarClock className="size-3.5" />
            Book Drive
          </Button>
        </div>
      </div>

      {/* Upcoming Test Drives & Active Follow-Ups */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Scheduled Test Drives ({testDrives?.length ?? 0}) &amp; Cadences ({followUps?.length ?? 0})
        </div>
        {(testDrives ?? []).slice(0, 3).map((td) => (
          <div
            key={td._id}
            className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-2 text-[11px]"
          >
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100 truncate">
                {td.buyerName} &bull; {td.vehicleTitle}
              </div>
              <div className="text-[10px] text-zinc-400">
                {td.branch} &bull; {td.scheduledAt}
              </div>
            </div>
            <Badge className="border-sky-500/30 bg-sky-500/15 text-[9px] text-sky-300">
              {td.status}
            </Badge>
          </div>
        ))}
        {(followUps ?? []).slice(0, 3).map((fu) => (
          <div
            key={fu._id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 text-[11px]"
          >
            <div className="min-w-0 pr-2">
              <div className="font-medium text-zinc-200 truncate">
                {fu.contactName} &bull; {fu.vehicleTitle}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">{fu.messageBody}</div>
            </div>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-[9px] text-amber-300 shrink-0">
              {fu.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 4. SA TRADE-IN VALUATION & AGING FLOORPLAN STUDIO
// ============================================================================

export function TradeInStudioPanel() {
  const dbVehicles = useQuery(api.vehicles.listVehicles, { limit: 40 })
  const vehicles: ShowroomVehicle[] =
    dbVehicles && dbVehicles.length > 0
      ? (dbVehicles as unknown as ShowroomVehicle[])
      : SA_SHOWROOM_VEHICLES

  const [year, setYear] = React.useState("2020")
  const [make, setMake] = React.useState("Toyota")
  const [model, setModel] = React.useState("Hilux 2.4 GD-6 SRX")
  const [mileageKm, setMileageKm] = React.useState("108000")
  const [condition, setCondition] = React.useState<"excellent" | "good" | "fair" | "rough">("good")
  const [fsh, setFsh] = React.useState(true)
  const [spareKeys, setSpareKeys] = React.useState(true)

  const valuation = React.useMemo(
    () =>
      estimateSaTradeInValuation({
        year: Number(year) || 2020,
        make,
        model,
        mileageKm: Number(mileageKm) || 95000,
        condition,
        fullServiceHistory: fsh,
        spareKeys,
      }),
    [year, make, model, mileageKm, condition, fsh, spareKeys]
  )

  const agingCars = vehicles.filter((v) => v.status === "available" && v.daysInStock >= 40)

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-zinc-800/70 pb-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
          <Calculator className="size-3.5 text-orange-400" />
          SA Trade-In Appraisal &amp; Floorplan Desk
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          TransUnion trade/retail bands, DEKRA/COR recon deductions &amp; 45+ day aging alerts.
        </p>
      </div>

      <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Input
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Make"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Input
            value={mileageKm}
            onChange={(e) => setMileageKm(e.target.value)}
            placeholder="Mileage km"
            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as typeof condition)}
            className="h-8 flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200"
          >
            <option value="excellent">Condition: Excellent</option>
            <option value="good">Condition: Good</option>
            <option value="fair">Condition: Fair (Recon needed)</option>
            <option value="rough">Condition: Rough (Major recon)</option>
          </select>
          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={fsh} onChange={(e) => setFsh(e.target.checked)} />
            FSH
          </label>
          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={spareKeys}
              onChange={(e) => setSpareKeys(e.target.checked)}
            />
            2 Keys
          </label>
        </div>

        {/* Valuation Result Box */}
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-300">Est. TransUnion Retail:</span>
            <span className="font-mono font-semibold text-zinc-100">
              {formatZar(valuation.transUnionRetailEstZar)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-300">Est. TransUnion Trade:</span>
            <span className="font-mono text-zinc-200">
              {formatZar(valuation.transUnionTradeEstZar)}
            </span>
          </div>
          <div className="flex justify-between text-amber-300">
            <span>DEKRA / COR / Recon Deductions:</span>
            <span className="font-mono">-{formatZar(valuation.totalReconZar)}</span>
          </div>
          <div className="flex justify-between border-t border-orange-500/20 pt-1.5 font-bold text-emerald-300">
            <span>Recommended Buy Offer:</span>
            <span className="font-mono">
              {formatZar(valuation.recommendedOfferLow)} – {formatZar(valuation.recommendedOfferHigh)}
            </span>
          </div>
        </div>
      </div>

      {/* Aging Floorplan Stock */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
          <AlertTriangle className="size-3" />
          Aging Showroom Stock (&gt;40 Days · {agingCars.length})
        </div>
        {agingCars.map((car) => (
          <div
            key={car.stockNumber}
            className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-zinc-900/40 px-2.5 py-2 text-[11px]"
          >
            <div className="min-w-0">
              <div className="font-medium text-zinc-100 truncate">
                [{car.stockNumber}] {car.year} {car.make} {car.model}
              </div>
              <div className="text-[10px] text-zinc-400">
                {car.daysInStock} days on floor &bull; {formatZar(car.retailPriceZar)}
              </div>
            </div>
            <Badge className="border-amber-500/30 bg-amber-500/15 text-[9px] text-amber-300 shrink-0">
              {car.daysInStock}d
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 5. CUSTOM SKILLS BUILDER STUDIO (Grok-Bot Extensibility)
// ============================================================================

export function CustomSkillsStudioPanel() {
  const customSkills = useQuery(api.vehicles.listCustomSkills, {})
  const createSkillMut = useMutation(api.vehicles.createCustomSkill)

  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState("publishing")
  const [description, setDescription] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) {
      toast.add({ type: "error", title: "Skill name and instructions required" })
      return
    }
    setSaving(true)
    try {
      await createSkillMut({
        name,
        category,
        description: description || name,
        instructions,
        webhookOrPortalUrl: url || undefined,
      })
      setName("")
      setDescription("")
      setInstructions("")
      setUrl("")
      toast.add({
        type: "success",
        title: "Custom Dealership Skill Added",
        description: "Now available to AutoPulse Dealership HQ & all specialists.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-zinc-800/70 pb-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
          <Wrench className="size-3.5 text-violet-400" />
          Custom Dealership Skills (Grok-Bot)
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          Built-in SA skills + create custom workflows (e.g. WeBuyCars bid, Gumtree sync, Warranty cross-sell).
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="text-[11px] font-semibold text-violet-300">
          Create New Custom Skill
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Skill name (e.g. Gumtree & OLX Multi-Poster)"
          className="h-8 text-xs bg-zinc-950 border-zinc-800"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Target Portal or Webhook URL (optional)"
          className="h-8 text-xs bg-zinc-950 border-zinc-800"
        />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Exactly how the agent should run this skill..."
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 outline-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="h-8 w-full bg-violet-600 text-xs text-white hover:bg-violet-500 cursor-pointer"
        >
          <Plus className="mr-1 size-3.5" />
          {saving ? "Saving Skill..." : "Install Custom Skill to HQ"}
        </Button>
      </form>

      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Active Skills ({DEALERSHIP_SKILLS.length + (customSkills?.length ?? 0)})
        </div>
        {(customSkills ?? []).map((sk) => (
          <div
            key={sk._id}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-2 text-[11px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-violet-200">{sk.name}</span>
              <Badge className="bg-violet-500/20 text-[9px] text-violet-200">Custom</Badge>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-300 line-clamp-2">{sk.instructions}</p>
          </div>
        ))}
        {DEALERSHIP_SKILLS.map((sk) => (
          <div
            key={sk.slug}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-2 text-[11px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-100">{sk.name}</span>
              <span className="text-[9px] font-mono text-emerald-400">Active</span>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 line-clamp-2">{sk.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
