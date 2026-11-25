import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireStaff } from "./lib/auth"
import { writeLog } from "./logs"

const PORTAL_VALIDATOR = v.union(
  v.literal("cars_co_za"),
  v.literal("autotrader_sa"),
  v.literal("dealership_website"),
  v.literal("facebook_marketplace")
)

const DEFAULT_SA_SHOWROOM = [
  {
    stockNumber: "APM-2401",
    vin: "AHTBA3CD703219845",
    year: 2024,
    make: "Toyota",
    model: "Hilux",
    variant: "2.8 GD-6 Double Cab 4x4 GR-Sport III AT",
    bodyType: "Double Cab Bakkie",
    condition: "demo" as const,
    mileageKm: 6400,
    transmission: "Automatic",
    fuelType: "Diesel",
    colour: "Glacier White",
    engineSpec: "2.8L Turbo Diesel · 165kW / 550Nm",
    retailPriceZar: 949900,
    costPriceZar: 865000,
    tradeInValueZar: 835000,
    otrFeeZar: 6950,
    daysInStock: 12,
    branch: "Midrand Flagship, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 98/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "GR-Sport Wide-Track Suspension",
      "JBL 9-Speaker Premium Audio",
      "360° Panoramic View Camera",
      "Balance of 9-Service / 90,000km Plan",
      "Securi-Lid Roller Shutter & Towbar",
    ],
    description:
      "Immaculate 2024 Toyota Hilux 2.8 GD-6 GR-Sport III 4x4 Auto with wide-track suspension, 165kW upgrade, full Toyota SA service plan and DEKRA Platinum certificate. Finance available through WesBank, Absa, MFC & Standard Bank.",
    imageUrl:
      "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    stockNumber: "APM-2402",
    vin: "AFAPXXMJ2PPE48210",
    year: 2023,
    make: "Ford",
    model: "Ranger",
    variant: "3.0 V6 TD Wildtrak 4WD Double Cab 10AT",
    bodyType: "Double Cab Bakkie",
    condition: "used" as const,
    mileageKm: 24800,
    transmission: "Automatic",
    fuelType: "Diesel",
    colour: "Luxe Yellow",
    engineSpec: "3.0L V6 Turbo Diesel · 184kW / 600Nm",
    retailPriceZar: 869900,
    costPriceZar: 792000,
    tradeInValueZar: 760000,
    otrFeeZar: 6950,
    daysInStock: 19,
    branch: "Sandton Showroom, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Gold 95/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "12-Inch SYNC 4A Portrait Display",
      "Matrix LED Headlamps",
      "Adaptive Cruise & Lane Centring",
      "Electric Roller Shutter",
      "Balance of 6yr/90,000km Service Plan",
    ],
    description:
      "Next-Gen 2023 Ford Ranger 3.0 V6 Wildtrak 4WD with 600Nm torque, SYNC 4A 12-inch touchscreen, wireless CarPlay, Matrix LEDs and full Ford SA franchise history.",
    imageUrl:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    stockNumber: "APM-2403",
    vin: "WVWZZZCDZPW118294",
    year: 2023,
    make: "Volkswagen",
    model: "Golf",
    variant: "8 GTI 2.0 TSI DSG (180kW)",
    bodyType: "Hatchback",
    condition: "used" as const,
    mileageKm: 19200,
    transmission: "DSG",
    fuelType: "Petrol",
    colour: "Moonstone Grey",
    engineSpec: "2.0L TSI Turbo · 180kW / 370Nm",
    retailPriceZar: 729900,
    costPriceZar: 658000,
    tradeInValueZar: 635000,
    otrFeeZar: 6500,
    daysInStock: 14,
    branch: "Midrand Flagship, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 97/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "Panoramic Sunroof",
      "Harman Kardon 480W Sound System",
      "19-Inch Adelaide Alloy Wheels",
      "IQ.Light Matrix LED Headlights",
      "Balance of 5yr/90,000km VW Maintenance Plan",
    ],
    description:
      "Clean, accident-free 2023 VW Golf 8 GTI in Moonstone Grey with Panoramic Roof, Harman Kardon audio, IQ.Light LEDs and active VW Maintenance Plan.",
    imageUrl:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    stockNumber: "APM-2404",
    vin: "WBA35BG050N194722",
    year: 2022,
    make: "BMW",
    model: "X3",
    variant: "xDrive20d M Sport (G01 LCI)",
    bodyType: "SUV",
    condition: "used" as const,
    mileageKm: 41500,
    transmission: "Automatic",
    fuelType: "Diesel",
    colour: "Brooklyn Grey Metallic",
    engineSpec: "2.0L TwinPower Diesel · 140kW / 400Nm",
    retailPriceZar: 799900,
    costPriceZar: 724000,
    tradeInValueZar: 695000,
    otrFeeZar: 6950,
    daysInStock: 49,
    branch: "Sandton Showroom, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Gold 94/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "BMW Live Cockpit Professional",
      "Panoramic Glass Sunroof",
      "20-Inch M Double-Spoke Alloys",
      "Electric Folding Towbar",
      "Active BMW Motorplan to 100,000km",
    ],
    description:
      "Facelift LCI 2022 BMW X3 xDrive20d M Sport in Brooklyn Grey with active BMW Motorplan, Panoramic Sunroof and electric towbar. Nationwide SA delivery.",
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: false,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    stockNumber: "APM-2405",
    vin: "AAVZZZ6RZRU039104",
    year: 2024,
    make: "Volkswagen",
    model: "Polo Vivo",
    variant: "1.4 Comfortline 5-Door",
    bodyType: "Hatchback",
    condition: "new" as const,
    mileageKm: 120,
    transmission: "Manual",
    fuelType: "Petrol",
    colour: "Pure White",
    engineSpec: "1.4L 4-Cyl Petrol · 63kW / 132Nm",
    retailPriceZar: 274900,
    costPriceZar: 249000,
    tradeInValueZar: 235000,
    otrFeeZar: 5500,
    daysInStock: 8,
    branch: "Midrand Flagship, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "Brand New Delivery PDI",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "App-Connect Apple CarPlay & Android Auto",
      "15-Inch Tosa Alloy Wheels",
      "Cruise Control",
      "Smash & Grab Safety Tint Included",
      "3yr/120,000km Factory Warranty",
    ],
    description:
      "South Africa's favourite hatchback! Brand new 2024 VW Polo Vivo 1.4 Comfortline ready for immediate delivery. Instant first-time buyer finance.",
    imageUrl:
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    stockNumber: "APM-2406",
    vin: "AHTKA3FS700628190",
    year: 2023,
    make: "Toyota",
    model: "Fortuner",
    variant: "2.8 GD-6 VX 4x4 7-Seater AT",
    bodyType: "SUV",
    condition: "used" as const,
    mileageKm: 31200,
    transmission: "Automatic",
    fuelType: "Diesel",
    colour: "Attitude Black",
    engineSpec: "2.8L Turbo Diesel · 150kW / 500Nm",
    retailPriceZar: 789900,
    costPriceZar: 718000,
    tradeInValueZar: 690000,
    otrFeeZar: 6950,
    daysInStock: 26,
    branch: "Centurion Branch, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 96/100",
    natisStatus: "On Hand",
    status: "finance_pending" as const,
    features: [
      "Toyota Safety Sense",
      "Heated Leather Seats & Power Tailgate",
      "7-Seater Family Configuration",
      "JBL 11-Speaker Audio",
      "Balance of Toyota Service Plan",
    ],
    description:
      "Top-spec 2023 Toyota Fortuner 2.8 GD-6 VX 4x4 with Toyota Safety Sense, heated leather seats, JBL sound and power tailgate.",
    imageUrl:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    stockNumber: "APM-2407",
    vin: "LVVDB21B4PD291840",
    year: 2024,
    make: "Chery",
    model: "Tiggo 7 Pro Max",
    variant: "1.6 TGDI Executive AWD DCT",
    bodyType: "Crossover",
    condition: "demo" as const,
    mileageKm: 4200,
    transmission: "Automatic",
    fuelType: "Petrol",
    colour: "Phantom Grey",
    engineSpec: "1.6L Turbo Petrol · 145kW / 290Nm",
    retailPriceZar: 549900,
    costPriceZar: 492000,
    tradeInValueZar: 470000,
    otrFeeZar: 6200,
    daysInStock: 52,
    branch: "Midrand Flagship, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 99/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "10-Year / 1,000,000km Engine Warranty",
      "Sony 8-Speaker Surround",
      "Panoramic Sunroof",
      "540° HD Transparent Chassis Camera",
      "Full ADAS Safety Suite",
    ],
    description:
      "Demo 2024 Chery Tiggo 7 Pro Max Executive AWD with dual 12.3-inch screens, Sony sound and balance of Chery 1-million km engine warranty.",
    imageUrl:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: false,
      autotrader_sa: false,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    stockNumber: "APM-2408",
    vin: "W1K2060422R074192",
    year: 2022,
    make: "Mercedes-Benz",
    model: "C-Class",
    variant: "C200 AMG Line 9G-Tronic (W206)",
    bodyType: "Sedan",
    condition: "used" as const,
    mileageKm: 36900,
    transmission: "Automatic",
    fuelType: "Hybrid",
    colour: "Selenite Grey Metallic",
    engineSpec: "1.5T Mild-Hybrid · 150kW + 15kW EQ Boost",
    retailPriceZar: 769900,
    costPriceZar: 695000,
    tradeInValueZar: 668000,
    otrFeeZar: 6950,
    daysInStock: 61,
    branch: "Sandton Showroom, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Gold 95/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "AMG Line Night Package",
      "11.9-Inch MBUX Portrait OLED Screen",
      "Burmester 3D Surround Sound",
      "Panoramic Sliding Sunroof",
      "Balance of 5yr/100,000km MobiloDrive Plan",
    ],
    description:
      "Stunning W206 2022 Mercedes-Benz C200 AMG Line Mild-Hybrid with Night Package, Burmester audio and balance of MobiloDrive plan.",
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    stockNumber: "APM-2409",
    vin: "MBHCZC63S00948211",
    year: 2024,
    make: "Suzuki",
    model: "Swift",
    variant: "1.2 GLX Auto",
    bodyType: "Hatchback",
    condition: "used" as const,
    mileageKm: 11800,
    transmission: "Automatic",
    fuelType: "Petrol",
    colour: "Sizzling Red Pearl",
    engineSpec: "1.2L Petrol · 61kW · 4.9L/100km",
    retailPriceZar: 239900,
    costPriceZar: 212000,
    tradeInValueZar: 198000,
    otrFeeZar: 5200,
    daysInStock: 9,
    branch: "Cape Town Foreshore, WC",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 98/100",
    natisStatus: "On Hand",
    status: "available" as const,
    features: [
      "Keyless Entry & Push-Button Start",
      "Reverse Camera & Rear PDC",
      "LED Projector Headlamps",
      "Apple CarPlay & Android Auto",
      "Ultra-Low 4.9L/100km Consumption",
    ],
    description:
      "Fuel-sipping 2024 Suzuki Swift 1.2 GLX Auto with reverse camera, keyless entry, alloy wheels and remaining factory warranty.",
    imageUrl:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    stockNumber: "APM-2410",
    vin: "LGWEE4A50PK630192",
    year: 2023,
    make: "Haval",
    model: "Jolion",
    variant: "1.5T S Super Luxury 7DCT",
    bodyType: "Crossover",
    condition: "used" as const,
    mileageKm: 22400,
    transmission: "Automatic",
    fuelType: "Petrol",
    colour: "Hamilton White",
    engineSpec: "1.5L Turbo Petrol · 130kW / 270Nm",
    retailPriceZar: 389900,
    costPriceZar: 348000,
    tradeInValueZar: 325000,
    otrFeeZar: 5950,
    daysInStock: 17,
    branch: "Centurion Branch, Gauteng",
    fullServiceHistory: true,
    spareKeys: true,
    dekraGrade: "DEKRA Platinum 96/100",
    natisStatus: "On Hand",
    status: "reserved" as const,
    features: [
      "Head-Up Display (HUD)",
      "Panoramic Sunroof & Sport Trim",
      "360° Surround Camera + Auto Park",
      "Adaptive Cruise Control",
      "5yr/100,000km Warranty & Service Plan",
    ],
    description:
      "Sporty 2023 Haval Jolion S Super Luxury (130kW) with panoramic roof, HUD, blacked-out sport pack and full GWM SA franchise service history.",
    imageUrl:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
]

function buildVehicleSearchText(vObj: {
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  variant: string
  bodyType: string
  colour: string
  branch: string
}) {
  return [
    vObj.stockNumber,
    vObj.vin,
    String(vObj.year),
    vObj.make,
    vObj.model,
    vObj.variant,
    vObj.bodyType,
    vObj.colour,
    vObj.branch,
  ]
    .filter(Boolean)
    .join(" ")
}

// ---------------------------------------------------------------------------
// 1. Showroom Vehicle Inventory Queries & Mutations
// ---------------------------------------------------------------------------

export const listVehicles = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("reserved"),
        v.literal("finance_pending"),
        v.literal("sold")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const rows = args.status
      ? await ctx.db
          .query("vehicle_inventory")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(args.limit ?? 100)
      : await ctx.db
          .query("vehicle_inventory")
          .order("desc")
          .take(args.limit ?? 100)
    return rows
  },
})

// Public query for /showroom dealership website & XML feeds (no staff auth required)
export const listPublicShowroom = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("vehicle_inventory").order("desc").take(100)
    if (rows.length === 0) {
      return DEFAULT_SA_SHOWROOM.filter((vRow) => vRow.status !== "sold")
    }
    return rows.filter((vRow) => vRow.status !== "sold")
  },
})

export const upsertVehicle = mutation({
  args: {
    stockNumber: v.string(),
    vin: v.string(),
    year: v.number(),
    make: v.string(),
    model: v.string(),
    variant: v.string(),
    bodyType: v.string(),
    condition: v.union(v.literal("new"), v.literal("used"), v.literal("demo")),
    mileageKm: v.number(),
    transmission: v.string(),
    fuelType: v.string(),
    colour: v.string(),
    engineSpec: v.optional(v.string()),
    retailPriceZar: v.number(),
    costPriceZar: v.number(),
    tradeInValueZar: v.number(),
    otrFeeZar: v.optional(v.number()),
    daysInStock: v.optional(v.number()),
    branch: v.string(),
    fullServiceHistory: v.boolean(),
    spareKeys: v.boolean(),
    dekraGrade: v.optional(v.string()),
    natisStatus: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("reserved"),
        v.literal("finance_pending"),
        v.literal("sold")
      )
    ),
    features: v.array(v.string()),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    portals: v.optional(
      v.object({
        cars_co_za: v.boolean(),
        autotrader_sa: v.boolean(),
        dealership_website: v.boolean(),
        facebook_marketplace: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const now = Date.now()
    const existing = await ctx.db
      .query("vehicle_inventory")
      .withIndex("by_stockNumber", (q) => q.eq("stockNumber", args.stockNumber.trim()))
      .first()

    const doc = {
      stockNumber: args.stockNumber.trim().toUpperCase(),
      vin: args.vin.trim().toUpperCase(),
      year: args.year,
      make: args.make.trim(),
      model: args.model.trim(),
      variant: args.variant.trim(),
      bodyType: args.bodyType.trim(),
      condition: args.condition,
      mileageKm: args.mileageKm,
      transmission: args.transmission.trim(),
      fuelType: args.fuelType.trim(),
      colour: args.colour.trim(),
      engineSpec: args.engineSpec?.trim(),
      retailPriceZar: args.retailPriceZar,
      costPriceZar: args.costPriceZar,
      tradeInValueZar: args.tradeInValueZar,
      otrFeeZar: args.otrFeeZar ?? 6500,
      daysInStock: args.daysInStock ?? existing?.daysInStock ?? 1,
      branch: args.branch.trim() || "Midrand Flagship, Gauteng",
      fullServiceHistory: args.fullServiceHistory,
      spareKeys: args.spareKeys,
      dekraGrade: args.dekraGrade ?? "DEKRA Platinum Verified",
      natisStatus: args.natisStatus ?? "On Hand",
      status: args.status ?? existing?.status ?? "available",
      features: args.features,
      description: args.description.trim(),
      imageUrl: args.imageUrl?.trim(),
      portals: args.portals ??
        existing?.portals ?? {
          cars_co_za: false,
          autotrader_sa: false,
          dealership_website: true,
          facebook_marketplace: false,
        },
      searchText: buildVehicleSearchText(args),
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, doc)
      return { vehicleId: existing._id, created: false }
    }

    const vehicleId = await ctx.db.insert("vehicle_inventory", doc)
    await writeLog(ctx, {
      app: "system",
      actionName: "vehicle.added_to_showroom",
      status: "success",
      payload: { stockNumber: doc.stockNumber, title: `${doc.year} ${doc.make} ${doc.model}` },
    })
    return { vehicleId, created: true }
  },
})

// ---------------------------------------------------------------------------
// 2. Multi-Portal Publishing (Cars.co.za, AutoTrader SA, Own Website, FB)
// ---------------------------------------------------------------------------

export const publishToPortals = mutation({
  args: {
    vehicleId: v.optional(v.id("vehicle_inventory")),
    stockNumber: v.string(),
    portals: v.array(PORTAL_VALIDATOR),
    headline: v.optional(v.string()),
    description: v.optional(v.string()),
    priceZar: v.optional(v.number()),
    publishedByBot: v.optional(v.string()),
    // Optional brand-new vehicle creation fields (from Photo Drop / NaTIS Decoder / Chat Intake)
    vin: v.optional(v.string()),
    year: v.optional(v.number()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    variant: v.optional(v.string()),
    bodyType: v.optional(v.string()),
    condition: v.optional(v.union(v.literal("new"), v.literal("used"), v.literal("demo"))),
    mileageKm: v.optional(v.number()),
    transmission: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    colour: v.optional(v.string()),
    branch: v.optional(v.string()),
    fullServiceHistory: v.optional(v.boolean()),
    dekraGrade: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const now = Date.now()
    const cleanStock = args.stockNumber.trim().toUpperCase()

    let vehicle = args.vehicleId ? await ctx.db.get(args.vehicleId) : null
    if (!vehicle) {
      vehicle = await ctx.db
        .query("vehicle_inventory")
        .withIndex("by_stockNumber", (q) => q.eq("stockNumber", cleanStock))
        .first()
    }

    // If vehicle is not in DB yet, create it from passed specs (brand-new car intake) or seed match
    if (!vehicle) {
      const seedMatch = DEFAULT_SA_SHOWROOM.find(
        (item) => item.stockNumber.toUpperCase() === cleanStock
      )

      if (args.make && args.model) {
        const retail = args.priceZar ?? 489900
        const customDoc = {
          stockNumber: cleanStock,
          vin: (args.vin || `AAVZZZ${args.make.slice(0, 2).toUpperCase()}Z${String(now).slice(-8)}`).toUpperCase(),
          year: args.year ?? 2024,
          make: args.make.trim(),
          model: args.model.trim(),
          variant: args.variant?.trim() || "Showroom Edition",
          bodyType: args.bodyType?.trim() || "SUV",
          condition: args.condition ?? "used",
          mileageKm: args.mileageKm ?? 18500,
          transmission: args.transmission?.trim() || "Automatic",
          fuelType: args.fuelType?.trim() || "Petrol",
          colour: args.colour?.trim() || "Glacier White",
          engineSpec: `${args.fuelType || "Petrol"} · ${args.transmission || "Automatic"}`,
          retailPriceZar: retail,
          costPriceZar: Math.round((retail * 0.895) / 1000) * 1000,
          tradeInValueZar: Math.round((retail * 0.855) / 1000) * 1000,
          otrFeeZar: 6500,
          daysInStock: 1,
          branch: args.branch?.trim() || "Midrand Flagship, Gauteng",
          fullServiceHistory: args.fullServiceHistory ?? true,
          spareKeys: true,
          dekraGrade: args.dekraGrade || "DEKRA Platinum 98/100",
          natisStatus: "On Hand",
          status: "available" as const,
          features:
            args.features && args.features.length > 0
              ? args.features
              : [
                  "Full Franchise Service History (FSH)",
                  "DEKRA Roadworthy & Multi-Point Verified",
                  "Apple CarPlay & Android Auto",
                  "WesBank, Absa, MFC & Standard Bank Finance Ready",
                ],
          description:
            args.description?.trim() ||
            `Immaculate ${args.year ?? 2024} ${args.make} ${args.model} ${args.variant ?? ""} with ${(args.mileageKm ?? 18500).toLocaleString("en-ZA")} km. Full service history, DEKRA verified, instant multi-bank finance available.`,
          imageUrl:
            args.imageUrl?.trim() ||
            "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80",
          portals: {
            cars_co_za: args.portals.includes("cars_co_za"),
            autotrader_sa: args.portals.includes("autotrader_sa"),
            dealership_website: args.portals.includes("dealership_website"),
            facebook_marketplace: args.portals.includes("facebook_marketplace"),
          },
        }
        const newId = await ctx.db.insert("vehicle_inventory", {
          ...customDoc,
          searchText: buildVehicleSearchText(customDoc),
          updatedAt: now,
        })
        vehicle = (await ctx.db.get(newId))!
      } else {
        const fallbackSeed = seedMatch ?? DEFAULT_SA_SHOWROOM[0]
        const newId = await ctx.db.insert("vehicle_inventory", {
          ...fallbackSeed,
          searchText: buildVehicleSearchText(fallbackSeed),
          updatedAt: now,
        })
        vehicle = (await ctx.db.get(newId))!
      }
    }

    const updatedPortals = { ...vehicle.portals }
    const results: Array<{
      portal: string
      externalListingId: string
      listingUrl: string
      feedFormat: string
    }> = []

    const headline =
      args.headline?.trim() ||
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant}`
    const priceZar = args.priceZar ?? vehicle.retailPriceZar

    for (const portal of args.portals) {
      updatedPortals[portal] = true
      const suffix = `${vehicle.stockNumber}-${Date.now().toString(36).slice(-4).toUpperCase()}`
      const externalListingId =
        portal === "cars_co_za"
          ? `CARS-DAP-${suffix}`
          : portal === "autotrader_sa"
            ? `AT-ZA-${suffix}`
            : portal === "facebook_marketplace"
              ? `META-AIA-${suffix}`
              : `WEB-${suffix}`

      const listingUrl =
        portal === "cars_co_za"
          ? `https://www.cars.co.za/for-sale/used/${vehicle.year}-${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}/${externalListingId}`
          : portal === "autotrader_sa"
            ? `https://www.autotrader.co.za/car-for-sale/${vehicle.make.toLowerCase()}/${vehicle.model.toLowerCase()}/${externalListingId}`
            : portal === "facebook_marketplace"
              ? `https://www.facebook.com/marketplace/item/${externalListingId}`
              : `/showroom?stock=${encodeURIComponent(vehicle.stockNumber)}`

      const feedFormat =
        portal === "cars_co_za"
          ? "Cars.co.za DAP XML"
          : portal === "autotrader_sa"
            ? "AutoTrader SA DMS XML"
            : portal === "facebook_marketplace"
              ? "Meta Vehicle Catalog CSV/API"
              : "AutoPulse Live Website Showroom"

      // Upsert portal_listings row
      const existingListing = await ctx.db
        .query("portal_listings")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle!._id))
        .filter((q) => q.eq(q.field("portal"), portal))
        .first()

      if (existingListing) {
        await ctx.db.patch(existingListing._id, {
          status: "published",
          externalListingId,
          listingUrl,
          headline,
          priceZar,
          feedFormat,
          publishedByBot: args.publishedByBot ?? "Portal Publisher Agent",
          publishedAt: now,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert("portal_listings", {
          vehicleId: vehicle._id,
          stockNumber: vehicle.stockNumber,
          portal,
          status: "published",
          externalListingId,
          listingUrl,
          headline,
          priceZar,
          feedFormat,
          publishedByBot: args.publishedByBot ?? "Portal Publisher Agent",
          publishedAt: now,
          updatedAt: now,
        })
      }

      results.push({ portal, externalListingId, listingUrl, feedFormat })
    }

    await ctx.db.patch(vehicle._id, {
      portals: updatedPortals,
      retailPriceZar: priceZar,
      ...(args.description?.trim() ? { description: args.description.trim() } : {}),
      ...(args.imageUrl?.trim() ? { imageUrl: args.imageUrl.trim() } : {}),
      ...(args.mileageKm !== undefined ? { mileageKm: args.mileageKm } : {}),
      ...(args.colour?.trim() ? { colour: args.colour.trim() } : {}),
      updatedAt: now,
    })

    await writeLog(ctx, {
      app: "agent",
      actionName: "vehicle.multi_portal_published",
      status: "success",
      payload: {
        stockNumber: vehicle.stockNumber,
        headline,
        portals: args.portals,
        priceZar,
      },
    })

    return {
      success: true,
      vehicleId: vehicle._id,
      stockNumber: vehicle.stockNumber,
      headline,
      publishedCount: results.length,
      listings: results,
    }
  },
})

export const listPortalListings = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await ctx.db.query("portal_listings").order("desc").take(100)
  },
})

// ---------------------------------------------------------------------------
// 3. South African Multi-Bank Vehicle Finance Applications (VAF)
// ---------------------------------------------------------------------------

export const listFinanceApplications = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await ctx.db.query("finance_applications").order("desc").take(80)
  },
})

export const submitFinanceApplication = mutation({
  args: {
    applicantName: v.string(),
    saIdNumber: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    employmentStatus: v.string(),
    employerName: v.string(),
    jobTitle: v.optional(v.string()),
    grossMonthlyIncomeZar: v.number(),
    monthlyExpensesZar: v.number(),
    vehicleId: v.optional(v.id("vehicle_inventory")),
    stockNumber: v.optional(v.string()),
    vehicleTitle: v.string(),
    vehiclePriceZar: v.number(),
    depositZar: v.number(),
    tradeInEquityZar: v.optional(v.number()),
    balloonPct: v.number(),
    interestRatePct: v.number(),
    termMonths: v.number(),
    estimatedMonthlyZar: v.number(),
    affordabilityStatus: v.string(),
    ficaChecklist: v.object({
      idCopy: v.boolean(),
      driversLicense: v.boolean(),
      bankStatements3m: v.boolean(),
      payslips3m: v.boolean(),
      proofOfAddress: v.boolean(),
    }),
    banks: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const now = Date.now()
    const applicationRef = `VAF-ZA-${String(now).slice(-6)}`
    const tradeInEquityZar = args.tradeInEquityZar ?? 0
    const balloonAmountZar = Math.round(args.vehiclePriceZar * (args.balloonPct / 100))

    const bankSubmissions = (args.banks.length > 0 ? args.banks : ["WesBank", "Absa Vehicle Finance", "MFC (Nedbank)"]).map(
      (bank, idx) => {
        const prefix = bank
          .replace(/[^A-Z]/gi, "")
          .slice(0, 3)
          .toUpperCase()
        return {
          bank,
          status: "submitted" as const,
          referenceNo: `${prefix}-${String(now + idx * 17).slice(-6)}`,
          offeredRatePct: Math.round((args.interestRatePct + idx * 0.15) * 100) / 100,
          submittedAt: now,
        }
      }
    )

    const allFicaReady = Object.values(args.ficaChecklist).every(Boolean)
    const overallStatus = allFicaReady
      ? ("submitted_to_banks" as const)
      : ("fica_pending" as const)

    const id = await ctx.db.insert("finance_applications", {
      applicationRef,
      applicantName: args.applicantName.trim(),
      saIdNumber: args.saIdNumber.trim(),
      phone: args.phone.trim(),
      email: args.email.trim(),
      address: args.address.trim() || "Johannesburg, Gauteng",
      employmentStatus: args.employmentStatus.trim() || "Permanent Full-Time",
      employerName: args.employerName.trim() || "Not specified",
      jobTitle: args.jobTitle?.trim(),
      grossMonthlyIncomeZar: args.grossMonthlyIncomeZar,
      monthlyExpensesZar: args.monthlyExpensesZar,
      vehicleId: args.vehicleId,
      stockNumber: args.stockNumber,
      vehicleTitle: args.vehicleTitle.trim(),
      vehiclePriceZar: args.vehiclePriceZar,
      depositZar: args.depositZar,
      tradeInEquityZar,
      balloonPct: args.balloonPct,
      balloonAmountZar,
      interestRatePct: args.interestRatePct,
      termMonths: args.termMonths,
      estimatedMonthlyZar: args.estimatedMonthlyZar,
      affordabilityStatus: args.affordabilityStatus,
      ficaChecklist: args.ficaChecklist,
      bankSubmissions,
      overallStatus,
      notes: args.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    })

    // Sync contact in CRM if phone matches or create
    const cleanPhone = args.phone.replace(/\D/g, "")
    if (cleanPhone.length >= 9) {
      const existing = await ctx.db
        .query("crm_contacts")
        .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
        .first()
      if (existing) {
        await ctx.db.patch(existing._id, {
          email: args.email || existing.email,
          companyName: args.employerName || existing.companyName,
          lastInboundAt: now,
        })
      } else {
        await ctx.db.insert("crm_contacts", {
          name: args.applicantName.trim(),
          companyName: args.employerName.trim() || undefined,
          type: "retail_b2c",
          phone: cleanPhone,
          email: args.email.trim() || undefined,
          socialHandles: {},
          leadScore: 88,
          lifetimeValue: args.vehiclePriceZar,
          lastInboundAt: now,
          autopilot: true,
          source: "whatsapp",
          tags: ["finance_application", applicationRef],
        })
      }
    }

    await writeLog(ctx, {
      app: "agent",
      actionName: "finance.multi_bank_submitted",
      status: "success",
      payload: {
        applicationRef,
        applicant: args.applicantName,
        vehicle: args.vehicleTitle,
        banks: bankSubmissions.map((b) => b.bank),
        estimatedMonthlyZar: args.estimatedMonthlyZar,
      },
    })

    return {
      id,
      applicationRef,
      overallStatus,
      bankSubmissions,
    }
  },
})

export const updateFinanceStatus = mutation({
  args: {
    applicationId: v.id("finance_applications"),
    overallStatus: v.union(
      v.literal("draft"),
      v.literal("fica_pending"),
      v.literal("submitted_to_banks"),
      v.literal("approved"),
      v.literal("signed"),
      v.literal("declined")
    ),
  },
  handler: async (ctx, { applicationId, overallStatus }) => {
    await requireStaff(ctx)
    const app = await ctx.db.get(applicationId)
    if (!app) throw new Error("Finance application not found")

    const updatedBanks =
      overallStatus === "approved" || overallStatus === "signed"
        ? app.bankSubmissions.map((b, i) =>
            i === 0 ? { ...b, status: "approved" as const } : b
          )
        : app.bankSubmissions

    await ctx.db.patch(applicationId, {
      overallStatus,
      bankSubmissions: updatedBanks,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

// ---------------------------------------------------------------------------
// 4. Buyer Follow-Up Cadences & Test Drives
// ---------------------------------------------------------------------------

export const listFollowUps = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await ctx.db.query("follow_up_tasks").order("desc").take(80)
  },
})

export const scheduleFollowUp = mutation({
  args: {
    contactName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    vehicleTitle: v.string(),
    cadenceStep: v.union(
      v.literal("speed_to_lead_15m"),
      v.literal("test_drive_24h"),
      v.literal("finance_fica_48h"),
      v.literal("price_drop_72h"),
      v.literal("trade_up_12m"),
      v.literal("custom")
    ),
    channel: v.union(v.literal("whatsapp"), v.literal("email")),
    messageBody: v.string(),
    sendImmediately: v.optional(v.boolean()),
    assignedAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const now = Date.now()
    const status = args.sendImmediately ? ("sent" as const) : ("scheduled" as const)

    const id = await ctx.db.insert("follow_up_tasks", {
      contactName: args.contactName.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim(),
      vehicleTitle: args.vehicleTitle.trim(),
      cadenceStep: args.cadenceStep,
      channel: args.channel,
      messageBody: args.messageBody.trim(),
      status,
      scheduledFor: now,
      sentAt: args.sendImmediately ? now : undefined,
      assignedAgent: args.assignedAgent ?? "Follow-Up Agent",
      createdAt: now,
    })

    await writeLog(ctx, {
      app: args.channel === "whatsapp" ? "whapi" : "composio",
      actionName: `followup.${args.cadenceStep}`,
      status: "success",
      payload: {
        contactName: args.contactName,
        vehicleTitle: args.vehicleTitle,
        channel: args.channel,
        status,
      },
    })

    return { id, status }
  },
})

export const markFollowUpSent = mutation({
  args: { taskId: v.id("follow_up_tasks") },
  handler: async (ctx, { taskId }) => {
    await requireStaff(ctx)
    await ctx.db.patch(taskId, { status: "sent", sentAt: Date.now() })
    return { success: true }
  },
})

export const listTestDrives = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await ctx.db.query("test_drives").order("desc").take(60)
  },
})

export const bookTestDrive = mutation({
  args: {
    buyerName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicle_inventory")),
    stockNumber: v.optional(v.string()),
    vehicleTitle: v.string(),
    branch: v.string(),
    scheduledAt: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const now = Date.now()
    const id = await ctx.db.insert("test_drives", {
      buyerName: args.buyerName.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim(),
      vehicleId: args.vehicleId,
      stockNumber: args.stockNumber,
      vehicleTitle: args.vehicleTitle.trim(),
      branch: args.branch.trim() || "Midrand Flagship, Gauteng",
      scheduledAt: args.scheduledAt.trim(),
      status: "booked",
      notes: args.notes?.trim(),
      createdAt: now,
    })

    await writeLog(ctx, {
      app: "agent",
      actionName: "showroom.test_drive_booked",
      status: "success",
      payload: {
        buyerName: args.buyerName,
        vehicleTitle: args.vehicleTitle,
        branch: args.branch,
        scheduledAt: args.scheduledAt,
      },
    })

    return { id }
  },
})

// ---------------------------------------------------------------------------
// 4B. Closed-Loop Showroom & Portal Buyer Capture (Public Mutation)
// Automatically creates CRM Contact + Deal + Finance App / Test Drive + 60s WhatsApp Follow-Up
// ---------------------------------------------------------------------------

export const submitShowroomEnquiry = mutation({
  args: {
    buyerName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    saIdNumber: v.optional(v.string()),
    stockNumber: v.string(),
    vehicleTitle: v.string(),
    vehiclePriceZar: v.number(),
    enquiryType: v.union(
      v.literal("finance"),
      v.literal("test_drive"),
      v.literal("whatsapp_quote")
    ),
    portalSource: v.optional(v.string()),
    depositZar: v.optional(v.number()),
    termMonths: v.optional(v.number()),
    balloonPct: v.optional(v.number()),
    grossMonthlyIncomeZar: v.optional(v.number()),
    monthlyExpensesZar: v.optional(v.number()),
    employerName: v.optional(v.string()),
    preferredTestDriveSlot: v.optional(v.string()),
    branch: v.optional(v.string()),
    banks: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const cleanPhone = args.phone.replace(/\D/g, "") || "27820000000"
    const sourceLabel = args.portalSource || "dealership_website"

    // 1. Upsert CRM Contact
    let contact = await ctx.db
      .query("crm_contacts")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first()

    if (contact) {
      await ctx.db.patch(contact._id, {
        name: args.buyerName.trim() || contact.name,
        email: args.email?.trim() || contact.email,
        companyName: args.employerName?.trim() || contact.companyName,
        lastInboundAt: now,
      })
    } else {
      const contactId = await ctx.db.insert("crm_contacts", {
        name: args.buyerName.trim(),
        companyName: args.employerName?.trim() || undefined,
        type: "retail_b2c",
        phone: cleanPhone,
        email: args.email?.trim() || undefined,
        socialHandles: {},
        leadScore: args.enquiryType === "finance" ? 94 : 86,
        lifetimeValue: args.vehiclePriceZar,
        lastInboundAt: now,
        autopilot: true,
        source: "whatsapp",
        tags: [sourceLabel, args.stockNumber, args.enquiryType],
      })
      contact = (await ctx.db.get(contactId))!
    }

    // 2. Create CRM Deal in pipeline
    const dealId = await ctx.db.insert("deals", {
      contactId: contact._id,
      title: `${args.vehicleTitle} (${args.stockNumber})`,
      stage: args.enquiryType === "finance" ? "QUOTE_SENT" : "NEW_LEAD",
      totalValue: args.vehiclePriceZar,
      currency: "ZAR",
      assignedAgent:
        args.enquiryType === "finance" ? "Finance & F&I Agent" : "Follow-Up Agent",
      items: [
        {
          partName: args.vehicleTitle,
          oemNumber: args.stockNumber,
          quantity: 1,
          unitPrice: args.vehiclePriceZar,
        },
      ],
      notes: `Inbound ${sourceLabel} ${args.enquiryType} lead from ${args.buyerName} (${args.phone}). ${args.notes ?? ""}`.trim(),
      updatedAt: now,
    })

    // 3. Calculate NCA monthly instalment & optional multi-bank finance application
    const depositZar = args.depositZar ?? Math.round(args.vehiclePriceZar * 0.1)
    const termMonths = args.termMonths ?? 72
    const balloonPct = args.balloonPct ?? 20
    const interestRatePct = 11.75
    const balloonAmountZar = Math.round(args.vehiclePriceZar * (balloonPct / 100))
    const principal = Math.max(
      0,
      args.vehiclePriceZar + 6500 + 1207.5 - depositZar
    )
    const r = interestRatePct / 100 / 12
    const df = Math.pow(1 + r, -termMonths)
    const amortizing = Math.max(0, principal - balloonAmountZar * df)
    const estimatedMonthlyZar = Math.round((amortizing * r) / (1 - df) + 69)

    let applicationRef: string | undefined
    let bankSubmissions: Array<{
      bank: string
      status: "submitted" | "reviewing" | "approved" | "declined"
      referenceNo: string
      offeredRatePct?: number
      submittedAt: number
    }> = []

    if (args.enquiryType === "finance") {
      applicationRef = `VAF-ZA-${String(now).slice(-6)}`
      const targetBanks =
        args.banks && args.banks.length > 0
          ? args.banks
          : [
              "WesBank",
              "Absa Vehicle Finance",
              "MFC (Nedbank)",
              "Standard Bank VAF",
              "Capitec / Signio",
            ]

      bankSubmissions = targetBanks.map((bank, idx) => {
        const prefix = bank
          .replace(/[^A-Z]/gi, "")
          .slice(0, 3)
          .toUpperCase()
        return {
          bank,
          status: "submitted" as const,
          referenceNo: `${prefix}-${String(now + idx * 19).slice(-6)}`,
          offeredRatePct: Math.round((interestRatePct + idx * 0.15) * 100) / 100,
          submittedAt: now,
        }
      })

      await ctx.db.insert("finance_applications", {
        applicationRef,
        applicantName: args.buyerName.trim(),
        saIdNumber: args.saIdNumber?.trim() || "9001015009087",
        phone: args.phone.trim(),
        email: args.email?.trim() || "buyer@autopulsemotors.co.za",
        address: args.branch || "Midrand, Gauteng",
        employmentStatus: "Permanent Full-Time",
        employerName: args.employerName?.trim() || "Verified SA Employer",
        grossMonthlyIncomeZar: args.grossMonthlyIncomeZar ?? estimatedMonthlyZar * 4,
        monthlyExpensesZar: args.monthlyExpensesZar ?? estimatedMonthlyZar * 1.4,
        stockNumber: args.stockNumber,
        vehicleTitle: args.vehicleTitle,
        vehiclePriceZar: args.vehiclePriceZar,
        depositZar,
        tradeInEquityZar: 0,
        balloonPct,
        balloonAmountZar,
        interestRatePct,
        termMonths,
        estimatedMonthlyZar,
        affordabilityStatus: "pre_qualified",
        ficaChecklist: {
          idCopy: true,
          driversLicense: true,
          bankStatements3m: true,
          payslips3m: false,
          proofOfAddress: true,
        },
        bankSubmissions,
        overallStatus: "submitted_to_banks",
        notes: `Submitted directly from ${sourceLabel} showroom drawer.`,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 4. Optional Test Drive booking
    let testDriveId: Id<"test_drives"> | undefined
    if (args.enquiryType === "test_drive" || args.preferredTestDriveSlot) {
      testDriveId = await ctx.db.insert("test_drives", {
        buyerName: args.buyerName.trim(),
        phone: args.phone.trim(),
        email: args.email?.trim(),
        stockNumber: args.stockNumber,
        vehicleTitle: args.vehicleTitle,
        branch: args.branch?.trim() || "Midrand Flagship, Gauteng",
        scheduledAt: args.preferredTestDriveSlot?.trim() || "Tomorrow · 10:30 SAST",
        status: "booked",
        notes: args.notes?.trim() || `Booked via ${sourceLabel}`,
        createdAt: now,
      })
    }

    // 5. Instant 60-Second Speed-to-Lead WhatsApp Follow-Up Task
    const whatsappReply =
      args.enquiryType === "finance"
        ? `Hi ${args.buyerName}! AutoPulse Motors SA here. Your multi-bank finance application (${applicationRef}) for the ${args.vehicleTitle} (R ${args.vehiclePriceZar.toLocaleString("en-ZA")} · est. R ${estimatedMonthlyZar.toLocaleString("en-ZA")}/pm) has been dispatched to ${bankSubmissions.map((b) => b.bank).join(", ")}. Reply here with your latest payslip PDF to release your final rate!`
        : args.enquiryType === "test_drive"
          ? `Hi ${args.buyerName}! Your test drive for the ${args.vehicleTitle} (${args.stockNumber}) is confirmed at ${args.branch || "Midrand Flagship"} for ${args.preferredTestDriveSlot || "Tomorrow at 10:30"}. Please bring your SA Driver's Licence — coffee is on us!`
          : `Hi ${args.buyerName}! Thanks for enquiring on our ${args.vehicleTitle} (${args.stockNumber} · R ${args.vehiclePriceZar.toLocaleString("en-ZA")}, est. R ${estimatedMonthlyZar.toLocaleString("en-ZA")}/pm). Would you like to book a showroom test drive today or run a 60-second WesBank/Absa/MFC pre-approval?`

    const followUpId = await ctx.db.insert("follow_up_tasks", {
      contactName: args.buyerName.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim(),
      vehicleTitle: args.vehicleTitle,
      cadenceStep: "speed_to_lead_15m",
      channel: "whatsapp",
      messageBody: whatsappReply,
      status: "sent",
      scheduledFor: now,
      sentAt: now,
      assignedAgent: "Follow-Up Agent",
      createdAt: now,
    })

    await writeLog(ctx, {
      app: "whapi",
      actionName: `showroom.closed_loop_${args.enquiryType}`,
      status: "success",
      payload: {
        buyerName: args.buyerName,
        stockNumber: args.stockNumber,
        vehicleTitle: args.vehicleTitle,
        portalSource: sourceLabel,
        dealId,
        applicationRef,
      },
    })

    return {
      success: true,
      dealId,
      contactId: contact._id,
      applicationRef,
      bankSubmissions,
      testDriveId,
      followUpId,
      estimatedMonthlyZar,
      whatsappReply,
    }
  },
})

// ---------------------------------------------------------------------------
// 5. User-Defined Custom Dealership Skills
// ---------------------------------------------------------------------------

export const listCustomSkills = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await ctx.db.query("custom_skills").order("desc").take(50)
  },
})

export const createCustomSkill = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.string(),
    instructions: v.string(),
    webhookOrPortalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
    const id = await ctx.db.insert("custom_skills", {
      slug: slug || `skill_${Date.now().toString(36)}`,
      name: args.name.trim(),
      category: args.category.trim() || "custom",
      description: args.description.trim(),
      instructions: args.instructions.trim(),
      webhookOrPortalUrl: args.webhookOrPortalUrl?.trim() || undefined,
      enabled: true,
      createdAt: Date.now(),
    })
    return { id, slug }
  },
})

// ---------------------------------------------------------------------------
// 6. Seed Full South African Dealership Showroom, Finance & Follow-Up Data
// ---------------------------------------------------------------------------

export const seedDealershipData = mutation({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    const existing = await ctx.db.query("vehicle_inventory").first()
    if (existing) {
      return { seeded: false, message: "Dealership showroom already populated." }
    }

    const now = Date.now()
    const vehicleIds: Id<"vehicle_inventory">[] = []

    for (const vSpec of DEFAULT_SA_SHOWROOM) {
      const id = await ctx.db.insert("vehicle_inventory", {
        ...vSpec,
        searchText: buildVehicleSearchText(vSpec),
        updatedAt: now,
      })
      vehicleIds.push(id)

      // Populate initial portal listings for published portals
      const activePortals = (
        Object.entries(vSpec.portals) as Array<
          ["cars_co_za" | "autotrader_sa" | "dealership_website" | "facebook_marketplace", boolean]
        >
      ).filter(([, isLive]) => isLive)

      for (const [portal] of activePortals) {
        await ctx.db.insert("portal_listings", {
          vehicleId: id,
          stockNumber: vSpec.stockNumber,
          portal,
          status: "published",
          externalListingId: `${portal.slice(0, 4).toUpperCase()}-${vSpec.stockNumber}`,
          listingUrl:
            portal === "dealership_website"
              ? `/showroom?stock=${vSpec.stockNumber}`
              : portal === "cars_co_za"
                ? `https://www.cars.co.za/for-sale/used/${vSpec.year}-${vSpec.make.toLowerCase()}-${vSpec.model.toLowerCase()}`
                : portal === "autotrader_sa"
                  ? `https://www.autotrader.co.za/car-for-sale/${vSpec.make.toLowerCase()}/${vSpec.model.toLowerCase()}`
                  : `https://www.facebook.com/marketplace/vehicles`,
          headline: `${vSpec.year} ${vSpec.make} ${vSpec.model} ${vSpec.variant}`,
          priceZar: vSpec.retailPriceZar,
          feedFormat:
            portal === "cars_co_za"
              ? "Cars.co.za DAP XML"
              : portal === "autotrader_sa"
                ? "AutoTrader SA DMS XML"
                : portal === "dealership_website"
                  ? "AutoPulse Live Website"
                  : "Meta Automotive Feed",
          publishedByBot: "Portal Publisher Agent",
          publishedAt: now - vSpec.daysInStock * 86_400_000,
          updatedAt: now,
        })
      }
    }

    // Seed initial SA Multi-Bank Finance Applications
    await ctx.db.insert("finance_applications", {
      applicationRef: "VAF-ZA-884102",
      applicantName: "Thabo Mokoena",
      saIdNumber: "8904125184080",
      phone: "+27 76 992 3410",
      email: "thabo.mokoena@gmail.com",
      address: "18 Waterfall Country Estate, Midrand, Gauteng",
      employmentStatus: "Permanent Full-Time",
      employerName: "MTN South Africa",
      jobTitle: "Senior Network Engineer",
      grossMonthlyIncomeZar: 78500,
      monthlyExpensesZar: 24200,
      vehicleId: vehicleIds[0],
      stockNumber: "APM-2401",
      vehicleTitle: "2024 Toyota Hilux 2.8 GD-6 GR-Sport III AT",
      vehiclePriceZar: 949900,
      depositZar: 120000,
      tradeInEquityZar: 85000,
      balloonPct: 25,
      balloonAmountZar: 237475,
      interestRatePct: 11.75,
      termMonths: 72,
      estimatedMonthlyZar: 13240,
      affordabilityStatus: "pre_qualified",
      ficaChecklist: {
        idCopy: true,
        driversLicense: true,
        bankStatements3m: true,
        payslips3m: true,
        proofOfAddress: true,
      },
      bankSubmissions: [
        {
          bank: "WesBank",
          status: "approved",
          referenceNo: "WES-904812",
          offeredRatePct: 11.5,
          submittedAt: now - 3600_000 * 3,
        },
        {
          bank: "Absa Vehicle Finance",
          status: "reviewing",
          referenceNo: "ABS-772190",
          offeredRatePct: 11.75,
          submittedAt: now - 3600_000 * 3,
        },
        {
          bank: "MFC (Nedbank)",
          status: "approved",
          referenceNo: "MFC-441209",
          offeredRatePct: 11.4,
          submittedAt: now - 3600_000 * 3,
        },
      ],
      overallStatus: "approved",
      notes: "MFC beat WesBank by 10bps (Prime + 0.15%). Client signing iContract via Signio.",
      createdAt: now - 3600_000 * 4,
      updatedAt: now - 1800_000,
    })

    await ctx.db.insert("finance_applications", {
      applicationRef: "VAF-ZA-884219",
      applicantName: "Lerato Ndlovu",
      saIdNumber: "9308240291085",
      phone: "+27 82 541 8830",
      email: "lerato.ndlovu@discovery.co.za",
      address: "42 Morningside Manor, Sandton, Gauteng",
      employmentStatus: "Permanent Full-Time",
      employerName: "Discovery Vitality",
      jobTitle: "Actuarial Analyst",
      grossMonthlyIncomeZar: 62000,
      monthlyExpensesZar: 19500,
      vehicleId: vehicleIds[2],
      stockNumber: "APM-2403",
      vehicleTitle: "2023 Volkswagen Golf 8 GTI 2.0 TSI DSG",
      vehiclePriceZar: 729900,
      depositZar: 75000,
      tradeInEquityZar: 0,
      balloonPct: 20,
      balloonAmountZar: 145980,
      interestRatePct: 11.75,
      termMonths: 72,
      estimatedMonthlyZar: 11520,
      affordabilityStatus: "pre_qualified",
      ficaChecklist: {
        idCopy: true,
        driversLicense: true,
        bankStatements3m: true,
        payslips3m: false,
        proofOfAddress: true,
      },
      bankSubmissions: [
        {
          bank: "WesBank",
          status: "submitted",
          referenceNo: "WES-905104",
          offeredRatePct: 11.75,
          submittedAt: now - 1800_000,
        },
        {
          bank: "Standard Bank VAF",
          status: "submitted",
          referenceNo: "STD-612098",
          offeredRatePct: 11.9,
          submittedAt: now - 1800_000,
        },
      ],
      overallStatus: "fica_pending",
      notes: "Awaiting latest payslip via WhatsApp — 48h Follow-Up Agent chasing automatically.",
      createdAt: now - 3600_000,
      updatedAt: now - 1200_000,
    })

    // Seed initial Follow-Up Tasks & Test Drives
    await ctx.db.insert("follow_up_tasks", {
      contactName: "Lerato Ndlovu",
      phone: "+27 82 541 8830",
      email: "lerato.ndlovu@discovery.co.za",
      vehicleTitle: "2023 VW Golf 8 GTI DSG",
      cadenceStep: "finance_fica_48h",
      channel: "whatsapp",
      messageBody:
        "Hi Lerato! Just need your latest payslip to release your WesBank & Standard Bank approval on the Moonstone Grey Golf 8 GTI. Reply right here with the PDF!",
      status: "scheduled",
      scheduledFor: now + 3600_000,
      assignedAgent: "Follow-Up Agent",
      createdAt: now - 1200_000,
    })

    await ctx.db.insert("follow_up_tasks", {
      contactName: "Johan van der Merwe",
      phone: "+27 84 551 2290",
      email: "johan.vdm@icloud.com",
      vehicleTitle: "2023 Ford Ranger 3.0 V6 Wildtrak",
      cadenceStep: "test_drive_24h",
      channel: "whatsapp",
      messageBody:
        "Hi Johan! Confirming your 2023 Ford Ranger V6 Wildtrak test drive at our Sandton Showroom tomorrow at 10:00. Bring your driver's licence — coffee's on us!",
      status: "sent",
      scheduledFor: now - 600_000,
      sentAt: now - 540_000,
      assignedAgent: "Follow-Up Agent",
      createdAt: now - 900_000,
    })

    await ctx.db.insert("test_drives", {
      buyerName: "Johan van der Merwe",
      phone: "+27 84 551 2290",
      email: "johan.vdm@icloud.com",
      vehicleId: vehicleIds[1],
      stockNumber: "APM-2402",
      vehicleTitle: "2023 Ford Ranger 3.0 V6 Wildtrak 4WD",
      branch: "Sandton Showroom, Gauteng",
      scheduledAt: "Tomorrow · 10:00 SAST",
      status: "booked",
      notes: "Trading in 2019 Toyota Hilux 2.4 GD-6 SRX (112,000km).",
      createdAt: now - 1800_000,
    })

    return { seeded: true, vehicles: vehicleIds.length }
  },
})
