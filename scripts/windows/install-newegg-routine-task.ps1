param([string]$RepositoryRoot=(Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path,[string]$TaskName="HardwareRadar-Newegg-Routine")
$ErrorActionPreference="Stop"
$zone=[TimeZoneInfo]::Local
if($zone.BaseUtcOffset -ne [TimeSpan]::FromHours(-5) -or $zone.SupportsDaylightSavingTime){throw "NEWEGG_ROUTINE_JAMAICA_TIMEZONE_REQUIRED"}
$runner=Join-Path $RepositoryRoot "scripts\windows\newegg-routine-task.ps1"
$action=New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -RepositoryRoot `"$RepositoryRoot`""
$dailyTrigger=New-ScheduledTaskTrigger -Daily -At "4:30 PM"
$signInTrigger=New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 8) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($dailyTrigger,$signInTrigger) -Settings $settings -Principal $principal -Description "Hardware Radar bounded Newegg routine. Jamaica-local 16:30 plus same-day sign-in evaluation; no historical catch-up, restart, retry, release, deployment, or automatic deletion authority." -Force | Out-Null
Disable-ScheduledTask -TaskName $TaskName | Out-Null
Write-Host "Installed disabled scheduled task: $TaskName"
