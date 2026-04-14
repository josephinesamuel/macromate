import { useState } from 'react'

interface FoodItemRow {
  name: string
  portion_description: string
  calories: number
}

interface AiBreakdown {
  food_items: FoodItemRow[]
}

interface MealLog {
  id: string
  description: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  logged_at: string
  raw_input?: string
  ai_breakdown?: AiBreakdown | null
}

interface Props {
  meal: MealLog
  onDelete?: (id: string) => void
  deleting?: boolean
  showDelete?: boolean
  onReLog?: (meal: MealLog, date: string) => void
  reLogging?: boolean
  reLogged?: boolean
  rawInput?: string
}

function getToday() {
  return new Date().toLocaleDateString('en-CA')
}

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toLocaleDateString('en-CA')
}

export default function MealCard({
  meal,
  onDelete,
  deleting = false,
  showDelete = true,
  onReLog,
  reLogging = false,
  reLogged = false,
  rawInput,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null)
  const [showRawInput, setShowRawInput] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const time = new Date(meal.logged_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const foodItems = meal.ai_breakdown?.food_items ?? []
  const hasBreakdown = foodItems.length > 0

  function handleReLogClick() {
    setSelectedDate(getToday())
    setShowDatePicker(true)
  }

  function handleConfirm() {
    if (!onReLog) return
    setConfirmedDate(selectedDate)
    setShowDatePicker(false)
    onReLog(meal, selectedDate)
  }

  function handleCancel() {
    setShowDatePicker(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug line-clamp-2">{meal.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{time}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-gray-900">{meal.calories} kcal</span>

          {onReLog && !showDatePicker && (
            reLogged ? (
              <span className="text-xs text-green-600 font-medium">
                {confirmedDate ? `Logged for ${confirmedDate} ✓` : 'Logged ✓'}
              </span>
            ) : (
              <button
                onClick={handleReLogClick}
                disabled={reLogging}
                className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                aria-label="Log again"
              >
                {reLogging ? '…' : 'Log again'}
              </button>
            )
          )}

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

      {/* Macro chips */}
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

      {/* Food item breakdown toggle */}
      {hasBreakdown && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showBreakdown ? 'Hide breakdown ↑' : 'Show breakdown ↓'}
          </button>
          {showBreakdown && (
            <div className="mt-2 space-y-1.5">
              {foodItems.map((item, i) => (
                <div key={i} className="flex justify-between items-baseline gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-gray-700">{item.name}</span>
                    {item.portion_description && (
                      <span className="text-[10px] text-gray-400 ml-1">· {item.portion_description}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{item.calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline date picker for re-logging */}
      {showDatePicker && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <input
            type="date"
            value={selectedDate}
            min={getMinDate()}
            max={getToday()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white mb-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Raw input toggle */}
      {rawInput && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowRawInput((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showRawInput ? 'Hide prompt ↑' : 'View prompt ↓'}
          </button>
          {showRawInput && (
            <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Original description</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{rawInput}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { MealLog }
