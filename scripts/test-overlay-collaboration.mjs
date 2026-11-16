import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const file = new URL('../src/engine/overlayCollaboration.ts', import.meta.url)
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { CollaborationRoom, validCollaborationContribution, matchEncounter } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const contribution = (participantId, name, total, revision = 1, evidence = 'profile') => ({
  roomId: 'room-1', encounterId: 'pull-1', participantId, revision, observedAt: 1000 + revision,
  character: { name, evidence }, total, hits: Math.floor(total / 10),
  skills: [{ skillId: 10, damage: total, hits: Math.floor(total / 10) }],
  targets: [{ npcTemplateId: 200, damage: total, hits: Math.floor(total / 10) }, { damage: 5, hits: 1 }],
})
const room = new CollaborationRoom('room-1', 'pull-1')
assert(room.upsert(contribution('a', 'AgrMonteiro', 100)))
assert(room.upsert(contribution('b', 'Ortiga', 250)))
let state = room.snapshot()
assert.equal(state.total, 350); assert.equal(state.hits, 35)
assert.deepEqual(state.skills, [{ skillId: 10, damage: 350, hits: 35 }])
assert.deepEqual(state.targets, [{ npcTemplateId: 200, damage: 350, hits: 35 }], 'Alvos sem template não podem ser fundidos entre clientes')
assert(room.upsert(contribution('a', 'AgrMonteiro', 130, 2)))
assert.equal(room.snapshot().total, 380, 'Snapshot novo substitui, não duplica, a contribuição do participante')
assert.equal(room.upsert(contribution('a', 'AgrMonteiro', 90, 1)), false, 'Revisão antiga não volta o acumulado')
assert(room.upsert(contribution('c', 'agrmonteiro', 500)))
state = room.snapshot()
assert.equal(state.total, 250, 'Conflito de personagem exclui as duas contribuições até resolução')
assert.equal(state.sources.filter(row => row.conflict).length, 2)
assert(room.upsert(contribution('d', 'SemPerfil', 999, 1, 'unresolved')))
assert.equal(room.snapshot().total, 250, 'Leitura sem perfil não vira contribuição autoritativa')
assert.equal(validCollaborationContribution({}), false)
assert(room.remove('c')); assert.equal(room.snapshot().total, 380)
const encounter = { gameBuild: '26231302', instanceHash: 'scope-a', targetTemplateId: 200, startedAtRelayMs: 100000 }
assert.equal(matchEncounter(encounter, { ...encounter, startedAtRelayMs: 112000 }), 'same')
assert.equal(matchEncounter(encounter, { ...encounter, instanceHash: 'scope-b' }), 'different')
assert.equal(matchEncounter(encounter, { gameBuild: '26231302', targetTemplateId: 200, startedAtRelayMs: 100000 }), 'ambiguous', 'Mesmo boss sem instância não deve misturar pulls diferentes')
console.log('overlay collaboration: OK')
