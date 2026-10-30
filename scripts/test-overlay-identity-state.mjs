import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const code = ts.transpileModule(fs.readFileSync(new URL('../src/engine/overlayMeter.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { OverlayIdentity, OverlayMeter, overlaySourceWarning } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const tracker = new OverlayIdentity()
const meter = new OverlayMeter()
const event = (sourceId, time, damage = 100) => ({ sourceId, time, damage, skillId: 10, criticalCandidate: false, heavyCandidate: 0 })
assert.equal(meter.add(event(7962980, 1)), false, 'Primeiro dano de um NPC não pode selecionar a origem no fluxo de produção')
assert.equal(tracker.snapshot(), null)
assert.equal(tracker.identify(8075232, 'connection-A', 1000), 'changed')
assert.equal(tracker.identify(8075232, 'connection-A', 1100), 'same', 'Flags de ataque repetidas não abrem outra medição')
meter.selectSource(tracker.snapshot().sourceId, 1000)
assert.equal(meter.add(event(8075232, 2)), true)
assert.equal(meter.add(event(7962980, 3, 99999)), false)
assert.equal(tracker.snapshot().sourceId, 8075232, 'Dano maior ou inatividade de outra origem não muda o personagem')
assert.equal(tracker.identify(999, 'connection-A', 5000), 'changed', 'Troca de entidade na mesma conexão deve ser reconhecida')
assert.equal(tracker.identify(8075232, 'connection-A', 10000), 'changed', 'Entidade anterior pode ser novamente controlada com evidência nova')
assert.equal(tracker.identify(8075232, 'connection-B', 11000), 'changed', 'Novo transporte gera outra sessão mesmo com ID numérico igual')
assert.equal(tracker.identify(999, 'connection-A', 12000), 'ignored', 'Pacotes tardios da conexão anterior não podem roubar a seleção')
assert.equal(tracker.accepts('connection-A'), false)
assert.equal(tracker.accepts('connection-B'), true)
assert.equal(tracker.identify(123, 'connection-B', 9000), 'ignored')
for (const [id, connection, at] of [[0, 'B', 12000], [-1, 'B', 12000], [2**54, 'B', 12000], [1, '', 12000], [1, null, 12000], [1, 'B', NaN]]) {
  assert.equal(tracker.identify(id, connection, at), 'ignored')
}
tracker.clear()
assert.equal(tracker.snapshot(), null)
assert.equal(tracker.accepts('connection-B'), false)
assert.equal(tracker.identify(7, 'connection-A', 1), 'changed', 'Nova captura permite reconhecer conexões novas sem transportar entidade antiga')
const stale = { status: 'live', mode: 'live', config: { sourceId: 7 }, session: { idleSec: 40 },
  sources: [{ id: 7, damage: 100, lastDamageAt: 1000 }, { id: 8, damage: 99999, lastDamageAt: 40000 }] }
assert.match(overlaySourceWarning(stale), /outras entidades estão ativas/)
stale.config.sourceId = null
assert.match(overlaySourceWarning(stale), /seu personagem/)
console.log('OK: identidade local, NPC inicial, troca de entidade/conexão, ID reutilizado, evento tardio e origem inativa.')
