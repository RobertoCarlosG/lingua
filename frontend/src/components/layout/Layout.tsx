import { useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, AlertCircle, FileText,
  Brain, Menu, X, Sparkles, LogOut, Languages, Compass
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
  { to: '/explore', icon: Compass, key: 'nav.explore', highlight: true },
]

export function Layout() {
  const { sidebarOpen, setSidebarOpen, uiLanguage, setUiLanguage } = useStore()
  const { user, loading: authLoading, signOut } = useAuth()
  const { t, i18n } = useTranslation()

  // Precarga las lecciones incluidas en el build para que la app no inicie vacía
  useEffect(() => {
    if (!authLoading && user) seedLessons()
  }, [authLoading, user])

  function handleUiLanguageChange(lang: UiLanguage) {
    setUiLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const PILL_COLORS: Record<string, string> = {
    en: 'bg-[rgba(45,110,235,0.12)] border-[rgba(45,110,235,0.28)] text-[rgb(var(--accent-soft))]',
    pt: 'bg-[rgba(var(--orb-teal),0.12)] border-[rgba(var(--orb-teal),0.28)] text-[#7fe3ea]',
    fr: 'bg-[rgba(var(--orb-teal),0.10)] border-[rgba(34,197,132,0.28)] text-[#5ee8b0]',
    ja: 'bg-[rgba(var(--orb-indigo),0.15)] border-[rgba(var(--orb-indigo),0.30)] text-[#b8b4ff]',
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Scrim for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative z-30 h-full flex flex-col',
          'w-64 shrink-0 p-3',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:overflow-hidden'
        )}
      >
        {/* The sidebar itself is a floating liquid-glass panel */}
        <div className="glass h-full flex flex-col rounded-3xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-accent-soft to-accent-strong flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(45,110,235,0.8)]">
                <Sparkles size={15} className="text-white" />
              </div>
              <span className="font-semibold tracking-tight text-1">Lingua</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-3 hover:text-1 transition-colors"
              aria-label={t('layout.close', { defaultValue: 'Close menu' })}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-3 py-4">
            <LanguageToggle />
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ to, icon: Icon, key, highlight }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('nav-item', isActive && 'active', highlight && 'nav-item-explore')}
              >
                <Icon size={18} />
                <span>{t(key)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <Languages size={14} className="text-3 shrink-0" />
              <select
                value={uiLanguage}
                onChange={e => handleUiLanguageChange(e.target.value as UiLanguage)}
                title={t('layout.uiLanguage')}
                className="flex-1 bg-transparent text-xs text-2 outline-none cursor-pointer [&>option]:bg-ink-900"
              >
                {UI_LANGUAGE_CODES.map(code => (
                  <option key={code} value={code}>{UI_LANGUAGES[code]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGE_CODES.map(code => (
                <div
                  key={code}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs font-mono',
                    PILL_COLORS[code]
                  )}
                >
                  <span className="text-sm leading-none">{LEARNING_LANGUAGES[code].flag}</span>
                  <span className="font-semibold">{code.toUpperCase()}</span>
                  <span className="ml-auto opacity-60 text-[10px]">{LEARNING_LANGUAGES[code].levels}</span>
                </div>
              ))}
            </div>
            {user && (
              <div className="flex items-center gap-2.5">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full ring-1 ring-white/15"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-2">
                    {(user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-2 truncate">
                    {user.user_metadata?.full_name ?? user.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  title={t('layout.signOut')}
                  className="p-2 rounded-xl hover:bg-white/10 text-3 hover:text-1 transition-colors"
                  aria-label={t('layout.signOut')}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent top bar — toggles the sidebar on every breakpoint */}
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-2xl glass-sm hover:bg-white/10 text-2 hover:text-1 transition-colors"
            aria-label={t('layout.toggleMenu', { defaultValue: 'Toggle menu' })}
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-1 lg:hidden">Lingua</span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-8 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
