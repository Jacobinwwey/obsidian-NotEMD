import type { DiagramSpec } from '../../types';
import { boxesOverlap, measureTextWidth, type LayoutRect } from '../../layout/layoutSafety';
import { resolveEntityRelationship, type ErAttribute, type ErEntity, type ErRelationship } from './entityRelationship';

export interface ErPoint { x: number; y: number }
export type ErSide = 'left' | 'right' | 'top' | 'bottom';
export interface ErTable extends ErEntity, LayoutRect {
    keyWidth: number;
    nameWidth: number;
    rows: { attribute: ErAttribute; y: number; height: number; detail: string }[];
}
export interface ErConnection extends ErRelationship {
    points: ErPoint[];
    fromSide: ErSide;
    toSide: ErSide;
    labelBox?: LayoutRect;
}
export interface EntityRelationshipScene {
    title: string;
    summary?: string;
    tables: ErTable[];
    connections: ErConnection[];
    width: number;
    height: number;
    legacy: boolean;
}

const GAP_X = 188;
const GAP_Y = 148;
const HEADER_HEIGHT = 48;
const PORT_STEP = 40;
const STUB_LENGTH = 40;

function attributeDetail(attribute: ErAttribute): string {
    const reference = attribute.references ? attribute.references.entity + '.' + attribute.references.attribute : '';
    return [attribute.comment, reference].filter(Boolean).join(' · ');
}

function connectionSides(source: LayoutRect, target: LayoutRect): [ErSide, ErSide] {
    if (target.x > source.x + source.width) return ['right', 'left'];
    if (source.x > target.x + target.width) return ['left', 'right'];
    if (target.y > source.y) return ['bottom', 'top'];
    if (source.y > target.y) return ['top', 'bottom'];
    return ['bottom', 'bottom'];
}

function port(table: ErTable, side: ErSide, index: number, count: number): ErPoint {
    const offset = (index - (count - 1) / 2) * PORT_STEP;
    switch (side) {
        case 'left': return { x: table.x, y: table.y + HEADER_HEIGHT + (table.height - HEADER_HEIGHT) / 2 + offset };
        case 'right': return { x: table.x + table.width, y: table.y + HEADER_HEIGHT + (table.height - HEADER_HEIGHT) / 2 + offset };
        case 'top': return { x: table.x + table.width / 2 + offset, y: table.y };
        case 'bottom': return { x: table.x + table.width / 2 + offset, y: table.y + table.height };
    }
}

function outside(point: ErPoint, side: ErSide): ErPoint {
    return { x: point.x + (side === 'left' ? -STUB_LENGTH : side === 'right' ? STUB_LENGTH : 0),
        y: point.y + (side === 'top' ? -STUB_LENGTH : side === 'bottom' ? STUB_LENGTH : 0) };
}

export function erSegmentCrossesTable(start: ErPoint, end: ErPoint, table: LayoutRect): boolean {
    if (start.x === end.x) return start.x > table.x && start.x < table.x + table.width
        && Math.max(start.y, end.y) > table.y && Math.min(start.y, end.y) < table.y + table.height;
    return start.y > table.y && start.y < table.y + table.height
        && Math.max(start.x, end.x) > table.x && Math.min(start.x, end.x) < table.x + table.width;
}

interface RouteQueueEntry { id: number; cost: number; score: number }

function pushRoute(queue: RouteQueueEntry[], entry: RouteQueueEntry): void {
    queue.push(entry);
    let index = queue.length - 1;
    while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (queue[parent].score <= entry.score) break;
        queue[index] = queue[parent];
        index = parent;
    }
    queue[index] = entry;
}

function popRoute(queue: RouteQueueEntry[]): RouteQueueEntry {
    const first = queue[0];
    const last = queue.pop()!;
    if (queue.length > 0) {
        let index = 0;
        while (index * 2 + 1 < queue.length) {
            let child = index * 2 + 1;
            if (child + 1 < queue.length && queue[child + 1].score < queue[child].score) child += 1;
            if (last.score <= queue[child].score) break;
            queue[index] = queue[child];
            index = child;
        }
        queue[index] = last;
    }
    return first;
}

function routeConnection(start: ErPoint, end: ErPoint, tables: ErTable[], lane: number, bottom: number): ErPoint[] {
    const obstacles = tables.map(table => ({ x: table.x - 12, y: table.y - 12, width: table.width + 24, height: table.height + 24 }));
    const xs = [...new Set([start.x, end.x, 20, ...tables.flatMap(table => [table.x - 44, table.x + table.width + 44])])].sort((first, second) => first - second);
    const ys = [...new Set([start.y, end.y, 112, bottom + 48 + lane * 38,
        ...tables.flatMap(table => [table.y - 44, table.y + table.height + 44])])].sort((first, second) => first - second);
    const width = xs.length;
    const startId = ys.indexOf(start.y) * width + xs.indexOf(start.x);
    const endId = ys.indexOf(end.y) * width + xs.indexOf(end.x);
    const pointAt = (id: number): ErPoint => ({ x: xs[id % width], y: ys[Math.floor(id / width)] });
    const distances = new Map<number, number>([[startId, 0]]);
    const parents = new Map<number, number>();
    const queue: RouteQueueEntry[] = [];
    pushRoute(queue, { id: startId, cost: 0, score: 0 });
    while (queue.length > 0) {
        const current = popRoute(queue);
        if (current.cost !== distances.get(current.id)) continue;
        if (current.id === endId) {
            const points: ErPoint[] = [];
            let cursor: number | undefined = endId;
            while (cursor !== undefined) {
                points.push(pointAt(cursor));
                cursor = parents.get(cursor);
            }
            return points.reverse();
        }
        const column = current.id % width;
        const row = Math.floor(current.id / width);
        const nextIds = [column > 0 ? current.id - 1 : -1, column < width - 1 ? current.id + 1 : -1,
            row > 0 ? current.id - width : -1, row < ys.length - 1 ? current.id + width : -1];
        const currentPoint = pointAt(current.id);
        for (const nextId of nextIds) {
            if (nextId < 0) continue;
            const next = pointAt(nextId);
            if (obstacles.some(table => erSegmentCrossesTable(currentPoint, next, table))) continue;
            const cost = current.cost + Math.abs(next.x - currentPoint.x) + Math.abs(next.y - currentPoint.y);
            if (cost >= (distances.get(nextId) ?? Infinity)) continue;
            distances.set(nextId, cost);
            parents.set(nextId, current.id);
            pushRoute(queue, { id: nextId, cost, score: cost + Math.abs(next.x - end.x) + Math.abs(next.y - end.y) });
        }
    }
    throw new Error('ER route capacity: cannot connect relationship without crossing an entity. Split the schema into explicit views.');
}

function simplifyRoute(points: ErPoint[]): ErPoint[] {
    const simplified: ErPoint[] = [];
    for (const point of points) {
        const previous = simplified[simplified.length - 1];
        if (previous?.x === point.x && previous.y === point.y) continue;
        const before = simplified[simplified.length - 2];
        if (before && ((before.x === previous.x && previous.x === point.x && (previous.y - before.y) * (point.y - previous.y) > 0)
            || (before.y === previous.y && previous.y === point.y && (previous.x - before.x) * (point.x - previous.x) > 0))) simplified.pop();
        simplified.push(point);
    }
    return simplified;
}

function placeRelationshipLabel(points: ErPoint[], label: string, obstacles: LayoutRect[]): LayoutRect {
    const width = measureTextWidth(label) + 20;
    const candidates: LayoutRect[] = [];
    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        if (start.y === end.y && Math.abs(end.x - start.x) >= width + 36) {
            candidates.push({ x: (start.x + end.x - width) / 2, y: start.y - 28, width, height: 23 });
            candidates.push({ x: (start.x + end.x - width) / 2, y: start.y + 8, width, height: 23 });
        } else if (start.x === end.x && Math.abs(end.y - start.y) >= 62) {
            candidates.push({ x: start.x + 12, y: (start.y + end.y) / 2 - 12, width, height: 23 });
            candidates.push({ x: start.x - width - 12, y: (start.y + end.y) / 2 - 12, width, height: 23 });
        }
    }
    const placement = candidates.find(candidate => candidate.x >= 8 && candidate.y >= 84 && !obstacles.some(obstacle => boxesOverlap(candidate, obstacle, 8)));
    if (!placement) throw new Error('ER label capacity: relationship "' + label + '" needs a wider routing corridor or a focused schema view.');
    return placement;
}

export function buildEntityRelationshipScene(spec: DiagramSpec): EntityRelationshipScene {
    const payload = resolveEntityRelationship(spec);
    const gapX = Math.max(GAP_X, ...payload.relationships.map(relationship => measureTextWidth(relationship.label ?? '') + 88));
    const degrees = new Map<string, number>();
    for (const relationship of payload.relationships) {
        degrees.set(relationship.from, (degrees.get(relationship.from) ?? 0) + 1);
        degrees.set(relationship.to, (degrees.get(relationship.to) ?? 0) + 1);
    }
    const columnCount = Math.min(3, payload.entities.length);
    const measured = payload.entities.map(entity => {
        const keyWidth = Math.max(30, ...entity.attributes.map(attribute => (attribute.keys?.length ?? 0) * 30));
        const nameWidth = Math.max(100, ...entity.attributes.map(attribute => Math.max(measureTextWidth(attribute.name), measureTextWidth(attributeDetail(attribute))) + 20));
        const typeWidth = Math.max(64, ...entity.attributes.map(attribute => measureTextWidth(attribute.type ?? '—') + 16));
        const incidentEnds = degrees.get(entity.id) ?? 0;
        const width = Math.max(300, measureTextWidth(entity.label) + 44, keyWidth + nameWidth + typeWidth + 32, incidentEnds * PORT_STEP + 64);
        const rows = entity.attributes.map(attribute => ({ attribute, detail: attributeDetail(attribute), height: attributeDetail(attribute) ? 54 : 36, y: 0 }));
        const height = Math.max(HEADER_HEIGHT + 36, HEADER_HEIGHT + rows.reduce((total, row) => total + row.height, 0), HEADER_HEIGHT + incidentEnds * PORT_STEP + 32);
        return { ...entity, keyWidth, nameWidth, width, height, rows, x: 0, y: 0 };
    });
    const columns = Array.from({ length: columnCount }, (_unused, column) => Math.max(...measured.filter((_table, index) => index % columnCount === column).map(table => table.width)));
    const rows = Array.from({ length: Math.ceil(measured.length / columnCount) }, (_unused, row) => Math.max(...measured.slice(row * columnCount, (row + 1) * columnCount).map(table => table.height)));
    const tables: ErTable[] = measured.map((table, index) => {
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);
        const left = 64 + columns.slice(0, column).reduce((total, width) => total + width + gapX, 0);
        const top = 160 + rows.slice(0, row).reduce((total, height) => total + height + GAP_Y, 0);
        let rowY = top + HEADER_HEIGHT;
        return { ...table, x: left, y: top, rows: table.rows.map(attributeRow => {
            const placed = { ...attributeRow, y: rowY };
            rowY += attributeRow.height;
            return placed;
        }) };
    });
    const tableById = new Map(tables.map(table => [table.id, table]));
    const endsBySide = new Map<string, number[]>();
    const sides = payload.relationships.map((relationship, index) => {
        const pair = connectionSides(tableById.get(relationship.from)!, tableById.get(relationship.to)!);
        for (const [entity, side, end] of [[relationship.from, pair[0], index * 2], [relationship.to, pair[1], index * 2 + 1]] as const) {
            const key = entity + ':' + side;
            endsBySide.set(key, [...(endsBySide.get(key) ?? []), end]);
        }
        return pair;
    });
    const labelObstacles: LayoutRect[] = [...tables];
    const bottom = Math.max(...tables.map(table => table.y + table.height));
    const connections = payload.relationships.map((relationship, index): ErConnection => {
        const [fromSide, toSide] = sides[index];
        const fromEnds = endsBySide.get(relationship.from + ':' + fromSide)!;
        const toEnds = endsBySide.get(relationship.to + ':' + toSide)!;
        const start = port(tableById.get(relationship.from)!, fromSide, fromEnds.indexOf(index * 2), fromEnds.length);
        const end = port(tableById.get(relationship.to)!, toSide, toEnds.indexOf(index * 2 + 1), toEnds.length);
        const outerStart = outside(start, fromSide);
        const outerEnd = outside(end, toSide);
        if (relationship.from === relationship.to) {
            outerStart.y += 64;
            outerEnd.y += 64;
        }
        const points = simplifyRoute([start, ...routeConnection(outerStart, outerEnd, tables, index, bottom), end]);
        const labelBox = relationship.label ? placeRelationshipLabel(points, relationship.label, labelObstacles) : undefined;
        if (labelBox) labelObstacles.push(labelBox);
        return { ...relationship, points, fromSide, toSide, labelBox };
    });
    const routePoints = connections.flatMap(connection => connection.points);
    return { title: spec.title, summary: spec.summary, tables, connections, legacy: spec.payload?.kind !== 'entity-relationship',
        width: Math.max(720, ...tables.map(table => table.x + table.width + 64), ...routePoints.map(point => point.x + 48), ...labelObstacles.map(box => box.x + box.width + 32), measureTextWidth(spec.title) * 1.8 + 128, measureTextWidth(spec.summary ?? '') + 128),
        height: Math.max(bottom, ...routePoints.map(point => point.y), ...labelObstacles.map(box => box.y + box.height)) + 112 };
}
