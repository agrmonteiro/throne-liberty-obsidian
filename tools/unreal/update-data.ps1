param(
    [string]$PaksPath = 'C:\Program Files (x86)\Steam\steamapps\common\Throne and Liberty\TL\Content\Paks',
    [string]$SteamManifest = 'C:\Program Files (x86)\Steam\steamapps\appmanifest_2429640.acf',
    [string]$PythonExe = 'python',
    [string]$KeysFile,
    [switch]$SyncOverlayCatalog
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'setup.ps1')
$steamText = Get-Content -LiteralPath $SteamManifest -Raw
$buildMatch = [regex]::Match($steamText, '"buildid"\s+"(\d+)"')
if (-not $buildMatch.Success) { throw 'Steam buildid não encontrado.' }
$buildId = $buildMatch.Groups[1].Value
$buildRoot = Join-Path $PSScriptRoot "exports/$buildId"
New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
if (-not $KeysFile) {
    & (Join-Path $PSScriptRoot 'prepare-key.ps1')
    $KeysFile = Join-Path $PSScriptRoot '.local/tl-public-aes.json'
}
$inventory = Join-Path $buildRoot 'archive-index.json'
& (Join-Path $PSScriptRoot 'probe.ps1') -PaksPath $PaksPath -KeysFile $KeysFile -ReportPath $inventory
$tablePlan = Join-Path $buildRoot 'tables-plan.json'
& $PythonExe (Join-Path $PSScriptRoot 'make-plan.py') tables $inventory $tablePlan
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o plano de tabelas.' }
& (Join-Path $PSScriptRoot 'probe.ps1') -PaksPath $PaksPath -KeysFile $KeysFile -ExportPlan $tablePlan -ReportPath (Join-Path $buildRoot 'tl-full-extraction.json')
& $PythonExe (Join-Path $PSScriptRoot 'build-reference.py') --build $buildId
if ($LASTEXITCODE -ne 0) { throw 'Falha ao indexar as tabelas.' }
$iconPlan = Join-Path $buildRoot 'icons-plan.json'
& $PythonExe (Join-Path $PSScriptRoot 'make-plan.py') icons $inventory $iconPlan --reference (Join-Path $buildRoot 'reference-index.json')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o plano de ícones.' }
& (Join-Path $PSScriptRoot 'probe.ps1') -PaksPath $PaksPath -KeysFile $KeysFile -ExportPlan $iconPlan -ReportPath (Join-Path $buildRoot 'tl-icon-extraction.json')
& $PythonExe (Join-Path $PSScriptRoot 'verify-reference.py') --build $buildId
if ($LASTEXITCODE -ne 0) { throw 'A coleta não passou na verificação de integridade.' }
& $PythonExe (Join-Path $PSScriptRoot 'snapshot-reference.py') --build $buildId
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar snapshots compactos para o Git.' }
if ($SyncOverlayCatalog) {
    & $PythonExe (Join-Path $PSScriptRoot 'sync-overlay-catalog.py') --build $buildId
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar o catálogo do overlay.' }
    & $PythonExe (Join-Path $PSScriptRoot 'build-healing-reference.py') --build $buildId
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar a referência de efeitos de cura.' }
}
Write-Host "Coleta e índice disponíveis em $buildRoot"
