import { LANGUAGE_CODES, LEARNING_LANGUAGES } from '@/lib/languages'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { activeLanguage, setActiveLanguage } = useStore()

  return (
    <div className="flex p-1 rounded-2xl bg-white/[0.05] border border-white/[0.08] gap-1">
      {LANGUAGE_CODES.map(code => {
        const { label, flag, theme } = LEARNING_LANGUAGES[code]
        return (
          <button
            key={code}
            onClick={() => setActiveLanguage(code)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 min-h-[36px]',
              activeLanguage === code ? theme.toggleActive : 'text-3 hover:text-2'
            )}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
