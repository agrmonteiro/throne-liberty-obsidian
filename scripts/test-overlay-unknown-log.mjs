import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const input = fs.readFileSync(new URL('../electron/main/overlayUnknownLog.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { OverlayUnknownLog } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const root = fs.mkdtempSync(path.resolve('capturas_treinamento/unknown-log-qa-'))
const logger = new OverlayUnknownLog(root, { 10: 'Conhecida' }, 600)
const event = { time: 1700000000, skillId: 999, sourceId: 7, damage: 100, criticalCandidate: true, heavyCandidate: 1 }
const context = { mode: 'live', accepted: true, selectedSourceId: 7, captureId: 'teste' }
logger.record({ ...event, skillId: 10 }, context)
logger.record(event, context)
logger.record({ ...event, time: event.time + 1, damage: 200, sourceId: 8 }, { ...context, accepted: false })
logger.record(event, { ...context, mode: 'replay' })
logger.flush()
const directory = logger.status().directory
const files = fs.readdirSync(directory).filter(name => name.endsWith('.jsonl'))
assert.ok(files.length > 1, 'Deve dividir arquivos por tamanho')
const events = files.flatMap(file => fs.readFileSync(path.join(directory, file), 'utf8').trim().split('\n').map(JSON.parse))
assert.equal(events.length, 3, 'Conhecida não deve ser registrada')
assert.equal(events[0].kind, 'criticalHeavy')
assert.equal(events[1].accepted, false)
assert.equal(events[2].mode, 'replay')
assert.equal(events[0].eventAt, '2023-11-14T22:13:20.000Z')
const summary = JSON.parse(fs.readFileSync(path.join(directory, 'summary.json'), 'utf8'))
assert.equal(summary.events, 3)
const live = summary.skills.find(row => row.mode === 'live')
assert.equal(live.damage, 300)
assert.equal(live.acceptedDamage, 100)
assert.equal(live.events, 2)
assert.equal(live.sources['8'].damage, 200)
logger.flush()
assert.equal(fs.readdirSync(directory).filter(name => name.endsWith('.jsonl')).length, files.length)
assert.equal(logger.status().ids, 1)
const blocked = path.join(root, 'arquivo-em-vez-de-pasta')
fs.writeFileSync(blocked, 'teste')
const failed = new OverlayUnknownLog(blocked, {})
failed.record(event, context)
assert.doesNotThrow(() => failed.flush(), 'Falha de disco não deve interromper o medidor')
assert.match(failed.status().error, /Falha ao gravar/)
console.log('OK: IDs desconhecidos, eventos live/replay, resumo, origem filtrada, rotação e erro de disco.')
console.log(`Evidências: ${root}`)
