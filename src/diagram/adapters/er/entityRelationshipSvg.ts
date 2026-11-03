import { escapeErText, type ErCardinality } from './entityRelationship';
import type { EntityRelationshipScene, ErConnection, ErPoint, ErSide, ErTable } from './entityRelationshipLayout';

const ER_STYLE = `.er-canvas{fill:var(--er-bg,#f5f8f6)}.er-table{fill:var(--er-panel,#fcfdfb);stroke:var(--er-border,#536d62);stroke-width:1.3}.er-header{fill:var(--er-header,#e0ece5)}.er-title,.er-name,.er-field{fill:var(--er-ink,#173b2e)}.er-title{font-size:28px;font-weight:700}.er-name{font-size:18px;font-weight:650}.er-field{font-size:14px}.er-detail,.er-note{fill:var(--er-muted,#425e52);font-size:12px}.er-rule{stroke:var(--er-rule,#cad8ce);stroke-width:1}.er-edge,.er-cardinality{fill:none;stroke:var(--er-edge,#365c4a);stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}.er-cardinality circle{fill:var(--er-bg,#f5f8f6)}.er-label-bg{fill:var(--er-bg,#f5f8f6)}.er-label{fill:var(--er-ink,#173b2e);font-size:14px}.er-key-bg{fill:var(--er-key-bg,#dfebe3)}.er-key{fill:var(--er-ink,#173b2e);font-size:10px;font-weight:700}.er-unknown{fill:var(--er-ink,#173b2e);stroke:none;font-size:16px;font-weight:700}@media(prefers-color-scheme:dark){svg{--er-bg:#15241e;--er-panel:#1d3027;--er-header:#2a4437;--er-border:#779a85;--er-ink:#e5f1e9;--er-muted:#bed1c4;--er-rule:#486454;--er-edge:#adcbb9;--er-key-bg:#395342}}`;

function renderErText(textValue: string, left: number, baseline: number, cssClass: string): string {
    return '<text class="' + cssClass + '" x="' + left + '" y="' + baseline + '">' + escapeErText(textValue) + '</text>';
}

function renderTable(table: ErTable): string {
    const header = '<rect class="er-header" x="' + table.x + '" y="' + table.y + '" width="' + table.width + '" height="48"/>';
    const rows = table.rows.map(row => {
        const fieldX = table.x + 16 + table.keyWidth;
        const keys = (row.attribute.keys ?? []).map((key, index) => {
            const badgeLeft = table.x + 10 + index * 30;
            return '<rect class="er-key-bg" x="' + badgeLeft + '" y="' + (row.y + 9) + '" width="26" height="18" rx="3"/>' + renderErText(key, badgeLeft + 5, row.y + 22, 'er-key');
        }).join('');
        return '<path data-er-attribute="' + escapeErText(row.attribute.name) + '" class="er-rule" d="M' + table.x + ' ' + row.y + 'H' + (table.x + table.width) + '"/>'
            + keys + renderErText(row.attribute.name, fieldX, row.y + 24, 'er-field')
            + renderErText(row.attribute.type ?? '—', fieldX + table.nameWidth, row.y + 24, 'er-field')
            + (row.detail ? renderErText(row.detail, fieldX, row.y + 44, 'er-detail') : '');
    }).join('');
    return '<g data-er-entity="' + escapeErText(table.id) + '" data-drawio-type="node" data-drawio-id="' + escapeErText(table.id) + '" data-drawio-role="entity">'
        + '<rect class="er-table" x="' + table.x + '" y="' + table.y + '" width="' + table.width + '" height="' + table.height + '" rx="3"/>'
        + header + renderErText(table.label, table.x + 18, table.y + 30, 'er-name') + rows + '</g>';
}

function cardinalityMarker(point: ErPoint, side: ErSide, cardinality: ErCardinality): string {
    const angle = side === 'right' ? 0 : side === 'bottom' ? 90 : side === 'left' ? 180 : -90;
    let glyph: string;
    switch (cardinality) {
        case 'one': glyph = '<path d="M7 -8V8M14 -8V8"/>'; break;
        case 'zero-or-one': glyph = '<path d="M7 -8V8"/><circle cx="22" cy="0" r="5"/>'; break;
        case 'one-or-many': glyph = '<path d="M0 -9L14 0L0 9M0 0H21M21 -8V8"/>'; break;
        case 'zero-or-many': glyph = '<path d="M0 -9L14 0L0 9M0 0H16"/><circle cx="23" cy="0" r="5"/>'; break;
        case 'unspecified': glyph = '<text class="er-unknown" x="10" y="5">?</text>'; break;
    }
    return '<g class="er-cardinality" data-drawio-ignore="true" data-er-cardinality="' + cardinality + '" transform="translate(' + point.x + ' ' + point.y + ') rotate(' + angle + ')">' + glyph + '</g>';
}

function renderConnection(connection: ErConnection, index: number): string {
    const points = connection.points.map(point => point.x + ',' + point.y).join(' ');
    const label = connection.labelBox && connection.label ? '<rect class="er-label-bg" x="' + connection.labelBox.x + '" y="' + connection.labelBox.y + '" width="' + connection.labelBox.width + '" height="' + connection.labelBox.height + '" rx="3"/>'
        + renderErText(connection.label, connection.labelBox.x + 10, connection.labelBox.y + 16, 'er-label') : '';
    return '<g data-drawio-type="edge" data-drawio-id="er-edge-' + index + '" data-drawio-source="' + escapeErText(connection.from) + '" data-drawio-target="' + escapeErText(connection.to) + '">'
        + '<polyline class="er-edge" points="' + points + '"' + (connection.identifying === undefined ? ' stroke-dasharray="2 5"' : connection.identifying === false ? ' stroke-dasharray="6 5"' : '') + '/>'
        + cardinalityMarker(connection.points[0], connection.fromSide, connection.fromCardinality)
        + cardinalityMarker(connection.points[connection.points.length - 1], connection.toSide, connection.toCardinality) + label + '</g>';
}

export function renderEntityRelationshipSvg(scene: EntityRelationshipScene): string {
    const keys = new Set(scene.tables.flatMap(table => table.attributes.flatMap(attribute => attribute.keys ?? [])));
    const legend = [['PK', 'primary key'], ['FK', 'foreign key'], ['UK', 'unique key']].filter(([role]) => keys.has(role as 'PK' | 'FK' | 'UK')).map(([role, meaning]) => role + ' · ' + meaning).join('    /    ');
    const footer = scene.legacy ? 'Legacy relationship cardinalities retained; dotted = identifying status unspecified.' : '? = unspecified cardinality; solid = identifying; dashed = non-identifying; dotted = status unspecified.';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + scene.width + ' ' + scene.height + '" width="' + scene.width + '" height="' + scene.height + '" role="img" aria-labelledby="er-title er-description" style="font-family:Segoe UI,Microsoft YaHei,sans-serif">'
        + '<title id="er-title">' + escapeErText(scene.title) + '</title><desc id="er-description">Entity relationship diagram with ' + scene.tables.length + ' entities and ' + scene.connections.length + ' relationships. ' + escapeErText(scene.summary ?? '') + '</desc>'
        + '<style>' + ER_STYLE + '</style><rect class="er-canvas" width="100%" height="100%" data-drawio-ignore="true"/>'
        + '<g data-drawio-ignore="true">' + renderErText(scene.title, 64, 62, 'er-title') + (scene.summary ? renderErText(scene.summary, 64, 93, 'er-note') : '') + '</g>'
        + scene.connections.map(renderConnection).join('') + scene.tables.map(renderTable).join('')
        + '<g data-drawio-ignore="true">' + renderErText(legend, 64, scene.height - 53, 'er-note') + renderErText(footer, 64, scene.height - 28, 'er-note') + '</g></svg>';
}

export function renderEntityRelationshipHtmlDocument(scene: EntityRelationshipScene): string {
    const index = scene.tables.map(table => '<details><summary>' + escapeErText(table.label) + '</summary><table><caption>' + escapeErText(table.id) + '</caption><thead><tr><th scope="col">Key</th><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Description / reference</th></tr></thead><tbody>'
        + table.rows.map(row => '<tr><td>' + escapeErText((row.attribute.keys ?? []).join(', ')) + '</td><th scope="row">' + escapeErText(row.attribute.name) + '</th><td>' + escapeErText(row.attribute.type ?? '—') + '</td><td>' + escapeErText(row.detail) + '</td></tr>').join('') + '</tbody></table></details>').join('');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; img-src data:"><title>' + escapeErText(scene.title) + '</title><style>body{margin:0;background:#f5f8f6;color:#173b2e;font:16px/1.6 "Segoe UI","Microsoft YaHei",sans-serif}main{padding:24px}figure{margin:0;overflow:auto}svg{display:block;width:100%;min-width:' + Math.min(scene.width, 1280) + 'px;height:auto}section{max-width:1100px;margin:24px auto}summary{min-height:44px;display:list-item;cursor:pointer;padding:8px}summary:focus-visible{outline:3px solid #38724f;outline-offset:3px}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #cad8ce;padding:10px;overflow-wrap:anywhere}caption{text-align:left}@media(prefers-color-scheme:dark){body{background:#15241e;color:#e5f1e9}th,td{border-color:#486454}}</style></head><body><main><figure aria-label="Entity relationship diagram">' + renderEntityRelationshipSvg(scene) + '</figure><section aria-label="Entity field index">' + index + '</section></main></body></html>';
}
