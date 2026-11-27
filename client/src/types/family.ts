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