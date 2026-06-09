import { getMetaUpgradeCost, metaUpgradeDefinitions } from '@/config/metaUpgrades'
import type { MetaUpgradeId } from '@/types/game'

interface WorkshopUpgradeCardProps {
  id: MetaUpgradeId
  level: number
  coins: number
  onBuy: (id: MetaUpgradeId) => void
}

export default function WorkshopUpgradeCard({ id, level, coins, onBuy }: WorkshopUpgradeCardProps) {
  const definition = metaUpgradeDefinitions.find((item) => item.id === id)
  if (!definition) {
    return null
  }

  const cost = getMetaUpgradeCost(definition, level)
  const affordable = coins >= cost

  return (
    <button
      type="button"
      onClick={() => onBuy(id)}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        affordable ? 'border-white/20 bg-white/10 hover:-translate-y-1' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">{definition.label}</p>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">等级</p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{level}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-white/58">消耗</span>
        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">{cost} 金币</span>
      </div>
    </button>
  )
}
