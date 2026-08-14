import type { DrawnixKnowledgeMapDelivery } from '../diagram/types';

export interface DrawnixKnowledgeMapDeliverySelectorCopy {
    fullBoard: string;
    presentation: string;
}

export function shouldShowDrawnixKnowledgeMapDeliverySelector(
    preferredIntent: string | undefined,
    preferredRenderTarget: string | undefined
): boolean {
    return preferredIntent === 'drawnixMindmap' || preferredRenderTarget === 'drawnix';
}

/**
 * Renders a small host-level selector. It routes delivery before rendering;
 * it never changes the semantic graph or a renderer's layout policy.
 */
export function renderDrawnixKnowledgeMapDeliverySelector(params: {
    parent: HTMLElement;
    selectedDelivery: DrawnixKnowledgeMapDelivery;
    copy: DrawnixKnowledgeMapDeliverySelectorCopy;
    onSelect: (delivery: DrawnixKnowledgeMapDelivery) => Promise<void>;
}): HTMLElement {
    const group = params.parent.createDiv({ cls: 'notemd-drawnix-delivery-control' });
    group.setAttr('role', 'group');
    group.setAttr('aria-label', 'Drawnix knowledge-map delivery');
    let selectedDelivery = params.selectedDelivery;

    const buttons = ([
        ['full-board', params.copy.fullBoard],
        ['presentation', params.copy.presentation]
    ] as const).map(([delivery, label]) => {
        const button = group.createEl('button', {
            text: label,
            cls: 'notemd-drawnix-delivery-button'
        });
        button.setAttr('type', 'button');
        button.setAttr('data-drawnix-knowledge-map-delivery', delivery);
        button.addEventListener('click', () => {
            if (delivery === selectedDelivery) {
                return;
            }

            const previousDelivery = selectedDelivery;
            selectedDelivery = delivery;
            updateSelectedButtons();
            void params.onSelect(delivery).catch(error => {
                selectedDelivery = previousDelivery;
                updateSelectedButtons();
                console.error('Could not persist Drawnix knowledge-map delivery preference:', error);
            });
        });
        return { delivery, button };
    });

    const updateSelectedButtons = (): void => {
        buttons.forEach(({ delivery, button }) => {
            const selected = delivery === selectedDelivery;
            if (selected) {
                button.addClass('is-selected');
            } else {
                button.removeClass('is-selected');
            }
            button.setAttr('aria-pressed', String(selected));
        });
    };

    updateSelectedButtons();
    return group;
}
