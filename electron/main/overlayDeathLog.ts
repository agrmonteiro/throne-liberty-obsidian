import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { OverlayDeathRecorder, type DeathReport } from '../../src/engine/overlayDeathLog'

export class OverlayDeathLog {
  readonly recorder: OverlayDeathRecorder
  private error: string | null = null
  constructor(private file: string) {
    let records: DeathReport[] = []
    try {
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'))
        if (data?.schemaVersion !== 1 || !Array.isArray(data.records) || !data.records.every((row: DeathReport) => row
          && typeof row.id === 'string' && Number.isFinite(row.time) && Number.isSafeInteger(row.playerId)
          && typeof row.connectionId === 'string' && typeof row.playerName === 'string'
          && typeof row.captureId === 'string'
          && ['manual', 'state-signal', 'damage-signal'].includes(row.trigger) && ['live', 'replay'].includes(row.mode)
          && Array.isArray(row.events) && row.events.length <= 50 && row.events.every(event => event
            && Number.isFinite(event.time) && ['damage', 'healing', 'state', 'effect'].includes(event.type)
            && (event.sourceId === row.playerId || event.targetId === row.playerId)))) throw Error('Formato inválido')
        records = data.records.slice(0, 20)
      }
    } catch { this.error = 'Não foi possível ler os registros de causa mortis. O arquivo original foi preservado.' }
    this.recorder = new OverlayDeathRecorder(records, randomUUID)
  }
  save(): void {
    if (this.error) return
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(`${this.file}.tmp`, JSON.stringify({ schemaVersion: 1, records: this.recorder.list().records }))
      fs.renameSync(`${this.file}.tmp`, this.file)
    } catch { this.error = 'Não foi possível salvar o registro de causa mortis.' }
  }
  list(): ReturnType<OverlayDeathRecorder['list']> { return { ...this.recorder.list(), error: this.error } }
  status(): ReturnType<OverlayDeathRecorder['status']> { return { ...this.recorder.status(), error: this.error } }
}
