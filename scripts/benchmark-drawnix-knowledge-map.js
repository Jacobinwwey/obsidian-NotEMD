#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUBSYSTEM_COUNT = 8;
const BRANCHES_PER_SUBSYSTEM = 4;
const LEAVES_PER_BRANCH = 3;
const repoRoot = path.resolve(__dirname, '..');
const artifactCliPath = path.join(repoRoot, 'scripts', 'export-diagram-artifact.js');
const defaultOutputDirectory = path.join(repoRoot, '.cache', 'drawnix-knowledge-map-benchmark');

function printUsage() {
  process.stdout.write('Usage: node scripts/benchmark-drawnix-knowledge-map.js [--output-directory <path>]\n');
}

function parseArgs(argv) {
  const result = { outputDirectory: defaultOutputDirectory };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--output-directory') {
      const outputDirectory = argv[++index];
      if (!outputDirectory) {
        throw new Error('Missing value for --output-directory.');
      }
      result.outputDirectory = path.resolve(outputDirectory);
      continue;
    }
    if (token === '--help' || token === '-h') {
      result.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }
  return result;
}

function leafId(subsystemIndex, branchIndex, leafIndex) {
  return `subsystem-${subsystemIndex}-branch-${branchIndex}-leaf-${leafIndex}`;
}

function createSubsystem(subsystemIndex) {
  return {
    id: `subsystem-${subsystemIndex}`,
    label: `Subsystem ${subsystemIndex}`,
    children: Array.from({ length: BRANCHES_PER_SUBSYSTEM }, (_, branchOffset) => {
      const branchIndex = branchOffset + 1;
      return {
        id: `subsystem-${subsystemIndex}-branch-${branchIndex}`,
        label: `Module ${subsystemIndex}.${branchIndex}`,
        children: Array.from({ length: LEAVES_PER_BRANCH }, (_, leafOffset) => {
          const leafIndex = leafOffset + 1;
          return {
            id: leafId(subsystemIndex, branchIndex, leafIndex),
            label: `Capability ${subsystemIndex}.${branchIndex}.${leafIndex}`
          };
        })
      };
    })
  };
}

function createCrossRelations() {
  const relations = [];
  for (let subsystemIndex = 1; subsystemIndex <= SUBSYSTEM_COUNT; subsystemIndex += 1) {
    const targetSubsystemIndex = subsystemIndex === SUBSYSTEM_COUNT ? 1 : subsystemIndex + 1;
    for (let branchIndex = 1; branchIndex <= BRANCHES_PER_SUBSYSTEM; branchIndex += 1) {
      relations.push({
        from: leafId(subsystemIndex, branchIndex, 1),
        to: leafId(targetSubsystemIndex, branchIndex, LEAVES_PER_BRANCH),
        label: `feeds subsystem ${targetSubsystemIndex}`
      });
    }
  }
  return relations;
}

function createBenchmarkSpec() {
  return {
    intent: 'drawnixMindmap',
    title: 'architecture.zh-CN',
    summary: 'Representative filename-rooted tree with cross-subsystem relationships.',
    nodes: [{
      id: 'architecture-zh-cn',
      label: 'architecture.zh-CN',
      children: Array.from(
        { length: SUBSYSTEM_COUNT },
        (_, subsystemOffset) => createSubsystem(subsystemOffset + 1)
      )
    }],
    edges: createCrossRelations()
  };
}

function expectedNodeCount() {
  return 1 + SUBSYSTEM_COUNT * (
    1 + BRANCHES_PER_SUBSYSTEM + BRANCHES_PER_SUBSYSTEM * LEAVES_PER_BRANCH
  );
}

function assertBenchmarkSummary(summary) {
  const expected = {
    rootCount: 1,
    nodeCount: expectedNodeCount(),
    edgeCount: SUBSYSTEM_COUNT * BRANCHES_PER_SUBSYSTEM,
    validationErrorCount: 0
  };
  for (const [key, value] of Object.entries(expected)) {
    if (summary[key] !== value) {
      throw new Error(`Drawnix benchmark ${key} mismatch: expected ${value}, received ${summary[key]}.`);
    }
  }
}

function run(options) {
  const outputDirectory = path.resolve(options.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const specPath = path.join(outputDirectory, 'drawnix-knowledge-map-benchmark.spec.json');
  const outputPath = path.join(outputDirectory, 'drawnix-knowledge-map-benchmark.drawnix');
  const previewSvgOutputPath = path.join(outputDirectory, 'drawnix-knowledge-map-benchmark.svg');
  fs.writeFileSync(specPath, JSON.stringify(createBenchmarkSpec(), null, 2), 'utf8');

  const startedAt = Date.now();
  const stdout = execFileSync(process.execPath, [
    artifactCliPath,
    '--input', specPath,
    '--target', 'drawnix',
    '--output', outputPath,
    '--preview-svg-output', previewSvgOutputPath
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const summary = JSON.parse(stdout);
  assertBenchmarkSummary(summary);

  return {
    elapsedMs: Date.now() - startedAt,
    outputDirectory,
    specPath,
    outputPath,
    previewSvgOutputPath,
    artifactBytes: fs.statSync(outputPath).size,
    previewSvgBytes: fs.statSync(previewSvgOutputPath).size,
    rootCount: summary.rootCount,
    nodeCount: summary.nodeCount,
    edgeCount: summary.edgeCount,
    validationErrorCount: summary.validationErrorCount
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printUsage();
      return;
    }
    process.stdout.write(`${JSON.stringify(run(options))}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createBenchmarkSpec,
  expectedNodeCount,
  parseArgs,
  run
};
