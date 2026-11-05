# Recuperação do desenvolvimento — Throne Builds

Atualizado em 30/10/2026. Leia este documento ao recuperar o projeto em outra
máquina ou retomar uma conversa sem o contexto anterior.

## Repositório e ponto de entrada

- Remoto: `https://github.com/agrmonteiro/throne-liberty-obsidian.git`.
- Branch de trabalho observada: `feat/onboarding-usabilidade`.
- Checkout usado nesta rodada: `C:\projetos\throne_and_liberty_node`.
- A pasta original do chat, `C:\Users\admin\OneDrive\Documentos\python`, não
  é a raiz deste app. Verifique `git rev-parse --show-toplevel` antes de editar.
- Os caminhos absolutos deste documento são referências da máquina atual;
  scripts devem resolver arquivos a partir da raiz ou de sua própria pasta.
- App Electron/React/TypeScript; versão atual de `package.json`: 1.0.3.

## Recuperar código e ambiente

```powershell
git clone https://github.com/agrmonteiro/throne-liberty-obsidian.git
Set-Location throne-liberty-obsidian
git checkout feat/onboarding-usabilidade
npm ci
npm run build
npm run dev
```

Use a branch/commit que contenha este guia. Um clone só recupera commits
efetivamente enviados ao remoto; mudanças locais, arquivos apenas adicionados
ao índice e commits ainda não enviados exigem cópia separada do checkout/Git.
Antes de considerar o backup remoto atualizado, conferir `git status` e a
relação da branch com `origin`.

Para ferramentas de datamining:

```powershell
./tools/unreal/setup.ps1
./tools/unreal/probe.ps1
```

As versões, fontes, hashes, comandos e resultados da primeira inspeção estão
em [tools/unreal/README.md](../tools/unreal/README.md). Reinstalar o TL pela Steam
se os arquivos do jogo também tiverem sido perdidos. Não dependemos de copiar
a instalação de 100 GB para o repositório.

## Dependências específicas do medidor

A captura ao vivo foi testada em Windows com Python 3.14 de 64 bits, Npcap 1.89
com Loopback e ExitLag ativo para TL. Esses componentes são externos ao Git.
O fluxo atual captura a conexão local usada pelo ExitLag; suporte ao caminho
sem ExitLag permanece pendente. Conferir a localização do Python ao restaurar.

Build do Electron gera `dist-electron/main/index.js`, preload e renderer.
Os workers Python usados no pacote ficam declarados em `extraResources`
no `package.json`. As ferramentas Unreal ficam separadas do produto.

Manter uma única instância do app. `electron/main/index.ts` usa
`app.requestSingleInstanceLock()`. Para validar a interface no perfil normal,
reaproveitar a instância existente; não iniciar outra captura de QA nesse perfil.

## Decisões dos overlays

Importação da ficha por pacotes: consultar
[IMPORTACAO-FICHA-PACOTES.md](IMPORTACAO-FICHA-PACOTES.md). Inclui esquema,
validação visual, catálogo, reconexão e importação em Builds. Preservar também
`<userData>/data/character-snapshots.json` e `Build.characterSnapshot` no backup
dos dados; não usar essas leituras para restaurar identidade ao vivo.

Buffs/debuffs e presença durante a atividade: consultar
[OVERLAY-BUFFS-PROTOCOLO.md](OVERLAY-BUFFS-PROTOCOLO.md). O catálogo gzip no
Git, as fixtures reais e os scripts permitem retomar o mapa de efeitos sem
recapturar tudo. A página de buffs, os eventos no recap e o journal ao vivo
estão em [OVERLAY-BUFFS-AO-VIVO.md](OVERLAY-BUFFS-AO-VIVO.md). Os JSONL em
`<userData>/logs/dps-meter/buffs/` exigem backup separado; não estão no Git.

Nomes de fontes NPC e habilidades recebidas: consultar
[OVERLAY-NOMES-DANO-RECEBIDO.md](OVERLAY-NOMES-DANO-RECEBIDO.md) antes de alterar
os vínculos de template/conexão ou regenerar os rótulos de monstros.

A análise do addon Details e o mapa de funções adaptadas/pendentes estão em
[DETAILS-OVERLAY-ADAPTACAO.md](DETAILS-OVERLAY-ADAPTACAO.md), com commit de referência,
caminhos úteis, cálculos e recuperação da cópia de consulta.

| Tema | Decisão e referência |
| --- | --- |
| Origem do dano | Seguir a entidade local identificada pelo protocolo, nunca o primeiro atacante ou o maior dano. `src/engine/overlayMeter.ts`, `electron/main/overlay.ts`. |
| Conexão e identidade | IDs de entidade são temporários, separados por conexão. Rejeitar conexões aposentadas e eventos atrasados. |
| Sessão | UUID próprio de encontro. A variante 2 do pacote `0x1234446c` indicou entrada/saída em dois ciclos da captura de 04/11: campos `2=2`/`3=2`, vinculados ao ator nominal da mesma conexão. O tempo congela na saída; variantes distintas não são interpretadas. Sem sinal, mantém fallback de cinco minutos. O cronômetro programado é independente. Nenhum ID nativo de encontro foi validado. |
| Ancoragem | Total, habilidades e controle acompanham a janela do TL; posições relativas ficam dentro da área do jogo. `overlayLayout.ts`. |
| Foco | Menus e janelas dos próprios overlays mantêm a cena visível. Considerar proprietários/ancestrais nativos dos popups. `docs/overlay-focus-qa.md`. |
| Aparência | Fonte, tamanho, cores, transparência e posicionamento persistidos. `chartPadding` ajusta a margem horizontal de 0 a 32 px (padrão 12); `chartPaddingVertical` ajusta acima/abaixo de cada linha de 0 a 32 px (padrão 10). |
| Nomes | Mapear por evidência explícita; não inferir nome por dano, proximidade numérica ou frequência. |
| Dano por alvo | A página `damageTargets` agrega o dano causado por ID de alvo e habilidade, com cascata proporcional ao total do alvo. Eventos sem ID ficam em alvo desconhecido; nomes chegam por perfil ou template de NPC da mesma conexão. O histórico anterior à coleta não permite reconstruir os alvos. |
| Especializações | Variantes com ícone próprio recebem nome distinto para não se fundirem com a habilidade base. |

Antes de investigar protocolo ou IDs, ler
[overlay-reference-index.json](overlay-reference-index.json) e
[overlay-protocol-reference.md](overlay-protocol-reference.md).

A referência de 10 minutos fica em
`capturas_treinamento/npcap_tl/20261030-094453-reference/`: 47.846 pacotes,
88.586 mensagens decodificadas e 6.392 eventos candidatos de dano. A regressão
do jogador local aceita 6.173 acertos / 20.146.692 de dano nessa amostra.
Não há log independente que valide toda a semântica desta coleta.

## Nomes e ícones: retomar o mapeamento

- `src/data/overlaySkillNames.json`: ID numérico → nome de exibição.
- `src/data/overlaySkillVariants.json`: variantes confirmadas, ID simbólico do
  catálogo e origem da evidência.
- `src/data/overlayDataminedSkills.json`: catálogo offline gerado dos arquivos
  locais, com IDs, símbolos, nomes PT/EN e ícones por ID. O dicionário curado
  tem prioridade sobre os nomes automáticos.
- `src/data/overlaySkillIcons.json` e `src/assets/skills/`: mapa e ícones WebP
  locais, incluídos no código para não depender de rede durante o uso.
- `scripts/atualizar-nomes-overlay.py`: cruza IDs com nomes explícitos em logs
  de combate; registra conflitos sem escolher por maioria.
- `scripts/cache-overlay-skill-icons.mjs`: baixa catálogo/ícones públicos do
  Questlog. `--cached` depende de caches em `scratch/`; em uma máquina nova,
  executar sem essa opção. O resultado pode mudar se a fonte for atualizada.
- `docs/overlay-skill-icon-sources.json`: proveniência dos ícones baixados.
- `docs/coletas/resultados/overlay-staff-wand-pending.json`: IDs pendentes de
  cajado/varinha e confirmação fornecida pelo usuário.

Confirmado pelo usuário: **968448884 → Raio do Julgamento (Uso consecutivo)**.
O catálogo fornece o ícone `S_WP_ST_PowerAttack_SP` da variante simbólica
`WP_ST_S_PowerAttack_Casting`. O vínculo foi inicialmente informado pelo usuário
e depois validado no `TLSkill.UID` da build 26231302. Os nove IDs desse
levantamento já têm correspondência estática no catálogo completo.

`resolveOverlayNames` permite atualizar nomes e agrupar linhas no renderer
sem reiniciar a captura nem alterar totais/acertos/categorias. O processo
principal usa o dicionário embarcado carregado ao iniciar. Recarregar apenas
os renderers aplica nomes novos à exibição atual; reiniciar o app cria outra
medição. Mudanças de aparência não devem resetar a sessão.

## O que exige backup separado

| Local | Conteúdo e recuperação |
| --- | --- |
| `%APPDATA%/tier2-command-lab/` | Perfil desta execução de desenvolvimento: builds, ajustes, histórico e logs. Copiar preservando a estrutura; o Git não recupera esses dados. |
| `data/overlay.json` dentro do perfil | Aparência/visibilidade/posições; recriável pela interface. IDs temporários não devem ser restaurados como identidade permanente. |
| `data/overlay-encounters.json` dentro do perfil | Resumos dos últimos 20 encontros; sem histórico bruto completo ou retomada dos contadores em memória. |
| `logs/dps-meter/unknown-skills/` dentro do perfil | JSONL e resumos auxiliares dos IDs desconhecidos; evidência local única. |
| `%LOCALAPPDATA%/TL/Saved/CombatLogs/` | Logs originais do jogo; reinstalar o jogo não recupera os logs antigos. |
| `capturas_treinamento/` | PCAPs, eventos decodificados, vídeos, screenshots e evidências ignoradas pelo Git. |
| `scratch/` | Caches e material intermediário. Parte pode ser regenerada, parte só existe localmente. |
| `.env` e credenciais | Recriar por meio do armazenamento privado apropriado; não incorporar ao Git. |
| `tools/unreal/.local/`, `exports/`, `bin/`, `obj/` | Downloads/cache/build/relatórios; recriar via setup/probe. Preservar exports únicos em backup separado. |

O perfil depende de `app.getPath('userData')`; uma versão instalada pode usar
outro nome. Verificar o caminho real antes de copiar/restaurar. Para copiar o
perfil com consistência, fechar o app. A captura de referência não é recuperável
bit a bit por uma nova coleta: sem backup, gerar outra amostra e registrar que
ela é uma nova evidência, sem reutilizar checksums ou resultados antigos.

## Validação após recuperar

```powershell
npm run build
node scripts/test-overlay-meter.mjs
node scripts/test-overlay-identity-state.mjs
node scripts/test-overlay-layout.mjs
node scripts/test-overlay-history.mjs
```

`node scripts/test-overlay-capture.mjs` também precisa da amostra local de
10 minutos citada acima. Testes Python de decoder/framing/local-player podem
exigir outras capturas locais; consultar os caminhos no respectivo script.
Não tratar ausência desses arquivos como falha já comprovada do algoritmo.

Validar no jogo: identificação local, dano novo chegando, uma instância do app,
overlays ancorados, clique/menu do controle sem ocultar os painéis, ajustes
persistidos e nomes/ícones das variantes. Os testes não cobrem todas as versões
do jogo. Rodadas anteriores já encontraram erros TypeScript em áreas alheias
ao overlay; distinguir falhas novas dos diagnósticos preexistentes.

## Estado da investigação de arquivos locais

Coleta completa da build 26231302 realizada com CUE4Parse e chave pública
fixada por fonte/hash. Foram exportadas 1.444 tabelas, traduções PT/EN e 13.076
recursos visuais. O índice tem 16.558 linhas de TLSkill e o catálogo do overlay
recebe 3.091 IDs positivos com nomes localizados, incluindo ataques básicos.

Consultar [DATAMINING-REFERENCE.md](DATAMINING-REFERENCE.md) para os caminhos
exatos, maestrias, Skill Cores, SQLite, consultas e atualização completa.
Snapshots compactos em `reference/datamine/26231302/` preservam catálogos no Git;
exports completos e SQLite continuam exigindo backup separado.

## Git, publicação e release

O estado de métricas recebidas, autocura bruta experimental, pausa e teste com
cronômetro está em [OVERLAY-METRICAS-E-CRONOMETRO.md](OVERLAY-METRICAS-E-CRONOMETRO.md).
Esse documento também corrige a hipótese de exclusividade do sinal `0x1234444a`
e registra os caminhos/evidências para retomar os testes de cura e vampirismo.

Guardar código, scripts, dados curados, ícones necessários, documentação e
lockfiles em commits. Binários de ferramentas e evidências pesadas ficam fora.
Um `git diff --stat` não lista conteúdo ainda não versionado: conferir também
`git status --short` e os arquivos incluídos no commit.

Não executar deploy/release para fazer backup de código. Push ao remoto exige
confirmação do usuário conforme `AGENTS.md`; publicar instalador, GitHub Release
e notificar Discord só quando houver pedido de release. Nenhum segredo deve
ser copiado para a documentação ou commits de recuperação.

## Causa mortis

Para retomar a linha do tempo de 50 eventos e a investigação de morte, consulte
`docs/OVERLAY-CAUSA-MORTIS.md`. Os registros locais ficam em
`<userData>/data/overlay-deaths.json`; não entram no Git. O sinal automático é
experimental e ainda aguarda confirmação contra uma morte do jogador.
