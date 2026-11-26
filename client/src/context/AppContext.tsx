import { createContext, useContext, useState, type ReactNode } from "react"
import { useAirQualityData, type AirQualityState } from "@/hooks/useAirQuality"
import type { AqiStandard, GeocodedLocation } from "@/types/airQuality"

const LOCATION_KEY = "breathewise.location"
const STANDARD_KEY = "breathewise.aqiStandard"

const DEFAULT_LOCATION: GeocodedLocation = {
  id: 1273294,
  name: "Delhi",
  admin1: "National Capital Territory of Delhi",
  country: "India",
  countryCode: "IN",
  latitude: 28.65195,
  longitude: 77.23149,
  timezone: "Asia/Kolkata",
  population: 11034555,
}

function loadLocation(): GeocodedLocation {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GeocodedLocation>
      if (
        typeof parsed.name === "string" &&
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        return parsed as GeocodedLocation
      }
    }
  } catch {
    /* storage unavailable or corrupted: fall back to the default */
  }
  return DEFAULT_LOCATION
}

function loadStandard(): AqiStandard {
  try {
    return localStorage.getItem(STANDARD_KEY) === "european" ? "european" : "us"
  } catch {
    return "us"
  }
}

interface AppContextValue {
  location: GeocodedLocation
  setLocation: (location: GeocodedLocation) => void
  aqiStandard: AqiStandard
  setAqiStandard: (standard: AqiStandard) => void
  airQuality: AirQualityState
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<GeocodedLocation>(loadLocation)
  const [aqiStandard, setAqiStandardState] = useState<AqiStandard>(loadStandard)
  const airQuality = useAirQualityData(location)

  const setLocation = (next: GeocodedLocation) => {
    setLocationState(next)
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable: selection just won't persist */
    }
  }

  const setAqiStandard = (next: AqiStandard) => {
    setAqiStandardState(next)
    try {
      localStorage.setItem(STANDARD_KEY, next)
    } catch {
      /* storage unavailable: choice just won't persist */
    }
  }

  return (
    <AppContext.Provider value={{ location, setLocation, aqiStandard, setAqiStandard, airQuality }}>
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>")
  return ctx
}