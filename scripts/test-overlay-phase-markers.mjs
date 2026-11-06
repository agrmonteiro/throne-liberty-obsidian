import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''))
const output = ts.transpileModule(fs.readFileSync(path.join(root, 'src/engine/overlayPhaseMarkers.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText
const module = { exports: {} }
new Function('require', 'module', 'exports', output)(require, module, module.exports)
const { OverlayPhaseMarkers, MAX_PHASE_MARKER_TEXT_LENGTH } = module.exports

const markers = new OverlayPhaseMarkers()
assert.equal(markers.setMarker('segment-a', 30, 'Fase final')?.text, 'Fase final')
markers.setMarker('segment-a', 10, 'Início')
markers.setMarker('segment-b', 20, 'Pausa')
assert.deepEqual(markers.getMarkers('segment-a').map(m => m.timestamp), [10, 30])
assert.equal(markers.editMarker('segment-a', 30, 'Transição')?.text, 'Transição')
assert.equal(markers.editMarker('segment-a', 99, 'Inexistente'), null)

const prior = markers.snapshot()
assert(Object.isFrozen(prior) && Object.isFrozen(prior[0]))
assert.throws(() => { prior[0].text = 'alterado' }, TypeError)
markers.setMarker('segment-a', 10, 'Novo início')
assert.equal(prior.find(m => m.timestamp === 10 && m.segmentId === 'segment-a').text, 'Início', 'Snapshot preserva estado anterior')

assert.equal(markers.setMarker('segment-a', -1, 'Inválido'), null)
assert.equal(markers.setMarker('segment-a', Infinity, 'Inválido'), null)
assert.equal(markers.setMarker('segment-a', 40, '  '), null)
assert.equal(markers.setMarker('segment-a', 40, 'x'.repeat(MAX_PHASE_MARKER_TEXT_LENGTH + 1)), null)
assert.equal(markers.removeMarker('segment-a', 10), true)
assert.equal(markers.removeMarker('segment-a', 10), false)
assert.deepEqual(markers.getMarkers('segment-a').map(m => m.timestamp), [30])
assert.equal(markers.getMarkers('segment-b')[0].text, 'Pausa', 'Remoção respeita segmento')
console.log('OK: CRUD manual, validação, ordenação e snapshots imutáveis de marcadores de fase.')
