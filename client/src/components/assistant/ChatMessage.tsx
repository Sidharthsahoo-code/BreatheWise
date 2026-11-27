import { Check, CircleCheck, Clock, Info, LoaderCircle, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessageModel, Verdict } from "@/types/assistant"
import { formatDataTime } from "@/utils/formatters"

const VERDICTS: Record<Verdict, { label: string; icon: LucideIcon; chip: string; iconColor: string }> = {
  good: { label: "Good to go", icon: CircleCheck, chip: "bg-aqi-good/15", iconColor: "text-aqi-good" },
  caution: { label: "Take precautions", icon: TriangleAlert, chip: "bg-aqi-sensitive/20", iconColor: "text-aqi-sensitive" },
  avoid: { label: "Best avoided", icon: OctagonAlert, chip: "bg-aqi-unhealthy/15", iconColor: "text-aqi-unhealthy" },
  info: { label: "Good to know", icon: Info, chip: "bg-info/15", iconColor: "text-info" },
}

export function ChatMessage({ message }: { message: ChatMessageModel }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </p>
      </div>
    )
  }

  const { answer, meta } = message
  const verdict = VERDICTS[answer.verdict]
  const Icon = verdict.icon

  return (
    <div className="flex">
      <div className="w-full max-w-[94%] space-y-3 rounded-2xl rounded-bl-md border bg-card p-4 shadow-xs sm:max-w-[88%]">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", verdict.chip)}>
          <Icon className={cn("size-3.5", verdict.iconColor)} />
          {verdict.label}
        </span>

        <p className="text-sm font-semibold leading-snug">{answer.headline}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{answer.explanation}</p>

        {answer.actions.length > 0 && (
          <ul className="space-y-1.5">
            {answer.actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}

        {answer.bestTimeWindow && (
          <p className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            <Clock className="size-4 shrink-0" />
            <span>
              <span className="font-medium">Best window:</span> {answer.bestTimeWindow}
            </span>
          </p>
        )}

        {answer.dataNotes.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {answer.dataNotes.map((note, i) => (
              <li key={i} className="flex gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t pt-2 text-xs text-muted-foreground">
          {meta.locationLabel} · model data from {formatDataTime(meta.dataTime)} (local time)
        </p>
      </div>
    </div>
  )
}

export function ThinkingMessage() {
  return (
    <div className="flex">
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl rounded-bl-md border bg-card px-4 py-3 text-sm text-muted-foreground"
      >
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Checking the latest air quality data…
      </div>
    </div>
  )
}