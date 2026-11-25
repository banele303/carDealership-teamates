"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import {
  Camera,
  CarFront,
  Check,
  Loader2,
  X,
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
  formatZar,
  SA_PORTALS,
  type PortalSlug,
} from "@/lib/sa-dealership"
import { cn } from "@/lib/utils"

export interface ExtractedCarDraft {
  year: string
  make: string
  model: string
  variant: string
  priceZar: string
  mileageKm: string
  colour: string
  transmission: "Automatic" | "Manual" | "DSG" | "CVT"
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric"
  vin: string
  notes: string
  portals: PortalSlug[]
}

const KNOWN_MAKES = [
  { pattern: /\btoyota\b/i, label: "Toyota" },
  { pattern: /\b(?:vw|volkswagen)\b/i, label: "Volkswagen" },
  { pattern: /\bford\b/i, label: "Ford" },
  { pattern: /\bbmw\b/i, label: "BMW" },
  { pattern: /\bmercedes(?:-benz)?\b|\bmerc\b/i, label: "Mercedes-Benz" },
  { pattern: /\baudi\b/i, label: "Audi" },
  { pattern: /\bhyundai\b/i, label: "Hyundai" },
  { pattern: /\bkia\b/i, label: "Kia" },
  { pattern: /\bsuzuki\b/i, label: "Suzuki" },
  { pattern: /\bchery\b/i, label: "Chery" },
  { pattern: /\bhaval\b/i, label: "Haval" },
  { pattern: /\bisuzu\b/i, label: "Isuzu" },
  { pattern: /\bnissan\b/i, label: "Nissan" },
  { pattern: /\bmazda\b/i, label: "Mazda" },
  { pattern: /\bhonda\b/i, label: "Honda" },
  { pattern: /\brenault\b/i, label: "Renault" },
  { pattern: /\bland\s*rover\b|\brange\s*rover\b/i, label: "Land Rover" },
  { pattern: /\bporsche\b/i, label: "Porsche" },
  { pattern: /\bjeep\b/i, label: "Jeep" },
  { pattern: /\bvolvo\b/i, label: "Volvo" },
]

const KNOWN_MODELS = [
  "Hilux",
  "Fortuner",
  "Corolla Cross",
  "Corolla",
  "Starlet",
  "RAV4",
  "Land Cruiser",
  "Ranger",
  "Everest",
  "Polo GTI",
  "Polo Vivo",
  "Polo",
  "Golf 8 GTI",
  "Golf GTI",
  "Golf",
  "Tiguan",
  "T-Cross",
  "Amarok",
  "X3",
  "X5",
  "X1",
  "320i",
  "M3",
  "C200",
  "C-Class",
  "A-Class",
  "GLC",
  "Swift",
  "Jimny",
  "Baleno",
  "Tiggo 7 Pro Max",
  "Tiggo 4 Pro",
  "Tiggo 8 Pro",
  "Jolion",
  "H6",
  "D-Max",
  "Navara",
  "CX-5",
  "Tucson",
  "Creta",
  "Sportage",
  "Seltos",
]

/**
 * Extracts only the car details explicitly mentioned in chat text,
 * leaving unknown fields empty so the modal highlights what is missing.
 */
export function extractCarDraftFromConversation(text: string): ExtractedCarDraft {
  const yearMatch = text.match(/\b(20[0-2][0-9]|199[0-9])\b/)
  const year = yearMatch ? yearMatch[1] : ""

  const makeEntry = KNOWN_MAKES.find((m) => m.pattern.test(text))
  const make = makeEntry ? makeEntry.label : ""

  const modelMatch = KNOWN_MODELS.find((m) =>
    new RegExp(`\\b${m.replace(/\s+/g, "\\s+")}\\b`, "i").test(text)
  )
  const model = modelMatch ?? ""

  const priceMatch = text.match(/(?:R|ZAR)\s*([0-9][0-9,\s]{3,9})/i)
  const rawPrice = priceMatch ? priceMatch[1].replace(/[,\s]/g, "") : ""
  const priceZar = rawPrice && Number(rawPrice) >= 10000 ? rawPrice : ""

  const kmMatch = text.match(/\b([0-9]{1,3}(?:[,\s][0-9]{3})|[0-9]{2,6})\s*km\b/i)
  const mileageKm = kmMatch ? kmMatch[1].replace(/[,\s]/g, "") : ""

  const colourMatch = text.match(
    /\b(Glacier White|Pure White|Pearl White|Kings Red(?: Metallic)?|Moonstone Grey|Brooklyn Grey|Attitude Black|Luxe Yellow|Selenite Grey|Silver|Blue|Black|White|Grey|Gray|Red|Green|Orange|Gold|Bronze)\b/i
  )
  const colour = colourMatch ? colourMatch[1] : ""

  const vinMatch = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i)
  const vin = vinMatch ? vinMatch[1].toUpperCase() : ""

  const transmission: ExtractedCarDraft["transmission"] = /manual|\bmt\b/i.test(text)
    ? "Manual"
    : /\bdsg\b/i.test(text)
      ? "DSG"
      : /\bcvt\b/i.test(text)
        ? "CVT"
        : "Automatic"

  const fuelType: ExtractedCarDraft["fuelType"] = /diesel|gd-6|tdi|d4d|xdrive20d/i.test(text)
    ? "Diesel"
    : /hybrid/i.test(text)
      ? "Hybrid"
      : /electric|\bev\b/i.test(text)
        ? "Electric"
        : "Petrol"

  const portals: PortalSlug[] = []
  if (/cars\.co\.za/i.test(text)) portals.push("cars_co_za")
  if (/autotrader/i.test(text)) portals.push("autotrader_sa")
  if (/facebook|marketplace/i.test(text)) portals.push("facebook_marketplace")
  if (
    /database|own\s*(?:website|site)|showroom|our\s*site|website/i.test(text) ||
    portals.length === 0
  ) {
    if (!portals.includes("dealership_website")) {
      portals.unshift("dealership_website")
    }
  }

  return {
    year,
    make,
    model,
    variant: "",
    priceZar,
    mileageKm,
    colour,
    transmission,
    fuelType,
    vin,
    notes: "",
    portals,
  }
}

/**
 * Returns true when an assistant message is helping the user add/list a car
 * and asking which places or missing details are needed.
 */
export function isCarAddIntakeMessage(
  assistantText: string,
  previousUserText = ""
): boolean {
  const combined = `${previousUserText}\n${assistantText}`
  const hasCarAddIntent =
    /(?:add|list|upload|publish|post|put)\s+(?:this\s+|the\s+|a\s+|new\s+)?(?:car|vehicle|bakkie|suv|stock)/i.test(
      combined
    ) ||
    /(?:to\s+(?:our|the)\s+(?:database|databases|showroom|website|portals?))/i.test(
      combined
    ) ||
    /(?:which\s+(?:places|portals|platforms|databases)|missing\s+(?:info|information|details))/i.test(
      assistantText
    )

  if (!hasCarAddIntent) return false

  // Don't show the missing-info modal button on a message that already confirmed the car was saved
  const alreadySaved =
    /added\s+to\s+.*database|saved\s+to\s+.*stock|successfully\s+(?:added|published)/i.test(
      assistantText
    )
  return !alreadySaved
}

const PLACE_OPTIONS: Array<{
  slug: PortalSlug
  label: string
  hint: string
}> = [
  {
    slug: "dealership_website",
    label: "Our Database & Website",
    hint: "Dealership stock DB + /showroom",
  },
  {
    slug: "cars_co_za",
    label: "Cars.co.za",
    hint: "Dealer marketplace feed",
  },
  {
    slug: "autotrader_sa",
    label: "AutoTrader SA",
    hint: "AutoTrader listing feed",
  },
  {
    slug: "facebook_marketplace",
    label: "Facebook Marketplace",
    hint: "Meta vehicle catalog",
  },
]

export function ChatCarIntakeModal({
  open,
  onOpenChange,
  initialDraft,
  initialImageUrl,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDraft: ExtractedCarDraft
  initialImageUrl?: string
  onSaved?: (summary: {
    stockNumber: string
    title: string
    priceZar: number
    places: string[]
  }) => Promise<void> | void
}) {
  const upsertVehicleMut = useMutation(api.vehicles.upsertVehicle)
  const publishMut = useMutation(api.vehicles.publishToPortals)

  const [make, setMake] = React.useState(initialDraft.make)
  const [model, setModel] = React.useState(initialDraft.model)
  const [year, setYear] = React.useState(initialDraft.year)
  const [variant, setVariant] = React.useState(initialDraft.variant)
  const [priceZar, setPriceZar] = React.useState(initialDraft.priceZar)
  const [mileageKm, setMileageKm] = React.useState(initialDraft.mileageKm)
  const [colour, setColour] = React.useState(initialDraft.colour)
  const [transmission, setTransmission] = React.useState<
    ExtractedCarDraft["transmission"]
  >(initialDraft.transmission)
  const [fuelType, setFuelType] = React.useState<ExtractedCarDraft["fuelType"]>(
    initialDraft.fuelType
  )
  const [vin, setVin] = React.useState(initialDraft.vin)
  const [notes, setNotes] = React.useState(initialDraft.notes)
  const [selectedPlaces, setSelectedPlaces] = React.useState<PortalSlug[]>(
    initialDraft.portals.length > 0
      ? initialDraft.portals
      : ["dealership_website"]
  )
  const [photos, setPhotos] = React.useState<string[]>(
    initialImageUrl ? [initialImageUrl] : []
  )
  const [saving, setSaving] = React.useState(false)

  // Reset form fields whenever the modal opens with a fresh draft
  React.useEffect(() => {
    if (open) {
      setMake(initialDraft.make)
      setModel(initialDraft.model)
      setYear(initialDraft.year)
      setVariant(initialDraft.variant)
      setPriceZar(initialDraft.priceZar)
      setMileageKm(initialDraft.mileageKm)
      setColour(initialDraft.colour)
      setTransmission(initialDraft.transmission)
      setFuelType(initialDraft.fuelType)
      setVin(initialDraft.vin)
      setNotes(initialDraft.notes)
      setSelectedPlaces(
        initialDraft.portals.length > 0
          ? initialDraft.portals
          : ["dealership_website"]
      )
      setPhotos(initialImageUrl ? [initialImageUrl] : [])
    }
  }, [open, initialDraft, initialImageUrl])

  const togglePlace = (slug: PortalSlug) => {
    setSelectedPlaces((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    )
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
            setPhotos((prev) => [...prev.slice(-3), dataUrl])
          }
        }
        img.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    })
  }

  const missingCount = [
    !make.trim(),
    !model.trim(),
    !year.trim(),
    !priceZar.trim(),
    !mileageKm.trim(),
  ].filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!make.trim() || !model.trim()) {
      toast.add({
        type: "error",
        title: "Missing car make or model",
        description: "Please enter the car make and model.",
      })
      return
    }
    if (!priceZar.trim() || Number(priceZar.replace(/[,\s]/g, "")) <= 0) {
      toast.add({
        type: "error",
        title: "Missing price",
        description: "Please enter the retail price in ZAR.",
      })
      return
    }
    if (selectedPlaces.length === 0) {
      toast.add({
        type: "error",
        title: "Pick at least one place",
        description: "Select where you want to add this car.",
      })
      return
    }

    setSaving(true)
    const numericYear = Number(year) || new Date().getFullYear()
    const numericPrice = Number(priceZar.replace(/[,\s]/g, ""))
    const numericKm = Number(mileageKm.replace(/[,\s]/g, "")) || 0
    const cleanMake = make.trim()
    const cleanModel = model.trim()
    const cleanVariant = variant.trim()
    const cleanColour = colour.trim() || "White"
    const stockNumber = `APM-${String(Date.now()).slice(-4)}`
    const cleanVin =
      vin.trim().toUpperCase() ||
      `AAVZZZ${cleanMake.slice(0, 2).toUpperCase()}Z${String(Date.now()).slice(-8)}`
    const title = [numericYear, cleanMake, cleanModel, cleanVariant]
      .filter(Boolean)
      .join(" ")
    const description =
      notes.trim() ||
      `${title} in ${cleanColour} with ${numericKm.toLocaleString("en-ZA")} km. ${transmission} ${fuelType}.`
    const primaryPhoto = photos[0]

    const bodyType = /hilux|ranger|amarok|d-max|bakkie|double\s*cab/i.test(title)
      ? "Double Cab Bakkie"
      : /fortuner|x3|x5|tiggo|jolion|rav4|suv|corolla\s*cross|everest|tiguan/i.test(
            title
          )
        ? "SUV"
        : /c200|c-class|320i|sedan/i.test(title)
          ? "Sedan"
          : "Hatchback"

    try {
      await upsertVehicleMut({
        stockNumber,
        vin: cleanVin,
        year: numericYear,
        make: cleanMake,
        model: cleanModel,
        variant: cleanVariant || "Standard",
        bodyType,
        condition: numericKm < 500 ? "new" : numericKm < 8000 ? "demo" : "used",
        mileageKm: numericKm,
        transmission,
        fuelType,
        colour: cleanColour,
        retailPriceZar: numericPrice,
        costPriceZar: Math.round(numericPrice * 0.89),
        tradeInValueZar: Math.round(numericPrice * 0.84),
        branch: "Midrand Flagship, Gauteng",
        fullServiceHistory: true,
        spareKeys: true,
        features: [
          `${transmission} Transmission`,
          `${fuelType} Engine`,
          "Finance Available",
        ],
        description,
        ...(primaryPhoto ? { imageUrl: primaryPhoto } : {}),
        portals: {
          cars_co_za: selectedPlaces.includes("cars_co_za"),
          autotrader_sa: selectedPlaces.includes("autotrader_sa"),
          dealership_website: selectedPlaces.includes("dealership_website"),
          facebook_marketplace: selectedPlaces.includes("facebook_marketplace"),
        },
      })

      await publishMut({
        stockNumber,
        portals: selectedPlaces,
        headline: title,
        description,
        priceZar: numericPrice,
        vin: cleanVin,
        year: numericYear,
        make: cleanMake,
        model: cleanModel,
        variant: cleanVariant || "Standard",
        mileageKm: numericKm,
        transmission,
        fuelType,
        colour: cleanColour,
        ...(primaryPhoto ? { imageUrl: primaryPhoto } : {}),
        publishedByBot: "Dealership AI",
      })

      // Fire background feed sync if external portals were chosen
      void fetch("/api/publish-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockNumber,
          vin: cleanVin,
          year: numericYear,
          make: cleanMake,
          model: cleanModel,
          variant: cleanVariant,
          priceZar: numericPrice,
          mileageKm: numericKm,
          portals: selectedPlaces,
        }),
      }).catch(() => null)

      const placeNames = selectedPlaces.map(
        (slug) =>
          PLACE_OPTIONS.find((p) => p.slug === slug)?.label ??
          SA_PORTALS.find((p) => p.slug === slug)?.shortName ??
          slug
      )

      toast.add({
        type: "success",
        title: "Car added",
        description: `${title} (${formatZar(numericPrice)}) added to ${placeNames.join(", ")}.`,
      })

      await onSaved?.({
        stockNumber,
        title,
        priceZar: numericPrice,
        places: placeNames,
      })
      onOpenChange(false)
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not add car",
        description: err instanceof Error ? err.message : "Error saving car",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-zinc-800 bg-zinc-950 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-zinc-100">
            <CarFront className="size-4 text-sky-400" />
            Add Car Details &amp; Choose Places
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {missingCount > 0
              ? `Fill in the ${missingCount} missing detail${missingCount === 1 ? "" : "s"} below and pick where to add this car.`
              : "Review the car details and pick where you want to add it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Where to add the car */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Which places should we add this car to?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLACE_OPTIONS.map((place) => {
                const active = selectedPlaces.includes(place.slug)
                return (
                  <button
                    key={place.slug}
                    type="button"
                    onClick={() => togglePlace(place.slug)}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition cursor-pointer",
                      active
                        ? "border-sky-500/50 bg-sky-500/15 text-zinc-100"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">
                        {place.label}
                      </div>
                      <div className="truncate text-[10px] text-zinc-400">
                        {place.hint}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                        active
                          ? "border-sky-400 bg-sky-500 text-zinc-950"
                          : "border-zinc-700 bg-zinc-900"
                      )}
                    >
                      {active && <Check className="size-3 stroke-[3]" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Core car details */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Make
                </label>
                {!make.trim() && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Model
                </label>
                {!model.trim() && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Hilux"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Year
                </label>
                {!year.trim() && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2024"
                inputMode="numeric"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Price (ZAR)
                </label>
                {!priceZar.trim() && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Input
                value={priceZar}
                onChange={(e) => setPriceZar(e.target.value)}
                placeholder="e.g. 489900"
                inputMode="numeric"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Mileage (km)
                </label>
                {!mileageKm.trim() && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Input
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                placeholder="e.g. 38000"
                inputMode="numeric"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Colour
              </label>
              <Input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. Glacier White"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) =>
                  setTransmission(
                    e.target.value as ExtractedCarDraft["transmission"]
                  )
                }
                className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none focus:border-sky-500/60"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="DSG">DSG</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) =>
                  setFuelType(e.target.value as ExtractedCarDraft["fuelType"])
                }
                className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none focus:border-sky-500/60"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Variant (optional)
              </label>
              <Input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. 2.8 GD-6 GR-Sport"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                VIN (optional)
              </label>
              <Input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="17-character VIN"
                className="h-8 border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-300">
              Extra Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Full service history, spare keys, sunroof..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-100 outline-none focus:border-sky-500/60"
            />
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-300">
                Car Photos ({photos.length})
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-sky-300 hover:bg-zinc-800">
                <Camera className="size-3" />
                <span>Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-1">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative shrink-0">
                    <img
                      src={src}
                      alt={`Car photo ${idx + 1}`}
                      className="h-14 w-20 rounded-md border border-zinc-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-red-400 cursor-pointer"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-zinc-800 bg-zinc-900/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="gap-1.5 bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                `Add Car to ${selectedPlaces.length} Place${selectedPlaces.length === 1 ? "" : "s"}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
