# Organização visual do medidor — 22/10/2026

Tese visual: superfície escura calma, números legíveis e dourado reservado à
ação/seleção, com tabelas ocupando a área de trabalho em vez de uma página de textos.
Plano: quatro abas (Ao vivo, Origens, Histórico, Ajustes); resumo horizontal,
tabela ampla e instruções recolhidas nos ajustes. Sem imagens decorativas.
Interação: sublinhado da aba, transição curta de conteúdo e barras existentes;
respeitar preferência de movimento reduzido.

Inventário de validação:

- Primeiro viewport: captura e status, navegação, total/DPS/tempo/acertos,
  distribuição por tipo e tabela de habilidades sem scroll horizontal.
- Navegação por clique e setas/Home/End, ida e volta entre as quatro abas.
- Origens: busca, estado sem resultado e restauração da lista.
- Histórico: atualizar, selecionar registro e abrir/cancelar confirmação de limpeza;
  nenhum dado real apagado. Persistência/limpeza do backend já coberta separadamente.
- Ajustes: origem, detectar, checkboxes, ranges, atalhos, requisitos, replay e
  caminho de logs continuam acessíveis. Testar mudanças reversíveis só em QA.
- Replay pela interface, conferir tabela densa com nomes/valores e modo explícito.
- Janela normal 1280×800 e menor 1024×700; revisar ajustes, histórico e vazio.
- Recarregar apenas renderer normal, preservando fonte, captura e acumulado.

## Resultado

- Build passou. Conferidos vazio, captura real de referência (2.986.995/661)
  e fixture de QA com 20 habilidades/21.000.000, marcada como reprodução.
- Abas por clique e End no teclado, atalho Alterar origem, busca com/sem
  resultado, histórico/atualizar, abrir e cancelar limpeza, requisitos e replay.
- Checkboxes em ciclo ida/volta e ranges por teclado restaurados em QA.
  Origem manual, detectar novamente e reset testados somente no perfil isolado.
- Revisão a 1280×800 e 1024×700: sem scroll horizontal; números e colunas
  legíveis. Resumo horizontal, tabela com scroll próprio e cabeçalho fixo.
  Histórico/ajustes usam rolagem da página quando necessário; mudança de aba
  retorna ao topo. As animações foram aguardadas antes das capturas finais.
- Evidências: `capturas_treinamento/layout-medidor-denso.png`,
  `layout-medidor-menor.png`, `layout-medidor-historico.png` e
  `layout-medidor-ajustes.png`.
- Perfil de QA fechado. Aplicado ao app normal por reload dos renderers;
  total zero e origem 17746074 mantidos. Nenhum reset ou limpeza real executado.
- Escala dos overlays não reduz mais a tipografia dos dados no app. Estilos
  novos limitados ao dashboard; janelas flutuantes preservam layout e controles.
