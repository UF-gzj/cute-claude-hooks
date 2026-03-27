# cute-claude-hooks 安装脚本 (Windows PowerShell)
# 使用方法: irm https://your-domain/install.ps1 | iex

$HooksDir = "$env:USERPROFILE\.claude\hooks"
$SettingsFile = "$env:USERPROFILE\.claude\settings.json"

# 创建 hooks 目录
if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir -Force | Out-Null
    Write-Host "✅ 创建目录: $HooksDir" -ForegroundColor Green
}

# 下载 hook 脚本
$HookScript = @'
#!/bin/bash
# tool-tips-post.sh - 工具执行后粉色中文提示
# 使用 stderr + exit 2 显示输出

input=$(cat)

# 提取字段
tool_name=$(echo "$input" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1 | sed 's/\\\\/\\/g')
pattern=$(echo "$input" | sed -n 's/.*"pattern"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
bash_desc=$(echo "$input" | sed -n 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
bash_cmd=$(echo "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# 路径简化
short_path() {
    echo "$1" | sed 's/.*[\\/]//' | head -c 50
}

# 生成提示
get_tip() {
    case "$1" in
        "Read")
            [ -n "$file_path" ] && echo "📖 读取文件: $(short_path "$file_path")" || echo "📖 读取完成"
            ;;
        "Write")
            [ -n "$file_path" ] && echo "📝 写入文件: $(short_path "$file_path")" || echo "📝 写入完成"
            ;;
        "Edit"|"MultiEdit")
            [ -n "$file_path" ] && echo "✏️ 编辑文件: $(short_path "$file_path")" || echo "✏️ 编辑完成"
            ;;
        "Bash")
            if [ -n "$bash_desc" ]; then
                echo "🖥️ $bash_desc"
            elif [ -n "$bash_cmd" ]; then
                local c=$(echo "$bash_cmd" | head -c 25)
                [ ${#bash_cmd} -gt 25 ] && c="${c}..."
                echo "🖥️ 执行: $c"
            else
                echo "🖥️ 命令完成"
            fi
            ;;
        "Glob")
            [ -n "$pattern" ] && echo "🔍 搜索文件: \"$pattern\"" || echo "🔍 搜索完成"
            ;;
        "Grep")
            [ -n "$pattern" ] && echo "🔎 搜索内容: \"$pattern\"" || echo "🔎 搜索完成"
            ;;
        "Agent")
            echo "🤖 代理完成"
            ;;
        "Skill")
            echo "⚡ 技能完成"
            ;;
        "Task"|"TaskCreate"|"TaskUpdate"|"TaskGet"|"TaskList")
            echo "📋 任务完成"
            ;;
        "TodoWrite")
            echo "📋 待办更新"
            ;;
        *)
            if [[ "$1" == mcp__* ]]; then
                local srv=$(echo "$1" | sed 's/mcp__\([^_]*\)__.*/\1/')
                local tool=$(echo "$1" | sed 's/mcp__[^_]*__//')
                case "$srv" in
                    "context7") echo "📚 文档: $tool" ;;
                    "exa") echo "🔍 Exa: $tool" ;;
                    "basic-memory") echo "🧠 记忆: $tool" ;;
                    "Playwright") echo "🎭 浏览器: $tool" ;;
                    "lark-mcp") echo "📱 飞书: $tool" ;;
                    "web_reader") echo "📖 网页: $tool" ;;
                    *) echo "🔌 $srv: $tool" ;;
                esac
            else
                echo "✅ $1 完成"
            fi
            ;;
    esac
}

# 主逻辑
if [ -n "$tool_name" ]; then
    tip=$(get_tip "$tool_name")
    printf '\033[38;5;206m🌸 小白提示：%s 🌸\033[0m\n' "$tip" >&2
fi

exit 2
'@

# 保存脚本
$HookScript | Out-File -FilePath "$HooksDir\tool-tips-post.sh" -Encoding utf8
Write-Host "✅ 安装 Hook 脚本: $HooksDir\tool-tips-post.sh" -ForegroundColor Green

# 更新 settings.json
if (Test-Path $SettingsFile) {
    $settings = Get-Content $SettingsFile | ConvertFrom-Json

    # 添加 PostToolUse hook
    $hookConfig = @{
        matcher = "Bash|Read|Write|Edit|Glob|Grep|mcp__*"
        hooks = @(
            @{
                type = "command"
                command = "bash $HooksDir\tool-tips-post.sh"
            }
        )
    }

    if (-not $settings.hooks) {
        $settings | Add-Member -MemberType NoteProperty -Name "hooks" -Value @{} -Force
    }
    if (-not $settings.hooks.PostToolUse) {
        $settings.hooks | Add-Member -MemberType NoteProperty -Name "PostToolUse" -Value @() -Force
    }

    # 检查是否已存在
    $exists = $settings.hooks.PostToolUse | Where-Object { $_.matcher -eq $hookConfig.matcher }
    if (-not $exists) {
        $settings.hooks.PostToolUse += $hookConfig
        $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding utf8
        Write-Host "✅ 更新配置: $SettingsFile" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Hook 已存在，跳过配置更新" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ 未找到 settings.json，请手动配置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌸 安装完成！重启 Claude Code 即可生效" -ForegroundColor Magenta
