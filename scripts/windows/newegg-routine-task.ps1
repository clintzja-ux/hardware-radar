param([string]$RepositoryRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path)
$ErrorActionPreference="Stop"
Set-Location -LiteralPath $RepositoryRoot
& npm run mercury:newegg-routine:scheduled
exit $LASTEXITCODE
