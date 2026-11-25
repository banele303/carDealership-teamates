"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { formatDistanceToNowStrict } from "date-fns"
import {
  CarFront,
  ChevronDown,
  ChevronRight,
  Crown,
  Gauge,
  LayoutGrid,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  MessageSquarePlus,
  Pencil,
  Plus,
  Square,
  Users2,
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAgentRunner } from "@/components/agent-runner-provider"
import { AiTeammatesLogo } from "@/components/ai-teammates-logo"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { ChatMenuButton } from "@/components/chat-menu-button"
import { CreateMenu } from "@/components/create-menu"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { SearchCommand, SearchCommandItem } from "@/components/search-command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { toast } from "@/components/ui/toast"
import { SidebarChatListSkeleton } from "@/components/ui/skeleton"

type SidebarChat = {
  id: string
  kind: "direct" | "group"
  name: string
  isMasterChat?: boolean
  parentBotId?: string
  category?: string
  skills?: string[]
  bots: { id: string; name: string; avatar: string; job?: string; isMaster?: boolean }[]
  lastMessagePreview?: string
  lastMessageAt: number
}

function SidebarChatAvatar({ chat }: { chat: SidebarChat }) {
  return chat.kind === "group" ? (
    <GroupChatAvatar seeds={chat.bots.map((bot) => bot.avatar)} />
  ) : (
    <ChatAvatar seed={chat.bots[0]?.avatar ?? "default"} />
  )
}

export function AppSidebar() {
  const router = useRouter()
  const params = useParams<{ chatId?: string }>()
  const runner = useAgentRunner()
  const data = useQuery(api.teammates.listWorkspace, {})
  const chats = (data?.chats ?? []) as SidebarChat[]
  const bots = (data?.bots ?? []) as {
    id: string
    name: string
    avatar: string
    job?: string
    isMaster?: boolean
    parentBotId?: string
  }[]

  const [subAgentsExpanded, setSubAgentsExpanded] = React.useState(true)
  const [addSpecialistOpen, setAddSpecialistOpen] = React.useState(false)

  const createDirectChatMut = useMutation(api.teammates.createDirectChat)
  const clearChatMut = useMutation(api.teammates.clearChatMessages)
  const deleteChatMut = useMutation(api.teammates.deleteChat)
  const deleteBotMut = useMutation(api.teammates.deleteBot)
  const ensureFleetMut = useMutation(api.teammates.ensureWorkspaceFleet)
  const seedVehiclesMut = useMutation(api.vehicles.seedDealershipData)
  const fleetEnsuredRef = React.useRef(false)

  React.useEffect(() => {
    if (data && !fleetEnsuredRef.current) {
      const hasMaster = bots.some(
        (b) => b.isMaster || b.name.toLowerCase().includes("dealership hq")
      )
      const hasPublisher = bots.some((b) =>
        b.name.toLowerCase().includes("portal publisher")
      )
      const hasFinance = bots.some((b) =>
        b.name.toLowerCase().includes("finance")
      )
      const hasFollowUp = bots.some((b) =>
        b.name.toLowerCase().includes("follow-up")
      )
      if (!hasMaster || !hasPublisher || !hasFinance || !hasFollowUp) {
        fleetEnsuredRef.current = true
        ensureFleetMut({}).catch(() => {})
        seedVehiclesMut({}).catch(() => {})
      }
    }
  }, [data, bots, ensureFleetMut, seedVehiclesMut])

  // Split chats into: 1) Master HQ (One Agent), 2) Specialist Sub-Agents under Master HQ (deduplicated per bot), 3) Team Group Rooms
  const masterChat = chats.find(
    (c) =>
      c.kind === "direct" &&
      (c.isMasterChat || c.name.toLowerCase().includes("dealership hq"))
  )
  const seenSpecialistBotIds = new Set<string>()
  const specialistChats = chats.filter((c) => {
    if (c.kind !== "direct" || c.id === masterChat?.id) return false
    const primaryBotId = c.bots[0]?.id
    if (primaryBotId) {
      if (seenSpecialistBotIds.has(primaryBotId)) return false
      seenSpecialistBotIds.add(primaryBotId)
    }
    return true
  })
  const groupChats = chats.filter((c) => c.kind === "group")

  const handleCreateNewChat = async (botId: string, botName: string) => {
    try {
      const res = await createDirectChatMut({
        botId: botId as Id<"teammate_bots">,
      })
      toast.add({
        type: "success",
        title: "New workspace opened",
        description: `Started fresh session with ${botName}.`,
      })
      router.push(`/chats/${res.chatId}`)
    } catch (err) {
      toast.add({
        type: "error",
        title: "Failed to create chat",
        description: err instanceof Error ? err.message : "Error creating chat",
      })
    }
  }

  const handleClearChat = async (chatId: string) => {
    if (!confirm("Clear all messages in this conversation?")) return
    try {
      await clearChatMut({ chatId: chatId as Id<"teammate_chats"> })
      toast.add({ type: "success", title: "Chat cleared" })
    } catch (err) {
      toast.add({
        type: "error",
        title: "Failed to clear chat",
        description: err instanceof Error ? err.message : "Error clearing chat",
      })
    }
  }

  const handleDeleteChat = async (chat: SidebarChat) => {
    const isDirect = chat.kind === "direct" && chat.bots[0]
    if (
      !confirm(
        isDirect
          ? `Are you sure you want to permanently remove "${chat.name}"?`
          : "Are you sure you want to permanently delete this chat?"
      )
    )
      return
    try {
      if (isDirect && chat.bots[0]) {
        await deleteBotMut({ botId: chat.bots[0].id as Id<"teammate_bots"> })
        toast.add({ type: "success", title: `Removed ${chat.name}` })
      } else {
        await deleteChatMut({ chatId: chat.id as Id<"teammate_chats"> })
        toast.add({ type: "success", title: "Chat deleted" })
      }
      if (params.chatId === chat.id) {
        router.push("/")
      }
    } catch (err) {
      toast.add({
        type: "error",
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Error deleting agent/chat",
      })
    }
  }

  const renderChatRow = (chat: SidebarChat, isNested = false) => {
    const run = runner.getRun(chat.id)
    const isWorking = runner.isWorking(chat.id)

    return (
      <SidebarMenuItem
        key={chat.id}
        className={isNested ? "pl-3 border-l border-zinc-800/80 ml-3" : ""}
      >
        <ChatMenuButton chatId={chat.id} tooltip={chat.name}>
          <SidebarChatAvatar chat={chat} />
          <div className="grid flex-1 text-left leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="truncate font-medium text-[13px]">{chat.name}</span>
              {isWorking ? (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Working
                </span>
              ) : (
                <time
                  dateTime={new Date(chat.lastMessageAt).toISOString()}
                  className="ml-auto shrink-0 text-[10px] text-muted-foreground"
                >
                  {formatDistanceToNowStrict(new Date(chat.lastMessageAt))}
                </time>
              )}
            </div>
            {isWorking ? (
              <span className="truncate text-[11px] text-emerald-400/90 italic animate-pulse">
                {run.streamingText ? run.streamingText.slice(-45) : "Executing skill..."}
              </span>
            ) : chat.lastMessagePreview ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {chat.lastMessagePreview}
              </span>
            ) : null}
          </div>
        </ChatMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction showOnHover className="cursor-pointer">
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">Options</span>
              </SidebarMenuAction>
            }
          />
          <DropdownMenuContent side="right" align="start" className="w-48">
            {chat.kind === "direct" && chat.bots[0] && (
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => handleCreateNewChat(chat.bots[0].id, chat.name)}
              >
                <MessageSquarePlus className="size-4 text-sky-400" />
                <span>New Chat</span>
              </DropdownMenuItem>
            )}
            {chat.kind === "direct" && chat.bots[0] && (
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-zinc-300"
                onClick={() =>
                  runner.openRenameModal({
                    id: chat.bots[0].id,
                    name: chat.name,
                    job: chat.bots[0].job,
                  })
                }
              >
                <Pencil className="size-4 text-sky-400" />
                <span>Rename Agent</span>
              </DropdownMenuItem>
            )}
            {isWorking && (
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-amber-400"
                onClick={() => runner.stopTurn(chat.id)}
              >
                <Square className="size-4 text-amber-400" />
                <span>Stop Working</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-zinc-300"
              onClick={() => handleClearChat(chat.id)}
            >
              <RotateCcw className="size-4 text-amber-400" />
              <span>Clear Messages</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
              onClick={() => handleDeleteChat(chat)}
            >
              <Trash2 className="size-4" />
              <span>{chat.kind === "direct" ? "Remove Agent" : "Delete Chat"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-lg p-0.5 transition-colors hover:opacity-95"
          >
            <AiTeammatesLogo size={32} />
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  AutoPulse Motors
                </span>
                <span className="inline-flex items-center rounded bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-mono font-medium text-sky-400 border border-sky-500/20">
                  ZA
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                Car Dealership AI
              </span>
            </div>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
            <CreateMenu bots={bots} />
          </div>
        </div>
        <SearchCommand>
          {chats.map((chat) => (
            <SearchCommandItem
              key={chat.id}
              href={`/chats/${chat.id}`}
              value={chat.id}
              keywords={[chat.name]}
            >
              <SidebarChatAvatar chat={chat} />
              <span className="truncate">{chat.name}</span>
            </SearchCommandItem>
          ))}
        </SearchCommand>

        {/* Prominent AutoPulse CRM Button right at top of sidebar */}
        <div className="px-2 pt-1 group-data-[collapsible=icon]:px-0">
          <SidebarMenuButton
            render={<Link href="/dashboard/crm" />}
            tooltip="Open AutoPulse CRM & Deal Pipeline"
            className="h-auto p-0 cursor-pointer overflow-hidden rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-zinc-900/60 hover:from-emerald-500/25 hover:border-emerald-500/55 text-zinc-100 hover:text-white transition-all shadow-sm group"
          >
            <div className="flex w-full items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <LayoutGrid className="size-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-tight text-zinc-100">
                    AutoPulse CRM
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Pipeline &amp; Deals
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>CRM</span>
              </div>
            </div>
          </SidebarMenuButton>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-auto">
        {data === undefined ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarChatListSkeleton count={7} />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* 1. UNIFIED MASTER AGENT (ONE AGENT HQ) + SPECIALISTS UNDER IT */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between text-[10px] uppercase tracking-wider text-sky-400/90">
                <span className="flex items-center gap-1.5">
                  <Crown className="size-3" />
                  Unified Master Agent
                </span>
                <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                  {specialistChats.length + (masterChat ? 1 : 0)} Live
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {masterChat && (
                    <div className="mb-1 rounded-xl border border-sky-500/25 bg-sky-500/5 p-0.5">
                      {renderChatRow(masterChat, false)}
                    </div>
                  )}

                  {/* Collapsible Specialist Sub-Agents under Master HQ */}
                  <div className="mt-1 flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:hidden">
                    <button
                      type="button"
                      onClick={() => setSubAgentsExpanded((p) => !p)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {subAgentsExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                      <span>
                        Independent Specialists ({specialistChats.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      title="Add specialist under Master HQ"
                      onClick={() => setAddSpecialistOpen(true)}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-sky-400 hover:bg-sky-500/15 cursor-pointer"
                    >
                      <Plus className="size-2.5" />
                      Add
                    </button>
                  </div>

                  {subAgentsExpanded &&
                    specialistChats.map((chat) => renderChatRow(chat, true))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 2. DEALERSHIP TEAM WAR ROOMS */}
            {groupChats.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                  <Users2 className="size-3" />
                  Dealership War Rooms
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupChats.map((chat) => renderChatRow(chat, false))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard/crm" />}
              tooltip="Open AutoPulse CRM & Deal Pipeline"
              className="h-auto p-0 cursor-pointer overflow-hidden rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-zinc-900/80 to-zinc-900/40 hover:from-emerald-500/25 hover:border-emerald-500/55 text-zinc-100 hover:text-white transition-all shadow-sm group"
            >
              <div className="flex w-full items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <LayoutGrid className="size-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold tracking-tight text-zinc-100">
                      AutoPulse CRM
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Leads, Deals &amp; SA Finance
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>CRM</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/showroom" />}
              tooltip="Open Live Website Showroom (/showroom)"
              className="h-auto p-0 cursor-pointer overflow-hidden rounded-xl border border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-zinc-900/80 to-zinc-900/40 hover:from-sky-500/20 hover:border-sky-500/45 text-zinc-100 hover:text-white transition-all shadow-sm group"
            >
              <div className="flex w-full items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                    <CarFront className="size-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold tracking-tight text-zinc-100">
                      Own Website
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Live /showroom
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[9px] font-mono text-sky-300">
                  Public
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <BotDialog open={addSpecialistOpen} onOpenChange={setAddSpecialistOpen} />
      <SidebarRail />
    </Sidebar>
  )
}
