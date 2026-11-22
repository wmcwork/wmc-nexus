@echo off
setlocal
cd /d "%~dp0"

rem Portable PostgreSQL location and credentials.
set "PGROOT=D:\pgsql"
set "PGDATA=%PGROOT%\data"
set "PGPORT=5432"
set "PGPASSWORD=WmcNexus123"
set "ARTEX_PG_DSN=postgres://postgres:%PGPASSWORD%@127.0.0.1:%PGPORT%/wmc?sslmode=disable"

rem Start PostgreSQL only when it is not already running.
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
