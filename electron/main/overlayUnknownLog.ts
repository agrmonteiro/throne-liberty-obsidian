import fs from 'fs'
import path from 'path'
import type { MeterEvent, DamageKind } from '../../src/engine/overlayMeter'

interface Context { mode: 'live' | 'replay'; accepted: boolean; selectedSourceId: number | null; captureId: string }
interface Summary {
  skillId: number; mode: Context['mode']; events: number; damage: number; acceptedEvents: number; acceptedDamage: number
  firstSeen: number; lastSeen: number; minDamage: number; maxDamage: number
  sources: Record<string, { events: number; damage: number }>; kinds: Record<DamageKind, number>
}

/** Log auxiliar de mapeamento. Não é um histórico completo de combate. */
export class OverlayUnknownLog {
  private queue: string[] = []
  private summary = new Map<string, Summary>()
  private part = 1
  private bytes = 0
  private events = 0
  private failure: string | null = null
  directory: string
  constructor(private root: string, private names: Record<string, string>, private maxBytes = 5 * 1024 * 1024) {
    this.directory = path.join(root, `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`)
  }
  resetAfterClear(): void {
    this.queue = []; this.summary.clear(); this.events = 0
    this.part = 1; this.bytes = 0; this.failure = null
    this.directory = path.join(this.root, `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`)
  }
  status(): { directory: string; events: number; ids: number; error: string | null } {
    return { directory: this.directory, events: this.events,
      ids: new Set([...this.summary.values()].map(row => row.skillId)).size, error: this.failure }
  }
  record(event: MeterEvent, context: Context): void {
    if (this.failure || this.names[String(event.skillId)] || !Number.isSafeInteger(event.skillId)
      || !Number.isSafeInteger(event.sourceId) || event.sourceId <= 0 || !Number.isFinite(event.time)
      || Math.abs(event.time * 1000) > 8.64e15 || !Number.isFinite(event.damage) || event.damage <= 0) return
    const kind: DamageKind = event.criticalCandidate
      ? (event.heavyCandidate ? 'criticalHeavy' : 'critical') : (event.heavyCandidate ? 'heavy' : 'normal')
    const key = `${context.mode}:${event.skillId}`
    const row = this.summary.get(key) ?? { skillId: event.skillId, mode: context.mode, events: 0, damage: 0,
      acceptedEvents: 0, acceptedDamage: 0, firstSeen: event.time, lastSeen: event.time,
      minDamage: event.damage, maxDamage: event.damage, sources: {},
      kinds: { normal: 0, critical: 0, heavy: 0, criticalHeavy: 0 } }
    row.events++; row.damage += event.damage; row.kinds[kind]++
    if (context.accepted) { row.acceptedEvents++; row.acceptedDamage += event.damage }
    row.firstSeen = Math.min(row.firstSeen, event.time); row.lastSeen = Math.max(row.lastSeen, event.time)
    row.minDamage = Math.min(row.minDamage, event.damage); row.maxDamage = Math.max(row.maxDamage, event.damage)
    const source = row.sources[String(event.sourceId)] ?? { events: 0, damage: 0 }
    source.events++; source.damage += event.damage; row.sources[String(event.sourceId)] = source
    this.summary.set(key, row); this.events++
    this.queue.push(JSON.stringify({ type: 'unknown-skill', schemaVersion: 1, receivedAt: new Date().toISOString(),
      eventAt: new Date(event.time * 1000).toISOString(), ...event, ...context, kind }) + '\n')
    if (this.queue.length >= 250) this.flush()
  }
  flush(): void {
    if (!this.queue.length || this.failure) return
    try {
      fs.mkdirSync(this.directory, { recursive: true })
      for (const line of this.queue) {
        const bytes = Buffer.byteLength(line)
        if (this.bytes > 0 && this.bytes + bytes > this.maxBytes) { this.part++; this.bytes = 0 }
        fs.appendFileSync(path.join(this.directory, `events-${String(this.part).padStart(4, '0')}.jsonl`), line)
        this.bytes += bytes
      }
      this.queue = []
      const summaryFile = path.join(this.directory, 'summary.json')
      fs.writeFileSync(`${summaryFile}.tmp`, JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(),
        events: this.events, skills: [...this.summary.values()].sort((a, b) => b.events - a.events) }, null, 2))
      fs.renameSync(`${summaryFile}.tmp`, summaryFile)
    } catch (error) {
      this.failure = `Falha ao gravar IDs sem nome: ${error instanceof Error ? error.message : String(error)}`
      this.queue = []
    }
  }
}
