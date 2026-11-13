import { lazy, Suspense, type ReactNode } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import AppShell from "@/components/layout/AppShell"
import ErrorBoundary from "@/components/common/ErrorBoundary"
import { Skeleton } from "@/components/ui/skeleton"

const FarmOverview = lazy(() => import("@/pages/FarmOverview"))
const FieldExplorer = lazy(() => import("@/pages/FieldExplorer"))
const MissionControl = lazy(() => import("@/pages/MissionControl"))
const ClimateFindings = lazy(() => import("@/pages/ClimateFindings"))
const RotationStudio = lazy(() => import("@/pages/RotationStudio"))
const ScenarioLab = lazy(() => import("@/pages/ScenarioLab"))
const SeasonalCalendar = lazy(() => import("@/pages/SeasonalCalendar"))
const FieldWatch = lazy(() => import("@/pages/FieldWatch"))
const ReportsPage = lazy(() => import("@/pages/Reports"))
const NotFound = lazy(() => import("@/pages/NotFound"))

function PageLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

const page = (node: ReactNode) => <Suspense fallback={<PageLoading />}>{node}</Suspense>

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={page(<FarmOverview />)} />
          <Route path="field" element={page(<FieldExplorer />)} />
          <Route path="investigation" element={page(<MissionControl />)} />
          <Route path="findings" element={page(<ClimateFindings />)} />
          <Route path="strategies" element={page(<RotationStudio />)} />
          <Route path="scenarios" element={page(<ScenarioLab />)} />
          <Route path="calendar" element={page(<SeasonalCalendar />)} />
          <Route path="watch" element={page(<FieldWatch />)} />
          <Route path="reports" element={page(<ReportsPage />)} />
          <Route path="*" element={page(<NotFound />)} />
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