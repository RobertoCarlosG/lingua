import { useEffect, useState } from 'react'
import { BookOpen, AlertCircle, Flame, Target, TrendingUp, Calendar, Brain } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { getLanguageFlag } from '@/lib/utils'
import { computeStreak, weeklyActivity, toDateString, type DayActivity } from '@/lib/stats'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

const WEEKLY_SESSION_GOAL = 5

const FOCUS_BY_DAY: Record<number, { en: string; pt: string }> = {
  0: { en: 'Repaso libre + lectura ligera', pt: 'Revisão livre + leitura leve' },
  1: { en: 'Vocabulario nuevo + repaso SRS', pt: 'Vocabulario nuevo + repaso SRS' },
  2: { en: 'Lectura + comprensión', pt: 'Lectura + falsos amigos' },
  3: { en: 'Gramática en contexto', pt: 'Gramática + conjugaciones' },
  4: { en: 'Escritura + corrección de errores', pt: 'Escritura + vocabulario' },
  5: { en: 'Fonética + shadowing', pt: 'Fonética PT-BR + repaso semanal' },
  6: { en: 'Repaso de la semana', pt: 'Repaso de la semana' },
}

export function DashboardPage() {
  const { activeLanguage } = useStore()
  const [stats, setStats] = useState({ words: 0, errors: 0, sessions: 0, streak: 0, due: 0, sessionsThisWeek: 0 })
  const [week, setWeek] = useState<DayActivity[]>([])

  useEffect(() => {
    async function fetchStats() {
      const today = toDateString(new Date())
      const since = new Date()
      since.setDate(since.getDate() - 60)

      const [wordsRes, errorsRes, sessionsRes, dueRes, logsRes] = await Promise.all([
        supabase.from('vocab_words').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('error_entries').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('session_logs').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('vocab_words').select('id', { count: 'exact', head: true })
          .eq('language', activeLanguage)
          .or(`due_at.is.null,due_at.lte.${new Date().toISOString()}`),
        supabase.from('session_logs').select('date, words_reviewed')
          .eq('language', activeLanguage)
          .gte('date', toDateString(since)),
      ])

      const logs = logsRes.data ?? []
      const weekData = weeklyActivity(
        logs.map(l => ({ date: l.date, count: l.words_reviewed ?? 0 })),
        today
      )
      const activeDaysThisWeek = new Set(
        weekData.filter(d => d.count > 0).map(d => d.date)
      ).size

      setStats({
        words: wordsRes.count ?? 0,
        errors: errorsRes.count ?? 0,
        sessions: sessionsRes.count ?? 0,
        due: dueRes.count ?? 0,
        streak: computeStreak(logs.map(l => l.date), today),
        sessionsThisWeek: activeDaysThisWeek,
      })
      setWeek(weekData)
    }
    fetchStats()
  }, [activeLanguage])

  const flag = getLanguageFlag(activeLanguage)
  const isEN = activeLanguage === 'en'
  const accentClass = isEN ? 'text-gradient-en' : 'text-gradient-pt'
  const focus = FOCUS_BY_DAY[new Date().getDay()][activeLanguage]
  const todayLabel = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${accentClass}`}>
            {flag} {isEN ? 'English Progress' : 'Progresso do Português'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isEN ? 'Nivel actual: A2 → B1 · Meta: C1' : 'Nivel actual: A1 · Meta: B2'}
          </p>
        </div>
        <div className="flex items-center gap-2 glass-sm px-3 py-2">
          <Flame size={16} className={stats.streak > 0 ? 'text-orange-400' : 'text-white/20'} />
          <span className="text-sm font-medium text-white">
            {stats.streak} {stats.streak === 1 ? 'día seguido' : 'días seguidos'}
          </span>
        </div>
      </div>

      {stats.due > 0 && (
        <Link
          to="/review"
          className={`flex items-center justify-between glass p-4 transition-all hover:bg-white/[0.08] border ${
            isEN ? 'border-blue-500/20' : 'border-purple-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <Brain size={18} className={isEN ? 'text-blue-400' : 'text-purple-400'} />
            <div>
              <p className="text-sm text-white font-medium">{stats.due} palabras listas para repasar</p>
              <p className="text-xs text-white/40">La repetición espaciada funciona si es diaria</p>
            </div>
          </div>
          <span className="text-white/40 text-sm">Repasar →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Palabras', value: stats.words, icon: BookOpen, color: isEN ? 'text-blue-400' : 'text-purple-400' },
          { label: 'Errores registrados', value: stats.errors, icon: AlertCircle, color: 'text-amber-400' },
          { label: 'Sesiones', value: stats.sessions, icon: Calendar, color: 'text-teal-400' },
          { label: 'Días activos (semana)', value: `${stats.sessionsThisWeek}/${WEEKLY_SESSION_GOAL}`, icon: Target, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="text-2xl font-semibold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-white/40" />
          <h2 className="text-sm font-medium text-white/70">Palabras repasadas — últimos 7 días</h2>
        </div>
        {week.every(d => d.count === 0) ? (
          <p className="text-sm text-white/30 text-center py-8">
            Aún no hay actividad esta semana. Tu primera <Link to="/review" className="text-blue-400 hover:underline">sesión de repaso</Link> aparecerá aquí.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={week}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isEN ? '#3b82f6' : '#a855f7'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isEN ? '#3b82f6' : '#a855f7'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: isEN ? '#60a5fa' : '#c084fc' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="palabras"
                stroke={isEN ? '#3b82f6' : '#a855f7'}
                strokeWidth={2}
                fill="url(#colorWords)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-white/40" />
          <h2 className="text-sm font-medium text-white/70">Hoy — {todayLabel}</h2>
        </div>
        <p className="text-white/60 text-sm">{focus}</p>
      </div>

      <div className="glass p-5">
        <h2 className="text-sm font-medium text-white/70 mb-3">Actividad de la semana</h2>
        <div className="grid grid-cols-7 gap-2">
          {week.map(({ date, day, count }) => (
            <div
              key={date}
              className={`rounded-xl p-3 text-center border ${
                count > 0
                  ? 'bg-white/[0.08] border-white/[0.12]'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <p className="text-xs text-white/40 mb-1">{day}</p>
              <div className={`w-2 h-2 rounded-full mx-auto ${count > 0 ? (isEN ? 'bg-blue-400' : 'bg-purple-400') : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
