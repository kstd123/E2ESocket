#!/bin/bash

###############################################################################
# E2E Socket - CI/CD 流水线脚本
#
# 用法:
#   ./script/ci-cd.sh [环境] [操作]
#
# 环境选项:
#   production  - 生产环境
#   staging     - 预发布环境
#   development - 开发环境
#
# 操作选项:
#   build       - 只构建镜像
#   deploy      - 只部署
#   all         - 构建并部署 (默认)
#
# 示例:
#   ./script/ci-cd.sh production all
#   ./script/ci-cd.sh staging build
#   ./script/ci-cd.sh development deploy
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 参数
ENVIRONMENT=${1:-production}
OPERATION=${2:-all}

# 项目配置
PROJECT_NAME="e2e-socket"
REGISTRY="registry.nb-sandbox.com"
IMAGE_NAME="${REGISTRY}/${PROJECT_NAME}"

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

# 函数：获取 Git 信息
get_git_info() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse --short HEAD)
        GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
        GIT_AUTHOR=$(git log -1 --pretty=format:'%an')
        GIT_MESSAGE=$(git log -1 --pretty=format:'%s')
    else
        print_warning "Git 信息不可用"
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
        GIT_TAG=""
        GIT_AUTHOR="unknown"
        GIT_MESSAGE="unknown"
    fi
}

# 函数：构建阶段
build_stage() {
    print_step "开始构建阶段..."

    # 获取 Git 信息
    get_git_info

    echo -e "${YELLOW}📋 构建信息:${NC}"
    echo -e "   分支: $GIT_BRANCH"
    echo -e "   提交: $GIT_COMMIT"
    echo -e "   作者: $GIT_AUTHOR"
    echo -e "   消息: $GIT_MESSAGE"
    echo ""

    # 执行构建脚本
    if [ -f "script/build.sh" ]; then
        print_step "执行构建脚本..."
        bash script/build.sh "$ENVIRONMENT"
    else
        print_error "构建脚本不存在: script/build.sh"
        exit 1
    fi

    print_success "构建阶段完成"
}

# 函数：部署阶段
deploy_stage() {
    print_step "开始部署阶段..."

    # 执行部署脚本
    if [ -f "script/deploy.sh" ]; then
        print_step "执行部署脚本..."
        bash script/deploy.sh "$ENVIRONMENT"
    else
        print_error "部署脚本不存在: script/deploy.sh"
        exit 1
    fi

    print_success "部署阶段完成"
}

# 函数：测试阶段
test_stage() {
    print_step "开始测试阶段..."

    # 运行基础测试
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        print_step "运行单元测试..."
        npm test
        print_success "单元测试通过"
    else
        print_warning "跳过单元测试（未配置）"
    fi

    # 运行集成测试（如果有的话）
    if [ -f "script/test-integration.sh" ]; then
        print_step "运行集成测试..."
        bash script/test-integration.sh "$ENVIRONMENT"
        print_success "集成测试通过"
    else
        print_warning "跳过集成测试（无测试脚本）"
    fi

    print_success "测试阶段完成"
}

# 函数：通知阶段
notification_stage() {
    print_step "发送通知..."

    # 这里可以集成 Slack、DingTalk、邮件等通知
    # 示例：发送 Slack 通知

    local status="✅ 成功"
    local color="good"

    if [ $? -ne 0 ]; then
        status="❌ 失败"
        color="danger"
    fi

    local message="E2E Socket 部署${status}
环境: ${ENVIRONMENT}
分支: ${GIT_BRANCH}
提交: ${GIT_COMMIT}
作者: ${GIT_AUTHOR}
时间: $(date)"

    # 如果有 Slack webhook，可以取消注释下面的代码
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"${message}\", \"color\":\"${color}\"}" \
    #     YOUR_SLACK_WEBHOOK_URL

    print_success "通知发送完成"
}

# 函数：清理阶段
cleanup_stage() {
    print_step "清理临时文件..."

    # 清理 Docker 构建缓存
    docker system prune -f

    # 清理旧的镜像（保留最近5个）
    # docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | tail -n +2 | head -n -5 | awk '{print $3}' | xargs -r docker rmi

    print_success "清理完成"
}

# 函数：显示流水线信息
show_pipeline_info() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  CI/CD 流水线执行完成! 🎉                                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 执行摘要:${NC}"
    echo -e "   环境: $ENVIRONMENT"
    echo -e "   操作: $OPERATION"
    echo -e "   分支: $GIT_BRANCH"
    echo -e "   提交: $GIT_COMMIT"
    echo -e "   时间: $(date)"
    echo ""

    if [ "$OPERATION" = "all" ] || [ "$OPERATION" = "deploy" ]; then
        echo -e "${YELLOW}🔗 访问地址:${NC}"
        case $ENVIRONMENT in
            production)
                echo -e "   网站: https://biblevod.com"
                echo -e "   WebSocket: wss://biblevod.com/ws/"
                ;;
            staging)
                echo -e "   网站: https://e2e-socket-stag.nb-sandbox.com"
                echo -e "   WebSocket: wss://e2e-socket-stag.nb-sandbox.com/ws/"
                ;;
        esac
        echo ""
    fi
}

# 函数：错误处理
error_handler() {
    local exit_code=$?
    print_error "流水线执行失败 (退出码: $exit_code)"

    # 发送失败通知
    notification_stage

    # 显示故障排除信息
    echo ""
    echo -e "${RED}🔧 故障排除:${NC}"
    echo -e "   1. 检查 Docker 服务: docker info"
    echo -e "   2. 检查 Kubernetes: kubectl cluster-info"
    echo -e "   3. 查看详细日志: kubectl logs -n ${PROJECT_NAME}-${ENVIRONMENT} -l app.kubernetes.io/name=${PROJECT_NAME}"
    echo -e "   4. 检查镜像: docker images | grep ${PROJECT_NAME}"

    exit $exit_code
}

# 设置错误处理
trap error_handler ERR

# 主流程
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  E2E Socket - CI/CD 流水线                                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🌍 环境: ${ENVIRONMENT}${NC}"
    echo -e "${GREEN}⚙️  操作: ${OPERATION}${NC}"
    echo ""

    case $OPERATION in
        build)
            build_stage
            ;;
        deploy)
            deploy_stage
            ;;
        test)
            test_stage
            ;;
        all)
            build_stage
            test_stage
            deploy_stage
            ;;
        *)
            print_error "无效的操作: $OPERATION"
            echo "可用操作: build, deploy, test, all"
            exit 1
            ;;
    esac

    cleanup_stage
    notification_stage
    show_pipeline_info
}

# 参数验证
if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "development" ]; then
    print_error "无效的环境: $ENVIRONMENT"
    echo "可用环境: production, staging, development"
    exit 1
fi

# 执行主流程
main

