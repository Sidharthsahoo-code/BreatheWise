import { Link, Route, Routes } from "react-router-dom"
import { SearchX } from "lucide-react"
import { AppProvider } from "@/context/AppContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import Dashboard from "@/pages/Dashboard"
import AIAdvisor from "@/pages/AIAdvisor"
import IndoorAir from "@/pages/IndoorAir"
import FamilyPlanner from "@/pages/FamilyPlanner"
import PollutionMapPage from "@/pages/PollutionMapPage"
import Insights from "@/pages/Insights"
import Settings from "@/pages/Settings"

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="assistant" element={<AIAdvisor />} />
          <Route path="indoor" element={<IndoorAir />} />
          <Route path="planner" element={<FamilyPlanner />} />
          <Route path="map" element={<PollutionMapPage />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={
              <EmptyState icon={SearchX} title="Page not found" description="That page doesn't exist.">
                <Button asChild>
                  <Link to="/">Back to dashboard</Link>
                </Button>
              </EmptyState>
            }
          />
        </Route>
      </Routes>
    </AppProvider>
  )
}