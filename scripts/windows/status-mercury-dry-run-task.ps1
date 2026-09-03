param([string]$TaskName = "HardwareRadar-Mercury-DryRun")
$ErrorActionPreference = "Stop"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -eq $task) { Write-Host "Task not installed: $TaskName"; exit 0 }
$info = Get-ScheduledTaskInfo -TaskName $TaskName
[pscustomobject]@{TaskName=$TaskName;State=$task.State;LastRunTime=$info.LastRunTime;LastTaskResult=$info.LastTaskResult;NextRunTime=$info.NextRunTime} | Format-List
