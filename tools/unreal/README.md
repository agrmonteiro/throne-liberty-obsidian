# Ferramentas locais para arquivos Unreal

Decisão de 30/10/2026: usar FModel para exploração visual e CUE4Parse para
inspeção repetível por código. Este diretório é uma ferramenta de desenvolvimento,
separada das dependências e do instalador do Electron.

## Instalação após clonar o Git

Em PowerShell, a partir da raiz do repositório:

```powershell
./tools/unreal/setup.ps1
./tools/unreal/probe.ps1
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

## Resultado observado em 30/10/2026

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

## Próxima investigação

1. Conferir os diagnósticos e a compatibilidade com esta build do TL.
2. Verificar quais tabelas e recursos ficam acessíveis pelo parser.
3. Se houver dados legíveis, buscar a relação entre ID numérico do evento,
   identificador simbólico, nome localizado, especialização e ícone.
4. Validar essa relação contra logs explícitos ou confirmações registradas.
   Só depois incorporar mapeamentos ao overlay.

O probe atual não exporta conteúdo nem altera o dicionário de habilidades.
O código abre os arquivos do jogo para leitura; relatórios ficam fora da
instalação. Ajustar a versão/preset é uma investigação separada, caso necessária.

## O que o Git recupera

Versionar este README, scripts, manifesto, projeto C# e lockfile NuGet.
`.local/`, `exports/`, `bin/` e `obj/` estão ignorados. Downloads, caches e
relatórios são recriados. Manter uma cópia separada dos exports que virem
evidência única, caso não possam ser reproduzidos após uma atualização do jogo.

FModel é GPL-3.0; CUE4Parse é Apache-2.0. Seus binários não são incorporados ao
instalador do app por este fluxo.

## Fontes

- [FModel e instruções oficiais](https://github.com/4sval/FModel/wiki/Installing-FModel)
- [Release fixada do FModel](https://github.com/4sval/FModel/releases/tag/aug-2026)
- [CUE4Parse](https://github.com/FabianFG/CUE4Parse)
- [Pacote CUE4Parse fixado](https://www.nuget.org/packages/CUE4Parse/1.2.2.202610)
- [Metadados oficiais .NET 10](https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json)
- [Aviso da dependência Bcl.Memory](https://github.com/advisories/GHSA-73j8-2gch-69rq)
