import { DailyPlan } from "@/components/planner/DailyPlan"
import { DailyRoutine } from "@/components/planner/DailyRoutine"
import { FamilyProfile } from "@/components/planner/FamilyProfile"
import { useRoutine } from "@/hooks/useRoutine"

export default function FamilyPlanner() {
  const { activities, setActivities } = useRoutine()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Family Routine Planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us who is in your household and what your day looks like, and we&apos;ll time it around the air.
        </p>
      </div>

      <FamilyProfile />
      <DailyRoutine activities={activities} onChange={setActivities} />
      <DailyPlan activities={activities} />
    </div>
  )
}