import { Map as MapIcon } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function PollutionMapPage() {
  return (
    <EmptyState
      icon={MapIcon}
      title="Pollution Map"
      description="Coming in Phase 5: an interactive map for the selected location."
    />
  )
}