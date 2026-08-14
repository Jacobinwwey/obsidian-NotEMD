#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_COUNT = 8;
const BRANCHES_PER_ROOT = 4;
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

function leafId(rootIndex, branchIndex, leafIndex) {
  return `root-${rootIndex}-branch-${branchIndex}-leaf-${leafIndex}`;
}

function createRoot(rootIndex) {
  return {
    id: `root-${rootIndex}`,
    label: `Subsystem ${rootIndex}`,
    children: Array.from({ length: BRANCHES_PER_ROOT }, (_, branchOffset) => {
      const branchIndex = branchOffset + 1;
      return {
        id: `root-${rootIndex}-branch-${branchIndex}`,
        label: `Module ${rootIndex}.${branchIndex}`,
        children: Array.from({ length: LEAVES_PER_BRANCH }, (_, leafOffset) => {
          const leafIndex = leafOffset + 1;
          return {
            id: leafId(rootIndex, branchIndex, leafIndex),
            label: `Capability ${rootIndex}.${branchIndex}.${leafIndex}`
          };
        })
      };
    })
  };
}

function createCrossRelations() {
  const relations = [];
  for (let rootIndex = 1; rootIndex <= ROOT_COUNT; rootIndex += 1) {
    const targetRootIndex = rootIndex === ROOT_COUNT ? 1 : rootIndex + 1;
    for (let branchIndex = 1; branchIndex <= BRANCHES_PER_ROOT; branchIndex += 1) {
      relations.push({
        from: leafId(rootIndex, branchIndex, 1),
        to: leafId(targetRootIndex, branchIndex, LEAVES_PER_BRANCH),
        label: `feeds subsystem ${targetRootIndex}`
      });
    }
  }
  return relations;
}

function createBenchmarkSpec() {
  return {
    intent: 'drawnixMindmap',
    title: 'Drawnix knowledge-map benchmark',
    summary: 'Representative multi-root forest with cross-subsystem relationships.',
    nodes: Array.from({ length: ROOT_COUNT }, (_, rootOffset) => createRoot(rootOffset + 1)),
    edges: createCrossRelations()
  };
}

function expectedNodeCount() {
  return ROOT_COUNT * (1 + BRANCHES_PER_ROOT + BRANCHES_PER_ROOT * LEAVES_PER_BRANCH);
}

function assertBenchmarkSummary(summary) {
  const expected = {
    rootCount: ROOT_COUNT,
    nodeCount: expectedNodeCount(),
    edgeCount: ROOT_COUNT * BRANCHES_PER_ROOT,
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
