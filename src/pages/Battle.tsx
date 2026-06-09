import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Battlefield from '@/components/Battlefield'
import RuntimeUpgradeCard from '@/components/RuntimeUpgradeCard'
import { runtimeUpgradeDefinitions } from '@/config/runtimeUpgrades'
import { FOCUS_MS, INTERMISSION_MS } from '@/game/engine'
import { useBattleSimulation } from '@/hooks/useBattleSimulation'
import { useMetaStore } from '@/store/metaStore'

const upgradeTabs = [
  { key: 'Attack', label: '攻击' },
  { key: 'Defense', label: '防御' },
  { key: 'Utility', label: '功能' },
] as const

function formatHeavyWeaponStatus(cooldownMs: number, ready: boolean) {
  return ready ? '待机' : `${(cooldownMs / 1000).toFixed(1)}秒`
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function formatCompactValue(value: number) {
  if (value >= 1000) {
    const compact = Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: value >= 10000 ? 1 : 2,
    }).format(value)
    return compact.toUpperCase()
  }
  return `${value}`
}

type UpgradeTabKey = (typeof upgradeTabs)[number]['key']

export default function BattlePage() {
  const { snapshot, buyUpgrade, setPriority, focusChest } = useBattleSimulation()
  const totalCoins = useMetaStore((state) => state.totalCoins)
  const [activeTab, setActiveTab] = useState<UpgradeTabKey>('Attack')
  const visibleUpgrades = useMemo(
    () => runtimeUpgradeDefinitions.filter((upgrade) => upgrade.category === activeTab),
    [activeTab],
  )
  const insurancePercent = clampPercent(snapshot.insurance)
  const focusPercent = clampPercent((snapshot.focusRemainingMs / FOCUS_MS) * 100)
  const waveStatusPercent = snapshot.intermissionMs > 0
    ? clampPercent((1 - snapshot.intermissionMs / INTERMISSION_MS) * 100)
    : clampPercent(snapshot.waveSpawnPercent)
  const diamonds = 0

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-4 pt-3">
      <section className="relative">
        <Battlefield snapshot={snapshot} onFocus={focusChest} />
        <div className="pointer-events-none absolute left-3 top-3 z-50 rounded-[20px] border border-white/10 bg-slate-950/78 px-3 py-2 shadow-[0_12px_32px_rgba(2,6,23,0.45)] backdrop-blur-sm">
          <div className="flex flex-col gap-1.5 text-white">
            <div className="flex items-center gap-2 text-[12px] font-black leading-none">
              <span className="w-5 text-left text-white">＄</span>
              <span className="text-[18px]">{formatCompactValue(snapshot.cash)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-black leading-none">
              <span className="w-5 text-left text-amber-200">C</span>
              <span className="text-[18px]">{formatCompactValue(totalCoins)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-black leading-none">
              <span className="w-5 text-left text-fuchsia-200">💎</span>
              <span className="text-[18px]">{formatCompactValue(diamonds)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card-glass mt-3 rounded-[30px] px-3 py-2">
        <div className="grid grid-cols-[1.05fr_1fr] gap-2">
          <div className="rounded-[22px] border border-cyan-200/20 bg-slate-950/28 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between text-[10px] font-semibold text-white/60">
              <span className="text-emerald-100/90">保 {insurancePercent}%</span>
              <span className="text-white/55">合约</span>
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-2">
              <div className="text-right text-[10px] font-semibold text-white/60">
                <p>攻击力: {Math.round(snapshot.runtimeEffects.damage)}</p>
                <p>攻 速: {snapshot.runtimeEffects.fireRate}/秒</p>
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 p-1">
              <div className="relative overflow-hidden rounded-lg bg-white/8">
                <div
                  className="h-5 rounded-lg bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 transition-all"
                  style={{ width: `${insurancePercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-950/90 mix-blend-screen">
                  {insurancePercent}%
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-cyan-200/20 bg-slate-950/28 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-white/55">{snapshot.intermissionMs > 0 ? '准备中' : '进行中'}</p>
                <h1 className="mt-0.5 text-[24px] font-black leading-none text-white">第 {snapshot.wave} 波</h1>
              </div>
              <Link to="/" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/5">
                首页
              </Link>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-white/72">
              <p>
                {snapshot.intermissionMs > 0
                  ? `准备 ${(snapshot.intermissionMs / 1000).toFixed(1)}秒`
                  : `出怪 ${Math.round(snapshot.waveSpawnPercent)}%`}
              </p>
              <p>射 {snapshot.runtimeEffects.fireRate}/秒</p>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/72">
              <p>导弹 {snapshot.heavyWeapons.missile.unlocked ? formatHeavyWeaponStatus(snapshot.heavyWeapons.missile.cooldownMs, snapshot.heavyWeapons.missile.ready) : '--'}</p>
              <p>激光 {snapshot.heavyWeapons.laser.unlocked ? formatHeavyWeaponStatus(snapshot.heavyWeapons.laser.cooldownMs, snapshot.heavyWeapons.laser.ready) : '--'}</p>
            </div>

            <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 p-1">
              <div className="overflow-hidden rounded-lg bg-white/8">
                <div
                  className="h-3 rounded-lg bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 transition-all"
                  style={{ width: `${waveStatusPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/75">目标</span>
            <button
              type="button"
              onClick={() => setPriority('escape')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                snapshot.targetPriority === 'escape' ? 'bg-rose-400 text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              快逃走
            </button>
            <button
              type="button"
              onClick={() => setPriority('value')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                snapshot.targetPriority === 'value' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white/70'
              }`}
            >
              高价值
            </button>
          </div>
          <div className="text-right text-xs text-white/55">
            <span>集火</span>
            <span className="ml-2 font-semibold text-white">{(snapshot.focusRemainingMs / 1000).toFixed(1)} 秒</span>
          </div>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-400 transition-all"
            style={{ width: `${focusPercent}%` }}
          />
        </div>
      </section>

      <section className="card-glass mt-3 flex-1 rounded-[30px] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">局内升级</p>
          </div>
          <span className="text-xs font-medium text-white/45">{visibleUpgrades.length} 项</span>
        </div>

        <div className="scrollbar-thin mt-3 grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {visibleUpgrades.map((upgrade) => (
            <RuntimeUpgradeCard
              key={upgrade.id}
              id={upgrade.id}
              level={snapshot.runtimeLevels[upgrade.id]}
              effectValue={snapshot.runtimeEffects[upgrade.id]}
              affordable={snapshot.canUpgrade[upgrade.id]}
              onBuy={buyUpgrade}
            />
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
          {upgradeTabs.map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-cyan-300/60 bg-cyan-300/14 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)_inset]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/8'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}
