import type { CombatPacket } from './overlayDeathLog'

export type BuffKind = 'buff' | 'debuff' | 'neutral' | 'unknown'
export interface BuffEvent {
  time: number; connectionId: string; action: 'apply' | 'update' | 'remove'
  effectId: number; sourceId: number; targetId: number; castTokenRaw: string
  serialRaw: string | null; previousSerialRaw?: string; skillIdCandidate?: number | null
  durationMsCandidate?: number; remainingMsCandidate?: number; stackCountCandidate?: number
  kind?: BuffKind; effectNames?: string[]; sourceName?: string; targetName?: string; raw?: CombatPacket
}
export interface ObservedBuff extends BuffEvent { startedAt: number | null }
export interface BuffScope { captureId: string; connectionId: string; playerId: number }
export interface BuffResult {
  scope: BuffScope | null; observed: ObservedBuff[]; recent: BuffEvent[]; overflow: boolean
  journal: { file: string | null; events: number; bytes: number; error: string | null }
}
export function validBuffEvent(value: unknown): value is BuffEvent {
  if (!value || typeof value !== 'object') return false
  const e = value as BuffEvent
  const token = (v: unknown): boolean => typeof v === 'string' && /^\d{1,20}$/.test(v) && BigInt(v) <= 18446744073709551615n
  return Number.isFinite(e.time) && e.time >= 0 && typeof e.connectionId === 'string' && e.connectionId.length > 0 && e.connectionId.length <= 128
    && ['apply', 'update', 'remove'].includes(e.action)
    && [e.effectId, e.sourceId, e.targetId].every(v => Number.isSafeInteger(v) && v > 0)
    && token(e.castTokenRaw) && (e.serialRaw === null || token(e.serialRaw))
    && (e.previousSerialRaw === undefined || token(e.previousSerialRaw))
    && (e.action !== 'update' || (e.serialRaw !== null && e.previousSerialRaw !== undefined))
    && (e.skillIdCandidate == null || Number.isSafeInteger(e.skillIdCandidate))
    && (e.action === 'remove' || [e.durationMsCandidate, e.remainingMsCandidate].every(v => Number.isSafeInteger(v) && v! >= -1)
      && Number.isSafeInteger(e.stackCountCandidate) && e.stackCountCandidate! >= 0)
}
/** Presença observada, nunca um inventário completo ou uma expiração inferida pelo timer. */
export class OverlayBuffTracker {
  private scope: BuffScope | null = null
  private observed = new Map<string, ObservedBuff>()
  private recent: BuffEvent[] = []
  private overflow = false
  bind(scope: BuffScope | null): void {
    if (scope?.captureId !== this.scope?.captureId || scope?.connectionId !== this.scope?.connectionId || scope?.playerId !== this.scope?.playerId) {
      this.observed.clear(); this.recent = []; this.overflow = false
    }
    this.scope = scope ? { ...scope } : null
  }
  accept(event: BuffEvent): string {
    if (!validBuffEvent(event) || !this.scope || event.connectionId !== this.scope.connectionId
      || (event.sourceId !== this.scope.playerId && event.targetId !== this.scope.playerId)) return 'outside-scope'
    this.recent.push(structuredClone(event)); this.recent.sort((a,b) => a.time-b.time); this.recent = this.recent.slice(-200)
    if (event.targetId !== this.scope.playerId) return 'outgoing'
    if (event.serialRaw === null) return 'serial-unavailable'
    const previous = event.action === 'update' ? event.previousSerialRaw! : event.serialRaw
    const old = this.observed.get(previous)
    const current = this.observed.get(event.serialRaw)
    if ((old && event.time < old.time) || (current && event.time < current.time)) return 'out-of-order'
    const matching = old?.effectId === event.effectId && old.sourceId === event.sourceId
    const relation = matching ? 'matched' : old ? 'metadata-conflict' : event.action === 'apply' ? 'new-application' : 'start-not-observed'
    if (event.action === 'remove') {
      if (matching) this.observed.delete(previous)
      return relation
    }
    // Um conflito impede atribuir continuidade, mas o novo pacote confirma presença daqui em diante.
    if (event.action === 'update' && old) this.observed.delete(previous)
    if (!this.observed.has(event.serialRaw) && this.observed.size >= 2048) { this.overflow = true; return 'capacity' }
    const { raw: _raw, ...state } = event
    this.observed.set(event.serialRaw, { ...structuredClone(state), startedAt: matching ? old.startedAt : event.action === 'apply' ? event.time : null })
    return relation
  }
  snapshot(): Omit<BuffResult, 'journal'> {
    return { scope: this.scope ? { ...this.scope } : null, observed: this.states(),
      recent: structuredClone(this.recent), overflow: this.overflow }
  }
  states(): ObservedBuff[] { return structuredClone([...this.observed.values()]) }
}
