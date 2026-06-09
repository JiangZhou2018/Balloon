import type { RuntimeUpgradeDefinition, RuntimeUpgradeId } from '@/types/game'

export const runtimeUpgradeDefinitions: RuntimeUpgradeDefinition[] = [
  { id: 'damage', label: '伤害', category: 'Attack', baseCost: 16, growth: 1.38, description: '提高每次命中的基础伤害。' },
  { id: 'fireRate', label: '射速', category: 'Attack', baseCost: 18, growth: 1.42, description: '缩短炮台再次开火的间隔。' },
  { id: 'range', label: '射程', category: 'Attack', baseCost: 14, growth: 1.34, description: '提升可攻击的最高空域。' },
  { id: 'splash', label: '溅射', category: 'Attack', baseCost: 26, growth: 1.48, description: '命中主目标时，对其他宝箱附带少量溅射伤害。' },
  { id: 'burstChance', label: '连射率', category: 'Attack', baseCost: 30, growth: 1.38, description: '主射击有概率额外追加连射。' },
  { id: 'burstCount', label: '连射数', category: 'Attack', baseCost: 42, growth: 1.52, description: '提升连射触发后的追加子弹数量。' },
  { id: 'critChance', label: '暴击率', category: 'Attack', baseCost: 28, growth: 1.38, description: '提高子弹造成暴击的概率。' },
  { id: 'critDamage', label: '暴击伤害', category: 'Attack', baseCost: 36, growth: 1.46, description: '提高暴击伤害倍率。' },
  { id: 'pierceChance', label: '穿透率', category: 'Attack', baseCost: 34, growth: 1.4, description: '子弹命中后有概率继续穿透。' },
  { id: 'pierceCount', label: '穿透数', category: 'Attack', baseCost: 46, growth: 1.54, description: '提升穿透后可继续命中的目标次数。' },
  { id: 'missileChance', label: '导弹率', category: 'Attack', baseCost: 64, growth: 1.56, description: '主射击有概率发射一枚导弹。' },
  { id: 'missileDamage', label: '导弹强化', category: 'Attack', baseCost: 76, growth: 1.62, description: '提高导弹的爆炸伤害和范围。' },
  { id: 'laserChance', label: '激光率', category: 'Attack', baseCost: 72, growth: 1.58, description: '主射击有概率施放持续激光。' },
  { id: 'laserCount', label: '激光数', category: 'Attack', baseCost: 92, growth: 1.66, description: '提升激光施放时同时存在的光束数量。' },
  { id: 'insurance', label: '保险上限', category: 'Defense', baseCost: 20, growth: 1.44, description: '提高本局合约保险上限。' },
  { id: 'claimReduction', label: '理赔减免', category: 'Defense', baseCost: 24, growth: 1.46, description: '降低漏箱时扣除的保险比例。' },
  { id: 'slowField', label: '减速场', category: 'Defense', baseCost: 22, growth: 1.44, description: '整体减缓宝箱向上逃逸的速度。' },
  { id: 'cashPerPop', label: '气球现金', category: 'Utility', baseCost: 18, growth: 1.36, description: '每打爆一颗气球额外获得现金。' },
  { id: 'coinsPerDrop', label: '坠箱金币', category: 'Utility', baseCost: 24, growth: 1.42, description: '提高成功救下宝箱后的金币收益。' },
  { id: 'interest', label: '利息', category: 'Utility', baseCost: 20, growth: 1.34, description: '每 4 秒额外获得一次现金利息。' },
]

export const runtimeUpgradeLookup = Object.fromEntries(
  runtimeUpgradeDefinitions.map((item) => [item.id, item]),
) as Record<RuntimeUpgradeId, RuntimeUpgradeDefinition>

export function getRuntimeUpgradeCost(id: RuntimeUpgradeId, level: number) {
  const definition = runtimeUpgradeLookup[id]
  return Math.round(definition.baseCost * definition.growth ** level)
}
