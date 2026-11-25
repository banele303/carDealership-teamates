"use client"

import * as React from "react"
import {
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Sparkles,
  X,
} from "lucide-react"

import {
  PromptInputHeader,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  analyzeImageAttachmentInBrowser,
  type ParsedAttachmentContext,
} from "@/lib/document-context"

async function blobUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(blob)
  })
}

export async function parseFilePartToContext(filePart: {
  id?: string
  filename?: string
  mediaType?: string
  url?: string
}): Promise<ParsedAttachmentContext> {
  const id = filePart.id || `att_${Date.now().toString(36)}`
  const filename = filePart.filename || "attachment"
  const mediaType = filePart.mediaType || "application/octet-stream"
  const rawUrl = filePart.url || ""

  const dataUrl = rawUrl ? await blobUrlToDataUrl(rawUrl) : ""

  let imageDimensions: string | undefined
  let detectedColour: string | undefined
  let compactDataUrl = dataUrl
  let ocrHintText: string | undefined

  if (
    mediaType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(filename)
  ) {
    const imgMeta = await analyzeImageAttachmentInBrowser(dataUrl, filename)
    imageDimensions = imgMeta.dimensions
    detectedColour = imgMeta.detectedColour
    compactDataUrl = imgMeta.compactDataUrl
    ocrHintText = imgMeta.ocrHintText
  }

  const res = await fetch("/api/parse-attachment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      filename,
      mediaType,
      dataUrl: compactDataUrl,
      imageDimensions,
      detectedColour,
      ocrHintText,
    }),
  })

  if (!res.ok) {
    throw new Error("Could not extract attachment context")
  }
  const data = await res.json()
  return data.attachment as ParsedAttachmentContext
}

export function PromptInputAttachmentTray({
  parsedMap,
  setParsedMap,
}: {
  parsedMap: Record<string, ParsedAttachmentContext>
  setParsedMap: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAttachmentContext>>
  >
}) {
  const attachments = usePromptInputAttachments()
  const [parsingIds, setParsingIds] = React.useState<Record<string, boolean>>({})
  const [expandedPreviewId, setExpandedPreviewId] = React.useState<string | null>(
    null
  )
  const inflightRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    const currentFiles = attachments.files
    const activeIds = new Set(currentFiles.map((f) => f.id))

    setParsedMap((prev) => {
      const next: Record<string, ParsedAttachmentContext> = {}
      let changed = false
      for (const [k, v] of Object.entries(prev)) {
        if (activeIds.has(k)) {
          next[k] = v
        } else {
          changed = true
          inflightRef.current.delete(k)
        }
      }
      return changed ? next : prev
    })

    for (const file of currentFiles) {
      if (parsedMap[file.id] || inflightRef.current.has(file.id)) continue
      inflightRef.current.add(file.id)
      setParsingIds((prev) => ({ ...prev, [file.id]: true }))

      void parseFilePartToContext(file)
        .then((ctx) => {
          setParsedMap((prev) => ({ ...prev, [file.id]: ctx }))
        })
        .catch(() => {
          setParsedMap((prev) => ({
            ...prev,
            [file.id]: {
              id: file.id,
              filename: file.filename || "attached-file",
              mediaType: file.mediaType || "application/octet-stream",
              category: file.mediaType?.startsWith("image/") ? "image" : "other",
              dealershipDocType: file.mediaType?.startsWith("image/")
                ? "Vehicle Walkaround Photo"
                : "General Dealership Document",
              extractedText: `Attached file "${file.filename || "file"}" (${file.mediaType || "document"}).`,
              summary: "Attached to conversation context",
              metadata: {},
              parserEngine: "AutoPulse Context Fallback",
            },
          }))
        })
        .finally(() => {
          setParsingIds((prev) => {
            const copy = { ...prev }
            delete copy[file.id]
            return copy
          })
        })
    }
  }, [attachments.files, parsedMap, setParsedMap])

  if (attachments.files.length === 0) {
    return null
  }

  const expandedContext = expandedPreviewId ? parsedMap[expandedPreviewId] : null

  return (
    <PromptInputHeader className="border-b border-zinc-800/80 bg-zinc-950/90 px-3 py-2">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium text-sky-300">
            <Sparkles className="size-3 text-sky-400" />
            Attached Documents &amp; Images ({attachments.files.length}) &mdash; AI Context Active
          </span>
          <span className="font-mono text-[9px] text-zinc-500">
            unpdf &bull; mammoth.js &bull; PapaParse &bull; Vision
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {attachments.files.map((file) => {
            const parsed = parsedMap[file.id]
            const isParsing = Boolean(parsingIds[file.id])
            const isImage = Boolean(file.mediaType?.startsWith("image/"))
            const isExpanded = expandedPreviewId === file.id

            return (
              <div
                key={file.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-left transition hover:border-sky-500/40"
              >
                {isImage && file.url ? (
                  <img
                    src={file.url}
                    alt={file.filename || "Image"}
                    className="size-8 shrink-0 rounded-md border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-400">
                    <FileText className="size-4" />
                  </div>
                )}

                <div className="flex min-w-0 flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[150px] truncate text-xs font-semibold text-zinc-100">
                      {file.filename || "Attachment"}
                    </span>
                    {isParsing ? (
                      <Loader2 className="size-3 shrink-0 animate-spin text-sky-400" />
                    ) : (
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-400" />
                    )}
                  </div>
                  <span className="max-w-[210px] truncate text-[10px] text-zinc-400">
                    {isParsing
                      ? "Extracting AI context..."
                      : parsed
                        ? `${parsed.dealershipDocType} · ${parsed.summary}`
                        : "Context ready"}
                  </span>
                </div>

                {parsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPreviewId(isExpanded ? null : file.id)
                    }
                    title="Inspect extracted AI context"
                    className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-sky-300 cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => attachments.remove(file.id)}
                  title="Remove attachment"
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        {expandedContext && (
          <div className="rounded-lg border border-sky-500/30 bg-zinc-900/95 p-2.5 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-sky-300">
                Extracted AI Context: {expandedContext.filename}
              </span>
              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-300">
                {expandedContext.parserEngine}
              </Badge>
            </div>
            <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-zinc-300">
              {expandedContext.extractedText.slice(0, 700)}
              {expandedContext.extractedText.length > 700 ? "..." : ""}
            </pre>
          </div>
        )}
      </div>
    </PromptInputHeader>
  )
}

export function PromptInputAttachMenuButton() {
  const attachments = usePromptInputAttachments()

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => attachments.openFileDialog()}
        title="Attach PDF, Word (.docx), CSV Stock Sheet, FICA Docs, or Car Photos"
        className="h-8 gap-1.5 border border-sky-500/35 bg-sky-500/15 px-2.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 hover:text-white cursor-pointer"
      >
        <Paperclip className="size-3.5 text-sky-400" />
        <span>Attach Doc / PDF</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => attachments.openFileDialog()}
        title="Upload Car Walkaround Photos, NaTIS Disc, or SA Smart ID Photo"
        className="h-8 gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 hover:text-white cursor-pointer"
      >
        <Camera className="size-3.5 text-emerald-400" />
        <span>Add Photo</span>
      </Button>
    </div>
  )
}

