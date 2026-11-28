import { ExternalLink, Info, Library, TriangleAlert } from "lucide-react"
import { SettingRow, SettingsCard } from "./SettingRow"

const REPO_URL = "https://github.com/Sidharthsahoo-code/BreatheWise"

const SOURCES = [
  {
    name: "Open-Meteo Air Quality API",
    note: "Modelled hourly air quality and AQI values",
    href: "https://open-meteo.com/en/docs/air-quality-api",
  },
  {
    name: "Copernicus Atmosphere Monitoring Service",
    note: "The atmospheric model behind that data",
    href: "https://atmosphere.copernicus.eu",
  },
  {
    name: "WHO global air quality guidelines (2021)",
    note: "Guideline levels used for the pollutant comparisons",
    href: "https://www.who.int/publications/i/item/9789240034228",
  },
  {
    name: "OpenStreetMap",
    note: "Map tiles and data © OpenStreetMap contributors",
    href: "https://www.openstreetmap.org/copyright",
  },
  {
    name: "Google Gemini API",
    note: "Writes the recommendations, answers and plans",
    href: "https://ai.google.dev",
  },
]

function ExternalLinkText({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5" />
    </a>
  )
}

export function AboutSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard
        icon={Info}
        title="About BreatheWise"
        description="Urban air quality intelligence and a personal wellness assistant for families."
      >
        <SettingRow label="Version" description="A hackathon MVP.">
          <span>1.0</span>
        </SettingRow>
        <SettingRow label="Source code" description="Architecture, prompt design and setup are documented in the README.">
          <ExternalLinkText href={REPO_URL}>GitHub</ExternalLinkText>
        </SettingRow>
      </SettingsCard>

      <SettingsCard icon={Library} title="Data sources and credits">
        {SOURCES.map((source) => (
          <SettingRow key={source.name} label={source.name} description={source.note}>
            <ExternalLinkText href={source.href}>Open</ExternalLinkText>
          </SettingRow>
        ))}
      </SettingsCard>

      <SettingsCard icon={TriangleAlert} title="Please note">
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Everything here is general guidance, not medical advice. Speak to a doctor about symptoms or conditions.</li>
          <li>
            Air quality values are modelled on a grid roughly 10 to 40 km wide, not measured at street level or at a
            station near you.
          </li>
          <li>AI answers can contain mistakes, and the app cannot measure the air quality inside your home.</li>
        </ul>
      </SettingsCard>
    </div>
  )
}