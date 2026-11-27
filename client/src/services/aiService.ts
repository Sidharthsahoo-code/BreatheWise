import { apiRequest } from "./api"
import type { GeocodedLocation } from "@/types/airQuality"
import type { FamilyProfile, IndoorAssessment, RoutineActivity } from "@/types/family"
import type {
  AiResult,
  ChatAnswer,
  ChatHistoryItem,
  DailyPlan,
  IndoorAdvice,
  Recommendations,
} from "@/types/assistant"

// The server fetches the air data itself, so only the location goes over the wire
export function toLocationPayload(location: GeocodedLocation) {
  return {
    name: location.name,
    region: location.admin1 ?? undefined,
    country: location.country ?? undefined,
    latitude: location.latitude,
    longitude: location.longitude,
  }
}

// No names or ids are sent: only age group and sensitivity
export function toProfilePayload(profile: FamilyProfile) {
  if (profile.members.length === 0) return undefined
  return { members: profile.members.map((m) => ({ ageGroup: m.ageGroup, sensitive: m.sensitive })) }
}

export function askAssistant(
  location: GeocodedLocation,
  message: string,
  history: ChatHistoryItem[],
  profile: FamilyProfile,
  signal?: AbortSignal
) {
  return apiRequest<AiResult<ChatAnswer>>("/ai/chat", {
    method: "POST",
    body: { location: toLocationPayload(location), profile: toProfilePayload(profile), message, history },
    signal,
  })
}

export function getRecommendations(location: GeocodedLocation, profile: FamilyProfile, signal?: AbortSignal) {
  return apiRequest<AiResult<Recommendations>>("/ai/recommendations", {
    method: "POST",
    body: { location: toLocationPayload(location), profile: toProfilePayload(profile) },
    signal,
  })
}

export function createDailyPlan(
  location: GeocodedLocation,
  profile: FamilyProfile,
  activities: RoutineActivity[],
  signal?: AbortSignal
) {
  return apiRequest<AiResult<DailyPlan>>("/ai/daily-plan", {
    method: "POST",
    body: {
      location: toLocationPayload(location),
      profile: toProfilePayload(profile),
      activities: activities.map((a) => ({
        type: a.type,
        label: a.label.trim() || undefined,
        startTime: a.startTime,
        durationMinutes: a.durationMinutes,
        flexible: a.flexible,
      })),
    },
    signal,
  })
}

export function getIndoorAdvice(location: GeocodedLocation, assessment: IndoorAssessment, signal?: AbortSignal) {
  return apiRequest<AiResult<IndoorAdvice>>("/ai/indoor-advice", {
    method: "POST",
    body: { location: toLocationPayload(location), assessment },
    signal,
  })
}