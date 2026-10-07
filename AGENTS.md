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
