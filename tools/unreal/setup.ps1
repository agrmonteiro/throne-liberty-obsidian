$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$toolRoot = $PSScriptRoot
$toolLock = Get-Content -LiteralPath (Join-Path $toolRoot 'toolchain.lock.json') -Raw | ConvertFrom-Json
$localRoot = Join-Path $toolRoot '.local'
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null

function Get-VerifiedArchive($Url, $Path, $Algorithm, $ExpectedHash) {
    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "Baixando $([IO.Path]::GetFileName($Path))..."
        Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing
    }
    $actualHash = (Get-FileHash -LiteralPath $Path -Algorithm $Algorithm).Hash
    if ($actualHash -ne $ExpectedHash) { throw "Hash inválido: $Path. Arquivo preservado para inspeção." }
}

$fmodelZip = Join-Path $localRoot "FModel-$($toolLock.fmodel.version).zip"
Get-VerifiedArchive $toolLock.fmodel.url $fmodelZip 'SHA256' $toolLock.fmodel.sha256
$fmodelRoot = Join-Path $localRoot 'FModel'
if (-not (Test-Path -LiteralPath (Join-Path $fmodelRoot 'FModel.exe'))) {
    Expand-Archive -LiteralPath $fmodelZip -DestinationPath $fmodelRoot
}

$sdkRoot = Join-Path $localRoot 'dotnet'
$dotnetExe = Join-Path $sdkRoot 'dotnet.exe'
$sdkVersion = $toolLock.dotnetSdk.version
if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot "sdk/$sdkVersion"))) {
    $sdkZip = Join-Path $localRoot "dotnet-sdk-$sdkVersion-win-x64.zip"
    Get-VerifiedArchive $toolLock.dotnetSdk.url $sdkZip 'SHA512' $toolLock.dotnetSdk.sha512
    Expand-Archive -LiteralPath $sdkZip -DestinationPath $sdkRoot
}
$env:DOTNET_ROOT = $sdkRoot
$env:DOTNET_CLI_HOME = Join-Path $localRoot 'dotnet-home'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
$env:DOTNET_GENERATE_ASPNET_CERTIFICATE = 'false'
& $dotnetExe --version
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível iniciar o SDK local.' }
Write-Host "FModel pronto: $(Join-Path $fmodelRoot 'FModel.exe')"
Write-Host 'SDK pronto. Use probe.ps1 para compilar e executar o CUE4Parse.'
