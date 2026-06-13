import { useEffect, useState } from 'react'
import { BookOpen, AlertCircle, Flame, Target, TrendingUp, Calendar, Brain, CheckSquare, Square, Plus, ArrowRight } from 'lucide-react'
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

const CHART_COLORS: Record<string, { stroke: string; item: string }> = {
  en: { stroke: '#5896FF', item: '#96BCFF' },
  pt: { stroke: '#5896FF', item: '#96BCFF' },
  ja: { stroke: '#5896FF', item: '#96BCFF' },
}

export function DashboardPage() {
  const { activeLanguage } = useStore()
  const { t } = useTranslation()
  const [stats, setStats] = useState({ words: 0, errors: 0, sessions: 0, streak: 0, due: 0, sessionsThisWeek: 0, lessons: 0 })
  const [week, setWeek] = useState<DayActivity[]>([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function fetchStats() {
      const today = toDateString(new Date())
      const since = new Date()
      since.setDate(since.getDate() - 60)
      const locale = dateLocale()

      const [authRes, wordsRes, errorsRes, sessionsRes, dueRes, logsRes, lessonsRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('vocab_words').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('error_entries').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('session_logs').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
        supabase.from('vocab_words').select('id', { count: 'exact', head: true })
          .eq('language', activeLanguage)
          .or(`due_at.is.null,due_at.lte.${new Date().toISOString()}`),
        supabase.from('session_logs').select('date, words_reviewed')
          .eq('language', activeLanguage)
          .gte('date', toDateString(since)),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('language', activeLanguage),
      ])

      const user = authRes.data?.user
      if (user) {
        setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '')
      }

      const logs = logsRes.data ?? []
      const weekData = weeklyActivity(
        logs.map(l => ({ date: l.date, count: l.words_reviewed ?? 0 })),
        today,
        locale
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
        lessons: lessonsRes.count ?? 0,
      })
      setWeek(weekData)
    }
    fetchStats()
  }, [activeLanguage])

  const config = languageConfig(activeLanguage)
  const chart = CHART_COLORS[activeLanguage] ?? CHART_COLORS.en
  const focus = t(`dashboard.focus.${activeLanguage}.${new Date().getDay()}`, { defaultValue: '' })
  const todayLabel = new Date().toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

  const isEmpty = stats.words === 0 && stats.sessions === 0

  const checklistSteps = [
    { label: t('dashboard.step1'), done: stats.words > 0, to: '/vocabulary', disabled: false, hint: undefined },
    { label: t('dashboard.step2'), done: stats.lessons > 0, to: '/lessons', disabled: false, hint: undefined },
    {
      label: t('dashboard.step3'),
      done: stats.sessions > 0,
      to: '/review',
      disabled: stats.words === 0,
      hint: stats.words === 0 ? t('dashboard.step3Hint') : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gradient-brand">
            {isEmpty
              ? t('dashboard.welcome', { name: userName || '…' })
              : `${config.flag} ${t('dashboard.title', { language: config.label })}`
            }
          </h1>
          <p className="text-2 text-sm mt-1">
            {t('dashboard.subtitle', { levels: config.levels })}
          </p>
        </div>
        <div className="flex items-center gap-2 glass-sm px-3.5 py-2.5 shrink-0">
          <Flame size={18} className={stats.streak > 0 ? 'text-orange-400' : 'text-3'} />
          <span className="text-sm font-semibold text-1">
            {t('dashboard.streak', { count: stats.streak })}
          </span>
        </div>
      </div>

      {stats.due > 0 && (
        <Link
          to="/review"
          className="group flex items-center justify-between glass-interactive p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-soft to-accent-strong flex items-center justify-center shadow-[0_6px_18px_-6px_rgba(45,110,235,0.9)]">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-1 font-semibold">{t('dashboard.dueBanner', { count: stats.due })}</p>
              <p className="text-xs text-2 mt-0.5">{t('dashboard.dueHint')}</p>
            </div>
          </div>
          <span className="btn btn-primary pointer-events-none">{t('dashboard.reviewCta')}</span>
        </Link>
      )}

      {isEmpty ? (
        <div className="glass p-5 space-y-2">
          <h2 className="text-sm font-semibold text-2 mb-3">{t('dashboard.getStarted')}</h2>
          {checklistSteps.map(({ label, done, to, disabled, hint }) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                done
                  ? 'bg-white/[0.02] border-white/[0.06]'
                  : disabled
                  ? 'bg-white/[0.02] border-white/[0.06] opacity-50'
                  : 'bg-accent/[0.06] border-accent/25 hover:bg-accent/[0.10]'
              }`}
            >
              {done
                ? <CheckSquare size={17} className="text-accent-soft shrink-0" />
                : <Square size={17} className={`shrink-0 ${disabled ? 'text-3' : 'text-2'}`} />
              }
              {disabled ? (
                <span className="text-sm text-3 flex-1">
                  {label}
                  {hint && <span className="text-xs ml-2 opacity-60">— {hint}</span>}
                </span>
              ) : (
                <Link
                  to={to}
                  className={`text-sm flex-1 ${done ? 'text-3 line-through pointer-events-none' : 'text-1 hover:text-accent-soft'}`}
                >
                  {label}
                </Link>
              )}
              {!done && !disabled && <ArrowRight size={14} className="text-3 shrink-0" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('dashboard.words'), value: stats.words, icon: BookOpen, color: 'text-accent-soft', bg: 'from-accent/25 to-accent/5' },
            { label: t('dashboard.errors'), value: stats.errors, icon: AlertCircle, color: 'text-amber-300', bg: 'from-amber-400/25 to-amber-400/5' },
            { label: t('dashboard.sessions'), value: stats.sessions, icon: Calendar, color: 'text-teal-300', bg: 'from-teal-400/25 to-teal-400/5' },
            { label: t('dashboard.activeDays'), value: `${stats.sessionsThisWeek}/${WEEKLY_SESSION_GOAL}`, icon: Target, color: 'text-green-300', bg: 'from-green-400/25 to-green-400/5' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-xs text-2 font-medium">{label}</p>
                <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center`}>
                  <Icon size={14} className={color} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-1 mt-1 tracking-tight">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent-soft" />
          <h2 className="text-sm font-semibold text-2">{t('dashboard.chartTitle')}</h2>
        </div>
        {isEmpty ? (
          <Link
            to="/vocabulary"
            className="group flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-accent/25 hover:border-accent/50 hover:bg-accent/[0.05] transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center">
              <Plus size={22} className="text-accent-soft" />
            </div>
            <span className="text-sm font-semibold text-accent-soft group-hover:underline">
              {t('dashboard.addFirstWords')}
            </span>
          </Link>
        ) : week.every(d => d.count === 0) ? (
          <p className="text-sm text-3 text-center py-8">
            <Trans
              i18nKey="dashboard.noActivity"
              components={{ reviewLink: <Link to="/review" className="text-accent-soft hover:underline" /> }}
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
          <Calendar size={16} className="text-accent-soft" />
          <h2 className="text-sm font-semibold text-2">{t('dashboard.today', { date: todayLabel })}</h2>
        </div>
        <p className="text-2 text-sm leading-relaxed">{focus}</p>
      </div>

      {!isEmpty && (
        <div className="glass p-5">
          <h2 className="text-sm font-semibold text-2 mb-3">{t('dashboard.weekActivity')}</h2>
          <div className="grid grid-cols-7 gap-2">
            {week.map(({ date, day, count }) => (
              <div
                key={date}
                className={`rounded-2xl p-3 text-center border transition-colors ${
                  count > 0
                    ? 'bg-accent/[0.12] border-accent/25'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                <p className="text-xs text-3 mb-1.5">{day}</p>
                <div
                  className="w-2 h-2 rounded-full mx-auto"
                  style={{
                    backgroundColor: count > 0 ? chart.stroke : 'rgba(255,255,255,0.2)',
                    boxShadow: count > 0 ? `0 0 10px ${chart.stroke}` : 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
