import { describe, expect, it, vi } from 'vitest'
import { createDefaultMetaProgress } from '@/services/storage'
import { applyRuntimeUpgrade, createInitialSimulation, getRuntimeEffectMap, selectTarget, updateSimulation } from '@/game/engine'

describe('battle engine', () => {
  it('prefers the most urgent chest in escape mode', () => {
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.runtimeStats.range = 200
    state.chests = [
      { id: 'a', type: 'cash', label: 'A', progress: 40, speed: 1, initialBalloonCount: 1, rewardCoins: 1, penaltyInsurance: 1, valueRank: 1, accent: '', lane: 0, balloons: [{ id: 'x', type: 'basic', label: 'x', hp: 10, maxHp: 10, armor: 0, rewardCash: 1, accent: '' }] },
      { id: 'b', type: 'gold', label: 'B', progress: 56, speed: 1, initialBalloonCount: 1, rewardCoins: 1, penaltyInsurance: 1, valueRank: 4, accent: '', lane: 1, balloons: [{ id: 'y', type: 'basic', label: 'y', hp: 10, maxHp: 10, armor: 0, rewardCash: 1, accent: '' }] },
    ]
    state.stats.targetPriority = 'escape'

    expect(selectTarget(state)?.id).toBe('b')
  })

  it('prefers the most valuable chest in value mode', () => {
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.runtimeStats.range = 200
    state.chests = [
      { id: 'a', type: 'cash', label: 'A', progress: 58, speed: 1, initialBalloonCount: 1, rewardCoins: 1, penaltyInsurance: 1, valueRank: 1, accent: '', lane: 0, balloons: [{ id: 'x', type: 'basic', label: 'x', hp: 10, maxHp: 10, armor: 0, rewardCash: 1, accent: '' }] },
      { id: 'b', type: 'gold', label: 'B', progress: 42, speed: 1, initialBalloonCount: 1, rewardCoins: 1, penaltyInsurance: 1, valueRank: 4, accent: '', lane: 1, balloons: [{ id: 'y', type: 'basic', label: 'y', hp: 10, maxHp: 10, armor: 0, rewardCash: 1, accent: '' }] },
    ]
    state.stats.targetPriority = 'value'

    expect(selectTarget(state)?.id).toBe('b')
  })

  it('applies runtime upgrades to effect map', () => {
    const state = createInitialSimulation(createDefaultMetaProgress())
    applyRuntimeUpgrade(state, 'damage')
    applyRuntimeUpgrade(state, 'slowField')
    applyRuntimeUpgrade(state, 'burstChance')
    applyRuntimeUpgrade(state, 'critChance')
    applyRuntimeUpgrade(state, 'missileChance')
    applyRuntimeUpgrade(state, 'laserChance')

    const effects = getRuntimeEffectMap(state)
    expect(effects.damage).toBeGreaterThan(8)
    expect(effects.slowField).toBeGreaterThan(0)
    expect(effects.burstChance).toBeGreaterThan(0)
    expect(effects.critChance).toBeGreaterThan(0)
    expect(effects.missileChance).toBeGreaterThan(0)
    expect(effects.laserChance).toBeGreaterThan(0)
  })

  it('triggers crit and pierce events when upgrades are active', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.intermissionMs = 0
    state.attackCooldownMs = 0
    state.runtimeStats.critChance = 1
    state.runtimeStats.pierceChance = 1
    state.runtimeStats.pierceCount = 1
    state.chests = [
      {
        id: 'a',
        type: 'cash',
        label: 'A',
        progress: 30,
        speed: 1,
        initialBalloonCount: 2,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 0,
        balloons: [
          { id: 'x', type: 'basic', label: 'x', hp: 20, maxHp: 20, armor: 0, rewardCash: 1, accent: '' },
          { id: 'x2', type: 'basic', label: 'x2', hp: 20, maxHp: 20, armor: 0, rewardCash: 1, accent: '' },
        ],
      },
    ]

    updateSimulation(state, 80, createDefaultMetaProgress())

    expect(state.events.some((event) => event.type === 'crit')).toBe(true)
    expect(state.events.some((event) => event.type === 'pierce')).toBe(true)
    randomSpy.mockRestore()
  })

  it('fires queued burst shots on following ticks', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.intermissionMs = 0
    state.attackCooldownMs = 0
    state.runtimeStats.burstChance = 1
    state.runtimeStats.burstCount = 2
    state.runtimeStats.burstIntervalMs = 10
    state.chests = [
      {
        id: 'a',
        type: 'cash',
        label: 'A',
        progress: 24,
        speed: 1,
        initialBalloonCount: 2,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 0,
        balloons: [
          { id: 'x', type: 'basic', label: 'x', hp: 50, maxHp: 50, armor: 0, rewardCash: 1, accent: '' },
          { id: 'x2', type: 'basic', label: 'x2', hp: 50, maxHp: 50, armor: 0, rewardCash: 1, accent: '' },
        ],
      },
    ]

    updateSimulation(state, 80, createDefaultMetaProgress())
    expect(state.pendingShots).toHaveLength(2)

    updateSimulation(state, 80, createDefaultMetaProgress())
    expect(state.events.some((event) => event.type === 'burstShot')).toBe(true)
    randomSpy.mockRestore()
  })

  it('launches missile and damages nearby chests in range', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.intermissionMs = 0
    state.attackCooldownMs = 0
    state.runtimeStats.missileChance = 1
    state.runtimeStats.missileDamageRate = 4
    state.runtimeStats.missileRadius = 18
    state.chests = [
      {
        id: 'a',
        type: 'cash',
        label: 'A',
        progress: 28,
        speed: 1,
        initialBalloonCount: 1,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 0,
        balloons: [{ id: 'x', type: 'basic', label: 'x', hp: 50, maxHp: 50, armor: 0, rewardCash: 1, accent: '' }],
      },
      {
        id: 'b',
        type: 'standard',
        label: 'B',
        progress: 33,
        speed: 1,
        initialBalloonCount: 1,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 1,
        balloons: [{ id: 'y', type: 'basic', label: 'y', hp: 50, maxHp: 50, armor: 0, rewardCash: 1, accent: '' }],
      },
    ]

    updateSimulation(state, 80, createDefaultMetaProgress())

    expect(state.events.some((event) => event.type === 'missileLaunch')).toBe(true)
    for (let i = 0; i < 9; i += 1) {
      updateSimulation(state, 80, createDefaultMetaProgress())
    }
    expect(state.events.some((event) => event.type === 'missileExplode')).toBe(true)
    expect(state.chests[0]?.balloons[0]?.hp).toBeLessThan(50)
    expect(state.chests[1]?.balloons[0]?.hp).toBeLessThan(50)
    randomSpy.mockRestore()
  })

  it('casts laser and applies tick damage to multiple targets', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = createInitialSimulation(createDefaultMetaProgress())
    state.intermissionMs = 0
    state.attackCooldownMs = 0
    state.runtimeStats.laserChance = 1
    state.runtimeStats.laserCount = 2
    state.runtimeStats.laserDurationMs = 160
    state.runtimeStats.laserTickMs = 80
    state.chests = [
      {
        id: 'a',
        type: 'cash',
        label: 'A',
        progress: 22,
        speed: 1,
        initialBalloonCount: 1,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 0,
        balloons: [{ id: 'x', type: 'basic', label: 'x', hp: 40, maxHp: 40, armor: 0, rewardCash: 1, accent: '' }],
      },
      {
        id: 'b',
        type: 'standard',
        label: 'B',
        progress: 24,
        speed: 1,
        initialBalloonCount: 1,
        rewardCoins: 1,
        penaltyInsurance: 1,
        valueRank: 1,
        accent: '',
        lane: 1,
        balloons: [{ id: 'y', type: 'basic', label: 'y', hp: 40, maxHp: 40, armor: 0, rewardCash: 1, accent: '' }],
      },
    ]

    updateSimulation(state, 80, createDefaultMetaProgress())
    expect(state.events.some((event) => event.type === 'laserCast')).toBe(true)

    updateSimulation(state, 80, createDefaultMetaProgress())
    expect(state.events.some((event) => event.type === 'laserBeam')).toBe(true)
    expect(state.events.some((event) => event.type === 'laserTick')).toBe(true)
    expect(state.chests.some((chest) => (chest.balloons[0]?.hp ?? 40) < 40)).toBe(true)
    randomSpy.mockRestore()
  })
})
