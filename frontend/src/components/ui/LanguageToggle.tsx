import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { activeLanguage, setActiveLanguage } = useStore()

  return (
    <div className="flex p-1 rounded-xl bg-white/[0.05] border border-white/[0.07] gap-1">
      <button
        onClick={() => setActiveLanguage('en')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeLanguage === 'en'
            ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-sm'
            : 'text-white/40 hover:text-white/70'
        )}
      >
        <span>🇺🇸</span>
        <span>English</span>
      </button>
      <button
        onClick={() => setActiveLanguage('pt')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeLanguage === 'pt'
            ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-sm'
            : 'text-white/40 hover:text-white/70'
        )}
      >
        <span>🇧🇷</span>
        <span>Português</span>
      </button>
    </div>
  )
}
