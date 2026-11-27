import { Info, Lightbulb, MapPin, RefreshCw, TriangleAlert, Undo2 } from "lucide-react"
import type { AirQualityState } from "@/hooks/useAirQuality"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AirQualityForecast, AqiStandard, CurrentAirQuality, HourlyPoint } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getGuidelineLevel } from "@/utils/aqiUtils"
import { formatConcentration, formatDataTime, formatDayHour } from "@/utils/formatters"

function valueOf(h: HourlyPoint, standard: AqiStandard): number | null {
  return standard === "us" ? h.usAqi : h.europeanAqi
}

// Plain observations derived from the numbers. No AI, so nothing here can be invented.
function buildInsights(current: CurrentAirQuality, forecast: AirQualityForecast, standard: AqiStandard): string[] {
  const insights: string[] = []
  const name = current.standards[standard].name

  const worst = current.pollutants
    .filter((p) => p.ratioToGuideline !== null)
    .sort((a, b) => (b.ratioToGuideline ?? 0) - (a.ratioToGuideline ?? 0))[0]
  if (worst && worst.ratioToGuideline !== null) {
    insights.push(
      worst.ratioToGuideline > 1
        ? `${worst.label} is furthest above its WHO guideline, at ${worst.ratioToGuideline.toLocaleString(undefined, { maximumFractionDigits: 1 })}× the guideline level.`
        : "Every reported pollutant is within its WHO guideline level right now."
    )
  }

  const nowIndex = forecast.hourly.map((h) => h.isForecast).lastIndexOf(false)
  if (nowIndex < 0) return insights

  const next24 = forecast.hourly
    .slice(nowIndex, nowIndex + 25)
    .map((h) => ({ time: h.time, value: valueOf(h, standard) }))
    .filter((p): p is { time: string; value: number } => p.value !== null)

  if (next24.length >= 6) {
    const low = next24.reduce((a, p) => (p.value < a.value ? p : a))
    const high = next24.reduce((a, p) => (p.value > a.value ? p : a))
    insights.push(
      `Over the next 24 hours the ${name} is forecast to range from ${low.value} (${formatDayHour(low.time)}) to ${high.value} (${formatDayHour(high.time)}).`
    )
  }

  const nowValue = valueOf(forecast.hourly[nowIndex], standard)
  const next6 = forecast.hourly
    .slice(nowIndex + 1, nowIndex + 7)
    .map((h) => valueOf(h, standard))
    .filter((v): v is number => v !== null)

  if (nowValue !== null && next6.length >= 3) {
    const average = Math.round(next6.reduce((a, b) => a + b, 0) / next6.length)
    const change = (average - nowValue) / Math.max(nowValue, 1)
    const trend = change <= -0.1 ? "improve" : change >= 0.1 ? "worsen" : "stay about the same"
    insights.push(`Air quality is forecast to ${trend} over the next 6 hours (${name} about ${average}, versus ${nowValue} now).`)
  }

  return insights
}

interface LocationPanelProps {
  title: string
  subtitle: string
  state: AirQualityState
  standard: AqiStandard
  isPin: boolean
  cityName: string
  onReset: () => void
  onUse: () => void
}

export function LocationPanel({ title, subtitle, state, standard, isPin, cityName, onReset, onUse }: LocationPanelProps) {
  const { current, forecast, loading, error, retry } = state
  const reading = current?.aqi[standard]
  const style = reading?.category ? AQI_LEVEL_STYLES[reading.category.level] : null

  return (
    <aside className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs lg:h-full lg:overflow-y-auto">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="size-5 shrink-0 text-primary" />
          <span className="truncate">{title}</span>
        </h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {isPin && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onUse}>
            Use as my location
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            <Undo2 className="size-4" />
            Back to {cityName}
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3" role="status" aria-label="Loading air quality">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      )}

      {current && forecast && !current.dataAvailable && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          The model has no air quality data for this exact spot (open water, for example). Try a point on land.
        </p>
      )}

      {current && forecast && current.dataAvailable && reading && (
        <>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl border",
                style ? [style.soft, style.border] : "bg-muted"
              )}
            >
              <span className="font-heading text-3xl font-bold leading-none tabular-nums">{reading.value ?? "—"}</span>
              <span className="mt-1 text-[11px] text-muted-foreground">{current.standards[standard].name}</span>
            </div>
            {reading.category && style && (
              <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold", style.soft)}>
                <span className={cn("size-2 rounded-full", style.dot)} />
                {reading.category.label}
              </span>
            )}
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Pollutants</h3>
            <ul className="divide-y text-sm">
              {current.pollutants.map((p) => {
                const level = p.ratioToGuideline !== null ? AQI_LEVEL_STYLES[getGuidelineLevel(p.ratioToGuideline)] : null
                return (
                  <li key={p.key} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", level ? level.dot : "bg-muted")} />
                      {p.label}
                    </span>
                    <span className="tabular-nums">
                      {formatConcentration(p.value)} <span className="text-xs text-muted-foreground">{p.value === null ? "" : p.unit}</span>
                      {p.ratioToGuideline !== null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {p.ratioToGuideline.toLocaleString(undefined, { maximumFractionDigits: 1 })}× WHO
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {buildInsights(current, forecast, standard).length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-primary" />
                What the data says
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed">
                {buildInsights(current, forecast, standard).map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Model data for {formatDataTime(current.dataTime)} (local time, {current.location.timezone}).
          </p>
        </>
      )}

      <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Values come from an atmospheric model with grid cells roughly 10 to 40 km wide, so nearby points often share the
        same numbers. This is not street-level data, which is why the map shows no heatmap.
      </p>
    </aside>
  )
}