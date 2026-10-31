# Buffs/debuffs: catálogo e ciclo observado — 31/10/2026

## Resposta à investigação

**Os pacotes não mostram somente a ativação.** Foram identificadas mensagens
de aplicação/presença, atualização e remoção. Algumas atualizações trazem
mudanças de acúmulo, renovação e valores compatíveis com tempo restante.
Isso não equivale a uma lista completa de todos os buffs enviada continuamente:
há estados silenciosos entre aplicação e remoção, outros renovados por passivas
e estados cuja primeira aplicação ocorreu antes de a captura começar.

O resultado desta rodada é um **mapeamento e ferramentas de análise offline**.
Não adiciona uma nova página de buffs nem altera os contadores ao vivo. Isso
permite conferir o protocolo antes de usar seus campos como estado do overlay.

## Evidência

A luta posterior em grupo contra Leviatã foi localizada no histórico, mas
ocorreu depois do fim da captura bruta abaixo. Os limites dessa amostra e a
validação de cura externa estão em [OVERLAY-LEVIATA-GRUPO.md](OVERLAY-LEVIATA-GRUPO.md).
Não tratar o PCAP de 15:59:30 como captura dessa luta.

| Amostra | Duração | Aplicações | Atualizações | Remoções |
| --- | ---: | ---: | ---: | ---: |
| 20261030-094453-reference | 600 s | 4.377 | 7.844 | 4.373 |
| 20261031-155930-reference | 180 s | 3.487 | 10.098 | 3.460 |

A amostra nova foi passiva: **20.777 pacotes**, capturados em 31/10/2026 às
15:59:30 no horário de São Paulo. Os números incluem **várias entidades**, não
apenas AgrMonteiro. Os PCAPs dessas amostras não contêm um perfil nominal
correspondente suficiente para atribuição automática local no analisador;
ele não escolhe o primeiro/maior atacante para preencher essa lacuna.

Nas duas amostras, a decodificação terminou sem erros registrados. Apenas
frames em `depth == 0` são contabilizados; os internos comprimidos não são
contados duas vezes. Retransmissões TCP são tratadas pelo reassembler existente.

- **Difusão Altruísta** (`964157784`): uma sequência real tem aplicação e
  remoção aproximadamente **1,58 s** depois, sem update intermediário.
- **Ventania**, debuff (`964130700`): há updates mudando acúmulos; a fixture
  contém uma sequência que sobe até o limite estático de 25.
- **Devoção e Vazio** (`967389334` e variantes): aplicações, updates e remoções
  se repetem em ciclos curtos; vários intervalos observados fecham perto de 2 s.
  Isso não representa uma nova tecla pressionada a cada reaplicação.
- Em outros updates, o campo candidato a tempo restante é menor que a duração
  e muda dentro da mesma revisão/serial, sustentando a hipótese de atualização
  enquanto o estado continua ativo. Não é um relógio exato validado visualmente.

## Campos mapeados

Somente servidor → cliente. Valores de efeito/habilidade/duração/acúmulo são
interpretados com zigzag onde indicado. Origem e alvo são entidades sem zigzag.
**Os bindings de buff diferem dos de cura; não reutilizar seus índices.**

| Papel | 0x12344a7b · aplicação/presença | 0x12344a7d · update | 0x12344a7c · remoção |
| --- | --- | --- | --- |
| UID de efeito | 1, zigzag | 4, zigzag | 1, zigzag |
| Origem/caster | 2 | 5 | 2 |
| Alvo/recipiente | 4 | 7 | 4 |
| Token associado ao cast, bruto | 3 | 6 | 3 |
| Duração candidata, ms | 5, zigzag | 8, zigzag | — |
| Tempo restante candidato, ms | 6, zigzag | 9, zigzag | — |
| Acúmulos candidatos | 7, zigzag | 10, zigzag | — |
| Serial atual, bruto | 10, opcional | 14 | 5, opcional |
| Serial anterior, bruto | — | 13 | — |
| UID de habilidade candidato | 12, zigzag, opcional | 16, zigzag, opcional | — |

Origem/cast foram cruzados com **6.942 eventos de estado** próximos de um dano
com o mesmo ator e token na amostra de 10 min. A remoção se correlaciona por
conexão + alvo + serial e confirma o mesmo efeito/origem nos vínculos aceitos.
O serial muda em updates; não é ID de personagem nem ID de sessão de combate.
Tokens/seriais são mantidos como strings para preservar inteiros de 64 bits.

Na amostra nova, **1.867 de 2.054** pares com tempo restante finito tiveram a
remoção em até 250 ms do intervalo candidato a partir do último update. Outros
podem terminar antes por troca de estado, morte, cancelamento ou dissipação;
**a causa da remoção não está decodificada**. Não rotular todo fim antecipado
como dispel. `-1` em duração/tempo restante é um candidato a ausência de prazo,
não uma garantia de buff permanente.

Há 80 e 91 updates, respectivamente, em que o serial anterior existe mas
metadados de efeito/origem diferem. O tracker marca **conflito**, não une esses
intervalos como se fossem uma duração comprovada. Aplicações/remoções sem
serial também permanecem explicitamente incompletas.

## Catálogo estático preservado no Git

`reference/datamine/26231302/buff-reference.json.gz` contém:

- 56.177 IDs positivos de `TLEffectProperty`, com grupo e vínculo `Abnormal`.
- 12.548 símbolos de estado/apresentação: 12.366 linhas de `TLAbnormalState_*`
  e 5.437 de `TLAbnormalLooks_*`, preservando propriedades originais.
- Nomes PT/EN, caminhos de ícones, `StackCap`, `GoodOrBad`, apresentação e flags
  como `ShowExpireTime`/`ShowOverlapCount` quando presentes.
- 16.556 IDs positivos de habilidade para consultas relacionadas.

9.013 **IDs de efeito** têm classificação estática benéfica e 17.348 prejudicial;
não representam essa quantidade de buffs únicos visíveis. Outros são neutros
ou não têm vínculo suficiente. Não classificar `unknown` como buff. Nomes/ícones
ambíguos permanecem arrays; o catálogo não escolhe uma variante arbitrária.

Índice/hash: `reference/datamine/26231302/buff-reference-index.json`.
Contagens/checksums das amostras: `buff-protocol-evidence.json` na mesma pasta.
Os ícones já extraídos ficam em `tools/unreal/exports/26231302/icons/Image/`,
seguindo os caminhos registrados em `AbnormalIconPath`.

## Como repetir e atualizar

Após atualizar a extração/SQLite, gerar o catálogo para a build nova:

```powershell
python tools/unreal/build-buff-reference.py --build 26231302
python scripts/query-overlay-buffs.py "Devoção e Vazio" --catalog reference/datamine/26231302/buff-reference.json.gz --limit 3
python scripts/query-overlay-buffs.py 964157784 --catalog reference/datamine/26231302/buff-reference.json.gz --full
```

Analisar uma amostra, sem reiniciar o app:

```powershell
python scripts/analyze-overlay-buffs.py --folder capturas_treinamento/npcap_tl/20261031-155930-reference --catalog reference/datamine/26231302/buff-reference.json.gz --player-name AgrMonteiro
python scripts/test-overlay-buffs.py
```

Saídas em `<amostra>/buff-analysis/`: `summary.json`, `events.jsonl`,
`effects.json`, `entities.json` e `intervals.json`. O JSONL inclui corpo bruto,
nomes, origem/alvo, serial, campos candidatos e vínculo do ciclo. A consulta
ao catálogo funciona usando apenas o Git, sem precisar do SQLite completo.
Regeneração requer os exports locais; ver `DATAMINING-REFERENCE.md`.

## Regras para futura exibição no overlay

1. Manter estado por geração de conexão + alvo + serial e conferir efeito/origem.
2. Update sem aplicação prévia confirma uma observação, mas não revela o início.
3. Remoção fecha o estado observado. Duração permite estimar um contador local;
   não criar uma remoção “recebida” apenas porque esse contador zerou.
4. Não inferir buff ativo por dano, cura, ícone estático ou ausência de pacotes.
5. Ainda não foi estabelecido um snapshot completo dos buffs já ativos ao iniciar
   a leitura. Início/fim de captura e troca de mapa podem deixar ciclos parciais.

Testes passaram com **50 frames reais** de cinco ciclos, incluindo estado
silencioso, updates de stacks, tempo restante e renovação. Cobrem inteiros de
64 bits, campos ausentes/duplicados, captura parcial, outra conexão e ausência
de expiração inventada. Catálogo, hash e quantidades também foram verificados.
