import { parseSouthAfricanId } from "@/lib/sa-dealership"

export interface ParsedAttachmentContext {
  id: string
  filename: string
  mediaType: string
  sizeBytes?: number
  category: "image" | "pdf" | "word" | "spreadsheet" | "text" | "other"
  dealershipDocType:
    | "Vehicle Walkaround Photo"
    | "NaTIS Licence Disc / VIN Scan"
    | "SA FICA ID / Driver's Licence"
    | "FICA Payslip / Bank Statement"
    | "DEKRA / Inspection Report"
    | "Vehicle Stock / Lead Spreadsheet"
    | "Offer to Purchase / Deal Sheet"
    | "General Dealership Document"
  extractedText: string
  summary: string
  metadata: {
    pageCount?: number
    rowCount?: number
    columns?: string[]
    imageDimensions?: string
    detectedColour?: string
    detectedVins?: string[]
    detectedSaIds?: string[]
    detectedZarAmounts?: string[]
    detectedStockNumbers?: string[]
  }
  previewDataUrl?: string
  parserEngine: string
}

// Detect dealership-specific entities (VINs, 13-digit SA IDs, ZAR amounts, Stock #s) inside any extracted text
export function extractDealershipEntities(text: string, filename = "") {
  const combined = `${filename}\n${text}`

  // 17-character VINs (excluding I, O, Q)
  const vinMatches = Array.from(
    new Set(combined.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) ?? [])
  ).filter((candidate) => /[A-Z]/.test(candidate) && /\d/.test(candidate))

  // 13-digit South African ID numbers
  const rawThirteenDigits = Array.from(
    new Set(combined.match(/\b\d{13}\b/g) ?? [])
  )
  const validSaIds = rawThirteenDigits.filter((id) => {
    const parsed = parseSouthAfricanId(id)
    return Boolean(parsed.birthDate)
  })

  // ZAR amounts (e.g., R 949,900 or ZAR 45,000)
  const zarMatches = Array.from(
    new Set(
      combined.match(/(?:R|ZAR)\s?\d{1,3}(?:[,\s]\d{3})+(?:\.\d{2})?/gi) ?? []
    )
  ).slice(0, 8)

  // Stock numbers (e.g., APM-2401)
  const stockMatches = Array.from(
    new Set(combined.match(/\bAPM-\d{3,5}\b/gi) ?? [])
  ).map((s) => s.toUpperCase())

  return {
    detectedVins: vinMatches.slice(0, 5),
    detectedSaIds: validSaIds.slice(0, 3),
    detectedZarAmounts: zarMatches,
    detectedStockNumbers: stockMatches,
  }
}

export function classifyDealershipDocument(
  filename: string,
  mediaType: string,
  extractedText: string
): ParsedAttachmentContext["dealershipDocType"] {
  const lower = `${filename} ${extractedText}`.toLowerCase()

  if (mediaType.startsWith("image/")) {
    if (/natis|licence\s*disc|license\s*disc|mvl1|vin|barcode/i.test(lower)) {
      return "NaTIS Licence Disc / VIN Scan"
    }
    if (/id\s*card|smart\s*id|driver|licence|license|passport|identity/i.test(lower)) {
      return "SA FICA ID / Driver's Licence"
    }
    if (/payslip|bank\s*statement|fnb|capitec|absa|standard\s*bank|nedbank/i.test(lower)) {
      return "FICA Payslip / Bank Statement"
    }
    return "Vehicle Walkaround Photo"
  }

  if (
    mediaType.includes("csv") ||
    mediaType.includes("spreadsheet") ||
    /\.(csv|tsv|xlsx|xls)$/i.test(filename)
  ) {
    return "Vehicle Stock / Lead Spreadsheet"
  }

  if (/payslip|salary|net\s*pay|gross\s*income|bank\s*statement|fica|proof\s*of\s*address|utility\s*bill/i.test(lower)) {
    return "FICA Payslip / Bank Statement"
  }
  if (/identity\s*number|sa\s*id|driver.*licen[cs]e|citizen/i.test(lower)) {
    return "SA FICA ID / Driver's Licence"
  }
  if (/dekra|roadworthy|cor\s*certificate|multi-?point|aa\s*check/i.test(lower)) {
    return "DEKRA / Inspection Report"
  }
  if (/offer\s*to\s*purchase|otp|pro-?forma|tax\s*invoice|signio|wesbank|mfc/i.test(lower)) {
    return "Offer to Purchase / Deal Sheet"
  }
  if (/natis|enatis|chassis|vin\s*number/i.test(lower)) {
    return "NaTIS Licence Disc / VIN Scan"
  }
  return "General Dealership Document"
}

// Fast client-side image analysis: dimensions, dominant vehicle exterior colour, and compact preview data URL
export async function analyzeImageAttachmentInBrowser(
  dataUrlOrBlobUrl: string,
  filename: string
): Promise<{
  dimensions: string
  detectedColour: string
  compactDataUrl: string
  ocrHintText: string
}> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const width = img.naturalWidth || img.width || 800
      const height = img.naturalHeight || img.height || 600

      // Create compact preview canvas (max 720px) for fast vision & storage
      const canvas = document.createElement("canvas")
      const maxDim = 720
      const scale = Math.min(1, maxDim / Math.max(width, height))
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const ctx = canvas.getContext("2d")

      let detectedColour = "Glacier White / Silver"
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        try {
          // Sample center region for dominant vehicle paint colour
          const sampleW = Math.max(1, Math.floor(canvas.width * 0.4))
          const sampleH = Math.max(1, Math.floor(canvas.height * 0.4))
          const startX = Math.floor((canvas.width - sampleW) / 2)
          const startY = Math.floor((canvas.height - sampleH) / 2)
          const pixels = ctx.getImageData(startX, startY, sampleW, sampleH).data

          let rSum = 0
          let gSum = 0
          let bSum = 0
          let count = 0
          for (let i = 0; i < pixels.length; i += 16) {
            rSum += pixels[i]
            gSum += pixels[i + 1]
            bSum += pixels[i + 2]
            count++
          }
          if (count > 0) {
            const r = rSum / count
            const g = gSum / count
            const b = bSum / count
            const brightness = (r + g + b) / 3
            const maxC = Math.max(r, g, b)
            const minC = Math.min(r, g, b)
            const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC

            if (brightness > 205 && saturation < 0.18) {
              detectedColour = "Glacier White"
            } else if (brightness < 55) {
              detectedColour = "Attitude Black"
            } else if (saturation < 0.16) {
              detectedColour =
                brightness > 135 ? "Reflex Silver Metallic" : "Moonstone Grey"
            } else if (r > g * 1.35 && r > b * 1.35) {
              detectedColour = "Kings Red Metallic"
            } else if (b > r * 1.25 && b > g * 1.1) {
              detectedColour = "Estoril Blue Metallic"
            } else if (r > 170 && g > 140 && b < 90) {
              detectedColour = "Luxe Yellow / Gold"
            } else if (g > r * 1.15 && g > b * 1.15) {
              detectedColour = "Jungle Green"
            }
          }
        } catch {
          // Ignore CORS pixel sampling error if external
        }
      }

      const compactDataUrl = canvas.toDataURL("image/jpeg", 0.76)

      // Infer helpful vehicle/document context from filename
      const cleanName = filename
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[_-]+/g, " ")

      resolve({
        dimensions: `${width}×${height}px`,
        detectedColour,
        compactDataUrl,
        ocrHintText: `Attached Image "${filename}" (${width}×${height}px, Dominant Exterior/Document Tone: ${detectedColour}). Filename context: ${cleanName}`,
      })
    }
    img.onerror = () => {
      resolve({
        dimensions: "Unknown",
        detectedColour: "Standard Showroom",
        compactDataUrl: dataUrlOrBlobUrl,
        ocrHintText: `Attached Image "${filename}"`,
      })
    }
    img.src = dataUrlOrBlobUrl
  })
}

// Format parsed attachment contexts into a structured LLM prompt block + compact user message badge summary
export function formatAttachmentsForAgentPrompt(
  attachments: ParsedAttachmentContext[]
): {
  userMessageBadgeBlock: string
  systemContextBlock: string
  primaryImageDataUrl?: string
} {
  if (!attachments || attachments.length === 0) {
    return { userMessageBadgeBlock: "", systemContextBlock: "" }
  }

  const badgeLines = attachments.map((att) => {
    const icon =
      att.category === "image"
        ? "🖼️"
        : att.category === "pdf"
          ? "📄"
          : att.category === "spreadsheet"
            ? "📊"
            : "📎"
    return `> ${icon} **Attached ${att.dealershipDocType}**: \`${att.filename}\` *(${att.summary})*`
  })

  const detailedBlocks = attachments.map((att, index) => {
    const metaParts: string[] = [
      `Parser: ${att.parserEngine}`,
      `Classification: ${att.dealershipDocType}`,
    ]
    if (att.metadata.pageCount) metaParts.push(`Pages: ${att.metadata.pageCount}`)
    if (att.metadata.rowCount) metaParts.push(`Rows: ${att.metadata.rowCount}`)
    if (att.metadata.imageDimensions)
      metaParts.push(`Dimensions: ${att.metadata.imageDimensions}`)
    if (att.metadata.detectedColour)
      metaParts.push(`Detected Colour: ${att.metadata.detectedColour}`)
    if (att.metadata.detectedVins?.length)
      metaParts.push(`Detected VIN(s): ${att.metadata.detectedVins.join(", ")}`)
    if (att.metadata.detectedSaIds?.length)
      metaParts.push(`Detected SA ID(s): ${att.metadata.detectedSaIds.join(", ")}`)
    if (att.metadata.detectedZarAmounts?.length)
      metaParts.push(
        `Detected ZAR Amounts: ${att.metadata.detectedZarAmounts.join(", ")}`
      )
    if (att.metadata.detectedStockNumbers?.length)
      metaParts.push(
        `Detected Stock #(s): ${att.metadata.detectedStockNumbers.join(", ")}`
      )

    return [
      `--- ATTACHMENT #${index + 1}: ${att.filename} (${att.mediaType || att.category}) ---`,
      `Metadata: ${metaParts.join(" | ")}`,
      `Extracted Content / Context:\n${att.extractedText.slice(0, 6000)}`,
    ].join("\n")
  })

  const primaryImage = attachments.find(
    (a) => a.category === "image" && a.previewDataUrl
  )?.previewDataUrl

  return {
    userMessageBadgeBlock: badgeLines.join("\n"),
    systemContextBlock: [
      "=== ATTACHED DOCUMENTS & IMAGES IN CURRENT USER MESSAGE (FULL EXTRACTED CONTEXT) ===",
      "You have direct access to the extracted text, tables, FICA details, VINs, ZAR figures, and visual metadata of the files the user attached below. Reference their exact contents in your response:",
      ...detailedBlocks,
    ].join("\n\n"),
    primaryImageDataUrl: primaryImage,
  }
}
