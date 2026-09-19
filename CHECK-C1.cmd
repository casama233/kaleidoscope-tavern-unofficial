@echo off
cd /d "%~dp0"
python tools\validate_runtime.py
if errorlevel 1 exit /b 1
python tools\test_c1.py
if errorlevel 1 exit /b 1
echo Static and mock tests passed. Minecraft testing is still required.
