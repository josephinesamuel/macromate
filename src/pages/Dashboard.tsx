import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateMacroTargets, type UserProfile, type MacroTargets } from '../lib/nutrition'
import DailyStatus from '../components/DailyStatus'
import MacroBar from '../components/MacroBar'
import MealCard, { type MealLog } from '../components/MealCard'
import BottomNav from '../components/BottomNav'

interface Totals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

function sumMeals(meals: MealLog[]): Totals {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories),
      protein_g: acc.protein_g + Number(m.protein_g),
      carbs_g: acc.carbs_g + Number(m.carbs_g),
      fat_g: acc.fat_g + Number(m.fat_g),
      fiber_g: acc.fiber_g + Number(m.fiber_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [meals, setMeals] = useState<MealLog[]>([])
  const [targets, setTargets] = useState<MacroTargets | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch profile + today's meals in parallel
    const today = new Date().toLocaleDateString('en-CA')

    const [profileResult, mealsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('meal_logs')
        .select('id, description, calories, protein_g, carbs_g, fat_g, fiber_g, logged_at')
        .eq('user_id', user.id)
        .eq('meal_date', today)
        .order('logged_at', { ascending: true }),
    ])

    if (profileResult.error || !profileResult.data) {
      setError('Could not load profile.')
      setLoading(false)
      return
    }

    const profile = profileResult.data as UserProfile
    setTargets(calculateMacroTargets(profile))
    setMeals((mealsResult.data as MealLog[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error: dbError } = await supabase.from('meal_logs').delete().eq('id', id)
    if (dbError) {
      setError(dbError.message)
    } else {
      setMeals((prev) => prev.filter((m) => m.id !== id))
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  const totals = sumMeals(meals)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(128px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">MacroMate</h1>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <div className="px-4 py-5 max-w-md mx-auto space-y-4">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Daily status */}
        {targets && (
          <DailyStatus tdee={targets.tdee} consumed={totals.calories} />
        )}

        {/* Macro bars */}
        {targets && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 space-y-4">
            <MacroBar
              label="Calories"
              consumed={totals.calories}
              target={targets.target}
              unit=" kcal"
            />
            <MacroBar label="Protein" consumed={totals.protein_g} target={targets.protein_g} />
            <MacroBar label="Carbs" consumed={totals.carbs_g} target={targets.carbs_g} />
            <MacroBar label="Fat" consumed={totals.fat_g} target={targets.fat_g} />
            <MacroBar label="Fiber" consumed={totals.fiber_g} target={targets.fiber_g} />
          </div>
        )}

        {/* Meals list */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Today's meals {meals.length > 0 && `(${meals.length})`}
          </p>
          {meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <p className="text-sm font-medium text-gray-500">Nothing logged yet today</p>
              <p className="text-xs text-gray-400">Tap "Log meal" below to add your first meal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onDelete={handleDelete}
                  deleting={deletingId === meal.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB — sits above bottom nav + home indicator */}
      <div className="fixed inset-x-0 flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom) + 12px)' }}>
        <button
          onClick={() => navigate('/log')}
          className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Log meal
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
