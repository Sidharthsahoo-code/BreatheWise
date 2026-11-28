import { AboutSettings } from "@/components/settings/AboutSettings"
import { GeneralSettings } from "@/components/settings/GeneralSettings"
import { PrivacySettings } from "@/components/settings/PrivacySettings"
import { SystemStatus } from "@/components/settings/SystemStatus"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage preferences, your data and system status.</p>
      </div>

      <Tabs defaultValue="general" className="gap-6">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
        <TabsContent value="system">
          <SystemStatus />
        </TabsContent>
        <TabsContent value="about">
          <AboutSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}