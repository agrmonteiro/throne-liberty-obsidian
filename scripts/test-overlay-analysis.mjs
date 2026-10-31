import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const compile = async file => {
  const code = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}
const { analyzeRows, hitAverage, metricData, metricRate, comparableEncounters, compareMetrics, metricCsv } = await compile('../src/engine/overlayAnalysis.ts')
const { OverlayMeter } = await compile('../src/engine/overlayMeter.ts')
const meter = new OverlayMeter(7, { 10: 'Bênção', 11: 'Raio' })
const hit = (time, damage, skillId = 10, sourceId = 7, targetId = 8) => ({ time, damage, skillId, sourceId, targetId, criticalCandidate: true, heavyCandidate: 1 })
meter.add(hit(1, 100)); meter.add(hit(2, 200)); meter.add(hit(3, 400, 11))
meter.add(hit(4, 150, 11, 8, 7))
meter.addHealing({ time: 5, healing: 120, sourceId: 7, targetId: 7, skillId: 10, effectId: 1, coverage: 'self-periodic' })
meter.setPaused(true, 11000)
const session = meter.snapshot(50000), original = structuredClone(session)
assert.equal(session.elapsedSec, 10)
assert.equal(metricRate(session.total, session.elapsedSec), session.dps)
assert.equal(metricData(session, 'healingDone').total, 120)
assert.equal(metricData(session, 'healingDone').rateLabel, 'HPS bruto')
assert.equal(metricData(session, 'receivedSkills').total, 150)
assert.equal(metricData(session, 'receivedSources').rows[0].key, '8')
assert.equal(metricData(session, 'receivedSources').rows[0].sourceSkills[0].damage, 150)
const oldSingle = structuredClone(session)
delete oldSingle.received.sources[0].skills
assert.equal(metricData(oldSingle, 'receivedSources').rows[0].sourceSkills[0].damage, 150, 'Uma única fonte permite recuperar exatamente o detalhe antigo')
const oldMultiple = structuredClone(oldSingle)
oldMultiple.received.sources.push({ id: 9, damage: 60, hits: 1 })
assert.equal(metricData(oldMultiple, 'receivedSources').rows[0].sourceSkills, undefined, 'Não distribuir o agregado global entre fontes antigas por adivinhação')
const oldInconsistent = structuredClone(oldSingle)
oldInconsistent.received.sources[0].damage++
assert.equal(metricData(oldInconsistent, 'receivedSources').rows[0].sourceSkills, undefined, 'Fallback de uma fonte exige reconciliação de dano e acertos')
assert.equal(metricData(session, 'healingReceived').total, 120)
assert.equal(metricData({ ...session, healing: undefined }, 'healingDone').available, false)
assert.equal(metricData({ ...session, received: undefined }, 'receivedSkills').available, false)
assert.equal(metricRate(50, 0), 0)
assert.equal(metricRate(50, 0.5), 0)
assert.equal(metricRate(50, Infinity), 0)
const rows = metricData(session, 'damage').rows
assert.equal(analyzeRows(rows, 'bencao', 'damage', false)[0].damage, 300)
assert.equal(analyzeRows(rows, '11', 'damage', false)[0].name, 'Raio')
assert.equal(analyzeRows(rows, 'não existe', 'name', true).length, 0)
assert.deepEqual(analyzeRows(rows, '', 'hits', false).map(row => row.name), ['Bênção', 'Raio'])
assert.deepEqual(analyzeRows(rows, '', 'average', false).map(row => row.name), ['Raio', 'Bênção'])
assert.deepEqual(analyzeRows(rows, '', 'damage', true).map(row => row.name), ['Bênção', 'Raio'])
assert.deepEqual(analyzeRows(rows, '', 'name', true).map(row => row.name), ['Bênção', 'Raio'])
assert.equal(hitAverage(rows.find(row => row.name === 'Bênção')), 150)
assert.equal(hitAverage({ damage: 0, hits: 0 }), 0)
assert.equal(analyzeRows(rows, 'bencao', 'damage', false)[0].damage / session.total, 300 / 700, 'Filtrar não muda a participação da habilidade')
assert.deepEqual(session, original, 'Busca, ordenação e consultas não alteram o acumulado')

const encounter = { id: 'a', sourceName: 'AgrMonteiro', sourceId: 7, mode: 'live', attributionVersion: 2, captureId: 'capture', connectionId: 'one', session }
assert.equal(comparableEncounters(encounter, { ...encounter, id: 'b', sourceId: 99, connectionId: 'two' }), true, 'Perfil confirmado permite comparar sessões de entidades diferentes')
assert.equal(comparableEncounters(encounter, encounter), false)
assert.equal(comparableEncounters(encounter, { ...encounter, id: 'b', sourceName: 'Outro' }), false)
assert.equal(comparableEncounters(encounter, { ...encounter, id: 'b', sourceName: 'AgrMonteiró' }), false, 'Busca sem acentos não deve relaxar identidade de personagem')
assert.equal(comparableEncounters(encounter, { ...encounter, id: 'b', mode: 'replay' }), false)
assert.equal(comparableEncounters(encounter, { ...encounter, id: 'b', attributionVersion: 1 }), false)
assert.equal(comparableEncounters({ ...encounter, sourceName: undefined }, { ...encounter, id: 'b', sourceName: undefined }), true)
assert.equal(comparableEncounters({ ...encounter, sourceName: undefined }, { ...encounter, id: 'b', sourceName: undefined, captureId: 'other' }), false, 'ID numérico reutilizado em outra captura não confirma identidade')
assert.equal(comparableEncounters({ ...encounter, sourceName: undefined, connectionId: null }, { ...encounter, id: 'b', sourceName: undefined, connectionId: null }), false, 'Dois vínculos ausentes não confirmam a mesma conexão')

const reference = structuredClone(session)
reference.elapsedSec = 20
reference.skills[0].name = 'Nome antigo'
reference.skills[0].key = 'chave antiga'
reference.skills.push({ ...reference.skills[0], key: 'exclusiva', name: 'Só na referência', skillIds: [88], damage: 100 })
reference.total += 100
let compared = compareMetrics(session, reference, 'damage', 'rate')
assert.equal(compared.find(row => row.name === 'Raio').reference, 20, 'Duração de cada sessão deve ser usada separadamente')
assert.equal(compared.find(row => row.name === 'Raio').current, 40)
assert.equal(compared.find(row => row.name === 'Raio').percent, 100)
assert.equal(compared.find(row => row.name === 'Só na referência').current, 0)
assert.equal(compared.find(row => row.name === 'Só na referência').percent, -100)
assert.equal(compared.reduce((sum, row) => sum + row.reference, 0), reference.total / reference.elapsedSec)
assert.equal(compared.reduce((sum, row) => sum + row.current, 0), session.total / session.elapsedSec)
compared = compareMetrics(session, { ...reference, skills: [] }, 'damage', 'total')
assert.equal(compared[0].percent, null, 'Uma habilidade nova não tem variação percentual infinita')
assert.equal(compareMetrics(session, { ...reference, healing: undefined }, 'healingDone', 'rate').length, 0)
const csv = metricCsv(session, 'damage')
assert.ok(csv.startsWith('\uFEFF'))
assert.ok(csv.includes('"Bênção";"10";"300";'))
assert.ok(csv.includes('"DPS"'))
assert.ok(metricCsv(session, 'healingDone').includes('Autocura bruta experimental; cobertura parcial'))
const malicious = structuredClone(session)
malicious.skills[0].name = '=HYPERLINK("test")'
assert.ok(metricCsv(malicious, 'damage').includes('"\'=HYPERLINK(""test"")"'), 'Nomes em CSV devem ser texto e não fórmulas')
malicious.skills[0].name = '   =HYPERLINK("test")'
assert.ok(metricCsv(malicious, 'damage').includes('"\'   =HYPERLINK(""test"")"'))
assert.deepEqual(session, original)
console.log('OK: métricas, busca com acentos/IDs, ordenação, médias, pausa, histórico compatível, taxas independentes, habilidades ausentes, dados antigos e CSV seguro; acumulado preservado.')
