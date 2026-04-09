# Regression Baselines

This directory stores reproducible before/after evidence for high-risk changes.

## Standard workflow

1. Capture baseline:
```bash
npm run regression:language-baseline
```

2. Implement changes.

3. Compare against latest baseline:
```bash
npm run regression:language-compare
```

4. If compare fails, fix regressions before merging.

## Conventions

- Use dated folders: `YYYY-MM-DD-<topic>`.
- Keep both command output and exit codes when relevant.
- Never overwrite historical baseline logs; append new files or create a new dated folder.
