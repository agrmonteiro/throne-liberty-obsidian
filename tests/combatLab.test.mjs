import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundled = await build({ entryPoints: ['src/engine/combatLab.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const lab = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)

function reviewedProfile() {
  const profile = lab.createGauntletDaggerProfile('fixture')
  profile.character.weaponMainDmgMin = 100
  profile.character.weaponMainDmgMax = 150
  profile.character.weaponOffDmgMin = 100
  profile.character.weaponOffDmgMax = 150
  profile.skills = profile.skills.slice(0, 2).map(skill => ({ ...skill, reviewed: true }))
  profile.buffs = []
  profile.effects = []
  profile.pressFailurePct = 0
  return profile
}

test('plano de 120 s respeita cooldown e é determinístico', () => {
  const profile = reviewedProfile()
  const first = lab.simulatePriority(profile)
  const second = lab.simulatePriority(profile)
  assert.deepEqual(first, second)
  assert.equal(first.durationSec, 120)
  assert.ok(first.totalDamage > 0)
  assert.ok(first.skills.every(skill => skill.casts < 120 && skill.attempts >= skill.casts))
})

test('bônus confirmado aumenta dano e pressão com falha não cria casts', () => {
  const profile = reviewedProfile()
  const baseline = lab.simulatePriority(profile)
  profile.effects = [{ id: 'bonus', name: 'Bônus', kind: 'item', description: '', damagePct: 10, cooldownSpeedPct: 0, advantageDurationPct: 0, reviewed: true, source: 'fixture' }]
  const boosted = lab.simulatePriority(profile)
  assert.ok(boosted.totalDamage > baseline.totalDamage)
  profile.pressFailurePct = 99
  const failed = lab.simulatePriority(profile)
  assert.ok(failed.skills.reduce((sum, skill) => sum + skill.casts, 0) < boosted.skills.reduce((sum, skill) => sum + skill.casts, 0))
})

test('buff de dano base confirmado aumenta dano enquanto ativo', () => {
  const profile = reviewedProfile()
  const baseline = lab.simulatePriority(profile)
  profile.buffs = [{ id: 'blade', name: 'Corte', key: '/', cooldownSec: 120, durationSec: 120, damagePct: 0, baseDamageFlat: 22, attackSpeedPct: 0, cooldownSpeedPct: 0, advantageAffected: false, priority: 5, enabled: true, reviewed: true, source: 'fixture' }]
  const boosted = lab.simulatePriority(profile)
  assert.ok(boosted.totalDamage > baseline.totalDamage)
  assert.ok(boosted.buffUptimePct.blade > 90)
})

test('otimizador nunca retorna plano pior para os parâmetros conhecidos', () => {
  const profile = reviewedProfile()
  const result = lab.optimizePriority(profile)
  assert.ok(result)
  assert.ok(result.proposed.totalDamage >= result.baseline.totalDamage)
})

test('log separa dano dos dois minutos e exige pull completo', () => {
  const startTime = 1000000
  const events = [0, 59999, 60000, 119500].map((offset, i) => ({ tsMs: startTime + offset, damage: (i + 1) * 100, target: 'Boneco', skill: 'Golpe Sombrio' }))
  const pull = { id: 1, startTime, endTime: startTime + 119500, events, damage: 1000 }
  const run = lab.measureTwoMinuteRun(pull, 'fixture', 'log.txt')
  assert.equal(run.firstMinuteDamage, 300)
  assert.equal(run.secondMinuteDamage, 700)
  assert.equal(run.totalDamage, 1000)
  assert.equal(run.averageDps, 1000 / 120)
  assert.equal(run.complete, true)
  const short = lab.measureTwoMinuteRun({ ...pull, endTime: startTime + 90000 }, 'fixture', 'short.txt')
  assert.equal(short.complete, false)
})

test('comparação não soma dano de outros jogadores do mesmo log', () => {
  const startTime = 1000000
  const events = [
    { tsMs: startTime, damage: 100, source: 'Eu', target: 'Boneco', skill: 'Golpe Sombrio' },
    { tsMs: startTime + 60000, damage: 200, source: 'Outro', target: 'Boneco', skill: 'Golpe Sombrio' },
    { tsMs: startTime + 119500, damage: 300, source: 'Eu', target: 'Boneco', skill: 'Golpe Sombrio' },
  ]
  const pull = { id: 1, startTime, endTime: startTime + 119500, events, damage: 600 }
  const run = lab.measureTwoMinuteRun(pull, 'fixture', 'log.txt', 'Eu')
  assert.equal(run.totalDamage, 400)
  const profile = reviewedProfile()
  const comparison = lab.comparePlanWithPull(lab.simulatePriority(profile), profile, pull, 'Eu')
  assert.equal(comparison.rows.find(row => row.id === 'shadow').observedDamage, 400)
})
