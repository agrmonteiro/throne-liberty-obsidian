import reference from '../data/characterStatReference.json'
import type { Build, BuildStats } from './types'

export interface CharacterStatValue { total: number; fields?: Record<string, string[]>; time?: number }
export interface CharacterSnapshot {
  id: string; captureId: string; connectionId: string; sourceId: number; playerName: string
  firstObservedAt: number; observedAt: number; values: Record<string, CharacterStatValue>
  origin: 'live' | 'pcap'; observedOnly: true
}
export interface CharacterStatsResult {
  live: CharacterSnapshot | null; saved: CharacterSnapshot[]; error: string | null
  pending?: Array<{ connectionId: string; observedAt: number; fields: number }>
}
interface StatDefinition { symbol: string; namePt?: string | null; nameEn?: string | null; multiply: number; format: string; mapping: string }
const definitions = reference.stats as Record<string, StatDefinition>
export function isCharacterSnapshot(value: unknown): value is CharacterSnapshot {
  if (!value || typeof value!=='object') return false
  const row=value as CharacterSnapshot
  return typeof row.id==='string' && typeof row.captureId==='string' && typeof row.connectionId==='string' && typeof row.playerName==='string'
    && Number.isSafeInteger(row.sourceId) && row.sourceId>0
    && Number.isFinite(row.firstObservedAt) && Number.isFinite(row.observedAt)
    && ['live','pcap'].includes(row.origin) && row.observedOnly===true && Boolean(row.values && typeof row.values==='object' && !Array.isArray(row.values))
    && Object.keys(row.values).length<=1024 && Object.entries(row.values).every(([id,v])=>/^\d+$/.test(id) && Number(id)>0 && Number(id)<=4096 && v && Number.isSafeInteger(v.total))
}
export function characterStatRows(snapshot: CharacterSnapshot): Array<{ id: string; symbol: string; name: string; english: string; value: number; display: string; mapped: boolean }> {
  return Object.entries(snapshot.values).map(([id, row]) => {
    const def = definitions[id]
    const value = Number((row.total * (def?.multiply ?? 1)).toFixed(6))
    const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
    const unit = def?.format?.includes('%') ? '%' : def?.format?.includes('초') || def?.format?.endsWith('s') ? ' s' : ''
    return { id, symbol: def?.symbol ?? '', name: def?.namePt?.trim() || def?.nameEn?.trim() || `Status ${id}`,
      english: def?.nameEn?.trim() || `Status ${id}`, value, display: formatted + unit, mapped: Boolean(def?.namePt || def?.nameEn) }
  }).sort((a,b) => Number(a.id)-Number(b.id))
}
/** Preserva toda a leitura, inclusive campos ainda sem rótulo. Não deduz valores ausentes. */
export function importCharacterSnapshot(base: Build, snapshot: CharacterSnapshot, attackType: '' | 'melee' | 'ranged' | 'magic'): Build {
  const rows = characterStatRows(snapshot), rawStats = { ...base.rawStats }, rawAttributes = { ...base.rawAttributes }
  const attrs: Record<string, string> = { kSTR:'Strength', kDEX:'Dexterity', kINT:'Wisdom', kPER:'Perception', kCON:'Fortitude' }
  const values = new Map(rows.map(row => [row.symbol, row.value]))
  const used = new Set<string>()
  for (const row of rows) {
    if (attrs[row.symbol]) rawAttributes[attrs[row.symbol]] = { total: row.value, display: row.display }
    else { const key = used.has(row.english) ? `${row.english} [${row.id}]` : row.english; rawStats[key] = row.display; used.add(row.english) }
  }
  const patch: Partial<BuildStats> = {}
  const direct: Array<[string, keyof BuildStats]> = [['kAttackSpeedModifier','attackSpeedPct'],['kSkillCooldownModifier','cdrPct'],
    ['kSkillPowerAmplification','skillDmgBoost'],['kDamageReductionPenetration','bonusDmg'],['kCriticalDamageDealtModifier','critDmgPct']]
  for (const [symbol,key] of direct) if (values.has(symbol)) patch[key] = values.get(symbol)!
  const family = attackType ? { melee:'Melee', ranged:'Range', magic:'Magic' }[attackType] : undefined
  if (family) {
    const crit = values.get(`k${family}CriticalAttack`), heavy = values.get(`k${family}DoubleAttack`)
    if (crit !== undefined) patch.critHitChance = crit
    if (heavy !== undefined) patch.heavyAttackChance = heavy
  }
  // A ficha combina o bônus da arma com o intervalo-base [1, AttackPowerMainHand].
  if (values.has('kAttackPowerMainHand') && values.has('kBonusAttackPowerMainHand')) {
    patch.minWeaponDmg = values.get('kBonusAttackPowerMainHand')! + 1
    patch.maxWeaponDmg = values.get('kBonusAttackPowerMainHand')! + values.get('kAttackPowerMainHand')!
    rawStats['Primary Weapon Damage'] = `${patch.minWeaponDmg.toLocaleString('pt-BR')} ~ ${patch.maxWeaponDmg.toLocaleString('pt-BR')}`
    // O componente nativo Max Damage não é o dano máximo final exibido pela ficha.
    rawStats['Weapon Maximum Component'] = rawStats['Max Damage']; delete rawStats['Max Damage']
  }
  return { ...base, stats: { ...base.stats, ...patch }, rawStats, rawAttributes,
    characterSnapshot: structuredClone(snapshot), editedAt: new Date().toISOString(),
    // A escolha não é só um auxílio visual desta importação: a calculadora deve
    // continuar usando a mesma família quando a build for replicada depois.
    ...(attackType ? { calculatorAttackType: attackType } : {}),
    notes: [base.notes, `Ficha de ${snapshot.playerName} lida em ${new Date(snapshot.observedAt*1000).toLocaleString('pt-BR')}: ${rows.length} status observados. Importação experimental; valores podem incluir buffs. Campos ausentes e parâmetros de habilidade/alvo foram preservados.`].filter(Boolean).join('\n') }
}
