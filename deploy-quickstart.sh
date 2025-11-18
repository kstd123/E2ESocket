#!/bin/bash

###############################################################################
# E2E Socket - 快速部署脚本
#
# 这个脚本提供了最简单的部署方式，自动执行完整的 CI/CD 流水线
#
# 用法:
#   ./deploy-quickstart.sh [环境]
#
# 环境选项:
#   prod/production  - 生产环境 (默认)
#   stag/staging     - 预发布环境
#   dev/development  - 开发环境
#
# 示例:
#   ./deploy-quickstart.sh prod
#   ./deploy-quickstart.sh staging
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 参数处理
ENVIRONMENT=${1:-prod}

case $ENVIRONMENT in
    prod|production)
        ENV="production"
        ;;
    stag|staging)
        ENV="staging"
        ;;
    dev|development)
        ENV="development"
        ;;
    *)
        echo -e "${RED}错误: 无效的环境 '$ENVIRONMENT'${NC}"
        echo "可用环境: prod, staging, dev"
        exit 1
        ;;
esac

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  E2E Socket - 快速部署                                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌍 目标环境: ${ENV}${NC}"
echo ""

# 函数：检查依赖
check_dependencies() {
    echo -e "${BLUE}▶ 检查依赖...${NC}"

    local missing_deps=()

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    # 检查 kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi

    # 检查 Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ 缺少依赖: ${missing_deps[*]}${NC}"
        echo ""
        echo "安装命令:"
        echo "  Docker: https://docs.docker.com/get-docker/"
        echo "  kubectl: https://kubernetes.io/docs/tasks/tools/"
        echo "  Git: https://git-scm.com/downloads"
        exit 1
    fi

    echo -e "${GREEN}✅ 所有依赖已安装${NC}"
    echo ""
}

# 函数：检查权限
check_permissions() {
    echo -e "${BLUE}▶ 检查权限...${NC}"

    # 检查 Docker 权限
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 权限不足${NC}"
        echo "请运行: sudo usermod -aG docker $USER 然后重新登录"
        exit 1
    fi

    # 检查 Kubernetes 连接
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ Kubernetes 集群连接失败${NC}"
        echo "请检查 kubectl 配置"
        exit 1
    fi

    echo -e "${GREEN}✅ 权限检查通过${NC}"
    echo ""
}

# 函数：显示部署信息
show_deployment_info() {
    echo -e "${YELLOW}📋 部署信息:${NC}"
    echo -e "   环境: $ENV"
    echo -e "   时间: $(date)"
    echo -e "   用户: $(whoami)"
    echo -e "   目录: $(pwd)"
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "   分支: $(git rev-parse --abbrev-ref HEAD)"
        echo -e "   提交: $(git rev-parse --short HEAD)"
    fi
    echo ""
}

# 函数：执行部署
run_deployment() {
    echo -e "${BLUE}▶ 开始部署...${NC}"
    echo ""

    # 设置脚本权限
    chmod +x script/*.sh

    # 执行 CI/CD 流水线
    if [ -f "script/ci-cd.sh" ]; then
        ./script/ci-cd.sh "$ENV" all
    else
        echo -e "${RED}❌ 找不到 CI/CD 脚本${NC}"
        exit 1
    fi
}

# 函数：显示结果
show_result() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  部署完成! 🎉                                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${YELLOW}🔗 访问地址:${NC}"
    case $ENV in
        production)
            echo -e "   网站: https://biblevod.com"
            echo -e "   WebSocket: wss://biblevod.com/ws/"
            ;;
        staging)
            echo -e "   网站: https://e2e-socket-stag.nb-sandbox.com"
            echo -e "   WebSocket: wss://e2e-socket-stag.nb-sandbox.com/ws/"
            ;;
        development)
            echo -e "   本地测试: http://localhost:3000"
            ;;
    esac
    echo ""

    echo -e "${YELLOW}📊 管理命令:${NC}"
    echo -e "   查看状态: kubectl get pods -n e2e-socket-$ENV"
    echo -e "   查看日志: kubectl logs -n e2e-socket-$ENV -l app.kubernetes.io/name=e2e-socket"
    echo -e "   重启服务: kubectl rollout restart deployment/e2e-socket-$ENV -n e2e-socket-$ENV"
    echo ""

    echo -e "${YELLOW}🆘 如遇问题:${NC}"
    echo -e "   查看文档: KUBERNETES_DEPLOYMENT.md"
    echo -e "   故障排除: KUBERNETES_DEPLOYMENT.md#故障排除"
}

# 主流程
main() {
    check_dependencies
    check_permissions
    show_deployment_info
    run_deployment
    show_result
}

# 执行
main

