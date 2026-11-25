// South African Car Dealership Domain Engine
// Finance (NCA / VAF), Trade-In Appraisal, Multi-Portal Publishing (Cars.co.za, AutoTrader SA, Own Site),
// Custom Skills Registry & Grok-Style Chat Action Parsers

export type PortalSlug =
  | "cars_co_za"
  | "autotrader_sa"
  | "dealership_website"
  | "facebook_marketplace"

export type SaBankName =
  | "WesBank"
  | "Absa Vehicle Finance"
  | "MFC (Nedbank)"
  | "Standard Bank VAF"
  | "Capitec / Signio"

export interface DealershipSkillDefinition {
  slug: string
  name: string
  shortLabel: string
  category: "publishing" | "finance" | "followup" | "sales" | "operations" | "marketing"
  description: string
  triggerHint: string
  accent: string
}

export const DEALERSHIP_SKILLS: DealershipSkillDefinition[] = [
  {
    slug: "multi_publish",
    name: "Multi-Portal Car Publisher",
    shortLabel: "Publish Car",
    category: "publishing",
    description:
      "Syndicate vehicles simultaneously to Cars.co.za (DAP XML), AutoTrader SA, Dealership Website (/showroom), and Facebook Marketplace.",
    triggerHint: "Publish 2024 Toyota Hilux GR-S to Cars.co.za, AutoTrader & our website",
    accent: "sky",
  },
  {
    slug: "finance_auto_apply",
    name: "SA Multi-Bank Finance Auto-Apply",
    shortLabel: "Finance Auto-Apply",
    category: "finance",
    description:
      "Calculate NCA monthly instalments (balloon/deposit), verify 5 FICA docs, and auto-submit finance dossiers to WesBank, Absa, MFC, Standard Bank & Capitec via Signio.",
    triggerHint: "Auto-apply vehicle finance for Sipho on the 2023 Ford Ranger Wildtrak",
    accent: "emerald",
  },
  {
    slug: "whatsapp_followup",
    name: "24h/48h/72h Buyer Follow-Up",
    shortLabel: "Follow-Up Cadence",
    category: "followup",
    description:
      "Automated South African WhatsApp & Email follow-ups: 15-min speed-to-lead, 24h test-drive reminders, 48h FICA chases & 72h price-drop revivals.",
    triggerHint: "Trigger 24h test-drive follow-up sequence for hot showroom leads",
    accent: "amber",
  },
  {
    slug: "vehicle_quote_pdf",
    name: "Offer to Purchase (OTP) & Deal Sheet PDF",
    shortLabel: "OTP & Deal PDF",
    category: "sales",
    description:
      "Generate crisp SA VAT-compliant Vehicle Offer to Purchase & Pro-Forma Tax Invoices with OTR fees, trade-in allowance, deposit & monthly estimate.",
    triggerHint: "Generate an Offer to Purchase PDF for the 2023 VW Golf 8 GTI",
    accent: "violet",
  },
  {
    slug: "trade_in_valuation",
    name: "Trade-In Valuation & VIN/NaTIS Check",
    shortLabel: "Trade-In Appraisal",
    category: "sales",
    description:
      "Decode 17-char VINs, estimate South African TransUnion/Mead & McGrouther trade & retail bands, deduct DEKRA/COR recon costs, and spot aging floorplan stock.",
    triggerHint: "Appraise trade-in for a 2020 VW Polo 1.0 TSI with 78,000km",
    accent: "orange",
  },
  {
    slug: "test_drive_booking",
    name: "Test-Drive & Showroom Concierge",
    shortLabel: "Book Test Drive",
    category: "followup",
    description:
      "Schedule showroom or home/office test drives across Johannesburg, Pretoria, Cape Town & Durban with driver's licence pre-verification.",
    triggerHint: "Book a Saturday 10:00 Sandton test drive for the BMW X3",
    accent: "cyan",
  },
  {
    slug: "social_reel_studio",
    name: "TikTok & Reels Walkaround Studio",
    shortLabel: "Showroom Reels",
    category: "marketing",
    description:
      "Script 30-second viral SA showroom walkarounds, reply to 'How much per month?' DMs, and optimize TikTok & Meta Vehicle Inventory Ads.",
    triggerHint: "Create a viral 30s TikTok walkaround script for our 2024 Hilux GR-S",
    accent: "pink",
  },
  {
    slug: "email_triage",
    name: "Portal Lead & Bank Email Triage",
    shortLabel: "Portal Inbox",
    category: "operations",
    description:
      "Parse inbound Cars.co.za & AutoTrader SA lead notification emails from Gmail/Outlook and track WesBank/Absa/MFC approval letters.",
    triggerHint: "Check today's Cars.co.za & AutoTrader leads in Gmail",
    accent: "indigo",
  },
  {
    slug: "cloud_desktop",
    name: "Grok-Style Cloud Computer & Browser",
    shortLabel: "Cloud Desktop",
    category: "operations",
    description:
      "Launch an isolated Daytona cloud browser directly to Cars.co.za DAP, AutoTrader Dealer Portal, Signio, or WeBuyCars to complete live actions.",
    triggerHint: "Open Cars.co.za dealer portal on live cloud desktop",
    accent: "teal",
  },
]

export const SA_PORTALS: Array<{
  slug: PortalSlug
  name: string
  shortName: string
  url: string
  feedFormat: string
  badgeColor: string
  description: string
}> = [
  {
    slug: "cars_co_za",
    name: "Cars.co.za (DAP)",
    shortName: "Cars.co.za",
    url: "https://www.cars.co.za",
    feedFormat: "Cars.co.za DAP XML Feed",
    badgeColor: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    description: "South Africa's #1 dealer marketplace via Dealer Admin Platform XML feed",
  },
  {
    slug: "autotrader_sa",
    name: "AutoTrader South Africa",
    shortName: "AutoTrader SA",
    url: "https://www.autotrader.co.za",
    feedFormat: "AutoTrader SA DMS XML",
    badgeColor: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    description: "High-intent SA buyers & instant dealer stock feed sync",
  },
  {
    slug: "dealership_website",
    name: "Own Dealership Website",
    shortName: "Own Website",
    url: "/showroom",
    feedFormat: "Live /showroom JSON + SEO Page",
    badgeColor: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    description: "Publishes immediately to your live AutoPulse Motors /showroom website",
  },
  {
    slug: "facebook_marketplace",
    name: "Facebook Marketplace & Meta AIA",
    shortName: "FB Marketplace",
    url: "https://www.facebook.com/marketplace/vehicles",
    feedFormat: "Meta Automotive Inventory Feed",
    badgeColor: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
    description: "Syncs to Meta Vehicle Catalog & Marketplace local buyers",
  },
]

export const SA_BANKS: Array<{
  name: SaBankName
  shortName: string
  email: string
  typicalRateOffset: number // relative to SA prime (11.25%)
  maxTermMonths: number
  maxBalloonPct: number
  turnaround: string
}> = [
  {
    name: "WesBank",
    shortName: "WesBank",
    email: "dealerdesk@wesbank.co.za",
    typicalRateOffset: 0.25,
    maxTermMonths: 72,
    maxBalloonPct: 35,
    turnaround: "25–45 min",
  },
  {
    name: "Absa Vehicle Finance",
    shortName: "Absa VAF",
    email: "avfdealers@absa.africa",
    typicalRateOffset: 0.5,
    maxTermMonths: 72,
    maxBalloonPct: 35,
    turnaround: "30–60 min",
  },
  {
    name: "MFC (Nedbank)",
    shortName: "MFC Nedbank",
    email: "applications@mfc.co.za",
    typicalRateOffset: 0.35,
    maxTermMonths: 72,
    maxBalloonPct: 35,
    turnaround: "20–40 min",
  },
  {
    name: "Standard Bank VAF",
    shortName: "Standard Bank",
    email: "vafdealers@standardbank.co.za",
    typicalRateOffset: 0.5,
    maxTermMonths: 72,
    maxBalloonPct: 30,
    turnaround: "35–60 min",
  },
  {
    name: "Capitec / Signio",
    shortName: "Capitec / Signio",
    email: "fi-submissions@signio.co.za",
    typicalRateOffset: 0.75,
    maxTermMonths: 72,
    maxBalloonPct: 30,
    turnaround: "15–30 min",
  },
]

export const SA_FICA_DOCS = [
  { code: "ID_COPY", label: "SA Smart ID Card / Green ID Book", required: true },
  { code: "DRIVERS_LICENSE", label: "Valid SA Driver's Licence (Front & Back)", required: true },
  { code: "BANK_STATEMENTS", label: "3 Months Latest Stamped Bank Statements", required: true },
  { code: "PAYSLIPS", label: "3 Months Latest Payslips (or 6M if Commission)", required: true },
  { code: "PROOF_OF_ADDRESS", label: "Proof of Residence (< 3 Months Utility / Lease)", required: true },
] as const

export interface ShowroomVehicle {
  _id?: string
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  variant: string
  bodyType: "Double Cab Bakkie" | "SUV" | "Hatchback" | "Sedan" | "Crossover" | "Commercial"
  condition: "new" | "used" | "demo"
  mileageKm: number
  transmission: "Automatic" | "Manual" | "DSG" | "CVT"
  fuelType: "Diesel" | "Petrol" | "Hybrid" | "Electric"
  colour: string
  engineSpec: string
  retailPriceZar: number
  costPriceZar: number
  tradeInValueZar: number
  otrFeeZar: number
  daysInStock: number
  branch: string
  fullServiceHistory: boolean
  spareKeys: boolean
  dekraGrade: string
  natisStatus: "On Hand" | "Bank Settlement Pending" | "En Route"
  status: "available" | "reserved" | "finance_pending" | "sold"
  features: string[]
  description: string
  imageUrl?: string
  portals: {
    cars_co_za: boolean
    autotrader_sa: boolean
    dealership_website: boolean
    facebook_marketplace: boolean
  }
}

export const SA_SHOWROOM_VEHICLES: ShowroomVehicle[] = [
  {
    _id: "veh_1",
    stockNumber: "APM-2401",
    vin: "AHTBA3CD703219845",
    year: 2024,
    make: "Toyota",
    model: "Hilux",
    variant: "2.8 GD-6 Double Cab 4x4 GR-Sport III AT",
    bodyType: "Double Cab Bakkie",
    condition: "demo",
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
    status: "available",
    features: [
      "GR-Sport Wide-Track Suspension",
      "JBL 9-Speaker Premium Audio",
      "360° Panoramic View Camera",
      "Balance of 9-Service / 90,000km Plan",
      "Securi-Lid Roller Shutter & Towbar",
    ],
    description:
      "Immaculate 2024 Toyota Hilux 2.8 GD-6 GR-Sport III 4x4 Auto with wide-track suspension, 165kW upgrade, full Toyota SA service plan and DEKRA Platinum certificate. Finance available through WesBank, Absa, MFC & Standard Bank. Trade-ins welcome.",
    imageUrl: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    _id: "veh_2",
    stockNumber: "APM-2402",
    vin: "AFAPXXMJ2PPE48210",
    year: 2023,
    make: "Ford",
    model: "Ranger",
    variant: "3.0 V6 TD Wildtrak 4WD Double Cab 10AT",
    bodyType: "Double Cab Bakkie",
    condition: "used",
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
    status: "available",
    features: [
      "12-Inch SYNC 4A Portrait Display",
      "Matrix LED Headlamps",
      "Adaptive Cruise & Lane Centring",
      "Electric Roller Shutter",
      "Balance of 6yr/90,000km Service Plan",
    ],
    description:
      "Next-Gen 2023 Ford Ranger 3.0 V6 Wildtrak 4WD with 600Nm torque, SYNC 4A 12-inch touchscreen, wireless CarPlay, Matrix LEDs and full Ford SA franchise history. Instant finance approvals available.",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    _id: "veh_3",
    stockNumber: "APM-2403",
    vin: "WVWZZZCDZPW118294",
    year: 2023,
    make: "Volkswagen",
    model: "Golf",
    variant: "8 GTI 2.0 TSI DSG (180kW)",
    bodyType: "Hatchback",
    condition: "used",
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
    status: "available",
    features: [
      "Panoramic Sunroof",
      "Harman Kardon 480W Sound System",
      "19-Inch Adelaide Alloy Wheels",
      "IQ.Light Matrix LED Headlights",
      "Balance of 5yr/90,000km VW Maintenance Plan",
    ],
    description:
      "Clean, accident-free 2023 VW Golf 8 GTI in Moonstone Grey with Panoramic Roof, Harman Kardon audio, IQ.Light LEDs and 19-inch Adelaides. Full VW Maintenance Plan active.",
    imageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    _id: "veh_4",
    stockNumber: "APM-2404",
    vin: "WBA35BG050N194722",
    year: 2022,
    make: "BMW",
    model: "X3",
    variant: "xDrive20d M Sport (G01 LCI)",
    bodyType: "SUV",
    condition: "used",
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
    status: "available",
    features: [
      "BMW Live Cockpit Professional",
      "Panoramic Glass Sunroof",
      "20-Inch M Double-Spoke Alloys",
      "Towbar (Electric Folding)",
      "Active BMW Motorplan to 100,000km",
    ],
    description:
      "Facelift LCI 2022 BMW X3 xDrive20d M Sport in Brooklyn Grey with active BMW Motorplan, Panoramic Sunroof, electric towbar and Parking Assistant Plus. Nationwide delivery across SA.",
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: false,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    _id: "veh_5",
    stockNumber: "APM-2405",
    vin: "AAVZZZ6RZRU039104",
    year: 2024,
    make: "Volkswagen",
    model: "Polo Vivo",
    variant: "1.4 Comfortline 5-Door",
    bodyType: "Hatchback",
    condition: "new",
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
    status: "available",
    features: [
      "App-Connect Apple CarPlay & Android Auto",
      "15-Inch Tosa Alloy Wheels",
      "Cruise Control & Multi-Function Steering",
      "Smash & Grab Safety Tint Included",
      "3yr/120,000km Factory Warranty",
    ],
    description:
      "South Africa's favourite hatchback! Brand new 2024 VW Polo Vivo 1.4 Comfortline ready for immediate delivery. Ideal first-time buyer finance from R4,950/pm (T&Cs apply).",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    _id: "veh_6",
    stockNumber: "APM-2406",
    vin: "AHTKA3FS700628190",
    year: 2023,
    make: "Toyota",
    model: "Fortuner",
    variant: "2.8 GD-6 VX 4x4 7-Seater AT",
    bodyType: "SUV",
    condition: "used",
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
    status: "finance_pending",
    features: [
      "Toyota Safety Sense (Blind Spot + Pre-Crash)",
      "Heated Leather Seats & Power Tailgate",
      "7-Seater Family Configuration",
      "JBL 11-Speaker Audio",
      "Balance of Toyota Service Plan",
    ],
    description:
      "Top-spec 2023 Toyota Fortuner 2.8 GD-6 VX 4x4 with Toyota Safety Sense, heated leather seats, JBL sound and power tailgate. Full Toyota SA history and spare keys.",
    imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    _id: "veh_7",
    stockNumber: "APM-2407",
    vin: "LVVDB21B4PD291840",
    year: 2024,
    make: "Chery",
    model: "Tiggo 7 Pro Max",
    variant: "1.6 TGDI Executive AWD DCT",
    bodyType: "Crossover",
    condition: "demo",
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
    status: "available",
    features: [
      "10-Year / 1,000,000km Engine Warranty",
      "Sony 8-Speaker Surround & Dual 12.3\" Screens",
      "Panoramic Sunroof & Ambient Lighting",
      "540° HD Transparent Chassis Camera",
      "Wireless Phone Charging & ADAS Suite",
    ],
    description:
      "Demo 2024 Chery Tiggo 7 Pro Max Executive AWD with huge spec, dual 12.3-inch curved display, Sony sound and balance of Chery's 1-million km engine warranty.",
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: false,
      autotrader_sa: false,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    _id: "veh_8",
    stockNumber: "APM-2408",
    vin: "W1K2060422R074192",
    year: 2022,
    make: "Mercedes-Benz",
    model: "C-Class",
    variant: "C200 AMG Line 9G-Tronic (W206)",
    bodyType: "Sedan",
    condition: "used",
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
    status: "available",
    features: [
      "AMG Line Interior & Exterior Night Package",
      "11.9-Inch MBUX Portrait OLED Screen",
      "Burmester 3D Surround Sound",
      "Panoramic Sliding Sunroof",
      "Balance of 5yr/100,000km MobiloDrive Plan",
    ],
    description:
      "Stunning W206 2022 Mercedes-Benz C200 AMG Line Mild-Hybrid with Night Package, Burmester audio and balance of Mercedes-Benz MobiloDrive Maintenance Plan.",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
  {
    _id: "veh_9",
    stockNumber: "APM-2409",
    vin: "MBHCZC63S00948211",
    year: 2024,
    make: "Suzuki",
    model: "Swift",
    variant: "1.2 GLX Auto",
    bodyType: "Hatchback",
    condition: "used",
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
    status: "available",
    features: [
      "Keyless Entry & Push-Button Start",
      "Reverse Camera & Rear PDC",
      "LED Projector Headlamps",
      "Apple CarPlay & Android Auto",
      "Ultra-Low 4.9L/100km Consumption",
    ],
    description:
      "Fuel-sipping 2024 Suzuki Swift 1.2 GLX Auto with reverse camera, keyless entry, alloy wheels and remaining factory warranty. Easy WesBank & Capitec approval.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: true,
    },
  },
  {
    _id: "veh_10",
    stockNumber: "APM-2410",
    vin: "LGWEE4A50PK630192",
    year: 2023,
    make: "Haval",
    model: "Jolion",
    variant: "1.5T S Super Luxury 7DCT",
    bodyType: "Crossover",
    condition: "used",
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
    status: "reserved",
    features: [
      "Head-Up Display (HUD)",
      "Panoramic Sunroof & Blackout Sport Trim",
      "360° Surround Camera + Auto Park",
      "Adaptive Cruise Control",
      "5yr/100,000km Warranty & 5yr/60,000km Service Plan",
    ],
    description:
      "Sporty 2023 Haval Jolion S Super Luxury (130kW) with panoramic roof, HUD, blacked-out sport pack and full GWM SA franchise service history.",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1000&q=80",
    portals: {
      cars_co_za: true,
      autotrader_sa: true,
      dealership_website: true,
      facebook_marketplace: false,
    },
  },
]

// ============================================================================
// South African Vehicle & Asset Finance (VAF) Calculator (NCA Compliant)
// ============================================================================

export const SA_PRIME_RATE = 11.25 // Current SA Prime Lending Rate (%)
export const SA_NCR_INITIATION_FEE = 1207.5 // R1,050 + 15% VAT
export const SA_MONTHLY_ADMIN_FEE = 69 // R69/month NCA max service fee

export interface SaFinanceCalculationInput {
  vehiclePriceZar: number
  depositZar?: number
  tradeInEquityZar?: number
  interestRatePct?: number // annual %, e.g. 11.75
  termMonths?: number // 48, 60, 72
  balloonPct?: number // 0 to 35%
  includeOtrFeeZar?: number
  grossMonthlyIncomeZar?: number
  monthlyExpensesZar?: number
}

export interface SaFinanceCalculationResult {
  vehiclePriceZar: number
  otrFeeZar: number
  initiationFeeZar: number
  totalFinancedAmountZar: number
  depositZar: number
  tradeInEquityZar: number
  balloonPct: number
  balloonAmountZar: number
  interestRatePct: number
  termMonths: number
  monthlyInstallmentExclAdminZar: number
  monthlyAdminFeeZar: number
  monthlyInstallmentTotalZar: number
  totalInterestZar: number
  totalRepayableZar: number
  affordabilityStatus?: "pre_qualified" | "borderline" | "needs_cosigner"
  affordabilityNote?: string
  paymentToIncomePct?: number
}

export function calculateSaVehicleFinance(
  input: SaFinanceCalculationInput
): SaFinanceCalculationResult {
  const vehiclePriceZar = Math.max(0, Number(input.vehiclePriceZar) || 0)
  const otrFeeZar = Math.max(0, Number(input.includeOtrFeeZar) || 0)
  const depositZar = Math.max(0, Number(input.depositZar) || 0)
  const tradeInEquityZar = Math.max(0, Number(input.tradeInEquityZar) || 0)
  const termMonths = Math.max(12, Math.min(84, Math.round(input.termMonths || 72)))
  const interestRatePct = Math.max(5, Math.min(28, input.interestRatePct ?? SA_PRIME_RATE + 0.5))
  const balloonPct = Math.max(0, Math.min(40, input.balloonPct ?? 0))

  const initiationFeeZar = vehiclePriceZar > 0 ? SA_NCR_INITIATION_FEE : 0
  const grossPrincipal = Math.max(
    0,
    vehiclePriceZar + otrFeeZar + initiationFeeZar - depositZar - tradeInEquityZar
  )
  const balloonAmountZar = Math.round(vehiclePriceZar * (balloonPct / 100))
  const r = interestRatePct / 100 / 12

  // Standard South African VAF formula with residual/balloon value:
  // PMT = (PV - FV / (1+r)^n) * [r / (1 - (1+r)^-n)]
  let monthlyExclAdmin = 0
  if (grossPrincipal > 0) {
    if (r === 0) {
      monthlyExclAdmin = (grossPrincipal - balloonAmountZar) / termMonths
    } else {
      const discountFactor = Math.pow(1 + r, -termMonths)
      const pvOfBalloon = balloonAmountZar * discountFactor
      const amortizingPrincipal = Math.max(0, grossPrincipal - pvOfBalloon)
      monthlyExclAdmin = (amortizingPrincipal * r) / (1 - discountFactor)
    }
  }

  const monthlyInstallmentExclAdminZar = Math.round(monthlyExclAdmin)
  const monthlyAdminFeeZar = grossPrincipal > 0 ? SA_MONTHLY_ADMIN_FEE : 0
  const monthlyInstallmentTotalZar = monthlyInstallmentExclAdminZar + monthlyAdminFeeZar
  const totalRepayableZar =
    monthlyInstallmentTotalZar * termMonths + balloonAmountZar
  const totalInterestZar = Math.max(
    0,
    Math.round(totalRepayableZar - grossPrincipal - monthlyAdminFeeZar * termMonths)
  )

  let affordabilityStatus: SaFinanceCalculationResult["affordabilityStatus"]
  let affordabilityNote: string | undefined
  let paymentToIncomePct: number | undefined

  if (input.grossMonthlyIncomeZar && input.grossMonthlyIncomeZar > 0) {
    const gross = input.grossMonthlyIncomeZar
    const expenses = Math.max(0, input.monthlyExpensesZar ?? Math.round(gross * 0.45))
    const estimatedNet = Math.round(gross * 0.78)
    const disposable = Math.max(0, estimatedNet - expenses)
    paymentToIncomePct = Math.round((monthlyInstallmentTotalZar / gross) * 1000) / 10

    if (paymentToIncomePct <= 28 && monthlyInstallmentTotalZar <= disposable * 0.9) {
      affordabilityStatus = "pre_qualified"
      affordabilityNote = `Strong NCA affordability (${paymentToIncomePct}% of gross income, R${disposable.toLocaleString("en-ZA")} est. disposable). High approval probability at Prime + 0% to +1%.`
    } else if (paymentToIncomePct <= 35 && monthlyInstallmentTotalZar <= disposable * 1.1) {
      affordabilityStatus = "borderline"
      affordabilityNote = `Borderline NCA ratio (${paymentToIncomePct}% of gross). Recommend 10% deposit or 20% balloon to drop instalment comfortably inside bank threshold.`
    } else {
      affordabilityStatus = "needs_cosigner"
      affordabilityNote = `Instalment (${paymentToIncomePct}% of gross) exceeds standard SA bank NCA affordability cap. Recommend larger deposit, lower-priced unit, or joint/co-applicant submission.`
    }
  }

  return {
    vehiclePriceZar,
    otrFeeZar,
    initiationFeeZar,
    totalFinancedAmountZar: Math.round(grossPrincipal),
    depositZar,
    tradeInEquityZar,
    balloonPct,
    balloonAmountZar,
    interestRatePct,
    termMonths,
    monthlyInstallmentExclAdminZar,
    monthlyAdminFeeZar,
    monthlyInstallmentTotalZar,
    totalInterestZar,
    totalRepayableZar,
    affordabilityStatus,
    affordabilityNote,
    paymentToIncomePct,
  }
}

// ============================================================================
// South African 13-Digit ID Number Validator & Parser
// ============================================================================

export function parseSouthAfricanId(rawId: string): {
  valid: boolean
  formatted: string
  birthDate?: string
  gender?: "Female" | "Male"
  citizenship?: "SA Citizen" | "Permanent Resident"
  note?: string
} {
  const digits = rawId.replace(/\D/g, "")
  if (digits.length !== 13) {
    return {
      valid: false,
      formatted: digits,
      note: "SA ID must be exactly 13 digits (YYMMDDSSSSCAZ)",
    }
  }
  const yy = Number(digits.slice(0, 2))
  const mm = Number(digits.slice(2, 4))
  const dd = Number(digits.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { valid: false, formatted: digits, note: "Invalid birth date in SA ID" }
  }
  const currentTwoDigitYear = new Date().getFullYear() % 100
  const century = yy <= currentTwoDigitYear ? 2000 : 1900
  const birthDate = `${century + yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
  const genderDigits = Number(digits.slice(6, 10))
  const gender = genderDigits >= 5000 ? "Male" : "Female"
  const citizenship = digits[10] === "0" ? "SA Citizen" : "Permanent Resident"

  // Luhn checksum check
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let d = Number(digits[i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  const luhnOk = sum % 10 === 0
  return {
    valid: luhnOk,
    formatted: `${digits.slice(0, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`,
    birthDate,
    gender,
    citizenship,
    note: luhnOk ? "Valid SA ID checksum" : "Checksum warning — verify physical Smart ID",
  }
}

// ============================================================================
// South African Trade-In Valuation Estimator (TransUnion / M&M Band Model)
// ============================================================================

export function estimateSaTradeInValuation(params: {
  year: number
  make: string
  model: string
  mileageKm: number
  condition: "excellent" | "good" | "fair" | "rough"
  fullServiceHistory: boolean
  spareKeys: boolean
  estimatedNewPriceZar?: number
}) {
  const currentYear = new Date().getFullYear()
  const ageYears = Math.max(0, currentYear - params.year)
  const makeLower = params.make.toLowerCase()

  // Base new retail benchmarks for popular SA makes if not provided
  let baseRetail = params.estimatedNewPriceZar || 420000
  if (!params.estimatedNewPriceZar) {
    if (makeLower.includes("toyota") && params.model.toLowerCase().includes("hilux")) baseRetail = 820000
    else if (makeLower.includes("toyota") && params.model.toLowerCase().includes("fortuner")) baseRetail = 810000
    else if (makeLower.includes("ford") && params.model.toLowerCase().includes("ranger")) baseRetail = 840000
    else if (makeLower.includes("bmw") || makeLower.includes("mercedes") || makeLower.includes("audi")) baseRetail = 920000
    else if (params.model.toLowerCase().includes("gti")) baseRetail = 790000
    else if (params.model.toLowerCase().includes("polo") || params.model.toLowerCase().includes("swift")) baseRetail = 295000
    else if (makeLower.includes("haval") || makeLower.includes("chery")) baseRetail = 480000
  }

  // South African retention multiplier (Toyota & VW hold strongest resale in SA)
  const retentionBonus =
    makeLower.includes("toyota") ? 1.07 : makeLower.includes("volkswagen") || makeLower.includes("vw") ? 1.04 : makeLower.includes("suzuki") ? 1.03 : 0.98
  const depreciationFactor = Math.max(0.28, Math.pow(0.87, ageYears) * retentionBonus)

  const expectedKm = Math.max(15000, ageYears * 20000)
  const kmDelta = params.mileageKm - expectedKm
  const kmAdjustmentPct = Math.max(-0.18, Math.min(0.08, -(kmDelta / 100000) * 0.12))

  const retailEstimate = Math.round((baseRetail * depreciationFactor * (1 + kmAdjustmentPct)) / 1000) * 1000
  const tradeBandBase = Math.round((retailEstimate * 0.84) / 1000) * 1000

  const reconItems: Array<{ label: string; costZar: number }> = [
    { label: "DEKRA Multi-Point & COR Roadworthy", costZar: 2850 },
    { label: "Full Valet, Polish & Showroom Prep", costZar: 2200 },
  ]
  if (params.condition === "fair") {
    reconItems.push({ label: "Cosmetic Touch-Up / Dent & Mag Refurb", costZar: 7500 })
    reconItems.push({ label: "Tyre & Brake Allowance", costZar: 6500 })
  } else if (params.condition === "rough") {
    reconItems.push({ label: "Major Bodywork & Mechanical Recon", costZar: 18500 })
    reconItems.push({ label: "Tyres, Windscreen & Service", costZar: 11500 })
  } else if (params.condition === "good") {
    reconItems.push({ label: "Minor Paint / Service Allowance", costZar: 3800 })
  }
  if (!params.fullServiceHistory) {
    reconItems.push({ label: "Missing FSH Risk Deduction & Major Service", costZar: 12000 })
  }
  if (!params.spareKeys) {
    reconItems.push({ label: "Replacement Coded Spare Key", costZar: 4500 })
  }

  const totalReconZar = reconItems.reduce((s, r) => s + r.costZar, 0)
  const recommendedOfferLow = Math.max(25000, Math.round((tradeBandBase - totalReconZar - 8000) / 1000) * 1000)
  const recommendedOfferHigh = Math.max(recommendedOfferLow + 8000, Math.round((tradeBandBase - totalReconZar + 5000) / 1000) * 1000)

  return {
    transUnionRetailEstZar: retailEstimate,
    transUnionTradeEstZar: tradeBandBase,
    reconItems,
    totalReconZar,
    recommendedOfferLow,
    recommendedOfferHigh,
    projectedGrossProfitZar: Math.max(15000, retailEstimate - recommendedOfferHigh - totalReconZar),
  }
}

// ============================================================================
// South African Market Price Intelligence (Cars.co.za & AutoTrader SA Benchmarks)
// ============================================================================

export interface SaMarketPriceAnalysis {
  marketAvgZar: number
  marketLowZar: number
  marketHighZar: number
  competitorCountCarsCoZa: number
  competitorCountAutoTrader: number
  totalCompetitors: number
  priceDeltaZar: number // negative means priced BELOW market average (good value)
  priceDeltaPct: number
  valueRankLabel: string
  valueBadgeTone: "emerald" | "sky" | "amber" | "rose"
  estimatedDaysToSell: number
  recommendedPriceZar: number
  carsCoZaSearchUrl: string
  autoTraderSearchUrl: string
  summaryNote: string
}

export function analyzeSaMarketPricing(params: {
  year: number
  make: string
  model: string
  variant?: string
  mileageKm: number
  priceZar: number
  fullServiceHistory?: boolean
}): SaMarketPriceAnalysis {
  const makeClean = (params.make || "Toyota").trim()
  const modelClean = (params.model || "Hilux").trim()
  const year = Number(params.year) || 2024
  const mileageKm = Math.max(0, Number(params.mileageKm) || 15000)
  const priceZar = Math.max(50000, Number(params.priceZar) || 450000)

  // Check if we match a known SA showroom model benchmark first
  const knownMatch = SA_SHOWROOM_VEHICLES.find(
    (v) =>
      v.make.toLowerCase() === makeClean.toLowerCase() &&
      v.model.toLowerCase() === modelClean.toLowerCase()
  )

  const currentYear = new Date().getFullYear()
  const ageYears = Math.max(0, currentYear - year)
  const expectedKm = Math.max(12000, ageYears * 19000)
  const kmFactor = Math.max(-0.12, Math.min(0.07, -((mileageKm - expectedKm) / 100000) * 0.11))
  const fshFactor = params.fullServiceHistory === false ? -0.04 : 0.015

  let baselineAvg: number
  if (knownMatch) {
    const yearDiff = year - knownMatch.year
    const yearAdj = Math.pow(1.08, Math.max(-6, Math.min(3, yearDiff)))
    baselineAvg = Math.round((knownMatch.retailPriceZar * 1.028 * yearAdj * (1 + kmFactor * 0.4 + fshFactor)) / 1000) * 1000
  } else {
    // Derive realistic SA market average around the vehicle tier & mileage
    baselineAvg = Math.round((priceZar * (1.024 + kmFactor * 0.25 + fshFactor)) / 1000) * 1000
  }

  const marketAvgZar = Math.max(60000, baselineAvg)
  const marketLowZar = Math.round((marketAvgZar * 0.935) / 1000) * 1000
  const marketHighZar = Math.round((marketAvgZar * 1.075) / 1000) * 1000

  // Deterministic competitor counts based on SA vehicle popularity
  const seedHash = (makeClean + modelClean + String(year))
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const isPopularSa = /toyota|volkswagen|vw|ford|suzuki|polo|hilux|ranger|fortuner|swift|chery|haval/i.test(
    `${makeClean} ${modelClean}`
  )
  const competitorCountCarsCoZa = (isPopularSa ? 14 : 7) + (seedHash % 11)
  const competitorCountAutoTrader = (isPopularSa ? 16 : 8) + ((seedHash * 3) % 13)
  const totalCompetitors = competitorCountCarsCoZa + competitorCountAutoTrader

  const priceDeltaZar = priceZar - marketAvgZar
  const priceDeltaPct = Math.round((priceDeltaZar / marketAvgZar) * 1000) / 10
  const recommendedPriceZar = Math.round((marketAvgZar * 0.982) / 1000) * 1000 - 100

  let valueRankLabel = "Top 3 Competitive Value"
  let valueBadgeTone: SaMarketPriceAnalysis["valueBadgeTone"] = "sky"
  let estimatedDaysToSell = 18

  if (priceDeltaPct <= -2.5) {
    valueRankLabel = "#1 Best Value in Gauteng"
    valueBadgeTone = "emerald"
    estimatedDaysToSell = 11
  } else if (priceDeltaPct <= 0.5) {
    valueRankLabel = "#2 Best Value Bracket"
    valueBadgeTone = "emerald"
    estimatedDaysToSell = 15
  } else if (priceDeltaPct <= 3.5) {
    valueRankLabel = "Fair SA Market Retail"
    valueBadgeTone = "sky"
    estimatedDaysToSell = 23
  } else if (priceDeltaPct <= 7) {
    valueRankLabel = "Slightly Above Market Avg"
    valueBadgeTone = "amber"
    estimatedDaysToSell = 34
  } else {
    valueRankLabel = "Overpriced Risk (>45d Floorplan)"
    valueBadgeTone = "rose"
    estimatedDaysToSell = 49
  }

  const makeSlug = encodeURIComponent(makeClean.toLowerCase())
  const modelSlug = encodeURIComponent(modelClean.toLowerCase())
  const carsCoZaSearchUrl = `https://www.cars.co.za/for-sale/used/${year}-${makeSlug}-${modelSlug}/`
  const autoTraderSearchUrl = `https://www.autotrader.co.za/cars-for-sale/${makeSlug}/${modelSlug}?year=${year}`

  const absDeltaFormatted = `R ${Math.abs(priceDeltaZar).toLocaleString("en-ZA")}`
  const summaryNote =
    priceDeltaZar <= 0
      ? `${totalCompetitors} similar ${year} ${makeClean} ${modelClean} listings across Cars.co.za (${competitorCountCarsCoZa}) & AutoTrader SA (${competitorCountAutoTrader}) average R ${marketAvgZar.toLocaleString("en-ZA")}. At R ${priceZar.toLocaleString("en-ZA")} (${absDeltaFormatted} below avg), your car ranks ${valueRankLabel} — est. ${estimatedDaysToSell} days to sell.`
      : `${totalCompetitors} similar ${year} ${makeClean} ${modelClean} listings average R ${marketAvgZar.toLocaleString("en-ZA")}. You are ${absDeltaFormatted} (+${priceDeltaPct}%) above market average — consider R ${recommendedPriceZar.toLocaleString("en-ZA")} to cut turn time to ~15 days.`

  return {
    marketAvgZar,
    marketLowZar,
    marketHighZar,
    competitorCountCarsCoZa,
    competitorCountAutoTrader,
    totalCompetitors,
    priceDeltaZar,
    priceDeltaPct,
    valueRankLabel,
    valueBadgeTone,
    estimatedDaysToSell,
    recommendedPriceZar,
    carsCoZaSearchUrl,
    autoTraderSearchUrl,
    summaryNote,
  }
}

// ============================================================================
// South African NaTIS Licence Disc & Raw Vehicle Spec Decoder
// ============================================================================

export interface ParsedNewVehicleSpec {
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
  engineSpec: string
  retailPriceZar: number
  costPriceZar: number
  tradeInValueZar: number
  branch: string
  fullServiceHistory: boolean
  spareKeys: boolean
  dekraGrade: string
  features: string[]
  description: string
  imageUrl: string
}

const KNOWN_SA_MAKES = [
  "Toyota",
  "Volkswagen",
  "Ford",
  "BMW",
  "Mercedes-Benz",
  "Suzuki",
  "Haval",
  "Chery",
  "Hyundai",
  "Kia",
  "Isuzu",
  "Nissan",
  "Audi",
  "Renault",
  "Mazda",
  "Land Rover",
  "Porsche",
  "GWM",
  "Mahindra",
  "Honda",
]

export function parseVehicleIntakeSpec(rawText: string): ParsedNewVehicleSpec {
  const text = rawText.trim()
  const yearMatch = text.match(/\b(201[5-9]|202[0-6])\b/)
  const year = yearMatch ? Number(yearMatch[1]) : 2024

  // Detect VIN (17 alphanumeric chars excluding I, O, Q) or barcode % fields
  const vinMatch =
    text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i) ||
    text.match(/VIN[:\s#-]*([A-Z0-9]{11,17})/i)

  // Detect make
  let make = "Volkswagen"
  if (/\bvw\b/i.test(text)) {
    make = "Volkswagen"
  } else if (/\bmerc(?:edes)?\b/i.test(text)) {
    make = "Mercedes-Benz"
  } else {
    for (const candidate of KNOWN_SA_MAKES) {
      if (new RegExp(`\\b${candidate}\\b`, "i").test(text)) {
        make = candidate
        break
      }
    }
  }

  // Detect model & variant after year/make
  let model = "Polo GTI"
  let variant = "2.0 TSI DSG"
  const afterMakeRegex = new RegExp(
    `(?:${make}|VW|Merc(?:edes(?:-Benz)?)?)\\s+([A-Za-z0-9-]+)(?:\\s+([A-Za-z0-9.\\s/-]{2,28}))?`,
    "i"
  )
  const afterMakeMatch = text.match(afterMakeRegex)
  if (afterMakeMatch) {
    model = afterMakeMatch[1].trim()
    if (afterMakeMatch[2]) {
      const cleanedVariant = afterMakeMatch[2]
        .split(/[,|;\n]|(?:\bR\s*\d)|(?:\b\d+\s*km\b)/i)[0]
        .trim()
      if (cleanedVariant) variant = cleanedVariant
    }
  }

  // Detect Price in ZAR (e.g., R489,900 or R 769 900 or 489900)
  const priceMatch =
    text.match(/(?:R|ZAR)\s*([0-9][0-9,\s]{4,9})/i) ||
    text.match(/\b([1-9][0-9]{2}[,\s]?[0-9]{3})\s*(?:zar|rand)?\b/i)
  const retailPriceZar = priceMatch
    ? Math.max(65000, Number(priceMatch[1].replace(/[,\s]/g, "")) || 489900)
    : 489900

  // Detect Mileage in km (e.g., 38,000km or 21 500 km)
  const kmMatch = text.match(/\b([0-9]{1,3}(?:[,\s][0-9]{3})|[0-9]{3,6})\s*km\b/i)
  const mileageKm = kmMatch
    ? Math.max(0, Number(kmMatch[1].replace(/[,\s]/g, "")) || 24000)
    : year >= 2024
      ? 9500
      : 28500

  const stockMatch = text.match(/\b(APM-\d{3,5})\b/i)
  const stockNumber = stockMatch
    ? stockMatch[1].toUpperCase()
    : `APM-${year.toString().slice(-2)}${Math.floor(10 + (retailPriceZar % 89))}`

  const vin = vinMatch
    ? vinMatch[1].toUpperCase()
    : `AAVZZZ${make.slice(0, 2).toUpperCase()}Z${year.toString().slice(-2)}${String(retailPriceZar).slice(0, 6)}`

  // Detect Colour
  const colourMatch = text.match(
    /\b(Glacier White|Pure White|Kings Red(?: Metallic)?|Moonstone Grey|Brooklyn Grey|Attitude Black|Luxe Yellow|Selenite Grey|Silver|Pearl White|Blue|Black|White|Grey|Red)\b/i
  )
  const colour = colourMatch ? colourMatch[1] : "Glacier White"

  // Detect Transmission & Fuel
  const transmission = /manual|\bmt\b/i.test(text)
    ? "Manual"
    : /dsg/i.test(text)
      ? "DSG"
      : "Automatic"
  const fuelType = /diesel|gd-6|tdi|d4d|xdrive20d/i.test(text)
    ? "Diesel"
    : /hybrid/i.test(text)
      ? "Hybrid"
      : "Petrol"

  const bodyType = /hilux|ranger|amarok|d-max|bakkie|double\s*cab/i.test(
    `${make} ${model} ${variant}`
  )
    ? "Double Cab Bakkie"
    : /fortuner|x3|x5|tiggo|jolion|rav4|suv|corolla\s*cross/i.test(
          `${make} ${model} ${variant}`
        )
      ? "SUV"
      : /c200|320i|sedan/i.test(`${make} ${model} ${variant}`)
        ? "Sedan"
        : "Hatchback"

  const condition: "new" | "used" | "demo" =
    mileageKm < 500 ? "new" : mileageKm < 8000 && year >= 2024 ? "demo" : "used"

  const fullServiceHistory = !/no\s*fsh|partial\s*history/i.test(text)
  const dekraGrade = /dekra\s*grade\s*a|platinum/i.test(text)
    ? "DEKRA Platinum 98/100"
    : "DEKRA Gold 96/100"

  const costPriceZar = Math.round((retailPriceZar * 0.895) / 1000) * 1000
  const tradeInValueZar = Math.round((retailPriceZar * 0.855) / 1000) * 1000

  const defaultImageByMake =
    make === "Toyota"
      ? "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80"
      : make === "Ford"
        ? "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"
        : make === "BMW"
          ? "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80"
          : make === "Mercedes-Benz"
            ? "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80"
            : "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80"

  const features = [
    fullServiceHistory ? "Full Franchise Service History (FSH)" : "Verified Service Record",
    dekraGrade,
    "Apple CarPlay & Android Auto",
    "LED Headlamps & PDC Sensors",
    "WesBank, Absa, MFC & Standard Bank Finance Ready",
  ]

  const fin = calculateSaVehicleFinance({
    vehiclePriceZar: retailPriceZar,
    depositZar: Math.round(retailPriceZar * 0.1),
    termMonths: 72,
    balloonPct: 20,
  })

  const description = `Immaculate ${year} ${make} ${model} ${variant} in ${colour} with ${mileageKm.toLocaleString("en-ZA")} km. ${
    fullServiceHistory ? "Full franchise service history, " : ""
  }${dekraGrade} roadworthy verified, spare keys on hand. Estimated finance from R ${fin.monthlyInstallmentTotalZar.toLocaleString("en-ZA")}/pm (10% deposit, 72m, 20% balloon) via WesBank, Absa, MFC & Standard Bank. Nationwide SA delivery.`

  return {
    stockNumber,
    vin,
    year,
    make,
    model,
    variant,
    bodyType,
    condition,
    mileageKm,
    transmission,
    fuelType,
    colour,
    engineSpec: `${fuelType} · ${transmission}`,
    retailPriceZar,
    costPriceZar,
    tradeInValueZar,
    branch: "Midrand Flagship, Gauteng",
    fullServiceHistory,
    spareKeys: true,
    dekraGrade,
    features,
    description,
    imageUrl: defaultImageByMake,
  }
}

// ============================================================================
// Grok-Bot-Style Inline Action Parsers (for Interactive Cards in Chat)
// ============================================================================

export interface ParsedPublishAction {
  stockNumber: string
  year: number
  make: string
  model: string
  variant: string
  priceZar: number
  mileageKm: number
  vin: string
  branch: string
  colour: string
  portals: PortalSlug[]
  headline: string
}

export function parsePublishIntentFromText(
  text: string,
  inventory: ShowroomVehicle[] = SA_SHOWROOM_VEHICLES
): ParsedPublishAction | null {
  if (!text || text.length < 30) return null
  const hasPortalMention =
    /cars\.co\.za|autotrader|multi-?portal|syndicat|publish.*(?:listing|vehicle|car|showroom)|own\s*(?:website|site)|\/showroom/i.test(
      text
    )
  if (!hasPortalMention) return null

  const lower = text.toLowerCase()
  const matched = inventory.find(
    (v) =>
      lower.includes(v.stockNumber.toLowerCase()) ||
      (lower.includes(v.make.toLowerCase()) && lower.includes(v.model.toLowerCase()))
  )

  const portals: PortalSlug[] = []
  if (/cars\.co\.za/i.test(text)) portals.push("cars_co_za")
  if (/autotrader/i.test(text)) portals.push("autotrader_sa")
  if (/own\s*(?:website|site)|dealership\s*(?:website|site)|showroom/i.test(text)) {
    portals.push("dealership_website")
  }
  if (/facebook|marketplace|meta/i.test(text)) portals.push("facebook_marketplace")

  const finalPortals: PortalSlug[] =
    portals.length > 0
      ? portals
      : ["cars_co_za", "autotrader_sa", "dealership_website"]

  // If the text specifies a brand-new or custom vehicle (or modified price/km), parse it!
  const extracted = parseVehicleIntakeSpec(text)
  const priceMatch = text.match(/(?:R|ZAR)\s*([0-9][0-9,\s]{4,9})/i)
  const kmMatch = text.match(/\b([0-9]{1,3}(?:[,\s][0-9]{3})|[0-9]{3,6})\s*km\b/i)

  if (matched) {
    const customPrice = priceMatch
      ? Number(priceMatch[1].replace(/[,\s]/g, "")) || matched.retailPriceZar
      : matched.retailPriceZar
    const customKm = kmMatch
      ? Number(kmMatch[1].replace(/[,\s]/g, "")) || matched.mileageKm
      : matched.mileageKm

    return {
      stockNumber: matched.stockNumber,
      year: matched.year,
      make: matched.make,
      model: matched.model,
      variant: matched.variant,
      priceZar: customPrice,
      mileageKm: customKm,
      vin: matched.vin,
      branch: matched.branch,
      colour: matched.colour,
      portals: finalPortals,
      headline: `${matched.year} ${matched.make} ${matched.model} ${matched.variant}`,
    }
  }

  return {
    stockNumber: extracted.stockNumber,
    year: extracted.year,
    make: extracted.make,
    model: extracted.model,
    variant: extracted.variant,
    priceZar: extracted.retailPriceZar,
    mileageKm: extracted.mileageKm,
    vin: extracted.vin,
    branch: extracted.branch,
    colour: extracted.colour,
    portals: finalPortals,
    headline: `${extracted.year} ${extracted.make} ${extracted.model} ${extracted.variant}`,
  }
}

export interface ParsedFinanceAction {
  applicantName: string
  vehicleTitle: string
  stockNumber: string
  vehiclePriceZar: number
  depositZar: number
  termMonths: number
  balloonPct: number
  interestRatePct: number
  grossMonthlyIncomeZar?: number
  banks: SaBankName[]
}

export function parseFinanceIntentFromText(
  text: string,
  inventory: ShowroomVehicle[] = SA_SHOWROOM_VEHICLES
): ParsedFinanceAction | null {
  if (!text || text.length < 50) return null
  const hasFinanceSignals =
    /(?:wesbank|absa|mfc|nedbank|standard\s*bank|capitec|signio)/i.test(text) &&
    /(?:finance|instalment|installment|vaf|application|dossier|pre-?approv|fica|balloon|monthly)/i.test(
      text
    )
  if (!hasFinanceSignals) return null

  const lower = text.toLowerCase()
  const matched =
    inventory.find(
      (v) =>
        lower.includes(v.stockNumber.toLowerCase()) ||
        (lower.includes(v.make.toLowerCase()) && lower.includes(v.model.toLowerCase()))
    ) ?? inventory[0]

  const nameMatch =
    text.match(/(?:applicant|client|buyer|customer)[:\s*]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/) ||
    text.match(/\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/)
  const depositMatch = text.match(/deposit[:\s*]+(?:ZAR|R)\s*([\d, ]+)/i)
  const incomeMatch = text.match(/(?:gross\s*(?:monthly\s*)?income|salary)[:\s*]+(?:ZAR|R)\s*([\d, ]+)/i)
  const termMatch = text.match(/\b(48|60|72)\s*(?:months|mths|m)\b/i)
  const balloonMatch = text.match(/(\d{1,2})%\s*(?:balloon|residual)/i)

  const banks: SaBankName[] = []
  if (/wesbank/i.test(text)) banks.push("WesBank")
  if (/absa/i.test(text)) banks.push("Absa Vehicle Finance")
  if (/mfc|nedbank/i.test(text)) banks.push("MFC (Nedbank)")
  if (/standard\s*bank/i.test(text)) banks.push("Standard Bank VAF")
  if (/capitec|signio/i.test(text)) banks.push("Capitec / Signio")

  return {
    applicantName: nameMatch?.[1]?.trim() || "Showroom Buyer",
    vehicleTitle: `${matched.year} ${matched.make} ${matched.model} ${matched.variant}`,
    stockNumber: matched.stockNumber,
    vehiclePriceZar: matched.retailPriceZar,
    depositZar: depositMatch
      ? Number(depositMatch[1].replace(/[,\s]/g, "")) || Math.round(matched.retailPriceZar * 0.1)
      : Math.round(matched.retailPriceZar * 0.1),
    termMonths: termMatch ? Number(termMatch[1]) : 72,
    balloonPct: balloonMatch ? Number(balloonMatch[1]) : 20,
    interestRatePct: SA_PRIME_RATE + 0.5,
    grossMonthlyIncomeZar: incomeMatch
      ? Number(incomeMatch[1].replace(/[,\s]/g, "")) || undefined
      : undefined,
    banks:
      banks.length > 0
        ? banks
        : ["WesBank", "Absa Vehicle Finance", "MFC (Nedbank)", "Standard Bank VAF"],
  }
}

export interface ParsedFollowUpAction {
  recipientName: string
  phone: string
  vehicleTitle: string
  cadenceStep: "speed_to_lead_15m" | "test_drive_24h" | "finance_fica_48h" | "price_drop_72h"
  channel: "whatsapp" | "email"
  messagePreview: string
}

export function parseFollowUpIntentFromText(
  text: string,
  inventory: ShowroomVehicle[] = SA_SHOWROOM_VEHICLES
): ParsedFollowUpAction | null {
  if (!text || text.length < 50) return null
  const hasFollowUpSignals =
    /(?:follow[- ]?up|cadence|24h|48h|72h|test[- ]?drive\s*reminder|cold\s*lead|fica\s*reminder|re-?engag)/i.test(
      text
    ) && /(?:whatsapp|email|buyer|lead|test\s*drive|showroom|message)/i.test(text)
  if (!hasFollowUpSignals) return null

  const lower = text.toLowerCase()
  const matched =
    inventory.find(
      (v) =>
        lower.includes(v.stockNumber.toLowerCase()) ||
        (lower.includes(v.make.toLowerCase()) && lower.includes(v.model.toLowerCase()))
    ) ?? inventory[0]

  const quoteBlockMatch = text.match(/^>\s*(.+)$/m)
  const phoneMatch = text.match(/(\+27[\d\s-]{8,14})/)
  const nameMatch = text.match(
    /(?:hi|hello|dear|for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  )

  const cadenceStep: ParsedFollowUpAction["cadenceStep"] = /72h|price[- ]?drop/i.test(text)
    ? "price_drop_72h"
    : /48h|fica|finance/i.test(text)
      ? "finance_fica_48h"
      : /15[- ]?min|speed/i.test(text)
        ? "speed_to_lead_15m"
        : "test_drive_24h"

  return {
    recipientName: nameMatch?.[1]?.trim() || "Showroom Lead",
    phone: phoneMatch?.[1]?.trim() || "+27 82 455 0192",
    vehicleTitle: `${matched.year} ${matched.make} ${matched.model}`,
    cadenceStep,
    channel: /email|gmail/i.test(text) && !/whatsapp/i.test(text) ? "email" : "whatsapp",
    messagePreview:
      quoteBlockMatch?.[1]?.trim() ||
      `Hi! Checking in from AutoPulse Motors SA regarding the ${matched.year} ${matched.make} ${matched.model} (R${matched.retailPriceZar.toLocaleString("en-ZA")}). Would you like to lock in a test drive or instant WesBank/Absa/MFC pre-approval today?`,
  }
}

export function formatZar(amount: number): string {
  return `R ${Math.round(amount).toLocaleString("en-ZA")}`
}
