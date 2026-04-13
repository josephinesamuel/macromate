import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type MealEstimate } from '../lib/ai'
import MealInput from '../components/MealInput'

export default function LogMeal() {
  const navigate = useNavigate()
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

    const { error: dbError } = await supabase.from('meal_logs').insert({
      user_id: user.id,
      description,
      ai_breakdown: estimate,
      calories: estimate.totals.calories,
      protein_g: estimate.totals.protein_g,
      carbs_g: estimate.totals.carbs_g,
      fat_g: estimate.totals.fat_g,
      fiber_g: estimate.totals.fiber_g,
    })

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

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <MealInput onLog={handleLog} logging={logging} />
      </div>
    </div>
  )
}
