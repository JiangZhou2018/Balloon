export type TargetPriority = 'escape' | 'value'
export type RuntimeUpgradeId =
  | 'damage'
  | 'fireRate'
  | 'range'
  | 'splash'
  | 'burstChance'
  | 'burstCount'
  | 'critChance'
  | 'critDamage'
  | 'pierceChance'
  | 'pierceCount'
  | 'missileChance'
  | 'missileDamage'
  | 'laserChance'
  | 'laserCount'
  | 'insurance'
  | 'claimReduction'
  | 'slowField'
  | 'cashPerPop'
  | 'coinsPerDrop'
  | 'interest'

export type MetaUpgradeId =
  | 'damageLevel'
  | 'fireRateLevel'
  | 'startCashLevel'
  | 'coinBonusLevel'
  | 'insuranceLevel'
  | 'slowFieldLevel'

export type BalloonType = 'basic' | 'gold' | 'armored' | 'boost' | 'shield'
export type ChestType = 'cash' | 'standard' | 'vault' | 'gold' | 'ufo'

export interface BalloonConfig {
  id: BalloonType
  label: string
  hp: number
  armor: number
  rewardCash: number
  accent: string
}

export interface ChestConfig {
  id: ChestType
  label: string
  rewardCoins: number
  penaltyInsurance: number
  baseSpeed: number
  balloonCount: number
  valueRank: number
  accent: string
  isBoss?: boolean
}

export interface RuntimeUpgradeDefinition {
  id: RuntimeUpgradeId
  label: string
  category: 'Attack' | 'Defense' | 'Utility'
  baseCost: number
  growth: number
  description: string
}

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId
  label: string
  baseCost: number
  growth: number
  description: string
}

export interface WaveSpawn {
  delayMs: number
  chestType: ChestType
  balloonTypes: BalloonType[]
  lane: number
}

export interface WaveDefinition {
  number: number
  spawns: WaveSpawn[]
}

export interface BalloonInstance {
  id: string
  type: BalloonType
  label: string
  hp: number
  maxHp: number
  armor: number
  rewardCash: number
  accent: string
}

export interface ChestInstance {
  id: string
  type: ChestType
  label: string
  progress: number
  speed: number
  initialBalloonCount: number
  rewardCoins: number
  penaltyInsurance: number
  valueRank: number
  accent: string
  lane: number
  balloons: BalloonInstance[]
  isBoss?: boolean
}

export interface BattleStats {
  wave: number
  cash: number
  insurance: number
  drops: number
  escapes: number
  coinsEarned: number
  balloonsPopped: number
  targetPriority: TargetPriority
}

export interface BattleResult extends BattleStats {
  survivedSeconds: number
}

export type BattleEvent =
  | {
      id: string
      type: 'shot'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
    }
  | {
      id: string
      type: 'burstShot'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
      sequence: number
    }
  | {
      id: string
      type: 'crit'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
      damage: number
    }
  | {
      id: string
      type: 'pierce'
      fromLane: number
      fromProgress: number
      fromBalloonIndex: number
      fromBalloonCount: number
      toLane: number
      toProgress: number
      toBalloonIndex: number
      toBalloonCount: number
    }
  | {
      id: string
      type: 'missileLaunch'
      lane: number
      progress: number
      impactProgress: number
      balloonIndex: number
      balloonCount: number
      radius: number
      travelMs: number
    }
  | {
      id: string
      type: 'missileExplode'
      lane: number
      progress: number
      radius: number
      damage: number
    }
  | {
      id: string
      type: 'laserCast'
      laserCount: number
      durationMs: number
    }
  | {
      id: string
      type: 'laserBeam'
      laneX: number
      range: number
      beamIndex: number
    }
  | {
      id: string
      type: 'laserTick'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
      balloonId: string
      beamIndex: number
      damage: number
    }
  | {
      id: string
      type: 'balloonPop'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
    }
  | {
      id: string
      type: 'chestDrop'
      lane: number
      progress: number
      rewardCoins: number
      valueRank: number
      chestLabel: string
      chestAccent: string
    }
  | {
      id: string
      type: 'cashGain'
      lane: number
      progress: number
      balloonIndex: number
      balloonCount: number
      amount: number
    }

export interface MetaProgress {
  totalCoins: number
  upgrades: Record<MetaUpgradeId, number>
  settings: {
    musicOn: boolean
    sfxOn: boolean
  }
  tutorialSeen: Record<'intro' | 'escape' | 'upgrade', boolean>
  lastResult: BattleResult | null
}

export interface BattleSnapshot extends BattleStats {
  chests: ChestInstance[]
  events: BattleEvent[]
  focusTargetId: string | null
  focusRemainingMs: number
  attackCooldownMs: number
  intermissionMs: number
  waveSpawnPercent: number
  waveLabel: string
  canUpgrade: Record<RuntimeUpgradeId, boolean>
  runtimeLevels: Record<RuntimeUpgradeId, number>
  runtimeEffects: Record<RuntimeUpgradeId, number>
  heavyWeapons: {
    missile: {
      unlocked: boolean
      cooldownMs: number
      ready: boolean
    }
    laser: {
      unlocked: boolean
      cooldownMs: number
      ready: boolean
    }
  }
  availableTips: string[]
  battleEnded: boolean
}
