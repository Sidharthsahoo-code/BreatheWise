export type AgeGroup = "infant" | "child" | "teen" | "adult" | "senior"

export interface FamilyMember {
  id: string
  ageGroup: AgeGroup
  sensitive: boolean
}

export interface FamilyProfile {
  members: FamilyMember[]
}

export const MAX_MEMBERS = 12

export const AGE_GROUPS: Array<{ value: AgeGroup; label: string }> = [
  { value: "infant", label: "Infant (0–2)" },
  { value: "child", label: "Child (3–12)" },
  { value: "teen", label: "Teen (13–17)" },
  { value: "adult", label: "Adult (18–64)" },
  { value: "senior", label: "Senior (65+)" },
]

export type ActivityType =
  | "morning-walk"
  | "school-commute"
  | "office-commute"
  | "outdoor-exercise"
  | "shopping"
  | "evening-activity"
  | "other"

export interface RoutineActivity {
  id: string
  type: ActivityType
  label: string
  startTime: string // "HH:MM", 24-hour, local to the selected city
  durationMinutes: number
  flexible: boolean
}

export const MAX_ACTIVITIES = 12

export const DURATIONS = [15, 30, 45, 60, 90, 120, 180]

export const ACTIVITY_TYPES: Array<{
  value: ActivityType
  label: string
  startTime: string
  durationMinutes: number
}> = [
  { value: "morning-walk", label: "Morning walk", startTime: "06:30", durationMinutes: 45 },
  { value: "school-commute", label: "School commute", startTime: "07:30", durationMinutes: 30 },
  { value: "office-commute", label: "Office commute", startTime: "09:00", durationMinutes: 45 },
  { value: "outdoor-exercise", label: "Outdoor exercise", startTime: "06:00", durationMinutes: 45 },
  { value: "shopping", label: "Shopping", startTime: "17:30", durationMinutes: 60 },
  { value: "evening-activity", label: "Evening activity", startTime: "18:00", durationMinutes: 60 },
  { value: "other", label: "Other", startTime: "12:00", durationMinutes: 30 },
]
export type Ventilation = "poor" | "moderate" | "good"
export type CookingFuel = "lpg" | "piped-gas" | "electric" | "induction" | "biomass" | "kerosene" | "other"
export type IndoorSource =
  | "tobacco-smoke"
  | "incense-or-dhoop"
  | "mosquito-coils"
  | "candles"
  | "pets"
  | "aerosol-sprays"
  | "construction-dust"

export interface IndoorAssessment {
  rooms: number
  members: number
  ventilation: Ventilation
  cookingFuel: CookingFuel
  kitchenExhaust: boolean
  hasPurifier: boolean
  indoorSources: IndoorSource[]
  windowsFaceBusyRoad: boolean
}

export const DEFAULT_ASSESSMENT: IndoorAssessment = {
  rooms: 3,
  members: 3,
  ventilation: "moderate",
  cookingFuel: "lpg",
  kitchenExhaust: false,
  hasPurifier: false,
  indoorSources: [],
  windowsFaceBusyRoad: false,
}

export const MAX_ROOMS = 10
export const MAX_HOUSEHOLD = 12

export const VENTILATION_OPTIONS: Array<{ value: Ventilation; label: string; description: string }> = [
  { value: "poor", label: "Poor", description: "Few or small windows, air often feels stuffy" },
  { value: "moderate", label: "Moderate", description: "Some windows, limited cross-breeze" },
  { value: "good", label: "Good", description: "Windows on opposite sides, easy cross-ventilation" },
]

export const COOKING_FUELS: Array<{ value: CookingFuel; label: string }> = [
  { value: "lpg", label: "LPG cylinder" },
  { value: "piped-gas", label: "Piped natural gas" },
  { value: "electric", label: "Electric stove" },
  { value: "induction", label: "Induction cooktop" },
  { value: "biomass", label: "Wood, dung or charcoal" },
  { value: "kerosene", label: "Kerosene" },
  { value: "other", label: "Other" },
]

export const INDOOR_SOURCES: Array<{ value: IndoorSource; label: string }> = [
  { value: "tobacco-smoke", label: "Tobacco smoking indoors" },
  { value: "incense-or-dhoop", label: "Incense, dhoop or agarbatti" },
  { value: "mosquito-coils", label: "Mosquito coils" },
  { value: "candles", label: "Candles" },
  { value: "pets", label: "Pets" },
  { value: "aerosol-sprays", label: "Aerosol sprays or air fresheners" },
  { value: "construction-dust", label: "Construction or renovation dust" },
]