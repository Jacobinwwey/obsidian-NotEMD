#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

const candidateFiles = [
    'src/main.ts',
    'src/fileUtils.ts',
    'src/searchUtils.ts',
    'src/translate.ts',
    'src/extractOriginalText.ts',
    'src/providerDiagnostics.ts',
    'src/ui'
];

const ignoreFilePatterns = [
    /src\/i18n\//,
    /src\/tests\//,
    /src\/ui\/ErrorModal\.ts$/,
    /src\/ui\/ProgressModal\.ts$/
];

const ignoreLinePatterns = [
    /getSidebarActionLabel/,
    /getI18nStrings/,
    /formatI18n/,
    /i18n\./,
    /strings\./,
    /provider\.name/,
    /lang\.name/,
    /issue\.message/,
    /Unsupported action:/,
    /console\./
];

const matchers = [
    { kind: 'notice', regex: /new Notice\((['"`])/ },
    { kind: 'setting-name', regex: /\.setName\((['"`])/ },
    { kind: 'setting-desc', regex: /\.setDesc\((['"`])/ },
    { kind: 'button-text', regex: /\.setButtonText\((['"`])/ },
    { kind: 'title-text', regex: /titleEl\.setText\((['"`])/ },
    { kind: 'element-text', regex: /createEl\([^)]*\{\s*text:\s*(['"`])/ },
    { kind: 'name-prop', regex: /\bname:\s*(['"`])/ },
    { kind: 'placeholder', regex: /\.setPlaceholder\((['"`])/ },
    { kind: 'status-bar', regex: /updateStatusBar\((['"`])/ },
    { kind: 'progress-status', regex: /\.updateStatus\((['"`])/ },
    { kind: 'sidebar-start', regex: /\.startProcessing\((['"`])/ }
];

function walk(entry, files = []) {
    const stat = fs.statSync(entry);
    if (stat.isDirectory()) {
        for (const child of fs.readdirSync(entry)) {
            walk(path.join(entry, child), files);
        }
        return files;
    }

    if (entry.endsWith('.ts')) {
        files.push(entry);
    }
    return files;
}

function shouldInspect(relativePath) {
    if (ignoreFilePatterns.some(pattern => pattern.test(relativePath))) {
        return false;
    }

    return candidateFiles.some(candidate => {
        const absoluteCandidate = path.join(projectRoot, candidate);
        return relativePath === candidate || relativePath.startsWith(`${candidate}/`) || path.resolve(path.join(projectRoot, relativePath)) === absoluteCandidate;
    });
}

function lineIsIgnored(line) {
    return ignoreLinePatterns.some(pattern => pattern.test(line));
}

const allFiles = candidateFiles
    .flatMap(candidate => {
        const absolute = path.join(projectRoot, candidate);
        return fs.existsSync(absolute) ? walk(absolute) : [];
    })
    .map(file => path.relative(projectRoot, file))
    .filter(shouldInspect)
    .sort();

const findings = [];

for (const relativeFile of allFiles) {
    const absoluteFile = path.join(projectRoot, relativeFile);
    const lines = fs.readFileSync(absoluteFile, 'utf8').split(/\r?\n/);

    lines.forEach((line, index) => {
        if (lineIsIgnored(line)) {
            return;
        }

        for (const matcher of matchers) {
            if (matcher.regex.test(line)) {
                findings.push({
                    file: relativeFile,
                    line: index + 1,
                    kind: matcher.kind,
                    text: line.trim()
                });
                break;
            }
        }
    });
}

if (findings.length === 0) {
    console.log('No hardcoded UI string candidates found.');
    process.exit(0);
}

console.log(`Found ${findings.length} hardcoded UI string candidate(s):\n`);
for (const finding of findings) {
    console.log(`${finding.file}:${finding.line} [${finding.kind}] ${finding.text}`);
}

process.exit(1);
