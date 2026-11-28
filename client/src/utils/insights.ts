import type { AqiStandard, HourlyPoint } from "@/types/airQuality"
import { formatDayHour } from "./formatters"

export type Metric = "aqi" | "pm2_5" | "pm10"

export function hourlyValue(h: HourlyPoint, metric: Metric, standard: AqiStandard): number | null {
  if (metric === "aqi") return standard === "us" ? h.usAqi : h.europeanAqi
  return h[metric]
}

const WHO_PM25_24H = 15

const numbers = (list: Array<number | null>) => list.filter((v): v is number => v !== null)

function mean(values: number[]): number | null {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

const round = (v: number | null, digits = 0) => (v === null ? null : Math.round(v * 10 ** digits) / 10 ** digits)

interface Extreme {
  time: string
  value: number
}

export interface DaySummary {
  date: string
  kind: "past" | "today" | "forecast"
  hours: number
  avg: number | null
  max: Extreme | null
  min: Extreme | null
  pm2_5Avg: number | null
  pm10Avg: number | null
}

export function summarizeDays(hourly: HourlyPoint[], standard: AqiStandard, today: string): DaySummary[] {
  const byDate = new Map<string, HourlyPoint[]>()
  for (const h of hourly) {
    const date = h.time.slice(0, 10)
    const list = byDate.get(date)
    if (list) list.push(h)
    else byDate.set(date, [h])
  }

  return [...byDate.entries()].map(([date, points]) => {
    const values = points
      .map((p) => ({ time: p.time, value: hourlyValue(p, "aqi", standard) }))
      .filter((p): p is Extreme => p.value !== null)

    const max = values.reduce<Extreme | null>((a, p) => (!a || p.value > a.value ? p : a), null)
    const min = values.reduce<Extreme | null>((a, p) => (!a || p.value < a.value ? p : a), null)

    return {
      date,
      kind: date < today ? "past" : date > today ? "forecast" : "today",
      hours: points.length,
      avg: round(mean(values.map((v) => v.value))),
      max,
      min,
      pm2_5Avg: round(mean(numbers(points.map((p) => p.pm2_5))), 1),
      pm10Avg: round(mean(numbers(points.map((p) => p.pm10))), 1),
    }
  })
}

const hourLabel = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`

// Plain observations calculated from the numbers. No AI, so nothing here can be invented.
export function buildInsights(
  hourly: HourlyPoint[],
  standard: AqiStandard,
  standardName: string,
  days: DaySummary[]
): string[] {
  const out: string[] = []
  const nowIndex = hourly.map((h) => h.isForecast).lastIndexOf(false)
  if (nowIndex < 0) return out

  const value = (h: HourlyPoint) => hourlyValue(h, "aqi", standard)

  // 1. The last 24 hours against the 24 hours before
  const recent = numbers(hourly.slice(Math.max(0, nowIndex - 23), nowIndex + 1).map(value))
  const before = numbers(hourly.slice(Math.max(0, nowIndex - 47), Math.max(0, nowIndex - 23)).map(value))
  if (recent.length >= 12 && before.length >= 12) {
    const a = Math.round(mean(recent) ?? 0)
    const b = Math.round(mean(before) ?? 0)
    const change = (a - b) / Math.max(b, 1)
    out.push(
      Math.abs(change) < 0.05
        ? `Over the last 24 hours the ${standardName} averaged ${a}, about the same as the 24 hours before (${b}).`
        : `Over the last 24 hours the ${standardName} averaged ${a}, ${Math.round(Math.abs(change) * 100)}% ${change > 0 ? "higher" : "lower"} than the 24 hours before (${b}).`
    )
  }

  // 2. Typical daily pattern over the past days
  const past = hourly.filter((h) => !h.isForecast)
  if (past.length >= 48) {
    const byHour = new Map<number, number[]>()
    for (const h of past) {
      const v = value(h)
      if (v === null) continue
      const hour = Number(h.time.slice(11, 13))
      byHour.set(hour, [...(byHour.get(hour) ?? []), v])
    }
    const averages = [...byHour.entries()].map(([hour, vs]) => ({ hour, value: Math.round(mean(vs) ?? 0) }))

    if (averages.length >= 12) {
      const cleanest = averages.reduce((a, p) => (p.value < a.value ? p : a))
      const worst = averages.reduce((a, p) => (p.value > a.value ? p : a))
      if (worst.value - cleanest.value >= Math.max(10, cleanest.value * 0.1)) {
        out.push(
          `Over the past ${Math.round(past.length / 24)} days the air was typically cleanest around ${hourLabel(cleanest.hour)} and most polluted around ${hourLabel(worst.hour)} (average ${standardName} ${cleanest.value} versus ${worst.value}, local time).`
        )
      }
    }
  }

  // 3. Recent days against the WHO PM2.5 guideline
  const fullDays = days.filter((d) => d.kind === "past" && d.pm2_5Avg !== null && d.hours >= 20)
  if (fullDays.length >= 2) {
    const over = fullDays.filter((d) => (d.pm2_5Avg ?? 0) > WHO_PM25_24H).length
    out.push(
      `The daily average PM2.5 was above the WHO 24-hour guideline (${WHO_PM25_24H} µg/m³) on ${over} of the last ${fullDays.length} full days. This compares hourly model averages, so treat it as indicative.`
    )
  }

  // 4. Cleanest 3-hour stretch in the next 24 hours
  const upcoming = hourly.slice(nowIndex + 1, nowIndex + 25)
  if (upcoming.length >= 12) {
    let best: { start: number; avg: number } | null = null
    for (let i = 0; i + 2 < upcoming.length; i++) {
      const window = [value(upcoming[i]), value(upcoming[i + 1]), value(upcoming[i + 2])]
      if (window.some((v) => v === null)) continue
      const avg = (window as number[]).reduce((x, y) => x + y, 0) / 3
      if (!best || avg < best.avg) best = { start: i, avg }
    }

    const all = numbers(upcoming.map(value))
    if (best && all.length > 0) {
      const spread = Math.max(...all) - Math.min(...all)
      out.push(
        spread < 10
          ? `No clearly better time is forecast over the next 24 hours: the ${standardName} stays within about ${Math.round(spread)} points.`
          : `The cleanest 3-hour stretch in the next 24 hours starts around ${formatDayHour(upcoming[best.start].time)} (average ${standardName} about ${Math.round(best.avg)}).`
      )
    }
  }

  return out
}