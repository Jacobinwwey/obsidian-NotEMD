import { SUPPORTED_VEGA_LITE_CHART_TYPES, SupportedVegaLiteChartType } from '../adapters/vega/schema';
import { DiagramIntent, RenderTarget } from '../types';
import { buildDrawnixKnowledgeMapPromptRules } from './drawnixKnowledgeMapPrompt';

export interface DiagramSpecPromptOptions {
    preferredIntent?: DiagramIntent;
    requiredIntent?: DiagramIntent;
    preferredChartType?: SupportedVegaLiteChartType;
    preferredRenderTarget?: RenderTarget;
    sourcePath?: string;
    targetLanguage?: string;
}

export function buildDiagramSpecPrompt(options: DiagramSpecPromptOptions = {}): string {
    const supportedChartTypes = SUPPORTED_VEGA_LITE_CHART_TYPES.join(', ');
    const isCircuitikzRequest = options.preferredIntent === 'circuit'
        || options.requiredIntent === 'circuit'
        || options.preferredRenderTarget === 'circuitikz';
    const isDrawnixMindMapRequest = options.preferredIntent === 'drawnixMindmap'
        || options.requiredIntent === 'drawnixMindmap'
        || options.preferredRenderTarget === 'drawnix';
    const isRadarRequest = options.preferredIntent === 'radar'
        || options.requiredIntent === 'radar';
    const isOrgChartRequest = options.preferredIntent === 'orgChart'
        || options.requiredIntent === 'orgChart';
    const preferredIntentLine = options.requiredIntent
        ? `REQUIRED diagram intent: ${options.requiredIntent}. You MUST use this exact intent. Do not choose any other intent under any circumstances.`
        : options.preferredIntent
        ? `Preferred diagram intent: ${options.preferredIntent}. Follow it when the source content supports it.`
        : 'Preferred diagram intent: choose the most suitable intent from the supported list.';
    const preferredChartTypeLine = options.preferredIntent === 'dataChart' && options.preferredChartType
        ? `Preferred chart template: ${options.preferredChartType}. Use it when the extracted data supports it.`
        : '';
    const circuitikzTargetLine = isCircuitikzRequest
        ? `Circuitikz target rules:
- Set intent: circuit.
- Include a circuitSpec object. Do not encode circuit topology in generic nodes/edges only.
- circuitSpec.style.package must be "circuitikz".
- Use only supported goldenReferenceId values: common-source-nmos-v1, cmos-inverter-v1, cmos-buffer-v1, cmos-transmission-gate-v1, cmos-nand2-v1, cmos-nor2-v1.
- Use layoutHints.inputSide, layoutHints.outputSide, and layoutHints.routingStyle: "orthogonal" when placement is known.
- Do not output raw TikZ or circuitikz source. Return structured JSON only.

CircuitSpec contract:
- For circuit intent, circuitSpec is required.
- circuitSpec.circuitKind must be one of: common-source-amplifier, cmos-inverter, cmos-buffer, cmos-transmission-gate, cmos-nand2, cmos-nor2.
- circuitSpec.title is a short human-readable title.
- circuitSpec.goldenReferenceId must match circuitKind:
  common-source-amplifier -> common-source-nmos-v1
  cmos-inverter -> cmos-inverter-v1
  cmos-buffer -> cmos-buffer-v1
  cmos-transmission-gate -> cmos-transmission-gate-v1
  cmos-nand2 -> cmos-nand2-v1
  cmos-nor2 -> cmos-nor2-v1
- circuitSpec.style.package must be "circuitikz"; circuitSpec.style.voltageConvention should be "american voltages" unless the source asks otherwise.
- circuitSpec.nets lists every named net.
- circuitSpec.components[] entries require id, type, label, and circuitSpec.components[].terminals.
- circuitSpec.connections[] entries require circuitSpec.connections[].from and circuitSpec.connections[].to; each endpoint must be either a net name or a component terminal reference such as "MP.G".

CircuitSpec JSON example for a CMOS inverter request:
{
  "intent": "circuit",
  "title": "CMOS Inverter",
  "summary": "CMOS inverter with PMOS pull-up and NMOS pull-down.",
  "nodes": [],
  "edges": [],
  "sections": [],
  "callouts": [],
  "dataSeries": [],
  "layoutHints": {},
  "sourceLanguage": "en",
  "outputLanguage": "en",
  "evidenceRefs": [],
  "circuitSpec": {
    "circuitKind": "cmos-inverter",
    "title": "CMOS Inverter",
    "goldenReferenceId": "cmos-inverter-v1",
    "style": {
      "package": "circuitikz",
      "voltageConvention": "american voltages"
    },
    "nets": ["VDD", "GND", "vin", "vout", "shared_gate", "shared_drain"],
    "components": [
      {
        "id": "MP",
        "type": "pmos",
        "label": "$M_P$",
        "terminals": { "S": "VDD", "G": "shared_gate", "D": "shared_drain" }
      },
      {
        "id": "MN",
        "type": "nmos",
        "label": "$M_N$",
        "terminals": { "D": "shared_drain", "G": "shared_gate", "S": "GND" }
      }
    ],
    "connections": [
      { "from": "VDD", "to": "MP.S" },
      { "from": "MP.D", "to": "MN.D" },
      { "from": "MN.S", "to": "GND" },
      { "from": "vin", "to": "MP.G" },
      { "from": "vin", "to": "MN.G" },
      { "from": "MP.D", "to": "vout" },
      { "from": "MN.D", "to": "vout" }
    ],
    "layoutHints": {
      "inputSide": "left",
      "outputSide": "right",
      "routingStyle": "orthogonal"
    }
  }
}

For a common-source NMOS request, use this exact topology contract inside circuitSpec:
{
  "circuitKind": "common-source-amplifier",
  "title": "Common-Source NMOS Amplifier",
  "goldenReferenceId": "common-source-nmos-v1",
  "style": { "package": "circuitikz", "voltageConvention": "american voltages" },
  "nets": ["VDD", "GND", "vin", "vout", "drain"],
  "components": [
    { "id": "RD", "type": "resistor", "label": "$R_D$", "terminals": { "top": "VDD", "bottom": "drain" } },
    { "id": "M1", "type": "nmos", "label": "$M_1$", "terminals": { "D": "drain", "G": "vin", "S": "GND" } }
  ],
  "connections": [
    { "from": "VDD", "to": "RD.top" },
    { "from": "RD.bottom", "to": "M1.D" },
    { "from": "M1.D", "to": "vout" },
    { "from": "M1.G", "to": "vin" },
    { "from": "M1.S", "to": "GND" }
  ],
  "layoutHints": { "inputSide": "left", "outputSide": "right", "routingStyle": "orthogonal" }
}
The deterministic renderer, not the model, emits the complete LaTeX document with the circuitikz package, document environment, voltage convention, explicit VDD/RD/M1/vin/vout/GND anchors, and terminated draw paths.`
        : '';
    const drawnixMindMapTargetLine = isDrawnixMindMapRequest
        ? buildDrawnixKnowledgeMapPromptRules({ sourcePath: options.sourcePath })
        : '';
    const supportedIntentsSection = isCircuitikzRequest
        ? 'Supported intent: circuit'
        : isDrawnixMindMapRequest
        ? 'Supported intent: drawnixMindmap'
        : isRadarRequest
        ? 'Supported intent: radar'
        : isOrgChartRequest
        ? 'Supported intent: orgChart'
        : `Supported intents:
- mindmap
- flowchart
- sequence
- classDiagram
- erDiagram
- stateDiagram
- canvasMap
- circuit
- dataChart
- radar
- orgChart
- timeline
- swimlane
- quadrant`;

    const targetLanguageLine = options.targetLanguage
        ? `Write all human-readable labels in ${options.targetLanguage}.`
        : 'Write all human-readable labels in the same language as the source unless the caller specifies a target language.';

    return `You are a diagram planning assistant. Analyze the source note and return a structured DiagramSpec JSON object.

Output rules:
- Return JSON only.
- Do not wrap the JSON in markdown code fences.
- Do not output Mermaid, Canvas, Vega-Lite, PlantUML, or any other renderer syntax.
- Do not emit sourceCoverageDiagnostics; that renderer-owned field is added deterministically after parsing.
- Do not output explanations outside the DiagramSpec JSON payload.
- Do not invent numeric data. If the source lacks reliable numeric values, choose a non-dataChart intent and leave dataSeries empty.

${supportedIntentsSection}

${preferredIntentLine}
${preferredChartTypeLine}
${circuitikzTargetLine}
${drawnixMindMapTargetLine}
Mermaid candidate intent contracts:
- For timeline, set intent to timeline and provide timelineEvents[]. Each event requires id, date (string or number), label, and optional details[] strings. Do not encode timeline events only as generic nodes.
- For swimlane, set intent to swimlane and provide swimlaneLanes[]. Each lane requires id, label, and a non-empty steps[] list. Each step requires id and label; nextStepId may reference another step in the same lane.
- For quadrant, set intent to quadrant and provide quadrant with xAxisLabel [low, high], yAxisLabel [low, high], exactly four quadrantLabels, and quadrant items containing id, label, and x/y numbers in the inclusive 0..1 range.
- For radar, set intent to radar and provide radarSpec. radarSpec.axes must contain 3 to 12 unique axes with id, label, and an optional positive max. radarSpec.series must contain 1 to 8 series; each series requires id, label, and exactly one point per axis. Each point requires axisId and a finite non-negative value. Do not use layoutHints.chartType for radar.
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
- radarSpec when intent is radar
- orgChartSpec when intent is orgChart

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
- For timeline, swimlane, and quadrant intents, use only the dedicated payload described above and keep identifiers stable and unique.
- For radar intent, keep axis order stable and use exactly one point per axis so all series share the same scale.
- For orgChart intent, set nodes to an empty array and provide orgChartSpec.nodes. Each owner requires id and label; reportsTo must reference an existing owner. Keep the payload to no more than 12 owners, one root, no more than four tiers, and no more than five direct reports per owner. Optional role, scope (up to four short strings), and status (active, planned, or gap) are rendered as ownership metadata. Do not encode org-chart ownership only as generic edges.

Return a single valid DiagramSpec JSON object.`;
}
