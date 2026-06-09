import type { MetaUpgradeDefinition, MetaUpgradeId } from '@/types/game'

export const metaUpgradeDefinitions: MetaUpgradeDefinition[] = [
  { id: 'damageLevel', label: '基础伤害', baseCost: 24, growth: 1.42, description: '提高每局开局伤害。' },
  { id: 'fireRateLevel', label: '基础射速', baseCost: 24, growth: 1.42, description: '减少每局开局攻击间隔。' },
  { id: 'startCashLevel', label: '初始现金', baseCost: 18, growth: 1.36, description: '开局额外获得现金。' },
  { id: 'coinBonusLevel', label: '金币加成', baseCost: 28, growth: 1.48, description: '提高所有宝箱坠落后的金币收益。' },
  { id: 'insuranceLevel', label: '保险上限', baseCost: 30, growth: 1.5, description: '提高开局保险值上限。' },
  { id: 'slowFieldLevel', label: '减速强化', baseCost: 22, growth: 1.38, description: '提高默认减速场效果。' },
]

export function createInitialMetaUpgradeLevels(): Record<MetaUpgradeId, number> {
  return {
    damageLevel: 0,
    fireRateLevel: 0,
    startCashLevel: 0,
    coinBonusLevel: 0,
    insuranceLevel: 0,
    slowFieldLevel: 0,
  }
}

export function getMetaUpgradeCost(definition: MetaUpgradeDefinition, level: number) {
  return Math.round(definition.baseCost * definition.growth ** level)
}
