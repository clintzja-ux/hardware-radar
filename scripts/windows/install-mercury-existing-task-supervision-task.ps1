param([string]$TaskName = "HardwareRadar-Mercury-ExistingTaskSupervision",[string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path)
$ErrorActionPreference = "Stop"
$runner = Join-Path $RepositoryRoot "scripts\windows\mercury-existing-task-supervision-task.ps1"
if (!(Test-Path $runner)) { throw "Supervision task runner not found: $runner" }
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -RepositoryRoot `"$RepositoryRoot`""
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(5)) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Hardware Radar bounded existing-provider-task supervision. Retrieval only; no paid task authority." -Force | Out-Null
$statePath=Join-Path $RepositoryRoot ".forge-review\mercury\existing-task-supervision\scheduler-activation.json";New-Item -ItemType Directory -Force -Path (Split-Path $statePath)|Out-Null;$state=[pscustomobject]@{schemaVersion="1.0";taskName=$TaskName;installed=$true;enabled=$true;recordedAt=(Get-Date).ToUniversalTime().ToString("o")}|ConvertTo-Json;[IO.File]::WriteAllText($statePath,$state,(New-Object Text.UTF8Encoding($false)))
Write-Host "Installed scheduled task: $TaskName"
Write-Host "Cadence: every 15 minutes; overlap policy: IgnoreNew"
Write-Host "Paid task creation: UNREACHABLE"
