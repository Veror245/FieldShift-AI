import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import AppShell from "@/components/layout/AppShell"
import FarmOverview from "@/pages/FarmOverview"
import FieldExplorer from "@/pages/FieldExplorer"
import MissionControl from "@/pages/MissionControl"
import ClimateFindings from "@/pages/ClimateFindings"
import RotationStudio from "@/pages/RotationStudio"
import ScenarioLab from "@/pages/ScenarioLab"
import SeasonalCalendar from "@/pages/SeasonalCalendar"
import FieldWatch from "@/pages/FieldWatch"

import ReportsPage from "@/pages/Reports"

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
          <Route path="strategies" element={<RotationStudio />} />
          <Route path="scenarios" element={<ScenarioLab />} />
          <Route path="calendar" element={<SeasonalCalendar />} />
          <Route path="watch" element={<FieldWatch />} />
                    <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}