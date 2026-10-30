export const METER_IDLE_MS = 5 * 60 * 1000
export type DamageKind = 'normal' | 'critical' | 'heavy' | 'criticalHeavy'
export type DamageBreakdown = Record<DamageKind, number>
export const emptyDamageBreakdown = (): DamageBreakdown => ({ normal: 0, critical: 0, heavy: 0, criticalHeavy: 0 })
export interface MeterEvent {
  time: number; damage: number; skillId: number; sourceId: number
  criticalCandidate: boolean; heavyCandidate: number
}
export interface MeterSkill {
  key: string; name: string; damage: number; hits: number; critical: number; heavy: number
  skillIds?: number[]; iconFile?: string
  damageByKind: DamageBreakdown
}
export interface MeterSession {
  total: number; hits: number; critical: number; heavy: number
  damageByKind: DamageBreakdown
  startedAt: number | null; lastDamageAt: number | null; elapsedSec: number
  dps: number; idleSec: number; waitingReset: boolean; skills: MeterSkill[]
}
export interface OverlayPlayerIdentity {
  sourceId: number; connectionId: string; observedAt: number; method: 'local-state'
}
/** Identidade local só muda com evidência do protocolo, nunca por dano/inatividade. */
export class OverlayIdentity {
  private player: OverlayPlayerIdentity | null = null
  private retiredConnections = new Set<string>()
  clear(): void { this.player = null; this.retiredConnections.clear() }
  snapshot(): OverlayPlayerIdentity | null { return this.player ? { ...this.player } : null }
  identify(sourceId: number, connectionId: string, at: number): 'changed' | 'same' | 'ignored' {
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || typeof connectionId !== 'string'
      || !connectionId.length || connectionId.length > 128 || !Number.isFinite(at)
      || this.retiredConnections.has(connectionId)) return 'ignored'
    const previous = this.player
    if (previous && at < previous.observedAt) return 'ignored'
    if (previous && previous.connectionId !== connectionId) {
      this.retiredConnections.add(previous.connectionId)
    }
    const changed = !previous || previous.sourceId !== sourceId || previous.connectionId !== connectionId
    this.player = { sourceId, connectionId, observedAt: at, method: 'local-state' }
    return changed ? 'changed' : 'same'
  }
  accepts(connectionId: string): boolean { return this.player?.connectionId === connectionId }
  isRetired(connectionId: string): boolean { return this.retiredConnections.has(connectionId) }
  retire(connectionId: string): boolean {
    if (typeof connectionId !== 'string' || !connectionId.length) return false
    this.retiredConnections.add(connectionId)
    if (!this.accepts(connectionId)) return false
    this.player = null
    return true
  }
}
export class OverlayMeter {
  private startedAt: number | null = null
  private lastDamageAt: number | null = null
  private ignoreBefore = 0
  private rows = new Map<string, MeterSkill>()
  constructor(public sourceId: number | null = null, private names: Record<string, string> = {},
    private icons: Record<string, string> = {}) {}
  reset(at = 0): void {
    this.startedAt = this.lastDamageAt = null
    this.ignoreBefore = at
    this.rows.clear()
  }
  selectSource(id: number | null, at = 0): void { this.sourceId = id; this.reset(at) }
  add(event: MeterEvent): boolean {
    const at = event.time * 1000
    if (!Number.isSafeInteger(event.sourceId) || event.sourceId <= 0 || !Number.isFinite(event.damage)
      || event.damage <= 0 || !Number.isFinite(at) || at < this.ignoreBefore
      || (this.lastDamageAt !== null && at < this.lastDamageAt)) return false
    if (this.sourceId === null || event.sourceId !== this.sourceId || !Number.isFinite(event.damage)
      || event.damage <= 0 || !Number.isFinite(at) || at < this.ignoreBefore) return false
    if (this.lastDamageAt !== null && at < this.lastDamageAt) return false
    if (this.lastDamageAt !== null && at - this.lastDamageAt >= METER_IDLE_MS) this.reset()
    this.startedAt ??= at
    this.lastDamageAt = at
    const name = this.names[String(event.skillId)] ?? `Habilidade ${event.skillId}`
    const iconFile = this.icons[String(event.skillId)]
    const key = this.names[String(event.skillId)] ? (iconFile ? `${name}::${iconFile}` : name) : String(event.skillId)
    const row = this.rows.get(key) ?? { key, name, iconFile, skillIds: [], damage: 0, hits: 0, critical: 0, heavy: 0, damageByKind: emptyDamageBreakdown() }
    row.skillIds ??= []
    if (!row.skillIds.includes(event.skillId)) row.skillIds.push(event.skillId)
    row.damage += event.damage; row.hits++
    row.critical += Number(event.criticalCandidate)
    row.heavy += Number(Boolean(event.heavyCandidate))
    const kind: DamageKind = event.criticalCandidate
      ? (event.heavyCandidate ? 'criticalHeavy' : 'critical')
      : (event.heavyCandidate ? 'heavy' : 'normal')
    row.damageByKind[kind] += event.damage
    this.rows.set(key, row)
    return true
  }
  snapshot(now = Date.now()): MeterSession {
    const skills = [...this.rows.values()].map(row => ({ ...row, skillIds: row.skillIds?.slice(), damageByKind: { ...row.damageByKind } })).sort((a, b) => b.damage - a.damage)
    const damageByKind = emptyDamageBreakdown()
    for (const row of skills) for (const kind of Object.keys(damageByKind) as DamageKind[]) damageByKind[kind] += row.damageByKind[kind]
    const total = skills.reduce((sum, row) => sum + row.damage, 0)
    const elapsedSec = this.startedAt === null ? 0 : Math.max(0, (now - this.startedAt) / 1000)
    const idleSec = this.lastDamageAt === null ? 0 : Math.max(0, (now - this.lastDamageAt) / 1000)
    return {
      total, elapsedSec, idleSec, skills, damageByKind, dps: elapsedSec >= 1 ? total / elapsedSec : 0,
      startedAt: this.startedAt, lastDamageAt: this.lastDamageAt,
      hits: skills.reduce((sum, row) => sum + row.hits, 0),
      critical: skills.reduce((sum, row) => sum + row.critical, 0),
      heavy: skills.reduce((sum, row) => sum + row.heavy, 0),
      waitingReset: this.lastDamageAt !== null && idleSec >= METER_IDLE_MS / 1000,
    }
  }
}
export interface PanelBounds { x: number; y: number; width: number; height: number }
export type OverlayPanel = 'total' | 'skills' | 'controls'
export interface PanelAnchor { x: number; y: number }
export interface OverlayTheme {
  background: string; text: string; accent: string
  normal: string; critical: string; heavy: string; criticalHeavy: string
}
export interface OverlayConfig {
  reviewEncounterId?: string | null
  autoSource?: boolean
  locked: boolean; totalVisible: boolean; skillsVisible: boolean; opacity: number; scale: number
  sourceId: number | null; totalBounds?: PanelBounds; skillsBounds?: PanelBounds
  controlsVisible?: boolean; controlsExpanded?: boolean; controlsBounds?: PanelBounds
  anchors?: Partial<Record<OverlayPanel, PanelAnchor>>
  fontFamily?: 'Inter' | 'Arial' | 'Consolas'; fontSize?: number; chartPadding?: number; chartPaddingVertical?: number; theme?: OverlayTheme
}
export interface OverlayState {
  capture?: { id: string; connectionId: string | null; encounterId: string; player: OverlayPlayerIdentity | null }
  game?: { attached: boolean; active: boolean; bounds: PanelBounds | null }
  unknownSkillLog?: { directory: string; events: number; ids: number; error: string | null }
  config: OverlayConfig; session: MeterSession
  mode: 'live' | 'replay' | null
  status: 'stopped' | 'starting' | 'live' | 'replay' | 'error'
  message: string; sources: Array<{ id: number; damage: number; name?: string; lastDamageAt?: number; localPlayer?: boolean }>
}
export interface OverlayEncounter {
  captureId?: string; connectionId?: string | null
  sourceName?: string; attributionVersion?: number
  id: string; sourceId: number | null; mode: 'live' | 'replay'; reason: string
  savedAt: number; session: MeterSession
}
export interface OverlayHistoryResult { encounters: OverlayEncounter[]; error: string | null }
/** Aplica nomes novos também ao acumulado já aberto, sem reiniciar a captura. */
export function resolveOverlayNames(state: OverlayState, names: Record<string, string>, icons: Record<string, string> = {}): OverlayState {
  const rows = new Map<string, MeterSkill>()
  for (const original of state.session.skills) {
    const skillIds = original.skillIds?.slice() ?? (/^\d+$/.test(original.key) ? [Number(original.key)] : [])
    const mapped = [...new Set(skillIds.map(id => names[String(id)]).filter(Boolean))]
    const files = [...new Set(skillIds.map(id => icons[String(id)]).filter(Boolean))]
    const name = names[original.key] ?? (mapped.length === 1 ? mapped[0] : original.name)
    const iconFile = files.length === 1 ? files[0] : files.length > 1 ? undefined : original.iconFile
    const key = iconFile ? `${name}::${iconFile}` : names[original.key] || mapped.length === 1 ? name : original.key
    const row = rows.get(key)
    if (!row) { rows.set(key, { ...original, key, name, iconFile, skillIds, damageByKind: { ...original.damageByKind } }); continue }
    row.skillIds = [...new Set([...(row.skillIds ?? []), ...skillIds])]
    row.damage += original.damage; row.hits += original.hits
    row.critical += original.critical; row.heavy += original.heavy
    for (const kind of Object.keys(row.damageByKind) as DamageKind[]) row.damageByKind[kind] += original.damageByKind[kind]
  }
  return { ...state, session: { ...state.session, skills: [...rows.values()].sort((a, b) => b.damage - a.damage) } }
}
export interface OverlayAPI {
  clearRecords: () => Promise<OverlayHistoryResult>
  history: () => Promise<OverlayHistoryResult>
  get: () => Promise<OverlayState>
  configure: (patch: Partial<OverlayConfig>) => Promise<OverlayState>
  start: () => Promise<OverlayState>
  stop: () => Promise<OverlayState>
  reset: () => Promise<OverlayState>
  replay: (speed?: number) => Promise<OverlayState>
  bounds: (panel: OverlayPanel, value: PanelBounds) => Promise<void>
  subscribe: (callback: (state: OverlayState) => void) => () => void
}

export function overlaySourceWarning(state: OverlayState): string | null {
  if (state.status !== 'live' && state.status !== 'replay') return null
  if (state.config.sourceId === null && state.config.autoSource !== false) return state.mode === 'live'
    ? 'Aguardando identificar seu personagem. Faça um ataque para detectar a entidade local.'
    : 'Aguardando identificar a origem da reprodução.'
  if (state.config.sourceId === null) return state.sources.length
    ? 'Dano recebido. Selecione sua origem no app para medir.'
    : 'Aguardando ataques para identificar a origem do dano.'
  if (!state.sources.some(source => source.id === state.config.sourceId && source.damage > 0)) {
    return state.sources.some(source => source.damage > 0)
      ? 'Há dano de outras origens. Confira o personagem selecionado no app.'
      : 'Aguardando dano da origem selecionada.'
  }
  const selected = state.sources.find(source => source.id === state.config.sourceId)
  if (selected?.lastDamageAt !== undefined && state.session.idleSec >= 10) {
    return state.sources.some(source => source.id !== selected.id && source.lastDamageAt !== undefined && source.lastDamageAt > selected.lastDamageAt! + 5000)
      ? `Sem dano da origem selecionada há ${Math.floor(state.session.idleSec)} s; outras entidades estão ativas.` : null
  }
  return null
}
