# Primeiro teste Npcap + TL

Atualização: o refinamento posterior identificou o segundo tipo de mensagem
e fechou 420/420 eventos deste mesmo log. O resultado abaixo registra a leitura
inicial; ver `2026-10-21-npcap-refinamento.md` para o estado atual. A nova captura
sem log não conta como validação independente.

## Resultado

Captura concluída: 3.014 pacotes em 180 segundos, sendo 182 na interface
Wi-Fi e 2.832 no loopback. Três interfaces WAN não receberam pacotes no filtro.
Vídeo e log encerrados e preservados. Não houve injeção de pacotes nem acesso
à memória do jogo.

O fluxo TCP local entre TL e ExitLag pôde ser reconstruído sem lacunas nesta
amostra. O processo na outra ponta da conexão local foi identificado como
ExitLag. A análise encontrou mensagens com framing consistente, descompactou
405 contêineres compatíveis com LZ4 e interpretou campos protobuf em mensagens
candidatas a dano. Não assumir que o mesmo caminho estará presente sem ExitLag.

| Validação contra o log | Resultado |
|---|---:|
| Eventos de dano no log | 420 |
| Eventos pareados por habilidade, dano e horário | 228 |
| Crítico concordante nos eventos pareados | 228/228 |
| Ataque pesado concordante nos eventos pareados | 228/228 |
| Dano explicado pelos eventos pareados | 1.828.817 |
| Dano total do log | 2.047.077 |
| Cobertura do dano | 89,34% |
| Eventos ainda não explicados | 192 |

A cobertura é parcial: 54,29% dos eventos e 89,34% do dano. Não confundir
cobertura com taxa de precisão universal. Os 192 eventos restantes aparecem
como Garra no log; a causa e a mensagem correspondente ainda não foram
identificadas. Não presumir que sejam perda de pacotes ou uma passiva específica.

O pareamento foi um a um, exigindo habilidade e dano iguais e diferença
temporal máxima de 0,5 s. A mediana observada entre chegada do pacote e registro
no log foi 8,53 ms. Esse número não é latência de rede, RTT ou tempo de ativação.
Os horários do log foram interpretados como UTC-3, compatível com esta sessão.

## Mapeamento experimental

- Fluxo local reconstruído por sequência TCP, removendo sobreposições.
- Tamanho da mensagem: inteiro LE32 no offset zero, XOR `0xb06c4908`.
- Tipo de mensagem: inteiro LE32 no offset quatro.
- Tipo `0x12343987`: conteúdo compatível com bloco LZ4, contendo mensagens.
- Tipo candidato a dano: `0x12344a7f`.
- Habilidade: protobuf campo 15 com decodificação ZigZag.
- Dano: protobuf campo 5, subcampo 1, com decodificação ZigZag.
- Crítico: campo 6 igual a 6 nos críticos pareados; igual a 1 nos normais
  pareados. Não extrapolar o significado de outros valores.
- Pesado: campo 19 não zero nos pesados pareados.
- Campos 2 e 3 identificam entidades consistentes nesta captura, mas não há
  catálogo completo de entidades nem associação automática de nomes.

Todos esses campos foram inferidos nesta única amostra. O pareamento exato
valida sua utilidade nesta captura; precisa ser confirmado em outra sessão,
com outros danos/habilidades, antes de uso como medidor do app.

## Limitações do roteiro

O log registrou Garra, Dança da Espada Frenética e Estigma Fatal. Isso difere
dos nomes previstos para teclas 4 e 6 no roteiro baseado na barra antiga.
O vídeo mostra ataques continuando depois das ações programadas; não tratar
o período inteiro como ações isoladas. A comparação de dano usou os eventos
reais do log, independentemente dos rótulos planejados da macro.

Ainda não foram identificadas mensagens de ativação de Luar/Umbral, recusa
de input, duração dos buffs ou cooldown. Não inferir esses eventos apenas
pelo aumento do número de pacotes. O teste não mede DPS das macros V14/V16.

## Arquivos e continuidade

- Captura local: `capturas_treinamento/npcap_tl/20261021-155810-381198/`.
- Vídeo: `C:\Users\admin\Downloads\TL_TESTE_REDE_V1_2026-10-21.mp4`.
- Log original: `TLCombatLog-261021_155800.txt`, com cópia na captura.
- Análise detalhada local: `analise-offline.json`, incluindo pareamentos.
- Resumo versionável: `resultados/npcap-tl-t1.json`, sem payloads de rede.
- Analisador offline: `scripts/analisar-npcap-tl.py`.

Próximo passo: confirmar a barra atual, repetir uma captura independente para
validar dano/crítico/pesado, e investigar os eventos Garra restantes. Só depois
ampliar o interpretador para buffs/recusas e integrar ao app. Manter os logs
como fonte de referência durante essa validação.
