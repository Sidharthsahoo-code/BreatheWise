import { useEffect, useState } from "react"
import { apiRequest } from "@/services/api"

export interface ApiHealth {
  status: string
  environment: string
  geminiConfigured: boolean
  uptimeSeconds: number
}

export interface ApiHealthState {
  health: ApiHealth | null
  error: string | null
  loading: boolean
  responseMs: number | null
  checkedAt: Date | null
  recheck: () => void
}

interface Outcome {
  key: number
  health?: ApiHealth
  error?: string
  responseMs: number
  checkedAt: Date
}

export function useApiHealth(): ApiHealthState {
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const started = performance.now()

    const finish = (result: { health?: ApiHealth; error?: string }) =>
      setOutcome({ key: attempt, ...result, responseMs: Math.round(performance.now() - started), checkedAt: new Date() })

    apiRequest<ApiHealth>("/health", { signal: controller.signal })
      .then((health) => finish({ health }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        finish({ error: err instanceof Error ? err.message : "The API is unreachable." })
      })

    return () => controller.abort()
  }, [attempt])

  // Ignore a result that belongs to an earlier check
  const settled = outcome && outcome.key === attempt ? outcome : null

  return {
    health: settled?.health ?? null,
    error: settled?.error ?? null,
    loading: settled === null,
    responseMs: settled?.responseMs ?? null,
    checkedAt: settled?.checkedAt ?? null,
    recheck: () => setAttempt((n) => n + 1),
  }
}