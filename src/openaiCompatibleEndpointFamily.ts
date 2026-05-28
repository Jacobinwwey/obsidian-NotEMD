export type OpenAICompatibleEndpointFamily =
    | 'aihubmix'
    | 'github-models'
    | 'ovms'
    | 'ppio'
    | 'openrouter'
    | 'requesty'
    | 'vercel-ai-gateway'
    | 'together'
    | 'huaweicloud-modelarts'
    | 'litellm-proxy'
    | 'cerebras'
    | 'xai';

const OPENAI_COMPATIBLE_FAMILY_PROVIDER_CANDIDATES: Partial<Record<OpenAICompatibleEndpointFamily, string[]>> = {
    aihubmix: ['AIHubMix'],
    'github-models': ['GitHub Models'],
    ovms: ['OVMS'],
    ppio: ['PPIO'],
    openrouter: ['OpenRouter'],
    requesty: ['Requesty'],
    'vercel-ai-gateway': ['Vercel AI Gateway'],
    together: ['Together'],
    'huaweicloud-modelarts': ['Huawei Cloud MaaS'],
    cerebras: ['Cerebras'],
    xai: ['xAI']
};

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

export function normalizeOpenAICompatibleEndpointBaseUrl(baseUrl: string): string {
    let normalized = trimTrailingSlashes(stripUrlSearchAndHash(baseUrl));
    if (!normalized) {
        return '';
    }

    const knownSuffixes = [
        '/chat/completions',
        '/embeddings/models',
        '/language-models',
        '/model/info',
        '/responses',
        '/models'
    ];

    for (const suffix of knownSuffixes) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
            break;
        }
    }

    if (normalized.endsWith('/v1/ai')) {
        normalized = normalized.slice(0, -'/ai'.length);
    }

    return trimTrailingSlashes(normalized);
}

function parseOpenAICompatibleEndpointUrl(baseUrl: string): URL | null {
    const normalized = normalizeOpenAICompatibleEndpointBaseUrl(baseUrl);
    if (!normalized) {
        return null;
    }

    try {
        return new URL(normalized);
    } catch (_error) {
        return null;
    }
}

function parseRawOpenAICompatibleEndpointUrl(baseUrl: string): URL | null {
    const trimmed = trimTrailingSlashes(baseUrl.trim());
    if (!trimmed) {
        return null;
    }

    try {
        return new URL(trimmed);
    } catch (_error) {
        return null;
    }
}

function isSingleLabelHost(hostname: string): boolean {
    return hostname.length > 0 && !hostname.includes('.');
}

function isPrivateIpv4(hostname: string): boolean {
    const octets = hostname.split('.').map(part => Number.parseInt(part, 10));
    if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        return false;
    }

    if (octets[0] === 10) {
        return true;
    }

    if (octets[0] === 127) {
        return true;
    }

    if (octets[0] === 169 && octets[1] === 254) {
        return true;
    }

    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
        return true;
    }

    return octets[0] === 192 && octets[1] === 168;
}

function isPrivateIpv6(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    return normalized === '::1'
        || normalized.startsWith('fc')
        || normalized.startsWith('fd')
        || normalized.startsWith('fe80:');
}

function isLocalLiteLlmProxyHost(hostname: string): boolean {
    return hostname === 'localhost'
        || hostname === '0.0.0.0'
        || hostname === 'host.docker.internal'
        || hostname.endsWith('.local')
        || hostname.endsWith('.localdomain')
        || hostname.endsWith('.home.arpa')
        || isSingleLabelHost(hostname)
        || isPrivateIpv4(hostname)
        || isPrivateIpv6(hostname);
}

export function detectOpenAICompatibleEndpointFamily(baseUrl: string): OpenAICompatibleEndpointFamily | undefined {
    const parsedUrl = parseOpenAICompatibleEndpointUrl(baseUrl);
    const rawParsedUrl = parseRawOpenAICompatibleEndpointUrl(baseUrl);
    if (!parsedUrl) {
        return undefined;
    }

    const hostname = parsedUrl.hostname.trim().toLowerCase();
    const pathname = trimTrailingSlashes(parsedUrl.pathname.trim().toLowerCase());
    const rawPathname = trimTrailingSlashes(rawParsedUrl?.pathname.trim().toLowerCase() ?? '');

    if (hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai')) {
        return 'openrouter';
    }

    if (hostname === 'models.github.ai') {
        return 'github-models';
    }

    if (isLocalLiteLlmProxyHost(hostname) && (pathname === '/v3' || rawPathname === '/v1/config')) {
        return 'ovms';
    }

    if (hostname === 'api.ppinfra.com' || hostname.endsWith('.ppinfra.com')) {
        return 'ppio';
    }

    if (hostname === 'aihubmix.com' || hostname.endsWith('.aihubmix.com')) {
        return 'aihubmix';
    }

    if (hostname === 'router.requesty.ai' || hostname.endsWith('.requesty.ai')) {
        return 'requesty';
    }

    if (
        hostname === 'ai-gateway.vercel.sh'
        || hostname.endsWith('.ai-gateway.vercel.sh')
        || /(^|\/)v1\/ai(?:\/chat\/completions|\/responses|\/models)?$/i.test(rawPathname)
    ) {
        return 'vercel-ai-gateway';
    }

    if (hostname === 'api.together.xyz' || hostname.endsWith('.together.xyz')) {
        return 'together';
    }

    if (hostname === 'api.modelarts-maas.com' || hostname.endsWith('.modelarts-maas.com')) {
        return 'huaweicloud-modelarts';
    }

    if (hostname === 'api.cerebras.ai' || hostname.endsWith('.cerebras.ai')) {
        return 'cerebras';
    }

    if (hostname === 'api.x.ai' || hostname.endsWith('.x.ai')) {
        return 'xai';
    }

    if (isLocalLiteLlmProxyHost(hostname)) {
        return 'litellm-proxy';
    }

    return undefined;
}

export function inferKnownOpenAICompatibleProviderNames(baseUrl: string): string[] {
    const parsedUrl = parseOpenAICompatibleEndpointUrl(baseUrl);
    if (!parsedUrl) {
        return [];
    }

    const family = detectOpenAICompatibleEndpointFamily(baseUrl);
    if (family && family !== 'litellm-proxy') {
        return OPENAI_COMPATIBLE_FAMILY_PROVIDER_CANDIDATES[family] ?? [];
    }

    const hostname = parsedUrl.hostname.trim().toLowerCase();

    if (hostname === 'api.deepseek.com') {
        return ['DeepSeek'];
    }

    if (hostname === 'dashscope.aliyuncs.com') {
        return ['Qwen Code', 'Qwen'];
    }

    if (hostname === 'ark.cn-beijing.volces.com') {
        return ['Doubao'];
    }

    if (hostname === 'api.moonshot.cn') {
        return ['Moonshot'];
    }

    if (hostname === 'api.xiaomimimo.com') {
        return ['Xiaomi MiMo'];
    }

    if (hostname === 'open.bigmodel.cn') {
        return ['GLM'];
    }

    if (hostname === 'api.z.ai') {
        return ['Z AI'];
    }

    if (hostname === 'api.minimaxi.com') {
        return ['MiniMax'];
    }

    if (hostname === 'qianfan.baidubce.com') {
        return ['Baidu Qianfan'];
    }

    if (hostname === 'api.siliconflow.cn') {
        return ['SiliconFlow'];
    }

    if (hostname === 'api.openai.com') {
        return ['OpenAI'];
    }

    if (hostname === 'api.mistral.ai') {
        return ['Mistral'];
    }

    if (hostname === 'api.x.ai') {
        return ['xAI'];
    }

    if (hostname === 'api.groq.com') {
        return ['Groq'];
    }

    if (hostname === 'api.fireworks.ai') {
        return ['Fireworks'];
    }

    if (hostname === 'api.studio.nebius.com') {
        return ['Nebius'];
    }

    if (hostname === 'router.huggingface.co') {
        return ['Hugging Face'];
    }

    return [];
}
