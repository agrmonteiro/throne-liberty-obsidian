# Fundo dos overlays — 31/10/2026

## Causa

O fundo `--meter-background` era declarado por `overlayAppearance`, mas somente
`MeterPanel` o aplicava como cor inline. `OverlayMetricView` (dano recebido/cura)
tinha as variáveis de aparência e nenhum fundo efetivo. Na instância real,
o gráfico retornava `rgba(0, 0, 0, 0)`, enquanto o total retornava
`rgba(13, 15, 19, 0.75)`, apesar da mesma configuração de opacidade em 75%.

## Correção

O fundo agora é aplicado pela classe compartilhada `.meter-panel`, cobrindo
total, habilidades, dano recebido, cura, estados vazios, registros antigos e
detalhes. O estilo inline exclusivo de `MeterPanel` foi removido. A mesma cor
fica numa única superfície; não usar `opacity` na janela, para manter texto e
ícones opacos, nem sobrepor o fundo no pai e no painel.

A prévia do app continua usando a superfície do dashboard por seu estilo
específico. As janelas nativas respeitam a cor e a opacidade configuradas.
Não foi alterada a configuração de 75% do usuário, o foco, a captura ou o parser.

## Inventário de verificação

- Comparar cor calculada do gráfico com o total nas cinco páginas.
- Verificar opacidade mínima, máxima e a configuração original; texto permanece
  com opacidade 1 e o fundo acompanha o valor selecionado.
- Conferir também Origens, detalhe de habilidade e histórico/estado sem dados.
- Inspecionar visualmente o gráfico na janela nativa, com o jogo ao fundo.
- Recarregar somente renderers, mantendo o ID da captura, a medição e os ajustes.
- Build do Electron e verificação TypeScript do componente alterado.

## Resultado

Na instância real, as cinco páginas e a lista Origens passaram a retornar
`rgba(13, 15, 19, 0.75)` como fundo. Nos extremos do slider, retornaram
`rgba(13, 15, 19, 0.25)` e `rgb(13, 15, 19)`, mantendo opacidade 1 no conteúdo.
O detalhe de uma fonte em um registro real permaneceu sobre a mesma superfície,
sem acrescentar uma segunda camada de opacidade.

A inspeção visual no overlay nativo e sobre o jogo confirmou fundo escuro em
toda a área do gráfico, incluindo o espaço vazio abaixo das linhas. Cor, 75%,
página Dano recebido por fonte e seleção de registro atual foram preservadas.
O ID da captura permaneceu igual durante o reload; a leitura continuou ao vivo.
TypeScript e build passaram. Não foi necessário reiniciar o app ou a captura.
