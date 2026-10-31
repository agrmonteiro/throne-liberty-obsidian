# Expansão de dano recebido por fonte — 31/10/2026

## Comportamento

Na página **Dano recebido por fonte**, a seta/nome do atacante expande ou recolhe
uma lista de habilidades abaixo da própria linha. Várias fontes podem ficar
abertas. A tabela filha mostra nome/ícone, dano, acertos e **% da fonte**, cujo
denominador é apenas o dano daquele atacante. Clicar na habilidade abre os
detalhes dentro da expansão; Voltar retorna à lista filha.

A apresentação preserva o fundo/opacidade e a tabela compacta existentes, com
recuo e uma borda de destaque para distinguir a lista filha. A expansão é estado
local: não troca de página, não reinicia o medidor e permanece associada ao ID
da fonte quando o ranking muda. Nova sessão/personagem fecha expansões antigas.
Botões têm `aria-expanded`, controle por teclado e área interativa no overlay
travado. O mesmo componente atende ao app, janela nativa e histórico.

## Dados e limites do histórico

`OverlayMeter` agora agrega, além dos totais existentes, um mapa de habilidades
por atacante. Cada evento precisa ter como alvo a origem selecionada e passar
pelas mesmas regras de conexão, pausa e cronômetro. `received.sources[].skills`
é opcional para manter compatibilidade com arquivos anteriores. Snapshots copiam
também arrays, IDs e parcelas de dano internos; a UI não altera o acumulado.
O resolvedor de nomes/ícones percorre as habilidades dentro de cada fonte, e o
histórico persiste essa relação junto ao nome/template do NPC.

Registros antigos com várias fontes não têm a relação necessária. A expansão
informa a ausência de detalhe; não atribui todas as habilidades globais a cada
atacante. Se há exatamente uma fonte e a soma de dano/acertos das habilidades
globais reconcilia com ela, o detalhe pode ser recuperado sem ambiguidade.
Novos registros sempre guardam a relação. O CSV e a comparação por fontes
continuam exibindo seus totais, sem contar linhas filhas novamente.

## Arquivos

- `src/engine/overlayMeter.ts`: agregação, reset, cópia e nomes das habilidades por fonte.
- `src/engine/overlayAnalysis.ts`: dados para a expansão e fallback exato de fonte única.
- `src/components/MeterSkillTable.tsx`: expansão acessível e inspeção filha.
- `src/styles/overlay.css`: lista filha compacta, fundo único e rolagem.

## Inventário de QA

| Caso | Verificação |
| --- | --- |
| Dois atacantes com a mesma habilidade | Danos e acertos separados em cada expansão |
| Um atacante com várias habilidades | Soma das filhas igual ao total da fonte; nomes/ícones resolvidos |
| Alvo de terceiros, pausa e cronômetro | Mesmos filtros dos totais; sem filhos indevidos |
| Persistência/cópia | Reabrir histórico preserva filhos; mutar snapshot não afeta o medidor |
| Abrir/recolher | Seta e `aria-expanded`; várias fontes abertas; teclado e modo travado |
| Inspecionar filha | Detalhes usam participação no dano daquela fonte; Voltar funciona |
| Busca/ordenação | Fontes e expansões permanecem vinculadas ao ID correto |
| Histórico anterior | Fonte única reconciliada é recuperável; várias fontes mostram ausência |
| Janela nativa | Leitura e rolagem sem overflow horizontal; fundo configurado preservado |
| Atualização | Captura anterior salva; carregar backend novo em uma única instância |

Regressões: `test-overlay-meter.mjs`, `test-overlay-analysis.mjs`,
`test-overlay-history.mjs`, `test-overlay-capture.mjs` (inclui amostra real de
10 minutos). TypeScript estrito em renderer e main/preload; build Electron.

## Resultados

- Testes de medidor, análise, persistência e backend passaram. Na amostra real,
  todos os 215 acertos / 213.047 de dano recebido reconciliam também por habilidade
  dentro de cada atacante, sem duplicação no agregado global.
- Em um registro real de fonte única, a expansão mostrou 17.427 de dano / 19
  acertos de Nevadinho Apanhador, com a habilidade “Cut Down” em 100% da fonte.
  A inspeção filha abriu média, taxa e parcelas de crítico/pesado; Voltar retornou
  à lista dentro da expansão.
- Clique e Enter abriram/recolheram. Duas expansões antigas ficaram abertas;
  ordenação manteve as duas e busca/limpeza do filtro preservou o vínculo correto.
  O botão funcionou também com overlay travado. Trocar de registro fechou as
  expansões da sessão anterior.
- Histórico antigo com várias fontes exibiu a mensagem de ausência, sem usar
  habilidades globais como se fossem específicas do atacante.
- Inspeção visual na janela nativa de 611×488: lista filha legível, fundo de 75%
  mantido e largura de rolagem horizontal igual à largura da janela (611 px).
- TypeScript e build passaram. O histórico e uma cópia local do estado foram
  preservados antes de carregar o backend novo em uma única instância. A sessão
  atual estava vazia, portanto não acrescentou um encontro sem atividade ao histórico; aguardar perfil confirmado
  para retomar a seleção automática, sem reutilizar uma entidade antiga.

## Detalhe em degraus — referência visual de 31/10/2026

O usuário esclareceu que os retângulos do desenho representam **habilidades
dentro de cada fonte**, não parcelas normal/crítico/pesado. A lista filha passa
a ser um gráfico em degraus: cada largura representa o dano da habilidade
dividido pelo total da fonte; o início é a soma das parcelas anteriores. A fonte
principal e as fontes seguintes continuam na lista. A seta abre/recolhe o grupo.
Os textos seguem **as mesmas colunas da fonte principal**: nome/ícone, dano,
% da fonte, dano/s, acertos e média. Somente o fundo da barra se desloca em
degraus; clicar no nome continua abrindo a inspeção da habilidade. Parcelas
pequenas não deslocam ou comprimem os textos. Parcelas positivas menores
que um pixel têm um traço mínimo de 1 px; parcela zero não ganha barra.

Inventário de QA desta revisão:

- Abrir/recolher por clique/Enter; várias fontes abertas e fontes seguintes visíveis.
- Degraus consecutivos, soma das larguras e valores reconciliando com a fonte.
- Inspeção de habilidade, Voltar, busca e ordenação preservados.
- Registro real com várias habilidades e fonte de uma habilidade (100%).
- Parcela minúscula/zero e nome longo: rótulos legíveis, nenhum overflow horizontal.
- App, histórico e janela nativa; fundo/opacidade, fonte e captura preservados.
- Atualizar somente os renderers, sem reiniciar o worker ou perder a identidade.

Resultados desta revisão: captura real de Lorde com cinco habilidades somando
162.087 e captura ao vivo com três habilidades conferidas. Expansão, Enter,
inspeção e Voltar funcionaram. No layout final, as seis posições X dos textos
filhos coincidiram exatamente com as da fonte (janela nativa de 726 px, sem
overflow). As barras continuam começando no final da anterior; somente o
preenchimento se desloca. A captura continuou durante os reloads de renderer.
O layout estreito de 480 px também foi conferido com uma cópia isolada do
registro real: as cinco colunas visíveis coincidem com as do pai e não há
overflow. A média acompanha a regra existente de ocultar a última coluna
nessa largura. O ajuste posterior da detecção de morte exigiu um reinício do backend, com
histórico e registro real de morte preservados antes de carregar a atualização.
