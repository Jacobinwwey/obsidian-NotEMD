```mermaid
flowchart TD
    build["Build"]
    tests["Tests"]
    release["Release"]
    build -->tests
    tests -->|pass| release
```


