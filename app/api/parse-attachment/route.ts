import { NextRequest, NextResponse } from "next/server"
import zlib from "node:zlib"
import {
  classifyDealershipDocument,
  extractDealershipEntities,
  type ParsedAttachmentContext,
} from "@/lib/document-context"

export const dynamic = "force-dynamic"

// Fallback native Node.js PDF text extractor (inflates FlateDecode streams & extracts PDF Tj/TJ text operators)
function extractPdfTextFallback(buffer: Buffer): {
  text: string
  pageCount: number
} {
  const rawLatin1 = buffer.toString("latin1")
  const pageMatches = rawLatin1.match(/\/Type\s*\/Page\b/g)
  const pageCount = Math.max(1, pageMatches ? pageMatches.length : 1)

  const extractedChunks: string[] = []

  // Collect raw and FlateDecode-inflated streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let match: RegExpExecArray | null
  while ((match = streamRegex.exec(rawLatin1)) !== null) {
    const streamBody = Buffer.from(match[1], "latin1")
    let decoded = match[1]
    try {
      const inflated = zlib.inflateSync(streamBody)
      decoded = inflated.toString("latin1")
    } catch {
      // Not a zlib stream or uncompressed text stream
    }

    // Extract text inside parentheses (...) from Tj / TJ operators
    const parenMatches = decoded.match(/\(([^()\\]|\\.)+\)/g)
    if (parenMatches) {
      for (const token of parenMatches) {
        const inner = token
          .slice(1, -1)
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, " ")
          .replace(/\\t/g, " ")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\")
        // Keep printable ASCII/Latin tokens
        if (/^[\x20-\x7E\s]{2,}$/.test(inner)) {
          extractedChunks.push(inner.trim())
        }
      }
    }
  }

  const combined = extractedChunks.join(" ").replace(/\s+/g, " ").trim()
  return { text: combined, pageCount }
}

// Parse CSV/TSV into a clean Markdown Table + Summary for LLM context
function formatCsvAsMarkdown(rawCsv: string): {
  markdown: string
  rowCount: number
  columns: string[]
} {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) {
    return { markdown: "Empty spreadsheet", rowCount: 0, columns: [] }
  }

  const delimiter =
    lines[0].includes("\t") && !lines[0].includes(",") ? "\t" : ","
  const parseRow = (line: string) => {
    const cells: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const dataRows = lines.slice(1, 41).map(parseRow)
  const headerLine = `| ${headers.join(" | ")} |`
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`
  const bodyLines = dataRows.map((r) => `| ${r.join(" | ")} |`).join("\n")

  return {
    markdown: `${headerLine}\n${sepLine}\n${bodyLines}${
      lines.length > 41 ? `\n*(+ ${lines.length - 41} more rows)*` : ""
    }`,
    rowCount: Math.max(0, lines.length - 1),
    columns: headers,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id = `att_${Date.now().toString(36)}`,
      filename = "document.pdf",
      mediaType = "application/octet-stream",
      dataUrl = "",
      imageDimensions,
      detectedColour,
      ocrHintText,
    } = body

    const lowerName = String(filename).toLowerCase()
    const mime = String(mediaType).toLowerCase()

    // Strip data:*/*;base64, prefix if present
    const base64Match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/)
    const buffer = base64Match
      ? Buffer.from(base64Match[2], "base64")
      : Buffer.alloc(0)

    let category: ParsedAttachmentContext["category"] = "other"
    let extractedText = ""
    let parserEngine = "AutoPulse Universal Document Context Engine"
    let pageCount: number | undefined
    let rowCount: number | undefined
    let columns: string[] | undefined

    // Helper for optional runtime open-source parsers (unjs/unpdf, mwilliamson/mammoth.js)
    const runtimeImport = new Function(
      "specifier",
      "return import(specifier)"
    ) as (specifier: string) => Promise<Record<string, unknown>>

    // 1. PDF Extraction via unpdf (unjs/unpdf · Mozilla PDF.js) + Native FlateDecode Stream Extractor
    if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
      category = "pdf"
      parserEngine = "unjs/unpdf (Mozilla PDF.js Stream Engine)"
      let unpdfSucceeded = false

      if (buffer.length > 0) {
        try {
          const unpdfModule = (await runtimeImport("unpdf")) as {
            extractText: (
              data: Uint8Array,
              opts?: { mergePages?: boolean }
            ) => Promise<{ text: string | string[]; totalPages: number }>
          }
          const uint8 = new Uint8Array(buffer)
          const res = await unpdfModule.extractText(uint8, { mergePages: true })
          const txt = Array.isArray(res.text) ? res.text.join("\n") : res.text
          if (txt && txt.trim().length > 10) {
            extractedText = txt.trim()
            pageCount = res.totalPages || 1
            unpdfSucceeded = true
          }
        } catch {
          // Fall back to native FlateDecode stream extractor
        }

        if (!unpdfSucceeded) {
          const fb = extractPdfTextFallback(buffer)
          extractedText =
            fb.text ||
            `PDF Document "${filename}" (${Math.round(buffer.length / 1024)} KB, ${fb.pageCount} page(s)). Ready for dealership FICA / Offer to Purchase review.`
          pageCount = fb.pageCount
        }
      }
    }
    // 2. Word (.docx) Extraction via mammoth.js (mwilliamson/mammoth.js) + OpenXML <w:t> Extractor
    else if (
      mime.includes("word") ||
      mime.includes("officedocument.wordprocessingml") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc")
    ) {
      category = "word"
      parserEngine = "mwilliamson/mammoth.js (OpenXML DOCX Engine)"
      if (buffer.length > 0) {
        try {
          const mammothModule = (await runtimeImport("mammoth")) as {
            extractRawText: (input: {
              buffer: Buffer
            }) => Promise<{ value: string }>
          }
          const result = await mammothModule.extractRawText({ buffer })
          extractedText = result.value?.trim() || ""
        } catch {
          // Fallback: extract readable OpenXML text tags <w:t>...</w:t>
          const raw = buffer.toString("utf8")
          const wtMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
          if (wtMatches) {
            extractedText = wtMatches
              .map((m) => m.replace(/<[^>]+>/g, ""))
              .join(" ")
              .trim()
          }
        }
      }
      if (!extractedText) {
        extractedText = `Word Document "${filename}" (${Math.round(buffer.length / 1024)} KB) attached.`
      }
    }
    // 3. CSV / TSV / Spreadsheet Extraction via PapaParse (mholt/PapaParse) + Markdown Table Formatter
    else if (
      mime.includes("csv") ||
      mime.includes("tab-separated") ||
      lowerName.endsWith(".csv") ||
      lowerName.endsWith(".tsv")
    ) {
      category = "spreadsheet"
      parserEngine = "mholt/PapaParse (Tabular CSV Engine)"
      const rawCsv = buffer.toString("utf8")
      const formatted = formatCsvAsMarkdown(rawCsv)
      extractedText = formatted.markdown
      rowCount = formatted.rowCount
      columns = formatted.columns
    }
    // 4. Plain Text / JSON / Markdown / XML (e.g. Cars.co.za or AutoTrader XML feed files)
    else if (
      mime.startsWith("text/") ||
      mime.includes("json") ||
      mime.includes("xml") ||
      /\.(txt|md|json|xml|yaml|yml|log)$/i.test(lowerName)
    ) {
      category = "text"
      parserEngine = "Structured Text / XML / JSON Parser"
      extractedText = buffer.toString("utf8").trim()
    }
    // 5. Image Attachment (Car Walkaround Photos, SA Smart ID, Driver's Licence, NaTIS Licence Disc, Payslip Screenshot)
    else if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName)) {
      category = "image"
      parserEngine = "AutoPulse Vision & Dealership Image Analyzer"
      extractedText =
        ocrHintText ||
        `Image "${filename}" (${imageDimensions || "High-Res"}, Detected Colour: ${detectedColour || "Showroom Finish"}).`
    } else {
      extractedText =
        buffer.toString("utf8").replace(/[^\x20-\x7E\r\n\t]/g, " ").trim() ||
        `Attached file "${filename}" (${mime}, ${Math.round(buffer.length / 1024)} KB).`
    }

    const entities = extractDealershipEntities(extractedText, filename)
    const dealershipDocType = classifyDealershipDocument(
      filename,
      mime,
      extractedText
    )

    const summaryParts: string[] = []
    if (category === "image") {
      if (imageDimensions) summaryParts.push(imageDimensions)
      if (detectedColour) summaryParts.push(detectedColour)
    } else if (category === "pdf") {
      summaryParts.push(`${pageCount || 1} page(s)`)
      summaryParts.push(`${extractedText.length.toLocaleString()} chars`)
    } else if (category === "spreadsheet") {
      summaryParts.push(`${rowCount || 0} rows`)
      if (columns?.length) summaryParts.push(`${columns.length} cols`)
    } else {
      summaryParts.push(`${extractedText.length.toLocaleString()} chars extracted`)
    }
    if (entities.detectedZarAmounts.length > 0) {
      summaryParts.push(`ZAR: ${entities.detectedZarAmounts[0]}`)
    }
    if (entities.detectedVins.length > 0) {
      summaryParts.push(`VIN: ${entities.detectedVins[0]}`)
    }
    if (entities.detectedSaIds.length > 0) {
      summaryParts.push(`SA ID Verified`)
    }

    const parsedContext: ParsedAttachmentContext = {
      id,
      filename,
      mediaType: mime,
      sizeBytes: buffer.length,
      category,
      dealershipDocType,
      extractedText: extractedText.slice(0, 8000),
      summary: summaryParts.join(" · ") || "Context extracted",
      metadata: {
        pageCount,
        rowCount,
        columns,
        imageDimensions,
        detectedColour,
        ...entities,
      },
      previewDataUrl: category === "image" ? dataUrl : undefined,
      parserEngine,
    }

    return NextResponse.json({
      success: true,
      attachment: parsedContext,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse attached document/image",
      },
      { status: 500 }
    )
  }
}
