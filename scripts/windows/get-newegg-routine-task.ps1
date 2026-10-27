param([string]$TaskName="HardwareRadar-Newegg-Routine")
$ErrorActionPreference="Stop"
$task=Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if($null -eq $task){[pscustomobject]@{schemaVersion="1.0";taskName=$TaskName;installed=$false;enabled=$false;status="NOT_INSTALLED";lastScheduledAttempt=$null;nextScheduledTime=$null;observedAt=(Get-Date).ToUniversalTime().ToString("o")}|ConvertTo-Json -Compress;exit 0}
$info=Get-ScheduledTaskInfo -TaskName $TaskName
$now=Get-Date;$todayTrigger=$now.Date.AddHours(16).AddMinutes(30);$enabled=($task.State -ne "Disabled");$neverRun=($info.LastTaskResult -eq 267011 -or $info.LastRunTime.Year -lt 2000);$missed=$enabled -and $now -gt $todayTrigger -and ($neverRun -or $info.LastRunTime -lt $todayTrigger)
[pscustomobject]@{schemaVersion="1.0";taskName=$TaskName;installed=$true;enabled=$enabled;status=[string]$task.State;lastScheduledAttempt=if(-not $neverRun){$info.LastRunTime.ToUniversalTime().ToString("o")}else{$null};lastTaskResult=if(-not $neverRun){$info.LastTaskResult}else{$null};nextScheduledTime=if($info.NextRunTime -gt [datetime]::MinValue){$info.NextRunTime.ToUniversalTime().ToString("o")}else{$null};missedScheduledTrigger=$missed;observedAt=$now.ToUniversalTime().ToString("o")}|ConvertTo-Json -Compress
