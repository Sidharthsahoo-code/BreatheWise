export type Verdict = "good" | "caution" | "avoid" | "info"
export type Priority = "high" | "medium" | "low"

export interface AiMeta {
  locationLabel: string
  dataTime: string
  timezone: string
  dataSource: string
  generatedAt: string
}

export interface AiResult<T> {
  data: T
  meta: AiMeta
}

export interface ChatAnswer {
  verdict: Verdict
  headline: string
  explanation: string
  actions: string[]
  bestTimeWindow: string | null
  dataNotes: string[]
}

export interface ChatHistoryItem {
  role: "user" | "assistant"
  content: string
}

export type ChatMessageModel =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: ChatAnswer; meta: AiMeta }

export interface RecommendationItem {
  title: string
  detail: string
  priority: Priority
  category: "outdoor" | "indoor" | "health" | "commute" | "general"
}

export interface Recommendations {
  overview: string
  bestTimeWindow: string | null
  items: RecommendationItem[]
  dataNotes: string[]
}
export interface PlanSlot {
  activity: string
  suggestedTime: string
  risk: "low" | "moderate" | "high"
  reasoning: string
  alternative: string
  precaution: string
  forecastNote: string
}

export interface DailyPlan {
  summary: string
  slots: PlanSlot[]
  dataNotes: string[]
}
export interface IndoorChecklistItem {
  title: string
  detail: string
  priority: Priority
  effort: "low" | "medium" | "high"
  category: "ventilation" | "cooking" | "cleaning" | "purifier" | "sources" | "other"
}

export interface IndoorAdvice {
  summary: string
  ventilation: { guidance: string; bestWindowTimes: string | null }
  checklist: IndoorChecklistItem[]
  cookingTips: string[]
  dustAndCleaning: string[]
  purifierGuidance: string
  dataNotes: string[]
}