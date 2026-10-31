export interface CombatPacket {
  opcode: string; bytes: number; bodyHex: string; truncated: boolean
  direction: 'server-to-client' | 'client-to-server'; fields: Record<string, unknown>
}
export interface DeathCombatEvent {
  type: 'damage' | 'healing' | 'state' | 'effect'; time: number
  sourceId?: number; targetId?: number; skillId?: number; effectId?: number
  damage?: number; healing?: number; criticalCandidate?: boolean; heavyCandidate?: number
  coverage?: string; stateCode?: number; observedAmount?: number; sourceName?: string; targetName?: string
  sourceNpcId?: number; targetNpcId?: number; skillName?: string; raw?: CombatPacket
}
export interface DeathReport {
  id: string; captureId: string; connectionId: string; playerId: number; playerName: string
  time: number; trigger: 'manual' | 'state-signal'; mode: 'live' | 'replay'
  events: DeathCombatEvent[]; signal?: DeathCombatEvent
}
export interface DeathLogResult {
  records: DeathReport[]; recent: DeathCombatEvent[]; error: string | null
}
export interface DeathLogStatus { buffered: number; records: number; error: string | null }
/** Linha do tempo independente de pausa/reset/cronômetro do DPS. */
export class OverlayDeathRecorder {
  private scope: { captureId: string; connectionId: string; playerId: number; playerName: string; mode: 'live' | 'replay' } | null = null
  private events: DeathCombatEvent[] = []
  private records: DeathReport[]
  private dead = false
  private counter = 0
  constructor(records: DeathReport[] = [], private id?: () => string) { this.records = structuredClone(records.slice(0, 20)) }
  bind(scope: NonNullable<OverlayDeathRecorder['scope']> | null): void {
    if (this.scope?.captureId !== scope?.captureId || this.scope?.connectionId !== scope?.connectionId || this.scope?.playerId !== scope?.playerId) {
      this.events = []; this.dead = false
    }
    this.scope = scope ? { ...scope } : null
  }
  append(event: DeathCombatEvent, connectionId: string): boolean {
    if (!this.scope || connectionId !== this.scope.connectionId || !Number.isFinite(event.time)
      || (event.sourceId !== this.scope.playerId && event.targetId !== this.scope.playerId)) return false
    this.events.push(structuredClone(event))
    this.events.sort((a, b) => a.time - b.time)
    this.events = this.events.slice(-50)
    return true
  }
  observeState(event: DeathCombatEvent, connectionId: string, deathCandidate: boolean): DeathReport | null {
    if (!this.scope || connectionId !== this.scope.connectionId || event.targetId !== this.scope.playerId || !Number.isFinite(event.time)) return null
    if (event.stateCode === 1 && this.dead) { this.events = []; this.dead = false }
    const candidate = deathCandidate && event.stateCode === 2
    const report = candidate && !this.dead ? this.capture(event.time, 'state-signal', event) : null
    if (candidate) this.dead = true
    this.append(event, connectionId)
    return report
  }
  capture(time: number, trigger: DeathReport['trigger'], signal?: DeathCombatEvent): DeathReport | null {
    if (!this.scope || !Number.isFinite(time)) return null
    const report: DeathReport = { ...this.scope, id: this.id?.() ?? `${time}-${++this.counter}`, time, trigger,
      events: structuredClone(this.events.filter(event => event.time <= time).slice(-50)),
      ...(signal ? { signal: structuredClone(signal) } : {}) }
    this.records = [report, ...this.records].slice(0, 20)
    return structuredClone(report)
  }
  list(): DeathLogResult { return { records: structuredClone(this.records), recent: structuredClone(this.events), error: null } }
  status(): DeathLogStatus { return { buffered: this.events.length, records: this.records.length, error: null } }
}
