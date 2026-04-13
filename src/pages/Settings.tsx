import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'
import {
  calculateMacroTargets,
  type ActivityLevel,
  type Gender,
  type UserProfile,
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

export default function Settings() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    gender: 'male',
    age: '',
    weight_kg: '',
    height_cm: '',
    activity_level: 'moderate',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/setup')
        return
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (dbError || !data) {
        navigate('/setup')
        return
      }

      const profile = data as UserProfile
      setForm({
        gender: profile.gender,
        age: String(profile.age),
        weight_kg: String(profile.weight_kg),
        height_cm: String(profile.height_cm),
        activity_level: profile.activity_level,
      })
      setLoading(false)
    }

    loadProfile()
  }, [navigate])

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
    setSaved(false)
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

    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={async () => {
              setSigningOut(true)
              await signOut()
              navigate('/login')
            }}
            disabled={signingOut}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Update your stats to recalculate your targets.</p>

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
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              required
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Weight & Height */}
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
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Settings saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
