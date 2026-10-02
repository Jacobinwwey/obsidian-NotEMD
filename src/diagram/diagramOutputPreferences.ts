import type { NotemdSettings } from '../types';
import { getRenderTargetDescriptor, listRenderTargetDescriptors } from '../rendering/renderTargetCatalog';
import { EXECUTABLE_DIAGRAM_TYPES, getExecutableDiagramType } from './diagramTypeCatalog';
import { applyDiagramTypePreference, resolvePreferredDiagramTypeId } from './diagramPreferenceCompatibility';
import type { DiagramCatalogTypeId, RenderTarget } from './types';

export type DiagramOutputId =
    | 'source:mermaid' | 'source:json-canvas' | 'source:vega-lite'
    | 'source:drawio' | 'source:drawnix' | 'source:circuitikz'
    | 'html-diagram' | 'html-summary' | 'svg' | 'png' | 'pdf';

export interface DiagramOutputPreferences {
    version: number;
    /** Order records explicit selection precedence; inactive requests are retained. */
    requestedOutputs: string[];
}

export interface DiagramOutputDescriptor {
    id: DiagramOutputId;
    group: 'source' | 'diagram' | 'summary';
    sourceTarget?: RenderTarget;
}

export interface DiagramOutputPlan {
    typeId: DiagramCatalogTypeId;
    target: RenderTarget;
    outputs: DiagramOutputId[];
    inactiveOutputs: Array<{ id: string; reason: 'unknown-output' | 'incompatible-type' | 'different-source' }>;
    usedDefaultOutput: boolean;
}

type DiagramOutputSettings = Pick<NotemdSettings,
    'preferredDiagramIntent' | 'preferredDiagramTypeId' | 'preferredDiagramRenderTarget'
    | 'experimentalDiagramCompatibilityMode' | 'diagramOutputPreferences'>;

export function getDiagramSourceOutputId(target: RenderTarget): DiagramOutputId {
    if (target === 'html') return 'html-summary';
    if (target === 'editable-html-svg') return 'html-diagram';
    return `source:${target}`;
}

export const DIAGRAM_OUTPUT_DESCRIPTORS: readonly DiagramOutputDescriptor[] = [
    ...listRenderTargetDescriptors()
        .filter(descriptor => descriptor.target !== 'html' && descriptor.target !== 'editable-html-svg')
        .map(descriptor => ({ id: getDiagramSourceOutputId(descriptor.target), group: 'source' as const, sourceTarget: descriptor.target })),
    { id: 'html-diagram', group: 'diagram' },
    { id: 'svg', group: 'diagram' },
    { id: 'png', group: 'diagram' },
    { id: 'pdf', group: 'diagram' },
    { id: 'html-summary', group: 'summary' }
];

const OUTPUT_BY_ID = new Map<string, DiagramOutputDescriptor>(DIAGRAM_OUTPUT_DESCRIPTORS.map(output => [output.id, output]));

export function isDiagramOutputId(id: unknown): id is DiagramOutputId {
    return typeof id === 'string' && OUTPUT_BY_ID.has(id);
}

/** Read normalization does not write settings or erase safe IDs from newer versions. */
export function migrateDiagramOutputPreferences(settings: Pick<NotemdSettings, 'diagramOutputPreferences' | 'preferredDiagramRenderTarget'>): DiagramOutputPreferences {
    const saved = settings.diagramOutputPreferences;
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        return {
            ...saved,
            version: Number.isInteger(saved.version) ? saved.version : 0,
            requestedOutputs: Array.isArray(saved.requestedOutputs)
                ? [...new Set(saved.requestedOutputs.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 128))] : []
        };
    }
    return {
        version: 1,
        requestedOutputs: settings.preferredDiagramRenderTarget
            ? [getDiagramSourceOutputId(settings.preferredDiagramRenderTarget)]
            : []
    };
}

/** Unknown schemas degrade to the default route; their saved IDs are never executed speculatively. */
export function getExecutableDiagramOutputRequests(preferences: DiagramOutputPreferences): string[] {
    return preferences.version === 1 ? [...preferences.requestedOutputs] : [`unsupported-preferences-version:${preferences.version}`];
}

function targetProducesOutput(typeId: DiagramCatalogTypeId, target: RenderTarget, id: string): boolean {
    const output = OUTPUT_BY_ID.get(id);
    if (!output) return false;
    if (output.sourceTarget) return output.sourceTarget === target;
    if (id === 'html-summary') return getExecutableDiagramType(typeId).compatibleTargets.includes('html');
    const formats = getRenderTargetDescriptor(target).exportFormats;
    if (id === 'html-diagram') return formats.includes('svg');
    return formats.some(format => format === id);
}

export function resolveDiagramOutputPlan(
    typeId: DiagramCatalogTypeId,
    requestedOutputs: readonly string[],
    preferredTarget?: RenderTarget
): DiagramOutputPlan {
    const type = getExecutableDiagramType(typeId);
    const requests = [...new Set(requestedOutputs)];
    const nativeTarget = requests.slice().reverse()
        .map(id => OUTPUT_BY_ID.get(id)?.sourceTarget)
        .find((target): target is RenderTarget => Boolean(target && type.compatibleTargets.includes(target)));
    const candidates = [...new Set([preferredTarget, type.defaultTarget, ...type.compatibleTargets])]
        .filter((target): target is RenderTarget => Boolean(target && type.compatibleTargets.includes(target)));
    // Count complete requested deliveries, preserving renderer affinity only when coverage ties.
    const target = nativeTarget ?? candidates.reduce((best, candidate) =>
        requests.filter(id => targetProducesOutput(typeId, candidate, id)).length
            > requests.filter(id => targetProducesOutput(typeId, best, id)).length ? candidate : best
    );
    const outputs = requests.filter((id): id is DiagramOutputId => targetProducesOutput(typeId, target, id));
    const inactiveOutputs: DiagramOutputPlan['inactiveOutputs'] = requests
        .filter(id => !outputs.includes(id as DiagramOutputId))
        .map(id => {
            const descriptor = OUTPUT_BY_ID.get(id);
            return {
                id,
                reason: !descriptor ? 'unknown-output'
                    : descriptor.sourceTarget && type.compatibleTargets.includes(descriptor.sourceTarget)
                        ? 'different-source' : 'incompatible-type'
            };
        });
    return {
        typeId,
        target,
        outputs: outputs.length ? outputs : [getDiagramSourceOutputId(target)],
        inactiveOutputs,
        usedDefaultOutput: outputs.length === 0
    };
}

function resolveSelectionType(settings: DiagramOutputSettings): DiagramCatalogTypeId {
    return resolvePreferredDiagramTypeId(settings)
        ?? EXECUTABLE_DIAGRAM_TYPES.find(type => type.defaultTarget === settings.preferredDiagramRenderTarget)?.id
        ?? 'mermaid-mindmap';
}

export function applyDiagramTypeOutputPreference(settings: DiagramOutputSettings, typeId: DiagramCatalogTypeId | undefined): void {
    const requested = migrateDiagramOutputPreferences(settings);
    applyDiagramTypePreference(settings, typeId);
    settings.diagramOutputPreferences = requested;
    if (typeId) {
        settings.preferredDiagramRenderTarget = resolveDiagramOutputPlan(typeId, getExecutableDiagramOutputRequests(requested), settings.preferredDiagramRenderTarget).target;
    }
}

export function addDiagramOutputPreference(settings: DiagramOutputSettings, id: DiagramOutputId): void {
    if (!isDiagramOutputId(id)) throw new Error(`Unsupported diagram output: ${String(id)}`);
    const preferences = migrateDiagramOutputPreferences(settings);
    const requested = preferences.requestedOutputs.filter(output => output !== id);
    requested.push(id);
    const currentTypeId = resolveSelectionType(settings);
    let typeId = currentTypeId;
    if (!resolveDiagramOutputPlan(typeId, [id]).outputs.includes(id)) {
        const sourceTarget = OUTPUT_BY_ID.get(id)?.sourceTarget;
        const candidates = EXECUTABLE_DIAGRAM_TYPES.filter(type => resolveDiagramOutputPlan(type.id, [id]).outputs.includes(id));
        const compatible = candidates.find(type => type.defaultTarget === sourceTarget) ?? candidates[0];
        if (!compatible) throw new Error(`No diagram type supports output: ${id}`);
        typeId = compatible.id;
    }
    const sourceTarget = OUTPUT_BY_ID.get(id)?.sourceTarget;
    if (typeId !== currentTypeId || sourceTarget === 'drawnix' || sourceTarget === 'circuitikz') {
        applyDiagramTypePreference(settings, typeId);
    }
    settings.diagramOutputPreferences = { ...preferences, requestedOutputs: requested };
    settings.preferredDiagramRenderTarget = resolveDiagramOutputPlan(typeId, getExecutableDiagramOutputRequests(settings.diagramOutputPreferences), sourceTarget ?? settings.preferredDiagramRenderTarget).target;
    if (settings.preferredDiagramRenderTarget !== 'mermaid') settings.experimentalDiagramCompatibilityMode = 'best-fit';
}

export function removeDiagramOutputPreference(settings: DiagramOutputSettings, id: string): void {
    const preferences = migrateDiagramOutputPreferences(settings);
    const requested = preferences.requestedOutputs.filter(output => output !== id);
    settings.diagramOutputPreferences = { ...preferences, requestedOutputs: requested };
    settings.preferredDiagramRenderTarget = resolveDiagramOutputPlan(resolveSelectionType(settings), getExecutableDiagramOutputRequests(settings.diagramOutputPreferences), settings.preferredDiagramRenderTarget).target;
}

export interface DiagramOutputChoice {
    id: string;
    selected: boolean;
    status: 'supported' | 'adjustable' | 'unsupported';
}

export function getDiagramOutputChoices(settings: DiagramOutputSettings): DiagramOutputChoice[] {
    const preferences = migrateDiagramOutputPreferences(settings);
    const typeId = resolveSelectionType(settings);
    const plan = resolveDiagramOutputPlan(typeId, getExecutableDiagramOutputRequests(preferences), settings.preferredDiagramRenderTarget);
    const ids = [...new Set([...DIAGRAM_OUTPUT_DESCRIPTORS.map(output => output.id), ...preferences.requestedOutputs])];
    const rank = { supported: 0, adjustable: 1, unsupported: 2 };
    return ids.map((id): DiagramOutputChoice => ({
        id,
        selected: preferences.requestedOutputs.includes(id),
        status: targetProducesOutput(typeId, plan.target, id) ? 'supported'
            : isDiagramOutputId(id) ? 'adjustable' : 'unsupported'
    })).sort((left, right) => rank[left.status] - rank[right.status]);
}

export function getDiagramTypeOutputChoices(settings: DiagramOutputSettings): Array<{ typeId: DiagramCatalogTypeId; status: 'supported' | 'adjustable' }> {
    const requested = getExecutableDiagramOutputRequests(migrateDiagramOutputPreferences(settings));
    return EXECUTABLE_DIAGRAM_TYPES.map(type => ({
        typeId: type.id,
        status: resolveDiagramOutputPlan(type.id, requested, settings.preferredDiagramRenderTarget).inactiveOutputs.length === 0
            ? 'supported' as const : 'adjustable' as const
    })).sort((left, right) => Number(left.status === 'adjustable') - Number(right.status === 'adjustable'));
}
