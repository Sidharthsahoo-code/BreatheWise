import { useState } from "react"
import { useApp } from "@/context/AppContext"
import { useAirQualityData } from "@/hooks/useAirQuality"
import { LocationSearch } from "@/components/layout/LocationSearch"
import { LocationPanel } from "@/components/map/LocationPanel"
import { PollutionMap, type MapMarkerData, type MapPoint } from "@/components/map/PollutionMap"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AqiStandard, GeocodedLocation } from "@/types/airQuality"
import { formatLocationFull, formatLocationShort } from "@/utils/formatters"

interface Pin extends MapPoint {
  // The pin belongs to the city that was selected when it was placed
  locationId: number
}

function pinnedLocation({ latitude, longitude }: MapPoint): GeocodedLocation {
  return {
    id: -1,
    name: "Pinned point",
    admin1: null,
    country: null,
    countryCode: null,
    latitude,
    longitude,
    timezone: null,
    population: null,
  }
}

export default function PollutionMapPage() {
  const { location, setLocation, aqiStandard, setAqiStandard } = useApp()
  const [pin, setPin] = useState<Pin | null>(null)

  // Choosing another city in the header drops the pin, because it no longer matches
  const probe = pin && pin.locationId === location.id ? pin : null

  const target = probe ? pinnedLocation(probe) : location
  const air = useAirQualityData(target)

  const reading = air.current?.aqi[aqiStandard]
  const value = reading?.value ?? null
  const level = reading?.category?.level ?? null

  const cityMarker: MapMarkerData = {
    key: "city",
    latitude: location.latitude,
    longitude: location.longitude,
    value: probe ? null : value,
    level: probe ? null : level,
    title: formatLocationShort(location),
  }
  const markers: MapMarkerData[] = probe
    ? [cityMarker, { key: "probe", latitude: probe.latitude, longitude: probe.longitude, value, level, title: "Pinned point" }]
    : [cityMarker]

  const useAsMyLocation = () => {
    if (!probe) return
    setLocation({
      id: Date.now(),
      name: `Pin ${probe.latitude.toFixed(2)}, ${probe.longitude.toFixed(2)}`,
      admin1: null,
      country: null,
      countryCode: null,
      latitude: probe.latitude,
      longitude: probe.longitude,
      timezone: air.current?.location.timezone ?? null,
      population: null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pollution Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search a city, or click anywhere on the map to see the model&apos;s air quality for that spot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LocationSearch />
          <Tabs value={aqiStandard} onValueChange={(v) => setAqiStandard(v as AqiStandard)}>
            <TabsList aria-label="AQI standard">
              <TabsTrigger value="us">US AQI</TabsTrigger>
              <TabsTrigger value="european">European AQI</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-15rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[24rem] overflow-hidden rounded-2xl border shadow-xs lg:h-full">
          <PollutionMap
            center={{ latitude: location.latitude, longitude: location.longitude }}
            markers={markers}
            onPick={(point) => setPin({ ...point, locationId: location.id })}
          />
        </div>

        <LocationPanel
          title={probe ? "Pinned point" : formatLocationShort(location)}
          subtitle={
            probe
              ? `${probe.latitude.toFixed(3)}°, ${probe.longitude.toFixed(3)}°`
              : formatLocationFull(location)
          }
          state={air}
          standard={aqiStandard}
          isPin={probe !== null}
          cityName={location.name}
          onReset={() => setPin(null)}
          onUse={useAsMyLocation}
        />
      </div>
    </div>
  )
}