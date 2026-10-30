param(
    [string]$PaksPath = 'C:\Program Files (x86)\Steam\steamapps\common\Throne and Liberty\TL\Content\Paks',
    [string]$ReportPath = (Join-Path $PSScriptRoot 'exports/tl-archive-index.json')
)
$ErrorActionPreference = 'Stop'
$sdkRoot = Join-Path $PSScriptRoot '.local/dotnet'
$dotnetExe = Join-Path $sdkRoot 'dotnet.exe'
if (-not (Test-Path -LiteralPath $dotnetExe)) { throw 'Execute tools/unreal/setup.ps1 primeiro.' }
$env:DOTNET_ROOT = $sdkRoot
$env:DOTNET_CLI_HOME = Join-Path $PSScriptRoot '.local/dotnet-home'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
$env:DOTNET_GENERATE_ASPNET_CERTIFICATE = 'false'
$projectPath = Join-Path $PSScriptRoot 'ArchiveProbe/ArchiveProbe.csproj'
& $dotnetExe restore $projectPath --locked-mode --configfile (Join-Path $PSScriptRoot 'NuGet.Config')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar o CUE4Parse.' }
& $dotnetExe build $projectPath --no-restore --configuration Release --nologo
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o leitor de arquivos.' }
& $dotnetExe (Join-Path $PSScriptRoot 'ArchiveProbe/bin/Release/net10.0/ArchiveProbe.dll') $PaksPath $ReportPath
if ($LASTEXITCODE -ne 0) { throw 'Falha ao inspecionar os arquivos.' }
