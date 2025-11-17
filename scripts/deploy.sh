#!/bin/bash

###############################################################################
# E2E WebSocket 服务器部署脚本
# 
# 用法:
#   ./scripts/deploy.sh [环境]
#   
# 环境选项:
#   production  - 生产环境 (默认)
#   development - 开发环境
#   
# 示例:
#   ./scripts/deploy.sh production
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境变量
ENVIRONMENT=${1:-production}
PROJECT_NAME="e2e-socket"
APP_DIR=$(pwd)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  E2E WebSocket Server - 部署脚本                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 项目目录: ${APP_DIR}${NC}"
echo -e "${GREEN}🌍 部署环境: ${ENVIRONMENT}${NC}"
echo ""

# 函数：打印步骤
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# 函数：打印成功
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 函数：打印警告
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 函数：打印错误
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查必要的命令
check_requirements() {
    print_step "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    print_success "PM2 $(pm2 --version)"
    
    echo ""
}

# 创建必要的目录
create_directories() {
    print_step "创建必要的目录..."
    
    mkdir -p logs
    mkdir -p examples
    
    print_success "目录创建完成"
    echo ""
}

# 安装依赖
install_dependencies() {
    print_step "安装项目依赖..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm ci --production
    else
        npm install
    fi
    
    print_success "依赖安装完成"
    echo ""
}

# 停止现有进程
stop_existing() {
    print_step "停止现有进程..."
    
    if pm2 describe $PROJECT_NAME &> /dev/null; then
        pm2 stop $PROJECT_NAME
        pm2 delete $PROJECT_NAME
        print_success "已停止现有进程"
    else
        print_warning "没有运行中的进程"
    fi
    
    echo ""
}

# 启动应用
start_application() {
    print_step "启动应用..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start ecosystem.config.js --env development
    fi
    
    print_success "应用启动成功"
    echo ""
}

# 保存 PM2 配置
save_pm2_config() {
    print_step "保存 PM2 配置..."
    
    pm2 save
    
    # 设置 PM2 开机自启（需要 root 权限）
    if [ "$(id -u)" = "0" ]; then
        pm2 startup
        print_success "PM2 开机自启已配置"
    else
        print_warning "需要 root 权限配置开机自启，请手动运行: sudo pm2 startup"
    fi
    
    echo ""
}

# 显示状态
show_status() {
    print_step "应用状态:"
    echo ""
    pm2 status
    echo ""
    pm2 logs $PROJECT_NAME --lines 20 --nostream
    echo ""
}

# 显示访问信息
show_access_info() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  部署完成！ 🎉                                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📍 访问地址:${NC}"
    echo -e "   Web客户端: http://localhost:3001"
    echo -e "   或访问:    http://localhost:3001/client/client.html"
    echo -e "   WebSocket: ws://localhost:8080"
    echo -e "   API文档:   http://localhost:3001/api/docs"
    echo ""
    echo -e "${YELLOW}📊 常用命令:${NC}"
    echo -e "   查看状态:   pm2 status"
    echo -e "   查看日志:   pm2 logs $PROJECT_NAME"
    echo -e "   重启服务:   pm2 restart $PROJECT_NAME"
    echo -e "   停止服务:   pm2 stop $PROJECT_NAME"
    echo -e "   监控面板:   pm2 monit"
    echo ""
}

# 主流程
main() {
    check_requirements
    create_directories
    install_dependencies
    stop_existing
    start_application
    save_pm2_config
    show_status
    show_access_info
}

# 执行主流程
main

