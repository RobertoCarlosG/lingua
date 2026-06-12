import { useEffect, useState, useRef } from 'react'
import { Plus, FileText, ChevronRight, Volume2, CheckCircle, Circle, AlertCircle, Wand2, Loader2, Upload, BookPlus } from 'lucide-react'
import { generateLessonYaml } from '@/lib/dictionary'
import { lessonVocabToWords } from '@/lib/lesson-to-vocab'
import { seedLessons } from '@/lib/seed-lessons'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { parseLesson, validateLesson, LESSON_TEMPLATE_VOCAB, LESSON_TEMPLATE_PHONETICS } from '@/lib/yaml-parser'
import type { Lesson, LessonYAML, VocabItem, Exercise } from '@/types/database'

function IPABadge({ ipa }: { ipa: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.08]">
      <Volume2 size={10} />
      {ipa}
    </span>
  )
}

function VocabCard({ item, language }: { item: VocabItem; language: 'en' | 'pt' }) {
  const isEN = language === 'en'
  return (
    <div className={cn(
      'glass-sm p-4 space-y-2',
      isEN ? 'hover:border-blue-500/20' : 'hover:border-purple-500/20',
      'transition-all'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-base">{item.word}</p>
          {item.ipa && <IPABadge ipa={item.ipa} />}
        </div>
        <p className={cn('text-sm font-medium shrink-0', isEN ? 'text-blue-300' : 'text-purple-300')}>
          {item.translation}
        </p>
      </div>
      {item.definition && (
        <p className="text-sm text-white/50">{item.definition}</p>
      )}
      {item.example && (
        <p className="text-sm text-white/35 italic">"{item.example}"</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {item.tags.map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.05] text-white/30">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseBlock({ exercise, index }: { exercise: Exercise; index: number }) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)

  function checkAnswer() {
    const isCorrect = answer.trim().toLowerCase() === exercise.answer.toLowerCase()
    setCorrect(isCorrect)
    setRevealed(true)
  }

  return (
    <div className="glass-sm p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-white/30 mt-0.5 shrink-0">#{index + 1}</span>
        <p className="text-sm text-white/80">{exercise.prompt}</p>
      </div>

      {exercise.type === 'multiple_choice' && exercise.options ? (
        <div className="grid grid-cols-2 gap-2">
          {exercise.options.map(opt => (
            <button
              key={opt}
              onClick={() => { setAnswer(opt); setRevealed(false); setCorrect(null) }}
              className={cn(
                'text-left px-3 py-2 rounded-lg border text-sm transition-all',
                answer === opt
                  ? revealed
                    ? opt === exercise.answer ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-white/10 border-white/20 text-white'
                  : 'border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white/80'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="glass-input w-full px-3 py-2 text-sm"
          placeholder="Tu respuesta..."
          value={answer}
          onChange={e => { setAnswer(e.target.value); setRevealed(false); setCorrect(null) }}
          onKeyDown={e => e.key === 'Enter' && checkAnswer()}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={checkAnswer}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white/60 hover:text-white transition-all"
        >
          Verificar
        </button>
        {revealed && (
          <div className={cn('flex items-center gap-1.5 text-xs', correct ? 'text-green-400' : 'text-red-400')}>
            {correct ? <CheckCircle size={13} /> : <Circle size={13} />}
            {correct ? '¡Correcto!' : `Respuesta: ${exercise.answer}`}
          </div>
        )}
      </div>

      {revealed && exercise.explanation && (
        <p className="text-xs text-white/40 border-t border-white/[0.06] pt-2">{exercise.explanation}</p>
      )}
    </div>
  )
}

function LessonRenderer({ lesson }: { lesson: LessonYAML }) {
  const isEN = lesson.language === 'en'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={isEN ? 'lang-badge-en' : 'lang-badge-pt'}>
            {isEN ? 'English' : 'Português'} · {lesson.level}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/40 border border-white/[0.08]">
            {lesson.type}
          </span>
        </div>
        <h2 className={`text-xl font-semibold mt-2 ${isEN ? 'text-gradient-en' : 'text-gradient-pt'}`}>
          {lesson.title}
        </h2>
        {lesson.objectives && (
          <ul className="mt-2 space-y-1">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-white/25" />
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
              <h3 className="text-sm font-semibold text-white/80 mb-2">{section.title}</h3>
              <div className="text-sm text-white/60 whitespace-pre-line leading-relaxed">{section.content}</div>
              {section.tips && section.tips.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {section.tips.map((tip, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-white/40">
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
          <h3 className="text-sm font-medium text-white/50 mb-3">Vocabulario ({lesson.vocabulary.length} palabras)</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {lesson.vocabulary.map((item, i) => (
              <VocabCard key={i} item={item} language={lesson.language} />
            ))}
          </div>
        </div>
      )}

      {lesson.exercises && lesson.exercises.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/50 mb-3">Ejercicios</h3>
          <div className="space-y-3">
            {lesson.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} index={i} />
            ))}
          </div>
        </div>
      )}

      {lesson.notes && (
        <div className="glass-sm p-4 border-l-2 border-amber-500/30">
          <p className="text-sm text-white/50 italic">{lesson.notes}</p>
        </div>
      )}
    </div>
  )
}

function YAMLEditor({ onRender }: { onRender: (yaml: string) => void }) {
  const { activeLanguage } = useStore()
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
    setErrors(parsed ? validateLesson(parsed) : ['YAML inválido — revisa la sintaxis'])
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
      setErrors(['No se pudo generar la lección — revisa las palabras o que el backend esté activo'])
    }
    setGenerating(false)
  }

  function handleRender() {
    const parsed = parseLesson(yaml)
    if (!parsed) {
      setErrors(['YAML inválido — revisa la sintaxis'])
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

  function loadTemplate(t: 'vocab' | 'phonetics') {
    setTemplate(t)
    setYaml(t === 'vocab' ? LESSON_TEMPLATE_VOCAB : LESSON_TEMPLATE_PHONETICS)
    setErrors([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/40">Plantilla:</span>
        {(['vocab', 'phonetics'] as const).map(t => (
          <button
            key={t}
            onClick={() => loadTemplate(t)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-lg border transition-all',
              template === t ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/40 hover:text-white/70'
            )}
          >
            {t === 'vocab' ? 'Vocabulario' : 'Fonética'}
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
          className="glass-btn px-2.5 py-1 text-xs text-white/60 flex items-center gap-1.5"
        >
          <Upload size={12} />
          Subir .yml
        </button>
      </div>

      {activeLanguage === 'en' && (
        <div className="flex gap-1.5">
          <input
            className="glass-input flex-1 px-3 py-2 text-xs"
            placeholder="Genera desde palabras: accomplish, endeavor, insight..."
            value={genWords}
            onChange={e => setGenWords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !genWords.trim()}
            className="glass-btn px-3 text-xs text-blue-300 flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            Generar YAML
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
        <div className="glass-sm p-3 border border-red-500/20">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-300">
              <AlertCircle size={12} />
              {e}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleRender}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600/70 to-purple-600/70 hover:from-blue-600/90 hover:to-purple-600/90 border border-white/10 text-white transition-all"
      >
        Renderizar lección
      </button>
    </div>
  )
}

export function LessonsPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activeLesson, setActiveLesson] = useState<LessonYAML | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<number | null>(null)

  async function importVocabulary() {
    if (!activeLesson?.vocabulary?.length || importing) return
    setImporting(true)
    const words = lessonVocabToWords(activeLesson, new Date())
    const { data: existingRows } = await supabase
      .from('vocab_words')
      .select('word')
      .eq('language', activeLesson.language)
      .in('word', words.map(w => w.word))
    const existing = new Set((existingRows ?? []).map(r => r.word.toLowerCase()))
    const fresh = words.filter(w => !existing.has(w.word.toLowerCase()))
    if (fresh.length > 0) {
      await supabase.from('vocab_words').insert(fresh.map(w => ({ ...w, user_id: user!.id })))
    }
    setImported(fresh.length)
    setImporting(false)
  }

  useEffect(() => {
    fetchLessons()
  }, [activeLanguage])

  async function fetchLessons() {
    setLoading(true)
    // Garantiza que el contenido precargado ya esté insertado antes del primer fetch
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
    if (!parsed) return
    setActiveLesson(parsed)
    setImported(null)
    setShowEditor(false)

    const { data } = await supabase
      .from('lessons')
      .insert({ language: activeLanguage, title: parsed.title, yaml_content: yamlContent, user_id: user!.id, rendered_at: new Date().toISOString() })
      .select()
      .single()
    if (data) setLessons(prev => [data, ...prev])
  }

  function openLesson(lesson: Lesson) {
    const parsed = parseLesson(lesson.yaml_content)
    if (parsed) {
      setActiveLesson(parsed)
      setImported(null)
    }
  }

  const isEN = activeLanguage === 'en'

  return (
    <div className="space-y-5">
      {!activeLesson ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${isEN ? 'text-gradient-en' : 'text-gradient-pt'}`}>
                Lecciones {isEN ? '🇺🇸' : '🇧🇷'}
              </h1>
              <p className="text-white/40 text-sm mt-0.5">Crea lecciones con YAML, se renderizan aquí</p>
            </div>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                isEN
                  ? 'bg-blue-500/15 border-blue-500/25 text-blue-300 hover:bg-blue-500/25'
                  : 'bg-purple-500/15 border-purple-500/25 text-purple-300 hover:bg-purple-500/25'
              )}
            >
              <Plus size={15} />
              Nueva lección
            </button>
          </div>

          {showEditor && (
            <div className="glass p-5">
              <h2 className="text-sm font-medium text-white/70 mb-4">Editor YAML</h2>
              <YAMLEditor onRender={handleRenderYAML} />
            </div>
          )}

          {loading ? (
            <div className="glass p-8 text-center text-white/30 text-sm">Cargando...</div>
          ) : lessons.length === 0 && !showEditor ? (
            <div className="glass p-10 text-center">
              <p className="text-white/30 text-sm">No hay lecciones aún.</p>
              <button onClick={() => setShowEditor(true)} className="text-blue-400 text-sm mt-2 hover:underline">
                Crear primera lección con YAML
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
                    className="glass p-4 text-left hover:bg-white/[0.08] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{lesson.title}</p>
                        {parsed && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={isEN ? 'lang-badge-en' : 'lang-badge-pt'}>
                              {parsed.level}
                            </span>
                            <span className="text-xs text-white/30">{parsed.type}</span>
                            {parsed.vocabulary && (
                              <span className="text-xs text-white/30">{parsed.vocabulary.length} palabras</span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setActiveLesson(null)}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← Volver a lecciones
            </button>
            {(activeLesson.vocabulary?.length ?? 0) > 0 && (
              <button
                onClick={importVocabulary}
                disabled={importing || imported !== null}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all',
                  imported !== null
                    ? 'bg-green-500/10 border-green-500/25 text-green-300 cursor-default'
                    : 'bg-white/[0.06] border-white/15 text-white/70 hover:bg-white/[0.12]'
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
                    ? 'Ya estaban en tu glosario'
                    : `${imported} palabras agregadas al glosario`
                  : 'Agregar vocabulario al glosario'}
              </button>
            )}
          </div>
          <LessonRenderer lesson={activeLesson} />
        </div>
      )}
    </div>
  )
}
