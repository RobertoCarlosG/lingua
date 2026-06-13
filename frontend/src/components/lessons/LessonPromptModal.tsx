import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buildLessonGptPrompt } from '@/lib/lesson-import'
import { languageConfig, type Language } from '@/lib/languages'
import { cn } from '@/lib/utils'

export function LessonPromptModal({
  language,
  onClose,
}: {
  language: Language
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const prompt = buildLessonGptPrompt(language)
  const config = languageConfig(language)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard puede fallar en contextos no seguros */
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-1">{t('lessons.promptModalTitle')}</h2>
            <p className="text-xs text-2 mt-1.5 leading-relaxed">
              {t('lessons.promptModalSubtitle', { language: config.label, flag: config.flag })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost p-2 shrink-0 text-3 hover:text-2"
            aria-label={t('common.cancel')}
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-3 mb-3">{t('lessons.promptModalHint')}</p>

        <div className="relative group rounded-2xl border border-dashed border-accent/30 bg-white/[0.03] hover:border-accent/45 transition-colors">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all',
              copied
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-white/[0.06] border-white/15 text-2 hover:bg-accent/15 hover:border-accent/35 hover:text-accent-soft opacity-80 group-hover:opacity-100'
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? t('lessons.promptCopied') : t('lessons.promptCopy')}
          </button>

          <pre className="p-4 pr-28 pt-12 text-[11px] font-mono text-2 leading-relaxed overflow-auto max-h-[50vh] whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>

        <div className="flex justify-end mt-5">
          <button type="button" onClick={onClose} className="btn btn-primary text-sm px-5">
            {t('lessons.promptModalDone')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
