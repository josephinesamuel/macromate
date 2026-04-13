interface Props {
  label: string
  consumed: number
  target: number
  unit?: string
}

export default function MacroBar({ label, consumed, target, unit = 'g' }: Props) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const over = consumed > target

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${over ? 'text-red-500' : 'text-gray-900'}`}>
          {Math.round(consumed)}{unit}
          <span className="font-normal text-gray-400"> / {Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-red-400' : 'bg-gray-900'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
