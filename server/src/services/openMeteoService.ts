import { AppError } from "../middleware/errorHandler.js"
import {
  AQI_STANDARDS,
  POLLUTANTS,
  describeAqi,
  ratioToGuideline,
  type AqiCategory,
  type PollutantKey,
} from "../utils/aqiCalculator.js"

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
const TIMEOUT_MS = 10_000
const CACHE_TTL_MS = 10 * 60 * 1000

const VARIABLES = [
  "us_aqi",
  "european_aqi",
  "pm2_5",
  "pm10",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
].join(",")

export const DATA_SOURCE = {
  provider: "Open-Meteo Air Quality API",
  dataType: "modelled",
  note: "Values come from the Copernicus CAMS atmospheric model on a grid, not from a monitoring station near you. Past hours are model analysis, and future hours are model forecasts. Street-level readings can differ.",
} as const

/* ---------- Public types (mirrored on the client) ---------- */

export interface GeocodedLocation {
  id: number
  name: string
  admin1: string | null
  country: string | null
  countryCode: string | null
  latitude: number
  longitude: number
  timezone: string | null
  population: number | null
}

export interface AqiReading {
  value: number | null
  category: AqiCategory | null
}

export interface PollutantReading {
  key: PollutantKey
  label: string
  value: number | null
  unit: string
  whoGuideline: number
  ratioToGuideline: number | null
}

export interface CurrentAirQuality {
  location: { latitude: number; longitude: number; timezone: string }
  dataTime: string
  fetchedAt: string
  dataAvailable: boolean
  aqi: { us: AqiReading; european: AqiReading }
  pollutants: PollutantReading[]
  standards: typeof AQI_STANDARDS
  source: typeof DATA_SOURCE
}

export interface HourlyPoint {
  time: string
  isForecast: boolean
  usAqi: number | null
  europeanAqi: number | null
  pm2_5: number | null
  pm10: number | null
  no2: number | null
  so2: number | null
  o3: number | null
  co: number | null
}

export interface DailySummary {
  date: string
  kind: "past" | "today" | "forecast"
  usAqiMax: number | null
  usAqiAvg: number | null
  pm2_5Avg: number | null
  pm10Avg: number | null
  bestHour: { time: string; usAqi: number } | null
  worstHour: { time: string; usAqi: number } | null
}

export interface AirQualityForecast {
  location: { latitude: number; longitude: number; timezone: string }
  dataTime: string
  fetchedAt: string
  dataAvailable: boolean
  hourly: HourlyPoint[]
  daily: DailySummary[]
  standards: typeof AQI_STANDARDS
  source: typeof DATA_SOURCE
}

/* ---------- Raw Open-Meteo shapes ---------- */

interface RawGeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
  timezone?: string
  population?: number
}

interface RawCurrent {
  time: string
  us_aqi: number | null
  european_aqi: number | null
  pm2_5: number | null
  pm10: number | null
  carbon_monoxide: number | null
  nitrogen_dioxide: number | null
  sulphur_dioxide: number | null
  ozone: number | null
}

interface RawHourly {
  time: string[]
  us_aqi: Array<number | null>
  european_aqi: Array<number | null>
  pm2_5: Array<number | null>
  pm10: Array<number | null>
  carbon_monoxide: Array<number | null>
  nitrogen_dioxide: Array<number | null>
  sulphur_dioxide: Array<number | null>
  ozone: Array<number | null>
}

interface RawAirQuality {
  latitude: number
  longitude: number
  timezone: string
  current?: RawCurrent
  hourly?: RawHourly
}

/* ---------- Helpers ---------- */

const cache = new Map<string, { expires: number; data: RawAirQuality }>()

async function fetchJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    })
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
    throw new AppError(
      timedOut
        ? "The air quality provider took too long to respond. Please try again."
        : "Could not reach the air quality provider. Please try again in a moment.",
      timedOut ? 504 : 502,
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE"
    )
  }

  if (!res.ok) {
    let reason: string | undefined
    try {
      reason = ((await res.json()) as { reason?: string }).reason
    } catch {
      /* body was not JSON */
    }
    const limited = res.status === 429
    throw new AppError(
      limited
        ? "The air quality provider is rate limiting requests. Please wait a moment and retry."
        : "The air quality provider returned an error.",
      limited ? 503 : 502,
      "UPSTREAM_ERROR",
      reason ? { reason } : undefined
    )
  }

  return (await res.json()) as T
}

const round1 = (v: number | null | undefined) => (v == null ? null : Math.round(v * 10) / 10)
const roundInt = (v: number | null | undefined) => (v == null ? null : Math.round(v))

function average(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

async function fetchRaw(opts: {
  latitude: number
  longitude: number
  hourly: boolean
  pastDays?: number
  forecastDays?: number
}): Promise<RawAirQuality> {
  // ~1 km precision is finer than the model grid, and it makes cache hits likely
  const latitude = Number(opts.latitude.toFixed(2))
  const longitude = Number(opts.longitude.toFixed(2))
  const pastDays = opts.pastDays ?? 0
  const forecastDays = opts.forecastDays ?? 1

  const key = `${latitude},${longitude}|${opts.hourly}|${pastDays}|${forecastDays}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.data

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: VARIABLES,
    timezone: "auto",
  })
  if (opts.hourly) {
    params.set("hourly", VARIABLES)
    params.set("past_days", String(pastDays))
    params.set("forecast_days", String(forecastDays))
  }

  const data = await fetchJson<RawAirQuality>(`${AIR_QUALITY_URL}?${params}`)
  if (!data.current) {
    throw new AppError("The air quality provider returned an unexpected response.", 502, "UPSTREAM_BAD_RESPONSE")
  }

  if (cache.size > 200) cache.clear()
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data })
  return data
}

/* ---------- Geocoding ---------- */

export async function searchLocations(query: string, count = 6): Promise<GeocodedLocation[]> {
  const params = new URLSearchParams({ name: query, count: String(count), language: "en", format: "json" })
  const data = await fetchJson<{ results?: RawGeoResult[] }>(`${GEOCODING_URL}?${params}`)

  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1 ?? null,
    country: r.country ?? null,
    countryCode: r.country_code ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? null,
    population: r.population ?? null,
  }))
}

/* ---------- Current air quality ---------- */

export async function getCurrentAirQuality(latitude: number, longitude: number): Promise<CurrentAirQuality> {
  const raw = await fetchRaw({ latitude, longitude, hourly: false })
  const c = raw.current!

  const values: Record<PollutantKey, number | null> = {
    pm2_5: round1(c.pm2_5),
    pm10: round1(c.pm10),
    no2: round1(c.nitrogen_dioxide),
    so2: round1(c.sulphur_dioxide),
    o3: round1(c.ozone),
    co: round1(c.carbon_monoxide),
  }

  const pollutants: PollutantReading[] = (["pm2_5", "pm10", "no2", "so2", "o3", "co"] as PollutantKey[]).map(
    (key) => ({
      key,
      label: POLLUTANTS[key].label,
      value: values[key],
      unit: POLLUTANTS[key].unit,
      whoGuideline: POLLUTANTS[key].whoGuideline,
      ratioToGuideline: ratioToGuideline(key, values[key]),
    })
  )

  const usAqi = roundInt(c.us_aqi)
  const euAqi = roundInt(c.european_aqi)

  return {
    location: { latitude: raw.latitude, longitude: raw.longitude, timezone: raw.timezone },
    dataTime: c.time,
    fetchedAt: new Date().toISOString(),
    dataAvailable: usAqi !== null || values.pm2_5 !== null,
    aqi: {
      us: { value: usAqi, category: describeAqi("us", usAqi) },
      european: { value: euAqi, category: describeAqi("european", euAqi) },
    },
    pollutants,
    standards: AQI_STANDARDS,
    source: DATA_SOURCE,
  }
}

/* ---------- Hourly series and daily summaries ---------- */

export async function getAirQualityForecast(
  latitude: number,
  longitude: number,
  pastDays: number,
  forecastDays: number
): Promise<AirQualityForecast> {
  const raw = await fetchRaw({ latitude, longitude, hourly: true, pastDays, forecastDays })
  const h = raw.hourly
  if (!h) {
    throw new AppError("The air quality provider returned an unexpected response.", 502, "UPSTREAM_BAD_RESPONSE")
  }

  const dataTime = raw.current!.time
  const today = dataTime.slice(0, 10)

  // Local times from Open-Meteo are "YYYY-MM-DDTHH:mm" in one timezone, so string comparison is safe
  const hourly: HourlyPoint[] = h.time.map((time, i) => ({
    time,
    isForecast: time > dataTime,
    usAqi: roundInt(h.us_aqi[i]),
    europeanAqi: roundInt(h.european_aqi[i]),
    pm2_5: round1(h.pm2_5[i]),
    pm10: round1(h.pm10[i]),
    no2: round1(h.nitrogen_dioxide[i]),
    so2: round1(h.sulphur_dioxide[i]),
    o3: round1(h.ozone[i]),
    co: round1(h.carbon_monoxide[i]),
  }))

  const byDate = new Map<string, HourlyPoint[]>()
  for (const point of hourly) {
    const date = point.time.slice(0, 10)
    byDate.set(date, [...(byDate.get(date) ?? []), point])
  }

  const daily: DailySummary[] = [...byDate.entries()].map(([date, points]) => {
    const withAqi = points.filter((p): p is HourlyPoint & { usAqi: number } => p.usAqi !== null)
    const best = withAqi.reduce<(typeof withAqi)[number] | null>((a, p) => (!a || p.usAqi < a.usAqi ? p : a), null)
    const worst = withAqi.reduce<(typeof withAqi)[number] | null>((a, p) => (!a || p.usAqi > a.usAqi ? p : a), null)
    const avgAqi = average(points.map((p) => p.usAqi))

    return {
      date,
      kind: date < today ? "past" : date > today ? "forecast" : "today",
      usAqiMax: worst ? worst.usAqi : null,
      usAqiAvg: avgAqi === null ? null : Math.round(avgAqi),
      pm2_5Avg: round1(average(points.map((p) => p.pm2_5))),
      pm10Avg: round1(average(points.map((p) => p.pm10))),
      bestHour: best ? { time: best.time, usAqi: best.usAqi } : null,
      worstHour: worst ? { time: worst.time, usAqi: worst.usAqi } : null,
    }
  })

  return {
    location: { latitude: raw.latitude, longitude: raw.longitude, timezone: raw.timezone },
    dataTime,
    fetchedAt: new Date().toISOString(),
    dataAvailable: hourly.some((p) => p.usAqi !== null || p.pm2_5 !== null),
    hourly,
    daily,
    standards: AQI_STANDARDS,
    source: DATA_SOURCE,
  }
}