import { useState } from "react"
import { Database, Download, HardDrive, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearLocalData, exportLocalData, getInventory } from "@/utils/localData"
import { SettingRow, SettingsCard } from "./SettingRow"

const SENT = [
  "City name and coordinates",
  "Age group and a sensitivity flag for each household member",
  "Your chat questions and activity names",
]

const NEVER = [
  "Names, email addresses or accounts",
  "Your device's GPS position",
  "Anything stored on our servers: there is no user database",
]

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PrivacySettings() {
  const [inventory] = useState(getInventory)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={HardDrive}
        title="Saved on this device"
        description="BreatheWise keeps your information in this browser. There are no accounts."
      >
        {inventory.map((item) => (
          <SettingRow
            key={item.id}
            label={item.label}
            description={item.scope === "tab" ? "Kept for this browser tab only" : "Kept until you clear it"}
          >
            {item.summary ? (
              <span className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-aqi-good" />
                {item.summary}
              </span>
            ) : (
              <span className="text-muted-foreground">Nothing saved</span>
            )}
          </SettingRow>
        ))}
      </SettingsCard>

      <SettingsCard icon={Database} title="Your controls">
        <SettingRow label="Export my data" description="Download everything listed above as a JSON file.">
          <Button variant="outline" size="sm" onClick={exportLocalData}>
            <Download className="size-4" />
            Export
          </Button>
        </SettingRow>

        <SettingRow
          label="Clear saved data"
          description="Removes your city, household, routine, home answers, chat and plans from this browser, then reloads the app."
        >
          {confirming ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" onClick={clearLocalData}>
                Yes, clear everything
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" />
              Clear data
            </Button>
          )}
        </SettingRow>
      </SettingsCard>

      <SettingsCard icon={ShieldCheck} title="What the AI receives" description="Only what each request needs.">
        <div className="grid gap-6 sm:grid-cols-2">
          <BulletList title="Sent with AI requests" items={SENT} />
          <BulletList title="Never collected" items={NEVER} />
        </div>
        <p className="pt-4 text-xs leading-relaxed text-muted-foreground">
          Anything you type into the chat is sent to the AI, so avoid personal details there. Requests are processed by
          Google&apos;s Gemini API under Google&apos;s terms.
        </p>
      </SettingsCard>
    </div>
  )
}