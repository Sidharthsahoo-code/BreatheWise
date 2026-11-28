import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AqiStandard, HourlyPoint } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, AQI_SCALE, LEVELS, getAqiCategory } from "@/utils/aqiUtils"
import { AXIS_TICK } from "@/utils/chartUtils"
import { formatDayHour } from "@/utils/formatters"
import { hourlyValue } from "@/utils/insights"
import { PointTooltip } from "./ChartParts"

interface BarPoint {
  time: string
  value: number | null
  isForecast: boolean
  fill: string
}

interface HourlyBarsProps {
  hourly: HourlyPoint[]
  standard: AqiStandard
  unit: string
}

export function HourlyBars({ hourly, standard, unit }: HourlyBarsProps) {
  const points = useMemo<BarPoint[]>(() => {
    const nowIndex = Math.max(0, hourly.map((h) => h.isForecast).lastIndexOf(false))
    return hourly.slice(nowIndex, nowIndex + 49).map((h) => {
      const value = hourlyValue(h, "aqi", standard)
      const category = getAqiCategory(standard, value)
      return {
        time: h.time,
        value,
        isForecast: h.isForecast,
        fill: category ? AQI_LEVEL_STYLES[category.level].color : "var(--muted)",
      }
    })
  }, [hourly, standard])

  const ticks = points.filter((_, i) => i % 6 === 0).map((p) => p.time)
  const bounds = AQI_SCALE[standard]
  const hasValues = points.some((p) => p.value !== null)

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">Hourly forecast, next 48 hours</CardTitle>
        <CardDescription>
          {unit} for each hour, coloured by category. The first bar is the current hour; the rest are model forecasts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LEVELS.map((level, i) => (
            <li key={level} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-sm", AQI_LEVEL_STYLES[level].dot)} />
              {getAqiCategory(standard, bounds[i])?.label}
            </li>
          ))}
        </ul>

        {hasValues ? (
          <div className="h-64 w-full" role="img" aria-label="Hourly forecast bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} barCategoryGap={1}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  ticks={ticks}
                  tickFormatter={formatDayHour}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} tick={AXIS_TICK} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={(props) => (
                    <PointTooltip
                      point={props.payload?.[0]?.payload as BarPoint | undefined}
                      unit={unit}
                      aqiStandard={standard}
                    />
                  )}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {points.map((p) => (
                    <Cell key={p.time} fill={p.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">No forecast data is available.</p>
        )}
      </CardContent>
    </Card>
  )
}