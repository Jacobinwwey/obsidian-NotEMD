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

function buildSemanticVerificationTemplate({ vaultName, commit, version, surfaces }) {
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

    headerLines.push(
        '',
        '## Packaging Boundary',
        '',
        '- [ ] Confirm the current build truth is still single-entry: `esbuild.config.mjs` ships `src/main.ts -> main.js` only.',
        '- [ ] Confirm `npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract.',
        '- [ ] Confirm no release note, handoff, or PR summary claims that true heavy-runtime isolation is already implemented.',
        '- [ ] If the change depends on stronger packaging guarantees, record that true heavy-runtime isolation is still pending and requires later multi-entry or dedicated-asset work.',
        '',
        '## Surface Evidence'
    );

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
    buildSemanticVerificationTemplate,
    main,
    parseArgs,
    resolveRequestedSurfaces,
    writeSemanticVerificationTemplate
};
