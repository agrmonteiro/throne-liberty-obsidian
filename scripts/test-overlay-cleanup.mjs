import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const load = async filename => {
  const input = fs.readFileSync(new URL(filename, import.meta.url), 'utf8')
  const code = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}
const { clearMeterLogFiles } = await load('../electron/main/overlayCleanup.ts')
const { OverlayUnknownLog } = await load('../electron/main/overlayUnknownLog.ts')
const root = fs.mkdtempSync(path.resolve('capturas_treinamento/cleanup-qa-'))
const keep = path.join(root, 'logs', 'outro-modulo')
fs.mkdirSync(keep, { recursive: true })
fs.writeFileSync(path.join(keep, 'preservar.txt'), 'preservar')
const target = path.join(root, 'logs', 'dps-meter')
const logger = new OverlayUnknownLog(path.join(target, 'unknown-skills'), {})
const event = { time: 1700000000, skillId: 999, sourceId: 7, damage: 100, criticalCandidate: false, heavyCandidate: 0 }
const context = { mode: 'live', accepted: true, selectedSourceId: 7, captureId: 'qa' }
logger.record(event, context); logger.flush()
logger.record(event, context) // lote antigo ainda pendente
clearMeterLogFiles(root)
logger.resetAfterClear(); logger.flush()
assert.equal(fs.existsSync(target), false, 'Limpeza remove arquivos do medidor e descarta lote antigo')
assert.equal(fs.readFileSync(path.join(keep, 'preservar.txt'), 'utf8'), 'preservar')
assert.equal(logger.status().events, 0)
logger.record({ ...event, damage: 200 }, context); logger.flush()
const summary = JSON.parse(fs.readFileSync(path.join(logger.directory, 'summary.json'), 'utf8'))
assert.equal(summary.events, 1)
assert.equal(summary.skills[0].damage, 200, 'Novos eventos podem gravar depois da limpeza')
clearMeterLogFiles(root)
const outside = path.join(root, 'fora')
fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'sentinela.txt'), 'intacto')
fs.symlinkSync(outside, target, process.platform === 'win32' ? 'junction' : 'dir')
assert.throws(() => clearMeterLogFiles(root), /link/)
assert.equal(fs.readFileSync(path.join(outside, 'sentinela.txt'), 'utf8'), 'intacto')
console.log('OK: limpeza restrita, outros logs preservados, lote descartado, gravação retomada e links recusados.')
