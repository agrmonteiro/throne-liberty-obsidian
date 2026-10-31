# Mapa dos arquivos e dados do TL — 30/10/2026

Referência validada na instalação Steam **build 26231302**. Usar estes caminhos
antes de repetir descoberta de arquivos. A coleta é estática e lê a instalação;
não depende de memória do jogo ou de executar entradas no personagem.

## Resultado e localização

Para fontes/ataques recebidos, o catálogo específico e as relações de spawn estão
em [OVERLAY-NOMES-DANO-RECEBIDO.md](OVERLAY-NOMES-DANO-RECEBIDO.md).
Gerador: `tools/unreal/build-overlay-npc-reference.py`; saída:
`src/data/overlayNpcReference.json`. Inclui os monstros fora de `TLSkillPcLooks*`.

| Conteúdo | Quantidade |
| --- | ---: |
| Tabelas do cliente exportadas | 1.444 |
| Linhas dessas tabelas | 444.051 |
| Registros da tabela TLSkill | 16.558 |
| Registros de habilidade com UI localizada | 3.093 |
| IDs positivos usados no catálogo offline do overlay | 3.091 |
| Registros relacionados a maestrias | 4.767 |
| Opções da tabela TLPerkOption | 305 |
| Registros selecionados por símbolos/textos de Skill Core | 1.285 |
| Textos em português | 163.933 |
| Textos em inglês | 162.685 |
| Referências de recursos em tabelas | 595.430 |
| Vínculos por igualdade de símbolo | 609.542 |
| Imagens PNG extraídas | 11.662 |
| Outros recursos visuais preservados como metadados | 1.414 |

As 1.285 linhas relacionadas a cores incluem opções, sockets, itens e outras
referências; não representam 1.285 cores distintos disponíveis no jogo.
Registros de teste/inativos podem existir no cliente. Vínculos por igualdade de
símbolo são candidatos de referência, não prova independente de comportamento
do servidor.

Raiz local: `tools/unreal/exports/26231302/`.

| Caminho relativo nessa raiz | Uso |
| --- | --- |
| `tl-full-extraction.json` | Inventário de contêineres/arquivos, plano efetivo, saídas e hashes dos pacotes originais |
| `skill-data/raw/tables/` | Pacotes `.uasset` e partes associadas, preservados para reprocessamento |
| `skill-data/properties/` | JSON completo dos exports das 1.444 tabelas |
| `skill-data/raw/pt/Game.locres`, `skill-data/raw/en/Game.locres` | Traduções originais |
| `skill-data/localization/pt.json`, `en.json` | Dicionários de tradução por namespace/chave |
| `reference-index.json` | Ponte para o SQLite desta coleta e seus checksums/contagens |
| `reference-*.sqlite` | Base pesquisável; usar o nome apontado no índice, não fixar o hash no código |
| `skill-reference.json` | Todos os IDs/linhas de TLSkill, nomes PT/EN, ícones e status da ligação |
| `mastery-reference.json` | Maestrias e respectivos dados de progressão/efeitos/apresentação |
| `skill-core-reference.json` | Recorte de cores e seus vínculos, com os payloads originais |
| `table-inventory.json` | Tabelas, classes, contagens e SHA-256 dos JSONs |
| `tl-icon-extraction.json` | Índice de PNGs e metadados visuais, dimensões, hashes e erros |
| `icons/Image/` | Hierarquia original das imagens, convertidas para PNG sem perda |
| `verification.json` | Resultado da validação independente de hashes, SQLite e estrutura dos PNGs |

As validações passaram para 15.968 arquivos, incluindo CRC/deflate/dimensões de
todos os 11.662 PNGs, integridade SQLite e nove IDs conhecidos. Extração de
tabelas e recursos visuais terminou sem erros registrados nas saídas finais.

## Instalação e contêineres

Pasta observada:
`C:\Program Files (x86)\Steam\steamapps\common\Throne and Liberty\TL\Content\Paks`.
Manifesto Steam: `steamapps/appmanifest_2429640.acf`, campo `buildid`.

- `.pak`: índices/arquivos tradicionais, incluindo pacotes de localização.
- `.utoc` + `.ucas`: contêineres IoStore; `global.utoc/global.ucas` fornecem
  dados globais. A ausência de um par esperado é registrada nos diagnósticos.
- Preset do CUE4Parse: `EGame.GAME_ThroneAndLiberty`.
- O tipo customizado `TLJsonDataTable` é registrado como `UDataTable` para
  desserializar suas linhas com o parser de propriedades etiquetadas.
- Uma chave pública da coleção `Shegorat/cls-ue4d`, fixada por commit e hash
  no `toolchain.lock.json`, montou 118 contêineres antes criptografados.
  Total final: 130 montados, com 602.416 caminhos distintos no índice.
- O candidato de chave fica somente em `.local/tl-public-aes.json`.
  `prepare-key.ps1` o obtém da fonte fixada; a validade em outra build precisa
  ser testada novamente. Nenhuma credencial de conta é utilizada.

## Caminhos internos das tabelas

Prefixo: **`TL/Content/Game/Client/Table/`**. Caminho Unreal equivalente:
`/Game/Game/Client/Table/`. Não remover o segundo `Game` ao resolver referências.

| Tabela/família | Campos ou papel identificado |
| --- | --- |
| `TLSkill` | `UID` numérico do evento → nome simbólico da linha; categoria, delays, tipo de ataque e parâmetros básicos |
| `TLSkillPcLooks_Weapon_*` | Mesma linha simbólica → `UIName`, `IconPath`, apresentação e condições de ícone |
| `TLSkillPcLooks_Common`, `_Item`, etc. | Apresentação de habilidades comuns, equipamentos e outras origens |
| `TLSkillLooks_*`, `TLPassiveSkillLooks` | Dados visuais de habilidades/contextos e passivas |
| `TLEffectProperty`, `TLEffectPropLooks_*` | Efeitos, parâmetros, vínculos com estados e apresentação |
| `TLAbnormalState_*`, `TLAbnormalLooks_*` | Estados, buffs/debuffs e seus nomes/apresentação |
| `TLFormulaParameterNew`, `TLFormulaRangeNew`, `TLFormulaHeightNew` | Fórmulas e parâmetros referidos pelas tabelas |
| `TLSkillOptionalDataForPc`, `TLSkillLevelSetting`, `TLSkillLevelUpRecipe` | Dados complementares, níveis e evolução de habilidades |
| `TLWeaponCategorySkillSet` | Organização de conjuntos por categoria de arma |
| `TLWeaponSpecializationNodeNormal`, `NodeSynergy`, `NodeUnified` | Nós de maestria, identificadores, requisitos e habilidades/passivas vinculadas |
| `TLWeaponSpecializationStat`, `TLWeaponSpecializationLevel` | Valores/níveis da maestria |
| `TLTableWeaponSpecializationLooks` | Nome, descrição, `StatIconPath` e referência visual dos nós |
| `TLPerkOption` | Cores: `OptionUid`, `UniqueSkillSetId`, `UniqueSkillComplexId`, categorias de item e flags |
| `TLPerkSocket` | Sockets de cores e referência a custos |
| `TLItemLooks`, tabelas de itens/custos/receitas | Nomes, ícones e vínculos dos itens, cores e materiais |
| `TLString*` | StringTables originais: namespace e chaves usadas para localizar o texto traduzido |

Foram coletadas **todas** as tabelas desse diretório, inclusive itens, receitas,
NPCs e demais sistemas, para preservar relações que não apareçam no nome de
uma tabela. O inventário completo evita depender apenas da lista acima.

## Tradução: detalhe importante

O `TableId` de um `FText` aponta para um asset de StringTable. O **namespace real**
deve ser obtido de `StringTable.TableNamespace` no JSON desse asset; ele nem
sempre é igual ao nome do arquivo. Por exemplo, arquivos específicos de armas
podem usar o namespace comum `TLStringSkillDesc`.

Ligação usada: `TLSkill.UID` → linha simbólica igual em `TLSkillPcLooks_*` →
`UIName.TableId`/`Key` → `StringTable.TableNamespace` → namespace/chave em
`Game.locres` de **pt** e **en**. Não traduzir o `SourceString` coreano por conta
própria nem atribuir nomes por semelhança de IDs/dano.

## Ícones e ataques básicos

- Ícones ativos: `/Game/Image/Skill/Active/`.
- Especializações: `/Game/Image/Skill/Specialization/`.
- Maestrias: `/Game/Image/Skill/WeaponSpecialization/`.
- Itens/cores: `/Game/Image/Icon/Item_128/Misc/`, entre outros diretórios indicados
  pelo `IconPath` da linha. Exemplo: `Perk_bow_a_t1_normal_001`.
- `AssetPathName` tem formato `/Game/Image/.../Nome.Nome`; converter a parte
  anterior ao ponto para `TL/Content/Image/.../Nome.uasset` ao consultar o índice.
- PNGs mantêm a hierarquia sob `icons/Image/`. Sprites e outros assets que não
  são `UTexture2D` têm seus metadados JSON preservados, sem serem tratados como
  imagens extraídas. Eles podem apontar para uma textura/atlas já exportado.

Ataques básicos também têm entradas próprias. Exemplos:

| ID | Linha em TLSkill | Ícone |
| --- | --- | --- |
| 947551927 | `WP_BO_S_BasicShot_1` | `S_WP_BO_BasicShot` — arco |
| 947525562 | `WP_CR_CR_D_BasicShot_1` | `S_WP_CR_BasicShot` — besta |
| 951925391 | `WP_WA_GR_S_BasicAttack_1` | `S_WP_WA_GR_S_BasicAttack` — varinha |
| 968862069 | `WP_ST_S_BasicAttack_1_Mastery` | `S_WP_ST_BasicAttack` — cajado |

Arco e besta podem compartilhar o texto **Disparo Básico**, enquanto cajado e
varinha compartilham **Esfera de Mana**. O overlay preserva `skillIds` e escolhe
o ícone por ID; linhas com ícones distintos não devem ser fundidas só pelo nome.
Registros antigos que já perderam os IDs não podem ser desagrupados com exatidão.

`SkillPcLooksBySkillTrait` e `SkillPcLooksByAbnormalState` descrevem ícones
condicionais. A presença da variante no cliente não confirma qual condição está
ativa no personagem; o catálogo preserva essa distinção.

## Atualizar e consultar

```powershell
# Coleta completa, PT/EN, SQLite, imagens, validação e snapshots compactos
./tools/unreal/update-data.ps1 -PythonExe python

# Também atualizar os dados gerados utilizados pelo overlay
python -m pip install -r tools/unreal/requirements.txt
./tools/unreal/update-data.ps1 -PythonExe python -SyncOverlayCatalog

# Instalação em outra biblioteca Steam
./tools/unreal/update-data.ps1 -PaksPath 'D:\SteamLibrary\steamapps\common\Throne and Liberty\TL\Content\Paks' -SteamManifest 'D:\SteamLibrary\steamapps\appmanifest_2429640.acf'

python tools/unreal/query-reference.py 968448884 --build 26231302
python tools/unreal/query-reference.py 'Serial Fire Bombs' --build 26231302
python tools/unreal/query-reference.py 'Obliteração Corrompida' --build 26231302
python tools/unreal/query-reference.py --build 26231302 --sql "SELECT row_key,payload FROM records WHERE table_name='TLPerkOption' LIMIT 5"
```

O programa de consulta abre SQLite em modo somente leitura. `update-data.ps1`
separa builds em diretórios, valida a fonte pública e gera os planos a partir
do índice atual. Texturas já exportadas nessa build são reaproveitadas após
conferir SHA-256. Builds diferentes não compartilham o diretório de saída.

`sync-overlay-catalog.py` gera `src/data/overlayDataminedSkills.json`, copia os
miniaturas WebP locais para `src/assets/skills/Local__*.webp` e registra a
proveniência em `docs/overlay-datamined-sources.json`. O dicionário curado anterior
continua com prioridade por ID. Após sincronizar, compilar e revisar diferenças;
a coleta não publica nem reinicia automaticamente o app.
As miniaturas do app têm até 128×128 px, qualidade 90, geradas com Pillow fixado
em `requirements.txt`; os PNGs originais completos permanecem no arquivo local.

`build-healing-reference.py --build 26231302` extrai de `TLEffectProperty` os
442 efeitos dos grupos `Continuous_Heal`, `Intervallic_Heal` e `Instant_Heal`,
junto dos UIDs não nulos de `TLSkill`, para `src/data/overlayHealingEffects.json`.
Essa etapa também roda em `update-data.ps1 -SyncOverlayCatalog`. O arquivo fica
versionado e embarcado no main; o cliente instalado não precisa do SQLite.
Vínculos de pacote, autocura e limites de cobertura estão em
[OVERLAY-METRICAS-E-CRONOMETRO.md](OVERLAY-METRICAS-E-CRONOMETRO.md).

`classify-healing-descriptions.py --build 26231302` resolve descrições PT/EN via
`TableId` → namespace real → chave de tradução e classifica os 3.860 registros
de `TLSkillPcLooks*`. O relatório/CSV ficam em `docs/healing-classification/26231302/`;
o snapshot completo em `reference/datamine/26231302/healing-descriptions.json.gz`;
o recorte para tooltips em `src/data/overlayHealingSkillClasses.json`.
Essa etapa também faz parte de `-SyncOverlayCatalog`. Fórmulas dos tooltips são
cruzadas por símbolo exato com `TLEffectProperty.formula_parameter`; essa relação
não comprova efeito ativo no servidor. Especializações/ranks ficam separados.

## Git e recuperação

`reference/datamine/26231302/` contém snapshots gzip determinísticos do catálogo
completo de habilidades, das maestrias, dos registros de cores e do inventário
de tabelas. O `index.json` registra hashes, contagens e verificação. São cerca
de 750 KiB, adequados para preservar no Git junto com os scripts e documentação.
Na ausência do SQLite local, `query-reference.py` consulta esses snapshots
automaticamente para buscas por ID/nome/termo; SQL exige a base completa.

SQLite, os aproximadamente 962 MB de JSONs completos, pacotes originais e todas
as imagens ficam sob `tools/unreal/exports/`, ignorado pelo Git. Copiar essa
pasta separadamente para preservar a coleta exata de uma build antiga.
Uma atualização do jogo pode impedir reconstruir a mesma versão a partir da
instalação atual. Os snapshots compactos não substituem esse backup completo.

Fonte do parser: [CUE4Parse](https://github.com/FabianFG/CUE4Parse).
Decodificação BCn: [BCnEncoder.NET](https://github.com/Nominom/BCnEncoder.NET).
Os formatos PNG são gravados com APIs padrão .NET; a validação usa Python/zlib
independentes. As versões e a fonte pública da chave estão fixadas no
`tools/unreal/toolchain.lock.json`, sem gravar o valor da chave neste documento.
