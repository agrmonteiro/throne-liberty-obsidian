# REVIEW.md — Challenge Review: Rebrand "Tier2 Command Lab" (beta.6 → beta.7)

**Data:** 2026-04-20
**Commits analisados:** `69e6f1c` (rebrand), `becb86a` (fix uninstaller)
**Escopo:** consistência de nomes, migração de dados, uninstall-cleanup.nsh, suposições questionáveis
**Modo:** adversarial — assume que usuários reais serão afetados

---

## RESUMO EXECUTIVO

O rebrand foi executado de forma parcialmente correta: a camada visual e o instalador foram atualizados, mas dois problemas críticos de produção permanecem intactos. O mais grave é a **perda silenciosa de dados de usuários existentes** — qualquer usuário que atualizar do beta anterior perderá todas as builds salvas sem aviso. O segundo é um **bug no texto do uninstaller** que confunde o usuário com o nome de pasta errado. Os demais itens são inconsistências de nomenclatura ou suposições questionáveis de design.

---

## HIGH — Problemas críticos

### H-01: Perda silenciosa de dados na atualização (userData path mudou)

**Arquivo:** `electron/main/index.ts:11` + `package.json:41`

**O problema:**
O Electron deriva `app.getPath('userData')` diretamente do `productName`. Antes do rebrand, o caminho era:

```
%APPDATA%\Throne & Liberty\
```

Após o rebrand, passa a ser:

```
%APPDATA%\Tier2 Command Lab\
```

O código `ensureDataDir()` cria o novo diretório se não existir e inicializa arquivos com valores padrão vazios (`builds.json: {}`, `settings.json: { theme: 'obsidian', port: 8501 }`). Isso significa que **todo usuário que instalar o beta.7 sobre o beta.6 simplesmente não terá mais suas builds nem suas configurações** — sem mensagem de erro, sem aviso, sem prompt de migração. O app simplesmente abre vazio.

**Por que é crítico:** O auto-updater (`autoDownload: true`) baixa e instala automaticamente. O usuário não precisa fazer nada para perder seus dados.

**Não há nenhum mecanismo de migração no código.** `ensureDataDir()` cria arquivos padrão sem antes verificar se o diretório antigo existe.

**Correção necessária — bloco a adicionar no início de `ensureDataDir()`:**
```typescript
// Migração one-shot: move dados do nome antigo para o novo
const OLD_DIR = path.join(app.getPath('appData'), 'Throne & Liberty')
const NEW_DIR = path.join(app.getPath('appData'), 'Tier2 Command Lab')
const MIGRATED_FLAG = path.join(NEW_DIR, '.migrated-from-throne')

if (fs.existsSync(OLD_DIR) && !fs.existsSync(MIGRATED_FLAG)) {
  fs.mkdirSync(NEW_DIR, { recursive: true })
  for (const file of ['builds.json', 'settings.json', 'scraper.log']) {
    const src = path.join(OLD_DIR, 'data', file)
    const dst = path.join(NEW_DIR, 'data', file)
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(src, dst)
    }
  }
  fs.writeFileSync(MIGRATED_FLAG, new Date().toISOString(), 'utf-8')
}
```

---

### H-02: uninstall-cleanup.nsh — texto do segundo MessageBox menciona caminho errado

**Arquivo:** `build/uninstall-cleanup.nsh:17`

```nsis
; LINHA 17 — BUG:
"Deseja remover o cache local do app em $LOCALAPPDATA\Throne & Liberty?..."
```

A string exibida ao usuário ainda menciona `Throne & Liberty`, mas o `RMDir` na linha seguinte (linha 22) apaga `$LOCALAPPDATA\Tier2 Command Lab`. Resultado: o usuário lê o nome antigo, confirma pensando que vai apagar uma pasta que já pode nem existir, e na prática apaga a pasta correta do app atual — ou não apaga nada se a pasta `Tier2 Command Lab` também não existir em `LOCALAPPDATA`.

**Adicionalmente:** o Electron não cria diretório em `LOCALAPPDATA` por padrão — `userData` vai para `APPDATA\Roaming`, não `LOCALAPPDATA`. A linha 11 do `RMDir /r "$APPDATA\Tier2 Command Lab"` (linha 11 do NSH) está correta para os dados do app. A linha 22 (`$LOCALAPPDATA\Tier2 Command Lab`) apaga o diretório de cache do Electron — que é gerado pela lib `electron-updater` e se chama `throne-liberty-updater` (conforme `app-update.yml:4`), não `Tier2 Command Lab`. Portanto a limpeza do cache do updater está **efetivamente inoperante** — o diretório que seria limpo não existe com esse nome.

**Correção:**
```nsis
; Linha 17 — corrigir o nome no texto
"Deseja remover o cache local do app em $LOCALAPPDATA\throne-liberty-updater?..."

; Linha 22 — corrigir o caminho real do cache do updater
RMDir /r "$LOCALAPPDATA\throne-liberty-updater"
```

O nome `updaterCacheDirName: throne-liberty-updater` está em `release/win-unpacked/resources/app-update.yml:4` e é gerado pelo `electron-builder` a partir do campo `name` do `package.json` (que ainda é `"throne-liberty"`). Esse campo também deveria ter sido atualizado no rebrand.

---

## MEDIUM — Problemas que podem confundir ou degradar a experiência

### M-01: `package.json` — campo `name` não foi atualizado

**Arquivo:** `package.json:2`

```json
"name": "throne-liberty",
```

O campo `name` do `package.json` é usado pelo `electron-builder` para derivar o `updaterCacheDirName` quando nenhum valor explícito é definido. O `app-update.yml` gerado no último build confirma que o cache do updater se chama `throne-liberty-updater`. Se em algum momento o `electron-updater` usar o `name` do pacote para outras finalidades (ex: mutex de single-instance, registry keys em algumas versões do NSIS), haverá inconsistência com o `productName`.

Este campo também aparece no `package-lock.json:2,8`, que não precisa de mudança manual mas fica inconsistente semanticamente.

**Correção:** mudar `"name"` para `"tier2-command-lab"` (npm name convension: lowercase, hifens).

---

### M-02: `appId` e `appUserModelId` não refletem o rebrand

**Arquivos:** `package.json:40`, `electron/main/index.ts:674`

```json
"appId": "com.thronebuilds.obsidian"
```
```typescript
electronApp.setAppUserModelId('com.thronebuilds.obsidian')
```

O `appId` é o identificador permanente do app no Windows (registro, Squirrel/NSIS, atualizações). **Mudar o `appId` em produção seria destrutivo** — o Windows trataria como app diferente, quebrando a cadeia de atualizações. Portanto, manter `com.thronebuilds.obsidian` provavelmente foi uma decisão **intencional e correta**.

No entanto, a decisão não está documentada em nenhum lugar do código. Uma linha de comentário como `// Não alterar — manter estável para continuidade de atualizações` seria suficiente para o próximo desenvolvedor não "corrigir" isso inadvertidamente.

**Ação recomendada:** apenas adicionar o comentário explicativo.

---

### M-03: `electron/main/index.ts:410` — mensagem de erro exposta ao usuário menciona nome interno de repositório

**Arquivo:** `electron/main/index.ts:410`

```typescript
resolve({ error: 'Scraper não encontrado — verifique a instalação do throne_and_liberty_agent' })
```

O nome `throne_and_liberty_agent` é o nome do repositório Python auxiliar. Após o rebrand do app principal, essa mensagem é confusa para o usuário final: o app agora se chama "Tier2 Command Lab" mas a mensagem de erro referencia um componente cujo nome não foi comunicado publicamente. Não é um bug de lógica, mas é a primeira mensagem que um usuário novo verá quando o scraper não estiver instalado.

---

### M-04: `src/engine/calculator.ts:2` — header do arquivo ainda usa nome antigo

**Arquivo:** `src/engine/calculator.ts:2`

```typescript
 * Throne & Liberty Damage Engine — TypeScript
```

Comentário de cabeçalho não atualizado. Para o motor de cálculo (o componente de maior valor técnico do app), o contexto de "Throne & Liberty" faz sentido como referência ao jogo — o app ainda analisa T&L. Mas se o objetivo do rebrand é desacoplar a marca do app da marca do jogo, esse header é o símbolo mais visível da marca antiga ainda presente no código-fonte principal.

---

### M-05: `src/pages/Calculator.tsx:414` — título de modal referencia "Throne & Liberty" diretamente

**Arquivo:** `src/pages/Calculator.tsx:414`

```tsx
<h2>🛠 Fórmulas de Dano (Throne & Liberty)</h2>
```

Este está visível para o usuário final dentro do modal "Fórmulas de Dano". Diferente de comentários internos, este é texto da UI. Como o jogo ainda se chama Throne & Liberty, pode ser intencional — mas é inconsistente com o posicionamento do rebrand.

---

## LOW — Inconsistências menores e suposições questionáveis

### L-01: `Sidebar.tsx:113` — versão hardcoded como "v1.0" no rodapé

**Arquivo:** `src/components/Sidebar.tsx:113`

```tsx
<div>v1.0 · Electron + React</div>
```

O footer da sidebar exibe `v1.0` estaticamente enquanto o `package.json` está em `1.0.0-beta.7`. Nenhuma dessas versões concorda com a outra. O rodapé deveria ler `app.getVersion()` via IPC ou importar a versão do `package.json` em build-time (`import { version } from '../../package.json'`).

---

### L-02: `uninstall-cleanup.nsh` — ausência de `skip_appdata` label com `RMDir` ainda executa se `IDNO` pular para label errado

**Arquivo:** `build/uninstall-cleanup.nsh:1-24`

O fluxo NSIS atual:

```nsis
MessageBox MB_YESNO ... IDNO skip_appdata
RMDir /r "$APPDATA\Tier2 Command Lab"
skip_appdata:
MessageBox MB_YESNO ... IDNO skip_localdata
RMDir /r "$LOCALAPPDATA\Tier2 Command Lab"
skip_localdata:
```

O label `skip_appdata` está posicionado **depois** do `RMDir`, portanto o `IDNO` funciona corretamente (pula o `RMDir`). O fluxo está correto nesse aspecto. Porém, se o usuário responder "Sim" para o primeiro `MessageBox` e "Não" para o segundo, o app apaga `$APPDATA\Tier2 Command Lab` mas não limpa o cache — o que é o comportamento esperado. Isso está OK.

O risco real aqui (já coberto em H-02) é que `$LOCALAPPDATA\Tier2 Command Lab` não é o diretório correto do cache do updater.

---

### L-03: `package.json` — repositório de publicação ainda usa nome antigo

**Arquivo:** `package.json:71`

```json
"repo": "throne-liberty-obsidian"
```

O repositório GitHub não foi renomeado — isso é esperado e deliberado (renomear quebraria o auto-updater de versões anteriores). Mas o nome do repo diverge do novo nome do produto, o que causará confusão futura para qualquer contribuidor que buscar o repositório pelo nome do app.

---

### L-04: Suposição questionável — `autoDownload: true` sem consentimento explícito

**Arquivo:** `electron/main/index.ts:585`

```typescript
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
```

Com `autoDownload: true`, o app baixa atualizações em background sem perguntar ao usuário. Combinado com o problema H-01 (migração de dados), o fluxo atual é: usuário recebe notificação de update → fecha o app → na próxima abertura, todos os dados estão no diretório antigo e o app abre vazio. O usuário não tem como optar por não atualizar neste ciclo.

Isso não é um bug no sentido estrito, mas é uma **suposição de design que amplifica o impacto do H-01**.

---

## SUMÁRIO

| ID   | Severidade | Arquivo                              | Descrição                                                        |
|------|------------|--------------------------------------|------------------------------------------------------------------|
| H-01 | HIGH       | `electron/main/index.ts:11`          | Perda silenciosa de dados: userData path mudou, sem migração     |
| H-02 | HIGH       | `build/uninstall-cleanup.nsh:17,22`  | Texto do MessageBox com nome antigo; RMDir apaga diretório errado|
| M-01 | MEDIUM     | `package.json:2`                     | Campo `name` não atualizado, afeta `updaterCacheDirName`         |
| M-02 | MEDIUM     | `package.json:40`, `index.ts:674`    | `appId` mantido correto mas sem comentário explicativo           |
| M-03 | MEDIUM     | `electron/main/index.ts:410`         | Mensagem de erro ao usuário menciona nome interno de repositório |
| M-04 | MEDIUM     | `src/engine/calculator.ts:2`         | Header de arquivo com nome antigo do produto                     |
| M-05 | MEDIUM     | `src/pages/Calculator.tsx:414`       | Texto de UI visível com referência ao nome antigo                |
| L-01 | LOW        | `src/components/Sidebar.tsx:113`     | Versão hardcoded `v1.0` no rodapé diverge da versão real         |
| L-02 | LOW        | `build/uninstall-cleanup.nsh`        | Fluxo NSIS correto, mas clareza dos labels pode ser melhorada    |
| L-03 | LOW        | `package.json:71`                    | Nome do repo diverge do produto (deliberado, mas confuso)        |
| L-04 | LOW        | `electron/main/index.ts:585`         | `autoDownload: true` amplifica o impacto silencioso do H-01      |

---

## PRIORIDADE DE AÇÃO

**Antes de publicar o beta.7 como release:**

1. **H-01** — Implementar migração de dados `%APPDATA%\Throne & Liberty` → `%APPDATA%\Tier2 Command Lab` em `ensureDataDir()`.
2. **H-02** — Corrigir o texto do MessageBox na linha 17 e o path do `RMDir` na linha 22 do `uninstall-cleanup.nsh` para apontar para `$LOCALAPPDATA\throne-liberty-updater`.

**Pode aguardar próximo ciclo:**

3. **M-01** — Atualizar `"name"` em `package.json` para `"tier2-command-lab"` e regenerar `package-lock.json`.
4. **M-03, M-04, M-05** — Revisão cosmética de strings de UI e headers de arquivo.
5. **L-01** — Conectar versão do rodapé ao `app.getVersion()` ou `import` do `package.json`.

---

_Revisão gerada em 2026-04-20 — foco adversarial em impacto de produção para usuários existentes._
