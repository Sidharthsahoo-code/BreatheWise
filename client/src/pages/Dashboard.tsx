import { CloudOff } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { AQIOverview } from "@/components/dashboard/AQIOverview"
import { ForecastChart } from "@/components/dashboard/ForecastChart"
import { PollutantCards } from "@/components/dashboard/PollutantCards"
import { QuickAccess } from "@/components/dashboard/QuickAccess"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AqiStandard } from "@/types/airQuality"
import { formatLocationShort } from "@/utils/formatters"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading air quality data">
      <Skeleton className="h-60 w-full rounded-2xl lg:h-52" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}

export default function Dashboard() {
  const { location, airQuality, aqiStandard, setAqiStandard } = useApp()
  const { current, forecast, loading, error, retry } = airQuality

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={retry} />
  } else if (loading || !current || !forecast) {
    content = <DashboardSkeleton />
  } else if (!current.dataAvailable) {
    content = (
      <EmptyState
        icon={CloudOff}
        title="No air quality data here"
        description="The model has no data for this exact spot (open water, for example). Try a nearby city."
      />
    )
  } else {
    content = (
      <div className="space-y-6">
        <AQIOverview data={current} standard={aqiStandard} />
        <PollutantCards pollutants={current.pollutants} />
        <ForecastChart forecast={forecast} standard={aqiStandard} />
        <QuickAccess />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Air quality in {formatLocationShort(location)}
          </h1>
        </div>
        <Tabs value={aqiStandard} onValueChange={(v) => setAqiStandard(v as AqiStandard)}>
          <TabsList aria-label="AQI standard">
            <TabsTrigger value="us">US AQI</TabsTrigger>
            <TabsTrigger value="european">European AQI</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {content}
    </div>
  )
}