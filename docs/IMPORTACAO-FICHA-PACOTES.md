# Importação da ficha pelos pacotes

Implementação iniciada em 31/10/2026 e retomada em 04/11/2026.

## Uso no aplicativo

Em **Builds → Importar do jogo → Ler ficha do jogo**, escolher a leitura atual
ou uma captura salva. Conferir data, personagem e valores. O destino padrão cria
uma nova build; também é possível complementar uma existente. O seletor de tipo
de dano escolhe qual família de crítico/pesado vai para a calculadora. Os três
tipos permanecem preservados entre os status completos.

A leitura dos overlays precisa estar ativa. Para pegar os blocos iniciais,
iniciar a leitura antes de entrar no personagem. Abrir a ficha visualmente nem
sempre solicita os valores ao servidor. Trocar equipamento pode enviar apenas
os status alterados e nem sempre reenvia o perfil nominal.

Desde a preparação da primeira instalação, a leitura pode ser iniciada antes de
abrir o TL. Enquanto procura o túnel, o capturador acompanha TCP loopback e
retém temporariamente trechos em memória, por até cinco segundos e com limite de
2 MiB/16 fluxos. Apenas fluxos confirmados pelo inventário de sockets do processo
TL são decodificados; quando a porta é identificada, o filtro é restringido a ela.
Se o buffer atingir o limite durante a descoberta, pacotes novos são descartados
e a leitura inicial pode ficar incompleta. Ainda é necessário validar o fluxo de
primeira instalação com um novo usuário e a captura sem ExitLag.

A interface identifica separadamente **Atual** e **Captura salva**, com horário.
Uma captura antiga não serve como prova de atributos da sessão atual. Os arquivos
salvos não restauram identidade nem contadores ao vivo.

## Dados observados e limites

Os pacotes trazem totais por identificador, em vários blocos. Aplicar somente as
chaves recebidas e preservar a última atualização de cada campo. Uma chave
ausente não significa zero. Dentro de uma linha explicitamente recebida, a
ausência protobuf do campo de total corresponde ao zero dessa linha.

Há também componentes da soma, preservados como strings em `fields`. Não
rotular todos como equipamento, buff ou atributo investido: a origem de cada
parcela ainda não foi inteiramente validada. A build pode incluir buffs ativos.

Na coleta de 31/10, foram consolidados **86 status** de AgrMonteiro na conexão
`tcp-005` de `20261031-205037-reference`, com perfil nominal de entidade
temporária `13150450`. Esse ID vale exclusivamente para essa geração.
Conferidos visualmente na ficha:

| Dado | Valor |
| --- | ---: |
| Força / Destreza / Sabedoria / Percepção / Fortaleza | 67 / 130 / 114 / 90 / 22 |
| Vida máxima / Mana máxima | 32.380 / 20.320 |
| Defesa corpo a corpo / distância / mágica | 4.510 / 4.508 / 4.400 |
| Velocidade de ataque / recarga | 149,03% / 101,7% |
| Ampliação de dano de habilidade / bônus de dano | 549,8 / 59 |
| Dano crítico | 79,5% |
| Crítico à distância / pesado à distância | 2.790 / 954,6 |
| Dano da arma principal na ficha | 264–965 |

Isso não valida individualmente todos os status possíveis. Rótulos/escalas são
experimentais. Campos sem nome são mantidos como `Status <ID>`; nenhum status é
descartado apenas porque a calculadora não o utiliza. Campos de alvo e habilidade
da calculadora são preservados, assim como conversões ainda não confirmadas.
Defesa própria não é importada como defesa do alvo.

O intervalo da arma principal observado usa `BonusAttackPowerMainHand + 1`
até `BonusAttackPowerMainHand + AttackPowerMainHand`. O componente nativo
`AttackPowerMainHand` sozinho não é o máximo final mostrado na ficha. Preservamos
também os componentes e o pacote original na evidência para rever essa relação.

## Protocolo

Somente servidor → cliente, após reassemblagem TCP e descompressão existentes.
O parser fica em `scripts/analisar-npcap-tl.py::character_stats`.

| Mensagem | Tabela de linhas |
| --- | --- |
| `0x12346e77` | `1.98` (formato observado com campo 2 bytes vazio) |
| `0x12347e7d`, `0x12347e7f` | `15.6.98` |
| `0x123444dd` | `5.6.98` |
| `0x12344437` | `4.6.98` |

Cada linha tem identificador **sem zigzag** no campo 1 e total **com zigzag** no
campo 6. Os campos adicionais são preservados sem semântica inventada. Rejeitar
campos duplicados/ambíguos, IDs fora dos limites e totais sem precisão segura.
O formato do campo 2 de `0x12346e77` não é interpretado como identidade ou combate.
Variantes não reconhecidas não são convertidas em valores presumidos.

A tabela é específica do estado local observado nessa conexão. A atribuição no
app exige perfil nominal correspondente e seleção da mesma entidade. Dados
anteriores ao perfil podem ficar temporariamente no buffer da conexão, mas não
identificam automaticamente o jogador. Outra conexão, captura ou troca de
entidade não deve herdar a leitura anterior. Pausa/reset/cronômetro do DPS são
independentes dos atributos.

### Comparação da tela de espécies — 04/11/2026

Na interface, os rótulos longos rolam horizontalmente. Conforme indicado pelo
usuário, cada espécie ocupa duas linhas: na coluna ofensiva vêm ampliação e,
logo abaixo, bônus de dano; na defensiva vêm resistência e, abaixo, redução de
dano. O nome da espécie na segunda linha ajuda a interpretar o rótulo que está
rolando. As quatro categorias permanecem distintas; a associação dos valores
automáticos usa os IDs dos pacotes, não a posição visual nem OCR.

Na ficha do AgrMonteiro, os valores de ampliação visíveis coincidiram com a
leitura: humanoides `236` = 190,2; mortos-vivos `237` = 190,2; selvagens `238`
= 190,2; construtos `239` = 208,2; demônios `240` = 190,2. As resistências
`241`–`245` também coincidiram com a coluna defensiva. A redução de dano de
mortos-vivos `108` = 39 e o bônus de dano contra mortos-vivos `114` = 15
coincidiram igualmente.

A tela mostrava bônus de dano 15 também para as outras quatro espécies, mas os
IDs correspondentes `112`, `113`, `115` e `116` não foram recebidos nessa leitura.
Não copiar o valor de mortos-vivos para os demais: a regra que gera o valor
exibido ainda precisa ser validada. A ampliação e o bônus de dano são campos
diferentes; a calculadora tem apenas uma ampliação de espécie por vez e ainda
precisa de escolha explícita da espécie e tratamento próprio do bônus plano.

## Identificação sem OCR — decisão de 04/11/2026

Por orientação do usuário, esta importação usa arquivos/tabelas locais e captura
passiva dos pacotes. A tentativa de confirmar o retrato por OCR foi retirada.
O OCR preexistente de importação de prints é outra ferramenta do app.

Há dois envelopes reais de perfil nominal aceitos pelo decoder:

| Mensagem | Perfil | Nome | ID de combate | ID persistente candidato |
| --- | --- | --- | --- | --- |
| `0x1234787f` | `1.1` | `1.1.2` | `1.1.19` | `1.1.1` |
| `0x1234787d` | `1.5.1` | `1.5.1.2` | `1.5.1.19` | `1.5.1.1` |

Os dois exigem `tribe.Pc` no campo 26, nome e ID únicos e válidos. A captura ao
vivo aceita somente a direção servidor → cliente. O segundo envelope era
ignorado e foi adicionado após verificar os bytes da coleta
`20261031-205037-reference`. Nela, o AgrMonteiro aparece com o mesmo ID persistente
candidato `1896177` nas conexões `tcp-001` e `tcp-005`, mas os IDs de combate são
respectivamente `12722266` e `13150450`. Não transportar esses IDs de combate
para a sessão atual. O ID persistente é uma pista adicional; ainda não substitui
o vínculo nominal/conexão validado pelo app.

Arquivos locais investigados, somente para leitura:

- `%LOCALAPPDATA%/TL/Saved/Config/WindowsNoEditor/NCStorageLocalData.ini`:
  seções `TLAGS.CHARACTER.<conta>.<servidor>.<personagem hexadecimal>`.
  O sufixo `1CEEF1` corresponde a `1896177`, observado no perfil dos pacotes.
  Há várias seções históricas: a existência de uma seção não indica personagem
  conectado. `KCHATTAB.WhisperTabSender` contém nomes de conversas; **não usar
  para identificar o jogador**. Nenhum cache de atributos completos foi
  confirmado nessas opções.
- `%LOCALAPPDATA%/TL/Saved/SaveGames/*.sav`: os arquivos GVAS inspecionados são
  `NcPlatformSdk.SDKSaveData`, com dados do SDK/login; não são uma ficha do
  personagem. Não importar credenciais ou dados de autenticação para o app/Git.
- `%LOCALAPPDATA%/TL/Saved/Logs/TL.log`: na sessão examinada, não trouxe nome ou
  UID nominal suficiente para esse vínculo.
- `TL/Content/Paks`: fornece o catálogo de nomes, escalas e definições de status
  já extraído; não foi encontrado ali um registro dos atributos atuais da conta.

As coletas de 04/11 às 20:53 e 21:28 trouxeram respectivamente 2.474 e 40 frames
de status, sem nome AgrMonteiro nem os IDs persistentes das seções locais nos
campos protobuf examinados. Esses dados não são atribuídos por suposição.
O painel informa quantos status chegaram por conexão enquanto aguarda o perfil;
uma captura salva permanece identificada como histórica.

Auditoria reproduzível, sem OCR e sem imprimir valores de conta/chat:

```powershell
python scripts/audit-character-identity.py --folder capturas_treinamento/npcap_tl/PASTA --player-name AgrMonteiro --local-config "$env:LOCALAPPDATA/TL/Saved/Config/WindowsNoEditor/NCStorageLocalData.ini"
```

`identity-audit.json` registra envelopes, campos, IDs candidatos, direção,
conexão e contagens. Não atribui identidade automaticamente. O arquivo local
inteiro e os logs do SDK não devem ser versionados.

## Catálogo do cliente

- `TLStatAttrLooks`: símbolos `EPcStatsType`, nomes PT/EN, fatores e apresentação.
- `TLStats`: nomes simbólicos e números `EItemStats`.
- As traduções seguem o namespace real de cada StringTable.

**Não usar `TLStats.num` diretamente como ID universal da rede.** Há lacunas na
numeração de item que não aparecem na sequência observada de `EPcStatsType`.
Exemplo: Fortaleza aparece como 253 na rede e como 263 em `TLStats.num`.
A projeção usa a ordem da tabela, com vínculo de símbolo para apresentação;
esse vínculo é marcado `static-ordinal`. Confirmar com novos pacotes/ficha ao
atualizar a build do jogo. Nomes e números não são prova de cobertura completa.

Preservados no Git:

- `reference/datamine/26231302/character-stat-reference.json.gz`: 287 linhas de
  apresentação, 285 com nomes PT, e 292 registros de `TLStats`, com propriedades.
- `character-stat-reference-index.json`: contagens, hash e limitações.
- `src/data/characterStatReference.json`: projeção embarcada.
- `scripts/fixtures/character-stats.json`: 23 frames reais, com valores conferidos.

Regenerar:

```powershell
python tools/unreal/build-character-stat-reference.py --build 26231302
npm run build
```

Isso exige os exports locais de `tools/unreal/exports/26231302/`; ver
[DATAMINING-REFERENCE.md](DATAMINING-REFERENCE.md). O gzip já preserva o catálogo
para recuperação sem os exports.

## Reconexão e coleta do início da sessão

A captura antiga filtrava o par completo de portas. Ao entrar novamente no
personagem, a porta cliente mudava antes da consulta periódica de sockets, e os
primeiros blocos podiam ser perdidos.

O modo `--follow-loopback-server` mantém o filtro na porta servidora loopback
do túnel identificado por uma conexão do TL. O começo de um fluxo novo fica em
memória até o inventário confirmar a porta cliente como pertencente ao jogo.
Somente então é entregue ao decoder. Buffer limitado a 2 MiB/16 fluxos e cinco
segundos; SYN/FIN/RST e troca de processo/conexão invalidam estados antigos.

Na retomada de 04/11 também foi corrigida a atualização da porta servidora e do
PID do TL: reiniciar o jogo pode mudar o próprio túnel. O filtro é refeito usando
somente os novos endpoints confirmados, descartando streams e buffers antigos.
Não usar IDs da captura de outubro para retomar a identidade de novembro.

O coletor de diagnóstico pode salvar tráfego de outros clientes da mesma porta
loopback; o analisador só interpreta fluxos confirmados pelo inventário do TL.
Não ampliar o filtro indiscriminadamente a todo o tráfego local.

```powershell
python scripts/capture-overlay-reference.py --duration 300 --follow-loopback-server
python scripts/analyze-character-stats.py --folder capturas_treinamento/npcap_tl/PASTA --player-name AgrMonteiro
```

Saídas em `character-stats-analysis`: `snapshots.json`, `packets.jsonl` e
`summary.json`. Sem perfil nominal correspondente, a conexão permanece em
`unboundConnections` e não gera uma ficha atribuída ao personagem.

## Persistência e recuperação

- `electron/main/characterStats.ts`: buffer por conexão, validação e até cinco
  leituras salvas em `<userData>/data/character-snapshots.json`.
- `src/engine/characterStats.ts`: apresentação e conversão em build.
- `src/components/ImportCharacterBuild.tsx`: consulta, revisão e importação.
- `Build.characterSnapshot`: preserva valores brutos, captura, conexão, horário,
  nome e origem (`live`/`pcap`) dentro da build. Exportação/reimportação JSON
  mantém esse material, atributos e status completos.

Arquivo inválido é preservado e informado. Leituras e builds do perfil exigem
backup separado; o Git preserva código, catálogo, fixtures e documentação.

## Verificação

```powershell
python scripts/test-character-stats.py
node scripts/test-character-stats.mjs
node scripts/test-overlay-capture.mjs
```

Cobrem os frames reais e valores da ficha, escalas, buffer de reconexão antes
de validar a porta, retransmissão, limites, direção, início anterior ao perfil,
isolamento entre conexões, atraso, seleção manual de terceiros, snapshots salvos
sem restauração de identidade, conversão por família de dano, preservação de
campos ausentes e defesa própria sem alterar a defesa do alvo.
