# Npcap — refinamento após captura sem log

## Avanço confirmado no primeiro teste

A leitura inicial explicava 228 eventos, equivalentes a 89,34% do dano.
A investigação dos 192 eventos restantes identificou outro tipo de mensagem:
`0x12344a62`, com valor no campo protobuf 3 e habilidade no campo 7, ambos
ZigZag. Campos 2 e 4 são entidades consistentes com origem e alvo do primeiro
teste. O mapeamento não pressupõe uma passiva específica para Garra.

Após incluir esse tipo, a comparação um a um de habilidade, dano e horário
fechou **420/420 eventos e 2.047.077/2.047.077 de dano**, sem eventos faltantes.
Os 192 eventos secundários são normais e sem pesado no log de referência;
suas flags ainda não foram identificadas na mensagem e são inferidas a partir
dessa amostra. Nos outros 228 eventos, os campos explícitos continuam
concordando com crítico e pesado do log.

Este é um ajuste feito sobre a referência original, não uma validação
independente. Não generalizar 100% de cobertura para todo combate do TL.

## Nova captura sem log

Captura válida para extração: `20261021-164539-793239`. As tentativas anteriores
reiniciadas não foram usadas como confirmação. O usuário informou que esqueceu
de ativar o log na última tentativa; não associar o arquivo das 16h17 a ela.

- 3.880 pacotes capturados (164 Wi-Fi, 3.716 loopback).
- Reconstrução local sem lacunas detectadas pelo analisador.
- 529 contêineres comprimidos descompactados.
- 713 candidatos de dano, somando 3.392.653 pelo mapeamento experimental.
- 383 são do tipo inicial, 330 do tipo secundário recém-identificado.
- Treze IDs de habilidade; doze com nomes na referência anterior e um ainda
  sem nome. Os nomes são reaproveitados do log anterior, não lidos da rede.

Sem o log, **não estão confirmados** dano total, cobertura, crítico/pesado,
identidade do jogador ou DPS desta nova captura. A soma extraída não substitui
uma medição de DPS, nem permite comparar esta rodada com V14/V16.

O analisador agora aceita ausência de log e grava campos de validação como
`null`, evitando confundir falta de referência com zero erros ou zero dano.
Foi criado um índice local de mensagens com tipos, campos numéricos, tamanhos
de campos binários e tempos. Ainda não há associação validada de mensagens
com ativação de Luar/Umbral, cooldowns ou recusa de habilidade.

## Continuidade

O próximo teste deve repetir a mesma macro com o log ativo e encerrado ao fim.
Não é preciso mudar a macro nem exigir tempos manuais do usuário. Antes de
incorporar ao app, verificar se o interpretador fecha também esse novo log,
com os campos fixados antes da nova rodada. Depois ampliar para buffs.

Evidências locais:

- `capturas_treinamento/npcap_tl/20261021-155810-381198/analise-offline.json`.
- `capturas_treinamento/npcap_tl/20261021-164539-793239/analise-offline.json`.
- `messages-index.json` em cada uma dessas pastas.
- Vídeo `C:\Users\admin\Downloads\TL_TESTE_REDE_V1_T2_REINICIO2_2026-10-21.mp4`.
- Resumos versionáveis: `resultados/npcap-tl-t1-refinado.json` e
  `resultados/npcap-tl-t2-sem-log.json`.

Rerodada do analisador sobre o primeiro teste confirmou 420 pareamentos,
sem lacunas de reconstrução nem divergências de dano/habilidade dentro da
janela de 0,5 s. A nova captura foi processada em modo sem log e ficou
explicitamente marcada como não validada. Nenhuma captura nova foi iniciada.
