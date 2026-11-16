import type { GroupHealingSnapshot } from './groupHealingMeter'
import type { GroupReceivedSegment } from './groupReceivedMeter'
import type { OverlayPlayerIdentity } from './overlayIdentity'
import type { OverlayCombatEncounter } from './overlayCombatEncounters'

export { OverlayIdentity, StatusProfileRecognition } from './overlayIdentity'
export type { OverlayPlayerIdentity } from './overlayIdentity'

/**
 * Limite de segurança quando o pacote de saída de combate não é observado.
 * O jogo normalmente encerra a sessão antes disso; sem esse sinal, congelamos
 * o relógio para que o DPS não continue caindo fora de combate.
 */
export const METER_IDLE_MS = 15 * 1000
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
/** Eventos consolidados por segundo para inspeção temporal, com memória limitada. */
export interface MeterTimelineEvent {
  time: number; kind: 'damage' | 'received' | 'healingDone' | 'healingReceived'
  skillId: number; sourceId: number; targetId?: number; amount: number; hits: number
}
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
  /** Alvos mantidos para filtros e análise posterior; `lastAt` permite priorizar o alvo mais recente. */
  targets?: Array<{ id: number; damage: number; hits: number; lastAt?: number; name?: string; npcId?: number; identity?: EntityIdentityEvidence; rank?: NpcRankHint; rankSource?: NpcRankSource; skills: MeterSkill[] }>
  healing?: { done: MeterHealing; received: MeterHealing; coverage: 'self-observed' | 'observed' }
  timed?: TimedMeasurement
  /** Granularidade de um segundo; não representa cada pacote individual. */
  timeline?: MeterTimelineEvent[]
}
export type EntityIdentityEvidence = 'profile' | 'npc-template' | 'unresolved' | 'conflict'
/** Qualidade do NPC normalizada a partir do template local do cliente. */
export type NpcRankHint = 'boss' | 'champion' | 'elite' | 'normal' | 'unique'
/** `creature-rank` é o campo explícito do cliente; fallback só existe para builds incompletos. */
export type NpcRankSource = 'creature-rank' | 'row-fallback'
/** Família de arma extraída da linha do catálogo local da habilidade. */
export interface SkillWeaponHint { code: string; label: string }
export interface GroupSourceWeapon extends SkillWeaponHint {
  damage: number; hits: number; skillIds: number[]
}
export type SourceInferenceKind = 'confirmed-player' | 'confirmed-npc' | 'likely-player' | 'likely-npc' | 'unresolved' | 'conflict'
export interface SourceInference {
  kind: SourceInferenceKind; confidence: number
  votes: { player: number; npc: number; unresolved: number }
  reasons: string[]
}
export interface SourceInferenceInput {
  profileConfirmed: boolean; npcTemplateConfirmed: boolean; conflict: boolean
  totalHits: number; weaponHits: number; weaponDamage: number; npcSkillHits: number
  /** Modelo local treinado só com fontes que o próprio protocolo já confirmou. */
  model?: SourceEvidenceModel
}
export interface SourceEvidenceSample {
  kind: 'player' | 'npc'; totalHits: number; weaponHits: number; npcSkillHits: number
}
export interface SourceEvidenceClassModel {
  samples: number; totalHits: number; weaponHits: number; npcSkillHits: number
}
export interface SourceEvidenceModel {
  player: SourceEvidenceClassModel; npc: SourceEvidenceClassModel
}

const emptySourceEvidenceClass = (): SourceEvidenceClassModel => ({ samples: 0, totalHits: 0, weaponHits: 0, npcSkillHits: 0 })

/**
 * Aprende somente com rótulos fortes recebidos no protocolo nesta conexão.
 * Nenhum nome, ID ou decisão manual entra no modelo: guardamos apenas contagens
 * agregadas usadas pelo classificador bayesiano.
 */
export function buildSourceEvidenceModel(samples: Iterable<SourceEvidenceSample>): SourceEvidenceModel | undefined {
  const model: SourceEvidenceModel = { player: emptySourceEvidenceClass(), npc: emptySourceEvidenceClass() }
  for (const sample of samples) {
    const row = model[sample.kind]
    const totalHits = Math.max(0, Math.floor(sample.totalHits))
    row.samples++
    row.totalHits += totalHits
    row.weaponHits += Math.min(totalHits, Math.max(0, Math.floor(sample.weaponHits)))
    row.npcSkillHits += Math.min(totalHits, Math.max(0, Math.floor(sample.npcSkillHits)))
  }
  // Menos de duas observações de cada classe é pouco para alterar o fallback conservador.
  return model.player.samples >= 2 && model.npc.samples >= 2 ? model : undefined
}

const clampProbability = (value: number): number => Math.min(1 - 1e-6, Math.max(1e-6, value))
const logBernoulliEvidence = (hits: number, total: number, probability: number): number => {
  const safeHits = Math.min(total, Math.max(0, hits))
  const p = clampProbability(probability)
  return safeHits * Math.log(p) + (total - safeHits) * Math.log(1 - p)
}

/** Naive Bayes com suavização de Laplace, treinado de forma automática. */
function bayesianSourceInference(input: SourceInferenceInput, model: SourceEvidenceModel): SourceInference | undefined {
  const total = Math.max(1, input.totalHits)
  const likelihood = (row: SourceEvidenceClassModel): number => {
    const weaponRate = (row.weaponHits + 1) / (row.totalHits + 2)
    const npcRate = (row.npcSkillHits + 1) / (row.totalHits + 2)
    const prior = Math.log((row.samples + 1) / (model.player.samples + model.npc.samples + 2))
    return prior
      + logBernoulliEvidence(input.weaponHits, total, weaponRate)
      + logBernoulliEvidence(input.npcSkillHits, total, npcRate)
  }
  const playerScore = likelihood(model.player), npcScore = likelihood(model.npc)
  const playerProbability = 1 / (1 + Math.exp(npcScore - playerScore))
  const bestPlayer = playerProbability >= 0.5
  const confidence = bestPlayer ? playerProbability : 1 - playerProbability
  // Uma previsão de baixa confiança não é exibida como identidade: continua pendente.
  if (confidence < 0.78) return undefined
  const playerVotes = Math.round(playerProbability * 5)
  const npcVotes = Math.round((1 - playerProbability) * 5)
  return {
    kind: bestPlayer ? 'likely-player' : 'likely-npc', confidence,
    votes: { player: playerVotes, npc: npcVotes, unresolved: 0 },
    reasons: [`Classificador bayesiano local com ${model.player.samples} jogadores e ${model.npc.samples} NPCs confirmados`],
  }
}
/**
 * Floresta de decisão explícita: cinco árvores independentes votam usando
 * perfil/template (rótulo forte) e distribuição de skills (rótulo inferido).
 * Não substitui uma confirmação do protocolo.
 */
export function classifySourceEvidence(input: SourceInferenceInput): SourceInference {
  if (input.conflict) return { kind: 'conflict', confidence: 1, votes: { player: 0, npc: 0, unresolved: 0 }, reasons: ['Perfil e template conflitam na mesma entidade'] }
  if (input.profileConfirmed) return { kind: 'confirmed-player', confidence: 1, votes: { player: 5, npc: 0, unresolved: 0 }, reasons: ['Perfil nominal do protocolo'] }
  if (input.npcTemplateConfirmed) return { kind: 'confirmed-npc', confidence: 1, votes: { player: 0, npc: 5, unresolved: 0 }, reasons: ['Template de NPC do protocolo'] }
  const learned = input.model && bayesianSourceInference(input, input.model)
  if (learned) return learned
  const player = [
    input.weaponHits >= 1,
    input.weaponHits >= 3,
    input.weaponHits > input.npcSkillHits,
    input.weaponDamage > 0 && input.weaponHits * 2 >= Math.max(1, input.totalHits),
    input.weaponHits >= 2 && input.npcSkillHits === 0,
  ].filter(Boolean).length
  const npc = [
    input.npcSkillHits >= 1,
    input.npcSkillHits >= 3,
    input.npcSkillHits > input.weaponHits,
    input.npcSkillHits * 2 >= Math.max(1, input.totalHits),
    input.npcSkillHits >= 2 && input.weaponHits === 0,
  ].filter(Boolean).length
  const unresolved = 5 - Math.max(player, npc)
  const votes = { player, npc, unresolved }
  if (player >= 3 && player > npc) return { kind: 'likely-player', confidence: player / 5, votes,
    reasons: [`${input.weaponHits} acertos com habilidades de arma do catálogo`] }
  if (npc >= 3 && npc > player) return { kind: 'likely-npc', confidence: npc / 5, votes,
    reasons: [`${input.npcSkillHits} acertos com habilidades exclusivas de NPC`] }
  return { kind: 'unresolved', confidence: unresolved / 5, votes, reasons: ['Evidência insuficiente ou mista'] }
}
export interface GroupSource {
  id: number; name?: string; npcId?: number; rank?: NpcRankHint; rankSource?: NpcRankSource
  kind: 'player' | 'npc' | 'unknown' | 'conflict'; evidence: EntityIdentityEvidence
  /** Armas observadas por habilidades cujo catálogo declara uma família. Não confirma que a origem seja jogador. */
  weapons: GroupSourceWeapon[]; classification: SourceInference; session: MeterSession
}
export interface GroupConnection { id: string; closed: boolean; lastAt: number; sources: GroupSource[] }
export interface GroupIdentityCoverageBucket { count: number; damage: number; hits: number }
export interface GroupIdentityCoverage {
  total: GroupIdentityCoverageBucket
  confirmedPlayers: GroupIdentityCoverageBucket
  unresolvedAttackers: GroupIdentityCoverageBucket
  confirmedNpcs: GroupIdentityCoverageBucket
  conflicts: GroupIdentityCoverageBucket
}
const emptyGroupIdentityCoverageBucket = (): GroupIdentityCoverageBucket => ({ count: 0, damage: 0, hits: 0 })

/** Resume a evidência observada sem transformar dano em identidade confirmada. */
export function groupIdentityCoverage(sources: readonly GroupSource[]): GroupIdentityCoverage {
  const coverage: GroupIdentityCoverage = {
    total: emptyGroupIdentityCoverageBucket(),
    confirmedPlayers: emptyGroupIdentityCoverageBucket(),
    unresolvedAttackers: emptyGroupIdentityCoverageBucket(),
    confirmedNpcs: emptyGroupIdentityCoverageBucket(),
    conflicts: emptyGroupIdentityCoverageBucket(),
  }
  for (const source of sources) {
    if (!source.session.hits && !source.session.total) continue
    const add = (bucket: GroupIdentityCoverageBucket): void => {
      bucket.count++; bucket.damage += source.session.total; bucket.hits += source.session.hits
    }
    add(coverage.total)
    if (source.kind === 'player' && source.evidence === 'profile') add(coverage.confirmedPlayers)
    else if (source.kind === 'npc' && source.evidence === 'npc-template') add(coverage.confirmedNpcs)
    else if (source.kind === 'conflict' || source.evidence === 'conflict') add(coverage.conflicts)
    else add(coverage.unresolvedAttackers)
  }
  return coverage
}
export interface OverlayCombatSegment {
  id: number; connectionId: string; startedAt: number; endedAt: number | null; lastActivityAt: number
  endReason: 'combat-exit' | 'inactivity' | null; events: number
  dominantTarget?: { templateId: string; name?: string; rank: 'boss' | 'champion' | 'elite' | 'normal'; level?: number }
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
  private targets = new Map<number, { id: number; damage: number; hits: number; lastAt: number; skills: Map<string, MeterSkill> }>()
  private healingDoneRows = new Map<string, MeterSkill>()
  private healingReceivedRows = new Map<string, MeterSkill>()
  private timeline = new Map<string, MeterTimelineEvent>()
  private timed: TimedMeasurement | null = null
  constructor(public sourceId: number | null = null, private names: Record<string, string> = {},
    private icons: Record<string, string> = {},
    /** Acumulados de grupo são segmentados externamente e não devem expirar entre eventos distantes. */
    private freezeOnIdle = true) {}
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
    this.timeline.clear()
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
    // Alguns fluxos não trazem o marcador explícito de saída de combate. A
    // inatividade também delimita a luta nesse caso, inclusive se o último
    // marcador de entrada ficou preso como ativo.
    if (this.freezeOnIdle && !this.timed && this.lastActivityAt !== null && at - this.lastActivityAt - this.pausedMs + this.lastDamagePauseMs >= METER_IDLE_MS) this.reset()
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
    // Não deixe um marcador de saída recebido muito tarde desfazer o
    // congelamento que protege o DPS quando o marcador de saída falhou.
    const fallbackAt = !this.freezeOnIdle || this.lastActivityAt === null ? at : this.lastActivityAt + METER_IDLE_MS + this.pausedMs - this.lastDamagePauseMs
    this.combatEndedAt = Math.min(at, fallbackAt)
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
      this.recordTimeline('received', event)
    }
    if (!outgoing) return false
    this.lastDamageAt = at
    this.recordSkill(this.rows, event)
    const id = Number.isSafeInteger(event.targetId) && event.targetId! > 0 ? event.targetId! : 0
    let target = this.targets.get(id)
    if (!target) { target = { id, damage: 0, hits: 0, lastAt: at, skills: new Map() }; this.targets.set(id, target) }
    target.damage += event.damage; target.hits++
    target.lastAt = Math.max(target.lastAt, at)
    this.recordSkill(target.skills, event)
    this.recordTimeline('damage', event)
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
    if (event.sourceId === this.sourceId) { this.recordSkill(this.healingDoneRows, application); this.recordTimeline('healingDone', application) }
    if (event.targetId === this.sourceId) { this.recordSkill(this.healingReceivedRows, application); this.recordTimeline('healingReceived', application) }
    return true
  }
  private recordTimeline(kind: MeterTimelineEvent['kind'], event: MeterEvent): void {
    const second = Math.floor(event.time)
    const targetId = Number.isSafeInteger(event.targetId) && event.targetId! > 0 ? event.targetId : undefined
    const key = `${second}:${kind}:${event.skillId}:${event.sourceId}:${targetId ?? ''}`
    const row = this.timeline.get(key) ?? { time: second, kind, skillId: event.skillId, sourceId: event.sourceId, targetId, amount: 0, hits: 0 }
    row.amount += event.damage; row.hits++
    this.timeline.set(key, row)
    // Combates longos em grupo podem ter muitos eventos. Preservar a janela mais recente
    // evita que o histórico cresça sem limite, sem afetar os totais do medidor.
    while (this.timeline.size > 4000) this.timeline.delete(this.timeline.keys().next().value!)
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
    const rawClock = this.pausedAt ?? now
    const idleWithoutPauseMs = this.lastActivityAt === null ? 0 : Math.max(0, rawClock - this.lastActivityAt - this.pausedMs + this.lastDamagePauseMs)
    // Quando o jogo não envia o fim do combate, mantém uma curta janela para
    // ticks atrasados e então fixa o relógio no último evento + tolerância.
    const fallbackCombatEnd = this.freezeOnIdle && !this.timed && this.combatEndedAt === null && this.lastActivityAt !== null && idleWithoutPauseMs >= METER_IDLE_MS
      ? this.lastActivityAt + METER_IDLE_MS + this.pausedMs - this.lastDamagePauseMs
      : null
    const clock = this.timed
      ? Math.max(this.timed.startsAt, Math.min(now, this.timed.endsAt))
      : Math.min(rawClock, this.combatEndedAt ?? fallbackCombatEnd ?? rawClock)
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
      targets: [...this.targets.values()].map(row => ({ id: row.id, damage: row.damage, hits: row.hits, lastAt: row.lastAt,
        skills: snapshotSkills(row.skills.values()) })).sort((a,b) => b.damage-a.damage),
      hits: skills.reduce((sum, row) => sum + row.hits, 0),
      critical: skills.reduce((sum, row) => sum + row.critical, 0),
      heavy: skills.reduce((sum, row) => sum + row.heavy, 0),
      timeline: [...this.timeline.values()].map(row => ({ ...row })).sort((a, b) => a.time - b.time || a.skillId - b.skillId),
      waitingReset: this.freezeOnIdle && !this.timed && this.combatEndedAt === null && this.lastActivityAt !== null && idleWithoutPauseMs >= METER_IDLE_MS,
    }
  }
}
/** Fontes observadas são isoladas por conexão; perfil nominal não comprova participação no grupo. */
export class ObservedGroupDamage {
  private connections = new Map<string, { closed: boolean; lastAt: number; names: Map<number, Set<string>>;
    labels: Map<number, Set<string>>; npcs: Map<number, Set<number>>;
    actors: Map<number, { meter: OverlayMeter; weapons: Map<string, GroupSourceWeapon>; npcSkillHits: number }> }>()
  constructor(private names: Record<string, string> = {}, private icons: Record<string, string> = {}, private npcNames: Record<string, string> = {},
    private npcRanks: Record<string, NpcRankHint> = {}, private npcRankSources: Record<string, NpcRankSource> = {},
    private skillWeapons: Record<string, SkillWeaponHint> = {}, private npcSkillIds: ReadonlySet<number> = new Set<number>()) {}
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
    let actor = conn.actors.get(event.sourceId)
    if (!actor) {
      if (conn.actors.size >= 512) return
      const meter = new OverlayMeter(event.sourceId, this.names, this.icons, false)
      meter.beginCombat(event.time * 1000)
      actor = { meter, weapons: new Map(), npcSkillHits: 0 }; conn.actors.set(event.sourceId, actor)
    }
    if (!actor.meter.add(event)) return
    const hint = this.skillWeapons[String(event.skillId)]
    if (hint) {
      const weapon = actor.weapons.get(hint.code) ?? { ...hint, damage: 0, hits: 0, skillIds: [] }
      weapon.damage += event.damage; weapon.hits++
      if (!weapon.skillIds.includes(event.skillId)) weapon.skillIds.push(event.skillId)
      actor.weapons.set(hint.code, weapon)
    }
    if (this.npcSkillIds.has(event.skillId)) actor.npcSkillHits++
    conn.lastAt = Math.max(conn.lastAt, event.time)
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
      // Rótulos de treino são exclusivamente perfil/template já confirmados.
      // O modelo é reconstruído do acumulado local, sem persistir identidade alguma.
      const evidenceModel = buildSourceEvidenceModel([...conn.actors].flatMap(([actor, observed]) => {
        const identified = identify(actor)
        if (identified.kind !== 'player' && identified.kind !== 'npc') return []
        const session = observed.meter.snapshot(at)
        const weapons = [...observed.weapons.values()]
        return [{
          kind: identified.kind,
          totalHits: session.hits,
          weaponHits: weapons.reduce((sum, row) => sum + row.hits, 0),
          npcSkillHits: observed.npcSkillHits,
        }]
      }))
      const sources = [...conn.actors].map(([actor, observed]) => {
        const session = observed.meter.snapshot(at)
        if (session.targets) session.targets = session.targets.map(target => {
          const identified = identify(target.id)
          return { ...target, name: identified.name, npcId: identified.npcId, identity: identified.evidence, rank: identified.rank, rankSource: identified.rankSource }
        })
        const weapons = [...observed.weapons.values()].map(row => ({ ...row, skillIds: row.skillIds.slice().sort((a, b) => a - b) }))
          .sort((a, b) => b.damage - a.damage || a.code.localeCompare(b.code))
        const identified = identify(actor)
        const classification = classifySourceEvidence({
          profileConfirmed: identified.kind === 'player', npcTemplateConfirmed: identified.kind === 'npc', conflict: identified.kind === 'conflict',
          totalHits: session.hits, weaponHits: weapons.reduce((sum, row) => sum + row.hits, 0),
          weaponDamage: weapons.reduce((sum, row) => sum + row.damage, 0), npcSkillHits: observed.npcSkillHits, model: evidenceModel,
        })
        return { id: actor, ...identified, weapons, classification, session }
      }).filter(row => row.session.hits > 0).sort((a,b) => b.session.total-a.session.total)
      if (sources.length) result.push({ id, closed: conn.closed, lastAt: conn.lastAt, sources })
    }
    return result.sort((a,b) => Number(a.closed)-Number(b.closed) || b.lastAt-a.lastAt)
  }
}

function mergeSkills(rows: Iterable<readonly MeterSkill[]>): MeterSkill[] {
  const merged = new Map<string, MeterSkill>()
  for (const skills of rows) for (const skill of skills) {
    const current = merged.get(skill.key)
    if (!current) {
      merged.set(skill.key, { ...skill, skillIds: skill.skillIds?.slice(), damageByKind: { ...skill.damageByKind } })
      continue
    }
    current.damage += skill.damage; current.hits += skill.hits
    current.critical += skill.critical; current.heavy += skill.heavy
    current.skillIds = [...new Set([...(current.skillIds ?? []), ...(skill.skillIds ?? [])])]
    for (const kind of Object.keys(current.damageByKind) as DamageKind[]) current.damageByKind[kind] += skill.damageByKind[kind]
  }
  return snapshotSkills(merged.values())
}

/** Junta leituras de segmentos que pertencem ao mesmo encontro de grupo. */
export function mergeGroupConnections(connections: readonly GroupConnection[], at: number): GroupConnection[] {
  const byConnection = new Map<string, GroupConnection[]>()
  for (const row of connections) {
    const rows = byConnection.get(row.id) ?? []
    rows.push(row); byConnection.set(row.id, rows)
  }
  return [...byConnection].map(([id, rows]) => {
    const bySource = new Map<number, GroupSource[]>()
    for (const row of rows) for (const source of row.sources) {
      const sources = bySource.get(source.id) ?? []
      sources.push(source); bySource.set(source.id, sources)
    }
    const sources = [...bySource].map(([sourceId, sources]) => {
      const base = sources[0]
      const targets = new Map<number, NonNullable<MeterSession['targets']>[number][]>()
      for (const source of sources) for (const target of source.session.targets ?? []) {
        const values = targets.get(target.id) ?? []
        values.push(target); targets.set(target.id, values)
      }
      const mergedTargets = [...targets].map(([targetId, values]) => ({
        ...values[0], id: targetId,
        damage: values.reduce((sum, target) => sum + target.damage, 0),
        hits: values.reduce((sum, target) => sum + target.hits, 0),
        lastAt: Math.max(...values.map(target => target.lastAt ?? 0)),
        skills: mergeSkills(values.map(target => target.skills)),
      })).sort((a, b) => b.damage - a.damage || b.lastAt - a.lastAt)
      const allSkills = mergeSkills(sources.map(source => source.session.skills))
      const startedAt = Math.min(...sources.map(source => source.session.startedAt ?? Number.POSITIVE_INFINITY))
      const lastDamageAt = Math.max(...sources.map(source => source.session.lastDamageAt ?? 0)) || null
      const elapsedSec = startedAt === Number.POSITIVE_INFINITY || !lastDamageAt ? 0 : Math.max(0, (lastDamageAt - startedAt) / 1000)
      const damageByKind = emptyDamageBreakdown()
      for (const skill of allSkills) for (const kind of Object.keys(damageByKind) as DamageKind[]) damageByKind[kind] += skill.damageByKind[kind]
      const weapons = new Map<string, GroupSourceWeapon>()
      for (const source of sources) for (const weapon of source.weapons) {
        const current = weapons.get(weapon.code) ?? { ...weapon, damage: 0, hits: 0, skillIds: [] }
        current.damage += weapon.damage; current.hits += weapon.hits
        current.skillIds = [...new Set([...current.skillIds, ...weapon.skillIds])]
        weapons.set(weapon.code, current)
      }
      const total = allSkills.reduce((sum, skill) => sum + skill.damage, 0)
      const hits = allSkills.reduce((sum, skill) => sum + skill.hits, 0)
      const session: MeterSession = {
        total, hits, skills: allSkills, targets: mergedTargets, damageByKind,
        critical: allSkills.reduce((sum, skill) => sum + skill.critical, 0),
        heavy: allSkills.reduce((sum, skill) => sum + skill.heavy, 0),
        startedAt: startedAt === Number.POSITIVE_INFINITY ? null : startedAt,
        lastDamageAt, lastActivityAt: lastDamageAt, elapsedSec,
        dps: elapsedSec >= 1 ? total / elapsedSec : 0, idleSec: Math.max(0, (at - (lastDamageAt ?? at)) / 1000), waitingReset: false,
      }
      return { ...base, id: sourceId, weapons: [...weapons.values()].sort((a, b) => b.damage - a.damage), session }
    }).sort((a, b) => b.session.total - a.session.total || a.id - b.id)
    return { id, closed: rows.every(row => row.closed), lastAt: Math.max(...rows.map(row => row.lastAt)), sources }
  }).sort((a, b) => Number(a.closed) - Number(b.closed) || b.lastAt - a.lastAt)
}
/**
 * Projeta uma sessão para um alvo sem descartar o acumulado original. A UI usa
 * esta visão para alternar entre Total e qualquer alvo anterior durante a luta;
 * o snapshot continua contendo todos os alvos para que filtros futuros possam
 * reutilizar os mesmos dados.
 */
export function sessionForTarget(session: MeterSession, targetId: number): MeterSession {
  const target = session.targets?.find(row => row.id === targetId)
  if (!target) return session
  const skills = snapshotSkills(target.skills)
  const damageByKind = emptyDamageBreakdown()
  for (const skill of skills) for (const kind of Object.keys(damageByKind) as DamageKind[]) damageByKind[kind] += skill.damageByKind[kind]
  const total = skills.reduce((sum, skill) => sum + skill.damage, 0)
  const hits = skills.reduce((sum, skill) => sum + skill.hits, 0)
  const timeline = session.timeline?.filter(event => event.kind === 'damage' && event.targetId === targetId)
  return {
    ...session,
    total,
    hits,
    skills,
    damageByKind,
    critical: skills.reduce((sum, skill) => sum + skill.critical, 0),
    heavy: skills.reduce((sum, skill) => sum + skill.heavy, 0),
    dps: session.elapsedSec >= 1 ? total / session.elapsedSec : 0,
    lastDamageAt: target.lastAt ?? session.lastDamageAt,
    ...(timeline ? { timeline } : {}),
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
  /** Corte lógico de combate; agrupa conexões paralelas da mesma luta. */
  groupEncounterId?: string | null
  metricPage?: 'damage' | 'damageTargets' | 'receivedSources' | 'receivedSkills' | 'healingDone' | 'healingReceived'
  countdownSec?: number; durationSec?: number
  hideOutOfCombat?: boolean; combatHideDelaySec?: number
  /** Coleta temporária e limitada de candidatos ID/nome para investigar roster. */
  rosterDiagnostics?: boolean
  /** Consolida variantes que compartilham o mesmo nome exibido nas tabelas de habilidade. */
  groupByName?: boolean
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
export type IdentificationStepState = 'pending' | 'active' | 'complete'
export interface OverlayIdentification {
  phase: 'idle' | 'traffic' | 'profile' | 'binding' | 'confirmed' | 'error'
  progress: number
  steps: Array<{ id: 'capture' | 'traffic' | 'profile' | 'binding'; label: string; detail: string; state: IdentificationStepState }>
}
export interface OverlayState {
  groupConnections?: GroupConnection[]
  combatSegments?: OverlayCombatSegment[]
  combatEncounters?: OverlayCombatEncounter[]
  /** Dados de grupo observados por segmento; a UI ainda decide como exibi-los. */
  groupHealing?: Array<{ connectionId: string; segmentId: number; snapshot: GroupHealingSnapshot }>
  groupReceived?: GroupReceivedSegment[]
  deathLog?: import('./overlayDeathLog').DeathLogStatus
  combat?: { lastDamageAt: number | null; hidden: boolean }
  timer?: TimedMeasurement & { phase: 'countdown' | 'running' | 'finished' | 'cancelled'; remainingSec: number; elapsedSec: number }
  capture?: { id: string; connectionId: string | null; encounterId: string; player: OverlayPlayerIdentity | null }
  game?: { attached: boolean; active: boolean; bounds: PanelBounds | null }
  unknownSkillLog?: { directory: string; events: number; ids: number; error: string | null }
  rosterDiagnostic?: { file: string; events: number; error: string | null }
  identification?: OverlayIdentification
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
  /** Fases observadas pelo estado de combate; usadas na visão temporal do histórico. */
  combatSegments?: OverlayCombatSegment[]
  /** Encontros deduzidos ao reunir as conexões paralelas de cada luta. */
  combatEncounters?: OverlayCombatEncounter[]
  /** Corte de grupo salvo independentemente da origem individual. */
  groupEncounter?: OverlayCombatEncounter
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
  /** Reinicia a identificação desta sessão e reativa todos os caminhos automáticos. */
  identify: () => Promise<OverlayState>
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
    ? 'Aguardando reconhecer seu personagem. Abra a ficha de atributos uma vez nesta sessão; o perfil e o ID serão vinculados automaticamente.'
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
