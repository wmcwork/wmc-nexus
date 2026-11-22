#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$BuildOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$webDirectory = Join-Path $repoRoot "web"
$webOutput = Join-Path $webDirectory "out"
$webuiDirectory = Join-Path $repoRoot "server\webui"
$webuiDist = Join-Path $webuiDirectory "dist"
$binaryPath = Join-Path $repoRoot "artex.exe"

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$Description
    )

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        & $Path @Arguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "$Description failed with exit code $exitCode."
    }
}

$goCommand = Get-Command go.exe -ErrorAction SilentlyContinue
if (-not $goCommand) {
    throw "Go was not found. Install Go 1.26.10 or newer and reopen PowerShell."
}

$previousErrorActionPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = "Continue"
    $goVersionOutput = (& $goCommand.Source version 2>&1 | Out-String).Trim()
    $goVersionExitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($goVersionExitCode -ne 0) {
    throw "Unable to determine the installed Go version."
}
$goVersionMatch = [regex]::Match($goVersionOutput, "go(?<version>\d+\.\d+(?:\.\d+)?)")
if (-not $goVersionMatch.Success -or [version]$goVersionMatch.Groups["version"].Value -lt [version]"1.26.10") {
    throw "Go 1.26.10 or newer is required. Detected: $goVersionOutput"
}

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $nodeCommand -or -not $npmCommand) {
    throw "Node.js 22 or newer and npm are required. Install Node.js, then reopen PowerShell."
}

$previousErrorActionPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = "Continue"
    $nodeVersionOutput = (& $nodeCommand.Source --version 2>&1 | Out-String).Trim()
    $nodeVersionExitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($nodeVersionExitCode -ne 0) {
    throw "Unable to determine the installed Node.js version."
}
$nodeVersionMatch = [regex]::Match($nodeVersionOutput, "v?(?<version>\d+\.\d+(?:\.\d+)?)")
if (-not $nodeVersionMatch.Success -or [version]$nodeVersionMatch.Groups["version"].Value -lt [version]"22.0") {
    throw "Node.js 22 or newer is required. Detected: $nodeVersionOutput"
}

Write-Host "[WMC NEXUS] Installing frontend dependencies and building the static UI..."
$previousLocation = Get-Location
try {
    Set-Location $webDirectory
    Invoke-NativeCommand -Path $npmCommand.Source -Arguments @("ci") -Description "npm ci"
    $previousNextExport = $env:NEXT_EXPORT
    try {
        $env:NEXT_EXPORT = "1"
        Invoke-NativeCommand -Path $npmCommand.Source -Arguments @("run", "build") -Description "Frontend build"
    }
    finally {
        if ($null -eq $previousNextExport) {
            Remove-Item Env:\NEXT_EXPORT -ErrorAction SilentlyContinue
        }
        else {
            $env:NEXT_EXPORT = $previousNextExport
        }
    }
}
finally {
    Set-Location $previousLocation
}

$indexHtml = Join-Path $webOutput "index.html"
if (-not (Test-Path -LiteralPath $indexHtml -PathType Leaf)) {
    throw "The static frontend build did not produce web\out\index.html."
}

New-Item -ItemType Directory -Path $webuiDirectory -Force | Out-Null
if (Test-Path -LiteralPath $webuiDist) {
    $resolvedDist = (Resolve-Path -LiteralPath $webuiDist).Path
    $expectedDist = [System.IO.Path]::GetFullPath($webuiDist)
    if ($resolvedDist -ne $expectedDist) {
        throw "Refusing to replace unexpected embedded UI path: $resolvedDist"
    }
    Remove-Item -LiteralPath $resolvedDist -Recurse -Force
}
New-Item -ItemType Directory -Path $webuiDist -Force | Out-Null
Copy-Item -Path (Join-Path $webOutput "*") -Destination $webuiDist -Recurse -Force

Write-Host "[WMC NEXUS] Building the Windows executable..."
$previousCgo = $env:CGO_ENABLED
try {
    $env:CGO_ENABLED = "0"
    Push-Location $repoRoot
    try {
        Invoke-NativeCommand -Path $goCommand.Source -Arguments @("build", "-tags", "embedui", "-trimpath", "-o", $binaryPath, "./cmd/artex") -Description "Go build"
    }
    finally {
        Pop-Location
    }
}
finally {
    if ($null -eq $previousCgo) {
        Remove-Item Env:\CGO_ENABLED -ErrorAction SilentlyContinue
    }
    else {
        $env:CGO_ENABLED = $previousCgo
    }
}

Write-Host "[WMC NEXUS] Build complete: $binaryPath"
if ($BuildOnly) {
    return
}

$previousDsn = $env:ARTEX_PG_DSN
$secureDsn = $null
$bstr = [IntPtr]::Zero
try {
    if ([string]::IsNullOrWhiteSpace($previousDsn)) {
        $secureDsn = Read-Host "Local PostgreSQL DSN (input is hidden)" -AsSecureString
        if ($secureDsn.Length -eq 0) {
            throw "A PostgreSQL DSN is required. No credentials were saved."
        }
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDsn)
        $env:ARTEX_PG_DSN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }

    Write-Host "[WMC NEXUS] Starting on http://127.0.0.1:8787. Press Ctrl+C to stop."
    Push-Location $repoRoot
    try {
        Invoke-NativeCommand -Path (Join-Path $repoRoot "start.bat") -Arguments @() -Description "Windows supervisor"
    }
    finally {
        Pop-Location
    }
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    if ($null -ne $secureDsn) {
        $secureDsn.Dispose()
    }
    if ($null -eq $previousDsn) {
        Remove-Item Env:\ARTEX_PG_DSN -ErrorAction SilentlyContinue
    }
    else {
        $env:ARTEX_PG_DSN = $previousDsn
    }
}
