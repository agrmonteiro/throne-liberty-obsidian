import type { OverlayCombatSegment } from './overlayMeter'

export interface OverlayCombatEncounter {
  /** Estável enquanto novos segmentos paralelos entram no mesmo combate. */
  id: string
  segmentIds: number[]
  startedAt: number
  endedAt: number | null
  lastActivityAt: number
  endReason: 'combat-exit' | 'inactivity' | null
  events: number
  connections: number
  dominantTarget?: OverlayCombatSegment['dominantTarget']
}

// Conexões do mesmo combate podem encerrar a poucos segundos de distância. A
// janela junta esses ramos sem colar duas lutas realmente distintas.
export const COMBAT_ENCOUNTER_JOIN_MS = 3_000

const rankPriority: Record<NonNullable<OverlayCombatSegment['dominantTarget']>['rank'], number> = {
  boss: 4, champion: 3, elite: 2, normal: 1,
}

function endAt(segment: OverlayCombatSegment): number {
  return segment.endedAt ?? segment.lastActivityAt
}

function dominantTarget(segments: readonly OverlayCombatSegment[]): OverlayCombatSegment['dominantTarget'] | undefined {
  const candidates = segments.flatMap(segment => segment.dominantTarget ? [{ target: segment.dominantTarget, events: segment.events }] : [])
  if (!candidates.length) return undefined
  candidates.sort((a, b) => rankPriority[b.target.rank] - rankPriority[a.target.rank]
    || b.events - a.events || a.target.templateId.localeCompare(b.target.templateId))
  return { ...candidates[0].target }
}

/**
 * Une os fluxos paralelos do mesmo combate. Um chefe conhecido ganha a
 * prioridade de rótulo; quando não há template, a transição de combate ou a
 * inatividade continuam fornecendo o corte seguro.
 */
export function groupCombatSegments(segments: readonly OverlayCombatSegment[], joinMs = COMBAT_ENCOUNTER_JOIN_MS): OverlayCombatEncounter[] {
  const ordered = segments.filter(segment => segment.events > 0)
    .slice().sort((a, b) => a.startedAt - b.startedAt || a.id - b.id)
  const groups: OverlayCombatSegment[][] = []
  for (const segment of ordered) {
    const current = groups.at(-1)
    const currentEnd = current ? Math.max(...current.map(endAt)) : Number.NEGATIVE_INFINITY
    if (current && segment.startedAt <= currentEnd + joinMs) current.push(segment)
    else groups.push([segment])
  }
  return groups.map(group => {
    const first = group[0]
    const active = group.some(segment => segment.endedAt === null)
    const endedAt = active ? null : Math.max(...group.map(endAt))
    const reasons = new Set(group.map(segment => segment.endReason))
    const endReason = active ? null : reasons.has('combat-exit') ? 'combat-exit' : 'inactivity'
    return {
      id: `combat-${first.id}`,
      segmentIds: group.map(segment => segment.id),
      startedAt: first.startedAt,
      endedAt,
      lastActivityAt: Math.max(...group.map(segment => segment.lastActivityAt)),
      endReason,
      events: group.reduce((sum, segment) => sum + segment.events, 0),
      connections: new Set(group.map(segment => segment.connectionId)).size,
      ...(dominantTarget(group) ? { dominantTarget: dominantTarget(group) } : {}),
    }
  })
}
