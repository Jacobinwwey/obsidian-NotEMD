#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { run: runCircuitikzExport } = require('./export-circuitikz.js');

function printUsage() {
  console.log(`Notemd circuitikz smoke fixtures

Usage:
  node scripts/run-circuitikz-smoke-fixtures.js --output-dir <dir> --compile-executable <renderer> --compile-arg <arg>... --expected-artifact <artifact>

Example:
  node scripts/run-circuitikz-smoke-fixtures.js \\
    --output-dir docs/export/circuitikz-smoke \\
    --compile-executable pdflatex \\
    --compile-arg -interaction=nonstopmode \\
    --compile-arg -halt-on-error \\
    --compile-arg -output-directory={outputDir} \\
    --compile-arg {tex} \\
    --expected-artifact {outputDir}/{jobName}.pdf
`);
}

function parseArgs(argv) {
  const args = {
    fixtureDir: path.resolve(__dirname, '..', 'docs', 'maintainer', 'fixtures', 'circuitikz'),
    compileArgs: [],
    expectedSvgText: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--fixture-dir':
        args.fixtureDir = argv[++index];
        break;
      case '--output-dir':
        args.outputDir = argv[++index];
        break;
      case '--compile-executable':
        args.compileExecutable = argv[++index];
        break;
      case '--compile-arg':
        args.compileArgs.push(argv[++index]);
        break;
      case '--expected-artifact':
        args.expectedArtifact = argv[++index];
        break;
      case '--expected-svg-text':
        args.expectedSvgText.push(argv[++index]);
        break;
      case '--report-output':
        args.reportOutput = argv[++index];
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

function assertRequiredArgs(args) {
  if (!args.outputDir) {
    throw new Error('Missing required --output-dir.');
  }
  if (!args.compileExecutable) {
    throw new Error('Missing required --compile-executable.');
  }
  if (!args.expectedArtifact) {
    throw new Error('Missing required --expected-artifact.');
  }
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function listFixturePaths(fixtureDir) {
  const resolvedFixtureDir = path.resolve(fixtureDir);
  if (!fs.existsSync(resolvedFixtureDir)) {
    throw new Error(`Circuitikz fixture directory does not exist: ${resolvedFixtureDir}`);
  }

  const fixturePaths = fs.readdirSync(resolvedFixtureDir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
    .map(fileName => path.join(resolvedFixtureDir, fileName));

  if (fixturePaths.length === 0) {
    throw new Error(`Circuitikz fixture directory has no JSON fixtures: ${resolvedFixtureDir}`);
  }

  return fixturePaths;
}

function fixtureNameFromPath(fixturePath) {
  return path.basename(fixturePath, path.extname(fixturePath));
}

async function run(args, repoRoot = path.resolve(__dirname, '..')) {
  assertRequiredArgs(args);
  const fixturePaths = listFixturePaths(args.fixtureDir);
  const outputDirectory = path.resolve(args.outputDir);
  ensureDirectory(outputDirectory);

  const fixtures = [];
  for (const fixturePath of fixturePaths) {
    const name = fixtureNameFromPath(fixturePath);
    const outputPath = path.join(outputDirectory, `${name}.tex`);
    const result = await runCircuitikzExport({
      input: fixturePath,
      output: outputPath,
      compileExecutable: args.compileExecutable,
      compileArgs: args.compileArgs,
      expectedArtifact: args.expectedArtifact,
      expectedSvgText: args.expectedSvgText
    }, repoRoot);
    fixtures.push({
      name,
      inputPath: result.inputPath,
      outputPath: result.outputPath,
      circuitKind: result.circuitKind,
      goldenReferenceId: result.goldenReferenceId,
      compileExecution: result.compileExecution,
      compileDiagnostics: result.compileDiagnostics
    });
  }

  const ok = fixtures.every(fixture => fixture.compileDiagnostics?.ok === true);
  const report = {
    ok,
    fixtureDirectory: path.resolve(args.fixtureDir),
    outputDirectory,
    fixtureCount: fixtures.length,
    fixtures
  };

  if (args.reportOutput) {
    const reportOutputPath = path.resolve(args.reportOutput);
    ensureDirectory(path.dirname(reportOutputPath));
    fs.writeFileSync(reportOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    report.reportOutputPath = reportOutputPath;
  }

  return report;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printUsage();
      return;
    }

    const report = await run(args);
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (!report.ok) {
      process.stderr.write('One or more circuitikz smoke fixtures failed.\n');
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  run
};
