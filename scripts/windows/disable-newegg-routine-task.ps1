param([string]$TaskName="HardwareRadar-Newegg-Routine")
$ErrorActionPreference="Stop"
Disable-ScheduledTask -TaskName $TaskName | Out-Null
Write-Host "Disabled scheduled task: $TaskName"
