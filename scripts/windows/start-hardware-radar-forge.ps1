$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$url = "http://127.0.0.1:4174/"
$health = "$url`operator-api/health"
$expectedRevision = (& git -C $repositoryRoot rev-parse HEAD).Trim()

$status = $null
try { $status = Invoke-RestMethod -Uri $health -TimeoutSec 1 } catch {}
if ($null -ne $status) {
    if ($status.mode -ne "TRUSTED") {
        throw "Forge is already running in read-only mode. Close that Forge window and try again."
    }
    if ($status.runtimeRevision -eq $expectedRevision) {
        Start-Process $url
        exit 0
    }
    $runtimeProcessId = $status.processId
    if (-not $runtimeProcessId) {
        $listener = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 4174 -State Listen -ErrorAction Stop
        $runtimeProcessId = $listener.OwningProcess
    }
    if (-not $runtimeProcessId) { throw "Forge is running an outdated runtime that could not be identified. Close Forge and try again." }
    Stop-Process -Id $runtimeProcessId -ErrorAction Stop
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 100
        if (-not (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 4174 -State Listen -ErrorAction SilentlyContinue)) { break }
    }
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
