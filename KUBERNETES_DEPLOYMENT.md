# Kubernetes 部署指南

## 📋 目录

- [架构概述](#架构概述)
- [环境配置](#环境配置)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [CI/CD 流水线](#cicd-流水线)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

---

## 🏗️ 架构概述

### 技术栈

- **容器化**: Docker
- **编排**: Kubernetes
- **负载均衡**: Nginx Ingress
- **服务网格**: ClusterIP Service
- **配置管理**: ConfigMaps & Secrets
- **存储**: Persistent Volumes (如果需要)
- **监控**: Health Checks & Readiness Probes

### 组件架构

```
Internet
    ↓
[Nginx Ingress Controller]
    ↓
[Service - ClusterIP:80]
    ↓
[Deployment - e2e-socket]
├── Pod 1 (WebSocket + API)
├── Pod 2 (WebSocket + API)
├── Pod 3 (WebSocket + API)
└── Pod 4 (WebSocket + API)
```

### 端口规划

- **80/443**: HTTP/HTTPS 入口
- **3000**: 应用内部端口
- **8080**: WebSocket 端口

---

## 🌍 环境配置

### 环境变量

根据 `values_*.yaml` 配置的环境变量：

```yaml
env:
  - name: NODE_ENV
    value: "production"
  - name: WS_PORT
    value: "8080"
  - name: API_PORT
    value: "3000"
```

### 域名配置

| 环境 | 域名 | SSL |
|------|------|-----|
| 生产 | biblevod.com, www.biblevod.com | ✅ Let's Encrypt |
| 预发布 | e2e-socket-stag.nb-sandbox.com | ✅ Let's Encrypt |
| 开发 | localhost 或开发域名 | ❌ |

### 资源配置

| 环境 | CPU 请求 | CPU 限制 | 内存请求 | 内存限制 | 副本数 |
|------|----------|----------|----------|----------|--------|
| 生产 | 100m | 1000m | 300Mi | 2048Mi | 4 |
| 预发布 | 100m | 1000m | 300Mi | 2048Mi | 2 |
| 开发 | 50m | 500m | 150Mi | 1024Mi | 1 |

---

## 🚀 快速部署

### 一键 CI/CD 部署

```bash
# 生产环境完整部署
npm run ci-cd

# 预发布环境
npm run ci-cd:stag

# 开发环境
npm run ci-cd:dev
```

### 分步部署

```bash
# 1. 构建镜像
npm run build

# 2. 部署到 Kubernetes
npm run deploy

# 3. 查看状态
npm run pm2:status
```

### 自定义部署

```bash
# 构建指定环境的镜像
npm run build:stag

# 部署到指定环境
npm run deploy:stag
```

---

## 📦 手动部署

### 步骤 1: 构建 Docker 镜像

```bash
# 生产环境
./script/build.sh production

# 预发布环境
./script/build.sh staging

# 开发环境
./script/build.sh development

# 自定义标签
./script/build.sh production v1.0.0
```

### 步骤 2: 更新配置

```bash
# 脚本会自动更新 values_*.yaml 中的镜像标签
# 或者手动编辑：
vim script/yaml/values_production.yaml
```

### 步骤 3: 部署到 Kubernetes

```bash
# 生产环境
./script/deploy.sh production

# 预发布环境
./script/deploy.sh staging

# 开发环境
./script/deploy.sh development
```

### 步骤 4: 验证部署

```bash
# 查看 pods 状态
kubectl get pods -n e2e-socket-production

# 查看服务状态
kubectl get svc -n e2e-socket-production

# 查看 ingress
kubectl get ingress -n e2e-socket-production

# 查看日志
kubectl logs -n e2e-socket-production -l app.kubernetes.io/name=e2e-socket
```

---

## 🔄 CI/CD 流水线

### 完整流水线

```bash
# 执行完整 CI/CD 流水线
./script/ci-cd.sh production all

# 只构建
./script/ci-cd.sh production build

# 只部署
./script/ci-cd.sh production deploy

# 只测试
./script/ci-cd.sh production test
```

### 流水线阶段

1. **构建阶段 (Build)**
   - 代码检查
   - 依赖安装
   - Docker 镜像构建
   - 镜像推送

2. **测试阶段 (Test)**
   - 单元测试
   - 集成测试
   - 容器测试

3. **部署阶段 (Deploy)**
   - 更新配置
   - 创建命名空间
   - 部署到 K8s
   - 健康检查

4. **通知阶段 (Notify)**
   - Slack/DingTalk 通知
   - 部署报告

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Build and push Docker image
      run: ./script/build.sh production

    - name: Deploy to Kubernetes
      run: ./script/deploy.sh production
      env:
        KUBECONFIG: ${{ secrets.KUBECONFIG }}
```

---

## 📊 监控和维护

### 健康检查

```bash
# HTTP 健康检查
curl https://biblevod.com/api/health

# WebSocket 连接测试
# 在浏览器中打开 https://biblevod.com 进行测试
```

### 监控命令

```bash
# 查看所有环境的状态
kubectl get pods -A | grep e2e-socket

# 查看详细状态
kubectl describe deployment e2e-socket-production -n e2e-socket-production

# 查看资源使用
kubectl top pods -n e2e-socket-production

# 查看日志
kubectl logs -f -n e2e-socket-production -l app.kubernetes.io/name=e2e-socket
```

### 日志管理

```bash
# 查看实时日志
kubectl logs -f deployment/e2e-socket-production -n e2e-socket-production

# 查看特定 pod 日志
kubectl logs -f pod-name -n e2e-socket-production

# 导出日志
kubectl logs deployment/e2e-socket-production -n e2e-socket-production > app.log
```

### 扩缩容

```bash
# 手动扩缩容
kubectl scale deployment e2e-socket-production --replicas=6 -n e2e-socket-production

# 自动扩缩容（需要配置 HPA）
kubectl autoscale deployment e2e-socket-production --cpu-percent=70 --min=2 --max=10 -n e2e-socket-production
```

---

## 🛠️ 故障排除

### 常见问题

#### 1. Pod 无法启动

```bash
# 查看 pod 状态
kubectl get pods -n e2e-socket-production

# 查看详细错误
kubectl describe pod pod-name -n e2e-socket-production

# 查看容器日志
kubectl logs pod-name -n e2e-socket-production --previous
```

#### 2. 服务无法访问

```bash
# 检查 service
kubectl get svc -n e2e-socket-production

# 检查 ingress
kubectl get ingress -n e2e-socket-production

# 测试内部访问
kubectl exec -it pod-name -n e2e-socket-production -- curl http://localhost:3000/api/health
```

#### 3. 镜像拉取失败

```bash
# 检查镜像是否存在
docker pull registry.nb-sandbox.com/e2e-socket:latest

# 检查 registry 认证
kubectl get secrets -n e2e-socket-production

# 更新 imagePullPolicy
kubectl patch deployment e2e-socket-production -n e2e-socket-production -p '{"spec":{"template":{"spec":{"containers":[{"name":"e2e-socket","imagePullPolicy":"Always"}]}}}}'
```

#### 4. 资源不足

```bash
# 查看节点资源
kubectl describe nodes

# 检查 pod 资源使用
kubectl top pods -n e2e-socket-production

# 调整资源限制
kubectl edit deployment e2e-socket-production -n e2e-socket-production
```

### 回滚部署

```bash
# 查看部署历史
kubectl rollout history deployment/e2e-socket-production -n e2e-socket-production

# 回滚到上一版本
kubectl rollout undo deployment/e2e-socket-production -n e2e-socket-production

# 回滚到指定版本
kubectl rollout undo deployment/e2e-socket-production --to-revision=2 -n e2e-socket-production
```

### 清理资源

```bash
# 删除整个环境
kubectl delete namespace e2e-socket-production

# 删除特定部署
kubectl delete deployment e2e-socket-production -n e2e-socket-production

# 清理未使用的镜像
kubectl run cleanup -i --tty --rm --image=busybox --restart=Never -- sh -c "docker system prune -f"
```

---

## 📝 部署清单

### 部署前检查

- [ ] Docker 环境正常
- [ ] kubectl 配置正确
- [ ] registry 认证配置
- [ ] 域名 DNS 解析
- [ ] SSL 证书准备
- [ ] 资源配额充足
- [ ] 网络策略配置

### 部署后验证

- [ ] Pod 运行状态正常
- [ ] Service 访问正常
- [ ] Ingress 配置正确
- [ ] SSL 证书有效
- [ ] 应用功能正常
- [ ] 监控告警配置
- [ ] 备份策略配置

### 维护任务

- [ ] 定期更新镜像
- [ ] 监控资源使用
- [ ] 检查日志异常
- [ ] 更新 SSL 证书
- [ ] 清理过期资源
- [ ] 备份重要数据

---

## 🎯 最佳实践

### 安全

1. **最小权限原则**
   - 使用非 root 用户运行容器
   - 配置网络策略限制访问
   - 定期更新镜像和依赖

2. **网络安全**
   - 启用 HTTPS
   - 配置防火墙规则
   - 使用内部网络通信

3. **访问控制**
   - 配置 RBAC
   - 使用 Secrets 管理敏感信息
   - 定期轮换凭据

### 性能

1. **资源优化**
   - 设置合理的资源请求和限制
   - 启用 HPA 自动扩缩容
   - 优化镜像大小

2. **缓存策略**
   - 配置静态资源缓存
   - 使用 CDN 加速
   - 优化数据库查询

### 监控

1. **应用监控**
   - 配置健康检查
   - 监控关键指标
   - 设置告警规则

2. **基础设施监控**
   - 监控集群状态
   - 跟踪资源使用
   - 分析性能瓶颈

---

## 📚 相关文档

- [Docker 构建指南](script/build.sh)
- [Kubernetes 部署](script/deploy.sh)
- [CI/CD 流水线](script/ci-cd.sh)
- [配置管理](script/yaml/)
- [故障排除](KUBERNETES_DEPLOYMENT.md#故障排除)

---

**🚀 祝部署顺利！如有问题，请查看故障排除章节或提交 Issue。**

