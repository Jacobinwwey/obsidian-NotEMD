#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SURFACE_DEFINITIONS = [
    {
        id: 'mermaid',
        label: 'Mermaid',
        aliases: ['mermaid'],
        checks: [
            'generation completes without unexpected fallback failure',
            'saved artifact opens in Obsidian',
            'rendered graph is visually intact',
            'if Mermaid auto-fix is expected, the saved file reflects the repaired output'
        ]
    },
    {
        id: 'json-canvas',
        label: 'JSON Canvas',
        aliases: ['json-canvas', 'jsoncanvas', 'canvas', 'json_canvas'],
        checks: [
            'output file is created with expected extension',
            'canvas opens in Obsidian without load error',
            'nodes/edges appear instead of an empty or malformed graph'
        ]
    },
    {
        id: 'vega-lite',
        label: 'Vega-Lite',
        aliases: ['vega-lite', 'vegalite', 'vega_lite'],
        checks: [
            'saved artifact contains the expected fenced `vega-lite` block',
            'preview opens through the plugin preview path',
            'chart renders rather than showing blank or broken host output'
        ]
    }
];

const DEFAULT_REQUIRED_RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'README.md'];
const DEFAULT_CONTRACT_PROMOTION_OPERATION_SELECTORS = [
    'workflow.extract-and-generate',
    'content.extract-original-text',
    'editor.create-link-and-generate',
    'file.process-*',
    'concept.extract-*',
    'provider.profile.export',
    'provider.profile.import',
    'cli.capability-manifest.export',
    'cli.invocation-contract.export'
];
const DEFAULT_CONTRACT_PROMOTION_FALLBACK_OPERATION_IDS = [
    'workflow.extract-and-generate',
    'content.extract-original-text',
    'editor.create-link-and-generate',
    'file.process-add-links',
    'file.process-folder-add-links',
    'concept.extract-file',
    'concept.extract-folder',
    'provider.profile.export',
    'provider.profile.import',
    'cli.capability-manifest.export',
    'cli.invocation-contract.export'
];

const NORMALIZED_SURFACE_LOOKUP = new Map(
    SURFACE_DEFINITIONS.flatMap((surface) =>
        surface.aliases.map((alias) => [alias.toLowerCase(), surface])
    )
);

const USAGE_TEXT = [
    'Usage: node scripts/diagram-semantic-verification.js [options] [surface ...]',
    '',
    'Options:',
    '  --vault <name>       Vault name used for CLI environment checks',
    '  --commit <sha>       Commit to record in the template',
    '  --version <version>  Plugin version to record in the template',
    '  --output <path>      Write the generated Markdown template to a file',
    '  --surface <id>       Add one semantic surface (repeatable)',
    '  --surfaces <list>    Add comma-separated semantic surfaces',
    '  --help               Print this usage text',
    '',
    'Supported surfaces: mermaid, json-canvas, vega-lite'
].join('\n');

function parseQuotedArrayLiteralValue(source, key) {
    const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'm'));
    if (!match) {
        return [];
    }

    const values = [];
    const valuePattern = /(["'`])([^"'`]+)\1/g;
    let valueMatch = valuePattern.exec(match[1]);
    while (valueMatch) {
        values.push(valueMatch[2]);
        valueMatch = valuePattern.exec(match[1]);
    }
    return values;
}

function parseQuotedObjectLiteralValues(source, key) {
    const match = source.match(new RegExp(`${key}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'm'));
    if (!match) {
        return [];
    }

    const values = [];
    const valuePattern = /:\s*(["'`])([^"'`]+)\1/g;
    let valueMatch = valuePattern.exec(match[1]);
    while (valueMatch) {
        values.push(valueMatch[2]);
        valueMatch = valuePattern.exec(match[1]);
    }
    return values;
}

function parseQuotedScalarValue(source, key) {
    const match = source.match(new RegExp(`${key}\\s*:\\s*(["'\`])([^"'\`]+)\\1`, 'm'));
    return match ? match[2] : '';
}

function extractBalancedBraceSource(source, startIndex) {
    if (startIndex < 0 || source[startIndex] !== '{') {
        return '';
    }

    let depth = 0;
    let inString = '';
    let escaping = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let cursor = startIndex; cursor < source.length; cursor += 1) {
        const char = source[cursor];
        const nextChar = source[cursor + 1];

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                cursor += 1;
            }
            continue;
        }

        if (inString) {
            if (escaping) {
                escaping = false;
                continue;
            }
            if (char === '\\') {
                escaping = true;
                continue;
            }
            if (char === inString) {
                inString = '';
            }
            continue;
        }

        if (char === '/' && nextChar === '/') {
            inLineComment = true;
            cursor += 1;
            continue;
        }

        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            cursor += 1;
            continue;
        }

        if (char === '"' || char === '\'' || char === '`') {
            inString = char;
            continue;
        }

        if (char === '{') {
            depth += 1;
            continue;
        }

        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(startIndex, cursor + 1);
            }
        }
    }

    return '';
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractOperationDefinitionSource(source, operationId) {
    const idPattern = new RegExp(`id\\s*:\\s*(["'\`])${escapeRegExp(operationId)}\\1`, 'm');
    const match = idPattern.exec(source);
    if (!match || match.index === undefined) {
        return '';
    }

    const objectStart = source.lastIndexOf('{', match.index);
    if (objectStart < 0) {
        return '';
    }

    const objectSource = extractBalancedBraceSource(source, objectStart);
    const operationIdPattern = new RegExp(`id\\s*:\\s*(["'\`])${escapeRegExp(operationId)}\\1`, 'm');
    return operationIdPattern.test(objectSource) ? objectSource : '';
}

function parseQuotedField(source, fieldName) {
    const match = source.match(new RegExp(`${fieldName}\\s*:\\s*(["'\`])([^"'\`]+)\\1`));
    return match ? match[2] : '';
}

function isWildcardSelector(selector) {
    return selector.endsWith('*') && selector.indexOf('*') === selector.length - 1;
}

function extractOperationIdsFromRegistrySource(source) {
    const operationIds = [];
    const seen = new Set();
    const idPattern = /\bid\s*:\s*(["'`])([^"'`]+)\1/g;

    let match = idPattern.exec(source);
    while (match) {
        const operationId = match[2];
        if (!seen.has(operationId)) {
            seen.add(operationId);
            operationIds.push(operationId);
        }
        match = idPattern.exec(source);
    }

    return operationIds;
}

function resolveTrackedOperationIdsFromSource(
    source,
    trackedOperationSelectors = DEFAULT_CONTRACT_PROMOTION_OPERATION_SELECTORS
) {
    const availableOperationIds = extractOperationIdsFromRegistrySource(source);
    const trackedOperationIds = [];
    const seen = new Set();

    const appendId = (operationId) => {
        if (!seen.has(operationId)) {
            seen.add(operationId);
            trackedOperationIds.push(operationId);
        }
    };

    for (const selector of trackedOperationSelectors) {
        if (isWildcardSelector(selector)) {
            const prefix = selector.slice(0, -1);
            for (const availableId of availableOperationIds) {
                if (availableId.startsWith(prefix)) {
                    appendId(availableId);
                }
            }
            continue;
        }
        appendId(selector);
    }

    return trackedOperationIds;
}

function resolveFallbackTrackedOperationIds(
    trackedOperationSelectors = DEFAULT_CONTRACT_PROMOTION_OPERATION_SELECTORS
) {
    const trackedOperationIds = [];
    const seen = new Set();

    const appendId = (operationId) => {
        if (!seen.has(operationId)) {
            seen.add(operationId);
            trackedOperationIds.push(operationId);
        }
    };

    for (const selector of trackedOperationSelectors) {
        if (isWildcardSelector(selector)) {
            const prefix = selector.slice(0, -1);
            for (const fallbackId of DEFAULT_CONTRACT_PROMOTION_FALLBACK_OPERATION_IDS) {
                if (fallbackId.startsWith(prefix)) {
                    appendId(fallbackId);
                }
            }
            continue;
        }
        appendId(selector);
    }

    return trackedOperationIds.length > 0
        ? trackedOperationIds
        : [...DEFAULT_CONTRACT_PROMOTION_FALLBACK_OPERATION_IDS];
}

function extractEsbuildContextOptionsSource(source) {
    const contextCallMatch = source.match(/esbuild\.context\s*\(/m);
    if (!contextCallMatch || contextCallMatch.index === undefined) {
        return '';
    }

    let index = contextCallMatch.index + contextCallMatch[0].length;
    while (index < source.length && /\s/.test(source[index])) {
        index += 1;
    }
    if (source[index] !== '{') {
        return '';
    }

    let depth = 0;
    let objectStart = -1;
    let inString = '';
    let escaping = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let cursor = index; cursor < source.length; cursor += 1) {
        const char = source[cursor];
        const nextChar = source[cursor + 1];

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                cursor += 1;
            }
            continue;
        }

        if (inString) {
            if (escaping) {
                escaping = false;
                continue;
            }
            if (char === '\\') {
                escaping = true;
                continue;
            }
            if (char === inString) {
                inString = '';
            }
            continue;
        }

        if (char === '/' && nextChar === '/') {
            inLineComment = true;
            cursor += 1;
            continue;
        }

        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            cursor += 1;
            continue;
        }

        if (char === '"' || char === '\'' || char === '`') {
            inString = char;
            continue;
        }

        if (char === '{') {
            if (depth === 0) {
                objectStart = cursor;
            }
            depth += 1;
            continue;
        }

        if (char === '}') {
            depth -= 1;
            if (depth === 0 && objectStart >= 0) {
                return source.slice(objectStart, cursor + 1);
            }
        }
    }

    return '';
}

function resolveOutputTargetStatus({ outfile, outdir }) {
    if (outfile && outdir) {
        return 'ambiguous';
    }
    if (outfile) {
        return 'outfile';
    }
    if (outdir) {
        return 'outdir';
    }
    return 'unknown';
}

function resolvePackagingBoundaryFacts({
    esbuildConfigPath = path.resolve(__dirname, '..', 'esbuild.config.mjs')
} = {}) {
    try {
        const source = fs.readFileSync(esbuildConfigPath, 'utf8');
        const contextOptionsSource = extractEsbuildContextOptionsSource(source);
        const parsingSource = contextOptionsSource || source;
        const arrayEntryPoints = parseQuotedArrayLiteralValue(parsingSource, 'entryPoints');
        const objectEntryPoints = parseQuotedObjectLiteralValues(parsingSource, 'entryPoints');
        const entryPoints = arrayEntryPoints.length > 0 ? arrayEntryPoints : objectEntryPoints;
        const outfile = parseQuotedScalarValue(parsingSource, 'outfile');
        const outdir = parseQuotedScalarValue(parsingSource, 'outdir');
        const outputTargetStatus = resolveOutputTargetStatus({ outfile, outdir });

        return {
            sourcePath: esbuildConfigPath,
            entryPoints: entryPoints.length > 0 ? entryPoints : ['<unknown-entry>'],
            outfile,
            outdir,
            outputTargetStatus,
            resolvedFromConfig: entryPoints.length > 0 || Boolean(outfile) || Boolean(outdir)
        };
    } catch {
        return {
            sourcePath: esbuildConfigPath,
            entryPoints: ['<unknown-entry>'],
            outfile: '<unknown-outfile>',
            outdir: '',
            outputTargetStatus: 'unknown',
            resolvedFromConfig: false
        };
    }
}

function normalizeRelativePath(filePath, basePath = path.resolve(__dirname, '..')) {
    return path.relative(basePath, filePath).split(path.sep).join('/');
}

function resolveReleasePackagingContractFacts({
    releaseHelperPath = path.resolve(__dirname, 'release', 'publish-github-release.js')
} = {}) {
    const fallbackTagPattern = '^\\d+\\.\\d+\\.\\d+$';

    try {
        const releaseHelper = require(releaseHelperPath);
        const requiredAssets = Array.isArray(releaseHelper.REQUIRED_RELEASE_ASSETS)
            ? releaseHelper.REQUIRED_RELEASE_ASSETS.filter((asset) => typeof asset === 'string' && asset.length > 0)
            : [];
        const tagPattern = releaseHelper.OBSIDIAN_RELEASE_TAG_PATTERN instanceof RegExp
            ? releaseHelper.OBSIDIAN_RELEASE_TAG_PATTERN.source
            : fallbackTagPattern;
        const supportsReleaseModeSwitch = typeof releaseHelper.buildGhReleaseCommand === 'function';

        if (requiredAssets.length > 0) {
            return {
                sourcePath: releaseHelperPath,
                requiredAssets,
                releaseTagPattern: tagPattern,
                supportsReleaseModeSwitch,
                resolvedFromReleaseHelper: true
            };
        }
    } catch {
        // fall through to default facts
    }

    return {
        sourcePath: releaseHelperPath,
        requiredAssets: [...DEFAULT_REQUIRED_RELEASE_ASSETS],
        releaseTagPattern: fallbackTagPattern,
        supportsReleaseModeSwitch: false,
        resolvedFromReleaseHelper: false
    };
}

function resolveReleaseWorkflowTriggerFacts({
    releaseWorkflowPath = path.resolve(__dirname, '..', '.github', 'workflows', 'release.yml')
} = {}) {
    try {
        const workflowSource = fs.readFileSync(releaseWorkflowPath, 'utf8');
        return {
            sourcePath: releaseWorkflowPath,
            hasWorkflowDispatch: workflowSource.includes('workflow_dispatch:'),
            hasTagPushTrigger: workflowSource.includes("tags:") && workflowSource.includes("- '*.*.*'"),
            rejectsVPrefixedTagTrigger: !workflowSource.includes("- 'v*.*.*'") && !workflowSource.includes("- 'V*.*.*'"),
            validatesNumericTagPattern: workflowSource.includes('^[0-9]+\\.[0-9]+\\.[0-9]+$'),
            resolvedFromWorkflowFile: true
        };
    } catch {
        return {
            sourcePath: releaseWorkflowPath,
            hasWorkflowDispatch: false,
            hasTagPushTrigger: false,
            rejectsVPrefixedTagTrigger: false,
            validatesNumericTagPattern: false,
            resolvedFromWorkflowFile: false
        };
    }
}

function resolveContractPromotionBoundaryFacts({
    registryPath = path.resolve(__dirname, '..', 'src', 'operations', 'registry.ts'),
    trackedOperationIds = DEFAULT_CONTRACT_PROMOTION_OPERATION_SELECTORS
    } = {}) {
    try {
        const source = fs.readFileSync(registryPath, 'utf8');
        const resolvedTrackedOperationIds = resolveTrackedOperationIdsFromSource(source, trackedOperationIds);
        const operationIdsForFacts = resolvedTrackedOperationIds.length > 0
            ? resolvedTrackedOperationIds
            : resolveFallbackTrackedOperationIds(trackedOperationIds);
        const operationFacts = operationIdsForFacts.map((operationId) => {
            const definitionSource = extractOperationDefinitionSource(source, operationId);
            const automationLevel = parseQuotedField(definitionSource, 'automationLevel');
            const requiredContext = parseQuotedField(definitionSource, 'requiredContext');
            const sideEffectClass = parseQuotedField(definitionSource, 'sideEffectClass');
            const resolved = Boolean(definitionSource) && Boolean(automationLevel) && Boolean(requiredContext) && Boolean(sideEffectClass);

            return {
                operationId,
                automationLevel: automationLevel || '<unknown>',
                requiredContext: requiredContext || '<unknown>',
                sideEffectClass: sideEffectClass || '<unknown>',
                resolved
            };
        });

        return {
            sourcePath: registryPath,
            operationFacts,
            resolvedFromRegistry: true
        };
    } catch {
        const fallbackOperationIds = resolveFallbackTrackedOperationIds(trackedOperationIds);
        return {
            sourcePath: registryPath,
            operationFacts: fallbackOperationIds.map((operationId) => ({
                operationId,
                automationLevel: '<unknown>',
                requiredContext: '<unknown>',
                sideEffectClass: '<unknown>',
                resolved: false
            })),
            resolvedFromRegistry: false
        };
    }
}

function buildPackagingBoundaryChecklistLines(packagingFacts = resolvePackagingBoundaryFacts()) {
    const entrySummary = packagingFacts.entryPoints.join(', ');
    const entryCount = packagingFacts.entryPoints.length;
    const outputTargetStatus = packagingFacts.outputTargetStatus || resolveOutputTargetStatus(packagingFacts);
    const outputDescriptor = outputTargetStatus === 'outfile'
        ? packagingFacts.outfile
        : (outputTargetStatus === 'outdir'
            ? `${packagingFacts.outdir}/...`
            : (outputTargetStatus === 'ambiguous'
                ? `outfile=${packagingFacts.outfile}, outdir=${packagingFacts.outdir}/...`
                : '<unknown-output>'));
    const outputResolutionLine = outputTargetStatus === 'unknown'
        ? '- [ ] Build config output target was not resolved automatically; manually confirm whether this build uses `outfile` or `outdir` before making packaging claims.'
        : (outputTargetStatus === 'ambiguous'
            ? '- [ ] Build config appears to define both `outfile` and `outdir`; manually confirm the active output target before making packaging claims.'
            : `- [ ] Confirm build output target still matches packaging expectations (\`${outputTargetStatus}\`) for this change.`);
    const configFileName = path.basename(packagingFacts.sourcePath);
    const sourceDescriptor = packagingFacts.resolvedFromConfig
        ? `resolved from \`${configFileName}\``
        : `fallback placeholder because \`${configFileName}\` could not be parsed`;
    const singleEntryLine = entryCount === 1
        ? `- [ ] Confirm the current build truth is still single-entry (${sourceDescriptor}): \`${entrySummary} -> ${outputDescriptor}\` only.`
        : `- [ ] Confirm current build entrypoint count before making packaging claims (${sourceDescriptor}): \`${entrySummary}\` -> \`${outputDescriptor}\`.`;

    return [
        singleEntryLine,
        outputResolutionLine,
        '- [ ] Confirm `npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract.',
        '- [ ] Confirm no release note, handoff, or PR summary claims that true heavy-runtime isolation is already implemented.',
        '- [ ] If the change depends on stronger packaging guarantees, record that true heavy-runtime isolation is still pending and requires later multi-entry or dedicated-asset work.'
    ];
}

function buildReleasePackagingContractChecklistLines(
    releaseFacts = resolveReleasePackagingContractFacts(),
    workflowFacts = resolveReleaseWorkflowTriggerFacts()
) {
    const releaseHelperPath = normalizeRelativePath(releaseFacts.sourcePath);
    const releaseWorkflowPath = normalizeRelativePath(workflowFacts.sourcePath);
    const sourceDescriptor = releaseFacts.resolvedFromReleaseHelper
        ? `derived from \`${releaseHelperPath}\``
        : `fallback default because \`${releaseHelperPath}\` could not be loaded`;
    const requiredAssets = releaseFacts.requiredAssets.map((asset) => `\`${asset}\``).join(', ');
    const releaseTagPattern = releaseFacts.releaseTagPattern || '^\\d+\\.\\d+\\.\\d+$';
    const releaseModeDescriptor = releaseFacts.supportsReleaseModeSwitch
        ? 'derived from release helper create/upload mode logic'
        : 'fallback reminder because release helper mode logic could not be inspected';
    const workflowDescriptor = workflowFacts.resolvedFromWorkflowFile
        ? `derived from \`${releaseWorkflowPath}\``
        : `fallback reminder because \`${releaseWorkflowPath}\` could not be loaded`;
    const triggerDescriptor = workflowFacts.hasTagPushTrigger && workflowFacts.hasWorkflowDispatch
        ? 'tag push (`*.*.*`) + `workflow_dispatch`'
        : 'trigger inspection incomplete';
    const tagGuardDescriptor = workflowFacts.validatesNumericTagPattern && workflowFacts.rejectsVPrefixedTagTrigger
        ? 'numeric-tag regex guard present and v-prefixed wildcard triggers absent'
        : 'tag-guard inspection incomplete';

    return [
        `- [ ] Confirm release asset contract remains ${sourceDescriptor}: ${requiredAssets}.`,
        `- [ ] Confirm release tag contract remains numeric-only: \`/${releaseTagPattern}/\` (no \`v\` prefix).`,
        `- [ ] Confirm release publish mode contract remains ${releaseModeDescriptor}: create path composes bilingual notes, existing-release path uploads assets with \`--clobber\`.`,
        `- [ ] Confirm release workflow trigger contract remains ${workflowDescriptor}: ${triggerDescriptor}.`,
        `- [ ] Confirm release workflow tag-guard contract remains ${workflowDescriptor}: ${tagGuardDescriptor}.`,
        '- [ ] Confirm release notes contract remains dual-file: `docs/releases/<tag>.md` and `docs/releases/<tag>.zh-CN.md`.',
        '- [ ] If packaging output shape changes (for example, moving from `outfile` to `outdir`), update release-helper tests and maintainer docs in the same change.'
    ];
}

function buildContractPromotionBoundaryChecklistLines(
    contractFacts = resolveContractPromotionBoundaryFacts()
) {
    const registryPath = normalizeRelativePath(contractFacts.sourcePath);
    const sourceDescriptor = contractFacts.resolvedFromRegistry
        ? `derived from \`${registryPath}\``
        : `fallback reminder because \`${registryPath}\` could not be loaded`;
    const lines = [
        `- [ ] Confirm contract-promotion boundary truth remains ${sourceDescriptor}.`
    ];

    for (const operationFact of contractFacts.operationFacts) {
        if (operationFact.resolved) {
            lines.push(`- [ ] Confirm \`${operationFact.operationId}\` remains \`automationLevel=${operationFact.automationLevel}\`, \`requiredContext=${operationFact.requiredContext}\`, \`sideEffectClass=${operationFact.sideEffectClass}\`.`);
        } else {
            lines.push(`- [ ] Resolve operation contract metadata for \`${operationFact.operationId}\` from \`${registryPath}\` before promoting related workflow/settings/export claims.`);
        }
    }

    lines.push('- [ ] If any operation metadata above changes, update capability/contract tests and maintainer docs in the same change before promoting broader CLI or workflow/settings claims.');
    return lines;
}

function normalizeSurfaceId(value) {
    return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function resolveRequestedSurfaces(surfaces = []) {
    if (!surfaces || surfaces.length === 0) {
        return SURFACE_DEFINITIONS.map(({ id, label }) => ({ id, label }));
    }

    const resolved = [];
    const seen = new Set();

    for (const surfaceValue of surfaces) {
        const normalized = normalizeSurfaceId(surfaceValue);
        const surface = NORMALIZED_SURFACE_LOOKUP.get(normalized);
        if (!surface) {
            const supported = SURFACE_DEFINITIONS.map(({ id }) => id).join(', ');
            throw new Error(`Unsupported diagram semantic surface "${surfaceValue}". Supported values: ${supported}`);
        }
        if (seen.has(surface.id)) {
            continue;
        }
        seen.add(surface.id);
        resolved.push({ id: surface.id, label: surface.label });
    }

    return resolved;
}

function buildEnvironmentCheckCommands(vaultName) {
    const commands = [
        'obsidian help',
        'obsidian-cli help',
        'obsidian vaults verbose'
    ];

    if (vaultName) {
        commands.push(`obsidian plugin id=notemd vault="${vaultName}"`);
        commands.push(`obsidian commands vault="${vaultName}" filter=notemd`);
    }

    return commands;
}

function buildSemanticVerificationTemplate({
    vaultName,
    commit,
    version,
    surfaces,
    packagingFacts,
    releasePackagingFacts
}) {
    const repoGates = [
        'npm run build',
        'npm test -- --runInBand',
        'npm run audit:i18n-ui',
        'npm run audit:render-host',
        'git diff --check'
    ];
    const environmentChecks = buildEnvironmentCheckCommands(vaultName);

    const headerLines = [
        '# Notemd Diagram Semantic Verification',
        '',
        `Vault: ${vaultName || '<fill vault name>'}`,
        `Commit: ${commit || '<fill commit>'}`,
        `Version: ${version || '<fill version>'}`,
        '',
        '## Repo Gates',
        ''
    ];

    for (const command of repoGates) {
        headerLines.push(`- [ ] \`${command}\``);
    }

    headerLines.push('', '## Environment Checks', '');
    for (const command of environmentChecks) {
        headerLines.push(`- [ ] \`${command}\``);
    }

    const packagingChecklistLines = buildPackagingBoundaryChecklistLines(packagingFacts);
    const releasePackagingChecklistLines = buildReleasePackagingContractChecklistLines(releasePackagingFacts);
    const contractPromotionChecklistLines = buildContractPromotionBoundaryChecklistLines();
    headerLines.push('', '## Packaging Boundary', '');
    headerLines.push(...packagingChecklistLines);
    headerLines.push('', '## Packaging Contract', '');
    headerLines.push(...releasePackagingChecklistLines);
    headerLines.push('', '## Contract Promotion Boundary', '');
    headerLines.push(...contractPromotionChecklistLines);
    headerLines.push('', '## Surface Evidence');

    for (const surface of surfaces) {
        const definition = SURFACE_DEFINITIONS.find((candidate) => candidate.id === surface.id);
        if (!definition) {
            continue;
        }

        headerLines.push('', `## ${definition.label}`, '');
        headerLines.push('Command: <fill command used>');
        headerLines.push('Artifact: <fill output path>');
        headerLines.push('Result: PENDING');
        headerLines.push('Evidence: <fill screenshot path or live visual-check note>');
        headerLines.push('', 'Checks:');
        for (const check of definition.checks) {
            headerLines.push(`- [ ] ${check}`);
        }
    }

    return `${headerLines.join('\n')}\n`;
}

function writeSemanticVerificationTemplate(template, outputPath) {
    if (!outputPath) {
        return null;
    }

    const resolvedPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, template, 'utf8');
    return resolvedPath;
}

function readOptionValue(argv, index, optionName) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${optionName}`);
    }
    return value;
}

function appendSurfaceValues(target, value) {
    target.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
}

function parseArgs(argv = process.argv.slice(2)) {
    const result = {
        vault: '',
        commit: '',
        version: '',
        output: '',
        surfaces: [],
        help: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case '--vault':
                result.vault = readOptionValue(argv, index, '--vault');
                index += 1;
                break;
            case '--commit':
                result.commit = readOptionValue(argv, index, '--commit');
                index += 1;
                break;
            case '--version':
                result.version = readOptionValue(argv, index, '--version');
                index += 1;
                break;
            case '--output':
                result.output = readOptionValue(argv, index, '--output');
                index += 1;
                break;
            case '--surface':
            case '--surfaces':
                appendSurfaceValues(result.surfaces, readOptionValue(argv, index, arg));
                index += 1;
                break;
            case '--help':
                result.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    throw new Error(`Unknown argument: ${arg}`);
                }
                result.surfaces.push(arg);
                break;
        }
    }

    return result;
}

function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(USAGE_TEXT);
        return 0;
    }
    const surfaces = resolveRequestedSurfaces(args.surfaces);
    const template = buildSemanticVerificationTemplate({
        vaultName: args.vault,
        commit: args.commit,
        version: args.version,
        surfaces
    });
    const writtenPath = writeSemanticVerificationTemplate(template, args.output);

    if (writtenPath) {
        console.log(`Diagram semantic verification template written to ${writtenPath}`);
    } else {
        process.stdout.write(template);
    }

    return 0;
}

if (require.main === module) {
    try {
        process.exitCode = main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

module.exports = {
    SURFACE_DEFINITIONS,
    USAGE_TEXT,
    buildEnvironmentCheckCommands,
    buildPackagingBoundaryChecklistLines,
    buildContractPromotionBoundaryChecklistLines,
    buildReleasePackagingContractChecklistLines,
    buildSemanticVerificationTemplate,
    main,
    parseArgs,
    resolvePackagingBoundaryFacts,
    resolveContractPromotionBoundaryFacts,
    resolveReleasePackagingContractFacts,
    resolveReleaseWorkflowTriggerFacts,
    resolveRequestedSurfaces,
    writeSemanticVerificationTemplate
};
