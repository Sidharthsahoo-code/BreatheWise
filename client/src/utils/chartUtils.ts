import type { HourlyPoint } from "@/types/airQuality"

export interface ChartPoint {
  time: string
  value: number | null
  past: number | null
  forecast: number | null
  isForecast: boolean
}

export const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" }

export function formatTickDay(localIso: string): string {
  return new Date(localIso).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })
}

// Fewer, wider-spaced ticks for longer ranges so labels never collide
export function tickStep(length: number): number {
  if (length <= 80) return 12
  if (length <= 170) return 24
  return 48
}

// Splits one series into a solid "past" line and a dashed "forecast" line that join at the current hour
export function buildTrendSeries(
  hourly: HourlyPoint[],
  getValue: (h: HourlyPoint) => number | null,
  historyHours: number
) {
  const nowIndex = hourly.map((h) => h.isForecast).lastIndexOf(false)
  const start = Math.max(0, nowIndex - historyHours)

  const points: ChartPoint[] = hourly.slice(start).map((h, i) => {
    const value = getValue(h)
    return {
      time: h.time,
      value,
      isForecast: h.isForecast,
      past: h.isForecast ? null : value,
      forecast: h.isForecast || start + i === nowIndex ? value : null,
    }
  })

  return { points, nowTime: nowIndex >= 0 ? hourly[nowIndex].time : null }
}