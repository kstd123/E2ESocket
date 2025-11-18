#!/bin/bash

###############################################################################
# E2E Socket - Kubernetes 部署脚本
#
# 用法:
#   ./script/deploy.sh [环境] [镜像标签]
#
# 环境选项:
#   production  - 生产环境 (默认)
#   staging     - 预发布环境
#   development - 开发环境
#
# 示例:
#   ./script/deploy.sh production v1.0.0
#   ./script/deploy.sh staging a28d66e
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认参数
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-}

# 项目配置
PROJECT_NAME="e2e-socket"
NAMESPACE="${PROJECT_NAME}-${ENVIRONMENT}"
HELM_CHART="./helm/e2e-socket"  # 假设 Helm chart 路径

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

# 函数：检查 kubectl
check_kubectl() {
    print_step "检查 Kubernetes 环境..."

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl 未安装"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        print_error "无法连接到 Kubernetes 集群"
        exit 1
    fi

    print_success "kubectl $(kubectl version --client --short)"
}

# 函数：检查 helm
check_helm() {
    print_step "检查 Helm 环境..."

    if ! command -v helm &> /dev/null; then
        print_warning "Helm 未安装，使用 kubectl 直接部署"
        USE_HELM=false
    else
        print_success "Helm $(helm version --short)"
        USE_HELM=true
    fi
}

# 函数：确定镜像标签
determine_image_tag() {
    if [ -n "$IMAGE_TAG" ]; then
        # 使用指定的标签
        FINAL_IMAGE_TAG="$IMAGE_TAG"
    else
        # 从 Git 获取标签
        if git rev-parse --git-dir > /dev/null 2>&1; then
            GIT_COMMIT=$(git rev-parse --short HEAD)
            case $ENVIRONMENT in
                production)
                    FINAL_IMAGE_TAG="$GIT_COMMIT"
                    ;;
                staging)
                    FINAL_IMAGE_TAG="stag-$GIT_COMMIT"
                    ;;
                development)
                    FINAL_IMAGE_TAG="dev-$GIT_COMMIT"
                    ;;
                *)
                    FINAL_IMAGE_TAG="$GIT_COMMIT"
                    ;;
            esac
        else
            print_warning "Git 信息不可用，使用 latest 标签"
            FINAL_IMAGE_TAG="latest"
        fi
    fi

    print_success "使用镜像标签: $FINAL_IMAGE_TAG"
}

# 函数：更新 values 文件
update_values_file() {
    print_step "更新 values 文件..."

    local values_file="script/yaml/values_${ENVIRONMENT}.yaml"

    if [ ! -f "$values_file" ]; then
        print_error "values 文件不存在: $values_file"
        exit 1
    fi

    # 备份原文件
    cp "$values_file" "${values_file}.backup"

    # 使用 sed 更新镜像标签
    # 注意：这里假设 values 文件中有类似这样的行：
    # image:
    #   tag: "current-tag"
    sed -i.bak "s/tag: .*/tag: \"$FINAL_IMAGE_TAG\"/" "$values_file"

    print_success "values 文件已更新: $values_file"
}

# 函数：创建命名空间
create_namespace() {
    print_step "创建命名空间..."

    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        print_success "命名空间已创建: $NAMESPACE"
    else
        print_success "命名空间已存在: $NAMESPACE"
    fi
}

# 函数：部署到 Kubernetes
deploy_to_k8s() {
    print_step "部署到 Kubernetes..."

    if [ "$USE_HELM" = true ] && [ -d "$HELM_CHART" ]; then
        # 使用 Helm 部署
        print_step "使用 Helm 部署..."

        helm upgrade --install "$PROJECT_NAME" "$HELM_CHART" \
            --namespace "$NAMESPACE" \
            --values "script/yaml/values_${ENVIRONMENT}.yaml" \
            --set image.tag="$FINAL_IMAGE_TAG" \
            --wait \
            --timeout 600s

    else
        # 使用 kubectl 直接部署
        print_step "使用 kubectl 部署..."

        # 这里需要有对应的 YAML 文件
        # 假设有一个统一的部署文件
        if [ -f "script/yaml/deployment-${ENVIRONMENT}.yaml" ]; then
            # 先更新镜像标签
            sed -i.bak "s|registry.nb-sandbox.com/e2e-socket:.*|registry.nb-sandbox.com/e2e-socket:$FINAL_IMAGE_TAG|g" "script/yaml/deployment-${ENVIRONMENT}.yaml"

            kubectl apply -f "script/yaml/deployment-${ENVIRONMENT}.yaml" -n "$NAMESPACE"
        else
            print_error "未找到部署文件，请使用 Helm 或创建 deployment-${ENVIRONMENT}.yaml"
            exit 1
        fi
    fi

    if [ $? -eq 0 ]; then
        print_success "部署成功"
    else
        print_error "部署失败"
        exit 1
    fi
}

# 函数：等待部署完成
wait_for_deployment() {
    print_step "等待部署完成..."

    local deployment_name="${PROJECT_NAME}-${ENVIRONMENT}"

    # 等待 deployment 就绪
    kubectl wait --for=condition=available --timeout=300s deployment/"$deployment_name" -n "$NAMESPACE"

    if [ $? -eq 0 ]; then
        print_success "部署已就绪"
    else
        print_error "部署未能就绪"
        exit 1
    fi
}

# 函数：验证部署
verify_deployment() {
    print_step "验证部署..."

    # 获取 pod 状态
    local pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=$PROJECT_NAME" --no-headers)

    if [ -z "$pods" ]; then
        print_error "未找到运行中的 pods"
        exit 1
    fi

    # 检查 pod 状态
    local unhealthy_pods=$(echo "$pods" | grep -v "Running\|Completed" | wc -l)

    if [ "$unhealthy_pods" -gt 0 ]; then
        print_warning "发现 $unhealthy_pods 个不健康的 pod"
        kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=$PROJECT_NAME"
    else
        print_success "所有 pods 运行正常"
    fi

    # 测试健康检查
    local service_url=""
    case $ENVIRONMENT in
        production)
            service_url="http://biblevod.com/api/health"
            ;;
        staging)
            service_url="http://e2e-socket-stag.nb-sandbox.com/api/health"
            ;;
        *)
            # 获取 LoadBalancer 或 NodePort 服务地址
            service_url=$(kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/name=$PROJECT_NAME" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
            if [ -z "$service_url" ]; then
                service_url="http://localhost:$(kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/name=$PROJECT_NAME" -o jsonpath='{.items[0].spec.ports[0].nodePort}' 2>/dev/null)"
            fi
            ;;
    esac

    if [ -n "$service_url" ]; then
        print_step "测试健康检查: $service_url"
        if curl -f --max-time 10 "$service_url" &> /dev/null; then
            print_success "健康检查通过"
        else
            print_warning "健康检查失败，请稍后手动验证"
        fi
    fi
}

# 函数：显示部署信息
show_deployment_info() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Kubernetes 部署完成! 🎉                                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📦 部署信息:${NC}"
    echo -e "   环境: $ENVIRONMENT"
    echo -e "   命名空间: $NAMESPACE"
    echo -e "   镜像标签: $FINAL_IMAGE_TAG"
    echo ""
    echo -e "${YELLOW}🔗 服务地址:${NC}"

    case $ENVIRONMENT in
        production)
            echo -e "   网站: https://biblevod.com"
            echo -e "   API: https://biblevod.com/api/"
            echo -e "   WebSocket: wss://biblevod.com/ws/"
            ;;
        staging)
            echo -e "   网站: https://e2e-socket-stag.nb-sandbox.com"
            echo -e "   API: https://e2e-socket-stag.nb-sandbox.com/api/"
            echo -e "   WebSocket: wss://e2e-socket-stag.nb-sandbox.com/ws/"
            ;;
        development)
            local node_port=$(kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/name=$PROJECT_NAME" -o jsonpath='{.items[0].spec.ports[0].nodePort}' 2>/dev/null)
            if [ -n "$node_port" ]; then
                echo -e "   网站: http://localhost:$node_port"
                echo -e "   API: http://localhost:$node_port/api/"
            fi
            ;;
    esac

    echo ""
    echo -e "${YELLOW}📊 监控命令:${NC}"
    echo -e "   查看 pods: kubectl get pods -n $NAMESPACE"
    echo -e "   查看日志: kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=$PROJECT_NAME"
    echo -e "   查看服务: kubectl get svc -n $NAMESPACE"
    echo ""
}

# 函数：回滚部署
rollback_deployment() {
    print_warning "如果部署出现问题，可以使用以下命令回滚:"

    if [ "$USE_HELM" = true ]; then
        echo -e "${BLUE}   helm rollback $PROJECT_NAME -n $NAMESPACE${NC}"
    else
        echo -e "${BLUE}   kubectl rollout undo deployment/${PROJECT_NAME}-${ENVIRONMENT} -n $NAMESPACE${NC}"
    fi
    echo ""
}

# 主流程
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  E2E Socket - Kubernetes 部署脚本                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🌍 部署环境: ${ENVIRONMENT}${NC}"
    echo ""

    # 执行部署流程
    check_kubectl
    check_helm
    determine_image_tag
    update_values_file
    create_namespace
    deploy_to_k8s
    wait_for_deployment
    verify_deployment
    show_deployment_info
    rollback_deployment
}

# 执行主流程
main

