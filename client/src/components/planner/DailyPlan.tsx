import { useEffect, useRef, useState } from "react"
import {
  ArrowLeftRight,
  CalendarCheck,
  ChartLine,
  Clock,
  Info,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useApp } from "@/context/AppContext"
import { useFamilyProfile } from "@/hooks/useFamilyProfile"
import { createDailyPlan } from "@/services/aiService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AiResult, DailyPlan as DailyPlanData, PlanSlot } from "@/types/assistant"
import type { RoutineActivity } from "@/types/family"
import { formatDataTime } from "@/utils/formatters"

const STORAGE_KEY = "breathewise.plan"

interface StoredPlan {
  signature: string
  activities: RoutineActivity[]
  result: AiResult<DailyPlanData>
}

function loadPlan(): StoredPlan | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPlan
    return Array.isArray(parsed.result?.data?.slots) && Array.isArray(parsed.activities) ? parsed : null
  } catch {
    return null
  }
}

function savePlan(plan: StoredPlan) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {
    /* storage unavailable: the plan just won't survive navigation */
  }
}

const RISK: Record<PlanSlot["risk"], { label: string; chip: string }> = {
  low: { label: "Low exposure risk", chip: "bg-aqi-good/15" },
  moderate: { label: "Moderate risk", chip: "bg-aqi-sensitive/20" },
  high: { label: "High risk", chip: "bg-aqi-unhealthy/15" },
}

function Detail({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function SlotCard({ slot, planned }: { slot: PlanSlot; planned?: RoutineActivity }) {
  const risk = RISK[slot.risk]

  return (
    <li className="space-y-4 rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{slot.activity}</h3>
          {planned && (
            <p className="text-xs text-muted-foreground">
              You planned {planned.startTime} for {planned.durationMinutes} min
              {planned.flexible ? "" : " (fixed time)"}
            </p>
          )}
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", risk.chip)}>{risk.label}</span>
      </div>

      <p className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
        <Clock className="size-4 shrink-0" />
        <span>
          <span className="font-medium">Suggested time:</span> {slot.suggestedTime}
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Detail icon={Lightbulb} title="Why this time" text={slot.reasoning} />
        <Detail icon={ChartLine} title="Forecast" text={slot.forecastNote} />
        <Detail icon={ArrowLeftRight} title="Lower-exposure alternative" text={slot.alternative} />
        <Detail icon={ShieldCheck} title="Precaution" text={slot.precaution} />
      </div>
    </li>
  )
}

export function DailyPlan({ activities }: { activities: RoutineActivity[] }) {
  const { location } = useApp()
  const { profile } = useFamilyProfile()
  const [plan, setPlan] = useState<StoredPlan | null>(loadPlan)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  // Chronological order reads best, and it keeps the plan in step with the routine
  const ordered = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const signature = JSON.stringify({
    place: [location.latitude.toFixed(2), location.longitude.toFixed(2)],
    members: profile.members.map((m) => [m.ageGroup, m.sensitive]),
    activities: ordered.map((a) => [a.type, a.label.trim(), a.startTime, a.durationMinutes, a.flexible]),
  })
  const stale = plan !== null && plan.signature !== signature

  async function generate() {
    if (pending || ordered.length === 0) return
    setError(null)
    setPending(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await createDailyPlan(location, profile, ordered, controller.signal)
      const stored: StoredPlan = { signature, activities: ordered, result }
      setPlan(stored)
      savePlan(stored)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  const data = plan?.result.data
  const meta = plan?.result.meta

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="size-5 text-primary" />
            Today&apos;s plan
          </CardTitle>
          <CardDescription>
            Times are local to {location.timezone ?? "the selected city"}, matching the forecast.
          </CardDescription>
        </div>
        <Button onClick={() => void generate()} disabled={pending || ordered.length === 0}>
          <Sparkles className="size-4" />
          {plan ? "Update plan" : "Create plan"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {ordered.length === 0 && !plan && (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Add at least one activity above, then create your plan.
          </p>
        )}

        {pending && (
          <div className="space-y-3" role="status" aria-label="Creating your plan">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <p className="text-xs text-muted-foreground">Planning around the hourly forecast…</p>
          </div>
        )}

        {error && !pending && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
              {error}
            </span>
            <Button variant="outline" size="sm" onClick={() => void generate()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}

        {data && meta && !pending && (
          <>
            {stale && (
              <p className="flex items-center gap-2 rounded-lg bg-aqi-sensitive/15 px-3 py-2 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-aqi-sensitive" />
                Your routine, household or city changed since this plan was made. Press &ldquo;Update plan&rdquo;.
              </p>
            )}

            <p className="text-sm leading-relaxed">{data.summary}</p>

            <ul className={cn("space-y-3", stale && "opacity-60")}>
              {data.slots.map((slot, i) => (
                <SlotCard
                  key={i}
                  slot={slot}
                  planned={data.slots.length === plan.activities.length ? plan.activities[i] : undefined}
                />
              ))}
            </ul>

            {data.dataNotes.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {data.dataNotes.map((note, i) => (
                  <li key={i} className="flex gap-2">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="border-t pt-3 text-xs text-muted-foreground">
              AI-generated from model data for {meta.locationLabel}, {formatDataTime(meta.dataTime)} (local time),
              created at{" "}
              {new Date(meta.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}. General
              guidance, not medical advice.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}