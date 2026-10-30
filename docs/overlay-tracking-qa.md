# Identidade e continuidade do DPS — 30/10/2026

## Inventário de validação

- Identificar a entidade local pelo sinal servidor → cliente `0x1234444a`, sem escolher o primeiro/maior atacante.
- Preservar o primeiro ataque quando o sinal local chega depois dele; não ressomar ataques após reset.
- Separar captura, conexão e encontro; preservar a medição anterior no histórico ao trocar de entidade ou conexão.
- Descartar mensagens atrasadas de conexão encerrada, inclusive quando o ID numérico é reutilizado.
- Atualizar os endpoints locais monitorados sem interromper o contador quando uma conexão secundária fecha.
- Mostrar no controle a origem automática, o ID do encontro e o retorno à leitura atual com os painéis travados.
- Seleção manual deve continuar fixa; voltar ao automático deve seguir a entidade local mais recente.
- Conferir o aviso de origem inativa e a distinção entre leitura atual e histórico.
- Conferir layout do controle expandido com os novos campos e o painel de dano com a marca VOCÊ.
- Exploratórios: início no meio de uma captura, ID reutilizado em outra conexão, pacotes antigos após encerramento, sequência TCP passando de `2^32`.

## Referência e significado dos sinais

Base: `docs/overlay-reference-index.json`, amostra de 600 s com 47.846 pacotes.
O sinal local apareceu 413 vezes para uma entidade nesta amostra. As flags dessa
mensagem alternam durante ataques; não são usadas para criar sessões de combate.
O encontro tem um UUID do aplicativo. O limite de inatividade existente de cinco
minutos foi preservado; nenhum ID nativo de combate foi presumido.

## Testes de regressão

- `node scripts/test-overlay-capture.mjs`: executa o backend de produção em memória com transportes simulados e depois reproduz todos os eventos da amostra real, sem processos extras nem alterações nos dados do usuário.
- `node scripts/test-overlay-identity-state.mjs`: autoridade de identidade, conexão aposentada, reuso de ID e avisos.
- `node scripts/test-overlay-meter.mjs`: somas, pausas, reset e rejeição de seleção pelo primeiro dano.
- `python scripts/test-overlay-local-player.py`: vínculo do sinal local com os atacantes das duas capturas antigas comparadas com logs.
- `python scripts/test-overlay-framing.py`: chaves antiga/atual, LZ4, segmentação, retransmissões e volta do contador TCP.
- `python scripts/test-overlay-decoder.py`: mantém os totais das referências antigas e a atribuição atacante/alvo.
- `node scripts/test-overlay-history.mjs`: persistência e atualização dos resumos.

## Resultado automatizado

O backend reproduziu exatamente os **6.173 acertos / 20.146.692 de dano** da
entidade local da amostra. Demais atacantes foram excluídos do medidor local;
413 sinais repetidos e duas conexões secundárias fechadas não fragmentaram a
medição. Trocas de entidade, conexão e reuso de ID preservaram os resumos
anteriores e rejeitaram dados da conexão aposentada.

Os testes acima e a checagem TypeScript dos arquivos do overlay passaram.

## Aplicação e conferência ao vivo

- Build passou. A única instância normal foi reiniciada para aplicar o backend novo, preservando configurações e históricos.
- O algoritmo identificou a entidade local `8075232` pelo sinal do protocolo, sem número fixo no código. A origem anterior `7962980` deixou de controlar a medição.
- Conferidos controle expandido e tabela de habilidades com dados reais: origem automática, identificação VOCÊ, medição com UUID e retorno Ao vivo acessível com os painéis travados. Sem corte horizontal; o controle possui rolagem vertical para opções adicionais.
- Selecionar novamente o modo automático e acionar Ao vivo mantiveram a medição. Os seletores do app e do controle exibem `auto`; as opções manuais estão identificadas como manuais.
- A medição avançou de 670 acertos / 2.724.144 de dano para 1.759 acertos / 6.864.123 de dano, com a mesma conexão, entidade e UUID de encontro.
- Recarregar os renderers do app e do controle preservou a captura e o acumulado. Não foi aplicado reset no combate real para testar o botão Nova medição; esse caminho foi exercitado no backend de produção em memória, inclusive a rejeição de ressoma de eventos anteriores.
- Mantida uma única instância e a leitura ao vivo ativa para uso. Evidências: `capturas_treinamento/overlay-tracking-control.png` e `overlay-tracking-skills.png`.
- Esta alteração não declara descoberta de sessão de combate nativa nem validação independente de todo o dano do jogo; aplica a identificação local observada na amostra e nas duas referências antigas com logs.
