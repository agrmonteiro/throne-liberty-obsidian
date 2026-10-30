# Controle de overlays e ancoragem à janela — 30/10/2026

## Inventário de validação

- Controle compacto: abrir/recolher/ocultar; reabrir pelo app e por Ctrl+Shift+F11.
- Leitura: iniciar/parar no controle, exibir erros e manter leitura ao alternar de app.
- Visibilidade: total/habilidades, ida e volta; controle permanece clicável com trava ativa.
- Aparência: transparência do fundo, fonte, tamanho, sete cores e restauração; mudanças refletidas nos dois painéis.
- Posição: selecionar cada um dos três painéis, nove posições rápidas, ajustes horizontal/vertical e arraste sem sair do jogo.
- Ancoragem: acompanhar origem e tamanho da área cliente; DIPs entre monitores; não exibir no desktop ao alternar/minimizar; manter visível enquanto interage com o controle.
- Persistência: reiniciar o app e restaurar aparência, visibilidade e posições relativas.
- Visual: controle recolhido e expandido; cores abertas; fonte máxima; transparência máxima; menor janela plausível; dados de combate densos.
- Exploratórios: posição antiga fora da tela, jogo ausente/minimizado, movimento com painel travado e retorno após reduzir a janela.

## Regressões automatizadas

- `node scripts/test-overlay-layout.mjs`: coordenadas negativas, movimento, resize, migração, janela pequena, expansão do controle.
- `python scripts/test-overlay-framing.py`: duas chaves de comprimento, cabeçalhos segmentados, retransmissão, rejeição de corrupção.
- `python scripts/test-overlay-decoder.py`: captura antiga com 661 eventos / 2.986.995 de dano e mundo aberto com 127 acertos / 557.501 de dano.
- `node scripts/test-overlay-meter.mjs`: origem, pausas, reset e faixas de dano.

## Diagnóstico da captura

O cabeçalho atual observado codifica comprimento com `0xb06c484e`; o leitor usava exclusivamente `0xb06c4908`. Um quadro real de 50 bytes era interpretado como 372 bytes, causando a mensagem “Mudança de formato no fluxo local”. A leitura agora só aceita uma chave suportada após confirmar uma cadeia completa com ao menos duas mensagens. Conferir somente os primeiros dois cabeçalhos permitia confundir cabeçalhos internos de literais comprimidos com uma fronteira do fluxo. Chave e limites continuam sendo verificados nas mensagens seguintes; corrupção real continua interrompendo a captura.

O monitor de janela é somente leitura: identifica TL.exe, obtém GetClientRect/ClientToScreen e publica foco e geometria. O processo Electron converte coordenadas físicas para DIPs; posições são frações do espaço disponível dentro da área cliente.

## Resultado

- Build de produção passou. A checagem TypeScript isolada dos componentes do overlay, preload e backend passou. A checagem geral mantém erros preexistentes em outras telas e no OCR de `electron/main/index.ts`.
- Regressões de geometria, medidor, decoder e enquadramento passaram; inclui as duas chaves, LZ4, início no meio do fluxo, retransmissões e corrupção real.
- No Electron: abrir/recolher, ocultar e reabrir com Ctrl+Shift+F11; iniciar leitura, alternar ambos os painéis, trava, fontes/tamanhos, transparência até 75%, sete cores e restauração. Testadas as nove posições rápidas de cada um dos três painéis e os dois ajustes por porcentagem.
- Preferências normais de aparência e posições foram restauradas depois dos ciclos de teste. A leitura foi retomada após o reinício; o controle permanece expandido e os dois painéis ativos.
- Controle segue clicável com os medidores travados; foco no controle mantém os painéis visíveis. Ao alternar para outro aplicativo, as três janelas ficam ocultas.
- O monitor obteve a área cliente real do TL em `(0,23)`, com `2560×1369`; todas as janelas foram posicionadas dentro dela. Movimento, resize e coordenadas negativas foram cobertos nos testes de geometria; não houve alteração da resolução ou posição da janela real do jogo.
- Revisados controle compacto e expandido, cores abertas com rolagem, fonte máxima e fundo com 75% de transparência. Sem corte horizontal nos estados conferidos. O histórico real tem 11 habilidades, rolagem própria e 1.633 acertos / 3.862.327 de dano; foi devolvido à leitura atual após a inspeção.
- Captura passiva de 20 s reconheceu a chave atual em 556 segmentos sem erro de formato. O app também registrou dano ao vivo com o decoder corrigido.
- Teste de segunda abertura deixou somente um processo principal. A proteção de instância única ativa a janela existente. Instância de QA fechada; apenas o app normal ficou aberto intencionalmente para uso.
- Evidências: `capturas_treinamento/overlay-control-config.png`, `overlay-control-skills.png` e `overlay-control-total.png`.
# Margem vertical — 30/10/2026

- Controles horizontal e vertical independentes na aba Ajustes e no controle
  flutuante. Vertical: 0–32 px por lado, padrão 10, salva em `chartPaddingVertical`.
- Conferência pela interface: 32 px acima/abaixo resultaram em linha de 89,17 px;
  com 0 px, 25,17 px. Margem horizontal manteve os 2 px configurados pelo usuário.
- Ajuste no controle flutuante sincronizou imediatamente com o app e gráfico.
  O layout mantém rolagem vertical para as opções adicionais.
- Build e checagens TypeScript do overlay passaram. Medição anterior salva no
  histórico antes de recarregar; leitura retomada com uma única instância.
- Evidência local: `capturas_treinamento/overlay-vertical-padding-control.png`.
