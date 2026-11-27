import {
  Clock,
  CookingPot,
  Fan,
  Flame,
  Info,
  Lightbulb,
  ListChecks,
  SprayCan,
  Wind,
  type LucideIcon,
} from "lucide-react"
import { useApp } from "@/context/AppContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { AiResult, IndoorAdvice, IndoorChecklistItem, Priority } from "@/types/assistant"
import { AQI_LEVEL_STYLES } from "@/utils/aqiUtils"
import { formatDataTime } from "@/utils/formatters"

const PRIORITY: Record<Priority, { label: string; chip: string }> = {
  high: { label: "High priority", chip: "bg-aqi-unhealthy/15" },
  medium: { label: "Medium", chip: "bg-aqi-sensitive/20" },
  low: { label: "Low", chip: "bg-aqi-good/15" },
}

const EFFORT: Record<IndoorChecklistItem["effort"], string> = {
  low: "Quick",
  medium: "Some effort",
  high: "Bigger job",
}

const CATEGORY_ICON: Record<IndoorChecklistItem["category"], LucideIcon> = {
  ventilation: Wind,
  cooking: CookingPot,
  cleaning: SprayCan,
  purifier: Fan,
  sources: Flame,
  other: Lightbulb,
}

function TipCard({ icon: Icon, title, tips }: { icon: LucideIcon; title: string; tips: string[] }) {
  if (tips.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4.5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-relaxed">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

interface IndoorRecommendationsProps {
  result: AiResult<IndoorAdvice>
  checked: number[]
  onToggle: (index: number) => void
  stale: boolean
}

export function IndoorRecommendations({ result, checked, onToggle, stale }: IndoorRecommendationsProps) {
  const { airQuality, aqiStandard } = useApp()
  const { data, meta } = result

  // The live outdoor reading belongs to the current city, so skip it when the plan is for another one
  const outdoor = !stale ? airQuality.current?.aqi[aqiStandard] : undefined
  const standardName = airQuality.current?.standards[aqiStandard].name
  const outdoorStyle = outdoor?.category ? AQI_LEVEL_STYLES[outdoor.category.level] : null
  const doneCount = data.checklist.filter((_, i) => checked.includes(i)).length

  return (
    <div className={cn("space-y-4", stale && "opacity-60")}>
      <Card className="border-primary/20 bg-accent/40">
        <CardContent>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base">
            <span className="flex items-center gap-2">
              <Wind className="size-4.5 text-primary" />
              Ventilation guidance
            </span>
            {outdoor && outdoor.value !== null && outdoor.category && outdoorStyle && (
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", outdoorStyle.soft)}>
                <span className={cn("size-2 rounded-full", outdoorStyle.dot)} />
                Outdoor now: {standardName} {outdoor.value} · {outdoor.category.label}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{data.ventilation.guidance}</p>
          {data.ventilation.bestWindowTimes ? (
            <p className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              <Clock className="size-4 shrink-0" />
              <span>
                <span className="font-medium">Best time to open windows:</span> {data.ventilation.bestWindowTimes}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              No clearly better window in today&apos;s forecast.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <ListChecks className="size-4.5 text-primary" />
              Your improvement checklist
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {doneCount} of {data.checklist.length} done
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {data.checklist.map((item, i) => {
              const done = checked.includes(i)
              const Icon = CATEGORY_ICON[item.category]
              return (
                <li
                  key={i}
                  className={cn("flex gap-3 rounded-xl border bg-background p-3.5 transition-opacity", done && "opacity-60")}
                >
                  <Checkbox id={`todo-${i}`} checked={done} onCheckedChange={() => onToggle(i)} className="mt-0.5" />
                  <label htmlFor={`todo-${i}`} className="min-w-0 flex-1 cursor-pointer space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      <span className={cn("text-sm font-semibold", done && "line-through")}>{item.title}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY[item.priority].chip)}>
                        {PRIORITY[item.priority].label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {EFFORT[item.effort]}
                      </span>
                    </span>
                    <span className="block text-sm leading-relaxed text-muted-foreground">{item.detail}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <TipCard icon={CookingPot} title="Cooking smoke" tips={data.cookingTips} />
        <TipCard icon={SprayCan} title="Dust and cleaning" tips={data.dustAndCleaning} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fan className="size-4.5 text-primary" />
            Air purifier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{data.purifierGuidance}</p>
        </CardContent>
      </Card>

      {data.dataNotes.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {data.dataNotes.map((note, i) => (
            <li key={i} className="flex gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t pt-3 text-xs text-muted-foreground">
        AI-generated from your answers and outdoor model data for {meta.locationLabel}, {formatDataTime(meta.dataTime)}{" "}
        (local time). It does not measure indoor air quality. General guidance, not medical advice.
      </p>
    </div>
  )
}