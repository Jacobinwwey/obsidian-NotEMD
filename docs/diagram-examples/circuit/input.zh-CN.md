# CMOS 反相器

用途：用于由受支持电路模板表达的电气拓扑。

请求图表类型：`circuit`
请求渲染目标：`circuitikz`

## 源事实

- spec.circuitSpec.connections[1]: VDD -> MP.S
- spec.circuitSpec.connections[2]: MP.D -> MN.D
- spec.circuitSpec.connections[3]: MN.S -> GND
- spec.circuitSpec.connections[4]: vin -> MP.G
- spec.circuitSpec.connections[5]: vin -> MN.G
- spec.circuitSpec.connections[6]: MP.D -> vout
- spec.circuitSpec.connections[7]: MN.D -> vout
- spec.circuitSpec.circuitKind: cmos-inverter
- spec.circuitSpec.goldenReferenceId: cmos-inverter-v1
- spec.circuitSpec.nets: VDD, GND, vin, vout, shared_gate, shared_drain
- spec.circuitSpec.components[1]: MP ($M_P$)
- spec.circuitSpec.components[1].id: MP
- spec.circuitSpec.components[1].type: pmos
- spec.circuitSpec.components[1].terminals.S: VDD
- spec.circuitSpec.components[1].terminals.G: shared_gate
- spec.circuitSpec.components[1].terminals.D: shared_drain
- spec.circuitSpec.components[2]: MN ($M_N$)
- spec.circuitSpec.components[2].id: MN
- spec.circuitSpec.components[2].type: nmos
- spec.circuitSpec.components[2].terminals.D: shared_drain
- spec.circuitSpec.components[2].terminals.G: shared_gate
- spec.circuitSpec.components[2].terminals.S: GND

## 阅读线索

- 确认 VDD、GND、vin 和 vout 网络保留。
- 确认 PMOS 与 NMOS 的连接没有改变。
- 优先检查这条证据：spec.circuitSpec.connections[1]: VDD -> MP.S

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
