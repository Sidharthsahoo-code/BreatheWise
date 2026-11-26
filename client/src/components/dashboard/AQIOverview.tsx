import { Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AqiStandard, CurrentAirQuality } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, AQI_LEVEL_SUMMARY, AQI_SCALE, LEVELS } from "@/utils/aqiUtils"
import { formatDataTime } from "@/utils/formatters"

function AqiGauge({ standard, value }: { standard: AqiStandard; value: number }) {
  const bounds = AQI_SCALE[standard]
  const max = bounds[bounds.length - 1]
  const marker = (Math.min(Math.max(value, 0), max) / max) * 100

  return (
    <div className="px-2.5" aria-hidden="true">
      <div className="relative flex h-5 items-center">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {LEVELS.map((level, i) => (
            <div
              key={level}
              className={AQI_LEVEL_STYLES[level].dot}
              style={{ width: `${((bounds[i] - (bounds[i - 1] ?? 0)) / max) * 100}%` }}
            />
          ))}
        </div>
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-foreground shadow-md"
          style={{ left: `${marker}%` }}
        />
      </div>
    </div>
  )
}

interface AQIOverviewProps {
  data: CurrentAirQuality
  standard: AqiStandard
}

export function AQIOverview({ data, standard }: AQIOverviewProps) {
  const reading = data.aqi[standard]
  const info = data.standards[standard]
  const category = reading.category
  const style = category ? AQI_LEVEL_STYLES[category.level] : null

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="flex items-start gap-5">
          <div
            className={cn(
              "flex size-28 shrink-0 flex-col items-center justify-center rounded-3xl border",
              style ? [style.soft, style.border] : "bg-muted"
            )}
          >
            <span className="font-heading text-5xl font-bold tabular-nums leading-none">{reading.value ?? "—"}</span>
            <span className="mt-1.5 text-xs font-medium text-muted-foreground">{info.name}</span>
          </div>

          <div className="min-w-0">
            {category && style ? (
              <>
                <span
                  className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold", style.soft)}
                >
                  <span className={cn("size-2 rounded-full", style.dot)} />
                  {category.label}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{AQI_LEVEL_SUMMARY[category.level]}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No {info.name} value is available for this location right now.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {reading.value !== null && <AqiGauge standard={standard} value={reading.value} />}

          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {info.name} <span className="font-normal text-muted-foreground">· {info.body}</span>
            </p>
            <p className="text-muted-foreground">{info.notice}</p>
            <p className="text-muted-foreground">
              Last updated {formatDataTime(data.dataTime)} · local time ({data.location.timezone})
            </p>
          </div>

          <div className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>{data.source.note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}