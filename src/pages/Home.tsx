import { Play, Settings, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMetaStore } from '@/store/metaStore'

export default function HomePage() {
  const totalCoins = useMetaStore((state) => state.totalCoins)
  const lastResult = useMetaStore((state) => state.lastResult)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-10 pt-6">
      <section className="card-glass relative overflow-hidden rounded-[36px] px-6 pb-8 pt-6">
        <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-28px] left-[-12px] h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/55">气球赏金猎人</p>
            <h1 className="mt-3 max-w-[240px] text-4xl font-black leading-tight text-white">
              拦截正在逃跑的财富
            </h1>
            <p className="mt-3 text-sm text-white/65">打爆气球，让宝箱掉下来。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">总金币</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{totalCoins}</p>
          </div>
        </div>

        <Link to="/battle" className="button-pop mt-8 flex items-center justify-center gap-3 bg-amber-300 text-slate-950">
          <Play className="h-5 w-5" />
          开始合约
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Link to="/workshop" className="button-pop flex items-center justify-center gap-2 bg-white/10 text-white">
            <Wrench className="h-4 w-4" />
            赏金工坊
          </Link>
          <Link to="/settings" className="button-pop flex items-center justify-center gap-2 bg-white/10 text-white">
            <Settings className="h-4 w-4" />
            设置
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        <div className="card-glass rounded-[28px] px-5 py-4">
          <p className="text-sm font-semibold text-white">最近一局</p>
          {lastResult ? (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/68">
              <div className="rounded-2xl bg-white/5 px-4 py-3">波次: {lastResult.wave}</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">金币: {lastResult.coinsEarned}</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">坠落: {lastResult.drops}</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">漏箱: {lastResult.escapes}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/62">还没有战斗记录，直接开始第一份合约。</p>
          )}
        </div>
      </section>
    </main>
  )
}
