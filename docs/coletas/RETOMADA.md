# Retomada da análise — 17/10/2026

Análise retomada em 18/10/2026. Próximo foco: falhas de ativação
de `-` (Espírito Umbral) e `=` (Luar) vistas pelo usuário na última V13,
principalmente na abertura. V14 testada: 50.751.727 de dano em 120 s e abertura
de 12.938.429 em 30 s. Usuário viu Umbral funcionar melhor, Luar ainda falhando.
V15 alongou apenas uma tentativa de Luar por ciclo para 60 ms, mas caiu para
47.315.091 (-6,77% contra V14); não recomendada nesta rodada. Manter V14 como
referência de trabalho. Antes de outro ajuste, distinguir falha de tecla de
bloqueio por animação/condição de uso.

Em seguida, usuário solicitou triplicar cada tentativa de Luar, aceitando ciclo
maior. V16 gerada da V14: 18 tentativas de Luar em seis trios, 20 ms de hold,
3 ms de intervalo e ciclo de 2.415 ms. Primeiro teste fez 54.156.307 em 120 s
(451.302,56 DPS), +6,71% contra V14. Melhor candidata atual, ainda uma amostra.
Repetir V16 sem mudanças; Fenda caiu para 1.828.597 e fica como investigação
posterior. Melhor resultado total não comprova uptime de Luar. Nenhuma V17.
Detalhes em `2026-10-18-resultado-v14.md`, `2026-10-18-resultado-v15.md` e
`2026-10-18-resultado-v16.md`.

## Resultados nos primeiros 120 segundos

| Macro / tentativa | Dano | DPS médio |
|---|---:|---:|
| V11 controle repetido | 49.680.876 | 414.007,30 |
| V12 | 48.634.178 | 405.284,82 |
| V13 primeira | 50.948.237 | 424.568,64 |
| V13 segunda | 50.004.623 | 416.705,19 |

Média das V13: 50.476.430 (+1,60% sobre a única V11 controle).
Poucas amostras e buffs não certificados: superioridade estável não demonstrada.
V11 original de 52,50 milhões foi excluída do controle por suspeita de comida
ou buff diferente. Usar o reteste acima.

## Ajuste a investigar

- Preservar distribuição do Arremesso da V13; mediana dos grupos de dano caiu
  de aproximadamente 15 s para 9,71 / 10,81 s. A segunda tentativa ainda teve
  lacuna de 21,56 s.
- Revisar abertura para registrar Umbral e Luar antes da sequência principal.
  Proposta ainda não implementada: espaçar as tentativas, intercalando ataques,
  e manter inicialmente o pressionamento de 20 ms para isolar a mudança.
- Não confundir as tentativas rápidas da macro com casts efetivos. O log de
  dano não confirma diretamente falhas de tecla nem uptime de buff.
- Eclipse (`0`) é manual; não adicionar spam que possa desligá-lo.
- Conferir visualmente a ativação dos buffs na próxima gravação.

## Arquivos e evidências

- Catálogo: `2026-10-17-manopla-adaga.json`; efeitos condicionais continuam sem
  cálculo habilitado. Preset de equipamento e de habilidades são independentes.
- Relatórios nesta pasta detalham comparações e habilidades de suporte.
- `macros/` preserva os XML V11, V12 e V13 usados como referência.
- `resultados/` preserva as análises numéricas para continuidade pelo Git.
- Vídeos em `C:\Users\admin\Downloads`; logs originais em
  `C:\Users\admin\AppData\Local\TL\Saved\CombatLogs`.
- Evidências locais em `capturas_treinamento/` estão ignoradas pelo Git.
  Vídeos, prints e logs brutos não estão incluídos neste commit.
- O arquivo `TLCombatLog-261017_220155.txt` contém V11 e primeira V13 em sessões
  separadas. Segunda V13: `TLCombatLog-261017_223020.txt`.

## Pendências do módulo

O catálogo não foi integrado ao simulador do app. Corrigir a distinção entre
cooldown base e observado antes de usá-lo: não reduzir novamente o cooldown
efetivo lido no jogo. Capturas de formas transformadas, cobertura de itens e
regras de empilhamento ainda têm pendências. Transcendência foi excluída da
coleta por orientação do usuário.
