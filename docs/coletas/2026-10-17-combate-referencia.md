# Referência de combate — 17/10/2026

Janela fixa: 120 s desde o primeiro dano (2026-10-17T21:29:10.389000). Personagem: AgrMonteiro. Alvo: Boneco para Prática.

Dano: 52495055. DPS em 120 s: 437458.79.
Primeiro minuto: 26019932. Segundo minuto: 26475123.

| Habilidade | Dano | Participação | Eventos de dano |
|---|---:|---:|---:|
| Garras Consecutivas | 14024729 | 26.72% | 812 |
| Limite Venenoso | 10239155 | 19.50% | 1145 |
| Espírito Umbral | 7617886 | 14.51% | 2606 |
| Estigma Fatal | 7509700 | 14.31% | 15 |
| Tempestade de Sangue | 5040332 | 9.60% | 347 |
| Fenda Enluarada | 2285738 | 4.35% | 132 |
| Garra | 2259004 | 4.30% | 313 |
| Injeção Letal | 1437119 | 2.74% | 984 |
| Dança da Espada Frenética | 1201497 | 2.29% | 119 |
| Lança Perfurante | 344572 | 0.66% | 7 |
| Arremesso de Relâmpago | 271996 | 0.52% | 69 |
| Golpe Sombrio | 263327 | 0.50% | 23 |

## Interpretação

Garras Consecutivas, Limite Venenoso, Espírito Umbral e Estigma Fatal somam cerca de 75% do dano. Esse resultado orienta os próximos testes, mas não prova que repetir as quatro teclas indiscriminadamente maximiza o dano.

O arquivo contém 130,179 s; esta análise exclui tudo a partir de 120 s. Eventos de dano incluem golpes múltiplos, efeitos passivos e dano periódico. Não representam número de conjurações, tentativas ou inputs perdidos.

Há um intervalo de 1,042 s sem evento de dano nos primeiros 120 s. A continuidade do dano periódico não garante ausência de pausas na execução de habilidades.

Pendências: sincronizar início do log com vídeo; confirmar barra e versão da macro desta tentativa; medir ativações por habilidade a partir do vídeo; identificar janelas de Eclipse, Emboscada, Umbral e demais buffs; controlar efeitos de equipe e condições do alvo antes de comparação.

Log preservado: C:\projetos\throne_and_liberty_node\capturas_treinamento\combate_referencia_2026-10-17\TLCombatLog-261017_212819.txt
Vídeo: C:/Users/admin/Downloads/TL_COMBATE_REFERENCIA_T2_2026-10-17.mp4


## Candidata V12 para teste A/B

V11 confirmada pelo usuário. Candidata gerada em Downloads/TL_MA_DPS_V12.xml. Dez blocos 4,5,5,2,2 passam a 4,5,5,5,2. Garras recebe 30 tentativas e Tempestade 10, mantendo 93 tentativas e ciclo de 2139 ms. Nenhuma alteração nos tempos de tecla ou nas demais teclas.

Hipótese experimental: avaliar se realocar tentativas para Garras aumenta o dano sem perder ativações de Tempestade. Participação no dano não prova ganho marginal; é necessário novo teste de 120 s. Candidata não instalada nem executada.

O primeiro dano aparece aproximadamente aos 14 s do vídeo. A preparação inicial não é ociosidade de combate. A mensagem de habilidade indisponível não permite medir inputs perdidos. Há equipe e outro personagem no teste; manter buffs externos equivalentes. O preset de habilidades coletado anteriormente diverge da barra desta luta e não deve ser aplicado sem reconciliação.
