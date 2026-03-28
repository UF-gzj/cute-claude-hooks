# localize.ps1 - Claude Code 界面汉化脚本 (Windows PowerShell)
# 来源: 基于 mine-auto-cli (https://github.com/biaov/mine-auto-cli) 改进
# License: MIT

param(
    [switch]$Restore
)

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

    $cliPath = Join-Path $npmRoot "$pkgname\cli.js"
    $cliBak = Join-Path $npmRoot "$pkgname\cli.bak.js"

    if (-not (Test-Path $cliPath)) {
        Write-Red "❌ 未找到 Claude Code CLI，请先安装: npm install -g @anthropic-ai/claude-code"
        exit 1
    }

    return @{ Path = $cliPath; Backup = $cliBak }
}

# ========== 创建备份 ==========
function New-Backup {
    param($cliPath, $cliBak)

    if (-not (Test-Path $cliBak)) {
        Copy-Item $cliPath $cliBak
        Write-Green "✅ 已创建备份: cli.bak.js"
    } else {
        Write-Yellow "ℹ️  备份已存在，跳过创建"
    }
}

# ========== 执行汉化 ==========
function Invoke-Localize {
    param($cliPath, $keywordFile)

    $count = 0
    $content = Get-Content $cliPath -Raw -Encoding UTF8

    Write-Pink "🌸 开始汉化 Claude Code..."
    Write-Host ""

    # 读取关键词配置
    $keywords = Get-Content $keywordFile -Encoding UTF8 | Where-Object {
        $_ -and -not $_.StartsWith("#") -and $_.Contains("|")
    }

    foreach ($line in $keywords) {
        $parts = $line.Split("|")
        if ($parts.Length -lt 2) { continue }

        $keyword = $parts[0].Trim()
        $translation = $parts[1].Trim()

        if ([string]::IsNullOrEmpty($keyword)) { continue }

        # 转义正则特殊字符
        $escaped = [regex]::Escape($keyword)

        # 替换双引号包裹的字符串
        $pattern = "`"$escaped`""
        $replacement = "`"$translation`""

        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $count++
            Write-Host "  " -NoNewline
            Write-Green "✓" -NoNewline
            Write-Host " $keyword " -NoNewline
            Write-Yellow "→" -NoNewline
            Write-Host " $translation"
        }
    }

    # 保存文件
    $content | Set-Content $cliPath -Encoding UTF8 -NoNewline

    Write-Host ""
    Write-Pink "🌸 汉化完成！共处理 $count 个词条"
    Write-Yellow "ℹ️  重启 Claude Code 即可生效"
}

# ========== 恢复英文 ==========
function Restore-English {
    param($cliPath, $cliBak)

    if (-not (Test-Path $cliBak)) {
        Write-Yellow "ℹ️  未找到备份文件，可能未进行过汉化"
        return
    }

    Copy-Item $cliBak $cliPath -Force
    Write-Green "✅ 已恢复英文界面"
    Write-Yellow "ℹ️  重启 Claude Code 即可生效"
}

# ========== 主函数 ==========
function Main {
    Write-Pink "╔════════════════════════════════════════╗"
    Write-Pink "║     🌸 Claude Code 界面汉化工具 🌸       ║"
    Write-Pink "╚════════════════════════════════════════╝"
    Write-Host ""

    # 使用 $PSScriptRoot 或当前目录
    $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
    $keywordFile = Join-Path $scriptDir "keyword.conf"

    # 检查关键词文件
    if (-not (Test-Path $keywordFile)) {
        Write-Red "❌ 未找到关键词配置文件: $keywordFile"
        exit 1
    }

    # 获取 CLI 路径
    $paths = Get-CliPath
    $cliPath = $paths.Path
    $cliBak = $paths.Backup

    Write-Green "📁 Claude Code 路径: $cliPath"
    Write-Host ""

    if ($Restore) {
        Restore-English $cliPath $cliBak
    } else {
        New-Backup $cliPath $cliBak

        # 从备份恢复后执行汉化
        if (Test-Path $cliBak) {
            Copy-Item $cliBak $cliPath -Force
        }

        Invoke-Localize $cliPath $keywordFile
    }
}

Main
