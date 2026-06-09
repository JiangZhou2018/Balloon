import type { BalloonConfig, BalloonType } from '@/types/game'

export const balloonConfigs: Record<BalloonType, BalloonConfig> = {
  basic: {
    id: 'basic',
    label: '普通气球',
    hp: 16,
    armor: 0,
    rewardCash: 8,
    accent: 'from-rose-400 to-pink-500',
  },
  gold: {
    id: 'gold',
    label: '金气球',
    hp: 20,
    armor: 0,
    rewardCash: 14,
    accent: 'from-yellow-300 to-amber-500',
  },
  armored: {
    id: 'armored',
    label: '钢壳气球',
    hp: 34,
    armor: 5,
    rewardCash: 12,
    accent: 'from-slate-300 to-slate-500',
  },
  boost: {
    id: 'boost',
    label: '加速气球',
    hp: 22,
    armor: 1,
    rewardCash: 10,
    accent: 'from-cyan-300 to-sky-500',
  },
  shield: {
    id: 'shield',
    label: '护盾气球',
    hp: 28,
    armor: 2,
    rewardCash: 11,
    accent: 'from-violet-300 to-indigo-500',
  },
}
