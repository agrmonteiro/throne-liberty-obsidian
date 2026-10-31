# Buffs ao vivo e registro recuperável — 31/10/2026

## Acesso e cobertura

A aba **Buffs** do medidor e a opção **Buffs e debuffs** em **Página do gráfico**
mostram efeitos recebidos pela origem selecionada. A consulta inclui nome(s)
do catálogo, origem quando o perfil está disponível, UID, acúmulos candidatos,
prazo estimado e até 200 eventos recentes envolvendo o personagem. Busca e
filtro distinguem benéfico, prejudicial, neutro e não classificado. A página
acompanha a leitura atual, independentemente do encontro antigo escolhido no DPS.

O estado é separado por captura, conexão e personagem. Reutiliza os bindings de
[OVERLAY-BUFFS-PROTOCOLO.md](OVERLAY-BUFFS-PROTOCOLO.md). Serial e cast continuam
strings; não representam uma sessão de combate. O tracker acompanha no máximo
2.048 estados recebidos e informa se atingir o limite. Update sem aplicação
prévia tem início desconhecido; conflito de metadados não comprova continuidade.
Não existe inventário completo dos efeitos ativos ao iniciar uma captura.

Somente uma remoção compatível encerra o estado observado. Zerar a estimativa
do contador não inventa uma remoção: a linha passa a mostrar **Sem remoção
recebida**. Silêncio não comprova término nem garante presença até o fim da luta.
Não calcular uptime completo a partir desses ciclos parciais.

Pausa/reset/cronômetro do DPS não apagam nem interrompem os buffs. Parar a leitura
interrompe a coleta; iniciar outra leitura ou trocar conexão/personagem descarta
o estado volátil anterior, preservando os arquivos e recaps já salvos.

## Recap

Os 50 eventos de causa mortis agora incluem aplicações, updates e remoções de
buff/debuff envolvendo o personagem. Há filtro **Buffs e debuffs**. Isso pode
reduzir a janela em segundos coberta pelos 50 eventos em combates com muitos
efeitos. Cada evento mantém o corpo e os campos brutos.

O recap também congela `buffs`, um snapshot dos efeitos recebidos sem remoção
observada naquele momento. Ele é independente dos 50 eventos e não prova que
todos ainda estavam ativos no jogo. Registros antigos continuam legíveis e não
ganham retrospectivamente buffs ausentes. O campo é opcional no schema 1.
**Recap agora** pode salvar um momento sem uma morte; o registro é chamado
**Recap manual**, sem afirmar óbito.

## Arquivos e recuperação

O app salva automaticamente, mesmo antes de identificar AgrMonteiro:

`<userData>/logs/dps-meter/buffs/<captureId>.jsonl`

O JSONL inclui efeitos de todas as entidades observadas, geração de conexão,
nomes/IDs de efeito, corpo hexadecimal e observações de perfil nominal recebidas
depois. Os perfis permitem atribuição offline dentro da mesma captura/conexão;
não selecionar o primeiro/maior atacante quando o perfil está ausente.

O buffer de disco descarrega a cada segundo ou 500 linhas. Até um segundo de
eventos pode ser perdido em encerramento abrupto. Parada normal descarrega o
buffer. Limite de **256 MiB por captura**: ao atingir, mostra erro e interrompe
a gravação do journal, mantendo a leitura/visualização. Outra leitura cria um
arquivo novo. Não há exclusão automática nem sobrescrita de nomes existentes;
arquivos se acumulam e precisam de backup separado do Git. A ação já existente
de limpar registros do medidor também inclui esse diretório.

Reprocessar sem PCAP nem SQLite:

```powershell
python scripts/analyze-overlay-buff-journal.py --journal "$env:APPDATA/tier2-command-lab/logs/dps-meter/buffs/ID-DA-CAPTURA.jsonl" --player-name AgrMonteiro
```

Saídas: `events.jsonl`, `intervals.json`, `summary.json`, na pasta vizinha
`<captureId>-analysis` (ou `--output`). O parser relê o corpo bruto; nomes de
perfil conflitantes são excluídos e ciclos são separados por captura/conexão.
Sem perfil correspondente, `selectedPlayers` permanece vazio. O resultado não
é injetado nos contadores do app. Para PCAP, manter o analisador anterior.

## Código e atualização do catálogo

- `scripts/analisar-npcap-tl.py::buff_state`: parser compartilhado pelo worker
  embarcado e pelo analisador offline; não exige novo recurso no instalador.
- `scripts/npcap-overlay-worker.py`: emite `buff` somente servidor → cliente,
  após reassemblagem TCP/deduplicação de retransmissões.
- `src/engine/overlayBuffs.ts`: escopo e estado observado em memória.
- `electron/main/overlayBuffLog.ts`: journal local.
- `src/components/OverlayBuffView.tsx`: consulta no app e overlay.
- `src/data/overlayBuffEffects.json`: projeção embarcada de 30.862 efeitos com
  classificação ou nomes; efeitos ausentes permanecem não classificados.
  Nomes PT têm preferência; EN preenche ausência. Variantes ambíguas permanecem
  listas e aparecem juntas, sem selecionar arbitrariamente uma variante.

Regenerar após atualizar o catálogo completo preservado no Git:

```powershell
python tools/unreal/build-buff-reference.py --build 26231302
python tools/unreal/build-overlay-buffs.py --build 26231302
npm run build
```

O segundo comando precisa somente do gzip de referência. O primeiro exige os
exports descritos em [DATAMINING-REFERENCE.md](DATAMINING-REFERENCE.md).

## Validação

- 50 frames reais: aplicação silenciosa, atualização de tempo, stacks,
  renovação, origem externa e fim por remoção.
- Worker: direção servidor, TCP e retransmissão sem duplicação.
- Tracker: serial de 64 bits, conflito, atraso, conexão diferente, início
  desconhecido, cópias isoladas e ausência de expiração inventada.
- IPC real em harness: buff externo durante pausa, reset preservando estado,
  journal antes da identificação e de outras conexões, recap congelado,
  dano sem alteração e encerramento da conexão limpando o escopo.
- Persistência: JSONL sem sobrescrita, limite de tamanho e recap com buffs.
- Interface isolada com fixture real: filtro/busca, inspeção, persistência da
  navegação e viewport de 480 px sem overflow horizontal. Interface real: aba,
  filtros e gravação ativa. Nenhum evento de teste foi injetado no perfil real.
- Amostra ao vivo inicial: 212 updates de buff reprocessados do novo JSONL,
  sem erros e com dois ciclos parciais. Não havia perfil nominal correspondente;
  isso valida gravação/releitura, não a identidade de AgrMonteiro nem buffs de
  uma luta completa em grupo. O Leviatã anterior continua sem journal de buffs.
- Na captura seguinte `1793489441047-2`, o perfil nominal confirmou AgrMonteiro
  na conexão `1b484a8c7d774659a3507091daa29820` (entidade temporária 12064612).
  O journal teve 246 eventos de várias entidades: 42 aplicações, 74 updates e
  130 remoções, com 29 intervalos completos e nenhum erro de releitura. Para
  esse personagem foram 51 eventos: 3 aplicações, 46 updates e 2 remoções.
  A interface real mostrou três estados recebidos sem remoção, incluindo
  Armadilha de Franco-atirador; dois efeitos ainda não têm nome localizado.
  Esses dados não correspondem à luta anterior contra Leviatã.
- Para carregar a versão final, os registros anteriores foram descarregados e
  foi mantida uma única instância. A retomada da origem nominal anterior usou
  o fallback já existente com `autoSource: true`, somente depois de comparar
  PID/data de criação do TL e o único socket loopback com portas/data de criação
  idênticos antes e depois. Isso não inventa um perfil recebido na nova captura;
  novos perfis nominais continuam sendo acompanhados. Não repetir essa retomada
  usando esses IDs em outra conexão ou execução do jogo.

```powershell
python scripts/test-overlay-buffs.py
node scripts/test-overlay-buffs.mjs
node scripts/test-overlay-capture.mjs
node scripts/test-overlay-death-log.mjs
node scripts/test-overlay-meter.mjs
```
