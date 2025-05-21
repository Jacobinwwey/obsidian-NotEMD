import { NotemdSettings, LLMProviderConfig } from './types';

// Default settings for the plugin
export const DEFAULT_SETTINGS: NotemdSettings = {
    providers: [
        {
            name: 'DeepSeek',
            apiKey: '',
            baseUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-reasoner',
            temperature: 0.5
        },
        {
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        },
        {
            name: 'Anthropic',
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.5
        },
        {
            name: 'Google',
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1',
            model: 'gemini-2.0-flash-exp',
            temperature: 0.5
        },
        {
            name: 'Mistral',
            apiKey: '',
            baseUrl: 'https://api.mistral.ai/v1',
            model: 'mistral-large-latest',
            temperature: 0.5
        },
        {
            name: 'Azure OpenAI',
            apiKey: '',
            baseUrl: '',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        },
        {
            name: 'LMStudio',
            apiKey: 'EMPTY', // LMStudio often requires a placeholder
            baseUrl: 'http://localhost:1234/v1',
            model: 'local-model', // User needs to set this based on their loaded model
            temperature: 0.7
        },
        {
            name: 'Ollama',
            apiKey: '', // Ollama doesn't use API keys
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3', // User needs to set this based on their pulled models
            temperature: 0.7
        },
        {
            name: 'OpenRouter',
            apiKey: '', // Required
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'gryphe/mythomax-l2-13b', // Example model, user should change
            temperature: 0.7
        }
    ],
    activeProvider: 'DeepSeek',
    // Concept Note Defaults
    useCustomConceptNoteFolder: false,
    conceptNoteFolder: '',
    // Processed File Defaults
    useCustomProcessedFileFolder: false,
    processedFileFolder: '',
    // Concept Log File Defaults - START
    generateConceptLogFile: false,
    useCustomConceptLogFolder: false,
    conceptLogFolderPath: '',
    useCustomConceptLogFileName: false,
    conceptLogFileName: 'Generate.log',
    // Concept Log File Defaults - END
    // Other Defaults
    chunkWordCount: 3000,
    maxTokens: 8192, // Default max tokens for LLM response
    enableDuplicateDetection: true, // Enable by default
    processMode: 'single',
    moveOriginalFileOnProcess: false, // Default to creating copies
    tavilyApiKey: '', // Default Tavily API Key to empty
    searchProvider: 'tavily', // Default search provider
    ddgMaxResults: 5, // Default max results for DuckDuckGo
    ddgFetchTimeout: 15, // Default timeout (seconds) for fetching DDG result content
    maxResearchContentTokens: 3000, // Default token limit for research content
    enableResearchInGenerateContent: false, // Default to false: Generate from Title does NOT research by default
    tavilyMaxResults: 5, // Default Tavily max results
    tavilySearchDepth: 'basic', // Default Tavily search depth
    // Multi-model defaults
    useMultiModelSettings: false, // Default to using the single activeProvider
    addLinksProvider: 'DeepSeek', // Default to the primary activeProvider initially
    researchProvider: 'DeepSeek', // Default to the primary activeProvider initially
    generateTitleProvider: 'DeepSeek', // Default to the primary activeProvider initially
    // Stable API Call Defaults
    enableStableApiCall: false, // Default to disabled
    apiCallInterval: 5, // Default interval 5 seconds
    apiCallMaxRetries: 3, // Default max 3 retries
    // Task-specific model defaults (empty means use provider's default)
    addLinksModel: '',
    researchModel: '',
    generateTitleModel: '',
    // Custom Add Links Output Filename Defaults
    useCustomAddLinksSuffix: false, // Default to standard '_processed.md' suffix
    addLinksCustomSuffix: '', // Default custom suffix is empty (relevant only if toggle is on)
    // Custom Generate from Title Output Folder Defaults
    useCustomGenerateTitleOutputFolder: false, // Default to using '[foldername]_complete'
    generateTitleOutputFolderName: '_complete', // Default folder name if custom is enabled but empty
    // Custom Duplicate Check Scope Defaults (Refined)
    duplicateCheckScopeMode: 'vault', // Default to checking the entire vault
    duplicateCheckScopePaths: '', // Default to empty list of paths
    // Add Links Post-Processing Defaults
    removeCodeFencesOnAddLinks: false, // Default to NOT removing code fences
    enableChangePromptWord: false, // Default to false

    // Custom Prompts - Initialized with toggles disabled and empty strings
    enableChangePromptAddLinks: false, // Default to not using custom prompt
    customPromptAddLinks: '',
    enableChangePromptGenerateContent: false, // Default to not using custom prompt
    customPromptGenerateContent: '',
    enableChangePromptResearchSummarize: false, // Default to not using custom prompt
    customPromptResearchSummarize: '',
};

// Constants for the Sidebar View
export const NOTEMD_SIDEBAR_VIEW_TYPE = "notemd-sidebar-view";
export const NOTEMD_SIDEBAR_DISPLAY_TEXT = "Notemd Processor";
export const NOTEMD_SIDEBAR_ICON = "wand"; // Example icon

// Default Prompts for Tasks
export const DEFAULT_PROMPT_ADD_LINKS = `Completely decompose and structure the knowledge points in this markdown document, outputting them in markdown format supported by Obsidian. Core knowledge points should be labelled with Obsidian's backlink format [[]]. Do not output anything other than the original text and the requested "Obsidian's backlink format [[]]".

Rules:
1. Only add Obsidian backlinks [[like this]] to core concepts. Do not modify the original text content or formatting otherwise.
2. Skip conventional names (common products, company names, dates, times, individual names) unless they represent a core technical or scientific concept within the text's context.
3. Output the *entire* original content of the chunk, preserving all formatting (headers, lists, code blocks, etc.), with only the added backlinks.
4. Handle duplicate concepts carefully:
    a. If both singular and plural forms of a word/concept appear (e.g., "model" and "models"), only add the backlink to the *first occurrence* of the *singular* form (e.g., [[model]]). Do not link the plural form.
    b. If a single-word concept (e.g., "relaxation") also appears as part of a multi-word concept (e.g., "dielectric relaxation"), only add the backlink to the *multi-word* concept (e.g., [[dielectric relaxation]]). Do not link the standalone single word in this case.
    c. Do not add duplicate backlinks for the exact same concept within this chunk. Link only the first meaningful occurrence.
5. Ignore any "References", "Bibliography", or similar sections, typically found at the end of documents. Do not add backlinks within these sections.`;

export const DEFAULT_PROMPT_GENERATE_CONTENT_PREFIX = `Create comprehensive technical documentation about "{TITLE}" with a focus on scientific and mathematical rigor.`;
export const DEFAULT_PROMPT_GENERATE_CONTENT_SUFFIX = `

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
Format directly for Obsidian markdown. Do NOT wrap the entire response in a markdown code block. Start directly with the Level 2 Header.`;

// For display in settings, we'll show a simplified version or placeholder for dynamic parts like {TITLE} and {RESEARCH_CONTEXT}
export const DEFAULT_PROMPT_GENERATE_CONTENT_DISPLAY = `Create comprehensive technical documentation about "{TITLE}" with a focus on scientific and mathematical rigor.
(Includes detailed instructions for structure, LaTeX, Mermaid diagrams, etc.)
If research is enabled, the prompt will also include:
Use the following research context to inform the documentation:
{RESEARCH_CONTEXT}
Documentation based on the title "{TITLE}" and the provided context:
Otherwise:
Documentation based *only* on the title "{TITLE}":`;


export const DEFAULT_PROMPT_RESEARCH_SUMMARIZE_PREFIX = `Based on the following research context gathered for "{TOPIC}", provide a concise summary focusing on the key facts, concepts, and conclusions. Present the summary in clear Markdown format.`;
// For display in settings
export const DEFAULT_PROMPT_RESEARCH_SUMMARIZE_DISPLAY = `Based on the following research context gathered for "{TOPIC}", provide a concise summary focusing on the key facts, concepts, and conclusions. Present the summary in clear Markdown format.

Research Context:
{RESEARCH_CONTEXT}`;

/**
 * Helper function to construct the full default prompt for Generate Content from Title.
 * @param title The title of the note.
 * @returns The full default prompt string.
 */
export function getFullDefaultGenerateContentPrompt(title: string): string {
    return `${DEFAULT_PROMPT_GENERATE_CONTENT_PREFIX.replace('{TITLE}', title)}${DEFAULT_PROMPT_GENERATE_CONTENT_SUFFIX.replace('{TITLE}', title)}`;
}

/**
 * Helper function to construct the full default prompt for Research and Summarize.
 * @param topic The topic of research.
 * @param researchContext The context obtained from research.
 * @returns The full default prompt string.
 */
export function getFullDefaultResearchSummarizePrompt(topic: string, researchContext: string): string {
    return `${DEFAULT_PROMPT_RESEARCH_SUMMARIZE_PREFIX.replace('{TOPIC}', topic)}\n\nResearch Context:\n${researchContext}`;
}
