import { CalendarClock } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function FamilyPlanner() {
  return (
    <EmptyState
      icon={CalendarClock}
      title="Family Routine Planner"
      description="Coming in Phase 4: a daily plan built around your family's routine and today's air."
    />
  )
}