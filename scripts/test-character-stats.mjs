import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
import ts from 'typescript'
const require=createRequire(import.meta.url)
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,''))
function compile(file,resolve=require){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(resolve,module,module.exports);return module.exports}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'src/data/characterStatReference.json'),'utf8'))
const { importCharacterSnapshot,characterStatRows }=compile('src/engine/characterStats.ts',name=>name.endsWith('/characterStatReference.json')?catalog:require(name))
const { CharacterStatsLog }=compile('electron/main/characterStats.ts')
const { DEFAULT_STATS }=compile('src/engine/types.ts')
const f=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/character-stats.json'),'utf8'))
const snapshot={id:'fixture:A',captureId:'fixture',connectionId:'A',playerName:f.playerName,sourceId:f.sourceId,firstObservedAt:1000,observedAt:1001,
  values:Object.fromEntries(Object.entries(f.expected).map(([key,total])=>[key,{total}])),origin:'pcap',observedOnly:true}
const base={id:'build',name:'Teste',weaponCombo:'',notes:'Preservar',importedAt:'fixture',stats:{...DEFAULT_STATS,targetDefense:543,heavyAttackDmgComp:17}}
const build=importCharacterSnapshot(base,snapshot,'ranged')
assert.equal(build.calculatorAttackType,'ranged','A família ofensiva escolhida deve permanecer na build')
assert.deepEqual(Object.fromEntries(Object.entries(build.rawAttributes).map(([k,v])=>[k,v.total])),{Strength:67,Dexterity:130,Perception:90,Wisdom:114,Fortitude:22})
assert.equal(build.stats.minWeaponDmg,264);assert.equal(build.stats.maxWeaponDmg,965)
assert.equal(build.stats.critHitChance,2790);assert.equal(build.stats.heavyAttackChance,954.6)
assert.equal(build.stats.attackSpeedPct,149.03);assert.equal(build.stats.cdrPct,101.7)
assert.equal(build.stats.skillDmgBoost,549.8);assert.equal(build.stats.bonusDmg,59)
assert.equal(build.stats.critDmgPct,79.5)
assert.equal(build.stats.targetDefense,543,'Defesa própria não vira defesa do alvo')
assert.equal(build.stats.heavyAttackDmgComp,17,'Valor sem conversão confirmada é preservado')
const partial=importCharacterSnapshot({...base,rawAttributes:{Strength:{total:88,display:'88'}},stats:{...base.stats,minWeaponDmg:10,maxWeaponDmg:20,critHitChance:333}},{...snapshot,values:{'14':{total:32380},'4096':{total:12345}}},'')
assert.equal(partial.rawAttributes.Strength.total,88)
assert.equal(partial.stats.minWeaponDmg,10);assert.equal(partial.stats.critHitChance,333)
assert.equal(partial.rawStats['Status 4096'],'12.345')
assert.equal(partial.characterSnapshot.values['4096'].total,12345)
assert.equal(characterStatRows(snapshot).find(row=>row.id==='11').display,'149,03%')
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'throne-character-')),file=path.join(directory,'snapshots.json')
const log=new CharacterStatsLog(file)
assert(log.observe('A',1001,snapshot.values));assert.equal(log.get('fixture',null,'AgrMonteiro').live,null,'Sem perfil não atribuir ficha')
assert.deepEqual(log.get('fixture',null,'AgrMonteiro').pending,[{connectionId:'A',observedAt:1001,fields:Object.keys(snapshot.values).length}])
const result=log.get('fixture',{connectionId:'A',sourceId:f.sourceId},'AgrMonteiro')
assert.equal(result.live.values['14'].total,32380)
log.observe('B',1002,{'14':{total:1}})
assert.equal(log.get('fixture',{connectionId:'A',sourceId:f.sourceId},'AgrMonteiro').live.values['14'].total,32380)
log.observe('A',999,{'14':{total:7}})
assert.equal(log.get('fixture',{connectionId:'A',sourceId:f.sourceId},'AgrMonteiro').live.values['14'].total,32380)
log.reset();assert.equal(log.get('new',{connectionId:'A',sourceId:f.sourceId},'AgrMonteiro').live,null)
assert.deepEqual(log.get('new',null,'AgrMonteiro').pending,[])
const reopened=new CharacterStatsLog(file);assert.equal(reopened.get('',null,'AgrMonteiro').saved.length,1)
assert.equal(reopened.get('',null,'Outro').saved.length,0)
assert.equal(reopened.get('',null,'AgrMonteiro').live,null,'Arquivo salvo não restaura identidade ao vivo')
console.log('OK: ficha real -> build, cinco atributos, arma, crítico/pesado por tipo, ausências preservadas, status desconhecidos, conexão e arquivo sem restaurar identidade.')
