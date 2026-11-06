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
  list(): OverlayHistoryResult {
    return { encounters: structuredClone(this.encounters), error: this.error }
  }
  clear(): boolean {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(`${this.file}.tmp`, '[]')
      fs.renameSync(`${this.file}.tmp`, this.file)
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
      && previous.sourceName === encounter.sourceName && previous.attributionVersion === encounter.attributionVersion) return
    const next = [structuredClone(encounter), ...this.encounters.filter(row => row.id !== encounter.id)].slice(0, 20)
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(next))
      fs.renameSync(`${this.file}.tmp`, this.file)
      this.encounters = next
    } catch (error) { this.error = `Não foi possível gravar o histórico: ${String(error)}` }
  }
}
