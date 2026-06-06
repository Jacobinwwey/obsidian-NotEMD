#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
    MAIN_BUNDLE_OUTPUT_FILE,
    REQUIRED_RELEASE_ASSET_FILES,
    RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH,
    RELEASE_TAG_PATTERN_SOURCE,
    RELEASE_WORKFLOW_SOURCE_BRANCH,
    resolveReleaseNotesRelativePaths,
    RENDER_HOST_AUDIT_MARKERS,
    RENDER_HOST_STANDALONE_OUTPUT_FILES
} = require('./lib/packaging-contract.js');

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

const DEFAULT_REQUIRED_RELEASE_ASSETS = [...REQUIRED_RELEASE_ASSET_FILES];
const DEFAULT_RENDER_HOST_AUDIT_MARKERS = [...RENDER_HOST_AUDIT_MARKERS];
const DEFAULT_DISALLOWED_RENDER_HOST_OUTPUTS = [...RENDER_HOST_STANDALONE_OUTPUT_FILES];
const DEFAULT_CONTRACT_PROMOTION_OPERATION_IDS = [
    'workflow.extract-and-generate',
    'content.extract-original-text',
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
    const idPattern = new RegExp(`id\\s*:\\s*'${escapeRegExp(operationId)}'`, 'm');
    const match = idPattern.exec(source);
    if (!match || match.index === undefined) {
        return '';
    }

    const objectStart = source.lastIndexOf('{', match.index);
    if (objectStart < 0) {
        return '';
    }

    const objectSource = extractBalancedBraceSource(source, objectStart);
    return objectSource.includes(`id: '${operationId}'`) ? objectSource : '';
}

function parseSingleQuotedField(source, fieldName) {
    const match = source.match(new RegExp(`${fieldName}\\s*:\\s*'([^']+)'`));
    return match ? match[1] : '';
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

function resolvePackagingBoundaryFactsFromBundleConfig({
    bundleConfigPath = path.resolve(__dirname, 'lib', 'esbuild-bundle-config.js')
} = {}) {
    try {
        const bundleConfig = require(bundleConfigPath);
        const mainBuildOptions = typeof bundleConfig.createMainBundleBuildOptions === 'function'
            ? bundleConfig.createMainBundleBuildOptions()
            : null;

        if (!mainBuildOptions || typeof mainBuildOptions !== 'object') {
            return null;
        }

        const entryPointsValue = mainBuildOptions.entryPoints;
        const entryPoints = Array.isArray(entryPointsValue)
            ? entryPointsValue.filter((entryPoint) => typeof entryPoint === 'string' && entryPoint.length > 0)
            : [];
        const outfile = typeof mainBuildOptions.outfile === 'string' ? mainBuildOptions.outfile : '';
        const outdir = typeof mainBuildOptions.outdir === 'string' ? mainBuildOptions.outdir : '';

        if (entryPoints.length === 0 && !outfile && !outdir) {
            return null;
        }

        return {
            sourcePath: bundleConfigPath,
            entryPoints: entryPoints.length > 0 ? entryPoints : ['<unknown-entry>'],
            outfile,
            outdir,
            outputTargetStatus: resolveOutputTargetStatus({ outfile, outdir }),
            resolvedFromConfig: true
        };
    } catch {
        return null;
    }
}

function resolvePackagingBoundaryFacts({
    esbuildConfigPath = path.resolve(__dirname, '..', 'esbuild.config.mjs'),
    bundleConfigPath = path.resolve(__dirname, 'lib', 'esbuild-bundle-config.js')
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

        const resolvedFromConfig = entryPoints.length > 0 || Boolean(outfile) || Boolean(outdir);
        if (!resolvedFromConfig) {
            const factsFromBundleConfig = resolvePackagingBoundaryFactsFromBundleConfig({ bundleConfigPath });
            if (factsFromBundleConfig) {
                return factsFromBundleConfig;
            }
        }

        return {
            sourcePath: esbuildConfigPath,
            entryPoints: entryPoints.length > 0 ? entryPoints : ['<unknown-entry>'],
            outfile,
            outdir,
            outputTargetStatus,
            resolvedFromConfig
        };
    } catch {
        const factsFromBundleConfig = resolvePackagingBoundaryFactsFromBundleConfig({ bundleConfigPath });
        if (factsFromBundleConfig) {
            return factsFromBundleConfig;
        }

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
    const fallbackTagPattern = RELEASE_TAG_PATTERN_SOURCE;

    try {
        const releaseHelper = require(releaseHelperPath);
        const requiredAssets = Array.isArray(releaseHelper.REQUIRED_RELEASE_ASSETS)
            ? releaseHelper.REQUIRED_RELEASE_ASSETS.filter((asset) => typeof asset === 'string' && asset.length > 0)
            : [];
        const tagPattern = releaseHelper.OBSIDIAN_RELEASE_TAG_PATTERN instanceof RegExp
            ? releaseHelper.OBSIDIAN_RELEASE_TAG_PATTERN.source
            : fallbackTagPattern;
        const supportsReleaseModeSwitch = typeof releaseHelper.buildGhReleaseCommands === 'function'
            || typeof releaseHelper.buildGhReleaseCommand === 'function';

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

function resolveRenderHostAuditFacts({
    auditScriptPath = path.resolve(__dirname, 'audit-render-host-bundle.js')
} = {}) {
    const projectRoot = path.resolve(__dirname, '..');

    try {
        const auditScript = require(auditScriptPath);
        const requiredMarkers = Array.isArray(auditScript.REQUIRED_RENDER_HOST_MARKERS)
            ? auditScript.REQUIRED_RENDER_HOST_MARKERS.filter((marker) => typeof marker === 'string' && marker.length > 0)
            : [];
        const disallowedStandaloneOutputs = Array.isArray(auditScript.DISALLOWED_RENDER_HOST_OUTPUT_FILES)
            ? auditScript.DISALLOWED_RENDER_HOST_OUTPUT_FILES.filter((outputPath) => typeof outputPath === 'string' && outputPath.length > 0)
            : [];
        const bundlePath = typeof auditScript.resolveBundlePath === 'function'
            ? normalizeRelativePath(auditScript.resolveBundlePath(projectRoot), projectRoot)
            : MAIN_BUNDLE_OUTPUT_FILE;

        if (requiredMarkers.length > 0) {
            return {
                sourcePath: auditScriptPath,
                bundlePath: bundlePath || MAIN_BUNDLE_OUTPUT_FILE,
                requiredMarkers,
                disallowedStandaloneOutputs: disallowedStandaloneOutputs.length > 0
                    ? disallowedStandaloneOutputs
                    : [...DEFAULT_DISALLOWED_RENDER_HOST_OUTPUTS],
                resolvedFromAuditScript: true
            };
        }
    } catch {
        // fall through to default facts
    }

    return {
        sourcePath: auditScriptPath,
        bundlePath: MAIN_BUNDLE_OUTPUT_FILE,
        requiredMarkers: [...DEFAULT_RENDER_HOST_AUDIT_MARKERS],
        disallowedStandaloneOutputs: [...DEFAULT_DISALLOWED_RENDER_HOST_OUTPUTS],
        resolvedFromAuditScript: false
    };
}

function resolveReleaseWorkflowTriggerFacts({
    releaseWorkflowPath = path.resolve(__dirname, '..', '.github', 'workflows', 'release.yml')
} = {}) {
    try {
        const workflowSource = fs.readFileSync(releaseWorkflowPath, 'utf8');
        const validatesWithSharedHelper = workflowSource.includes('node scripts/release/validate-release-tag.js "$TAG_NAME"');
        const workflowSourceEnvLine = `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH: ${RELEASE_WORKFLOW_SOURCE_BRANCH}`;
        const chronicleTargetEnvLine = `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH: ${RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`;
        const checkoutsWorkflowSourcesFromConfiguredBranch = workflowSource.includes('Check out workflow sources')
            && workflowSource.includes(workflowSourceEnvLine)
            && workflowSource.includes('ref: ${{ env.NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH }}');
        const refreshesChronicleOnConfiguredBranch = workflowSource.includes('refresh_chronicle:')
            && workflowSource.includes('node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"')
            && workflowSource.includes('node scripts/release/commit-chronicle-refresh.js "$TAG_NAME" --target-branch "$NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH"')
            && workflowSource.includes(chronicleTargetEnvLine)
            && workflowSource.includes('ref: ${{ env.NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH }}');
        return {
            sourcePath: releaseWorkflowPath,
            hasWorkflowDispatch: workflowSource.includes('workflow_dispatch:'),
            hasTagPushTrigger: workflowSource.includes("tags:") && workflowSource.includes("- '*.*.*'"),
            checksOutWorkflowSourcesFromConfiguredBranch: checkoutsWorkflowSourcesFromConfiguredBranch,
            refreshesChronicleOnConfiguredBranch,
            workflowSourceBranch: RELEASE_WORKFLOW_SOURCE_BRANCH,
            chronicleTargetBranch: RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH,
            rejectsVPrefixedTagTrigger: !workflowSource.includes("- 'v*.*.*'") && !workflowSource.includes("- 'V*.*.*'"),
            validatesNumericTagPattern: validatesWithSharedHelper
                || workflowSource.includes('^[0-9]+\\.[0-9]+\\.[0-9]+$'),
            resolvedFromWorkflowFile: true
        };
    } catch {
        return {
            sourcePath: releaseWorkflowPath,
            hasWorkflowDispatch: false,
            hasTagPushTrigger: false,
            checksOutWorkflowSourcesFromConfiguredBranch: false,
            refreshesChronicleOnConfiguredBranch: false,
            workflowSourceBranch: RELEASE_WORKFLOW_SOURCE_BRANCH,
            chronicleTargetBranch: RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH,
            rejectsVPrefixedTagTrigger: false,
            validatesNumericTagPattern: false,
            resolvedFromWorkflowFile: false
        };
    }
}

function resolveContractPromotionBoundaryFacts({
    registryPath = path.resolve(__dirname, '..', 'src', 'operations', 'registry.ts'),
    trackedOperationIds = DEFAULT_CONTRACT_PROMOTION_OPERATION_IDS
} = {}) {
    try {
        const source = fs.readFileSync(registryPath, 'utf8');
        const operationFacts = trackedOperationIds.map((operationId) => {
            const definitionSource = extractOperationDefinitionSource(source, operationId);
            const automationLevel = parseSingleQuotedField(definitionSource, 'automationLevel');
            const requiredContext = parseSingleQuotedField(definitionSource, 'requiredContext');
            const sideEffectClass = parseSingleQuotedField(definitionSource, 'sideEffectClass');
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
        return {
            sourcePath: registryPath,
            operationFacts: trackedOperationIds.map((operationId) => ({
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

function resolveRenderHostRuntimeConsumptionFacts({
    mainPath = path.resolve(__dirname, '..', 'src', 'main.ts'),
    previewModalPath = path.resolve(__dirname, '..', 'src', 'ui', 'DiagramPreviewModal.ts'),
    pagePath = path.resolve(__dirname, '..', 'src', 'rendering', 'webview', 'page.ts'),
    renderFramePath = path.resolve(__dirname, '..', 'src', 'rendering', 'webview', 'renderFrame.ts')
} = {}) {
    try {
        const mainSource = fs.readFileSync(mainPath, 'utf8');
        const previewModalSource = fs.readFileSync(previewModalPath, 'utf8');
        const pageSource = fs.readFileSync(pagePath, 'utf8');
        const renderFrameSource = fs.readFileSync(renderFramePath, 'utf8');

        const mainCreatesIframeRenderHostSession = mainSource.includes('new IframeRenderHost().createSession(');
        const openPreviewDelegatesThroughModal = mainSource.includes('this.openDiagramPreviewModal(artifact, sourcePath, artifactSaved)');
        const previewModalUsesIframeSrcdoc = previewModalSource.includes('iframe.srcdoc = this.session.htmlSrcdoc');
        const pageUsesRenderArtifactMarkup = pageSource.includes('renderArtifactMarkup(payload)');
        const pageTreatsBridgeTargetsAsInlinePreviewable = pageSource.includes("payload.artifact.target === 'vega-lite' || payload.artifact.target === 'mermaid'")
            && pageSource.includes('ensureRenderHostBridge();');
        const renderFrameSupportsMermaid = renderFrameSource.includes("payload.artifact.target === 'mermaid'")
            && renderFrameSource.includes('notemd-mermaid-mount')
            && renderFrameSource.includes('buildMermaidRenderBootstrap');
        const renderFrameSupportsVegaLite = renderFrameSource.includes("payload.artifact.target === 'vega-lite'")
            && renderFrameSource.includes('notemd-vega-lite-mount')
            && renderFrameSource.includes('buildVegaLiteRenderBootstrap');

        return {
            sourcePaths: [mainPath, previewModalPath, pagePath, renderFramePath],
            mainCreatesIframeRenderHostSession,
            openPreviewDelegatesThroughModal,
            previewModalUsesIframeSrcdoc,
            pageUsesRenderArtifactMarkup,
            pageTreatsBridgeTargetsAsInlinePreviewable,
            renderFrameSupportsMermaid,
            renderFrameSupportsVegaLite,
            resolvedFromSources: true
        };
    } catch {
        return {
            sourcePaths: [mainPath, previewModalPath, pagePath, renderFramePath],
            mainCreatesIframeRenderHostSession: false,
            openPreviewDelegatesThroughModal: false,
            previewModalUsesIframeSrcdoc: false,
            pageUsesRenderArtifactMarkup: false,
            pageTreatsBridgeTargetsAsInlinePreviewable: false,
            renderFrameSupportsMermaid: false,
            renderFrameSupportsVegaLite: false,
            resolvedFromSources: false
        };
    }
}

function resolveRenderHostRuntimeModuleSpecifierFacts({
    runtimeClientPath = path.resolve(__dirname, '..', 'src', 'rendering', 'preview', 'renderHostRuntimeClient.ts')
} = {}) {
    try {
        const runtimeClientSource = fs.readFileSync(runtimeClientPath, 'utf8');
        const resolveFunctionReturnsNullableSpecifier = runtimeClientSource.includes('resolveBundledRenderHostRuntimeModuleSpecifier(): string | null');
        const resolveFunctionReturnsConfiguredSpecifierOnly = runtimeClientSource.includes('return configuredBundledRenderHostRuntimeModuleSpecifier;');
        const defaultStandaloneRuntimeFallbackAbsent = !runtimeClientSource.includes('render-host.mjs')
            && !runtimeClientSource.includes('pathToFileURL(')
            && !runtimeClientSource.includes('path.resolve(');

        return {
            sourcePath: runtimeClientPath,
            resolveFunctionReturnsNullableSpecifier,
            resolveFunctionReturnsConfiguredSpecifierOnly,
            defaultStandaloneRuntimeFallbackAbsent,
            resolvedFromSource: true
        };
    } catch {
        return {
            sourcePath: runtimeClientPath,
            resolveFunctionReturnsNullableSpecifier: false,
            resolveFunctionReturnsConfiguredSpecifierOnly: false,
            defaultStandaloneRuntimeFallbackAbsent: false,
            resolvedFromSource: false
        };
    }
}

function buildPackagingBoundaryChecklistLines(
    packagingFacts = resolvePackagingBoundaryFacts(),
    runtimeModuleSpecifierFacts = resolveRenderHostRuntimeModuleSpecifierFacts()
) {
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
    const runtimeModuleSpecifierPath = normalizeRelativePath(runtimeModuleSpecifierFacts.sourcePath);
    const runtimeModuleSpecifierDescriptor = runtimeModuleSpecifierFacts.resolvedFromSource
        ? `derived from \`${runtimeModuleSpecifierPath}\``
        : `fallback reminder because \`${runtimeModuleSpecifierPath}\` could not be loaded`;
    const singleEntryLine = entryCount === 1
        ? `- [ ] Confirm the current build truth is still single-entry (${sourceDescriptor}): \`${entrySummary} -> ${outputDescriptor}\` only.`
        : `- [ ] Confirm current build entrypoint count before making packaging claims (${sourceDescriptor}): \`${entrySummary}\` -> \`${outputDescriptor}\`.`;
    const runtimeModuleSpecifierLine = runtimeModuleSpecifierFacts.resolveFunctionReturnsNullableSpecifier
        && runtimeModuleSpecifierFacts.resolveFunctionReturnsConfiguredSpecifierOnly
        ? `- [ ] Confirm latent render-host runtime-module specifier truth remains ${runtimeModuleSpecifierDescriptor}: \`resolveBundledRenderHostRuntimeModuleSpecifier()\` exposes only an explicitly configured module specifier and otherwise returns \`null\`.`
        : `- [ ] Resolve latent render-host runtime-module specifier behavior from \`${runtimeModuleSpecifierPath}\` before claiming any standalone render-host asset is implied by current source.`;
    const runtimeModuleSpecifierFallbackLine = runtimeModuleSpecifierFacts.defaultStandaloneRuntimeFallbackAbsent
        ? '- [ ] Confirm no default standalone runtime-path synthesis (`render-host.mjs`, `pathToFileURL(...)`, or relative file URL fallback) has been reintroduced on the current single-entry lane.'
        : '- [ ] Remove any default standalone runtime-path synthesis before claiming the current single-entry lane remains fail-closed.';

    return [
        singleEntryLine,
        outputResolutionLine,
        runtimeModuleSpecifierLine,
        runtimeModuleSpecifierFallbackLine,
        '- [ ] Confirm `npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract, including rejection of stray `render-host.mjs` assets or references.',
        '- [ ] Confirm no release note, handoff, or PR summary claims that true heavy-runtime isolation is already implemented.',
        '- [ ] If the change depends on stronger packaging guarantees, record that true heavy-runtime isolation is still pending and requires later multi-entry or dedicated-asset work.'
    ];
}

function buildRenderHostAuditChecklistLines(
    auditFacts = resolveRenderHostAuditFacts()
) {
    const auditScriptPath = normalizeRelativePath(auditFacts.sourcePath);
    const sourceDescriptor = auditFacts.resolvedFromAuditScript
        ? `derived from \`${auditScriptPath}\``
        : `fallback default because \`${auditScriptPath}\` could not be loaded`;
    const requiredMarkers = auditFacts.requiredMarkers.map((marker) => `\`${marker}\``).join(', ');
    const disallowedOutputs = auditFacts.disallowedStandaloneOutputs.map((outputPath) => `\`${outputPath}\``).join(', ');

    return [
        `- [ ] Confirm render-host audit truth remains ${sourceDescriptor} and still targets built bundle \`${auditFacts.bundlePath}\`.`,
        `- [ ] Confirm inline render-host marker enforcement still covers: ${requiredMarkers}.`,
        `- [ ] Confirm standalone render-host outputs remain disallowed on current main: ${disallowedOutputs}.`,
        '- [ ] If render-host audit scope changes, update helper/tests/runbooks in the same batch so packaging truth does not drift.'
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
    const workflowSourceCheckoutDescriptor = workflowFacts.checksOutWorkflowSourcesFromConfiguredBranch
        ? `checked-in workflow sources are validated from configured workflow-source branch \`${workflowFacts.workflowSourceBranch}\` before release-ref checkout`
        : 'workflow-source checkout inspection incomplete';
    const tagGuardDescriptor = workflowFacts.validatesNumericTagPattern && workflowFacts.rejectsVPrefixedTagTrigger
        ? 'numeric-tag regex guard present and v-prefixed wildcard triggers absent'
        : 'tag-guard inspection incomplete';
    const chronicleDescriptor = workflowFacts.refreshesChronicleOnConfiguredBranch
        ? `chronicle refresh still runs on configured chronicle-target branch \`${workflowFacts.chronicleTargetBranch}\` and commits back through the checked-in helper`
        : 'chronicle-refresh workflow inspection incomplete';

    return [
        `- [ ] Confirm release asset contract remains ${sourceDescriptor}: ${requiredAssets}.`,
        `- [ ] Confirm release tag contract remains numeric-only: \`/${releaseTagPattern}/\` (no \`v\` prefix).`,
        `- [ ] Confirm release publish mode contract remains ${releaseModeDescriptor}: create path composes bilingual notes, existing-release path uploads assets with \`--clobber\`.`,
        `- [ ] Confirm release workflow trigger contract remains ${workflowDescriptor}: ${triggerDescriptor}.`,
        `- [ ] Confirm release workflow source-checkout contract remains ${workflowDescriptor}: ${workflowSourceCheckoutDescriptor}.`,
        `- [ ] Confirm release workflow tag-guard contract remains ${workflowDescriptor}: ${tagGuardDescriptor}.`,
        `- [ ] Confirm release notes contract remains dual-file: \`${resolveReleaseNotesRelativePaths('<tag>').english}\` and \`${resolveReleaseNotesRelativePaths('<tag>').simplifiedChinese}\`.`,
        `- [ ] Confirm release workflow chronicle contract remains ${workflowDescriptor}: ${chronicleDescriptor}.`,
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

function buildRenderHostRuntimeConsumptionChecklistLines(
    runtimeFacts = resolveRenderHostRuntimeConsumptionFacts()
) {
    const sourceDescriptor = runtimeFacts.resolvedFromSources
        ? `derived from ${runtimeFacts.sourcePaths.map((sourcePath) => `\`${normalizeRelativePath(sourcePath)}\``).join(', ')}`
        : `fallback reminder because runtime-consumption sources could not be loaded`;
    const lines = [
        `- [ ] Confirm render-host runtime-consumption truth remains ${sourceDescriptor}.`
    ];

    if (runtimeFacts.mainCreatesIframeRenderHostSession && runtimeFacts.openPreviewDelegatesThroughModal) {
        lines.push('- [ ] Confirm command-entry preview flow still routes through `openDiagramPreviewModal(...)` and `new IframeRenderHost().createSession(...)`.');
    } else {
        lines.push('- [ ] Resolve command-entry preview/session wiring before making runtime-consumption claims.');
    }

    if (runtimeFacts.previewModalUsesIframeSrcdoc) {
        lines.push('- [ ] Confirm preview modal still consumes `session.htmlSrcdoc` through iframe `srcdoc` instead of relying on a separate packaged render-host asset.');
    } else {
        lines.push('- [ ] Resolve preview-modal iframe `srcdoc` consumption before making runtime-consumption claims.');
    }

    if (runtimeFacts.pageUsesRenderArtifactMarkup && runtimeFacts.pageTreatsBridgeTargetsAsInlinePreviewable) {
        lines.push('- [ ] Confirm webview page still builds inline Mermaid / Vega-Lite preview shells through `renderArtifactMarkup(payload)` and `ensureRenderHostBridge()`.');
    } else {
        lines.push('- [ ] Resolve webview page render-host bridge usage before making runtime-consumption claims.');
    }

    if (runtimeFacts.renderFrameSupportsMermaid && runtimeFacts.renderFrameSupportsVegaLite) {
        lines.push('- [ ] Confirm `renderFrame` still provides dedicated Mermaid and Vega-Lite mount/bootstrap shells inside the inline host markup.');
    } else {
        lines.push('- [ ] Resolve Mermaid / Vega-Lite inline host markup coverage before making runtime-consumption claims.');
    }

    return lines;
}

function buildImplementationReadinessChecklistLines(
    packagingFacts = resolvePackagingBoundaryFacts()
) {
    const packagingDescriptor = packagingFacts.entryPoints.length === 1 && packagingFacts.outputTargetStatus === 'outfile'
        ? `current single-entry lane \`${packagingFacts.entryPoints[0]} -> ${packagingFacts.outfile}\``
        : `current packaging lane \`${packagingFacts.entryPoints.join(', ')} -> ${packagingFacts.outputTargetStatus === 'outdir' ? `${packagingFacts.outdir}/...` : packagingFacts.outfile || '<unknown-output>'}\``;

    return [
        `- [ ] Treat ${packagingDescriptor} as the current implementation baseline unless this batch explicitly changes packaging topology.`,
        '- [ ] If packaging topology widens, update `esbuild.config.mjs`, `scripts/audit-render-host-bundle.js`, helper output/tests, maintainer docs, and release-helper expectations in the same batch.',
        '- [ ] Do not claim true heavy-runtime isolation until build outputs, render-host audit, runtime-consumption chain, and release contract all prove the new boundary together.',
        '- [ ] Keep real Obsidian semantic verification mandatory for renderer-affecting changes even when helper/docs contracts are green.'
    ];
}

function buildStageCGateChecklistLines() {
    return [
        '- [ ] Treat any future Stage-C widening as blocked unless packaging boundary, render-host audit, runtime-consumption, release contract, and contract-promotion boundary sections stay explicit together.',
        '- [ ] Confirm current main still ships the inline `htmlSrcdoc` preview host contract rather than a standalone packaged render-host asset.',
        '- [ ] If a future change introduces dedicated runtime assets, add matching release-asset rules, helper output, tests, maintainer docs, and real Obsidian evidence in the same batch before calling Stage-C widened.'
    ];
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
    const renderHostAuditChecklistLines = buildRenderHostAuditChecklistLines();
    const renderHostRuntimeConsumptionChecklistLines = buildRenderHostRuntimeConsumptionChecklistLines();
    const implementationReadinessChecklistLines = buildImplementationReadinessChecklistLines(packagingFacts);
    const releasePackagingChecklistLines = buildReleasePackagingContractChecklistLines(releasePackagingFacts);
    const contractPromotionChecklistLines = buildContractPromotionBoundaryChecklistLines();
    const stageCGateChecklistLines = buildStageCGateChecklistLines();
    headerLines.push('', '## Packaging Boundary', '');
    headerLines.push(...packagingChecklistLines);
    headerLines.push('', '## Render Host Audit', '');
    headerLines.push(...renderHostAuditChecklistLines);
    headerLines.push('', '## Render Host Runtime Consumption', '');
    headerLines.push(...renderHostRuntimeConsumptionChecklistLines);
    headerLines.push('', '## Implementation Readiness', '');
    headerLines.push(...implementationReadinessChecklistLines);
    headerLines.push('', '## Packaging Contract', '');
    headerLines.push(...releasePackagingChecklistLines);
    headerLines.push('', '## Contract Promotion Boundary', '');
    headerLines.push(...contractPromotionChecklistLines);
    headerLines.push('', '## Stage-C Gate', '');
    headerLines.push(...stageCGateChecklistLines);
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
    buildImplementationReadinessChecklistLines,
    buildPackagingBoundaryChecklistLines,
    buildContractPromotionBoundaryChecklistLines,
    buildRenderHostAuditChecklistLines,
    buildRenderHostRuntimeConsumptionChecklistLines,
    buildReleasePackagingContractChecklistLines,
    buildSemanticVerificationTemplate,
    buildStageCGateChecklistLines,
    main,
    parseArgs,
    resolvePackagingBoundaryFacts,
    resolveContractPromotionBoundaryFacts,
    resolveRenderHostAuditFacts,
    resolveRenderHostRuntimeModuleSpecifierFacts,
    resolveRenderHostRuntimeConsumptionFacts,
    resolveReleasePackagingContractFacts,
    resolveReleaseWorkflowTriggerFacts,
    resolveRequestedSurfaces,
    writeSemanticVerificationTemplate
};
