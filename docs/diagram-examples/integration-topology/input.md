# Integration topology

Purpose: Use when source systems and consumer surfaces connect to a shared platform by protocol.

Requested diagram type: `integration-topology`
Requested render target: `editable-html-svg`

## Source facts

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

## Reading cues

- Confirm that the integration-topology output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.edges[1]: db -> ingest (JDBC)

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
