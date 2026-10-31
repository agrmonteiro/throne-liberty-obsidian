import reference from '../data/overlayHealingEffects.json'
import type { MeterHealingEvent } from './overlayMeter'
import type { DeathCombatEvent } from './overlayDeathLog'

const effects: Record<string, { group: string }> = reference.effects
const skills = new Set(reference.skillIds)
export function healingCoverage(effectId: number, skillId: number, sourceId: number, targetId: number,
  format: 'periodic' | 'instant'): MeterHealingEvent['coverage'] | null {
  if (!Number.isSafeInteger(effectId) || !Number.isSafeInteger(skillId) || !Number.isSafeInteger(sourceId) || sourceId <= 0
    || !Number.isSafeInteger(targetId) || targetId <= 0 || !skills.has(skillId)) return null
  const group = effects[String(effectId)]?.group, self = sourceId === targetId
  if (effectId === 939538607 && !self) return null
  if (format === 'periodic' && (group === 'Continuous_Heal' || group === 'Intervallic_Heal')) return self ? 'self-periodic' : 'external-periodic'
  if (format === 'instant' && group === 'Instant_Heal') return !self ? 'external-instant' : effectId === 939538607 ? 'self-lifesteal' : 'self-instant'
  return null
}
export function recognizedHealing(event: MeterHealingEvent): boolean {
  const periodic = event.coverage === 'self-periodic' || event.coverage === 'external-periodic'
  return Number.isFinite(event.healing) && event.healing > 0 && event.coverage === healingCoverage(event.effectId, event.skillId, event.sourceId, event.targetId, periodic ? 'periodic' : 'instant')
}
/** Reclassifica somente observações conhecidas; o original em disco e o pacote bruto são preservados. */
export function resolveHealingObservation(event: DeathCombatEvent): DeathCombatEvent {
  if (event.type !== 'effect' || !Number.isFinite(event.observedAmount) || event.observedAmount! <= 0
    || event.raw?.direction !== 'server-to-client') return event
  const format = event.raw.opcode === '0x12344a63' ? 'periodic' : event.raw.opcode === '0x12344a70' ? 'instant' : null
  const coverage = format && healingCoverage(event.effectId!, event.skillId!, event.sourceId!, event.targetId!, format)
  return coverage ? { ...event, type: 'healing', healing: event.observedAmount, coverage,
    originalType: 'effect', classification: 'healing-effect-catalog' } : event
}
