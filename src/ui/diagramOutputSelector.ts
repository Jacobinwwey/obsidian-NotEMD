import type { NotemdSettings } from '../types';
import { App, Scope } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import { getDiagramOutputChoicesForType, resolveDiagramOutputPlan } from '../diagram/diagramOutputPreferences';
import { resolveDiagramTypeId } from '../diagram/diagramPreferenceCompatibility';
import { getExecutableDiagramTypeOptions } from './diagramCatalogLabels';
import { EXECUTABLE_DIAGRAM_TYPES } from '../diagram/diagramTypeCatalog';
import type { DiagramCatalogTypeId } from '../diagram/types';
import { deselectDiagramGenerationType, getDiagramGenerationSelections, getDiagramTypeOutputRequests, migrateDiagramTypeOutputPreferences, selectDiagramGenerationType, setDiagramTypeOutputRequests } from '../diagram/diagramTypeOutputPreferences';

export interface DiagramOutputSelectorOptions {
    app: App;
    typeParent: HTMLElement;
    outputParent: HTMLElement;
    getSettings: () => NotemdSettings;
    saveSettings: () => Promise<void>;
    onPreviewType: (typeId: DiagramCatalogTypeId | undefined) => void;
    getPreviewElement?: () => HTMLElement | undefined;
}
export interface DiagramOutputSelectorController {
    refresh: () => void;
    getEditingType: () => DiagramCatalogTypeId | undefined;
    destroy: () => void;
}
export function getDiagramOutputLabel(id: string, settings: Pick<NotemdSettings, 'uiLocale'>): string {
    const strings = getI18nStrings(settings);
    const diagram = strings.settings.developer.experimentalDiagramPipeline;
    const labels: Record<string, string> = {
        'source:mermaid': diagram.renderTargetMermaid, 'source:json-canvas': diagram.renderTargetJsonCanvas,
        'source:vega-lite': diagram.renderTargetVegaLite, 'source:drawio': diagram.renderTargetDrawio,
        'source:drawnix': diagram.renderTargetDrawnix, 'source:circuitikz': diagram.renderTargetCircuitikz,
        'html-diagram': strings.diagramOutputs.htmlDiagram, 'html-summary': strings.diagramOutputs.htmlSummary,
        svg: 'SVG', png: 'PNG', pdf: 'PDF'
    };
    return labels[id] ?? id;
}

/** Own the portal, Obsidian shortcut scope and focus for one complete popup lifetime. */
function createChoicePopup(app: App, parent: HTMLElement, attribute: string, minimumWidth: number, onOpen: () => void, onClose: () => void) {
    parent.addClass('notemd-diagram-output-control');
    const controlId = `${attribute}-${Math.random().toString(36).slice(2)}`;
    const trigger = parent.createEl('button', { cls: 'notemd-diagram-output-trigger', attr: {
        type: 'button', [`data-${attribute}-trigger`]: '', 'aria-expanded': 'false', 'aria-controls': controlId
    } });
    const text = trigger.createEl('span', { cls: 'notemd-diagram-output-selection' });
    const count = trigger.createEl('span', { cls: 'notemd-diagram-output-count', attr: { 'aria-hidden': 'true' } });
    trigger.createEl('span', { cls: 'notemd-diagram-output-chevron', attr: { 'aria-hidden': 'true' } });
    const popup = parent.createDiv({ cls: 'notemd-diagram-output-popup', attr: { id: controlId, [`data-${attribute}-popup`]: '', role: 'group' } });
    popup.hidden = true;
    let opened = false;
    let destroyed = false;
    const scope = new Scope();
    scope.register([], 'Escape', () => { close(); trigger.focus(); return false; });
    function position(): void {
        if (!opened) return;
        const rect = trigger.getBoundingClientRect();
        const view = trigger.ownerDocument.defaultView!;
        const margin = 8;
        const width = Math.min(Math.max(rect.width, minimumWidth), view.innerWidth - margin * 2);
        const below = view.innerHeight - rect.bottom - margin * 2;
        const above = rect.top - margin * 2;
        const height = Math.min(380, Math.max(below, above));
        popup.style.width = `${width}px`;
        popup.style.maxHeight = `${height}px`;
        popup.style.left = `${Math.max(margin, Math.min(rect.left, view.innerWidth - width - margin))}px`;
        popup.style.top = `${below >= Math.min(380, popup.scrollHeight) || below >= above ? rect.bottom + margin : Math.max(margin, rect.top - margin - Math.min(height, popup.scrollHeight))}px`;
    }
    function close(): void {
        if (!opened) return;
        opened = false;
        app.keymap.popScope(scope);
        popup.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        const owner = trigger.ownerDocument;
        owner.removeEventListener('pointerdown', dismissOutside);
        owner.removeEventListener('focusin', dismissOutside);
        owner.removeEventListener('scroll', position, true);
        owner.defaultView?.removeEventListener('resize', position);
        parent.appendChild(popup);
        onClose();
    }
    function dismissOutside(event: Event): void {
        if (!popup.contains(event.target as Node) && !trigger.contains(event.target as Node)) close();
    }
    function open(): void {
        if (destroyed || opened) return;
        opened = true;
        app.keymap.pushScope(scope);
        const owner = trigger.ownerDocument;
        owner.body.appendChild(popup);
        popup.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        onOpen();
        position();
        owner.addEventListener('pointerdown', dismissOutside);
        owner.addEventListener('focusin', dismissOutside);
        owner.addEventListener('scroll', position, true);
        owner.defaultView?.addEventListener('resize', position);
        popup.querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled)')?.focus({ preventScroll: true });
    }
    trigger.onclick = () => opened ? close() : open();
    trigger.onkeydown = event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); open();
            if (event.key === 'ArrowUp') Array.from(popup.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled)')).at(-1)?.focus();
        }
    };
    popup.onkeydown = event => {
        if (event.key === 'Escape') {
            event.preventDefault(); event.stopPropagation(); close(); trigger.focus();
        } else if (event.key === 'Tab') {
            close(); trigger.focus();
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const items = Array.from(popup.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled)'));
            const current = items.indexOf(trigger.ownerDocument.activeElement as HTMLElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
    };
    return { trigger, text, count, popup, open, close, position, destroy() { close(); destroyed = true; popup.remove(); trigger.remove(); } };
}

/** Selection, editing and temporary preview are deliberately separate states. */
export function renderDiagramOutputSelector(options: DiagramOutputSelectorOptions): DiagramOutputSelectorController {
    let editingType = getDiagramGenerationSelections(options.getSettings())[0]?.typeId;
    let previewPlaceholder: HTMLElement | undefined;
    let mountedPreview: HTMLElement | undefined;
    const typeMenu = createChoicePopup(options.app, options.typeParent, 'diagram-type', options.getPreviewElement ? 640 : 280, () => {
        const preview = options.getPreviewElement?.();
        if (!preview?.parentElement) return;
        previewPlaceholder = preview.ownerDocument.createElement('div');
        previewPlaceholder.setAttribute('aria-hidden', 'true');
        previewPlaceholder.style.height = `${preview.getBoundingClientRect().height}px`;
        preview.before(previewPlaceholder);
        mountedPreview = preview;
        typeMenu.popup.appendChild(preview);
        typeMenu.popup.classList.add('notemd-diagram-type-popup');
        options.onPreviewType(editingType);
    }, () => {
        if (mountedPreview && previewPlaceholder) previewPlaceholder.replaceWith(mountedPreview);
        mountedPreview = undefined;
        previewPlaceholder = undefined;
        typeMenu.popup.classList.remove('notemd-diagram-type-popup');
        options.onPreviewType(editingType);
    });
    const outputMenu = createChoicePopup(options.app, options.outputParent, 'diagram-output', 280, () => undefined, () => undefined);
    const typeRows = typeMenu.popup.createDiv({ cls: 'notemd-diagram-type-choices' });
    const outputs = outputMenu.popup.createDiv({ cls: 'notemd-diagram-output-choices' });
    const summary = outputMenu.popup.createEl('p', { cls: 'notemd-diagram-output-summary', attr: { 'aria-live': 'polite', 'data-diagram-output-summary': '' } });
    const saveError = options.outputParent.createEl('p', { cls: 'notemd-diagram-output-error', attr: { role: 'alert' } });
    let pendingSave = Promise.resolve();
    let destroyed = false;
    typeMenu.popup.onpointerleave = () => options.onPreviewType(editingType);
    function refresh(): void {
        if (destroyed) return;
        const settings = options.getSettings();
        const strings = getI18nStrings(settings);
        const copy = strings.diagramOutputs;
        const preferences = migrateDiagramTypeOutputPreferences(settings);
        const selected = getDiagramGenerationSelections(settings);
        const labels = getExecutableDiagramTypeOptions(strings.settings.developer.experimentalDiagramPipeline);
        const typeLabel = (id: string) => labels.find(item => resolveDiagramTypeId(item.value) === id)?.label ?? id;
        const active = options.typeParent.ownerDocument.activeElement;
        const focusAttribute = ['data-diagram-type-check', 'data-diagram-type-edit', 'data-diagram-output'].find(name => active?.hasAttribute(name));
        const focusId = focusAttribute ? active?.getAttribute(focusAttribute) : undefined;
        const typeScroll = typeMenu.popup.scrollTop;
        const outputScroll = outputMenu.popup.scrollTop;
        typeRows.empty();
        typeMenu.trigger.setAttribute('aria-label', copy.typesName);
        typeMenu.popup.setAttribute('aria-label', copy.typesName);
        typeMenu.text.setText(selected.map(item => typeLabel(item.typeId)).join(', ') || copy.autoSelection);
        typeMenu.count.setText(selected.length > 1 ? String(selected.length) : '');
        typeMenu.trigger.title = selected.map(item => typeLabel(item.typeId)).join(', ') || copy.autoSelection;
        for (const type of EXECUTABLE_DIAGRAM_TYPES) {
            const row = typeRows.createDiv({ cls: 'notemd-diagram-type-choice', attr: { 'data-editing': String(editingType === type.id) } });
            const label = row.createEl('label', { cls: 'notemd-diagram-type-check' });
            const input = label.createEl('input', { type: 'checkbox', attr: { 'data-diagram-type-check': type.id, 'aria-label': typeLabel(type.id) } });
            input.checked = selected.some(item => item.typeId === type.id);
            input.disabled = preferences.version !== 1;
            const edit = row.createEl('button', { cls: 'notemd-diagram-type-edit', attr: { type: 'button', 'data-diagram-type-edit': type.id } });
            edit.createEl('span', { text: typeLabel(type.id) });
            edit.createEl('span', { text: getDiagramTypeOutputRequests(settings, type.id).map(id => getDiagramOutputLabel(id, settings)).join(' · ') || copy.automatic, cls: 'notemd-diagram-type-formats' });
            row.onpointerenter = () => options.onPreviewType(type.id);
            row.addEventListener('focusin', () => options.onPreviewType(type.id));
            input.onchange = () => commit(() => {
                editingType = type.id;
                if (input.checked) selectDiagramGenerationType(options.getSettings(), type.id);
                else deselectDiagramGenerationType(options.getSettings(), type.id);
            });
            edit.onclick = () => {
                editingType = type.id;
                if (!input.checked && preferences.version === 1) void commit(() => selectDiagramGenerationType(options.getSettings(), type.id));
                typeMenu.close(); refresh(); options.onPreviewType(type.id); outputMenu.open();
            };
        }
        for (const id of preferences.selectedTypeIds.filter(id => !EXECUTABLE_DIAGRAM_TYPES.some(type => type.id === id))) {
            const label = typeRows.createEl('label', { cls: 'notemd-diagram-output-choice', text: id });
            const input = label.createEl('input', { type: 'checkbox', attr: { 'aria-label': id, 'data-diagram-type-check': id } });
            input.checked = true;
            input.disabled = preferences.version !== 1;
            input.onchange = () => commit(() => deselectDiagramGenerationType(options.getSettings(), id));
        }
        const typeId = editingType ?? 'mermaid-mindmap';
        const requested = getDiagramTypeOutputRequests(settings, typeId);
        const plan = resolveDiagramOutputPlan(typeId, requested);
        const choices = getDiagramOutputChoicesForType(typeId, requested);
        outputs.empty();
        let group: HTMLElement | undefined;
        let groupStatus = '';
        for (const choice of choices) {
            if (choice.status !== groupStatus) {
                groupStatus = choice.status;
                group = outputs.createEl('fieldset', { cls: 'notemd-diagram-output-group' });
                group.createEl('legend', { text: copy[choice.status] });
            }
            const row = group!.createDiv({ cls: 'notemd-diagram-output-choice', attr: { 'data-diagram-output-state': choice.status } });
            const label = row.createEl('label');
            const input = label.createEl('input', { type: 'checkbox', attr: { 'data-diagram-output': choice.id } });
            input.checked = choice.selected;
            input.disabled = preferences.version !== 1 || (choice.status === 'unsupported' && !choice.selected);
            label.createEl('span', { text: getDiagramOutputLabel(choice.id, settings) });
            const inactive = choice.selected && !plan.outputs.some(output => output === choice.id);
            if (inactive) label.createEl('span', { text: copy.inactiveShort, cls: 'notemd-diagram-output-inactive' });
            label.title = inactive ? copy.inactiveHint : choice.id === 'html-diagram' ? copy.htmlDiagramDescription
                : choice.id === 'html-summary' ? copy.htmlSummaryDescription : choice.status === 'unsupported' ? copy.incompatibleType : '';
            input.onchange = () => commit(() => {
                const current = getDiagramTypeOutputRequests(options.getSettings(), typeId).filter(id => id !== choice.id);
                if (input.checked) current.push(choice.id);
                setDiagramTypeOutputRequests(options.getSettings(), typeId, current);
                selectDiagramGenerationType(options.getSettings(), typeId);
                editingType = typeId;
            });
        }
        const visible = requested.length ? requested : plan.outputs;
        outputMenu.text.setText(`${typeLabel(typeId)} · ${getDiagramOutputLabel(visible[0], settings)}`);
        outputMenu.count.setText(visible.length > 1 ? `+${visible.length - 1}` : '');
        outputMenu.trigger.setAttribute('aria-label', `${typeLabel(typeId)}: ${visible.map(id => getDiagramOutputLabel(id, settings)).join(', ')}`);
        outputMenu.popup.setAttribute('aria-label', `${typeLabel(typeId)}: ${copy.name}`);
        outputMenu.trigger.title = visible.map(id => getDiagramOutputLabel(id, settings)).join(', ');
        summary.setText(preferences.version !== 1 ? copy.unsupportedVersion : plan.inactiveOutputs.length
            ? formatI18n(copy.inactive, { outputs: plan.inactiveOutputs.map(output => getDiagramOutputLabel(output.id, settings)).join(', ') }) : '');
        if (focusAttribute) {
            const candidates = [...Array.from(typeRows.querySelectorAll<HTMLElement>(`[${focusAttribute}]`)), ...Array.from(outputs.querySelectorAll<HTMLElement>(`[${focusAttribute}]`))];
            candidates.find(element => element.getAttribute(focusAttribute) === focusId)?.focus({ preventScroll: true });
        }
        typeMenu.popup.scrollTop = typeScroll;
        outputMenu.popup.scrollTop = outputScroll;
        typeMenu.position(); outputMenu.position();
    }
    function commit(change: () => void): Promise<void> {
        try { change(); } catch (error) { showSaveError(error); return Promise.resolve(); }
        refresh(); options.onPreviewType(editingType);
        pendingSave = pendingSave.then(options.saveSettings, options.saveSettings);
        return pendingSave.then(() => { if (!destroyed) saveError.setText(''); }, showSaveError);
    }
    function showSaveError(error: unknown): void {
        if (!destroyed) saveError.setText(formatI18n(getI18nStrings(options.getSettings()).diagramOutputs.saveFailed, { message: error instanceof Error ? error.message : String(error) }));
    }
    refresh();
    return { refresh, getEditingType: () => editingType, destroy() { typeMenu.destroy(); outputMenu.destroy(); destroyed = true; saveError.remove(); } };
}
