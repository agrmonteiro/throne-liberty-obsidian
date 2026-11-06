/** Segmentação isolada de eventos de combate por conexão e ator. */
export const DEFAULT_SEGMENT_IDLE_MS = 15_000

export interface CombatSegmentEvent<T = unknown> {
  connectionId: string
  actorId: string | number
  at: number
  data: T
}

export interface CombatSegment<T = unknown> {
  readonly id: number
  readonly connectionId: string
  readonly actorId: string | number
  readonly startedAt: number
  readonly endedAt: number | null
  readonly endReason: 'combat-exit' | 'inactivity' | null
  readonly lastActivityAt: number
  readonly events: readonly CombatSegmentEvent<T>[]
}

type MutableSegment<T> = {
  id: number; connectionId: string; actorId: string | number; startedAt: number
  endedAt: number | null; endReason: CombatSegment<T>['endReason']; lastActivityAt: number
  events: CombatSegmentEvent<T>[]
}

function validScope(connectionId: unknown, actorId: unknown): boolean {
  return typeof connectionId === 'string' && connectionId.length > 0
    && ((typeof actorId === 'string' && actorId.length > 0)
      || (typeof actorId === 'number' && Number.isSafeInteger(actorId)))
}

function cloneFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return Object.freeze(value.map(cloneFreeze)) as T
  const copy: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) copy[key] = cloneFreeze(item)
  return Object.freeze(copy) as T
}

function snapshot<T>(segment: MutableSegment<T>): CombatSegment<T> {
  return Object.freeze({ ...segment, events: Object.freeze(segment.events.map(event => cloneFreeze(event))) })
}

/** Mantém sessões independentes para cada par conexão/ator. */
export class OverlaySegments<T = unknown> {
  private readonly scopes = new Map<string, Map<string | number, { active: MutableSegment<T> | null; closed: MutableSegment<T>[] }>>()
  private nextId = 1

  constructor(readonly inactivityMs = DEFAULT_SEGMENT_IDLE_MS) {
    if (!Number.isFinite(inactivityMs) || inactivityMs <= 0) throw new RangeError('inactivityMs deve ser positivo')
  }

  clear(): void {
    this.scopes.clear()
    this.nextId = 1
  }

  private scope(connectionId: string, actorId: string | number, create = false) {
    let actors = this.scopes.get(connectionId)
    if (!actors && create) { actors = new Map(); this.scopes.set(connectionId, actors) }
    let entry = actors?.get(actorId)
    if (!entry && create) { entry = { active: null, closed: [] }; actors!.set(actorId, entry) }
    return entry
  }

  private close(entry: { active: MutableSegment<T> | null; closed: MutableSegment<T>[] }, at: number, reason: 'combat-exit' | 'inactivity'): void {
    if (!entry.active) return
    entry.active.endedAt = Math.max(at, entry.active.lastActivityAt)
    entry.active.endReason = reason
    entry.closed.push(entry.active)
    entry.active = null
  }

  enterCombat(connectionId: string, actorId: string | number, at: number): CombatSegment<T> | null {
    if (!validScope(connectionId, actorId) || !Number.isFinite(at)) return null
    const entry = this.scope(connectionId, actorId, true)!
    this.expire(at)
    if (!entry.active) entry.active = { id: this.nextId++, connectionId, actorId, startedAt: at, endedAt: null, endReason: null, lastActivityAt: at, events: [] }
    return snapshot(entry.active)
  }

  exitCombat(connectionId: string, actorId: string | number, at: number): CombatSegment<T> | null {
    if (!validScope(connectionId, actorId) || !Number.isFinite(at)) return null
    this.expire(at)
    const entry = this.scope(connectionId, actorId)
    if (!entry?.active) return null
    this.close(entry, at, 'combat-exit')
    return snapshot(entry.closed[entry.closed.length - 1])
  }

  addEvent(event: CombatSegmentEvent<T>): CombatSegment<T> | null {
    if (!event || !validScope(event.connectionId, event.actorId) || !Number.isFinite(event.at)) return null
    this.expire(event.at)
    const entry = this.scope(event.connectionId, event.actorId, true)!
    if (!entry.active) entry.active = { id: this.nextId++, connectionId: event.connectionId, actorId: event.actorId, startedAt: event.at, endedAt: null, endReason: null, lastActivityAt: event.at, events: [] }
    const active = entry.active
    if (event.at < active.lastActivityAt) return null
    active.lastActivityAt = event.at
    active.events.push(cloneFreeze(event))
    return snapshot(active)
  }

  /** Fecha segmentos cujo prazo de inatividade já venceu. */
  expire(now: number): number {
    if (!Number.isFinite(now)) return 0
    let count = 0
    for (const actors of this.scopes.values()) for (const entry of actors.values()) {
      if (entry.active && now - entry.active.lastActivityAt >= this.inactivityMs) {
        this.close(entry, entry.active.lastActivityAt + this.inactivityMs, 'inactivity')
        count++
      }
    }
    return count
  }

  getSnapshot(connectionId: string, actorId: string | number): { readonly active: CombatSegment<T> | null; readonly closed: readonly CombatSegment<T>[] } {
    const entry = this.scope(connectionId, actorId)
    return Object.freeze({ active: entry?.active ? snapshot(entry.active) : null, closed: Object.freeze((entry?.closed ?? []).map(snapshot)) })
  }

  active(connectionId: string, actorId: string | number): CombatSegment<T> | null {
    const entry = this.scope(connectionId, actorId)
    return entry?.active ? snapshot(entry.active) : null
  }

  snapshotAll(): readonly CombatSegment<T>[] {
    const rows: CombatSegment<T>[] = []
    for (const actors of this.scopes.values()) for (const entry of actors.values()) {
      if (entry.active) rows.push(snapshot(entry.active))
      rows.push(...entry.closed.map(snapshot))
    }
    return Object.freeze(rows.sort((a, b) => a.startedAt - b.startedAt || a.id - b.id))
  }
}
