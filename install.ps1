# cute-claude-hooks 安装脚本 (Windows PowerShell)
# 使用方法: irm https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.ps1 | iex
# 支持参数: -Mode hooks/localize/all

param(
    [string]$Mode = "",  # hooks, localize, all
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ========== 颜色函数 ==========
function Write-Pink { param($text) Write-Host $text -ForegroundColor Magenta }
function Write-Green { param($text) Write-Host $text -ForegroundColor Green }
function Write-Red { param($text) Write-Host $text -ForegroundColor Red }
function Write-Yellow { param($text) Write-Host $text -ForegroundColor Yellow }
function Write-Cyan { param($text) Write-Host $text -ForegroundColor Cyan }

# ========== 路径定义 ==========
$HooksDir = "$env:USERPROFILE\.claude\hooks"
$LocalizeDir = "$env:USERPROFILE\.claude\localize"
$SettingsFile = "$env:USERPROFILE\.claude\settings.json"
$ScriptURL = "https://raw.githubusercontent.com/your-username/cute-claude-hooks/main"

# ========== 显示横幅 ==========
function Show-Banner {
    Write-Host ""
    Write-Pink "╔════════════════════════════════════════════════════╗"
    Write-Pink "║        🌸 Cute Claude Hooks 安装程序 🌸             ║"
    Write-Pink "║        让 Claude Code 更可爱、更易用！              ║"
    Write-Pink "╚════════════════════════════════════════════════════╝"
    Write-Host ""
}

# ========== 安装选择菜单 ==========
function Show-Menu {
    Write-Cyan "请选择安装模式:"
    Write-Host ""
    Write-Host "  [1] 仅安装工具提示 (推荐新手)"
    Write-Host "      - 粉色中文提示，显示工具操作状态"
    Write-Host ""
    Write-Host "  [2] 仅安装界面汉化"
    Write-Host "      - 汉化 Claude Code 界面、命令说明"
    Write-Host ""
    Write-Host "  [3] 全部安装 (完整中文体验) ← 推荐"
    Write-Host "      - 工具提示 + 界面汉化"
    Write-Host ""
    Write-Host "  [4] 卸载"
    Write-Host "      - 移除已安装的功能"
    Write-Host ""

    if ($Mode -ne "") {
        return $Mode
    }

    $choice = Read-Host "请输入选择 [1-4]"
    return $choice
}

# ========== 安装工具提示 (Hooks) ==========
function Install-Hooks {
    Write-Pink ""
    Write-Pink "📦 安装工具提示..."
    Write-Host ""

    # 创建 hooks 目录
    if (-not (Test-Path $HooksDir)) {
        New-Item -ItemType Directory -Path $HooksDir -Force | Out-Null
        Write-Green "✅ 创建目录: $HooksDir"
    }

    # 下载脚本
    Write-Host "📥 下载 Hook 脚本..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "$ScriptURL/tool-tips-post.sh" -OutFile "$HooksDir\tool-tips-post.sh" -UseBasicParsing
        Write-Green "✅ 下载完成: tool-tips-post.sh"
    } catch {
        Write-Red "❌ 下载失败: $_"
        return $false
    }

    # 更新 settings.json
    if (Test-Path $SettingsFile) {
        $settings = Get-Content $SettingsFile | ConvertFrom-Json

        if (-not $settings.hooks) {
            $settings | Add-Member -MemberType NoteProperty -Name "hooks" -Value @{} -Force
        }
        if (-not $settings.hooks.PostToolUse) {
            $settings.hooks | Add-Member -MemberType NoteProperty -Name "PostToolUse" -Value @() -Force
        }

        $exists = $settings.hooks.PostToolUse | Where-Object { $_.matcher -eq "Bash|Read|Write|Edit|Glob|Grep|mcp__*" }
        if (-not $exists) {
            $settings.hooks.PostToolUse += @{
                matcher = "Bash|Read|Write|Edit|Glob|Grep|mcp__*"
                hooks = @(
                    @{
                        type = "command"
                        command = "bash $HooksDir\tool-tips-post.sh"
                    }
                )
            }
            $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
            Write-Green "✅ 更新配置: settings.json"
        } else {
            Write-Yellow "ℹ️  Hook 已存在，跳过配置"
        }
    } else {
        Write-Yellow "⚠️  未找到 settings.json，请手动配置"
    }

    return $true
}

# ========== 安装界面汉化 (Localize) ==========
function Install-Localize {
    Write-Pink ""
    Write-Pink "📦 安装界面汉化..."
    Write-Host ""

    # 创建 localize 目录
    if (-not (Test-Path $LocalizeDir)) {
        New-Item -ItemType Directory -Path $LocalizeDir -Force | Out-Null
        Write-Green "✅ 创建目录: $LocalizeDir"
    }

    # 下载文件
    $files = @(
        @{ Name = "keyword.conf"; URL = "$ScriptURL/localize/keyword.conf" },
        @{ Name = "localize.ps1"; URL = "$ScriptURL/localize/localize.ps1" },
        @{ Name = "restore.ps1"; URL = "$ScriptURL/localize/restore.ps1" }
    )

    foreach ($file in $files) {
        Write-Host "📥 下载 $($file.Name)..."
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $file.URL -OutFile "$LocalizeDir\$($file.Name)" -UseBasicParsing
            Write-Green "✅ 下载完成: $($file.Name)"
        } catch {
            Write-Red "❌ 下载失败: $($file.Name)"
            return $false
        }
    }

    # 执行汉化
    Write-Host ""
    Write-Pink "🌸 执行界面汉化..."
    & "$LocalizeDir\localize.ps1"

    return $true
}

# ========== 卸载 ==========
function Uninstall-All {
    Write-Pink ""
    Write-Pink "🗑️ 卸载 Cute Claude Hooks..."
    Write-Host ""

    # 移除 Hook 配置
    if (Test-Path $SettingsFile) {
        $settings = Get-Content $SettingsFile | ConvertFrom-Json
        if ($settings.hooks -and $settings.hooks.PostToolUse) {
            $settings.hooks.PostToolUse = @($settings.hooks.PostToolUse | Where-Object {
                $_.matcher -ne "Bash|Read|Write|Edit|Glob|Grep|mcp__*"
            })
            $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
            Write-Green "✅ 已移除 Hook 配置"
        }
    }

    # 删除 Hook 脚本
    if (Test-Path "$HooksDir\tool-tips-post.sh") {
        Remove-Item "$HooksDir\tool-tips-post.sh" -Force
        Write-Green "✅ 已删除: tool-tips-post.sh"
    }

    # 恢复英文界面
    if (Test-Path "$LocalizeDir\restore.ps1") {
        Write-Host "🔄 恢复英文界面..."
        & "$LocalizeDir\restore.ps1"
    }

    # 删除 localize 目录
    if (Test-Path $LocalizeDir) {
        Remove-Item $LocalizeDir -Recurse -Force
        Write-Green "✅ 已删除: $LocalizeDir"
    }

    Write-Green "✅ 卸载完成"
}

# ========== 主函数 ==========
function Main {
    Show-Banner

    $choice = Show-Menu

    switch ($choice) {
        "1" {
            Install-Hooks
        }
        "2" {
            Install-Localize
        }
        "3" {
            Install-Hooks
            Install-Localize
        }
        "4" {
            Uninstall-All
        }
        default {
            Write-Yellow "已取消安装"
        }
    }

    Write-Host ""
    Write-Pink "🌸 感谢使用 Cute Claude Hooks！"
    Write-Yellow "📖 完整文档: https://github.com/your-username/cute-claude-hooks"
}

Main
