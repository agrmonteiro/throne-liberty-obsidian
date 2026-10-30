# Ferramentas locais para arquivos Unreal

Decisão de 30/10/2026: usar FModel para exploração visual e CUE4Parse para
inspeção repetível por código. Este diretório é uma ferramenta de desenvolvimento,
separada das dependências e do instalador do Electron.

**Estado atual:** coleta completa executada, com 1.444 tabelas, PT/EN,
maestrias, Skill Cores e 13.076 recursos visuais. Caminhos, ligações, consultas
e limites estão em [DATAMINING-REFERENCE.md](../../docs/DATAMINING-REFERENCE.md).

## Instalação após clonar o Git

Em PowerShell, a partir da raiz do repositório:

```powershell
./tools/unreal/setup.ps1
./tools/unreal/probe.ps1

# Coleta completa após restaurar as ferramentas (Python 3.11+)
./tools/unreal/update-data.ps1 -PythonExe python
```

O setup baixa arquivos de fontes oficiais, confere SHA-256/SHA-512 e extrai
localmente, sem instalar o SDK globalmente. Uma segunda execução reaproveita
os arquivos existentes. Se um hash divergir, interrompe e preserva o arquivo.

| Componente | Versão fixada | Local |
| --- | --- | --- |
| FModel | release `aug-2026`, executável 4.4.4.0 | `.local/FModel/FModel.exe` |
| .NET SDK x64 | 10.0.403 | `.local/dotnet/` |
| CUE4Parse | NuGet 1.2.2.202610 | `.local/nuget-packages/` |
| Leitor do projeto | ArchiveProbe, net10.0 | `ArchiveProbe/` |

`toolchain.lock.json` guarda URLs, hashes, versões e origem. As dependências
transitivas do CUE4Parse ficam fixadas em `ArchiveProbe/packages.lock.json`;
o restore roda com `--locked-mode`. `NuGet.Config` restringe a origem ao NuGet
oficial e mantém o cache neste diretório. O SDK e os comandos desativam telemetria
da CLI do .NET no processo local.

Foi fixado `Microsoft.Bcl.Memory` 10.0.14 para substituir a dependência transitiva
9.0.0 sinalizada pelo NuGet durante a primeira instalação. A compilação final
passou com zero erros e zero avisos.

## Comandos

```powershell
# Abrir o FModel portátil; o diretório de trabalho também fica em .local
./tools/unreal/open-fmodel.ps1

# Inspecionar outra instalação do TL
./tools/unreal/probe.ps1 -PaksPath 'D:\SteamLibrary\steamapps\common\Throne and Liberty\TL\Content\Paks'

# Escolher onde gravar o relatório
./tools/unreal/probe.ps1 -ReportPath 'C:\analises\tl-archive-index.json'
```

No FModel, selecionar o diretório `TL/Content/Paks` da instalação e o preset de
Throne and Liberty, quando disponível. A abertura visual do FModel ainda não foi
validada nesta rodada; o teste efetivamente executado foi o ArchiveProbe.

O leitor usa `EGame.GAME_ThroneAndLiberty`, registra os contêineres e tenta montar
seus índices. Gera inventário, caminhos visíveis, candidatos por nome,
contêineres inacessíveis, GUIDs de chaves requeridas e diagnósticos. A saída
padrão é `exports/tl-archive-index.json`. Nenhuma chave AES foi fornecida.

## Primeira inspeção em 30/10/2026, sem chave fornecida

Instalação Steam build 26231302, em:
`C:\Program Files (x86)\Steam\steamapps\common\Throne and Liberty\TL\Content\Paks`.

- 131 contêineres registrados; 12 montados e 119 não montados.
- 118 contêineres marcados como criptografados.
- 3.302 caminhos visíveis; zero candidatos pelo filtro textual de habilidades,
  tabelas, localização ou AssetRegistry.
- 28 diagnósticos, incluindo alguns `.utoc` sem o `.ucas` esperado pelo leitor.
- Há pacotes de localização em português, porém sua presença não confirma que
  o conteúdo esteja disponível para exportação.

Isso valida a instalação do CUE4Parse e a inspeção parcial, não a extração das
tabelas nem a correspondência entre IDs dos pacotes e habilidades.
O relatório completo é local e pode ser regenerado com `probe.ps1`.

## Investigação após a coleta completa

Os passos iniciais foram concluídos: a chave pública fixada em `prepare-key.ps1`
montou 118 contêineres adicionais, e `TLJsonDataTable` foi lido como `UDataTable`.
O vínculo UID → símbolo → nome PT/EN/ícone foi encontrado. Consultar o mapa
documentado antes de investigar campos novos. Ainda é necessário validar
semântica de combate do servidor e condições dinâmicas de ícones.

O probe sem plano lista índices. Com `-ExportPlan`, exporta os recursos
selecionados para a pasta da coleta. O dicionário do overlay só é sincronizado
pelo comando específico ou pela opção `-SyncOverlayCatalog` do atualizador.
O código abre a instalação para leitura; os resultados ficam fora do jogo.

## O que o Git recupera

Versionar este README, scripts, manifesto, projeto C# e lockfile NuGet.
`.local/`, `exports/`, `bin/` e `obj/` estão ignorados. Downloads, caches e
relatórios são recriados. Manter uma cópia separada dos exports que virem
evidência única, caso não possam ser reproduzidos após uma atualização do jogo.

FModel é GPL-3.0; CUE4Parse é Apache-2.0. Seus binários não são incorporados ao
instalador do app por este fluxo.
O exportador de texturas usa `BCnEncoder.Net` 2.3.0 (MIT/Unlicense), com
dependências fixadas no lockfile; não depende do pacote CUE4Parse-Conversion.

## Fontes

- [FModel e instruções oficiais](https://github.com/4sval/FModel/wiki/Installing-FModel)
- [Release fixada do FModel](https://github.com/4sval/FModel/releases/tag/aug-2026)
- [CUE4Parse](https://github.com/FabianFG/CUE4Parse)
- [Pacote CUE4Parse fixado](https://www.nuget.org/packages/CUE4Parse/1.2.2.202610)
- [Metadados oficiais .NET 10](https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json)
- [Aviso da dependência Bcl.Memory](https://github.com/advisories/GHSA-73j8-2gch-69rq)
