param([string]$TaskName = "HardwareRadar-Mercury-ExistingTaskSupervision")
$task=Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if(!$task){Write-Host "NOT_INSTALLED";exit 0}
$info=Get-ScheduledTaskInfo -TaskName $TaskName
[pscustomobject]@{TaskName=$TaskName;State=$task.State;LastRunTime=$info.LastRunTime;LastTaskResult=$info.LastTaskResult;NextRunTime=$info.NextRunTime}|Format-List
