interface Props {
  tdee: number
  consumed: number
}

function getStatus(deficit: number): { label: string; className: string } {
  if (deficit >= 500) return { label: 'On Track', className: 'text-green-600 bg-green-50 border-green-100' }
  if (deficit >= 200) return { label: 'Good Day', className: 'text-yellow-600 bg-yellow-50 border-yellow-100' }
  return { label: 'Over Target', className: 'text-red-600 bg-red-50 border-red-100' }
}

export default function DailyStatus({ tdee, consumed }: Props) {
  const deficit = tdee - consumed
  const { label, className } = getStatus(deficit)
  const isOver = deficit < 0

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${className}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm font-medium">
        {isOver
          ? `+${Math.round(Math.abs(deficit))} kcal over`
          : `${Math.round(deficit)} kcal deficit`}
      </span>
    </div>
  )
}
