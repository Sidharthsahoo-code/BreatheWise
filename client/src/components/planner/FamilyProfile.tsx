import { Plus, ShieldCheck, Trash2, Users } from "lucide-react"
import { useFamilyProfile } from "@/hooks/useFamilyProfile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AGE_GROUPS, MAX_MEMBERS, type AgeGroup, type FamilyMember } from "@/types/family"

export function FamilyProfile() {
  const { profile, setProfile } = useFamilyProfile()
  const { members } = profile

  const update = (id: string, patch: Partial<Pick<FamilyMember, "ageGroup" | "sensitive">>) =>
    setProfile({ members: members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

  const add = () =>
    setProfile({ members: [...members, { id: crypto.randomUUID(), ageGroup: "adult", sensitive: false }] })

  const remove = (id: string) => setProfile({ members: members.filter((m) => m.id !== id) })

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5 text-primary" />
          Your household
        </CardTitle>
        <CardDescription>
          Add each family member so recommendations and answers can be tailored. Changes save automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {members.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No family members yet. Advice is general until you add some.</p>
            <Button className="mt-4" onClick={add}>
              <Plus className="size-4" />
              Add your first member
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {members.map((m, i) => (
                <li key={m.id} className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 sm:w-64">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`age-${m.id}`} className="sr-only">
                        Age group of member {i + 1}
                      </Label>
                      <Select value={m.ageGroup} onValueChange={(v) => update(m.id, { ageGroup: v as AgeGroup })}>
                        <SelectTrigger id={`age-${m.id}`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_GROUPS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`sensitive-${m.id}`}
                        checked={m.sensitive}
                        onCheckedChange={(checked) => update(m.id, { sensitive: checked })}
                      />
                      <Label htmlFor={`sensitive-${m.id}`} className="text-sm font-normal">
                        Sensitive to air pollution
                      </Label>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Remove member ${i + 1}`} onClick={() => remove(m.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={add} disabled={members.length >= MAX_MEMBERS}>
                <Plus className="size-4" />
                Add member
              </Button>
              <p className="text-xs text-muted-foreground">
                Mark anyone with asthma, a heart or lung condition, or who is often bothered by dust or smoke.
              </p>
            </div>
          </>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Saved only in this browser. No names are collected, and only age groups and the sensitivity flag are shared with
          the AI.
        </p>
      </CardContent>
    </Card>
  )
}