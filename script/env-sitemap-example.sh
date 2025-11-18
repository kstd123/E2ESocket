#!/bin/bash
# Sitemap生成功能所需的环境变量配置示例

echo "# ================================================"
echo "# Sitemap生成功能环境变量配置示例"
echo "# ================================================"
echo ""

echo "# 开发环境配置示例 (.env.local):"
echo "PC_BACKEND_BASE_URL=http://localhost:8080"
echo "SITE_URL=http://localhost:3000"
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000"
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3000"
echo "INTERNAL_API_KEY=internal-sitemap-key-2024"
echo "NEXTAUTH_URL=http://localhost:3000"
echo ""

echo "# 生产环境配置示例 (.env.production):"
echo "PC_BACKEND_BASE_URL=https://api.yourdomain.com"
echo "SITE_URL=https://biblevod.com"
echo "NEXT_PUBLIC_SITE_URL=https://biblevod.com"
echo "NEXT_PUBLIC_API_BASE_URL=https://biblevod.com"
echo "INTERNAL_API_KEY=your-production-api-key"
echo "NEXTAUTH_URL=https://biblevod.com"
echo ""

echo "# 配置说明:"
echo "# PC_BACKEND_BASE_URL - 后端API基础URL (必需)"
echo "# SITE_URL - 站点URL (必需，用于sitemap生成)"
echo "# NEXT_PUBLIC_SITE_URL - 公开站点URL (必需)"
echo "# NEXT_PUBLIC_API_BASE_URL - API基础URL (必需)"
echo "# INTERNAL_API_KEY - 内部API密钥 (可选，用于安全验证)"
echo "# NEXTAUTH_URL - NextAuth URL (如果使用认证功能)"
echo ""

echo "# 使用方法:"
echo "# 1. 复制相应环境的配置到对应的.env文件"
echo "# 2. 根据实际情况修改URL和密钥"
echo "# 3. 重新启动应用"
echo ""

echo "# 测试配置:"
echo "# npm run sitemap:categories:dev    # 开发环境"
echo "# npm run sitemap:categories:prod   # 生产环境" 