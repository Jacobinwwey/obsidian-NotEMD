import {
    SemanticFigureEdge,
    SemanticFigureModel,
    SemanticFigureNode
} from '../editableSvg/semanticFigureModel';

const DRAWIO_EXPORTER_VERSION = 'notemd-drawio-exporter@0.1.0';

const DRAWIO_NODE_STYLE_BY_ROLE: Record<string, string> = {
    actor: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;',
    boundary: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;',
    processor: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;',
    process: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontStyle=1;',
    state: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;'
};

const DEFAULT_NODE_STYLE = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;';
const DEFAULT_EDGE_STYLE = 'endArrow=block;html=1;rounded=1;strokeColor=#64748b;';
const ASYNC_RELATIONS = new Set(['async', 'asynchronous', 'queue', 'queued']);

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function decodeXmlAttribute(value: string): string {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, '\'')
        .replace(/&amp;/g, '&');
}

function slugifyDiagramId(title: string): string {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `notemd-${slug || 'diagram'}`;
}

function resolveNodeStyle(node: SemanticFigureNode): string {
    return DRAWIO_NODE_STYLE_BY_ROLE[node.role.toLowerCase()] ?? DEFAULT_NODE_STYLE;
}

function resolveEdgeStyle(edge: SemanticFigureEdge): string {
    const relation = edge.relation?.trim().toLowerCase();
    if (relation && ASYNC_RELATIONS.has(relation)) {
        return `${DEFAULT_EDGE_STYLE}dashed=1;`;
    }

    return DEFAULT_EDGE_STYLE;
}

function renderNodeCell(node: SemanticFigureNode): string {
    return `        <mxCell id="${escapeXml(node.id)}" value="${escapeXml(node.label)}" style="${resolveNodeStyle(node)}" vertex="1" parent="1">
          <mxGeometry x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" as="geometry" />
        </mxCell>`;
}

function renderEdgeCell(edge: SemanticFigureEdge): string {
    const label = edge.label ?? edge.relation ?? '';
    return `        <mxCell id="${escapeXml(edge.id)}" value="${escapeXml(label)}" style="${resolveEdgeStyle(edge)}" edge="1" parent="1" source="${escapeXml(edge.sourceId)}" target="${escapeXml(edge.targetId)}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
}

function readAttributeMap(source: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const attrRegex = /\s([:\w-]+)=["']([^"']*)["']/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(source)) !== null) {
        attrs.set(match[1], decodeXmlAttribute(match[2]));
    }

    return attrs;
}

function collectDrawioCellLabels(xml: string): Map<string, string> {
    const labels = new Map<string, string>();
    const cellRegex = /<mxCell\b([^>]*)>/g;
    let match: RegExpExecArray | null;

    while ((match = cellRegex.exec(xml)) !== null) {
        const attrs = readAttributeMap(match[1]);
        const id = attrs.get('id');
        if (id && attrs.has('value')) {
            labels.set(id, attrs.get('value') ?? '');
        }
    }

    return labels;
}

export function exportSemanticFigureModelToDrawioXml(model: SemanticFigureModel): string {
    const diagramId = slugifyDiagramId(model.title);
    const cells = [
        '        <mxCell id="0" />',
        '        <mxCell id="1" parent="0" />',
        ...model.nodes.map(renderNodeCell),
        ...model.edges.map(renderEdgeCell)
    ].join('\n');

    return `<mxfile host="app.diagrams.net" agent="${DRAWIO_EXPORTER_VERSION}" version="24.7.17">
  <diagram id="${diagramId}" name="${escapeXml(model.title)}">
    <mxGraphModel dx="${model.width}" dy="${model.height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${model.width}" pageHeight="${model.height}" math="0" shadow="0">
      <root>
${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

export function collectDrawioVisibleLabelMismatches(xml: string, model: SemanticFigureModel): string[] {
    const labels = collectDrawioCellLabels(xml);
    const mismatches: string[] = [];

    for (const node of model.nodes) {
        const actual = labels.get(node.id);
        if (actual !== node.label) {
            mismatches.push(`node ${node.id} expected visible label "${node.label}" but found "${actual ?? '<missing>'}"`);
        }
    }

    for (const edge of model.edges) {
        const expected = edge.label ?? edge.relation ?? '';
        const actual = labels.get(edge.id);
        if (actual !== expected) {
            mismatches.push(`edge ${edge.id} expected visible label "${expected}" but found "${actual ?? '<missing>'}"`);
        }
    }

    return mismatches;
}
