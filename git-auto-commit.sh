#!/bin/bash

# 自动提交到 GitHub 的脚本
# 用法: ./git-auto-commit.sh "你的提交信息"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否提供了提交信息
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供提交信息${NC}"
    echo "用法: ./git-auto-commit.sh \"你的提交信息\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo -e "${YELLOW}开始自动提交流程...${NC}\n"

# 1. 检查当前分支
echo -e "${YELLOW}[1/5] 检查当前分支...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo -e "当前分支: ${GREEN}${CURRENT_BRANCH}${NC}\n"

# 2. 查看当前状态
echo -e "${YELLOW}[2/5] 查看文件变更...${NC}"
git status --short
echo ""

# 3. 添加所有变更
echo -e "${YELLOW}[3/5] 添加所有变更文件...${NC}"
git add .
echo -e "${GREEN}✓ 文件已添加${NC}\n"

# 4. 提交变更
echo -e "${YELLOW}[4/5] 提交变更...${NC}"
git commit -m "$(cat <<EOF
${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)" --no-verify

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 提交成功${NC}\n"
else
    echo -e "${RED}✗ 提交失败${NC}"
    exit 1
fi

# 5. 推送到远程仓库
echo -e "${YELLOW}[5/5] 推送到远程仓库...${NC}"
git push

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ 自动提交完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "\n${RED}✗ 推送失败，请检查网络连接或权限${NC}"
    exit 1
fi
