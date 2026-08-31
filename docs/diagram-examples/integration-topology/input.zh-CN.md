# 集成拓扑

用途：当源系统和消费者通过协议连接到共享平台时使用。

请求图表类型：`integration-topology`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.edges[1]: db -> ingest (JDBC)
- spec.payload.edges[2]: sftp -> ingest (SFTP)
- spec.payload.edges[3]: ingest -> store (WRITE)
- spec.payload.edges[4]: store -> query (READ)
- spec.payload.edges[5]: query -> bi (JDBC)
- spec.payload.edges[6]: query -> api (REST)
- spec.payload.kind: topology
- spec.payload.zones[1]: sources (Sources)
- spec.payload.zones[1].id: sources
- spec.payload.zones[2]: platform (Data platform)
- spec.payload.zones[2].id: platform
- spec.payload.zones[2].sub: core integration layer
- spec.payload.zones[3]: consumers (Consumers)
- spec.payload.zones[3].id: consumers
- spec.payload.nodes[1]: db (Databases)
- spec.payload.nodes[1].id: db
- spec.payload.nodes[1].zoneId: sources
- spec.payload.nodes[1].sub: JDBC
- spec.payload.nodes[2]: sftp (SFTP drops)
- spec.payload.nodes[2].id: sftp
- spec.payload.nodes[2].zoneId: sources
- spec.payload.nodes[2].sub: scheduled
- spec.payload.nodes[3]: ingest (Ingest)
- spec.payload.nodes[3].id: ingest

## 阅读线索

- 确认源系统、平台和消费者分区清楚。
- 确认协议标签落在对应连接上。
- 优先检查这条证据：spec.payload.edges[1]: db -> ingest (JDBC)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
