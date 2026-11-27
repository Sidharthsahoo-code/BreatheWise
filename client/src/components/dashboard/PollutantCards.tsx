import { cn } from "@/lib/utils"
import type { PollutantKey, PollutantReading } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, getGuidelineLevel } from "@/utils/aqiUtils"
import { formatConcentration } from "@/utils/formatters"

const ABOUT: Record<PollutantKey, string> = {
  pm2_5: "Fine particles that can reach deep into the lungs. Come from traffic, burning and industry.",
  pm10: "Coarser dust and particles from roads, construction and burning.",
  no2: "A gas mostly produced by traffic and fuel combustion.",
  so2: "A gas from burning coal and oil in industry and power generation.",
  o3: "Forms in sunlight from other pollutants and often peaks in the afternoon.",
  co: "A colourless gas from incomplete combustion, such as traffic and cooking fires.",
}

function PollutantCard({ pollutant }: { pollutant: PollutantReading }) {
  const { label, value, unit, ratioToGuideline: ratio, key } = pollutant
  const style = ratio !== null ? AQI_LEVEL_STYLES[getGuidelineLevel(ratio)] : null

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        {style && <span className={cn("size-2 rounded-full", style.dot)} />}
      </div>

      <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
        {formatConcentration(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{value === null ? "" : unit}</span>
      </p>

      {ratio !== null && style ? (
        <>
          <div className="relative mt-3 h-1.5 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", style.dot)}
              style={{ width: `${(Math.min(ratio, 4) / 4) * 100}%` }}
            />
            <div className="absolute left-1/4 top-[-3px] h-[calc(100%+6px)] w-px bg-foreground/40" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ratio <= 1
              ? "Within WHO guideline"
              : `${ratio.toLocaleString(undefined, { maximumFractionDigits: 1 })}× WHO guideline`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No data available</p>
      )}

      <p className="mt-3 hidden text-xs leading-relaxed text-muted-foreground sm:block">{ABOUT[key]}</p>
    </div>
  )
}

export function PollutantCards({ pollutants }: { pollutants: PollutantReading[] }) {
  return (
    <section aria-labelledby="pollutants-heading" className="space-y-3">
      <h2 id="pollutants-heading" className="text-lg font-semibold">
        Pollutants
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {pollutants.map((p) => (
          <PollutantCard key={p.key} pollutant={p} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Bars compare the current hourly model value with the WHO 2021 guideline level (the tick marks 1×). The
        guidelines are 24-hour averages (8-hour for O₃), so this is an indicative comparison, not a compliance check.
      </p>
    </section>
  )
}