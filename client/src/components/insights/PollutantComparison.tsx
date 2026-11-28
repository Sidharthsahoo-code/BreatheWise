import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PollutantReading } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getGuidelineLevel } from "@/utils/aqiUtils"
import { AXIS_TICK } from "@/utils/chartUtils"
import { formatConcentration } from "@/utils/formatters"

interface Row {
  name: string
  ratio: number
  value: number
  unit: string
  fill: string
}

export function PollutantComparison({ pollutants }: { pollutants: PollutantReading[] }) {
  const rows: Row[] = []
  for (const p of pollutants) {
    if (p.value === null || p.ratioToGuideline === null) continue
    rows.push({
      name: p.label,
      ratio: p.ratioToGuideline,
      value: p.value,
      unit: p.unit,
      fill: AQI_LEVEL_STYLES[getGuidelineLevel(p.ratioToGuideline)].color,
    })
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">Pollutants against WHO guidelines</CardTitle>
        <CardDescription>
          Each bar shows how many times the current model value exceeds the WHO 2021 guideline level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length > 0 ? (
          <div style={{ height: rows.length * 44 + 48 }} role="img" aria-label="Pollutant comparison chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  domain={[0, (max: number) => Math.max(2, Math.ceil(max))]}
                  tickFormatter={(v: number) => `${v}×`}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                />
                <YAxis type="category" dataKey="name" width={52} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={(props) => {
                    const row = props.payload?.[0]?.payload as Row | undefined
                    if (!row) return null
                    return (
                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{row.name}</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                          {formatConcentration(row.value)} <span className="font-normal text-muted-foreground">{row.unit}</span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {row.ratio.toLocaleString(undefined, { maximumFractionDigits: 1 })}× the WHO guideline
                        </p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine
                  x={1}
                  stroke="var(--foreground)"
                  strokeDasharray="4 4"
                  label={{ value: "WHO guideline", position: "top", fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {rows.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No pollutant values are available.</p>
        )}

        <p className="text-xs text-muted-foreground">
          The guidelines are 24-hour averages (8-hour for O₃) while these are current hourly model values, so the
          comparison is indicative, not a compliance check.
        </p>
      </CardContent>
    </Card>
  )
}