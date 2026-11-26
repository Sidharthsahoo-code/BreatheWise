import { apiRequest } from "./api"
import type { GeocodedLocation } from "@/types/airQuality"

export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodedLocation[]> {
  const data = await apiRequest<{ query: string; results: GeocodedLocation[] }>("/geocoding/search", {
    params: { q: query },
    signal,
  })
  return data.results
}