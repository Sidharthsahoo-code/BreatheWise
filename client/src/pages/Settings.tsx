import { Settings as SettingsIcon } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"

export default function Settings() {
  return (
    <EmptyState
      icon={SettingsIcon}
      title="Settings"
      description="Preferences such as your default AQI standard will live here."
    />
  )
}