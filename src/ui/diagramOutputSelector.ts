import type { NotemdSettings } from '../types';
import { formatI18n, getI18nStrings } from '../i18n';
import {
    addDiagramOutputPreference, applyDiagramTypeOutputPreference, getDiagramOutputChoices,
    getDiagramTypeOutputChoices, getExecutableDiagramOutputRequests, isDiagramOutputId, migrateDiagramOutputPreferences,
    removeDiagramOutputPreference, resolveDiagramOutputPlan
} from '../diagram/diagramOutputPreferences';
import { getDiagramTypeSelectionValue, resolveDiagramTypeId, resolvePreferredDiagramTypeId } from '../diagram/diagramPreferenceCompatibility';
import { getExecutableDiagramTypeOptions } from './diagramCatalogLabels';

export interface DiagramOutputSelectorOptions {
    typeParent: HTMLElement;
    outputParent: HTMLElement;
    getSettings: () => NotemdSettings;
    saveSettings: () => Promise<void>;
    onTypeChanged: () => void;
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
export function renderDiagramOutputSelector(options: DiagramOutputSelectorOptions): { refresh: () => void } {
    options.outputParent.addClass('notemd-diagram-output-control');
    const select = options.typeParent.createEl('select', { cls: 'notemd-language-select', attr: { 'data-diagram-type': '' } });
    const outputs = options.outputParent.createDiv({ cls: 'notemd-diagram-output-choices' });
    const summary = options.outputParent.createEl('p', { cls: 'notemd-control-hint', attr: { 'aria-live': 'polite', 'data-diagram-output-summary': '' } });
    const saveError = options.outputParent.createEl('p', { cls: 'notemd-diagram-output-error', attr: { role: 'alert' } });
    const controlId = `diagram-outputs-${Math.random().toString(36).slice(2)}`;
    let pendingSave: Promise<void> = Promise.resolve();

    function refresh(): void {
        const settings = options.getSettings();
        const strings = getI18nStrings(settings);
        const copy = strings.diagramOutputs;
        const diagramCopy = strings.settings.developer.experimentalDiagramPipeline;
        const active = options.outputParent.ownerDocument?.activeElement;
        const focusedOutput = active && options.outputParent.contains(active)
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
            const suffix = choice.status === 'adjustable' ? ` — ${copy.adjustable}` : '';
            select.createEl('option', { text: item.label + suffix, value: item.value });
        }
        select.value = getDiagramTypeSelectionValue(typeId);
        outputs.empty();
        let group: HTMLElement | undefined;
        let groupStatus = '';
        let focusReplacement: HTMLInputElement | undefined;
        for (const [index, choice] of getDiagramOutputChoices(settings).entries()) {
            if (groupStatus !== choice.status) {
                groupStatus = choice.status;
                group = outputs.createEl('fieldset', { cls: 'notemd-diagram-output-group' });
                group.createEl('legend', { text: copy[choice.status] });
            }
            const row = group!.createDiv({ cls: 'notemd-diagram-output-choice', attr: { 'data-diagram-output-state': choice.status } });
            const label = row.createEl('label');
            const hintId = `${controlId}-${index}`;
            const input = label.createEl('input', { type: 'checkbox', attr: { 'data-diagram-output': choice.id, 'aria-describedby': hintId } });
            input.checked = choice.selected;
            input.disabled = choice.status === 'unsupported' && !choice.selected;
            label.createEl('span', { text: getDiagramOutputLabel(choice.id, settings) });
            const inactive = choice.selected && choice.status !== 'supported';
            const description = inactive ? copy.inactiveHint
                : choice.status === 'adjustable' ? copy.adjustmentHint
                    : choice.id === 'html-diagram' ? copy.htmlDiagramDescription
                        : choice.id === 'html-summary' ? copy.htmlSummaryDescription : '';
            row.createEl('small', { text: description, attr: { id: hintId } });
            input.onchange = () => commit(() => {
                if (input.checked && isDiagramOutputId(choice.id)) addDiagramOutputPreference(options.getSettings(), choice.id);
                else removeDiagramOutputPreference(options.getSettings(), choice.id);
            });
            if (inactive && isDiagramOutputId(choice.id)) {
                const promote = row.createEl('button', { text: copy.useOutput, attr: { 'data-diagram-promote-output': choice.id } });
                promote.onclick = () => commit(() => {
                    if (isDiagramOutputId(choice.id)) addDiagramOutputPreference(options.getSettings(), choice.id);
                });
            }
            if (choice.id === focusedOutput) focusReplacement = input;
        }
        const selectedLabels = (plan?.outputs ?? requested.requestedOutputs).map(id => getDiagramOutputLabel(id, settings));
        const inactiveLabels = plan?.inactiveOutputs.map(output => getDiagramOutputLabel(output.id, settings)) ?? [];
        summary.setText([
            !plan ? copy.autoType : selectedLabels.length ? formatI18n(copy.effective, { outputs: selectedLabels.join(', ') }) : copy.automatic,
            inactiveLabels.length ? formatI18n(copy.inactive, { outputs: inactiveLabels.join(', ') }) : '',
            requested.version !== 1 ? copy.unsupportedVersion : ''
        ].filter(Boolean).join(' '));
        focusReplacement?.focus();
    }

    function commit(change: () => void): Promise<void> {
        change();
        refresh();
        options.onTypeChanged();
        // Serialize writes, but keep synchronous selection feedback responsive.
        pendingSave = pendingSave.then(options.saveSettings, options.saveSettings);
        return pendingSave.then(() => saveError.setText(''), error => {
            saveError.setText(formatI18n(getI18nStrings(options.getSettings()).diagramOutputs.saveFailed, {
                message: error instanceof Error ? error.message : String(error)
            }));
        });
    }

    select.onchange = () => commit(() => applyDiagramTypeOutputPreference(options.getSettings(), resolveDiagramTypeId(select.value)));
    refresh();
    return { refresh };
}
