import { CalendarClock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  ACTIVITY_TYPES,
  DURATIONS,
  MAX_ACTIVITIES,
  type ActivityType,
  type RoutineActivity,
} from "@/types/family"

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

interface DailyRoutineProps {
  activities: RoutineActivity[]
  onChange: (activities: RoutineActivity[]) => void
}

export function DailyRoutine({ activities, onChange }: DailyRoutineProps) {
  const full = activities.length >= MAX_ACTIVITIES

  const update = (id: string, patch: Partial<Omit<RoutineActivity, "id">>) =>
    onChange(activities.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const remove = (id: string) => onChange(activities.filter((a) => a.id !== id))

  const add = (type: ActivityType) => {
    const template = ACTIVITY_TYPES.find((t) => t.value === type)
    if (!template || full) return
    onChange([
      ...activities,
      {
        id: crypto.randomUUID(),
        type,
        label: "",
        startTime: template.startTime,
        durationMinutes: template.durationMinutes,
        flexible: true,
      },
    ])
  }

  const onTimeChange = (id: string, value: string) => {
    // A time input reports an empty value while it is being edited, so only accept complete times
    if (TIME.test(value)) update(id, { startTime: value })
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="size-5 text-primary" />
          Daily routine
        </CardTitle>
        <CardDescription>
          Add what your family does outdoors or on the road. Mark an activity as flexible if its time can move.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {activities.length > 0 && (
          <ul className="space-y-2">
            {activities.map((a, i) => (
              <li key={a.id} className="space-y-3 rounded-xl border bg-background p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="sm:w-56">
                    <Label htmlFor={`type-${a.id}`} className="sr-only">
                      Activity type {i + 1}
                    </Label>
                    <Select value={a.type} onValueChange={(v) => update(a.id, { type: v as ActivityType })}>
                      <SelectTrigger id={`type-${a.id}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`label-${a.id}`} className="sr-only">
                      Activity name {i + 1}
                    </Label>
                    <Input
                      id={`label-${a.id}`}
                      value={a.label}
                      maxLength={60}
                      placeholder="Optional name, e.g. Walk in the park"
                      onChange={(e) => update(a.id, { label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`time-${a.id}`} className="text-xs text-muted-foreground">
                      Starts
                    </Label>
                    <Input
                      id={`time-${a.id}`}
                      type="time"
                      value={a.startTime}
                      onChange={(e) => onTimeChange(a.id, e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`duration-${a.id}`} className="text-xs text-muted-foreground">
                      Duration
                    </Label>
                    <Select
                      value={String(a.durationMinutes)}
                      onValueChange={(v) => update(a.id, { durationMinutes: Number(v) })}
                    >
                      <SelectTrigger id={`duration-${a.id}`} className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      id={`flexible-${a.id}`}
                      checked={a.flexible}
                      onCheckedChange={(checked) => update(a.id, { flexible: checked })}
                    />
                    <Label htmlFor={`flexible-${a.id}`} className="text-sm font-normal">
                      Time is flexible
                    </Label>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    aria-label={`Remove activity ${i + 1}`}
                    onClick={() => remove(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">{activities.length === 0 ? "Start with an activity" : "Add another"}</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((t) => (
              <Button key={t.value} variant="outline" size="sm" disabled={full} onClick={() => add(t.value)}>
                <Plus className="size-3.5" />
                {t.label}
              </Button>
            ))}
          </div>
          {full && <p className="text-xs text-muted-foreground">You can plan up to {MAX_ACTIVITIES} activities.</p>}
        </div>
      </CardContent>
    </Card>
  )
}