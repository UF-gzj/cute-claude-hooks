# restore.ps1 - 恢复 Claude Code 英文界面 (Windows PowerShell)
# License: MIT

$ErrorActionPreference = "Stop"

# ========== 颜色函数 ==========
function Write-Pink { param($text) Write-Host $text -ForegroundColor Magenta }
function Write-Green { param($text) Write-Host $text -ForegroundColor Green }
function Write-Red { param($text) Write-Host $text -ForegroundColor Red }
function Write-Yellow { param($text) Write-Host $text -ForegroundColor Yellow }

# ========== 获取 Claude Code CLI 路径 ==========
function Get-CliPath {
    $pkgname = "@anthropic-ai/claude-code"
    $npmRoot = npm root -g 2>$null

    if (-not $npmRoot) {
        Write-Red "❌ 无法获取 npm 全局目录"
        exit 1
    }

    return @{
        Path   = Join-Path $npmRoot "$pkgname\cli.js"
        Backup = Join-Path $npmRoot "$pkgname\cli.bak.js"
    }
}

# ========== 主函数 ==========
Write-Pink "🌸 Claude Code 恢复英文界面"
Write-Host "================================"

$paths = Get-CliPath
$cliPath = $paths.Path
$cliBak = $paths.Backup

if (-not (Test-Path $cliBak)) {
    Write-Yellow "ℹ️  未找到备份文件，可能未进行过汉化"
    exit 0
}

Copy-Item $cliBak $cliPath -Force
Write-Green "✅ 已恢复英文界面"
Write-Yellow "ℹ️  重启 Claude Code 即可生效"
