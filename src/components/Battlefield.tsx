import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import type { BattleEvent, BattleSnapshot } from '@/types/game'

interface BattlefieldProps {
  snapshot: BattleSnapshot
  onFocus: (chestId: string) => void
}

const lanePositions = ['12%', '39%', '66%']
const lanePercents = [0.12, 0.39, 0.66]
const BALLOON_SCALE = 1.6

type FxBullet = {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  variant: 'normal' | 'burst' | 'pierce'
}

type FxPop = {
  id: string
  x: number
  y: number
}

type FxCoin = {
  id: string
  x: number
  y: number
  dx: number
  dy: number
}

type FxChestDrop = {
  id: string
  x: number
  y: number
  dy: number
  label: string
  accent: string
  rewardCoins: number
  valueRank: number
}

type FxCrit = {
  id: string
  x: number
  y: number
  damage: number
}

type FxCash = {
  id: string
  x: number
  y: number
  amount: number
}

type FxCoinText = {
  id: string
  x: number
  y: number
  amount: number
}

type FxMissileLock = {
  id: string
  x: number
  y: number
  dx: number
  dy: number
}

type FxTargetPulse = {
  id: string
  x: number
  y: number
}

type FxMissile = {
  id: string
  x: number
  y: number
  angle: number
  baseSpeed: number
  startedAt: number
  lane: number
  progress: number
  impactProgress: number
  balloonIndex: number
  balloonCount: number
  targetBalloonId: string | null
  durationMs: number
}

type FxMissileBlast = {
  id: string
  x: number
  y: number
  radius: number
}

type FxLaser = {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  angle: number
  length: number
  beamIndex: number
}

type FxNotice = {
  id: string
  text: string
  tone: 'missile' | 'laser'
}

type FxLaserCharge = {
  id: string
  x: number
  y: number
  beamCount: number
}

function topPercentFromProgress(progress: number) {
  return 84 - progress * 0.72
}

type BalloonOffset = { x: number; y: number; s: number }

function getBalloonLayout(count: number): BalloonOffset[] {
  if (count <= 1) return [{ x: 0, y: -2, s: 1.05 }]
  if (count === 2) return [{ x: -14, y: 0, s: 1 }, { x: 14, y: 0, s: 1 }]
  if (count === 3) return [{ x: -16, y: 4, s: 1 }, { x: 0, y: -12, s: 1.08 }, { x: 16, y: 4, s: 1 }]
  if (count === 4) return [{ x: -18, y: 6, s: 1 }, { x: -4, y: -10, s: 1.05 }, { x: 10, y: -10, s: 1.05 }, { x: 20, y: 6, s: 1 }]
  if (count === 5)
    return [
      { x: -20, y: 8, s: 1 },
      { x: -10, y: -8, s: 1.05 },
      { x: 4, y: -14, s: 1.1 },
      { x: 18, y: -4, s: 1.02 },
      { x: 22, y: 12, s: 0.98 },
    ]
  if (count === 6)
    return [
      { x: -22, y: 12, s: 0.98 },
      { x: -14, y: -4, s: 1.04 },
      { x: 0, y: -16, s: 1.1 },
      { x: 14, y: -6, s: 1.04 },
      { x: 22, y: 10, s: 0.98 },
      { x: 0, y: 14, s: 0.96 },
    ]
  if (count === 7)
    return [
      { x: -22, y: 14, s: 0.98 },
      { x: -18, y: -2, s: 1.02 },
      { x: -4, y: -16, s: 1.1 },
      { x: 12, y: -14, s: 1.08 },
      { x: 22, y: -2, s: 1.02 },
      { x: 24, y: 14, s: 0.98 },
      { x: 2, y: 18, s: 0.95 },
    ]

  const slots = Math.min(10, count)
  return Array.from({ length: slots }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / slots
    const radius = 18 + (index % 2) * 6
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.65 - 6,
      s: 0.95 + (index % 3) * 0.05,
    }
  })
}

function getChestAnchor(rect: DOMRect, lane: number, progress: number) {
  const baseLeft = rect.width * (lanePercents[lane] ?? lanePercents[0])
  const chestCenterX = baseLeft + 48
  const y = (rect.height * topPercentFromProgress(progress)) / 100
  return { x: chestCenterX, y }
}

function getBalloonAnchor(rect: DOMRect, lane: number, progress: number, balloonIndex: number, balloonCount: number) {
  const chest = getChestAnchor(rect, lane, progress)
  const layout = getBalloonLayout(Math.max(1, balloonCount))
  const offset = layout[balloonIndex % layout.length] ?? { x: 0, y: 0, s: 1 }
  const spread = 0.95 * BALLOON_SCALE
  return {
    x: chest.x + offset.x * spread,
    y: chest.y - 70 + offset.y * spread,
  }
}

export default function Battlefield({ snapshot, onFocus }: BattlefieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [fieldRect, setFieldRect] = useState({ width: 0, height: 0 })
  const snapshotRef = useRef(snapshot)
  const prevChestsRef = useRef<BattleSnapshot['chests']>([])
  const [bullets, setBullets] = useState<FxBullet[]>([])
  const [pops, setPops] = useState<FxPop[]>([])
  const [coins, setCoins] = useState<FxCoin[]>([])
  const [drops, setDrops] = useState<FxChestDrop[]>([])
  const [crits, setCrits] = useState<FxCrit[]>([])
  const [cash, setCash] = useState<FxCash[]>([])
  const [coinTexts, setCoinTexts] = useState<FxCoinText[]>([])
  const [missileLocks, setMissileLocks] = useState<FxMissileLock[]>([])
  const [targetPulses, setTargetPulses] = useState<FxTargetPulse[]>([])
  const [escaped, setEscaped] = useState<Array<{ id: string; x: number; y: number; dy: number; chest: BattleSnapshot['chests'][number] }>>([])
  const [missiles, setMissiles] = useState<FxMissile[]>([])
  const [missileBlasts, setMissileBlasts] = useState<FxMissileBlast[]>([])
  const [lasers, setLasers] = useState<FxLaser[]>([])
  const [laserCharges, setLaserCharges] = useState<FxLaserCharge[]>([])
  const [notices, setNotices] = useState<FxNotice[]>([])
  const [hitBalloonIds, setHitBalloonIds] = useState<Record<string, number>>({})
  const [screenShakeCount, setScreenShakeCount] = useState(0)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    const updateRect = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setFieldRect({ width: rect.width, height: rect.height })
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [])

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const prev = prevChestsRef.current
    const next = snapshot.chests
    if (prev.length > 0 && next.length !== prev.length) {
      const dropEvents = snapshot.events.filter((event) => event.type === 'chestDrop')
      const nextIds = new Set(next.map((chest) => chest.id))
      const removed = prev.filter((chest) => {
        if (nextIds.has(chest.id)) return false
        const dropped = dropEvents.some(
          (event) => event.lane === chest.lane && event.chestLabel === chest.label && Math.abs(event.progress - chest.progress) <= 2,
        )
        if (dropped) return false
        return chest.balloons.length > 0
      })
      if (removed.length > 0) {
        const now = Date.now()
        const toAdd = removed.map((chest) => {
          const anchor = getChestAnchor(rect, chest.lane, chest.progress)
          return {
            id: `e-${now}-${chest.id}`,
            x: anchor.x,
            y: anchor.y,
            dy: -(anchor.y + 220),
            chest,
          }
        })
        setEscaped((items) => [...items, ...toAdd])
        for (const item of toAdd) {
          window.setTimeout(() => {
            setEscaped((items) => items.filter((candidate) => candidate.id !== item.id))
          }, 760)
        }
      }
    }
    prevChestsRef.current = next
  }, [snapshot.chests, snapshot.events])

  useEffect(() => {
    if (!containerRef.current) return
    if (missiles.length === 0) return

    let rafId = 0
    let lastAt = performance.now()

    const step = (now: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const dtMs = Math.max(8, Math.min(42, now - lastAt))
      lastAt = now

      setMissiles((items) => {
        const state = snapshotRef.current
        const next: FxMissile[] = []

        for (const missile of items) {
          const ageMs = now - missile.startedAt
          if (ageMs >= missile.durationMs) continue

          const t = Math.max(0, Math.min(1, ageMs / missile.durationMs))
          let target: { x: number; y: number } | null = null

          if (missile.targetBalloonId) {
            const chest = state.chests.find((item) => item.balloons.some((balloon) => balloon.id === missile.targetBalloonId))
            if (chest) {
              const index = chest.balloons.findIndex((balloon) => balloon.id === missile.targetBalloonId)
              if (index >= 0) {
                target = getBalloonAnchor(rect, chest.lane, chest.progress, index, chest.balloons.length)
              }
            }
          }

          if (!target) {
            const progress = missile.progress + (missile.impactProgress - missile.progress) * t
            target = getBalloonAnchor(rect, missile.lane, progress, missile.balloonIndex, missile.balloonCount)
          }

          const dx = target.x - missile.x
          const dy = target.y - missile.y
          const desiredAngle = Math.atan2(dy, dx)
          const angleDelta = ((desiredAngle - missile.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
          const maxTurn = dtMs * 0.012
          const nextAngle = missile.angle + Math.max(-maxTurn, Math.min(maxTurn, angleDelta))

          const remainingMs = Math.max(1, missile.durationMs - ageMs)
          const desiredSpeed = Math.hypot(dx, dy) / remainingMs
          const speed = Math.max(missile.baseSpeed * 0.6, Math.min(missile.baseSpeed * 2.4, desiredSpeed))

          next.push({
            ...missile,
            x: missile.x + Math.cos(nextAngle) * speed * dtMs,
            y: missile.y + Math.sin(nextAngle) * speed * dtMs,
            angle: nextAngle,
          })
        }

        return next
      })

      rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(rafId)
  }, [missiles.length])

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    if (!snapshot.events || snapshot.events.length === 0) return
    const turretPoint = { x: rect.width / 2, y: rect.height - 52 }

    const now = Date.now()
    const removeAfter = <T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string, ms: number) => {
      window.setTimeout(() => {
        setter((items) => items.filter((item) => item.id !== id))
      }, ms)
    }

    const lanePercentFromLaneX = (laneX: number) => {
      const clamped = Math.max(0, Math.min(2, laneX))
      const index = Math.floor(clamped)
      const t = clamped - index
      const a = lanePercents[index] ?? lanePercents[0]
      const b = lanePercents[Math.min(2, index + 1)] ?? a
      return a + (b - a) * t
    }

    const removeHitAfter = (balloonId: string, token: number, ms: number) => {
      window.setTimeout(() => {
        setHitBalloonIds((prev) => {
          if (prev[balloonId] !== token) return prev
          const next = { ...prev }
          delete next[balloonId]
          return next
        })
      }, ms)
    }

    const resolveBalloonId = (lane: number, progress: number, balloonIndex: number, balloonCount: number) => {
      const candidates = snapshot.chests.filter((chest) => chest.lane === lane && chest.balloons.length === balloonCount)
      const fallback = candidates.length > 0 ? candidates : snapshot.chests.filter((chest) => chest.lane === lane)
      const chest = fallback.reduce<{ id: string; diff: number } | null>((best, item) => {
        const diff = Math.abs(item.progress - progress)
        if (!best || diff < best.diff) return { id: item.id, diff }
        return best
      }, null)
      const resolvedChest = chest ? snapshot.chests.find((item) => item.id === chest.id) : null
      const balloon = resolvedChest?.balloons[balloonIndex]
      return balloon?.id ?? null
    }

    const addBalloonHit = (lane: number, progress: number, balloonIndex: number, balloonCount: number) => {
      const balloonId = resolveBalloonId(lane, progress, balloonIndex, balloonCount)
      if (!balloonId) return
      const token = now + Math.floor(Math.random() * 1_000_000)
      setHitBalloonIds((prev) => ({ ...prev, [balloonId]: token }))
      removeHitAfter(balloonId, token, 150)
    }

    const addBalloonHitById = (balloonId: string) => {
      const token = now + Math.floor(Math.random() * 1_000_000)
      setHitBalloonIds((prev) => ({ ...prev, [balloonId]: token }))
      removeHitAfter(balloonId, token, 150)
    }

    const addCoinsBurst = (originX: number, originY: number, count: number) => {
      const nextCoins: FxCoin[] = []
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const radius = 40 + Math.random() * 90
        const dx = Math.cos(angle) * radius
        const dy = Math.sin(angle) * radius - 30 - Math.random() * 60
        nextCoins.push({
          id: `coin-${now}-${i}-${Math.random().toString(16).slice(2)}`,
          x: originX,
          y: originY,
          dx,
          dy,
        })
      }
      setCoins((items) => [...items, ...nextCoins])
      for (const coin of nextCoins) {
        removeAfter(setCoins, coin.id, 900)
      }
    }

    const addNotice = (text: string, tone: FxNotice['tone']) => {
      const notice: FxNotice = {
        id: `notice-${now}-${Math.random().toString(16).slice(2)}`,
        text,
        tone,
      }
      setNotices((items) => [...items.slice(-1), notice])
      removeAfter(setNotices, notice.id, 900)
    }

    const handleEvent = (event: BattleEvent) => {
      if (event.type === 'shot' || event.type === 'burstShot') {
        const target = getBalloonAnchor(rect, event.lane, event.progress, event.balloonIndex, event.balloonCount)
        const bullet: FxBullet = {
          id: `b-${event.id}`,
          x: turretPoint.x,
          y: turretPoint.y,
          dx: target.x - turretPoint.x,
          dy: target.y - turretPoint.y,
          variant: event.type === 'burstShot' ? 'burst' : 'normal',
        }
        setBullets((items) => [...items, bullet])
        removeAfter(setBullets, bullet.id, event.type === 'burstShot' ? 220 : 240)
        addBalloonHit(event.lane, event.progress, event.balloonIndex, event.balloonCount)
      }

      if (event.type === 'balloonPop') {
        const target = getBalloonAnchor(rect, event.lane, event.progress, event.balloonIndex, event.balloonCount)
        const pop: FxPop = {
          id: `p-${event.id}`,
          x: target.x,
          y: target.y,
        }
        setPops((items) => [...items, pop])
        removeAfter(setPops, pop.id, 420)
        addCoinsBurst(target.x, target.y + 20, 6)
      }

      if (event.type === 'chestDrop') {
        const chest = getChestAnchor(rect, event.lane, event.progress)
        const drop: FxChestDrop = {
          id: `d-${event.id}`,
          x: chest.x,
          y: chest.y,
          dy: rect.height - (chest.y + 88),
          label: event.chestLabel,
          accent: event.chestAccent,
          rewardCoins: event.rewardCoins,
          valueRank: event.valueRank,
        }
        setDrops((items) => [...items, drop])
        removeAfter(setDrops, drop.id, 680)
        const isHighValue = event.valueRank >= 4
        const coinText: FxCoinText = {
          id: `coin-text-${event.id}`,
          x: chest.x,
          y: chest.y - 26,
          amount: event.rewardCoins,
        }
        setCoinTexts((items) => [...items, coinText])
        removeAfter(setCoinTexts, coinText.id, 1000)
        if (isHighValue) {
          setScreenShakeCount((count) => count + 1)
          window.setTimeout(() => {
            setScreenShakeCount((count) => Math.max(0, count - 1))
          }, 280)
        }
        window.setTimeout(() => {
          addCoinsBurst(chest.x, rect.height - 92, isHighValue ? 46 : 28)
        }, 420)
      }

      if (event.type === 'crit') {
        const target = getBalloonAnchor(rect, event.lane, event.progress, event.balloonIndex, event.balloonCount)
        const crit: FxCrit = {
          id: `c-${event.id}`,
          x: target.x,
          y: target.y - 18,
          damage: event.damage,
        }
        setCrits((items) => [...items, crit])
        removeAfter(setCrits, crit.id, 620)
        addBalloonHit(event.lane, event.progress, event.balloonIndex, event.balloonCount)
      }

      if (event.type === 'cashGain') {
        const target = getBalloonAnchor(rect, event.lane, event.progress, event.balloonIndex, event.balloonCount)
        const gain: FxCash = {
          id: `cash-${event.id}`,
          x: target.x,
          y: target.y - 26,
          amount: event.amount,
        }
        setCash((items) => [...items, gain])
        removeAfter(setCash, gain.id, 1000)
      }

      if (event.type === 'pierce') {
        const from = getBalloonAnchor(rect, event.fromLane, event.fromProgress, event.fromBalloonIndex, event.fromBalloonCount)
        const to = getBalloonAnchor(rect, event.toLane, event.toProgress, event.toBalloonIndex, event.toBalloonCount)
        const bullet: FxBullet = {
          id: `pb-${event.id}`,
          x: from.x,
          y: from.y,
          dx: to.x - from.x,
          dy: to.y - from.y,
          variant: 'pierce',
        }
        setBullets((items) => [...items, bullet])
        removeAfter(setBullets, bullet.id, 220)
        addBalloonHit(event.toLane, event.toProgress, event.toBalloonIndex, event.toBalloonCount)
      }

      if (event.type === 'missileLaunch') {
        const targetBalloonId = resolveBalloonId(event.lane, event.progress, event.balloonIndex, event.balloonCount)
        const chest = targetBalloonId
          ? snapshot.chests.find((item) => item.balloons.some((balloon) => balloon.id === targetBalloonId))
          : null
        const index = chest && targetBalloonId ? chest.balloons.findIndex((balloon) => balloon.id === targetBalloonId) : -1
        const target =
          chest && index >= 0
            ? getBalloonAnchor(rect, chest.lane, chest.progress, index, chest.balloons.length)
            : getBalloonAnchor(rect, event.lane, event.impactProgress, event.balloonIndex, event.balloonCount)
        const durationMs = Math.max(320, event.travelMs)
        const start = { x: turretPoint.x, y: turretPoint.y - 8 }
        const dx = target.x - start.x
        const dy = target.y - start.y
        const baseSpeed = Math.max(0.08, Math.hypot(dx, dy) / durationMs)
        const lockMs = 120
        const lock: FxMissileLock = {
          id: `ml-${event.id}`,
          x: start.x,
          y: start.y,
          dx,
          dy,
        }
        const pulse: FxTargetPulse = {
          id: `mp-${event.id}`,
          x: target.x,
          y: target.y,
        }
        setMissileLocks((items) => [...items, lock])
        setTargetPulses((items) => [...items, pulse])
        removeAfter(setMissileLocks, lock.id, lockMs)
        removeAfter(setTargetPulses, pulse.id, lockMs)
        window.setTimeout(() => {
          const missile: FxMissile = {
            id: `m-${event.id}`,
            x: start.x,
            y: start.y,
            angle: Math.atan2(dy, dx),
            baseSpeed,
            startedAt: performance.now(),
            lane: event.lane,
            progress: event.progress,
            impactProgress: event.impactProgress,
            balloonIndex: event.balloonIndex,
            balloonCount: event.balloonCount,
            targetBalloonId,
            durationMs: Math.max(260, durationMs - lockMs),
          }
          setMissiles((items) => [...items, missile])
        }, lockMs)
        addNotice('导弹发射', 'missile')
      }

      if (event.type === 'missileExplode') {
        const chest = getChestAnchor(rect, event.lane, event.progress)
        const blast: FxMissileBlast = {
          id: `mx-${event.id}`,
          x: chest.x,
          y: chest.y - 54,
          radius: event.radius,
        }
        setMissileBlasts((items) => [...items, blast])
        removeAfter(setMissileBlasts, blast.id, 520)
        addCoinsBurst(chest.x, chest.y - 18, 10)
      }

      if (event.type === 'laserBeam') {
        const percent = lanePercentFromLaneX(event.laneX)
        const end = {
          x: rect.width * percent + 48,
          y: (rect.height * topPercentFromProgress(event.range)) / 100,
        }
        const dx = end.x - turretPoint.x
        const dy = end.y - (turretPoint.y - 8)
        const laser: FxLaser = {
          id: `lb-${event.id}`,
          x: turretPoint.x,
          y: turretPoint.y - 8,
          dx,
          dy,
          angle: Math.atan2(dy, dx),
          length: Math.hypot(dx, dy),
          beamIndex: event.beamIndex,
        }
        setLasers((items) => [...items, laser])
        removeAfter(setLasers, laser.id, 170)
      }

      if (event.type === 'laserTick') {
        addBalloonHitById(event.balloonId)
      }

      if (event.type === 'laserCast') {
        const charge: FxLaserCharge = {
          id: `lc-${event.id}`,
          x: turretPoint.x,
          y: turretPoint.y - 8,
          beamCount: event.laserCount,
        }
        setLaserCharges((items) => [...items, charge])
        removeAfter(setLaserCharges, charge.id, 220)
        addNotice(`激光扫射 x${event.laserCount}`, 'laser')
      }
    }

    for (const event of snapshot.events) {
      handleEvent(event)
    }
  }, [snapshot.chests, snapshot.events])

  return (
    <div
      ref={containerRef}
      className={`relative h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-sky-200/15 via-sky-200/10 to-slate-950/35 ${
        screenShakeCount > 0 ? 'fx-screen-shake' : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-16 bg-slate-950/82" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900/24 via-slate-950/10 to-transparent" />
      <div className="absolute inset-x-0 top-16 h-px bg-white/8" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-emerald-900/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-emerald-950/70" />
      <div className="absolute bottom-6 left-1/2 h-16 w-16 -translate-x-1/2 rounded-[24px] border border-white/20 bg-gradient-to-b from-slate-100/20 to-slate-950/50 shadow-[0_10px_50px_rgba(0,0,0,0.4)]">
        <div className="absolute left-1/2 top-3 h-10 w-3 -translate-x-1/2 rounded-full bg-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.45)]" />
      </div>

      {fieldRect.width > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg width={fieldRect.width} height={fieldRect.height} className="absolute inset-0">
            {(() => {
              const range = Math.max(0, Math.min(100, snapshot.runtimeEffects.range))
              const turret = { x: fieldRect.width / 2, y: fieldRect.height - 52 }
              const rangeY = (fieldRect.height * topPercentFromProgress(range)) / 100
              const unclampedRadius = Math.max(30, turret.y - rangeY)
              const radius = Math.min(unclampedRadius, fieldRect.width / 2 - 16)
              const start = { x: turret.x - radius, y: turret.y }
              const end = { x: turret.x + radius, y: turret.y }
              const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
              return (
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.22))' }}
                />
              )
            })()}
          </svg>
        </div>
      ) : null}

      {escaped.map((escape) => {
        const chest = escape.chest
        const balloonLayout = getBalloonLayout(chest.balloons.length)
        return (
          <div
            key={escape.id}
            className="fx-chest-escape absolute z-20 w-24"
            style={{
              left: escape.x,
              top: escape.y,
              '--dy': `${escape.dy}px`,
            } as CSSProperties}
          >
            <div className="relative flex flex-col items-center">
              <div className="relative h-[128px] w-[128px]">
                <div className="absolute left-1/2 top-[76px] h-2 w-2 -translate-x-1/2 rounded-full bg-white/40 shadow-[0_0_14px_rgba(255,255,255,0.25)]" />
                {chest.balloons.map((balloon, index) => {
                  const offset = balloonLayout[index % balloonLayout.length] ?? { x: 0, y: 0, s: 1 }
                  const spread = 0.95 * BALLOON_SCALE
                  const center = { x: 64 + offset.x * spread, y: 38 + offset.y * spread }
                  const radius = 14 * offset.s * BALLOON_SCALE

                  return (
                    <div key={balloon.id}>
                      <div
                        className={`absolute rounded-full border border-white/25 bg-gradient-to-b ${balloon.accent} shadow-[inset_0_-10px_24px_rgba(0,0,0,0.16)]`}
                        style={{
                          left: center.x,
                          top: center.y,
                          width: radius * 2,
                          height: radius * 2,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-white/60 blur-[0.2px]"
                          style={{ transform: 'rotate(-12deg)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-6 w-px bg-white/45" />
              <div className={`rounded-3xl border border-white/20 bg-gradient-to-br ${chest.accent} px-3 py-3 text-center shadow-[0_18px_40px_rgba(14,24,48,0.28)]`}>
                <p className="text-[11px] font-semibold text-slate-950/85">{chest.label}</p>
                <p className="mt-1 text-xs font-bold text-slate-950/85">+{chest.rewardCoins}</p>
                <p className="mt-1 text-[10px] text-slate-950/70">逃走 -{chest.penaltyInsurance}%</p>
              </div>
              <div className="mt-2 h-2 w-20 rounded-full bg-black/15 blur-[1px]" />
            </div>
          </div>
        )
      })}

      {snapshot.chests.map((chest) => {
        const top = `${84 - chest.progress * 0.72}%`
        const left = lanePositions[chest.lane] ?? lanePositions[0]
        const isFocused = snapshot.focusTargetId === chest.id
        const balloonLayout = getBalloonLayout(chest.balloons.length)

        return (
          <button
            key={chest.id}
            type="button"
            onClick={() => onFocus(chest.id)}
            className={`absolute z-20 w-24 -translate-y-1/2 rounded-3xl transition ${isFocused ? 'scale-105' : 'hover:scale-[1.02]'}`}
            style={{ top, left }}
          >
            <div className="relative flex flex-col items-center">
              <div className="relative h-[128px] w-[128px]">
                <div className="absolute left-1/2 top-[76px] h-2 w-2 -translate-x-1/2 rounded-full bg-white/40 shadow-[0_0_14px_rgba(255,255,255,0.25)]" />
                {chest.balloons.map((balloon, index) => {
                  const offset = balloonLayout[index % balloonLayout.length] ?? { x: 0, y: 0, s: 1 }
                  const spread = 0.95 * BALLOON_SCALE
                  const center = { x: 64 + offset.x * spread, y: 38 + offset.y * spread }
                  const radius = 14 * offset.s * BALLOON_SCALE
                  const isHit = hitBalloonIds[balloon.id] != null

                  return (
                    <div key={balloon.id}>
                      <div
                        className={`absolute rounded-full border border-white/25 bg-gradient-to-b ${balloon.accent} shadow-[inset_0_-10px_24px_rgba(0,0,0,0.16)] ${isHit ? 'balloon-hit' : ''}`}
                        style={{
                          left: center.x,
                          top: center.y,
                          width: radius * 2,
                          height: radius * 2,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-white/60 blur-[0.2px]"
                          style={{ transform: 'rotate(-12deg)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-6 w-px bg-white/45" />
              <div className={`rounded-3xl border border-white/20 bg-gradient-to-br ${chest.accent} px-3 py-3 text-center shadow-[0_18px_40px_rgba(14,24,48,0.28)]`}>
                <p className="text-[11px] font-semibold text-slate-950/85">{chest.label}</p>
                <p className="mt-1 text-xs font-bold text-slate-950/85">+{chest.rewardCoins}</p>
                <p className="mt-1 text-[10px] text-slate-950/70">逃走 -{chest.penaltyInsurance}%</p>
              </div>
              <div className="mt-2 h-2 w-20 rounded-full bg-black/15 blur-[1px]" />
              {isFocused ? (
                <div className="mt-2 rounded-full bg-rose-400/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                  集火中
                </div>
              ) : null}
            </div>
          </button>
        )
      })}

      <div className="pointer-events-none absolute inset-0 z-40">
        <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-2">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`fx-heavy-notice ${notice.tone === 'missile' ? 'fx-heavy-notice-missile' : 'fx-heavy-notice-laser'}`}
            >
              {notice.text}
            </div>
          ))}
        </div>

        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className={`fx-bullet ${bullet.variant === 'burst' ? 'fx-bullet-burst' : ''} ${bullet.variant === 'pierce' ? 'fx-bullet-pierce' : ''}`}
            style={{
              left: bullet.x,
              top: bullet.y,
              '--dx': `${bullet.dx}px`,
              '--dy': `${bullet.dy}px`,
            } as CSSProperties}
          />
        ))}

        {missileLocks.map((lock) => (
          <div
            key={lock.id}
            className="fx-missile-lock"
            style={{
              left: lock.x,
              top: lock.y,
              '--lock-length': `${Math.hypot(lock.dx, lock.dy)}px`,
              '--lock-angle': `${Math.atan2(lock.dy, lock.dx)}rad`,
            } as CSSProperties}
          />
        ))}

        {targetPulses.map((pulse) => (
          <div key={pulse.id} className="fx-target-pulse" style={{ left: pulse.x, top: pulse.y }} />
        ))}

        {missiles.map((missile) => (
          <div
            key={missile.id}
            className="fx-missile-wrap"
            style={{
              left: missile.x,
              top: missile.y,
            } as CSSProperties}
          >
            <div className="fx-missile" style={{ '--angle': `${missile.angle}rad` } as CSSProperties} />
          </div>
        ))}

        {missileBlasts.map((blast) => (
          <div
            key={blast.id}
            className="fx-missile-blast"
            style={{
              left: blast.x,
              top: blast.y,
              width: 44 + blast.radius * 4,
              height: 44 + blast.radius * 4,
            }}
          />
        ))}

        {laserCharges.map((charge) => (
          <div key={charge.id} className="fx-laser-charge" style={{ left: charge.x, top: charge.y }}>
            <div className="fx-laser-charge-core" />
            <div className="fx-laser-charge-bar">
              <div className="fx-laser-charge-fill" style={{ width: `${Math.min(100, 34 + charge.beamCount * 22)}%` }} />
            </div>
          </div>
        ))}

        {lasers.map((laser) => (
          <div
            key={laser.id}
            className={`fx-laser fx-laser-${laser.beamIndex % 3}`}
            style={{
              left: laser.x,
              top: laser.y,
              '--dx': `${laser.dx}px`,
              '--dy': `${laser.dy}px`,
              '--angle': `${laser.angle}rad`,
              '--length': `${laser.length}px`,
            } as CSSProperties}
          />
        ))}

        {crits.map((crit) => (
          <div key={crit.id} className="fx-crit-text" style={{ left: crit.x, top: crit.y }}>
            暴击 {crit.damage}
          </div>
        ))}

        {cash.map((gain) => (
          <div key={gain.id} className="fx-cash-text" style={{ left: gain.x, top: gain.y }}>
            ＄{gain.amount}
          </div>
        ))}

        {coinTexts.map((gain) => (
          <div key={gain.id} className="fx-coin-text" style={{ left: gain.x, top: gain.y }}>
            C+{gain.amount}
          </div>
        ))}

        {pops.map((pop) => (
          <div key={pop.id} className="fx-pop" style={{ left: pop.x, top: pop.y }} />
        ))}

        {drops.map((drop) => (
          <div
            key={drop.id}
            className={`fx-chest-drop ${drop.valueRank >= 4 ? 'fx-chest-drop-premium' : ''}`}
            style={{
              left: drop.x,
              top: drop.y,
              '--dy': `${drop.dy}px`,
            } as CSSProperties}
          >
            <div className={`rounded-2xl bg-gradient-to-br ${drop.accent} px-3 py-2`}>
              <div className="text-[11px] font-black text-slate-950/85">{drop.label}</div>
              <div className="mt-1 text-[10px] font-semibold text-slate-950/75">+{drop.rewardCoins} 金币</div>
            </div>
          </div>
        ))}

        {coins.map((coin) => (
          <div
            key={coin.id}
            className="fx-coin"
            style={{
              left: coin.x,
              top: coin.y,
              '--dx': `${coin.dx}px`,
              '--dy': `${coin.dy}px`,
            } as CSSProperties}
          />
        ))}
      </div>

      {snapshot.chests.length === 0 && snapshot.intermissionMs === 0 ? (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-white/60">
          下一波航班正在接入...
        </div>
      ) : null}
    </div>
  )
}
