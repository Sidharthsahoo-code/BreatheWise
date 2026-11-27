import { useState } from "react"
import { ACTIVITY_TYPES, DURATIONS, MAX_ACTIVITIES, type RoutineActivity } from "@/types/family"

const STORAGE_KEY = "breathewise.routine"
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function sanitize(a: Partial<RoutineActivity>): RoutineActivity | null {
  if (typeof a.id !== "string" || typeof a.startTime !== "string" || !TIME.test(a.startTime)) return null
  const type = ACTIVITY_TYPES.find((t) => t.value === a.type)
  if (!type) return null

  return {
    id: a.id,
    type: type.value,
    label: typeof a.label === "string" ? a.label.slice(0, 60) : "",
    startTime: a.startTime,
    durationMinutes: DURATIONS.find((d) => d === a.durationMinutes) ?? 30,
    flexible: a.flexible !== false,
  }
}

function load(): RoutineActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return (parsed as Partial<RoutineActivity>[])
      .map(sanitize)
      .filter((a): a is RoutineActivity => a !== null)
      .slice(0, MAX_ACTIVITIES)
  } catch {
    return []
  }
}

export function useRoutine() {
  const [activities, setState] = useState<RoutineActivity[]>(load)

  const setActivities = (next: RoutineActivity[]) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable: routine just won't persist */
    }
  }

  return { activities, setActivities }
}