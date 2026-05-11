---
description: |
  Status e guia do catálogo de skills/traits/maestrias.
  Uso: /catalog           — mostra estado atual dos dados
       /catalog fix       — detecta e corrige problemas nos arquivos
       /catalog start     — instrução para abrir a ferramenta visual
       /catalog <tarefa>  — executa a tarefa no contexto do catálogo
---

Você é o assistente especializado no catálogo de dados do Throne & Liberty.

Leia o argumento em `$ARGUMENTS` e aja conforme:

---

## Se $ARGUMENTS estiver vazio ou for "status"

Rode o seguinte para gerar o relatório:

```bash
node --input-type=module <<'EOF'
import { SKILLS } from './src/data/skills.ts'
import { SKILL_ENHANCEMENTS } from './src/data/skillEnhancements.ts'
import { WEAPON_MASTERIES } from './src/data/weaponMasteries.ts'

const weapons = ['Longbow','Crossbow','Greatsword','Spear','Orb','Staff','Dagger','Sword','Wand','Shared']

console.log('═══ CATÁLOGO — STATUS ═══\n')

// Skills por arma
console.log('SKILLS (total: ' + SKILLS.length + ')')
weapons.forEach(w => {
  const n = SKILLS.filter(s => s.weapon === w).length
  if (n) console.log(`  ${w.padEnd(12)} ${n}`)
})
const emptyWeapon = SKILLS.filter(s => !s.weapon).length
if (emptyWeapon) console.log(`  ⚠️  SEM WEAPON: ${emptyWeapon}`)

// Traits
console.log('\nTRAITS (total: ' + SKILL_ENHANCEMENTS.length + ')')
const parentMap = {}
SKILLS.forEach(s => s.enhancementIds.forEach(id => { parentMap[id] = s }))
const orphans = SKILL_ENHANCEMENTS.filter(e => !parentMap[e.id])
console.log(`  Vinculados: ${SKILL_ENHANCEMENTS.length - orphans.length}`)
if (orphans.length) console.log(`  ⚠️  Órfãos: ${orphans.length}`)

// IDs inválidos em enhancementIds
const enhIds = new Set(SKILL_ENHANCEMENTS.map(e => e.id))
let brokenLinks = 0
SKILLS.forEach(s => s.enhancementIds.forEach(id => { if (!enhIds.has(id)) brokenLinks++ }))
if (brokenLinks) console.log(`  ⚠️  Links quebrados: ${brokenLinks}`)

// Masteries
console.log('\nMAESTRIAS (total: ' + WEAPON_MASTERIES.length + ')')
weapons.forEach(w => {
  const n = WEAPON_MASTERIES.filter(m => m.weapon === w).length
  if (n) console.log(`  ${w.padEnd(12)} ${n}`)
})
const emptyM = WEAPON_MASTERIES.filter(m => !m.weapon).length
if (emptyM) console.log(`  ⚠️  SEM WEAPON: ${emptyM}`)

console.log('\n═══ FERRAMENTA VISUAL ═══')
console.log('cd tools/catalog-manager && npm run dev')
console.log('→ http://localhost:5174\n')
EOF
```

Apresente o resultado de forma clara com emojis de status (✅ ou ⚠️).

---

## Se $ARGUMENTS for "fix"

Execute as correções automáticas:

1. Rodar `node scripts/patch-weapon-field.mjs` para corrigir campos `weapon=""`
2. Verificar novamente com o script de status acima
3. Reportar o que foi corrigido e o que ainda precisa de atenção manual

---

## Se $ARGUMENTS for "start"

Informe ao usuário como abrir a ferramenta:

```
Para abrir o Catalog Manager:

  cd tools/catalog-manager
  npm run dev

Acesse: http://localhost:5174

Abas disponíveis:
  Skills     → editar weapon, grade, tipo, traits vinculados
  Traits     → ver órfãos, editar base skill e efeito
  Maestrias  → editar weapon/categoria/grade/descrição
  Hierarquia → árvore weapon → skills → traits + maestrias

Salvar: botão "Salvar nos arquivos TS" grava em src/data/*.ts
```

---

## Para qualquer outra tarefa em $ARGUMENTS

Interprete como uma tarefa de curadoria do catálogo e execute com o contexto do agente `catalog-curator`.

Contexto importante para a tarefa:
- Arquivos de dados: `src/data/skills.ts`, `src/data/skillEnhancements.ts`, `src/data/weaponMasteries.ts`
- Ferramenta visual: `tools/catalog-manager/` (Express + React + Vite)
- Script de fix: `scripts/patch-weapon-field.mjs`
- Prefixos de ID → arma: BO=Longbow, CR=Crossbow, SW2=Greatsword, SP=Spear, ORB=Orb, ST=Staff, DA=Dagger, SW/SH=Sword, WA=Wand
- Maestrias: Dagger/Sword/Wand/Bow/Crossbow/Greatsword/Spear/Staff/Orb/WM(=Shared)
- Após qualquer edição em massa: `npx tsc --noEmit`
