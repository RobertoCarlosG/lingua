import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_COMMANDS = [
  '[vocabulario]',
  '[lectura]',
  '[fonética]',
  '[shadowing]',
  '[debate]',
  '[repaso]',
]

const PT_COMMANDS = [
  '[vocabulario-pt]',
  '[falsos amigos]',
  '[fonética-pt]',
  '[conversación-pt]',
]

const SYSTEM_PROMPT = `Eres un tutor de idiomas para Roberto, hablante nativo de español (mexicano).

CONTEXTO DEL ESTUDIANTE:
- Inglés: nivel A2-B1 (estuvo cerca de B2, sin práctica 4+ años). Meta: C1.
- Portugués: nivel A1 (principiante). Meta: B2. Se basa en español como ventaja.
- Prioridades: lectura → vocabulario → speaking → fonética

REGLAS:
1. Cuando el usuario escriba un comando entre corchetes como [vocabulario], ejecuta esa actividad inmediatamente.
2. Corrige SIEMPRE los errores en inglés o portugués antes de responder. Explica el porqué.
3. Incluye pronunciación IPA cuando presentes palabras nuevas. Portugués = PT-BR.
4. Usa español para instrucciones/explicaciones. El idioma meta para las actividades.
5. Si el error es recurrente, indícalo explícitamente.
6. Para [vocabulario]: presenta 5-8 palabras con word, IPA, translation, definition, example.
7. Para [fonética] o [fonética-pt]: explica el sonido con analogías del español, ejemplos y práctica.
8. Para [shadowing]: da un párrafo corto con anotaciones fonéticas clave.
9. Para [debate]: toma posición y defiéndela en inglés, espera respuesta del usuario.
10. Sé directo y exigente. No simplifiques de más. Empuja el nivel.`

export function ChatPage() {
  const { activeLanguage } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: activeLanguage === 'en'
        ? "¡Listo para practicar! 🇺🇸\n\nPuedes usar un comando rápido o simplemente escribirme en inglés y te corrijo. ¿Qué hacemos hoy?\n\n**Comandos disponibles:** [vocabulario] [lectura] [fonética] [shadowing] [debate] [repaso]"
        : "Pronto para praticar! 🇧🇷\n\nUsa um comando ou escreve em português e te corrijo. O que fazemos hoje?\n\n**Comandos:** [vocabulario-pt] [falsos amigos] [fonética-pt] [conversación-pt]",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isEN = activeLanguage === 'en'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const apiMessages = [...messages, userMsg]
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT + `\n\nIDIOMA ACTIVO: ${activeLanguage === 'en' ? 'Inglés' : 'Portugués'}`,
          messages: apiMessages,
        }),
      })

      const data = await response.json()
      const replyText = data.content?.[0]?.text ?? 'Error en la respuesta.'

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error conectando con la API. Verifica tu configuración.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function renderContent(content: string) {
    return content
      .split('\n')
      .map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        const withIPA = bold.replace(/\/([^/]+)\//g, '<code class="ipa">/$1/</code>')
        return <p key={i} className={cn('', line === '' && 'h-2')} dangerouslySetInnerHTML={{ __html: withIPA }} />
      })
  }

  const commands = isEN ? QUICK_COMMANDS : PT_COMMANDS

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-semibold ${isEN ? 'text-gradient-en' : 'text-gradient-pt'}`}>
            Práctica IA {isEN ? '🇺🇸' : '🇧🇷'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Tu tutor personal de idiomas</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-300">Activo</span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {commands.map(cmd => (
          <button
            key={cmd}
            onClick={() => sendMessage(cmd)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-mono border transition-all',
              isEN
                ? 'bg-blue-500/10 border-blue-500/15 text-blue-300/70 hover:bg-blue-500/20 hover:text-blue-200'
                : 'bg-purple-500/10 border-purple-500/15 text-purple-300/70 hover:bg-purple-500/20 hover:text-purple-200'
            )}
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-blue-600 to-purple-700'
                : 'bg-white/10 border border-white/15'
            )}>
              {msg.role === 'assistant'
                ? <Sparkles size={13} className="text-white" />
                : <User size={13} className="text-white/60" />
              }
            </div>
            <div
              className={cn(
                'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1',
                msg.role === 'assistant'
                  ? 'glass rounded-tl-sm'
                  : isEN
                    ? 'bg-blue-600/25 border border-blue-500/20 rounded-tr-sm'
                    : 'bg-purple-600/25 border border-purple-500/20 rounded-tr-sm'
              )}
            >
              <div className="text-white/80 [&_strong]:text-white [&_strong]:font-semibold [&_.ipa]:font-mono [&_.ipa]:text-xs [&_.ipa]:bg-white/10 [&_.ipa]:px-1.5 [&_.ipa]:py-0.5 [&_.ipa]:rounded [&_.ipa]:text-white/60">
                {renderContent(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="glass-input flex-1 px-4 py-3 text-sm"
          placeholder={isEN ? 'Write in English or use a command...' : 'Escreve em português ou usa um comando...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className={cn(
            'px-4 py-3 rounded-xl border transition-all',
            isEN
              ? 'bg-blue-600/70 hover:bg-blue-600/90 border-blue-500/30'
              : 'bg-purple-600/70 hover:bg-purple-600/90 border-purple-500/30',
            'disabled:opacity-40 disabled:cursor-not-allowed text-white'
          )}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
