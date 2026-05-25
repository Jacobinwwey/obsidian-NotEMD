#!/usr/bin/env node

const fs = require('fs');
const { spawnSync } = require('child_process');
const { OPERATION_HELP } = require('./lib/maintainer-cli-operation-help.js');

function printUsage() {
  const operationDetails = Object.entries(OPERATION_HELP)
    .map(([operationId, details]) => {
      const optionalLine = details.optional.length > 0
        ? `\n    optional: ${details.optional.join(', ')}`
        : '';
      return `  ${operationId}\n    ${details.summary}\n    required: ${details.required.join(', ')}${optionalLine}`;
    })
    .join('\n\n');

  console.log(`Notemd maintainer CLI helper

Help:
  npm run cli:help
  node scripts/invoke-maintainer-cli-operation.js --help

Invoke:
  npm run cli:invoke -- --vault <vault> --operation <operation-id> [--input-file <path> | --input-json '<json>'] [--pretty]
  node scripts/invoke-maintainer-cli-operation.js \\
    --vault <vault-id-or-name> \\
    --operation <operation-id> \\
    [--input-file <path> | --input-json '<json>'] \\
    [--plugin-id <plugin-id>] \\
    [--pretty]

Operations:
${operationDetails}

Minimal examples:
  npm run cli:invoke -- --vault docs --operation content.split-note-by-chapters --input-json '{"sourcePath":"docs/index.zh-CN.md"}' --pretty
  npm run cli:invoke -- --vault docs --operation provider.profile.export-redacted --pretty

Notes:
  - Prefer --input-file for non-trivial payloads.
  - Maintainer bridge only; not a public CLI surface.
`);
}

function parseArgs(argv) {
  const args = {
    pluginId: 'notemd',
    pretty: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--vault':
        args.vault = argv[++i];
        break;
      case '--operation':
        args.operationId = argv[++i];
        break;
      case '--plugin-id':
        args.pluginId = argv[++i];
        break;
      case '--input-json':
        args.inputJson = argv[++i];
        break;
      case '--input-file':
        args.inputFile = argv[++i];
        break;
      case '--pretty':
        args.pretty = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function loadInput(args) {
  if (args.inputJson && args.inputFile) {
    throw new Error('Use either --input-json or --input-file, not both.');
  }

  if (args.inputFile) {
    return JSON.parse(fs.readFileSync(args.inputFile, 'utf8'));
  }

  if (args.inputJson) {
    return JSON.parse(args.inputJson);
  }

  return {};
}

function buildEvalCode(pluginId, request) {
  const requestLiteral = JSON.stringify(JSON.stringify(request));
  const pluginIdLiteral = JSON.stringify(pluginId);
  return `(async () => {
    const plugin = app.plugins.getPlugin(${pluginIdLiteral});
    if (!plugin) {
      throw new Error('Plugin not loaded: ' + ${pluginIdLiteral});
    }
    if (typeof plugin.invokeMaintainerCliOperation !== 'function') {
      throw new Error('Plugin does not expose invokeMaintainerCliOperation');
    }
    const request = JSON.parse(${requestLiteral});
    const result = await plugin.invokeMaintainerCliOperation(request);
    return JSON.stringify(result);
  })()`.replace(/\s+/g, ' ').trim();
}

function extractEvalResult(stdout) {
  const trimmedStdout = stdout.trim();
  if (trimmedStdout.startsWith('Error:')) {
    throw new Error(trimmedStdout);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const evalLine = [...lines].reverse().find((line) => line.startsWith('=> '));
  if (!evalLine) {
    throw new Error(`Could not parse eval output:\n${stdout}`);
  }

  return evalLine.slice(3);
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printUsage();
      process.exit(0);
    }

    if (!args.vault) {
      throw new Error('Missing required --vault.');
    }
    if (!args.operationId) {
      throw new Error('Missing required --operation.');
    }
    if (!Object.prototype.hasOwnProperty.call(OPERATION_HELP, args.operationId)) {
      throw new Error(`Unsupported operation: ${args.operationId}`);
    }

    const input = loadInput(args);
    const request = {
      operationId: args.operationId,
      input
    };
    const code = buildEvalCode(args.pluginId, request);
    const child = spawnSync(
      'obsidian-cli',
      ['native', `vault=${args.vault}`, 'eval', `code=${code}`],
      {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      }
    );

    if (child.status !== 0) {
      process.stderr.write(child.stderr || child.stdout || 'obsidian-cli native eval failed\n');
      process.exit(child.status || 1);
    }

    const rawResult = extractEvalResult(child.stdout);
    const parsed = JSON.parse(rawResult);
    process.stdout.write(`${JSON.stringify(parsed, null, args.pretty ? 2 : 0)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

main();
