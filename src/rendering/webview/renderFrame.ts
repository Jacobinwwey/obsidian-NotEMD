import type { RenderWebviewPayload } from './contract';
import {
    getWebviewPresentation,
    renderSourceOnlyArtifactMarkup
} from './presentationRegistry';

export function renderArtifactMarkup(payload: RenderWebviewPayload): string {
    const presentation = getWebviewPresentation(payload.artifact.target);
    return presentation.matches(payload)
        ? presentation.renderMarkup(payload)
        : renderSourceOnlyArtifactMarkup(payload);
}
