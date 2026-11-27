import { useEffect, useRef, useState } from "react"
import { Info, RefreshCw, TriangleAlert } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { useIndoorAssessment } from "@/hooks/useIndoorAssessment"
import { getIndoorAdvice } from "@/services/aiService"
import { IndoorAssessment } from "@/components/indoor/IndoorAssessment"
import { IndoorRecommendations } from "@/components/indoor/IndoorRecommendations"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AiResult, IndoorAdvice } from "@/types/assistant"

const STORAGE_KEY = "breathewise.indoorPlan"

interface StoredPlan {
  signature: string
  result: AiResult<IndoorAdvice>
  checked: number[]
}

function loadPlan(): StoredPlan | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPlan
    return Array.isArray(parsed.result?.data?.checklist) && Array.isArray(parsed.checked) ? parsed : null
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

export default function IndoorAir() {
  const { location } = useApp()
  const { assessment, setAssessment } = useIndoorAssessment()
  const [plan, setPlan] = useState<StoredPlan | null>(loadPlan)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const signature = JSON.stringify({
    place: [location.latitude.toFixed(2), location.longitude.toFixed(2)],
    assessment: { ...assessment, indoorSources: [...assessment.indoorSources].sort() },
  })
  const stale = plan !== null && plan.signature !== signature

  async function generate() {
    if (pending) return
    setError(null)
    setPending(true)
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await getIndoorAdvice(location, assessment, controller.signal)
      const stored: StoredPlan = { signature, result, checked: [] }
      setPlan(stored)
      savePlan(stored)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function toggleChecked(index: number) {
    if (!plan) return
    const checked = plan.checked.includes(index) ? plan.checked.filter((i) => i !== index) : [...plan.checked, index]
    const next = { ...plan, checked }
    setPlan(next)
    savePlan(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Indoor Air Advisor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practical steps for cleaner air at home, timed around the air outside.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        This advisor works from your answers and today&apos;s outdoor air data. It does not measure indoor air quality,
        which needs an indoor sensor.
      </p>

      <IndoorAssessment
        value={assessment}
        onChange={setAssessment}
        onSubmit={() => void generate()}
        pending={pending}
        hasPlan={plan !== null}
      />

      <div ref={resultsRef} className="scroll-mt-20 space-y-4">
        {pending && (
          <div className="space-y-3" role="status" aria-label="Creating your indoor air plan">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <p className="text-xs text-muted-foreground">Checking the outdoor forecast and your answers…</p>
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

        {plan && !pending && (
          <>
            {stale && (
              <p className="flex items-center gap-2 rounded-lg bg-aqi-sensitive/15 px-3 py-2 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-aqi-sensitive" />
                Your answers or city changed since this plan was made. Press &ldquo;Update my indoor air plan&rdquo;.
              </p>
            )}
            <IndoorRecommendations result={plan.result} checked={plan.checked} onToggle={toggleChecked} stale={stale} />
          </>
        )}
      </div>
    </div>
  )
}