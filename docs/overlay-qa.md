# Overlay de dano — implementação e validação

Interface: painéis escuros compactos, tipografia numérica estável e um acento
dourado. O total orienta a leitura; a lista ordenada detalha a participação.
As barras transitam discretamente, os controles respondem ao hover e a troca
de modo travado/edição remove as ações sobre o jogo. Sem animação decorativa.

Inventário de QA:

- Acumulado de uma origem escolhida, sem dividir por luta; outras origens ignoradas.
- Reset manual limpa total e todas as habilidades no mesmo estado central.
- Cinco minutos sem dano próprio: preservar números até o próximo dano, então
  começar nova sessão; limite exato de 300 s e intervalo menor testados.
- DPS = dano / tempo desde primeiro dano, incluindo pausas. Primeiro segundo
  exibe zero para evitar divisão por um intervalo quase nulo.
- Eventos anteriores ao reset não podem repovoar a sessão.
- Detalhes ordenados por dano, agrupando IDs com o mesmo nome. IDs sem nome
  continuam visíveis. Acertos não são número de ativações.
- Total e detalhe podem ser mostrados, ocultados, movidos e redimensionados
  separadamente; opacidade/escala compartilhadas. Posições ficam no perfil local.
- Travar passa os cliques ao jogo; Ctrl+Shift+F9 alterna edição e
  Ctrl+Shift+F10 mostra/oculta os dois painéis. Reset disponível no app sempre.
- Modo reprodução deve continuar identificado depois de concluir; nunca
  apresentar o acumulado de uma captura como dano ao vivo.
- Iniciar/parar captura, selecionar origem, alterar escala/opacidade e revisar
  captura devem ter feedback e estados de erro legíveis.
- Revisão visual: editor vazio e preenchido, janelas total/habilidades,
  tamanho mínimo de janela e controles de edição.

Limites atuais:

- Leitura experimental Python/Npcap; o caminho validado usa loopback do ExitLag.
- Origem é selecionada no app depois dos primeiros ataques. Ela é limpa em
  cada reinício da leitura. Nome da captura antiga é apenas referência e
  não identificação automática de personagem.
- Python e Npcap precisam estar instalados. O pacote inclui os scripts;
  não inclui o runtime Python nem instala drivers.
- Ainda não há buffs, cooldowns ou detecção de recusa. Classificação de
  eventos secundários segue a inferência validada nas capturas anteriores.
- Sessão em memória: fechar o aplicativo limpa o acumulado; posições persistem.
- Não houve publicação nem release nesta etapa.

## Verificado em 21/10/2026

- `npm run build` passou.
- `node scripts/test-overlay-meter.mjs` passou: origem, agrupamento, DPS com
  pausas, limite exato de 300 s, reset conjunto e rejeição de evento atrasado.
- `python scripts/test-overlay-decoder.py` passou: o decoder incremental
  reproduziu 661 eventos e 2.986.995 de dano da captura validada; alimentar as
  retransmissões novamente não duplicou os eventos.
- No Electron, a reprodução pela interface, a seleção da origem e os dois
  painéis chegaram a 661 acertos e 2.986.995 de dano. O relógio manteve 87,656 s
  da captura mesmo com reprodução 20×: DPS de 34.076,28, sem inflar pela velocidade.
- O botão de reset no painel total zerou o total e removeu todas as linhas
  da janela de habilidades e da prévia ao mesmo tempo.
- Janelas independentes, mostrar/ocultar, redimensionamento pelo canto,
  foco desabilitado ao travar, escala via mouse/teclado e opacidade conferidos.
  Tamanho mínimo do total corrigido para preservar o rodapé após alterar escala.
- Leitura Npcap iniciada e parada pelo app, sem erro de cabeçalho/protocolo
  durante a conferência. Não foi feito novo combate completo nesta etapa.
- Arquivo sem candidatos na reprodução gerou mensagem de erro legível.
- Revisão visual de editor vazio/preenchido e dos dois painéis. Evidências
  locais em `capturas_treinamento/overlay-qa-*.png` e `overlay-*-pronto.png`.
- Verificação TypeScript global ainda acusa erros em módulos anteriores
  (OCR, Sensitivity, useSkillsDB, entre outros). Não foram encontrados erros
  TypeScript nos novos arquivos do overlay após incluir o motor no projeto Node.
  Não ampliar este trabalho para corrigir módulos sem relação.

A versão do projeto foi deixada aberta em Overlays de dano, com os dois
painéis visíveis e leitura parada. O perfil de QA foi fechado; os controles
abertos agora usam o perfil normal do aplicativo. Nenhum dado de replay foi
transportado para esse perfil.

## Dano empilhado

Adicionadas quatro categorias de dano mutuamente exclusivas: normal, crítico,
pesado e crítico pesado. Cada habilidade e o total mantêm valores próprios;
as somas das faixas fecham o dano total. As taxas de críticos/pesados continuam
usando acertos e podem incluir a combinação em ambas; as faixas de dano não.

Testes de quatro eventos artificiais confirmaram exclusividade, agrupamento
e limpeza no reset. Reprodução no Electron da captura de referência confirmou:
normal 416.529, crítico 709.221, pesado 152.811, crítico pesado 1.708.434,
total 2.986.995. Revisão visual em `capturas_treinamento/overlay-empilhado-qa.png`.
O acumulado da versão anterior foi preservado localmente em
`capturas_treinamento/overlay_sessoes/*-antes-empilhado.json`; a divisão nova
não é reconstruída para dados antigos sem histórico de eventos.

## Janelas na barra de tarefas

Corrigida a reativação de foco no modo de edição: os dois painéis permanecem
com `focusable: false`, são mostrados com `showInactive` e reaplicam
`setSkipTaskbar(true)` após mudar a visibilidade. Mouse e redimensionamento
continuam disponíveis quando destravados.

Aplicado também às janelas abertas, sem reiniciar a leitura ou zerar o medidor.
No Electron, alternar trava manteve ambas sem foco; o botão de ocultar funcionou
e o arraste aumentou o total de 277×239 para 297×249. O tamanho e posição
originais foram restaurados. O Windows confirmou `WS_EX_NOACTIVATE` nos dois
painéis. Build passou. A conferência visual final das miniaturas do Windows
fica pendente; esses testes não inspecionam a interface da barra de tarefas.

## Origem incorreta — 21/10/2026

O medidor estava selecionado no ID antigo 31320168, sem eventos na captura.
Foram recebidos eventos de 243800 e 413822. Após teste solicitado de três
Garras, somente 243800 cresceu (34.732); 413822 permaneceu igual. Selecionado
243800 para os próximos eventos. Eventos anteriores rejeitados não foram
reconstruídos nem atribuídos ao jogador por suposição.

Removida a opção fixa AgrMonteiro/ID antigo. Editor e painéis agora avisam
quando falta selecionar origem ou quando há dano somente de outras origens,
sem ponto verde enganoso nesses casos. Erros de captura têm precedência.
Testes do motor/avisos e build passaram. Renderers atualizados sem reiniciar
o processo de captura. Ainda depende de novos ataques para conferir o total
com o filtro corrigido.

Durante essa conferência a conexão local encerrou e o worker informou erro.
Leitura reiniciada, origem 243800 selecionada e estado `live` confirmado.
Não houve novos eventos próprios antes de encerrar a conferência; o total
com filtro corrigido ainda precisa ser validado por novos ataques.

## Identificação e primeiro plano

- Botão ID nos dois painéis e prévias, disponível no modo de edição.
  Abrir guarda as somas atuais por origem; a lista mostra somente aumentos
  posteriores ao clique. O usuário confirma a origem, sem escolher por maior dano.
  Cancelar não altera origem ou acumulado; trocar origem reinicia o acumulado.
- Monitor Win32 separado verifica PID da janela em primeiro plano contra
  processos TL.exe. Consulta a cada 200 ms, PIDs renovados a cada segundo;
  não injeta entradas nem modifica o jogo. Sem heartbeat por 5 segundos,
  os painéis são ocultados. A captura não depende da visibilidade.
- Monitor real confirmou fora do TL e ambas as janelas ficaram ocultas.
  Eventos simulados no monitor de QA confirmaram mostrar ao entrar no TL e
  ocultar ao sair. A troca real para o jogo ainda precisa de conferência;
  o teste simulado não é evidência dessa troca nativa.
- Reprodução de captura real: ID apresentou origem 31320168; clicar selecionou
  o ID e fechou a identificação. Cancelar preservou a seleção.
- Build e testes do medidor passaram. Evidência visual:
  `capturas_treinamento/overlay-id-foco.png`.
- App normal atualizado; tinha zero acertos antes de reiniciar.
  Leitura retomada, ID 243800 selecionado e estado live conferido.
  Nenhum replay foi usado no perfil normal. Painéis ocultos fora do jogo.

## Barras proporcionais à janela

As barras de habilidades agora usam o fundo da linha inteira, com largura
normalizada pelo maior dano da lista. A coluna % continua mostrando a parcela
do total da sessão. Mantida a divisão exclusiva das quatro categorias.
Conferência no painel de 435 px: primeira barra 100%, segunda 70,56% e terceira
58,69%. Build passou e prévia revisada em `capturas_treinamento/overlay-barras-largas.png`.
Somente renderers recarregados: preservados 53.870.369 de dano e 7.843 acertos.

## Origem automática

Substituída a identificação por diálogo: iniciar leitura seleciona automaticamente
a primeira origem com dano positivo válido e conta o primeiro evento. Mantém essa
origem durante a leitura e ignora as demais; não identifica nome/personagem.
Botão Auto limpa origem/acumulado e aguarda nova origem. Correção manual fica
em detalhes no editor. Reset comum preserva origem; reiniciar leitura ativa Auto.

Testes cobriram evento inválido/atrasado, primeiro dano, outra origem, reset e
redetecção. Replay Electron sem seleção manual: 661 eventos, 2.986.995 de dano,
origem 31320168. Botão Auto limpou origem e total. Build passou.
App normal atualizado com zero acertos; captura retomada em modo automático.
Em local com outros jogadores, o primeiro dano pode ser de outra pessoa;
não apresentar a seleção automática como confirmação da identidade do jogador.

## Scan rápido

A regra anterior de manter origem durante toda a leitura foi substituída:
após 2 s sem dano da origem atual, o próximo evento válido de outra origem
inicia um acumulado separado. Não espera os 5 min de reset e não reinicia
a captura. Se a mesma origem voltar, preserva o acumulado até o limite normal.
Modo manual continua fixo. Validado abaixo/acima do limite exato e com
eventos inválidos/atrasados, além da integração Electron (111/100 para 222/200).

Erros de conexão local encerrada/ausente e lacuna TCP tentam reabrir a captura
após 1 s (mais o tempo de localizar conexões). Parar cancela a tentativa;
replay e erros de driver/protocolo não entram nesse ciclo. Teste Electron
simulou erro de conexão, confirmou estado de reconexão e retorno a live.
Build e testes passaram. App normal estava em erro há mais de 5 min;
snapshot preservado em `capturas_treinamento/overlay_sessoes/2026-10-21-antes-scan-rapido.json`
antes de reiniciar a captura na nova versão.

## Registro de IDs sem nome

`test-overlay-unknown-log.mjs` validou exclusão de IDs conhecidos, persistência,
modos live/replay separados, dano de outras origens marcado como não contado,
resumo, divisão de arquivos e falha de disco sem interromper o medidor.
No Electron de QA, evento sintético 999999999/321 foi gravado em JSONL e resumo
com crítico pesado e accepted=true; teste isolado do perfil normal. Build passou.
Snapshot agregado da sessão anterior guardado antes da atualização na pasta
de logs do usuário, marcado como pre-logging-snapshot/eventDetailsAvailable=false.
App normal atualizado com leitura live e log automático ativo para próximos eventos.
