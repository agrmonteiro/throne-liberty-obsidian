import type { BuffEvent } from './overlayBuffs'
import type { MeterEvent } from './overlayMeter'

export interface BuffContributionRow {
  effectId: number; name: string; stacks: number | null; activeDamage: number; expectedDamage: number
  estimatedDamage: number; samples: number; baselineSamples: number; targets: number; skills: number
  confidence: 'insufficient' | 'low' | 'medium'
}

interface ActiveEffect { effectId: number; targetId: number; serial: string; name: string; stacks: number | null }
interface Aggregate { effectId: number; name: string; stacks: number | null; activeDamage: number; expectedDamage: number; samples: number; baselineSamples: number; targets: Set<number>; skills: Set<number> }
interface Baseline { total: number; samples: number }

/** Compara acertos sob um debuff com a média anterior da mesma habilidade/alvo. */
export class OverlayBuffContribution {
  private scope: { connectionId: string; playerId: number } | null = null
  private active = new Map<string, ActiveEffect>()
  private baseline = new Map<string, Baseline>()
  private rows = new Map<string, Aggregate>()
  bind(scope: { connectionId: string; playerId: number } | null): void {
    if (!scope || !this.scope || scope.connectionId !== this.scope.connectionId || scope.playerId !== this.scope.playerId) {
      this.active.clear(); this.baseline.clear(); this.rows.clear()
    }
    this.scope = scope ? { ...scope } : null
  }
  private key(effect: number, target: number, serial: string): string { return `${effect}:${target}:${serial}` }
  private baselineKey(target: number, skill: number): string { return `${target}:${skill}` }
  acceptBuff(event: BuffEvent): void {
    if (!this.scope || event.connectionId !== this.scope.connectionId || event.sourceId !== this.scope.playerId || event.targetId === this.scope.playerId || event.serialRaw === null) return
    const oldSerial = event.action === 'update' ? event.previousSerialRaw ?? event.serialRaw : event.serialRaw
    const oldKey = this.key(event.effectId, event.targetId, oldSerial)
    if (event.action === 'remove') { this.active.delete(oldKey); return }
    if (event.action === 'update') this.active.delete(oldKey)
    this.active.set(this.key(event.effectId, event.targetId, event.serialRaw), { effectId: event.effectId, targetId: event.targetId, serial: event.serialRaw,
      name: event.effectNames?.[0] || `Efeito ${event.effectId}`, stacks: event.stackCountCandidate ?? null })
  }
  addDamage(connectionId: string, event: MeterEvent): void {
    if (!this.scope || connectionId !== this.scope.connectionId || event.sourceId !== this.scope.playerId || !Number.isSafeInteger(event.targetId) || event.targetId <= 0) return
    const active = [...this.active.values()].filter(row => row.targetId === event.targetId)
    const baselineKey = this.baselineKey(event.targetId, event.skillId), baseline = this.baseline.get(baselineKey)
    if (!active.length) {
      const next = { total: (baseline?.total ?? 0) + event.damage, samples: (baseline?.samples ?? 0) + 1 }
      if (next.samples <= 500) this.baseline.set(baselineKey, next)
      return
    }
    if (!baseline || baseline.samples < 5) return
    for (const effect of active) {
      const row = this.rows.get(String(effect.effectId)) ?? { effectId: effect.effectId, name: effect.name, stacks: effect.stacks, activeDamage: 0, expectedDamage: 0,
        samples: 0, baselineSamples: 0, targets: new Set<number>(), skills: new Set<number>() }
      const expected = baseline.total / baseline.samples
      row.name = effect.name; row.stacks = effect.stacks; row.activeDamage += event.damage; row.expectedDamage += expected
      row.samples++; row.baselineSamples += baseline.samples; row.targets.add(event.targetId); row.skills.add(event.skillId)
      this.rows.set(String(effect.effectId), row)
    }
  }
  snapshot(): BuffContributionRow[] {
    return [...this.rows.values()].map(row => {
      const estimatedDamage = row.activeDamage - row.expectedDamage
      const confidence = row.samples >= 30 && row.baselineSamples >= 300 ? 'medium' : row.samples >= 10 ? 'low' : 'insufficient'
      return { effectId: row.effectId, name: row.name, stacks: row.stacks, activeDamage: row.activeDamage, expectedDamage: row.expectedDamage,
        estimatedDamage, samples: row.samples, baselineSamples: row.baselineSamples, targets: row.targets.size, skills: row.skills.size, confidence }
    }).sort((a,b) => b.estimatedDamage-a.estimatedDamage)
  }
}
