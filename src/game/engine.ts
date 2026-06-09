import { balloonConfigs } from '@/config/balloons'
import { chestConfigs } from '@/config/chests'
import { getWaveDefinition } from '@/config/waves'
import type {
  BalloonInstance,
  BattleEvent,
  BattleResult,
  BattleStats,
  ChestInstance,
  MetaProgress,
  RuntimeUpgradeId,
  WaveSpawn,
} from '@/types/game'

export const TICK_MS = 80
export const ESCAPE_PROGRESS = 118
export const INTERMISSION_MS = 1800
export const FOCUS_MS = 5000
export const INTEREST_INTERVAL_MS = 4000
const MISSILE_COOLDOWN_MS = 2600
const LASER_COOLDOWN_MS = 3200
const BALLOON_ATTACK_PROGRESS_OFFSET = 23
const MISSILE_TRAVEL_MS = 680
const LASER_LANE_SPREAD = 0.22
const LASER_BEAM_WIDTH = 3.8

export interface RuntimeStats {
  damage: number
  fireRateMs: number
  range: number
  splash: number
  burstChance: number
  burstCount: number
  burstIntervalMs: number
  critChance: number
  critMultiplier: number
  pierceChance: number
  pierceCount: number
  missileChance: number
  missileDamageRate: number
  missileRadius: number
  laserChance: number
  laserCount: number
  laserDurationMs: number
  laserTickMs: number
  laserDamageRate: number
  insuranceCap: number
  claimReduction: number
  slowFactor: number
  cashBonus: number
  coinBonus: number
  interestCash: number
}

export type RuntimeLevels = Record<RuntimeUpgradeId, number>

interface PendingShot {
  id: string
  delayMs: number
  sequence: number
  targetChestId: string | null
}

interface ActiveLaser {
  id: string
  remainingMs: number
  tickCooldownMs: number
  beamCount: number
  laneX: number
  range: number
}

interface ActiveMissile {
  id: string
  remainingMs: number
  targetChestId: string
  targetBalloonId: string
  radius: number
  rawDamage: number
}

export interface WaveSchedule {
  pending: Array<WaveSpawn & { id: string }>
  elapsedMs: number
  totalDurationMs: number
}

export interface SimulationState {
  elapsedMs: number
  stats: BattleStats
  runtimeLevels: RuntimeLevels
  runtimeStats: RuntimeStats
  chests: ChestInstance[]
  events: BattleEvent[]
  waveSchedule: WaveSchedule
  attackCooldownMs: number
  pendingShots: PendingShot[]
  missileCooldownMs: number
  activeMissiles: ActiveMissile[]
  laserCooldownMs: number
  activeLasers: ActiveLaser[]
  intermissionMs: number
  focusTargetId: string | null
  focusRemainingMs: number
  availableTips: string[]
  firstDropTriggered: boolean
  firstEscapeTriggered: boolean
  firstUpgradeTriggered: boolean
  battleEnded: boolean
}

let idSeed = 0

function nextId(prefix: string) {
  idSeed += 1
  return `${prefix}-${idSeed}`
}

function createBalloon(type: WaveSpawn['balloonTypes'][number], wave: number): BalloonInstance {
  const config = balloonConfigs[type]
  const hpScale = 1 + Math.max(0, wave - 1) * 0.1
  return {
    id: nextId('balloon'),
    type,
    label: config.label,
    hp: Math.round(config.hp * hpScale),
    maxHp: Math.round(config.hp * hpScale),
    armor: Math.round(config.armor + wave * 0.15),
    rewardCash: Math.round(config.rewardCash * (1 + wave * 0.05)),
    accent: config.accent,
  }
}

function createChest(spawn: WaveSpawn, wave: number, meta: MetaProgress, runtimeStats: RuntimeStats): ChestInstance {
  const config = chestConfigs[spawn.chestType]
  const speedScale = 1 + Math.max(0, wave - 1) * 0.05
  const bonusCoins = 1 + meta.upgrades.coinBonusLevel * 0.06 + runtimeStats.coinBonus
  const balloons = spawn.balloonTypes.map((type) => createBalloon(type, wave))

  return {
    id: nextId('chest'),
    type: config.id,
    label: config.label,
    progress: 0,
    speed: config.baseSpeed * speedScale,
    initialBalloonCount: Math.max(1, balloons.length),
    rewardCoins: Math.round(config.rewardCoins * bonusCoins),
    penaltyInsurance: config.penaltyInsurance,
    valueRank: config.valueRank,
    accent: config.accent,
    lane: spawn.lane,
    balloons,
    isBoss: config.isBoss,
  }
}

function createWaveSchedule(wave: number): WaveSchedule {
  const spawns = getWaveDefinition(wave).spawns
  const maxDelayMs = spawns.reduce((acc, spawn) => Math.max(acc, spawn.delayMs), 0)
  return {
    elapsedMs: 0,
    totalDurationMs: Math.max(1, maxDelayMs),
    pending: spawns.map((spawn) => ({ ...spawn, id: nextId('spawn') })),
  }
}

export function createInitialRuntimeStats(meta: MetaProgress): RuntimeStats {
  return {
    damage: 8 + meta.upgrades.damageLevel * 2,
    fireRateMs: Math.max(320, 950 - meta.upgrades.fireRateLevel * 45),
    range: 58,
    splash: 0,
    burstChance: 0,
    burstCount: 0,
    burstIntervalMs: 90,
    critChance: 0,
    critMultiplier: 1.6,
    pierceChance: 0,
    pierceCount: 0,
    missileChance: 0.2,
    missileDamageRate: 1.8,
    missileRadius: 10,
    laserChance: 0.2,
    laserCount: 0,
    laserDurationMs: 420,
    laserTickMs: 140,
    laserDamageRate: 0.62,
    insuranceCap: 100 + meta.upgrades.insuranceLevel * 6,
    claimReduction: 0,
    slowFactor: meta.upgrades.slowFieldLevel * 0.02,
    cashBonus: 0,
    coinBonus: 0,
    interestCash: 0,
  }
}

export function createInitialRuntimeLevels(): RuntimeLevels {
  return {
    damage: 0,
    fireRate: 0,
    range: 0,
    splash: 0,
    burstChance: 0,
    burstCount: 0,
    critChance: 0,
    critDamage: 0,
    pierceChance: 0,
    pierceCount: 0,
    missileChance: 0,
    missileDamage: 0,
    laserChance: 0,
    laserCount: 0,
    insurance: 0,
    claimReduction: 0,
    slowField: 0,
    cashPerPop: 0,
    coinsPerDrop: 0,
    interest: 0,
  }
}

export function createInitialSimulation(meta: MetaProgress): SimulationState {
  const runtimeStats = createInitialRuntimeStats(meta)
  return {
    elapsedMs: 0,
    stats: {
      wave: 1,
      cash: 24 + meta.upgrades.startCashLevel * 12,
      insurance: runtimeStats.insuranceCap,
      drops: 0,
      escapes: 0,
      coinsEarned: 0,
      balloonsPopped: 0,
      targetPriority: 'escape',
    },
    runtimeLevels: createInitialRuntimeLevels(),
    runtimeStats,
    chests: [],
    events: [],
    waveSchedule: createWaveSchedule(1),
    attackCooldownMs: runtimeStats.fireRateMs,
    pendingShots: [],
    missileCooldownMs: 0,
    activeMissiles: [],
    laserCooldownMs: 0,
    activeLasers: [],
    intermissionMs: 600,
    focusTargetId: null,
    focusRemainingMs: 0,
    availableTips: [],
    firstDropTriggered: false,
    firstEscapeTriggered: false,
    firstUpgradeTriggered: false,
    battleEnded: false,
  }
}

export function applyRuntimeUpgrade(state: SimulationState, id: RuntimeUpgradeId) {
  state.runtimeLevels[id] += 1

  switch (id) {
    case 'damage':
      state.runtimeStats.damage += 3
      break
    case 'fireRate':
      state.runtimeStats.fireRateMs = Math.max(240, state.runtimeStats.fireRateMs - 55)
      break
    case 'range':
      state.runtimeStats.range = Math.min(96, state.runtimeStats.range + 0.5)
      break
    case 'splash':
      state.runtimeStats.splash += 1.8
      break
    case 'burstChance':
      state.runtimeStats.burstChance = Math.min(0.35, state.runtimeStats.burstChance + 0.012)
      break
    case 'burstCount':
      state.runtimeStats.burstCount = Math.min(4, state.runtimeStats.burstCount + 1)
      state.runtimeStats.burstIntervalMs = Math.max(55, state.runtimeStats.burstIntervalMs - 8)
      break
    case 'critChance':
      state.runtimeStats.critChance = Math.min(0.4, state.runtimeStats.critChance + 0.0125)
      break
    case 'critDamage':
      state.runtimeStats.critMultiplier = Math.min(3, state.runtimeStats.critMultiplier + 0.12)
      break
    case 'pierceChance':
      state.runtimeStats.pierceChance = Math.min(0.45, state.runtimeStats.pierceChance + 0.011)
      break
    case 'pierceCount':
      state.runtimeStats.pierceCount = Math.min(3, state.runtimeStats.pierceCount + 1)
      break
    case 'missileChance':
      state.runtimeStats.missileChance = Math.min(0.12, state.runtimeStats.missileChance + 0.006)
      break
    case 'missileDamage':
      state.runtimeStats.missileDamageRate = Math.min(3.4, state.runtimeStats.missileDamageRate + 0.14)
      state.runtimeStats.missileRadius = Math.min(18, state.runtimeStats.missileRadius + 1)
      break
    case 'laserChance':
      state.runtimeStats.laserChance = Math.min(0.1, state.runtimeStats.laserChance + 0.005)
      break
    case 'laserCount':
      state.runtimeStats.laserCount = Math.min(3, state.runtimeStats.laserCount + 1)
      state.runtimeStats.laserDurationMs = Math.min(760, state.runtimeStats.laserDurationMs + 60)
      break
    case 'insurance':
      state.runtimeStats.insuranceCap += 12
      state.stats.insurance += 12
      break
    case 'claimReduction':
      state.runtimeStats.claimReduction = Math.min(0.55, state.runtimeStats.claimReduction + 0.06)
      break
    case 'slowField':
      state.runtimeStats.slowFactor = Math.min(0.45, state.runtimeStats.slowFactor + 0.045)
      break
    case 'cashPerPop':
      state.runtimeStats.cashBonus += 2
      break
    case 'coinsPerDrop':
      state.runtimeStats.coinBonus += 0.12
      break
    case 'interest':
      state.runtimeStats.interestCash += 5
      break
  }
}

export function getRuntimeEffectMap(state: SimulationState) {
  return {
    damage: state.runtimeStats.damage,
    fireRate: Math.round((1000 / state.runtimeStats.fireRateMs) * 10) / 10,
    range: state.runtimeStats.range,
    splash: state.runtimeStats.splash,
    burstChance: Math.round(state.runtimeStats.burstChance * 100),
    burstCount: state.runtimeStats.burstCount,
    critChance: Math.round(state.runtimeStats.critChance * 100),
    critDamage: Math.round(state.runtimeStats.critMultiplier * 100) / 100,
    pierceChance: Math.round(state.runtimeStats.pierceChance * 100),
    pierceCount: state.runtimeStats.pierceCount,
    missileChance: Math.round(state.runtimeStats.missileChance * 100),
    missileDamage: Math.round(state.runtimeStats.missileDamageRate * 100) / 100,
    laserChance: Math.round(state.runtimeStats.laserChance * 100),
    laserCount: state.runtimeStats.laserCount,
    insurance: state.runtimeStats.insuranceCap,
    claimReduction: Math.round(state.runtimeStats.claimReduction * 100),
    slowField: Math.round(state.runtimeStats.slowFactor * 100),
    cashPerPop: state.runtimeStats.cashBonus,
    coinsPerDrop: Math.round(state.runtimeStats.coinBonus * 100),
    interest: state.runtimeStats.interestCash,
  }
}

function getAttackableChests(state: SimulationState) {
  return state.chests.filter((chest) => chest.progress + BALLOON_ATTACK_PROGRESS_OFFSET <= state.runtimeStats.range)
}

export function selectTarget(state: SimulationState): ChestInstance | null {
  const attackable = getAttackableChests(state)
  if (attackable.length === 0) {
    return null
  }

  if (state.focusTargetId) {
    const focus = attackable.find((chest) => chest.id === state.focusTargetId)
    if (focus) {
      return focus
    }
  }

  const sorted = [...attackable].sort((left, right) => {
    if (state.stats.targetPriority === 'value') {
      if (right.valueRank !== left.valueRank) {
        return right.valueRank - left.valueRank
      }
      return right.progress - left.progress
    }

    if (right.progress !== left.progress) {
      return right.progress - left.progress
    }
    return right.valueRank - left.valueRank
  })

  return sorted[0] ?? null
}

function getTargetBalloon(chest: ChestInstance) {
  const shielded = chest.balloons.some((balloon) => balloon.type === 'shield')
  return shielded
    ? chest.balloons.find((balloon) => balloon.type === 'shield') ?? chest.balloons[0]
    : chest.balloons[0]
}

function getBalloonIndex(chest: ChestInstance, balloonId: string) {
  return Math.max(0, chest.balloons.findIndex((balloon) => balloon.id === balloonId))
}

function applySplashDamage(state: SimulationState, primaryChestId: string) {
  if (state.runtimeStats.splash <= 0) {
    return
  }

  const sideDamage = Math.max(1, Math.round(state.runtimeStats.splash))
  for (const chest of state.chests) {
    if (chest.id === primaryChestId) {
      continue
    }
    const balloon = chest.balloons[0]
    if (!balloon) {
      continue
    }
    balloon.hp -= sideDamage
  }
}

function resolvePreferredTarget(state: SimulationState, preferredChestId: string | null) {
  if (!preferredChestId) {
    return selectTarget(state)
  }

  const preferred = state.chests.find(
    (chest) => chest.id === preferredChestId && chest.progress + BALLOON_ATTACK_PROGRESS_OFFSET <= state.runtimeStats.range && chest.balloons.length > 0,
  )
  return preferred ?? selectTarget(state)
}

function findPierceTarget(state: SimulationState, sourceChest: ChestInstance, sourceBalloonId: string) {
  const sameChest = sourceChest.balloons.find((balloon) => balloon.id !== sourceBalloonId)
  if (sameChest) {
    return { chest: sourceChest, balloon: sameChest }
  }

  const nearbyChest = state.chests
    .filter(
      (chest) =>
        chest.id !== sourceChest.id &&
        chest.lane === sourceChest.lane &&
        chest.progress + BALLOON_ATTACK_PROGRESS_OFFSET <= state.runtimeStats.range &&
        chest.balloons.length > 0,
    )
    .sort((left, right) => Math.abs(left.progress - sourceChest.progress) - Math.abs(right.progress - sourceChest.progress))[0]

  if (!nearbyChest) {
    return null
  }

  return {
    chest: nearbyChest,
    balloon: getTargetBalloon(nearbyChest) ?? nearbyChest.balloons[0],
  }
}

function getMissileTargets(state: SimulationState, targetChest: ChestInstance) {
  return state.chests.filter((chest) => {
    const progressDistance = Math.abs(chest.progress - targetChest.progress)
    const laneDistance = Math.abs(chest.lane - targetChest.lane) * 6
    return progressDistance + laneDistance <= state.runtimeStats.missileRadius
  })
}

function getChestDistanceMetric(source: ChestInstance, target: ChestInstance) {
  const progressDistance = Math.abs(target.progress - source.progress)
  const laneDistance = Math.abs(target.lane - source.lane) * 6
  return progressDistance + laneDistance
}

function getMissileTarget(state: SimulationState, preferredChest: ChestInstance | null) {
  if (preferredChest) return preferredChest
  if (state.chests.length === 0) return null
  const withBalloons = state.chests.filter((chest) => chest.balloons.length > 0)
  if (withBalloons.length === 0) return null

  if (state.stats.targetPriority === 'value') {
    return withBalloons.sort((left, right) => {
      if (right.valueRank !== left.valueRank) return right.valueRank - left.valueRank
      return right.progress - left.progress
    })[0] ?? null
  }

  return withBalloons.sort((left, right) => {
    if (right.progress !== left.progress) return right.progress - left.progress
    return right.valueRank - left.valueRank
  })[0] ?? null
}

function tryLaunchMissile(state: SimulationState) {
  if (state.runtimeStats.missileChance <= 0 || state.missileCooldownMs > 0) {
    return
  }

  if (Math.random() >= state.runtimeStats.missileChance) {
    return
  }

  const preferred = state.focusTargetId ? state.chests.find((chest) => chest.id === state.focusTargetId && chest.balloons.length > 0) ?? null : null
  const missileTarget = getMissileTarget(state, preferred)
  if (!missileTarget) return
  const targetBalloon = getTargetBalloon(missileTarget)
  if (!targetBalloon) return

  const rawDamage = Math.round(state.runtimeStats.damage * state.runtimeStats.missileDamageRate)
  const travelSec = MISSILE_TRAVEL_MS / 1000
  const speedFactor = missileTarget.balloons.length / Math.max(1, missileTarget.initialBalloonCount)
  const boostPenalty = missileTarget.balloons.some((balloon) => balloon.type === 'boost') ? 1.1 : 1
  const slowPenalty = 1 - state.runtimeStats.slowFactor
  const predictedProgress = Math.min(ESCAPE_PROGRESS, missileTarget.progress + missileTarget.speed * speedFactor * boostPenalty * slowPenalty * travelSec)
  state.events.push({
    id: nextId('evt'),
    type: 'missileLaunch',
    lane: missileTarget.lane,
    progress: missileTarget.progress,
    impactProgress: predictedProgress,
    balloonIndex: getBalloonIndex(missileTarget, targetBalloon.id),
    balloonCount: missileTarget.balloons.length,
    radius: state.runtimeStats.missileRadius,
    travelMs: MISSILE_TRAVEL_MS,
  })

  state.activeMissiles.push({
    id: nextId('missile'),
    remainingMs: MISSILE_TRAVEL_MS,
    targetChestId: missileTarget.id,
    targetBalloonId: targetBalloon.id,
    radius: state.runtimeStats.missileRadius,
    rawDamage,
  })
  state.missileCooldownMs = MISSILE_COOLDOWN_MS
}

function tryCastLaser(state: SimulationState) {
  if (state.runtimeStats.laserChance <= 0 || state.laserCooldownMs > 0) {
    return
  }

  const beamCount = state.runtimeStats.laserCount
  if (beamCount <= 0) {
    return
  }

  if (Math.random() >= state.runtimeStats.laserChance) {
    return
  }

  const preferred = state.focusTargetId ? state.chests.find((chest) => chest.id === state.focusTargetId && chest.balloons.length > 0) ?? null : null
  const target = getMissileTarget(state, preferred)
  if (!target) return
  state.events.push({
    id: nextId('evt'),
    type: 'laserCast',
    laserCount: beamCount,
    durationMs: state.runtimeStats.laserDurationMs,
  })
  state.activeLasers.push({
    id: nextId('laser'),
    remainingMs: state.runtimeStats.laserDurationMs,
    tickCooldownMs: 0,
    beamCount,
    laneX: target.lane,
    range: ESCAPE_PROGRESS,
  })
  state.laserCooldownMs = LASER_COOLDOWN_MS
}

function scheduleBurstShots(state: SimulationState, targetChestId: string) {
  if (state.runtimeStats.burstCount <= 0) {
    return
  }

  if (Math.random() > state.runtimeStats.burstChance) {
    return
  }

  for (let sequence = 1; sequence <= state.runtimeStats.burstCount; sequence += 1) {
    state.pendingShots.push({
      id: nextId('burst'),
      delayMs: state.runtimeStats.burstIntervalMs * sequence,
      sequence,
      targetChestId,
    })
  }
}

function fireShot(state: SimulationState, kind: 'shot' | 'burstShot', sequence = 0, preferredChestId: string | null = null) {
  const targetChest = resolvePreferredTarget(state, preferredChestId)
  if (!targetChest) {
    return false
  }

  const targetBalloon = getTargetBalloon(targetChest)
  if (!targetBalloon) {
    return false
  }

  const balloonIndex = getBalloonIndex(targetChest, targetBalloon.id)
  state.events.push(
    kind === 'shot'
      ? {
          id: nextId('evt'),
          type: 'shot',
          lane: targetChest.lane,
          progress: targetChest.progress,
          balloonIndex,
          balloonCount: targetChest.balloons.length,
        }
      : {
          id: nextId('evt'),
          type: 'burstShot',
          lane: targetChest.lane,
          progress: targetChest.progress,
          balloonIndex,
          balloonCount: targetChest.balloons.length,
          sequence,
        },
  )

  let rawDamage = state.runtimeStats.damage
  const didCrit = Math.random() < state.runtimeStats.critChance
  if (didCrit) {
    rawDamage = Math.round(rawDamage * state.runtimeStats.critMultiplier)
    state.events.push({
      id: nextId('evt'),
      type: 'crit',
      lane: targetChest.lane,
      progress: targetChest.progress,
      balloonIndex,
      balloonCount: targetChest.balloons.length,
      damage: rawDamage,
    })
  }

  const actualDamage = Math.max(1, rawDamage - targetBalloon.armor)
  targetBalloon.hp -= actualDamage
  applySplashDamage(state, targetChest.id)

  if (kind === 'shot') {
    scheduleBurstShots(state, targetChest.id)
  }

  if (state.runtimeStats.pierceCount > 0 && Math.random() < state.runtimeStats.pierceChance) {
    let fromChest = targetChest
    let fromBalloon = targetBalloon

    for (let pierceIndex = 0; pierceIndex < state.runtimeStats.pierceCount; pierceIndex += 1) {
      const nextTarget = findPierceTarget(state, fromChest, fromBalloon.id)
      if (!nextTarget) {
        break
      }

      state.events.push({
        id: nextId('evt'),
        type: 'pierce',
        fromLane: fromChest.lane,
        fromProgress: fromChest.progress,
        fromBalloonIndex: getBalloonIndex(fromChest, fromBalloon.id),
        fromBalloonCount: fromChest.balloons.length,
        toLane: nextTarget.chest.lane,
        toProgress: nextTarget.chest.progress,
        toBalloonIndex: getBalloonIndex(nextTarget.chest, nextTarget.balloon.id),
        toBalloonCount: nextTarget.chest.balloons.length,
      })

      const decay = Math.max(0.45, 1 - pierceIndex * 0.25)
      const pierceDamage = Math.max(1, Math.round(rawDamage * decay) - nextTarget.balloon.armor)
      nextTarget.balloon.hp -= pierceDamage
      applySplashDamage(state, nextTarget.chest.id)
      fromChest = nextTarget.chest
      fromBalloon = nextTarget.balloon
    }
  }

  return true
}

function cleanDefeatedBalloons(state: SimulationState) {
  for (const chest of state.chests) {
    const defeated = chest.balloons.filter((balloon) => balloon.hp <= 0)
    if (defeated.length === 0) {
      continue
    }

    let cashReward = 0
    for (const balloon of defeated) {
      const balloonIndex = Math.max(0, chest.balloons.findIndex((item) => item.id === balloon.id))
      state.events.push({
        id: nextId('evt'),
        type: 'balloonPop',
        lane: chest.lane,
        progress: chest.progress,
        balloonIndex,
        balloonCount: chest.balloons.length,
      })

      const reward = balloon.rewardCash + state.runtimeStats.cashBonus
      cashReward += reward
      state.events.push({
        id: nextId('evt'),
        type: 'cashGain',
        lane: chest.lane,
        progress: chest.progress,
        balloonIndex,
        balloonCount: chest.balloons.length,
        amount: reward,
      })
    }

    state.stats.balloonsPopped += defeated.length
    state.stats.cash += cashReward
    chest.balloons = chest.balloons.filter((balloon) => balloon.hp > 0)
  }
}

function resolveDropsAndEscapes(state: SimulationState) {
  const remaining: ChestInstance[] = []
  for (const chest of state.chests) {
    if (chest.balloons.length === 0) {
      state.stats.drops += 1
      const coins = Math.round(chest.rewardCoins * (1 + state.runtimeStats.coinBonus))
      state.stats.coinsEarned += coins
      state.events.push({
        id: nextId('evt'),
        type: 'chestDrop',
        lane: chest.lane,
        progress: chest.progress,
        rewardCoins: coins,
        valueRank: chest.valueRank,
        chestLabel: chest.label,
        chestAccent: chest.accent,
      })
      if (!state.firstDropTriggered) {
        state.availableTips.push('第一只宝箱已经被成功打落，继续扩大火力。')
        state.firstDropTriggered = true
      }
      continue
    }

    if (chest.progress >= ESCAPE_PROGRESS) {
      state.stats.escapes += 1
      const claim = Math.round(chest.penaltyInsurance * (1 - state.runtimeStats.claimReduction))
      state.stats.insurance = Math.max(0, state.stats.insurance - claim)
      if (!state.firstEscapeTriggered) {
        state.availableTips.push('有宝箱逃走了，建议优先升级保险或减速场。')
        state.firstEscapeTriggered = true
      }
      continue
    }

    remaining.push(chest)
  }

  state.chests = remaining
}

function advanceWaveIfNeeded(state: SimulationState) {
  if (state.chests.length > 0 || state.waveSchedule.pending.length > 0 || state.intermissionMs > 0) {
    return
  }

  state.stats.wave += 1
  state.waveSchedule = createWaveSchedule(state.stats.wave)
  state.intermissionMs = INTERMISSION_MS
}

function updateFocus(state: SimulationState, deltaMs: number) {
  if (!state.focusTargetId) {
    return
  }

  state.focusRemainingMs = Math.max(0, state.focusRemainingMs - deltaMs)
  if (state.focusRemainingMs === 0) {
    state.focusTargetId = null
  }
}

function spawnWaveChests(state: SimulationState, deltaMs: number, meta: MetaProgress) {
  state.waveSchedule.elapsedMs += deltaMs

  const ready = state.waveSchedule.pending.filter((spawn) => spawn.delayMs <= state.waveSchedule.elapsedMs)
  if (ready.length === 0) {
    return
  }

  state.waveSchedule.pending = state.waveSchedule.pending.filter((spawn) => spawn.delayMs > state.waveSchedule.elapsedMs)
  for (const spawn of ready) {
    state.chests.push(createChest(spawn, state.stats.wave, meta, state.runtimeStats))
  }
}

function tickMovement(state: SimulationState, deltaMs: number) {
  const delta = deltaMs / 1000
  for (const chest of state.chests) {
    const boostPenalty = chest.balloons.some((balloon) => balloon.type === 'boost') ? 1.1 : 1
    const slowPenalty = 1 - state.runtimeStats.slowFactor
    const speedFactor = chest.balloons.length / Math.max(1, chest.initialBalloonCount)
    chest.progress += chest.speed * speedFactor * boostPenalty * slowPenalty * delta
  }
}

function tickPendingShots(state: SimulationState, deltaMs: number) {
  if (state.pendingShots.length === 0) {
    return
  }

  const readyShots: PendingShot[] = []
  const stillPending: PendingShot[] = []

  for (const shot of state.pendingShots) {
    const nextDelay = shot.delayMs - deltaMs
    if (nextDelay <= 0) {
      readyShots.push({ ...shot, delayMs: 0 })
    } else {
      stillPending.push({ ...shot, delayMs: nextDelay })
    }
  }

  state.pendingShots = stillPending
  readyShots.sort((left, right) => left.sequence - right.sequence)
  for (const shot of readyShots) {
    fireShot(state, 'burstShot', shot.sequence, shot.targetChestId)
  }
}

function tickMissiles(state: SimulationState, deltaMs: number) {
  if (state.activeMissiles.length === 0) {
    return
  }

  const nextMissiles: ActiveMissile[] = []
  for (const missile of state.activeMissiles) {
    const remainingMs = missile.remainingMs - deltaMs
    if (remainingMs > 0) {
      nextMissiles.push({ ...missile, remainingMs })
      continue
    }

    const targetChest = state.chests.find((chest) => chest.id === missile.targetChestId)
    if (!targetChest) {
      continue
    }

    state.events.push({
      id: nextId('evt'),
      type: 'missileExplode',
      lane: targetChest.lane,
      progress: targetChest.progress,
      radius: missile.radius,
      damage: missile.rawDamage,
    })

    for (const chest of getMissileTargets(state, targetChest)) {
      const distance = getChestDistanceMetric(targetChest, chest)
      const falloff = Math.max(0.55, 1 - distance / Math.max(1, missile.radius * 1.2))
      for (const balloon of chest.balloons) {
        const missileDamage = Math.max(1, Math.round(missile.rawDamage * falloff) - balloon.armor)
        balloon.hp -= missileDamage
      }
    }
  }

  state.activeMissiles = nextMissiles
}

function tickLasers(state: SimulationState, deltaMs: number) {
  if (state.activeLasers.length === 0) {
    return
  }

  const nextLasers: ActiveLaser[] = []
  for (const laser of state.activeLasers) {
    const remainingMs = laser.remainingMs - deltaMs
    if (remainingMs <= 0) {
      continue
    }

    const tickCooldownMs = laser.tickCooldownMs - deltaMs
    if (tickCooldownMs <= 0) {
      const beamCount = Math.max(0, laser.beamCount)
      const range = Math.max(0, laser.range)

      if (beamCount <= 0) {
        nextLasers.push({
          ...laser,
          remainingMs,
          tickCooldownMs: state.runtimeStats.laserTickMs,
        })
        continue
      }

      for (let beamIndex = 0; beamIndex < beamCount; beamIndex += 1) {
        const spread = (beamIndex - (beamCount - 1) / 2) * LASER_LANE_SPREAD
        const laneX = laser.laneX + spread
        const dirX = (laneX - 1) * 6
        const dirY = Math.max(1, range)
        const dirLenSq = dirX * dirX + dirY * dirY
        if (dirLenSq <= 0.0001) {
          continue
        }

        state.events.push({
          id: nextId('evt'),
          type: 'laserBeam',
          laneX,
          range,
          beamIndex,
        })

        const beamScale = Math.max(0.55, 1 - beamIndex * 0.2)
        const rawDamage = Math.round(state.runtimeStats.damage * state.runtimeStats.laserDamageRate * beamScale)
        for (const chest of state.chests) {
          if (chest.balloons.length === 0) {
            continue
          }

          const chestX = (chest.lane - 1) * 6
          const balloonY = chest.progress + BALLOON_ATTACK_PROGRESS_OFFSET
          if (balloonY > range) {
            continue
          }

          const relX = chestX - 0
          const relY = balloonY - 0
          const t = (relX * dirX + relY * dirY) / dirLenSq
          if (t < 0 || t > 1.02) {
            continue
          }

          const projX = t * dirX
          const projY = t * dirY
          const dist = Math.hypot(relX - projX, relY - projY)
          if (dist > LASER_BEAM_WIDTH) {
            continue
          }

          for (const balloon of chest.balloons) {
            const laserDamage = Math.max(1, rawDamage - balloon.armor)
            balloon.hp -= laserDamage
            state.events.push({
              id: nextId('evt'),
              type: 'laserTick',
              lane: chest.lane,
              progress: chest.progress,
              balloonIndex: getBalloonIndex(chest, balloon.id),
              balloonCount: chest.balloons.length,
              balloonId: balloon.id,
              beamIndex,
              damage: laserDamage,
            })
          }
        }
      }

      nextLasers.push({
        ...laser,
        remainingMs,
        tickCooldownMs: state.runtimeStats.laserTickMs,
      })
      continue
    }

    nextLasers.push({
      ...laser,
      remainingMs,
      tickCooldownMs,
    })
  }

  state.activeLasers = nextLasers
}

function tickCombat(state: SimulationState, deltaMs: number) {
  tickPendingShots(state, deltaMs)
  state.missileCooldownMs = Math.max(0, state.missileCooldownMs - deltaMs)
  tickMissiles(state, deltaMs)
  state.laserCooldownMs = Math.max(0, state.laserCooldownMs - deltaMs)
  tickLasers(state, deltaMs)

  const hasTargets = state.chests.some((chest) => chest.balloons.length > 0)
  if (hasTargets) {
    tryLaunchMissile(state)
    tryCastLaser(state)
  }

  state.attackCooldownMs = Math.max(0, state.attackCooldownMs - deltaMs)
  if (state.attackCooldownMs > 0) {
    return
  }

  const didFire = fireShot(state, 'shot')
  if (!didFire) {
    return
  }
  state.attackCooldownMs = state.runtimeStats.fireRateMs
}

function tickInterest(state: SimulationState, previousElapsedMs: number) {
  if (state.runtimeStats.interestCash <= 0) {
    return
  }

  const before = Math.floor(previousElapsedMs / INTEREST_INTERVAL_MS)
  const after = Math.floor(state.elapsedMs / INTEREST_INTERVAL_MS)
  if (after > before) {
    state.stats.cash += state.runtimeStats.interestCash
  }
}

export function updateSimulation(state: SimulationState, deltaMs: number, meta: MetaProgress) {
  if (state.battleEnded) {
    return state
  }

  const previousElapsedMs = state.elapsedMs
  state.elapsedMs += deltaMs
  state.availableTips = []
  state.events = []

  tickInterest(state, previousElapsedMs)
  updateFocus(state, deltaMs)

  if (state.intermissionMs > 0) {
    state.intermissionMs = Math.max(0, state.intermissionMs - deltaMs)
  } else {
    spawnWaveChests(state, deltaMs, meta)
    tickMovement(state, deltaMs)
    tickCombat(state, deltaMs)
    cleanDefeatedBalloons(state)
    resolveDropsAndEscapes(state)
    advanceWaveIfNeeded(state)
  }

  if (!state.firstUpgradeTriggered && state.stats.cash >= 16) {
    state.availableTips.push('现金已经足够，优先升级伤害或射速。')
    state.firstUpgradeTriggered = true
  }

  if (state.stats.insurance <= 0) {
    state.battleEnded = true
  }

  return state
}

export function createBattleResult(state: SimulationState): BattleResult {
  return {
    ...state.stats,
    survivedSeconds: Math.round(state.elapsedMs / 1000),
  }
}
