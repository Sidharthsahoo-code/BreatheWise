import { ChartColumn } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function Insights() {
  return (
    <EmptyState
      icon={ChartColumn}
      title="Insights"
      description="Coming in Phase 5: trends, pollutant comparisons and daily summaries."
    />
  )
}