import type { MealEstimate } from '../lib/ai'

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

export default function MealBreakdown({ estimate, onCorrect, onLog, logging }: Props) {
  const confidence = CONFIDENCE_STYLES[estimate.confidence]

  return (
    <div className="space-y-4">
      {/* Food items */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Breakdown</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidence.className}`}>
            {confidence.label}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {estimate.food_items.map((item, i) => (
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
          <span className="text-lg font-bold text-gray-900">{estimate.totals.calories} kcal</span>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-0.5">
          <MacroRow label="Protein" value={estimate.totals.protein_g} />
          <MacroRow label="Carbs" value={estimate.totals.carbs_g} />
          <MacroRow label="Fat" value={estimate.totals.fat_g} />
          <MacroRow label="Fiber" value={estimate.totals.fiber_g} />
        </div>
      </div>

      {/* AI notes */}
      {estimate.notes && (
        <p className="text-xs text-gray-400 px-1">{estimate.notes}</p>
      )}

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
          {logging ? 'Logging…' : 'Log meal'}
        </button>
      </div>
    </div>
  )
}
