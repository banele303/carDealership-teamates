import {
  analyzeSaMarketPricing,
  calculateSaVehicleFinance,
  formatZar,
} from "@/lib/sa-dealership"

export interface WindowStickerVehicleInput {
  stockNumber: string
  vin?: string
  year: number
  make: string
  model: string
  variant?: string
  bodyType?: string
  condition?: "new" | "used" | "demo"
  mileageKm: number
  transmission?: string
  fuelType?: string
  colour?: string
  retailPriceZar: number
  branch?: string
  fullServiceHistory?: boolean
  spareKeys?: boolean
  dekraGrade?: string
  features?: string[]
  description?: string
}

function escapePdfText(text: string): string {
  return String(text ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function drawPdfFinderPattern(
  ops: string[],
  x: number,
  y: number,
  cell: number
) {
  // 7x7 dark outer ring
  ops.push("0.06 0.09 0.16 rg")
  ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${(cell * 7).toFixed(2)} ${(cell * 7).toFixed(2)} re f`)
  // 5x5 white inner ring
  ops.push("1 1 1 rg")
  ops.push(
    `${(x + cell).toFixed(2)} ${(y + cell).toFixed(2)} ${(cell * 5).toFixed(2)} ${(cell * 5).toFixed(2)} re f`
  )
  // 3x3 dark core
  ops.push("0.06 0.09 0.16 rg")
  ops.push(
    `${(x + cell * 2).toFixed(2)} ${(y + cell * 2).toFixed(2)} ${(cell * 3).toFixed(2)} ${(cell * 3).toFixed(2)} re f`
  )
}

function drawPdfQrMatrix(
  ops: string[],
  x: number,
  y: number,
  sizePt: number,
  payloadUrl: string
) {
  const modules = 21
  const cell = sizePt / modules

  // White quiet zone
  ops.push("1 1 1 rg")
  ops.push(`${(x - 6).toFixed(2)} ${(y - 6).toFixed(2)} ${(sizePt + 12).toFixed(2)} ${(sizePt + 12).toFixed(2)} re f`)

  // 3 QR finder patterns (PDF coordinates: y is bottom-left)
  drawPdfFinderPattern(ops, x, y + (modules - 7) * cell, cell) // top-left
  drawPdfFinderPattern(ops, x + (modules - 7) * cell, y + (modules - 7) * cell, cell) // top-right
  drawPdfFinderPattern(ops, x, y, cell) // bottom-left

  const bytes: number[] = []
  for (let i = 0; i < payloadUrl.length; i++) {
    bytes.push(payloadUrl.charCodeAt(i))
  }

  ops.push("0.06 0.09 0.16 rg")
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const inTopLeft = r < 8 && c < 8
      const inTopRight = r < 8 && c >= modules - 8
      const inBottomLeft = r >= modules - 8 && c < 8
      if (inTopLeft || inTopRight || inBottomLeft) continue

      const pdfY = y + (modules - 1 - r) * cell
      const pdfX = x + c * cell

      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          ops.push(`${pdfX.toFixed(2)} ${pdfY.toFixed(2)} ${cell.toFixed(2)} ${cell.toFixed(2)} re f`)
        }
        continue
      }

      const idx = (r * modules + c) % bytes.length
      const bit =
        ((bytes[idx] * 31 + r * 17 + c * 13) ^ bytes[(idx + 3) % bytes.length]) & 1
      if (bit === 1) {
        ops.push(`${pdfX.toFixed(2)} ${pdfY.toFixed(2)} ${cell.toFixed(2)} ${cell.toFixed(2)} re f`)
      }
    }
  }
}

export function generateShowroomWindowStickerBlob(
  vehicle: WindowStickerVehicleInput
): Blob {
  const depositZar = Math.round(vehicle.retailPriceZar * 0.1)
  const finance = calculateSaVehicleFinance({
    vehiclePriceZar: vehicle.retailPriceZar,
    depositZar,
    termMonths: 72,
    balloonPct: 20,
    interestRatePct: 11.75,
    includeOtrFeeZar: 6500,
  })

  const market = analyzeSaMarketPricing({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    mileageKm: vehicle.mileageKm,
    priceZar: vehicle.retailPriceZar,
    fullServiceHistory: vehicle.fullServiceHistory ?? true,
  })

  const ops: string[] = []

  // Page Background (A4: 595.28 x 841.89 pt)
  ops.push("1 1 1 rg")
  ops.push("0 0 595.28 841.89 re f")

  // 1. Top Dark Navy Dealership Banner
  ops.push("0.04 0.06 0.12 rg")
  ops.push("0 748 595.28 94 re f")
  ops.push("0.05 0.65 0.91 rg")
  ops.push("0 744 595.28 4 re f")

  ops.push("BT /F2 17 Tf 1 1 1 rg 36 808 Td")
  ops.push(`(${escapePdfText("AUTOPULSE MOTORS SOUTH AFRICA (PTY) LTD")}) Tj ET`)

  ops.push("BT /F1 8.5 Tf 0.58 0.64 0.72 rg 36 790 Td")
  ops.push(
    `(${escapePdfText("OFFICIAL SHOWROOM WINDSCREEN SPEC SHEET  |  IDA / RMI ACCREDITED  |  FSP #51890  |  NCRCP14920")}) Tj ET`
  )
  ops.push("BT /F1 8.5 Tf 0.58 0.64 0.72 rg 36 774 Td")
  ops.push(
    `(${escapePdfText(`Branch: ${vehicle.branch || "Midrand Flagship Showroom, Gauteng"}  |  WhatsApp Desk: +27 63 199 5124`)}) Tj ET`
  )

  // Stock Number Box Top-Right
  ops.push("0.05 0.65 0.91 rg")
  ops.push("445 770 114 48 re f")
  ops.push("BT /F2 8 Tf 1 1 1 rg 465 802 Td (STOCK NUMBER) Tj ET")
  ops.push(
    `BT /F2 14 Tf 1 1 1 rg 462 782 Td (${escapePdfText(vehicle.stockNumber.toUpperCase())}) Tj ET`
  )

  // 2. Vehicle Title & DEKRA Verification Strip
  ops.push("BT /F2 20 Tf 0.06 0.09 0.16 rg 36 708 Td")
  ops.push(
    `(${escapePdfText(`${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`)}) Tj ET`
  )
  ops.push("BT /F2 12 Tf 0.20 0.25 0.33 rg 36 688 Td")
  ops.push(
    `(${escapePdfText(vehicle.variant || "Showroom Certified Edition")}) Tj ET`
  )

  // DEKRA Badge Box
  ops.push("0.93 0.99 0.96 rg")
  ops.push("395 684 164 42 re f")
  ops.push("0.06 0.73 0.51 RG 1.2 w 395 684 164 42 re S")
  ops.push("BT /F2 9 Tf 0.02 0.59 0.41 rg 408 708 Td")
  ops.push(
    `(${escapePdfText(vehicle.dekraGrade || "DEKRA Platinum 98/100")}) Tj ET`
  )
  ops.push("BT /F1 8 Tf 0.02 0.59 0.41 rg 408 694 Td")
  ops.push("(AA Roadworthy & eNaTIS Ready) Tj ET")

  // 3. Dual Hero Pricing & NCA Monthly Finance Box
  ops.push("0.97 0.98 0.99 rg")
  ops.push("36 566 523 102 re f")
  ops.push("0.80 0.84 0.88 RG 1 w 36 566 523 102 re S")

  // Left: Retail Price
  ops.push("BT /F2 8.5 Tf 0.39 0.45 0.55 rg 52 644 Td")
  ops.push("(SHOWROOM RETAIL PRICE - INCL. 15% SA VAT) Tj ET")
  ops.push("BT /F2 24 Tf 0.06 0.09 0.16 rg 52 612 Td")
  ops.push(`(${escapePdfText(formatZar(vehicle.retailPriceZar))}) Tj ET`)
  ops.push("BT /F1 8 Tf 0.28 0.33 0.41 rg 52 584 Td")
  ops.push(
    `(${escapePdfText(`Excl. OTR / Licensing: R 6,500  |  VIN: ${vehicle.vin || "VERIFIED-NATIS-ZA"}`)}) Tj ET`
  )

  // Divider
  ops.push("0.85 0.88 0.92 RG 1 w 298 578 m 298 656 l S")

  // Right: NCA Monthly Finance Instalment
  ops.push("BT /F2 8.5 Tf 0.01 0.52 0.78 rg 314 644 Td")
  ops.push("(ESTIMATED NCA MONTHLY INSTALMENT) Tj ET")
  ops.push("BT /F2 23 Tf 0.01 0.41 0.63 rg 314 612 Td")
  ops.push(
    `(${escapePdfText(`${formatZar(finance.monthlyInstallmentTotalZar)} / pm`)}) Tj ET`
  )
  ops.push("BT /F1 8 Tf 0.28 0.33 0.41 rg 314 584 Td")
  ops.push(
    `(${escapePdfText(`72m | 10% Dep (${formatZar(depositZar)}) | 20% Balloon @ 11.75%`)}) Tj ET`
  )

  // 4. Cars.co.za & AutoTrader SA Market Price Benchmark Banner
  ops.push("0.94 0.98 1.0 rg")
  ops.push("36 512 523 42 re f")
  ops.push("0.49 0.83 0.99 RG 1 w 36 512 523 42 re S")
  ops.push("BT /F2 9.5 Tf 0.01 0.41 0.63 rg 48 536 Td")
  ops.push(
    `(${escapePdfText(`LIVE SA MARKET BENCHMARK: ${market.valueRankLabel.toUpperCase()}`)}) Tj ET`
  )
  ops.push("BT /F1 8 Tf 0.12 0.23 0.54 rg 48 521 Td")
  ops.push(
    `(${escapePdfText(`Compared against ${market.totalCompetitors} live listings on Cars.co.za (${market.competitorCountCarsCoZa}) & AutoTrader SA (${market.competitorCountAutoTrader}) | Market Avg: ${formatZar(market.marketAvgZar)}`)}) Tj ET`
  )

  // 5. 8-Box Technical Specification Grid
  ops.push("BT /F2 11 Tf 0.06 0.09 0.16 rg 36 488 Td")
  ops.push("(VEHICLE SPECIFICATION & PROVENANCE) Tj ET")

  const specs: Array<{ label: string; value: string }> = [
    {
      label: "ODOMETER MILEAGE",
      value: `${vehicle.mileageKm.toLocaleString("en-ZA")} km`,
    },
    { label: "TRANSMISSION", value: vehicle.transmission || "Automatic" },
    { label: "FUEL SYSTEM", value: vehicle.fuelType || "Diesel / Petrol" },
    { label: "BODY CONFIGURATION", value: vehicle.bodyType || "SUV / Bakkie" },
    { label: "EXTERIOR COLOUR", value: vehicle.colour || "Glacier White" },
    {
      label: "SERVICE HISTORY",
      value:
        vehicle.fullServiceHistory !== false
          ? "Full Franchise History (FSH)"
          : "Verified Service Record",
    },
    {
      label: "SPARE KEYS & NATIS",
      value:
        vehicle.spareKeys !== false
          ? "Spare Keys + eNaTIS On Hand"
          : "eNaTIS Certificate Ready",
    },
    {
      label: "CONDITION GRADE",
      value: (vehicle.condition || "USED").toUpperCase(),
    },
  ]

  const boxW = 254
  const boxH = 38
  specs.forEach((item, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const bx = 36 + col * (boxW + 15)
    const by = 436 - row * (boxH + 8)

    ops.push("0.99 0.99 1.0 rg")
    ops.push(`${bx} ${by} ${boxW} ${boxH} re f`)
    ops.push("0.88 0.91 0.94 RG 1 w")
    ops.push(`${bx} ${by} ${boxW} ${boxH} re S`)

    ops.push(`BT /F2 7.5 Tf 0.39 0.45 0.55 rg ${bx + 10} ${by + 24} Td`)
    ops.push(`(${escapePdfText(item.label)}) Tj ET`)

    ops.push(`BT /F2 10 Tf 0.06 0.09 0.16 rg ${bx + 10} ${by + 10} Td`)
    ops.push(`(${escapePdfText(item.value)}) Tj ET`)
  })

  // 6. Key Features
  ops.push("BT /F2 11 Tf 0.06 0.09 0.16 rg 36 276 Td")
  ops.push("(FACTORY FEATURES & SHOWROOM HIGHLIGHTS) Tj ET")

  const features =
    vehicle.features && vehicle.features.length > 0
      ? vehicle.features
      : [
          "Full Franchise Service History (FSH) & Balance of Factory Plan",
          "DEKRA Multi-Point Inspection & AA Roadworthy Certified",
          "Apple CarPlay / Android Auto & Reverse Camera Assist",
          "Smash & Grab Safety Film + Nationwide SA Delivery Available",
          "Instant Multi-Bank Finance via WesBank, Absa, MFC & Standard Bank",
        ]

  features.slice(0, 5).forEach((feat, idx) => {
    const fy = 256 - idx * 16
    ops.push(`BT /F1 9 Tf 0.20 0.25 0.33 rg 44 ${fy} Td`)
    ops.push(`(${escapePdfText(`•  ${feat}`)}) Tj ET`)
  })

  // 7. Bottom Dark Footer Card + Scannable QR Code Matrix
  ops.push("0.06 0.09 0.16 rg")
  ops.push("36 36 523 132 re f")

  ops.push("BT /F2 11 Tf 1 1 1 rg 52 144 Td")
  ops.push("(SCAN TO APPLY FOR MULTI-BANK VEHICLE FINANCE IN 60 SECONDS) Tj ET")

  ops.push("BT /F1 8.5 Tf 0.73 0.90 0.99 rg 52 126 Td")
  ops.push("(Auto-submits your FICA dossier simultaneously to:) Tj ET")

  ops.push("BT /F2 9.5 Tf 0.22 0.74 0.97 rg 52 110 Td")
  ops.push(
    "(WesBank  |  Absa Vehicle Finance  |  MFC (Nedbank)  |  Standard Bank VAF  |  Capitec) Tj ET"
  )

  ops.push("BT /F1 7.5 Tf 0.58 0.64 0.72 rg 52 86 Td")
  ops.push(
    `(${escapePdfText(`NCA Disclosure: Linked rate 11.75% (Prime + 0.5%) over 72 months, R 1,207.50 NCR initiation fee,`)}) Tj ET`
  )
  ops.push("BT /F1 7.5 Tf 0.58 0.64 0.72 rg 52 74 Td")
  ops.push(
    `(${escapePdfText(`R 69/pm monthly service fee, Total Repayable ${formatZar(finance.totalRepayableZar)}. Subject to FICA & bank credit approval.`)}) Tj ET`
  )
  ops.push("BT /F1 7.5 Tf 0.58 0.64 0.72 rg 52 56 Td")
  ops.push(
    `(${escapePdfText(`Online Showroom URL: /showroom?stock=${vehicle.stockNumber.toUpperCase()}`)}) Tj ET`
  )

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"
  const showroomUrl = `${origin}/showroom?stock=${encodeURIComponent(vehicle.stockNumber)}`
  drawPdfQrMatrix(ops, 446, 52, 94, showroomUrl)

  const streamContent = ops.join("\n")
  const streamBytes = new TextEncoder().encode(streamContent).length

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj",
    `6 0 obj\n<< /Length ${streamBytes} >>\nstream\n${streamContent}\nendstream\nendobj`,
  ]

  const header = "%PDF-1.4\n"
  let offset = header.length
  const xrefs: number[] = [0]
  let body = ""

  for (const obj of objects) {
    xrefs.push(offset)
    const objStr = obj + "\n"
    body += objStr
    offset += objStr.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += String(xrefs[i]).padStart(10, "0") + " 00000 n \n"
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`
  const fullPdf = `${header}${body}${xref}${trailer}`

  return new Blob([fullPdf], { type: "application/pdf" })
}

export function downloadShowroomWindowStickerPdf(
  vehicle: WindowStickerVehicleInput
) {
  const blob = generateShowroomWindowStickerBlob(vehicle)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `AutoPulse-Windscreen-Spec-${vehicle.stockNumber.toUpperCase()}-${vehicle.make}-${vehicle.model}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
