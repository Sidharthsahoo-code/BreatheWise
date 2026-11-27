import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bus,
  Clock,
  HeartPulse,
  House,
  Info,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Trees,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useApp } from "@/context/AppContext"
import { useFamilyProfile } from "@/hooks/useFamilyProfile"
import { getRecommendations } from "@/services/aiService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AiResult, Priority, RecommendationItem, Recommendations } from "@/types/assistant"
import { formatDataTime } from "@/utils/formatters"

const CACHE_KEY = "breathewise.recommendations"
const CACHE_TTL_MS = 30 * 60 * 1000

type Result = AiResult<Recommendations>

interface CacheEntry {
  key: string
  savedAt: number
  result: Result
}

function readCache(key: string): Result | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.key !== key || Date.now() - entry.savedAt > CACHE_TTL_MS) return null
    return entry.result
  } catch {
    return null
  }
}

function writeCache(key: string, result: Result) {
  try {
    const entry: CacheEntry = { key, savedAt: Date.now(), result }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* storage unavailable: results just won't be cached */
  }
}

interface Outcome {
  key: string
  result?: Result
  error?: string
}

function useRecommendations() {
  const { location } = useApp()
  const { profile } = useFamilyProfile()
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const signature = JSON.stringify(profile.members.map((m) => [m.ageGroup, m.sensitive]))
  const cacheKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}|${signature}`
  const requestKey = `${cacheKey}|${attempt}`

  // The first load of a mount can use the cache. A manual refresh always asks again.
  const cached = attempt === 0 ? readCache(cacheKey) : null
  const hasCache = cached !== null

  useEffect(() => {
    if (hasCache) return
    const controller = new AbortController()

    getRecommendations(location, profile, controller.signal)
      .then((result) => {
        writeCache(cacheKey, result)
        setOutcome({ key: requestKey, result })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setOutcome({ key: requestKey, error: err instanceof Error ? err.message : "Something went wrong." })
      })

    return () => controller.abort()
  }, [hasCache, location, profile, cacheKey, requestKey])

  const settled = outcome && outcome.key === requestKey ? outcome : null
  const result = cached ?? settled?.result ?? null
  const error = result ? null : (settled?.error ?? null)

  return {
    result,
    error,
    loading: !result && !error,
    memberCount: profile.members.length,
    refresh: () => setAttempt((n) => n + 1),
  }
}

const PRIORITY: Record<Priority, { label: string; bar: string; chip: string }> = {
  high: { label: "High priority", bar: "border-l-aqi-unhealthy", chip: "bg-aqi-unhealthy/15" },
  medium: { label: "Medium", bar: "border-l-aqi-sensitive", chip: "bg-aqi-sensitive/20" },
  low: { label: "Low", bar: "border-l-aqi-good", chip: "bg-aqi-good/15" },
}

const CATEGORY_ICON: Record<RecommendationItem["category"], LucideIcon> = {
  outdoor: Trees,
  indoor: House,
  health: HeartPulse,
  commute: Bus,
  general: Lightbulb,
}

function RecommendationRow({ item }: { item: RecommendationItem }) {
  const priority = PRIORITY[item.priority]
  const Icon = CATEGORY_ICON[item.category]

  return (
    <li className={cn("flex gap-3 rounded-xl border border-l-4 bg-background p-3.5", priority.bar)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", priority.chip)}>{priority.label}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
      </div>
    </li>
  )
}

export function RecommendationCard() {
  const { result, error, loading, memberCount, refresh } = useRecommendations()
  const data = result?.data

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Recommended for you
          </CardTitle>
          <CardDescription>
            {memberCount > 0 ? (
              `Tailored for your household of ${memberCount}`
            ) : (
              <>
                General advice.{" "}
                <Link to="/planner" className="font-medium text-primary hover:underline">
                  Add your family
                </Link>{" "}
                for tailored guidance.
              </>
            )}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} aria-label="Refresh recommendations">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-3" role="status" aria-label="Writing recommendations">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <p className="text-xs text-muted-foreground">Writing recommendations from the latest air data…</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
              {error}
            </span>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}

        {data && result && (
          <>
            <p className="text-sm leading-relaxed">{data.overview}</p>

            {data.bestTimeWindow && (
              <p className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                <Clock className="size-4 shrink-0" />
                <span>
                  <span className="font-medium">Best window for outdoor time:</span> {data.bestTimeWindow}
                </span>
              </p>
            )}

            <ul className="space-y-2.5">
              {data.items.map((item, i) => (
                <RecommendationRow key={i} item={item} />
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
              AI-generated from model data for {result.meta.locationLabel}, {formatDataTime(result.meta.dataTime)} (local
              time). General guidance, not medical advice.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}