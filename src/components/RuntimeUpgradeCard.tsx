import { getRuntimeUpgradeCost, runtimeUpgradeLookup } from '@/config/runtimeUpgrades'
import type { RuntimeUpgradeId } from '@/types/game'

interface RuntimeUpgradeCardProps {
  id: RuntimeUpgradeId
  level: number
  effectValue: number
  affordable: boolean
  onBuy: (id: RuntimeUpgradeId) => void
}

const categoryTone = {
  Attack: 'from-rose-400/20 to-pink-500/20',
  Defense: 'from-cyan-400/18 to-sky-500/18',
  Utility: 'from-amber-300/20 to-orange-400/20',
}

const categoryLabel = {
  Attack: '攻击',
  Defense: '防御',
  Utility: '功能',
}

function formatEffectValue(id: RuntimeUpgradeId, effectValue: number) {
  switch (id) {
    case 'fireRate':
    case 'critDamage':
    case 'missileDamage':
      return effectValue.toFixed(1)
    case 'burstChance':
    case 'critChance':
    case 'pierceChance':
    case 'missileChance':
    case 'laserChance':
    case 'claimReduction':
    case 'slowField':
    case 'coinsPerDrop':
      return `${effectValue}%`
    default:
      return `${effectValue}`
  }
}

export default function RuntimeUpgradeCard({ id, level, effectValue, affordable, onBuy }: RuntimeUpgradeCardProps) {
  const definition = runtimeUpgradeLookup[id]
  const cost = getRuntimeUpgradeCost(id, level)

  return (
    <button
      type="button"
      onClick={() => onBuy(id)}
      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
        affordable
          ? 'border-amber-300/70 bg-amber-200/10 shadow-[0_0_0_1px_rgba(252,211,77,0.24),0_0_24px_rgba(251,191,36,0.12)] hover:-translate-y-0.5 hover:border-amber-200'
          : 'border-slate-800 bg-slate-950/85 text-white/70 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.8)]'
      }`}
    >
      <div
        className={`rounded-xl bg-gradient-to-r p-2 ${
          affordable ? categoryTone[definition.category] : 'from-slate-800/90 to-slate-900/90'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${affordable ? 'text-white' : 'text-white/82'}`}>{definition.label}</p>
          </div>
          <div className={`text-right text-xs ${affordable ? 'text-white/70' : 'text-white/48'}`}>
            <p>等级 {level}</p>
            <p className={`mt-1 text-sm font-semibold ${affordable ? 'text-white' : 'text-white/82'}`}>
              {formatEffectValue(id, effectValue)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={affordable ? 'text-white/60' : 'text-white/38'}>{categoryLabel[definition.category]}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            affordable ? 'bg-amber-300/14 text-amber-200' : 'bg-black/35 text-slate-400'
          }`}
        >
          ＄{cost}
        </span>
      </div>
    </button>
  )
}
