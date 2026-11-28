import { CircleCheck, CircleX, LoaderCircle, RefreshCw, Server, TriangleAlert, type LucideIcon } from "lucide-react"
import { useApiHealth } from "@/hooks/useApiHealth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SettingRow, SettingsCard } from "./SettingRow"

type Tone = "ok" | "warn" | "error" | "pending"

const TONE_STYLES: Record<Tone, string> = {
  ok: "bg-aqi-good/15",
  warn: "bg-aqi-sensitive/20",
  error: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
}

const TONE_ICONS: Record<Tone, LucideIcon> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  error: CircleX,
  pending: LoaderCircle,
}

function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const Icon = TONE_ICONS[tone]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", TONE_STYLES[tone])}>
      <Icon
        className={cn(
          "size-3.5",
          tone === "ok" && "text-aqi-good",
          tone === "warn" && "text-aqi-sensitive",
          tone === "pending" && "animate-spin"
        )}
      />
      {label}
    </span>
  )
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ${minutes % 60} min`
  return `${Math.floor(hours / 24)} d ${hours % 24} h`
}

export function SystemStatus() {
  const { health, error, loading, responseMs, checkedAt, recheck } = useApiHealth()
  const apiUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

  const backend: { tone: Tone; label: string } = loading
    ? { tone: "pending", label: "Checking" }
    : error || !health
      ? { tone: "error", label: "Unreachable" }
      : health.status === "ok"
        ? { tone: "ok", label: "Operational" }
        : { tone: "warn", label: "Degraded" }

  const ai: { tone: Tone; label: string } = loading
    ? { tone: "pending", label: "Checking" }
    : !health
      ? { tone: "error", label: "Unavailable" }
      : health.geminiConfigured
        ? { tone: "ok", label: "Configured" }
        : { tone: "warn", label: "Not configured" }

  const wokeUp = health !== null && responseMs !== null && responseMs > 4000

  return (
    <div className="space-y-4" aria-live="polite">
      <SettingsCard icon={Server} title="System status" description="A live check of the backend API and the AI service.">
        <SettingRow label="Backend API" description={apiUrl}>
          <StatusBadge {...backend} />
        </SettingRow>

        <SettingRow label="AI assistant" description="Google Gemini, called from the server so keys never reach your browser.">
          <StatusBadge {...ai} />
        </SettingRow>

        <SettingRow
          label="Response time"
          description={wokeUp ? "Slow because the free-tier server was waking up." : "How long this check took."}
        >
          <span className="tabular-nums">{responseMs === null ? "—" : `${responseMs.toLocaleString()} ms`}</span>
        </SettingRow>

        <SettingRow label="Environment" description="The mode the backend is running in.">
          <span>{health?.environment ?? "—"}</span>
        </SettingRow>

        <SettingRow label="Server uptime" description="Resets whenever the server restarts or wakes from sleep.">
          <span className="tabular-nums">{health ? formatUptime(health.uptimeSeconds) : "—"}</span>
        </SettingRow>

        <SettingRow label="Last checked" description="Press re-check to run it again.">
          <span className="tabular-nums">
            {checkedAt
              ? checkedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })
              : "—"}
          </span>
        </SettingRow>
      </SettingsCard>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading && (
        <p role="status" className="text-xs text-muted-foreground">
          Contacting the API. A sleeping free-tier server can take up to a minute to wake.
        </p>
      )}

      <Button variant="outline" size="sm" onClick={recheck} disabled={loading}>
        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        Re-check
      </Button>
    </div>
  )
}