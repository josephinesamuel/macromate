import { useState } from 'react'
import type { MacroTargets } from '../lib/nutrition'
import type { MealLog } from './MealCard'
import MealCard from './MealCard'

interface DayData {
  date: string        // YYYY-MM-DD
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  meals: MealLog[]
}

interface Props {
  day: DayData
  targets: MacroTargets
  onDelete: (id: string) => void
  deletingId: string | null
  onReLog: (meal: MealLog, date: string) => void
  reLoggingId: string | null
  reLoggedIds: Set<string>
}

function getStatus(deficit: number): { label: string; badgeClass: string } {
  if (deficit >= 500) return { label: 'On Track', badgeClass: 'text-green-600 bg-green-50' }
  if (deficit >= 200) return { label: 'Good Day', badgeClass: 'text-yellow-600 bg-yellow-50' }
  return { label: 'Over Target', badgeClass: 'text-red-600 bg-red-50' }
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`) // noon to avoid DST edge cases
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DaySummaryCard({ day, targets, onDelete, deletingId, onReLog, reLoggingId, reLoggedIds }: Props) {
  const [expanded, setExpanded] = useState(false)

  const deficit = targets.tdee - day.calories
  const { label, badgeClass } = getStatus(deficit)
  const isOver = deficit < 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Summary row — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(day.date)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {Math.round(day.calories)} kcal
              {' · '}
              {isOver
                ? `+${Math.round(Math.abs(deficit))} over`
                : `${Math.round(deficit)} deficit`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {label}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Macro summary strip */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-1">
        {[
          { label: 'P', value: day.protein_g },
          { label: 'C', value: day.carbs_g },
          { label: 'F', value: day.fat_g },
          { label: 'Fi', value: day.fiber_g },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 rounded py-1">
            <p className="text-xs font-semibold text-gray-700">{Math.round(value)}g</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Expanded meal list */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {day.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              showDelete={true}
              onDelete={onDelete}
              deleting={deletingId === meal.id}
              onReLog={onReLog}
              reLogging={reLoggingId === meal.id}
              reLogged={reLoggedIds.has(meal.id)}
              rawInput={meal.raw_input}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export type { DayData }
