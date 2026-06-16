import { useState } from 'react'
import { Volume2, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { CURATED_LESSONS, type CuratedLesson } from '@/data/curated-lessons'

const LANG_META: Record<string, { label: string; flag: string; pillClass: string; accentText: string }> = {
  en: { label: 'English',   flag: '🇬🇧', pillClass: 'lang-badge-en', accentText: 'text-[rgb(var(--accent-soft))]' },
  fr: { label: 'Français',  flag: '🇫🇷', pillClass: 'lang-badge-fr', accentText: 'text-[#5ee8b0]' },
  ja: { label: '日本語',     flag: '🇯🇵', pillClass: 'lang-badge-ja', accentText: 'text-[#b8b4ff]' },
}

const LEVEL_ORDER: Record<string, number> = {
  N5: 1, N4: 2, A1: 3, A2: 4, B1: 5, B2: 6, C1: 7, C2: 8,
}

function speakWord(text: string, lang: 'en' | 'fr' | 'ja', rate: number) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ja-JP'
  u.rate = rate
  window.speechSynthesis.speak(u)
}

function SpeakBtn({ text, lang }: { text: string; lang: 'en' | 'fr' | 'ja' }) {
  const [playing, setPlaying] = useState(false)
  const { speechRate } = useStore()
  return (
    <button
      onClick={() => {
        speakWord(text, lang, speechRate)
        setPlaying(true)
        setTimeout(() => setPlaying(false), 1800)
      }}
      className={cn(
        'p-1.5 rounded-lg border transition-all shrink-0',
        playing
          ? 'bg-[rgba(45,110,235,0.2)] border-[rgba(45,110,235,0.3)] text-[rgb(var(--accent-soft))]'
          : 'border-white/10 text-white/30 hover:text-white/70 hover:bg-white/[0.08]'
      )}
    >
      <Volume2 size={12} className={playing ? 'animate-pulse' : ''} />
    </button>
  )
}

function LessonDetail({ lesson, onBack }: { lesson: CuratedLesson; onBack: () => void }) {
  const meta = LANG_META[lesson.lang]
  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-3 hover:text-1 transition-colors"
      >
        <ArrowLeft size={14} />
        Explorar
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={meta.pillClass}>{meta.flag} {lesson.level}</span>
          <span className="text-xs text-3 px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.07]">
            {lesson.type}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-1">{lesson.title}</h1>
        <p className="text-sm text-3 mt-1">{lesson.summary}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-2">
            Vocabulario <span className="text-3">({lesson.vocabulary.length} palabras)</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {lesson.vocabulary.map((item, i) => (
            <div
              key={i}
              className="glass-sm p-4 space-y-2 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-start gap-2">
                <SpeakBtn text={item.word} lang={lesson.lang} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-1 text-base leading-tight">{item.word}</p>
                  {item.ipa && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40 border border-white/[0.07] mt-0.5">
                      <Volume2 size={9} />
                      {item.ipa}
                    </span>
                  )}
                </div>
                <p className={cn('text-sm font-medium shrink-0', meta.accentText)}>
                  {item.translation}
                </p>
              </div>
              {item.definition && (
                <p className="text-sm text-3">{item.definition}</p>
              )}
              {item.example && (
                <div className="flex items-start gap-1.5">
                  <SpeakBtn text={item.example} lang={lesson.lang} />
                  <p className="text-sm text-white/35 italic">"{item.example}"</p>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 border border-white/[0.06]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ExplorePage() {
  const [activeLang, setActiveLang] = useState<'all' | 'en' | 'fr' | 'ja'>('all')
  const [activeLesson, setActiveLesson] = useState<CuratedLesson | null>(null)

  if (activeLesson) {
    return <LessonDetail lesson={activeLesson} onBack={() => setActiveLesson(null)} />
  }

  const filtered = CURATED_LESSONS
    .filter(l => activeLang === 'all' || l.lang === activeLang)
    .sort((a, b) => {
      if (a.lang !== b.lang) return a.lang.localeCompare(b.lang)
      return (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
    })

  const byLang: Record<string, CuratedLesson[]> = {}
  for (const l of filtered) {
    if (!byLang[l.lang]) byLang[l.lang] = []
    byLang[l.lang].push(l)
  }

  const isEmpty = CURATED_LESSONS.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gradient-brand">Explorar lecciones</h1>
        <p className="text-sm text-3 mt-0.5">Contenido curado por nivel e idioma</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'en', 'fr', 'ja'] as const).map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              activeLang === lang
                ? 'bg-white/10 border-white/20 text-1'
                : 'border-white/10 text-3 hover:text-2 hover:border-white/15'
            )}
          >
            {lang === 'all' ? 'Todos' : `${LANG_META[lang].flag} ${LANG_META[lang].label}`}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="glass p-12 text-center space-y-3">
          <BookOpen size={32} className="mx-auto text-3" />
          <p className="text-sm text-3">El contenido curado se está cargando.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byLang).map(([lang, lessons]) => {
            const meta = LANG_META[lang]
            return (
              <div key={lang}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.flag}</span>
                  <h2 className="text-sm font-semibold text-2">{meta.label}</h2>
                  <span className="text-xs text-3">· {lessons.length} lecciones</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className="glass p-4 text-left hover:bg-white/[0.08] transition-all group space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={meta.pillClass}>{lesson.level}</span>
                            <span className="text-[10px] text-3">{lesson.type}</span>
                          </div>
                          <p className="font-medium text-1 text-sm leading-snug">{lesson.title}</p>
                        </div>
                        <ChevronRight size={14} className="text-3 group-hover:text-2 transition-colors shrink-0 mt-1" />
                      </div>
                      <p className="text-xs text-3 leading-relaxed line-clamp-2">{lesson.summary}</p>
                      <p className="text-[10px] text-white/25">
                        {lesson.vocabulary.length} palabras
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
