param(
  [string]$TaskName = "HardwareRadar-Mercury-DryRun",
  [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
)
$ErrorActionPreference = "Stop"
$runner = Join-Path $RepositoryRoot "scripts\windows\mercury-dry-run-task.ps1"
if (!(Test-Path $runner)) { throw "Dry-run task runner not found: $runner" }
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -RepositoryRoot `"$RepositoryRoot`""
$startAt = (Get-Date).AddMinutes(5)

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At $startAt `
    -RepetitionInterval (New-TimeSpan -Hours 6) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Hardware Radar Mercury DF004-E1.2 unattended DRY_RUN only. No paid transport." -Force | Out-Null
Write-Host "Installed scheduled task: $TaskName"
Write-Host "Cadence: every 6 hours beginning approximately 5 minutes after installation"
Write-Host "Authority: npm run acquisition:dry-run only"
Write-Host "Paid transport: UNREACHABLE"
