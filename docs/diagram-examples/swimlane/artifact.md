```mermaid
flowchart LR
    subgraph authoring["Authoring"]
        draft["Draft spec"]
        review["Review contract"]
        draft -->|Authoring| review
    end subgraph delivery["Delivery"]
        build["Build artifact"]
        publish["Publish release"]
        build -->|Delivery| publish
    end
```


