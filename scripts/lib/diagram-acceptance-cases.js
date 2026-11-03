function getDiagramAcceptanceCases() {
    const canonicalEr = { schemaVersion: 2, intent: 'erDiagram', title: '订单与客户 / Orders and customers', nodes: [], edges: [], payload: {
        kind: 'entity-relationship', entities: [
            { id: 'customer', label: '客户', attributes: [{ name: 'id', type: 'uuid', keys: ['PK'] }] },
            { id: 'order', label: '订单', attributes: [{ name: 'id', type: 'uuid', keys: ['PK'] },
                { name: 'customer_id', type: 'uuid', keys: ['PK', 'FK'], references: { entity: 'customer', attribute: 'id' } },
                { name: 'amount', type: 'decimal(12,2)', comment: '税后总额 / Tax-inclusive total' }] }
        ], relationships: [{ from: 'customer', to: 'order', label: 'places', fromCardinality: 'one', toCardinality: 'zero-or-many', identifying: false }] } };
    const legacyEr = { intent: 'erDiagram', title: canonicalEr.title,
        nodes: canonicalEr.payload.entities.map(entity => ({ id: entity.id, label: entity.label,
            children: entity.attributes.map((attribute, index) => ({ id: entity.id + '-field-' + index, label: attribute.name, kind: attribute.type })) })),
        edges: [{ from: 'customer', to: 'order', label: 'places', relation: 'one-to-many' }] };
    const classSpec = { intent: 'classDiagram', title: '中文类名 / Translated classes', nodes: [{ id: 'customer', label: '客户' }, { id: 'order', label: '订单' }], edges: [{ from: 'customer', to: 'order', label: 'places' }] };
    const sequenceSpec = { intent: 'sequence', title: '参与者身份 / Participant identity', nodes: [{ id: 'api-gateway', label: 'Gateway A' }, { id: 'api_gateway', label: 'Gateway B' }], edges: [{ from: 'api-gateway', to: 'api_gateway', label: 'request' }] };
    const broadTree = { schemaVersion: 2, intent: 'tree', title: '十个兄弟节点 / Ten sibling nodes', nodes: [], payload: { kind: 'tree', nodes: [{ id: 'root', label: 'Root' }, ...Array.from({ length: 10 }, (_unused, index) => ({ id: 'child_' + index, label: 'Child ' + index, parentId: 'root' }))] } };
    const cycle = { schemaVersion: 2, intent: 'tree', title: '断开的环 / Disconnected cycle', nodes: [], payload: { kind: 'tree', nodes: [{ id: 'root', label: 'Root' }, { id: 'first', label: 'First', parentId: 'second' }, { id: 'second', label: 'Second', parentId: 'first' }] } };
    const handoff = { schemaVersion: 2, intent: 'process', title: '空步骤交接 / Missing handoff step', nodes: [], payload: { kind: 'lane-grid', lanes: [{ id: 'owner', label: 'Owner' }], steps: [{ id: 'draft', label: 'Draft' }, { id: 'review', label: 'Review' }], cells: [{ laneId: 'owner', stepId: 'draft', title: 'Create' }], edges: [{ from: { laneId: 'owner', stepId: 'draft' }, to: { laneId: 'owner', stepId: 'review' }, label: 'submit' }] } };
    return [
        { id: 'er-layout', title: 'ER：卡片变为实体表 / Entity tables', explanation: '同一旧格式输入；观察字段是否仍被拆成独立卡片。 / Same legacy input; compare attribute placement.', operation: 'renderEditable', beforeSpec: legacyEr, afterSpec: legacyEr, comparison: 'identical-input' },
        { id: 'er-semantics', title: 'ER：语义保留 / Semantic fidelity', explanation: '相同来源事实的两种契约；旧格式无法表达复合键、FK 引用与注释。不是同一 JSON，也不是实时 LLM 生成。 / Equivalent facts; explicit legacy projection versus typed payload, not a live model run.', operation: 'renderEditable', beforeSpec: legacyEr, afterSpec: canonicalEr, comparison: 'source-equivalent' },
        { id: 'class-identity', title: '类图：中文身份 / Class identity', explanation: '优化前两个中文类名清理为同一标识；优化后独立标识与可读别名。 / Separate identities with readable aliases.', operation: 'renderClass', beforeSpec: classSpec, afterSpec: classSpec, comparison: 'identical-input' },
        { id: 'sequence-identity', title: '时序图：碰撞标识 / Participant collision', explanation: '按用户选择保留原有呈现与底部参与者；独立身份和消息不变。 / Preserve the reviewed presentation, including footer actors, as requested. Distinct identities and messages remain.', operation: 'renderSequence', beforeSpec: sequenceSpec, afterSpec: sequenceSpec, comparison: 'identical-input' },
        { id: 'tree-spacing', title: '树图：兄弟间距 / Sibling spacing', explanation: '十个 170px 节点不应挤入固定宽度；用原始尺寸检查间距。 / Inspect native-size spacing, not thumbnail text size.', operation: 'renderEditable', beforeSpec: broadTree, afterSpec: broadTree, comparison: 'identical-input' },
        { id: 'tree-cycle', title: '树图：保留并标注环 / Retain cyclic relations', explanation: '保留所有节点与往返关系；环内节点平级排列，用短连线代替绕行与大段告警。 / Preserve the cycle as peer relations with direct reciprocal arrows and a secondary caption.', operation: 'renderEditable', beforeSpec: cycle, afterSpec: cycle, comparison: 'identical-input' },
        { id: 'lane-handoff', title: '流程：显式未知步骤 / Explicit unknown step', explanation: '保留原交接与未知端点；只提示一次缺失，不添加大段告警或空白。 / Retain the handoff and unknown endpoint with one quiet label and content-sized rows.', operation: 'renderEditable', beforeSpec: handoff, afterSpec: handoff, comparison: 'identical-input' }
    ];
}

module.exports = { getDiagramAcceptanceCases };
