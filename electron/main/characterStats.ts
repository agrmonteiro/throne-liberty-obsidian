import fs from 'fs'
import path from 'path'
import type { CharacterSnapshot, CharacterStatsResult, CharacterStatValue } from '../../src/engine/characterStats'

export class CharacterStatsLog {
  private buffers = new Map<string, { first: number; last: number; values: Record<string, CharacterStatValue> }>()
  private saved: CharacterSnapshot[] = []
  private error: string | null = null
  constructor(private file: string) {
    try {
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file,'utf8'))
        if (data?.schemaVersion !== 1 || !Array.isArray(data.snapshots) || data.snapshots.length > 5 || !data.snapshots.every(validSnapshot)) throw Error('Formato inválido')
        this.saved = data.snapshots
      }
    } catch { this.error = 'Não foi possível ler as fichas salvas. O arquivo original foi preservado.' }
  }
  reset(): void { this.buffers.clear() }
  retire(connectionId: string): void { this.buffers.delete(connectionId) }
  observe(connectionId: string, time: number, values: Record<string, CharacterStatValue>): boolean {
    if (typeof connectionId !== 'string' || !connectionId.length || connectionId.length > 128 || !Number.isFinite(time) || !validValues(values)) return false
    if (!this.buffers.has(connectionId) && this.buffers.size >= 8) return false
    const old = this.buffers.get(connectionId) ?? { first: time, last: time, values: {} }
    for (const [id,value] of Object.entries(values)) if ((old.values[id]?.time ?? -Infinity) <= time) old.values[id] = { ...structuredClone(value), time }
    old.last = Math.max(old.last,time); this.buffers.set(connectionId,old)
    return true
  }
  get(captureId: string, player: {sourceId: number; connectionId: string} | null, name: string): CharacterStatsResult {
    const buffer = player ? this.buffers.get(player.connectionId) : null
    const live: CharacterSnapshot | null = buffer && player ? { id:`${captureId}:${player.connectionId}`, captureId, connectionId:player.connectionId,
      sourceId:player.sourceId,playerName:name,firstObservedAt:buffer.first,observedAt:buffer.last,values:structuredClone(buffer.values),origin:'live',observedOnly:true } : null
    if (live) this.persist(live)
    return { live, saved:structuredClone(this.saved.filter(row=>!name || row.playerName===name)), error:this.error,
      pending:live ? [] : [...this.buffers].map(([connectionId,row])=>({connectionId,observedAt:row.last,fields:Object.keys(row.values).length})) }
  }
  private persist(snapshot: CharacterSnapshot): void {
    if (this.error || this.saved.some(row=>row.id===snapshot.id && row.observedAt===snapshot.observedAt && JSON.stringify(row.values)===JSON.stringify(snapshot.values))) return
    this.saved=[snapshot,...this.saved.filter(row=>row.id!==snapshot.id)].slice(0,5)
    try { fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(`${this.file}.tmp`,JSON.stringify({schemaVersion:1,snapshots:this.saved}));fs.renameSync(`${this.file}.tmp`,this.file) }
    catch { this.error='Não foi possível salvar a ficha do personagem.' }
  }
}
function validValues(values: unknown): values is Record<string, CharacterStatValue> {
  return Boolean(values && typeof values==='object' && !Array.isArray(values) && Object.keys(values).length<=1024
    && Object.entries(values).every(([id,row])=>/^\d+$/.test(id) && Number(id)>0 && Number(id)<=4096 && row && Number.isSafeInteger(row.total)))
}
function validSnapshot(row: CharacterSnapshot): boolean {
  return Boolean(row && typeof row.id==='string' && typeof row.captureId==='string' && typeof row.connectionId==='string' && typeof row.playerName==='string'
    && Number.isSafeInteger(row.sourceId) && row.sourceId>0
    && Number.isFinite(row.observedAt) && Number.isFinite(row.firstObservedAt) && validValues(row.values))
}
