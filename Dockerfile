# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --production && \
    npm cache clean --force

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露 WebSocket 和 HTTP API 端口
EXPOSE 8080 3000

# 设置环境变量
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "server.js"]

