import { useEffect, useState } from "react"
import { getAirQualityForecast, getCurrentAirQuality } from "@/services/airQualityService"
import type { AirQualityForecast, CurrentAirQuality, GeocodedLocation } from "@/types/airQuality"

export interface AirQualityState {
  current: CurrentAirQuality | null
  forecast: AirQualityForecast | null
  loading: boolean
  error: Error | null
  retry: () => void
}

interface Result {
  requestKey: string
  current?: CurrentAirQuality
  forecast?: AirQualityForecast
  error?: Error
}

export function useAirQualityData(location: GeocodedLocation): AirQualityState {
  const { latitude, longitude } = location
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  const requestKey = `${latitude},${longitude},${attempt}`

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getCurrentAirQuality(latitude, longitude, controller.signal),
      getAirQualityForecast(latitude, longitude, { pastDays: 3, forecastDays: 3 }, controller.signal),
    ])
      .then(([current, forecast]) => setResult({ requestKey, current, forecast }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ requestKey, error: err instanceof Error ? err : new Error("Unknown error") })
      })

    return () => controller.abort()
  }, [latitude, longitude, requestKey])

  const ready = result && result.requestKey === requestKey ? result : null

  return {
    current: ready?.current ?? null,
    forecast: ready?.forecast ?? null,
    loading: ready === null,
    error: ready?.error ?? null,
    retry: () => setAttempt((n) => n + 1),
  }
}