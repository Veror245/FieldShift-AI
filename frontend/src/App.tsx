import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import AppShell from "@/components/layout/AppShell"
import FarmOverview from "@/pages/FarmOverview"
import FieldExplorer from "@/pages/FieldExplorer"
import MissionControl from "@/pages/MissionControl"
import ClimateFindings from "@/pages/ClimateFindings"
import PlaceholderPage from "@/pages/PlaceholderPage"

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<FarmOverview />} />
          <Route path="field" element={<FieldExplorer />} />
          <Route path="investigation" element={<MissionControl />} />
          <Route path="findings" element={<ClimateFindings />} />
          <Route
            path="strategies"
            element={<PlaceholderPage title="Rotation Studio" description="Compare crop rotation strategies side by side." />}
          />
          <Route
            path="scenarios"
            element={<PlaceholderPage title="Scenario Lab" description="Stress-test strategies against different weather. This is not a forecast." />}
          />
          <Route
            path="calendar"
            element={<PlaceholderPage title="Seasonal Calendar" description="Sowing, growth, harvest and bare-field windows." />}
          />
          <Route
            path="watch"
            element={<PlaceholderPage title="Field Watch" description="Set up monitoring rules and review alerts." />}
          />
          <Route
            path="reports"
            element={<PlaceholderPage title="Reports" description="Export evidence-backed assessments." />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}