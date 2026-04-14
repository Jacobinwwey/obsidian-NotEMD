# Notemd 发布流程（维护者）

此文档面向维护者与贡献者，不面向普通最终用户。

## 1. 回归基线

先采集变更前基线：

```bash
npm run regression:language-baseline
```

完成改动后，与最新基线进行对比：

```bash
npm run regression:language-compare
```

## 2. 发布前验证门禁

执行：

```bash
npm run build
npm test -- --runInBand
obsidian help
obsidian-cli help
git diff --check
```

如果本地环境缺少 `obsidian-cli`，请在发布说明或交接证据中明确记录。

## 3. 版本同步

发布前请确保以下文件版本一致：

- `package.json`
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

Release tag 必须使用纯数字 `x.x.x` 格式，不能加 `v` 前缀；Obsidian 社区插件发布仅接受数字版本 tag。

## 4. GitHub Release 约束

Release 描述必须是完整双语：

- 独立英文段落；
- 独立中文段落；
- 两部分均可独立阅读。

Release 必需资产：

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 5. 发布命令

```bash
npm run release:github -- <tag>
```

该辅助命令会在调用 GitHub 前强制校验必须打包的资产以及 `docs/releases/<tag>.md`：

- 如果 release 尚不存在，则执行 `gh release create ... --verify-tag`。
- 如果 release 已存在，则执行 `gh release upload ... --clobber`。
- 如果 tag 不是纯数字 `x.x.x`，则立即失败。

第二条路径就是这类问题的修复路径：release 文案已发布，但插件安装资产未上传时，可直接补传。

## 6. CI 自动化

仓库现已内置 `.github/workflows/release.yml`：

- 推送 git tag 时自动发布 release。
- 通过 `workflow_dispatch` 并传入纯数字 `x.x.x` 的 `tag` 参数，可在 CI 中修复已有 release。
- 工作流会执行 `npm ci`、`npm run build`、`npm test -- --runInBand`、`npm run audit:i18n-ui`、`git diff --check`，最后执行 `npm run release:github -- "$TAG_NAME"`。
- 工作流会在 checkout / publish 前校验 `^[0-9]+\.[0-9]+\.[0-9]+$`，因此会拒绝 `v1.8.2` 这类 tag。

工作流刻意复用仓库内的 release 辅助脚本，而不是在 YAML 中重复维护资产清单或 release notes 逻辑，避免两套规则漂移。
