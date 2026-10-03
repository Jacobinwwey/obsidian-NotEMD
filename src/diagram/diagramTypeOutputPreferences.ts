import type { NotemdSettings } from '../types';
import type { DiagramCatalogTypeId } from './types';
import { EXECUTABLE_DIAGRAM_TYPES, getExecutableDiagramType } from './diagramTypeCatalog';
import { resolvePreferredDiagramTypeId } from './diagramPreferenceCompatibility';
import { getDiagramSourceOutputId, getExecutableDiagramOutputRequests, migrateDiagramOutputPreferences } from './diagramOutputPreferences';

export interface DiagramTypeOutputPreferences {
    version: number;
    selectedTypeIds: string[];
    outputsByType: Record<string, string[]>;
}

type TypeOutputSettings = Pick<NotemdSettings, 'diagramTypeOutputPreferences' | 'diagramOutputPreferences' | 'preferredDiagramTypeId' | 'preferredDiagramIntent' | 'preferredDiagramRenderTarget'>;
export interface DiagramGenerationSelection { typeId: DiagramCatalogTypeId; requestedOutputs: string[] }
const knownTypes = new Set<string>(EXECUTABLE_DIAGRAM_TYPES.map(type => type.id));
const safeId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9:-]{0,127}$/.test(id);
const readIds = (ids: unknown): string[] => Array.isArray(ids) ? [...new Set(ids.filter(safeId))] : [];

function legacyPreferences(settings: TypeOutputSettings): DiagramTypeOutputPreferences {
    const typeId = resolvePreferredDiagramTypeId(settings);
    return { version: 1, selectedTypeIds: typeId ? [typeId] : [], outputsByType: typeId
        ? { [typeId]: getExecutableDiagramOutputRequests(migrateDiagramOutputPreferences(settings)) } : {} };
}

/** Normalize at the settings boundary; unknown schemas remain stored but are never interpreted. */
export function migrateDiagramTypeOutputPreferences(settings: TypeOutputSettings): DiagramTypeOutputPreferences {
    const saved = settings.diagramTypeOutputPreferences;
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return legacyPreferences(settings);
    const outputs = saved.outputsByType;
    return {
        ...saved,
        version: Number.isInteger(saved.version) ? saved.version : 0,
        selectedTypeIds: readIds(saved.selectedTypeIds),
        outputsByType: Object.fromEntries(outputs && typeof outputs === 'object' && !Array.isArray(outputs)
            ? Object.entries(outputs).filter(([id]) => safeId(id)).map(([id, requests]) => [id, readIds(requests)]) : [])
    };
}

export function getDiagramTypeOutputRequests(settings: TypeOutputSettings, typeId: DiagramCatalogTypeId): string[] {
    const preferences = migrateDiagramTypeOutputPreferences(settings);
    const effective = preferences.version === 1 ? preferences : legacyPreferences(settings);
    return [...(effective.outputsByType[typeId] ?? [getDiagramSourceOutputId(getExecutableDiagramType(typeId).defaultTarget)])];
}

export function getDiagramGenerationSelections(settings: TypeOutputSettings): DiagramGenerationSelection[] {
    const preferences = migrateDiagramTypeOutputPreferences(settings);
    const effective = preferences.version === 1 ? preferences : legacyPreferences(settings);
    return effective.selectedTypeIds.filter((id): id is DiagramCatalogTypeId => knownTypes.has(id))
        .map(typeId => ({ typeId, requestedOutputs: getDiagramTypeOutputRequests(settings, typeId) }));
}

function editablePreferences(settings: TypeOutputSettings): DiagramTypeOutputPreferences {
    const preferences = migrateDiagramTypeOutputPreferences(settings);
    if (preferences.version !== 1) throw new Error('Cannot edit diagram preferences from an unsupported version.');
    return preferences;
}

export function selectDiagramGenerationType(settings: TypeOutputSettings, typeId: DiagramCatalogTypeId): void {
    getExecutableDiagramType(typeId);
    const preferences = editablePreferences(settings);
    settings.diagramTypeOutputPreferences = { ...preferences, selectedTypeIds: [...new Set([...preferences.selectedTypeIds, typeId])] };
}

export function deselectDiagramGenerationType(settings: TypeOutputSettings, typeId: string): void {
    const preferences = editablePreferences(settings);
    settings.diagramTypeOutputPreferences = { ...preferences, selectedTypeIds: preferences.selectedTypeIds.filter(id => id !== typeId) };
}

export function setDiagramTypeOutputRequests(settings: TypeOutputSettings, typeId: DiagramCatalogTypeId, requestedOutputs: readonly string[]): void {
    getExecutableDiagramType(typeId);
    const preferences = editablePreferences(settings);
    settings.diagramTypeOutputPreferences = { ...preferences, outputsByType: { ...preferences.outputsByType, [typeId]: readIds(requestedOutputs) } };
}
