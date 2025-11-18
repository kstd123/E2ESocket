# --- STAGE 1: Dependencies ---
FROM node:18-alpine AS deps

# 安装构建依赖
RUN apk add --no-cache libc6-compat git

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装生产依赖（用于最终镜像）
RUN npm ci --only=production && npm cache clean --force

# --- STAGE 2: Builder ---
FROM node:18-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache libc6-compat git

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用（如果需要编译 TypeScript 或其他构建步骤）
# 这里我们直接复制文件，不需要构建步骤

# --- STAGE 3: PRODUCTION ---
FROM node:18-alpine AS runner

# 安装必要的运行时依赖
RUN apk add --no-cache dumb-init curl \
    && npm install pm2@latest -g \
    && npm cache clean --force \
    && rm -rf /tmp/*

# 设置生产环境
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S e2eapp -u 1001 -G nodejs

# 设置工作目录
WORKDIR /app

# 从 builder 阶段复制应用代码
COPY --from=builder --chown=e2eapp:nodejs /app ./

# 从 deps 阶段复制生产依赖
COPY --from=deps --chown=e2eapp:nodejs /app/node_modules ./node_modules

# 确保 logs 和其他必要的目录存在
RUN mkdir -p logs && chown -R e2eapp:nodejs logs

# 移除开发依赖
RUN npm prune --production

# 创建启动脚本
RUN echo '#!/bin/sh' > run.sh && \
    echo 'exec pm2-runtime start ecosystem.config.js --env production' >> run.sh && \
    chmod +x run.sh

# 切换到非 root 用户
USER e2eapp

# 声明端口
EXPOSE 3000 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 默认启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"] 


