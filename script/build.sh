#!/bin/bash

###############################################################################
# E2E Socket - Docker 镜像构建脚本
#
# 用法:
#   ./script/build.sh [环境] [标签]
#
# 环境选项:
#   production  - 生产环境 (默认)
#   staging     - 预发布环境
#   development - 开发环境
#
# 示例:
#   ./script/build.sh production
#   ./script/build.sh staging v1.0.0
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
CUSTOM_TAG=${2:-}

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

# 函数：获取 Git 提交信息
get_git_info() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse --short HEAD)
        GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
    else
        print_warning "Git 信息不可用，使用默认值"
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
        GIT_TAG=""
    fi
}

# 函数：生成镜像标签
generate_tags() {
    get_git_info

    # 如果提供了自定义标签，使用它
    if [ -n "$CUSTOM_TAG" ]; then
        IMAGE_TAG="$CUSTOM_TAG"
    else
        # 根据环境和 Git 信息生成标签
        case $ENVIRONMENT in
            production)
                if [ -n "$GIT_TAG" ]; then
                    IMAGE_TAG="$GIT_TAG"
                else
                    IMAGE_TAG="$GIT_COMMIT"
                fi
                ;;
            staging)
                IMAGE_TAG="stag-$GIT_COMMIT"
                ;;
            development)
                IMAGE_TAG="dev-$GIT_COMMIT"
                ;;
            *)
                IMAGE_TAG="$GIT_COMMIT"
                ;;
        esac
    fi

    # 生成完整的镜像名称
    FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

    # 额外标签
    LATEST_TAG="${IMAGE_NAME}:latest"
    ENV_LATEST_TAG="${IMAGE_NAME}:${ENVIRONMENT}-latest"

    print_success "镜像标签: $FULL_IMAGE_NAME"
    if [ "$ENVIRONMENT" = "production" ]; then
        print_success "最新标签: $LATEST_TAG"
        print_success "环境标签: $ENV_LATEST_TAG"
    fi
}

# 函数：检查 Docker
check_docker() {
    print_step "检查 Docker 环境..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行或权限不足"
        exit 1
    fi

    print_success "Docker $(docker --version)"
}

# 函数：检查构建文件
check_build_files() {
    print_step "检查构建文件..."

    local required_files=("package.json" "script/Dockerfile" "ecosystem.config.js")

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "缺少必要文件: $file"
            exit 1
        fi
    done

    print_success "所有必要文件存在"
}

# 函数：构建 Docker 镜像
build_image() {
    print_step "构建 Docker 镜像..."

    # 构建参数
    BUILD_ARGS=""
    BUILD_ARGS="$BUILD_ARGS --build-arg BUILD_ENV=$ENVIRONMENT"
    BUILD_ARGS="$BUILD_ARGS --build-arg GIT_COMMIT=$GIT_COMMIT"
    BUILD_ARGS="$BUILD_ARGS --build-arg GIT_BRANCH=$GIT_BRANCH"

    # 构建镜像
    docker build \
        $BUILD_ARGS \
        -f script/Dockerfile \
        -t "$FULL_IMAGE_NAME" \
        --label "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --label "org.opencontainers.image.revision=$GIT_COMMIT" \
        --label "org.opencontainers.image.version=$IMAGE_TAG" \
        --label "org.opencontainers.image.source=https://github.com/kstd123/E2ESocket" \
        .

    if [ $? -eq 0 ]; then
        print_success "镜像构建成功: $FULL_IMAGE_NAME"
    else
        print_error "镜像构建失败"
        exit 1
    fi
}

# 函数：推送镜像
push_image() {
    print_step "推送 Docker 镜像..."

    # 推送主标签
    docker push "$FULL_IMAGE_NAME"

    if [ $? -eq 0 ]; then
        print_success "镜像推送成功: $FULL_IMAGE_NAME"
    else
        print_error "镜像推送失败"
        exit 1
    fi

    # 对于生产环境，推送额外标签
    if [ "$ENVIRONMENT" = "production" ]; then
        print_step "推送额外标签..."

        # 标记并推送 latest 标签
        docker tag "$FULL_IMAGE_NAME" "$LATEST_TAG"
        docker push "$LATEST_TAG"
        print_success "推送成功: $LATEST_TAG"

        # 标记并推送环境 latest 标签
        docker tag "$FULL_IMAGE_NAME" "$ENV_LATEST_TAG"
        docker push "$ENV_LATEST_TAG"
        print_success "推送成功: $ENV_LATEST_TAG"
    fi
}

# 函数：清理
cleanup() {
    print_step "清理构建缓存..."

    # 删除构建缓存（可选）
    # docker system prune -f

    print_success "清理完成"
}

# 函数：显示构建信息
show_build_info() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Docker 镜像构建完成! 🎉                                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📦 镜像信息:${NC}"
    echo -e "   主镜像: $FULL_IMAGE_NAME"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "   最新版: $LATEST_TAG"
        echo -e "   环镜版: $ENV_LATEST_TAG"
    fi
    echo ""
    echo -e "${YELLOW}🏗️  构建信息:${NC}"
    echo -e "   环境: $ENVIRONMENT"
    echo -e "   分支: $GIT_BRANCH"
    echo -e "   提交: $GIT_COMMIT"
    echo -e "   时间: $(date)"
    echo ""
    echo -e "${YELLOW}🚀 下一步:${NC}"
    echo -e "   更新 Kubernetes manifests 中的镜像标签"
    echo -e "   部署到相应环境"
    echo ""
}

# 主流程
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  E2E Socket - Docker 镜像构建脚本                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🌍 构建环境: ${ENVIRONMENT}${NC}"
    echo ""

    # 生成镜像标签
    generate_tags

    # 执行构建流程
    check_docker
    check_build_files
    build_image
    push_image
    cleanup
    show_build_info
}

# 执行主流程
main
