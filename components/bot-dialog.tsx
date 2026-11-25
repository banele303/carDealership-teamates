"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Crown, ShuffleIcon, Sparkles, Trash2Icon } from "lucide-react"
import { nanoid } from "nanoid"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { botInsertSchema } from "@/db/schema"
import { DEALERSHIP_SKILLS } from "@/lib/sa-dealership"
import { cn } from "@/lib/utils"

export type TeammateBotRecord = {
  id: string
  name: string
  avatar: string
  job: string
  instructions?: string | null
  parentBotId?: string
  isMaster?: boolean
  skills?: string[]
  category?: string
}

const DEALERSHIP_PRESETS = [
  {
    name: "Portal Publisher Pro",
    job: "Multi-Portal Car Publisher (Cars.co.za, AutoTrader SA & Website)",
    skills: ["multi_publish", "cloud_desktop", "social_reel_studio"],
    instructions:
      "Take any showroom vehicle, write SEO-ready South African ad copy highlighting FSH, DEKRA report & monthly finance in ZAR, and publish simultaneously to Cars.co.za DAP, AutoTrader SA, Own Website (/showroom), and Facebook Marketplace.",
  },
  {
    name: "F&I Bank Closer",
    job: "SA Multi-Bank Vehicle Finance & Signio Auto-Applier",
    skills: ["finance_auto_apply", "vehicle_quote_pdf", "whatsapp_followup"],
    instructions:
      "Calculate NCA monthly instalments (deposit + balloon/residual), validate 13-digit SA ID & 5 FICA documents, cross-sell Extended Warranty & Tracker VAPs, and auto-submit dossiers to WesBank, Absa, MFC (Nedbank), Standard Bank & Capitec.",
  },
  {
    name: "Test-Drive Concierge",
    job: "Showroom & Home Test-Drive Booking & 24h Follow-Up Agent",
    skills: ["test_drive_booking", "whatsapp_followup"],
    instructions:
      "Qualify inbound SA car buyers within 5 minutes, schedule Midrand/Sandton/Cape Town/Durban test drives, verify driver's licence ahead of arrival, and trigger 24h/48h/72h follow-ups.",
  },
  {
    name: "Trade-In & Auction Scout",
    job: "TransUnion Trade-In Appraiser & WeBuyCars Stock Buyer",
    skills: ["trade_in_valuation", "cloud_desktop"],
    instructions:
      "Decode 17-char VINs, estimate South African TransUnion trade/retail values, itemize DEKRA/COR & cosmetic recon costs, flag 45+ day aging stock, and scout fast-moving bakkies and SUVs.",
  },
  {
    name: "Fleet & Corporate Sales",
    job: "SA Commercial Bakkie & Corporate Fleet Deal Specialist",
    skills: ["vehicle_quote_pdf", "finance_auto_apply", "email_triage"],
    instructions:
      "Structure multi-unit Hilux, Ranger & commercial fleet tenders in ZAR with 15% VAT schedules, WesBank Fleet/Absa commercial finance, and CIPC/FICA corporate compliance.",
  },
  {
    name: "Delivery & DEKRA Coordinator",
    job: "eNaTIS Registration, Roadworthy & Handover Concierge",
    skills: ["whatsapp_followup", "email_triage"],
    instructions:
      "Coordinate DEKRA multi-point inspections, COR roadworthy certificates, eNaTIS change-of-ownership, Tracker fitment, Smash & Grab, and VIP showroom handover schedules.",
  },
]

function BotDeleteButton({
  bot,
  onDeleted,
}: {
  bot: TeammateBotRecord
  onDeleted: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteBotMut = useMutation(api.teammates.deleteBot)

  const onDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteBotMut({ botId: bot.id as Id<"teammate_bots"> })
      toast.add({ type: "success", title: `${bot.name} is deleted` })
      onDeleted()
      router.push("/")
    } catch {
      toast.add({
        type: "error",
        title: "Couldn't delete the agent",
        description: "Something went wrong. Try again.",
      })
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !isDeleting && setOpen(open)}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" className="sm:mr-auto cursor-pointer" />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the specialist agent and its direct chat. It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting && <Skeleton className="mr-2 size-4 rounded-full bg-white/70" />}
            Delete agent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function BotForm({
  bot,
  onSaved,
}: {
  bot?: TeammateBotRecord
  onSaved: () => void
}) {
  const router = useRouter()
  const createBotMut = useMutation(api.teammates.createBot)
  const updateBotMut = useMutation(api.teammates.updateBot)

  const [initialSeed] = useState(() => bot?.avatar ?? nanoid())
  const [underMaster, setUnderMaster] = useState<boolean>(
    bot ? Boolean(bot.parentBotId) || !bot.isMaster : true
  )
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    bot?.skills && bot.skills.length > 0
      ? bot.skills
      : ["multi_publish", "whatsapp_followup"]
  )

  const form = useForm({
    resolver: zodResolver(botInsertSchema),
    defaultValues: {
      name: bot?.name ?? "",
      avatar: initialSeed,
      job: bot?.job ?? "",
      instructions: bot?.instructions ?? "",
    },
  })
  const { isSubmitting } = form.formState

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (bot) {
        const updated = await updateBotMut({
          botId: bot.id as Id<"teammate_bots">,
          name: values.name,
          avatar: values.avatar ?? initialSeed,
          job: values.job,
          instructions: values.instructions || undefined,
          skills: selectedSkills,
          underMaster: bot.isMaster ? false : underMaster,
        })
        toast.add({ type: "success", title: `${updated.name} updated` })
        onSaved()
      } else {
        const created = await createBotMut({
          name: values.name,
          avatar: values.avatar ?? initialSeed,
          job: values.job,
          instructions: values.instructions || undefined,
          underMaster,
          skills: selectedSkills,
          category: "custom",
        })
        toast.add({
          type: "success",
          title: `${created.name} is live`,
          description: underMaster
            ? "Runs independently AND unified under AutoPulse Dealership HQ."
            : "Standalone specialist workspace ready.",
        })
        onSaved()
        router.push(`/chats/${created.chatId}`)
      }
    } catch {
      toast.add({
        type: "error",
        title: bot ? "Couldn't update the agent" : "Couldn't create the agent",
        description: "Something went wrong. Try again.",
      })
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
      {/* Dealership Quick Presets */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-muted-foreground">
          South African Dealership Templates
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEALERSHIP_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-[11px] cursor-pointer"
              onClick={() => {
                if (!form.getValues("name")) {
                  form.setValue("name", preset.name, { shouldDirty: true, shouldValidate: true })
                }
                form.setValue("job", preset.job, { shouldDirty: true, shouldValidate: true })
                form.setValue("instructions", preset.instructions, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                setSelectedSkills(preset.skills)
              }}
            >
              <Sparkles className="mr-1 size-3 text-sky-400" />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Keep Under Master Agent Toggle */}
      {!bot?.isMaster && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5">
          <div className="flex items-start gap-2.5">
            <Crown className="mt-0.5 size-4 shrink-0 text-sky-400" />
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Keep under AutoPulse Dealership HQ (One Agent)
              </div>
              <p className="text-[11px] text-zinc-400">
                Works independently in its own chat AND remains unified &amp; delegatable under your Master Agent.
              </p>
            </div>
          </div>
          <Switch checked={underMaster} onCheckedChange={setUnderMaster} />
        </div>
      )}

      <FieldGroup>
        <Controller
          name="avatar"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <ChatAvatar seed={field.value ?? initialSeed} className="size-10" />
              <FieldContent>
                <FieldTitle>Avatar</FieldTitle>
                <FieldDescription>Shuffle until you find a face you like.</FieldDescription>
              </FieldContent>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => field.onChange(nanoid())}
              >
                <ShuffleIcon data-icon="inline-start" />
                Shuffle
              </Button>
            </Field>
          )}
        />
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-name">Agent Name</FieldLabel>
              <Input
                {...field}
                id="bot-name"
                placeholder="e.g. Cape Town Sales Closer"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="job"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-job">Dealership Role</FieldLabel>
              <Input
                {...field}
                id="bot-job"
                placeholder="e.g. Multi-Portal Car Publisher & Finance Closer"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="instructions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-instructions">Instructions &amp; Playbook</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="bot-instructions"
                placeholder="Quote ZAR pricing with 15% VAT, check Cars.co.za & AutoTrader parity, and book showroom test drives..."
                className="min-h-20"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Dealership Custom Skills Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-200">
            Assigned Dealership Skills ({selectedSkills.length})
          </span>
          <span className="text-[10px] text-zinc-500">Grok-Bot Toolset</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DEALERSHIP_SKILLS.map((skill) => {
            const checked = selectedSkills.includes(skill.slug)
            return (
              <label
                key={skill.slug}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-xs transition",
                  checked
                    ? "border-sky-500/40 bg-sky-500/10 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleSkill(skill.slug)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{skill.shortLabel}</div>
                  <div className="line-clamp-1 text-[10px] text-zinc-400">
                    {skill.name}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <DialogFooter>
        {bot && !bot.isMaster && <BotDeleteButton bot={bot} onDeleted={onSaved} />}
        <DialogClose
          render={<Button type="button" variant="outline" className="cursor-pointer" />}
        >
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting && <Skeleton className="mr-2 size-4 rounded-full bg-white/70" />}
          {bot ? "Save agent" : "Add specialist agent"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function BotDialog({
  bot,
  trigger = <Button variant="secondary" className="cursor-pointer" />,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  bot?: TeammateBotRecord
  trigger?: React.ReactElement
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={trigger}>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {bot ? `Configure ${bot.name}` : "Add Dealership Specialist Agent"}
          </DialogTitle>
          <DialogDescription>
            {bot
              ? "Update its role, custom skills, or Master HQ link."
              : "Every new specialist works independently AND stays connected under AutoPulse Dealership HQ."}
          </DialogDescription>
        </DialogHeader>
        <BotForm bot={bot} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog }
