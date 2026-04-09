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

## 5. 推荐发布命令模板

```bash
gh release create <tag> main.js manifest.json styles.css README.md \
  --title "Notemd <tag>" \
  --notes-file docs/releases/<tag>.md
```
