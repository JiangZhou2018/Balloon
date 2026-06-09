import { Link } from 'react-router-dom'
import { useMetaStore } from '@/store/metaStore'

export default function SettingsPage() {
  const settings = useMetaStore((state) => state.settings)
  const setSetting = useMetaStore((state) => state.setSetting)
  const resetProgress = useMetaStore((state) => state.resetProgress)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-4 pb-8 pt-6">
      <section className="card-glass rounded-[34px] px-6 py-6">
        <h1 className="text-3xl font-black text-white">设置</h1>
        <div className="mt-5 space-y-3">
          <label className="flex items-center justify-between rounded-3xl bg-white/6 px-4 py-4 text-sm text-white">
            <span>背景音乐</span>
            <input type="checkbox" checked={settings.musicOn} onChange={(event) => setSetting('musicOn', event.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-3xl bg-white/6 px-4 py-4 text-sm text-white">
            <span>战斗音效</span>
            <input type="checkbox" checked={settings.sfxOn} onChange={(event) => setSetting('sfxOn', event.target.checked)} />
          </label>
        </div>

        <button
          type="button"
          onClick={resetProgress}
          className="button-pop mt-6 w-full bg-rose-400/85 text-white"
        >
          清空本地存档
        </button>
      </section>

      <Link to="/" className="button-pop mt-5 flex items-center justify-center bg-white/10 text-white">
        返回首页
      </Link>
    </main>
  )
}
