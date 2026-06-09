import { Link, Navigate } from 'react-router-dom'
import { useMetaStore } from '@/store/metaStore'

export default function ResultPage() {
  const result = useMetaStore((state) => state.lastResult)

  if (!result) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[460px] items-center px-4 py-8">
      <section className="card-glass w-full rounded-[36px] px-6 py-6">
        <p className="text-xs uppercase tracking-[0.32em] text-white/48">合约失败</p>
        <h1 className="mt-3 text-4xl font-black text-white">本局结算</h1>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/72">
          <div className="rounded-3xl bg-white/6 px-4 py-4">到达波次: <span className="font-semibold text-white">{result.wave}</span></div>
          <div className="rounded-3xl bg-white/6 px-4 py-4">生存时长: <span className="font-semibold text-white">{result.survivedSeconds} 秒</span></div>
          <div className="rounded-3xl bg-white/6 px-4 py-4">击破气球: <span className="font-semibold text-white">{result.balloonsPopped}</span></div>
          <div className="rounded-3xl bg-white/6 px-4 py-4">成功坠落: <span className="font-semibold text-white">{result.drops}</span></div>
          <div className="rounded-3xl bg-white/6 px-4 py-4">漏掉宝箱: <span className="font-semibold text-white">{result.escapes}</span></div>
          <div className="rounded-3xl bg-gradient-to-r from-amber-300/20 to-orange-300/20 px-4 py-4">获得金币: <span className="font-semibold text-amber-200">{result.coinsEarned}</span></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link to="/battle" className="button-pop flex items-center justify-center bg-amber-300 text-slate-950">再来一局</Link>
          <Link to="/workshop" className="button-pop flex items-center justify-center bg-white/10 text-white">前往工坊</Link>
        </div>
      </section>
    </main>
  )
}
