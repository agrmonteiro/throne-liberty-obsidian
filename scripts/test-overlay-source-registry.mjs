import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const file = new URL('../src/engine/overlaySourceRegistry.ts', import.meta.url)
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { OverlaySourceRegistry } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const registry = new OverlaySourceRegistry()
assert(registry.rememberProfile('A', 7, 'AgrMonteiro'))
assert.deepEqual(registry.entity('A', 7, {}), { name: 'AgrMonteiro' })
assert.equal(registry.rememberProfile('A', 7, 'Outro jogador'), false, 'Dois perfis diferentes tornam a entidade conflitante')
assert.deepEqual(registry.entity('A', 7, {}), {}, 'Perfil conflitante não deve manter nome antigo')
registry.rememberObservedLabel('A', 88, 'Êxodo')
assert.deepEqual(registry.entity('A', 88, {}), { name: 'Êxodo' }, 'Rótulo observado não vira perfil')
assert(registry.rememberNpc('A', 99, 200))
assert.deepEqual(registry.entity('A', 99, { 200: 'Chefe de teste' }), { name: 'Chefe de teste', npcId: 200 })
assert.equal(registry.templateId('A', 99), 200)
assert(registry.rememberNpc('A', 99, 201))
assert.deepEqual(registry.entity('A', 99, { 200: 'Chefe de teste', 201: 'Outro chefe' }), {}, 'Templates conflitantes não recebem nome')
registry.close('A')
assert.deepEqual(registry.entity('A', 88, {}), {}, 'Fechar a conexão elimina todos os IDs transitórios')
console.log('overlay source registry: OK')
