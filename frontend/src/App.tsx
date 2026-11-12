import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import AppShell from "@/components/layout/AppShell"
import ErrorBoundary from "@/components/common/ErrorBoundary"
import FarmOverview from "@/pages/FarmOverview"
import FieldExplorer from "@/pages/FieldExplorer"
import MissionControl from "@/pages/MissionControl"
import ClimateFindings from "@/pages/ClimateFindings"
import RotationStudio from "@/pages/RotationStudio"
import ScenarioLab from "@/pages/ScenarioLab"
import SeasonalCalendar from "@/pages/SeasonalCalendar"
import FieldWatch from "@/pages/FieldWatch"
import ReportsPage from "@/pages/Reports"
import NotFound from "@/pages/NotFound"

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <AppRoutes />
    </BrowserRouter>
  )
}