import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AqiStandard, HourlyPoint } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, AQI_SCALE, LEVELS } from "@/utils/aqiUtils"
import { AXIS_TICK, buildTrendSeries, formatTickDay, tickStep, type ChartPoint } from "@/utils/chartUtils"
import { formatDayHour } from "@/utils/formatters"
import { hourlyValue, type Metric } from "@/utils/insights"
import { ChartLegend, PointTooltip } from "./ChartParts"

interface TrendChartProps {
  title: string
  description: string
  hourly: HourlyPoint[]
  metric: Metric
  standard: AqiStandard
  unit: string
  historyHours: number
  guideline?: { value: number; label: string }
  showBands?: boolean
}

export function TrendChart({
  title,
  description,
  hourly,
  metric,
  standard,
  unit,
  historyHours,
  guideline,
  showBands,
}: TrendChartProps) {
  const { points, nowTime } = useMemo(
    () => buildTrendSeries(hourly, (h) => hourlyValue(h, metric, standard), historyHours),
    [hourly, metric, standard, historyHours]
  )

  const step = tickStep(points.length)
  const ticks = points.filter((_, i) => i % step === 0).map((p) => p.time)
  const bounds = AQI_SCALE[standard]
  const hasValues = points.some((p) => p.value !== null)

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartLegend />

        {hasValues ? (
          <div className="h-64 w-full" role="img" aria-label={`${title} chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
                {showBands &&
                  LEVELS.map((level, i) => (
                    <ReferenceArea
                      key={level}
                      y1={bounds[i - 1] ?? 0}
                      y2={bounds[i]}
                      fill={AQI_LEVEL_STYLES[level].color}
                      fillOpacity={0.09}
                      ifOverflow="hidden"
                    />
                  ))}
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  ticks={ticks}
                  tickFormatter={step >= 24 ? formatTickDay : formatDayHour}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} domain={[0, "auto"]} width={44} tick={AXIS_TICK} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={(props) => (
                    <PointTooltip
                      point={props.payload?.[0]?.payload as ChartPoint | undefined}
                      unit={unit}
                      aqiStandard={metric === "aqi" ? standard : undefined}
                    />
                  )}
                />
                {guideline && (
                  <ReferenceLine
                    y={guideline.value}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{ value: guideline.label, position: "insideTopRight", fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                )}
                {nowTime && (
                  <ReferenceLine
                    x={nowTime}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="2 3"
                    label={{ value: "Now", position: "top", fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                )}
                <Line type="monotone" dataKey="past" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} connectNulls={false} />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">No data is available for this chart.</p>
        )}
      </CardContent>
    </Card>
  )
}