# Dano agrupado por origem

Usa o agrupamento de origem já recebido pelo processo principal. O total de
cada origem é independente do filtro do medidor. A lista corresponde ao início
da leitura atual; não é uma reconstrução das origens dos históricos antigos.
Nenhuma origem é apresentada como jogador/monstro confirmado ou associada a nick.

Cobertura funcional e visual:

- Botão Dano por origem no app, totais e percentual, ordem por dano.
- Buscar ID, voltar à lista e ID inexistente; sem alterar origem/total selecionado.
- No overlay de habilidades, alternar Origens/Habilidades. Consultar outras
  origens não pode somar seu dano no medidor. Histórico continua separado.
- Vazio antes do primeiro dano; modo reprodução identificado.
- Barra proporcional ao maior dano, tabela e rodapé com limites legíveis.
- Conferir duas origens: 7 com 200 e 8 com 250. Total da leitura 450 e medidor
  selecionado na origem 7 com 200; agrupar/filtrar não muda esses valores.
- Recarregar só renderers do app normal, preservando captura e acumulado.

## Resultado

Build passou. Pela interface de replay em perfil isolado, origem 7 totalizou
200, origem 8 totalizou 250, lista total 450; medidor selecionado manteve 200.
Tabela ordenada 8/7, porcentagens 55,6%/44,4%; etiqueta selecionada apenas na 7.
Busca por 8 deixou uma linha, busca por 999 mostrou ausência, limpar voltou
à lista. Nenhuma busca alterou o filtro do processo principal.

No overlay, Origens abriu a tabela e Habilidades retornou às skills.
Revisão visual em `capturas_treinamento/overlay-origens.png`, 650×340,
com modo reprodução, identificação técnica, barras e valores legíveis.
Perfil de QA fechado; somente renderers normais recarregados, sem reset/captura
reiniciada. As origens agrupadas de registros antigos não foram reconstruídas.
