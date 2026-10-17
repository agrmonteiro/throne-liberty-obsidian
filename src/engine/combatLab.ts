import type { CombatEvent, RawPull } from './logParser'
import type { RotationCharacter, RotationSkill } from './types'
import { DEFAULT_ROTATION_CHARACTER } from './types'
import { calcSkillAvgDamage } from './rotationEngine'

export type EvidenceStatus = 'pending' | 'reviewed'
export type EvidenceKind = 'weapon' | 'core' | 'item' | 'skill' | 'specialization' | 'buff' | 'passive' | 'mastery' | 'stats' | 'substats'

export interface LabEvidence {
  id: string
  kind: EvidenceKind
  name: string
  source: 'catalog' | 'screenshot' | 'video' | 'build' | 'log' | 'manual'
  status: EvidenceStatus
  text: string
  imagePath?: string
  videoName?: string
  videoAtSec?: number
  capturedAt: string
}

export interface LabSkill {
  id: string
  name: string
  aliases: string[]
  key: string
  weapon: 'main' | 'off'
  cooldownSec: number
  actionMs: number
  damagePct: number
  flatDamage: number
  hits: number
  monsterBonusPct: number
  priority: 1 | 2 | 3 | 4 | 5
  enabled: boolean
  reviewed: boolean
  source: string
  specialization?: string
}

export interface LabBuff {
  id: string
  name: string
  key: string
  cooldownSec: number
  durationSec: number
  damagePct: number
  baseDamageFlat?: number
  attackSpeedPct: number
  cooldownSpeedPct: number
  advantageAffected: boolean
  priority: 1 | 2 | 3 | 4 | 5
  enabled: boolean
  reviewed: boolean
  source: string
}

export interface LabEffect {
  id: string
  name: string
  kind: 'weapon' | 'core' | 'item' | 'passive' | 'mastery'
  slot?: string
  description: string
  damagePct: number
  cooldownSpeedPct: number
  advantageDurationPct: number
  reviewed: boolean
  source: string
}

export interface LabProfile {
  id: string
  buildId: string
  name: string
  character: RotationCharacter
  skills: LabSkill[]
  buffs: LabBuff[]
  effects: LabEffect[]
  evidence: LabEvidence[]
  runs: LabRun[]
  latencyMs: number
  pressFailurePct: number
  highPriorityRepeats: number
  durationSec: number
  editedAt: string
}

export interface LabRun {
  id: string
  buildId: string
  logName: string
  character: string
  mainTarget: string
  pullStart: number
  recordedAt: string
  firstMinuteDamage: number
  secondMinuteDamage: number
  totalDamage: number
  firstMinuteDps: number
  secondMinuteDps: number
  averageDps: number
  complete: boolean
}

export interface PlannedSkill {
  id: string
  name: string
  casts: number
  damage: number
  dps: number
  damagePerCast: number
  attempts: number
  failedInput: number
  cooldownMisses: number
}

export interface LabPlan {
  durationSec: number
  totalDamage: number
  dps: number
  skills: PlannedSkill[]
  buffUptimePct: Record<string, number>
  pendingEvidence: string[]
  timeline: Array<{ atMs: number; name: string; kind: 'skill' | 'buff'; damage: number }>
}

export interface LabComparisonRow extends PlannedSkill {
  observedDamage: number
  observedDps: number
  observedHits: number
  deltaDps: number
}

export interface LabComparison {
  plannedDps: number
  observedDps: number
  deltaDps: number
  unassignedDamage: number
  rows: LabComparisonRow[]
  observedDurationSec: number
}

export interface LabOptimization {
  baseline: LabPlan
  proposed: LabPlan
  priorities: Record<string, LabSkill['priority']>
}

const seedSkill = (
  id: string, name: string, key: string, weapon: 'main' | 'off',
  cooldownSec: number, damagePct: number, flatDamage: number, hits: number,
  priority: 1 | 2 | 3 | 4 | 5, aliases: string[] = [],
): LabSkill => ({
  id, name, aliases, key, weapon, cooldownSec, damagePct, flatDamage, hits,
  actionMs: 450, monsterBonusPct: 0, priority, enabled: true,
  reviewed: false, source: 'Prints de habilidades enviados em outubro; confirmar valores e especializações atuais',
})

/** Ponto de partida revisável; nenhum dado histórico é marcado como confirmado. */
export function createGauntletDaggerProfile(buildId = ''): LabProfile {
  return {
    id: `lab_${Date.now()}`,
    buildId,
    name: 'Manopla + Adaga',
    character: { ...DEFAULT_ROTATION_CHARACTER, weaponMainType: 'Gauntlets', weaponOffType: 'Dagger' },
    skills: [
      seedSkill('shadow', 'Golpe Sombrio', '1', 'off', 5.1, 200, 0, 1, 5, ['Golpe da Sombra', 'Shadow Strike']),
      seedSkill('bloodstorm', 'Tempestade de Sangue', '2', 'main', 7.3, 114, 38, 8, 5, ['Bloodstorm']),
      seedSkill('lightning', 'Arremesso de Relâmpago', '3', 'off', 8.8, 60, 0, 5, 3, ['Arremesso de Raio', 'Lightning Throw']),
      seedSkill('moonlight', 'Fenda Enluarada', '4', 'off', 2.9, 194, 38, 3, 5, ['Luar Cortante', 'Cleaving Moonlight']),
      seedSkill('claws', 'Garras Consecutivas', '5', 'main', 2.5, 230, 62, 3, 5, ['Consecutive Claws']),
      seedSkill('massacre', 'Massacre', '6', 'off', 13.1, 540, 170, 1, 4),
      seedSkill('dance', 'Dança da Espada Frenética', '7', 'off', 12.1, 194, 43, 3, 3, ['Frenzied Sword Dance']),
      seedSkill('mirage', 'Miragem', '8', 'main', 10, 292, 169, 1, 1, ['Mirage']),
    ],
    buffs: [
      { id: 'poison', name: 'Injeção Letal', key: '9', cooldownSec: 7.3, durationSec: 9, damagePct: 0, attackSpeedPct: 0, cooldownSpeedPct: 0, advantageAffected: false, priority: 5, enabled: true, reviewed: false, source: 'Print de habilidade; efeito de veneno exige modelagem própria' },
      { id: 'umbral', name: 'Espírito Umbral', key: '-', cooldownSec: 14.6, durationSec: 6, damagePct: 0, attackSpeedPct: 0, cooldownSpeedPct: 0, advantageAffected: true, priority: 4, enabled: true, reviewed: false, source: 'Print de habilidade; proc crítico ainda não modelado' },
      { id: 'moon', name: 'Luar Brilhante', key: '=', cooldownSec: 14.6, durationSec: 7.1, damagePct: 6.6, attackSpeedPct: 0, cooldownSpeedPct: 0, advantageAffected: true, priority: 5, enabled: true, reviewed: false, source: 'Print de habilidade; confirmar versão atual' },
      { id: 'blade', name: 'Corte Selvagem de Lâmina', key: '/', cooldownSec: 120, durationSec: 10, damagePct: 0, baseDamageFlat: 22, attackSpeedPct: 0, cooldownSpeedPct: 0, advantageAffected: true, priority: 5, enabled: true, reviewed: false, source: 'Print de buff: +22 dano base por 10 s; confirmar versão atual' },
    ],
    effects: [
      { id: 'thunder-call', name: 'Chamado do Trovão', kind: 'weapon', description: 'Adaga: +10% em Fenda; consome Nuvens de Trovão para raio. Dano condicional de 700% em monstros depende dos acúmulos.', damagePct: 0, cooldownSpeedPct: 0, advantageDurationPct: 0, reviewed: false, source: 'Print da adaga; não somar proc sem confirmação de acúmulos' },
      { id: 'venomous-edge', name: 'Limite Venenoso', kind: 'mastery', description: 'Maestria de adaga condicionada a Injeção Letal e veneno.', damagePct: 0, cooldownSpeedPct: 0, advantageDurationPct: 0, reviewed: false, source: 'Print da maestria; depende dos acúmulos' },
    ],
    evidence: [], runs: [], latencyMs: 100, pressFailurePct: 10, highPriorityRepeats: 5,
    durationSec: 120, editedAt: new Date().toISOString(),
  }
}

export function normalizeCombatName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function safeNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function selectedDamage(skill: LabSkill, profile: LabProfile, baseDamageFlat = 0): number {
  if (!skill.reviewed || !(skill.weapon === 'main' ? profile.character.weaponMainDmgMax : profile.character.weaponOffDmgMax)) return 0
  const rotationSkill: RotationSkill = {
    id: skill.id, skillName: skill.name, weapon: skill.weapon,
    castTime: skill.actionMs / 1000, cooldown: skill.cooldownSec,
    skillDmgPct: skill.damagePct, bonusBaseDmg: skill.flatDamage,
    hits: skill.hits, monsterBonus: skill.monsterBonusPct / 100,
    dmgBonus: 0, enabled: true,
  }
  const character = baseDamageFlat ? {
    ...profile.character,
    weaponMainDmgMin: profile.character.weaponMainDmgMin + baseDamageFlat,
    weaponMainDmgMax: profile.character.weaponMainDmgMax + baseDamageFlat,
    weaponOffDmgMin: profile.character.weaponOffDmgMin + baseDamageFlat,
    weaponOffDmgMax: profile.character.weaponOffDmgMax + baseDamageFlat,
  } : profile.character
  return calcSkillAvgDamage(rotationSkill, character)
}

/** Simula tentativas repetidas: pressionamento não é cast, e CD/animação continuam valendo. */
export function simulatePriority(profile: LabProfile): LabPlan {
  const durationMs = Math.max(1000, Math.min(600000, Math.round(safeNumber(profile.durationSec, 60) * 1000)))
  const latencyMs = Math.max(50, Math.min(1000, Math.round(safeNumber(profile.latencyMs, 100))))
  const failurePct = Math.max(0, Math.min(99, safeNumber(profile.pressFailurePct)))
  const repeats = Math.max(1, Math.min(10, Math.round(safeNumber(profile.highPriorityRepeats, 5))))
  const activeSkills = profile.skills.filter(s => s.enabled)
  const activeBuffs = profile.buffs.filter(b => b.enabled)
  const actions = [...activeBuffs.map(b => ({ kind: 'buff' as const, id: b.id, priority: b.priority })),
    ...activeSkills.map(s => ({ kind: 'skill' as const, id: s.id, priority: s.priority }))]
    .sort((a, b) => b.priority - a.priority || (a.kind === 'buff' ? -1 : 1))
  const schedule = actions.flatMap(action => Array.from({ length: action.priority >= 4 ? repeats : 1 }, () => action))
  const rows = new Map(activeSkills.map(s => [s.id, { id: s.id, name: s.name, casts: 0, damage: 0, dps: 0, damagePerCast: 0, attempts: 0, failedInput: 0, cooldownMisses: 0 } satisfies PlannedSkill]))
  const ready = new Map<string, number>()
  const buffEnds = new Map<string, number>()
  const buffActiveMs = new Map(activeBuffs.map(b => [b.id, 0]))
  const timeline: LabPlan['timeline'] = []
  const passiveDmg = profile.effects.filter(e => e.reviewed).reduce((v, e) => v + Math.max(0, e.damagePct), 0)
  const passiveCdr = profile.effects.filter(e => e.reviewed).reduce((v, e) => v + e.cooldownSpeedPct, 0)
  const passiveAdv = profile.effects.filter(e => e.reviewed).reduce((v, e) => v + e.advantageDurationPct, 0)
  let busyUntil = 0
  let totalDamage = 0
  let slot = 0
  let randomState = 0x61C88647
  const nextRandom = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 0x100000000
  }
  for (let at = 0; at < durationMs && schedule.length; at += latencyMs) {
    for (const buff of activeBuffs) {
      if ((buffEnds.get(buff.id) ?? 0) > at) buffActiveMs.set(buff.id, (buffActiveMs.get(buff.id) ?? 0) + Math.min(latencyMs, durationMs - at))
    }
    const action = schedule[slot++ % schedule.length]
    if (action.kind === 'skill') rows.get(action.id)!.attempts++
    if (at < busyUntil || at < (ready.get(action.id) ?? 0)) {
      if (action.kind === 'skill') rows.get(action.id)!.cooldownMisses++
      continue
    }
    if (nextRandom() * 100 < failurePct) {
      if (action.kind === 'skill') rows.get(action.id)!.failedInput++
      continue
    }
    const active = activeBuffs.filter(b => b.reviewed && (buffEnds.get(b.id) ?? 0) > at)
    const cdr = Math.max(0, profile.character.cdrPct + passiveCdr + active.reduce((v, b) => v + b.cooldownSpeedPct, 0))
    if (action.kind === 'buff') {
      const buff = activeBuffs.find(b => b.id === action.id)!
      ready.set(buff.id, at + Math.max(0, buff.cooldownSec) * 1000 / (1 + cdr / 100))
      const advantage = buff.advantageAffected ? profile.character.advDurPct + passiveAdv : 0
      buffEnds.set(buff.id, at + Math.max(0, buff.durationSec) * 1000 * (1 + Math.max(-90, advantage) / 100))
      timeline.push({ atMs: at, name: buff.name, kind: 'buff', damage: 0 })
      continue
    }
    const skill = activeSkills.find(s => s.id === action.id)!
    const attackSpeed = profile.character.attackSpeedPct + active.reduce((v, b) => v + b.attackSpeedPct, 0)
    busyUntil = at + Math.max(latencyMs, skill.actionMs / (1 + Math.max(-90, attackSpeed) / 100))
    ready.set(skill.id, at + Math.max(0, skill.cooldownSec) * 1000 / (1 + cdr / 100))
    const buffDmg = active.reduce((v, b) => v + b.damagePct, 0)
    const baseDamageFlat = active.reduce((v, b) => v + (b.baseDamageFlat ?? 0), 0)
    const damage = selectedDamage(skill, profile, baseDamageFlat) * (1 + (passiveDmg + buffDmg) / 100)
    const row = rows.get(skill.id)!
    row.casts++
    row.damage += damage
    totalDamage += damage
    timeline.push({ atMs: at, name: skill.name, kind: 'skill', damage })
  }
  const durationSec = durationMs / 1000
  for (const row of rows.values()) {
    row.dps = row.damage / durationSec
    row.damagePerCast = row.casts ? row.damage / row.casts : 0
  }
  const pendingEvidence = [
    ...profile.skills.filter(s => s.enabled && !s.reviewed).map(s => `Skill: ${s.name}`),
    ...profile.buffs.filter(b => b.enabled && !b.reviewed).map(b => `Buff: ${b.name}`),
    ...profile.effects.filter(e => !e.reviewed).map(e => `${e.kind}: ${e.name}`),
    ...profile.evidence.filter(e => e.status === 'pending').map(e => `${e.kind}: ${e.name}`),
  ]
  if (!profile.character.weaponMainDmgMax || !profile.character.weaponOffDmgMax) pendingEvidence.unshift('Dano das duas armas não informado')
  return {
    durationSec, totalDamage, dps: totalDamage / durationSec,
    skills: [...rows.values()],
    buffUptimePct: Object.fromEntries(activeBuffs.map(b => [b.id, Math.min(100, (buffActiveMs.get(b.id) ?? 0) / durationMs * 100)])),
    pendingEvidence, timeline,
  }
}

/** Busca local determinística; só faz sentido com armas e skills de dano revisadas. */
export function optimizePriority(profile: LabProfile): LabOptimization | null {
  if (!profile.character.weaponMainDmgMax || !profile.character.weaponOffDmgMax || !profile.skills.some(s => s.enabled && s.reviewed)) return null
  const baseline = simulatePriority(profile)
  let skills = profile.skills.map(skill => ({ ...skill }))
  let proposed = baseline
  for (let pass = 0; pass < 2; pass++) {
    let changed = false
    for (const skill of skills.filter(s => s.enabled && s.reviewed)) {
      let bestPriority = skill.priority
      let bestPlan = proposed
      for (const priority of [1, 2, 3, 4, 5] as const) {
        if (priority === skill.priority) continue
        const candidate = skills.map(s => s.id === skill.id ? { ...s, priority } : s)
        const plan = simulatePriority({ ...profile, skills: candidate })
        if (plan.totalDamage > bestPlan.totalDamage + 0.001) {
          bestPlan = plan
          bestPriority = priority
        }
      }
      if (bestPriority !== skill.priority) {
        skills = skills.map(s => s.id === skill.id ? { ...s, priority: bestPriority } : s)
        proposed = bestPlan
        changed = true
      }
    }
    if (!changed) break
  }
  return { baseline, proposed, priorities: Object.fromEntries(skills.map(s => [s.id, s.priority])) }
}

export function comparePlanWithPull(plan: LabPlan, profile: LabProfile, pull: RawPull, source = ''): LabComparison {
  const observedDurationSec = Math.max(1, Math.min(120, (pull.endTime - pull.startTime) / 1000))
  const rowByName = new Map<string, string>()
  for (const skill of profile.skills) {
    for (const name of [skill.name, ...skill.aliases]) rowByName.set(normalizeCombatName(name), skill.id)
  }
  const byId = new Map(plan.skills.map(row => [row.id, { ...row, observedDamage: 0, observedDps: 0, observedHits: 0, deltaDps: 0 } satisfies LabComparisonRow]))
  let unassignedDamage = 0
  for (const event of pull.events as CombatEvent[]) {
    if (event.tsMs >= pull.startTime + 120000 || (source && event.source !== source)) continue
    const id = rowByName.get(normalizeCombatName(event.skill))
    const row = id ? byId.get(id) : undefined
    if (row) { row.observedDamage += event.damage; row.observedHits++ }
    else unassignedDamage += event.damage
  }
  const rows = [...byId.values()]
  for (const row of rows) {
    row.observedDps = row.observedDamage / observedDurationSec
    row.deltaDps = row.observedDps - row.dps
  }
  const observedDps = (rows.reduce((sum, row) => sum + row.observedDamage, 0) + unassignedDamage) / observedDurationSec
  return { plannedDps: plan.dps, observedDps, deltaDps: observedDps - plan.dps, unassignedDamage, rows, observedDurationSec }
}

/** Critério final fixo: dano acumulado nos primeiros 120 segundos do pull. */
export function measureTwoMinuteRun(pull: RawPull, buildId: string, logName: string, source = ''): LabRun {
  let firstMinuteDamage = 0
  let secondMinuteDamage = 0
  const ownEvents = source ? pull.events.filter(event => event.source === source) : pull.events
  for (const event of ownEvents) {
    const offset = event.tsMs - pull.startTime
    if (offset < 0 || offset >= 120000) continue
    if (offset < 60000) firstMinuteDamage += event.damage
    else secondMinuteDamage += event.damage
  }
  const totalDamage = firstMinuteDamage + secondMinuteDamage
  const byTarget = new Map<string, number>()
  for (const event of ownEvents) byTarget.set(event.target, (byTarget.get(event.target) ?? 0) + event.damage)
  const mainTarget = [...byTarget.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  return {
    id: `${logName}:${pull.startTime}:${buildId}:${source}`,
    buildId, logName, character: source, mainTarget, pullStart: pull.startTime, recordedAt: new Date().toISOString(),
    firstMinuteDamage, secondMinuteDamage, totalDamage,
    firstMinuteDps: firstMinuteDamage / 60,
    secondMinuteDps: secondMinuteDamage / 60,
    averageDps: totalDamage / 120,
    complete: pull.endTime - pull.startTime >= 119000,
  }
}
