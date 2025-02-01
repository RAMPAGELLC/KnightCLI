@echo off
setlocal enabledelayedexpansion

set basedir=%~dp0
set dirpath=%basedir%

if exist "%basedir%\node.exe" (
  set "PATH=%basedir%;%PATH%"
  "%basedir%\node.exe" "%basedir%\dist\index.js" %*
) else (
  node "%basedir%\dist\index.js" %*
)

endlocal
exit /b %errorlevel%