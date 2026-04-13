import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateMacroTargets, type UserProfile, type MacroTargets } from '../lib/nutrition'
import DaySummaryCard, { type DayData } from '../components/DaySummaryCard'
import BottomNav from '../components/BottomNav'
import type { MealLog } from '../components/MealCard'

interface RawMealLog extends MealLog {
  meal_date: string
}

export default function History() {
  const [days, setDays] = useState<DayData[]>([])
  const [targets, setTargets] = useState<MacroTargets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cutoff: 30 days ago in local time
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const cutoffDate = cutoff.toLocaleDateString('en-CA')

      const [profileResult, logsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('meal_logs')
          .select('id, description, calories, protein_g, carbs_g, fat_g, fiber_g, logged_at, meal_date')
          .eq('user_id', user.id)
          .gte('meal_date', cutoffDate)
          .order('meal_date', { ascending: false })
          .order('logged_at', { ascending: true }),
      ])

      if (profileResult.error || !profileResult.data) {
        setError('Could not load profile.')
        setLoading(false)
        return
      }

      setTargets(calculateMacroTargets(profileResult.data as UserProfile))

      // Group meals by meal_date
      const logs = (logsResult.data ?? []) as RawMealLog[]
      const grouped = new Map<string, RawMealLog[]>()

      for (const log of logs) {
        const existing = grouped.get(log.meal_date) ?? []
        existing.push(log)
        grouped.set(log.meal_date, existing)
      }

      // Build DayData array, most recent first
      const result: DayData[] = []
      for (const [date, meals] of grouped.entries()) {
        const totals = meals.reduce(
          (acc, m) => ({
            calories: acc.calories + Number(m.calories),
            protein_g: acc.protein_g + Number(m.protein_g),
            carbs_g: acc.carbs_g + Number(m.carbs_g),
            fat_g: acc.fat_g + Number(m.fat_g),
            fiber_g: acc.fiber_g + Number(m.fiber_g),
          }),
          { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
        )
        result.push({ date, meals, ...totals })
      }

      // Sort most recent first (grouped map preserves DB order but let's be explicit)
      result.sort((a, b) => b.date.localeCompare(a.date))

      setDays(result)
      setLoading(false)
    }

    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 24px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">History</h1>
        <p className="text-xs text-gray-400">Last 30 days</p>
      </div>

      <div className="px-4 py-5 max-w-md mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && days.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-gray-500">No history yet</p>
            <p className="text-xs text-gray-400">Meals you log will appear here, grouped by day.</p>
          </div>
        )}

        {!loading && targets && days.length > 0 && (
          <div className="space-y-3">
            {days.map((day) => (
              <DaySummaryCard key={day.date} day={day} targets={targets} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
