---
name: cute-claude-hooks (可爱提示钩子)
description: 为 Claude Code 添加粉色中文工具提示，让操作更直观可爱。安装后可自定义 emoji、颜色和提示文字。
---

# 🌸 Cute Claude Hooks - 自定义指南

让 Claude Code 的工具操作显示粉色中文提示！

## 🚀 快速安装

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.ps1 | iex
```

### macOS/Linux
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.sh | bash
```

---

## 🎨 自定义修改

安装后，编辑 `~/.claude/hooks/tool-tips-post.sh` 文件。

### 1. 修改颜色

找到最后一行的颜色代码：
```bash
# 当前：粉色 (206)
printf '\033[38;5;206m🌸 小白提示：%s 🌸\033[0m\n' "$tip" >&2

# 可选颜色：
# 196 = 红色    208 = 橙色    226 = 黄色
# 46  = 绿色    51  = 青色    33  = 蓝色
# 201 = 紫色    255 = 白色
```

### 2. 修改 Emoji

在 `get_tip()` 函数中修改：
```bash
"Read")
    echo "📚 读取文件: $(short_path "$file_path")"  # 把 📖 改成 📚
    ;;
```

**常用 Emoji 参考：**
| 工具 | 默认 | 备选 |
|------|------|------|
| Read | 📖 | 📚 📄 📑 |
| Write | 📝 | ✍️ 📋 💾 |
| Edit | ✏️ | 🔧 🛠️ ✂️ |
| Bash | 🖥️ | ⌨️ 💻 🐚 |
| Glob | 🔍 | 📁 🗂️ 🔎 |
| Grep | 🔎 | 🔍 📊 🔬 |

### 3. 修改提示文字

```bash
"Read")
    # 中文版（默认）
    echo "📖 读取文件: ..."
    # 英文版
    echo "📖 Reading: ..."
    # 日文版
    echo "📖 読み込み: ..."
    # 简洁版
    echo "📖 → ..."
    ;;
```

### 4. 修改前缀/后缀

```bash
# 默认（带樱花）
printf '\033[38;5;206m🌸 小白提示：%s 🌸\033[0m\n' "$tip" >&2

# 简洁版（无装饰）
printf '\033[38;5;206m%s\033[0m\n' "$tip" >&2

# 箭头版
printf '\033[38;5;206m→ %s\033[0m\n' "$tip" >&2

# 时间戳版
printf '\033[38;5;206m[%s] %s\033[0m\n' "$(date '+%H:%M:%S')" "$tip" >&2
```

### 5. 添加新工具支持

在 `case` 语句中添加：
```bash
"YourNewTool")
    echo "🆕 新工具完成"
    ;;
```

---

## 🔧 高级自定义

### 显示完整路径
```bash
# 找到 short_path 函数
short_path() {
    echo "$1" | sed 's/.*[\\/]//' | head -c 50  # 只显示文件名
}

# 改成显示相对路径
short_path() {
    echo "$1" | sed "s|$HOME|~|" | head -c 80
}
```

### 区分成功/失败状态
```bash
# 在脚本开头添加提取 tool_response
tool_response=$(echo "$input" | sed -n 's/.*"tool_response"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# 在主逻辑中判断
if [ -n "$tool_name" ]; then
    tip=$(get_tip "$tool_name")
    if echo "$tool_response" | grep -qi "error\|failed"; then
        printf '\033[38;5;196m❌ %s\033[0m\n' "$tip" >&2
    else
        printf '\033[38;5;206m🌸 %s 🌸\033[0m\n' "$tip" >&2
    fi
fi
```

---

## 📖 实战经验总结

### 我们尝试过的功能

#### ✅ 成功的实现

| 功能 | 实现方式 | 效果 |
|------|----------|------|
| 粉色中文提示 | `\033[38;5;206m` + stderr | 显示正常 |
| 路径简化 | `sed 's/.*[\\/]//'` | 只显示文件名 |
| Bash 描述 | 优先使用 description 字段 | 更友好的提示 |
| MCP 工具识别 | `mcp__服务名__工具名` 解析 | 显示具体服务 |

#### ❌ 尝试过但放弃的功能

| 功能 | 问题 | 原因 |
|------|------|------|
| **显示行数** | tool_response 是 JSON 字符串，难以准确统计 | 格式多变，解析复杂 |
| **显示文件数量** | Glob 返回的是纯文本列表，sed 提取不准确 | Windows/Linux 路径格式不同 |
| **stdout + exit 0** | 输出不显示 | 必须用 stderr + exit 2 |
| **从 tool_response 提取匹配数** | JSON 转义字符导致解析失败 | 过于复杂，不值得 |

### 为什么选择 stderr + exit 2？

我们测试了多种方案：

```
方案1: stdout + exit 0   → 不显示
方案2: stdout + exit 1   → 显示 "blocking error" 字样
方案3: stderr + exit 2   → ✅ 正常显示（虽然有 error 字样）
```

**结论**：虽然有 "blocking error" 字样，但这是目前唯一能让输出显示的方案。

---

## ⚠️ 踩坑记录

### 坑1：if 语句缺少 fi

```bash
# ❌ 错误写法
case "$1" in
    "Read")
        if [ -n "$file_path" ]; then
            echo "..."
        ;;    # 缺少 fi！
esac

# ✅ 正确写法
case "$1" in
    "Read")
        if [ -n "$file_path" ]; then
            echo "..."
        fi
        ;;
esac
```

**症状**：`syntax error near unexpected token ';;'`

### 坑2：Windows 路径中的反斜杠

```bash
# Windows 路径: C:\Users\古古\.claude\...
# 直接使用会导致 sed 匹配失败

# ✅ 解决方案：转义反斜杠
file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1 | sed 's/\\\\/\\/g')
```

### 坑3：local 变量作用域

```bash
# ❌ 错误：local 在 case 中可能有问题
get_tip() {
    case "$1" in
        "Bash")
            local c="..."  # 某些 shell 版本可能报错
            ;;
    esac
}

# ✅ 安全写法：在函数开头声明
get_tip() {
    local c
    case "$1" in
        "Bash")
            c="..."
            ;;
    esac
}
```

### 坑4：emoji 在不同终端显示不一致

| 终端 | 显示效果 |
|------|----------|
| Windows Terminal | ✅ 正常 |
| VSCode 终端 | ✅ 正常 |
| CMD | ⚠️ 可能显示方块 |
| Git Bash | ✅ 正常 |

**建议**：如果显示方块，尝试更换终端或使用 ASCII 字符。

### 坑5：修改后脚本不生效

```bash
# 检查清单：
# 1. 是否有执行权限？
chmod +x ~/.claude/hooks/tool-tips-post.sh

# 2. 是否重启了 Claude Code？
# 退出当前会话，重新运行 claude

# 3. 语法是否正确？
bash -n ~/.claude/hooks/tool-tips-post.sh
```

---

## 🐛 问题排查

### 问题：提示完全不显示

**检查步骤：**
1. 确认 `settings.json` 中 hooks 配置正确
2. 确认脚本路径正确（Windows 用正斜杠）
3. 运行 `bash -n script.sh` 检查语法

### 问题：显示乱码

**解决方案：**
```bash
# 确保终端 UTF-8 编码
export LANG=en_US.UTF-8
```

### 问题：部分工具没有提示

**检查 matcher 配置：**
```json
{
  "matcher": "Bash|Read|Write|Edit|Glob|Grep|mcp__*"
}
```

如果缺少某个工具，添加到 matcher 中。

---

## 📁 文件位置速查

| 文件 | Windows | macOS/Linux |
|------|---------|-------------|
| Hook 脚本 | `%USERPROFILE%\.claude\hooks\tool-tips-post.sh` | `~/.claude/hooks/tool-tips-post.sh` |
| 配置文件 | `%USERPROFILE%\.claude\settings.json` | `~/.claude/settings.json` |

---

## 🔄 恢复默认

如果改坏了，重新运行安装脚本即可：
```powershell
# Windows
irm https://raw.githubusercontent.com/your-username/cute-claude-hooks/main/install.ps1 | iex
```

---

## 📚 相关资源

- [GitHub 仓库](https://github.com/your-username/cute-claude-hooks)
- [问题反馈](https://github.com/your-username/cute-claude-hooks/issues)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)

---

**💡 最后建议**：保持简洁！我们尝试过添加行数统计、文件数量等复杂功能，但最终发现简单的提示反而更实用。过度复杂化会增加维护负担和出错概率。
