import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PanelLeftIcon, Volume2Icon, VolumeXIcon } from "@/components/common/Icons"
import {
  playTabSwitchSfx,
  useSfxMute,
} from "@/utils/uiSoundEngine"
import { navItems } from "./nav"

export default function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { muted, toggleMute } = useSfxMute()

  const toggleSidebar = () => {
    playTabSwitchSfx()
    setCollapsed((prev) => !prev)
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-[#E6E0D2] text-[#1E241B]">
        <aside
          className={`fixed inset-y-0 left-0 hidden flex-col overflow-hidden bg-[#1A2118] border-r border-[#2A3327] p-3.5 text-[#ECE8DF] md:flex z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-[#2A3327] shadow-sm overflow-hidden p-1">
                    <img src="/src/assets/logo.png" alt="FieldShift AI" className="h-full w-full object-contain" />
                  </div>
                  <span className="font-sans font-bold text-lg tracking-tight text-[#ECE8DF] leading-none truncate">
                    FieldShift AI
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-[#2A3327] text-[#B8B5A8] hover:bg-white/10 hover:text-[#ECE8DF] transition-colors shrink-0"
                    title={muted ? "Unmute sounds" : "Mute sounds"}
                    aria-label={muted ? "Unmute sounds" : "Mute sounds"}
                  >
                    {muted ? <VolumeXIcon className="h-4 w-4 text-[#A66843]" /> : <Volume2Icon className="h-4 w-4 text-[#7E9167]" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-[#2A3327] text-[#B8B5A8] hover:bg-white/10 hover:text-[#ECE8DF] transition-colors shrink-0"
                    title="Collapse sidebar"
                  >
                    <PanelLeftIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-[#2A3327] hover:bg-white/10 text-[#ECE8DF] transition-all shadow-sm"
                  title="Expand sidebar"
                >
                  <PanelLeftIcon className="h-4.5 w-4.5 text-[#B8B5A8]" />
                </button>
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-1 relative overflow-hidden">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => playTabSwitchSfx()}
                  title={collapsed ? label : undefined}
                  className={`group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors hover:bg-white/5 ${
                    collapsed ? "justify-center px-2" : "gap-3 px-3.5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="fieldshift-active-sidebar-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#98B882] via-[#7E9867] to-[#688254] border border-white/25 border-t-white/45 shadow-[0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl"
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-4.5 w-4.5 transition-colors duration-150 ${
                      isActive ? "text-[#0C160F]" : "text-[#B8B5A8] group-hover:text-[#ECE8DF]"
                    }`}
                  />
                  {!collapsed && (
                    <span
                      className={`relative z-10 transition-colors duration-150 truncate ${
                        isActive ? "text-[#0C160F] font-bold" : "text-[#B8B5A8] group-hover:text-[#ECE8DF]"
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            {collapsed && (
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-white/5 border border-[#2A3327] text-[#B8B5A8] hover:bg-white/10 hover:text-[#ECE8DF] transition-colors"
                title={muted ? "Unmute sounds" : "Mute sounds"}
                aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              >
                {muted ? <VolumeXIcon className="h-4 w-4 text-[#A66843]" /> : <Volume2Icon className="h-4 w-4 text-[#7E9167]" />}
              </button>
            )}
            {!collapsed && (
              <div className="rounded-xl p-3 bg-[#222B20] text-xs text-[#C7C4B8] leading-relaxed border border-[#313D2E]">
                Understand your land. Explore your options.
              </div>
            )}
          </div>
        </aside>

        <main
          className={`transition-[padding-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            collapsed ? "md:pl-20" : "md:pl-64"
          }`}
        >
          <div className="mx-auto max-w-7xl p-3 md:p-5 lg:p-6 min-h-screen">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)", scale: 0.992 }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)", scale: 0.995 }}
                transition={{
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto bg-[#1A2118] border-t border-[#2A3327] md:hidden">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => playTabSwitchSfx()}
                className="relative flex min-w-[76px] shrink-0 flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNavPill"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                    className="absolute inset-1 rounded-xl bg-gradient-to-br from-[#98B882] via-[#7E9867] to-[#688254] border border-white/25 border-t-white/45 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl"
                  />
                )}
                <Icon className={`relative z-10 h-4 w-4 ${isActive ? "text-[#141A12]" : "text-[#B8B5A8]"}`} />
                <span className={`relative z-10 ${isActive ? "text-[#141A12] font-bold" : "text-[#B8B5A8]"}`}>
                  {label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </TooltipProvider>
  )
}
