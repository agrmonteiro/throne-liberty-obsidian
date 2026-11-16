/**
 * Consolidação local de uma sala cooperativa. Não abre rede e não interpreta
 * pacotes: recebe snapshots já normalizados por cada instalação.
 */
export type CollaborationEvidence = 'profile' | 'unresolved'

export interface CollaborationSkill { skillId: number; damage: number; hits: number }
export interface CollaborationTarget {
  /** Somente template confirmado pode ser unido entre instalações. */
  npcTemplateId?: number
  damage: number; hits: number
}
export interface CollaborationContribution {
  roomId: string; encounterId: string; participantId: string; revision: number
  observedAt: number
  character: { name: string; evidence: CollaborationEvidence }
  total: number; hits: number
  skills: CollaborationSkill[]; targets: CollaborationTarget[]
}
/** Contexto sem IDs locais: usado pelo relay para decidir se duas leituras podem se encontrar. */
export interface EncounterFingerprint {
  gameBuild: string
  /** Hash efêmero de zona/instância, quando o protocolo vier a expor esse sinal. */
  instanceHash?: string
  /** Template de NPC confirmado; entidade local nunca entra nesta chave. */
  targetTemplateId?: number
  /** Relógio corrigido pelo relay, e não o relógio bruto de cada computador. */
  startedAtRelayMs: number
}
export type EncounterMatch = 'same' | 'ambiguous' | 'different'

/**
 * Conservador por desenho: sem instância + alvo confirmado não há união automática.
 * É preferível mostrar duas lutas a atribuir dano de uma luta a outra.
 */
export function matchEncounter(left: EncounterFingerprint, right: EncounterFingerprint): EncounterMatch {
  if (!validId(left.gameBuild, 64) || !validId(right.gameBuild, 64) || !Number.isFinite(left.startedAtRelayMs) || !Number.isFinite(right.startedAtRelayMs)) return 'ambiguous'
  if (left.gameBuild !== right.gameBuild) return 'different'
  if (left.instanceHash && right.instanceHash && left.instanceHash !== right.instanceHash) return 'different'
  if (left.targetTemplateId && right.targetTemplateId && left.targetTemplateId !== right.targetTemplateId) return 'different'
  if (Math.abs(left.startedAtRelayMs - right.startedAtRelayMs) > 30_000) return 'different'
  if (left.instanceHash && right.instanceHash && left.targetTemplateId && right.targetTemplateId) return 'same'
  return 'ambiguous'
}
export interface CollaborationSource {
  participantId: string; name: string; evidence: CollaborationEvidence
  total: number; hits: number; conflict: boolean; accepted: boolean
}
export interface CollaborationSnapshot {
  total: number; hits: number; sources: CollaborationSource[]
  skills: CollaborationSkill[]; targets: CollaborationTarget[]
}

const MAX_ROWS = 128
const validId = (value: unknown, max = 128): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !/[\p{C}]/u.test(value)
const validNumber = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const canonicalName = (name: string): string => name.normalize('NFKC').trim().toLocaleLowerCase('pt-BR')

/** Recusa snapshots incompletos antes que eles saiam da instalação do jogador. */
export function validCollaborationContribution(value: CollaborationContribution): boolean {
  if (!value || !validId(value.roomId) || !validId(value.encounterId) || !validId(value.participantId)
    || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Number.isFinite(value.observedAt)
    || !value.character || !validId(value.character.name, 64) || !['profile', 'unresolved'].includes(value.character.evidence)
    || !validNumber(value.total) || !validNumber(value.hits) || !Array.isArray(value.skills) || !Array.isArray(value.targets)
    || value.skills.length > MAX_ROWS || value.targets.length > MAX_ROWS) return false
  const skillsValid = value.skills.every(row => validNumber(row.damage) && validNumber(row.hits)
    && Number.isSafeInteger(row.skillId) && row.skillId > 0 && row.skillId < 2 ** 53)
  const targetsValid = value.targets.every(row => validNumber(row.damage) && validNumber(row.hits)
    && (row.npcTemplateId === undefined || (Number.isSafeInteger(row.npcTemplateId) && row.npcTemplateId > 0 && row.npcTemplateId < 2 ** 53)))
  return skillsValid && targetsValid
}

function aggregate(rows: readonly CollaborationSkill[]): CollaborationSkill[] {
  const totals = new Map<number, CollaborationSkill>()
  for (const row of rows) {
    const current = totals.get(row.skillId) ?? { skillId: row.skillId, damage: 0, hits: 0 }
    current.damage += row.damage; current.hits += row.hits; totals.set(row.skillId, current)
  }
  return [...totals.values()].sort((a, b) => b.damage - a.damage || a.skillId - b.skillId)
}
function aggregateTargets(rows: readonly CollaborationTarget[]): CollaborationTarget[] {
  const totals = new Map<number, CollaborationTarget>()
  for (const row of rows) {
    // Entidades locais sem template não são iguais entre clientes e não entram no consolidado.
    if (!row.npcTemplateId) continue
    const current = totals.get(row.npcTemplateId) ?? { npcTemplateId: row.npcTemplateId, damage: 0, hits: 0 }
    current.damage += row.damage; current.hits += row.hits; totals.set(row.npcTemplateId, current)
  }
  return [...totals.values()].sort((a, b) => b.damage - a.damage || a.npcTemplateId! - b.npcTemplateId!)
}

export class CollaborationRoom {
  private contributions = new Map<string, CollaborationContribution>()
  constructor(readonly roomId: string, readonly encounterId: string) {}

  /** Substitui somente por revisão mais nova do mesmo participante. */
  upsert(value: CollaborationContribution): boolean {
    if (!validCollaborationContribution(value) || value.roomId !== this.roomId || value.encounterId !== this.encounterId) return false
    const previous = this.contributions.get(value.participantId)
    if (previous && (value.revision < previous.revision || value.observedAt < previous.observedAt)) return false
    this.contributions.set(value.participantId, structuredClone(value))
    return true
  }
  remove(participantId: string): boolean { return this.contributions.delete(participantId) }
  snapshot(): CollaborationSnapshot {
    const claimed = new Map<string, string[]>()
    for (const row of this.contributions.values()) {
      if (row.character.evidence !== 'profile') continue
      const key = canonicalName(row.character.name)
      claimed.set(key, [...(claimed.get(key) ?? []), row.participantId])
    }
    const conflicts = new Set([...claimed.values()].filter(ids => ids.length > 1).flat())
    const sources = [...this.contributions.values()].map(row => {
      const conflict = conflicts.has(row.participantId)
      // Perfil confirmado é o requisito para uma contribuição autoritativa.
      const accepted = row.character.evidence === 'profile' && !conflict
      return { participantId: row.participantId, name: row.character.name, evidence: row.character.evidence,
        total: row.total, hits: row.hits, conflict, accepted }
    }).sort((a, b) => b.total - a.total || a.participantId.localeCompare(b.participantId))
    const accepted = sources.filter(row => row.accepted)
    const sourceRows = accepted.map(row => this.contributions.get(row.participantId)!)
    return { total: accepted.reduce((sum, row) => sum + row.total, 0), hits: accepted.reduce((sum, row) => sum + row.hits, 0), sources,
      skills: aggregate(sourceRows.flatMap(row => row.skills)), targets: aggregateTargets(sourceRows.flatMap(row => row.targets)) }
  }
}
