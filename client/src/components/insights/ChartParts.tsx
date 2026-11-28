import { cn } from "@/lib/utils"
import type { AqiStandard } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getAqiCategory } from "@/utils/aqiUtils"
import { formatDayHour } from "@/utils/formatters"

interface PointTooltipProps {
  point?: { time: string; value: number | null; isForecast: boolean }
  unit: string
  // When given, the AQI category for that standard is shown
  aqiStandard?: AqiStandard
}

export function PointTooltip({ point, unit, aqiStandard }: PointTooltipProps) {
  if (!point || point.value === null) return null
  const category = aqiStandard ? getAqiCategory(aqiStandard, point.value) : null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{formatDayHour(point.time)}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {point.value} <span className="font-normal text-muted-foreground">{unit}</span>
      </p>
      {category && (
        <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <span className={cn("size-2 rounded-full", AQI_LEVEL_STYLES[category.level].dot)} />
          {category.label}
        </p>
      )}
      <p className="mt-1 text-muted-foreground">{point.isForecast ? "Model forecast" : "Model analysis (past)"}</p>
    </div>
  )
}

export function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-6 rounded bg-chart-2" />
        Past hours (model analysis)
      </span>
      <span className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-chart-1" />
        Forecast (model)
      </span>
    </div>
  )
}