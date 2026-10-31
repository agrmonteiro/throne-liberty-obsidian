# Nomes de fontes e habilidades recebidas — 31/10/2026

## Causa e solução

O catálogo anterior resolvia habilidades de jogador a partir de `TLSkillPcLooks*`.
Os ataques recebidos nas amostras são principalmente de monstros, cujas linhas
ficam em `TLSkill`/`TLSkillLooks_*`, geralmente sem `UIName`. O mapa de fontes
usava somente perfis de jogador (`0x1234787f`), e o checkpoint do histórico não
incluía os nomes enriquecidos que apareciam na leitura ao vivo.

Agora `src/data/overlayNpcReference.json` preserva 10.719 UIDs de NPC com nome
localizado ou nome da espécie e 7.603 IDs de ataque com rótulo de consulta. Os
nomes de jogador e os nomes revisados manualmente continuam tendo prioridade.
Nenhum ID temporário de entidade é fixado nesse catálogo.

Ataques de NPC sem nome de UI usam um **nome descritivo**, derivado do símbolo
exato da habilidade: por exemplo, `Skill_GorillaWarrior_ThrowStone` recebe
“Arremesso de Pedra · Gorila de Pedra Brutal”. Esses rótulos não são apresentados
como traduções oficiais da habilidade; os detalhes e o rodapé informam a origem.
Quando não há tradução do arquétipo/ação, usa-se o símbolo em formato legível.

Foram corrigidas também diferenças apenas de caixa, como `GoatBigHorn` /
`GoatBighorn` e `TwoHandClaw` / `TwohandClaw`: só aceitar a ligação alternativa
quando houver um único símbolo de apresentação normalizado. As 67 ligações
desse tipo ficam registradas no relatório; não usar aproximação por similaridade.

## Vínculo do NPC nos pacotes

- Opcode observado: **`0x12346f68`**, somente servidor → cliente.
- Campo **3**: ID da entidade em tempo de execução, sem zigzag.
- Campos **4 e 32**: mesmo UID do template de NPC, ambos em zigzag.
- Exigir os três campos como escalares únicos, IDs positivos e inteiros seguros,
  além da igualdade entre os dois UIDs do template.
- O main aceita somente template presente no catálogo e mensagem da captura
  atual. O registro é separado por conexão e limitado em tamanho.
- Templates conflitantes para a mesma entidade/conexão tornam o nome incerto;
  não escolher arbitrariamente. Conexões aposentadas e mensagens tardias são
  ignoradas. Um mesmo número em outra conexão não herda o nome.
- Spawn de NPC nunca identifica nem seleciona o personagem. Perfis confirmados
  de jogador mantêm prioridade sobre nomes de NPC.
- Em seleção manual sem perfil, a conexão da medição é fixada pelo primeiro
  evento aceito envolvendo a origem explicitamente selecionada. Isso não equivale
  a confirmar um jogador por perfil. A desconexão encerra também esse vínculo.

Não generalizar os outros opcodes do relatório de auditoria: coincidências de
inteiros em pacotes de combate/buff não foram tratadas como identificação.

## Persistência e registros antigos

O snapshot recebido passa a salvar `sources[].name` e `sources[].npcId`. O mesmo
enriquecimento é aplicado à UI e ao checkpoint. Nome que chega depois do ataque
atualiza o histórico mesmo sem chegar outro dano. O UID estático permite resolver
novamente o nome ao consultar o registro, sem usar entidades da captura atual.

Nomes de habilidades podem ser aplicados aos registros antigos porque já havia
`skillIds`. As 29 habilidades da evidência inicial foram cobertas. Registros antigos
que guardaram somente o ID temporário da fonte não permitem recuperar o nome com
segurança. Não adivinhar pela quantidade de dano, pelo horário ou pelo mesmo ID
em outra captura. Fontes ainda sem template/perfil continuam explicitamente sem
nome até o jogo transmitir a informação; encontros novos passam a preservá-la.

## Regenerar e localizar os dados

```powershell
python tools/unreal/build-overlay-npc-reference.py --build 26231302
```

Entrada: SQLite apontado por `tools/unreal/exports/26231302/reference-index.json`.
O gerador lê `TLSkill`, `TLSkillLooks_*`, `TLNpc_*`, `TLNpcRace`, `source_strings`
e `texts`. `FText.TableId` é resolvido pelo namespace real da StringTable; para
FText com `Namespace` direto, preservar esse namespace.

Saídas versionadas:

- `src/data/overlayNpcReference.json`: catálogo consumido pelo app.
- `docs/overlay-npc-reference.json`: contagens, UIDs ambíguos excluídos, diferenças
  de caixa e ações sem rótulo PT revisado.
- `tools/unreal/update-data.ps1 -SyncOverlayCatalog`: inclui essa geração.

O app não depende de Python/SQLite para traduzir o catálogo durante a renderização.
O worker transmite os IDs observados e o backend resolve os nomes já compilados.

## Evidência e inventário de QA

`scripts/test-overlay-npc-names.py` reprocessa os PCAPs por direção real obtida dos
snapshots de endpoints, preservando enquadramento, descompressão e TCP. Resultados:

| Captura | Spawns | Entidades com nome | Danos com fonte nomeada | Eventos de dano preservados |
| --- | ---: | ---: | ---: | ---: |
| `20261030-094453-reference` | 187 | 187 | 218 | 6.392 |
| `20261030-184651-reference` | 140 | 90 | 50 | 586 |
| `20261030-191646-reference` | 179 | 132 | 72 | 2.908 |

Na terceira amostra, entidades do template `10212035` (“Guarda do Apóstolo”)
causam dano com habilidades `Skill_SoulSpiritKnight_*`, conferindo o vínculo entre
template, entidade atacante e arquétipo da habilidade em eventos independentes.

| Verificação | Cobertura |
| --- | --- |
| Nomes nas duas páginas | Conferir com dados reais, inclusive os registros antigos de habilidades |
| Histórico | Persistência de nome/UID e atualização tardia sem alterar totais |
| Consulta e busca | Nome completo nos detalhes, busca pelo rótulo e ID disponível |
| Ausência de metadados | Histórico antigo sem template continua sem nome; não usar dados do encontro atual |
| Conexões e conflitos | Mesmo número em conexão diferente, template desconhecido, troca de template e pacote aposentado |
| Direção e parser | Rejeitar cliente → servidor, UID duplicado divergente e campos repetidos |
| Identidade | NPC não seleciona jogador; origem manual não ganha confirmação de perfil |
| Integridade | Totais/hits de dano, autocura, timer, pausa e retransmissões preservados |

Testes: `test-overlay-npc-names.py`, `test-overlay-capture.mjs`,
`test-overlay-history.mjs`, `test-overlay-meter.mjs`, `test-overlay-analysis.mjs`,
`test-overlay-framing.py` e `test-overlay-vampirism.py`.
TypeScript estrito em main/preload e componentes alterados; build Electron.

Os artefatos de investigação `scratch/npc-binding-audit.json` e
`scratch/received-name-evidence.json` são locais/ignorados. O parser, catálogo,
gerador, testes e este mapa são recuperáveis pelo Git.

## Validação da interface

Na janela real do Electron, o registro de 30/10 às 20:39 mostrou os oito ataques
recebidos com nomes: Investida/Golpe Corporal/Ataque Duplo de Gorila, Arremesso de
Pedra, Relâmpago em Cadeia/Cabeçada/Investida de Bode Unicórnio e Cuspe de Gosma.
O total original permaneceu em 61.393 de dano recebido / 43 acertos. A consulta
abriu o detalhe completo, o aviso de rótulo descritivo e o UID da habilidade.
Os 29 IDs recebidos únicos da evidência inicial tiveram resolução no catálogo.

A versão completa foi carregada com um reinício do Electron, salvando o encontro
anterior antes e verificando que processo/geração TCP do TL permaneceram iguais.
Há uma única instância principal do app. Um perfil novo do AgrMonteiro chegou
depois da atualização e a seleção automática foi confirmada, inclusive após
troca de conexão/entidade. Não foram fixadas entidades antigas nem inseridos
eventos de QA na captura real.

Na leitura ao vivo, o backend e o overlay exibiram “Nevadinho Apanhador”,
“Nevadinho Invocador” e “Nevadinho Esfaqueador” para fontes NPC observadas. A
consulta foi feita pela lista de origens de toda a captura e retornou à página
escolhida pelo usuário depois. Naquele instante ainda não havia dano contra o
personagem selecionado; os totais recebidos permaneceram zero. O caminho de dano
recebido com nomes foi validado nas três capturas reais e nos testes de
persistência/conexão acima, preservando a distinção entre origens observadas e
dano efetivamente recebido pelo jogador.
