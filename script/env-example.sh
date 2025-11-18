#!/bin/bash

# 环境变量配置示例脚本
# 根据部署环境复制到相应位置

echo "🔧 设置网站环境变量..."

# 生产环境配置
if [ "$1" = "production" ]; then
    echo "📈 配置生产环境变量"
    export SITE_URL=https://biblevod.com
    export NEXT_PUBLIC_SITE_URL=https://biblevod.com
    export NEXT_PUBLIC_API_BASE_URL=https://biblevod.com
    export INTERNAL_API_KEY=your-secure-production-key
    
# 测试环境配置
elif [ "$1" = "staging" ]; then
    echo "🧪 配置测试环境变量"
    export SITE_URL=https://biblevod.com
    export NEXT_PUBLIC_SITE_URL=https://biblevod.com
    export NEXT_PUBLIC_API_BASE_URL=https://biblevod.com
    export INTERNAL_API_KEY=your-secure-staging-key
    
# 开发环境配置
else
    echo "💻 配置开发环境变量"
    export SITE_URL=http://localhost:3000
    export NEXT_PUBLIC_SITE_URL=http://localhost:3000
    export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
    export INTERNAL_API_KEY=internal-sitemap-key-2024
fi

echo "✅ 环境变量配置完成"
echo "🔗 SITE_URL: $SITE_URL"
echo "🔗 NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL"
echo "🔗 NEXT_PUBLIC_API_BASE_URL: $NEXT_PUBLIC_API_BASE_URL"

# 使用说明
echo ""
echo "📖 使用方法："
echo "   开发环境: source script/env-example.sh"
echo "   测试环境: source script/env-example.sh staging"
echo "   生产环境: source script/env-example.sh production"
echo ""
echo "💡 提示：在CI/CD或Docker中直接设置这些环境变量" 