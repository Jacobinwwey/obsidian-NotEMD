# CMOS inverter

Purpose: Use for electrical topology expressed through supported circuit templates.

Requested diagram type: `circuit`
Requested render target: `circuitikz`

## Source facts

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

## Reading cues

- Confirm that the circuit output preserves the source facts and relationships.
- Check that the visual structure matches the declared circuitikz render target.
- Inspect this evidence first: spec.circuitSpec.connections[1]: VDD -> MP.S

This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.
