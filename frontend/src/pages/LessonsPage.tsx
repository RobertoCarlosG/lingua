import { Fragment, useEffect, useState, useRef } from 'react'
import { Plus, ChevronRight, Volume2, CheckCircle, Circle, AlertCircle, Wand2, Loader2, Upload, BookPlus, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { generateLessonYaml } from '@/lib/dictionary'
import { lessonVocabToWords } from '@/lib/lesson-to-vocab'
import { languageConfig, type Language } from '@/lib/languages'
import { seedLessons } from '@/lib/seed-lessons'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { parseLesson, validateLesson, LESSON_TEMPLATE_VOCAB, LESSON_TEMPLATE_PHONETICS } from '@/lib/yaml-parser'
import type { Lesson, LessonYAML, VocabItem, Exercise } from '@/types/database'

function IPABadge({ ipa }: { ipa: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-lg bg-white/[0.07] text-3 border border-white/[0.09]">
      <Volume2 size={10} />
      {ipa}
    </span>
  )
}

function VocabCard({ item, language }: { item: VocabItem; language: Language }) {
  return (
    <div className="glass-sm p-4 space-y-2 hover:border-accent/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-1 text-base">{item.word}</p>
          {item.ipa && <IPABadge ipa={item.ipa} />}
        </div>
        <p className="text-sm font-medium shrink-0 text-accent-soft">
          {item.translation}
        </p>
      </div>
      {item.definition && (
        <p className="text-sm text-2 leading-relaxed">{item.definition}</p>
      )}
      {item.example && (
        <p className="text-sm text-3 italic">"{item.example}"</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {item.tags.map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded-lg bg-white/[0.06] text-3 border border-white/[0.07]">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseBlock({ exercise, index }: { exercise: Exercise; index: number }) {
  const { t } = useTranslation()
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)

  function checkAnswer() {
    const isCorrect = answer.trim().toLowerCase() === exercise.answer.toLowerCase()
    setCorrect(isCorrect)
    setRevealed(true)
  }

  return (
    <div className="glass-sm p-5 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-3 mt-0.5 shrink-0">#{index + 1}</span>
        <p className="text-sm text-2 leading-relaxed">{exercise.prompt}</p>
      </div>

      {exercise.type === 'multiple_choice' && exercise.options ? (
        <div className="grid grid-cols-2 gap-2">
          {exercise.options.map(opt => (
            <button
              key={opt}
              onClick={() => { setAnswer(opt); setRevealed(false); setCorrect(null) }}
              className={cn(
                'text-left px-3 py-2.5 rounded-2xl border text-sm transition-all',
                answer === opt
                  ? revealed
                    ? opt === exercise.answer
                      ? 'bg-green-500/15 border-green-500/30 text-green-300'
                      : 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-white/10 border-white/20 text-1'
                  : 'border-white/10 text-2 hover:bg-white/[0.05] hover:text-1 hover:border-white/20'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="glass-input w-full px-3 py-2.5 text-sm"
          placeholder={t('lessons.yourAnswer')}
          value={answer}
          onChange={e => { setAnswer(e.target.value); setRevealed(false); setCorrect(null) }}
          onKeyDown={e => e.key === 'Enter' && checkAnswer()}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={checkAnswer}
          className="btn btn-ghost text-xs py-2 px-4"
        >
          {t('lessons.check')}
        </button>
        {revealed && (
          <div className={cn('flex items-center gap-1.5 text-xs', correct ? 'text-green-400' : 'text-red-400')}>
            {correct ? <CheckCircle size={13} /> : <Circle size={13} />}
            {correct ? t('lessons.correct') : t('lessons.answer', { answer: exercise.answer })}
          </div>
        )}
      </div>

      {revealed && exercise.explanation && (
        <p className="text-xs text-3 border-t border-white/[0.07] pt-2.5 leading-relaxed">{exercise.explanation}</p>
      )}
    </div>
  )
}

function LessonRenderer({ lesson }: { lesson: LessonYAML }) {
  const { t } = useTranslation()
  const config = languageConfig(lesson.language)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={config.theme.badge}>
            {config.label} · {lesson.level}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.07] text-3 border border-white/[0.09]">
            {lesson.type}
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-gradient-brand mt-2">
          {lesson.title}
        </h2>
        {lesson.objectives && (
          <ul className="mt-3 space-y-1.5">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-2">
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-accent-soft" />
                {obj}
              </li>
            ))}
          </ul>
        )}
      </div>

      {lesson.sections && lesson.sections.length > 0 && (
        <div className="space-y-4">
          {lesson.sections.map((section, i) => (
            <div key={i} className="glass p-5">
              <h3 className="text-sm font-semibold text-1 mb-3">{section.title}</h3>
              <div className="text-sm text-2 whitespace-pre-line leading-relaxed">{section.content}</div>
              {section.tips && section.tips.length > 0 && (
                <div className="mt-4 space-y-2">
                  {section.tips.map((tip, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-2">
                      <span className="text-amber-400 shrink-0">→</span>
                      {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-2 mb-3">{t('lessons.vocabSection', { count: lesson.vocabulary.length })}</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {lesson.vocabulary.map((item, i) => (
              <VocabCard key={i} item={item} language={lesson.language} />
            ))}
          </div>
        </div>
      )}

      {lesson.exercises && lesson.exercises.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-2 mb-3">{t('lessons.exercises')}</h3>
          <div className="space-y-3">
            {lesson.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} index={i} />
            ))}
          </div>
        </div>
      )}

      {lesson.notes && (
        <div className="glass-sm p-4" style={{ borderLeft: '2px solid rgba(88,150,255,0.3)' }}>
          <p className="text-sm text-2 italic leading-relaxed">{lesson.notes}</p>
        </div>
      )}
    </div>
  )
}

function YAMLEditor({ onRender }: { onRender: (yaml: string) => void }) {
  const { activeLanguage } = useStore()
  const { t } = useTranslation()
  const [yaml, setYaml] = useState(LESSON_TEMPLATE_VOCAB)
  const [errors, setErrors] = useState<string[]>([])
  const [template, setTemplate] = useState<'vocab' | 'phonetics'>('vocab')
  const [genWords, setGenWords] = useState('')
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setYaml(text)
    const parsed = parseLesson(text)
    setErrors(parsed ? validateLesson(parsed) : [t('lessons.invalidYaml')])
    e.target.value = ''
  }

  async function handleGenerate() {
    const words = genWords.split(',').map(w => w.trim()).filter(Boolean)
    if (words.length === 0 || generating) return
    setGenerating(true)
    setErrors([])
    const generated = await generateLessonYaml(words, `Vocabulario: ${words.slice(0, 3).join(', ')}...`)
    if (generated) {
      setYaml(generated)
      setGenWords('')
    } else {
      setErrors([t('lessons.generateError')])
    }
    setGenerating(false)
  }

  function handleRender() {
    const parsed = parseLesson(yaml)
    if (!parsed) {
      setErrors([t('lessons.invalidYaml')])
      return
    }
    const errs = validateLesson(parsed)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    onRender(yaml)
  }

  function loadTemplate(tpl: 'vocab' | 'phonetics') {
    setTemplate(tpl)
    setYaml(tpl === 'vocab' ? LESSON_TEMPLATE_VOCAB : LESSON_TEMPLATE_PHONETICS)
    setErrors([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-3">{t('lessons.template')}</span>
        {(['vocab', 'phonetics'] as const).map(tpl => (
          <button
            key={tpl}
            onClick={() => loadTemplate(tpl)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-xl border transition-all',
              template === tpl
                ? 'bg-white/12 border-white/22 text-1'
                : 'border-white/10 text-3 hover:text-2 hover:border-white/20'
            )}
          >
            {tpl === 'vocab' ? t('lessons.templateVocab') : t('lessons.templatePhonetics')}
          </button>
        ))}
        <span className="flex-1" />
        <input
          ref={fileInputRef}
          type="file"
          accept=".yml,.yaml,text/yaml"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost text-xs py-1.5 px-3"
        >
          <Upload size={13} />
          {t('lessons.upload')}
        </button>
      </div>

      {languageConfig(activeLanguage).dictionary.generate && (
        <div className="flex gap-1.5">
          <input
            className="glass-input flex-1 px-3 py-2.5 text-xs"
            placeholder={t('lessons.generatePlaceholder')}
            value={genWords}
            onChange={e => setGenWords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !genWords.trim()}
            className="btn btn-ghost text-xs text-accent-soft disabled:opacity-40 shrink-0"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {t('lessons.generate')}
          </button>
        </div>
      )}

      <textarea
        value={yaml}
        onChange={e => { setYaml(e.target.value); setErrors([]) }}
        className="glass-input w-full px-4 py-3 text-xs font-mono leading-relaxed resize-none h-80"
        spellCheck={false}
      />

      {errors.length > 0 && (
        <div className="glass-sm p-3 border border-red-500/25">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-300">
              <AlertCircle size={12} />
              {e}
            </div>
          ))}
        </div>
      )}

      <button onClick={handleRender} className="btn btn-primary w-full">
        {t('lessons.render')}
      </button>
    </div>
  )
}

export function LessonsPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activeLesson, setActiveLesson] = useState<LessonYAML | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<number | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  async function importVocabulary() {
    if (!activeLesson?.vocabulary?.length || importing || !user) return
    setImporting(true)
    setImportError(null)
    const words = lessonVocabToWords(activeLesson, new Date())
    const { data: existingRows, error: selectError } = await supabase
      .from('vocab_words')
      .select('word')
      .eq('language', activeLesson.language)
      .in('word', words.map(w => w.word))
    if (selectError) {
      setImportError(t('lessons.importError'))
      setImporting(false)
      return
    }
    const existing = new Set((existingRows ?? []).map(r => r.word.toLowerCase()))
    const fresh = words.filter(w => !existing.has(w.word.toLowerCase()))
    if (fresh.length > 0) {
      const { error: insertError } = await supabase
        .from('vocab_words')
        .insert(fresh.map(w => ({ ...w, user_id: user.id })))
      if (insertError) {
        console.error('vocab_words insert failed:', insertError)
        setImportError(t('lessons.importError'))
        setImporting(false)
        return
      }
    }
    setImported(fresh.length)
    setImporting(false)
  }

  useEffect(() => {
    setActiveLesson(null)
    setImported(null)
    setImportError(null)
    fetchLessons()
  }, [activeLanguage])

  async function fetchLessons() {
    setLoading(true)
    await seedLessons()
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('language', activeLanguage)
      .order('created_at', { ascending: false })
      .order('title', { ascending: true })
    setLessons(data ?? [])
    setLoading(false)
  }

  async function handleRenderYAML(yamlContent: string) {
    const parsed = parseLesson(yamlContent)
    if (!parsed || !user) return
    setImportError(null)
    setImported(null)
    setShowEditor(false)

    const { data, error } = await supabase
      .from('lessons')
      .insert({ language: activeLanguage, title: parsed.title, yaml_content: yamlContent, user_id: user.id, rendered_at: new Date().toISOString() })
      .select()
      .single()
    if (error) {
      console.error('lessons insert failed:', error)
      setImportError(t('lessons.saveError'))
      return
    }
    setActiveLesson(parsed)
    if (data) setLessons(prev => [data, ...prev])
  }

  function openLesson(lesson: Lesson) {
    const parsed = parseLesson(lesson.yaml_content)
    if (parsed) {
      setActiveLesson(parsed)
      setImported(null)
      setImportError(null)
    }
  }

  const config = languageConfig(activeLanguage)

  return (
    <div className="space-y-6">
      {importError && (
        <div className="glass-sm p-3 border border-red-500/25 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={13} className="shrink-0" />
          {importError}
        </div>
      )}
      {!activeLesson ? (
        <Fragment key="lesson-list">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gradient-brand">
                {t('lessons.title')} {config.flag}
              </h1>
              <p className="text-2 text-sm mt-1">{t('lessons.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="btn btn-primary shrink-0"
            >
              <Plus size={16} />
              {t('lessons.new')}
            </button>
          </div>

          {showEditor && (
            <div className="glass p-5">
              <h2 className="text-sm font-semibold text-2 mb-4">{t('lessons.editorTitle')}</h2>
              <YAMLEditor onRender={handleRenderYAML} />
            </div>
          )}

          {loading ? (
            <div className="glass p-10 text-center text-3 text-sm">{t('common.loading')}</div>
          ) : lessons.length === 0 && !showEditor ? (
            <div className="glass p-12 text-center space-y-3">
              <p className="text-2 text-sm">{t('lessons.empty')}</p>
              <button onClick={() => setShowEditor(true)} className="text-accent-soft text-sm hover:underline">
                {t('lessons.createFirst')}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {lessons.map(lesson => {
                const parsed = parseLesson(lesson.yaml_content)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => openLesson(lesson)}
                    className="glass glass-interactive p-5 text-left group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-1 text-sm truncate">{lesson.title}</p>
                        {parsed && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className={config.theme.badge}>
                              {parsed.level}
                            </span>
                            <span className="text-xs text-3">{parsed.type}</span>
                            {parsed.vocabulary && (
                              <span className="text-xs text-3">{t('lessons.wordCount', { count: parsed.vocabulary.length })}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={15} className="text-3 group-hover:text-2 transition-colors shrink-0 mt-0.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Fragment>
      ) : (
        <Fragment key="lesson-detail">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setActiveLesson(null)}
              className="btn btn-ghost text-sm"
            >
              <ArrowLeft size={15} />
              {t('lessons.back')}
            </button>
            {(activeLesson.vocabulary?.length ?? 0) > 0 && (
              <button
                onClick={importVocabulary}
                disabled={importing || imported !== null}
                className={cn(
                  'btn text-xs',
                  imported !== null
                    ? 'bg-green-500/10 border border-green-500/25 text-green-300 cursor-default'
                    : 'btn-ghost text-2'
                )}
              >
                {importing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : imported !== null ? (
                  <CheckCircle size={13} />
                ) : (
                  <BookPlus size={13} />
                )}
                {imported !== null
                  ? imported === 0
                    ? t('lessons.importedZero')
                    : t('lessons.imported', { count: imported })
                  : t('lessons.import')}
              </button>
            )}
          </div>
          <LessonRenderer lesson={activeLesson} />
        </Fragment>
      )}
    </div>
  )
}
