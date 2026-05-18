# Fase: Integração SkillsDB → Rotação

**Status:** PLANEJADO  
**Prioridade:** Alta  
**Estimativa:** 1 sessão (~2-3h)

---

## Objetivo

Transformar o banco de skills (SkillsDB) na fonte de dados da página de Rotação.  
Sai a digitação manual de nomes e campos; entra um picker filtrado por arma com auto-preenchimento.

---

## Contexto técnico

### Tipos relevantes hoje

```ts
// src/engine/types.ts

export type SkillWeapon = 'main' | 'off'

export interface RotationCharacter {
  weaponMainType: string   // string livre hoje → vira select
  weaponOffType:  string   // string livre hoje → vira select
  // ...
}

export interface RotationSkill {
  id:           string
  skillName:    string     // digitado hoje → vira nome do SkillDBEntry
  weapon:       SkillWeapon  // 'main' | 'off'
  castTime:     number
  cooldown:     number
  skillDmgPct:  number
  bonusBaseDmg: number
  hits:         number
  monsterBonus: number
  dmgBonus:     number
  enabled:      boolean
  // NOVO:
  // skillDbId?: string
}

export interface RotationDot {
  // estrutura similar a RotationSkill
  dotName: string   // idem — vira picker na fase 2
  // NOVO:
  // skillDbId?: string
}
```

```ts
// src/store/useSkillsDB.ts

export interface SkillDBEntry {
  id:           string
  name:         string
  nameEn:       string
  weaponType:   string   // 'Staff' | 'Wand & Tome' | 'Longbow' | etc.
  category:     SkillCategory  // 'active' | 'passive' | 'proc' | 'item' | 'mastery'
  grade:        string
  description:  string
  castTime:     number
  cooldown:     number
  manaCost:     number
  skillDmgPct:  number
  bonusBaseDmg: number
  hits:         number
  monsterBonus: number
  dmgBonus:     number
}
```

```ts
// Constante compartilhada (está em SkillsDB.tsx hoje, precisa ser extraída)
const WEAPON_TYPES = [
  'Staff', 'Wand & Tome', 'Longbow', 'Crossbow',
  'Dagger', 'Greatsword', 'Sword & Shield', 'Spear', 'Orb', 'Item/Proc',
]
```

---

## Tarefas em ordem de execução

### TAREFA 1 — Extrair WEAPON_TYPES para constante compartilhada
**Arquivo:** `src/engine/constants.ts` (criar) ou `src/engine/types.ts` (adicionar)

```ts
// src/engine/constants.ts
export const WEAPON_TYPES = [
  'Staff', 'Wand & Tome', 'Longbow', 'Crossbow',
  'Dagger', 'Greatsword', 'Sword & Shield', 'Spear', 'Orb', 'Item/Proc',
] as const

export type WeaponType = typeof WEAPON_TYPES[number]
```

Atualizar importação em `SkillsDB.tsx` para usar a constante compartilhada.

---

### TAREFA 2 — Adicionar `skillDbId` ao modelo
**Arquivo:** `src/engine/types.ts`

```ts
export interface RotationSkill {
  // campos existentes mantidos...
  skillDbId?: string   // undefined = entrada manual/legada; string = vinculada ao SkillsDB
}

export interface RotationDot {
  // campos existentes mantidos...
  skillDbId?: string
}
```

Nenhuma migração de dados necessária — campo opcional, retrocompatível.

---

### TAREFA 3 — Getter filtrado no store do SkillsDB
**Arquivo:** `src/store/useSkillsDB.ts`

Adicionar função utilitária (não precisa ser store state — pode ser função pura exportada):

```ts
/** Retorna entries filtradas por weapon types + sempre inclui 'Item/Proc' */
export function filterSkillsByWeapons(
  entries: SkillDBEntry[],
  weaponTypes: string[],
): SkillDBEntry[] {
  return entries.filter(e =>
    weaponTypes.includes(e.weaponType) ||
    e.weaponType === 'Item/Proc' ||
    e.category === 'item' ||
    e.category === 'proc'
  )
}
```

---

### TAREFA 4 — Weapon selector no CharacterPanel (Rotation.tsx)

**Antes (CharacterPanel):**
```tsx
<input
  value={char.weaponMainType}
  onChange={e => onChar({ weaponMainType: e.target.value })}
/>
```

**Depois:**
```tsx
<select
  value={char.weaponMainType}
  onChange={e => onChar({ weaponMainType: e.target.value })}
  style={/* estilo consistente com o painel */}
>
  {WEAPON_TYPES.map(w => (
    <option key={w} value={w}>{w}</option>
  ))}
</select>
```

Fazer para `weaponMainType` e `weaponOffType`.  
Sem breaking change: o DEFAULT já é `'Staff'` e `'Wand'` — corrigir default de `'Wand'` para `'Wand & Tome'` em `DEFAULT_ROTATION_CHARACTER`.

---

### TAREFA 5 — SkillPicker component (componente inline em Rotation.tsx)

Criar componente `SkillPicker` dentro de `Rotation.tsx` (ou em `src/components/SkillPicker.tsx` se ficar grande):

**Props:**
```ts
interface SkillPickerProps {
  currentName: string
  skillDbId:   string | undefined
  weaponTypes: string[]          // [char.weaponMainType, char.weaponOffType]
  onSelect:    (entry: SkillDBEntry) => void
  onClear:     () => void         // volta para modo manual
}
```

**Comportamento:**
1. Exibe `currentName` como label clicável
2. Ao clicar: abre dropdown inline (posicionado abaixo do campo) com lista filtrada
3. Lista mostra: `[cor por arma] Nome da skill · Cast: Xs · CD: Xs`
4. Busca por texto dentro do dropdown (input no topo)
5. Ao selecionar: chama `onSelect(entry)` e fecha dropdown
6. Se `skillDbId` está definido: exibe badge `🔗` ao lado do nome
7. Badge `🔗` clicável: abre dropdown para substituir ou oferece "✕ Desvincular"

**Indicador visual de arma no picker:**
```
🟣 [Staff]      Bola de Fogo em Série    Cast: 1s  CD: 0s
🟣 [Staff]      Raio em Cadeia           Cast: 1s  CD: 0s  
🔵 [Wand & Tome] Onda Arcana             Cast: 1s  CD: 12s
⚙️ [Item/Proc]  Proc de conjunto         Cast: 0s  CD: 0s
```

Cor por arma segue `weaponColor` map:
```ts
const WEAPON_COLOR: Record<string, string> = {
  'Staff':          '#a78bfa',
  'Wand & Tome':    '#60a5fa',
  'Longbow':        '#4ade80',
  'Crossbow':       '#86efac',
  'Dagger':         '#f97316',
  'Greatsword':     '#ef4444',
  'Sword & Shield': '#f59e0b',
  'Spear':          '#ec4899',
  'Orb':            '#22d3ee',
  'Item/Proc':      '#94a3b8',
}
```

---

### TAREFA 6 — Integrar SkillPicker na SkillTable (Rotation.tsx)

**Lógica ao selecionar uma skill do picker:**
```ts
function handleSkillSelect(skillId: string, entry: SkillDBEntry) {
  const weaponAssignment: SkillWeapon =
    entry.weaponType === char.weaponMainType ? 'main' : 'off'

  updateSkill(rotation.id, skillId, {
    skillName:    entry.name,
    skillDbId:    entry.id,
    weapon:       weaponAssignment,
    castTime:     entry.castTime,
    cooldown:     entry.cooldown,
    skillDmgPct:  entry.skillDmgPct,
    bonusBaseDmg: entry.bonusBaseDmg,
    hits:         entry.hits,
    monsterBonus: entry.monsterBonus,
    dmgBonus:     entry.dmgBonus,
  })
}
```

**Lógica ao desvincular (volta modo manual):**
```ts
updateSkill(rotation.id, skillId, { skillDbId: undefined })
// skillName e campos numéricos mantidos para edição manual
```

**Skills existentes sem `skillDbId`:**  
Exibem o nome em input de texto normal (comportamento legado preservado).  
Mostram botão `🔍 Vincular` para abrir o picker e associar.

---

### TAREFA 7 — DoTs: mesma lógica (opcional, mesma sessão se der tempo)

Repetir a lógica do SkillPicker para `DotBlock`:
- Filtrar por `char.weaponMainType` e `char.weaponOffType`  
- Filtrar também por `category: 'proc'` (DoTs geralmente são procs/passivas)
- `dotName` auto-preenchido com `entry.name`
- Campos numéricos preenchidos do SkillDBEntry

---

## Decisões de UX já tomadas

| Decisão | Escolha |
|---|---|
| Campos editáveis após vinculação? | ✅ Sim — overrides de maestria são comuns |
| Buffs viram picker? | ❌ Não nesta fase — buffs são livres |
| Skill sem match no banco | Fica como texto manual, sem erro |
| Arma do skill | Atribuída automaticamente pela arma do char |
| SkillsDB vazio | Picker mostra estado vazio com link para o Banco de Skills |

---

## Rollback / Compatibilidade

- `skillDbId` é campo opcional → zero breaking change em dados salvos
- `weaponMainType`/`weaponOffType` continuam sendo strings → valores antigos lidos normalmente
- `DEFAULT_ROTATION_CHARACTER.weaponOffType` precisa mudar de `'Wand'` → `'Wand & Tome'` (única migration necessária, mas inócua pois só afeta rotações novas)

---

## Ordem de implementação sugerida (amanhã)

```
1. src/engine/constants.ts          — WEAPON_TYPES extraído
2. src/engine/types.ts              — skillDbId? adicionado
3. src/store/useSkillsDB.ts         — filterSkillsByWeapons() exportada
4. src/pages/Rotation.tsx (Tarefa 4)— weapon selects no CharacterPanel
5. src/pages/Rotation.tsx (Tarefa 5)— componente SkillPicker
6. src/pages/Rotation.tsx (Tarefa 6)— integração na SkillTable
7. src/pages/SkillsDB.tsx           — atualizar import do WEAPON_TYPES
8. npx tsc --noEmit                 — validar
```

---

## Arquivos que NÃO mudam

- `src/engine/rotationEngine.ts` — motor de cálculo não muda (lê os campos numéricos, indiferente à origem)
- `src/store/useRotation.ts` — store não muda (addSkill/updateSkill já suportam Partial<RotationSkill>)
- `src/pages/SkillsDB.tsx` — apenas atualiza import do WEAPON_TYPES
