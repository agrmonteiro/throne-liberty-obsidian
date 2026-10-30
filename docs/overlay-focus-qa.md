# Foco do controle de opções — 30/10/2026

Problema relatado: clicar no controle de opções ocultava os overlays até clicar
novamente na janela do TL.

## Correção

- Considerar o foco do próprio BrowserWindow do overlay, além dos identificadores Win32.
- Publicar a cadeia de proprietários das janelas temporárias de listas/cores e a raiz dos controles filhos.
- Remover a dependência de `isVisible()` para reconhecer foco: ocultação transitória não deve impedir a recuperação.
- Não reaplicar `setFocusable`, `setSkipTaskbar` ou o estilo de ignorar cliques do controle durante a edição. Foco e interação do controle são definidos na criação.
- Tratar foco do painel imediatamente e aguardar 180 ms antes de ocultar em uma transição para outra janela.
- Manter o foco real do TL como autoridade ao voltar ao jogo, mesmo se o cache de foco do Electron ainda indicar a janela anterior.

## Verificações

- `node scripts/test-overlay-layout.mjs`: painel focado, foco interno antes do snapshot Win32, popup com proprietário intermediário, painel desabilitado, outro aplicativo e retorno ao jogo com cache de foco atrasado.
- `node scripts/test-overlay-capture.mjs`: medição e seleção continuam reproduzindo a amostra real sem alteração dos totais.
- Checagem TypeScript dos arquivos do backend e build passaram.
- Abertura da lista Fonte pelo Playwright/Electron manteve o controle e o medidor visíveis; evidência em `capturas_treinamento/overlay-focus-menu.png`.
- A automação nativa não concluiu o clique físico: Sky retornou `failed to activate captured window`; a alternativa CUA não considerou o painel uma janela de app utilizável. Não tratar o teste por Playwright como confirmação do clique físico.
- Correção carregada na única instância normal, com leitura retomada e históricos preservados. O usuário confirmou em seguida que os overlays continuam visíveis no clique normal e ao abrir uma lista.
