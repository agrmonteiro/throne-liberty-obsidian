/** Agregador isolado de cura. Identidades são válidas somente dentro da conexão confirmada. */
export interface GroupHealingProfile {
  connectionId: string
  playerId: number
  name: string
  confirmed: true
}

export interface GroupHealingInput {
  connectionId: string
  sourceId: number
  targetId: number
  amount: number
  skillId: number
  skillName?: string
  time?: number
}

export interface GroupHealingSkill {
  skillId: number
  name: string
  total: number
  hits: number
}

export interface GroupHealingPlayer {
  profile: GroupHealingProfile
  done: { total: number; hits: number; skills: GroupHealingSkill[] }
  received: { total: number; hits: number; skills: GroupHealingSkill[] }
}

export interface GroupHealingSnapshot {
  players: GroupHealingPlayer[]
  events: number
}

type Direction = 'done' | 'received'
type Row = { total: number; hits: number; skills: Map<number, GroupHealingSkill> }
const validId = (id: number): boolean => Number.isSafeInteger(id) && id > 0
const validText = (s: string): boolean => s.trim().length > 0 && s.length <= 128

export class GroupHealingMeter {
  private readonly profiles = new Map<string, GroupHealingProfile>()
  private readonly rows = new Map<string, { done: Row; received: Row }>()
  private eventCount = 0

  private key(connectionId: string, playerId: number): string { return `${connectionId.length}:${connectionId}:${playerId}` }

  clear(): void { this.profiles.clear(); this.rows.clear(); this.eventCount = 0 }

  /** Copia apenas os perfis explicitamente confirmados da conexão solicitada. */
  copyConnectionProfilesTo(connectionId: string, target: GroupHealingMeter): void {
    for (const profile of this.profiles.values()) if (profile.connectionId === connectionId) target.profile(profile)
  }

  /** Registra apenas perfis explicitamente confirmados; não existe inferência por evento de cura. */
  profile(input: GroupHealingProfile): boolean {
    if (!input || input.confirmed !== true || typeof input.connectionId !== 'string'
      || !validText(input.connectionId) || !validId(input.playerId) || typeof input.name !== 'string'
      || !validText(input.name)) return false
    const key = this.key(input.connectionId, input.playerId)
    const prior = this.profiles.get(key)
    // Um mesmo ID na mesma conexão não pode trocar de identidade silenciosamente.
    if (prior && prior.name !== input.name) return false
    if (!prior) this.profiles.set(key, { ...input })
    return true
  }

  /** A cura só entra quando origem e alvo têm perfil confirmado na mesma conexão. */
  addHealing(input: GroupHealingInput): boolean {
    if (!input || typeof input.connectionId !== 'string' || !validText(input.connectionId)
      || !validId(input.sourceId) || !validId(input.targetId) || !Number.isFinite(input.amount)
      || input.amount <= 0 || !validId(input.skillId)
      || (input.time !== undefined && !Number.isFinite(input.time))) return false
    const sourceKey = this.key(input.connectionId, input.sourceId)
    const targetKey = this.key(input.connectionId, input.targetId)
    const source = this.profiles.get(sourceKey)
    const target = this.profiles.get(targetKey)
    if (!source || !target) return false
    const name = input.skillName?.trim() || `Habilidade ${input.skillId}`
    const update = (key: string, direction: Direction): void => {
      let playerRows = this.rows.get(key)
      if (!playerRows) {
        const empty = (): Row => ({ total: 0, hits: 0, skills: new Map() })
        playerRows = { done: empty(), received: empty() }
        this.rows.set(key, playerRows)
      }
      const row = playerRows[direction]
      row.total += input.amount
      row.hits++
      const skill = row.skills.get(input.skillId)
      if (skill) { skill.total += input.amount; skill.hits++ }
      else row.skills.set(input.skillId, { skillId: input.skillId, name, total: input.amount, hits: 1 })
    }
    update(sourceKey, 'done')
    update(targetKey, 'received')
    this.eventCount++
    return true
  }

  /** Retorna cópia profundamente congelada; mutações externas não alteram o medidor. */
  snapshot(): GroupHealingSnapshot {
    const players: GroupHealingPlayer[] = [...this.profiles.entries()].map(([key, profile]) => {
      const state = this.rows.get(key)
      const make = (direction: Direction) => {
        const row = state?.[direction]
        return Object.freeze({ total: row?.total ?? 0, hits: row?.hits ?? 0,
          skills: Object.freeze([...(row?.skills.values() ?? [])].map(skill => Object.freeze({ ...skill })) as unknown as GroupHealingSkill[]) })
      }
      return Object.freeze({ profile: Object.freeze({ ...profile }), done: make('done'), received: make('received') }) as unknown as GroupHealingPlayer
    }).sort((a, b) => a.profile.connectionId.localeCompare(b.profile.connectionId)
      || a.profile.playerId - b.profile.playerId)
    return Object.freeze({ players: Object.freeze(players) as unknown as GroupHealingPlayer[], events: this.eventCount })
  }
}
