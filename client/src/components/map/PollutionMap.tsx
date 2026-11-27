import { useEffect, useRef } from "react"
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  type MapMouseEvent,
  type StyleSpecification,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { AqiLevel } from "@/types/airQuality"
import { AQI_LEVEL_STYLES } from "@/utils/aqiUtils"

const DEFAULT_ZOOM = 9

// Plain OpenStreetMap tiles, desaturated so the map sits quietly behind the markers
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.65, "raster-contrast": 0.05 } }],
}

export interface MapPoint {
  latitude: number
  longitude: number
}

export interface MapMarkerData extends MapPoint {
  key: "city" | "probe"
  value: number | null
  level: AqiLevel | null
  title: string
}

interface PollutionMapProps {
  center: MapPoint
  markers: MapMarkerData[]
  onPick: (point: MapPoint) => void
}

// MapLibre owns the element's class and transform, so only inline styles are changed here
function paintMarker(el: HTMLElement, data: MapMarkerData) {
  const level = data.level
  const known = data.value !== null && level !== null

  el.title = data.title
  el.setAttribute("aria-label", data.title)
  el.textContent = known ? String(data.value) : ""
  el.style.width = known ? "44px" : "20px"
  el.style.height = known ? "44px" : "20px"
  el.style.fontSize = "14px"
  el.style.borderColor = data.key === "probe" ? "var(--foreground)" : "white"
  el.style.backgroundColor = known ? AQI_LEVEL_STYLES[level].color : "var(--primary)"
  el.style.color = level === "moderate" ? "#1f2937" : "white"
}

export function PollutionMap({ center, markers, onPick }: PollutionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRefs = useRef(new Map<string, Marker>())
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  })

  // The map is created once. Later changes go through the effects below.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new MapLibreMap({
      container,
      style: STYLE,
      center: [center.longitude, center.latitude],
      zoom: DEFAULT_ZOOM,
      minZoom: 2,
      maxZoom: 14,
    })
    map.addControl(new NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left")
    map.getCanvas().style.cursor = "crosshair"

    map.on("click", (e: MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest(".bw-marker")) return
      const { lat, lng } = e.lngLat.wrap()
      onPickRef.current({ latitude: lat, longitude: lng })
    })

    // The sidebar collapsing changes the container size without a window resize
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(container)

    mapRef.current = map
    const markerMap = markerRefs.current

    return () => {
      observer.disconnect()
      markerMap.forEach((marker) => marker.remove())
      markerMap.clear()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    mapRef.current?.flyTo({ center: [center.longitude, center.latitude], zoom: DEFAULT_ZOOM, essential: true })
  }, [center.latitude, center.longitude])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const existing = markerRefs.current

    const keys = new Set<string>(markers.map((m) => m.key))
    for (const [key, marker] of existing) {
      if (!keys.has(key)) {
        marker.remove()
        existing.delete(key)
      }
    }

    for (const data of markers) {
      let marker = existing.get(data.key)
      if (!marker) {
        const el = document.createElement("div")
        el.className = "bw-marker flex items-center justify-center rounded-full border-[3px] font-bold shadow-lg"
        marker = new Marker({ element: el }).setLngLat([data.longitude, data.latitude]).addTo(map)
        existing.set(data.key, marker)
      }
      marker.setLngLat([data.longitude, data.latitude])
      paintMarker(marker.getElement(), data)
    }
  }, [markers])

  return <div ref={containerRef} role="application" aria-label="Pollution map" className="size-full" />
}