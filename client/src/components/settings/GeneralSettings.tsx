import { Gauge, MapPin, SlidersHorizontal } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AqiStandard } from "@/types/airQuality"
import { AQI_LEVEL_STYLES, AQI_SCALE, LEVELS, getAqiCategory } from "@/utils/aqiUtils"
import { formatLocationFull } from "@/utils/formatters"
import { SettingRow, SettingsCard } from "./SettingRow"

export function GeneralSettings() {
  const { location, aqiStandard, setAqiStandard } = useApp()
  const bounds = AQI_SCALE[aqiStandard]

  return (
    <div className="space-y-6">
      <SettingsCard icon={SlidersHorizontal} title="Air quality" description="How air quality is shown across the app.">
        <SettingRow
          label="AQI standard"
          description="Used on the dashboard, map and charts. Neither scale is the Indian CPCB AQI."
        >
          <Tabs value={aqiStandard} onValueChange={(v) => setAqiStandard(v as AqiStandard)}>
            <TabsList aria-label="AQI standard">
              <TabsTrigger value="us">US AQI</TabsTrigger>
              <TabsTrigger value="european">European AQI</TabsTrigger>
            </TabsList>
          </Tabs>
        </SettingRow>

        <SettingRow label="Location" description="Change it from the location menu in the top bar.">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" />
            {formatLocationFull(location)}
          </span>
        </SettingRow>

        <SettingRow label="Timezone" description="Forecast times are shown in the selected city's local time.">
          <span>{location.timezone ?? "Taken from the model data"}</span>
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        icon={Gauge}
        title="Scale reference"
        description={aqiStandard === "us" ? "US AQI (US EPA scale)" : "European AQI (European Environment Agency scale)"}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level, i) => {
            const lower = i === 0 ? 0 : bounds[i - 1] + 1
            const range = i === LEVELS.length - 1 ? `${lower}+` : `${lower}–${bounds[i]}`
            return (
              <li key={level} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                <span className={cn("size-3 shrink-0 rounded-full", AQI_LEVEL_STYLES[level].dot)} />
                <span className="min-w-0 text-sm">
                  <span className="block font-medium">{getAqiCategory(aqiStandard, bounds[i])?.label}</span>
                  <span className="block text-xs tabular-nums text-muted-foreground">{range}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </SettingsCard>
    </div>
  )
}