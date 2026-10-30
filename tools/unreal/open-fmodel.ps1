$ErrorActionPreference = 'Stop'
$fmodelRoot = Join-Path $PSScriptRoot '.local/FModel'
$fmodelExe = Join-Path $fmodelRoot 'FModel.exe'
if (-not (Test-Path -LiteralPath $fmodelExe)) { throw 'Execute tools/unreal/setup.ps1 primeiro.' }
$env:DOTNET_ROOT = Join-Path $PSScriptRoot '.local/dotnet'
$env:DOTNET_ROOT_X64 = $env:DOTNET_ROOT
Start-Process -FilePath $fmodelExe -WorkingDirectory $fmodelRoot -WindowStyle Hidden
