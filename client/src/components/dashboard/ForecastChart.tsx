import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AirQualityForecast, AqiStandard, HourlyPoint } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getAqiCategory } from "@/utils/aqiUtils"
import { formatDayHour } from "@/utils/formatters"

type Metric = "aqi" | "pm2_5" | "pm10"

interface ChartPoint {
  time: string
  value: number | null
  past: number | null
  forecast: number | null
  isForecast: boolean
}

function valueOf(h: HourlyPoint, metric: Metric, standard: AqiStandard): number | null {
  if (metric === "aqi") return standard === "us" ? h.usAqi : h.europeanAqi
  return h[metric]
}

function buildSeries(hourly: HourlyPoint[], metric: Metric, standard: AqiStandard) {
  const nowIndex = hourly.map((h) => h.isForecast).lastIndexOf(false)
  const start = Math.max(0, nowIndex - 24)

  const points: ChartPoint[] = hourly.slice(start).map((h, i) => {
    const value = valueOf(h, metric, standard)
    return {
      time: h.time,
      value,
      isForecast: h.isForecast,
      past: h.isForecast ? null : value,
      // The current hour belongs to both lines so they join without a gap
      forecast: h.isForecast || start + i === nowIndex ? value : null,
    }
  })

  return { points, nowTime: nowIndex >= 0 ? hourly[nowIndex].time : null }
}

interface TooltipBodyProps {
  point?: ChartPoint
  metric: Metric
  standard: AqiStandard
  unit: string
}

function TooltipBody({ point, metric, standard, unit }: TooltipBodyProps) {
  if (!point || point.value === null) return null
  const category = metric === "aqi" ? getAqiCategory(standard, point.value) : null

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

interface ForecastChartProps {
  forecast: AirQualityForecast
  standard: AqiStandard
}

export function ForecastChart({ forecast, standard }: ForecastChartProps) {
  const [metric, setMetric] = useState<Metric>("aqi")

  const { points, nowTime } = useMemo(
    () => buildSeries(forecast.hourly, metric, standard),
    [forecast.hourly, metric, standard]
  )

  const unit = metric === "aqi" ? forecast.standards[standard].name : "µg/m³"
  const ticks = points.filter((_, i) => i % 12 === 0).map((p) => p.time)
  const hasValues = points.some((p) => p.value !== null)

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Hourly outlook</CardTitle>
          <CardDescription>Last 24 hours and the hours ahead, in {unit}</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList>
            <TabsTrigger value="aqi">AQI</TabsTrigger>
            <TabsTrigger value="pm2_5">PM2.5</TabsTrigger>
            <TabsTrigger value="pm10">PM10</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-3">
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

        {hasValues ? (
          <div className="h-64 w-full sm:h-72" role="img" aria-label={`Hourly ${metric} chart, past and forecast`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  ticks={ticks}
                  tickFormatter={formatDayHour}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  width={44}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={(props) => (
                    <TooltipBody
                      point={props.payload?.[0]?.payload as ChartPoint | undefined}
                      metric={metric}
                      standard={standard}
                      unit={unit}
                    />
                  )}
                />
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
          <p className="py-16 text-center text-sm text-muted-foreground">No hourly data is available for this metric.</p>
        )}

        <p className="text-xs text-muted-foreground">
          Both lines are modelled values from the Copernicus CAMS model, not station readings.
        </p>
      </CardContent>
    </Card>
  )
}