import { assertValidDiagramSpec } from '../../diagram/spec';
import { DiagramEdge, DiagramNode, DiagramSpec } from '../../diagram/types';
import { DiagramRenderer, RenderArtifact } from '../types';

interface HtmlRendererLabels {
    structure: string;
    relationships: string;
    callouts: string;
    evidence: string;
    data: string;
    x: string;
    y: string;
    series: string;
    sourceLanguage: string;
    outputLanguage: string;
    noStructuralNodes: string;
}

const DEFAULT_LABELS: HtmlRendererLabels = {
    structure: 'Structure',
    relationships: 'Relationships',
    callouts: 'Callouts',
    evidence: 'Evidence',
    data: 'Data',
    x: 'X',
    y: 'Y',
    series: 'Series',
    sourceLanguage: 'Source language',
    outputLanguage: 'Output language',
    noStructuralNodes: 'No structural nodes were generated for this diagram.'
};

const LABELS_BY_LOCALE: Record<string, HtmlRendererLabels> = {
    ar: {
        structure: 'البنية',
        relationships: 'العلاقات',
        callouts: 'الملاحظات',
        evidence: 'الأدلة',
        data: 'البيانات',
        x: 'س',
        y: 'ص',
        series: 'السلسلة',
        sourceLanguage: 'لغة المصدر',
        outputLanguage: 'لغة الإخراج',
        noStructuralNodes: 'لم يتم إنشاء عقد بنيوية لهذا المخطط.'
    },
    de: {
        structure: 'Struktur',
        relationships: 'Beziehungen',
        callouts: 'Hinweise',
        evidence: 'Belege',
        data: 'Daten',
        x: 'X',
        y: 'Y',
        series: 'Reihe',
        sourceLanguage: 'Quellsprache',
        outputLanguage: 'Ausgabesprache',
        noStructuralNodes: 'Für dieses Diagramm wurden keine strukturellen Knoten erzeugt.'
    },
    es: {
        structure: 'Estructura',
        relationships: 'Relaciones',
        callouts: 'Notas destacadas',
        evidence: 'Evidencia',
        data: 'Datos',
        x: 'X',
        y: 'Y',
        series: 'Serie',
        sourceLanguage: 'Idioma de origen',
        outputLanguage: 'Idioma de salida',
        noStructuralNodes: 'No se generaron nodos estructurales para este diagrama.'
    },
    fa: {
        structure: 'ساختار',
        relationships: 'روابط',
        callouts: 'نکته‌ها',
        evidence: 'شواهد',
        data: 'داده‌ها',
        x: 'ایکس',
        y: 'وای',
        series: 'سری',
        sourceLanguage: 'زبان مبدأ',
        outputLanguage: 'زبان خروجی',
        noStructuralNodes: 'برای این نمودار هیچ گره ساختاری تولید نشد.'
    },
    fr: {
        structure: 'Structure',
        relationships: 'Relations',
        callouts: 'Points clés',
        evidence: 'Éléments de preuve',
        data: 'Données',
        x: 'X',
        y: 'Y',
        series: 'Série',
        sourceLanguage: 'Langue source',
        outputLanguage: 'Langue de sortie',
        noStructuralNodes: 'Aucun nœud structurel n’a été généré pour ce diagramme.'
    },
    id: {
        structure: 'Struktur',
        relationships: 'Relasi',
        callouts: 'Sorotan',
        evidence: 'Bukti',
        data: 'Data',
        x: 'X',
        y: 'Y',
        series: 'Seri',
        sourceLanguage: 'Bahasa sumber',
        outputLanguage: 'Bahasa keluaran',
        noStructuralNodes: 'Tidak ada simpul struktural yang dihasilkan untuk diagram ini.'
    },
    it: {
        structure: 'Struttura',
        relationships: 'Relazioni',
        callouts: 'Richiami',
        evidence: 'Evidenze',
        data: 'Dati',
        x: 'X',
        y: 'Y',
        series: 'Serie',
        sourceLanguage: 'Lingua di origine',
        outputLanguage: 'Lingua di output',
        noStructuralNodes: 'Per questo diagramma non sono stati generati nodi strutturali.'
    },
    ja: {
        structure: '構造',
        relationships: '関係',
        callouts: '注記',
        evidence: '根拠',
        data: 'データ',
        x: 'X',
        y: 'Y',
        series: '系列',
        sourceLanguage: '入力言語',
        outputLanguage: '出力言語',
        noStructuralNodes: 'この図では構造ノードが生成されませんでした。'
    },
    ko: {
        structure: '구조',
        relationships: '관계',
        callouts: '주석',
        evidence: '근거',
        data: '데이터',
        x: 'X',
        y: 'Y',
        series: '계열',
        sourceLanguage: '입력 언어',
        outputLanguage: '출력 언어',
        noStructuralNodes: '이 다이어그램에는 구조 노드가 생성되지 않았습니다.'
    },
    nl: {
        structure: 'Structuur',
        relationships: 'Relaties',
        callouts: 'Aandachtspunten',
        evidence: 'Bewijs',
        data: 'Gegevens',
        x: 'X',
        y: 'Y',
        series: 'Reeks',
        sourceLanguage: 'Brontaal',
        outputLanguage: 'Uitvoertaal',
        noStructuralNodes: 'Voor dit diagram zijn geen structurele knooppunten gegenereerd.'
    },
    pl: {
        structure: 'Struktura',
        relationships: 'Relacje',
        callouts: 'Adnotacje',
        evidence: 'Dowody',
        data: 'Dane',
        x: 'X',
        y: 'Y',
        series: 'Seria',
        sourceLanguage: 'Język źródłowy',
        outputLanguage: 'Język wyjściowy',
        noStructuralNodes: 'Dla tego diagramu nie wygenerowano węzłów strukturalnych.'
    },
    pt: {
        structure: 'Estrutura',
        relationships: 'Relações',
        callouts: 'Destaques',
        evidence: 'Evidências',
        data: 'Dados',
        x: 'X',
        y: 'Y',
        series: 'Série',
        sourceLanguage: 'Idioma de origem',
        outputLanguage: 'Idioma de saída',
        noStructuralNodes: 'Nenhum nó estrutural foi gerado para este diagrama.'
    },
    'pt-br': {
        structure: 'Estrutura',
        relationships: 'Relações',
        callouts: 'Destaques',
        evidence: 'Evidências',
        data: 'Dados',
        x: 'X',
        y: 'Y',
        series: 'Série',
        sourceLanguage: 'Idioma de origem',
        outputLanguage: 'Idioma de saída',
        noStructuralNodes: 'Nenhum nó estrutural foi gerado para este diagrama.'
    },
    ru: {
        structure: 'Структура',
        relationships: 'Связи',
        callouts: 'Примечания',
        evidence: 'Подтверждения',
        data: 'Данные',
        x: 'X',
        y: 'Y',
        series: 'Серия',
        sourceLanguage: 'Исходный язык',
        outputLanguage: 'Язык вывода',
        noStructuralNodes: 'Для этой диаграммы не было создано структурных узлов.'
    },
    th: {
        structure: 'โครงสร้าง',
        relationships: 'ความสัมพันธ์',
        callouts: 'จุดสำคัญ',
        evidence: 'หลักฐาน',
        data: 'ข้อมูล',
        x: 'X',
        y: 'Y',
        series: 'ชุดข้อมูล',
        sourceLanguage: 'ภาษาต้นทาง',
        outputLanguage: 'ภาษาผลลัพธ์',
        noStructuralNodes: 'ไม่มีการสร้างโหนดเชิงโครงสร้างสำหรับไดอะแกรมนี้'
    },
    tr: {
        structure: 'Yapı',
        relationships: 'İlişkiler',
        callouts: 'Notlar',
        evidence: 'Kanıtlar',
        data: 'Veri',
        x: 'X',
        y: 'Y',
        series: 'Seri',
        sourceLanguage: 'Kaynak dili',
        outputLanguage: 'Çıktı dili',
        noStructuralNodes: 'Bu diyagram için yapısal düğüm üretilmedi.'
    },
    uk: {
        structure: 'Структура',
        relationships: 'Зв’язки',
        callouts: 'Примітки',
        evidence: 'Підтвердження',
        data: 'Дані',
        x: 'X',
        y: 'Y',
        series: 'Серія',
        sourceLanguage: 'Мова джерела',
        outputLanguage: 'Мова виводу',
        noStructuralNodes: 'Для цієї діаграми не було згенеровано структурних вузлів.'
    },
    vi: {
        structure: 'Cấu trúc',
        relationships: 'Quan hệ',
        callouts: 'Điểm nhấn',
        evidence: 'Bằng chứng',
        data: 'Dữ liệu',
        x: 'X',
        y: 'Y',
        series: 'Chuỗi',
        sourceLanguage: 'Ngôn ngữ nguồn',
        outputLanguage: 'Ngôn ngữ đầu ra',
        noStructuralNodes: 'Không có nút cấu trúc nào được tạo cho sơ đồ này.'
    },
    'zh-cn': {
        structure: '结构',
        relationships: '关系',
        callouts: '提示',
        evidence: '依据',
        data: '数据',
        x: 'X',
        y: 'Y',
        series: '系列',
        sourceLanguage: '源语言',
        outputLanguage: '输出语言',
        noStructuralNodes: '此图形未生成结构节点。'
    },
    'zh-tw': {
        structure: '結構',
        relationships: '關係',
        callouts: '提示',
        evidence: '依據',
        data: '資料',
        x: 'X',
        y: 'Y',
        series: '系列',
        sourceLanguage: '來源語言',
        outputLanguage: '輸出語言',
        noStructuralNodes: '此圖形未產生結構節點。'
    }
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeLocaleKey(locale?: string): string {
    if (!locale?.trim()) {
        return 'en';
    }

    const normalized = locale.trim().replace(/_/g, '-').toLowerCase();
    if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hant')) {
        return 'zh-tw';
    }
    if (normalized.startsWith('zh')) {
        return 'zh-cn';
    }
    if (normalized.startsWith('pt-br')) {
        return 'pt-br';
    }

    return normalized.split('-')[0];
}

function getHtmlRendererLabels(locale?: string): HtmlRendererLabels {
    const key = normalizeLocaleKey(locale);
    return LABELS_BY_LOCALE[key] ?? DEFAULT_LABELS;
}

function renderOptionalText(label: string, value?: string): string {
    if (!value?.trim()) {
        return '';
    }

    return `<p class="notemd-html-renderer-meta"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value.trim())}</p>`;
}

function renderNodeTree(nodes: DiagramNode[], labels: HtmlRendererLabels): string {
    if (nodes.length === 0) {
        return `<p class="notemd-html-renderer-empty">${escapeHtml(labels.noStructuralNodes)}</p>`;
    }

    return `<ul class="notemd-html-renderer-node-tree">${nodes.map(node => renderNode(node, labels)).join('')}</ul>`;
}

function renderNode(node: DiagramNode, labels: HtmlRendererLabels): string {
    const children = node.children?.length ? renderNodeTree(node.children, labels) : '';
    const kind = node.kind?.trim()
        ? `<span class="notemd-html-renderer-chip">${escapeHtml(node.kind.trim())}</span>`
        : '';

    return `<li>
        <div class="notemd-html-renderer-node-row">
            <span class="notemd-html-renderer-node-label">${escapeHtml(node.label)}</span>
            ${kind}
        </div>
        ${children}
    </li>`;
}

function renderEdge(edge: DiagramEdge, labels: Map<string, string>): string {
    const from = labels.get(edge.from) ?? edge.from;
    const to = labels.get(edge.to) ?? edge.to;
    const relation = edge.relation?.trim() ? ` <span class="notemd-html-renderer-chip">${escapeHtml(edge.relation.trim())}</span>` : '';
    const label = edge.label?.trim() ? ` <span class="notemd-html-renderer-edge-label">${escapeHtml(edge.label.trim())}</span>` : '';

    return `<li><strong>${escapeHtml(from)}</strong> → <strong>${escapeHtml(to)}</strong>${relation}${label}</li>`;
}

function renderEdges(edges: DiagramEdge[], labels: Map<string, string>, copy: HtmlRendererLabels): string {
    if (edges.length === 0) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>${escapeHtml(copy.relationships)}</h2>
        <ul class="notemd-html-renderer-list">${edges.map(edge => renderEdge(edge, labels)).join('')}</ul>
    </section>`;
}

function renderCallouts(spec: DiagramSpec, labels: HtmlRendererLabels): string {
    if (!spec.callouts?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>${escapeHtml(labels.callouts)}</h2>
        <ul class="notemd-html-renderer-list">${spec.callouts.map(callout => `
            <li><strong>${escapeHtml(callout.label)}</strong>: ${escapeHtml(callout.detail)}</li>
        `).join('')}</ul>
    </section>`;
}

function renderEvidenceRefs(spec: DiagramSpec, labels: HtmlRendererLabels): string {
    if (!spec.evidenceRefs?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>${escapeHtml(labels.evidence)}</h2>
        <ul class="notemd-html-renderer-list">${spec.evidenceRefs.map(reference => `<li>${escapeHtml(reference)}</li>`).join('')}</ul>
    </section>`;
}

function renderDataSeries(spec: DiagramSpec, labels: HtmlRendererLabels): string {
    if (!spec.dataSeries?.length) {
        return '';
    }

    return `<section class="notemd-html-renderer-section">
        <h2>${escapeHtml(labels.data)}</h2>
        ${spec.dataSeries.map(series => `
            <article class="notemd-html-renderer-series">
                <h3>${escapeHtml(series.label)}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>${escapeHtml(labels.x)}</th>
                            <th>${escapeHtml(labels.y)}</th>
                            <th>${escapeHtml(labels.series)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${series.points.map(point => `
                            <tr>
                                <td>${escapeHtml(String(point.x))}</td>
                                <td>${escapeHtml(String(point.y))}</td>
                                <td>${escapeHtml(point.series ?? series.label)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </article>
        `).join('')}
    </section>`;
}

function collectNodeLabels(nodes: DiagramNode[], labels: Map<string, string> = new Map<string, string>()): Map<string, string> {
    for (const node of nodes) {
        labels.set(node.id, node.label);
        if (node.children?.length) {
            collectNodeLabels(node.children, labels);
        }
    }

    return labels;
}

function renderHtmlDocument(spec: DiagramSpec): string {
    const nodeLabels = collectNodeLabels(spec.nodes);
    const labels = getHtmlRendererLabels(spec.outputLanguage ?? spec.sourceLanguage);

    return `<!DOCTYPE html>
<html lang="${escapeHtml(spec.outputLanguage || 'en')}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
    <title>${escapeHtml(spec.title)}</title>
    <style>
        :root {
            color-scheme: light dark;
            --notemd-html-bg: #f8fafc;
            --notemd-html-panel: rgba(255, 255, 255, 0.96);
            --notemd-html-text: #0f172a;
            --notemd-html-muted: #475569;
            --notemd-html-border: rgba(148, 163, 184, 0.32);
            --notemd-html-chip: rgba(59, 130, 246, 0.14);
            --notemd-html-accent: #2563eb;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --notemd-html-bg: #020617;
                --notemd-html-panel: rgba(15, 23, 42, 0.96);
                --notemd-html-text: #e2e8f0;
                --notemd-html-muted: #94a3b8;
                --notemd-html-border: rgba(148, 163, 184, 0.24);
                --notemd-html-chip: rgba(96, 165, 250, 0.18);
                --notemd-html-accent: #93c5fd;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 24px;
            background: radial-gradient(circle at top, rgba(37, 99, 235, 0.10), transparent 40%), var(--notemd-html-bg);
            color: var(--notemd-html-text);
            font: 15px/1.6 "IBM Plex Sans", "Segoe UI", sans-serif;
        }

        main {
            max-width: 980px;
            margin: 0 auto;
            padding: 24px;
            border: 1px solid var(--notemd-html-border);
            border-radius: 20px;
            background: var(--notemd-html-panel);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
        }

        h1, h2, h3 {
            margin: 0 0 12px;
            line-height: 1.2;
        }

        h1 {
            font-size: 2rem;
        }

        h2 {
            font-size: 1.05rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--notemd-html-muted);
        }

        p {
            margin: 0 0 12px;
        }

        .notemd-html-renderer-hero {
            display: grid;
            gap: 12px;
            margin-bottom: 24px;
        }

        .notemd-html-renderer-intent {
            display: inline-flex;
            width: fit-content;
            padding: 4px 10px;
            border-radius: 999px;
            background: var(--notemd-html-chip);
            color: var(--notemd-html-accent);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .notemd-html-renderer-meta,
        .notemd-html-renderer-empty,
        .notemd-html-renderer-edge-label {
            color: var(--notemd-html-muted);
        }

        .notemd-html-renderer-section {
            margin-top: 28px;
        }

        .notemd-html-renderer-list,
        .notemd-html-renderer-node-tree {
            margin: 0;
            padding-left: 20px;
        }

        .notemd-html-renderer-node-tree {
            display: grid;
            gap: 10px;
        }

        .notemd-html-renderer-node-row {
            display: inline-flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .notemd-html-renderer-node-label {
            font-weight: 600;
        }

        .notemd-html-renderer-chip {
            display: inline-flex;
            padding: 2px 8px;
            border-radius: 999px;
            background: var(--notemd-html-chip);
            color: var(--notemd-html-accent);
            font-size: 0.72rem;
            font-weight: 600;
        }

        .notemd-html-renderer-series {
            margin-top: 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid var(--notemd-html-border);
            border-radius: 12px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.02);
        }

        th,
        td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--notemd-html-border);
            text-align: left;
        }

        th {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--notemd-html-muted);
        }

        tr:last-child td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <main>
        <section class="notemd-html-renderer-hero">
            <span class="notemd-html-renderer-intent">${escapeHtml(spec.intent)}</span>
            <h1>${escapeHtml(spec.title)}</h1>
            ${spec.summary?.trim() ? `<p>${escapeHtml(spec.summary.trim())}</p>` : ''}
            ${renderOptionalText(labels.sourceLanguage, spec.sourceLanguage)}
            ${renderOptionalText(labels.outputLanguage, spec.outputLanguage)}
        </section>

        <section class="notemd-html-renderer-section">
            <h2>${escapeHtml(labels.structure)}</h2>
            ${renderNodeTree(spec.nodes, labels)}
        </section>

        ${renderEdges(spec.edges ?? [], nodeLabels, labels)}
        ${renderDataSeries(spec, labels)}
        ${renderCallouts(spec, labels)}
        ${renderEvidenceRefs(spec, labels)}
    </main>
</body>
</html>`;
}

export class HtmlRenderer implements DiagramRenderer {
    readonly id = 'html';
    readonly target = 'html' as const;

    supports(_spec: DiagramSpec): boolean {
        return true;
    }

    async render(spec: DiagramSpec): Promise<RenderArtifact> {
        assertValidDiagramSpec(spec);

        return {
            target: this.target,
            content: renderHtmlDocument(spec),
            mimeType: 'text/html',
            sourceIntent: spec.intent
        };
    }
}
