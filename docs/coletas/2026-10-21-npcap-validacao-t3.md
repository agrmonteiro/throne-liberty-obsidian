# Npcap — confirmação independente do interpretador

O mesmo interpretador usado antes da rodada foi aplicado à captura
`20261021-170507-516139`, com o log `TLCombatLog-261021_170341.txt`.
Nenhum campo de dano, habilidade ou flag foi ajustado durante esta validação.

SHA-256 do interpretador antes e depois:
`8a17dfae6dae878da07d5bcaac86998e36d0cfaafcee5d05497ab77682952cd2`.

## Resultado dentro da janela capturada

| Medida | Resultado |
|---|---:|
| Pacotes capturados em todas as interfaces | 3.741 |
| Contêineres comprimidos descompactados | 514 |
| Eventos de dano do log durante a captura | 661 |
| Pareamentos um a um de dano, habilidade e horário | 661 |
| Eventos sem correspondência dentro da captura | 0 |
| Soma do dano no log e nos eventos pareados | 2.986.995 |
| Classificação de crítico concordante | 661/661 |
| Classificação de pesado concordante | 661/661 |

O teste confirma o mapeamento de dano neste segundo conjunto de referência,
sem recalibrar os campos. Não representa garantia de cobertura universal.
Os eventos são 646 de Garra, 14 de Dança da Espada e um de Estigma Fatal.
Os flags explícitos se aplicam ao primeiro tipo; o segundo tipo continua
classificado como normal/sem pesado com base nas amostras, sem flags próprias
identificadas. Buffs, cooldowns e recusa de habilidade continuam não validados.

## Diferença entre duração do log e da captura

Captura de pacotes: aproximadamente 17h05min07s a 17h08min07s, UTC-3.
O log completo contém 904 eventos, somando 4.049.378 de dano. Os 243 eventos
adicionais (1.062.383 de dano) ocorreram **depois** do fim da captura, entre
17h08min07,750s e 17h08min43,210s. Não são falhas do decodificador.

A análise bruta preserva esses 243 eventos como não pareados. O auditor
`scripts/validar-janela-npcap.py` separa os tempos antes/dentro/depois sem
alterar o interpretador ou descartar silenciosamente eventos do log.
A soma de 2.986.995 não é um comparativo de DPS de macro: abrange um roteiro
de diagnóstico e a janela não começa necessariamente no primeiro ataque.

## Arquivos

- Captura e detalhes locais: `capturas_treinamento/npcap_tl/20261021-170507-516139/`.
- Comparação bruta: `analise-offline.json`.
- Auditoria temporal: `validacao-janela.json`.
- Vídeo: `C:\Users\admin\Downloads\TL_TESTE_REDE_VALIDACAO_T3_2026-10-21.mp4`.
- Resumo versionável: `resultados/npcap-tl-validacao-t3.json`.

Próxima etapa: usar essa leitura como base experimental de dano observado,
mantendo comparação com log, e tratar buffs/recusas em investigação separada.
O app ainda não recebeu captura em tempo real nem medidor novo nesta etapa.
