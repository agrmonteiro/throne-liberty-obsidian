# Histórico dos últimos 20 encontros

Regras: acumulado entre resets, mantendo 5 minutos de inatividade. Salvar também
ao parar, trocar origem, encerrar conexão/replay e fechar o app. Parcial salvo
periodicamente, sem preencher o histórico com sessões vazias ou duplicar a
mesma sessão. Lista local limitada a 20, da mais recente para a mais antiga.
Origem é ID técnico sem confirmação do nome; replay fica identificado.

Validação funcional e visual prevista:

- Vazio: mensagem de nenhum registro e botão Atualizar histórico.
- Captura/replay com dano: salvar total, categorias e linhas por habilidade.
- Criar dois registros pela interface, selecionar o anterior e voltar ao recente;
  o medidor atual não pode mudar e o histórico não oferece reset ou Auto.
- Atualizar consulta e reabrir app: manter os registros e ordem.
- Vinte registros: testar retenção e remoção do mais antigo por arquivo local.
- Fonte inválida: mostrar erro sem sobrescrever histórico anterior.
- Mesma origem após pausa: conservar identidade; outra origem não rouba seleção.
- Revisão visual dos painéis, seletor e indicação de somente leitura/reprodução;
  conferir limites horizontais e rolagem da página no tamanho inicial da janela.

Não há reconstrução automática das lutas anteriores à implementação. Snapshots
de teste ou identificados como origem incorreta não são importados como lutas.

## Resultado em 22/10/2026

- Build passou. Testes `test-overlay-history.mjs` e `test-overlay-meter.mjs`
  passaram: retenção de 25 para 20, ordem, reabertura, atualização sem duplicar,
  sessão vazia ignorada, cópia de consulta e arquivo corrompido preservado.
- Perfil Electron isolado: estado vazio, dois replays criados pela interface
  (350 e 700), atualização, seleção do anterior e volta ao recente. Consultar
  350 manteve o medidor atual em 700; nenhum botão de reset no histórico.
- Reabertura recuperou ambos, em ordem, identificados como reprodução.
- Revisão visual em `capturas_treinamento/overlay-history-qa.png`: números,
  categorias e nomes legíveis; somente leitura; sem overflow horizontal a 1280 px.
- Botão no topo Últimos 20 encontros navega ao histórico. App normal atualizado;
  tinha zero acertos antes de reiniciar. Nenhum registro de QA foi importado.
- Dados em `data/overlay-encounters.json` no perfil do app. Últimos 20 registros
  mantidos nesse arquivo; arquivos auxiliares de IDs desconhecidos são independentes.
- Removida troca automática de origem após 2 s: nenhuma pausa escolhe outro
  jogador. Identificação inicial ainda é heurística e não confirma personagem.

## Limpeza e seleção nos overlays — cobertura

- Botão Limpar registros, confirmação e Cancelar. A confirmação exclui apenas
  `logs/dps-meter` e esvazia `data/overlay-encounters.json` no perfil do app.
  Preservar outros logs, logs originais do jogo e o acumulado em memória.
- Descartar lote pendente de IDs desconhecidos e permitir novos arquivos após
  novos danos. Consultas/timer não recriam o histórico limpo sem novo dano.
- Recusar diretórios de logs redirecionados por links/junções; verificar escopo
  absoluto antes da exclusão recursiva. Unidade em perfil temporário isolado.
- Seletor Registro do overlay nos dois painéis, sincronizado. Selecionar registro
  anterior não altera o acumulado atual; botão Atual retorna nos dois painéis.
- Controles desabilitados ao travar/passagem de cliques; atalho global Atual
  Ctrl+Shift+F8 permanece disponível. Destravar por Ctrl+Shift+F9.
- Validar toolbar e conteúdo sem corte no painel total e por habilidade.
- Verificar confirmação/cancelamento, consulta sem registros e novo dano após
  limpeza; testar registro removido enquanto estava selecionado.
- Os testes de exclusão devem ocorrer somente no perfil de QA. A solicitação
  adiciona o botão; não implica limpar os registros reais durante a implementação.

### Resultado

- Build passou. `test-overlay-cleanup.mjs` e `test-overlay-history.mjs` passaram:
  exclusão só na pasta do medidor, arquivos de outro módulo preservados, lote
  pendente descartado, novos logs permitidos, junção recusada e histórico vazio
  persistido. Nenhum arquivo de logs real foi apagado pelos testes.
- No Electron de QA, seletor do total escolheu registro 350, o seletor de
  habilidades acompanhou, mantendo o atual em 700. Botão Atual no outro painel
  retornou ambos ao atual. Controles ficaram desabilitados ao travar; atalho
  Ctrl+Shift+F8 registrado. Acionamento físico desse atalho fica para conferência.
- Cancelar limpeza preservou registros. Confirmação zerou lista e apagou pasta
  de logs em QA. Repetição conferiu atual 300 antes/abrir/cancelar/confirmar,
  sempre 300. Atualizar consulta não recriou registros sem novo dano; novo dano
  elevou o atual a 500 e iniciou novo registro. Arquivos reais não foram limpos.
- Revisão visual de toolbar, seletor, total e detalhe somente leitura em
  `capturas_treinamento/overlay-controls-total.png` (340×292) e
  `overlay-controls-skills.png` (650×340). Altura mínima inclui a toolbar.
