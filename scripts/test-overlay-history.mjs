import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const input = fs.readFileSync(new URL('../electron/main/overlayHistory.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { OverlayHistory } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const root = fs.mkdtempSync(path.resolve('capturas_treinamento/history-qa-'))
const file = path.join(root, 'encounters.json')
const history = new OverlayHistory(file)
const encounter = index => ({ id: String(index), sourceId: 7, mode: 'live', reason: 'reset', savedAt: 1000 + index,
  session: { startedAt: index * 1000, lastDamageAt: index * 1000 + 1000, total: index, hits: 1, skills: [] } })
for (let index = 1; index <= 25; index++) history.upsert(encounter(index))
assert.equal(history.list().encounters.length, 20)
assert.equal(history.list().encounters[0].id, '25')
assert.equal(history.list().encounters.at(-1).id, '6')
history.upsert({ ...encounter(25), reason: 'stop' })
assert.equal(history.list().encounters.length, 20, 'Finalizar não duplica registro')
const restored = new OverlayHistory(file)
assert.equal(restored.list().encounters[0].reason, 'stop')
const copy = restored.list()
copy.encounters[0].session.total = 0
assert.equal(restored.list().encounters[0].session.total, 25, 'Consulta não pode alterar registro')
restored.upsert({ ...encounter(30), session: { ...encounter(30).session, hits: 0 } })
assert.equal(restored.list().encounters[0].id, '25', 'Sessão vazia não ocupa histórico')
restored.upsert({ ...encounter(31), session: { ...encounter(31).session, total: 0, hits: 0,
  received: { total: 100, hits: 2, sources: [{ id: 8, damage: 100, hits: 2 }], skills: [] } } })
assert.equal(new OverlayHistory(file).list().encounters[0].session.received.total, 100, 'Encontro só de dano recebido precisa persistir')
const lateNpcName = restored.list().encounters[0]
lateNpcName.session.received.sources[0].name = 'Guarda do Apóstolo'
lateNpcName.session.received.sources[0].npcId = 10212035
lateNpcName.session.received.sources[0].skills = [{ key: '10', name: 'Golpe', damage: 100, hits: 2, skillIds: [10], critical: 0, heavy: 0,
  damageByKind: { normal: 100, critical: 0, heavy: 0, criticalHeavy: 0 } }]
restored.upsert(lateNpcName)
assert.equal(new OverlayHistory(file).list().encounters[0].session.received.sources[0].name, 'Guarda do Apóstolo', 'Nome que chega sem alterar dano precisa atualizar o arquivo')
assert.equal(new OverlayHistory(file).list().encounters[0].session.received.sources[0].skills[0].damage, 100, 'Detalhes da fonte sobrevivem à reabertura do arquivo')
const corrupt = path.join(root, 'corrupt.json')
fs.writeFileSync(corrupt, 'incompleto')
const broken = new OverlayHistory(corrupt)
assert.match(broken.list().error, /ler o histórico/)
broken.upsert(encounter(1))
assert.equal(fs.readFileSync(corrupt, 'utf8'), 'incompleto', 'Erro não pode destruir arquivo antigo')
assert.equal(restored.clear(), true)
assert.equal(restored.list().encounters.length, 0)
assert.equal(new OverlayHistory(file).list().encounters.length, 0, 'Limpeza precisa persistir')
console.log('OK: últimos 20, ordem, atualização sem duplicar, persistência, leitura isolada e arquivo inválido.')
