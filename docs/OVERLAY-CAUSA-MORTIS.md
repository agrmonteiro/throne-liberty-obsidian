# Causa mortis — retomada e limites (31/10/2026)

## Comportamento

A aba **Causa mortis** guarda uma janela móvel de **50 eventos anteriores** ao
registro da morte, ordenados por timestamp. O pacote de sinal fica separado,
preservando os 50 eventos anteriores. Até 20 registros são mantidos em
`<userData>/data/overlay-deaths.json`, com `schemaVersion: 1`, gravação temporária
e rename. Um arquivo inválido é preservado e o erro aparece na aba. O buffer
atual é volátil; somente os registros congelados sobrevivem ao reinício.

A coleta precisa estar ativa e o personagem precisa estar identificado pelo
perfil nominal ou selecionado manualmente. Filtra captura, conexão e origem/alvo;
uma troca desses vínculos limpa o buffer, preservando os registros anteriores.
Parar a leitura interrompe a coleta. Reset, pausa e cronômetro do DPS não a
interrompem. Ela não altera dano, cura, DPS ou o histórico de encontros.

O botão **Registrar morte agora** salva a morte informada pelo usuário. Não é
um simulador e não deve ser usado em QA de produção para inventar mortes.
Exportar JSON inclui todos os eventos e campos, independentemente do filtro da
tela. Abrir uma linha exibe IDs, nomes conhecidos, flags, timestamp, opcode,
campos protobuf e corpo hexadecimal; bytes/inteiros grandes permanecem sem
conversão numérica destrutiva. O corpo é limitado a 16 KiB por evento, com
truncamento explícito; a árvore protobuf também é resumida (profundidade 3,
128 campos/32 valores, bytes internos em até 256 bytes). O hexadecimal é a
referência para reprocessar campos omitidos dessa árvore.

## Evidência e hipótese de morte

Nas capturas `20261030-094453-reference`, `20261030-184651-reference` e
`20261031-092005-reference`, foi investigado o delta `0x12346f6d` do servidor.
O campo 1 identifica a entidade; o 2 contém o delta. Dentro deste, o campo
4 é uma mensagem cujo campo 1 tem o estado. **Estado 2 junto do campo 5 vazio**
é somente um **candidato de morte**, observado em NPCs acompanhado por remoção
`0x12346f18` e eventos subsequentes. **Ainda não foi validado contra uma morte
do personagem vista no jogo.** A UI chama isso de “Possível morte / sinal
experimental”, nunca de golpe fatal confirmado. Estado 1 rearma a detecção,
também como hipótese; nova conexão/identidade sempre rearma.

Não inferir morte por ausência de ataques, desconexão, troca de mapa ou flag
do `0x1234444a`. O campo `17.2` de dano **não é HP**: a auditoria de 2.757 pares
consecutivos não encontrou igualdade entre sua variação e o dano; `17.1` contém
coordenadas. HP fica explicitamente “não decodificado”. O último dano anterior
ao sinal é mostrado como contexto, sem afirmar que matou o personagem.

O usuário avisará “morri” quando acontecer naturalmente. Conferir timestamp,
conexão e entidade do perfil, comparar o sinal e atualizar esta documentação.
Não provocar uma morte nem automatizar ações no jogo para validar a hipótese.

## Cobertura atual

- Dano `0x12344a7f`/`0x12344a62`: inclusive zero/negativo na linha do tempo,
  sem mudar a regra de dano positivo do medidor.
- Autocura já reconhecida `0x12344a63`/`0x12344a70`: mesma classificação existente.
- Valores desses opcodes sem classificação ficam como **efeito não classificado**,
  inclusive efeitos entre entidades: nunca somar como cura sem validação.
- Estados `0x12346f6d`, `0x12346f69`, `0x12346f6b`, `0x12346f18` e sinal
  `0x1234444a` vinculado ao perfil atual: preservar bruto sem inventar a semântica.

“Todos os dados” nesta aba significa todos os campos dos eventos capturados
desses tipos para o personagem. Buffs, escudos, cura efetiva e HP não estão
integralmente decodificados. A aba não substitui um PCAP integral. Dados antes
da identificação e antes da leitura iniciar não são recuperados retroativamente.

## Arquivos e verificações

- `scripts/npcap-overlay-worker.py`: estados, observações e bruto limitado.
- `src/engine/overlayDeathLog.ts`: buffer, escopo e snapshots isolados.
- `electron/main/overlayDeathLog.ts`: persistência independente dos encontros.
- `electron/main/overlay.ts` / `electron/preload/index.ts`: IPC e isolamento da medição.
- `src/components/OverlayDeathView.tsx` / `src/pages/Overlays.tsx`: aba e inspeção.

Executar `node scripts/test-overlay-death-log.mjs`,
`node scripts/test-overlay-capture.mjs` e `python scripts/test-overlay-death.py`.
As regressões de cura e framing reprocessam PCAPs e mantêm os totais anteriores.

Inventário de QA: aba/teclado, buffer vazio e com eventos, registro manual em
fixture isolada, seleção entre registros, filtros, inspeção raw, JSON completo,
layout com nomes longos e tela estreita, persistência, estado experimental e
exclusão de terceiros/outra conexão. Não injetar eventos de teste na captura real.

Resultados: testes de buffer/persistência, backend, medidor, cura e framing
passaram. Backend conferido com 6.173 acertos / 20.146.692 de dano causado e
215 / 213.047 recebido da captura de 10 minutos. Na página isolada de QA,
filtro, seleção, registro manual e inspeção funcionaram; exportar com filtro de
cura preservou os quatro eventos do registro no JSON, incluindo inteiro de
64 bits como string. Layouts de 1.140 e 650 px conferidos visualmente, sem
overflow horizontal. Nenhuma morte de teste foi gravada no perfil real.

A atualização foi carregada em uma única instância do Electron; IPC e estado
vazio reais, controles desabilitados sem origem e navegação por setas conferidos.
O histórico anterior foi salvo antes do reinício. A nova captura recebe pacotes,
mas aguarda o perfil nominal após o restart: DPS/buffer ficam zerados até esse
vínculo chegar. Solicitado ao usuário trocar de mapa/reconectar para reenviá-lo;
não inferir identidade pelo primeiro/maior atacante nem reutilizar ID antigo.
