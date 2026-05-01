import { SUPPORTED_VEGA_LITE_CHART_TYPES, SupportedVegaLiteChartType } from '../adapters/vega/schema';
import { DiagramIntent } from '../types';

export interface DiagramSpecPromptOptions {
    preferredIntent?: DiagramIntent;
    preferredChartType?: SupportedVegaLiteChartType;
    targetLanguage?: string;
}

export function buildDiagramSpecPrompt(options: DiagramSpecPromptOptions = {}): string {
    const supportedChartTypes = SUPPORTED_VEGA_LITE_CHART_TYPES.join(', ');
    const preferredIntentLine = options.preferredIntent
        ? `Preferred diagram intent: ${options.preferredIntent}. Follow it when the source content supports it.`
        : 'Preferred diagram intent: choose the most suitable intent from the supported list.';
    const preferredChartTypeLine = options.preferredIntent === 'dataChart' && options.preferredChartType
        ? `Preferred chart template: ${options.preferredChartType}. Use it when the extracted data supports it.`
        : '';

    const targetLanguageLine = options.targetLanguage
        ? `Write all human-readable labels in ${options.targetLanguage}.`
        : 'Write all human-readable labels in the same language as the source unless the caller specifies a target language.';

    return `You are a diagram planning assistant. Analyze the source note and return a structured DiagramSpec JSON object.

Output rules:
- Return JSON only.
- Do not wrap the JSON in markdown code fences.
- Do not output Mermaid, Canvas, Vega-Lite, PlantUML, or any other renderer syntax.
- Do not output explanations outside the DiagramSpec JSON payload.
- Do not invent numeric data. If the source lacks reliable numeric values, choose a non-dataChart intent and leave dataSeries empty.

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
${preferredChartTypeLine}
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
- Reference only existing node ids in edges. Edge objects must use "from" and "to" fields (not "source"/"target").
- Keep labels concise and faithful to the source.
- Put verbatim evidence snippets into evidenceRefs when the source contains critical wording.
- For dataChart intent, every dataSeries[] entry must include dataSeries[].id, dataSeries[].label, and dataSeries[].points.
- For dataChart intent, every points[] entry must include points[].x and a numeric points[].y extracted from the source.
- Even single-series charts must include both series id and series label.
- For dataChart intent, set layoutHints.chartType to one of: ${supportedChartTypes}.
- Use scatter for paired numeric x/y observations, pie for part-to-whole categorical shares, and table when ranked/tabular rows communicate better than axes.

Return a single valid DiagramSpec JSON object.`;
}
