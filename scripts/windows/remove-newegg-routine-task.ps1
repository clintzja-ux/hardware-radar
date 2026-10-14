param([string]$TaskName="HardwareRadar-Newegg-Routine")
$ErrorActionPreference="Stop"
if(Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue){Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false}
Write-Host "Removed scheduled task: $TaskName"
