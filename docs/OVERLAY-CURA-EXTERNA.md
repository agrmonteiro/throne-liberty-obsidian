# Cura de outras fontes — 31/10/2026

## Problema e evidência

O usuário recebeu cura de **AliveS1** e informou que os valores não apareciam
na cura recebida nem na causa mortis. Os pacotes estavam preservados como
`effect` nos registros `9daa369e-e318-421c-9f2c-34db39ed29d0` e
`3035d4df-1dc9-4930-a053-36c7cc821f3e`. A origem e o alvo eram diferentes;
o worker e o backend exigiam autocura e o acumulador usava um único mapa para
feita/recebida. Portanto, não bastava mudar o texto da interface.

No primeiro registro há **41 aplicações / 107.594** de cura bruta observada,
da origem com nome preservado AliveS1 para o alvo AgrMonteiro na mesma conexão.
Os IDs numéricos dessa evidência são temporários; não reutilizar em outra sessão.

| Habilidade | UID | Efeito | Formato |
| --- | --- | --- | --- |
| Sopro do Infinito | 980914971 | 981428966 · Instant_Heal | 0x12344a70 |
| Onda Curativa | 980594532 | 980792847 · Instant_Heal | 0x12344a70 |
| Fonte da Vida | 967976285 | 968671975 · Instant_Heal | 0x12344a70 |
| Estrela Curativa | 980859526 | 981116454 · Continuous_Heal | 0x12344a63 |

As relações acima existem no catálogo local da build 26231302. A Fonte da Vida
usa aplicações instantâneas repetidas no protocolo; a descrição periódica da
habilidade não altera o formato do efeito. Quatro pacotes completos estão na
fixture `scripts/fixtures/overlay-external-healing.json` para reprocessamento.

## Regras adotadas

- Conservar os bindings existentes: 4a63 tem alvo 2, origem 4, valor zigzag 3;
  4a70 tem alvo 2, origem 3, valor zigzag 5. Não inverter origem/alvo.
- Aceitar fontes diferentes somente se efeito e habilidade constarem no
  catálogo de cura e o formato bater com o grupo. Inteiros de entidade precisam
  ser positivos/seguros; valores precisam ser positivos. Somente servidor → cliente.
- Vampirismo de maestria 939538607 continua restrito à autocura.
- **Cura feita:** origem = personagem. **Cura recebida:** alvo = personagem.
  Autocura entra uma vez em cada direção; são visões da mesma aplicação, não
  duas curas para somar. Cura entre terceiros não entra em nenhuma direção.
- Acumuladores separados, com snapshots independentes, mesmo escopo de conexão,
  pausa, reset e cronômetro do medidor. Cura não aumenta dano/acertos/DPS.
- Causa mortis recebe cura válida antes dos filtros de pausa/cronômetro; a
  linha identifica autocura, cura recebida ou cura feita e preserva origem/alvo.
- São valores brutos observados. Não anunciar cura efetiva, excesso de cura ou
  escudos sem validar os campos apropriados. Cobertura continua parcial.

## Registros anteriores

`resolveHealingObservation` reclassifica na consulta somente antigos `effect`
conhecidos, com valor positivo e opcode/direção compatíveis. Acrescenta
`originalType: effect` e `classification: healing-effect-catalog`, preservando
o valor observado, nomes, IDs e corpo bruto. O arquivo original não é reescrito;
exportar JSON inclui essa proveniência. Efeitos desconhecidos continuam efeitos.

Isso recupera os valores nos logs de morte que guardaram esses pacotes. Não
reconstrói o total de encontros antigos a partir de uma janela de 50 eventos:
esses registros podem se sobrepor e não cobrem a sessão inteira. Históricos
com `coverage: self-observed` continuam identificados como somente autocura.
Novas medições usam `coverage: observed` e ambas as direções.

## Código e QA

- Worker: `scripts/npcap-overlay-worker.py`.
- Acumuladores: `src/engine/overlayMeter.ts`.
- Classificação compartilhada: `src/engine/overlayHealingEvent.ts`.
- Validação da entrada: `electron/main/overlay.ts`.
- Reclassificação sem migração destrutiva: `electron/main/overlayDeathLog.ts`.
- Rótulos e cobertura: `OverlayMetricView`, `OverlayDeathView`, detalhes e CSV.

Testes: `test-overlay-healing.py`, `test-overlay-vampirism.py`,
`test-overlay-meter.mjs`, `test-overlay-capture.mjs`,
`test-overlay-death-log.mjs` e `test-overlay-analysis.mjs`. Incluem os quatro
pacotes reais, direção, retransmissão, fonte externa, feita/recebida separadas,
terceiros, conexão errada, pausa, cronômetro, clones e original histórico intacto.
As regressões preservam os totais de dano e autocura das capturas anteriores.

QA visual: conferir 41 curas / 107.594 no registro real do AliveS1, filtro Cura,
origem e nomes, detalhe bruto, troca de registro e página Cura recebida. Para
validar uma nova aplicação ao vivo, identificar o personagem atual por perfil
nominal e receber uma cura de terceiro; nunca escolher a origem pelo maior dano.

## Resultado da verificação

Testes de worker, medidor, backend, persistência, análise e vampirismo passaram,
assim como TypeScript estrito e build. A versão foi carregada em uma única
instância. Na UI real, o primeiro registro mostrou **41 linhas de Cura recebida**
com AliveS1, nome da habilidade e valor; o segundo recuperou **29 / 75.886**.
O original em disco ainda contém os 41 `effect`, confirmando a projeção sem
reescrita. Os dois registros se sobrepõem e seus totais não devem ser somados.

O usuário informou que não pode testar agora. A validação com uma nova cura ao
vivo fica pendente; não afirmar que foi executada. A captura da sessão atual
aguarda o perfil nominal, e IDs da evidência anterior não foram reutilizados.

Validação posterior: o usuário realizou Leviatã Ascendido em grupo de seis.
O encontro registrou 62.592 de cura externa em dez aplicações, e o recap da
mesma conexão preservou pacotes Dillzin → AgrMonteiro. Essa pendência foi
conferida com dados novos reais; ver [OVERLAY-LEVIATA-GRUPO.md](OVERLAY-LEVIATA-GRUPO.md)
para as parcelas, limites de atribuição e o que não foi capturado de buffs.
