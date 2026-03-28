#!/bin/bash
# localize.sh - Claude Code 界面汉化脚本
# 来源: 基于 mine-auto-cli (https://github.com/biaov/mine-auto-cli) 改进
# License: MIT

set -e

# ========== 颜色定义 ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[38;5;206m'
NC='\033[0m' # No Color

# ========== 路径定义 ==========
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYWORD_FILE="$SCRIPT_DIR/keyword.conf"

# ========== 获取 Claude Code CLI 路径 ==========
get_cli_path() {
    local pkgname="@anthropic-ai/claude-code"

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 未找到 npm，请先安装 Node.js${NC}"
        exit 1
    fi

    local npm_root
    npm_root=$(npm root -g 2>/dev/null)

    if [ -z "$npm_root" ]; then
        echo -e "${RED}❌ 无法获取 npm 全局目录${NC}"
        exit 1
    fi

    local cli_path="$npm_root/$pkgname/cli.js"
    local cli_bak="$npm_root/$pkgname/cli.bak.js"

    if [ ! -f "$cli_path" ]; then
        echo -e "${RED}❌ 未找到 Claude Code CLI，请先安装: npm install -g @anthropic-ai/claude-code${NC}"
        exit 1
    fi

    echo "$cli_path|$cli_bak"
}

# ========== 创建备份 ==========
create_backup() {
    local cli_path="$1"
    local cli_bak="$2"

    if [ ! -f "$cli_bak" ]; then
        cp "$cli_path" "$cli_bak"
        echo -e "${GREEN}✅ 已创建备份: cli.bak.js${NC}"
    else
        echo -e "${YELLOW}ℹ️  备份已存在，跳过创建${NC}"
    fi
}

# ========== 执行汉化 ==========
do_localize() {
    local cli_path="$1"
    local count=0
    local total=0

    # 统计总行数
    total=$(grep -c "^[^#]" "$KEYWORD_FILE" 2>/dev/null || echo "0")

    echo -e "${MAGENTA}🌸 开始汉化 Claude Code...${NC}"
    echo ""

    # 读取关键词配置文件
    while IFS='|' read -r keyword translation || [ -n "$keyword" ]; do
        # 跳过空行和注释
        [ -z "$keyword" ] && continue
        [[ "$keyword" =~ ^[[:space:]]*# ]] && continue

        # 去除首尾空格
        keyword=$(echo "$keyword" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        translation=$(echo "$translation" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        [ -z "$keyword" ] && continue

        # 转义特殊字符
        local escaped_key
        escaped_key=$(echo "$keyword" | sed 's/[\/&]/\\&/g' | sed 's/\n/\\n/g')

        # 执行替换（同时处理单引号和双引号包裹的字符串）
        if sed -i.bak "s/\"${escaped_key}\"/\"${translation}\"/g" "$cli_path" 2>/dev/null; then
            count=$((count + 1))
            echo -e "  ${GREEN}✓${NC} $keyword ${YELLOW}→${NC} $translation"
        fi

    done < "$KEYWORD_FILE"

    # 清理临时备份
    rm -f "${cli_path}.bak"

    echo ""
    echo -e "${MAGENTA}🌸 汉化完成！共处理 $count 个词条${NC}"
    echo -e "${YELLOW}ℹ️  重启 Claude Code 即可生效${NC}"
}

# ========== 主函数 ==========
main() {
    echo -e "${MAGENTA}╔══════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║     🌸 Claude Code 界面汉化工具 🌸       ║${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════╝${NC}"
    echo ""

    # 检查关键词文件
    if [ ! -f "$KEYWORD_FILE" ]; then
        echo -e "${RED}❌ 未找到关键词配置文件: $KEYWORD_FILE${NC}"
        exit 1
    fi

    # 获取 CLI 路径
    local paths
    paths=$(get_cli_path)
    local cli_path=$(echo "$paths" | cut -d'|' -f1)
    local cli_bak=$(echo "$paths" | cut -d'|' -f2)

    echo -e "${GREEN}📁 Claude Code 路径: $cli_path${NC}"
    echo ""

    # 创建备份
    create_backup "$cli_path" "$cli_bak"

    # 从备份恢复后执行汉化
    if [ -f "$cli_bak" ]; then
        cp "$cli_bak" "$cli_path"
    fi

    # 执行汉化
    do_localize "$cli_path"
}

main "$@"
