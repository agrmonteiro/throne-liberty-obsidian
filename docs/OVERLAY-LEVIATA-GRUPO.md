# Validação em grupo — Leviatã Ascendido, 31/10/2026

O usuário informou uma luta em grupo com mais cinco pessoas, healer e vários
buffs de grupo. O encontro salvo foi localizado pelo template **1040089 —
Leviatã Ascendido**, com origem AgrMonteiro confirmada no histórico.
O tamanho do grupo é informação do usuário; o roster não foi decodificado.

## Valores do encontro salvo

Intervalo com atividade registrada: **16:03:27 a 16:04:59**, horário de São Paulo.
É o intervalo da medição salva, não uma delimitação independente do combate
pela vida do boss.

| Métrica | Valor observado |
| --- | ---: |
| Dano causado | 3.462.958 |
| Dano recebido do Leviatã | 37.784 |
| Cura recebida total | 188.403 |
| Autocura registrada | 125.811 |
| Cura externa registrada | 62.592 · 10 aplicações |

As autocuras são Buscador de Sangue (117.529 / 221 aplicações) e Golpe
Vampírico (8.282 / 2). A cura externa está separada em **Sopro do Infinito:
39.984 / 9 aplicações** e **Onda Curativa: 22.608 / 1 aplicação**. Assim,
125.811 + 39.984 + 22.608 = 188.403. São valores brutos; não medir cura efetiva
ou contribuição à sobrevivência por essa soma.

O recap manual da mesma conexão preservou seis pacotes de cura entre os seus
últimos 50 eventos. Três são de **Dillzin → AgrMonteiro**, Sopro do Infinito,
com valores **3.096, 7.484 e 7.936**. Isso confirma cura de terceiro recebida
pela identidade correta, sem registrá-la como cura feita pelo personagem.
O recap não contém todas as dez aplicações externas; não atribuir automaticamente
as aplicações restantes a Dillzin apenas por existir um healer identificado.

Essa observação fecha a pendência de conferir a correção de cura externa com
uma nova leitura real em grupo. A conferência continua limitada aos formatos
de efeito já reconhecidos; não comprova cobertura universal de cura.

## Limite para buffs dessa luta

A amostra bruta `20261031-155930-reference` terminou às **16:02:30**; a atividade
do encontro acima começou às **16:03:27**. O worker do medidor estava ativo,
mas não mantém um PCAP integral contínuo nem persiste todos os estados ainda
não integrados ao medidor. Portanto, o histórico permite conferir combate e
curas, **mas não reconstruir quais buffs de grupo ficaram ativos e por quanto
tempo nessa luta**. Não inferir esses buffs a partir de dano/cura ou de nomes
do catálogo.

Para uma próxima validação de uptime, a captura bruta deve começar antes da
luta e cobrir seu término; depois usar `analyze-overlay-buffs.py`, conforme
[OVERLAY-BUFFS-PROTOCOLO.md](OVERLAY-BUFFS-PROTOCOLO.md). O mapa de aplicação,
update e remoção já existe, mas sua integração como histórico de buffs ao vivo
ainda não foi implementada nesta etapa.

## Evidência preservada e teste

- Encontro local: `70135cf0-a971-4398-9332-39801f325a37`.
- Recap manual: timestamp `1793473507.414`, mesma conexão do encontro.
- Fixture no Git: `scripts/fixtures/overlay-leviathan-group.json`, com resumo e
  seis corpos de pacote originais. IDs de entidade são temporários dessa sessão.
- `python scripts/test-overlay-healing.py` reprocessa os pacotes e confere
  origem/alvo, valor, cobertura e consistência do resumo de cura externa.
