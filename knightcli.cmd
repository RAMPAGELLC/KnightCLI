@echo off
setlocal

set basedir=%~dp0

if exist "%basedir%\node.exe" (
  "%basedir%\node.exe" "%basedir%\dist\index.js" %*
) else (
  node "%basedir%\dist\index.js" %*
)