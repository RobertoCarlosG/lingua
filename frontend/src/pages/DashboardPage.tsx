import { useEffect, useState } from 'react'
import { BookOpen, AlertCircle, Flame, Target, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { getLanguageFlag } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

const SAMPLE_PROGRESS = [
  { day: 'Lun', words: 8, minutes: 55 },
  { day: 'Mar', words: 12, minutes: 65 },
  { day: 'Mié', words: 5, minutes: 40 },
  { day: 'Jue', words: 15, minutes: 70 },
  { day: 'Vie', words: 10, minutes: 60 },
]

const TODAY_SCHEDULE = {
  en: { day: 'Jueves', focus: 'Escritura + gramática en contexto', activities: ['[escritura]', '[gramática]', '[vocabulario]'] },
  pt: { day: 'Viernes', focus: 'Vocabulario PT + repaso semanal', activities: ['[vocabulario-pt]', '[repaso]', '[falsos amigos]'] },
}

export function DashboardPage() {
  const { activeLanguage } = useStore()
  const [stats, setStats] = useState({ words: 0, errors: 0, sessions: 0, streak: 0 })

  useEffect(() => {
    async function fetchStats() {
      const [wordsRes, errorsRes, sessionsRes] = await Promise.all([
        supabase.from('vocab_words').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('error_entries').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('session_logs').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
      ])
      setStats({
        words: wordsRes.count ?? 0,
        errors: errorsRes.count ?? 0,
        sessions: sessionsRes.count ?? 0,
        streak: 3,
      })
    }
    fetchStats()
  }, [activeLanguage])

  const flag = getLanguageFlag(activeLanguage)
  const isEN = activeLanguage === 'en'
  const accentClass = isEN ? 'text-gradient-en' : 'text-gradient-pt'
  const schedule = TODAY_SCHEDULE[activeLanguage]

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
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-white">{stats.streak} días seguidos</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Palabras', value: stats.words, icon: BookOpen, color: isEN ? 'text-blue-400' : 'text-purple-400' },
          { label: 'Errores registrados', value: stats.errors, icon: AlertCircle, color: 'text-amber-400' },
          { label: 'Sesiones', value: stats.sessions, icon: Calendar, color: 'text-teal-400' },
          { label: 'Objetivo semanal', value: '4/5', icon: Target, color: 'text-green-400' },
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
          <h2 className="text-sm font-medium text-white/70">Palabras aprendidas esta semana</h2>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={SAMPLE_PROGRESS}>
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
              dataKey="words"
              stroke={isEN ? '#3b82f6' : '#a855f7'}
              strokeWidth={2}
              fill="url(#colorWords)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-white/40" />
          <h2 className="text-sm font-medium text-white/70">Sesión de hoy — {schedule.day}</h2>
        </div>
        <p className="text-white/60 text-sm mb-4">{schedule.focus}</p>
        <div className="flex flex-wrap gap-2">
          {schedule.activities.map((act) => (
            <span
              key={act}
              className={`px-3 py-1 rounded-lg text-xs font-mono border ${
                isEN
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
              }`}
            >
              {act}
            </span>
          ))}
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-sm font-medium text-white/70 mb-3">Plan semanal</h2>
        <div className="grid grid-cols-5 gap-2">
          {WEEK_DAYS.map((day, i) => (
            <div
              key={day}
              className={`rounded-xl p-3 text-center border ${
                i < 3
                  ? 'bg-white/[0.08] border-white/[0.12]'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <p className="text-xs text-white/40 mb-1">{day}</p>
              <div className={`w-2 h-2 rounded-full mx-auto ${i < 3 ? (isEN ? 'bg-blue-400' : 'bg-purple-400') : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
