import type { BalloonType, WaveDefinition, WaveSpawn } from '@/types/game'

function lane(index: number) {
  return index % 3
}

function spawn(delayMs: number, chestType: WaveSpawn['chestType'], balloonTypes: BalloonType[], laneIndex: number): WaveSpawn {
  return {
    delayMs,
    chestType,
    balloonTypes,
    lane: lane(laneIndex),
  }
}

const scripted: Record<number, WaveDefinition> = {
  1: { number: 1, spawns: [spawn(0, 'cash', ['basic', 'basic'], 0)] },
  2: { number: 2, spawns: [spawn(0, 'cash', ['basic', 'basic'], 1), spawn(900, 'cash', ['basic', 'gold'], 2)] },
  3: { number: 3, spawns: [spawn(0, 'standard', ['basic', 'basic', 'gold'], 0)] },
  4: { number: 4, spawns: [spawn(0, 'cash', ['basic', 'gold'], 0), spawn(1000, 'standard', ['basic', 'basic', 'basic'], 2)] },
  5: { number: 5, spawns: [spawn(0, 'standard', ['gold', 'basic', 'basic'], 1), spawn(1200, 'cash', ['gold', 'basic'], 0)] },
  6: { number: 6, spawns: [spawn(0, 'vault', ['basic', 'basic', 'gold', 'basic'], 1)] },
  7: { number: 7, spawns: [spawn(0, 'standard', ['armored', 'basic', 'gold'], 0), spawn(900, 'vault', ['basic', 'basic', 'gold', 'basic'], 2)] },
  8: { number: 8, spawns: [spawn(0, 'vault', ['gold', 'gold', 'basic', 'basic'], 0), spawn(1200, 'cash', ['boost', 'basic'], 1)] },
  9: { number: 9, spawns: [spawn(0, 'standard', ['boost', 'basic', 'basic'], 0), spawn(900, 'vault', ['basic', 'gold', 'basic', 'basic'], 2)] },
  10: { number: 10, spawns: [spawn(0, 'vault', ['armored', 'basic', 'gold', 'basic'], 0), spawn(1100, 'gold', ['basic', 'gold', 'basic', 'basic', 'basic'], 2)] },
  11: { number: 11, spawns: [spawn(0, 'gold', ['armored', 'basic', 'gold', 'basic', 'basic'], 1)] },
  12: { number: 12, spawns: [spawn(0, 'standard', ['shield', 'basic', 'basic'], 0), spawn(900, 'vault', ['armored', 'basic', 'gold', 'basic'], 2)] },
  13: { number: 13, spawns: [spawn(0, 'gold', ['boost', 'basic', 'gold', 'basic', 'basic'], 1), spawn(900, 'standard', ['shield', 'gold', 'basic'], 0)] },
  14: { number: 14, spawns: [spawn(0, 'vault', ['shield', 'basic', 'gold', 'basic'], 2), spawn(700, 'gold', ['armored', 'basic', 'gold', 'boost', 'basic'], 0)] },
  15: { number: 15, spawns: [spawn(0, 'ufo', ['shield', 'armored', 'gold', 'boost', 'basic', 'basic'], 1)] },
}

export function getWaveDefinition(wave: number): WaveDefinition {
  if (scripted[wave]) {
    return scripted[wave]
  }

  const wavePower = Math.max(0, wave - 15)
  const spawnCount = Math.min(3, 1 + Math.floor(wavePower / 3))
  const spawns: WaveSpawn[] = []
  const chestPool: WaveSpawn['chestType'][] = ['standard', 'vault', 'gold']
  if (wavePower > 5) chestPool.push('ufo')

  for (let index = 0; index < spawnCount; index += 1) {
    const chestType = chestPool[(wave + index) % chestPool.length]
    const balloonTypes: BalloonType[] = ['basic', 'gold']

    if (wavePower >= 1) balloonTypes.push('armored')
    if (wavePower >= 3) balloonTypes.push('boost')
    if (wavePower >= 5) balloonTypes.push('shield')

    spawns.push(
      spawn(index * 950, chestType, balloonTypes.slice(0, Math.min(balloonTypes.length, 2 + (wave % 4))), index),
    )
  }

  return { number: wave, spawns }
}
