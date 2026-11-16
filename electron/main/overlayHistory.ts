import fs from 'fs'
import path from 'path'
import type { OverlayEncounter, OverlayHistoryResult } from '../../src/engine/overlayMeter'

export class OverlayHistory {
  private encounters: OverlayEncounter[] = []
  private error: string | null = null
  constructor(private file: string) {
    try {
      if (!fs.existsSync(file)) return
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      if (!Array.isArray(data) || !data.every(row => row && typeof row.id === 'string'
        && ['live', 'replay'].includes(row.mode) && row.session && Number.isFinite(row.session.total)
        && Number.isFinite(row.session.startedAt) && Array.isArray(row.session.skills))) throw Error('Formato inválido')
      this.encounters = data.slice(0, 20)
    } catch (error) { this.error = `Não foi possível ler o histórico: ${String(error)}` }
  }
  /**
   * `rename` não substitui o destino no Windows e pode falhar com EPERM quando
   * o Explorer/antivírus ainda observa o arquivo. Copiar o tmp sobre o destino
   * preserva a gravação completa sem apagar o histórico antes da substituição.
   */
  private replace(contents: string): void {
    const temporary = `${this.file}.${process.pid}.${Date.now()}.tmp`
    fs.writeFileSync(temporary, contents, 'utf8')
    try {
      fs.copyFileSync(temporary, this.file)
    } finally {
      try { fs.unlinkSync(temporary) } catch { /* arquivo temporário já foi removido */ }
    }
  }
  list(): OverlayHistoryResult {
    // Versões anteriores fechavam o histórico sempre que o túnel renovava uma
    // conexão ou a origem era refinada. Esses snapshots são cumulativos e
    // ocupavam os 20 lugares com a mesma sessão. Mantemos o mais completo por
    // captura e preservamos os cortes reais (fim de combate, reset e grupos).
    const hidden = new Set<string>()
    const transient = new Set(['connection-end', 'entity-change', 'status-profile', 'profile-name'])
    const byCapture = new Map<string, OverlayEncounter[]>()
    for (const encounter of this.encounters) if (encounter.captureId && transient.has(encounter.reason) && !encounter.groupEncounter) {
      const rows = byCapture.get(encounter.captureId) ?? []
      rows.push(encounter); byCapture.set(encounter.captureId, rows)
    }
    for (const rows of byCapture.values()) {
      const keep = rows.slice().sort((a, b) => (b.combatSegments?.length ?? 0) - (a.combatSegments?.length ?? 0)
        || b.savedAt - a.savedAt)[0]
      for (const row of rows) if (row.id !== keep.id) hidden.add(row.id)
    }
    return { encounters: structuredClone(this.encounters.filter(encounter => !hidden.has(encounter.id))), error: this.error }
  }
  clear(): boolean {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      this.replace('[]')
      this.encounters = []; this.error = null
      return true
    } catch (error) { this.error = `Não foi possível limpar o histórico: ${String(error)}`; return false }
  }
  upsert(encounter: OverlayEncounter): void {
    const hasGroupDamage = Boolean(encounter.groupConnections?.some(connection => connection.sources.some(source => source.session.hits > 0)))
    if (this.error || (encounter.session.hits === 0 && !encounter.session.received?.hits && !encounter.session.healing?.done.hits && !encounter.session.timed && !hasGroupDamage) || encounter.session.startedAt === null) return
    const previous = this.encounters.find(row => row.id === encounter.id)
    if (previous && previous.session.lastDamageAt === encounter.session.lastDamageAt
      && previous.session.total === encounter.session.total && previous.reason === encounter.reason
      && previous.session.received?.total === encounter.session.received?.total
      && JSON.stringify(previous.session.received?.sources) === JSON.stringify(encounter.session.received?.sources)
      && JSON.stringify(previous.session.targets) === JSON.stringify(encounter.session.targets)
      && previous.session.healing?.done.total === encounter.session.healing?.done.total
      && previous.session.timed?.endsAt === encounter.session.timed?.endsAt
      && previous.session.timed?.cancelled === encounter.session.timed?.cancelled
      && previous.session.paused === encounter.session.paused
      && JSON.stringify(previous.groupConnections) === JSON.stringify(encounter.groupConnections)
      && JSON.stringify(previous.combatSegments) === JSON.stringify(encounter.combatSegments)
      && JSON.stringify(previous.combatEncounters) === JSON.stringify(encounter.combatEncounters)
      && JSON.stringify(previous.groupEncounter) === JSON.stringify(encounter.groupEncounter)
      && previous.sourceName === encounter.sourceName && previous.attributionVersion === encounter.attributionVersion) return
    const next = [structuredClone(encounter), ...this.encounters.filter(row => row.id !== encounter.id)].slice(0, 20)
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      this.replace(JSON.stringify(next))
      this.encounters = next
    } catch (error) { this.error = `Não foi possível gravar o histórico: ${String(error)}` }
  }
}
