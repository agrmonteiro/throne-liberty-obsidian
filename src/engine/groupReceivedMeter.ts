/** Medidor de dano recebido isolado por conexão e segmento de combate. */
export type GroupEntityEvidence = 'profile' | 'npc-template' | 'unresolved' | 'conflict'
export type GroupEntityKind = 'player' | 'npc' | 'unknown' | 'conflict'

export interface GroupDamageEvent {
  connectionId: string
  segmentId: string | number
  time: number
  sourceId: number
  targetId: number
  skillId: number
  damage: number
  critical?: boolean
  heavy?: boolean
}

export interface GroupEntitySnapshot {
  id: number
  kind: GroupEntityKind
  evidence: GroupEntityEvidence
  /** Nome observado em perfil; não é sintetizado a partir do ID. */
  profileName?: string
  /** Templates NPC observados no protocolo, mantidos como evidência. */
  npcTemplateIds: readonly number[]
  profileNames: readonly string[]
}

export interface GroupReceivedSkill {
  skillId: number
  damage: number
  hits: number
  critical: number
  heavy: number
}

export interface GroupReceivedSource {
  entity: GroupEntitySnapshot
  damage: number
  hits: number
  skills: readonly GroupReceivedSkill[]
}

export interface GroupReceivedTarget {
  entity: GroupEntitySnapshot
  damage: number
  hits: number
  sources: readonly GroupReceivedSource[]
  skills: readonly GroupReceivedSkill[]
}

export interface GroupReceivedSegment {
  connectionId: string
  segmentId: string | number
  total: number
  hits: number
  targets: readonly GroupReceivedTarget[]
  /** Atores que apareceram em eventos, inclusive NPCs e identidades ambíguas. */
  entities: readonly GroupEntitySnapshot[]
}

type IdentitySets = { profiles: Set<string>; npcs: Set<number> }
type SkillTotal = { skillId: number; damage: number; hits: number; critical: number; heavy: number }
type SourceTotal = { damage: number; hits: number; skills: Map<number, SkillTotal> }
type TargetTotal = { damage: number; hits: number; sources: Map<number, SourceTotal>; skills: Map<number, SkillTotal> }
type SegmentState = { lastAt: number; actors: Set<number>; targets: Map<number, TargetTotal> }

const emptyIdentity = (): IdentitySets => ({ profiles: new Set(), npcs: new Set() })
function validConnection(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
}
function validSegment(value: unknown): value is string | number {
  return (typeof value === 'string' && value.length > 0 && value.length <= 128)
    || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
}
function freezeDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) return Object.freeze(value.map(freezeDeep)) as T
  const copy: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) copy[key] = freezeDeep(item)
  return Object.freeze(copy) as T
}

/**
 * Acumula eventos observados por (conexão, segmento). Perfil confirma jogador;
 * template confirma NPC. IDs, nomes e relação de grupo nunca são adivinhados.
 */
export class GroupReceivedMeter {
  private readonly identities = new Map<string, Map<number, IdentitySets>>()
  private readonly segments = new Map<string, Map<string | number, SegmentState>>()

  clear(): void { this.identities.clear(); this.segments.clear() }

  private identity(connectionId: string, actorId: number, create = false): IdentitySets | undefined {
    let rows = this.identities.get(connectionId)
    if (!rows && create) { rows = new Map(); this.identities.set(connectionId, rows) }
    let row = rows?.get(actorId)
    if (!row && create) { row = emptyIdentity(); rows!.set(actorId, row) }
    return row
  }

  /** Registra somente um nome fornecido explicitamente por perfil observado. */
  profile(connectionId: string, actorId: number, name: string): boolean {
    if (!validConnection(connectionId) || !Number.isSafeInteger(actorId) || actorId <= 0
      || typeof name !== 'string' || !name.trim() || name.length > 64 || name.trim() !== name || /[\p{C}]/u.test(name)) return false
    this.identity(connectionId, actorId, true)!.profiles.add(name)
    return true
  }

  /** Registra o template NPC informado pelo protocolo, sem convertê-lo em nome. */
  npcTemplate(connectionId: string, actorId: number, templateId: number): boolean {
    if (!validConnection(connectionId) || !Number.isSafeInteger(actorId) || actorId <= 0
      || !Number.isSafeInteger(templateId) || templateId <= 0) return false
    this.identity(connectionId, actorId, true)!.npcs.add(templateId)
    return true
  }

  private entity(connectionId: string, id: number): GroupEntitySnapshot {
    const identity = this.identity(connectionId, id)
    const profileNames = [...(identity?.profiles ?? [])].sort()
    const npcTemplateIds = [...(identity?.npcs ?? [])].sort((a, b) => a - b)
    const conflict = (profileNames.length > 0 && npcTemplateIds.length > 0)
      || profileNames.length > 1 || npcTemplateIds.length > 1
    const kind: GroupEntityKind = conflict ? 'conflict' : profileNames.length ? 'player' : npcTemplateIds.length ? 'npc' : 'unknown'
    const evidence: GroupEntityEvidence = conflict ? 'conflict' : profileNames.length ? 'profile' : npcTemplateIds.length ? 'npc-template' : 'unresolved'
    return freezeDeep({ id, kind, evidence,
      ...(profileNames.length === 1 ? { profileName: profileNames[0] } : {}),
      npcTemplateIds, profileNames })
  }

  add(event: GroupDamageEvent): boolean {
    if (!event || !validConnection(event.connectionId) || !validSegment(event.segmentId)
      || !Number.isFinite(event.time) || !Number.isSafeInteger(event.sourceId) || event.sourceId <= 0
      || !Number.isSafeInteger(event.targetId) || event.targetId <= 0
      || !Number.isSafeInteger(event.skillId) || event.skillId <= 0
      || !Number.isFinite(event.damage) || event.damage <= 0) return false
    const connection = event.connectionId
    let scopes = this.segments.get(connection)
    if (!scopes) { scopes = new Map(); this.segments.set(connection, scopes) }
    let segment = scopes.get(event.segmentId)
    if (!segment) {
      segment = { lastAt: event.time, actors: new Set(), targets: new Map() }
      scopes.set(event.segmentId, segment)
    } else if (event.time < segment.lastAt) return false
    segment.lastAt = event.time
    segment.actors.add(event.sourceId); segment.actors.add(event.targetId)

    // Mantém o evento bruto também quando a identidade ainda não chegou. A
    // projeção do snapshot só o agrega se houver perfil confirmado sem conflito.
    let target = segment.targets.get(event.targetId)
    if (!target) { target = { damage: 0, hits: 0, sources: new Map(), skills: new Map() }; segment.targets.set(event.targetId, target) }
    let source = target.sources.get(event.sourceId)
    if (!source) { source = { damage: 0, hits: 0, skills: new Map() }; target.sources.set(event.sourceId, source) }
    const update = (rows: Map<number, SkillTotal>): void => {
      let skill = rows.get(event.skillId)
      if (!skill) { skill = { skillId: event.skillId, damage: 0, hits: 0, critical: 0, heavy: 0 }; rows.set(event.skillId, skill) }
      skill.damage += event.damage; skill.hits++
      skill.critical += Number(event.critical === true); skill.heavy += Number(event.heavy === true)
    }
    target.damage += event.damage; target.hits++
    source.damage += event.damage; source.hits++
    update(target.skills); update(source.skills)
    return true
  }

  snapshot(connectionId?: string, segmentId?: string | number): readonly GroupReceivedSegment[] {
    const result: GroupReceivedSegment[] = []
    const connections = connectionId === undefined ? [...this.segments.keys()] : [connectionId]
    for (const connection of connections) {
      const scopes = this.segments.get(connection)
      if (!scopes) continue
      const ids = segmentId === undefined ? [...scopes.keys()] : [segmentId]
      for (const id of ids) {
        const segment = scopes.get(id)
        if (!segment) continue
        const skills = (rows: Map<number, SkillTotal>): readonly GroupReceivedSkill[] => [...rows.values()]
          .map(row => ({ ...row })).sort((a, b) => b.damage - a.damage || a.skillId - b.skillId)
        const confirmedRows = [...segment.targets].filter(([targetId]) => this.entity(connection, targetId).kind === 'player')
        const targets = confirmedRows.map(([targetId, row]) => ({
          entity: this.entity(connection, targetId), damage: row.damage, hits: row.hits,
          skills: skills(row.skills),
          sources: [...row.sources].map(([sourceId, source]) => ({ entity: this.entity(connection, sourceId),
            damage: source.damage, hits: source.hits, skills: skills(source.skills) }))
            .sort((a, b) => b.damage - a.damage || a.entity.id - b.entity.id),
        })).sort((a, b) => b.damage - a.damage || a.entity.id - b.entity.id)
        result.push(freezeDeep({ connectionId: connection, segmentId: id,
          total: targets.reduce((sum, target) => sum + target.damage, 0),
          hits: targets.reduce((sum, target) => sum + target.hits, 0),
          targets, entities: [...segment.actors].map(actor => this.entity(connection, actor)).sort((a, b) => a.id - b.id) }))
      }
    }
    return Object.freeze(result.sort((a, b) => a.connectionId.localeCompare(b.connectionId)
      || String(a.segmentId).localeCompare(String(b.segmentId))))
  }
}
