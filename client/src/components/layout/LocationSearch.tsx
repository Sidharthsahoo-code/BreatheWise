import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Check, LoaderCircle, MapPin, Search, SearchX, TriangleAlert } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { searchLocations } from "@/services/geocodingService"
import { Input } from "@/components/ui/input"
import { formatLocationFull, formatLocationShort } from "@/utils/formatters"
import type { GeocodedLocation } from "@/types/airQuality"

interface Outcome {
  key: string
  results?: GeocodedLocation[]
  error?: string
}

export function LocationSearch() {
  const { location, setLocation } = useApp()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const trimmed = query.trim()
  const key = `${trimmed}|${attempt}`

  // Debounced search. State is only set from async callbacks, never synchronously in the effect.
  useEffect(() => {
    if (trimmed.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchLocations(trimmed, controller.signal)
        .then((results) => setOutcome({ key, results }))
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          setOutcome({ key, error: err instanceof Error ? err.message : "Search failed." })
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, key])

  // Close when clicking or tapping outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const settled = outcome && outcome.key === key ? outcome : null
  const loading = trimmed.length >= 2 && !settled

  const choose = (next: GeocodedLocation) => {
    setLocation(next)
    setOpen(false)
    setQuery("")
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && settled?.results?.[0]) choose(settled.results[0])
  }

  let body: ReactNode
  if (trimmed.length < 2) {
    body = <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 letters to search any city.</p>
  } else if (loading) {
    body = (
      <div role="status" className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Searching…
      </div>
    )
  } else if (settled?.error) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-2 px-3 py-6 text-center text-sm">
        <TriangleAlert className="size-5 text-destructive" />
        <p className="text-muted-foreground">{settled.error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-medium text-primary hover:underline">
          Try again
        </button>
      </div>
    )
  } else if (settled?.results?.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-sm text-muted-foreground">
        <SearchX className="size-5" />
        <p>No places found for “{trimmed}”. Check the spelling or try a nearby city.</p>
      </div>
    )
  } else {
    body = (
      <ul role="listbox" aria-label="Search results">
        {settled?.results?.map((loc) => (
          <li key={loc.id} role="option" aria-selected={loc.id === location.id}>
            <button
              type="button"
              onClick={() => choose(loc)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{loc.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[loc.admin1, loc.country].filter(Boolean).join(", ")}
                </span>
              </span>
              {loc.id === location.id && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div ref={containerRef} className="relative min-w-0" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={formatLocationFull(location)}
        className="flex h-10 max-w-full items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
      >
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="truncate">{formatLocationShort(location)}</span>
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[4.5rem] z-50 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search a city…"
              aria-label="Search for a city"
              className="pl-9"
            />
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto">{body}</div>
        </div>
      )}
    </div>
  )
}