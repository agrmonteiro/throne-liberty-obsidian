$ErrorActionPreference = 'Stop'
$lockData = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'toolchain.lock.json') -Raw | ConvertFrom-Json
$source = $lockData.publicArchiveKeySource
$cacheRoot = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null
$client = [System.Net.Http.HttpClient]::new()
try { $bytes = $client.GetByteArrayAsync($source.url).GetAwaiter().GetResult() }
finally { $client.Dispose() }
$hash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
if ($hash -ne $source.sha256) { throw 'A fonte pública diverge do hash registrado.' }
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$match = [regex]::Match($content, 'Throne and Liberty[^\r\n]*?(0x[0-9A-Fa-f]{64})')
if (-not $match.Success) { throw 'A fonte não contém um candidato de chave para TL.' }
$keyData = [pscustomobject]@{source=$source.url;keys=@([pscustomobject]@{guid='00000000000000000000000000000000';key=$match.Groups[1].Value})}
$destination = Join-Path $cacheRoot 'tl-public-aes.json'
$keyData | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $destination -Encoding utf8
Write-Host "Candidato público preparado em cache local. Compatibilidade testada: build $($source.testedBuild)."
