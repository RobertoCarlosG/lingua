import { useEffect, useState } from 'react'
import { BookOpen, AlertCircle, Flame, Target, TrendingUp, Calendar, Brain } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { languageConfig } from '@/lib/languages'
import { dateLocale } from '@/lib/i18n'
import { computeStreak, weeklyActivity, toDateString, type DayActivity } from '@/lib/stats'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

const WEEKLY_SESSION_GOAL = 5

// Colores hex para recharts (no acepta clases de Tailwind)
const CHART_COLORS: Record<string, { stroke: string; item: string }> = {
  en: { stroke: '#3b82f6', item: '#60a5fa' },
  pt: { stroke: '#a855f7', item: '#c084fc' },
}

export function DashboardPage() {
  const { activeLanguage } = useStore()
  const { t } = useTranslation()
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

  const config = languageConfig(activeLanguage)
  const chart = CHART_COLORS[activeLanguage] ?? CHART_COLORS.en
  const focus = t(`dashboard.focus.${activeLanguage}.${new Date().getDay()}`, { defaultValue: '' })
  const todayLabel = new Date().toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${config.theme.gradient}`}>
            {config.flag} {t('dashboard.title', { language: config.label })}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {t('dashboard.subtitle', { levels: config.levels })}
          </p>
        </div>
        <div className="flex items-center gap-2 glass-sm px-3 py-2">
          <Flame size={16} className={stats.streak > 0 ? 'text-orange-400' : 'text-white/20'} />
          <span className="text-sm font-medium text-white">
            {t('dashboard.streak', { count: stats.streak })}
          </span>
        </div>
      </div>

      {stats.due > 0 && (
        <Link
          to="/review"
          className={`flex items-center justify-between glass p-4 transition-all hover:bg-white/[0.08] border ${config.theme.border}`}
        >
          <div className="flex items-center gap-3">
            <Brain size={18} className={config.theme.accent} />
            <div>
              <p className="text-sm text-white font-medium">{t('dashboard.dueBanner', { count: stats.due })}</p>
              <p className="text-xs text-white/40">{t('dashboard.dueHint')}</p>
            </div>
          </div>
          <span className="text-white/40 text-sm">{t('dashboard.reviewCta')}</span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('dashboard.words'), value: stats.words, icon: BookOpen, color: config.theme.accent },
          { label: t('dashboard.errors'), value: stats.errors, icon: AlertCircle, color: 'text-amber-400' },
          { label: t('dashboard.sessions'), value: stats.sessions, icon: Calendar, color: 'text-teal-400' },
          { label: t('dashboard.activeDays'), value: `${stats.sessionsThisWeek}/${WEEKLY_SESSION_GOAL}`, icon: Target, color: 'text-green-400' },
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
          <h2 className="text-sm font-medium text-white/70">{t('dashboard.chartTitle')}</h2>
        </div>
        {week.every(d => d.count === 0) ? (
          <p className="text-sm text-white/30 text-center py-8">
            <Trans
              i18nKey="dashboard.noActivity"
              components={{ reviewLink: <Link to="/review" className="text-blue-400 hover:underline" /> }}
            />
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={week}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.stroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chart.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: chart.item }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name={t('dashboard.chartSeries')}
                stroke={chart.stroke}
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
          <h2 className="text-sm font-medium text-white/70">{t('dashboard.today', { date: todayLabel })}</h2>
        </div>
        <p className="text-white/60 text-sm">{focus}</p>
      </div>

      <div className="glass p-5">
        <h2 className="text-sm font-medium text-white/70 mb-3">{t('dashboard.weekActivity')}</h2>
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
              <div
                className="w-2 h-2 rounded-full mx-auto"
                style={{ backgroundColor: count > 0 ? chart.stroke : 'rgba(255,255,255,0.2)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
