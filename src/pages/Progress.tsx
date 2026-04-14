import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateMacroTargets, type UserProfile, type MacroTargets } from '../lib/nutrition'
import BottomNav from '../components/BottomNav'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface DayStats {
  date: string    // YYYY-MM-DD
  label: string   // "Apr 3"
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  deficit: number
}

function getToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('en-CA'))
  }
  return days
}

function formatLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface StatCardProps {
  label: string
  main: string
  sub: string
}

function StatCard({ label, main, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-900 leading-tight">{main}</p>
      <p className="text-[11px] text-gray-400">{sub}</p>
    </div>
  )
}

export default function Progress() {
  const [dayStats, setDayStats] = useState<DayStats[]>([])
  const [targets, setTargets] = useState<MacroTargets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const last30 = getLast30Days()
      const cutoffDate = last30[0]

      const [profileResult, logsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('meal_logs')
          .select('meal_date, calories, protein_g, carbs_g, fat_g, fiber_g')
          .eq('user_id', user.id)
          .gte('meal_date', cutoffDate)
          .order('meal_date', { ascending: true }),
      ])

      if (profileResult.error || !profileResult.data) {
        setError('Could not load profile.')
        setLoading(false)
        return
      }

      const macroTargets = calculateMacroTargets(profileResult.data as UserProfile)
      setTargets(macroTargets)

      // Group logs by date
      const grouped = new Map<string, { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }>()
      for (const row of logsResult.data ?? []) {
        const existing = grouped.get(row.meal_date) ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
        grouped.set(row.meal_date, {
          calories:   existing.calories   + Number(row.calories),
          protein_g:  existing.protein_g  + Number(row.protein_g),
          carbs_g:    existing.carbs_g    + Number(row.carbs_g),
          fat_g:      existing.fat_g      + Number(row.fat_g),
          fiber_g:    existing.fiber_g    + Number(row.fiber_g),
        })
      }

      // Build stats only for dates that have data
      const stats: DayStats[] = []
      for (const date of last30) {
        const day = grouped.get(date)
        if (!day) continue
        stats.push({
          date,
          label: formatLabel(date),
          ...day,
          deficit: macroTargets.tdee - day.calories,
        })
      }

      setDayStats(stats)
      setLoading(false)
    }

    fetchData()
  }, [])

  // --- Derived stats ---
  const today = getToday()
  const completedDays = dayStats.filter(d => d.date !== today)  // exclude today (incomplete)
  const todayData    = dayStats.find(d => d.date === today)

  // Weekly avg: last 7 completed days
  const recentCompleted = completedDays.slice(-7)

  const avgCalories = recentCompleted.length > 0
    ? Math.round(recentCompleted.reduce((s, d) => s + d.calories, 0) / recentCompleted.length)
    : 0

  const avgProtein = recentCompleted.length > 0
    ? Math.round(recentCompleted.reduce((s, d) => s + d.protein_g, 0) / recentCompleted.length)
    : 0

  // Streak: consecutive completed days from most recent backwards where deficit ≥ 200
  let streak = 0
  for (let i = completedDays.length - 1; i >= 0; i--) {
    if (completedDays[i].deficit >= 200) streak++
    else break
  }

  // Chart data: target = TDEE - 500 (calorie target, not TDEE)
  const calChartData = dayStats.map(d => ({
    label: d.label,
    Consumed: d.calories,
    Target: targets?.target ?? 0,
  }))

  const macroChartData = dayStats.map(d => ({
    label: d.label,
    Protein: Math.round(d.protein_g),
    Carbs:   Math.round(d.carbs_g),
    Fat:     Math.round(d.fat_g),
  }))

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 24px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">Progress</h1>
        <p className="text-xs text-gray-400">Last 30 days</p>
      </div>

      <div className="px-4 py-5 max-w-md mx-auto space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && dayStats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-gray-500">No data yet</p>
            <p className="text-xs text-gray-400">Log meals for a few days and come back here.</p>
          </div>
        )}

        {!loading && !error && dayStats.length > 0 && (
          <>
            {/* Section 1 — Two stat cards */}
            <section className="grid grid-cols-2 gap-3">
              <StatCard
                label="Weekly avg"
                main={`${avgCalories} kcal/day · ${recentCompleted.length}d`}
                sub={`Today so far: ${todayData ? todayData.calories : 0} kcal`}
              />
              <StatCard
                label="Avg protein"
                main={`${avgProtein}g/day`}
                sub={`Today so far: ${todayData ? Math.round(todayData.protein_g) : 0}g`}
              />
            </section>

            {/* Section 2 — Streak */}
            <section className="rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between">
              {streak === 0 ? (
                <p className="text-sm font-medium text-gray-500">Start your streak today!</p>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Current streak</p>
                    <p className="text-xs text-gray-400">Consecutive days on track or good</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{streak} 🔥</p>
                    <p className="text-xs text-gray-400">day{streak !== 1 ? 's' : ''}</p>
                  </div>
                </>
              )}
            </section>

            {/* Section 3 — 30-day calorie line chart */}
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Calories — 30 days</p>
              <div className="rounded-xl border border-gray-200 bg-white px-2 py-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={calChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value) => [`${value} kcal`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="Consumed"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#111827' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Target"
                      stroke="#d1d5db"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Section 4 — 30-day macro stacked bar */}
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Macros — 30 days</p>
              <div className="rounded-xl border border-gray-200 bg-white px-2 py-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={macroChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value, name) => [`${value}g`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Bar dataKey="Protein" stackId="macros" fill="#3b82f6" />
                    <Bar dataKey="Carbs"   stackId="macros" fill="#f59e0b" />
                    <Bar dataKey="Fat"     stackId="macros" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
