#!/bin/bash
# restore.sh - 恢复 Claude Code 英文界面
# License: MIT

set -e

# ========== 颜色定义 ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[38;5;206m'
NC='\033[0m'

# ========== 获取 Claude Code CLI 路径 ==========
get_cli_path() {
    local pkgname="@anthropic-ai/claude-code"
    local npm_root
    npm_root=$(npm root -g 2>/dev/null)

    if [ -z "$npm_root" ]; then
        echo -e "${RED}❌ 无法获取 npm 全局目录${NC}"
        exit 1
    fi

    echo "$npm_root/$pkgname/cli.js|$npm_root/$pkgname/cli.bak.js"
}

# ========== 主函数 ==========
main() {
    echo -e "${MAGENTA}🌸 Claude Code 恢复英文界面${NC}"
    echo "================================"

    local paths
    paths=$(get_cli_path)
    local cli_path=$(echo "$paths" | cut -d'|' -f1)
    local cli_bak=$(echo "$paths" | cut -d'|' -f2)

    if [ ! -f "$cli_bak" ]; then
        echo -e "${YELLOW}ℹ️  未找到备份文件，可能未进行过汉化${NC}"
        exit 0
    fi

    cp "$cli_bak" "$cli_path"
    echo -e "${GREEN}✅ 已恢复英文界面${NC}"
    echo -e "${YELLOW}ℹ️  重启 Claude Code 即可生效${NC}"
}

main "$@"
