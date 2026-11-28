import { cn } from "@/lib/utils"
import type { AqiStandard } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getAqiCategory } from "@/utils/aqiUtils"
import { formatDay, formatHour } from "@/utils/formatters"
import type { DaySummary } from "@/utils/insights"

const KIND: Record<DaySummary["kind"], { label: string; chip: string }> = {
  past: { label: "Model analysis", chip: "bg-muted text-muted-foreground" },
  today: { label: "Today", chip: "bg-accent text-accent-foreground" },
  forecast: { label: "Forecast", chip: "border border-dashed border-primary/50 text-primary" },
}

interface DailySummariesProps {
  days: DaySummary[]
  standard: AqiStandard
  standardName: string
}

export function DailySummaries({ days, standard, standardName }: DailySummariesProps) {
  return (
    <section aria-labelledby="daily-heading" className="space-y-3">
      <div>
        <h2 id="daily-heading" className="text-lg font-semibold">
          Daily summaries
        </h2>
        <p className="text-sm text-muted-foreground">
          {standardName} per day, from hourly model values. Dashed cards are forecasts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day) => {
          const category = getAqiCategory(standard, day.avg)
          const style = category ? AQI_LEVEL_STYLES[category.level] : null
          const kind = KIND[day.kind]

          return (
            <div
              key={day.date}
              className={cn("space-y-3 rounded-2xl border bg-card p-4 shadow-xs", day.kind === "forecast" && "border-dashed")}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{formatDay(day.date)}</h3>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", kind.chip)}>{kind.label}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-heading text-3xl font-bold tabular-nums">{day.avg ?? "—"}</span>
                <div className="text-xs text-muted-foreground">
                  <p>Average {standardName}</p>
                  {category && style && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-foreground">
                      <span className={cn("size-2 rounded-full", style.dot)} />
                      {category.label}
                    </p>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
                <dt className="text-muted-foreground">Peak</dt>
                <dd className="text-right tabular-nums">
                  {day.max ? `${day.max.value} at ${formatHour(day.max.time)}` : "—"}
                </dd>
                <dt className="text-muted-foreground">Lowest</dt>
                <dd className="text-right tabular-nums">
                  {day.min ? `${day.min.value} at ${formatHour(day.min.time)}` : "—"}
                </dd>
                <dt className="text-muted-foreground">PM2.5 average</dt>
                <dd className="text-right tabular-nums">{day.pm2_5Avg === null ? "—" : `${day.pm2_5Avg} µg/m³`}</dd>
                <dt className="text-muted-foreground">PM10 average</dt>
                <dd className="text-right tabular-nums">{day.pm10Avg === null ? "—" : `${day.pm10Avg} µg/m³`}</dd>
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}