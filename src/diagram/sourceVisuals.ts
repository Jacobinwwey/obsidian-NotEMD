export type SourceVisualKind = 'mermaid' | 'image';
export type SourceVisualStatus = 'resolved' | 'unresolved';

export interface SourceVisualReference {
    id: string;
    kind: SourceVisualKind;
    sourceHash: string;
    lineStart: number;
    lineEnd: number;
    altText?: string;
    language?: string;
    definition?: string;
    targetPath?: string;
    width?: number;
    height?: number;
}

export interface ResolvedSourceVisual extends SourceVisualReference {
    status: SourceVisualStatus;
    vaultPath?: string;
    mimeType?: string;
    content?: string | ArrayBuffer;
    diagnostic?: string;
}

export interface SourceVisualResolutionHost {
    getFileByPath(path: string): unknown;
    readFile?(file: unknown): Promise<string>;
    readBinary?(file: unknown): Promise<ArrayBuffer>;
}

export interface SourceVisualScanOptions {
    includeMermaid?: boolean;
    includeImages?: boolean;
}

const DEFAULT_SCAN_OPTIONS: Required<SourceVisualScanOptions> = {
    includeMermaid: true,
    includeImages: true
};

function hashText(value: string): string {
    let hash = 2166136261;
    for (const character of value) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function hashBytes(value: ArrayBuffer): string {
    let hash = 2166136261;
    for (const byte of new Uint8Array(value)) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function parsePositiveDimension(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseEmbedOptions(value: string | undefined): { width?: number; height?: number } {
    if (!value) {
        return {};
    }
    const width = value.match(/(?:^|\s|,)width\s*=\s*([0-9.]+)/i)?.[1];
    const height = value.match(/(?:^|\s|,)height\s*=\s*([0-9.]+)/i)?.[1];
    return {
        width: parsePositiveDimension(width),
        height: parsePositiveDimension(height)
    };
}

function splitEmbedTarget(rawTarget: string): { targetPath: string; options?: string } {
    const [target, ...optionParts] = rawTarget.split('|');
    return {
        targetPath: target.trim().replace(/^<|>$/g, ''),
        options: optionParts.join('|').trim() || undefined
    };
}

function isExternalTarget(target: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target.trim());
}

function createImageReference(
    id: string,
    line: string,
    lineNumber: number,
    targetPath: string,
    altText: string,
    options?: string
): SourceVisualReference | null {
    const normalizedTarget = targetPath.trim();
    if (!normalizedTarget) {
        return null;
    }
    const dimensions = parseEmbedOptions(options);
    return {
        id,
        kind: 'image',
        sourceHash: hashText(line),
        lineStart: lineNumber,
        lineEnd: lineNumber,
        altText: altText.trim() || undefined,
        targetPath: normalizedTarget,
        ...dimensions
    };
}

function scanImagesInLine(line: string, lineNumber: number, nextId: () => string): SourceVisualReference[] {
    const references: SourceVisualReference[] = [];
    const wikiPattern = /!\[\[([^\]]+)\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = wikiPattern.exec(line))) {
        const embed = splitEmbedTarget(match[1]);
        const reference = createImageReference(nextId(), line, lineNumber, embed.targetPath, '', embed.options);
        if (reference) {
            references.push(reference);
        }
    }

    const markdownPattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = markdownPattern.exec(line))) {
        const rawTarget = match[2].trim().split(/\s+['"]/)[0];
        const reference = createImageReference(nextId(), line, lineNumber, rawTarget, match[1]);
        if (reference) {
            references.push(reference);
        }
    }
    return references;
}

export function scanSourceVisualReferences(
    markdown: string,
    options: SourceVisualScanOptions = {}
): SourceVisualReference[] {
    const scanOptions = { ...DEFAULT_SCAN_OPTIONS, ...options };
    const lines = markdown.split(/\r?\n/);
    const references: SourceVisualReference[] = [];
    let visualIndex = 0;
    const nextId = (): string => `source-visual-${++visualIndex}`;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const fenceMatch = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)?.*$/);
        if (fenceMatch) {
            const fence = fenceMatch[1];
            const language = (fenceMatch[2] ?? '').trim().toLowerCase();
            let closingIndex = lineIndex;
            for (let candidate = lineIndex + 1; candidate < lines.length; candidate += 1) {
                if (new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`).test(lines[candidate])) {
                    closingIndex = candidate;
                    break;
                }
            }
            if (scanOptions.includeMermaid && language === 'mermaid' && closingIndex > lineIndex) {
                const definition = lines.slice(lineIndex + 1, closingIndex).join('\n').trim();
                if (definition) {
                    references.push({
                        id: nextId(),
                        kind: 'mermaid',
                        sourceHash: hashText(definition),
                        lineStart: lineIndex + 1,
                        lineEnd: closingIndex,
                        language: 'mermaid',
                        definition
                    });
                }
            }
            if (closingIndex > lineIndex) {
                lineIndex = closingIndex;
                continue;
            }
        }

        if (scanOptions.includeImages) {
            references.push(...scanImagesInLine(line, lineIndex + 1, nextId));
        }
    }

    return references;
}

function normalizePath(value: string): string | null {
    let decoded: string;
    try {
        decoded = decodeURIComponent(value.trim()).replace(/\\/g, '/').replace(/^\/+/, '');
    } catch {
        return null;
    }
    if (!decoded || decoded.startsWith('../') || decoded.includes('/../') || decoded === '..') {
        return null;
    }
    const segments = decoded.split('/').filter(Boolean);
    if (segments.some(segment => segment === '..' || segment === '.')) {
        return null;
    }
    return segments.join('/');
}

function candidateVaultPaths(sourcePath: string | undefined, targetPath: string): string[] {
    const normalizedTarget = normalizePath(targetPath);
    if (!normalizedTarget) {
        return [];
    }
    const sourceDirectory = sourcePath?.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
    const candidates = [
        normalizedTarget,
        sourceDirectory ? `${sourceDirectory}/${normalizedTarget}` : normalizedTarget
    ];
    return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

function imageMimeType(path: string): string | undefined {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'svg': return 'image/svg+xml';
        case 'bmp': return 'image/bmp';
        default: return undefined;
    }
}

export async function resolveSourceVisualReferences(
    references: readonly SourceVisualReference[],
    sourcePath: string | undefined,
    host: SourceVisualResolutionHost
): Promise<ResolvedSourceVisual[]> {
    const resolved: ResolvedSourceVisual[] = [];
    for (const reference of references) {
        if (reference.kind === 'mermaid') {
            resolved.push({ ...reference, status: 'resolved', mimeType: 'text/vnd.mermaid', content: reference.definition ?? '' });
            continue;
        }

        if (isExternalTarget(reference.targetPath ?? '')) {
            resolved.push({
                ...reference,
                status: 'unresolved',
                diagnostic: `External image embeds are not copied into Drawnix companions: ${reference.targetPath ?? ''}`
            });
            continue;
        }

        const candidates = candidateVaultPaths(sourcePath, reference.targetPath ?? '');
        const vaultPath = candidates.find(candidate => Boolean(host.getFileByPath(candidate)));
        if (!vaultPath) {
            resolved.push({
                ...reference,
                status: 'unresolved',
                diagnostic: `Image embed could not be resolved inside the vault: ${reference.targetPath ?? ''}`
            });
            continue;
        }

        const file = host.getFileByPath(vaultPath);
        if (typeof host.readBinary !== 'function') {
            resolved.push({
                ...reference,
                status: 'unresolved',
                vaultPath,
                diagnostic: 'The Obsidian host does not expose binary reads for image embeds.'
            });
            continue;
        }

        try {
            const content = await host.readBinary(file);
            resolved.push({
                ...reference,
                status: 'resolved',
                vaultPath,
                mimeType: imageMimeType(vaultPath) ?? 'application/octet-stream',
                content
            });
        } catch (error: unknown) {
            resolved.push({
                ...reference,
                status: 'unresolved',
                vaultPath,
                diagnostic: `Image embed could not be read: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    return resolved;
}

export function hashResolvedSourceVisualManifest(visuals: readonly ResolvedSourceVisual[] | undefined): string {
    if (!visuals || visuals.length === 0) {
        return 'source-visuals:none';
    }
    return hashText(visuals.map(visual => [
        visual.id,
        visual.kind,
        visual.sourceHash,
        visual.status,
        visual.vaultPath ?? '',
        visual.mimeType ?? '',
        typeof visual.content === 'string'
            ? hashText(visual.content)
            : visual.content instanceof ArrayBuffer
                ? hashBytes(visual.content)
                : '',
        visual.diagnostic ?? ''
    ].join('|')).join('\n'));
}
