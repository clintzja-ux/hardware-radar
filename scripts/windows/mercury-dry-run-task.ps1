param(
  [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
)
$ErrorActionPreference = "Stop"
Set-Location $RepositoryRoot
$logDir = Join-Path $RepositoryRoot ".forge-review\acquisition\scheduler-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "scheduled-dry-run-$stamp.log"
"[$(Get-Date -Format o)] START DF004-E1.2 unattended DRY_RUN" | Tee-Object -FilePath $logPath
try {
  & npm run acquisition:dry-run 2>&1 | Tee-Object -FilePath $logPath -Append
  if ($LASTEXITCODE -ne 0) { throw "acquisition:dry-run exited with code $LASTEXITCODE" }
  "[$(Get-Date -Format o)] EXIT 0" | Tee-Object -FilePath $logPath -Append
  exit 0
} catch {
  "[$(Get-Date -Format o)] FAILED: $($_.Exception.Message)" | Tee-Object -FilePath $logPath -Append
  exit 1
}
