param([string]$TaskName = "HardwareRadar-Mercury-ExistingTaskSupervision",[string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path)
$ErrorActionPreference="Stop"
Enable-ScheduledTask -TaskName $TaskName | Out-Null
$statePath=Join-Path $RepositoryRoot ".forge-review\mercury\existing-task-supervision\scheduler-activation.json";New-Item -ItemType Directory -Force -Path (Split-Path $statePath)|Out-Null;[pscustomobject]@{schemaVersion="1.0";taskName=$TaskName;installed=$true;enabled=$true;recordedAt=(Get-Date).ToUniversalTime().ToString("o")}|ConvertTo-Json|Set-Content -Path $statePath -Encoding utf8
Write-Host "Enabled scheduled task: $TaskName"
