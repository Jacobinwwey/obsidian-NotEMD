# Git 作者信息卫生

## 概览

本项目对 git 作者信息保持严格约束，确保提交历史只反映真实的人类作者。与 bot 相关的作者信息会被 git hooks 自动阻断。

## Git Hooks

### pre-commit Hook

提交前校验 git 作者配置：

- 如果 `user.name` 包含 bot 相关词汇（claude、bot、assistant、AI），阻止提交。
- 如果 `user.email` 包含 bot 相关词汇，阻止提交。
- 确认作者姓名和邮箱已经配置。

**位置：** `.git/hooks/pre-commit`

### commit-msg Hook

提交消息校验：

- 阻止包含 bot 相关引用的提交消息。
- 避免在提交描述中意外留下 bot 痕迹。

**位置：** `.git/hooks/commit-msg`

## 辅助脚本

### 校验作者配置

```bash
./scripts/verify-author.sh
```

检查当前 git 配置并报告问题。

### 清理历史中的 Bot 提交

```bash
./scripts/clean-bot-commits.sh
```

**警告：该脚本会重写 git 历史。**

该脚本会：

1. 扫描最近 50 个提交中的 bot 相关作者信息。
2. 创建备份分支。
3. 使用真实姓名和邮箱重新写入 bot 提交作者。
4. 要求人工复核后再 force push。

**只在确实需要清理既有历史时使用。**

## 设置正确作者信息

### 仅针对当前仓库

```bash
git config user.name "Your Real Name"
git config user.email "your.email@example.com"
```

### 全局设置

```bash
git config --global user.name "Your Real Name"
git config --global user.email "your.email@example.com"
```

## 推送前校验

推送前始终检查提交：

```bash
# 查看最近 5 个提交
git log --format="%h %an <%ae> - %s" -5

# 校验作者配置
./scripts/verify-author.sh
```

## GitHub Pull Request 保护

GitHub 会根据 git metadata 显示提交作者。hooks 用来保证：

- PR 提交始终使用正确的人类作者信息。
- 提交历史中不出现 bot 相关名称。
- 当邮箱匹配 GitHub 账号时，GitHub profile 链接可以正确关联。

## 故障排查

### Hook 没有执行

```bash
# 确认 hooks 可执行
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg

# 确认 hook 位置
ls -la .git/hooks/
```

### 绕过 Hooks（不推荐）

如果测试时必须临时绕过：

```bash
git commit --no-verify -m "message"
```

**不要把使用 `--no-verify` 创建的提交推送到 main 分支。**

### 已经推送 Bot 提交后的清理

如果 bot 提交已经被推送：

1. **运行清理脚本：**

   ```bash
   ./scripts/clean-bot-commits.sh
   ```

2. **复核变化：**

   ```bash
   git log --oneline -20
   ```

3. **Force push（先与团队协调）：**

   ```bash
   git push --force-with-lease origin main
   ```

4. **通知协作者重置：**

   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

## 新贡献者 Hook 安装

git clone 不会自动分发 hooks。新贡献者应执行：

1. 克隆仓库。
2. 确认 hooks 存在：

   ```bash
   ls -la .git/hooks/pre-commit .git/hooks/commit-msg
   ```

3. 如果缺失，根据项目根目录中的脚本或本文档重新创建。
4. 设置可执行权限：

   ```bash
   chmod +x .git/hooks/pre-commit
   chmod +x .git/hooks/commit-msg
   ```

## 最佳实践

1. 提交前先设置作者信息。
2. 开始工作前运行 `./scripts/verify-author.sh`。
3. 推送前复核提交：`git log -5`。
4. 面向 main 的提交不要使用 `--no-verify`。
5. 重写历史前先与团队协调。

## 相关文档

- [发布工作流](./release-workflow.zh-CN.md) - 确保发布提交使用正确作者信息。
- [CLI 能力矩阵](./notemd-cli-capability-matrix.zh-CN.md) - 维护者工具说明。
