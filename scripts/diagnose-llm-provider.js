#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const {
    formatDiagnosticText,
    parseCliArgs,
    printUsage,
    runDiagnostic,
    validateCliConfig
} = require('./lib/llm-provider-diagnostic.js');

async function main() {
    let args;
    try {
        args = parseCliArgs(process.argv.slice(2));
        validateCliConfig(args);
    } catch (error) {
        console.error(`Argument error: ${error.message}`);
        printUsage();
        process.exitCode = 1;
        return;
    }

    if (args.help) {
        printUsage();
        return;
    }

    try {
        const report = await runDiagnostic(args);
        const textOutput = formatDiagnosticText(report);
        const serializedOutput = args.json
            ? JSON.stringify(report, null, 2)
            : textOutput;

        if (args.output) {
            const outputPath = path.resolve(args.output);
            fs.writeFileSync(outputPath, serializedOutput, 'utf8');
            console.log(`Diagnostic report written to ${outputPath}`);
            if (!args.json) {
                console.log('');
                console.log(textOutput);
            }
            return;
        }

        console.log(serializedOutput);
    } catch (error) {
        console.error(`Diagnostic run failed: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
