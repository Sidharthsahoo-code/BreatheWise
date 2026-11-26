import { Sparkles } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function AIAdvisor() {
  return (
    <EmptyState
      icon={Sparkles}
      title="AI Air Assistant"
      description="Coming in Phase 4: ask Gemini about your air, using live data for the selected city."
    />
  )
}