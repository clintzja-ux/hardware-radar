$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$url = "http://127.0.0.1:4174/"
$health = "$url`operator-api/health"

try {
    $status = Invoke-RestMethod -Uri $health -TimeoutSec 1
    if ($status.mode -ne "TRUSTED") {
        throw "Forge is already running in read-only mode. Close that Forge window and try again."
    }
    Start-Process $url
    exit 0
} catch {
    if ($_.Exception.Message -like "Forge is already running*") { throw }
}

$node = (Get-Command node -ErrorAction Stop).Source
$operator = "operator:$env:USERNAME"
$logRoot = Join-Path $repositoryRoot ".forge-review\forge"
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
$env:FORGE_OPERATOR_ID = $operator
$env:FORGE_OPERATOR_TRUSTED_LAUNCH = "1"
$env:FORGE_OPERATOR_PREVIEW_PORT = "4174"
Start-Process -FilePath $node -ArgumentList "scripts/serve-forge-operator-preview.mjs" -WorkingDirectory $repositoryRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot "operator-runtime.log") -RedirectStandardError (Join-Path $logRoot "operator-runtime-error.log")

$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    try {
        $status = Invoke-RestMethod -Uri $health -TimeoutSec 1
        if ($status.mode -eq "TRUSTED") { $ready = $true; break }
    } catch {}
}
if (-not $ready) { throw "Forge could not start. See .forge-review\forge\operator-runtime-error.log." }
Start-Process $url
