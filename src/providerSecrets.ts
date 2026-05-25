export function redactApiKey(apiKey: string): string {
    if (!apiKey) {
        return '(empty)';
    }

    if (apiKey.length <= 6) {
        return '[REDACTED]';
    }

    return `${apiKey.slice(0, 3)}...${apiKey.slice(-3)} (redacted)`;
}
