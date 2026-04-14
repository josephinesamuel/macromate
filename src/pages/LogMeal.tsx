import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type MealEstimate } from '../lib/ai'
import MealInput from '../components/MealInput'

function getToday() {
  return new Date().toLocaleDateString('en-CA')
}

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toLocaleDateString('en-CA')
}

export default function LogMeal() {
  const navigate = useNavigate()
  const [mealDate, setMealDate] = useState(getToday())
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLog(description: string, estimate: MealEstimate) {
    setError(null)
    setLogging(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not logged in.')
      setLogging(false)
      return
    }

    // Build one insert row per meal group
    const rows = estimate.meals.map((meal) => ({
      user_id: user.id,
      description: meal.meal_name,
      ai_breakdown: meal,
      calories: meal.totals.calories,
      protein_g: meal.totals.protein_g,
      carbs_g: meal.totals.carbs_g,
      fat_g: meal.totals.fat_g,
      fiber_g: meal.totals.fiber_g,
      meal_date: mealDate,
      raw_input: description,
    }))

    const { error: dbError } = await supabase.from('meal_logs').insert(rows)

    if (dbError) {
      setError(dbError.message)
      setLogging(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Log a meal</h1>
        <p className="text-sm text-gray-500 mb-6">
          Describe what you ate — in Bahasa or English.
        </p>

        {/* Date picker */}
        <div className="mb-6">
          <label htmlFor="meal-date" className="block text-sm font-medium text-gray-700 mb-1.5">
            Date
          </label>
          <input
            id="meal-date"
            type="date"
            value={mealDate}
            min={getMinDate()}
            max={getToday()}
            onChange={(e) => setMealDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <MealInput onLog={handleLog} logging={logging} />
      </div>
    </div>
  )
}
