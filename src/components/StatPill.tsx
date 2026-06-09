interface StatPillProps {
  label: string
  value: string
  tone?: 'sky' | 'amber' | 'rose'
  size?: 'sm' | 'md'
}

const toneMap = {
  sky: 'from-white/16 to-sky-400/12 text-sky-50',
  amber: 'from-white/14 to-amber-300/14 text-amber-50',
  rose: 'from-white/14 to-rose-300/16 text-rose-50',
}

export default function StatPill({ label, value, tone = 'sky', size = 'md' }: StatPillProps) {
  const padding = size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'
  const labelClass = size === 'sm' ? 'text-[10px]' : 'text-[11px]'
  const valueClass = size === 'sm' ? 'text-base' : 'text-lg'
  const hasLabel = label.trim().length > 0

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${padding} ${toneMap[tone]}`}>
      {hasLabel ? <p className={`${labelClass} uppercase tracking-[0.24em] text-white/60`}>{label}</p> : null}
      <p className={`${hasLabel ? 'mt-1' : ''} ${valueClass} font-semibold`}>{value}</p>
    </div>
  )
}
