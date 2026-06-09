import { Link } from 'react-router-dom'
import WorkshopUpgradeCard from '@/components/WorkshopUpgradeCard'
import { metaUpgradeDefinitions } from '@/config/metaUpgrades'
import { useMetaStore } from '@/store/metaStore'

export default function WorkshopPage() {
  const totalCoins = useMetaStore((state) => state.totalCoins)
  const upgrades = useMetaStore((state) => state.upgrades)
  const purchaseUpgrade = useMetaStore((state) => state.purchaseUpgrade)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pb-7 pt-4">
      <section className="card-glass rounded-[34px] px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/50">工坊</p>
            <h1 className="mt-2 text-3xl font-black text-white">永久升级</h1>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">金币</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{totalCoins}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3">
        {metaUpgradeDefinitions.map((definition) => (
          <WorkshopUpgradeCard
            key={definition.id}
            id={definition.id}
            level={upgrades[definition.id]}
            coins={totalCoins}
            onBuy={purchaseUpgrade}
          />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link to="/" className="button-pop flex items-center justify-center bg-white/10 text-white">返回首页</Link>
        <Link to="/battle" className="button-pop flex items-center justify-center bg-amber-300 text-slate-950">直接开局</Link>
      </div>
    </main>
  )
}
