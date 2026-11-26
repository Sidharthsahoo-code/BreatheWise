import { House } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function IndoorAir() {
  return (
    <EmptyState
      icon={House}
      title="Indoor Air Advisor"
      description="Coming in Phase 4: a home assessment with a prioritized improvement checklist."
    />
  )
}