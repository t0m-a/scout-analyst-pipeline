# install_schedules.ps1 — Hardened Windows 11 Task Scheduler Setup (v4.0.0)
# Runs 6-Track SCOUT + ANALYST Mon-Fri at 08:30 AM (America/La_Paz, UTC-4) with Wake/Battery Resilience
# Publishes unified index.html to Y:\var\www\html\index.html (served via https://pi.tsimon.me)

$WorkDir = $PSScriptRoot
if (-not $WorkDir) { $WorkDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $WorkDir) { $WorkDir = "Y:\opt\scout-analyst" }

$PythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PythonExe) { $PythonExe = "python" }

Write-Host "[SCHEDULE] Configuring Windows 11 Scheduled Tasks (v4.0.0) in $WorkDir..." -ForegroundColor Cyan

$TaskSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

$PipelineCmd = "Set-Location '$WorkDir'; & '$PythonExe' scout_agent.py run --mode clustered >> '$WorkDir\pipeline.log' 2>&1; & '$PythonExe' analyst_agent.py --run --web-dir 'Y:\var\www\html' >> '$WorkDir\pipeline.log' 2>&1"
$ActionPipeline = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -Command `"$PipelineCmd`"" `
    -WorkingDirectory $WorkDir
$TriggerPipeline = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:30AM"

Register-ScheduledTask -TaskName "ThomasCareer_01_ScoutAndAnalyst_v4" `
    -Action $ActionPipeline `
    -Trigger $TriggerPipeline `
    -Settings $TaskSettings `
    -Description "08:30 AM (UTC-4) 6-Track SCOUT + ANALYST v4.0.0 Pipeline -> Y:\var\www\html\index.html" -Force

$ActionBrief = New-ScheduledTaskAction -Execute "cmd.exe" `
    -Argument "/c start `"`" `"https://pi.tsimon.me`" && start `"`" `"$WorkDir\morning_brief.md`" && start `"`" `"$WorkDir\proposals_ready.md`"" `
    -WorkingDirectory $WorkDir
$TriggerBrief = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:45AM"

Register-ScheduledTask -TaskName "ThomasCareer_02_MorningBriefOpen_v4" `
    -Action $ActionBrief `
    -Trigger $TriggerBrief `
    -Settings $TaskSettings `
    -Description "08:45 AM (UTC-4) Opens Live Career Portal (https://pi.tsimon.me), morning_brief.md, and proposals_ready.md" -Force

Write-Host "[OK] Registered Windows 11 Scheduled Tasks (v4.0.0) in $WorkDir" -ForegroundColor Green
