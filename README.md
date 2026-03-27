# 🌸 Cute Claude Hooks

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/your-username/cute-claude-hooks)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-orange.svg)](https://claude.ai/code)

[![Bash](https://img.shields.io/badge/Platform-Bash-green.svg)](https://www.gnu.org/software/bash/)

让 Claude Code 工具操作更直观可爱的粉色中文提示！

## ✨ 特性
- 🎨 **粉色中文提示** - 操作一目了然
- 🖥️ **跨平台** - Windows/macOS/Linux 通用
- 📦 **轻量级** - 单文件，无依赖
- 🔧 **易配置** - 一键安装

## 📦 安装
### 方式一： PowerShell (推荐)
```powershell
irm https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.ps1 | iex
```

### 方式二: 手动安装
1. 复制脚本到 `~/.claude/hooks/tool-tips-post.sh`
2. 添加配置到 `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash|Read|Write|Edit|Glob|Grep|mcp__*",
        "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/tool-tips-post.sh" }]
      }
    ]
  }
}
```

## 🎯 支持的工具
| 工具 | 提示 |
|------|------|
| Read | 📖 读取文件: xxx.md |
| Write | 📝 写入文件: xxx.sh |
| Edit | ✏️ 编辑文件: xxx.md |
| Bash | 🖥️ 执行命令 |
| Glob | 🔍 搜索文件: "*.md" |
| Grep | 🔎 搜索内容: "关键词" |
| MCP | 📚/🔍/🧠/🎭/📱 根据服务显示 |

## 🔧 自定义
编辑脚本中的 `get_tip()` 函数来修改提示文字或 emoji。

## 📄 许可证
MIT License - 自由使用、修改和分发。
