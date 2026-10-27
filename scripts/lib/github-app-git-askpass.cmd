@echo off
if "%HARDWARE_RADAR_GITHUB_ASKPASS_NODE%"=="" exit /b 1
"%HARDWARE_RADAR_GITHUB_ASKPASS_NODE%" "%~dp0github-app-git-askpass.mjs" "%~1"
