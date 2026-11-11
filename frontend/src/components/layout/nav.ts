import {
  OverviewIcon,
  MapIcon,
  ActivityIcon,
  SproutIcon,
  FlaskIcon,
  CalendarIcon,
  BellIcon,
  ReportIcon,
  TrendingIcon,
} from "@/components/common/Icons"

export const navItems = [
  { to: "/", label: "Overview", icon: OverviewIcon },
  { to: "/field", label: "Field Explorer", icon: MapIcon },
  { to: "/investigation", label: "Mission Control", icon: ActivityIcon },
  { to: "/strategies", label: "Rotation Studio", icon: SproutIcon },
  { to: "/scenarios", label: "Scenario Lab", icon: FlaskIcon },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/watch", label: "Field Watch", icon: BellIcon },
  { to: "/reports", label: "Reports", icon: ReportIcon },
  { to: "/findings", label: "Climate Findings", icon: TrendingIcon },
]
