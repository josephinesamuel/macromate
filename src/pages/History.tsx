import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateMacroTargets, type UserProfile, type MacroTargets } from '../lib/nutrition'
import DaySummaryCard, { type DayData } from '../components/DaySummaryCard'
import BottomNav from '../components/BottomNav'
import type { MealLog } from '../components/MealCard'

interface RawMealLog extends MealLog {
  meal_date: string
}

function buildDays(logs: RawMealLog[]): DayData[] {
  const grouped = new Map<string, RawMealLog[]>()
  for (const log of logs) {
    const existing = grouped.get(log.meal_date) ?? []
    existing.push(log)
    grouped.set(log.meal_date, existing)
  }

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

  result.sort((a, b) => b.date.localeCompare(a.date))
  return result
}

export default function History() {
  const [days, setDays] = useState<DayData[]>([])
  const [targets, setTargets] = useState<MacroTargets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reLoggingId, setReLoggingId] = useState<string | null>(null)
  const [reLoggedIds, setReLoggedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const cutoffDate = cutoff.toLocaleDateString('en-CA')

      const [profileResult, logsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('meal_logs')
          .select('id, description, calories, protein_g, carbs_g, fat_g, fiber_g, logged_at, meal_date, raw_input, ai_breakdown')
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
      setDays(buildDays((logsResult.data ?? []) as RawMealLog[]))
      setLoading(false)
    }

    fetchHistory()
  }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error: dbError } = await supabase.from('meal_logs').delete().eq('id', id)
    if (dbError) {
      setError(dbError.message)
      setDeletingId(null)
      return
    }

    // Remove meal from local state; drop entire day if it becomes empty
    setDays((prev) =>
      prev
        .map((day) => ({
          ...day,
          meals: day.meals.filter((m) => m.id !== id),
        }))
        .filter((day) => day.meals.length > 0)
        // Recalculate day totals after removal
        .map((day) => {
          const totals = day.meals.reduce(
            (acc, m) => ({
              calories: acc.calories + Number(m.calories),
              protein_g: acc.protein_g + Number(m.protein_g),
              carbs_g: acc.carbs_g + Number(m.carbs_g),
              fat_g: acc.fat_g + Number(m.fat_g),
              fiber_g: acc.fiber_g + Number(m.fiber_g),
            }),
            { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
          )
          return { ...day, ...totals }
        })
    )
    setDeletingId(null)
  }

  async function handleReLog(meal: MealLog, date: string) {
    setReLoggingId(meal.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReLoggingId(null)
      return
    }

    const { error: dbError } = await supabase.from('meal_logs').insert({
      user_id: user.id,
      description: meal.description,
      ai_breakdown: {},
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      fiber_g: meal.fiber_g,
      meal_date: date,
    })

    setReLoggingId(null)

    if (!dbError) {
      setReLoggedIds((prev) => new Set(prev).add(meal.id))
    } else {
      setError(dbError.message)
    }
  }

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
              <DaySummaryCard
                key={day.date}
                day={day}
                targets={targets}
                onDelete={handleDelete}
                deletingId={deletingId}
                onReLog={handleReLog}
                reLoggingId={reLoggingId}
                reLoggedIds={reLoggedIds}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
