import { escapeErText, type ErCardinality } from './entityRelationship';
import type { EntityRelationshipScene, ErPoint, ErSide, ErTable } from './entityRelationshipLayout';

const MARKERS: Record<ErCardinality, string> = { one: 'ERmandOne', 'zero-or-one': 'ERzeroToOne', 'one-or-many': 'ERoneToMany', 'zero-or-many': 'ERzeroToMany', unspecified: 'none' };

function geometry(left: number, top: number, width: number, height: number): string {
    return '<mxGeometry x="' + left + '" y="' + top + '" width="' + width + '" height="' + height + '" as="geometry"/>';
}

function renderTable(table: ErTable, index: number): string {
    const parent = 'entity-' + index;
    const title = '<mxCell id="' + parent + '" value="' + escapeErText(table.label) + '" style="shape=table;startSize=48;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;fontSize=18;fontColor=#173b2e;fillColor=#e0ece5;strokeColor=#536d62;" vertex="1" parent="1">' + geometry(table.x, table.y, table.width, table.height) + '</mxCell>';
    return title + table.rows.map((row, rowIndex) => {
        const rowId = parent + '-row-' + rowIndex;
        const widths = [table.keyWidth + 16, table.nameWidth, table.width - table.keyWidth - 16 - table.nameWidth];
        const cells = [(row.attribute.keys ?? []).join(', '), [row.attribute.name, row.detail].filter(Boolean).join('\n'), row.attribute.type ?? '—'];
        let columnLeft = 0;
        return '<mxCell id="' + rowId + '" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=#fcfdfb;strokeColor=#cad8ce;" vertex="1" parent="' + parent + '">' + geometry(0, row.y - table.y, table.width, row.height) + '</mxCell>'
            + cells.map((label, column) => {
                const cell = '<mxCell id="' + rowId + '-cell-' + column + '" value="' + escapeErText(label).replace(/\n/g, '&#10;') + '" style="shape=partialRectangle;top=0;bottom=0;left=0;right=0;align=left;verticalAlign=middle;spacingLeft=10;fontSize=14;fontColor=#173b2e;whiteSpace=wrap;html=0;" vertex="1" parent="' + rowId + '">' + geometry(columnLeft, 0, widths[column], row.height) + '</mxCell>';
                columnLeft += widths[column];
                return cell;
            }).join('');
    }).join('');
}

function portStyle(prefix: string, point: ErPoint, side: ErSide, table: ErTable): string {
    const fractionX = side === 'left' ? 0 : side === 'right' ? 1 : (point.x - table.x) / table.width;
    const fractionY = side === 'top' ? 0 : side === 'bottom' ? 1 : (point.y - table.y) / table.height;
    return prefix + 'X=' + fractionX + ';' + prefix + 'Y=' + fractionY + ';' + prefix + 'Perimeter=0;';
}

export function exportEntityRelationshipDrawio(scene: EntityRelationshipScene): string {
    const tableIndexes = new Map(scene.tables.map((table, index) => [table.id, index]));
    const edges = scene.connections.map((connection, index) => {
        const sourceIndex = tableIndexes.get(connection.from)!;
        const targetIndex = tableIndexes.get(connection.to)!;
        const source = scene.tables[sourceIndex];
        const target = scene.tables[targetIndex];
        const points = connection.points;
        const style = 'edgeStyle=none;rounded=0;orthogonalLoop=1;html=0;fontSize=14;fontColor=#173b2e;strokeColor=#365c4a;strokeWidth=1.8;labelBackgroundColor=#f5f8f6;startArrow=' + MARKERS[connection.fromCardinality] + ';endArrow=' + MARKERS[connection.toCardinality] + ';startSize=18;endSize=18;' + (connection.identifying === undefined ? 'dashed=1;dashPattern=2 5;' : connection.identifying === false ? 'dashed=1;' : '')
            + portStyle('exit', points[0], connection.fromSide, source) + portStyle('entry', points[points.length - 1], connection.toSide, target);
        const unknown = (connection.fromCardinality === 'unspecified' || connection.toCardinality === 'unspecified' ? ' [? = unspecified endpoint]' : '')
            + (connection.identifying === undefined ? ' [identifying status unspecified]' : '');
        return '<mxCell id="relationship-' + index + '" value="' + escapeErText((connection.label ?? '') + unknown) + '" style="' + style + '" edge="1" source="entity-' + sourceIndex + '" target="entity-' + targetIndex + '" parent="1"><mxGeometry relative="1" as="geometry"><Array as="points">'
            + points.slice(1, -1).map(point => '<mxPoint x="' + point.x + '" y="' + point.y + '"/>').join('') + '</Array></mxGeometry></mxCell>';
    }).join('');
    return '<mxfile host="Notemd"><diagram id="er-diagram" name="' + escapeErText(scene.title) + '"><mxGraphModel page="0" pageWidth="' + scene.width + '" pageHeight="' + scene.height + '"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        + scene.tables.map(renderTable).join('') + edges + '</root></mxGraphModel></diagram></mxfile>';
}
