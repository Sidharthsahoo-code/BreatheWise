export type AqiStandard = "us" | "european"

// Shared level keys map to the --aqi-* colors in index.css
export type AqiLevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous"

export interface AqiCategory {
  level: AqiLevel
  label: string
}

export const AQI_STANDARDS = {
  us: {
    name: "US AQI",
    body: "US EPA scale, calculated by Open-Meteo",
    notice: "This is the US AQI, not the Indian CPCB AQI.",
  },
  european: {
    name: "European AQI",
    body: "European Environment Agency scale, calculated by Open-Meteo",
    notice: "This is the European AQI, not the Indian CPCB AQI.",
  },
} as const

const US_BANDS: Array<{ max: number } & AqiCategory> = [
  { max: 50, level: "good", label: "Good" },
  { max: 100, level: "moderate", label: "Moderate" },
  { max: 150, level: "sensitive", label: "Unhealthy for Sensitive Groups" },
  { max: 200, level: "unhealthy", label: "Unhealthy" },
  { max: 300, level: "very-unhealthy", label: "Very Unhealthy" },
  { max: Infinity, level: "hazardous", label: "Hazardous" },
]

const EU_BANDS: Array<{ max: number } & AqiCategory> = [
  { max: 20, level: "good", label: "Good" },
  { max: 40, level: "moderate", label: "Fair" },
  { max: 60, level: "sensitive", label: "Moderate" },
  { max: 80, level: "unhealthy", label: "Poor" },
  { max: 100, level: "very-unhealthy", label: "Very Poor" },
  { max: Infinity, level: "hazardous", label: "Extremely Poor" },
]

export function describeAqi(standard: AqiStandard, value: number | null): AqiCategory | null {
  if (value === null || Number.isNaN(value)) return null
  const bands = standard === "us" ? US_BANDS : EU_BANDS
  const band = bands.find((b) => value <= b.max)!
  return { level: band.level, label: band.label }
}

export type PollutantKey = "pm2_5" | "pm10" | "no2" | "so2" | "o3" | "co"

// WHO 2021 air quality guideline values (short-term). All in µg/m³.
// PM, NO2, SO2 and CO are 24-hour guidelines, O3 is the 8-hour peak-season guideline.
// Open-Meteo gives hourly values, so a comparison is indicative, not a compliance check.
export const POLLUTANTS: Record<PollutantKey, { label: string; unit: string; whoGuideline: number }> = {
  pm2_5: { label: "PM2.5", unit: "µg/m³", whoGuideline: 15 },
  pm10: { label: "PM10", unit: "µg/m³", whoGuideline: 45 },
  no2: { label: "NO₂", unit: "µg/m³", whoGuideline: 25 },
  so2: { label: "SO₂", unit: "µg/m³", whoGuideline: 40 },
  o3: { label: "O₃", unit: "µg/m³", whoGuideline: 100 },
  co: { label: "CO", unit: "µg/m³", whoGuideline: 4000 },
}

export function ratioToGuideline(key: PollutantKey, value: number | null): number | null {
  if (value === null) return null
  return Math.round((value / POLLUTANTS[key].whoGuideline) * 100) / 100
}