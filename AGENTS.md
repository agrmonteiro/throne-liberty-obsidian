# Instruções do Projeto - Throne Builds

## Permissões e Aprovações

Atividades de baixo risco devem ser executadas diretamente sem solicitar aprovação ao usuário.

**Exemplos de atividades de baixo risco (executar direto):**
- Criar arquivos de código (`.ts`, `.tsx`, `.astro`, `.py`, etc.)
- Editar arquivos existentes do projeto
- Rodar testes (`npm run test-ui`, `playwright test`, etc.)
- Verificar compilação TypeScript (`astro check`, `tsc`)
- Ler arquivos e explorar o código
- Criar testes unitários ou E2E

**Exemplos de atividades de ALTO risco (pedir confirmação):**
- Deletar arquivos ou diretórios
- Fazer push para repositório remoto
- Modificar configurações de CI/CD ou deploy
- Ações irreversíveis em bancos de dados (drop, delete em produção)
- Publicar ou enviar para serviços externos

## Encaminhamento de tarefas ao Jarvis Dev

O agente principal deve priorizar o Jarvis Dev para tarefas curtas e de baixo risco com um resultado fácil de revisar. Exemplos incluem ajustes pequenos de interface, testes unitários, documentação, catálogos e refatorações pontuais. Leia a [skill do Jarvis Dev](.agents/skills/jarvis-dev/SKILL.md) para alinhar o escopo antes de encaminhar.

O usuário autorizou o envio à Groq do pedido e dos trechos de código necessários a essas tarefas, dentro do escopo do Jarvis Dev no Command Lab. Essa autorização vale para o encaminhamento automático de tarefas elegíveis. Aplique as demais regras de aprovação acima para qualquer envio ou ação fora desse escopo. Use apenas o contexto necessário e deixe credenciais, dados pessoais, logs privados e capturas de rede fora do pedido.

Encaminhe a tarefa antes de implementar a mesma mudança. No PowerShell, substitua o texto de exemplo por um objetivo e, quando conhecidos, os caminhos relevantes.

```powershell
$openJarvis = Join-Path $env:USERPROFILE 'Projects\OpenJarvis'
$python = Join-Path $openJarvis '.venv\Scripts\python.exe'
$jarvisDev = Join-Path $openJarvis 'scripts\jarvis-dev.py'
& $python $jarvisDev status
& $python $jarvisDev tarefa 'Revise src/App.tsx e sugira uma simplificação pequena.' --enviar-contexto-groq
```

Acompanhe a tarefa até o `report.md` aparecer. Revise `changes.diff` antes de integrar uma implementação e rode as verificações pertinentes. Cada tarefa parte do último commit local. Mantenha com o agente principal trabalhos que dependam de alterações ainda sem commit, depuração complexa, arquitetura, protocolo dos overlays, CI/CD, releases e publicação. Se o serviço estiver indisponível ou a tarefa falhar, prossiga localmente.

Esta seção orienta o agente principal. O Jarvis Dev executa o pedido no próprio worktree, sem encaminhá-lo novamente.

## Leitura de Arquivos

Ao ler arquivos grandes, usar `limit` de até 300 linhas por chamada (aproximadamente 20k tokens). Ler em partes sequenciais com `offset` quando necessário.

## Deploy / Release (throne_and_liberty_node)

Quando o usuário pedir **push de beta ou produção** do app Electron:

1. `npm run package` — gera o instalador (`.exe` via NSIS) na pasta `release/`
2. Criar um **GitHub Release** com a tag da versão (ex: `v1.0.1-beta.4`) no repo `agrmonteiro/throne-liberty-obsidian`
3. Fazer upload dos arquivos gerados em `release/` (`.exe` + `latest.yml`) para o Release
4. `npm run notify -- "Novidade 1" "Novidade 2" ...` — envia notificação de release no Discord

O auto-updater dos clientes detecta automaticamente o novo release e notifica dentro do app.

**Notificação Discord:**
- Script em `scripts/notify-discord.mjs`, webhook no `.env`
- As novidades são passadas como argumentos: cada string vira um item na lista
- Se nenhum argumento for passado, usa mensagem genérica de melhorias
- Para tag diferente da versão do `package.json`: `npm run notify -- --tag v1.0.0-beta.16 "Feature"`

## Idioma

Sempre responder em português brasileiro.

## Referência do protocolo dos overlays

Para reinstalar o ambiente ou continuar os overlays/datamining, leia primeiro
`docs/RECUPERACAO-DESENVOLVIMENTO.md` e `tools/unreal/README.md`.
Os caminhos e vínculos já validados do datamining ficam em
`docs/DATAMINING-REFERENCE.md`; consulte antes de redescobrir tabelas/ícones.

Antes de investigar IDs, identidade, sessões ou campos dos pacotes do overlay,
consulte `docs/overlay-reference-index.json` e `docs/overlay-protocol-reference.md`.
A amostra de 10 minutos contém o mapa e os PCAPs de evidência. IDs de entidades
são temporários e devem ser separados por conexão; não os fixe no código como
identidade permanente. Diferencie campos validados de hipóteses numéricas.
