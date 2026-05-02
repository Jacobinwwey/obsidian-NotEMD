![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Notemd-plugin til Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Læs dokumentation på flere sprog: [Sprogcenter](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI-drevet flersproget vidensforbedring
==================================================
```

En nem måde at opbygge din egen vidensbase på.

Notemd forbedrer dit Obsidian-workflow ved at integrere med forskellige store sprogmodeller (LLM'er) til at behandle dine flersprogede noter, automatisk generere wiki-links til nøglebegreber, oprette tilsvarende konceptnoter, udføre webresearch og hjælpe dig med at opbygge stærke vidensgrafer med mere.

If\ you\ love\ using\ Notemd\,\ please\ consider\ \[\�\�\�\ Give\ a\ Star\ on\ GitHub\]\(https\:\/\/github\.com\/Jacobinwwey\/obsidian\-NotEMD\)\ or\ \[\�\�\�\�\�\�\ Buy\ Me\ a\ Coffee\]\(https\:\/\/ko\-fi\.com\/jacobinwwey\)\.

Hvis du elsker at bruge Notemd, overvej venligst at [⭐ give en stjerne på GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) eller [☕️ købe en kaffe til mig](https://ko-fi.com/jacobinwwey).

**Version:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Indholdsfortegnelse

- [Hurtig start](#hurtig-start)
- [Sprogunderstøttelse](#sprogunderstøttelse)
- [Funktioner](#funktioner)
- [Installationsvejledning](#installation)
- [Konfiguration](#konfiguration)
- [Brugervejledning](#brugervejledning)
- [Understøttede LLM-udbydere](#understøttede-llm-udbydere)
- [Netværksbrug og datahåndtering](#netværksbrug-og-datahåndtering)
- [Fejlfinding](#fejlfinding)
- [Bidrag](#bidrag)
- [Dokumentation for vedligeholdere](#dokumentation-for-vedligeholdere)
- [Licens](#licens)

## Hurtig start

1. **Installer og aktiver**: Hent pluginet fra Obsidian Marketplace.
2. **Konfigurer LLM**: Gå til `Settings -> Notemd`, vælg din LLM-udbyder, for eksempel OpenAI eller en lokal udbyder som Ollama, og indtast din API-nøgle/URL.
3. **Åbn sidepanelet**: Klik på Notemd-tryllestavsikonet i venstre sidebjælke for at åbne sidepanelet.
4. **Behandl en note**: Åbn en vilkårlig note og klik på **"Process File (Add Links)"** i sidepanelet for automatisk at tilføje `[[wiki-links]]` til vigtige begreber.
5. **Kør et hurtigt workflow**: Brug standardknappen **"One-Click Extract"** til at kæde behandling, batchgenerering og Mermaid-oprydning fra ét indgangspunkt.

Det er det. Udforsk indstillingerne for at låse op for flere funktioner som webresearch, oversættelse og indholdsgenerering.

## Sprogunderstøttelse

### Aftale om sproglig adfærd

| Aspekt | Omfang | Standard | Bemærkninger |
|---|---|---|---|
| `Grænsefladesprog` | Kun pluginets UI-tekst, som indstillinger, sidepanel, notifikationer og dialoger | `auto` | Følger Obsidians locale; nuværende UI-kataloger er `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN` og `zh-TW`. |
| `Opgaveoutputsprog` | LLM-genereret opgaveoutput, som links, opsummeringer, generering, ekstraktion og oversættelsesmål | `en` | Kan være globalt eller pr. opgave, når `Brug forskellige sprog til opgaver` er aktiveret. |
| `Deaktiver automatisk oversættelse` | Ikke-Translate-opgaver bevarer kontekst på kildesproget | `false` | Eksplicitte `Translate`-opgaver håndhæver stadig det konfigurerede målsprog. |
| Sprogfallback | Opløsning af manglende UI-nøgler | locale -> `en` | Holder UI'et stabilt, når enkelte nøgler endnu ikke er oversat. |

- De vedligeholdte kildedokumenter er engelsk og forenklet kinesisk, og offentliggjorte README-oversættelser er linket i overskriften ovenfor.
- Appens dækning af UI-lokaler matcher i øjeblikket præcist det eksplicitte katalog i koden: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Engelsk fallback forbliver et implementeringsmæssigt sikkerhedsnet, men understøttede synlige flader er dækket af regressionstests og bør ikke stiltiende falde tilbage til engelsk under normal brug.
- Yderligere detaljer og retningslinjer for bidrag spores i [Sprogcenter](./docs/i18n/README.md).

## Funktioner

### AI-drevet dokumentbehandling
- **Multi-LLM-understøttelse**: Forbind til forskellige cloudbaserede og lokale LLM-udbydere. Se [Understøttede LLM-udbydere](#understøttede-llm-udbydere).
- **Smart chunking**: Opdeler automatisk store dokumenter i håndterbare dele baseret på ordantal.
- **Bevarelse af indhold**: Forsøger at bevare den oprindelige formatering, mens struktur og links tilføjes.
- **Fremdriftssporing**: Realtidsopdateringer via Notemd Sidebar eller en progress modal.
- **Annullerbare operationer**: Enhver behandlingsopgave, der startes fra sidepanelet, kan annulleres via dens dedikerede cancel-knap. Kommandoer fra command palette bruger en modal, som også kan annulleres.
- **Konfiguration med flere modeller**: Brug forskellige LLM-udbydere og specifikke modeller til forskellige opgaver, som Add Links, Research, Generate Title og Translate, eller brug en enkelt udbyder til det hele.
- **Stable API Calls (retry-logik)**: Du kan valgfrit aktivere automatiske genforsøg for mislykkede LLM API-kald med konfigurerbart interval og maksimum antal forsøg.
- **Mere robuste forbindelsestest for udbydere**: Hvis den første forbindelsestest fejler på grund af en midlertidig netværksafbrydelse, skifter Notemd automatisk til den stabile retry-sekvens, før testen markeres som mislykket. Det dækker OpenAI-compatible, Anthropic, Google, Azure OpenAI og Ollama.
- **Transportfallback afhængigt af runtime-miljø**: Når en langvarig anmodning til en udbyder afbrydes af `requestUrl` på grund af midlertidige netværksfejl som `ERR_CONNECTION_CLOSED`, forsøger Notemd nu samme forsøg igen via en miljøspecifik fallback-transport. Desktop-builds bruger Node `http/https`, mens ikke-desktopmiljøer bruger browser-`fetch`. Det reducerer falske fejl på langsomme gateways og reverse proxies.
- **Forstærket kæde for lange OpenAI-compatible-kald**: I stabil tilstand bruger OpenAI-compatible-kald nu en eksplicit trefaset rækkefølge for hvert forsøg: direct streaming transport, direct non-stream transport og derefter `requestUrl` fallback, som stadig kan opgraderes til streamed parsing efter behov. Det reducerer falsk-negative resultater, når udbyderen faktisk afslutter buffrede svar, men streaming-pipelinen er ustabil.
- **Protocol-aware streaming fallback på tværs af hele LLM-API-overfladen**: Fallback-forsøg for lange anmodninger bruger nu protocol-aware streamed parsing på alle indbyggede LLM-veje, ikke kun OpenAI-compatible-endpoints. Notemd håndterer nu OpenAI/Azure SSE, Anthropic Messages streaming, Google Gemini SSE og Ollama NDJSON i både desktop `http/https` og ikke-desktop `fetch`, og øvrige OpenAI-lignende udbyderveje genbruger den samme delte fallback-sti.
- **Kina-klare presets**: Indbyggede presets dækker nu `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` og `SiliconFlow`, ud over de eksisterende globale og lokale udbydere.
- **Pålidelig batchbehandling**: Logikken for samtidig behandling er forbedret med **staggered API calls** for at undgå rate limiting og give stabil ydeevne i store batchjobs. Opgaver starter nu med forskellige intervaller i stedet for alle på én gang.
- **Præcis fremdriftsrapportering**: En fejl, der kunne få progress bar til at hænge, er rettet, så UI'et nu altid afspejler operationens reelle status.
- **Robust parallel batchbehandling**: Et problem, der fik parallelle batchoperationer til at stoppe for tidligt, er løst, så alle filer nu behandles pålideligt og effektivt.
- **Nøjagtighed i progress bar**: En fejl, der fik progress bar for kommandoen "Create Wiki-Link & Generate Note" til at hænge ved 95 %, er rettet og viser nu korrekt 100 % ved fuldførelse.
- **Forbedret API-debugging**: "API Error Debugging Mode" indsamler nu hele response body fra LLM-udbydere og søgetjenester som Tavily og DuckDuckGo og logger også en transporttidslinje pr. forsøg med sanerede request-URL'er, tidsforbrug, response headers, partial response body, parsed partial stream output og stack traces for nemmere fejlfinding på tværs af OpenAI-compatible, Anthropic, Google, Azure OpenAI og Ollama fallback-stier.
- **Panel til Developer Mode**: Indstillingerne indeholder nu et dedikeret diagnosepanel til udviklere, som forbliver skjult, indtil "Developer mode" aktiveres. Det understøtter valg af diagnostic call path og kørsel af gentagne stabilitetsprober for den valgte tilstand.
- **Redesignet sidepanel**: Indbyggede handlinger er grupperet i mere fokuserede sektioner med tydeligere labels, live-status, annullerbar fremdrift og kopierbare logs for at reducere rod i sidepanelet. Footer for progress og log forbliver nu synlig, selv når alle sektioner er udvidet, og ready state bruger et tydeligere standby-spor.
- **Forfinet interaktion og læsbarhed i sidepanelet**: Sidepanelets knapper giver nu tydeligere feedback ved hover, tryk og focus, og farverige CTA-knapper, inklusive `One-Click Extract` og `Batch generate from titles`, har stærkere tekstkontrast for bedre læsbarhed på tværs af temaer.
- **Single-file CTA mapping**: Farverig CTA-styling er nu forbeholdt single-file-handlinger. Batch- eller handlinger på mappeniveau og blandede workflows bruger non-CTA-stil for at reducere fejlklik omkring handlingens omfang.
- **Custom one-click workflows**: Forvandl sidepanelets indbyggede værktøjer til genbrugelige knapper med egne navne og sammensatte handlingskæder. Et standardworkflow `One-Click Extract` følger med fra start.

### Forbedring af vidensgraf
- **Automatisk wiki-linking**: Identificerer kernebegreber og tilføjer `[[wiki-links]]` i behandlede noter baseret på LLM-output.
- **Oprettelse af konceptnoter, valgfrit og tilpasningsbart**: Opretter automatisk nye noter for opdagede begreber i en angivet mappe i dit vault.
- **Tilpasselige outputstier**: Konfigurer separate relative stier i dit vault til at gemme processed files og nyoprettede konceptnoter.
- **Tilpasselige outputfilnavne (Add Links)**: Du kan vælge at **overskrive originalfilen** eller bruge et tilpasset suffix eller en erstatningsstreng i stedet for standard `_processed.md`, når filer behandles for at tilføje links.
- **Bevarelse af linkintegritet**: Grundlæggende håndtering findes til at opdatere links, når noter omdøbes eller slettes i vaultet.
- **Ren begrebsudtrækning**: Udtræk begreber og opret tilsvarende konceptnoter uden at ændre originaldokumentet. Det er ideelt til at udfylde en vidensbase fra eksisterende dokumenter uden at ændre kildematerialet. Funktionen har konfigurerbare muligheder for minimale konceptnoter og backlinks.

### Oversættelse

- **AI-drevet oversættelse**:
  - Oversætter noteindhold med den konfigurerede LLM.
  - **Understøttelse af store filer**: Store filer opdeles automatisk i mindre chunks baseret på indstillingen `Chunk word count`, før de sendes til LLM'en, og de oversatte dele samles derefter sømløst til ét dokument.
  - Understøtter oversættelse mellem mange sprog.
  - Målsproget kan tilpasses via indstillinger eller UI.
  - Den oversatte tekst kan automatisk åbnes i panelet til højre for originalteksten for nem sammenligning.
- **Batch-oversættelse**:
  - Oversætter alle filer i en valgt mappe.
  - Understøtter parallel behandling, hvis "Enable Batch Parallelism" er aktiveret.
  - Bruger custom prompts til oversættelse, hvis det er konfigureret.
  - Tilføjer valgmuligheden "Batch translate this folder" til kontekstmenuen i filudforskeren.
- **Deaktiver automatisk oversættelse**: Når dette er aktiveret, tvinger ikke-Translate-opgaver ikke længere output til et bestemt sprog, så den oprindelige sprogkontekst bevares. Den eksplicitte opgave `Translate` oversætter stadig i henhold til konfigurationen.

### Webresearch og indholdsgenerering
- **Webresearch og opsummering**:
  - Udfører websøgninger med Tavily, som kræver API-nøgle, eller DuckDuckGo, som er eksperimentel.
  - **Forbedret søgerobusthed**: DuckDuckGo-søgning bruger nu forbedret parsinglogik med DOMParser og Regex-fallback for at håndtere layoutændringer og levere mere pålidelige resultater.
  - Opsummerer søgeresultater med den konfigurerede LLM.
  - Output-sproget for opsummeringen kan tilpasses i indstillingerne.
  - Tilføjer opsummeringer til den aktuelle note.
  - Har en konfigurerbar token-grænse for researchindhold, som sendes til LLM'en.
- **Indholdsgenerering fra titel**:
  - Bruger notens titel til at generere indledende indhold via LLM og erstatter eventuelt eksisterende indhold.
  - **Valgfri research**: Du kan konfigurere, om webresearch først skal køres med den valgte udbyder for at give yderligere kontekst til genereringen.
- **Batchgenerering af indhold fra titler**: Genererer indhold for alle noter i en valgt mappe baseret på deres titler med respekt for den valgfrie researchindstilling. Filer, der behandles korrekt, flyttes til en **konfigurerbar "complete"-undermappe**, for eksempel `[foldername]_complete` eller et brugerdefineret navn, for at undgå genbehandling.
- **Kobling til Mermaid auto-fix**: Når Mermaid auto-fix er aktiveret, reparerer Mermaid-relaterede workflows automatisk genererede filer eller outputmapper efter behandling. Det omfatter Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid og Translate.

### Hjælpefunktioner
- **Opsummer som Mermaid-diagram**:
  - Denne funktion gør det muligt at opsummere indholdet af en note som et Mermaid-diagram.
  - Output-sproget for Mermaid-diagrammet kan tilpasses i indstillingerne.
  - **Mermaid Output Folder**: Konfigurer mappen, hvor genererede Mermaid-diagramfiler skal gemmes.
  - **Translate Summarize to Mermaid Output**: Oversæt valgfrit indholdet af det genererede Mermaid-diagram til det konfigurerede målsprog.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Enkel korrektion af formelformat**:
  - Retter hurtigt matematiske formler på én linje, afgrænset af enkeltstående `$`, til standardblokke med dobbelte `$$`.
  - **Enkelt fil**: Behandl den aktuelle fil via knappen i sidepanelet eller command palette.
  - **Batch-fix**: Behandl alle filer i en valgt mappe via knappen i sidepanelet eller command palette.

- **Check for Duplicates in Current File**: Denne kommando hjælper dig med at identificere mulige dubletter af termer i den aktive fil.
- **Duplicate Detection**: Grundlæggende kontrol af dublette ord i indholdet af den aktuelt behandlede fil, resultater logges i konsollen.
- **Check and Remove Duplicate Concept Notes**: Identificerer potentielle dubletnoter i den konfigurerede **Concept Note Folder** baseret på præcise navnematches, flertalsformer, normalisering og enkeltordsindehold sammenlignet med noter uden for mappen. Sammenligningens omfang kan konfigureres til **hele vaultet**, **specifikke inkluderede mapper** eller **alle mapper undtagen specifikke undtagelser**. Viser en detaljeret liste med årsager og konfliktfiler og beder derefter om bekræftelse, før de identificerede dubletter flyttes til systemets papirkurv. Viser fremdrift under sletningen.
- **Batch Mermaid Fix**: Anvender korrektioner af Mermaid- og LaTeX-syntaks på alle Markdown-filer i en mappe valgt af brugeren.
  - **Workflow-klar**: Kan bruges som et selvstændigt værktøj eller som et trin i en tilpasset one-click workflow-knap.
  - **Fejlrapportering**: Genererer en rapport `mermaid_error_{foldername}.md`, der oplister filer, som stadig indeholder potentielle Mermaid-fejl efter behandling.
  - **Flyt fejlfiler**: Flytter valgfrit filer med registrerede fejl til en angivet mappe til manuel gennemgang.
  - **Smart registrering**: Kontrollerer nu intelligent filer for syntaksfejl ved hjælp af `mermaid.parse`, før den forsøger rettelser, hvilket sparer behandlingstid og undgår unødvendige redigeringer.
  - **Sikker behandling**: Sikrer, at syntaksrettelser kun anvendes på Mermaid-kodeblokke, så Markdown-tabeller eller andet indhold ikke ændres ved en fejl. Indeholder robuste sikkerhedsforanstaltninger til at beskytte tabelsyntaks som `| :--- |` mod aggressive debug-rettelser.
  - **Deep Debug Mode**: Hvis fejl fortsætter efter den første rettelse, udløses en avanceret deep debug-tilstand. Den håndterer komplekse edge cases, herunder:
    - **Comment Integration**: Sammenfletter automatisk efterfølgende kommentarer, der starter med `%`, med kantens label, for eksempel bliver `A -- Label --> B; % Comment` til `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Retter pile, som er blevet opslugt af citationstegn, for eksempel bliver `A -- "Label -->" B` til `A -- "Label" --> B`.
    - **Inline Subgraphs**: Konverterer inline subgraph-labels til edge labels.
    - **Reverse Arrow Fix**: Korrigerer ikke-standard `X <-- Y`-pile til `Y --> X`.
    - **Direction Keyword Fix**: Sikrer, at nøgleordet `direction` er skrevet med små bogstaver inde i subgraphs, for eksempel `Direction TB` -> `direction TB`.
    - **Comment Conversion**: Konverterer `//`-kommentarer til edge labels, for eksempel `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Forenkler gentagne labels i klammer, for eksempel `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Konverterer ugyldig pilesyntaks `--|>` til standard `-->`.
    - **Robust håndtering af labels og notes**: Forbedret håndtering af labels med specialtegn som `/` og bedre understøttelse af tilpasset note-syntaks som `note for ...`, samtidig med at artefakter som afsluttende `]` fjernes rent.
    - **Advanced Fix Mode**: Indeholder robuste rettelser til ukvoterede node-labels med mellemrum, specialtegn eller indlejrede klammer, for eksempel `Node[Label [Text]]` -> `Node["Label [Text]"]`, så komplekse diagrammer som Stellar Evolution-stier understøttes. Retter også fejlformede edge labels som `--["Label["-->` til `-- "Label" -->`. Derudover konverteres inline comments som `Consensus --> Adaptive; # Some advanced consensus` til `Consensus -- "Some advanced consensus" --> Adaptive`, og ufuldstændige citationstegn i linjeslut rettes ved at erstatte `;"` med `"]`.
    - **Note Conversion**: Konverterer automatisk `note right/left of` og selvstændige `note :`-kommentarer til standard Mermaid-node-definitioner og forbindelser, for eksempel bliver `note right of A: text` til `NoteA["Note: text"]`, som forbindes til `A`, for at undgå syntaksfejl og forbedre layoutet. Understøtter nu både pileforbindelser (`-->`) og faste forbindelser (`---`).
    - **Extended Note Support**: Konverterer automatisk `note for Node "Content"` og `note of Node "Content"` til standard sammenkædede note-noder, for eksempel `NoteNode[" Content"]` forbundet til `Node`, så brugerudvidet syntaks forbliver kompatibel.
    - **Enhanced Note Correction**: Omdøber automatisk notes med fortløbende nummerering, for eksempel `Note1`, `Note2`, for at undgå alias-problemer, når flere notes er til stede.
    - **Parallelogram/Shape Fix**: Retter fejlformede nodeformer som `[/["Label["/]` til standard `["Label"]`, så genereret indhold forbliver kompatibelt.
    - **Standardize Pipe Labels**: Retter og standardiserer automatisk edge labels med pipes, så de citeres korrekt, for eksempel bliver `-->|Text|` til `-->|"Text"|`, og `-->|Math|^2|` bliver til `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Retter fejlplacerede edge labels, som står før pilen, for eksempel bliver `>|"Label"| A --> B` til `A -->|"Label"| B`.
    - **Merge Double Labels**: Registrerer og sammenfletter komplekse dobbelte labels på én edge, for eksempel `A -- Label1 -- Label2 --> B` eller `A -- Label1 -- Label2 --- B`, til én ren label med linjeskift: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Sætter automatisk citationstegn omkring node-labels, der indeholder potentielt problematiske tegn som citationstegn, lighedstegn eller matematiske operatorer, men mangler ydre citationstegn, for eksempel bliver `Plot[Plot "A"]` til `Plot["Plot "A""]`, så renderfejl undgås.
    - **Intermediate Node Fix**: Deler edges, der indeholder en mellemliggende nodedefinition, op i to separate edges, for eksempel bliver `A -- B[...] --> C` til `A --> B[...]` og `B[...] --> C`, hvilket giver gyldig Mermaid-syntaks.
    - **Concatenated Label Fix**: Retter robust node-definitioner, hvor ID'et er slået sammen med labelen, for eksempel bliver `SubdivideSubdivide...` til `Subdivide["Subdivide..."]`, selv når den forudgås af pipe labels, eller når dubleringen ikke er helt præcis, ved at validere mod kendte node-ID'er.
    - **Extract Specific Original Text**:
      - Definér en liste med spørgsmål i indstillingerne.
      - Uddrager ordrette tekstsegmenter fra den aktive note, der besvarer disse spørgsmål.
      - **Merged Query Mode**: Giver mulighed for at behandle alle spørgsmål i ét API-kald for bedre effektivitet.
      - **Translation**: Giver mulighed for at inkludere oversættelser af den udtrukne tekst i outputtet.
      - **Custom Output**: Konfigurerbar gemmesti og filnavnssuffix for den udtrukne tekstfil.
- **LLM Connection Test**: Bekræft API-indstillingerne for den aktive udbyder.

## Installation

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Fra Obsidian Marketplace (anbefalet)
1. Åbn Obsidian **Settings** -> **Community plugins**.
2. Sørg for, at "Restricted mode" er **slået fra**.
3. Klik på **Browse** community plugins og søg efter "Notemd".
4. Klik på **Install**.
5. Når installationen er færdig, klik på **Enable**.

### Manuel installation
1. Download de nyeste release-filer fra [GitHub Releases-siden](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Hver release indeholder også `README.md` som pakket reference, men manuel installation kræver kun `main.js`, `styles.css` og `manifest.json`.
2. Gå til konfigurationsmappen for dit Obsidian-vault: `<YourVault>/.obsidian/plugins/`.
3. Opret en ny mappe med navnet `notemd`.
4. Kopiér `main.js`, `styles.css` og `manifest.json` ind i mappen `notemd`.
5. Genstart Obsidian.
6. Gå til **Settings** -> **Community plugins** og aktiver "Notemd".

## Konfiguration

Få adgang til pluginindstillingerne via:
**Settings** -> **Community Plugins** -> **Notemd** (klik på tandhjulsikonet).

### Konfiguration af LLM-udbyder
1. **Aktiv udbyder**: Vælg den LLM-udbyder, du vil bruge, i rullemenuen.
2. **Udbyderindstillinger**: Konfigurer de specifikke indstillinger for den valgte udbyder:
   - **API Key**: Kræves for de fleste cloududbydere, for eksempel OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks og Requesty. Ikke nødvendig for Ollama. Valgfri for LM Studio og den generiske preset `OpenAI Compatible`, når dit endpoint accepterer anonym eller placeholder-baseret adgang.
   - **Base URL / Endpoint**: API-endpointet for tjenesten. Standardværdier leveres, men du kan være nødt til at ændre dette for lokale modeller som LMStudio og Ollama, gateways som OpenRouter, Requesty og OpenAI Compatible eller specifikke Azure-deployments. **Kræves for Azure OpenAI.**
   - **Model**: Det specifikke modelnavn eller model-ID, der skal bruges, for eksempel `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` eller `anthropic/claude-3-7-sonnet-latest`. Sørg for, at modellen er tilgængelig hos dit endpoint eller din udbyder.
   - **Temperature**: Styrer tilfældigheden i LLM'ens output (0 = deterministisk, 1 = maksimal kreativitet). Lavere værdier, for eksempel 0.2-0.5, er normalt bedre til strukturerede opgaver.
   - **API Version (kun Azure)**: Kræves til Azure OpenAI-deployments, for eksempel `2024-02-15-preview`.
3. **Test forbindelse**: Brug knappen "Test forbindelse" for den aktive udbyder til at verificere dine indstillinger. OpenAI-compatible-udbydere bruger nu udbyderbevidste kontroller: endpoints som `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` og `OpenAI Compatible` tester `chat/completions` direkte, mens udbydere med et pålideligt `/models`-endpoint stadig kan bruge modellisting først. Hvis den første test fejler med en midlertidig netværksafbrydelse som `ERR_CONNECTION_CLOSED`, falder Notemd automatisk tilbage til den stabile retry-sekvens i stedet for at fejle med det samme.
4. **Administrer udbyderkonfigurationer**: Brug knapperne "Export Providers" og "Import Providers" til at gemme eller indlæse dine LLM-udbyderindstillinger til eller fra en `notemd-providers.json`-fil i pluginets konfigurationsmappe. Det gør backup og deling nemt.
5. **Preset-dækning**: Ud over de oprindelige udbydere indeholder Notemd nu preset-poster for `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` og et generisk mål `OpenAI Compatible` til LiteLLM, vLLM, Perplexity, Vercel AI Gateway eller tilpassede proxies.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-model-konfiguration
- **Brug forskellige udbydere til opgaver**:
  - **Fra (standard)**: Bruger den enkelte "aktive udbyder", som er valgt ovenfor, til alle opgaver.
  - **Til**: Giver dig mulighed for at vælge en specifik udbyder og valgfrit tilsidesætte modelnavnet for hver opgave, som "Add Links", "Research & Summarize", "Generate from Title", "Translate" og "Extract Concepts". Hvis feltet til model-override efterlades tomt, bruges standardmodellen, der er konfigureret for den udbyder, som er valgt til opgaven.
- **Vælg forskellige sprog til forskellige opgaver**:
  - **Fra (standard)**: Bruger det samme outputsprog til alle opgaver.
  - **Til**: Giver dig mulighed for at vælge et specifikt sprog for hver opgave, for eksempel "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" og "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Sprogarkitektur (grænsefladesprog og opgaveoutputsprog)

- **Grænsefladesprog** styrer kun tekst i pluginets grænseflade, som etiketter i indstillinger, knapper i sidepanelet, notifikationer og dialoger. Standardtilstanden `auto` følger Obsidians aktuelle UI-sprog.
- Regionale og skriftspecifikke varianter bliver nu løst til det nærmeste udgivne katalog i stedet for at falde direkte tilbage til engelsk. For eksempel bruger `fr-CA` fransk, `es-419` spansk, `pt-PT` portugisisk, `zh-Hans` forenklet kinesisk og `zh-Hant-HK` traditionelt kinesisk.
- **Opgaveoutputsprog** styrer modelgenereret output for opgaver, som links, opsummeringer, titelgenerering, Mermaid-opsummering, begrebsudtræk og oversættelsesmål.
- **Per-task language mode** lader hver opgave bestemme sit eget outputsprog ud fra et samlet policy-lag i stedet for spredte overrides på tværs af moduler.
- **Deaktiver automatisk oversættelse** betyder, at ikke-Translate-opgaver bevarer konteksten på kildesproget, mens eksplicitte Translate-opgaver stadig håndhæver det konfigurerede målsprog.
- Mermaid-relaterede genereringsstier følger den samme sprogpolitik og kan stadig udløse Mermaid auto-fix, når det er aktiveret.

### Indstillinger for stabile API-kald
- **Aktivér stabile API-kald (genforsøgslogik)**:
  - **Fra (standard)**: Ét enkelt mislykket API-kald stopper den aktuelle opgave.
  - **Til**: Genforsøger automatisk mislykkede LLM API-kald, hvilket er nyttigt ved ustabile netværksforbindelser eller rate limits.
  - **Connection Test Fallback**: Selv når almindelige kald ikke allerede kører i stable mode, skifter forbindelsestest nu til den samme retry-sekvens efter den første midlertidige netværksfejl.
  - **Runtime Transport Fallback (miljøbevidst)**: Langvarige opgaveanmodninger, som midlertidigt afbrydes af `requestUrl`, genforsøges nu først via en miljøbevidst fallback. Desktop-builds bruger Node `http/https`; ikke-desktopmiljøer bruger browser `fetch`. Disse fallback-forsøg bruger nu protocol-aware streaming parsing på tværs af de indbyggede LLM-stier, herunder OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE og Ollama NDJSON, så langsomme gateways kan begynde at returnere body-chunks tidligere. De øvrige direkte OpenAI-lignende indgange genbruger den samme delte fallback-sti.
  - **OpenAI-Compatible Stable Order**: I stable mode følger hvert OpenAI-compatible-forsøg nu `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)`, før forsøget tælles som mislykket. Det reducerer overaggressive fejl, når kun én transporttilstand er ustabil.
- **Retry Interval (seconds)**: Kun synlig, når funktionen er aktiveret. Tiden mellem genforsøg, 1-300 sekunder. Standard: 5.
- **Maximum Retries**: Kun synlig, når funktionen er aktiveret. Maksimalt antal genforsøg, 0-10. Standard: 3.
- **Fejlfindingsfunktion for API-fejl**:
  - **Fra (standard)**: Bruger standardiseret, kortfattet fejlrappportering.
  - **Til**: Aktiverer detaljeret fejllogning, svarende til DeepSeeks udførlige output, for alle udbydere og opgaver, inklusive Translate, Search og Connection Tests. Det omfatter HTTP-statuskoder, rå response text, request transport timelines, sanerede request-URL'er og headers, forløbet tid pr. forsøg, response headers, partial response bodies, parsed partial stream output og stack traces, hvilket er afgørende ved fejlfinding af API-forbindelser og upstream gateway resets.
- **Developer Mode**:
  - **Fra (standard)**: Skjuler alle diagnostiske kontroller, der kun er beregnet til udviklere.
  - **Til**: Viser et dedikeret diagnosepanel til udviklere i Settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Vælg runtime-sti pr. probe. OpenAI-compatible-udbydere understøtter også tvungne tilstande som `direct streaming`, `direct buffered` og `requestUrl-only`, ud over runtime-tilstandene.
  - **Run Diagnostic**: Kører én long-request probe med den valgte call mode og skriver `Notemd_Provider_Diagnostic_*.txt` i roden af vaultet.
  - **Run Stability Test**: Gentager proben et konfigurerbart antal gange, 1-10, med den valgte call mode og gemmer en samlet stabilitetsrapport.
  - **Diagnostic Timeout**: Konfigurerbar timeout pr. kørsel, 15-3600 sekunder.
  - **Why Use It**: Hurtigere end manuel reproduktion, når en udbyder består "Test connection", men fejler ved reelle langvarige opgaver, for eksempel oversættelse via langsomme gateways.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Generelle indstillinger

#### Output for behandlede filer
- **Customize Processed File Save Path**:
  - **Fra (standard)**: Behandlede filer, for eksempel `DinNote_processed.md`, gemmes i *samme mappe* som originalnoten.
  - **Til**: Giver dig mulighed for at angive en tilpasset gemmesti.
- **Processed File Folder Path**: Kun synlig, når ovenstående er aktiveret. Indtast en *relativ sti* i dit vault, for eksempel `Processed Notes` eller `Output/LLM`, hvor behandlede filer skal gemmes. Mapper oprettes automatisk, hvis de ikke findes. **Brug ikke absolutte stier som `C:\...` eller ugyldige tegn.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Fra (standard)**: Filer oprettet af kommandoen "Add Links" bruger standardsuffixet `_processed.md`, for eksempel `DinNote_processed.md`.
  - **Til**: Giver dig mulighed for at tilpasse outputfilnavnet med indstillingen nedenfor.
- **Custom Suffix/Replacement String**: Kun synlig, når ovenstående er aktiveret. Indtast den streng, der skal bruges til outputfilnavnet.
  - Hvis feltet efterlades **tomt**, bliver originalfilen **overskrevet** med det behandlede indhold.
  - Hvis du indtaster en streng, for eksempel `_linked`, føjes den til det oprindelige basisnavn, for eksempel `DinNote_linked.md`. Sørg for, at suffixet ikke indeholder ugyldige filnavnstegn.

- **Remove Code Fences on Add Links**:
  - **Fra (standard)**: Code fences **(\`\\\`\`)** bevares i indholdet, når links tilføjes, og **(\`\\\`markdown)** slettes automatisk.
  - **Til**: Fjerner code fences fra indholdet, før links tilføjes.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Uddata for konceptnoter
- **Customize Concept Note Path**:
  - **Fra (standard)**: Automatisk oprettelse af noter for `[[linked concepts]]` er deaktiveret.
  - **Til**: Giver dig mulighed for at angive en mappe, hvor nye konceptnoter skal oprettes.
- **Concept Note Folder Path**: Kun synlig, når ovenstående er aktiveret. Indtast en *relativ sti* i dit vault, for eksempel `Concepts` eller `Generated/Topics`, hvor nye konceptnoter skal gemmes. Mapper oprettes automatisk, hvis de ikke findes. **Skal udfyldes, hvis tilpasning er aktiveret.** **Brug ikke absolutte stier eller ugyldige tegn.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Uddata for konceptlogfil
- **Generate Concept Log File**:
  - **Fra (standard)**: Der genereres ingen logfil.
  - **Til**: Opretter en logfil, der viser nyoprettede konceptnoter efter behandling. Formatet er:
    ```
    generer xx koncept-md-filer
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Kun synlig, når "Generate Concept Log File" er aktiveret.
  - **Fra (standard)**: Logfilen gemmes i **Concept Note Folder Path**, hvis den er angivet, ellers i roden af vaultet.
  - **Til**: Giver dig mulighed for at angive en tilpasset mappe til logfilen.
- **Concept Log Folder Path**: Kun synlig, når "Customize Log File Save Path" er aktiveret. Indtast en *relativ sti* i dit vault, for eksempel `Logs/Notemd`, hvor logfilen skal gemmes. **Skal udfyldes, hvis tilpasning er aktiveret.**
- **Customize Log File Name**: Kun synlig, når "Generate Concept Log File" er aktiveret.
  - **Fra (standard)**: Logfilen hedder `Generate.log`.
  - **Til**: Giver dig mulighed for at angive et brugerdefineret navn til logfilen.
- **Concept Log File Name**: Kun synlig, når "Customize Log File Name" er aktiveret. Indtast det ønskede filnavn, for eksempel `ConceptCreation.log`. **Skal udfyldes, hvis tilpasning er aktiveret.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Opgaven Udtræk begreber
- **Opret minimale konceptnoter**:
  - **Til (standard)**: Nyoprettede konceptnoter indeholder kun titlen, for eksempel `# Begreb`.
  - **Fra**: Konceptnoter kan indeholde yderligere indhold, som en "Linked From"-backlink, hvis det ikke er deaktiveret af indstillingen nedenfor.
- **Add "Linked From" backlink**:
  - **Fra (standard)**: Tilføjer ikke en backlink til kildedokumentet i konceptnoten under ekstraktion.
  - **Til**: Tilføjer en "Linked From"-sektion med en backlink til kildefilen.

#### Udtræk specifik originaltekst
- **Questions for extraction**: Indtast en liste med spørgsmål, ét pr. linje, som du vil have AI'en til at udtrække ordrette svar på fra dine noter.
- **Translate output to corresponding language**:
  - **Fra (standard)**: Returnerer kun den udtrukne tekst på originalsproget.
  - **Til**: Tilføjer en oversættelse af den udtrukne tekst på det sprog, der er valgt til denne opgave.
- **Merged query mode**:
  - **Fra**: Behandler hvert spørgsmål individuelt, hvilket giver højere præcision men flere API-kald.
  - **Til**: Sender alle spørgsmål i én prompt, hvilket giver hurtigere behandling og færre API-kald.
- **Customise extracted text save path & filename**:
  - **Fra**: Gemmer i samme mappe som originalfilen med suffixet `_Extracted`.
  - **Til**: Giver dig mulighed for at angive en tilpasset outputmappe og et filnavnssuffix.

#### Batchvis Mermaid-rettelse
- **Enable Mermaid Error Detection**:
  - **Fra (standard)**: Fejldetektion springes over efter behandling.
  - **Til**: Scanner behandlede filer for tilbageværende Mermaid-syntaksfejl og genererer en rapport `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Fra**: Filer med fejl bliver liggende.
  - **Til**: Flytter alle filer, som stadig indeholder Mermaid-syntaksfejl efter rettelsesforsøget, til en dedikeret mappe til manuel gennemgang.
- **Mermaid error folder path**: Synlig, hvis ovenstående er aktiveret. Den mappe, som fejlfiler skal flyttes til.

#### Behandlingsparametre
- **Enable Batch Parallelism**:
  - **Fra (standard)**: Batchopgaver, som "Process Folder" eller "Batch Generate from Titles", behandler filer én ad gangen, serielt.
  - **Til**: Giver pluginet mulighed for at behandle flere filer samtidig, hvilket kan gøre store batchjobs markant hurtigere.
- **Batch Concurrency**: Kun synlig, når parallelisme er aktiveret. Angiver det maksimale antal filer, der behandles parallelt. Et højere tal kan være hurtigere, men bruger flere ressourcer og kan ramme API-rate limits. Standard: 1, interval: 1-20.
- **Batch Size**: Kun synlig, når parallelisme er aktiveret. Antallet af filer, der samles i én batch. Standard: 50, interval: 10-200.
- **Delay Between Batches (ms)**: Kun synlig, når parallelisme er aktiveret. Valgfri forsinkelse i millisekunder mellem hver batch for at håndtere API-rate limits. Standard: 1000 ms.
- **API Call Interval (ms)**: Mindste forsinkelse i millisekunder *før og efter* hvert enkelt LLM API-kald. Vigtigt for API'er med lav hastighedsgrænse eller for at undgå 429-fejl. Sæt til 0 for ingen kunstig forsinkelse. Standard: 500 ms.
- **Chunk Word Count**: Maksimalt antal ord pr. chunk, der sendes til LLM'en. Påvirker antallet af API-kald for store filer. Standard: 3000.
- **Enable Duplicate Detection**: Slår den grundlæggende kontrol for dublette ord i behandlet indhold til eller fra, resultater vises i konsollen. Standard: Til.
- **Max Tokens**: Maksimalt antal tokens, som LLM'en må generere pr. svar-chunk. Påvirker omkostning og detaljegrad. Standard: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Oversættelse
- **Default Target Language**: Vælg standardsproget, som dine noter skal oversættes til. Dette kan tilsidesættes i UI'et, når oversættelseskommandoen køres. Standard: English.
- **Customise Translation File Save Path**:
  - **Fra (standard)**: Oversatte filer gemmes i *samme mappe* som originalnoten.
  - **Til**: Giver dig mulighed for at angive en *relativ sti* i dit vault, for eksempel `Translations`, hvor oversatte filer skal gemmes. Mapper oprettes automatisk, hvis de ikke findes.
- **Use custom suffix for translated files**:
  - **Fra (standard)**: Oversatte filer bruger standardsuffixet `_translated.md`, for eksempel `DinNote_translated.md`.
  - **Til**: Giver dig mulighed for at angive et tilpasset suffix.
- **Custom Suffix**: Kun synlig, når ovenstående er aktiveret. Indtast det tilpassede suffix, der skal føjes til oversatte filnavne, for eksempel `_es` eller `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Indholdsgenerering
- **Enable Research in "Generate from Title"**:
  - **Fra (standard)**: "Generate from Title" bruger kun titlen som input.
  - **Til**: Udfører webresearch med den konfigurerede **Web Research Provider** og inkluderer resultaterne som kontekst for LLM'en under titelbaseret generering.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Til (standard)**: Kører automatisk en Mermaid-syntaksrettelse efter Mermaid-relaterede workflows som Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid og Translate.
  - **Fra**: Lader genereret Mermaid-output være urørt, medmindre du kører `Batch Mermaid Fix` manuelt eller tilføjer det til et tilpasset workflow.
- **Output Language**: Vælg det ønskede outputsprog til opgaverne "Generate from Title" og "Batch Generate from Title".
  - **English (standard)**: Prompts behandles og output leveres på engelsk.
  - **Andre sprog**: LLM'en instrueres i at udføre sin ræsonnering på engelsk, men levere den endelige dokumentation på det sprog, du vælger, for eksempel Español, Français, 简体中文, 繁體中文, العربية eller हिन्दी.
- **Change Prompt Word**:
  - **Change Prompt Word**: Giver dig mulighed for at ændre prompt-ordet for en specifik opgave.
  - **Custom Prompt Word**: Indtast dit brugerdefinerede prompt-ord for opgaven.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Fra (standard)**: Filer, der genereres korrekt, flyttes til en undermappe med navnet `[OriginalFolderName]_complete` relativt til originalmappens forælder eller `Vault_complete`, hvis originalmappen var roden.
  - **Til**: Giver dig mulighed for at angive et tilpasset navn til undermappen, hvor færdige filer flyttes.
- **Custom Output Folder Name**: Kun synlig, når ovenstående er aktiveret. Indtast det ønskede navn til undermappen, for eksempel `Generated Content` eller `_complete`. Ugyldige tegn er ikke tilladt. Hvis feltet efterlades tomt, bruges `_complete`. Mappen oprettes relativt til originalmappens overordnede mappe.

#### Workflowknapper med ét klik
- **Visual Workflow Builder**: Opret brugerdefinerede workflow-knapper ud fra indbyggede handlinger uden at skrive DSL manuelt.
- **Custom Workflow Buttons DSL**: Avancerede brugere kan stadig redigere workflow-definitionsteksten direkte. Ugyldig DSL falder sikkert tilbage til standardworkflowet og viser en advarsel i sidepanelet eller indstillings-UI'et.
- **Workflow Error Strategy**:
  - **Stop on Error (standard)**: Stopper workflowet med det samme, når et trin fejler.
  - **Continue on Error**: Fortsætter med senere trin og rapporterer antallet af mislykkede handlinger til sidst.
- **Default Workflow Included**: `One-Click Extract` kæder `Process File (Add Links)`, `Batch Generate from Titles` og `Batch Mermaid Fix`.

#### Indstillinger for brugerdefinerede instruktioner
Denne funktion gør det muligt at tilsidesætte standardinstruktionerne, prompts, som sendes til LLM'en for specifikke opgaver, og giver dig finmasket kontrol over outputtet.

- **Enable Custom Prompts for Specific Tasks**:
  - **Fra (standard)**: Pluginet bruger sine indbyggede standardprompts til alle operationer.
  - **Til**: Aktiverer muligheden for at angive tilpassede prompts til opgaverne nedenfor. Dette er hovedkontakten for funktionen.

- **Use Custom Prompt for [Task Name]**: Kun synlig, når ovenstående er aktiveret.
  - For hver understøttet opgave, som "Add Links", "Generate from Title", "Research & Summarize" og "Extract Concepts", kan du individuelt aktivere eller deaktivere din tilpassede prompt.
  - **Fra**: Den specifikke opgave bruger standardprompten.
  - **Til**: Den specifikke opgave bruger den tekst, du angiver i det tilsvarende "Custom Prompt"-tekstfelt nedenfor.

- **Custom Prompt Text Area**: Kun synlig, når en opgaves tilpassede prompt er aktiveret.
  - **Default Prompt Display**: Pluginet viser standardprompten som reference. Du kan bruge knappen **"Copy Default Prompt"** til at kopiere teksten som udgangspunkt for din egen prompt.
  - **Custom Prompt Input**: Her skriver du dine egne instruktioner til LLM'en.
  - **Placeholders**: Du kan og bør bruge særlige placeholders i prompten, som pluginet erstatter med faktisk indhold, før anmodningen sendes til LLM'en. Se standardprompten for at se, hvilke placeholders der er tilgængelige for hver opgave. Almindelige placeholders omfatter:
    - `{TITLE}`: Titlen på den aktuelle note.
    - `{RESEARCH_CONTEXT_SECTION}`: Indholdet, der er indsamlet fra webresearch.
    - `{USER_PROMPT}`: Indholdet af den note, der behandles.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Omfang for duplikatkontrol
- **Duplicate Check Scope Mode**: Styrer, hvilke filer der sammenlignes med noterne i din **Concept Note Folder** for at finde potentielle dubletter.
  - **Entire Vault (standard)**: Sammenligner konceptnoter med alle andre noter i vaultet undtagen selve Concept Note Folder.
  - **Include Specific Folders Only**: Sammenligner kun konceptnoter med noter i de mapper, der er listet nedenfor.
  - **Exclude Specific Folders**: Sammenligner konceptnoter med alle noter *undtagen* dem i mapperne nedenfor og ekskluderer også Concept Note Folder.
  - **Concept Folder Only**: Sammenligner kun konceptnoter med *andre noter inden for Concept Note Folder*. Det hjælper med at finde dubletter udelukkende blandt dine genererede begreber.
- **Include/Exclude Folders**: Kun synlig, hvis tilstanden er 'Include' eller 'Exclude'. Indtast de *relative stier* til de mapper, du vil inkludere eller ekskludere, **én sti pr. linje**. Stier er store/små bogstavsfølsomme og bruger `/` som separator, for eksempel `Reference Material/Papers` eller `Daily Notes`. Disse mapper kan ikke være identiske med eller ligge inde i Concept Note Folder.

#### Udbyder til webresearch
- **Search Provider**: Vælg mellem `Tavily`, som kræver API-nøgle og anbefales, og `DuckDuckGo`, som er eksperimentel og ofte blokeres af søgemaskinen ved automatiserede forespørgsler. Bruges til "Research & Summarize Topic" og valgfrit til "Generate from Title".
- **Tavily API Key**: Kun synlig, hvis Tavily er valgt. Indtast din API-nøgle fra [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Kun synlig, hvis Tavily er valgt. Maksimalt antal søgeresultater, som Tavily skal returnere, 1-20. Standard: 5.
- **Tavily Search Depth**: Kun synlig, hvis Tavily er valgt. Vælg `basic`, standard, eller `advanced`. Bemærk, at `advanced` giver bedre resultater, men koster 2 API-kreditter pr. søgning i stedet for 1.
- **DuckDuckGo Max Results**: Kun synlig, hvis DuckDuckGo er valgt. Maksimalt antal søgeresultater, der skal parses, 1-10. Standard: 5.
- **DuckDuckGo Content Fetch Timeout**: Kun synlig, hvis DuckDuckGo er valgt. Maksimalt antal sekunder, der ventes ved hentning af indhold fra hver DuckDuckGo-resultat-URL. Standard: 15.
- **Max Research Content Tokens**: Omtrentligt maksimalt antal tokens fra kombinerede webresearchresultater, snippets og hentet indhold, der skal medtages i opsummeringsprompten. Hjælper med at styre context window size og omkostning. Standard: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Fokuseret læringsdomæne
- **Enable Focused Learning Domain**:
  - **Fra (standard)**: Prompts sendt til LLM'en bruger standardinstruktioner til generelle formål.
  - **Til**: Giver dig mulighed for at angive et eller flere fagområder for at forbedre LLM'ens kontekstuelle forståelse.
- **Learning Domain**: Kun synlig, når ovenstående er aktiveret. Indtast dine specifikke fagområder, for eksempel `Materials Science`, `Polymer Physics` eller `Machine Learning`. Det tilføjer linjen "Relevant Fields: [...]" i begyndelsen af prompts og hjælper LLM'en med at generere mere præcise og relevante links og mere relevant indhold for dit studieområde.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Brugervejledning

### Hurtige arbejdsgange og sidepanel

- Åbn Notemd-sidepanelet for at få adgang til grupperede handlingssektioner for kernebehandling, generering, oversættelse, viden og hjælpeværktøjer.
- Brug området **Hurtige arbejdsgange** øverst i sidepanelet til at starte brugerdefinerede knapper med flere trin.
- Standardworkflowet **One-Click Extract** kører `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Workflow-fremdrift, logs pr. trin og fejl vises i sidepanelet med en fastgjort footer, der beskytter progress bar og logområdet mod at blive presset væk af udvidede sektioner.
- Progress-kortet holder statustekst, en dedikeret procentindikator og resterende tid læsbar med et hurtigt blik, og de samme brugerdefinerede workflows kan omkonfigureres fra indstillingerne.

### Oprindelig behandling (tilføjelse af wiki-links)
Dette er kernefunktionen, der fokuserer på at identificere begreber og tilføje `[[wiki-links]]`.

**Vigtigt:** Denne proces virker kun på `.md`- eller `.txt`-filer. Du kan gratis konvertere PDF-filer til MD-filer med [Mineru](https://github.com/opendatalab/MinerU) før videre behandling.

1. **Brug af sidepanelet**:
   - Åbn Notemd Sidebar, via tryllestavsikonet eller command palette.
   - Åbn `.md`- eller `.txt`-filen.
   - Klik på **"Process File (Add Links)"**.
   - For at behandle en mappe: klik på **"Process Folder (Add Links)"**, vælg mappen og klik på "Process".
   - Fremdrift vises i sidepanelet. Du kan annullere opgaven med knappen "Cancel Processing" i sidepanelet.
   - *Bemærkning til mappebehandling:* Filer behandles i baggrunden uden at blive åbnet i editoren.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Brug af Command Palette** (`Ctrl+P` eller `Cmd+P`):
   - **Enkelt fil**: Åbn filen og kør `Notemd: Process Current File`.
   - **Mappe**: Kør `Notemd: Process Folder`, og vælg derefter mappen. Filerne behandles i baggrunden uden at blive åbnet i editoren.
   - En progress modal vises for kommandoer fra command palette, og den indeholder en cancel-knap.
   - *Bemærk:* pluginet fjerner automatisk indledende linjer med `\boxed{` og afsluttende linjer med `}` i det færdigt behandlede indhold, før det gemmes.

### Nye funktioner

1. **Opsummer som Mermaid-diagram**:
   - Åbn den note, du vil opsummere.
   - Kør kommandoen `Notemd: Summarise as Mermaid diagram`, via command palette eller knappen i sidepanelet.
   - Pluginet genererer en ny note med Mermaid-diagrammet.

2. **Translate Note/Selection**:
   - Markér tekst i en note, hvis du kun vil oversætte markeringen, eller kør kommandoen uden markering for at oversætte hele noten.
   - Kør kommandoen `Notemd: Translate Note/Selection`, via command palette eller knappen i sidepanelet.
   - En modal vises, hvor du kan bekræfte eller ændre **Target Language**, som standard hentes fra konfigurationen.
   - Pluginet bruger den konfigurerede **LLM Provider**, i henhold til Multi-Model-indstillingerne, til at udføre oversættelsen.
   - Det oversatte indhold gemmes på den konfigurerede **Translation Save Path** med det korrekte suffix og åbnes i **en ny rude til højre** for originalindholdet for nem sammenligning.
   - Du kan annullere denne opgave via knappen i sidepanelet eller modalens cancel-knap.
3. **Batchoversættelse**:
   - Kør kommandoen `Notemd: Batch Translate Folder` fra command palette og vælg en mappe, eller højreklik på en mappe i filudforskeren og vælg "Batch translate this folder".
   - Pluginet oversætter alle Markdown-filer i den valgte mappe.
   - Oversatte filer gemmes på den konfigurerede oversættelsessti, men åbnes ikke automatisk.
   - Denne proces kan annulleres via progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Markér tekst i en note, eller sørg for, at noten har en titel, som bruges som søgeemne.
   - Kør kommandoen `Notemd: Research and Summarize Topic`, via command palette eller knappen i sidepanelet.
   - Pluginet bruger den konfigurerede **Search Provider**, Tavily eller DuckDuckGo, og den passende **LLM Provider** i henhold til Multi-Model-indstillingerne til at finde og opsummere information.
   - Opsummeringen tilføjes til den aktuelle note.
   - Du kan annullere denne opgave via knappen i sidepanelet eller modalens cancel-knap.
   - *Bemærk:* DuckDuckGo-søgninger kan fejle på grund af bot-detektering. Tavily anbefales.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Åbn en note, den kan være tom.
   - Kør kommandoen `Notemd: Generate Content from Title`, via command palette eller knappen i sidepanelet.
   - Pluginet bruger den passende **LLM Provider**, i henhold til Multi-Model-indstillingerne, til at generere indhold baseret på notens titel og erstatte eventuelt eksisterende indhold.
   - Hvis indstillingen **"Enable Research in 'Generate from Title'"** er aktiveret, udføres der først webresearch med den konfigurerede **Web Research Provider**, og resultaterne medtages som kontekst i prompten til LLM'en.
   - Du kan annullere denne opgave via knappen i sidepanelet eller modalens cancel-knap.

5. **Batch Generate Content from Titles**:
   - Kør kommandoen `Notemd: Batch Generate Content from Titles`, via command palette eller knappen i sidepanelet.
   - Vælg den mappe, der indeholder de noter, du vil behandle.
   - Pluginet gennemgår hver `.md`-fil i mappen, undtagen `_processed.md`-filer og filer i den udpegede "complete"-mappe, og genererer indhold ud fra notens titel og erstatter eksisterende indhold. Filer behandles i baggrunden uden at blive åbnet i editoren.
   - Filer, der behandles korrekt, flyttes til den konfigurerede "complete"-mappe.
   - Kommandoen respekterer indstillingen **"Enable Research in 'Generate from Title'"** for hver behandlet note.
   - Du kan annullere denne opgave via knappen i sidepanelet eller modalens cancel-knap.
   - Fremdrift og resultater, som antal ændrede filer og fejl, vises i sidepanelets eller modalens log.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Sørg for, at **Concept Note Folder Path** er korrekt konfigureret i indstillingerne.
   - Kør `Notemd: Check and Remove Duplicate Concept Notes`, via command palette eller knappen i sidepanelet.
   - Pluginet scanner concept note-mappen og sammenligner filnavne med noter uden for mappen ved hjælp af flere regler, som præcis match, flertalsformer, normalisering og indehold.
   - Hvis der findes potentielle dubletter, vises en modal med filerne, årsagen til markeringen og konfliktfilerne.
   - Gennemgå listen omhyggeligt. Klik på **"Delete Files"** for at flytte de listede filer til systemets papirkurv, eller **"Cancel"** for ikke at gøre noget.
   - Fremdrift og resultater vises i sidepanelets eller modalens log.

7. **Extract Concepts (Pure Mode)**:
   - Denne funktion gør det muligt at udtrække begreber fra et dokument og oprette de tilsvarende konceptnoter *uden* at ændre originalfilen. Den er perfekt til hurtigt at udfylde din vidensbase fra et sæt dokumenter.
   - **Enkelt fil**: Åbn en fil og kør kommandoen `Notemd: Extract concepts (create concept notes only)` fra command palette, eller klik på knappen **"Extract concepts (current file)"** i sidepanelet.
   - **Mappe**: Kør kommandoen `Notemd: Batch extract concepts from folder` fra command palette, eller klik på knappen **"Extract concepts (folder)"** i sidepanelet og vælg derefter en mappe, der skal behandles.
   - Pluginet læser filerne, identificerer begreber og opretter nye noter til dem i din valgte **Concept Note Folder**, mens originalfilerne forbliver urørte.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Denne kraftfulde kommando strømliner processen med at oprette og udfylde nye konceptnoter.
   - Markér et ord eller en sætning i editoren.
   - Kør kommandoen `Notemd: Create Wiki-Link & Generate Note from Selection`, det anbefales at tildele en hotkey, for eksempel `Cmd+Shift+W`.
   - Pluginet vil:
     1. Erstatte den markerede tekst med et `[[wiki-link]]`.
     2. Kontrollere, om en note med den titel allerede findes i din **Concept Note Folder**.
     3. Hvis den findes, tilføjes en backlink til den aktuelle note.
     4. Hvis den ikke findes, oprettes en ny, tom note.
     5. Derefter køres kommandoen **"Generate Content from Title"** automatisk på den nye eller eksisterende note, så den udfyldes med AI-genereret indhold.

9. **Extract Concepts and Generate Titles**:
   - Denne kommando kæder to stærke funktioner sammen i ét strømlinet workflow.
   - Kør kommandoen `Notemd: Extract Concepts and Generate Titles` fra command palette, det anbefales at tildele en hotkey.
   - Pluginet vil:
     1. Først køre opgaven **"Extract concepts (current file)"** på den aktuelt aktive fil.
     2. Derefter automatisk køre opgaven **"Batch generate from titles"** på den mappe, du har konfigureret som **Concept note folder path** i indstillingerne.
   - Det gør det muligt først at udfylde din vidensbase med nye begreber fra et kildedokument og derefter straks uddybe disse nye konceptnoter med AI-genereret indhold i ét samlet trin.

10. **Extract Specific Original Text**:
   - Konfigurer dine spørgsmål i indstillingerne under "Extract Specific Original Text".
   - Brug knappen "Extract Specific Original Text" i sidepanelet til at behandle den aktive fil.
   - **Merged Mode**: Gør behandlingen hurtigere ved at sende alle spørgsmål i én prompt.
   - **Translation**: Oversætter valgfrit den udtrukne tekst til dit konfigurerede sprog.
   - **Custom Output**: Konfigurer hvor og hvordan den udtrukne fil skal gemmes.

11. **Batch Mermaid Fix**:
   - Brug knappen "Batch Mermaid Fix" i sidepanelet til at scanne en mappe og rette almindelige Mermaid-syntaksfejl.
   - Pluginet rapporterer filer, der stadig indeholder fejl, i en fil `mermaid_error_{foldername}.md`.
   - Du kan valgfrit konfigurere pluginet til at flytte disse problematiske filer til en separat mappe til gennemgang.

## Understøttede LLM-udbydere

| Udbyder | Type | API-nøgle kræves | Bemærkninger |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Ja                     | Native DeepSeek-endpoint med håndtering af reasoning-modeller         |
| Qwen               | Cloud   | Ja                     | DashScope compatible-mode preset til Qwen / QwQ-modeller             |
| Qwen Code          | Cloud   | Ja                     | DashScope-preset med fokus på kodemodeller fra Qwen                   |
| Doubao             | Cloud   | Ja                     | Volcengine Ark-preset; model-feltet sættes normalt til dit endpoint-ID |
| Moonshot           | Cloud   | Ja                     | Officielt Kimi / Moonshot-endpoint                                    |
| GLM                | Cloud   | Ja                     | Officielt Zhipu BigModel OpenAI-compatible-endpoint                   |
| Z AI               | Cloud   | Ja                     | Internationalt GLM/Zhipu OpenAI-compatible-endpoint; supplerer `GLM`  |
| MiniMax            | Cloud   | Ja                     | Officielt MiniMax chat-completions-endpoint                           |
| Huawei Cloud MaaS  | Cloud   | Ja                     | Huawei ModelArts MaaS OpenAI-compatible-endpoint til hostede modeller |
| Baidu Qianfan      | Cloud   | Ja                     | Officielt Qianfan OpenAI-compatible-endpoint til ERNIE-modeller       |
| SiliconFlow        | Cloud   | Ja                     | Officielt SiliconFlow OpenAI-compatible-endpoint til hostede OSS-modeller |
| OpenAI             | Cloud   | Ja                     | Understøtter GPT- og o-serie-modeller                                 |
| Anthropic          | Cloud   | Ja                     | Understøtter Claude-modeller                                          |
| Google             | Cloud   | Ja                     | Understøtter Gemini-modeller                                          |
| Mistral            | Cloud   | Ja                     | Understøtter Mistral- og Codestral-familierne                         |
| Azure OpenAI       | Cloud   | Ja                     | Kræver endpoint, API-nøgle, deployment name og API Version            |
| OpenRouter         | Gateway | Ja                     | Giver adgang til mange udbydere via OpenRouter-model-ID'er            |
| xAI                | Cloud   | Ja                     | Native Grok-endpoint                                                  |
| Groq               | Cloud   | Ja                     | Hurtig OpenAI-compatible-inferens til hostede OSS-modeller            |
| Together           | Cloud   | Ja                     | OpenAI-compatible-endpoint til hostede OSS-modeller                   |
| Fireworks          | Cloud   | Ja                     | OpenAI-compatible-inferens-endpoint                                   |
| Requesty           | Gateway | Ja                     | Multi-provider-router bag én API-nøgle                                |
| OpenAI Compatible  | Gateway | Valgfrit               | Generisk preset til LiteLLM, vLLM, Perplexity, Vercel AI Gateway m.m. |
| LMStudio           | Lokal   | Valgfrit (`EMPTY`)     | Kører modeller lokalt via LM Studio-server                            |
| Ollama             | Lokal   | Nej                    | Kører modeller lokalt via Ollama-server                               |

*Bemærk: For lokale udbydere, LMStudio og Ollama, skal du sikre, at den respektive serverapplikation kører og er tilgængelig via den konfigurerede Base URL.*
*Bemærk: For OpenRouter og Requesty skal du bruge det udbyder-præfikserede eller fulde model-ID, som gatewayen viser, for eksempel `google/gemini-flash-1.5` eller `anthropic/claude-3-7-sonnet-latest`.*
*Bemærk: `Doubao` forventer normalt et Ark endpoint- eller deployment-ID i model-feltet frem for et råt model-familienavn. Indstillingsskærmen advarer nu, når placeholder-værdien stadig er til stede, og blokerer connection tests, indtil du erstatter den med et rigtigt endpoint-ID.*
*Bemærk: `Z AI` peger på den internationale `api.z.ai`-linje, mens `GLM` fortsat bruger BigModel-endpointet til Fastlandskina. Vælg den preset, der matcher din kontoregion.*
*Bemærk: Kina-fokuserede presets bruger chat-first-forbindelsestest, så testen validerer den faktisk konfigurerede model eller deployment og ikke kun API-nøglens rækkevidde.*
*Bemærk: `OpenAI Compatible` er beregnet til tilpassede gateways og proxies. Angiv Base URL, API-nøglepolitik og model-ID i henhold til din udbyders dokumentation.*

## Netværksbrug og datahåndtering

Notemd kører lokalt inde i Obsidian, men nogle funktioner sender udgående anmodninger.

### Kald til LLM-udbydere (konfigurerbare)

- Trigger: filbehandling, generering, oversættelse, research-opsummering, Mermaid-opsummering samt forbindelses- og diagnosehandlinger.
- Endpoint: dine konfigurerede udbyder-Base-URL'er i Notemd-indstillingerne.
- Sendte data: prompttekst og opgaveindhold, som kræves til behandlingen.
- Bemærkning om datahåndtering: API-nøgler konfigureres lokalt i pluginindstillingerne og bruges til at signere anmodninger fra din enhed.

### Webresearch-kald (valgfrit)

- Trigger: når webresearch er aktiveret, og en søgeudbyder er valgt.
- Endpoint: Tavily API eller DuckDuckGo-endpoints.
- Sendte data: din research-forespørgsel og påkrævet request-metadata.

### Udviklerdiagnostik og fejlfindingslogge (valgfrit)

- Trigger: API debug mode og diagnostiske handlinger for udviklere.
- Lagring: diagnose- og fejllogs skrives til roden af dit vault, for eksempel `Notemd_Provider_Diagnostic_*.txt` og `Notemd_Error_Log_*.txt`.
- Risikonote: Logs kan indeholde uddrag af requests og responses. Gennemgå logs, før du deler dem offentligt.

### Lokal lagring

- Pluginets konfiguration gemmes i `.obsidian/plugins/notemd/data.json`.
- Genererede filer, rapporter og valgfrie logs gemmes i dit vault i henhold til dine indstillinger.

## Fejlfinding

### Almindelige problemer
- **Pluginet indlæses ikke**: Sørg for, at `manifest.json`, `main.js` og `styles.css` ligger i den korrekte mappe, `<Vault>/.obsidian/plugins/notemd/`, og genstart Obsidian. Kontroller Developer Console, `Ctrl+Shift+I` eller `Cmd+Option+I`, for fejl under opstart.
- **Behandlingsfejl / API-fejl**:
  1. **Kontrollér filformatet**: Sørg for, at filen, du forsøger at behandle eller kontrollere, har endelsen `.md` eller `.txt`. Notemd understøtter i øjeblikket kun disse tekstbaserede formater.
  2. Brug kommandoen eller knappen "Test LLM Connection" til at verificere indstillingerne for den aktive udbyder.
  3. Dobbelttjek API Key, Base URL, Model Name og API Version, for Azure. Sørg for, at API-nøglen er korrekt og har tilstrækkelige kreditter eller rettigheder.
  4. Sørg for, at din lokale LLM-server, LMStudio eller Ollama, kører, og at Base URL er korrekt, for eksempel `http://localhost:1234/v1` for LMStudio.
  5. Kontroller din internetforbindelse for cloududbydere.
  6. **Ved fejl i behandling af enkeltfil:** Gennemgå Developer Console for detaljerede fejlmeddelelser. Kopiér dem med knappen i error modal, hvis det er nødvendigt.
  7. **Ved fejl i batchbehandling:** Tjek filen `error_processing_filename.log` i roden af dit vault for detaljerede fejlmeddelelser for hver mislykket fil. Developer Console eller error modal kan vise et resumé eller en generel batchfejl.
  8. **Automatiske fejllogs:** Hvis en proces fejler, gemmer pluginet automatisk en detaljeret logfil med navnet `Notemd_Error_Log_[Timestamp].txt` i rodmappen på dit vault. Filen indeholder fejlmeddelelse, stack trace og sessionslogs. Hvis du møder vedvarende problemer, bør du kontrollere denne fil. Hvis "API Error Debugging Mode" aktiveres i indstillingerne, udfyldes denne log med endnu mere detaljerede API-responsdata.
  9. **Diagnostik af lange anmodninger mod reelt endpoint (udvikler)**:
     - Indbygget sti, anbefales først: brug **Settings -> Notemd -> Developer provider diagnostic (long request)** til at køre en runtime-probe på den aktive udbyder og generere `Notemd_Provider_Diagnostic_*.txt` i roden af vaultet.
     - CLI-sti, uden for Obsidian runtime: brug følgende for reproducerbar sammenligning på endpoint-niveau mellem buffered og streaming-adfærd:
       ```bash
       npm run diagnose:llm -- \
         --transport openai-compatible \
         --provider-name OpenRouter \
         --base-url https://openrouter.ai/api/v1 \
         --api-key "$OPENROUTER_API_KEY" \
         --model anthropic/claude-3.7-sonnet \
         --prompt-file ./tmp/prompt.txt \
         --content-file ./tmp/content.txt \
         --mode compare \
         --timeout-ms 360000 \
         --output ./tmp/openrouter-diagnostic.txt
       ```
       Den genererede rapport indeholder timing pr. forsøg, `First Byte` og `Duration`, saneret request-metadata, response headers, rå eller delvise body-fragmenter, parsede stream-fragmenter og fejlsteder på transportlaget.
- **Problemer med LM Studio/Ollama-forbindelse**:
  - **Forbindelsestest mislykkes**: Sørg for, at den lokale server, LM Studio eller Ollama, kører, og at den korrekte model er indlæst eller tilgængelig.
  - **CORS-fejl, Ollama på Windows**: Hvis du får CORS-fejl, Cross-Origin Resource Sharing, når du bruger Ollama på Windows, kan det være nødvendigt at sætte miljøvariablen `OLLAMA_ORIGINS`. Det kan du gøre ved at køre `set OLLAMA_ORIGINS=*` i kommandoprompten, før du starter Ollama. Det tillader requests fra alle origins.
  - **Aktivér CORS i LM Studio**: For LM Studio kan du aktivere CORS direkte i serverindstillingerne, hvilket kan være nødvendigt, hvis Obsidian kører i en browser eller har strenge origin policies.
- **Fejl ved oprettelse af mapper ("File name cannot contain...")**:
  - Det betyder normalt, at stien angivet i indstillingerne, **Processed File Folder Path** eller **Concept Note Folder Path**, er ugyldig *for Obsidian*.
  - **Sørg for, at du bruger relative stier**, for eksempel `Processed` eller `Notes/Concepts`, og **ikke absolutte stier**, som `C:\Users\...` eller `/Users/...`.
  - Tjek ugyldige tegn: `* " \ / < > : | ? # ^ [ ]`. Bemærk, at `\` også er ugyldig på Windows i Obsidian-stier. Brug `/` som sti-separator.
- **Ydelsesproblemer**: Behandling af store filer eller mange filer kan tage tid. Reducér indstillingen "Chunk Word Count" for potentielt hurtigere, men flere, API-kald. Prøv en anden LLM-udbyder eller model.
- **Uventet linking**: Kvaliteten af linking afhænger i høj grad af LLM'en og prompten. Eksperimentér med forskellige modeller eller temperature-indstillinger.

## Bidrag

Bidrag er velkomne. Se GitHub-repositoriet for retningslinjer: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumentation for vedligeholdere

- [Releaseworkflow (engelsk)](./docs/maintainer/release-workflow.md)
- [Releaseworkflow (forenklet kinesisk)](./docs/maintainer/release-workflow.zh-CN.md)

## Licens

MIT License - Se filen [LICENSE](LICENSE) for detaljer.

---


*Notemd v1.8.3 - Forbedr din Obsidian-vidensgraf med AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
