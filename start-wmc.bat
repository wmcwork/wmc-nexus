@echo off
setlocal
cd /d "%~dp0"

rem Connection string lives in wmc.env (ignored by git), not in this script.
if exist "%~dp0wmc.env" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0wmc.env") do set "%%A=%%B"
)

if "%ARTEX_PG_DSN%"=="" (
  echo [wmc] ARTEX_PG_DSN is not set.
  echo [wmc] Create wmc.env next to this file with:
  echo [wmc]   ARTEX_PG_DSN=postgres://postgres:PASSWORD@127.0.0.1:5432/wmc?sslmode=disable
  pause
  exit /b 1
)

rem Portable PostgreSQL location.
set "PGROOT=D:\pgsql"
set "PGDATA=%PGROOT%\data"
set "PGPORT=5432"

"%PGROOT%\bin\pg_ctl.exe" -D "%PGDATA%" status >nul 2>&1
if errorlevel 1 (
  echo [wmc] Starting PostgreSQL...
  "%PGROOT%\bin\pg_ctl.exe" -D "%PGDATA%" -l "%PGROOT%\pg.log" -o "-p %PGPORT%" start
  timeout /t 3 /nobreak >nul
)

echo [wmc] Starting WMC NEXUS on http://127.0.0.1:8787
artex.exe
echo.
echo [wmc] Application stopped. Press any key to close.
pause >nul
