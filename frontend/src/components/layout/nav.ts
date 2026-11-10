import {
  LayoutDashboard,
  Map as MapIcon,
  Activity,
  Sprout,
  FlaskConical,
  CalendarDays,
  BellRing,
  FileText,
  TrendingUp,
} from "lucide-react"

export const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/field", label: "Field Explorer", icon: MapIcon },
  { to: "/investigation", label: "Mission Control", icon: Activity },
  { to: "/strategies", label: "Rotation Studio", icon: Sprout },
  { to: "/scenarios", label: "Scenario Lab", icon: FlaskConical },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/watch", label: "Field Watch", icon: BellRing },
  { to: "/reports", label: "Reports", icon: FileText },
   { to: "/findings", label: "Climate Findings", icon: TrendingUp },
]