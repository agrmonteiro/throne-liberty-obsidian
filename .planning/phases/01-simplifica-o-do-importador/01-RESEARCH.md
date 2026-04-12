# Phase 1: Simplificação do Importador — Research

**Researched:** 2026-04-11
**Domain:** Electron IPC, React state, Python child_process, URL validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Remoção do tRPC (IMP-01)**
- Remover completamente o handler `questlog:import-url` de `electron/main/index.ts` — incluindo `trpcGet`, `extractSlugAndBuildId`, e a constante `TRPC_BASE`
- Remover `questlogImport` do `dataAPI` em `electron/preload/index.ts`
- Remover `importFromUrl` da store `useBuilds.ts` e da interface `BuildsState`
- Remover declaração `questlogImport` da interface `Window.dataAPI`
- Remover `usePython` state, checkbox e toda lógica condicional de `handleUrlImport` em `Builds.tsx`
- `handleUrlImport` chama diretamente `importFromUrlPython` — sem alternância

**Validação de URL (IMP-02)**
- Validação antes de disparar IPC, no renderer (`Builds.tsx`)
- Critério: URL deve começar com `https://questlog.gg/` e conter `character-builder` no pathname
- Feedback: exibir mensagem de erro no status inline imediatamente (sem disparar IPC)

**Feedback de Progresso (IMP-03)**
- Texto dinâmico inline — o campo de status existente muda conforme o scraper avança
- Estados: `"⏳ Iniciando scraper..."` → `"🔍 Extraindo stats..."` → `"✅ {nome} importado"`
- Via IPC events: main emite `questlog:progress` com `{ stage: 'starting' | 'extracting' | 'done' }` usando `webContents.send`; renderer escuta via listener no preload

**Classificação de Erros (IMP-04)**
- Mensagem direta por categoria, sem card expandível, sem detalhe técnico ao usuário
- Mensagem técnica raw vai para `console.error` apenas

| Situação | Mensagem exibida |
|----------|-----------------|
| URL não passa validação | `"URL inválida — cole o link completo do Questlog (questlog.gg/...character-builder/...)"` |
| Scraper Python não encontrado | `"Scraper não encontrado — verifique a instalação do throne_and_liberty_agent"` |
| Python não está no PATH | `"Python não encontrado no PATH — verifique a instalação do Python"` |
| Parse falhou (JSON inválido) | `"Scraper retornou dados inválidos — tente novamente ou reporte o erro"` |
| Output vazio / código não-zero | `"Scraper encerrou sem dados (código {N}) — verifique o link e tente novamente"` |
| Campos obrigatórios ausentes | `"Build importada com dados incompletos — campos obrigatórios ausentes"` |

**Nota sobre Python/Playwright (IMP-01 / UX)**
- Remover completamente qualquer texto/nota sobre requisitos de Python ou Playwright da UI

**Validação de Schema (IMP-05)**
- Output do scraper validado antes de salvar: campos obrigatórios ausentes → erro explícito, sem salvar build corrompida
- Campos obrigatórios mínimos: pelo menos um de `meta.character_name` ou `character_name` (fallback), e `stats` não-vazio

### Claude's Discretion
- Implementação exata dos IPC progress events (estrutura do payload, nome do canal)
- Timing de quando emitir `extracting` vs. `starting`
- Regex/parse exato para validação de URL
- Quais campos do output do scraper são obrigatórios para schema validation
- Se `parsePythonBuild` continua inline na store ou é movida para `engine/`

### Deferred Ideas (OUT OF SCOPE)
- Timeout configurável para o scraper → Fase 4 (QUA-01)
- Log de erros persistente em arquivo → Fase 4 (QUA-05)
- Separação formal de stdout/stderr com Zod validation → Fase 4 (QUA-02, QUA-03)
- `sourceUrl` armazenado no modelo de dados → Fase 2 (DAT-01)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMP-01 | Importador aceita apenas scraper Python — caminho tRPC direto removido da UI e do código | Código tRPC identificado em 3 locais: `main/index.ts` (handler + funções auxiliares), `preload/index.ts` (bridge), `useBuilds.ts` (store action + interface Window). UI em `Builds.tsx` (checkbox + lógica condicional). |
| IMP-02 | Campo de URL com validação de formato antes de disparar scraper | Validação via URL API nativa do browser no renderer. Critério definido pelo usuário. Campo de status já existe (`showStatus()`). |
| IMP-03 | Feedback de progresso: iniciando → extraindo → concluído / erro | Padrão Electron `webContents.send` + `ipcRenderer.on` via preload. `BrowserWindow` acessível via `_event.sender`. |
| IMP-04 | Erros classificados com mensagem acionável | 5 categorias mapeadas pelo usuário. Cada categoria já tem mensagem definida. Erros já chegam via `resolve({ error: ... })` no handler existente. |
| IMP-05 | Output do scraper validado contra schema antes de processar | Dois formatos suportados pelo `parsePythonBuild` existente. Validação de campos obrigatórios deve ocorrer antes de chamar `saveBuild`. |
</phase_requirements>

---

## Summary

Esta fase é majoritariamente uma operação de remoção e endurecimento do código existente — não requer novas dependências. O app Electron/React já possui toda a infraestrutura necessária: IPC handlers, bridge no preload, store Zustand e componente de UI com campo de status. O trabalho consiste em (1) excluir o caminho tRPC dos 4 arquivos identificados, (2) adicionar validação de URL no renderer antes de disparar IPC, (3) instrumentar o handler Python existente com eventos de progresso via `webContents.send`, e (4) endurecer a validação do output do scraper na store.

O padrão de IPC já está estabelecido no projeto: handlers usam `ipcMain.handle` para chamadas request/reply e podem usar `event.sender.send` para eventos unidirecionais. O renderer atualmente não tem listener de eventos push — isso precisa ser adicionado no preload e exposto via `contextBridge`. O estado de status já existe em `Builds.tsx` como `showStatus()` — os eventos de progresso simplesmente chamam essa função com textos diferentes.

**Recomendação primária:** Executar os 3 planos na ordem definida. Plan 01-01 (remoção do tRPC) é pré-requisito dos outros pois elimina a lógica condicional que Plans 01-02 e 01-03 precisam simplificar.

---

## Standard Stack

### Core (já no projeto — nenhuma instalação necessária)

| Biblioteca | Versão | Propósito | Observação |
|------------|--------|-----------|------------|
| Electron | ^31.2.1 | IPC main↔renderer, child_process | `ipcMain.handle`, `webContents.send`, `ipcRenderer.on` |
| React | ^18.3.1 | UI renderer | `useState`, hooks existentes em `Builds.tsx` |
| Zustand | ^4.5.5 | Store de estado | `useBuilds` já define actions, interface `BuildsState` |
| TypeScript | ^5.5.3 | Type safety | Interface `Window.dataAPI` declarada em `useBuilds.ts` |
| electron-vite | ^2.3.0 | Build / dev | Compila main + preload + renderer |

[VERIFIED: lido diretamente de `package.json` no projeto]

### Sem novas dependências necessárias

Nenhum pacote novo precisa ser instalado nesta fase. A validação de URL usa a API `URL` nativa do browser (disponível no renderer Electron sem polyfill). A classificação de erros é lógica condicional pura. A validação de schema é verificação de propriedades de objeto — sem necessidade de Zod nesta fase (Zod foi explicitamente deferido para Fase 4).

---

## Architecture Patterns

### Padrão de IPC existente no projeto

```
Renderer (React)           Preload (contextBridge)        Main (Node.js)
─────────────────          ──────────────────────         ──────────────
window.dataAPI.fn()   →    ipcRenderer.invoke(ch)    →   ipcMain.handle(ch)
                      ←    return value              ←   resolve(data)
```

### Novo padrão: IPC push events (progresso)

Para IMP-03, o main precisa emitir eventos enquanto o processo Python roda. O padrão Electron para isso é `webContents.send`:

```typescript
// main/index.ts — dentro do handler questlog:import-python
ipcMain.handle('questlog:import-python', (_event, url: string): Promise<unknown> => {
  return new Promise((resolve) => {
    // Emitir evento de progresso para o renderer
    _event.sender.send('questlog:progress', { stage: 'starting' })

    const proc = spawn(pythonBin, [scriptPath, url], { env: { ...process.env } })

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
      // Ao receber primeiros bytes de stdout, assume que extração iniciou
      if (stdout.length > 0 && !extractingEmitted) {
        _event.sender.send('questlog:progress', { stage: 'extracting' })
        extractingEmitted = true
      }
    })

    proc.on('close', (code) => {
      // ... resolve com sucesso ou erro
    })
  })
})
```

[ASSUMED] — padrão baseado no conhecimento da API Electron. `_event.sender` é o `WebContents` que originou a chamada invoke. Verificar se `_event.sender` está disponível após o processo fechar — pode ser necessário guardar referência antes do spawn.

```typescript
// preload/index.ts — adicionar ao dataAPI (ou separado)
onProgress: (cb: (payload: { stage: 'starting' | 'extracting' | 'done' }) => void) => {
  ipcRenderer.on('questlog:progress', (_event, payload) => cb(payload))
},
offProgress: () => {
  ipcRenderer.removeAllListeners('questlog:progress')
}
```

```typescript
// Builds.tsx — usar no handleUrlImport
useEffect(() => {
  window.dataAPI.onProgress(({ stage }) => {
    if (stage === 'starting')    showStatus('⏳ Iniciando scraper...', false)
    if (stage === 'extracting')  showStatus('🔍 Extraindo stats...', false)
  })
  return () => window.dataAPI.offProgress()
}, [])
```

### Validação de URL (Claude's Discretion — recomendação)

Usar a API `URL` nativa — mais robusta que regex simples:

```typescript
function isValidQuestlogUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return (
      url.hostname === 'questlog.gg' &&
      url.pathname.includes('character-builder')
    )
  } catch {
    return false
  }
}
```

[ASSUMED] — padrão padrão para validação de URLs em browsers/Node.js. A API `URL` está disponível no renderer Electron sem polyfill pois Electron usa Chromium.

### Validação de Schema (Claude's Discretion — recomendação)

Validação inline em `importFromUrlPython` na store, antes de chamar `parsePythonBuild`:

```typescript
function validateScraperOutput(obj: Record<string, unknown>): string | null {
  // Formato novo: meta + stats obrigatórios
  const isNewFormat = obj.meta != null && obj.stats != null
  const isOldFormat = obj.character_name != null || obj.folder_name != null

  if (!isNewFormat && !isOldFormat) {
    return 'Build importada com dados incompletos — campos obrigatórios ausentes'
  }

  if (isNewFormat) {
    const meta = obj.meta as Record<string, unknown>
    if (!meta.character_name && !meta.slug) {
      return 'Build importada com dados incompletos — campos obrigatórios ausentes'
    }
    const stats = obj.stats as Record<string, unknown>
    if (!stats || Object.keys(stats).length === 0) {
      return 'Build importada com dados incompletos — campos obrigatórios ausentes'
    }
  }

  return null // válido
}
```

Manter `parsePythonBuild`, `parseNewScraperFormat` e `parseOldFormat` inline na store — mover para `engine/` é Claude's Discretion mas não há benefício claro nesta fase.

### Estrutura de arquivos a modificar

```
electron/
├── main/index.ts          # MODIFICAR: remover tRPC, adicionar webContents.send
└── preload/index.ts       # MODIFICAR: remover questlogImport, adicionar onProgress/offProgress
src/
├── store/useBuilds.ts     # MODIFICAR: remover importFromUrl, adicionar validateScraperOutput
└── pages/Builds.tsx       # MODIFICAR: remover usePython/checkbox, simplificar handleUrlImport
```

### Anti-Patterns a evitar

- **Emitir `questlog:progress` após a janela fechar:** O `_event.sender` pode ser destruído. Guardar referência ou verificar `isDestroyed()` antes de emitir.
- **Validar URL no main process em vez do renderer:** A decisão do usuário é clara — validação ocorre no renderer antes de disparar IPC. O main não precisa revalidar.
- **Salvar build antes de validar schema:** A validação deve acontecer antes de `get().saveBuild(build)` — nunca após.
- **Expor stderr ao usuário:** Erros técnicos vão apenas para `console.error`. O usuário vê apenas a mensagem categorizada.

---

## Don't Hand-Roll

| Problema | Não construir | Usar | Por quê |
|----------|--------------|------|---------|
| Validação de URL | Regex manual para parse de hostname | `new URL(str)` (nativo) | URL API trata edge cases: punycode, trailing slashes, query strings |
| Eventos push IPC | Polling periódico no renderer | `webContents.send` + `ipcRenderer.on` | Padrão oficial Electron para comunicação unidirecional main→renderer |
| Validação de schema | Biblioteca externa (Zod) | Verificação manual de propriedades | Zod foi deferido para Fase 4; verificação manual é suficiente para os 2 campos obrigatórios desta fase |

---

## Inventário de Código a Remover (IMP-01)

### `electron/main/index.ts`

Remover completamente:
- Constante `TRPC_BASE` (linha 94)
- Função `extractSlugAndBuildId` (linhas 96-107)
- Função `trpcGet` (linhas 109-124)
- Handler `ipcMain.handle('questlog:import-url', ...)` (linhas 126-156)
- Import `net` de `'electron'` (usado apenas pelo tRPC) — **verificar se `net` é usado em outro lugar antes de remover**

Manter:
- Toda a seção `// ─── Python scraper import ───` (linhas 158-222)
- Constante `PYTHON_SCRAPER`, função `findPythonScraper`, handler `questlog:import-python`

### `electron/preload/index.ts`

Remover:
- `questlogImport: (url: string) => ipcRenderer.invoke('questlog:import-url', url)` (linha 11)

Adicionar:
- `onProgress` e `offProgress` ao `dataAPI`

### `src/store/useBuilds.ts`

Remover:
- Import `parseQuestlogResult` e `QuestlogApiResult` de `'../engine/questlogParser'` (linhas 4-5)
- Propriedade `importFromUrl: (url: string) => Promise<Build | { error: string }>` da interface `BuildsState` (linha 20)
- Declaração `questlogImport` na interface `Window.dataAPI` (linha 36)
- Implementação do action `importFromUrl` (linhas 137-148)

Adicionar:
- Função `validateScraperOutput` antes de `parsePythonBuild`
- Chamada de validação em `importFromUrlPython` antes de `parsePythonBuild`

### `src/pages/Builds.tsx`

Remover:
- Import `importFromUrl` do useBuilds (linha 97)
- State `usePython` e `setUsePython` (linha 108)
- Lógica condicional em `handleUrlImport` — substituir por chamada direta a `importFromUrlPython`
- Checkbox "Scraper Python (Playwright — stats completos)" (linhas 247-255)
- Nota de rodapé sobre requisitos Python/Playwright (linhas 276-279)

Adicionar:
- Validação de URL no início de `handleUrlImport` (antes de setar `urlLoading`)
- `useEffect` para registrar/remover listener de progresso

---

## Common Pitfalls

### Pitfall 1: `_event.sender` destruído antes do processo Python terminar

**O que acontece:** Em casos de janela fechada durante o scraping (raro mas possível), `_event.sender.send(...)` lança exceção pois o `WebContents` foi destruído.

**Por que acontece:** O spawn do Python é assíncrono e pode durar 30+ segundos. A janela pode ser fechada durante esse tempo.

**Como evitar:** Verificar `!_event.sender.isDestroyed()` antes de cada `send`:
```typescript
if (!_event.sender.isDestroyed()) {
  _event.sender.send('questlog:progress', { stage: 'starting' })
}
```

**Sinais de alerta:** Exception no main process: `"Error: Object has been destroyed"` ou `"Cannot read properties of null"`.

### Pitfall 2: Leak de listener de progresso entre importações

**O que acontece:** Se o `useEffect` não remover o listener ao desmontar, múltiplas importações acumulam listeners — o callback de progresso é chamado N vezes por evento.

**Por que acontece:** `ipcRenderer.on` adiciona listeners sem substituir os anteriores.

**Como evitar:** Usar `ipcRenderer.removeAllListeners('questlog:progress')` no cleanup do `useEffect`, ou usar `ipcRenderer.once` se o evento for emitido apenas uma vez por importação.

### Pitfall 3: `parsePythonBuild` retorna `null` sem mensagem de erro ao usuário

**O que acontece:** `parsePythonBuild` faz `catch { return null }` — se retornar null sem validação prévia, o usuário vê "Não foi possível parsear o resultado do scraper." sem saber o motivo.

**Por que acontece:** O try/catch interno suprime o erro real.

**Como evitar:** A validação de schema (IMP-05) deve acontecer **antes** de chamar `parsePythonBuild` — assim a mensagem categorizada é retornada antes de entrar no parser.

### Pitfall 4: Import do `net` de Electron removido prematuramente

**O que acontece:** `net` é importado junto com outros símbolos de `electron` na linha 1. Se removido sem verificar, quebra o build.

**Por que acontece:** Import destrutivo compartilha a mesma linha: `import { app, shell, BrowserWindow, ipcMain, dialog, net } from 'electron'`.

**Como evitar:** Verificar se `net` é usado em outro local antes de remover. Na versão atual do código, `net` é usado apenas por `trpcGet` — portanto pode ser removido do import junto com o handler.

### Pitfall 5: TypeScript continua compilando com `questlogImport` na interface Window

**O que acontece:** Se `questlogImport` for removido do preload mas não da declaração de interface em `useBuilds.ts`, TypeScript não erro — mas o runtime vai falhar silenciosamente pois o método não existe.

**Por que acontece:** A interface `Window.dataAPI` em `useBuilds.ts` é uma declaração ambient — não é validada contra o preload em tempo de compilação.

**Como evitar:** Remover `questlogImport` dos dois locais simultaneamente: `preload/index.ts` (implementação) e `useBuilds.ts` (declaração de tipo).

---

## Code Examples

### Padrão de classificação de erros no handler Python (main)

O handler atual retorna `{ error: string }` com mensagens cruas. Deve ser refatorado para mensagens categorizadas:

```typescript
// electron/main/index.ts — handler questlog:import-python refatorado
ipcMain.handle('questlog:import-python', (_event, url: string): Promise<unknown> => {
  return new Promise((resolve) => {
    const scriptPath = findPythonScraper()
    if (!scriptPath) {
      resolve({ error: 'Scraper não encontrado — verifique a instalação do throne_and_liberty_agent' })
      return
    }

    if (!_event.sender.isDestroyed()) {
      _event.sender.send('questlog:progress', { stage: 'starting' })
    }

    const pythonBin = process.platform === 'win32' ? 'python' : 'python3'
    let extractingEmitted = false
    let stdout = ''
    let stderr = ''

    const proc = spawn(pythonBin, [scriptPath, url], { env: { ...process.env } })

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
      if (!extractingEmitted && stdout.length > 0) {
        extractingEmitted = true
        if (!_event.sender.isDestroyed()) {
          _event.sender.send('questlog:progress', { stage: 'extracting' })
        }
      }
    })

    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[scraper] stderr:', stderr)
        resolve({ error: `Scraper encerrou sem dados (código ${code}) — verifique o link e tente novamente` })
        return
      }
      const jsonStart = stdout.indexOf('{')
      if (jsonStart === -1) {
        console.error('[scraper] stdout sem JSON:', stdout.slice(0, 200))
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
        return
      }
      try {
        resolve(JSON.parse(stdout.slice(jsonStart)))
      } catch (e) {
        console.error('[scraper] JSON parse error:', e)
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
      }
    })

    proc.on('error', (err) => {
      console.error('[scraper] spawn error:', err)
      if (err.message.includes('ENOENT')) {
        resolve({ error: 'Python não encontrado no PATH — verifique a instalação do Python' })
      } else {
        resolve({ error: `Scraper encerrou sem dados (código ?) — verifique o link e tente novamente` })
      }
    })
  })
})
```

[ASSUMED] — estrutura baseada no handler existente, adaptada com as mensagens definidas pelo usuário.

### Validação de URL no renderer (Builds.tsx)

```typescript
async function handleUrlImport() {
  const url = urlInput.trim()
  if (!url) return

  // Validação antes de disparar IPC
  if (!isValidQuestlogUrl(url)) {
    showStatus('URL inválida — cole o link completo do Questlog (questlog.gg/...character-builder/...)', true)
    return
  }

  setUrlLoading(true)
  const result = await importFromUrlPython(url)
  setUrlLoading(false)

  if ('error' in result) {
    showStatus(result.error, true)
  } else {
    setUrlInput('')
    showStatus(`✅ ${result.name} importado`, false)
  }
}

function isValidQuestlogUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.hostname === 'questlog.gg' && url.pathname.includes('character-builder')
  } catch {
    return false
  }
}
```

---

## State of the Art

| Abordagem Atual | Abordagem Após Fase 1 | Impacto |
|----------------|----------------------|---------|
| 2 caminhos de importação (tRPC + Python) com checkbox | 1 caminho único (Python scraper) | Menos superfície de erro; UX mais simples |
| Mensagens de erro cruas do processo Python | Mensagens categorizadas com ação clara | Usuário entende o que fazer quando falha |
| Sem feedback durante scraping (~30s) | 3 estados de progresso visíveis | UX muito melhor em operações longas |
| Schema não validado antes de salvar | Validação de campos obrigatórios antes de `saveBuild` | Elimina builds corrompidas silenciosas |

---

## Assumptions Log

| # | Claim | Seção | Risco se Errado |
|---|-------|-------|-----------------|
| A1 | `_event.sender` é o WebContents que originou o `invoke`, acessível dentro do handler como `_event.sender.send(...)` | Architecture Patterns | Se a API for diferente, o padrão de progress events não funciona — precisaria de outra abordagem (ex: guardar referência à `mainWindow`) |
| A2 | `_event.sender.isDestroyed()` existe e retorna boolean | Common Pitfalls | Se método não existir, o guard vai lançar exceção — usar `try/catch` como fallback |
| A3 | `ipcRenderer.removeAllListeners('questlog:progress')` remove apenas listeners desse canal | Architecture Patterns | Se remover listeners de outros canais, pode quebrar outras funcionalidades |
| A4 | `net` de Electron é usado apenas pelo `trpcGet` na versão atual do `main/index.ts` | Inventário de Remoção | Verificado diretamente no código lido — confiança ALTA neste ponto específico |

**Nota sobre A4:** A leitura direta do arquivo confirmou que `net` aparece apenas em 1 lugar: na função `trpcGet`. [VERIFIED: lido diretamente de `electron/main/index.ts`]

---

## Open Questions

1. **Timing exato de `extracting` vs `starting`**
   - O que sabemos: `starting` é emitido logo ao spawnar; `extracting` ao receber primeiros bytes de stdout
   - O que não está claro: o scraper pode demorar 20-30s antes de qualquer stdout — emitir `extracting` imediatamente após `starting` (com delay?) ou só ao receber dados reais
   - Recomendação: emitir `extracting` na primeira callback `proc.stdout.on('data', ...)` — isso reflete dado real e não requer timer artificial

2. **`parsePythonBuild` inline vs `engine/`**
   - O que sabemos: CONTEXT.md deixa como Claude's Discretion; CONTEXT.md indica "permanecem intactos nesta fase"
   - Recomendação: manter inline na store nesta fase — Fase 4 (QUA-02/03) pode fazer a reorganização formal junto com validação Zod

---

## Environment Availability

| Dependência | Requerida por | Disponível | Versão | Fallback |
|-------------|--------------|------------|--------|---------|
| Node.js / Electron dev | Build do projeto | ✓ | electron ^31.2.1 | — |
| Python (runtime) | questlog:import-python | Não verificável aqui | — | Erro categorizado IMP-04 já trata ausência |
| `questlog_scraper_standalone.py` | questlog:import-python | Não verificável aqui | — | `findPythonScraper()` retorna null → erro categorizado |

Step 2.6: Dependências externas (Python, scraper) são detectadas em runtime pelo código existente — não afetam a execução desta fase de desenvolvimento.

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Nenhum detectado no projeto |
| Config file | Não existe (nenhum jest.config, vitest.config, etc.) |
| Quick run command | `npm run build` (verificação TypeScript via electron-vite) |
| Full suite command | `npm run build` + verificação manual no app |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de Teste | Comando Automatizado | Arquivo Existe? |
|--------|--------------|---------------|----------------------|-----------------|
| IMP-01 | UI sem checkbox tRPC; handler removido do main | Manual + TypeScript | `npm run build` (sem erros de tipo) | ❌ Wave 0 não aplicável |
| IMP-02 | URL malformada → erro inline sem disparar IPC | Manual | Testar no app: colar URL inválida | ❌ |
| IMP-03 | Status muda: iniciando → extraindo → concluído | Manual | Testar no app: importar URL válida | ❌ |
| IMP-04 | Erros categorizados com mensagem correta | Manual | Testar no app: cada cenário de erro | ❌ |
| IMP-05 | Output inválido rejeitado, build não salva | Manual | Testar no app: mockar output inválido | ❌ |

### Sampling Rate

- **Por task commit:** `npm run build` — garante zero erros TypeScript
- **Por wave merge:** `npm run build` + smoke test manual no app
- **Phase gate:** Verificação manual de todos os 5 success criteria antes de `/gsd-verify-work`

### Wave 0 Gaps

Nenhum framework de testes está configurado. Dado o ambiente Electron (processo main + renderer), testes unitários automatizados requereriam setup não-trivial (electron-mocha ou vitest com mocks de IPC). O planner deve avaliar se o custo de setup vale para esta fase de remoção/refatoração.

**Recomendação:** Para esta fase, `npm run build` (zero erros TypeScript) + verificação manual dos 5 success criteria é a estratégia de validação adequada. Framework de testes pode ser adicionado como item de Fase 4 junto com outras melhorias de qualidade.

---

## Security Domain

Esta fase não introduz novas superfícies de ataque. A remoção do tRPC **reduz** a superfície de ataque (elimina chamada HTTP externa). Não há autenticação, inputs de usuário chegam via IPC local, e o scraper Python roda localmente. `security_enforcement` não está configurado no `config.json` — tratado como habilitado por padrão.

### Applicable ASVS Categories

| Categoria ASVS | Aplica | Controle |
|----------------|--------|---------|
| V2 Authentication | não | App local sem autenticação |
| V3 Session Management | não | Sem sessões |
| V4 Access Control | não | Single-user local |
| V5 Input Validation | sim | Validação de URL no renderer (IMP-02) + validação de schema do scraper (IMP-05) |
| V6 Cryptography | não | Sem dados sensíveis criptografados |

### Threat Patterns

| Padrão | STRIDE | Mitigação |
|--------|--------|-----------|
| URL malformada → crash do process | Tampering | Validação via `new URL()` no renderer antes de disparar IPC |
| Output do scraper com dados corrompidos | Tampering | Validação de schema antes de `saveBuild` (IMP-05) |
| Command injection via URL no spawn | Tampering | URL passada como argumento posicional para Python, não interpolada em shell string — `spawn(bin, [script, url])` é seguro |

---

## Sources

### Primary (HIGH confidence — verificado diretamente no código do projeto)
- `electron/main/index.ts` — lido completo: identificados handlers tRPC, handler Python, pattern spawn
- `electron/preload/index.ts` — lido completo: interface dataAPI atual
- `src/store/useBuilds.ts` — lido completo: actions, parsers, interface Window.dataAPI
- `src/pages/Builds.tsx` — lido completo: UI, estado `usePython`, `handleUrlImport`, `showStatus`
- `src/engine/types.ts` — lido completo: interfaces `Build`, `BuildStats`, `DEFAULT_STATS`
- `package.json` — lido completo: versões de dependências confirmadas

### Secondary (ASSUMED — baseado em conhecimento da API Electron)
- Padrão `webContents.send` + `ipcRenderer.on` para eventos unidirecionais
- `_event.sender` como referência ao WebContents da janela que fez invoke
- `_event.sender.isDestroyed()` para guard contra WebContents destruído

---

## Metadata

**Confidence breakdown:**
- Inventário de remoção (IMP-01): HIGH — código lido diretamente, locais exatos identificados
- Validação de URL (IMP-02): HIGH — padrão com URL API nativa é standard
- Progresso IPC (IMP-03): MEDIUM — padrão webContents.send é correto; detalhes de `_event.sender` são ASSUMED
- Classificação de erros (IMP-04): HIGH — mensagens definidas pelo usuário, apenas mapeamento condicional
- Validação de schema (IMP-05): HIGH — lógica de validação inline, campos obrigatórios definidos pelo usuário

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (projeto local, sem dependências externas que mudem)
