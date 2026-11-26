import { Link } from "react-router-dom"
import { ArrowRight, CalendarClock, ChartColumn, House, Map as MapIcon, Sparkles, type LucideIcon } from "lucide-react"

const ITEMS: Array<{ to: string; title: string; description: string; icon: LucideIcon }> = [
  { to: "/assistant", title: "AI Air Assistant", description: "Ask if it's a good time to go out.", icon: Sparkles },
  { to: "/planner", title: "Family Planner", description: "Plan the day around the air.", icon: CalendarClock },
  { to: "/indoor", title: "Indoor Air Advisor", description: "Improve the air at home.", icon: House },
  { to: "/map", title: "Pollution Map", description: "Explore any location.", icon: MapIcon },
  { to: "/insights", title: "Insights", description: "Trends and daily summaries.", icon: ChartColumn },
]

export function QuickAccess() {
  return (
    <section aria-labelledby="quick-access-heading" className="space-y-3">
      <h2 id="quick-access-heading" className="text-lg font-semibold">
        Explore
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ITEMS.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4.5" />
            </div>
            <h3 className="mt-3 flex items-center justify-between text-sm font-semibold">
              {title}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}