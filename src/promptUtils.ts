import { TaskKey } from './types';

export const DEFAULT_PROMPTS: Record<TaskKey, string> = {
    addLinks: `Completely decompose and structure the knowledge points in this markdown document, outputting them in markdown format supported by Obsidian. Core knowledge points should be labelled with Obsidian's backlink format [[]]. Do not output anything other than the original text and the requested "Obsidian's backlink format [[]]".

Rules:
1. Only add Obsidian backlinks [[like this]] to core concepts. Do not modify the original text content or formatting otherwise.
2. Skip conventional names (common products, company names, dates, times, individual names) unless they represent a core technical or scientific concept within the text's context.
3. Output the *entire* original content of the chunk, preserving all formatting (headers, lists, code blocks, etc.), with only the added backlinks.
4. Handle duplicate concepts carefully:
    a. If both singular and plural forms of a word/concept appear (e.g., "model" and "models"), only add the backlink to the *first occurrence* of the *singular* form (e.g., [[model]]). Do not link the plural form.
    b. If a single-word concept (e.g., "relaxation") also appears as part of a multi-word concept (e.g., "dielectric relaxation"), only add the backlink to the *multi-word* concept (e.g., [[dielectric relaxation]]). Do not link the standalone single word in this case.
    c. Do not add duplicate backlinks for the exact same concept within this chunk. Link only the first meaningful occurrence.
5. Ignore any "References", "Bibliography", or similar sections, typically found at the end of documents. Do not add backlinks within these sections.`,
    generateTitle: `Create comprehensive technical documentation about "{TITLE}" with a focus on scientific and mathematical rigor.
{RESEARCH_CONTEXT_SECTION}
Include:
1.  Detailed explanation of core concepts with their mathematical foundations. Start with a Level 2 Header (## {TITLE}).
2.  Key technical specifications with precise values and units (use tables).
3.  Common use cases with quantitative performance metrics.
4.  Implementation considerations with algorithmic complexity analysis (if applicable).
5.  Performance characteristics with statistical measures.
6.  Related technologies with comparative mathematical models.
7.  Mathematical equations in LaTeX format (using $$...$$ for display and $...$ for inline) with detailed explanations of all parameters and variables. Example: $$ P(f) = \\int_{-\\infty}^{\\infty} p(t) e^{-i2\\pi ft} dt $$
8.  Mermaid.js diagram code blocks using the format \`\`\`mermaid ... \`\`\` (IMPORTANT: without brackets "()" or "{}" for Mermaid diagrams) for complex relationships or system architectures,Enclosed node names with spaces/special characters in square brackets,which is [ and ], Avoids special LaTeX syntax and Added quotes around subgraph titles with special characters, "subgraph" and "end" cannot appear on the same line!For example:
\`\`\`mermaid
graph TD
    Start[Input: Year] --> IsDiv400["Year % 400 == 0?"];
    IsDiv400 -- Yes --> Leap[Leap Year, 366 days];
    IsDiv400 -- No --> IsDiv100["Year % 100 == 0?"];
    IsDiv100 -- Yes --> Common1[Common Year, 365 days];
    IsDiv100 -- No --> IsDiv4["Year % 4 == 0?"];
    IsDiv4 -- Yes --> Leap;
    IsDiv4 -- No --> Common2[Common Year, 365 days];
    Leap --> End[End];
    Common1 --> End;
    Common2 --> End;

    style Leap fill:#ccffcc,stroke:#006600
    style Common1 fill:#ffcccc,stroke:#990000
    style Common2 fill:#ffcccc,stroke:#990000
\`\`\` and \`\`\`mermaid
graph LR
    subgraph "Material Mechanical Properties"
        Stress --> Strain;
        Strain -- "Linear Ratio" --> Youngs_Modulus[E - Young's Modulus<br>Tensile Stiffness];
        Stress -- "Yield Point" --> Yield_Strength[σy - Yield Strength<br>Onset of Plasticity];
        Stress -- "Maximum Point" --> UTS[UTS - Ultimate Tensile Strength];
        Strain -- "Transverse/Axial Ratio" --> Poissons_Ratio[ν - Poisson's Ratio];
        Shear_Stress --> Shear_Strain;
        Shear_Strain -- "Linear Ratio" --> Shear_Modulus[G - Shear Modulus<br>Shear Stiffness];
        Hydrostatic_Pressure --> Volumetric_Strain;
        Volumetric_Strain -- "Linear Ratio" --> Bulk_Modulus[K - Bulk Modulus<br>Volumetric Stiffness];

        Youngs_Modulus -- "Isotropic Relations" --> Shear_Modulus;
        Youngs_Modulus -- "Isotropic Relations" --> Bulk_Modulus;
        Youngs_Modulus -- "Isotropic Relations" --> Poissons_Ratio;
        Shear_Modulus -- "Isotropic Relations" --> Bulk_Modulus;
        Shear_Modulus -- "Isotropic Relations" --> Poissons_Ratio;
        Bulk_Modulus -- "Isotropic Relations" --> Poissons_Ratio;

        Yield_Strength --> Plasticity[Plastic Deformation Region];
        UTS --> Plasticity;
        Stress_Strain_Curve_Area --> Toughness;

    end

    style Youngs_Modulus fill:#ccf,stroke:#333,stroke-width:2px
    style Shear_Modulus fill:#cfc,stroke:#333,stroke-width:2px
    style Bulk_Modulus fill:#cff,stroke:#333,stroke-width:2px
    style Poissons_Ratio fill:#fcf,stroke:#333,stroke-width:2px
\`\`\` and 
\`\`\`mermaid
graph TD
    WavePattern -->|Mechanical?| Mechanical
    WavePattern -->|Electromagnetic?| Electromagnetic
    Mechanical -->|Longitudinal?| Sound
    Mechanical -->|Transverse?| SeismicWaves
    Sound[Sound Waves] -->|In air?| Acoustic[343 m/s, 20 Hz-20 kHz]
    SeismicWaves[Seismic Waves] -->|Body wave?| PWave[6.5 km/s]
    SeismicWaves -->|Surface wave?| RayleighWave[2.5 km/s]

    Electromagnetic -->|Free space?| EMFreeSpace[c=3e8 m/s]
    Electromagnetic -->|Guided medium?| OpticalFiber[Dispersion=1e-3 ps/nm/km]
\`\`\` and \`\`\`mermaid
graph TD
    subgraph "Theoretical Frameworks for Electromagnetism"
        QED["Standard Model QED Massless Photon"]
        Proca["Proca Theory Massive Photon - 'Yukawa Photon'"]
        Stueckelberg["Stueckelberg Mechanism Massive Photon"]
        DarkPhoton["Dark Photon Models New Gauge Boson"]
    end

    QED -- "Add Mass Term" --> Proca;
    Proca -- "Breaks Gauge Invariance" --> Issue1["Renormalization/High Energy Issues"];
    QED -- "Introduce Stueckelberg Field" --> Stueckelberg;
    Stueckelberg -- "Preserves Gauge Invariance" --> Proca_Unitary["Unitary Gauge -> Proca"];
    Stueckelberg -- "Theoretically Cleaner" --> Benefit1["Better Renormalizability"];
    QED -- "Add New U1' + Mixing" --> DarkPhoton;

    Proca -- "Feature: Yukawa Potential" --> YP["Vr ~ exp-mr/r"];
    QED -- "Feature: Coulomb Potential" --> CP["Vr ~ 1/r"];
    Proca -- "Feature: 3 d.o.f." --> DOF3["2 Transverse + 1 Longitudinal"];
    QED -- "Feature: 2 d.o.f." --> DOF2["2 Transverse"];

    style QED fill:#ccf,stroke:#333,stroke-width:2px
    style Proca fill:#fcc,stroke:#333,stroke-width:2px
    style Stueckelberg fill:#cfc,stroke:#333,stroke-width:2px
    style DarkPhoton fill:#ffc,stroke:#333,stroke-width:2px
\`\`\`.
9.  Use bullet points for lists longer than 3 items.
10. Include references to academic papers with DOI where applicable, under a "## References" section.
11. Preserve all mathematical formulas and scientific principles without simplification.
12. Define all variables and parameters used in equations.
13. Include statistical measures and confidence intervals where relevant.

Format directly for Obsidian markdown. Do NOT wrap the entire response in a markdown code block. Start directly with the Level 2 Header.`,
    researchSummarize: `Summarize the following search results for the topic "{TOPIC}". Provide a concise yet comprehensive overview. Focus on key findings, data, and important conclusions. Format the summary in Markdown.

Search Results:
{SEARCH_RESULTS_CONTEXT}`,
    translate: `Translate the following text to {LANGUAGE}. Only output the translated text. Do not include the original text.
    
Text to translate:
{TEXT}`,
    summarizeToMermaid: `You are an AI assistant specializing in text analysis and data visualization. Your sole task is to act as a processor that converts the user-provided document into a single, comprehensive Mermaid diagram.
The most important point is: Delete all parentheses. Parentheses are not allowed in Mermaid diagrams.
    Primary Instructions:
Analyze and Summarize: Read the entire provided document to understand its structure and identify its primary sections and key ideas.
Generate Mermaid Diagram Only: Your entire output must be a single Mermaid code block. Do not include any titles, explanations, greetings, or any text whatsoever outside of the mermaid ... block.
Critical Syntax Rules for Obsidian Compatibility:
You must adhere strictly to the following rules to ensure the diagram renders correctly. Failure to follow these will result in errors.
Diagram Type: The diagram must begin with the mindmap keyword on the first line.
Hierarchy via Indentation: The structure of the mind map is defined only by indentation. Use a consistent four (4) spaces for each level of indentation.
Root Node: The first node after the mindmap declaration should be the root of the mind map, with its text enclosed in double parentheses inside the quotes, like this: root(("Title of the Document")).
No List Markers: Never use hyphens (-), double hyphens (--), asterisks (*), or any other characters to denote list items. Each new indented line is automatically a new node.
Character Replacement: As a safeguard, replace the --> character sequence with the word "to" or "implies" to avoid parsing conflicts.
Content and Structure Rules:
Hierarchical Structure: The Mermaid diagram must mirror the structure of the source document.
Root: The document's title will be the text for the root node.
Section Branches: Each major section of the document will be a primary branch (indented once).
Section Summary: For each section branch, provide a concise summary broken down into a maximum of five distinct child nodes. Each of these summary points must not exceed 300 words.
Key Sentences: After the summary points for a section, create a dedicated sub-branch titled "Key Sentences". Under this branch, list the most critical and insightful sentences extracted verbatim from that section, with each sentence as its own distinct node.
Example Output Format:
\`\`\`mermaid
mindmap
    Article Title
        Section 1: Title of the First Section
            Summary Point 1 for Section 1 - max 300 words
            Summary Point 2 for Section 1 - max 300 words
            Summary Point 3 for Section 1 - max 300 words
            Key Sentences
                The most critical original sentence from section 1.
                The second most critical original sentence from section 1.
        Section 2: Title of the Second Section
            Summary Point 1 for Section 2 - max 300 words
            Summary Point 2 for Section 2 - max 300 words
            Key Sentences
                The most critical original sentence from section 2.
                The second most critical original sentence from section 2.
\`\`\`
`
};

export function getDefaultPrompt(taskKey: TaskKey): string {
    return DEFAULT_PROMPTS[taskKey] || '';
}
