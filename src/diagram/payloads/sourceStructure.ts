import type { DiagramLaneGridPayload, DiagramTreePayload } from './types';

export function findMissingLaneEndpointCells(payload: DiagramLaneGridPayload): Array<{ laneId: string; stepId: string }> {
    const authored = new Set(payload.cells.map(cell => JSON.stringify([cell.laneId, cell.stepId])));
    const missing = new Map<string, { laneId: string; stepId: string }>();
    for (const edge of payload.edges) {
        for (const endpoint of [edge.from, edge.to]) {
            const key = JSON.stringify([endpoint.laneId, endpoint.stepId]);
            if (!authored.has(key)) missing.set(key, endpoint);
        }
    }
    return [...missing.values()];
}

export function describeTreeConnectivity(payload: DiagramTreePayload): {
    levels: Map<string, number>;
    cycleNodeIds: Set<string>;
    notice: string | undefined;
} {
    const nodes = new Map(payload.nodes.map(node => [node.id, node]));
    const children = new Map<string, string[]>();
    for (const node of payload.nodes) {
        if (node.parentId) {
            const siblings = children.get(node.parentId) ?? [];
            siblings.push(node.id);
            children.set(node.parentId, siblings);
        }
    }
    const finished = new Set<string>();
    const cycleNodeIds = new Set<string>();
    for (const node of payload.nodes) {
        const chain: string[] = [];
        const offsets = new Map<string, number>();
        let currentId: string | undefined = node.id;
        while (currentId && !finished.has(currentId)) {
            const offset = offsets.get(currentId);
            if (offset !== undefined) {
                chain.slice(offset).forEach(id => cycleNodeIds.add(id));
                break;
            }
            offsets.set(currentId, chain.length);
            chain.push(currentId);
            currentId = nodes.get(currentId)?.parentId;
        }
        chain.forEach(id => finished.add(id));
    }
    const roots = payload.nodes.filter(node => !node.parentId);
    const levels = new Map<string, number>();
    const pending = roots.map(node => ({ id: node.id, depth: 0 }));
    const drain = (): void => {
        for (let index = 0; index < pending.length; index += 1) {
            const entry = pending[index];
            if (levels.has(entry.id)) continue;
            levels.set(entry.id, entry.depth);
            for (const child of children.get(entry.id) ?? []) pending.push({ id: child, depth: entry.depth + 1 });
        }
        pending.length = 0;
    };
    drain();
    for (const node of payload.nodes) {
        if (cycleNodeIds.has(node.id)) pending.push({ id: node.id, depth: 0 });
    }
    drain();
    const notice = cycleNodeIds.size > 0
        ? '非树结构：循环关系已保留 / Non-tree source: cyclic relationships retained'
        : roots.length !== 1
            ? '多个根节点已保留 / Forest: all source roots retained'
            : undefined;
    return { levels, cycleNodeIds, notice };
}
