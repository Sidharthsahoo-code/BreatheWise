import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SettingsCardProps {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}

export function SettingsCard({ icon: Icon, title, description, children }: SettingsCardProps) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="divide-y">{children}</CardContent>
    </Card>
  )
}

interface SettingRowProps {
  label: string
  description?: ReactNode
  children: ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="break-words text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 text-sm sm:shrink-0">{children}</div>
    </div>
  )
}