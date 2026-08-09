#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BUNDLE_FILES = ['main.js', 'styles.css', 'manifest.json'];
const DEFAULT_PLUGIN_RELATIVE_PATH = path.join('.obsidian', 'plugins', 'notemd');

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`);
  }
  return value;
}

function parseArgs(argv = process.argv.slice(2)) {
  const result = {
    vaultPath: '',
    pluginDir: '',
    projectRoot: path.resolve(__dirname, '..'),
    expectedVersion: '',
    help: false
  };
  let pluginDirWasExplicit = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--vault':
        result.vaultPath = path.resolve(readOptionValue(argv, index, '--vault'));
        index += 1;
        if (!pluginDirWasExplicit) {
          result.pluginDir = path.resolve(result.vaultPath, DEFAULT_PLUGIN_RELATIVE_PATH);
        }
        break;
      case '--plugin-dir':
        result.pluginDir = path.resolve(readOptionValue(argv, index, '--plugin-dir'));
        pluginDirWasExplicit = true;
        index += 1;
        break;
      case '--project-root':
        result.projectRoot = path.resolve(readOptionValue(argv, index, '--project-root'));
        index += 1;
        break;
      case '--version':
        result.expectedVersion = readOptionValue(argv, index, '--version');
        index += 1;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown argument: ${arg}`);
        }
        throw new Error(`Unexpected positional argument: ${arg}`);
    }
  }

  if (!result.pluginDir && result.vaultPath) {
    result.pluginDir = path.resolve(result.vaultPath, DEFAULT_PLUGIN_RELATIVE_PATH);
  }

  return result;
}

function readJsonFile(filePath, description) {
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Missing ${description}: ${filePath}`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${description}: ${filePath}`);
  }
}

function assertRegularFile(filePath, description) {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    throw new Error(`Missing ${description}: ${filePath}`);
  }
  if (!stats.isFile()) {
    throw new Error(`${description} is not a regular file: ${filePath}`);
  }
}

function sha256File(filePath) {
  assertRegularFile(filePath, 'bundle file');
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveVerificationPaths(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || path.resolve(__dirname, '..'));
  const vaultPath = options.vaultPath ? path.resolve(options.vaultPath) : '';
  const rawPluginDir = options.pluginDir || (vaultPath ? path.join(vaultPath, DEFAULT_PLUGIN_RELATIVE_PATH) : '');

  if (!rawPluginDir) {
    throw new Error('A Vault path or plugin directory is required for bundle verification.');
  }

  const pluginDir = path.resolve(rawPluginDir);

  return { projectRoot, vaultPath, pluginDir };
}

function verifyManifestVersion(sourceManifest, deployedManifest, expectedVersion) {
  const sourceVersion = typeof sourceManifest.version === 'string' ? sourceManifest.version.trim() : '';
  const deployedVersion = typeof deployedManifest.version === 'string' ? deployedManifest.version.trim() : '';
  const requestedVersion = expectedVersion ? String(expectedVersion).trim() : '';

  if (!sourceVersion || !deployedVersion) {
    throw new Error('Both source and deployed manifest.json files must declare a non-empty version.');
  }
  if (sourceVersion !== deployedVersion) {
    throw new Error(`manifest.json version mismatch: source=${sourceVersion}, deployed=${deployedVersion}`);
  }
  if (requestedVersion && requestedVersion !== sourceVersion) {
    throw new Error(`manifest.json version does not match requested version: expected=${requestedVersion}, actual=${sourceVersion}`);
  }

  return sourceVersion;
}

function verifyVaultBundle(options = {}) {
  const paths = resolveVerificationPaths(options);
  const sourceManifestPath = path.join(paths.projectRoot, 'manifest.json');
  const deployedManifestPath = path.join(paths.pluginDir, 'manifest.json');
  const sourceManifest = readJsonFile(sourceManifestPath, 'source manifest.json');
  const deployedManifest = readJsonFile(deployedManifestPath, 'deployed manifest.json');
  const manifestVersion = verifyManifestVersion(
    sourceManifest,
    deployedManifest,
    options.expectedVersion
  );

  const files = BUNDLE_FILES.map((fileName) => {
    const sourcePath = path.join(paths.projectRoot, fileName);
    const deployedPath = path.join(paths.pluginDir, fileName);
    const expectedSha256 = sha256File(sourcePath);
    const actualSha256 = sha256File(deployedPath);
    const matches = expectedSha256 === actualSha256;

    if (!matches) {
      throw new Error(
        `${fileName} hash mismatch: source=${expectedSha256}, deployed=${actualSha256}`
      );
    }

    return {
      name: fileName,
      sourcePath,
      deployedPath,
      expectedSha256,
      actualSha256,
      matches
    };
  });

  return {
    ok: true,
    projectRoot: paths.projectRoot,
    vaultPath: paths.vaultPath,
    pluginDir: paths.pluginDir,
    manifestVersion,
    files
  };
}

function printUsage() {
  console.log(`Verify the built Notemd bundle against a deployed Vault plugin.

Usage:
  npm run verify:vault-bundle -- --vault <vault-path>
  node scripts/verify-vault-bundle.js --project-root <repo> --plugin-dir <plugin-dir>

Options:
  --vault <path>          Vault root; resolves .obsidian/plugins/notemd by default
  --plugin-dir <path>     Explicit deployed plugin directory
  --project-root <path>   Source repository root (default: repository root)
  --version <version>     Require an explicit manifest version
  --help                  Show this help
`);
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printUsage();
    return 0;
  }

  const result = verifyVaultBundle(args);
  console.log(`Vault bundle verified: ${result.pluginDir}`);
  console.log(`Manifest version: ${result.manifestVersion}`);
  for (const file of result.files) {
    console.log(`${file.name}: ${file.actualSha256}`);
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
  BUNDLE_FILES,
  parseArgs,
  verifyVaultBundle,
  verifyManifestVersion
};
