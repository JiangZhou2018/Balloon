import { create } from 'zustand'
import { getMetaUpgradeCost, metaUpgradeDefinitions } from '@/config/metaUpgrades'
import { clearMetaProgress, createDefaultMetaProgress, loadMetaProgress, saveMetaProgress } from '@/services/storage'
import type { BattleResult, MetaProgress, MetaUpgradeId } from '@/types/game'

interface MetaStore extends MetaProgress {
  purchaseUpgrade: (id: MetaUpgradeId) => boolean
  setSetting: (key: 'musicOn' | 'sfxOn', value: boolean) => void
  markTutorialSeen: (key: 'intro' | 'escape' | 'upgrade') => void
  setLastResult: (result: BattleResult) => void
  resetProgress: () => void
}

const initialState = loadMetaProgress()

export const useMetaStore = create<MetaStore>((set, get) => ({
  ...initialState,
  purchaseUpgrade: (id) => {
    const state = get()
    const definition = metaUpgradeDefinitions.find((item) => item.id === id)
    if (!definition) {
      return false
    }

    const level = state.upgrades[id]
    const cost = getMetaUpgradeCost(definition, level)
    if (state.totalCoins < cost) {
      return false
    }

    const nextState: MetaProgress = {
      ...state,
      totalCoins: state.totalCoins - cost,
      upgrades: {
        ...state.upgrades,
        [id]: level + 1,
      },
    }

    saveMetaProgress(nextState)
    set(nextState)
    return true
  },
  setSetting: (key, value) => {
    const state = get()
    const nextState: MetaProgress = {
      ...state,
      settings: {
        ...state.settings,
        [key]: value,
      },
    }
    saveMetaProgress(nextState)
    set(nextState)
  },
  markTutorialSeen: (key) => {
    const state = get()
    if (state.tutorialSeen[key]) {
      return
    }

    const nextState: MetaProgress = {
      ...state,
      tutorialSeen: {
        ...state.tutorialSeen,
        [key]: true,
      },
    }
    saveMetaProgress(nextState)
    set(nextState)
  },
  setLastResult: (result) => {
    const state = get()
    const nextState: MetaProgress = {
      ...state,
      lastResult: result,
      totalCoins: state.totalCoins + result.coinsEarned,
    }
    saveMetaProgress(nextState)
    set(nextState)
  },
  resetProgress: () => {
    clearMetaProgress()
    set(createDefaultMetaProgress())
  },
}))
