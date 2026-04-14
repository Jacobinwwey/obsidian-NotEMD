import { DiagramIntent } from '../types';

export interface DiagramSpecPromptOptions {
    preferredIntent?: DiagramIntent;
    targetLanguage?: string;
}

export function buildDiagramSpecPrompt(options: DiagramSpecPromptOptions = {}): string {
    const preferredIntentLine = options.preferredIntent
        ? `Preferred diagram intent: ${options.preferredIntent}. Follow it when the source content supports it.`
        : 'Preferred diagram intent: choose the most suitable intent from the supported list.';

    const targetLanguageLine = options.targetLanguage
        ? `Write all human-readable labels in ${options.targetLanguage}.`
        : 'Write all human-readable labels in the same language as the source unless the caller specifies a target language.';

    return `You are a diagram planning assistant. Analyze the source note and return a structured DiagramSpec JSON object.

Output rules:
- Return JSON only.
- Do not wrap the JSON in markdown code fences.
- Do not output Mermaid, Canvas, Vega-Lite, PlantUML, or any other renderer syntax.
- Do not output explanations outside the DiagramSpec JSON payload.
- Do not invent numeric data. If the source lacks reliable numeric values, leave dataSeries empty.

Supported intents:
- mindmap
- flowchart
- sequence
- classDiagram
- erDiagram
- stateDiagram
- canvasMap
- dataChart

${preferredIntentLine}
${targetLanguageLine}

Required DiagramSpec fields:
- intent
- title
- summary
- nodes
- edges
- sections
- callouts
- dataSeries
- layoutHints
- sourceLanguage
- outputLanguage
- evidenceRefs

Validation rules:
- Use stable node ids.
- Reference only existing node ids in edges.
- Keep labels concise and faithful to the source.
- Put verbatim evidence snippets into evidenceRefs when the source contains critical wording.
- For dataChart intent, include dataSeries with explicit x and y values extracted from the source.
- For dataChart intent, set layoutHints.chartType to one of: bar, line, area, point, scatter, pie, table.
- Use scatter for paired numeric x/y observations, pie for part-to-whole categorical shares, and table when ranked/tabular rows communicate better than axes.

Return a single valid DiagramSpec JSON object.`;
}
