<#
.SYNOPSIS
Registers Recurring Scheduled Tasks for Thomas Simon's Career Automation Suite (La Paz, UTC-4).
1. 08:30 AM (Mon-Fri): Runs Agent 1 (SCOUT) + Agent 2 (ANALYST) silently in the background.
2. 08:45 AM (Mon-Fri): Opens morning_brief.md & proposals_ready.md for the 15-minute intake.
3. 16:15 PM (Friday): Triggers Weekly CEO Pipeline Summary.
#>

$WorkDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PythonExe) { $PythonExe = "python" }

Write-Host "[SCHEDULE] Configuring Windows Scheduled Tasks in $WorkDir..." -ForegroundColor Cyan

# Task 1: 08:30 AM Mon-Fri Background Ingestion & Scoring
$ActionPipeline = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -Command `"Set-Location '$WorkDir'; & '$PythonExe' scout_agent.py run; & '$PythonExe' analyst_agent.py --run`"" `
    -WorkingDirectory $WorkDir

$TriggerPipeline = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:30AM"
Register-ScheduledTask -TaskName "ThomasCareer_01_ScoutAndAnalyst" -Action $ActionPipeline -Trigger $TriggerPipeline -Description "Runs Agent 1 SCOUT and Agent 2 ANALYST at 08:30 AM Mon-Fri" -Force

# Task 2: 08:45 AM Mon-Fri Open Morning Brief Portal (https://pi.tsimon.me)
$ActionBrief = New-ScheduledTaskAction -Execute "cmd.exe" `
    -Argument "/c start `"`" `"https://pi.tsimon.me`"" `
    -WorkingDirectory $WorkDir

$TriggerBrief = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:45AM"
Register-ScheduledTask -TaskName "ThomasCareer_02_MorningBriefOpen" -Action $ActionBrief -Trigger $TriggerBrief -Description "Opens Morning Brief at 08:45 AM Mon-Fri" -Force

Write-Host "[SUCCESS] Scheduled Tasks registered for 08:30 AM and 08:45 AM (Mon-Fri)." -ForegroundColor Green
