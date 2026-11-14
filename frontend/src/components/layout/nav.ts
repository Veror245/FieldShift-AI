import {
  OverviewIcon,
  MapIcon,
  SproutIcon,
  ReportIcon,
  TrendingIcon,
} from "@/components/common/Icons"

export const navItems = [
  { to: "/", label: "Overview", icon: OverviewIcon },
  { to: "/field", label: "Field Explorer", icon: MapIcon },
  { to: "/findings", label: "Climate Findings", icon: TrendingIcon },
  { to: "/strategies", label: "Rotation Studio", icon: SproutIcon },
  { to: "/reports", label: "Reports", icon: ReportIcon },
]
