import { inferDiagramIntent } from '../diagram/intent';

describe('diagram intent inference', () => {
    test('infers flowchart intent for procedural notes', () => {
        const markdown = `# Release Checklist

1. Validate manifest version
2. If checks fail, stop the release
3. If checks pass, publish the package
4. Then notify users
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('flowchart');
        expect(result.reasons.join(' ')).toMatch(/step|if|then/i);
    });

    test('infers sequence intent for request-response interactions', () => {
        const markdown = `# API Login Flow

Client sends login request to gateway.
Gateway forwards the request to auth service.
Auth service returns a token response to gateway.
Gateway returns the response to client.
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('sequence');
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('infers dataChart intent for percentage share summaries', () => {
        const markdown = `# Traffic Mix

Organic share: 40%
Paid share: 25%
Referral share: 35%
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/share|percentage/i);
    });

    test('infers dataChart intent for paired numeric comparisons', () => {
        const markdown = `# Latency vs Throughput

Run A: latency 120 ms, throughput 45 req/s
Run B: latency 180 ms, throughput 70 req/s
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/comparison|numeric/i);
    });

    test('infers dataChart intent for ranked issue counts', () => {
        const markdown = `# Top Issues

- Timeouts: 12
- Retries: 7
- Rate limits: 4
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('dataChart');
        expect(result.reasons.join(' ')).toMatch(/ranked|numeric/i);
    });

    test('falls back to mindmap for general hierarchical notes', () => {
        const markdown = `# Distributed Systems

## Consistency
- Strong consistency
- Eventual consistency

## Availability
- Fault tolerance
- Replication
`;

        const result = inferDiagramIntent(markdown);

        expect(result.intent).toBe('mindmap');
    });
});
