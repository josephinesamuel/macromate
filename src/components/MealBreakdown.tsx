import type { MealEstimate, MealGroup } from '../lib/ai'

interface Props {
  estimate: MealEstimate
  onCorrect: () => void
  onLog: () => void
  logging: boolean
}

const CONFIDENCE_STYLES: Record<MealEstimate['confidence'], { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'text-green-600 bg-green-50' },
  medium: { label: 'Medium confidence', className: 'text-yellow-600 bg-yellow-50' },
  low: { label: 'Low confidence', className: 'text-red-600 bg-red-50' },
}

function MacroRow({ label, value, unit = 'g' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}{unit}</span>
    </div>
  )
}

function MacroChips({ meal }: { meal: MealGroup }) {
  return (
    <div className="grid grid-cols-4 gap-1 mt-2">
      {[
        { label: 'P', value: meal.totals.protein_g },
        { label: 'C', value: meal.totals.carbs_g },
        { label: 'F', value: meal.totals.fat_g },
        { label: 'Fi', value: meal.totals.fiber_g },
      ].map(({ label, value }) => (
        <div key={label} className="text-center bg-gray-50 rounded py-1">
          <p className="text-xs font-semibold text-gray-700">{value}g</p>
          <p className="text-[10px] text-gray-400">{label}</p>
        </div>
      ))}
    </div>
  )
}

function AssumptionsBlock({ assumptions }: { assumptions: string[] }) {
  if (assumptions.length === 0) return null
  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
      <p className="text-xs font-semibold text-yellow-700 mb-1.5">⚠️ Assumptions made</p>
      <ul className="space-y-1">
        {assumptions.map((a, i) => (
          <li key={i} className="text-xs text-yellow-700 flex gap-1.5">
            <span className="shrink-0">•</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-yellow-600 mt-2">
        Correct your description if these are wrong, then re-estimate.
      </p>
    </div>
  )
}

function SingleMealView({ meal, confidence, notes, assumptions }: { meal: MealGroup; confidence: MealEstimate['confidence']; notes: string; assumptions: string[] }) {
  const badge = CONFIDENCE_STYLES[confidence]

  return (
    <>
      {/* Food items */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Breakdown</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {meal.food_items.map((item, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.portion_description}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-4 shrink-0">{item.calories} kcal</p>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[
                  { label: 'P', value: item.protein_g },
                  { label: 'C', value: item.carbs_g },
                  { label: 'F', value: item.fat_g },
                  { label: 'Fi', value: item.fiber_g },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-gray-50 rounded py-1">
                    <p className="text-xs font-semibold text-gray-700">{value}g</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total</p>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-gray-600">Calories</span>
          <span className="text-lg font-bold text-gray-900">{meal.totals.calories} kcal</span>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-0.5">
          <MacroRow label="Protein" value={meal.totals.protein_g} />
          <MacroRow label="Carbs" value={meal.totals.carbs_g} />
          <MacroRow label="Fat" value={meal.totals.fat_g} />
          <MacroRow label="Fiber" value={meal.totals.fiber_g} />
        </div>
      </div>

      <AssumptionsBlock assumptions={assumptions} />
      {notes && <p className="text-xs text-gray-400 px-1">{notes}</p>}
    </>
  )
}

const MEAL_EMOJI: Record<string, string> = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎',
  Meal: '🍽️',
}

function MultiMealView({ estimate }: { estimate: MealEstimate }) {
  const badge = CONFIDENCE_STYLES[estimate.confidence]

  // Compute overall totals across all meals
  const overall = estimate.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totals.calories,
      protein_g: acc.protein_g + m.totals.protein_g,
      carbs_g: acc.carbs_g + m.totals.carbs_g,
      fat_g: acc.fat_g + m.totals.fat_g,
      fiber_g: acc.fiber_g + m.totals.fiber_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )

  return (
    <>
      {/* Confidence badge */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {estimate.meals.length} meals detected
        </p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* One card per meal */}
      {estimate.meals.map((meal, idx) => (
        <div key={idx} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              {MEAL_EMOJI[meal.meal_name] ?? '🍽️'} {meal.meal_name}
            </p>
            <p className="text-sm font-semibold text-gray-900">{meal.totals.calories} kcal</p>
          </div>
          <div className="divide-y divide-gray-50">
            {meal.food_items.map((item, i) => (
              <div key={i} className="px-4 py-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.portion_description}</p>
                  </div>
                  <p className="text-xs font-medium text-gray-500 ml-4 shrink-0 mt-0.5">{item.calories} kcal</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3 pt-2">
            <MacroChips meal={meal} />
          </div>
        </div>
      ))}

      {/* Overall totals */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total — all meals</p>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-gray-600">Calories</span>
          <span className="text-lg font-bold text-gray-900">{overall.calories} kcal</span>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-0.5">
          <MacroRow label="Protein" value={overall.protein_g} />
          <MacroRow label="Carbs" value={overall.carbs_g} />
          <MacroRow label="Fat" value={overall.fat_g} />
          <MacroRow label="Fiber" value={overall.fiber_g} />
        </div>
      </div>

      <AssumptionsBlock assumptions={estimate.assumptions} />
      {estimate.notes && <p className="text-xs text-gray-400 px-1">{estimate.notes}</p>}
    </>
  )
}

export default function MealBreakdown({ estimate, onCorrect, onLog, logging }: Props) {
  const isMulti = estimate.meals.length > 1

  return (
    <div className="space-y-4">
      {isMulti
        ? <MultiMealView estimate={estimate} />
        : <SingleMealView meal={estimate.meals[0]} confidence={estimate.confidence} notes={estimate.notes} assumptions={estimate.assumptions} />
      }

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCorrect}
          disabled={logging}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Correct description
        </button>
        <button
          type="button"
          onClick={onLog}
          disabled={logging}
          className="flex-1 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {logging
            ? 'Logging…'
            : isMulti
              ? `Log ${estimate.meals.length} meals`
              : 'Log meal'
          }
        </button>
      </div>
    </div>
  )
}
