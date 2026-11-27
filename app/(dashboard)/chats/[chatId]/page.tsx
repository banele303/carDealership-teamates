"use client"

import { use, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useQuery, useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import { DesktopPanel, DesktopPanelProvider } from "@/components/desktop-panel"
import { Button } from "@/components/ui/button"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChatPageSkeleton } from "@/components/ui/skeleton"

export default function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ chatId: string }>
  searchParams?: Promise<{ prompt?: string }>
}) {
  const router = useRouter()
  const { chatId } = use(params)
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined
  const initialPrompt = resolvedSearchParams?.prompt

  const data = useQuery(api.teammates.getChat, {
    chatId: chatId as Id<"teammate_chats">,
  })
  const workspace = useQuery(
    api.teammates.listWorkspace,
    data === null ? {} : "skip"
  )
  const ensureFleetMut = useMutation(api.teammates.ensureWorkspaceFleet)

  useEffect(() => {
    if (data) {
      const hasMaster = data.allUserBots?.some(
        (b) => b.isMaster || b.name.toLowerCase().includes("dealership hq")
      )
      const hasEmail = data.allUserBots?.some((b) =>
        b.name.toLowerCase().includes("email")
      )
      const hasSocial = data.allUserBots?.some((b) =>
        b.name.toLowerCase().includes("social")
      )
      const hasWhatsApp = data.allUserBots?.some((b) =>
        b.name.toLowerCase().includes("whatsapp")
      )
      if (
        !hasMaster ||
        !hasEmail ||
        !hasSocial ||
        !hasWhatsApp ||
        (data.allUserBots?.length ?? 0) < 7
      ) {
        ensureFleetMut({}).catch(() => {})
      }
    }
  }, [data, ensureFleetMut])

  // If this chatId was one of the pruned duplicate chats, auto-redirect to AutoPulse Dealership HQ chat!
  useEffect(() => {
    if (data === null && workspace?.chats && workspace.chats.length > 0) {
      const masterChat =
        workspace.chats.find((c) => c.isMasterChat) ?? workspace.chats[0]
      if (masterChat) {
        router.replace(`/chats/${masterChat.id}`)
      }
    }
  }, [data, workspace, router])

  if (data === undefined) {
    return <ChatPageSkeleton />
  }

  if (data === null) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Redirecting to your active AutoPulse Dealership HQ workspace...
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" className="cursor-pointer" />}
        >
          <ArrowLeft data-icon="inline-start" /> Return to Dealership HQ
        </Button>
      </div>
    )
  }

  const { chat, bots, allUserBots } = data

  if (chat.kind === "group") {
    return (
      <div className="flex h-svh flex-col">
        <ChatHeader chat={chat} bots={allUserBots} />
        <Chat chatId={chat.id} bots={bots} initialPrompt={initialPrompt} />
      </div>
    )
  }

  return (
    <DesktopPanelProvider key={chat.id} chatId={chat.id}>
      <div className="h-svh overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="chat" minSize="38%">
            <div className="flex h-full min-w-0 flex-col">
              <ChatHeader chat={chat} />
              <Chat chatId={chat.id} bots={bots} initialPrompt={initialPrompt} />
            </div>
          </ResizablePanel>
          <DesktopPanel
            name={bots[0]?.name ?? "Bot"}
            job={bots[0]?.job}
            instructions={bots[0]?.instructions}
          />
        </ResizablePanelGroup>
      </div>
    </DesktopPanelProvider>
  )
}
