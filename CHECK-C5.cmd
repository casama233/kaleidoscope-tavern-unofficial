@echo off
setlocal
cd /d "%~dp0"
python tools\build_runtime.py
if errorlevel 1 exit /b 1
python tools\validate_runtime.py
if errorlevel 1 exit /b 1
python tools\test_c5.py
exit /b %errorlevel%
