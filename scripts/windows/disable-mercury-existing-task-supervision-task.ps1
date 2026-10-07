param([string]$TaskName = "HardwareRadar-Mercury-ExistingTaskSupervision",[string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path)
$ErrorActionPreference="Stop"
Disable-ScheduledTask -TaskName $TaskName | Out-Null
$statePath=Join-Path $RepositoryRoot ".forge-review\mercury\existing-task-supervision\scheduler-activation.json";New-Item -ItemType Directory -Force -Path (Split-Path $statePath)|Out-Null;$state=[pscustomobject]@{schemaVersion="1.0";taskName=$TaskName;installed=$true;enabled=$false;recordedAt=(Get-Date).ToUniversalTime().ToString("o")}|ConvertTo-Json;[IO.File]::WriteAllText($statePath,$state,(New-Object Text.UTF8Encoding($false)))
Write-Host "Disabled scheduled task: $TaskName"
