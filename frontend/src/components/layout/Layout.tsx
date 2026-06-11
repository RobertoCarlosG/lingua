import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, AlertCircle, FileText,
  Brain, Menu, X, Globe
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/review', icon: Brain, label: 'Repaso' },
  { to: '/vocabulary', icon: BookOpen, label: 'Vocabulario' },
  { to: '/errors', icon: AlertCircle, label: 'Banco de errores' },
  { to: '/lessons', icon: FileText, label: 'Lecciones' },
]

export function Layout() {
  const { sidebarOpen, setSidebarOpen } = useStore()

  return (
    <div className="flex h-dvh overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative z-30 h-full flex flex-col',
          'w-64 shrink-0',
          'bg-slate-950/80 backdrop-blur-heavy border-r border-white/[0.07]',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Globe size={14} className="text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">Lingua</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-4">
          <LanguageToggle />
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active')
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.07]">
          <p className="text-xs text-white/25 font-mono">EN: A2→B1 · PT: A1</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-white">Lingua</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
