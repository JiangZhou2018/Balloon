import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRuntimeUpgradeCost } from '@/config/runtimeUpgrades'
import {
  FOCUS_MS,
  TICK_MS,
  applyRuntimeUpgrade,
  createBattleResult,
  createInitialSimulation,
  getRuntimeEffectMap,
  type SimulationState,
  updateSimulation,
} from '@/game/engine'
import { useMetaStore } from '@/store/metaStore'
import type { BattleSnapshot, RuntimeUpgradeId, TargetPriority } from '@/types/game'

function cloneState(state: SimulationState): SimulationState {
  return JSON.parse(JSON.stringify(state)) as SimulationState
}

export function useBattleSimulation() {
  const navigate = useNavigate()
  const meta = useMetaStore()
  const setLastResult = useMetaStore((state) => state.setLastResult)
  const markTutorialSeen = useMetaStore((state) => state.markTutorialSeen)
  const stateRef = useRef<SimulationState>(createInitialSimulation(meta))
  const [snapshot, setSnapshot] = useState<BattleSnapshot>(() => buildSnapshot(stateRef.current))

  const refreshSnapshot = useCallback(() => {
    setSnapshot(buildSnapshot(stateRef.current))
  }, [])

  useEffect(() => {
    stateRef.current = createInitialSimulation(meta)
    refreshSnapshot()

    const interval = window.setInterval(() => {
      const draft = cloneState(stateRef.current)
      updateSimulation(draft, TICK_MS, meta)
      stateRef.current = draft
      const nextSnapshot = buildSnapshot(draft)
      setSnapshot(nextSnapshot)

      if (nextSnapshot.availableTips.some((tip) => tip.includes('第一只宝箱'))) {
        markTutorialSeen('intro')
      }
      if (nextSnapshot.availableTips.some((tip) => tip.includes('逃走'))) {
        markTutorialSeen('escape')
      }
      if (nextSnapshot.availableTips.some((tip) => tip.includes('现金'))) {
        markTutorialSeen('upgrade')
      }

      if (draft.battleEnded) {
        window.clearInterval(interval)
        const result = createBattleResult(draft)
        setLastResult(result)
        navigate('/result')
      }
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [markTutorialSeen, meta, navigate, refreshSnapshot, setLastResult])

  const buyUpgrade = useCallback((id: RuntimeUpgradeId) => {
    const draft = cloneState(stateRef.current)
    const cost = getRuntimeUpgradeCost(id, draft.runtimeLevels[id])
    if (draft.stats.cash < cost || draft.battleEnded) {
      return false
    }

    draft.stats.cash -= cost
    applyRuntimeUpgrade(draft, id)
    stateRef.current = draft
    refreshSnapshot()
    return true
  }, [refreshSnapshot])

  const setPriority = useCallback((priority: TargetPriority) => {
    const draft = cloneState(stateRef.current)
    draft.stats.targetPriority = priority
    stateRef.current = draft
    refreshSnapshot()
  }, [refreshSnapshot])

  const focusChest = useCallback((chestId: string) => {
    const draft = cloneState(stateRef.current)
    draft.focusTargetId = chestId
    draft.focusRemainingMs = FOCUS_MS
    stateRef.current = draft
    refreshSnapshot()
  }, [refreshSnapshot])

  return useMemo(
    () => ({
      snapshot,
      buyUpgrade,
      setPriority,
      focusChest,
    }),
    [buyUpgrade, focusChest, setPriority, snapshot],
  )
}

function buildSnapshot(state: SimulationState): BattleSnapshot {
  const runtimeEffects = getRuntimeEffectMap(state)
  const waveSpawnPercent = state.intermissionMs > 0
    ? 0
    : Math.max(0, Math.min(100, (state.waveSchedule.elapsedMs / Math.max(1, state.waveSchedule.totalDurationMs)) * 100))
  return {
    ...state.stats,
    chests: state.chests,
    events: state.events,
    focusTargetId: state.focusTargetId,
    focusRemainingMs: state.focusRemainingMs,
    attackCooldownMs: state.attackCooldownMs,
    intermissionMs: state.intermissionMs,
    waveSpawnPercent,
    waveLabel: state.intermissionMs > 0 ? `第 ${state.stats.wave} 波准备中` : `第 ${state.stats.wave} 波`,
    canUpgrade: Object.fromEntries(
      Object.entries(state.runtimeLevels).map(([id, level]) => [id, state.stats.cash >= getRuntimeUpgradeCost(id as RuntimeUpgradeId, Number(level))]),
    ) as BattleSnapshot['canUpgrade'],
    runtimeLevels: state.runtimeLevels,
    runtimeEffects,
    heavyWeapons: {
      missile: {
        unlocked: state.runtimeLevels.missileChance > 0 || state.runtimeLevels.missileDamage > 0,
        cooldownMs: state.missileCooldownMs,
        ready: state.missileCooldownMs <= 0,
      },
      laser: {
        unlocked: state.runtimeLevels.laserChance > 0 || state.runtimeLevels.laserCount > 0,
        cooldownMs: state.laserCooldownMs,
        ready: state.laserCooldownMs <= 0 && state.activeLasers.length === 0,
      },
    },
    availableTips: state.availableTips,
    battleEnded: state.battleEnded,
  }
}
