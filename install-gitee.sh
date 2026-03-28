#!/bin/bash
# cute-claude-hooks 安装脚本 - Gitee 镜像 (国内用户)
# 使用方法: curl -fsSL https://gitee.com/你的用户名/cute-claude-hooks/raw/main/install-gitee.sh | bash
# 国内用户加速访问

set -e

# ========== 颜色定义 ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[38;5;206m'
CYAN='\033[0;36m'
NC='\033[0m'

# ========== 路径定义 ==========
HOOKS_DIR="$HOME/.claude/hooks"
LOCALIZE_DIR="$HOME/.claude/localize"
SETTINGS_FILE="$HOME/.claude/settings.json"
SCRIPT_URL="https://gitee.com/你的用户名/cute-claude-hooks/raw/main"

# ========== 显示横幅 ==========
show_banner() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║    🌸 Cute Claude Hooks 安装程序 (Gitee 镜像) 🌸    ║${NC}"
    echo -e "${MAGENTA}║        让 Claude Code 更可爱、更易用！              ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ========== 安装选择菜单 ==========
show_menu() {
    echo -e "${CYAN}请选择安装模式:${NC}"
    echo ""
    echo "  [1] 仅安装工具提示 (推荐新手)"
    echo "      - 粉色中文提示，显示工具操作状态"
    echo ""
    echo "  [2] 仅安装界面汉化"
    echo "      - 汉化 Claude Code 界面、命令说明"
    echo ""
    echo "  [3] 全部安装 (完整中文体验) ← 推荐"
    echo "      - 工具提示 + 界面汉化"
    echo ""
    echo "  [4] 卸载"
    echo "      - 移除已安装的功能"
    echo ""
}

# ========== 下载函数 ==========
download_file() {
    local url="$1"
    local output="$2"

    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$output"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$output"
    else
        echo -e "${RED}❌ 需要 curl 或 wget${NC}"
        return 1
    fi
}

# ========== 安装工具提示 (Hooks) ==========
install_hooks() {
    echo -e "${MAGENTA}"
    echo ""
    echo "📦 安装工具提示..."
    echo -e "${NC}"
    echo ""

    # 创建 hooks 目录
    if [ ! -d "$HOOKS_DIR" ]; then
        mkdir -p "$HOOKS_DIR"
        echo -e "${GREEN}✅ 创建目录: $HOOKS_DIR${NC}"
    fi

    # 下载脚本
    echo "📥 下载 Hook 脚本..."
    if download_file "$SCRIPT_URL/tool-tips-post.sh" "$HOOKS_DIR/tool-tips-post.sh"; then
        chmod +x "$HOOKS_DIR/tool-tips-post.sh"
        echo -e "${GREEN}✅ 下载完成: tool-tips-post.sh${NC}"
    else
        echo -e "${RED}❌ 下载失败${NC}"
        return 1
    fi

    # 更新 settings.json
    if [ -f "$SETTINGS_FILE" ]; then
        if grep -q "tool-tips-post.sh" "$SETTINGS_FILE"; then
            echo -e "${YELLOW}ℹ️  Hook 已配置，跳过${NC}"
        else
            if command -v python3 &> /dev/null; then
                python3 << 'EOF'
import json
import os

settings_file = os.path.expanduser("~/.claude/settings.json")
with open(settings_file, 'r', encoding='utf-8') as f:
    settings = json.load(f)

if 'hooks' not in settings:
    settings['hooks'] = {}
if 'PostToolUse' not in settings['hooks']:
    settings['hooks']['PostToolUse'] = []

exists = any(h.get('matcher') == 'Bash|Read|Write|Edit|Glob|Grep|mcp__*'
             for h in settings['hooks']['PostToolUse'])

if not exists:
    settings['hooks']['PostToolUse'].append({
        "matcher": "Bash|Read|Write|Edit|Glob|Grep|mcp__*",
        "hooks": [{
            "type": "command",
            "command": f"bash {os.path.expanduser('~/.claude/hooks/tool-tips-post.sh')}"
        }]
    })
    with open(settings_file, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)
    print("✅ 更新配置: settings.json")
else:
    print("ℹ️  配置已存在")
EOF
            else
                echo -e "${YELLOW}⚠️  请手动添加配置到 settings.json${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  未找到 settings.json，请手动配置${NC}"
    fi

    return 0
}

# ========== 安装界面汉化 (Localize) ==========
install_localize() {
    echo -e "${MAGENTA}"
    echo ""
    echo "📦 安装界面汉化..."
    echo -e "${NC}"
    echo ""

    # 创建 localize 目录
    if [ ! -d "$LOCALIZE_DIR" ]; then
        mkdir -p "$LOCALIZE_DIR"
        echo -e "${GREEN}✅ 创建目录: $LOCALIZE_DIR${NC}"
    fi

    # 下载文件
    local files=("keyword.conf" "localize.sh" "restore.sh")

    for file in "${files[@]}"; do
        echo "📥 下载 $file..."
        if download_file "$SCRIPT_URL/localize/$file" "$LOCALIZE_DIR/$file"; then
            chmod +x "$LOCALIZE_DIR/$file"
            echo -e "${GREEN}✅ 下载完成: $file${NC}"
        else
            echo -e "${RED}❌ 下载失败: $file${NC}"
            return 1
        fi
    done

    # 执行汉化
    echo ""
    echo -e "${MAGENTA}🌸 执行界面汉化...${NC}"
    bash "$LOCALIZE_DIR/localize.sh"

    return 0
}

# ========== 卸载 ==========
uninstall_all() {
    echo -e "${MAGENTA}"
    echo ""
    echo "🗑️ 卸载 Cute Claude Hooks..."
    echo -e "${NC}"
    echo ""

    # 移除 Hook 配置
    if [ -f "$SETTINGS_FILE" ] && command -v python3 &> /dev/null; then
        python3 << 'EOF'
import json
import os

settings_file = os.path.expanduser("~/.claude/settings.json")
with open(settings_file, 'r', encoding='utf-8') as f:
    settings = json.load(f)

if 'hooks' in settings and 'PostToolUse' in settings['hooks']:
    settings['hooks']['PostToolUse'] = [
        h for h in settings['hooks']['PostToolUse']
        if h.get('matcher') != 'Bash|Read|Write|Edit|Glob|Grep|mcp__*'
    ]
    with open(settings_file, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)
    print("✅ 已移除 Hook 配置")
EOF
    fi

    # 删除 Hook 脚本
    if [ -f "$HOOKS_DIR/tool-tips-post.sh" ]; then
        rm -f "$HOOKS_DIR/tool-tips-post.sh"
        echo -e "${GREEN}✅ 已删除: tool-tips-post.sh${NC}"
    fi

    # 恢复英文界面
    if [ -f "$LOCALIZE_DIR/restore.sh" ]; then
        echo "🔄 恢复英文界面..."
        bash "$LOCALIZE_DIR/restore.sh"
    fi

    # 删除 localize 目录
    if [ -d "$LOCALIZE_DIR" ]; then
        rm -rf "$LOCALIZE_DIR"
        echo -e "${GREEN}✅ 已删除: $LOCALIZE_DIR${NC}"
    fi

    echo -e "${GREEN}✅ 卸载完成${NC}"
}

# ========== 主函数 ==========
main() {
    show_banner

    # 检查是否有命令行参数
    local choice="${1:-}"

    if [ -z "$choice" ]; then
        show_menu
        read -p "请输入选择 [1-4]: " choice
    fi

    case "$choice" in
        1)
            install_hooks
            ;;
        2)
            install_localize
            ;;
        3)
            install_hooks
            install_localize
            ;;
        4)
            uninstall_all
            ;;
        *)
            echo -e "${YELLOW}已取消安装${NC}"
            ;;
    esac

    echo ""
    echo -e "${MAGENTA}🌸 感谢使用 Cute Claude Hooks！${NC}"
    echo -e "${YELLOW}📖 完整文档: https://gitee.com/你的用户名/cute-claude-hooks${NC}"
}

main "$@"
