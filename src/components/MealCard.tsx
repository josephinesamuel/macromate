interface MealLog {
  id: string
  description: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  logged_at: string
}

interface Props {
  meal: MealLog
  onDelete?: (id: string) => void
  deleting?: boolean
  showDelete?: boolean
}

export default function MealCard({ meal, onDelete, deleting = false, showDelete = true }: Props) {
  const time = new Date(meal.logged_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug line-clamp-2">{meal.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{time}</p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <span className="text-sm font-semibold text-gray-900 mt-0.5">{meal.calories} kcal</span>
          {showDelete && onDelete && (
            <button
              onClick={() => onDelete(meal.id)}
              disabled={deleting}
              className="text-gray-300 hover:text-red-400 disabled:opacity-50 transition-colors p-0.5"
              aria-label="Delete meal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: 'P', value: meal.protein_g },
          { label: 'C', value: meal.carbs_g },
          { label: 'F', value: meal.fat_g },
          { label: 'Fi', value: meal.fiber_g },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 rounded py-1">
            <p className="text-xs font-semibold text-gray-700">{Math.round(value)}g</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { MealLog }
