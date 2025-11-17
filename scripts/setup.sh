#!/bin/bash

# E2E WebSocket 服务器设置脚本
# 用于快速设置和启动服务器

set -e

echo "========================================"
echo "  E2E WebSocket 服务器设置向导  "
echo "========================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请访问 https://nodejs.org/ 下载安装 Node.js"
    exit 1
fi

# 显示 Node.js 版本
NODE_VERSION=$(node -v)
echo "✓ Node.js 版本: $NODE_VERSION"

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm 版本: $NPM_VERSION"
echo ""

# 步骤 1: 安装依赖
echo "步骤 1: 安装依赖..."
if [ -d "node_modules" ]; then
    echo "node_modules 已存在，跳过安装"
else
    npm install
    echo "✓ 依赖安装完成"
fi
echo ""

# 步骤 2: 创建环境配置文件
echo "步骤 2: 创建环境配置..."
if [ -f ".env" ]; then
    echo ".env 文件已存在，跳过创建"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ .env 文件已创建（从 .env.example 复制）"
        echo "⚠️  请根据需要修改 .env 文件中的配置"
    else
        echo "⚠️  .env.example 文件不存在，跳过"
    fi
fi
echo ""

# 步骤 3: 创建日志目录
echo "步骤 3: 创建日志目录..."
mkdir -p logs
echo "✓ 日志目录已创建"
echo ""

# 步骤 4: 询问是否立即启动服务器
echo "步骤 4: 启动服务器"
read -p "是否立即启动服务器？(y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "启动服务器..."
    echo "按 Ctrl+C 停止服务器"
    echo ""
    npm start
else
    echo ""
    echo "========================================"
    echo "  设置完成！  "
    echo "========================================"
    echo ""
    echo "后续操作："
    echo "  1. 启动服务器:"
    echo "     npm start"
    echo ""
    echo "  2. 开发模式（热重载）:"
    echo "     npm run dev"
    echo ""
    echo "  3. 测试连接:"
    echo "     node scripts/test-connection.js"
    echo ""
    echo "  4. 运行示例:"
    echo "     npm run test:client"
    echo "     npm run test:multi"
    echo "     npm run test:encrypted"
    echo ""
    echo "  5. 查看文档:"
    echo "     README.md - 完整文档"
    echo "     QUICKSTART.md - 快速开始"
    echo "     DEPLOYMENT.md - 部署指南"
    echo ""
fi

