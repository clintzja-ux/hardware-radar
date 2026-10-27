param([string]$TaskName="HardwareRadar-Newegg-Routine")
$ErrorActionPreference="Stop"
Enable-ScheduledTask -TaskName $TaskName | Out-Null
Write-Host "Enabled scheduled task: $TaskName"
