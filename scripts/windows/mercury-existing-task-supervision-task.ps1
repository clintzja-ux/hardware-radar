param([string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path)
$ErrorActionPreference = "Stop"
Set-Location $RepositoryRoot
$logDir = Join-Path $RepositoryRoot ".forge-review\acquisition\scheduler-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir ("existing-task-supervision-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
"[$(Get-Date -Format o)] START existing-task supervision" | Tee-Object -FilePath $logPath
try {
  & npm run mercury:existing-task-supervision:scheduled 2>&1 | Tee-Object -FilePath $logPath -Append
  if ($LASTEXITCODE -ne 0) { throw "supervision exited with code $LASTEXITCODE" }
  "[$(Get-Date -Format o)] EXIT 0" | Tee-Object -FilePath $logPath -Append
  exit 0
} catch {
  "[$(Get-Date -Format o)] FAILED: $($_.Exception.Message)" | Tee-Object -FilePath $logPath -Append
  exit 1
}
