import type { GeocodedLocation } from "@/types/airQuality"

type NameParts = Pick<GeocodedLocation, "name" | "admin1" | "country">

export function formatLocationShort(loc: NameParts): string {
  return [loc.name, loc.country].filter(Boolean).join(", ")
}

export function formatLocationFull(loc: NameParts): string {
  return [loc.name, loc.admin1, loc.country].filter(Boolean).join(", ")
}

export function formatConcentration(value: number | null): string {
  if (value === null) return "—"
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

// Open-Meteo times are local to the location and carry no offset, e.g. "2026-11-25T13:00".
// Parsing them as-is keeps the clock digits unchanged, which is what we want to show.
export function formatDataTime(localIso: string): string {
  return new Date(localIso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatHour(localIso: string): string {
  const d = new Date(localIso)
  return d.toLocaleTimeString(
    undefined,
    d.getMinutes() === 0 ? { hour: "numeric" } : { hour: "numeric", minute: "2-digit" }
  )
}

export function formatDay(date: string): string {
  return new Date(`${date}T00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function timeAgo(utcIso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(utcIso).getTime()) / 60_000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.round(minutes / 60)} h ago`
}
export function formatDayHour(localIso: string): string {
  const d = new Date(localIso)
  return d.toLocaleString(
    undefined,
    d.getMinutes() === 0
      ? { weekday: "short", hour: "numeric" }
      : { weekday: "short", hour: "numeric", minute: "2-digit" }
  )
}
