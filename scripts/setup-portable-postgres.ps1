<#
.SYNOPSIS
Downloads and runs a portable PostgreSQL for WMC NEXUS without installing anything.

.DESCRIPTION
Places PostgreSQL under -Root (default D:\pgsql), initializes a data directory,
starts it on -Port, creates the "wmc" database, and prints the DSN.
Re-running is safe: existing binaries, data and database are reused.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\setup-portable-postgres.ps1 -Password "<your-password>"
#>
param(
    [string]$Root = "D:\pgsql",
    [Parameter(Mandatory = $true)][string]$Password,
    [int]$Port = 5432
)

$ErrorActionPreference = "Stop"
$bin = Join-Path $Root "bin"
$data = Join-Path $Root "data"
$url = "https://github.com/theseus-rs/postgresql-binaries/releases/download/18.7.0/postgresql-18.7.0-x86_64-pc-windows-msvc.tar.gz"
$archive = Join-Path $env:TEMP "postgresql-portable.tar.gz"

if (-not (Test-Path (Join-Path $bin "initdb.exe"))) {
    Write-Host "[pg] Downloading portable PostgreSQL 18.7.0..."
    Invoke-WebRequest -Uri $url -OutFile $archive
    New-Item -ItemType Directory -Force -Path $Root | Out-Null
    Write-Host "[pg] Extracting to $Root..."
    tar -xzf $archive -C $Root --strip-components=1
    Remove-Item -LiteralPath $archive -Force
}

if (-not (Test-Path (Join-Path $data "PG_VERSION"))) {
    Write-Host "[pg] Initializing data directory $data..."
    $pwFile = Join-Path $env:TEMP "wmc-pg-password.txt"
    Set-Content -Path $pwFile -Value $Password -Encoding ascii -NoNewline
    try {
        & (Join-Path $bin "initdb.exe") -D $data -U postgres -A scram-sha-256 --pwfile=$pwFile --encoding=UTF8 --locale=C
        if ($LASTEXITCODE -ne 0) { throw "initdb failed with exit code $LASTEXITCODE" }
    }
    finally {
        Remove-Item -LiteralPath $pwFile -Force -ErrorAction SilentlyContinue
    }
}

& (Join-Path $bin "pg_ctl.exe") -D $data status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[pg] Starting PostgreSQL on port $Port..."
    & (Join-Path $bin "pg_ctl.exe") -D $data -l (Join-Path $Root "pg.log") -o "-p $Port" start
    if ($LASTEXITCODE -ne 0) { throw "pg_ctl start failed; see $(Join-Path $Root 'pg.log')" }
    Start-Sleep -Seconds 3
}

$env:PGPASSWORD = $Password
$probe = & (Join-Path $bin "psql.exe") -U postgres -h 127.0.0.1 -p $Port -tAc "SELECT 1 FROM pg_database WHERE datname='wmc'" 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "psql failed with exit code $LASTEXITCODE - $probe"
}
$exists = ("$probe").Trim()
if ($exists -ne "1") {
    Write-Host "[pg] Creating database wmc..."
    & (Join-Path $bin "createdb.exe") -U postgres -h 127.0.0.1 -p $Port wmc
    if ($LASTEXITCODE -ne 0) { throw "createdb failed with exit code $LASTEXITCODE" }
}

Write-Host ""
Write-Host "[pg] Ready. DSN:"
Write-Host "postgres://postgres:$Password@127.0.0.1:$Port/wmc?sslmode=disable"
Write-Host ""
Write-Host "Stop with: & '$bin\pg_ctl.exe' -D '$data' stop"
