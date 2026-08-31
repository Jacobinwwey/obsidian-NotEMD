import {
    getExecutableDiagramExamples
} from '../src/diagram/examples/diagramExampleCatalog';
import {
    getExecutableDiagramType
} from '../src/diagram/diagramTypeCatalog';
import { getRenderTargetDescriptor } from '../src/rendering/renderTargetCatalog';

export interface DiagramExampleSummary {
    typeId: string;
    fixtureId: string;
    title: string;
    titleZh: string;
    selectionRationale: string;
    selectionRationaleZh: string;
    sourceIntent: string;
    payloadKind: string;
    target: string;
    targetExtension: string;
    semanticFacts: string[];
    readingCues: string[];
    readingCuesZh: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatScalar(value: unknown): string | null {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return null;
}

function shorten(value: string): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length <= 220 ? normalized : `${normalized.slice(0, 217)}...`;
}

function collectSemanticFacts(spec: unknown): string[] {
    const facts: string[] = [];
    const priorityFacts: string[] = [];
    const visited = new Set<unknown>();
    const ignoredKeys = new Set(['schemaVersion', 'intent', 'title', 'summary', 'layoutHints', 'style']);

    const add = (value: string, priority = false): void => {
        const fact = shorten(value);
        const target = priority ? priorityFacts : facts;
        if (fact && !target.includes(fact) && !facts.includes(fact) && !priorityFacts.includes(fact)) {
            target.push(fact);
        }
    };

    const endpoint = (value: unknown): string | null => {
        const scalar = formatScalar(value);
        if (scalar !== null) {
            return scalar;
        }
        if (!isRecord(value)) {
            return null;
        }
        const laneId = formatScalar(value.laneId);
        const stepId = formatScalar(value.stepId);
        if (laneId !== null && stepId !== null) {
            return `${laneId}/${stepId}`;
        }
        const id = formatScalar(value.id);
        return id;
    };

    const walk = (value: unknown, path: string): void => {
        const scalar = formatScalar(value);
        if (scalar !== null) {
            add(`${path}: ${scalar}`);
            return;
        }
        if (Array.isArray(value)) {
            const scalarValues = value.map(formatScalar);
            if (value.length > 0 && scalarValues.every((entry): entry is string => entry !== null)) {
                add(`${path}: ${scalarValues.join(', ')}`);
                return;
            }
            value.forEach((entry, index) => walk(entry, `${path}[${index + 1}]`));
            return;
        }
        if (!isRecord(value) || visited.has(value)) {
            return;
        }
        visited.add(value);

        if (/\[\d+\]$/.test(path)) {
            add(`${path}: ${JSON.stringify(value)}`, true);
            return;
        }

        const from = endpoint(value.from);
        const to = endpoint(value.to);
        if (from !== null && to !== null) {
            const label = formatScalar(value.label);
            add(`${path}: ${from} -> ${to}${label ? ` (${label})` : ''}`, true);
        }

        const id = formatScalar(value.id);
        const label = formatScalar(value.label);
        if (id !== null && label !== null) {
            add(`${path}: ${id} (${label})`);
        }

        const parentId = formatScalar(value.parentId);
        if (id !== null && parentId !== null) {
            add(`${path}: ${id} -> ${parentId} (parent)`, true);
        }

        const nextStepId = formatScalar(value.nextStepId);
        if (id !== null && nextStepId !== null) {
            add(`${path}: ${id} -> ${nextStepId} (next)`, true);
        }

        for (const [key, child] of Object.entries(value)) {
            if (ignoredKeys.has(key) || (key === 'from' || key === 'to' || key === 'label') && (from !== null || to !== null || id !== null)) {
                continue;
            }
            walk(child, path ? `${path}.${key}` : key);
        }
    };

    walk(spec, 'spec');
    const combined = [...priorityFacts, ...facts].slice(0, 24);
    return combined.length > 0 ? combined : ['spec: Preserve the named entities and relationships from this scenario.'];
}

const EXAMPLE_COPY_ZH: Record<string, {
    title: string;
    rationale: string;
    cues: string[];
}> = {
    'mermaid-mindmap': { title: '研究主题', rationale: '用于展示读者按树形查看的单一主题层级。', cues: ['确认根主题与子主题层级清晰。', '确认细节节点仍属于正确的主题分支。'] },
    'drawnix-knowledge-map': { title: '图形交付架构', rationale: '当层级和跨分支关系都必须保持可编辑时使用。', cues: ['确认文件名根节点保留。', '确认跨分支关系没有被静默删除。'] },
    flowchart: { title: '发布决策', rationale: '用于包含明确决策点的有序流程。', cues: ['确认决策节点和结果边方向正确。', '确认发布路径保留通过条件。'] },
    sequence: { title: 'Artifact 请求', rationale: '当独立参与者之间的交互顺序最重要时使用。', cues: ['确认参与者顺序保持不变。', '确认请求、渲染和返回方向清楚。'] },
    state: { title: 'Artifact 生命周期', rationale: '用于展示系统在命名状态之间的变化。', cues: ['确认状态节点完整。', '确认转换标签与方向表达生命周期。'] },
    class: { title: '图形域', rationale: '用于表达类型级别的所有权和关联。', cues: ['确认类型关系保持。', '确认关联标签没有被误读成执行顺序。'] },
    'entity-relationship': { title: 'Artifact schema', rationale: '当实体属性和基数关系承载主要解释时使用。', cues: ['确认实体及属性仍成组显示。', '确认 one-to-many 等基数关系可读。'] },
    'canvas-map': { title: '图形域分组', rationale: '用于相关领域的空间概览。', cues: ['确认相关概念形成空间分组。', '确认连接表达领域之间的关系。'] },
    'data-chart': { title: '渲染趋势', rationale: '仅在源文档提供适合比较的数值时使用。', cues: ['确认数值没有被重新编造。', '确认共享坐标轴支持趋势比较。'] },
    'radar-chart': { title: '能力画像', rationale: '当多个可比较维度构成有界多轴画像时使用。', cues: ['确认每个轴的范围一致。', '确认不同画像的维度对应关系一致。'] },
    'org-chart': { title: '支持责任归属', rationale: '当读者需要责任人、汇报路径和覆盖缺口时使用。', cues: ['确认责任层级从入口到团队可追踪。', '确认 planned 等覆盖状态清楚。'] },
    timeline: { title: '交付路线图', rationale: '用于日期里程碑，顺序和时间是主要语义。', cues: ['确认里程碑按日期排序。', '确认每个事件的细节仍归属于正确日期。'] },
    swimlane: { title: '发布交接', rationale: '当多个负责人在流程中彼此交接工作时使用。', cues: ['确认每个步骤位于正确泳道。', '确认跨泳道交接方向可追踪。'] },
    quadrant: { title: '优先级矩阵', rationale: '用于带有可比较项目位置的有界双轴优先级。', cues: ['确认横轴和纵轴方向清晰。', '确认项目位置对应源文档的判断。'] },
    circuit: { title: 'CMOS 反相器', rationale: '用于由受支持电路模板表达的电气拓扑。', cues: ['确认 VDD、GND、vin 和 vout 网络保留。', '确认 PMOS 与 NMOS 的连接没有改变。'] },
    'bar-chart': { title: '功能采用率', rationale: '用于比较离散类别，每类提供一个数值。', cues: ['确认每个类别对应一个数值。', '确认柱高排序与源数据一致。'] },
    'line-chart': { title: '渲染时间趋势', rationale: '用于有序时间或版本趋势。', cues: ['确认横轴顺序保持。', '确认折线表达连续趋势而非类别排名。'] },
    'scatter-plot': { title: '质量与延迟', rationale: '用于关注相关性或离群点的成对数值观测。', cues: ['确认每个点保留一对数值。', '确认离群点没有被隐藏。'] },
    architecture: { title: '平台架构', rationale: '用于按信任边界或系统边界分组的有界组件。', cues: ['确认组件位于正确边界。', '确认拓扑连接方向和焦点组件清晰。'] },
    'current-state': { title: '旧系统当前状态', rationale: '用于暴露现状景观、手工交接和瓶颈。', cues: ['确认旧系统和阶段边界完整。', '确认手工交接与瓶颈位置可见。'] },
    'integration-topology': { title: '集成拓扑', rationale: '当源系统和消费者通过协议连接到共享平台时使用。', cues: ['确认源系统、平台和消费者分区清楚。', '确认协议标签落在对应连接上。'] },
    'data-flow': { title: '按角色分区的数据流', rationale: '用于每个角色拥有阶段和数据交接的带类型管线。', cues: ['确认每个阶段属于正确角色。', '确认 payload 类型和交接方向清楚。'] },
    'access-matrix': { title: '平台访问矩阵', rationale: '用于审计角色可以对平台组件执行哪些操作。', cues: ['确认每个角色与组件都有权限单元。', '确认关键权限单元被突出显示。'] },
    gantt: { title: '发布计划', rationale: '用于有界交付时间线上的任务重叠和里程碑。', cues: ['确认任务条位于正确阶段。', '确认里程碑与任务时间位置一致。'] },
    'layer-stack': { title: '平台分层', rationale: '用于应用、服务和存储等有序抽象层级。', cues: ['确认层级顺序从上到下稳定。', '确认焦点层仍处于正确抽象边界。'] },
    venn: { title: '平台适配度', rationale: '当解释依赖两个或三个显式集合的重叠时使用。', cues: ['确认集合名称和边界清楚。', '确认交集只包含源事实支持的内容。'] },
    'ranked-funnel': { title: '发布漏斗', rationale: '用于有界分段的排名层级或转化流失。', cues: ['确认阶段顺序保持。', '确认每个漏斗段表达排名或转化关系。'] },
    loop: { title: '运行闭环', rationale: '用于各站点把持久状态写回同一中心的强化循环。', cues: ['确认循环方向首尾闭合。', '确认共享状态中心与各站点关系清楚。'] },
    nested: { title: '范围级联', rationale: '用于策略、工作区和 Artifact 等包含边界。', cues: ['确认范围从外层向内层收窄。', '确认焦点范围仍位于正确父边界内。'] },
    tree: { title: '责任树', rationale: '用于单根父子层级。', cues: ['确认只有一个根节点。', '确认每个子节点拥有正确父节点。'] },
    process: { title: '发布流程', rationale: '用于交接比 payload 类型更重要的分阶段多角色流程。', cues: ['确认每个角色的步骤完整。', '确认交接边连接相邻责任阶段。'] },
    medallion: { title: '数据质量层', rationale: '用于具有明确晋级语义的有序数据质量层。', cues: ['确认质量层按晋级顺序排列。', '确认焦点层的质量含义明确。'] },
    'high-level': { title: '高层平台', rationale: '用于在深入拓扑细节前查看有界端到端概览。', cues: ['确认体验、服务、数据和治理边界齐全。', '确认概览保持端到端关系而不过度展开。'] }
};

function getChineseCopy(typeId: string, title: string, rationale: string): { title: string; rationale: string; cues: string[] } {
    const copy = EXAMPLE_COPY_ZH[typeId];
    if (!copy) {
        throw new Error(`Missing Simplified Chinese diagram example copy for "${typeId}".`);
    }
    return copy;
}

function buildReadingCues(typeId: string, target: string, facts: string[]): string[] {
    return [
        `Confirm that the ${typeId} output preserves the source facts and relationships.`,
        `Check that the visual structure matches the declared ${target} render target.`,
        facts[0] ? `Inspect this evidence first: ${facts[0]}` : 'Inspect the focal relationship before optional detail.'
    ];
}

export function getExecutableDiagramExampleSummaries(): readonly DiagramExampleSummary[] {
    return getExecutableDiagramExamples().map(example => {
        const type = getExecutableDiagramType(example.typeId);
        const target = getRenderTargetDescriptor(type.defaultTarget);
        const facts = collectSemanticFacts(example.spec);
        const copy = getChineseCopy(example.typeId, example.title, example.selectionRationale);
        return {
            typeId: example.typeId,
            fixtureId: example.fixtureId,
            title: example.title,
            titleZh: copy.title,
            selectionRationale: example.selectionRationale,
            selectionRationaleZh: copy.rationale,
            sourceIntent: example.sourceIntent,
            payloadKind: type.payloadKind,
            target: type.defaultTarget,
            targetExtension: target.vaultExtension,
            semanticFacts: facts,
            readingCues: buildReadingCues(example.typeId, type.defaultTarget, facts),
            readingCuesZh: copy.cues
        };
    });
}
