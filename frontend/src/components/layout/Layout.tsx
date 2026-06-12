import { useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, AlertCircle, FileText,
  Brain, Menu, X, Globe, LogOut, Languages
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_CODES, LEARNING_LANGUAGES } from '@/lib/languages'
import { UI_LANGUAGE_CODES, UI_LANGUAGES, type UiLanguage } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { seedLessons } from '@/lib/seed-lessons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/review', icon: Brain, key: 'nav.review' },
  { to: '/vocabulary', icon: BookOpen, key: 'nav.vocabulary' },
  { to: '/errors', icon: AlertCircle, key: 'nav.errors' },
  { to: '/lessons', icon: FileText, key: 'nav.lessons' },
]

export function Layout() {
  const { sidebarOpen, setSidebarOpen, uiLanguage, setUiLanguage } = useStore()
  const { user, signOut } = useAuth()
  const { t, i18n } = useTranslation()

  // Precarga las lecciones incluidas en el build para que la app no inicie vacía
  useEffect(() => {
    seedLessons()
  }, [])

  function handleUiLanguageChange(lang: UiLanguage) {
    setUiLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const levelsSummary = LANGUAGE_CODES
    .map(code => `${code.toUpperCase()}: ${LEARNING_LANGUAGES[code].levels}`)
    .join(' · ')

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
          {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active')
              }
            >
              <Icon size={17} />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.07] space-y-3">
          <div className="flex items-center gap-2">
            <Languages size={13} className="text-white/25 shrink-0" />
            <select
              value={uiLanguage}
              onChange={e => handleUiLanguageChange(e.target.value as UiLanguage)}
              title={t('layout.uiLanguage')}
              className="flex-1 bg-transparent text-xs text-white/50 outline-none cursor-pointer [&>option]:bg-slate-900"
            >
              {UI_LANGUAGE_CODES.map(code => (
                <option key={code} value={code}>{UI_LANGUAGES[code]}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-white/25 font-mono">{levelsSummary}</p>
          {user && (
            <div className="flex items-center gap-2.5">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full ring-1 ring-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">
                  {(user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </p>
              </div>
              <button
                onClick={signOut}
                title={t('layout.signOut')}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
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
