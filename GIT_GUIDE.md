# Git 使用指南

## ✅ Git 仓库已成功连接

你的项目已成功连接到 GitHub 仓库：`git@github.com:kstd123/E2ESocket.git`

## 📋 当前状态

- **本地分支**: main
- **远程仓库**: origin (git@github.com:kstd123/E2ESocket.git)
- **提交状态**: 已同步
- **最后提交**: a28d66e - Initial commit

## 🔧 常用 Git 命令

### 基本操作

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline

# 查看分支
git branch -a
```

### 提交代码

```bash
# 添加文件
git add .

# 或添加特定文件
git add filename.js

# 提交更改
git commit -m "描述你的更改"

# 推送到远程
git push
```

### 分支管理

```bash
# 创建新分支
git checkout -b feature/new-feature

# 切换分支
git checkout main

# 合并分支
git merge feature/new-feature

# 删除本地分支
git branch -d feature/new-feature
```

### 远程仓库操作

```bash
# 拉取最新代码
git pull

# 查看远程仓库信息
git remote -v

# 添加新的远程仓库
git remote add upstream https://github.com/another/repo.git
```

## 🚀 工作流程

### 开发新功能

```bash
# 1. 创建功能分支
git checkout -b feature/config-management

# 2. 进行开发和测试
# ... 编写代码 ...

# 3. 提交更改
git add .
git commit -m "Add config management feature"

# 4. 推送到远程分支
git push -u origin feature/config-management

# 5. 在 GitHub 上创建 Pull Request
# 6. 合并到 main 分支
```

### 修复 Bug

```bash
# 1. 创建修复分支
git checkout -b fix/websocket-connection

# 2. 修复问题
# ... 修复代码 ...

# 3. 提交修复
git add .
git commit -m "Fix websocket connection issue"

# 4. 推送到远程
git push -u origin fix/websocket-connection
```

### 紧急修复

```bash
# 1. 切换到 main 分支
git checkout main
git pull

# 2. 创建 hotfix 分支
git checkout -b hotfix/critical-bug

# 3. 修复问题
# ... 紧急修复 ...

# 4. 提交并推送
git add .
git commit -m "HOTFIX: Critical bug fix"
git push -u origin hotfix/critical-bug

# 5. 立即合并到 main
git checkout main
git merge hotfix/critical-bug
git push
```

## 📝 提交信息规范

良好的提交信息有助于理解代码变更历史：

```bash
# 格式: 类型: 简短描述

# 功能新增
git commit -m "feat: add configuration management for rooms"

# 修复 Bug
git commit -m "fix: resolve websocket connection timeout"

# 文档更新
git commit -m "docs: update deployment guide"

# 样式调整
git commit -m "style: format code with prettier"

# 重构代码
git commit -m "refactor: optimize room manager performance"

# 测试相关
git commit -m "test: add unit tests for encryption module"

# 构建工具
git commit -m "build: update webpack configuration"

# 其他更改
git commit -m "chore: update dependencies"
```

## 🔄 同步代码

### 从远程拉取最新代码

```bash
# 拉取并合并
git pull

# 如果有冲突，手动解决后
git add .
git commit -m "Merge remote changes"
git push
```

### 推送本地更改

```bash
# 推送当前分支
git push

# 推送新分支
git push -u origin new-branch
```

## 🛠️ 高级操作

### 查看差异

```bash
# 查看工作区差异
git diff

# 查看暂存区差异
git diff --cached

# 查看两个提交之间的差异
git diff commit1 commit2

# 查看文件历史
git log --follow filename.js
```

### 撤销操作

```bash
# 撤销工作区更改
git checkout -- filename.js

# 撤销暂存区更改
git reset HEAD filename.js

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（删除更改）
git reset --hard HEAD~1
```

### 标签管理

```bash
# 创建标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0

# 查看所有标签
git tag

# 删除标签
git tag -d v1.0.0
```

## 🚨 注意事项

### 1. 不要推送敏感信息

确保 `.gitignore` 包含：
- `.env` 文件
- 密码和密钥
- 日志文件
- 临时文件

### 2. 定期拉取

在开始工作前：
```bash
git pull
```

### 3. 小而频繁的提交

- 每个提交只做一件事情
- 及时提交，避免丢失工作
- 写清楚的提交信息

### 4. 分支策略

- `main`: 主分支，生产代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `hotfix/*`: 紧急修复

## 🔧 故障排除

### SSH 密钥问题

```bash
# 检查 SSH 密钥
ssh -T git@github.com

# 如果失败，检查密钥配置
ls -la ~/.ssh/
cat ~/.ssh/id_rsa.pub
```

### 合并冲突

```bash
# 查看冲突文件
git status

# 编辑冲突文件，解决冲突
# 然后标记为已解决
git add filename.js

# 提交合并
git commit -m "Resolve merge conflicts"
```

### 推送被拒绝

```bash
# 拉取最新代码
git pull --rebase

# 重新推送
git push
```

## 📚 更多资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助](https://help.github.com)
- [Git 工作流](https://www.atlassian.com/git/tutorials/comparing-workflows)

## 🎯 快速参考

```bash
# 日常开发
git status              # 查看状态
git add .              # 添加所有更改
git commit -m "msg"    # 提交更改
git push               # 推送代码

# 分支操作
git checkout -b branch # 创建并切换分支
git merge branch       # 合并分支
git branch -d branch   # 删除分支

# 同步代码
git pull               # 拉取最新
git fetch              # 只获取不合并
```

---

**Git 仓库已准备就绪，开始你的开发之旅吧！** 🚀

