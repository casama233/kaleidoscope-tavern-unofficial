@echo off
python tools\build_runtime.py || exit /b 1
python tools\validate_runtime.py || exit /b 1
python tools\test_c7.py || exit /b 1
python tools\audit_rebuild.py || exit /b 1
pause
