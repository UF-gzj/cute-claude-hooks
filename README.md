# 🌸 Cute Claude Hooks

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-orange.svg)](https://claude.ai/code)

让 Claude Code 拥有完整的中文体验！

## ✨ 特性

- 🎨 **粉色中文提示** - 工具操作一目了然
- 🌸 **界面汉化** - 配置面板、命令说明、快捷键提示全中文
- 🖥️ **跨平台** - Windows/macOS/Linux 通用
- 📦 **轻量级** - 无依赖，- 🔧 **易自定义** - 完整的自定义指南
- 🇨🇳 **国内镜像** - 支持 Gitee 加速安装

## 📦 安装

### 方式一：交互式安装（推荐）

运行后选择安装模式：

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.sh | bash
```

**安装选项：**
```
[1] 仅安装工具提示 (推荐新手)
[2] 仅安装界面汉化
[3] 全部安装 (完整中文体验) ← 推荐
[4] 卸载
```

### 方式二：Gitee 镜像（国内用户）

**Windows (PowerShell):**
```powershell
irm https://gitee.com/your-username/cute-claude-hooks/raw/main/install-gitee.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://gitee.com/your-username/cute-claude-hooks/raw/main/install-gitee.sh | bash
```

### 方式三：手动安装

1. 下载 `tool-tips-post.sh` 到 `~/.claude/hooks/`
2. 下载 `localize/` 目录下的所有文件到 `~/.claude/localize/`
3. 在 `~/.claude/settings.json` 中添加：
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

## 🎯 效果预览

### 己具提示
| 工具 | 揌示效果 |
|------|----------|
| Read | 🌸 小白提示：📖 读取文件: config.json 🌸 |
| Write | 🌸 小白提示：📝 写入文件: output.md 🌸 |
| Edit | 🌸 小白提示：✏️ 编辑文件: settings.json 🌸 |
| Bash | 🌸 小白提示：🖥️ 安装依赖包 🌸 |
| Glob | 🌸 小白提示：🔍 搜索文件: "*.md" 🌸 |
| Grep | 🌸 小白提示：🔎 搜索内容: "function" 🌸 |
| MCP | 🌸 小白提示：📚 文档: get-library-docs 🌸 |

### 界面汉化

| 原文 | 译文 |
|------|------|
| Auto-compact | 自动压缩 |
| Thinking mode | 深度思考模式 |
| Welcome back! | 欢迎回来! |
| Esc to cancel | Esc 取消 |
| /compact - Clear conversation... | 压缩对话上下文... |

## 📚 完整文档

查看 [SKILL.md](./SKILL.md) 获取：
- 🌸 界面汉化详细说明
- 🎨 颜色/Emoji 自定义
- 🔧 进阶自定义技巧
- 🆕 添加新功能
- 📖 实战经验和踩坑记录
- 💡 常见需求示例

## 🔧 快速自定义

### 己8具提示
编辑 `~/.claude/hooks/tool-tips-post.sh`：

```bash
# 修改颜色（最后一行）
printf '\033[38;5;206m...'  # 206=粉色，196=红色,46=绿色...

# 修改 Emoji（get_tip 函数中）
"Read") echo "📚 读取文件: ..." ;;  # 改成你喜欢的
```

### 汉化
编辑 `~/.claude/localize/keyword.conf` 添加新的翻译：

```bash
# 格式: 原文|译文
Your-english-text|你的中文翻译
```

## 📁 文件说明

| 文件 | 用途 |
|------|------|
| `tool-tips-post.sh` | 工具提示 Hook 脚本 |
| `install.ps1` | Windows 安装脚本 (GitHub) |
| `install.sh` | Linux/macOS 安装脚本 (GitHub) |
| `install-gitee.ps1` | Windows 安装脚本 (Gitee) |
| `install-gitee.sh` | Linux/macOS 安装脚本 (Gitee) |
| `localize/keyword.conf` | 界面汉化关键词配置 |
| `localize/localize.sh` | 界面汉化脚本 (Linux/macOS) |
| `localize/localize.ps1` | 界面汉化脚本 (Windows) |
| `localize/restore.sh` | 恢复英文脚本 (Linux/macOS) |
| `localize/restore.ps1` | 恢复英文脚本 (Windows) |
| `SKILL.md` | 完整自定义指南 |

## 🌸 推荐搭配

如果你想要更完整的中文体验，可以搭配使用：

- **mine-auto-cli** - 更多 Claude Code 辅助功能

## 🤝 贡献

欢迎提交 Issue 和 PR！特别是：
- 🌍 新的汉化词条
- 🔧 新的 MCP 服务支持
- 📝 文档改进
- 🐛 Bug 修复

## 📄 许可证

[MIT License](./LICENSE)
