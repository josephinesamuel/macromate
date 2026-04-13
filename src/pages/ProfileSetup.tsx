import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  calculateMacroTargets,
  type ActivityLevel,
  type Gender,
} from '../lib/nutrition'

interface FormState {
  gender: Gender
  age: string
  weight_kg: string
  height_cm: string
  activity_level: ActivityLevel
}

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  very_active: 'Very Active (hard exercise + physical job)',
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    gender: 'male',
    age: '',
    weight_kg: '',
    height_cm: '',
    activity_level: 'moderate',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derive preview whenever form has enough data
  const isPreviewReady =
    form.age !== '' && form.weight_kg !== '' && form.height_cm !== ''

  const preview = isPreviewReady
    ? calculateMacroTargets({
        gender: form.gender,
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
        activity_level: form.activity_level,
      })
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not logged in.')
      setSaving(false)
      return
    }

    const { error: dbError } = await supabase.from('profiles').upsert({
      id: user.id,
      gender: form.gender,
      age: Number(form.age),
      weight_kg: Number(form.weight_kg),
      height_cm: Number(form.height_cm),
      activity_level: form.activity_level,
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your profile</h1>
        <p className="text-sm text-gray-500 mb-8">
          We'll calculate your daily calorie target and macros.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['male', 'female'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                  className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                    form.gender === g
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              required
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              placeholder="25"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Weight & Height side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                min={20}
                max={300}
                step="0.1"
                required
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                placeholder="70"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                inputMode="decimal"
                min={100}
                max={250}
                step="0.1"
                required
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                placeholder="170"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Activity level */}
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Level
            </label>
            <select
              id="activity"
              value={form.activity_level}
              onChange={(e) =>
                setForm((f) => ({ ...f, activity_level: e.target.value as ActivityLevel }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                <option key={level} value={level}>
                  {ACTIVITY_LABELS[level]}
                </option>
              ))}
            </select>
          </div>

          {/* Preview card */}
          {preview && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Your Daily Targets
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-600">Maintenance (TDEE)</span>
                <span className="text-sm font-medium text-gray-900">{preview.tdee} kcal</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-600">Target (−500 deficit)</span>
                <span className="text-base font-bold text-gray-900">{preview.target} kcal</span>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Protein', value: `${preview.protein_g}g` },
                  { label: 'Carbs', value: `${preview.carbs_g}g` },
                  { label: 'Fat', value: `${preview.fat_g}g` },
                  { label: 'Fiber', value: `${preview.fiber_g}g` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-base font-semibold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
