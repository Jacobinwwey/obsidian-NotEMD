import { readFileSync } from 'node:fs';
import { createBoard } from '@plait/core';
import { PlaitDrawElement } from '@plait/draw';
import { MindElement, PlaitMind } from '@plait/mind';

function readInputPath(argv) {
    const [inputPath] = argv;
    if (!inputPath) {
        throw new Error('Usage: node scripts/test-drawnix-plait-consumer.mjs <artifact.drawnix>');
    }
    return inputPath;
}

function readDrawnixData(inputPath) {
    const data = JSON.parse(readFileSync(inputPath, 'utf8'));
    if (!data
        || data.type !== 'drawnix'
        || !Array.isArray(data.elements)
        || !data.viewport
        || typeof data.viewport !== 'object') {
        throw new Error('The artifact is not a Drawnix consumer payload.');
    }
    return data;
}

function collectElements(elements) {
    return elements.flatMap(element => [element, ...collectElements(element.children ?? [])]);
}

function readArrowText(arrow) {
    return (arrow.texts ?? []).flatMap(text => text.text?.children ?? [])
        .map(child => child.text)
        .filter(text => typeof text === 'string');
}

function inspectDrawnixConsumerData(data) {
    const board = createBoard(data.elements);
    const elements = collectElements(data.elements);
    const mindElements = elements.filter(element => MindElement.isMindElement(board, element));
    const rootElements = data.elements.filter(element => PlaitMind.isMind(element));
    const arrows = data.elements.filter(element => PlaitDrawElement.isArrowLine(element));

    if (mindElements.length === 0) {
        throw new Error('The Plait consumer did not recognize any mind-map elements.');
    }
    if (data.elements.some(element => !PlaitMind.isMind(element) && !PlaitDrawElement.isArrowLine(element))) {
        throw new Error('The Drawnix artifact contains an unsupported top-level element for the Plait consumer contract.');
    }

    return {
        nodeIds: mindElements.map(element => element.id).sort(),
        rootIds: rootElements.map(element => element.id).sort(),
        relations: arrows.map(arrow => ({
            id: arrow.id,
            sourceId: arrow.source?.id,
            targetId: arrow.target?.id,
            text: readArrowText(arrow)
        })).sort((left, right) => left.id.localeCompare(right.id))
    };
}

try {
    const inputPath = readInputPath(process.argv.slice(2));
    const data = readDrawnixData(inputPath);
    process.stdout.write(`${JSON.stringify(inspectDrawnixConsumerData(data))}\n`);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Drawnix Plait consumer check failed: ${message}\n`);
    process.exitCode = 1;
}
