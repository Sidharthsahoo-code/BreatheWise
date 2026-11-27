import type { AqiCategory, AqiLevel, AqiStandard } from "@/types/airQuality"

export const LEVELS: AqiLevel[] = ["good", "moderate", "sensitive", "unhealthy", "very-unhealthy", "hazardous"]

// Upper bound of each level. The last value is the end of the gauge, not a real limit.
export const AQI_SCALE: Record<AqiStandard, number[]> = {
  us: [50, 100, 150, 200, 300, 500],
  european: [20, 40, 60, 80, 100, 120],
}

const LABELS: Record<AqiStandard, string[]> = {
  us: ["Good", "Moderate", "Unhealthy for Sensitive Groups", "Unhealthy", "Very Unhealthy", "Hazardous"],
  european: ["Good", "Fair", "Moderate", "Poor", "Very Poor", "Extremely Poor"],
}

// Used for hourly points, which arrive as plain numbers without a category
export function getAqiCategory(standard: AqiStandard, value: number | null): AqiCategory | null {
  if (value === null) return null
  const found = AQI_SCALE[standard].findIndex((limit) => value <= limit)
  const index = found === -1 ? LEVELS.length - 1 : found
  return { level: LEVELS[index], label: LABELS[standard][index] }
}

// Tailwind classes are written out in full so Tailwind can detect them
export const AQI_LEVEL_STYLES: Record<AqiLevel, { dot: string; soft: string; border: string; color: string }> = {
  good: { dot: "bg-aqi-good", soft: "bg-aqi-good/15", border: "border-aqi-good/40", color: "var(--aqi-good)" },
  moderate: { dot: "bg-aqi-moderate", soft: "bg-aqi-moderate/20", border: "border-aqi-moderate/50", color: "var(--aqi-moderate)" },
  sensitive: { dot: "bg-aqi-sensitive", soft: "bg-aqi-sensitive/15", border: "border-aqi-sensitive/40", color: "var(--aqi-sensitive)" },
  unhealthy: { dot: "bg-aqi-unhealthy", soft: "bg-aqi-unhealthy/15", border: "border-aqi-unhealthy/40", color: "var(--aqi-unhealthy)" },
  "very-unhealthy": { dot: "bg-aqi-very-unhealthy", soft: "bg-aqi-very-unhealthy/15", border: "border-aqi-very-unhealthy/40", color: "var(--aqi-very-unhealthy)" },
  hazardous: { dot: "bg-aqi-hazardous", soft: "bg-aqi-hazardous/15", border: "border-aqi-hazardous/40", color: "var(--aqi-hazardous)" },
}

// General guidance per level, in line with standard public AQI advice
export const AQI_LEVEL_SUMMARY: Record<AqiLevel, string> = {
  good: "Air quality is considered satisfactory, with little or no risk from air pollution.",
  moderate: "Acceptable for most people. Unusually sensitive people may notice effects during long outdoor exertion.",
  sensitive: "Children, older adults and people with heart or lung conditions are more likely to be affected. Consider shorter or lighter outdoor activity.",
  unhealthy: "Everyone may begin to feel effects. Sensitive groups should limit prolonged outdoor exertion.",
  "very-unhealthy": "Health effects are likely for many people. Avoid prolonged outdoor exertion where you can.",
  hazardous: "Serious risk for everyone. Stay indoors as much as possible and avoid outdoor exertion.",
}
// Pollutant level compared with its WHO guideline (1 means exactly at the guideline)
export function getGuidelineLevel(ratio: number): AqiLevel {
  if (ratio <= 1) return "good"
  if (ratio <= 2) return "moderate"
  if (ratio <= 3) return "sensitive"
  if (ratio <= 5) return "unhealthy"
  return "very-unhealthy"
}