# Phase 11: Build Specialization Data - Research

**Researched:** 2026-04-25
**Domain:** Electron IPC / Python Playwright Scraper / TypeScript Data Model
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** O scraper Python já usa Playwright — adicionar passo para clicar no botão "Export to Share" (ícone de upload) na página do Questlog e capturar o JSON resultante
- **D-02:** O JSON exportado pelo Questlog tem estrutura: `{ name, mainHand, offHand, specialization: [{id: string, lvl: number}] }` — o scraper deve extrair e retornar esses campos junto com os stats já extraídos
- **D-03:** O botão de export está na tela do Build Editor (não na página principal da build) — o scraper precisa navegar até a tela correta antes de clicar
- **D-04:** Adicionar campos opcionais ao tipo `Build`: `specialization?: Array<{id: string, lvl: number}>`, `weaponMain?: string`, `weaponOff?: string`
- **D-05:** Campos são opcionais — builds existentes carregam sem quebrar (migração graciosa = valores `undefined` são aceitos)
- **D-06:** `weaponMain`/`weaponOff` são strings livres que espelham os valores do Questlog (ex: `"staff"`, `"wand"`) — distintos dos `weaponMainType`/`weaponOffType` do Rotation engine que usam o formato capitalizado (`"Staff"`, `"Wand & Tome"`)
- **D-07:** Phase 11 é infraestrutura de dados — salvar IDs e níveis das especializações sem interpretar seus efeitos
- **D-08:** O que cada nó de especialização faz fica para Phase 12
- **D-09:** Entrega verificável: ao re-importar uma build com URL que tem maestrias configuradas, os dados de `specialization` aparecem persistidos no `builds.json`

### Claude's Discretion
- Estrutura exata de navegação Playwright para chegar ao botão de export (depende do DOM do Questlog)
- Tratamento de erro quando o build editor não está disponível ou o export falha (fallback gracioso sem maestrias)
- Mapeamento de `weaponMain`/`weaponOff` (formato Questlog lowercase) para `weaponMainType`/`weaponOffType` (formato Rotation engine) — pode ser uma função helper ou pode ficar para Phase 12

### Deferred Ideas (OUT OF SCOPE)
- Interpretação de efeitos de maestria no DPS — mapeamento de `specialization[].id` para bônus numéricos
- UI de visualização de maestrias na Rotation — exibir quais nós estão ativos
- Side-by-side de duas rotações (ROT-02 original)
- Skills ativas equipadas (os ícones da build no topo do Questlog)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROT-01 | Campo de skill no builder oferece autocomplete com skills do `skillsDB.json` e stats pré-preenchidos (CD, damage%, hits) | Phase 11 é infraestrutura de dados que habilita esta feature: `build.specialization`, `build.weaponMain`, `build.weaponOff` são lidos pela Phase 12 para filtrar skills do SkillsDB por arma e pre-popular dados de maestria no builder |
</phase_requirements>

---

## Summary

Esta fase adiciona três campos opcionais ao modelo `Build` (`specialization`, `weaponMain`, `weaponOff`) e atualiza o scraper Python para extrair esses dados via o botão "Export to Share" do Questlog Build Editor. É uma fase de **infraestrutura de dados** — nenhuma UI nova é entregue, apenas a capacidade de persistir e carregar esses dados para consumo pela Phase 12.

O trabalho tem dois lados paralelos: (1) **Python/Playwright** — adicionar um passo de navegação e click na função `scrape()` de `questlog_scraper_standalone.py` para capturar o JSON de export; (2) **TypeScript** — estender `Build` em `types.ts`, atualizar `parseNewScraperFormat()` em `useBuilds.ts` para extrair os novos campos, e incluí-los no schema de validação `validateScraperOutput()`.

O padrão de migração graciosa já está estabelecido: campos opcionais que chegam como `undefined` em builds antigas são aceitos sem erro, pois `loadFromDisk()` usa spread do objeto original sem exigir os novos campos. O único risco real é na navegação Playwright — o DOM do Questlog Build Editor é desconhecido e requer inspeção ao vivo para localizar o seletor correto do botão de export.

**Recomendação principal:** Implementar o passo Playwright com fallback gracioso: se o botão de export não for encontrado ou o JSON não for capturado, o scraper retorna normalmente com os campos `specialization`/`weaponMain`/`weaponOff` ausentes (não é erro fatal).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Captura do JSON de specialization | Python/Playwright scraper | — | O scraper já roda no processo do scraper Python; este passo é uma extensão da navegação existente |
| Persistência dos dados de specialization | Frontend store (useBuilds.ts) | Electron main (IPC) | parsePythonBuild() é o ponto de transformação; Electron main apenas repassa o JSON bruto do stdout |
| Extensão do tipo Build | TypeScript types.ts | — | Fonte de verdade do modelo |
| Validação do output do scraper | Frontend store (validateScraperOutput) | — | Zod não está em uso; validação manual existe em useBuilds.ts |
| Migração graciosa de builds antigas | Frontend store (loadFromDisk) | — | Padrão já estabelecido via spread operator |

---

## Standard Stack

### Core (em uso no projeto — sem instalação necessária)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| TypeScript | 5.5.3 | Extensão do tipo Build | Já instalado [VERIFIED: package.json] |
| Zustand | 4.5.5 | Store useBuilds | Já instalado [VERIFIED: package.json] |
| Playwright (Python) | latest | Navegação headless no scraper | Já instalado no projeto irmão [VERIFIED: questlog_scraper_standalone.py] |
| Electron IPC | 31.x | Canal questlog:import-python | Já em uso [VERIFIED: electron/main/index.ts] |

### Não está em uso — relevante para esta fase

| Library | Purpose | Decisão |
|---------|---------|---------|
| Zod | Validação de schema | Não instalado no projeto [VERIFIED: package.json]. A validação do output do scraper é manual (validateScraperOutput). Manter padrão existente. |

**Instalação necessária:** Nenhuma. Todos os componentes necessários já existem no projeto.

---

## Architecture Patterns

### Fluxo de dados atual (e como esta fase o estende)

```
Renderer (useBuilds.ts)
  importFromUrlPython(url)
    → window.dataAPI.questlogImportPython(url)        [preload IPC]
        → ipcMain.handle('questlog:import-python')    [electron/main/index.ts]
            → spawn(python, [scraper.py, url])
                → scraper.py navega Questlog via Playwright
                → stdout: JSON { meta, attributes, stats }  ← ADICIONAR: specialization, mainHand, offHand
                → parse stdout.slice(jsonStart)
            → resolve(JSON)
        → return raw JSON
    → validateScraperOutput(obj)          ← ATUALIZAR: aceitar novos campos
    → parsePythonBuild(obj)               ← ATUALIZAR: extrair specialization/weaponMain/weaponOff
    → return Build object                 ← TIPO ESTENDIDO: novos campos opcionais
```

### Estrutura do JSON de output do scraper após Phase 11

```json
{
  "meta": {
    "source_url": "https://questlog.gg/...",
    "slug": "...",
    "build_id": 123,
    "character_name": "Staff+Wand DPS"
  },
  "attributes": { "Strength": { "total": 60, "display": "60" } },
  "stats": { "Combat Power": "5467", "Max Damage": "338 ~ 836" },
  "specialization": [
    { "id": "Wand_Normal_Tactic_11", "lvl": 10 },
    { "id": "Staff_Normal_Attack_01", "lvl": 10 }
  ],
  "weaponMain": "staff",
  "weaponOff": "wand"
}
```

### Pattern: Campos opcionais com migração graciosa (Phase 2 — padrão a replicar)

[VERIFIED: src/store/useBuilds.ts linhas 82-99]

```typescript
// loadFromDisk — migração silenciosa via spread
const builds: BuildMap = {}
for (const [id, build] of Object.entries(raw)) {
  const merged = { ...DEFAULT_STATS, ...build.stats }
  builds[id] = { ...build, stats: merged }
  // Campos ausentes em builds antigas chegam como undefined — TypeScript aceita pois são opcionais
}
```

Para os novos campos, o mesmo padrão se aplica naturalmente: `build.specialization` será `undefined` em builds antigas. Nenhuma normalização explícita é necessária.

### Pattern: parseNewScraperFormat (onde adicionar a extração)

[VERIFIED: src/store/useBuilds.ts linhas 257-343]

```typescript
// Localização exata: função parseNewScraperFormat(), na linha do return final (~332)
return {
  id:            newId(),
  name,
  weaponCombo:   '',
  stats,
  notes:         '',
  importedAt:    new Date().toISOString(),
  sourceUrl,
  rawStats:      rawStatsIn,
  rawAttributes,
  // ADICIONAR:
  specialization: extractSpecialization(raw),
  weaponMain:    typeof raw.weaponMain === 'string' ? raw.weaponMain : undefined,
  weaponOff:     typeof raw.weaponOff === 'string' ? raw.weaponOff : undefined,
}

function extractSpecialization(raw: Record<string, unknown>): Array<{id: string, lvl: number}> | undefined {
  const spec = raw.specialization
  if (!Array.isArray(spec) || spec.length === 0) return undefined
  return spec
    .filter((item): item is { id: string; lvl: number } =>
      typeof item === 'object' && item !== null &&
      typeof (item as any).id === 'string' &&
      typeof (item as any).lvl === 'number'
    )
}
```

### Pattern: Playwright — adição de passo ao fluxo existente

[VERIFIED: scraper/questlog_scraper_standalone.py linhas 186-248]

O passo de export se insere após `page.goto()` e antes de `browser.close()`. O fluxo Playwright atual:

1. `page.goto(url, wait_until="networkidle")` — carrega página do build
2. `page.query_selector("h1")` — extrai nome
3. `page.evaluate(_JS_SCROLL_AND_COLLECT)` — rola e coleta stats
4. `browser.close()`

O novo passo de export (D-03) requer navegar para o Build Editor antes de clicar. O Questlog tem uma URL separada para o editor. A estrutura de navegação exata depende do DOM atual do Questlog e deve ser inspecionada ao vivo.

### Anti-Patterns a Evitar

- **Não fazer o scraper falhar se o export não existir:** O botão "Export to Share" pode não estar disponível em todas as builds (ex: builds privadas, sem maestrias configuradas). O scraper deve retornar os dados de stats normalmente com `specialization`/`weaponMain`/`weaponOff` ausentes — nunca retornar `{"error": ...}` por causa do export.
- **Não duplicar a lógica de extração:** `parseOldFormat()` (formato legado) não precisa ser atualizado para extrair specialization — o formato antigo não suporta esses campos e builds antigas simplesmente ficam sem eles.
- **Não adicionar Zod:** O projeto não usa Zod. A validação de `validateScraperOutput()` é manual e deve continuar assim — apenas adicionar verificação permissiva dos novos campos opcionais.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filtro de array tipado em Python | Loop manual sem type guard | List comprehension com isinstance() | Mais limpo, Pythonic |
| Captura de JSON interceptado | Substituir abordagem de click | Playwright `page.evaluate()` para clicar e ler o resultado | O botão de export gera um modal/clipboard — usar evaluate() para interceptar o JSON antes de fechar |
| Validação do array specialization em TS | Schema Zod | Type guard inline (como os outros campos) | Zod não está instalado; type guards inline já são o padrão no projeto |

---

## Runtime State Inventory

> Esta fase não é rename/refactor — builds antigas não precisam de migração de dados. Campos novos chegam como `undefined` em builds existentes.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `builds.json` em AppData/Roaming/Tier2 Command Lab/data/ — builds sem specialization | Nenhuma migração necessária — campos opcionais com undefined aceitos |
| Live service config | Nenhum serviço externo com estado | Nenhuma |
| OS-registered state | Nenhum | Nenhuma |
| Secrets/env vars | Nenhum novo | Nenhuma |
| Build artifacts | `questlog_scraper.exe` bundled em `resources/` — gerado de questlog_scraper_standalone.py | Recompilar o .exe após mudanças no .py para que builds de produção incluam o novo passo |

---

## Common Pitfalls

### Pitfall 1: Playwright headless bloqueado pelo Cloudflare no Build Editor
**What goes wrong:** O scraper atual já detecta Cloudflare na página principal (`"unable to access"`). O Build Editor do Questlog pode ter proteção Cloudflare diferente ou requer autenticação de usuário.
**Why it happens:** O Build Editor é uma página separada que pode exigir login ou ter proteção anti-bot mais agressiva que a página de visualização de build.
**How to avoid:** Implementar com fallback: se a navegação para o editor falhar ou o botão não for encontrado em N segundos, retornar normalmente sem specialization. Logar o failure no scraper.log.
**Warning signs:** `page.goto()` retorna mas `page.inner_text("body")` contém "unable to access" ou a URL redireciona para login.

### Pitfall 2: O botão de export abre modal ou aciona clipboard — não retorna JSON diretamente
**What goes wrong:** O botão "Export to Share" pode acionar um modal com o JSON exibido como texto, ou copiar para clipboard, em vez de retornar o JSON via fetch/XHR que possa ser interceptado via `page.route()`.
**Why it happens:** UIs modernas frequentemente usam clipboard API ou modals para "export", não downloads de arquivo.
**How to avoid:** Usar `page.evaluate()` para interceptar o valor antes de fechar o modal, ou usar `page.on('dialog')` para capturar diálogos. Alternativamente, inspecionar a network tab para verificar se há um endpoint `/api/export` que o botão chama — se sim, chamar via `page.evaluate(() => fetch(...))`.
**Warning signs:** O click funciona mas nenhum download é iniciado e nenhuma request de API é feita.

### Pitfall 3: URL do Build Editor diferente da URL de visualização
**What goes wrong:** O scraper recebe `https://questlog.gg/throne-and-liberty/en/character-builder/{slug}` mas o Build Editor pode estar em `https://questlog.gg/throne-and-liberty/en/character-builder/{slug}/edit` ou similar.
**Why it happens:** Questlog separa visualização pública de edição.
**How to avoid:** Navegar explicitamente para a URL de edição após o goto inicial. Se a URL de edição não for acessível sem login, registrar no log e retornar sem specialization.
**Warning signs:** `page.query_selector('[data-testid="export-button"]')` retorna null após `goto()`.

### Pitfall 4: `weaponCombo` vs `weaponMain`/`weaponOff` — campos duplicados
**What goes wrong:** `Build.weaponCombo` já existe (ex: `"staff+wand"` em lowercase). Os novos campos `weaponMain`/`weaponOff` são semanticamente sobrepostos.
**Why it happens:** `weaponCombo` foi criado antes do export do Questlog existir. D-06 confirma que são distintos — `weaponMain`/`weaponOff` espelham o Questlog, `weaponCombo` é o campo legado.
**How to avoid:** Não tentar "derivar" `weaponCombo` dos novos campos. Manter ambos independentes. `weaponCombo` é populado pelo formato antigo; `weaponMain`/`weaponOff` pelo novo.
**Warning signs:** TypeScript detectando conflito se tentar reaproveitar `weaponCombo` como fonte de truth.

### Pitfall 5: Esquecer de recompilar o .exe do scraper para produção
**What goes wrong:** O `.py` é atualizado mas o `.exe` bundled em `resources/questlog_scraper.exe` é o antigo — builds de produção não capturam specialization.
**Why it happens:** O build do Electron não compila automaticamente o Python. É um passo manual.
**How to avoid:** Incluir na checklist de verificação da fase: recompilar o .exe via `pyinstaller questlog_scraper.spec` após as mudanças no .py.
**Warning signs:** Builds de dev (usando .py) funcionam, mas builds de produção (usando .exe bundled) retornam builds sem specialization.

---

## Code Examples

### Extensão do tipo Build (types.ts)

```typescript
// [VERIFIED: estrutura atual em src/engine/types.ts linhas 60-73]
// Adicionar campos após screenshotFile:

export interface Build {
  id:             string
  name:           string
  weaponCombo:    string
  stats:          BuildStats
  notes:          string
  importedAt:     string
  editedAt?:      string
  sourceUrl?:     string
  screenshotFile?: string
  rawAttributes?: Record<string, { total: number; display: string }>
  rawStats?:      Record<string, string>
  // Phase 11 — dados de especialização do Questlog Build Editor
  specialization?: Array<{ id: string; lvl: number }>
  weaponMain?:     string   // ex: "staff" (lowercase, formato Questlog)
  weaponOff?:      string   // ex: "wand" (lowercase, formato Questlog)
}
```

### validateScraperOutput — nenhuma mudança necessária

[VERIFIED: src/store/useBuilds.ts linhas 207-236]

A validação atual só exige a presença de `stats` + identificador de nome. Os campos `specialization`/`weaponMain`/`weaponOff` são opcionais e não devem tornar a validação mais restritiva. **Nenhuma mudança em `validateScraperOutput`.**

### Extração em parseNewScraperFormat

```typescript
// Adicionar ao final de parseNewScraperFormat(), antes do return:
// [ASSUMED: estrutura inline, sem função auxiliar separada, para manter consistência com o estilo do arquivo]

const rawSpec = raw.specialization
const specialization: Array<{ id: string; lvl: number }> | undefined =
  Array.isArray(rawSpec) && rawSpec.length > 0
    ? (rawSpec as unknown[]).reduce<Array<{ id: string; lvl: number }>>((acc, item) => {
        if (
          item !== null && typeof item === 'object' &&
          typeof (item as any).id === 'string' &&
          typeof (item as any).lvl === 'number'
        ) {
          acc.push({ id: (item as any).id, lvl: (item as any).lvl })
        }
        return acc
      }, [])
    : undefined

return {
  // ...campos existentes...
  specialization: specialization?.length ? specialization : undefined,
  weaponMain: typeof raw.weaponMain === 'string' ? raw.weaponMain : undefined,
  weaponOff:  typeof raw.weaponOff  === 'string' ? raw.weaponOff  : undefined,
}
```

### Playwright — estrutura do novo passo (scraper Python)

```python
# Inserir após page.goto() e antes de browser.close() na função scrape()
# [ASSUMED: seletores CSS — devem ser verificados ao vivo no DOM do Questlog]

def _try_export_specialization(page) -> dict | None:
    """
    Tenta navegar para o Build Editor e capturar o JSON de especialização.
    Retorna None se falhar (fallback gracioso — não é erro fatal).
    """
    try:
        # Tentar localizar o botão de export (seletor a confirmar via inspeção do DOM)
        export_btn = page.query_selector('[aria-label="Export to Share"], [title="Export to Share"], button[data-export]')
        if not export_btn:
            print("[scraper] Botão de export não encontrado — sem maestrias", flush=True)
            return None
        
        # Capturar o JSON antes de o modal abrir / clipboard ser acionado
        # Estratégia: interceptar via network request ou ler o modal após click
        export_btn.click()
        
        # Aguardar modal ou textarea com o JSON
        page.wait_for_timeout(1500)
        
        # Tentar ler de um textarea ou pre no modal
        json_el = page.query_selector('textarea[readonly], pre[data-export-json], .export-modal textarea')
        if json_el:
            raw_json = json_el.input_value() or json_el.inner_text()
            return json.loads(raw_json)
        
        return None
    except Exception as exc:
        print(f"[scraper] Export falhou (ignorando): {exc}", flush=True)
        return None
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `weaponCombo` como string derivada | `weaponMain`/`weaponOff` como campos diretos do Questlog | Separação clara entre formato interno (Rotation engine) e formato externo (Questlog) |
| Scraper captura apenas stats numéricos | Scraper captura stats + dados de configuração de build (maestrias, armas) | Habilita Phase 12 sem segundo scrape |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Seletores CSS do botão "Export to Share" — usados como exemplo no code snippet Playwright | Code Examples | Scraper não encontra o botão; fallback retorna sem specialization (não é erro fatal) |
| A2 | O botão de export exibe o JSON em textarea/pre no DOM (legível via `inner_text`) | Code Examples | JSON não está no DOM — precisa de abordagem diferente (clipboard, network intercept) |
| A3 | `parseOldFormat()` não precisa ser atualizado | Architecture | Builds importadas via formato antigo nunca terão specialization (aceitável — são builds legadas) |
| A4 | Recompilar o .exe é manual e não faz parte do processo `npm run package` | Common Pitfalls | Se automático, o pitfall não se aplica |

---

## Open Questions

1. **Seletor DOM do botão "Export to Share" no Questlog**
   - What we know: O usuário confirmou que o botão existe e fica no Build Editor (ícone de upload)
   - What's unclear: Atributo exato do botão (aria-label, data-testid, class) e se o Build Editor é a mesma página da build ou uma URL separada
   - Recommendation: O executor deve abrir o Questlog com `headless=False` em dev e inspecionar o DOM antes de implementar o seletor final

2. **Mecanismo de captura do JSON exportado**
   - What we know: O botão gera um JSON `{ name, mainHand, offHand, specialization }`
   - What's unclear: O JSON é exibido num modal (legível via DOM), copiado para clipboard (inacessível headless), ou retornado via request de rede (interceptável via `page.route()`)
   - Recommendation: Verificar Network tab ao clicar o botão. Se houver request XHR/fetch, usar `page.route()` para interceptar — é mais robusto que scraping de DOM.

3. **Autenticação no Build Editor**
   - What we know: A página pública de build não exige login
   - What's unclear: O Build Editor (para clicar em "Export to Share") exige que o usuário esteja logado?
   - Recommendation: Se exigir login, o caminho muda drasticamente — explorar se a URL da build pública já expõe o export sem autenticação.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.x | Scraper .py | Detectado pelo `scraper:detect` handler | Verificado via `python --version` em runtime | Usar .exe bundled |
| Playwright (Python) | Scraper .py | Instalado no projeto irmão | Verificado via `import playwright` | Instalar via `pip install playwright` |
| questlog_scraper_standalone.py | electron/main/index.ts | Existe [VERIFIED: arquivo lido] | — | — |
| PyInstaller (para recompilação do .exe) | Build de produção | Não verificado nesta sessão | — | Usar .py em dev |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Nenhum framework de teste configurado no projeto [VERIFIED: package.json — sem vitest/jest/playwright test] |
| Config file | Não existe |
| Quick run command | `npx tsc --noEmit` (validação de tipos TypeScript) |
| Full suite command | `npx tsc --noEmit && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROT-01 (infra) | `Build.specialization` persiste corretamente em builds.json após importação | manual-only | — | ❌ Wave 0 |
| D-04/D-05 | Tipo `Build` compila sem erros TypeScript com os novos campos opcionais | type-check | `npx tsc --noEmit` | ✅ (TypeScript já configurado) |
| D-09 | builds.json contém `specialization` após re-importar URL com maestrias | manual smoke | Executar scraper manualmente + verificar builds.json | ❌ Wave 0 |

### Sampling Rate

- **Por task commit:** `npx tsc --noEmit`
- **Por wave merge:** `npx tsc --noEmit && npm run build`
- **Phase gate:** Build TypeScript limpa + smoke test manual de importação

### Wave 0 Gaps

- [ ] Não há framework de teste automatizado — verificação de fase depende de smoke test manual via `npm run dev` + importação de uma URL do Questlog com maestrias configuradas
- [ ] Para verificar D-09: ter em mãos uma URL do Questlog que tenha maestrias configuradas (o usuário já forneceu o exemplo JSON no CONTEXT.md)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | validateScraperOutput() — validação manual já existente; novos campos opcionais não adicionam superfície de ataque |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injeção via campo `specialization` malformado | Tampering | Type guards no parseNewScraperFormat — apenas objetos com `{id: string, lvl: number}` são aceitos |
| Injeção via `weaponMain`/`weaponOff` | Tampering | Verificação `typeof === 'string'` antes de aceitar |
| Path traversal via campos de build | Tampering | Não se aplica — `specialization` nunca é usado como path de arquivo |

**SEC-01 continua válido:** A URL já é validada em `questlog:import-python` antes de spawnar o processo. Os novos campos não alteram esse fluxo.

---

## Sources

### Primary (HIGH confidence)

- `src/engine/types.ts` — estrutura exata do tipo `Build` e `RotationCharacter`, verificado diretamente
- `src/store/useBuilds.ts` — parsePythonBuild(), parseNewScraperFormat(), validateScraperOutput(), loadFromDisk() — lidos linha a linha
- `electron/main/index.ts` linhas 432-593 — handler questlog:import-python completo
- `electron/preload/index.ts` — APIs expostas ao renderer
- `scraper/questlog_scraper_standalone.py` — implementação completa do scraper Playwright
- `package.json` — dependências verificadas (sem Zod, sem framework de testes)
- `.planning/phases/11-build-specialization-data/11-CONTEXT.md` — decisões locked do usuário

### Secondary (MEDIUM confidence)

- `.planning/phases/skilldb-rotation-integration.md` — contexto de integração Phase 12, padrão de weapon types

### Tertiary (LOW confidence — assunções)

- Seletores DOM do botão "Export to Share" no Questlog (A1, A2)
- Mecanismo de captura do JSON (clipboard vs modal vs XHR) (A2)

---

## Metadata

**Confidence breakdown:**

- Modelo de dados TypeScript: HIGH — código lido diretamente
- Fluxo IPC/store: HIGH — todos os arquivos relevantes verificados
- Padrão de migração graciosa: HIGH — padrão já implementado e verificado
- Passo Playwright de export: LOW — seletores DOM do Questlog não verificados nesta sessão
- Recompilação do .exe: MEDIUM — fluxo documentado mas spec não lido

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 dias — stack estável, mas DOM do Questlog pode mudar)
