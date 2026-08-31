```mermaid
sequenceDiagram
    participant user as User
    participant plugin as Plugin
    participant renderer as Renderer
    user->>plugin: generate
    plugin->>renderer: render
    renderer->>plugin: artifac
```


