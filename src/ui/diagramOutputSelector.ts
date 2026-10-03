import type { NotemdSettings } from '../types';
import { App, Scope, setIcon } from 'obsidian';
import { formatI18n, getI18nStrings } from '../i18n';
import {
    addDiagramOutputPreference, applyDiagramTypeOutputPreference, getDiagramOutputChoices,
    getDiagramTypeOutputChoices, getExecutableDiagramOutputRequests, isDiagramOutputId, migrateDiagramOutputPreferences,
    removeDiagramOutputPreference, resolveDiagramOutputPlan
} from '../diagram/diagramOutputPreferences';
import { getDiagramTypeSelectionValue, resolveDiagramTypeId, resolvePreferredDiagramTypeId } from '../diagram/diagramPreferenceCompatibility';
import { getExecutableDiagramTypeOptions } from './diagramCatalogLabels';

export interface DiagramOutputSelectorOptions {
    app: App;
    typeParent: HTMLElement;
    outputParent: HTMLElement;
    getSettings: () => NotemdSettings;
    saveSettings: () => Promise<void>;
    onTypeChanged: () => void;
}

export interface DiagramOutputSelectorController {
    refresh: () => void;
    destroy: () => void;
}

export function getDiagramOutputLabel(id: string, settings: Pick<NotemdSettings, 'uiLocale'>): string {
    const strings = getI18nStrings(settings);
    const diagram = strings.settings.developer.experimentalDiagramPipeline;
    const labels: Record<string, string> = {
        'source:mermaid': diagram.renderTargetMermaid,
        'source:json-canvas': diagram.renderTargetJsonCanvas,
        'source:vega-lite': diagram.renderTargetVegaLite,
        'source:drawio': diagram.renderTargetDrawio,
        'source:drawnix': diagram.renderTargetDrawnix,
        'source:circuitikz': diagram.renderTargetCircuitikz,
        'html-diagram': strings.diagramOutputs.htmlDiagram,
        'html-summary': strings.diagramOutputs.htmlSummary,
        svg: 'SVG', png: 'PNG', pdf: 'PDF'
    };
    return labels[id] ?? id;
}

/** Both surfaces use the same state transition and capability projection. */
export function renderDiagramOutputSelector(options: DiagramOutputSelectorOptions): DiagramOutputSelectorController {
    options.outputParent.addClass('notemd-diagram-output-control');
    const select = options.typeParent.createEl('select', { cls: 'notemd-language-select', attr: { 'data-diagram-type': '' } });
    const controlId = `diagram-outputs-${Math.random().toString(36).slice(2)}`;
    const trigger = options.outputParent.createEl('button', { cls: 'notemd-diagram-output-trigger', attr: {
        type: 'button', 'data-diagram-output-trigger': '', 'aria-expanded': 'false', 'aria-controls': controlId
    } });
    const triggerText = trigger.createEl('span', { cls: 'notemd-diagram-output-selection' });
    const count = trigger.createEl('span', { cls: 'notemd-diagram-output-count', attr: { 'aria-hidden': 'true' } });
    trigger.createEl('span', { cls: 'notemd-diagram-output-chevron', attr: { 'aria-hidden': 'true' } });
    const popup = options.outputParent.createDiv({ cls: 'notemd-diagram-output-popup', attr: { id: controlId, 'data-diagram-output-popup': '', role: 'group' } });
    popup.hidden = true;
    const outputs = popup.createDiv({ cls: 'notemd-diagram-output-choices' });
    const summary = popup.createEl('p', { cls: 'notemd-diagram-output-summary', attr: { 'aria-live': 'polite', 'data-diagram-output-summary': '' } });
    const saveError = options.outputParent.createEl('p', { cls: 'notemd-diagram-output-error', attr: { role: 'alert' } });
    let pendingSave: Promise<void> = Promise.resolve();
    let opened = false;
    let destroyed = false;
    const keyboardScope = new Scope();
    // Obsidian consumes modal shortcuts before DOM bubbling, including popouts.
    keyboardScope.register([], 'Escape', () => { closePopup(); trigger.focus(); return false; });

    function positionPopup(): void {
        const rect = trigger.getBoundingClientRect();
        const view = trigger.ownerDocument.defaultView!;
        const margin = 8;
        const width = Math.min(Math.max(rect.width, 240), view.innerWidth - margin * 2);
        const below = view.innerHeight - rect.bottom - margin * 2;
        const above = rect.top - margin * 2;
        const height = Math.min(380, Math.max(below, above));
        popup.style.width = `${width}px`;
        popup.style.maxHeight = `${height}px`;
        popup.style.left = `${Math.max(margin, Math.min(rect.left, view.innerWidth - width - margin))}px`;
        popup.style.top = `${below >= Math.min(380, popup.scrollHeight) || below >= above ? rect.bottom + margin : Math.max(margin, rect.top - margin - Math.min(height, popup.scrollHeight))}px`;
    }

    function closePopup(): void {
        if (!opened) return;
        opened = false;
        options.app.keymap.popScope(keyboardScope);
        popup.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        const owner = trigger.ownerDocument;
        owner.removeEventListener('pointerdown', dismissOutside);
        owner.removeEventListener('focusin', dismissOutside);
        owner.removeEventListener('scroll', positionPopup, true);
        owner.defaultView?.removeEventListener('resize', positionPopup);
        options.outputParent.appendChild(popup);
    }

    function dismissOutside(event: Event): void {
        if (!popup.contains(event.target as Node) && !trigger.contains(event.target as Node)) closePopup();
    }

    function openPopup(): void {
        if (destroyed || opened) return;
        opened = true;
        options.app.keymap.pushScope(keyboardScope);
        // The host settings/sidebar scroll containers clip fixed descendants.
        // Portal only while open, and own every listener for the same lifetime.
        const owner = trigger.ownerDocument;
        owner.body.appendChild(popup);
        popup.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        positionPopup();
        owner.addEventListener('pointerdown', dismissOutside);
        owner.addEventListener('focusin', dismissOutside);
        owner.addEventListener('scroll', positionPopup, true);
        owner.defaultView?.addEventListener('resize', positionPopup);
        popup.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
    }

    trigger.onclick = () => opened ? closePopup() : openPopup();
    trigger.onkeydown = event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openPopup();
            if (event.key === 'ArrowUp') Array.from(popup.querySelectorAll<HTMLInputElement>('input:not(:disabled)')).at(-1)?.focus();
        }
    };
    popup.onkeydown = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closePopup();
            trigger.focus();
        } else if (event.key === 'Tab') {
            closePopup();
            // Continue the host's natural tab order from the control, not the body portal.
            trigger.focus();
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const items = Array.from(popup.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)'));
            const current = items.indexOf(trigger.ownerDocument.activeElement as HTMLElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
    };

    function refresh(): void {
        if (destroyed) return;
        const settings = options.getSettings();
        const strings = getI18nStrings(settings);
        const copy = strings.diagramOutputs;
        const diagramCopy = strings.settings.developer.experimentalDiagramPipeline;
        const active = options.outputParent.ownerDocument?.activeElement;
        const focusedOutput = active && popup.contains(active)
            ? active.getAttribute('data-diagram-output') ?? active.getAttribute('data-diagram-promote-output') : null;
        const requested = migrateDiagramOutputPreferences(settings);
        const typeId = resolvePreferredDiagramTypeId(settings);
        const plan = typeId ? resolveDiagramOutputPlan(typeId, getExecutableDiagramOutputRequests(requested), settings.preferredDiagramRenderTarget) : null;
        select.empty();
        select.setAttribute('aria-label', diagramCopy.intentName);
        select.createEl('option', { text: diagramCopy.intentAuto, value: 'auto' });
        const labels = getExecutableDiagramTypeOptions(diagramCopy);
        for (const choice of getDiagramTypeOutputChoices(settings)) {
            const item = labels.find(candidate => resolveDiagramTypeId(candidate.value) === choice.typeId)!;
            select.createEl('option', { text: item.label, value: item.value });
        }
        select.value = getDiagramTypeSelectionValue(typeId);
        outputs.empty();
        let group: HTMLElement | undefined;
        let groupStatus = '';
        let focusReplacement: HTMLInputElement | undefined;
        for (const choice of getDiagramOutputChoices(settings)) {
            if (groupStatus !== choice.status) {
                groupStatus = choice.status;
                group = outputs.createEl('fieldset', { cls: 'notemd-diagram-output-group' });
                group.createEl('legend', { text: copy[choice.status] });
            }
            const row = group!.createDiv({ cls: 'notemd-diagram-output-choice', attr: { 'data-diagram-output-state': choice.status } });
            const label = row.createEl('label');
            const input = label.createEl('input', { type: 'checkbox', attr: { 'data-diagram-output': choice.id } });
            input.checked = choice.selected;
            input.disabled = choice.status === 'unsupported' && !choice.selected;
            label.createEl('span', { text: getDiagramOutputLabel(choice.id, settings) });
            const inactive = choice.selected && choice.status !== 'supported';
            const description = inactive ? copy.inactiveHint
                : choice.status === 'adjustable' ? copy.adjustmentHint
                    : choice.id === 'html-diagram' ? copy.htmlDiagramDescription
                        : choice.id === 'html-summary' ? copy.htmlSummaryDescription : '';
            if (description) label.setAttribute('title', description);
            if (inactive) label.createEl('span', { text: copy.inactiveShort, cls: 'notemd-diagram-output-inactive' });
            input.onchange = () => commit(() => {
                if (input.checked && isDiagramOutputId(choice.id)) addDiagramOutputPreference(options.getSettings(), choice.id);
                else removeDiagramOutputPreference(options.getSettings(), choice.id);
            });
            if (inactive && isDiagramOutputId(choice.id)) {
                const promote = row.createEl('button', { attr: { type: 'button', title: copy.useOutput, 'aria-label': formatI18n(copy.outputStatus, { output: copy.useOutput, status: getDiagramOutputLabel(choice.id, settings) }), 'data-diagram-promote-output': choice.id } });
                setIcon(promote, 'arrow-up-right');
                promote.onclick = () => commit(() => {
                    if (isDiagramOutputId(choice.id)) addDiagramOutputPreference(options.getSettings(), choice.id);
                });
            }
            if (choice.id === focusedOutput) focusReplacement = input;
        }
        const selectedLabels = (plan?.outputs ?? requested.requestedOutputs).map(id => getDiagramOutputLabel(id, settings));
        const inactiveLabels = plan?.inactiveOutputs.map(output => getDiagramOutputLabel(output.id, settings)) ?? [];
        const requestedLabels = requested.requestedOutputs.map(id => getDiagramOutputLabel(id, settings));
        const visibleLabels = requestedLabels.length ? requestedLabels : selectedLabels;
        triggerText.setText(visibleLabels[0] ?? copy.automatic);
        count.setText(visibleLabels.length > 1 ? `+${visibleLabels.length - 1}` : '');
        trigger.setAttribute('aria-label', formatI18n(copy.outputStatus, { output: copy.name, status: visibleLabels.join(', ') || copy.automatic }));
        trigger.setAttribute('title', visibleLabels.join(', '));
        popup.setAttribute('aria-label', copy.name);
        summary.setText([
            inactiveLabels.length ? formatI18n(copy.inactive, { outputs: inactiveLabels.join(', ') }) : '',
            requested.version !== 1 ? copy.unsupportedVersion : ''
        ].filter(Boolean).join(' '));
        focusReplacement?.focus();
        if (opened) positionPopup();
    }

    function commit(change: () => void): Promise<void> {
        change();
        refresh();
        options.onTypeChanged();
        // Serialize writes, but keep synchronous selection feedback responsive.
        pendingSave = pendingSave.then(options.saveSettings, options.saveSettings);
        return pendingSave.then(() => { if (!destroyed) saveError.setText(''); }, error => {
            if (destroyed) return;
            saveError.setText(formatI18n(getI18nStrings(options.getSettings()).diagramOutputs.saveFailed, {
                message: error instanceof Error ? error.message : String(error)
            }));
        });
    }

    select.onchange = () => {
        closePopup();
        return commit(() => applyDiagramTypeOutputPreference(options.getSettings(), resolveDiagramTypeId(select.value)));
    };
    refresh();
    return { refresh, destroy() { closePopup(); destroyed = true; popup.remove(); trigger.remove(); summary.remove(); saveError.remove(); select.remove(); } };
}
