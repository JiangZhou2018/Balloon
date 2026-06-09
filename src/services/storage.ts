import { createInitialMetaUpgradeLevels } from '@/config/metaUpgrades'
import type { MetaProgress } from '@/types/game'

const STORAGE_KEY = 'balloon-h5-mvp-save'

export function createDefaultMetaProgress(): MetaProgress {
  return {
    totalCoins: 0,
    upgrades: createInitialMetaUpgradeLevels(),
    settings: {
      musicOn: true,
      sfxOn: true,
    },
    tutorialSeen: {
      intro: false,
      escape: false,
      upgrade: false,
    },
    lastResult: null,
  }
}

export function loadMetaProgress(): MetaProgress {
  if (typeof window === 'undefined') {
    return createDefaultMetaProgress()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createDefaultMetaProgress()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MetaProgress>
    return {
      ...createDefaultMetaProgress(),
      ...parsed,
      upgrades: {
        ...createDefaultMetaProgress().upgrades,
        ...parsed.upgrades,
      },
      tutorialSeen: {
        ...createDefaultMetaProgress().tutorialSeen,
        ...parsed.tutorialSeen,
      },
      settings: {
        ...createDefaultMetaProgress().settings,
        ...parsed.settings,
      },
    }
  } catch {
    return createDefaultMetaProgress()
  }
}

export function saveMetaProgress(progress: MetaProgress) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function clearMetaProgress() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
