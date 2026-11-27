import { House, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  COOKING_FUELS,
  INDOOR_SOURCES,
  MAX_HOUSEHOLD,
  MAX_ROOMS,
  VENTILATION_OPTIONS,
  type CookingFuel,
  type IndoorAssessment as Assessment,
  type IndoorSource,
  type Ventilation,
} from "@/types/family"

interface ToggleRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-3.5">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

interface IndoorAssessmentProps {
  value: Assessment
  onChange: (value: Assessment) => void
  onSubmit: () => void
  pending: boolean
  hasPlan: boolean
}

export function IndoorAssessment({ value, onChange, onSubmit, pending, hasPlan }: IndoorAssessmentProps) {
  const patch = (changes: Partial<Assessment>) => onChange({ ...value, ...changes })

  const toggleSource = (source: IndoorSource, on: boolean) =>
    patch({
      indoorSources: on
        ? [...value.indoorSources.filter((s) => s !== source), source]
        : value.indoorSources.filter((s) => s !== source),
    })

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <House className="size-5 text-primary" />
          About your home
        </CardTitle>
        <CardDescription>Answer a few questions. Changes save automatically in this browser.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rooms">Number of rooms</Label>
            <Select value={String(value.rooms)} onValueChange={(v) => patch({ rooms: Number(v) })}>
              <SelectTrigger id="rooms" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: MAX_ROOMS }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "room" : "rooms"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="members">People living at home</Label>
            <Select value={String(value.members)} onValueChange={(v) => patch({ members: Number(v) })}>
              <SelectTrigger id="members" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: MAX_HOUSEHOLD }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "person" : "people"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">How well does your home ventilate?</p>
          <div role="radiogroup" aria-label="Ventilation" className="grid gap-2 sm:grid-cols-3">
            {VENTILATION_OPTIONS.map((option) => {
              const selected = value.ventilation === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => patch({ ventilation: option.value as Ventilation })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    selected ? "border-primary bg-accent" : "bg-background hover:bg-accent/50"
                  )}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fuel">Main cooking fuel</Label>
            <Select value={value.cookingFuel} onValueChange={(v) => patch({ cookingFuel: v as CookingFuel })}>
              <SelectTrigger id="fuel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COOKING_FUELS.map((fuel) => (
                  <SelectItem key={fuel.value} value={fuel.value}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleRow
            id="exhaust"
            label="Kitchen exhaust fan or chimney"
            description="Used to vent cooking smoke and fumes outside"
            checked={value.kitchenExhaust}
            onChange={(checked) => patch({ kitchenExhaust: checked })}
          />
          <ToggleRow
            id="purifier"
            label="Air purifier at home"
            description="Any room air purifier you already own"
            checked={value.hasPurifier}
            onChange={(checked) => patch({ hasPurifier: checked })}
          />
          <ToggleRow
            id="road"
            label="Windows face a busy road"
            description="Traffic noise or exhaust often comes in"
            checked={value.windowsFaceBusyRoad}
            onChange={(checked) => patch({ windowsFaceBusyRoad: checked })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Indoor pollution sources (select any that apply)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {INDOOR_SOURCES.map((source) => (
              <label
                key={source.value}
                htmlFor={`source-${source.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-3 text-sm"
              >
                <Checkbox
                  id={`source-${source.value}`}
                  checked={value.indoorSources.includes(source.value)}
                  onCheckedChange={(checked) => toggleSource(source.value, checked === true)}
                />
                {source.label}
              </label>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full sm:w-auto" onClick={onSubmit} disabled={pending}>
          <Sparkles className="size-4" />
          {hasPlan ? "Update my indoor air plan" : "Get my indoor air plan"}
        </Button>
      </CardContent>
    </Card>
  )
}