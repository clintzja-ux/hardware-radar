param(
    [Parameter(Mandatory=$true)][string]$RuntimeRoot,
    [Parameter(Mandatory=$true)][string]$OperationalRoot,
    [string]$TaskName="HardwareRadar-Newegg-Routine"
)
$ErrorActionPreference="Stop"
$zone=[TimeZoneInfo]::Local
if($zone.BaseUtcOffset -ne [TimeSpan]::FromHours(-5) -or $zone.SupportsDaylightSavingTime){throw "NEWEGG_ROUTINE_JAMAICA_TIMEZONE_REQUIRED"}
$runtimeRootPath=(Resolve-Path -LiteralPath $RuntimeRoot).Path
$operationalRootPath=(Resolve-Path -LiteralPath $OperationalRoot).Path
$runner=Join-Path $runtimeRootPath "scripts\windows\newegg-routine-task.ps1"
if(-not (Test-Path -LiteralPath $runner -PathType Leaf)){throw "NEWEGG_ROUTINE_STABLE_LAUNCHER_MISSING"}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner -RuntimeRoot $runtimeRootPath -OperationalRoot $operationalRootPath -ValidateOnly
if($LASTEXITCODE -ne 0){throw "NEWEGG_ROUTINE_STABLE_RUNTIME_VALIDATION_FAILED"}
$existingTask=Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
$preserveEnabled=$null -ne $existingTask -and $existingTask.State -ne "Disabled"
$action=New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -RuntimeRoot `"$runtimeRootPath`" -OperationalRoot `"$operationalRootPath`""
$dailyTrigger=New-ScheduledTaskTrigger -Daily -At "4:30 PM"
$signInTrigger=New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 8) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($dailyTrigger,$signInTrigger) -Settings $settings -Principal $principal -Description "Hardware Radar bounded Newegg routine. Jamaica-local 16:30 plus same-day sign-in evaluation; no historical catch-up, restart, retry, release, deployment, or automatic deletion authority." -Force | Out-Null
if($preserveEnabled){Enable-ScheduledTask -TaskName $TaskName | Out-Null;Write-Host "Updated enabled scheduled task: $TaskName"}else{Disable-ScheduledTask -TaskName $TaskName | Out-Null;Write-Host "Installed disabled scheduled task: $TaskName"}
