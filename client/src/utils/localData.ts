const PREFIX = "breathewise."

export interface InventoryItem {
  id: string
  label: string
  summary: string | null
  scope: "device" | "tab"
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function readJson(store: Storage, key: string): unknown {
  try {
    const raw = store.getItem(PREFIX + key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

// A readable summary of what BreatheWise has saved in this browser
export function getInventory(): InventoryItem[] {
  try {
    const location = readJson(localStorage, "location") as { name?: string; country?: string | null } | null
    const family = readJson(localStorage, "family") as { members?: unknown[] } | null
    const routine = readJson(localStorage, "routine")
    const indoor = readJson(localStorage, "indoor")
    const chat = readJson(sessionStorage, "chat")
    const generated = ["plan", "indoorPlan", "recommendations"].filter(
      (key) => readJson(sessionStorage, key) !== null
    ).length

    return [
      {
        id: "location",
        label: "Selected city",
        summary: typeof location?.name === "string" ? [location.name, location.country].filter(Boolean).join(", ") : null,
        scope: "device",
      },
      {
        id: "family",
        label: "Household",
        summary: family?.members?.length ? `${count(family.members.length, "member", "members")}, age groups only` : null,
        scope: "device",
      },
      {
        id: "routine",
        label: "Daily routine",
        summary: Array.isArray(routine) && routine.length > 0 ? count(routine.length, "activity", "activities") : null,
        scope: "device",
      },
      { id: "indoor", label: "Home assessment", summary: indoor !== null ? "Answers saved" : null, scope: "device" },
      {
        id: "chat",
        label: "Chat history",
        summary: Array.isArray(chat) && chat.length > 0 ? count(chat.length, "message", "messages") : null,
        scope: "tab",
      },
      {
        id: "generated",
        label: "Generated plans",
        summary: generated > 0 ? count(generated, "saved result", "saved results") : null,
        scope: "tab",
      },
    ]
  } catch {
    return []
  }
}

function keysOf(store: Storage): string[] {
  try {
    return Object.keys(store).filter((key) => key.startsWith(PREFIX))
  } catch {
    return []
  }
}

export function exportLocalData(): void {
  const collect = (store: Storage) => {
    const entries: Record<string, unknown> = {}
    for (const key of keysOf(store)) {
      const raw = store.getItem(key)
      try {
        entries[key.slice(PREFIX.length)] = raw === null ? null : JSON.parse(raw)
      } catch {
        entries[key.slice(PREFIX.length)] = raw
      }
    }
    return entries
  }

  let payload: unknown
  try {
    payload = {
      app: "BreatheWise",
      exportedAt: new Date().toISOString(),
      savedOnDevice: collect(localStorage),
      savedForThisTab: collect(sessionStorage),
    }
  } catch {
    return
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "breathewise-data.json"
  link.click()
  URL.revokeObjectURL(url)
}

export function clearLocalData(): void {
  for (const getStore of [() => localStorage, () => sessionStorage]) {
    try {
      const store = getStore()
      keysOf(store).forEach((key) => store.removeItem(key))
    } catch {
      /* storage unavailable: nothing to clear */
    }
  }
  window.location.reload()
}