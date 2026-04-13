import { useState } from 'react'
import { estimateMeal, type MealEstimate } from '../lib/ai'
import MealBreakdown from './MealBreakdown'

interface Props {
  onLog: (description: string, estimate: MealEstimate) => void
  logging: boolean
}

const PLACEHOLDER = `Describe what you ate — e.g.:

• Nasi 2 centong, ayam geprek 1 potong, tempe goreng 2 potong
• Oatmeal with banana and peanut butter, 1 bowl
• Gado-gado sepiring + lontong 1 potong
• Sepiring nasi padang: rendang, sayur nangka, tempe`

export default function MealInput({ onLog, logging }: Props) {
  const [description, setDescription] = useState('')
  const [estimate, setEstimate] = useState<MealEstimate | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEstimate() {
    if (!description.trim()) return
    setError(null)
    setEstimating(true)
    setEstimate(null)

    try {
      const result = await estimateMeal(description.trim())
      setEstimate(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate meal.')
    } finally {
      setEstimating(false)
    }
  }

  function handleCorrect() {
    // Keep description, clear estimate so user can edit and re-estimate
    setEstimate(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter to estimate
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleEstimate()
    }
  }

  if (estimate) {
    return (
      <MealBreakdown
        estimate={estimate}
        onCorrect={handleCorrect}
        onLog={() => onLog(description, estimate)}
        logging={logging}
      />
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        rows={9}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleEstimate}
        disabled={estimating || !description.trim()}
        className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {estimating ? 'Estimating…' : 'Estimate'}
      </button>

      <p className="text-center text-xs text-gray-400">
        Tip: Cmd+Enter to estimate quickly
      </p>
    </div>
  )
}
