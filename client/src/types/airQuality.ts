export type AqiStandard = "us" | "european"

// Matches the --aqi-* color tokens in index.css
export type AqiLevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous"

export type PollutantKey = "pm2_5" | "pm10" | "no2" | "so2" | "o3" | "co"

export interface AqiCategory {
  level: AqiLevel
  label: string
}

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

export interface AqiStandardInfo {
  name: string
  body: string
  notice: string
}

export interface DataSourceInfo {
  provider: string
  dataType: string
  note: string
}

export interface AirQualityLocation {
  latitude: number
  longitude: number
  timezone: string
}

export interface CurrentAirQuality {
  location: AirQualityLocation
  dataTime: string
  fetchedAt: string
  dataAvailable: boolean
  aqi: { us: AqiReading; european: AqiReading }
  pollutants: PollutantReading[]
  standards: Record<AqiStandard, AqiStandardInfo>
  source: DataSourceInfo
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
  location: AirQualityLocation
  dataTime: string
  fetchedAt: string
  dataAvailable: boolean
  hourly: HourlyPoint[]
  daily: DailySummary[]
  standards: Record<AqiStandard, AqiStandardInfo>
  source: DataSourceInfo
}