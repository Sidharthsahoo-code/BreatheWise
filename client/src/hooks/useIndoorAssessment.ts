import { useState } from "react"
import {
  COOKING_FUELS,
  DEFAULT_ASSESSMENT,
  INDOOR_SOURCES,
  MAX_HOUSEHOLD,
  MAX_ROOMS,
  VENTILATION_OPTIONS,
  type IndoorAssessment,
} from "@/types/family"

const STORAGE_KEY = "breathewise.indoor"

const int = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback

function load(): IndoorAssessment {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ASSESSMENT
    const p = JSON.parse(raw) as Partial<IndoorAssessment>
    const validSources = INDOOR_SOURCES.map((s) => s.value)

    return {
      rooms: int(p.rooms, 1, MAX_ROOMS, DEFAULT_ASSESSMENT.rooms),
      members: int(p.members, 1, MAX_HOUSEHOLD, DEFAULT_ASSESSMENT.members),
      ventilation: VENTILATION_OPTIONS.some((o) => o.value === p.ventilation)
        ? p.ventilation!
        : DEFAULT_ASSESSMENT.ventilation,
      cookingFuel: COOKING_FUELS.some((f) => f.value === p.cookingFuel) ? p.cookingFuel! : DEFAULT_ASSESSMENT.cookingFuel,
      kitchenExhaust: p.kitchenExhaust === true,
      hasPurifier: p.hasPurifier === true,
      indoorSources: Array.isArray(p.indoorSources) ? p.indoorSources.filter((s) => validSources.includes(s)) : [],
      windowsFaceBusyRoad: p.windowsFaceBusyRoad === true,
    }
  } catch {
    return DEFAULT_ASSESSMENT
  }
}

export function useIndoorAssessment() {
  const [assessment, setState] = useState<IndoorAssessment>(load)

  const setAssessment = (next: IndoorAssessment) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable: answers just won't persist */
    }
  }

  return { assessment, setAssessment }
}