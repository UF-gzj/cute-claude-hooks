# restore.ps1 - Restore Claude Code English Interface (Windows PowerShell)
# License: MIT

$ErrorActionPreference = "Stop"

# ========== Color Functions ==========
function Write-Pink { param($text) Write-Host $text -ForegroundColor Magenta }
function Write-Green { param($text) Write-Host $text -ForegroundColor Green }
function Write-Red { param($text) Write-Host $text -ForegroundColor Red }
function Write-Yellow { param($text) Write-Host $text -ForegroundColor Yellow }

# ========== Get Claude Code CLI Path ==========
function Get-CliPath {
    $pkgname = "@anthropic-ai/claude-code"
    $npmRoot = npm root -g 2>$null

    if (-not $npmRoot) {
        Write-Red "ERROR: Cannot get npm global directory"
        exit 1
    }

    return @{
        Path   = Join-Path $npmRoot "$pkgname\cli.js"
        Backup = Join-Path $npmRoot "$pkgname\cli.bak.js"
    }
}

# ========== Main Function ==========
Write-Pink "=============================================="
Write-Pink "  Claude Code - Restore English Interface"
Write-Pink "=============================================="
Write-Host ""

$paths = Get-CliPath
$cliPath = $paths.Path
$cliBak = $paths.Backup

if (-not (Test-Path $cliBak)) {
    Write-Yellow "INFO: Backup not found, may not have been localized"
    exit 0
}

Copy-Item $cliBak $cliPath -Force
Write-Green "OK: English interface restored"
Write-Yellow "INFO: Restart Claude Code to take effect"
