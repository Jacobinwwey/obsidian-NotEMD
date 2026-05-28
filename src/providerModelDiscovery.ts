import { requestUrl } from 'obsidian';
import { LLMProviderConfig } from './types';
import {
    resolveProviderModelDiscoveryDefinition
} from './llmProviders';
import { normalizeOpenAICompatibleEndpointBaseUrl } from './openaiCompatibleEndpointFamily';
import { buildOpenAICompatibleProviderHeaders } from './providerRequestHeaders';

type ProviderModelDiscoveryResult = {
    models: string[];
    source: 'remote' | 'none';
};

export type DiscoveredProviderModel = {
    id: string;
    label?: string;
    ownerHint?: string;
    maxOutputTokens?: number;
};

export type ProviderModelDiscoveryDetailedResult = {
    models: string[];
    entries: DiscoveredProviderModel[];
    source: 'remote' | 'none';
};

type DiscoveredModelCandidate = {
    id?: unknown;
    uid?: unknown;
    key?: unknown;
    identifier?: unknown;
    slug?: unknown;
    model?: unknown;
    modelId?: unknown;
    model_name?: unknown;
    model_id?: unknown;
    providerModelId?: unknown;
    provider_model_id?: unknown;
    modelName?: unknown;
    name?: unknown;
    display_name?: unknown;
    displayName?: unknown;
    owned_by?: unknown;
    publisher?: unknown;
    organization?: unknown;
    provider?: unknown;
    modelType?: unknown;
    type?: unknown;
    types?: unknown;
    max_tokens?: unknown;
    maxTokens?: unknown;
    outputTokenLimit?: unknown;
    output_token_limit?: unknown;
    max_output?: unknown;
    maxOutputTokens?: unknown;
    max_output_tokens?: unknown;
    maxCompletionTokens?: unknown;
    max_completion_tokens?: unknown;
    top_provider?: unknown;
    topProvider?: unknown;
    per_request_limits?: unknown;
    perRequestLimits?: unknown;
    specification?: unknown;
    architecture?: unknown;
    limits?: unknown;
    litellm_params?: unknown;
    model_info?: unknown;
    features?: unknown;
    capabilities?: unknown;
    capability?: unknown;
    supported_output_modalities?: unknown;
    supportedOutputModalities?: unknown;
    tasks?: unknown;
    task?: unknown;
    input_modalities?: unknown;
    inputModalities?: unknown;
    output_modalities?: unknown;
    outputModalities?: unknown;
    modalities?: unknown;
    status?: unknown;
    state?: unknown;
    active?: unknown;
    enabled?: unknown;
    available?: unknown;
    deprecated?: unknown;
    archived?: unknown;
    policy?: unknown;
    supportedGenerationMethods?: unknown;
    supported_generation_methods?: unknown;
    generationMethods?: unknown;
    generation_methods?: unknown;
    supported_endpoint_types?: unknown;
    supportedEndpointTypes?: unknown;
    supported_endpoint_type?: unknown;
    endpoint_type?: unknown;
    endpointType?: unknown;
    endpoints?: unknown;
    aliases?: unknown;
};

const MODEL_RESOURCE_PREFIX = 'models/';
const PUBLISHER_MODEL_RESOURCE_PATTERN = /(?:^|\/)publishers\/[^/]+\/models\/([^/]+)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeDiscoveredModelIdentifier(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    if (trimmed.startsWith(MODEL_RESOURCE_PREFIX) && trimmed.length > MODEL_RESOURCE_PREFIX.length) {
        return trimmed.slice(MODEL_RESOURCE_PREFIX.length);
    }

    const publisherMatch = trimmed.match(PUBLISHER_MODEL_RESOURCE_PATTERN);
    if (publisherMatch?.[1]) {
        return publisherMatch[1].trim();
    }

    return trimmed;
}

function trimTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, '');
}

function stripUrlSearchAndHash(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    try {
        const parsed = new URL(trimmed);
        return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch (_error) {
        return trimmed.replace(/[?#].*$/, '');
    }
}

function normalizeEndpointBaseUrl(baseUrl: string, suffixes: string[]): string {
    let normalized = trimTrailingSlashes(stripUrlSearchAndHash(baseUrl));
    if (!normalized) {
        return normalized;
    }

    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
            break;
        }
    }

    return trimTrailingSlashes(normalized);
}

function requireBaseUrl(provider: LLMProviderConfig): string {
    const normalized = provider.baseUrl.trim();
    if (!normalized) {
        throw new Error(`${provider.name} model discovery requires a Base URL / endpoint.`);
    }

    return normalized;
}

function normalizeGitHubModelsBaseUrl(baseUrl: string): string {
    const normalized = normalizeOpenAICompatibleEndpointBaseUrl(baseUrl);

    try {
        const parsed = new URL(normalized);
        if (parsed.hostname.trim().toLowerCase() === 'models.github.ai') {
            return `${parsed.protocol}//${parsed.host}`;
        }
    } catch (_error) {
        // Fall back to suffix stripping for non-URL inputs.
    }

    if (normalized.endsWith('/inference')) {
        return trimTrailingSlashes(normalized.slice(0, -'/inference'.length));
    }

    if (normalized.endsWith('/v1')) {
        return trimTrailingSlashes(normalized.slice(0, -'/v1'.length));
    }

    return trimTrailingSlashes(normalized);
}

function normalizeVercelAIGatewayBaseUrl(baseUrl: string): string {
    let normalized = normalizeEndpointBaseUrl(baseUrl, [
        '/v3/ai/config',
        '/v1/ai/chat/completions',
        '/v1/ai/responses',
        '/v1/ai/models',
        '/v1/chat/completions',
        '/v1/responses',
        '/v1/models'
    ]);
    if (normalized.endsWith('/v1')) {
        normalized = normalized.slice(0, -'/v1'.length);
    }
    if (normalized.endsWith('/v1/ai')) {
        normalized = normalized.slice(0, -'/ai'.length);
    }
    return trimTrailingSlashes(normalized);
}

function normalizeOllamaBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/tags']);
}

function normalizeGoogleBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/models']);
}

function normalizeAnthropicBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(baseUrl, ['/models']);
}

function normalizeHuaweiCloudModelArtsBaseUrl(baseUrl: string): string {
    let normalized = normalizeEndpointBaseUrl(baseUrl, ['/openai/v1/chat/completions', '/v1/chat/completions', '/v2/models', '/models']);
    if (normalized.endsWith('/openai/v1')) {
        normalized = normalized.slice(0, -'/openai/v1'.length);
    } else if (normalized.endsWith('/v1')) {
        normalized = normalized.slice(0, -'/v1'.length);
    }
    return trimTrailingSlashes(normalized);
}

function normalizeLiteLlmBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(normalizeOpenAICompatibleEndpointBaseUrl(baseUrl), ['/model/info']);
}

function normalizeOpenRouterBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(stripUrlSearchAndHash(baseUrl), ['/embeddings/models', '/models']);
}

function normalizeOvmsBaseUrl(baseUrl: string): string {
    return normalizeEndpointBaseUrl(normalizeOpenAICompatibleEndpointBaseUrl(baseUrl), ['/config']);
}

function buildVercelAIGatewayDiscoveryHeaders(provider: LLMProviderConfig): Record<string, string> {
    const headers = buildOpenAICompatibleProviderHeaders(provider);
    headers['ai-gateway-protocol-version'] = '0.0.1';
    return headers;
}

function normalizeModelList(values: Iterable<string>): string[] {
    const seen = new Set<string>();
    const models: string[] = [];

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        models.push(trimmed);
    }

    return models.sort((left, right) => left.localeCompare(right));
}

function normalizeDiscoveredProviderModels(values: Iterable<DiscoveredProviderModel>): DiscoveredProviderModel[] {
    const modelsById = new Map<string, DiscoveredProviderModel>();

    for (const value of values) {
        const modelId = value.id.trim();
        if (!modelId) {
            continue;
        }

        const existing = modelsById.get(modelId);
        if (!existing) {
            modelsById.set(modelId, {
                id: modelId,
                label: value.label?.trim() || undefined,
                ownerHint: value.ownerHint?.trim() || undefined,
                maxOutputTokens: value.maxOutputTokens
            });
            continue;
        }

        const nextMaxOutputTokens = typeof value.maxOutputTokens === 'number'
            ? Math.max(existing.maxOutputTokens ?? 0, value.maxOutputTokens)
            : existing.maxOutputTokens;

        modelsById.set(modelId, {
            id: modelId,
            label: existing.label || value.label?.trim() || undefined,
            ownerHint: existing.ownerHint || value.ownerHint?.trim() || undefined,
            maxOutputTokens: nextMaxOutputTokens || undefined
        });
    }

    return Array.from(modelsById.values())
        .sort((left, right) => left.id.localeCompare(right.id));
}

async function fetchJson(url: string, options?: { headers?: Record<string, string> }): Promise<any> {
    const response = await requestUrl({
        url,
        method: 'GET',
        headers: options?.headers ?? {},
        throw: false
    });

    if (response.status < 200 || response.status >= 300) {
        throw new Error(`Model discovery request failed: ${response.status} ${response.text || ''}`.trim());
    }

    return response.json;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function looksLikeDiscoveryNextUrl(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.startsWith('http://')
        || trimmed.startsWith('https://')
        || trimmed.startsWith('/')
        || trimmed.startsWith('?');
}

function resolveDiscoveryNextUrl(currentUrl: string, candidate: string): string | undefined {
    const trimmed = candidate.trim();
    if (!trimmed || !looksLikeDiscoveryNextUrl(trimmed)) {
        return undefined;
    }

    try {
        return new URL(trimmed, currentUrl).toString();
    } catch (_error) {
        return undefined;
    }
}

function buildDiscoveryUrlWithQueryParam(currentUrl: string, parameterName: string, parameterValue: string): string | undefined {
    const trimmedValue = parameterValue.trim();
    if (!trimmedValue) {
        return undefined;
    }

    try {
        const parsed = new URL(currentUrl);
        parsed.searchParams.set(parameterName, trimmedValue);
        return parsed.toString();
    } catch (_error) {
        return undefined;
    }
}

function getDiscoveryPaginationContainers(payload: any): Array<Record<string, unknown>> {
    return [
        payload,
        payload?.data,
        payload?.result,
        payload?.response,
        payload?.payload,
        payload?.body,
        payload?.catalog,
        payload?.meta,
        payload?.data?.meta,
        payload?.result?.meta,
        payload?.response?.meta,
        payload?.payload?.meta,
        payload?.body?.meta,
        payload?.pagination,
        payload?.paging,
        payload?.page_info,
        payload?.pageInfo,
        payload?.data?.pagination,
        payload?.result?.pagination,
        payload?.response?.pagination,
        payload?.payload?.pagination,
        payload?.body?.pagination,
        payload?.data?.page_info,
        payload?.result?.page_info,
        payload?.response?.page_info,
        payload?.payload?.page_info,
        payload?.body?.page_info,
        payload?.data?.pageInfo,
        payload?.result?.pageInfo,
        payload?.response?.pageInfo,
        payload?.payload?.pageInfo,
        payload?.body?.pageInfo
    ].filter(isRecord);
}

function extractNextDiscoveryPageUrl(payload: any, currentUrl: string): string | undefined {
    const containers = getDiscoveryPaginationContainers(payload);
    const directNextCandidates = containers.flatMap(container => [
        container.next_url,
        container.nextUrl,
        container.next_page_url,
        container.nextPageUrl,
        container.next_page_href,
        container.nextPageHref,
        isRecord(container.next) ? container.next.href : undefined,
        isRecord(container.next) ? container.next.url : undefined,
        isRecord(container.links) ? container.links.next : undefined,
        isRecord(container.links) && isRecord(container.links.next) ? container.links.next.href : undefined,
        isRecord(container.links) && isRecord(container.links.next) ? container.links.next.url : undefined,
        isRecord(container.paging) ? container.paging.next : undefined,
        isRecord(container.paging) && isRecord(container.paging.next) ? container.paging.next.url : undefined,
        isRecord(container.pagination) ? container.pagination.next : undefined,
        isRecord(container.pagination) && isRecord(container.pagination.next) ? container.pagination.next.href : undefined,
        isRecord(container.pagination) && isRecord(container.pagination.next) ? container.pagination.next.url : undefined,
        isRecord(container.pagination) ? container.pagination.next_url : undefined,
        isRecord(container.pagination) ? container.pagination.nextUrl : undefined,
        isRecord(container.pagination) ? container.pagination.next_page_url : undefined,
        isRecord(container.pagination) ? container.pagination.nextPageUrl : undefined,
        isRecord(container.page_info) ? container.page_info.next : undefined,
        isRecord(container.page_info) && isRecord(container.page_info.next) ? container.page_info.next.href : undefined,
        isRecord(container.page_info) && isRecord(container.page_info.next) ? container.page_info.next.url : undefined,
        isRecord(container.page_info) ? container.page_info.next_page_url : undefined,
        isRecord(container.page_info) ? container.page_info.nextPageUrl : undefined,
        isRecord(container.pageInfo) ? container.pageInfo.next : undefined,
        isRecord(container.pageInfo) && isRecord(container.pageInfo.next) ? container.pageInfo.next.href : undefined,
        isRecord(container.pageInfo) && isRecord(container.pageInfo.next) ? container.pageInfo.next.url : undefined,
        isRecord(container.pageInfo) ? container.pageInfo.next_page_url : undefined,
        isRecord(container.pageInfo) ? container.pageInfo.nextPageUrl : undefined,
        isRecord(container.meta) ? container.meta.next_url : undefined,
        isRecord(container.meta) ? container.meta.nextUrl : undefined,
        isRecord(container.meta) ? container.meta.next_page_url : undefined,
        isRecord(container.meta) ? container.meta.nextPageUrl : undefined,
        isRecord(container.meta) ? container.meta.next : undefined,
        isRecord(container.meta) && isRecord(container.meta.next) ? container.meta.next.href : undefined,
        isRecord(container.meta) && isRecord(container.meta.next) ? container.meta.next.url : undefined
    ]);

    for (const candidate of directNextCandidates) {
        if (!isNonEmptyString(candidate)) {
            continue;
        }

        const nextUrl = resolveDiscoveryNextUrl(currentUrl, candidate);
        if (nextUrl) {
            return nextUrl;
        }
    }

    for (const container of containers) {
        const hasMore = container.has_more === true
            || container.hasMore === true
            || container.has_next_page === true
            || container.hasNextPage === true;
        if (!hasMore) {
            continue;
        }

        const afterIdCandidate = isNonEmptyString(container.after_id)
            ? { value: container.after_id, parameterName: 'after_id' }
            : isNonEmptyString(container.afterId)
                ? { value: container.afterId, parameterName: 'afterId' }
                : isNonEmptyString(container.last_id)
                    ? { value: container.last_id, parameterName: 'after_id' }
                    : isNonEmptyString(container.lastId)
                        ? { value: container.lastId, parameterName: 'afterId' }
                        : undefined;
        if (afterIdCandidate) {
            return buildDiscoveryUrlWithQueryParam(
                currentUrl,
                afterIdCandidate.parameterName,
                afterIdCandidate.value
            );
        }

        const cursorCandidate = isNonEmptyString(container.end_cursor)
            ? container.end_cursor
            : isNonEmptyString(container.endCursor)
                ? container.endCursor
                : '';
        if (cursorCandidate) {
            return buildDiscoveryUrlWithQueryParam(currentUrl, 'cursor', cursorCandidate);
        }
    }

    const tokenCandidates = containers.flatMap(container => [
        { value: container.nextPageToken, parameterName: 'pageToken' },
        { value: container.next_page_token, parameterName: 'page_token' },
        { value: container.nextpagetoken, parameterName: 'pageToken' },
        { value: container.pageToken, parameterName: 'pageToken' },
        { value: container.page_token, parameterName: 'page_token' },
        { value: container.next_cursor, parameterName: 'cursor' },
        { value: container.nextCursor, parameterName: 'cursor' },
        { value: container.next_page_cursor, parameterName: 'cursor' },
        { value: container.continuation_token, parameterName: 'continuation_token' },
        { value: container.continuationToken, parameterName: 'continuationToken' },
        { value: container.next_page, parameterName: 'page' }
    ]);

    for (const candidate of tokenCandidates) {
        if (!isNonEmptyString(candidate.value)) {
            continue;
        }

        const nextUrl = buildDiscoveryUrlWithQueryParam(currentUrl, candidate.parameterName, candidate.value);
        if (nextUrl) {
            return nextUrl;
        }
    }

    return undefined;
}

async function discoverBoundedPaginatedCatalog(
    initialUrl: string,
    options?: { headers?: Record<string, string> }
): Promise<DiscoveredProviderModel[]> {
    const discoveredModels: DiscoveredProviderModel[] = [];
    let nextUrl: string | undefined = initialUrl;

    for (let page = 0; page < 20 && nextUrl; page++) {
        let payload: any;

        try {
            payload = await fetchJson(nextUrl, options);
        } catch (error) {
            if (page === 0) {
                throw error;
            }
            break;
        }

        discoveredModels.push(...extractDiscoveredProviderModels(payload));

        const candidateNextUrl = extractNextDiscoveryPageUrl(payload, nextUrl);
        if (!candidateNextUrl || candidateNextUrl === nextUrl) {
            break;
        }

        nextUrl = candidateNextUrl;
    }

    return normalizeDiscoveredProviderModels(discoveredModels);
}

function pickModelIdentifier(entry: DiscoveredModelCandidate): string {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const litellmParams = isRecord(entry.litellm_params) ? entry.litellm_params : undefined;
    const aliases = Array.isArray(entry.aliases)
        ? entry.aliases.filter((alias): alias is string => typeof alias === 'string')
        : [];
    const candidates = [
        specification?.modelId,
        litellmParams?.model,
        entry.id,
        entry.uid,
        entry.key,
        entry.identifier,
        entry.slug,
        entry.model,
        entry.modelId,
        entry.model_id,
        entry.providerModelId,
        entry.provider_model_id,
        entry.modelName,
        entry.model_name,
        entry.name,
        ...aliases
    ];
    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }
        const normalized = normalizeDiscoveredModelIdentifier(candidate);
        if (normalized) {
            return normalized;
        }
    }
    return '';
}

function pickModelLabel(entry: DiscoveredModelCandidate): string | undefined {
    const identifier = pickModelIdentifier(entry);
    const candidates = [
        entry.display_name,
        entry.displayName,
        entry.model_name,
        entry.modelName,
        entry.name
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }
        const trimmed = candidate.trim();
        if (trimmed && trimmed !== identifier) {
            return trimmed;
        }
    }

    return undefined;
}

function pickModelOwnerHint(entry: DiscoveredModelCandidate): string | undefined {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const topProvider = isRecord(entry.top_provider)
        ? entry.top_provider
        : isRecord(entry.topProvider)
            ? entry.topProvider
            : undefined;
    const candidates = [
        entry.owned_by,
        entry.publisher,
        entry.organization,
        entry.provider,
        entry.providerModelId,
        entry.provider_model_id,
        specification?.provider,
        topProvider?.provider,
        topProvider?.name,
        topProvider?.owned_by,
        topProvider?.publisher,
        topProvider?.organization
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }

        const trimmed = candidate.trim();
        if (!trimmed || trimmed.toLowerCase() === 'unknown') {
            continue;
        }

        const normalizedIdentifier = pickModelIdentifier(entry);
        if (trimmed === normalizedIdentifier) {
            continue;
        }

        return trimmed;
    }

    return undefined;
}

function pickPositiveInteger(values: unknown[]): number | undefined {
    for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return Math.floor(value);
        }

        if (typeof value === 'string') {
            const parsed = Number.parseInt(value.trim(), 10);
            if (Number.isFinite(parsed) && parsed > 0) {
                return Math.floor(parsed);
            }
        }
    }

    return undefined;
}

function extractDelimitedStringValues(value: unknown): string[] {
    if (typeof value === 'string') {
        return value
            .split(/[,;\n|]/)
            .map(item => item.trim().toLowerCase())
            .filter(Boolean);
    }

    if (Array.isArray(value)) {
        return value.flatMap(item => extractDelimitedStringValues(item));
    }

    return [];
}

function extractTruthyRecordKeys(value: unknown): string[] {
    if (!isRecord(value)) {
        return [];
    }

    return Object.entries(value)
        .flatMap(([key, nestedValue]) => {
            if (nestedValue === true) {
                return [key.trim().toLowerCase()];
            }

            if (typeof nestedValue === 'number') {
                return nestedValue > 0 ? [key.trim().toLowerCase()] : [];
            }

            if (typeof nestedValue === 'string') {
                const normalized = nestedValue.trim().toLowerCase();
                return ['true', 'enabled', 'supported', 'available', 'active', 'yes'].includes(normalized)
                    ? [key.trim().toLowerCase()]
                    : [];
            }

            if (isRecord(nestedValue)) {
                return extractTruthyRecordKeys(nestedValue).length > 0 ? [key.trim().toLowerCase()] : [];
            }

            return [];
        })
        .filter(Boolean);
}

function pickModelMaxOutputTokens(entry: DiscoveredModelCandidate): number | undefined {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const limits = isRecord(entry.limits) ? entry.limits : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;
    const litellmParams = isRecord(entry.litellm_params) ? entry.litellm_params : undefined;
    const topProvider = isRecord(entry.top_provider)
        ? entry.top_provider
        : isRecord(entry.topProvider)
            ? entry.topProvider
            : undefined;
    const perRequestLimits = isRecord(entry.per_request_limits)
        ? entry.per_request_limits
        : isRecord(entry.perRequestLimits)
            ? entry.perRequestLimits
            : undefined;
    return pickPositiveInteger([
        entry.max_tokens,
        entry.maxTokens,
        entry.outputTokenLimit,
        entry.output_token_limit,
        entry.max_output,
        entry.maxOutputTokens,
        entry.max_output_tokens,
        entry.maxCompletionTokens,
        entry.max_completion_tokens,
        limits?.max_tokens,
        limits?.maxTokens,
        limits?.outputTokenLimit,
        limits?.output_token_limit,
        limits?.max_output,
        limits?.maxOutputTokens,
        limits?.max_output_tokens,
        limits?.maxCompletionTokens,
        limits?.max_completion_tokens,
        modelInfo?.max_tokens,
        modelInfo?.maxTokens,
        modelInfo?.outputTokenLimit,
        modelInfo?.output_token_limit,
        modelInfo?.max_output,
        modelInfo?.maxOutputTokens,
        modelInfo?.max_output_tokens,
        modelInfo?.maxCompletionTokens,
        modelInfo?.max_completion_tokens,
        topProvider?.max_tokens,
        topProvider?.maxTokens,
        topProvider?.outputTokenLimit,
        topProvider?.output_token_limit,
        topProvider?.max_output,
        topProvider?.maxOutputTokens,
        topProvider?.max_output_tokens,
        topProvider?.maxCompletionTokens,
        topProvider?.max_completion_tokens,
        perRequestLimits?.max_tokens,
        perRequestLimits?.maxTokens,
        perRequestLimits?.outputTokenLimit,
        perRequestLimits?.output_token_limit,
        perRequestLimits?.max_output,
        perRequestLimits?.maxOutputTokens,
        perRequestLimits?.max_output_tokens,
        perRequestLimits?.maxCompletionTokens,
        perRequestLimits?.max_completion_tokens,
        litellmParams?.max_tokens,
        litellmParams?.maxTokens,
        specification?.outputTokenLimit,
        specification?.output_token_limit,
        specification?.max_output,
        specification?.maxOutputTokens,
        specification?.max_output_tokens,
        specification?.maxCompletionTokens,
        specification?.max_completion_tokens
    ]);
}

function getCandidateType(entry: DiscoveredModelCandidate): string {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;
    const candidate = typeof entry.modelType === 'string'
        ? entry.modelType
        : typeof entry.type === 'string'
            ? entry.type
            : typeof modelInfo?.type === 'string'
                ? modelInfo.type
            : typeof specification?.type === 'string'
                ? specification.type
            : '';
    return candidate.trim().toLowerCase();
}

function getCandidateGenerationMethods(entry: DiscoveredModelCandidate): string[] {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;

    return [
        entry.supportedGenerationMethods,
        entry.supported_generation_methods,
        entry.generationMethods,
        entry.generation_methods,
        specification?.supportedGenerationMethods,
        specification?.supported_generation_methods,
        specification?.generationMethods,
        specification?.generation_methods,
        modelInfo?.supportedGenerationMethods,
        modelInfo?.supported_generation_methods,
        modelInfo?.generationMethods,
        modelInfo?.generation_methods
    ].flatMap(value =>
        Array.isArray(value)
            ? value
                .filter((method): method is string => typeof method === 'string')
                .map(method => method.trim().toLowerCase())
                .filter(Boolean)
            : extractDelimitedStringValues(value)
    );
}

function getCandidateCapabilityDescriptors(entry: DiscoveredModelCandidate): string[] {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const architecture = isRecord(entry.architecture) ? entry.architecture : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;

    return [
        ...extractDelimitedStringValues(entry.capabilities),
        ...extractDelimitedStringValues(entry.types),
        ...extractDelimitedStringValues(entry.features),
        ...extractDelimitedStringValues(entry.tasks),
        ...extractDelimitedStringValues(entry.task),
        ...extractDelimitedStringValues(entry.capability),
        ...extractDelimitedStringValues(modelInfo?.type),
        ...extractDelimitedStringValues(modelInfo?.mode),
        ...extractDelimitedStringValues(modelInfo?.capabilities),
        ...extractDelimitedStringValues(specification?.features),
        ...extractDelimitedStringValues(specification?.tasks),
        ...extractDelimitedStringValues(specification?.task),
        ...extractDelimitedStringValues(specification?.capability),
        ...extractDelimitedStringValues(specification?.capabilities),
        ...extractDelimitedStringValues(architecture?.features),
        ...extractDelimitedStringValues(architecture?.tasks),
        ...extractDelimitedStringValues(architecture?.task),
        ...extractDelimitedStringValues(architecture?.capability),
        ...extractDelimitedStringValues(architecture?.capabilities),
        ...extractTruthyRecordKeys(entry.capabilities),
        ...extractTruthyRecordKeys(specification?.capabilities),
        ...extractTruthyRecordKeys(architecture?.capabilities)
    ];
}

function extractModalityTokens(value: unknown): string[] {
    if (typeof value !== 'string') {
        return extractDelimitedStringValues(value)
            .flatMap(item => extractModalityTokens(item));
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return [];
    }

    const matchedTokens = normalized.match(/text|image|audio|speech|video|embedding|vector/g);
    if (matchedTokens && matchedTokens.length > 0) {
        return matchedTokens;
    }

    return extractDelimitedStringValues(normalized);
}

function getCandidateOutputModalities(entry: DiscoveredModelCandidate): string[] {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const architecture = isRecord(entry.architecture) ? entry.architecture : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;
    const modalities = isRecord(entry.modalities) ? entry.modalities : undefined;
    const outputModalities = [
        ...extractModalityTokens(entry.supported_output_modalities),
        ...extractModalityTokens(entry.supportedOutputModalities),
        ...extractModalityTokens(entry.output_modalities),
        ...extractModalityTokens(entry.outputModalities),
        ...extractModalityTokens(modelInfo?.supported_output_modalities),
        ...extractModalityTokens(modelInfo?.supportedOutputModalities),
        ...extractModalityTokens(modelInfo?.output_modalities),
        ...extractModalityTokens(modelInfo?.outputModalities),
        ...extractModalityTokens(specification?.supported_output_modalities),
        ...extractModalityTokens(specification?.supportedOutputModalities),
        ...extractModalityTokens(specification?.output_modalities),
        ...extractModalityTokens(specification?.outputModalities),
        ...extractModalityTokens(architecture?.supported_output_modalities),
        ...extractModalityTokens(architecture?.supportedOutputModalities),
        ...extractModalityTokens(architecture?.output_modalities),
        ...extractModalityTokens(architecture?.outputModalities),
        ...extractModalityTokens(modalities?.output),
        ...extractModalityTokens(modalities?.outputs)
    ];

    const modalityDescriptors = [
        architecture?.modality,
        modelInfo?.modality,
        specification?.modality,
        entry.modalities
    ];

    modalityDescriptors.forEach(descriptor => {
        if (typeof descriptor !== 'string') {
            return;
        }

        const normalized = descriptor.trim().toLowerCase();
        if (normalized.includes('->')) {
            outputModalities.push(...extractModalityTokens(normalized.split('->').slice(1).join('->')));
        }
    });

    return outputModalities;
}

function isExplicitlyUnavailableCandidate(entry: DiscoveredModelCandidate): boolean {
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const policy = isRecord(entry.policy) ? entry.policy : undefined;

    const explicitFalseFlags = [
        entry.active,
        entry.enabled,
        entry.available,
        specification?.active,
        specification?.enabled,
        specification?.available,
        policy?.active,
        policy?.enabled,
        policy?.available
    ];

    if (explicitFalseFlags.some(value => value === false)) {
        return true;
    }

    const explicitTrueArchiveFlags = [
        entry.deprecated,
        entry.archived,
        specification?.deprecated,
        specification?.archived,
        policy?.deprecated,
        policy?.archived
    ];

    if (explicitTrueArchiveFlags.some(value => value === true)) {
        return true;
    }

    const statusDescriptors = [
        entry.status,
        entry.state,
        specification?.status,
        specification?.state,
        policy?.state,
        policy?.status
    ]
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);

    return statusDescriptors.some(value =>
        ['deprecated', 'disabled', 'inactive', 'unavailable', 'offline', 'archived', 'deleted'].includes(value)
    );
}

function getCandidateEndpointDescriptors(entry: DiscoveredModelCandidate): string[] {
    const descriptors: string[] = [];
    const specification = isRecord(entry.specification) ? entry.specification : undefined;
    const modelInfo = isRecord(entry.model_info) ? entry.model_info : undefined;

    if (Array.isArray(entry.supported_endpoint_types)) {
        descriptors.push(
            ...entry.supported_endpoint_types
                .filter((endpoint): endpoint is string => typeof endpoint === 'string')
                .map(endpoint => endpoint.trim().toLowerCase())
                .filter(Boolean)
        );
    }

    if (Array.isArray(entry.supportedEndpointTypes)) {
        descriptors.push(
            ...entry.supportedEndpointTypes
                .filter((endpoint): endpoint is string => typeof endpoint === 'string')
                .map(endpoint => endpoint.trim().toLowerCase())
                .filter(Boolean)
        );
    }

    descriptors.push(
        ...extractDelimitedStringValues(entry.supported_endpoint_type),
        ...extractDelimitedStringValues(entry.endpoint_type),
        ...extractDelimitedStringValues(entry.endpointType),
        ...extractDelimitedStringValues(specification?.supported_endpoint_types),
        ...extractDelimitedStringValues(specification?.supportedEndpointTypes),
        ...extractDelimitedStringValues(modelInfo?.supported_endpoint_types),
        ...extractDelimitedStringValues(modelInfo?.supportedEndpointTypes)
    );

    if (Array.isArray(entry.endpoints)) {
        descriptors.push(
            ...entry.endpoints
                .filter((endpoint): endpoint is string => typeof endpoint === 'string')
                .map(endpoint => endpoint.trim().toLowerCase())
                .filter(Boolean)
        );
    } else if (typeof entry.endpoints === 'string') {
        descriptors.push(
            ...entry.endpoints
                .split(/[,;\n|]/)
                .map(endpoint => endpoint.trim().toLowerCase())
                .filter(Boolean)
        );
    }

    if (typeof specification?.type === 'string') {
        descriptors.push(specification.type.trim().toLowerCase());
    }

    return descriptors;
}

function hasGenerationMethod(methods: string[]): boolean {
    return methods.some(method =>
        method.includes('generate')
        || method.includes('stream')
        || method.includes('chat')
        || method.includes('response')
        || method.includes('message')
    );
}

function hasNonGenerationMethod(methods: string[]): boolean {
    return methods.some(method =>
        method.includes('embed')
        || method.includes('rerank')
        || method.includes('classif')
        || method.includes('predict')
        || method.includes('token')
    );
}

function hasGenerationCapabilityDescriptor(descriptor: string): boolean {
    return descriptor.includes('chat')
        || descriptor.includes('completion')
        || descriptor.includes('response')
        || descriptor.includes('message')
        || descriptor.includes('generate')
        || descriptor.includes('stream')
        || descriptor.includes('reason')
        || descriptor.includes('assistant')
        || descriptor.includes('tool')
        || descriptor.includes('llm');
}

function hasNonGenerationCapabilityDescriptor(descriptor: string): boolean {
    return descriptor.includes('embed')
        || descriptor.includes('rerank')
        || descriptor.includes('rank')
        || descriptor.includes('classif')
        || descriptor.includes('moderation')
        || descriptor.includes('transcription')
        || descriptor.includes('speech')
        || descriptor.includes('audio')
        || descriptor.includes('tts')
        || descriptor.includes('image')
        || descriptor.includes('video')
        || descriptor.includes('vision-generation')
        || descriptor.includes('image-generation');
}

function hasGenerationEndpointDescriptor(descriptor: string): boolean {
    return descriptor.includes('chat/completions')
        || descriptor.includes('responses')
        || descriptor.includes('messages')
        || descriptor.includes('completions')
        || descriptor.includes('generate')
        || descriptor.includes('stream')
        || descriptor === 'chat'
        || descriptor.includes('text-generation');
}

function hasNonGenerationEndpointDescriptor(descriptor: string): boolean {
    return descriptor.includes('embedding')
        || descriptor.includes('rerank')
        || descriptor.includes('classif')
        || descriptor.includes('image')
        || descriptor.includes('speech')
        || descriptor.includes('audio')
        || descriptor.includes('tts')
        || descriptor.includes('transcription')
        || descriptor.includes('moderation');
}

function shouldKeepModelCandidate(entry: DiscoveredModelCandidate): boolean {
    const identifier = pickModelIdentifier(entry).toLowerCase();
    if (!identifier) {
        return false;
    }

    if (isExplicitlyUnavailableCandidate(entry)) {
        return false;
    }

    const type = getCandidateType(entry);
    if (type && ['embedding', 'embeddings', 'reranker', 'ranker', 'image', 'audio', 'tts', 'speech', 'classifier'].includes(type)) {
        return false;
    }

    const generationMethods = getCandidateGenerationMethods(entry);
    if (generationMethods.length > 0) {
        if (!hasGenerationMethod(generationMethods)) {
            return false;
        }
    }

    const capabilityDescriptors = getCandidateCapabilityDescriptors(entry);
    if (capabilityDescriptors.length > 0) {
        const hasGenerationCapability = capabilityDescriptors.some(hasGenerationCapabilityDescriptor);
        const hasOnlyNonGenerationCapabilities = !hasGenerationCapability
            && capabilityDescriptors.some(hasNonGenerationCapabilityDescriptor);
        if (hasOnlyNonGenerationCapabilities) {
            return false;
        }
    }

    const endpointDescriptors = getCandidateEndpointDescriptors(entry);
    if (endpointDescriptors.length > 0) {
        const hasGenerationEndpoint = endpointDescriptors.some(hasGenerationEndpointDescriptor);
        const hasOnlyNonGenerationEndpoints = !hasGenerationEndpoint
            && endpointDescriptors.some(hasNonGenerationEndpointDescriptor);
        if (hasOnlyNonGenerationEndpoints) {
            return false;
        }
    }

    const outputModalities = getCandidateOutputModalities(entry);
    if (outputModalities.length > 0) {
        const hasTextOutput = outputModalities.some(modality => modality.includes('text'));
        const hasOnlyNonTextOutput = !hasTextOutput
            && outputModalities.some(modality =>
                modality.includes('image')
                || modality.includes('audio')
                || modality.includes('speech')
                || modality.includes('video')
                || modality.includes('embedding')
                || modality.includes('vector')
            );
        if (hasOnlyNonTextOutput) {
            return false;
        }
    }

    if (
        /(^|[/-])(text-embedding|embedding|whisper|tts|speech|audio|imageclassification|classification|rerank|reranker|ranker)([/-]|$)/.test(identifier)
        || /(^|\/)(flux|imagen)([.-]|$)/.test(identifier)
        || /(^|\/)(kokoro|sonic)([.-]|$)/.test(identifier)
    ) {
        return false;
    }

    return true;
}

function extractCandidateEntries(collection: unknown): DiscoveredModelCandidate[] {
    if (Array.isArray(collection)) {
        return collection
            .map(entry => {
                if (typeof entry === 'string') {
                    return { id: entry };
                }
                return isRecord(entry) ? entry : null;
            })
            .filter((entry): entry is DiscoveredModelCandidate => entry !== null);
    }

    if (isRecord(collection)) {
        const metadataKeys = new Set([
            'availablemodels',
            'available_models',
            'body',
            'catalog',
            'catalogs',
            'count',
            'counts',
            'code',
            'cursor',
            'entries',
            'error',
            'errors',
            'has_more',
            'hasmore',
            'items',
            'last_id',
            'limit',
            'list',
            'message',
            'meta',
            'metadata',
            'model_cards',
            'model_list',
            'model_specs',
            'modeldata',
            'model_data',
            'modelcards',
            'modelspecs',
            'models',
            'next',
            'next_cursor',
            'next_page',
            'next_page_token',
            'nextpagetoken',
            'object',
            'offset',
            'page',
            'page_count',
            'page_info',
            'pageinfo',
            'page_size',
            'page_token',
            'pages',
            'payload',
            'paging',
            'pagination',
            'publisher_models',
            'publishermodels',
            'publisherModels',
            'prev',
            'prev_page',
            'previous',
            'provider_models',
            'providermodels',
            'providers',
            'response',
            'registry',
            'registries',
            'result',
            'result_count',
            'results',
            'rows',
            'records',
            'services',
            'status',
            'success',
            'total',
            'total_count',
            'total_pages',
            'value',
            'values'
        ]);

        return Object.entries(collection).flatMap(([key, value]) => {
            const normalizedKey = key.trim().toLowerCase();

            if (Array.isArray(value)) {
                return extractCandidateEntries(value);
            }
            if (isRecord(value)) {
                const nestedCollections = [
                    value.data,
                    value.entries,
                    value.models,
                    value.items,
                    value.list,
                    value.model_list,
                    value.model_cards,
                    value.modelCards,
                    value.catalog,
                    value.catalogs,
                    value.available_models,
                    value.availableModels,
                    value.value,
                    value.values,
                    value.rows,
                    value.records,
                    value.providers,
                    value.provider_models,
                    value.providerModels,
                    value.registry,
                    value.registries,
                    value.services,
                    value.model_specs,
                    value.modelSpecs,
                    value.model_data,
                    value.modelData,
                    value.response,
                    value.body,
                    value.payload,
                    value.results,
                    value.result,
                    value.publisherModels,
                    value.publisher_models
                ];
                const nestedEntries = nestedCollections.flatMap(nested => extractCandidateEntries(nested));
                if (nestedEntries.length > 0) {
                    return nestedEntries;
                }
                if (metadataKeys.has(normalizedKey)) {
                    return [];
                }
                return [{ id: key, ...value }];
            }
            if (metadataKeys.has(normalizedKey)) {
                return [];
            }
            if (typeof value === 'string') {
                return [{ id: key, name: value }];
            }
            return [{ id: key }];
        });
    }

    return [];
}
function getCandidateCollections(payload: any): unknown[] {
    return [
        Array.isArray(payload) ? payload : undefined,
        payload?.data,
        payload?.data?.data,
        payload?.data?.entries,
        payload?.data?.models,
        payload?.data?.items,
        payload?.data?.list,
        payload?.data?.model_list,
        payload?.data?.model_cards,
        payload?.data?.modelCards,
        payload?.data?.provider_models,
        payload?.data?.providerModels,
        payload?.data?.publisher_models,
        payload?.data?.publisherModels,
        payload?.data?.catalog,
        payload?.data?.catalog?.data,
        payload?.models,
        payload?.models?.data,
        payload?.list,
        payload?.items,
        payload?.entries,
        payload?.model_list,
        payload?.model_cards,
        payload?.modelCards,
        payload?.available_models,
        payload?.availableModels,
        payload?.catalog,
        payload?.catalog?.data,
        payload?.catalog?.models,
        payload?.catalog?.items,
        payload?.catalog?.list,
        payload?.catalog?.entries,
        payload?.catalog?.rows,
        payload?.catalog?.records,
        payload?.catalog?.providers,
        payload?.catalog?.provider_models,
        payload?.catalog?.providerModels,
        payload?.catalog?.registry,
        payload?.catalog?.registries,
        payload?.catalog?.services,
        payload?.catalog?.publisher_models,
        payload?.catalog?.publisherModels,
        payload?.catalogs,
        payload?.providers,
        payload?.provider_models,
        payload?.providerModels,
        payload?.registry,
        payload?.registries,
        payload?.services,
        payload?.publisher_models,
        payload?.publisherModels,
        payload?.value,
        payload?.values,
        payload?.rows,
        payload?.records,
        payload?.model_specs,
        payload?.modelSpecs,
        payload?.model_data,
        payload?.modelData,
        payload?.result,
        payload?.result?.data,
        payload?.result?.data?.data,
        payload?.result?.data?.entries,
        payload?.result?.data?.models,
        payload?.result?.data?.items,
        payload?.result?.data?.list,
        payload?.result?.data?.provider_models,
        payload?.result?.data?.providerModels,
        payload?.result?.data?.registry,
        payload?.result?.data?.registries,
        payload?.result?.data?.services,
        payload?.result?.data?.publisher_models,
        payload?.result?.data?.publisherModels,
        payload?.result?.models,
        payload?.result?.list,
        payload?.result?.items,
        payload?.result?.entries,
        payload?.result?.model_list,
        payload?.result?.available_models,
        payload?.result?.availableModels,
        payload?.result?.catalog,
        payload?.result?.catalog?.data,
        payload?.result?.catalog?.models,
        payload?.result?.catalog?.items,
        payload?.result?.catalog?.list,
        payload?.result?.catalog?.rows,
        payload?.result?.catalog?.records,
        payload?.result?.catalog?.providers,
        payload?.result?.catalog?.provider_models,
        payload?.result?.catalog?.providerModels,
        payload?.result?.catalog?.registry,
        payload?.result?.catalog?.registries,
        payload?.result?.catalog?.services,
        payload?.result?.catalog?.publisher_models,
        payload?.result?.catalog?.publisherModels,
        payload?.result?.providers,
        payload?.result?.provider_models,
        payload?.result?.providerModels,
        payload?.result?.registry,
        payload?.result?.registries,
        payload?.result?.services,
        payload?.result?.publisher_models,
        payload?.result?.publisherModels,
        payload?.response,
        payload?.response?.data,
        payload?.response?.data?.data,
        payload?.response?.data?.models,
        payload?.response?.data?.items,
        payload?.response?.data?.list,
        payload?.response?.data?.entries,
        payload?.response?.data?.provider_models,
        payload?.response?.data?.providerModels,
        payload?.response?.data?.registry,
        payload?.response?.data?.registries,
        payload?.response?.data?.services,
        payload?.response?.data?.publisher_models,
        payload?.response?.data?.publisherModels,
        payload?.response?.models,
        payload?.response?.items,
        payload?.response?.list,
        payload?.response?.entries,
        payload?.response?.available_models,
        payload?.response?.availableModels,
        payload?.response?.catalog,
        payload?.response?.catalog?.data,
        payload?.response?.catalog?.models,
        payload?.response?.catalog?.providers,
        payload?.response?.catalog?.provider_models,
        payload?.response?.catalog?.providerModels,
        payload?.response?.catalog?.registry,
        payload?.response?.catalog?.registries,
        payload?.response?.catalog?.services,
        payload?.response?.catalog?.publisher_models,
        payload?.response?.catalog?.publisherModels,
        payload?.response?.value,
        payload?.response?.values,
        payload?.response?.rows,
        payload?.response?.records,
        payload?.response?.providers,
        payload?.response?.provider_models,
        payload?.response?.providerModels,
        payload?.response?.registry,
        payload?.response?.registries,
        payload?.response?.services,
        payload?.response?.publisher_models,
        payload?.response?.publisherModels,
        payload?.results,
        payload?.payload,
        payload?.payload?.data,
        payload?.payload?.data?.data,
        payload?.payload?.data?.models,
        payload?.payload?.data?.items,
        payload?.payload?.data?.list,
        payload?.payload?.data?.entries,
        payload?.payload?.data?.provider_models,
        payload?.payload?.data?.providerModels,
        payload?.payload?.data?.registry,
        payload?.payload?.data?.registries,
        payload?.payload?.data?.services,
        payload?.payload?.data?.publisher_models,
        payload?.payload?.data?.publisherModels,
        payload?.payload?.models,
        payload?.payload?.items,
        payload?.payload?.list,
        payload?.payload?.entries,
        payload?.payload?.available_models,
        payload?.payload?.availableModels,
        payload?.payload?.catalog,
        payload?.payload?.catalog?.data,
        payload?.payload?.catalog?.models,
        payload?.payload?.catalog?.providers,
        payload?.payload?.catalog?.provider_models,
        payload?.payload?.catalog?.providerModels,
        payload?.payload?.catalog?.registry,
        payload?.payload?.catalog?.registries,
        payload?.payload?.catalog?.services,
        payload?.payload?.catalog?.publisher_models,
        payload?.payload?.catalog?.publisherModels,
        payload?.payload?.value,
        payload?.payload?.values,
        payload?.payload?.rows,
        payload?.payload?.records,
        payload?.payload?.providers,
        payload?.payload?.provider_models,
        payload?.payload?.providerModels,
        payload?.payload?.registry,
        payload?.payload?.registries,
        payload?.payload?.services,
        payload?.payload?.publisher_models,
        payload?.payload?.publisherModels,
        payload?.payload?.response,
        payload?.payload?.response?.data,
        payload?.payload?.response?.data?.provider_models,
        payload?.payload?.response?.data?.providerModels,
        payload?.payload?.response?.data?.registry,
        payload?.payload?.response?.data?.registries,
        payload?.payload?.response?.data?.services,
        payload?.payload?.response?.data?.publisher_models,
        payload?.payload?.response?.data?.publisherModels,
        payload?.body,
        payload?.body?.data,
        payload?.body?.data?.registry,
        payload?.body?.data?.registries,
        payload?.body?.data?.services,
        payload?.body?.models,
        payload?.body?.items,
        payload?.body?.list,
        payload?.body?.entries,
        payload?.body?.data?.provider_models,
        payload?.body?.data?.providerModels,
        payload?.body?.data?.publisher_models,
        payload?.body?.data?.publisherModels,
        payload?.body?.value,
        payload?.body?.values,
        payload?.body?.rows,
        payload?.body?.records,
        payload?.body?.providers,
        payload?.body?.provider_models,
        payload?.body?.providerModels,
        payload?.body?.registry,
        payload?.body?.registries,
        payload?.body?.services,
        payload?.body?.publisher_models,
        payload?.body?.publisherModels
    ];
}

function extractModelIdentifiers(payload: any): string[] {
    return getCandidateCollections(payload)
        .flatMap(collection => extractCandidateEntries(collection))
        .filter(entry => shouldKeepModelCandidate(entry))
        .map(entry => pickModelIdentifier(entry));
}

function extractDiscoveredProviderModels(payload: any): DiscoveredProviderModel[] {
    return normalizeDiscoveredProviderModels(
        getCandidateCollections(payload)
            .flatMap(collection => extractCandidateEntries(collection))
            .filter(entry => shouldKeepModelCandidate(entry))
            .map(entry => ({
                id: pickModelIdentifier(entry),
                label: pickModelLabel(entry),
                ownerHint: pickModelOwnerHint(entry),
                maxOutputTokens: pickModelMaxOutputTokens(entry)
            }))
    );
}

async function discoverOpenAICompatibleModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOpenAICompatibleEndpointBaseUrl(requireBaseUrl(provider));
    return discoverBoundedPaginatedCatalog(`${baseUrl}/models`, {
        headers: buildOpenAICompatibleProviderHeaders(provider)
    });
}

async function discoverAiHubMixModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const data = await fetchJson('https://aihubmix.com/api/v1/models?type=llm', {
        headers: buildOpenAICompatibleProviderHeaders(provider)
    });

    return extractDiscoveredProviderModels(data);
}

async function discoverGitHubModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeGitHubModelsBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    const [catalogPayload, v1Payload] = await Promise.all([
        discoverBoundedPaginatedCatalog(`${baseUrl}/catalog/models`, { headers }).catch(() => []),
        discoverBoundedPaginatedCatalog(`${baseUrl}/v1/models`, { headers }).catch(() => [])
    ]);

    return normalizeDiscoveredProviderModels([
        ...catalogPayload,
        ...v1Payload
    ]);
}

async function discoverPpioModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOpenAICompatibleEndpointBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    const [chatPayload, embeddingPayload, rerankerPayload] = await Promise.all([
        discoverBoundedPaginatedCatalog(`${baseUrl}/models`, { headers }),
        discoverBoundedPaginatedCatalog(`${baseUrl}/models?model_type=embedding`, { headers }).catch(() => []),
        discoverBoundedPaginatedCatalog(`${baseUrl}/models?model_type=reranker`, { headers }).catch(() => [])
    ]);

    return normalizeDiscoveredProviderModels([
        ...chatPayload,
        ...embeddingPayload,
        ...rerankerPayload
    ]);
}

function extractOvmsConfigModels(payload: any): DiscoveredProviderModel[] {
    if (!isRecord(payload)) {
        return [];
    }

    const models = Object.entries(payload)
        .filter(([, info]) => Array.isArray((info as Record<string, unknown>)?.model_version_status))
        .filter(([, info]) => {
            const statuses = (info as Record<string, unknown>).model_version_status;
            return Array.isArray(statuses) && statuses.some(status =>
                isRecord(status) && typeof status.state === 'string' && status.state.trim().toUpperCase() === 'AVAILABLE'
            );
        })
        .map(([modelId]) => ({ id: modelId }));

    return normalizeDiscoveredProviderModels(models);
}

async function discoverOvmsModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOvmsBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    try {
        const modernPayload = await fetchJson(`${baseUrl}/models`, { headers });
        return extractDiscoveredProviderModels(modernPayload);
    } catch (_error) {
        const legacyBaseUrl = trimTrailingSlashes(baseUrl).replace(/\/v3$/i, '/v1');
        const legacyPayload = await fetchJson(`${legacyBaseUrl}/config`, { headers });
        return extractOvmsConfigModels(legacyPayload);
    }
}

async function discoverVercelAIGatewayModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeVercelAIGatewayBaseUrl(requireBaseUrl(provider));
    const [modelsPayload, configPayload] = await Promise.all([
        discoverBoundedPaginatedCatalog(`${baseUrl}/v1/models`, {
            headers: buildOpenAICompatibleProviderHeaders(provider)
        }).catch(() => []),
        discoverBoundedPaginatedCatalog(`${baseUrl}/v3/ai/config`, {
            headers: buildVercelAIGatewayDiscoveryHeaders(provider)
        }).catch(() => [])
    ]);

    return normalizeDiscoveredProviderModels([
        ...modelsPayload,
        ...configPayload
    ]);
}

async function discoverOllamaModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOllamaBaseUrl(requireBaseUrl(provider));

    const data = await fetchJson(`${baseUrl}/tags`);
    const models = Array.isArray(data?.models)
        ? data.models.flatMap((entry: any) => {
            const modelId = typeof entry?.model === 'string' && entry.model.trim()
                ? entry.model.trim()
                : typeof entry?.name === 'string' && entry.name.trim()
                    ? entry.name.trim()
                    : '';
            return modelId ? [{ id: modelId }] : [];
        })
        : [];

    return normalizeDiscoveredProviderModels(models);
}

async function discoverGoogleModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeGoogleBaseUrl(requireBaseUrl(provider));
    const apiKey = provider.apiKey.trim();
    if (!apiKey) {
        throw new Error(`${provider.name} model discovery requires an API key.`);
    }

    const models: DiscoveredProviderModel[] = [];
    let nextPageToken = '';

    for (let page = 0; page < 20; page++) {
        const query = new URLSearchParams({ key: apiKey });
        if (nextPageToken) {
            query.set('pageToken', nextPageToken);
        }

        const data = await fetchJson(`${baseUrl}/models?${query.toString()}`);
        if (Array.isArray(data?.models)) {
            models.push(
                ...data.models
                    .filter((entry: any) => {
                        if (!shouldKeepModelCandidate(entry)) {
                            return false;
                        }

                        const methods: string[] = Array.isArray(entry?.supportedGenerationMethods)
                            ? entry.supportedGenerationMethods
                                .filter((method: unknown): method is string => typeof method === 'string')
                                .map((method: string) => method.trim().toLowerCase())
                            : [];
                        return methods.length === 0 || methods.some(method => method.includes('generate') || method.includes('stream'));
                    })
                    .map((entry: any) => ({
                        id: typeof entry?.name === 'string' ? entry.name.replace(/^models\//, '') : '',
                        label: typeof entry?.displayName === 'string' ? entry.displayName.trim() || undefined : undefined,
                        maxOutputTokens: pickPositiveInteger([entry?.outputTokenLimit, entry?.output_token_limit])
                    }))
            );
        }

        if (typeof data?.nextPageToken !== 'string' || !data.nextPageToken.trim()) {
            break;
        }
        nextPageToken = data.nextPageToken.trim();
    }

    return normalizeDiscoveredProviderModels(models);
}

async function discoverAnthropicModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeAnthropicBaseUrl(requireBaseUrl(provider));
    const apiKey = provider.apiKey.trim();
    if (!apiKey) {
        throw new Error(`${provider.name} model discovery requires an API key.`);
    }

    const headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
    };
    const models: DiscoveredProviderModel[] = [];
    let afterId = '';

    for (let page = 0; page < 20; page++) {
        const query = new URLSearchParams({ limit: '1000' });
        if (afterId) {
            query.set('after_id', afterId);
        }

        const data = await fetchJson(`${baseUrl}/models?${query.toString()}`, { headers });
        models.push(...extractDiscoveredProviderModels(data));

        if (data?.has_more !== true || typeof data?.last_id !== 'string' || !data.last_id.trim()) {
            break;
        }
        afterId = data.last_id.trim();
    }

    return normalizeDiscoveredProviderModels(models);
}

async function discoverTogetherModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOpenAICompatibleEndpointBaseUrl(requireBaseUrl(provider));
    const data = await fetchJson(`${baseUrl}/models`, {
        headers: buildOpenAICompatibleProviderHeaders(provider)
    });

    return extractDiscoveredProviderModels(data);
}

async function discoverOpenRouterModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOpenRouterBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    const [modelsPayload, embeddingModelsPayload] = await Promise.all([
        discoverBoundedPaginatedCatalog(`${baseUrl}/models`, { headers }).catch(() => []),
        discoverBoundedPaginatedCatalog(`${baseUrl}/embeddings/models`, { headers }).catch(() => [])
    ]);

    return normalizeDiscoveredProviderModels([
        ...modelsPayload,
        ...embeddingModelsPayload
    ]);
}

async function discoverLiteLlmModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeLiteLlmBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    const [modelsPayload, modelInfoPayload] = await Promise.all([
        discoverBoundedPaginatedCatalog(`${baseUrl}/models`, { headers }).catch(() => []),
        discoverBoundedPaginatedCatalog(`${baseUrl}/model/info`, { headers }).catch(() => [])
    ]);

    return normalizeDiscoveredProviderModels([
        ...modelsPayload,
        ...modelInfoPayload
    ]);
}

async function discoverHuaweiCloudModelArtsModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeHuaweiCloudModelArtsBaseUrl(requireBaseUrl(provider));
    const apiKey = provider.apiKey.trim();
    if (!apiKey) {
        throw new Error(`${provider.name} model discovery requires an API key.`);
    }

    const data = await fetchJson(`${baseUrl}/v2/models`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        }
    });

    return extractDiscoveredProviderModels(data);
}

async function discoverXaiLanguageModels(provider: LLMProviderConfig): Promise<DiscoveredProviderModel[]> {
    const baseUrl = normalizeOpenAICompatibleEndpointBaseUrl(requireBaseUrl(provider));
    const headers = buildOpenAICompatibleProviderHeaders(provider);

    try {
        const data = await fetchJson(`${baseUrl}/language-models`, { headers });
        return extractDiscoveredProviderModels(data);
    } catch (_error) {
        const fallbackData = await fetchJson(`${baseUrl}/models`, { headers });
        return extractDiscoveredProviderModels(fallbackData);
    }
}

function buildDetailedDiscoveryResult(
    entries: DiscoveredProviderModel[],
    source: 'remote' | 'none' = 'remote'
): ProviderModelDiscoveryDetailedResult {
    return {
        models: entries.map(entry => entry.id),
        entries,
        source
    };
}

export async function discoverProviderModelsDetailed(provider: LLMProviderConfig): Promise<ProviderModelDiscoveryDetailedResult> {
    const definition = resolveProviderModelDiscoveryDefinition(provider);

    switch (definition.mode) {
        case 'aihubmix-models':
            return buildDetailedDiscoveryResult(await discoverAiHubMixModels(provider));
        case 'github-models':
            return buildDetailedDiscoveryResult(await discoverGitHubModels(provider));
        case 'ppio-models':
            return buildDetailedDiscoveryResult(await discoverPpioModels(provider));
        case 'ovms-models':
            return buildDetailedDiscoveryResult(await discoverOvmsModels(provider));
        case 'openai-compatible-models':
            return buildDetailedDiscoveryResult(await discoverOpenAICompatibleModels(provider));
        case 'openrouter-models':
            return buildDetailedDiscoveryResult(await discoverOpenRouterModels(provider));
        case 'litellm-proxy-models':
            return buildDetailedDiscoveryResult(await discoverLiteLlmModels(provider));
        case 'huaweicloud-modelarts-models':
            return buildDetailedDiscoveryResult(await discoverHuaweiCloudModelArtsModels(provider));
        case 'anthropic-models':
            return buildDetailedDiscoveryResult(await discoverAnthropicModels(provider));
        case 'together-models':
            return buildDetailedDiscoveryResult(await discoverTogetherModels(provider));
        case 'vercel-ai-gateway-models':
            return buildDetailedDiscoveryResult(await discoverVercelAIGatewayModels(provider));
        case 'ollama-tags':
            return buildDetailedDiscoveryResult(await discoverOllamaModels(provider));
        case 'google-models':
            return buildDetailedDiscoveryResult(await discoverGoogleModels(provider));
        case 'xai-language-models':
            return buildDetailedDiscoveryResult(await discoverXaiLanguageModels(provider));
        case 'none':
        default:
            return buildDetailedDiscoveryResult([], 'none');
    }
}

export async function discoverProviderModels(provider: LLMProviderConfig): Promise<ProviderModelDiscoveryResult> {
    const result = await discoverProviderModelsDetailed(provider);
    return {
        models: result.models,
        source: result.source
    };
}
