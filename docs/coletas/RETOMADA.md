# Retomada da análise — 17/10/2026

Desenvolvimento pausado a pedido do usuário. Próximo foco: falhas de ativação
de `-` (Espírito Umbral) e `=` (Luar) vistas pelo usuário na última V13,
principalmente na abertura. Não foi criada uma V14 nem alterado o XML da V13
depois desse relato.

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
