import type { GroupHealingSnapshot } from './groupHealingMeter'
import type { GroupReceivedSegment } from './groupReceivedMeter'

export const METER_IDLE_MS = 5 * 60 * 1000
export type DamageKind = 'normal' | 'critical' | 'heavy' | 'criticalHeavy'
export type DamageBreakdown = Record<DamageKind, number>
export const emptyDamageBreakdown = (): DamageBreakdown => ({ normal: 0, critical: 0, heavy: 0, criticalHeavy: 0 })
export interface MeterEvent {
  time: number; damage: number; skillId: number; sourceId: number
  criticalCandidate: boolean; heavyCandidate: number; targetId?: number
}
export interface MeterHealingEvent {
  time: number; healing: number; skillId: number; sourceId: number; targetId: number; effectId: number
  coverage: 'self-periodic' | 'self-lifesteal' | 'self-instant' | 'external-periodic' | 'external-instant'
}
export interface MeterHealing { total: number; hits: number; skills: MeterSkill[] }
export interface TimedMeasurement { startsAt: number; endsAt: number; durationSec: number; cancelled?: boolean }
export interface MeterSkill {
  key: string; name: string; damage: number; hits: number; critical: number; heavy: number
  skillIds?: number[]; iconFile?: string
  /** Nome vindo do catálogo local ou somente o ID ainda não resolvido. */
  identity?: 'catalog' | 'unresolved'
  damageByKind: DamageBreakdown
}
export interface MeterReceived {
  total: number; hits: number; skills: MeterSkill[]
  sources: Array<{ id: number; damage: number; hits: number; name?: string; npcId?: number; skills?: MeterSkill[] }>
}
function snapshotSkills(rows: Iterable<MeterSkill>): MeterSkill[] {
  return [...rows].map(row => ({ ...row, skillIds: row.skillIds?.slice(), damageByKind: { ...row.damageByKind } }))
    .sort((a, b) => b.damage - a.damage)
}
export interface MeterSession {
  total: number; hits: number; critical: number; heavy: number
  damageByKind: DamageBreakdown
  startedAt: number | null; lastDamageAt: number | null; elapsedSec: number
  dps: number; idleSec: number; waitingReset: boolean; skills: MeterSkill[]
  paused?: boolean
  gameCombatEnded?: boolean
  lastActivityAt?: number | null; received?: MeterReceived
  targets?: Array<{ id: number; damage: number; hits: number; name?: string; npcId?: number; identity?: EntityIdentityEvidence; rank?: NpcRankHint; rankSource?: NpcRankSource; skills: MeterSkill[] }>
  healing?: { done: MeterHealing; received: MeterHealing; coverage: 'self-observed' | 'observed' }
  timed?: TimedMeasurement
}
export interface OverlayPlayerIdentity {
  sourceId: number; connectionId: string; observedAt: number; method: 'local-state' | 'profile-name'
}
export type EntityIdentityEvidence = 'profile' | 'npc-template' | 'unresolved' | 'conflict'
/** Qualidade do NPC normalizada a partir do template local do cliente. */
export type NpcRankHint = 'boss' | 'champion' | 'elite' | 'normal' | 'unique'
/** `creature-rank` é o campo explícito do cliente; fallback só existe para builds incompletos. */
export type NpcRankSource = 'creature-rank' | 'row-fallback'
export interface GroupSource {
  id: number; name?: string; npcId?: number; rank?: NpcRankHint; rankSource?: NpcRankSource
  kind: 'player' | 'npc' | 'unknown' | 'conflict'; evidence: EntityIdentityEvidence; session: MeterSession
}
export interface GroupConnection { id: string; closed: boolean; lastAt: number; sources: GroupSource[] }
export interface OverlayCombatSegment {
  id: number; connectionId: string; startedAt: number; endedAt: number | null; lastActivityAt: number
  endReason: 'combat-exit' | 'inactivity' | null; events: number
  dominantTarget?: { templateId: string; name?: string; rank: 'boss' | 'champion' | 'elite' | 'normal'; level?: number }
}
/** Identidade local só muda com evidência do protocolo, nunca por dano/inatividade. */
export class OverlayIdentity {
  private player: OverlayPlayerIdentity | null = null
  private retiredConnections = new Set<string>()
  clear(): void { this.player = null; this.retiredConnections.clear() }
  snapshot(): OverlayPlayerIdentity | null { return this.player ? { ...this.player } : null }
  identify(sourceId: number, connectionId: string, at: number, method: OverlayPlayerIdentity['method'] = 'local-state'): 'changed' | 'same' | 'ignored' {
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || typeof connectionId !== 'string'
      || !connectionId.length || connectionId.length > 128 || !Number.isFinite(at)
      || this.retiredConnections.has(connectionId)) return 'ignored'
    const previous = this.player
    if (previous && at < previous.observedAt) return 'ignored'
    if (previous && previous.connectionId !== connectionId) {
      this.retiredConnections.add(previous.connectionId)
    }
    const changed = !previous || previous.sourceId !== sourceId || previous.connectionId !== connectionId
    this.player = { sourceId, connectionId, observedAt: at, method }
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
  private combatEndedAt: number | null = null
  private gameCombatActive = false
  private startedAt: number | null = null
  private lastDamageAt: number | null = null
  private lastActivityAt: number | null = null
  private ignoreBefore = 0
  private pausedAt: number | null = null
  private pausedMs = 0
  private startedPauseMs = 0
  private lastDamagePauseMs = 0
  private rows = new Map<string, MeterSkill>()
  private receivedRows = new Map<string, MeterSkill>()
  private receivedSources = new Map<number, { id: number; damage: number; hits: number }>()
  private receivedSourceSkills = new Map<number, Map<string, MeterSkill>>()
  private targets = new Map<number, { id: number; damage: number; hits: number; skills: Map<string, MeterSkill> }>()
  private healingDoneRows = new Map<string, MeterSkill>()
  private healingReceivedRows = new Map<string, MeterSkill>()
  private timed: TimedMeasurement | null = null
  constructor(public sourceId: number | null = null, private names: Record<string, string> = {},
    private icons: Record<string, string> = {}) {}
  reset(at = 0): void {
    this.combatEndedAt = null
    this.gameCombatActive = false
    this.startedAt = this.lastDamageAt = this.lastActivityAt = null
    this.timed = null
    this.ignoreBefore = at
    this.pausedMs = this.startedPauseMs = this.lastDamagePauseMs = 0
    if (this.pausedAt !== null && at > 0) this.pausedAt = at
    this.rows.clear(); this.receivedRows.clear(); this.receivedSources.clear(); this.receivedSourceSkills.clear()
    this.targets.clear()
    this.healingDoneRows.clear(); this.healingReceivedRows.clear()
  }
  get measurementWindow(): TimedMeasurement | null { return this.timed ? { ...this.timed } : null }
  get combatEnded(): boolean { return this.combatEndedAt !== null }
  schedule(startsAt: number, durationSec: number): void {
    this.reset(startsAt)
    this.pausedAt = null
    this.timed = { startsAt, endsAt: startsAt + durationSec * 1000, durationSec }
    this.startedAt = startsAt
  }
  cancelSchedule(at: number): void {
    if (this.timed && at < this.timed.endsAt) this.timed = { ...this.timed, endsAt: Math.max(this.timed.startsAt, at), cancelled: true }
  }
  acceptsTime(at: number): boolean {
    return !this.paused && this.combatEndedAt === null && Number.isFinite(at) && at >= this.ignoreBefore
      && (this.lastActivityAt === null || at >= this.lastActivityAt)
      && (!this.timed || (at >= this.timed.startsAt && at < this.timed.endsAt))
  }
  private beginActivity(at: number): void {
    if (!this.timed && !this.gameCombatActive && this.lastActivityAt !== null && at - this.lastActivityAt - this.pausedMs + this.lastDamagePauseMs >= METER_IDLE_MS) this.reset()
    if (this.startedAt === null) this.startedPauseMs = this.pausedMs
    this.startedAt ??= at
    this.lastActivityAt = at
    this.lastDamagePauseMs = this.pausedMs
  }
  beginCombat(at: number): void {
    if (this.timed || !Number.isFinite(at)) return
    if (this.combatEndedAt !== null) this.reset(at)
    this.gameCombatActive = true
    if (this.startedAt === null) { this.startedAt = at; this.startedPauseMs = this.pausedMs }
  }
  endCombat(at: number): boolean {
    if (this.timed || !Number.isFinite(at) || this.combatEndedAt !== null || this.startedAt === null || at < this.startedAt
      || (this.lastActivityAt !== null && at < this.lastActivityAt)) return false
    this.combatEndedAt = at
    this.gameCombatActive = false
    return true
  }
  get paused(): boolean { return this.pausedAt !== null }
  setPaused(value: boolean, at = Date.now()): void {
    if (!Number.isFinite(at) || value === this.paused) return
    if (value) this.pausedAt = at
    else {
      this.pausedMs += Math.max(0, Math.min(at, this.combatEndedAt ?? at) - this.pausedAt!)
      this.pausedAt = null
      this.ignoreBefore = Math.max(this.ignoreBefore, at)
    }
  }
  selectSource(id: number | null, at = 0): void { this.sourceId = id; this.reset(at) }
  add(event: MeterEvent): boolean {
    const at = event.time * 1000
    if (!Number.isSafeInteger(event.sourceId) || event.sourceId <= 0 || !Number.isFinite(event.damage)
      || event.damage <= 0 || !this.acceptsTime(at)) return false
    const outgoing = this.sourceId !== null && event.sourceId === this.sourceId
    const incoming = this.sourceId !== null && event.targetId === this.sourceId
    if (!outgoing && !incoming) return false
    this.beginActivity(at)
    if (incoming) {
      this.recordSkill(this.receivedRows, event)
      let skills = this.receivedSourceSkills.get(event.sourceId)
      if (!skills) { skills = new Map(); this.receivedSourceSkills.set(event.sourceId, skills) }
      this.recordSkill(skills, event)
      const source = this.receivedSources.get(event.sourceId) ?? { id: event.sourceId, damage: 0, hits: 0 }
      source.damage += event.damage; source.hits++
      this.receivedSources.set(source.id, source)
    }
    if (!outgoing) return false
    this.lastDamageAt = at
    this.recordSkill(this.rows, event)
    const id = Number.isSafeInteger(event.targetId) && event.targetId! > 0 ? event.targetId! : 0
    let target = this.targets.get(id)
    if (!target) { target = { id, damage: 0, hits: 0, skills: new Map() }; this.targets.set(id, target) }
    target.damage += event.damage; target.hits++
    this.recordSkill(target.skills, event)
    return true
  }
  addHealing(event: MeterHealingEvent): boolean {
    const at = event.time * 1000
    const self = event.sourceId === event.targetId
    if (!(self ? ['self-periodic', 'self-lifesteal', 'self-instant'] : ['external-periodic', 'external-instant']).includes(event.coverage)
      || !Number.isSafeInteger(event.sourceId) || event.sourceId <= 0 || !Number.isSafeInteger(event.targetId) || event.targetId <= 0
      || (event.sourceId !== this.sourceId && event.targetId !== this.sourceId)
      || !Number.isSafeInteger(event.skillId) || !Number.isSafeInteger(event.effectId)
      || !Number.isFinite(event.healing) || event.healing <= 0 || !this.acceptsTime(at)) return false
    this.beginActivity(at)
    const application = { ...event, damage: event.healing, criticalCandidate: false, heavyCandidate: 0 }
    if (event.sourceId === this.sourceId) this.recordSkill(this.healingDoneRows, application)
    if (event.targetId === this.sourceId) this.recordSkill(this.healingReceivedRows, application)
    return true
  }
  private recordSkill(rows: Map<string, MeterSkill>, event: MeterEvent): void {
    const name = this.names[String(event.skillId)] ?? `Habilidade ${event.skillId}`
    const iconFile = this.icons[String(event.skillId)]
    const key = this.names[String(event.skillId)] ? (iconFile ? `${name}::${iconFile}` : name) : String(event.skillId)
    const row = rows.get(key) ?? { key, name, iconFile, skillIds: [], identity: this.names[String(event.skillId)] ? 'catalog' : 'unresolved', damage: 0, hits: 0, critical: 0, heavy: 0, damageByKind: emptyDamageBreakdown() }
    row.skillIds ??= []
    if (!row.skillIds.includes(event.skillId)) row.skillIds.push(event.skillId)
    row.damage += event.damage; row.hits++
    row.critical += Number(event.criticalCandidate)
    row.heavy += Number(Boolean(event.heavyCandidate))
    const kind: DamageKind = event.criticalCandidate
      ? (event.heavyCandidate ? 'criticalHeavy' : 'critical')
      : (event.heavyCandidate ? 'heavy' : 'normal')
    row.damageByKind[kind] += event.damage
    rows.set(key, row)
  }
  snapshot(now = Date.now()): MeterSession {
    const skills = snapshotSkills(this.rows.values())
    const receivedSkills = snapshotSkills(this.receivedRows.values())
    const receivedSources = [...this.receivedSources.values()].map(row => ({ ...row,
      skills: snapshotSkills(this.receivedSourceSkills.get(row.id)?.values() ?? []) })).sort((a, b) => b.damage - a.damage)
    const healingSnapshot = (rows: Map<string, MeterSkill>): MeterHealing => {
      const skills = snapshotSkills(rows.values())
      return { total: skills.reduce((sum, row) => sum + row.damage, 0), hits: skills.reduce((sum, row) => sum + row.hits, 0), skills }
    }
    const damageByKind = emptyDamageBreakdown()
    for (const row of skills) for (const kind of Object.keys(damageByKind) as DamageKind[]) damageByKind[kind] += row.damageByKind[kind]
    const total = skills.reduce((sum, row) => sum + row.damage, 0)
    const clock = this.timed ? Math.max(this.timed.startsAt, Math.min(now, this.timed.endsAt)) : Math.min(this.pausedAt ?? now, this.combatEndedAt ?? now)
    const elapsedSec = this.startedAt === null ? 0 : Math.max(0, (clock - this.startedAt - this.pausedMs + this.startedPauseMs) / 1000)
    const idleSec = this.lastActivityAt === null ? 0 : Math.max(0, (clock - this.lastActivityAt - this.pausedMs + this.lastDamagePauseMs) / 1000)
    return {
      total, elapsedSec, idleSec, skills, damageByKind, gameCombatEnded: this.combatEndedAt !== null, paused: this.paused || Boolean(this.timed && (now < this.timed.startsAt || now >= this.timed.endsAt)), dps: elapsedSec >= 1 ? total / elapsedSec : 0,
      startedAt: this.startedAt, lastDamageAt: this.lastDamageAt,
      lastActivityAt: this.lastActivityAt,
      healing: { done: healingSnapshot(this.healingDoneRows), received: healingSnapshot(this.healingReceivedRows), coverage: 'observed' },
      ...(this.timed ? { timed: { ...this.timed } } : {}),
      received: { total: receivedSources.reduce((sum, row) => sum + row.damage, 0),
        hits: receivedSources.reduce((sum, row) => sum + row.hits, 0), skills: receivedSkills, sources: receivedSources },
      targets: [...this.targets.values()].map(row => ({ id: row.id, damage: row.damage, hits: row.hits,
        skills: snapshotSkills(row.skills.values()) })).sort((a,b) => b.damage-a.damage),
      hits: skills.reduce((sum, row) => sum + row.hits, 0),
      critical: skills.reduce((sum, row) => sum + row.critical, 0),
      heavy: skills.reduce((sum, row) => sum + row.heavy, 0),
      waitingReset: !this.timed && !this.gameCombatActive && this.combatEndedAt === null && this.lastActivityAt !== null && idleSec >= METER_IDLE_MS / 1000,
    }
  }
}
/** Fontes observadas são isoladas por conexão; perfil nominal não comprova participação no grupo. */
export class ObservedGroupDamage {
  private connections = new Map<string, { closed: boolean; lastAt: number; names: Map<number, Set<string>>;
    labels: Map<number, Set<string>>; npcs: Map<number, Set<number>>; actors: Map<number, OverlayMeter> }>()
  constructor(private names: Record<string, string> = {}, private icons: Record<string, string> = {}, private npcNames: Record<string, string> = {},
    private npcRanks: Record<string, NpcRankHint> = {}, private npcRankSources: Record<string, NpcRankSource> = {}) {}
  private connection(id: string) {
    if (!id || id.length > 128) return undefined
    let value = this.connections.get(id)
    if (!value && this.connections.size < 128) {
      value = { closed: false, lastAt: 0, names: new Map(), labels: new Map(), npcs: new Map(), actors: new Map() }
      this.connections.set(id, value)
    }
    return value
  }
  clear(): void { this.connections.clear() }
  /** Replica somente evidências observadas da mesma conexão para um acumulado segmentado novo. */
  copyConnectionIdentityTo(connectionId: string, target: ObservedGroupDamage): void {
    const conn = this.connections.get(connectionId)
    if (!conn) return
    for (const [actor, names] of conn.names) for (const name of names) target.profile(connectionId, actor, name)
    for (const [actor, labels] of conn.labels) for (const label of labels) target.label(connectionId, actor, label)
    for (const [actor, templates] of conn.npcs) for (const template of templates) target.npc(connectionId, actor, template)
  }
  clearDamage(): void { for (const connection of this.connections.values()) connection.actors.clear() }
  close(id: string): void { const row = this.connections.get(id); if (row) row.closed = true }
  profile(id: string, actor: number, name: string): void {
    if (!Number.isSafeInteger(actor) || actor <= 0 || typeof name !== 'string' || !name.trim() || name.length > 64
      || name.trim() !== name || /[\p{C}]/u.test(name)) return
    const conn = this.connection(id); if (!conn || conn.closed) return
    const values = conn.names.get(actor) ?? new Set<string>(); values.add(name.trim()); conn.names.set(actor, values)
  }
  /** Nome visto em evento do servidor, sem elevá-lo a perfil de jogador ou template de NPC. */
  label(id: string, actor: number, name: string): void {
    if (!Number.isSafeInteger(actor) || actor <= 0 || typeof name !== 'string' || !name.trim() || name.length > 96 || name.trim() !== name || /[\p{C}]/u.test(name)) return
    const conn = this.connection(id); if (!conn || conn.closed) return
    const values = conn.labels.get(actor) ?? new Set<string>(); values.add(name); conn.labels.set(actor, values)
  }
  npc(id: string, actor: number, template: number): void {
    if (!Number.isSafeInteger(actor) || actor <= 0 || !Number.isSafeInteger(template) || template <= 0) return
    const conn = this.connection(id); if (!conn || conn.closed) return
    const values = conn.npcs.get(actor) ?? new Set<number>(); values.add(template); conn.npcs.set(actor, values)
  }
  add(id: string, event: MeterEvent): void {
    const conn = this.connection(id)
    if (!conn || conn.closed || !Number.isSafeInteger(event.sourceId) || event.sourceId <= 0 || !Number.isFinite(event.time)) return
    let meter = conn.actors.get(event.sourceId)
    if (!meter) {
      if (conn.actors.size >= 512) return
      meter = new OverlayMeter(event.sourceId, this.names, this.icons)
      meter.beginCombat(event.time * 1000); conn.actors.set(event.sourceId, meter)
    }
    if (meter.add(event)) conn.lastAt = Math.max(conn.lastAt, event.time)
  }
  snapshot(at: number): GroupConnection[] {
    const result: GroupConnection[] = []
    for (const [id, conn] of this.connections) {
      const identify = (actor: number): {name?: string; npcId?: number; rank?: NpcRankHint; rankSource?: NpcRankSource; kind: GroupSource['kind']; evidence: EntityIdentityEvidence} => {
        const profiles = conn.names.get(actor), labels = conn.labels.get(actor), npcs = conn.npcs.get(actor)
        if (profiles?.size === 1 && !npcs?.size) return { name: [...profiles][0], kind: 'player', evidence: 'profile' }
        if (npcs?.size === 1 && !profiles?.size) {
          const npcId = [...npcs][0]
          return { name: this.npcNames[String(npcId)], npcId, rank: this.npcRanks[String(npcId)], rankSource: this.npcRankSources[String(npcId)], kind: 'npc', evidence: 'npc-template' }
        }
        const label = labels?.size === 1 ? [...labels][0] : undefined
        return { name: label, kind: (profiles?.size || npcs?.size) ? 'conflict' : 'unknown', evidence: (profiles?.size || npcs?.size) ? 'conflict' : 'unresolved' }
      }
      const sources = [...conn.actors].map(([actor, meter]) => {
        const session = meter.snapshot(at)
        if (session.targets) session.targets = session.targets.map(target => {
          const identified = identify(target.id)
          return { ...target, name: identified.name, npcId: identified.npcId, identity: identified.evidence, rank: identified.rank, rankSource: identified.rankSource }
        })
        return { id: actor, ...identify(actor), session }
      }).filter(row => row.session.hits > 0).sort((a,b) => b.session.total-a.session.total)
      if (sources.length) result.push({ id, closed: conn.closed, lastAt: conn.lastAt, sources })
    }
    return result.sort((a,b) => Number(a.closed)-Number(b.closed) || b.lastAt-a.lastAt)
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
  /** `null` mantém toda a leitura; um ID mostra apenas o acumulado daquele segmento. */
  groupSegmentId?: number | null
  metricPage?: 'damage' | 'damageTargets' | 'receivedSources' | 'receivedSkills' | 'healingDone' | 'healingReceived'
  countdownSec?: number; durationSec?: number
  hideOutOfCombat?: boolean; combatHideDelaySec?: number
  autoSource?: boolean
  playerName?: string
  /** Layout atual: uma única janela de combate; legado mantém painéis separados. */
  singleWindow?: boolean
  locked: boolean; totalVisible: boolean; skillsVisible: boolean; opacity: number; scale: number
  sourceId: number | null; totalBounds?: PanelBounds; skillsBounds?: PanelBounds
  controlsVisible?: boolean; controlsExpanded?: boolean; controlsBounds?: PanelBounds
  anchors?: Partial<Record<OverlayPanel, PanelAnchor>>
  fontFamily?: 'Inter' | 'Arial' | 'Consolas'; fontSize?: number; chartPadding?: number; chartPaddingVertical?: number; theme?: OverlayTheme
}
export interface OverlayState {
  groupConnections?: GroupConnection[]
  combatSegments?: OverlayCombatSegment[]
  /** Dados de grupo observados por segmento; a UI ainda decide como exibi-los. */
  groupHealing?: Array<{ connectionId: string; segmentId: number; snapshot: GroupHealingSnapshot }>
  groupReceived?: GroupReceivedSegment[]
  deathLog?: import('./overlayDeathLog').DeathLogStatus
  combat?: { lastDamageAt: number | null; hidden: boolean }
  timer?: TimedMeasurement & { phase: 'countdown' | 'running' | 'finished' | 'cancelled'; remainingSec: number; elapsedSec: number }
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
  /** Snapshot observado do grupo no mesmo encontro, preservado para consulta após reiniciar. */
  groupConnections?: GroupConnection[]
  id: string; sourceId: number | null; mode: 'live' | 'replay'; reason: string
  savedAt: number; session: MeterSession
}
export interface OverlayHistoryResult { encounters: OverlayEncounter[]; error: string | null }
/** Aplica nomes novos também ao acumulado já aberto, sem reiniciar a captura. */
function resolveSkillRows(skills: MeterSkill[], names: Record<string, string>, icons: Record<string, string>): MeterSkill[] {
  const rows = new Map<string, MeterSkill>()
  for (const original of skills) {
    const skillIds = original.skillIds?.slice() ?? (/^\d+$/.test(original.key) ? [Number(original.key)] : [])
    const mapped = [...new Set(skillIds.map(id => names[String(id)]).filter(Boolean))]
    const files = [...new Set(skillIds.map(id => icons[String(id)]).filter(Boolean))]
    const name = names[original.key] ?? (mapped.length === 1 ? mapped[0] : original.name)
    const iconFile = files.length === 1 ? files[0] : files.length > 1 ? undefined : original.iconFile
    const key = iconFile ? `${name}::${iconFile}` : names[original.key] || mapped.length === 1 ? name : original.key
    const row = rows.get(key)
    if (!row) { rows.set(key, { ...original, key, name, iconFile,
      identity: names[original.key] || mapped.length === 1 ? 'catalog' : original.identity ?? 'unresolved', skillIds,
      damageByKind: { ...original.damageByKind } }); continue }
    row.skillIds = [...new Set([...(row.skillIds ?? []), ...skillIds])]
    row.damage += original.damage; row.hits += original.hits
    row.critical += original.critical; row.heavy += original.heavy
    for (const kind of Object.keys(row.damageByKind) as DamageKind[]) row.damageByKind[kind] += original.damageByKind[kind]
  }
  return [...rows.values()].sort((a, b) => b.damage - a.damage)
}
export function resolveOverlayNames(state: OverlayState, names: Record<string, string>, icons: Record<string, string> = {},
  npcNames: Record<string, string> = {}): OverlayState {
  const { received, healing } = state.session
  return { ...state, session: { ...state.session, skills: resolveSkillRows(state.session.skills, names, icons),
    ...(state.session.targets ? { targets: state.session.targets.map(row => ({ ...row,
      name: row.npcId && npcNames[String(row.npcId)] ? npcNames[String(row.npcId)] : row.name,
      skills: resolveSkillRows(row.skills, names, icons) })) } : {}),
    ...(received ? { received: { ...received, skills: resolveSkillRows(received.skills, names, icons),
      sources: received.sources.map(row => ({ ...row, name: row.npcId && npcNames[String(row.npcId)] ? npcNames[String(row.npcId)] : row.name,
        ...(Array.isArray(row.skills) ? { skills: resolveSkillRows(row.skills, names, icons) } : {}) })) } } : {}),
    ...(healing ? { healing: { ...healing,
      done: { ...healing.done, skills: resolveSkillRows(healing.done.skills, names, icons) },
      received: { ...healing.received, skills: resolveSkillRows(healing.received.skills, names, icons) } } } : {}) } }
}
export interface OverlayAPI {
  characterStats: () => Promise<import('./characterStats').CharacterStatsResult>
  openBuildImport: () => Promise<void>
  onBuildImport: (callback: () => void) => () => void
  buffs: () => Promise<import('./overlayBuffs').BuffResult>
  buffContributions: () => Promise<import('./overlayBuffContribution').BuffContributionRow[]>
  deaths: () => Promise<import('./overlayDeathLog').DeathLogResult>
  recordDeath: () => Promise<import('./overlayDeathLog').DeathLogResult>
  clearRecords: () => Promise<OverlayHistoryResult>
  history: () => Promise<OverlayHistoryResult>
  get: () => Promise<OverlayState>
  configure: (patch: Partial<OverlayConfig>) => Promise<OverlayState>
  start: () => Promise<OverlayState>
  stop: () => Promise<OverlayState>
  pause: (paused: boolean) => Promise<OverlayState>
  timer: (action: 'start' | 'cancel' | 'clear') => Promise<OverlayState>
  interactive: (enabled: boolean) => Promise<void>
  reset: () => Promise<OverlayState>
  replay: (speed?: number) => Promise<OverlayState>
  bounds: (panel: OverlayPanel, value: PanelBounds) => Promise<void>
  subscribe: (callback: (state: OverlayState) => void) => () => void
}

export function overlaySourceWarning(state: OverlayState): string | null {
  if (state.status !== 'live' && state.status !== 'replay') return null
  if (state.config.sourceId === null && state.config.autoSource !== false) return state.mode === 'live'
    ? state.config.playerName ? `Aguardando o perfil de ${state.config.playerName}. Abra a ficha no jogo ou selecione a origem confirmada em Ajustes.`
      : 'Aguardando identificar seu personagem. Preencha o nome em Ajustes e abra a ficha no jogo, ou selecione uma origem confirmada.'
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
