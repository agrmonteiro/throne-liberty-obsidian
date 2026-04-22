import { getSkillInfo } from './skillsDB'

export interface CombatEvent {
  tsMs: number
  eventType: string
  skill: string
  skillId: string
  damage: number
  isCrit: boolean
  isHeavy: boolean
  hitType: string
  source: string
  target: string
}

export interface RawPull {
  id: number
  startTime: number
  endTime: number
  events: CombatEvent[]
  damage: number
}

export interface EnrichedPull extends RawPull {
  dps: number
  durationMs: number
  durationGroup: 'short' | 'long'
  character: string
  mainTarget: string
  weapons: string[]
  logFile: string
}

function parseTLLogTime(str: string): number {
  if (str.length < 21) return 0
  const y  = parseInt(str.slice(0, 4), 10)
  const M  = parseInt(str.slice(4, 6), 10) - 1
  const d  = parseInt(str.slice(6, 8), 10)
  const h  = parseInt(str.slice(9, 11), 10)
  const m  = parseInt(str.slice(12, 14), 10)
  const s  = parseInt(str.slice(15, 17), 10)
  const ms = parseInt(str.slice(18, 21), 10)
  return new Date(y, M, d, h, m, s, ms).getTime()
}

export function parseLogText(text: string): CombatEvent[] {
  const lines = text.split('\n')
  const parsed: CombatEvent[] = []
  for (const line of lines) {
    try {
      if (!line || !line.includes(',')) continue
      const p = line.split(',')
      if (p[1] !== 'DamageDone' || p.length < 10) continue
      parsed.push({
        tsMs: parseTLLogTime(p[0]),
        eventType: p[1],
        skill: p[2],
        skillId: p[3],
        damage: parseFloat(p[4]) || 0,
        isCrit: p[5] === '1',
        isHeavy: p[6] === '1',
        hitType: p[7],
        source: p[8],
        target: p[9].trim()
      })
    } catch {
      // ignore malformed lines
    }
  }
  return parsed.sort((a, b) => a.tsMs - b.tsMs)
}

export function segmentPulls(events: CombatEvent[], gapMs = 15000): RawPull[] {
  if (events.length === 0) return []
  const results: RawPull[] = []
  let current: CombatEvent[] = [events[0]]
  let pullIdx = 1

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1]
    const curr = events[i]
    if (curr.tsMs - prev.tsMs > gapMs) {
      results.push({
        id: pullIdx++,
        startTime: current[0].tsMs,
        endTime: current[current.length - 1].tsMs,
        events: current,
        damage: current.reduce((acc, e) => acc + e.damage, 0)
      })
      current = [curr]
    } else {
      current.push(curr)
    }
  }

  if (current.length > 0) {
    results.push({
      id: pullIdx,
      startTime: current[0].tsMs,
      endTime: current[current.length - 1].tsMs,
      events: current,
      damage: current.reduce((acc, e) => acc + e.damage, 0)
    })
  }

  return results
}

export function enrichPull(pull: RawPull, logFile: string): EnrichedPull {
  const durationMs = pull.endTime - pull.startTime
  const durationSec = durationMs / 1000
  const dps = durationSec > 0 ? pull.damage / durationSec : 0
  const durationGroup: 'short' | 'long' = durationSec < 120 ? 'short' : 'long'

  const sourceCounts: Record<string, number> = {}
  pull.events.forEach(e => {
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1
  })
  const character = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  const targetDamage: Record<string, number> = {}
  pull.events.forEach(e => {
    targetDamage[e.target] = (targetDamage[e.target] || 0) + e.damage
  })
  const mainTarget = Object.entries(targetDamage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  const skillAgg: Record<string, number> = {}
  pull.events.forEach(e => {
    skillAgg[e.skill] = (skillAgg[e.skill] || 0) + e.damage
  })
  const weapons = Array.from(new Set(
    Object.entries(skillAgg)
      .map(([name, dmg]) => ({ name, dmg, info: getSkillInfo(name) }))
      .filter(item => item.info?.category === 'active' && item.info?.weapon !== 'Basic')
      .sort((a, b) => b.dmg - a.dmg)
      .slice(0, 5)
      .map(item => item.info!.weapon)
  ))

  return { ...pull, dps, durationMs, durationGroup, character, mainTarget, weapons, logFile }
}

export function parseAndEnrichLog(text: string, logFile: string): EnrichedPull[] {
  const events = parseLogText(text)
  const pulls = segmentPulls(events)
  return pulls.map(p => enrichPull(p, logFile))
}
