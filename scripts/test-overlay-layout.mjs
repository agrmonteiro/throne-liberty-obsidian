import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const input = fs.readFileSync(new URL('../src/engine/overlayLayout.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { overlayBounds, overlayAnchor, overlayHasFocus, overlaySceneActive } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const config = { scale: 1, fontSize: 13, anchors: { total: { x: .25, y: .75 } }, controlsExpanded: true }
const game = { x: -1600, y: 100, width: 1280, height: 720 }
const first = overlayBounds('total', config, game)
const moved = overlayBounds('total', config, { ...game, x: 200, y: 300 })
assert.equal(moved.x - first.x, 1800, 'Movimento do jogo deve transportar o painel, inclusive entre monitores')
assert.equal(moved.y - first.y, 200)
assert.deepEqual(overlayAnchor(first, game), config.anchors.total)
const small = { x: 100, y: 100, width: 240, height: 180 }
for (const panel of ['total', 'skills', 'controls']) {
  const rect = overlayBounds(panel, config, small)
  assert(rect.x >= small.x && rect.y >= small.y)
  assert(rect.x + rect.width <= small.x + small.width)
  assert(rect.y + rect.height <= small.y + small.height)
}
const resized = overlayBounds('total', config, { ...game, width: 1920, height: 1080 })
const anchor = overlayAnchor(resized, { ...game, width: 1920, height: 1080 })
assert(Math.abs(anchor.x - .25) < .001 && Math.abs(anchor.y - .75) < .001, 'Resize deve manter a ancoragem proporcional')
const migrated = overlayBounds('total', { scale: 1, totalBounds: { x: 9000, y: -4000, width: 340, height: 300 } }, game)
assert.equal(migrated.x + migrated.width, game.x + game.width)
assert.equal(migrated.y, game.y, 'Posições antigas fora da tela devem voltar para dentro do jogo')
assert.equal(overlayBounds('controls', { ...config, controlsExpanded: false }, game).height, 48)
assert.equal(overlayBounds('controls', config, game).height, 568)
console.log('OK: ancoragem relativa, movimento entre monitores, resize, área pequena, migração e controle recolhido.')
const controls = [{ handle: '100', focused: false, requested: true }]
assert.equal(overlayHasFocus({ foreground: '100' }, controls), true)
assert.equal(overlayHasFocus({ foreground: '200', foregroundOwner: '100' }, controls), true)
assert.equal(overlayHasFocus({ foreground: '200', foregroundOwner: '999', foregroundAncestors: ['200', '100', '999'] }, controls), true,
  'Popup com proprietário intermediário deve manter os painéis visíveis')
assert.equal(overlayHasFocus({ foreground: '200' }, [{ ...controls[0], focused: true }]), true,
  'Foco nativo do Electron deve cobrir transição antes de o monitor Win32 atualizar')
assert.equal(overlayHasFocus({ foreground: '100' }, [{ ...controls[0], requested: false }]), false,
  'Janela desabilitada não deve manter o overlay ativo')
assert.equal(overlayHasFocus({ foreground: '300', foregroundOwner: '300' }, controls), false,
  'Outro aplicativo deve ocultar os painéis')
assert.equal(overlayHasFocus({}, controls), false)
assert.equal(overlaySceneActive({ active: true }, true, controls), true,
  'Ao voltar ao jogo, o foco real do Windows prevalece sobre cache antigo do Electron')
assert.equal(overlaySceneActive({ active: false, foreground: '300' }, true, controls), false)
assert.equal(overlaySceneActive({ active: false }, false, [{ ...controls[0], focused: true }]), true)
assert.equal(overlaySceneActive({ active: true }, false, controls), true)
assert.equal(overlaySceneActive({ active: false }, false, controls), false)
console.log('OK: foco do painel, foco do Electron, popups vinculados, painel desativado e outro aplicativo.')
