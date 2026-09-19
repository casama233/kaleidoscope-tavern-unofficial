@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 tools\project.py check
) else (
  python tools\project.py check
)
set EXITCODE=%ERRORLEVEL%
echo.
echo This is a static asset check, NOT a Minecraft engine test.
echo Exit code: %EXITCODE%
pause
exit /b %EXITCODE%
