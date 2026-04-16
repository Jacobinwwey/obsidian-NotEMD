# 回归基线

此目录保存高风险改动前后的可复现证据。

## 标准工作流

1. 采集基线：
```bash
npm run regression:language-baseline
```

2. 实施改动。

3. 与最新基线对比：
```bash
npm run regression:language-compare
```

4. 如果 compare 失败，必须先修复回归，再允许合并。

## 约定

- 使用按日期命名的目录：`YYYY-MM-DD-<topic>`。
- 在有必要时，同时保留命令输出和退出码。
- 不要覆盖历史基线日志；新增文件或创建新的日期目录。
