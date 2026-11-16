# Expedição de Vanguarda — Porfos, Irmãos Manticus e Daigon

Data da coleta: 08/11/2026. Esta nota preserva o que foi observado no perfil
local do Command Lab e separa fatos do protocolo de anotações fornecidas pelo
jogador. IDs de entidade são temporários: só são válidos na conexão desta
captura e **não** devem entrar em uma tabela global de nomes.

## Resultado principal

A última fase observou 26 origens de dano. Ela não se limita à party local:
seis jogadores receberam perfil nominal e 18 outros atacantes chegaram como
IDs sem perfil. Os demais dois atores são entidades de chefes. Portanto, a
lacuna atual é a relação `entidade da conexão -> nome`, não a contagem de dano.

| Classe de evidência | Quantidade | Resultado |
| --- | ---: | --- |
| Perfil nominal do protocolo | 6 | AgrMonteiro, Ortiga, Syllens, DedalosBar, Dennixッ e LandimAA |
| Atacante sem perfil | 18 | Dano/habilidades/alvos preservados; nome pendente |
| Template de NPC | 1 | Thuban (`13675490`) |
| Entidade de boss inferida por reaparição | 1 | Porfos (`13623318`) |

Os IDs pendentes atacam os mesmos chefes com habilidades de jogadores. Eles
devem continuar no ranking, rotulados como `Origem <id>`, sem serem movidos
para uma área secundária e sem receber nome estimado.

## Chefes e fases observados

| Entidade temporária | Rótulo | Evidência |
| ---: | --- | --- |
| `13675490` | Thuban | Template de NPC recebido durante a fase. |
| `13623318` | Porfos | Sem nome em uma fase; reaparece nomeado como Porfos na fase seguinte. |
| `13599166` | Deckman Ascendido | Nome recebido na terceira fase. |
| `13591910` | Akman Ascendido | Nome recebido na terceira fase. |
| `11980250` | Daigon | Informado pelo jogador; recebeu 31.655.808 de dano na fase final. |
| `11980258` | Add de Daigon | Informado pelo jogador; entidade separada, recebeu 13.776.397 de dano. |

Deckman e Akman compõem os Irmãos Manticus. A associação de Daigon e seu add
é uma anotação contextual do jogador para esta captura; ainda falta o pacote
de template/spawn que permitiria classificá-la automaticamente em outra run.

## O que a captura comprovou

- O agrupamento de dano preserva `connectionId + sourceId`; o mesmo ID em
  conexões diferentes não é fundido.
- Dano por atacante, habilidade, alvo e série temporal é mantido inclusive
  quando o nome do atacante é desconhecido.
- O perfil nominal e o journal de buffs resolveram apenas os seis jogadores da
  party local nesta run. Não há uma tabela local persistente que converta os
  outros 18 IDs em personagens.
- Porfos pôde ser recuperado por reaparição da própria entidade dentro da
  mesma sessão. Esse método não é aplicável a jogadores, pois seus IDs não
  devem atravessar conexão ou sessão.

## Plano de melhoria

1. **Cobertura de identidade no app.** Exibir, para cada segmento, contagens
   de jogadores confirmados, atacantes observados sem nome, NPCs confirmados e
   conflitos. O ranking continua único; o selo de evidência explica a origem
   do rótulo.
2. **Captura de roster/spawn.** Implementado o modo opt-in **Diagnóstico de
   Vanguarda**. Na próxima leitura ele registra, com limite por conexão, apenas
   opcode, tamanho, IDs de entidade e nomes curtos candidatos em
   `%APPDATA%/tier2-command-lab/logs/dps-meter/roster/`; não grava PCAP nem
   corpo bruto. Decodificar um vínculo somente se o pacote transportar
   explicitamente ID e nome.
3. **Grafo de encontro.** Relacionar alvo principal, adds e transições de fase
   por template, sem somar adds ao chefe. Uma anotação manual de fase poderá
   corrigir uma run enquanto o template ainda não foi observado.
4. **Agregação distribuída (futuro).** Para um ranking de toda a Vanguarda,
   consolidar telemetria de participantes que optarem por usar o app. Uma
   instalação não pode inventar eventos ou nomes que o servidor não transmitiu.

## Próxima coleta necessária

Antes de desenvolver o decodificador de roster, capturar uma nova expedição
com o modo diagnóstico ativado desde antes da entrada até alguns segundos após
o fim. Na tela de Vanguarda, manter a lista de membros aberta por alguns
segundos e alternar uma vez entre grupos, sem mudar os integrantes. O objetivo
é correlacionar IDs exibidos no protocolo com a alteração do roster, não usar
OCR ou inferir nomes por dano.
