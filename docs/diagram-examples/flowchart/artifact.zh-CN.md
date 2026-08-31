# 发布决策

> 使用 Notemd 的“预览图表”命令查看此图表。

```mermaid
flowchart TD
    build["Build"]
    tests["Tests"]
    release["Release"]
    build -->tests
    tests -->|pass| release
```
