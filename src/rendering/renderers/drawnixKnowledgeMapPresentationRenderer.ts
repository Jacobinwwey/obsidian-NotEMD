import { buildDrawnixKnowledgeMapPresentation, DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT } from '../../diagram/adapters/drawnix/drawnixKnowledgeMapPresentation';
import { readDrawnixKnowledgeMapReplayRecord } from '../../diagram/adapters/drawnix/drawnixExporter';
import type { DrawnixKnowledgeMapPresentationSlice } from '../../diagram/adapters/drawnix/drawnixKnowledgeMapPresentationTypes';
import { DiagramSpec } from '../../diagram/types';
import {
    DrawnixKnowledgeMapPresentationArtifact,
    DrawnixKnowledgeMapPresentationPanelArtifact,
    RenderArtifact,
    RenderOptions
} from '../types';
import { renderDrawnixKnowledgeMapBoardArtifact } from './drawnixKnowledgeMapBoardArtifactRenderer';
import { renderDrawnixKnowledgeMapPresentationSvg } from './drawnixKnowledgeMapPresentationSvgRenderer';

function toSafePanelName(value: string | undefined): string {
    const normalized = (value ?? '')
        .normalize('NFKD')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return normalized || 'root';
}

function buildDetailFileName(slice: DrawnixKnowledgeMapPresentationSlice, index: number): string {
    const ordinal = index + 1 < 10 ? `0${index + 1}` : String(index + 1);
    return `detail-${ordinal}-${toSafePanelName(slice.rootId)}.svg`;
}

function buildPanelArtifact(
    slice: DrawnixKnowledgeMapPresentationSlice,
    fileName: string
): DrawnixKnowledgeMapPresentationPanelArtifact {
    return {
        sliceId: slice.id,
        fileName,
        content: renderDrawnixKnowledgeMapPresentationSvg(slice)
    };
}

function buildPresentationPreviewPanel(params: {
    slice: DrawnixKnowledgeMapPresentationSlice;
    panel: DrawnixKnowledgeMapPresentationPanelArtifact;
    boardArtifact: RenderArtifact;
}): NonNullable<RenderArtifact['previewPanels']>[number] {
    return {
        id: `drawnix-presentation-${params.slice.id}`,
        title: params.slice.title,
        artifact: {
            target: 'drawnix',
            content: params.boardArtifact.content,
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: params.boardArtifact.sourceIntent,
            previewSvg: {
                content: params.panel.content,
                mimeType: 'image/svg+xml'
            }
        }
    };
}

/**
 * Produces a static overview/detail set while retaining the complete board
 * artifact returned by the board operation for editing and legacy consumers.
 */
export async function renderDrawnixKnowledgeMapPresentationArtifact(
    spec: DiagramSpec,
    options: RenderOptions = {}
): Promise<RenderArtifact> {
    const boardArtifact = await renderDrawnixKnowledgeMapBoardArtifact(spec, options);
    const replay = readDrawnixKnowledgeMapReplayRecord(JSON.parse(boardArtifact.content));
    if (!replay) {
        throw new Error('Drawnix knowledge-map presentation requires a valid replay record. Regenerate the board artifact.');
    }

    const presentation = buildDrawnixKnowledgeMapPresentation(
        replay.semanticSpec,
        DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
    );
    const bundle: DrawnixKnowledgeMapPresentationArtifact = {
        version: 1,
        catalogTypeId: 'drawnix-knowledge-map',
        semanticSpecHash: replay.semanticSpecHash,
        overview: buildPanelArtifact(presentation.overview, 'overview.svg'),
        details: presentation.details.map((slice, index) => buildPanelArtifact(slice, buildDetailFileName(slice, index))),
        fidelityLedger: presentation.ledger
    };
    const previewPanels = [
        buildPresentationPreviewPanel({
            slice: presentation.overview,
            panel: bundle.overview,
            boardArtifact
        }),
        ...presentation.details.map((slice, index) => buildPresentationPreviewPanel({
            slice,
            panel: bundle.details[index],
            boardArtifact
        }))
    ];

    return {
        ...boardArtifact,
        previewPanels,
        drawnixKnowledgeMapPresentation: bundle
    };
}
