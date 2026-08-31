# Platform access matrix

Purpose: Use to audit which roles can perform which actions on platform components.

Requested diagram type: `access-matrix`
Requested render target: `editable-html-svg`
Canonical payload kind: `access-matrix`
Semantic intent: `accessMatrix`

## Source facts

- spec.payload.roles[1]: {"id":"admin","label":"Administrators","code":"DL-ADMINS"}
- spec.payload.roles[2]: {"id":"engineer","label":"Engineers","code":"DL-ENG"}
- spec.payload.roles[3]: {"id":"scientist","label":"Scientists","code":"DL-SCI"}
- spec.payload.roles[4]: {"id":"consumer","label":"Consumers","code":"DL-CON"}
- spec.payload.components[1]: {"id":"identity","label":"Identity service","hint":"SSO"}
- spec.payload.components[2]: {"id":"raw","label":"Raw bucket","hint":"S3"}
- spec.payload.components[3]: {"id":"staging","label":"Staging catalog","hint":"SQL"}
- spec.payload.components[4]: {"id":"aggregate","label":"Aggregated catalog","hint":"SQL"}
- spec.payload.components[5]: {"id":"notebook","label":"Notebook runtime","hint":"compute"}
- spec.payload.cells[1]: {"row":0,"col":0,"value":"Admin","level":"full"}
- spec.payload.cells[2]: {"row":0,"col":1,"value":"Login","level":"read"}
- spec.payload.cells[3]: {"row":0,"col":2,"value":"Login","level":"read"}
- spec.payload.cells[4]: {"row":0,"col":3,"value":"Login","level":"read"}
- spec.payload.cells[5]: {"row":1,"col":0,"value":"Full","level":"full"}
- spec.payload.cells[6]: {"row":1,"col":1,"value":"R/W","level":"rw"}
- spec.payload.cells[7]: {"row":1,"col":2,"value":"No access","level":"none"}
- spec.payload.cells[8]: {"row":1,"col":3,"value":"No access","level":"none"}
- spec.payload.cells[9]: {"row":2,"col":0,"value":"Full","level":"full"}
- spec.payload.cells[10]: {"row":2,"col":1,"value":"R/W","level":"rw"}
- spec.payload.cells[11]: {"row":2,"col":2,"value":"Read","level":"read"}
- spec.payload.cells[12]: {"row":2,"col":3,"value":"No access","level":"none"}
- spec.payload.cells[13]: {"row":3,"col":0,"value":"Full","level":"full"}
- spec.payload.cells[14]: {"row":3,"col":1,"value":"R/W","level":"rw"}
- spec.payload.cells[15]: {"row":3,"col":2,"value":"SELECT","level":"read"}

## Reading cues

- Confirm that the access-matrix output preserves the source facts and relationships.
- Check that the visual structure matches the declared editable-html-svg render target.
- Inspect this evidence first: spec.payload.roles[1]: {"id":"admin","label":"Administrators","code":"DL-ADMINS"}

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
