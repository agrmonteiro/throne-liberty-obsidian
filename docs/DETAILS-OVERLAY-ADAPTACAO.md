# Details! → overlays do Throne Builds

Análise e primeira adaptação: 30/10/2026.

## Fonte reproduzível

- Repositório solicitado: https://github.com/agrmonteiro/Details-Damage-Meter
- Commit examinado: `d1e8ad7226616b4a796eebc6ca3ed905ef410b64`.
- Cópia de consulta local: `scratch/Details-Damage-Meter`, ignorada pelo Git.
- `LICENSE`: **All rights reserved**. Nenhum código Lua, biblioteca, fonte,
  imagem ou outro asset do Details foi incorporado ao app. A implementação
  TypeScript é própria, baseada nos comportamentos observados e nos nossos dados.

Para recuperar a referência, clonar o repositório acima e conferir o commit antes
de analisar mudanças. A cópia de consulta não é dependência de build/runtime.

Arquivos úteis, relativos à raiz do Details:

| Caminho | O que consultar |
| --- | --- |
| `locales/Details-enUS.lua`, bloco `STRING_ATTRIBUTE_*` | Inventário dos modos: dano, cura, recursos e utilidades |
| `classes/class_combat.lua` | Combate atual, acumulado e tipos de segmento |
| `classes/class_spelldamage.lua` | Totais, contadores, mínimos/máximos e distribuição por alvo |
| `frames/window_breakdown/breakdown_spells_spellframes.lua` | Detalhes de habilidades, médias, acertos normais/críticos e alvos |
| `frames/window_breakdown/window_playerbreakdown_compare.lua` | Comparação de habilidades/alvos entre atores; adaptamos o conceito para medições do mesmo personagem |
| `frames/segments/window_segmentselection.lua` | Seleção de segmentos atuais/anteriores |
| `functions/currentdps.lua` | DPS recente por janela móvel de 5 s; diferente do DPS médio de sessão |
| `core/parser.lua`, registro de eventos | Dependência de eventos WoW de dano, cura, morte, aura, interrupção e dissipação |
| `frames/window_deathrecap.lua`, `functions/report.lua`, `plugins/` | Linha do tempo de morte, relatórios e extensões |

O addon usa APIs e eventos do WoW, como `CreateFrame` e eventos do log de combate.
Não é carregável dentro do TL/Electron. Nosso worker e os campos de protocolo
validados continuam sendo a única entrada de medição; nomes/descrições classificam
o catálogo, mas não demonstram que um evento de cura aconteceu.

## Mapa de adaptação

| Função do Details | Situação no Throne Builds | Próxima dependência |
| --- | --- | --- |
| Dano e DPS médio | Existente; contribuição por habilidade/s adicionada | Nenhuma |
| Cura e HPS | HPS bruto por habilidade adicionado; autocura experimental | Validar cura entre personagens e HP para cura efetiva |
| Dano recebido por habilidade/fonte | Existente; agora também pesquisável e detalhável | Perfis para nomes de fontes |
| Barras ordenáveis, pesquisa e participação | Implementado nas cinco páginas, ao vivo e histórico | Nenhuma |
| Clique para abrir uma habilidade | Implementado: total, participação, taxa, média e contadores | Mínimo/máximo requerem guardar novos agregados |
| Críticos | Existente; detalhamento mantém os contadores e quatro parcelas exclusivas do TL | Não inferir contagem da interseção crítico/pesado |
| Segmento atual e anteriores | Histórico existente de 20 medições; agora mostra todas as métricas disponíveis | Boss/fim de combate automático requerem sinal validado |
| Comparação | Implementada entre duas medições compatíveis do mesmo personagem, por total ou taxa | Não representa comparação de jogadores de uma raid |
| Relatório/exportação | CSV local das cinco páginas; inclui taxas, IDs, totais e cobertura | Nenhum envio a chat/Discord |
| Aparência, trava, posição e ocultação | Recursos já existentes preservados | Nenhuma |
| Dano por alvo | Possível: `targetId` está no evento, mas ainda não é retido nos agregados/histórico | Armazenar e resolver nomes por conexão; manter compatibilidade de snapshots |
| DPS recente e gráfico temporal | Viável, ainda não implementado | Série temporal limitada e relógio que respeite pausa/cronômetro; não usar variação do snapshot como se fosse evento |
| Min./máx., distribuição de acertos por tipo | Ainda não coletados | Acrescentar agregados opcionais e versionados; não reconstruir do total |
| Ranking de grupo, pets, inimigos | Origens observadas não equivalem a grupo nem cobertura completa | Composição do grupo, posse de pets e classificação de entidades |
| Overheal, absorção/escudos, cura efetiva | Não medidos | Eventos/HP e semântica de absorção confirmados |
| Mortes e recap de morte | Não implementados | Vida, morte e sequência temporal confirmadas |
| Interrupções, dissipações, ressurreições | Não implementadas | Eventos próprios validados |
| Uptime de buffs/debuffs, cooldowns | Não medidos | Aplicação, renovação, remoção, duração e origem dos efeitos |
| Recursos/mana | Não medidos | Deltas de recurso com causa e sinais validados |
| Threat/aggro, Mythic+, raid/boss e plugins WoW | Sem equivalente direto | Dados específicos do TL e desenho de produto separado |

## Regras dos cálculos

- Taxa de uma linha = total da linha / duração completa da sessão, inclusive
  intervalos sem atacar. Mantém pausa e janela cronometrada do medidor.
  Antes de 1 s, a taxa é 0, seguindo a convenção existente de DPS do app.
- Média = total / acertos ou aplicações observadas. **Não são casts**: uma
  habilidade pode gerar vários acertos, alvos, ticks ou procs.
- Busca aceita acentos ou texto sem acentos e IDs. O filtro não altera total,
  participação, escala das barras ou dados exportados. CSV sempre exporta a
  página completa, com UTF-8/BOM, ponto decimal e separador `;`.
- CSV escapa aspas e mantém nomes que começam como fórmulas como texto.
- Contadores de crítico e pesado se sobrepõem. A distribuição de dano separa
  normal, crítico, pesado e crítico pesado, sem duplicação do último.
- Comparação admite somente atribuição v2 e o mesmo modo (captura/reprodução).
  Identidade: nome de perfil igual ou mesma captura/conexão não nula/origem. Um ID igual
  em outra captura não comprova que é o mesmo personagem.
- Cada medição usa sua própria duração; taxas são o padrão para comparar testes
  de tempos diferentes. A UI permite total e informa medições parciais.
  Diferenças de alvo, buffs, condições e cobertura não são compensadas.
- Habilidades são pareadas por chave resolvida ou por UID compartilhado único.
  Cada parcela da referência é usada uma vez; habilidades exclusivas ficam
  presentes como nova/ausente. Base zero não gera percentual infinito.
- Fontes recebidas só podem ser comparadas na mesma captura e conexão
  não nula; IDs de entidades são temporários. Não cruzar conexões por ID.
- Histórico anterior à coleta de cura/recebido informa ausência de dados;
  não apresenta zeros como uma medição válida.
- Cura feita/recebida continuam contendo apenas a mesma autocura observada.
  HPS significa **bruto e parcial**, sem inferir overheal ou cura de aliados.

## Implementação e recuperação

A interface mantém a superfície escura, barras compactas e a cor de destaque do
usuário. Busca/ordenação ficam acima das linhas; detalhes ocupam o mesmo espaço
da tabela, com Voltar; comparação é contexto secundário do histórico. Transições
das barras e estados de hover/foco reutilizam o estilo atual e a preferência de
movimento reduzido. Abaixo de 560 px a média fica no detalhe para caberem as
colunas principais.

- `src/engine/overlayAnalysis.ts`: consulta, taxas, compatibilidade, comparação e CSV puros.
- `src/components/MeterSkillTable.tsx`: tabela comum e detalhes em app/overlay/histórico.
- `src/components/OverlayEncounterComparison.tsx`: comparação local no histórico.
- `src/components/MeterExportButton.tsx`: download local, sem API externa.
- `src/components/OverlayHistoryView.tsx`: páginas e referência independentes do ao vivo.
- `src/components/meterFormatting.ts`: formatação comum, sem dependência circular de componentes.
- `scripts/test-overlay-analysis.mjs`: regressões sem injetar dados na captura real.

Não houve mudança de parser, seleção de personagem, política de sessões, IPC,
configuração persistida ou agregados do backend nesta etapa. A alteração nativa
se limita a permitir foco nas janelas, para a busca receber teclado, e manter os
painéis visíveis durante uma consulta focada quando ocultar fora de combate está
ligado. A passagem de cliques das áreas travadas e `showInactive` permanecem.
Os renderers foram inicialmente atualizados sem interromper a captura; a mudança
de foco exige carregar o processo Electron novo, salvando a medição no histórico
antes e mantendo uma única instância. Nunca reutilizar a entidade após reiniciar
sem confirmar que processo/conexão do TL continuam sendo os mesmos.
Para mudanças futuras que acrescentem agregados, consultar primeiro
`overlay-protocol-reference.md`, `overlay-reference-index.json` e
`OVERLAY-METRICAS-E-CRONOMETRO.md`.

## Inventário de QA

| Recurso/estado | Verificação funcional | Verificação visual |
| --- | --- | --- |
| Busca por nome/UID e sem resultado | Filtrar dados reais; limpar e recuperar linhas sem mudar medição | Campo e mensagem legíveis em janela pequena |
| Ordem crescente/decrescente | Cabeçalhos por total, média, acertos e nome; regressão pura com totais invariantes | Indicador/seta e foco de teclado |
| Detalhe de habilidade/fonte | Abrir, conferir valores e voltar | Contadores, quatro parcelas, descrição de cura e rolagem |
| DPS/HPS e pausa | Testes de denominador e snapshot real | Rótulo explícito bruto e contribuição por segundo |
| Cinco páginas no histórico | Consultar atual/antigos sem alterar captura | Ausência de dados antigos explícita |
| Comparação | Dois registros reais compatíveis; trocar total/taxa; teste de identidades incompatíveis | Colunas, duração e sentido da diferença |
| CSV | Gerar download local, conferir dados/UTF-8 e escape | Botão habilitado apenas para dados disponíveis |
| Overlay travado e compacto | Botões de consulta usam áreas interativas; sem alterar trava/posição | Header móvel continua distinto; conteúdo sem corte horizontal |
| Sem dados e legado | Teste puro de campos ausentes e taxa <1s | Mensagem de ausência; não mostrar métrica desconhecida como 0 |
| Atualização durante consulta | Abrir detalhes com snapshots ativos; voltar | Seleção estável sem alternar a linha sozinha |

## Resultados de QA — 30/10/2026

- `node scripts/test-overlay-analysis.mjs`: passou. Busca por UID/acentos,
  ordenação, médias, denominadores, imutabilidade, identidades incompatíveis,
  comparação de durações diferentes, habilidades exclusivas e CSV/escape.
- `node scripts/test-overlay-meter.mjs`: passou. Origem, DPS, pausa, cronômetro,
  parcelas de dano, recebido, autocura, nomes/ícones e variantes preservados.
- `node scripts/test-overlay-capture.mjs`: passou. Backend real com dependências
  simuladas, foco/visibilidade durante consulta, isolamento de captura, timer e
  amostra real de 10 minutos: 6.173 acertos / 20.146.692 de dano local e 215
  acertos / 213.047 recebidos. Nenhum evento de teste entrou na sessão do usuário.
- TypeScript estrito nos componentes alterados, página e janela nativa, além de
  main/preload: passou. `electron-vite build`: passou.
- Electron real: busca `puxao` encontrou Puxão do Zéfiro; busca inexistente mostrou
  estado vazio; limpar restaurou as linhas. Ordenação e detalhes de dano, cura e
  fonte foram conferidos com dados capturados, sem fixtures na UI.
- As cinco páginas do histórico foram consultadas. Dois registros reais foram
  comparados por total e por segundo. Comparação de fontes entre conexões exibiu
  a limitação; registro antigo sem cura mostrou ausência e desabilitou exportar.
- Inspeção visual na janela atual de 611×488 e temporariamente em 480×488, com
  rolagem vertical e sem overflow horizontal. Consulta travada continuou operável.
  Tamanho, trava, página e âncoras originais foram restaurados após o QA.
- CSV pelo botão real e evento nativo `will-download`: estado `completed`, 2.160
  bytes, UTF-8/BOM, 13 linhas naquela leitura. Artefato local ignorado:
  `scratch/details-export-qa.csv`. Links `data:` foram usados porque o download
  Blob na origem `file:` foi interrompido no Electron deste ambiente.
- Os primeiros reloads mantiveram a captura ativa. Após o ajuste de foco nativo,
  houve um reinício necessário do Electron. Histórico/snapshot foram guardados
  antes; processo e geração TCP do TL foram comparados antes/depois e coincidiram.
  A entidade previamente confirmada por perfil foi retomada somente após essa
  checagem. A nova captura voltou a acumular dano.
- A janela do gráfico aceitou foco nativo (`isFocusable` e `isFocused`) e digitação
  no campo. Foi confirmada uma única instância principal do app, com seus processos
  filhos normais. Não houve push, release ou envio externo.
