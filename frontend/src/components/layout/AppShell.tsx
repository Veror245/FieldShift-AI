import { NavLink, Outlet } from "react-router-dom"
import { Sprout } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { navItems } from "./nav"

export default function AppShell() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-forest p-5 text-ivory md:flex">
          <div className="mb-8 flex items-center gap-2 text-xl font-bold">
            <Sprout className="h-6 w-6 text-sage" />
            FieldShift AI
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/15"
                      : "text-ivory/70 hover:bg-white/10 hover:text-ivory"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <p className="mt-auto text-xs text-ivory/50">
            Understand your land. Explore your options.
          </p>
        </aside>

        {/* Page content */}
        <main className="md:pl-64">
          <div className="mx-auto max-w-6xl p-6 pb-28 md:p-10 md:pb-10">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-forest/10 bg-ivory/95 backdrop-blur md:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex min-w-[84px] shrink-0 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium ${
                  isActive ? "text-forest" : "text-forest/50"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  )
}