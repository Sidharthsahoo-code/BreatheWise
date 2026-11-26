import { GoogleGenAI } from "@google/genai"
import type { ZodType } from "zod"
import { env } from "../config/env.js"
import { AppError } from "../middleware/errorHandler.js"

export interface ChatTurn {
  role: "user" | "model"
  text: string
}

// A hung model should fail fast so the fallback model gets a turn
const REQUEST_TIMEOUT_MS = 25_000

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "The AI assistant isn't set up yet. Add GEMINI_API_KEY to server/.env and restart the server.",
      503,
      "AI_NOT_CONFIGURED"
    )
  }
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { timeout: REQUEST_TIMEOUT_MS } })
  return client
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("status" in err)) return undefined
  const status = (err as { status: unknown }).status
  return typeof status === "number" ? status : undefined
}

function isTimeout(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return err.name === "AbortError" || err.name === "TimeoutError" || /time[d ]?out|abort/i.test(err.message)
}

function toAppError(err: unknown): AppError {
  if (!env.isProd) console.error("[gemini]", err)
  const status = getStatus(err)

  if (status === 400 || status === 401 || status === 403) {
    return new AppError(
      "The AI service rejected the request. Check that GEMINI_API_KEY and GEMINI_MODEL are valid.",
      502,
      "AI_REJECTED"
    )
  }
  if (status === 404) {
    return new AppError(
      "The configured AI model was not found. Check GEMINI_MODEL in server/.env.",
      502,
      "AI_MODEL_UNAVAILABLE"
    )
  }
  if (status === 429) {
    return new AppError(
      "The AI service is at its usage limit right now. Please try again in a minute.",
      429,
      "AI_QUOTA_EXCEEDED"
    )
  }
  if (status !== undefined && status >= 500) {
    return new AppError("The AI service is busy right now. Please try again shortly.", 503, "AI_UNAVAILABLE")
  }
  if (isTimeout(err)) {
    return new AppError("The AI service took too long to respond. Please try again.", 504, "AI_TIMEOUT")
  }
  return new AppError("The AI service could not be reached. Please try again.", 502, "AI_UNREACHABLE")
}

async function callModel(system: string, turns: ChatTurn[], temperature: number): Promise<string> {
  const ai = getClient()
  const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter((m): m is string => Boolean(m))
  let lastError: AppError | null = null

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            temperature,
          },
        })

        const text = response.text
        if (!text) {
          throw new AppError("The AI returned an empty response. Please try again.", 502, "AI_EMPTY_RESPONSE")
        }
        return text
      } catch (err) {
        if (err instanceof AppError) throw err

        const status = getStatus(err)
        // One quick retry when the model is briefly overloaded
        if (status === 503 && attempt === 0) {
          await sleep(1200)
          continue
        }

        lastError = toAppError(err)
        // Overloaded, retired, out of quota, timed out or unreachable: try the next model
        if (status === undefined || status === 503 || status === 404 || status === 429) {
          if (!env.isProd) console.warn(`[gemini] model "${model}" failed (${lastError.code}), trying the next model if available`)
          break
        }
        throw lastError
      }
    }
  }

  throw lastError ?? new AppError("The AI service is busy right now. Please try again shortly.", 503, "AI_UNAVAILABLE")
}

type Parsed<T> = { ok: true; value: T } | { ok: false; issue: string }

function parseJson<T>(raw: string, schema: ZodType<T>): Parsed<T> {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    const result = schema.safeParse(JSON.parse(cleaned))
    return result.success ? { ok: true, value: result.data } : { ok: false, issue: result.error.message }
  } catch (err) {
    return { ok: false, issue: err instanceof Error ? err.message : "Invalid JSON" }
  }
}

interface GenerateJsonOptions<T> {
  system: string
  turns: ChatTurn[]
  schema: ZodType<T>
  temperature?: number
}

// Asks Gemini for JSON and validates it. One retry if the shape is wrong.
export async function generateJson<T>({ system, turns, schema, temperature = 0.4 }: GenerateJsonOptions<T>): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await callModel(system, turns, temperature)
    const parsed = parseJson(raw, schema)
    if (parsed.ok) return parsed.value
    if (!env.isProd) console.warn(`[gemini] response failed validation (attempt ${attempt}):`, parsed.issue)
  }
  throw new AppError("The AI answered in an unexpected format. Please try again.", 502, "AI_INVALID_RESPONSE")
}