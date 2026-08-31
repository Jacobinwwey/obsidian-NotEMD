# Artifact schema

> 使用 Notemd 的“预览图表”命令查看此图表。

```mermaid
erDiagram
    ARTIFACT {
        string id
    }
    PANEL {
        string id
    }
    ARTIFACT ||--o{ PANEL : contains
```
