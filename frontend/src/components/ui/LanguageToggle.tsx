import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { LANGUAGE_CODES, LEARNING_LANGUAGES } from '@/lib/languages'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { activeLanguage, setActiveLanguage } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const active = LEARNING_LANGUAGES[activeLanguage]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200',
          'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]',
          open && 'bg-white/[0.08] border-white/[0.14]'
        )}
      >
        <span className="text-lg leading-none">{active.flag}</span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-1 truncate">{active.label}</p>
          <p className="text-[10px] text-3 font-mono">{active.levels}</p>
        </div>
        <ChevronDown
          size={13}
          className={cn('text-3 shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-1.5 z-50',
          'rounded-xl border border-white/[0.10] overflow-hidden',
          'bg-ink-900/95 backdrop-blur-xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          'animate-fade-in'
        )}>
          <div className="p-1.5 space-y-0.5">
            {LANGUAGE_CODES.map(code => {
              const { label, flag, levels, theme } = LEARNING_LANGUAGES[code]
              const isActive = activeLanguage === code
              return (
                <button
                  key={code}
                  onClick={() => { setActiveLanguage(code); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150',
                    isActive
                      ? theme.toggleActive
                      : 'hover:bg-white/[0.06] text-2'
                  )}
                >
                  <span className="text-base leading-none shrink-0">{flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{label}</p>
                    <p className="text-[10px] font-mono text-3">{levels}</p>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
