const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: "GET" | "POST"
  params?: Record<string, string | number | undefined>
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", params, body, signal } = options

  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "NETWORK_ERROR")
  }

  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string; details?: unknown } } = {}
    try {
      payload = await res.json()
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(
      payload.error?.message ?? "Something went wrong. Please try again.",
      res.status,
      payload.error?.code ?? "UNKNOWN_ERROR",
      payload.error?.details
    )
  }

  return (await res.json()) as T
}