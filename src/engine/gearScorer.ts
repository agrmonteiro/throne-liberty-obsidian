/**
 * Gear Scorer — pontua e ranqueia itens pelo impacto no DPS
 *
 * Estratégia:
 *  1. Para cada item candidato, aplica os stats dele sobre o RotationCharacter base
 *  2. Recalcula o DPS total da rotação com o personagem modificado
 *  3. Ordena por dpsDelta decrescente
 */

import type {
  RotationCharacter,
  Rotation,
  EquippedItem,
  ItemStats,
  ItemUpgradeSuggestion,
  ItemSlot,
} from './types'
import { calcRotationResult } from './rotationEngine'

// ─── Pesos por stat (para scorePts secundário) ────────────────────────────────

const STAT_WEIGHTS: Record<keyof ItemStats, number> = {
  critHitChance:      1.2,
  heavyAttackChance:  1.0,
  critDmgPct:         0.9,
  heavyAttackDmgComp: 0.8,
  skillDmgBoost:      1.5,
  speciesDmgBoost:    1.3,
  bonusDmg:           0.7,
  attackSpeedPct:     0.6,
  cdrPct:             0.5,
  weaponDmgMin:       0.4,
  weaponDmgMax:       0.5,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Aplica os stats de um item sobre um RotationCharacter, retornando um novo objeto */
function applyItemStats(char: RotationCharacter, stats: ItemStats): RotationCharacter {
  return {
    ...char,
    critChanceBase:   char.critChanceBase   + (stats.critHitChance      ?? 0),
    heavyChanceBase:  char.heavyChanceBase  + (stats.heavyAttackChance  ?? 0),
    critDmgPct:       char.critDmgPct       + (stats.critDmgPct         ?? 0),
    heavyDmgPct:      char.heavyDmgPct      + (stats.heavyAttackDmgComp ?? 0),
    skillDmgBoost:    char.skillDmgBoost    + (stats.skillDmgBoost      ?? 0),
    speciesDmgBoost:  char.speciesDmgBoost  + (stats.speciesDmgBoost    ?? 0),
    bonusDamage:      char.bonusDamage      + (stats.bonusDmg           ?? 0),
    attackSpeedPct:   char.attackSpeedPct   + (stats.attackSpeedPct     ?? 0),
    cdrPct:           char.cdrPct           + (stats.cdrPct             ?? 0),
    weaponMainDmgMin: char.weaponMainDmgMin + (stats.weaponDmgMin       ?? 0),
    weaponMainDmgMax: char.weaponMainDmgMax + (stats.weaponDmgMax       ?? 0),
  }
}

/** Pontuação ponderada por stat (independente do DPS — usado como desempate) */
function calcStatScore(stats: ItemStats): number {
  return (Object.keys(stats) as Array<keyof ItemStats>).reduce((acc, key) => {
    const val = stats[key] ?? 0
    const weight = STAT_WEIGHTS[key] ?? 0.5
    return acc + val * weight
  }, 0)
}

/** Texto explicativo do upgrade */
function buildReason(item: EquippedItem, dpsDelta: number, baseDps: number): string {
  const pct = baseDps > 0 ? ((dpsDelta / baseDps) * 100).toFixed(1) : '0.0'
  const statLines = (Object.keys(item.stats) as Array<keyof ItemStats>)
    .filter(k => (item.stats[k] ?? 0) !== 0)
    .map(k => `+${item.stats[k]} ${k}`)
    .join(', ')
  return `+${dpsDelta.toFixed(0)} DPS (+${pct}%)${statLines ? ` via ${statLines}` : ''}`
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Avalia uma lista de itens candidatos e retorna sugestões ranqueadas por impacto no DPS.
 *
 * @param rotation  Rotação atual (com personagem e skills configurados)
 * @param candidates Itens a avaliar (ex: biblioteca de itens importados do quest log)
 * @param simulationSeconds Janela de simulação (padrão 60s)
 */
export function rankItemUpgrades(
  rotation: Rotation,
  candidates: EquippedItem[],
  simulationSeconds = 60,
): ItemUpgradeSuggestion[] {
  const baseDps = calcRotationResult(rotation, simulationSeconds).totalDps

  const suggestions: ItemUpgradeSuggestion[] = candidates.map(item => {
    const modifiedChar = applyItemStats(rotation.character, item.stats)
    const modifiedRotation: Rotation = { ...rotation, character: modifiedChar }
    const newDps = calcRotationResult(modifiedRotation, simulationSeconds).totalDps
    const dpsDelta = newDps - baseDps
    const scorePts = calcStatScore(item.stats)

    return {
      item,
      slot: item.slot,
      dpsDelta,
      scorePts,
      reason: buildReason(item, dpsDelta, baseDps),
    }
  })

  // Ordena: maior dpsDelta primeiro; empate → maior scorePts
  return suggestions.sort((a, b) =>
    b.dpsDelta !== a.dpsDelta ? b.dpsDelta - a.dpsDelta : b.scorePts - a.scorePts,
  )
}

/**
 * Filtra sugestões por slot, mantendo apenas o melhor item por slot.
 */
export function bestPerSlot(
  suggestions: ItemUpgradeSuggestion[],
): Partial<Record<ItemSlot, ItemUpgradeSuggestion>> {
  const result: Partial<Record<ItemSlot, ItemUpgradeSuggestion>> = {}
  for (const s of suggestions) {
    if (!result[s.slot]) result[s.slot] = s
  }
  return result
}
