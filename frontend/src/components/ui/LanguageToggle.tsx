import { LANGUAGE_CODES, LEARNING_LANGUAGES } from '@/lib/languages'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { activeLanguage, setActiveLanguage } = useStore()

  return (
    <div className="flex p-1 rounded-xl bg-white/[0.05] border border-white/[0.07] gap-1">
      {LANGUAGE_CODES.map(code => {
        const { label, flag, theme } = LEARNING_LANGUAGES[code]
        return (
          <button
            key={code}
            onClick={() => setActiveLanguage(code)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeLanguage === code ? theme.toggleActive : 'text-white/40 hover:text-white/70'
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
