# 平台访问矩阵

用途：用于审计角色可以对平台组件执行哪些操作。

请求图表类型：`access-matrix`
请求渲染目标：`editable-html-svg`
Canonical payload kind：`access-matrix`
语义 intent：`accessMatrix`

## 源事实

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

## 阅读线索

- 确认每个角色与组件都有权限单元。
- 确认关键权限单元被突出显示。
- 优先检查这条证据：spec.payload.roles[1]: {"id":"admin","label":"Administrators","code":"DL-ADMINS"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
