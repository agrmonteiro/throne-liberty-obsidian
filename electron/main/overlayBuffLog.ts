import fs from 'fs'
import path from 'path'
import type { BuffResult } from '../../src/engine/overlayBuffs'

/** JSONL bruto de todas as entidades. Identidade nominal pode chegar depois do efeito. */
export class OverlayBuffLog {
  private file: string | null = null
  private pending: string[] = []
  private bytes = 0
  private events = 0
  private error: string | null = null
  constructor(private directory: string, private limit = 256 * 1024 * 1024) {}
  start(captureId: string): void {
    this.flush()
    this.file = path.join(this.directory, `${captureId.replace(/[^a-zA-Z0-9-]/g, '_')}.jsonl`)
    this.pending = []; this.bytes = 0; this.events = 0; this.error = null
    try {
      fs.mkdirSync(this.directory, { recursive: true })
      // Nunca sobrescrever uma captura anterior, mesmo em caso de colisão de nome.
      fs.closeSync(fs.openSync(this.file, 'ax'))
      this.append({ type: 'capture-start', schemaVersion: 1, captureId, time: Date.now()/1000 })
    } catch { this.error = 'Não foi possível abrir o registro de buffs. Os arquivos anteriores foram preservados.' }
  }
  append(row: Record<string, unknown>): void {
    if (!this.file || this.error) return
    const line = `${JSON.stringify(row)}\n`, size = Buffer.byteLength(line)
    if (this.bytes + size > this.limit) { this.flush(); this.error = 'Registro de buffs atingiu 256 MiB nesta captura. Inicie outra leitura para continuar salvando; a visualização permanece ativa.'; return }
    this.pending.push(line); this.bytes += size
    if (row.type === 'buff') this.events++
    if (this.pending.length >= 500) this.flush()
  }
  flush(): void {
    if (!this.file || !this.pending.length) return
    const block = this.pending.join(''); this.pending = []
    try { fs.appendFileSync(this.file, block) }
    catch { this.error = 'Não foi possível salvar os eventos de buffs no disco.' }
  }
  resetAfterClear(captureId: string, active: boolean): void {
    this.pending = []; this.file = null; this.bytes = 0; this.events = 0; this.error = null
    if (active) this.start(captureId)
  }
  status(): BuffResult['journal'] { return { file: this.file, events: this.events, bytes: this.bytes, error: this.error } }
}
