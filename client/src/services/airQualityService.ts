import { apiRequest } from "./api"
import type { AirQualityForecast, CurrentAirQuality } from "@/types/airQuality"

export function getCurrentAirQuality(latitude: number, longitude: number, signal?: AbortSignal) {
  return apiRequest<CurrentAirQuality>("/air-quality", {
    params: { latitude, longitude },
    signal,
  })
}

export function getAirQualityForecast(
  latitude: number,
  longitude: number,
  range: { pastDays?: number; forecastDays?: number } = {},
  signal?: AbortSignal
) {
  return apiRequest<AirQualityForecast>("/air-quality/forecast", {
    params: { latitude, longitude, pastDays: range.pastDays, forecastDays: range.forecastDays },
    signal,
  })
}