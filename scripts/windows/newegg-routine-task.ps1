param(
    [string]$RuntimeRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path,
    [string]$OperationalRoot=$RuntimeRoot,
    [switch]$ValidateOnly
)
$ErrorActionPreference="Stop"
$runtimeRootPath=(Resolve-Path -LiteralPath $RuntimeRoot).Path
$operationalRootPath=(Resolve-Path -LiteralPath $OperationalRoot).Path
$scheduledScript=Join-Path $runtimeRootPath "scripts\newegg-routine-scheduled.mjs"
$packagePath=Join-Path $runtimeRootPath "package.json"
$environmentPath=Join-Path $operationalRootPath ".env"
$requiredRuntimePaths=@(
    $scheduledScript,
    $packagePath,
    (Join-Path $runtimeRootPath "packages\mercury\operations\ProductionNeweggRoutineOperatorCommand.js"),
    (Join-Path $runtimeRootPath "scripts\ram-public-intelligence-release.mjs"),
    (Join-Path $runtimeRootPath "scripts\unattended-live-price-publication.mjs")
)
foreach($requiredPath in $requiredRuntimePaths){if(-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)){throw "NEWEGG_ROUTINE_STABLE_RUNTIME_INCOMPLETE: $requiredPath"}}
if(-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)){throw "NEWEGG_ROUTINE_PRIVATE_ENVIRONMENT_MISSING"}
$node=(Get-Command node.exe -ErrorAction Stop).Source
Set-Location -LiteralPath $operationalRootPath
if($ValidateOnly){& $node "--env-file=$environmentPath" $scheduledScript "--operational-root=$operationalRootPath" "--runtime-root=$runtimeRootPath" "--validate-only";exit $LASTEXITCODE}
& $node "--env-file=$environmentPath" $scheduledScript "--operational-root=$operationalRootPath" "--runtime-root=$runtimeRootPath"
exit $LASTEXITCODE
