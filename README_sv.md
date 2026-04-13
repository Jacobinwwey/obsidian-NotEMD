![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-plugin för Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Läs dokumentation på fler språk: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-driven flerspråkig kunskapsförstärkning
==================================================
```

Ett enkelt sätt att bygga din egen kunskapsbas.

Notemd förbättrar ditt Obsidian-arbetsflöde genom att integrera med olika stora språkmodeller (LLM:er) för att bearbeta dina flerspråkiga anteckningar, automatiskt generera wiki-länkar för viktiga begrepp, skapa motsvarande konceptanteckningar, utföra webbforskning och hjälpa dig att bygga kraftfulla kunskapsgrafer med mera.

**Version:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Innehållsförteckning

- [Snabbstart](#snabbstart)
- [Språkstöd](#språkstöd)
- [Funktioner](#funktioner)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Användarguide](#användarguide)
- [LLM-leverantörer som stöds](#llm-leverantörer-som-stöds)
- [Nätverksanvändning och datahantering](#nätverksanvändning-och-datahantering)
- [Felsökning](#felsökning)
- [Bidra](#bidra)
- [Dokumentation för underhållare](#dokumentation-för-underhållare)
- [Licens](#licens)

## Snabbstart

1. **Installera och aktivera**: Hämta pluginet från Obsidian Marketplace.
2. **Konfigurera LLM**: Gå till `Settings -> Notemd`, välj din LLM-leverantör, till exempel OpenAI eller en lokal leverantör som Ollama, och ange din API-nyckel/URL.
3. **Öppna sidofältet**: Klicka på Notemd-trollspöikonen i vänsterfältet för att öppna sidofältet.
4. **Bearbeta en anteckning**: Öppna valfri anteckning och klicka på **"Process File (Add Links)"** i sidofältet för att automatiskt lägga till `[[wiki-links]]` till viktiga begrepp.
5. **Kör ett snabbt arbetsflöde**: Använd standardknappen **"One-Click Extract"** för att kedja bearbetning, batchgenerering och Mermaid-rensning från en enda ingångspunkt.

Klart. Utforska inställningarna för att låsa upp fler funktioner som webbforskning, översättning och innehållsgenerering.

## Språkstöd

### Avtal för språkbeteende

| Aspekt | Omfattning | Standard | Anmärkningar |
|---|---|---|---|
| `UI Locale` | Endast pluginens UI-text, som inställningar, sidofält, notiser och dialoger | `auto` | Följer Obsidians locale; nuvarande UI-kataloger är `en`, `zh-CN` och `zh-TW`. |
| `Task Output Language` | Uppgiftsutdata genererad av LLM, som länkar, sammanfattningar, generering, extraktion och översättningsmål | `en` | Kan vara global eller per uppgift när `Use different languages for tasks` är aktiverat. |
| `Disable auto translation` | Icke-Translate-uppgifter behåller källspråkets kontext | `false` | Explicita `Translate`-uppgifter tvingar fortfarande det konfigurerade målspråket. |
| Locale-fallback | Upplösning av saknade UI-nycklar | locale -> `en` | Håller UI:t stabilt när vissa nycklar ännu inte är översatta. |

- Officiell dokumentation underhålls på engelska och förenklad kinesiska, med fullt stöd för över 30 språk.
- Alla språk som stöds är länkade i rubriken ovan.
- Ytterligare detaljer och riktlinjer för bidrag spåras i [Language Hub](./docs/i18n/README.md).

## Funktioner

### AI-driven dokumentbearbetning
- **Stöd för Multi-LLM**: Anslut till olika molnbaserade och lokala LLM-leverantörer. Se [LLM-leverantörer som stöds](#llm-leverantörer-som-stöds).
- **Smart chunking**: Delar automatiskt upp stora dokument i hanterbara delar baserat på ordantal.
- **Innehållsbevarande**: Försöker behålla den ursprungliga formateringen medan struktur och länkar läggs till.
- **Framstegsspårning**: Realtidsuppdateringar via Notemd Sidebar eller en progress modal.
- **Avbrytbara operationer**: Varje bearbetningsuppgift som startas från sidofältet kan avbrytas via dess särskilda cancel-knapp. Operationer från command palette använder en modal som också kan avbrytas.
- **Konfiguration med flera modeller**: Använd olika LLM-leverantörer och specifika modeller för olika uppgifter, som Add Links, Research, Generate Title och Translate, eller använd en enda leverantör för allt.
- **Stable API Calls (retry-logik)**: Du kan valfritt aktivera automatiska omförsök för misslyckade LLM API-anrop med konfigurerbart intervall och försöksgränser.
- **Mer robusta leverantörsanslutningstester**: Om det första anslutningstestet misslyckas på grund av en tillfällig nätverksfrånkoppling växlar Notemd automatiskt till den stabila retry-sekvensen innan den markerar testet som misslyckat. Detta täcker OpenAI-compatible, Anthropic, Google, Azure OpenAI och Ollama.
- **Transportfallback beroende på runtime-miljö**: När en lång begäran till en leverantör avbryts av `requestUrl` på grund av tillfälliga nätverksfel som `ERR_CONNECTION_CLOSED`, försöker Notemd nu samma försök igen via en fallback-transport baserad på miljön. Desktop-byggen använder Node `http/https`, medan icke-desktop-miljöer använder browser-`fetch`. Detta minskar falska fel på långsamma gateways och reverse proxies.
- **Förstärkning av kedjan för långa OpenAI-compatible-anrop**: I stabilt läge använder OpenAI-compatible-anrop nu en explicit trefasordning för varje försök: direct streaming transport, direct non-stream transport och därefter `requestUrl` fallback, som fortfarande kan uppgraderas till streamed parsing vid behov. Detta minskar falskt negativa resultat när leverantören faktiskt avslutar buffererade svar men streaming-pipelinen är instabil.
- **Protocol-aware streaming fallback över hela LLM-API-ytan**: Fallback-försök för långa begäranden använder nu protocol-aware streamed parsing över alla inbyggda LLM-vägar, inte bara OpenAI-compatible-endpoints. Notemd hanterar nu OpenAI/Azure SSE, Anthropic Messages streaming, Google Gemini SSE och Ollama NDJSON i både desktop `http/https` och icke-desktop `fetch`, och övriga leverantörsvägar i OpenAI-stil återanvänder samma delade fallback-väg.
- **Förinställningar redo för Kina**: Inbyggda förinställningar täcker nu `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` och `SiliconFlow`, utöver de befintliga globala och lokala leverantörerna.
- **Tillförlitlig batchbearbetning**: Logiken för samtidig bearbetning har förbättrats med **staggered API calls** för att undvika rate limiting och ge stabil prestanda i stora batchjobb. Uppgifter startas nu med olika intervall i stället för alla samtidigt.
- **Noggrann framstegsrapportering**: Ett fel som kunde få progress bar att fastna har åtgärdats, så att UI:t nu alltid speglar operationens verkliga status.
- **Robust parallell batchbearbetning**: Ett problem som gjorde att parallella batchoperationer stannade i förtid har lösts, så att alla filer nu bearbetas pålitligt och effektivt.
- **Precision i progress bar**: Ett fel som gjorde att progress bar för kommandot "Create Wiki-Link & Generate Note" fastnade vid 95 % har åtgärdats och visar nu korrekt 100 % vid slutförande.
- **Förbättrad API-debugging**: "API Error Debugging Mode" fångar nu full response body från LLM-leverantörer och söktjänster, som Tavily och DuckDuckGo, och loggar också en transporttidslinje per försök med sanerade request-URL:er, tidsåtgång, response headers, partial response body, parsed partial stream output och stack traces för att förenkla felsökning på vägarna OpenAI-compatible, Anthropic, Google, Azure OpenAI och Ollama fallback.
- **Panel för Developer Mode**: Inställningarna innehåller nu en särskild diagnostikpanel för utvecklare som förblir dold tills "Developer mode" aktiveras. Den stöder val av diagnostic call path och körning av upprepade stabilitetsprober för valt läge.
- **Omdesignat sidofält**: Inbyggda åtgärder är grupperade i mer fokuserade sektioner med tydligare etiketter, live-status, avbrytbar framdrift och kopierbara loggar för att minska röran i sidofältet. Footer för progress och logg förblir nu synlig även när alla sektioner expanderas, och ready state använder ett tydligare standby-spår.
- **Förfinad interaktion och läsbarhet i sidofältet**: Sidofältets knappar ger nu tydligare återkoppling vid hover, press och focus, och färgstarka CTA-knappar, inklusive `One-Click Extract` och `Batch generate from titles`, har starkare textkontrast för bättre läsbarhet över olika teman.
- **Single-file CTA mapping**: Färgstark CTA-styling är nu reserverad för single-file-åtgärder. Batch- eller mappnivååtgärder och blandade arbetsflöden använder non-CTA-stil för att minska felklick kring åtgärdens räckvidd.
- **Custom one-click workflows**: Förvandla sidofältets inbyggda verktyg till återanvändbara knappar med egna namn och sammansatta åtgärdskedjor. Ett standardarbetsflöde `One-Click Extract` ingår direkt.

### Förbättring av kunskapsgraf
- **Automatisk wiki-linking**: Identifierar kärnbegrepp och lägger till `[[wiki-links]]` i bearbetade anteckningar baserat på LLM-utdata.
- **Skapande av konceptanteckningar som är valfritt och anpassningsbart**: Skapar automatiskt nya anteckningar för upptäckta begrepp i en angiven mapp i ditt vault.
- **Anpassningsbara utmatningsvägar**: Konfigurera separata relativa vägar i ditt vault för att spara processed files och nyss skapade konceptanteckningar.
- **Anpassningsbara utfilnamn (Add Links)**: Du kan välja att **skriva över originalfilen** eller använda en anpassad suffix eller ersättningssträng i stället för standard `_processed.md` när filer bearbetas för att lägga till länkar.
- **Bibehållen länkintegritet**: Grundläggande hantering finns för att uppdatera länkar när anteckningar byter namn eller tas bort i vaultet.
- **Ren begreppsextraktion**: Extrahera begrepp och skapa motsvarande konceptanteckningar utan att ändra originaldokumentet. Detta passar bra för att fylla en kunskapsbas från befintliga dokument utan att röra källfilerna. Funktionen har konfigurerbara alternativ för minimala konceptanteckningar och backlinks.

### Översättning

- **AI-driven översättning**:
  - Översätter anteckningsinnehåll med den konfigurerade LLM:en.
  - **Stöd för stora filer**: Stora filer delas automatiskt upp i mindre chunkar baserat på inställningen `Chunk word count` innan de skickas till LLM:en, och de översatta delarna sätts sedan ihop sömlöst till ett dokument.
  - Stöder översättning mellan många språk.
  - Målspråk kan anpassas via inställningar eller UI.
  - Den översatta texten kan automatiskt öppnas i panelen till höger om originaltexten för enkel jämförelse.
- **Batch-översättning**:
  - Översätter alla filer i en vald mapp.
  - Stöder parallell bearbetning om "Enable Batch Parallelism" är aktiverat.
  - Använder custom prompts för översättning om det är konfigurerat.
  - Lägger till alternativet "Batch translate this folder" i filutforskarens snabbmeny.
- **Disable auto translation**: Om detta aktiveras tvingar icke-Translate-uppgifter inte längre utdata till ett visst språk, så att den ursprungliga språkkontexten bevaras. Den explicita uppgiften `Translate` översätter fortfarande enligt konfigurationen.

### Webbforskning och innehållsgenerering
- **Webbforskning och sammanfattning**:
  - Kör webbsökningar med Tavily, som kräver API-nyckel, eller DuckDuckGo, som är experimentellt.
  - **Förbättrad sökrobusthet**: DuckDuckGo-sökning använder nu förbättrad parsinglogik, med DOMParser och Regex-fallback, för att hantera layoutförändringar och ge mer tillförlitliga resultat.
  - Sammanfattar sökresultat med den konfigurerade LLM:en.
  - Sammanfattningens utmatningsspråk kan anpassas i inställningarna.
  - Lägger till sammanfattningar i den aktuella anteckningen.
  - Har en konfigurerbar token-gräns för forskningsinnehåll som skickas till LLM:en.
- **Innehållsgenerering från titel**:
  - Använder anteckningens titel för att generera initialt innehåll via LLM och ersätter eventuellt befintligt innehåll.
  - **Valfri forskning**: Du kan konfigurera om webbforskning ska köras först med den valda leverantören för att ge ytterligare kontext vid genereringen.
- **Batchgenerering av innehåll från titlar**: Genererar innehåll för alla anteckningar i en vald mapp baserat på deras titlar, med respekt för den valfria forskningsinställningen. Filer som bearbetas framgångsrikt flyttas till en **konfigurerbar "complete"-undermapp**, till exempel `[foldername]_complete` eller ett eget namn, för att undvika återbearbetning.
- **Koppling till Mermaid auto-fix**: När Mermaid auto-fix är aktiverat reparerar Mermaid-relaterade arbetsflöden automatiskt genererade filer eller utmatningsmappar efter bearbetning. Detta omfattar Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid och Translate.

### Hjälpfunktioner
- **Summarise as Mermaid diagram**:
  - Denna funktion låter dig sammanfatta innehållet i en anteckning som ett Mermaid-diagram.
  - Utmatningsspråket för Mermaid-diagrammet kan anpassas i inställningarna.
  - **Mermaid Output Folder**: Konfigurera mappen där genererade Mermaid-diagramfiler ska sparas.
  - **Translate Summarize to Mermaid Output**: Översätt valfritt innehållet i det genererade Mermaid-diagrammet till det konfigurerade målspråket.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Enkel korrigering av formelformat**:
  - Åtgärdar snabbt matematiska formler på en rad, avgränsade av enkla `$`, till standardblock med dubbla `$$`.
  - **En fil**: Bearbeta den aktuella filen via knappen i sidofältet eller command palette.
  - **Batchfix**: Bearbeta alla filer i en vald mapp via knappen i sidofältet eller command palette.

- **Check for Duplicates in Current File**: Det här kommandot hjälper dig att identifiera potentiella dubbletter av termer i den aktiva filen.
- **Duplicate Detection**: Grundläggande kontroll av dubbla ord i innehållet i den aktuellt bearbetade filen (resultat loggas i konsolen).
- **Check and Remove Duplicate Concept Notes**: Identifierar potentiella dubblettanteckningar i den konfigurerade **Concept Note Folder** baserat på exakta namnträffar, pluralformer, normalisering och innehåll av enstaka ord jämfört med anteckningar utanför mappen. Jämförelsens omfattning kan konfigureras till **hela vaultet**, **specifika inkluderade mappar** eller **alla mappar utom specifika undantag**. Visar en detaljerad lista med orsaker och konfliktfiler och ber sedan om bekräftelse innan identifierade dubbletter flyttas till systemets papperskorg. Visar framsteg under borttagningen.
- **Batch Mermaid Fix**: Tillämpar korrigeringar av Mermaid- och LaTeX-syntax på alla Markdown-filer i en användarvald mapp.
  - **Redo för arbetsflöden**: Kan användas som ett fristående verktyg eller som ett steg i en anpassad one-click workflow-knapp.
  - **Felrapportering**: Skapar en rapport `mermaid_error_{foldername}.md` med filer som fortfarande innehåller potentiella Mermaid-fel efter bearbetning.
  - **Flytta felfiler**: Flyttar valfritt filer med upptäckta fel till en angiven mapp för manuell granskning.
  - **Smart detektering**: Kontrollerar nu intelligent filer efter syntaxfel med `mermaid.parse` innan den försöker fixa dem, vilket sparar tid och undviker onödiga ändringar.
  - **Säker bearbetning**: Ser till att syntaxfixar endast tillämpas på Mermaid-kodblock, så att Markdown-tabeller eller annat innehåll inte ändras av misstag. Innehåller robusta skydd för att bevara tabellsyntax som `| :--- |` från aggressiva debug-fixar.
  - **Deep Debug Mode**: Om fel kvarstår efter den första fixen triggas ett avancerat deep debug-läge. Detta läge hanterar komplexa edge cases, inklusive:
    - **Comment Integration**: Slår automatiskt ihop efterföljande kommentarer (som börjar med `%`) med etiketten på kanten, till exempel `A -- Label --> B; % Comment` blir `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Fixar pilar som råkat hamna inne i citationstecken, till exempel `A -- "Label -->" B` blir `A -- "Label" --> B`.
    - **Inline Subgraphs**: Omvandlar inline-subgraph-etiketter till edge labels.
    - **Reverse Arrow Fix**: Rättar icke-standardiserade `X <-- Y`-pilar till `Y --> X`.
    - **Direction Keyword Fix**: Säkerställer att nyckelordet `direction` är gemener inuti subgraphs, till exempel `Direction TB` -> `direction TB`.
    - **Comment Conversion**: Omvandlar `//`-kommentarer till edge labels, till exempel `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Förenklar upprepade etiketter inom hakparenteser, till exempel `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Omvandlar ogiltig pilsyntax `--|>` till standard `-->`.
    - **Robust hantering av labels och notes**: Förbättrad hantering av etiketter med specialtecken, som `/`, och bättre stöd för anpassad note-syntax (`note for ...`), samtidigt som artefakter som efterföljande `]` tas bort rent.
    - **Advanced Fix Mode**: Innehåller robusta fixar för okvoterade nodetiketter med mellanslag, specialtecken eller nästlade hakparenteser, till exempel `Node[Label [Text]]` -> `Node["Label [Text]"]`, för kompatibilitet med komplexa diagram som Stellar Evolution-vägar. Rättar också felaktiga edge labels, som `--["Label["-->` till `-- "Label" -->`. Dessutom omvandlas inline comments, till exempel `Consensus --> Adaptive; # Some advanced consensus`, till `Consensus -- "Some advanced consensus" --> Adaptive`, och ofullständiga citationstecken vid radslut fixas genom att `;"` i slutet ersätts med `"]`.
    - **Note Conversion**: Omvandlar automatiskt `note right/left of` och fristående `note :`-kommentarer till standardiserade Mermaid-noder och kopplingar, till exempel `note right of A: text` blir `NoteA["Note: text"]` länkat till `A`, för att undvika syntaxfel och förbättra layouten. Stöder nu både pillänkar (`-->`) och heldragna länkar (`---`).
    - **Extended Note Support**: Omvandlar automatiskt `note for Node "Content"` och `note of Node "Content"` till standardiserade länkade note-noder, till exempel `NoteNode[" Content"]` kopplat till `Node`, för kompatibilitet med användarutökad syntax.
    - **Enhanced Note Correction**: Döp automatiskt om notes med sekventiell numrering, till exempel `Note1`, `Note2`, för att undvika aliasproblem när flera notes finns.
    - **Parallelogram/Shape Fix**: Rättar felaktiga nodformer som `[/["Label["/]` till standardformen `["Label"]`, vilket säkerställer kompatibilitet med genererat innehåll.
    - **Standardize Pipe Labels**: Fixar och standardiserar automatiskt edge labels som innehåller pipes, så att de citeras korrekt, till exempel `-->|Text|` blir `-->|"Text"|` och `-->|Math|^2|` blir `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Rättar felplacerade edge labels som kommer före pilen, till exempel `>|"Label"| A --> B` blir `A -->|"Label"| B`.
    - **Merge Double Labels**: Identifierar och slår ihop komplexa dubbla etiketter på en enda edge, till exempel `A -- Label1 -- Label2 --> B` eller `A -- Label1 -- Label2 --- B`, till en enda ren etikett med radbrytningar: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Citerar automatiskt nodetiketter som innehåller potentiellt problematiska tecken, som citationstecken, likhetstecken eller matematiska operatorer, men saknar yttre citationstecken, till exempel `Plot[Plot "A"]` blir `Plot["Plot "A""]`, för att undvika renderingsfel.
    - **Intermediate Node Fix**: Delar upp kanter som innehåller en mellanliggande noddefinition i två separata kanter, till exempel `A -- B[...] --> C` blir `A --> B[...]` och `B[...] --> C`, vilket ger giltig Mermaid-syntax.
    - **Concatenated Label Fix**: Fixar robust noddefinitioner där ID:t sammanfogats med etiketten, till exempel `SubdivideSubdivide...` blir `Subdivide["Subdivide..."]`, även när den föregås av pipe labels eller när dupliceringen inte är exakt, genom att validera mot kända node-ID:n.
    - **Extract Specific Original Text**:
      - Definiera en lista med frågor i inställningarna.
      - Extraherar ordagranna textsegment från den aktiva anteckningen som besvarar dessa frågor.
      - **Merged Query Mode**: Alternativ för att behandla alla frågor i ett enda API-anrop för bättre effektivitet.
      - **Translation**: Alternativ för att inkludera översättningar av den extraherade texten i utdata.
      - **Custom Output**: Konfigurerbar sparväg och filnamnssuffix för den extraherade textfilen.
- **LLM Connection Test**: Verifiera API-inställningarna för den aktiva leverantören.

## Installation

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Från Obsidian Marketplace (rekommenderas)
1. Öppna Obsidian **Settings** -> **Community plugins**.
2. Kontrollera att "Restricted mode" är **av**.
3. Klicka på **Browse** community plugins och sök efter "Notemd".
4. Klicka på **Install**.
5. När installationen är klar klickar du på **Enable**.

### Manuell installation
1. Hämta de senaste releasetillgångarna från [GitHub Releases-sidan](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Varje release innehåller också `README.md` som referens i paketet, men för manuell installation behövs endast `main.js`, `styles.css` och `manifest.json`.
2. Navigera till konfigurationsmappen för ditt Obsidian-vault: `<YourVault>/.obsidian/plugins/`.
3. Skapa en ny mapp med namnet `notemd`.
4. Kopiera `main.js`, `styles.css` och `manifest.json` till mappen `notemd`.
5. Starta om Obsidian.
6. Gå till **Settings** -> **Community plugins** och aktivera "Notemd".

## Konfiguration

Kom åt plugininställningarna via:
**Settings** -> **Community Plugins** -> **Notemd** (klicka på kugghjulsikonen).

### LLM-leverantörskonfiguration
1. **Active Provider**: Välj den LLM-leverantör du vill använda i rullgardinsmenyn.
2. **Provider Settings**: Konfigurera de specifika inställningarna för den valda leverantören:
   - **API Key**: Krävs för de flesta molnleverantörer, till exempel OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks och Requesty. Behövs inte för Ollama. Valfri för LM Studio och den generiska förinställningen `OpenAI Compatible` när din endpoint accepterar anonym eller placeholder-baserad åtkomst.
   - **Base URL / Endpoint**: API-endpointen för tjänsten. Standardvärden tillhandahålls, men du kan behöva ändra detta för lokala modeller som LMStudio och Ollama, gateways som OpenRouter, Requesty och OpenAI Compatible, eller specifika Azure-deployments. **Krävs för Azure OpenAI.**
   - **Model**: Det specifika modellnamn eller modell-ID som ska användas, till exempel `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` eller `anthropic/claude-3-7-sonnet-latest`. Säkerställ att modellen finns tillgänglig hos din endpoint eller leverantör.
   - **Temperature**: Styr slumpmässigheten i LLM:ens utdata (0 = deterministiskt, 1 = maximal kreativitet). Lägre värden, till exempel 0.2-0.5, är vanligtvis bättre för strukturerade uppgifter.
   - **API Version (endast Azure)**: Krävs för Azure OpenAI-deployments, till exempel `2024-02-15-preview`.
3. **Test Connection**: Använd knappen "Test Connection" för den aktiva leverantören för att verifiera dina inställningar. OpenAI-compatible-leverantörer använder nu leverantörsmedvetna kontroller: endpoints som `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` och `OpenAI Compatible` testar `chat/completions` direkt, medan leverantörer med ett pålitligt `/models`-endpoint fortfarande kan använda modelluppräkning först. Om den första testen misslyckas på grund av en tillfällig nätverksfrånkoppling som `ERR_CONNECTION_CLOSED` faller Notemd automatiskt tillbaka till den stabila retry-sekvensen i stället för att misslyckas direkt.
4. **Manage Provider Configurations**: Använd knapparna "Export Providers" och "Import Providers" för att spara och läsa in dina LLM-leverantörsinställningar till eller från en fil `notemd-providers.json` i pluginets konfigurationskatalog. Detta gör det enkelt att säkerhetskopiera och dela.
5. **Preset Coverage**: Utöver de ursprungliga leverantörerna innehåller Notemd nu förinställda poster för `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` och ett generiskt mål `OpenAI Compatible` för LiteLLM, vLLM, Perplexity, Vercel AI Gateway eller anpassade proxies.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-model-konfiguration
- **Use Different Providers for Tasks**:
  - **Av (standard)**: Använder den enda "Active Provider" som valts ovan för alla uppgifter.
  - **På**: Låter dig välja en specifik leverantör och valfritt skriva över modellnamnet för varje uppgift, som "Add Links", "Research & Summarize", "Generate from Title", "Translate" och "Extract Concepts". Om modellöverskrivningen lämnas tom används standardmodellen som är konfigurerad för den leverantör som valts för uppgiften.
- **Select different languages for different tasks**:
  - **Av (standard)**: Använder samma "Output language" för alla uppgifter.
  - **På**: Låter dig välja ett specifikt språk för varje uppgift, till exempel "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" och "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Språkarkitektur (UI Locale vs Task Output Language)

- **UI Locale** styr endast text i pluginets gränssnitt, som inställningsetiketter, sidofältsknappar, notiser och dialoger. Standardläget `auto` följer Obsidians aktuella UI-språk.
- **Task Output Language** styr modellgenererad utdata för uppgifter, som länkar, sammanfattningar, titelgenerering, Mermaid-sammanfattning, begreppsextraktion och översättningsmål.
- **Per-task language mode** låter varje uppgift lösa sitt eget utmatningsspråk från ett enhetligt policy-lager i stället för utspridda överskrivningar per modul.
- **Disable auto translation** gör att icke-Translate-uppgifter behåller källspråkets kontext, medan explicita Translate-uppgifter fortfarande tvingar det konfigurerade målspråket.
- Mermaid-relaterade genereringsvägar följer samma språkpolicy och kan fortfarande trigga Mermaid auto-fix när det är aktiverat.

### Stable API Call Settings
- **Enable Stable API Calls (Retry Logic)**:
  - **Av (standard)**: Ett enda misslyckat API-anrop stoppar den aktuella uppgiften.
  - **På**: Försöker automatiskt igen vid misslyckade LLM API-anrop, vilket är användbart vid intermittenta nätverksproblem eller rate limits.
  - **Connection Test Fallback**: Även när vanliga anrop inte redan körs i stable-läge växlar leverantörens anslutningstester nu till samma retry-sekvens efter det första tillfälliga nätverksfelet.
  - **Runtime Transport Fallback (miljömedveten)**: Långkörande begäranden som tillfälligt tappas av `requestUrl` försöker nu samma försök igen genom en miljömedveten fallback först. Desktop-byggen använder Node `http/https`; icke-desktop-miljöer använder browser `fetch`. Dessa fallback-försök använder nu protocol-aware streamed parsing över de inbyggda LLM-vägarna, inklusive OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE och Ollama NDJSON, så att långsamma gateways kan börja leverera body-chunkar tidigare. Övriga direkta leverantörsvägar i OpenAI-stil återanvänder samma delade fallback.
  - **OpenAI-Compatible Stable Order**: I stable-läge följer varje OpenAI-compatible-försök nu `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` innan försöket räknas som misslyckat. Detta motverkar alltför aggressiva fel när endast ett transportläge är opålitligt.
- **Retry Interval (seconds)**: Synligt endast när funktionen är aktiverad. Tiden att vänta mellan försök, 1-300 sekunder. Standard: 5.
- **Maximum Retries**: Synligt endast när funktionen är aktiverad. Maximalt antal omförsök, 0-10. Standard: 3.
- **API Error Debugging Mode**:
  - **Av (standard)**: Använder kortfattad standardrapportering av fel.
  - **På**: Aktiverar detaljerad felloggning, liknande DeepSeeks utförliga utdata, för alla leverantörer och uppgifter, inklusive Translate, Search och Connection Tests. Detta omfattar HTTP-statuskoder, rå response text, request transport timelines, sanerade request-URL:er och headers, förfluten tid per försök, response headers, partial response bodies, parsed partial stream output och stack traces, vilket är avgörande vid felsökning av API-anslutningar och upstream gateway resets.
- **Developer Mode**:
  - **Av (standard)**: Döljer alla diagnostiska kontroller som endast är avsedda för utvecklare.
  - **På**: Visar en särskild diagnostikpanel för utvecklare i Settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Välj runtime-väg per probe. OpenAI-compatible-leverantörer stöder också forcerade lägen som `direct streaming`, `direct buffered` och `requestUrl-only`, utöver runtime-lägena.
  - **Run Diagnostic**: Kör en long-request probe med det valda call mode och skriver `Notemd_Provider_Diagnostic_*.txt` i vaultets rot.
  - **Run Stability Test**: Upprepar proben ett konfigurerbart antal gånger, 1-10, med valt call mode och sparar en sammanställd stabilitetsrapport.
  - **Diagnostic Timeout**: Konfigurerbar timeout per körning, 15-3600 sekunder.
  - **Why Use It**: Snabbare än manuell reproduktion när en leverantör klarar "Test connection" men misslyckas på verkliga långkörande uppgifter, till exempel översättning via långsamma gateways.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Allmänna inställningar

#### Utdata för bearbetade filer
- **Customize Processed File Save Path**:
  - **Av (standard)**: Bearbetade filer, till exempel `DinAnteckning_processed.md`, sparas i *samma mapp* som originalanteckningen.
  - **På**: Låter dig ange en anpassad sparplats.
- **Processed File Folder Path**: Synligt endast när ovanstående är aktiverat. Ange en *relativ sökväg* i ditt vault, till exempel `Processed Notes` eller `Output/LLM`, där bearbetade filer ska sparas. Mappar skapas om de inte redan finns. **Använd inte absoluta sökvägar som `C:\...` eller ogiltiga tecken.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Av (standard)**: Filer som skapas av kommandot "Add Links" använder standardsuffixet `_processed.md`, till exempel `DinAnteckning_processed.md`.
  - **På**: Låter dig anpassa utfilnamnet med inställningen nedan.
- **Custom Suffix/Replacement String**: Synligt endast när ovanstående är aktiverat. Ange strängen som ska användas för utfilnamnet.
  - Om den lämnas **tom** kommer originalfilen att **skrivas över** med det bearbetade innehållet.
  - Om du anger en sträng, till exempel `_linked`, läggs den till efter originalets basnamn, till exempel `DinAnteckning_linked.md`. Säkerställ att suffixet inte innehåller ogiltiga filnamnstecken.

- **Remove Code Fences on Add Links**:
  - **Av (standard)**: Code fences **(\`\\\`\`)** behålls i innehållet när länkar läggs till, och **(\`\\\`markdown)** tas bort automatiskt.
  - **På**: Tar bort code fences från innehållet innan länkar läggs till.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Utdata för konceptanteckningar
- **Customize Concept Note Path**:
  - **Av (standard)**: Automatisk skapelse av anteckningar för `[[linked concepts]]` är avstängd.
  - **På**: Låter dig ange en mapp där nya konceptanteckningar ska skapas.
- **Concept Note Folder Path**: Synligt endast när ovanstående är aktiverat. Ange en *relativ sökväg* i ditt vault, till exempel `Concepts` eller `Generated/Topics`, där nya konceptanteckningar ska sparas. Mappar skapas om de inte finns. **Måste fyllas i om anpassning är aktiverad.** **Använd inte absoluta sökvägar eller ogiltiga tecken.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Utdata för concept log file
- **Generate Concept Log File**:
  - **Av (standard)**: Ingen loggfil genereras.
  - **På**: Skapar en loggfil som listar nyss skapade konceptanteckningar efter bearbetning. Formatet är:
    ```
    generate xx concepts md file
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Synligt endast när "Generate Concept Log File" är aktiverat.
  - **Av (standard)**: Loggfilen sparas i **Concept Note Folder Path** om den är angiven, annars i vaultets rot.
  - **På**: Låter dig ange en anpassad mapp för loggfilen.
- **Concept Log Folder Path**: Synligt endast när "Customize Log File Save Path" är aktiverat. Ange en *relativ sökväg* i ditt vault, till exempel `Logs/Notemd`, där loggfilen ska sparas. **Måste fyllas i om anpassning är aktiverad.**
- **Customize Log File Name**: Synligt endast när "Generate Concept Log File" är aktiverat.
  - **Av (standard)**: Loggfilen heter `Generate.log`.
  - **På**: Låter dig ange ett anpassat namn för loggfilen.
- **Concept Log File Name**: Synligt endast när "Customize Log File Name" är aktiverat. Ange önskat filnamn, till exempel `ConceptCreation.log`. **Måste fyllas i om anpassning är aktiverad.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Extract Concepts Task
- **Create minimal concept notes**:
  - **På (standard)**: Nyss skapade konceptanteckningar innehåller endast titeln, till exempel `# Begrepp`.
  - **Av**: Konceptanteckningar kan inkludera ytterligare innehåll, som en backlink "Linked From", om inte det inaktiveras av inställningen nedan.
- **Add "Linked From" backlink**:
  - **Av (standard)**: Lägger inte till en backlink till källdokumentet i konceptanteckningen under extraktion.
  - **På**: Lägger till en sektion "Linked From" med en backlink till källfilen.

#### Extract Specific Original Text
- **Questions for extraction**: Ange en lista med frågor, en per rad, som du vill att AI:n ska extrahera ordagranna svar på från dina anteckningar.
- **Translate output to corresponding language**:
  - **Av (standard)**: Returnerar endast den extraherade texten på originalspråket.
  - **På**: Lägger till en översättning av den extraherade texten på det språk som valts för denna uppgift.
- **Merged query mode**:
  - **Av**: Bearbetar varje fråga individuellt, vilket ger högre precision men fler API-anrop.
  - **På**: Skickar alla frågor i en enda prompt, vilket ger snabbare behandling och färre API-anrop.
- **Customise extracted text save path & filename**:
  - **Av**: Sparar i samma mapp som originalfilen med suffixet `_Extracted`.
  - **På**: Låter dig ange en anpassad utmatningsmapp och ett filnamnssuffix.

#### Batch Mermaid Fix
- **Enable Mermaid Error Detection**:
  - **Av (standard)**: Feldetektering hoppas över efter bearbetning.
  - **På**: Skannar bearbetade filer efter kvarvarande Mermaid-syntaxfel och genererar en rapport `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Av**: Filer med fel lämnas kvar på sin plats.
  - **På**: Flyttar alla filer som fortfarande innehåller Mermaid-syntaxfel efter fixförsöket till en särskild mapp för manuell granskning.
- **Mermaid error folder path**: Synligt om ovanstående är aktiverat. Mappen dit felfiler ska flyttas.

#### Bearbetningsparametrar
- **Enable Batch Parallelism**:
  - **Av (standard)**: Batchuppgifter, som "Process Folder" eller "Batch Generate from Titles", behandlar filer en i taget, seriellt.
  - **På**: Låter pluginet bearbeta flera filer samtidigt, vilket kan snabba upp stora batchjobb avsevärt.
- **Batch Concurrency**: Synligt endast när parallellism är aktiverad. Anger det maximala antalet filer som ska behandlas parallellt. Ett högre tal kan vara snabbare men använder mer resurser och kan slå i API-rate limits. Standard: 1, intervall: 1-20.
- **Batch Size**: Synligt endast när parallellism är aktiverad. Antalet filer som ska grupperas i en enda batch. Standard: 50, intervall: 10-200.
- **Delay Between Batches (ms)**: Synligt endast när parallellism är aktiverad. Valfri fördröjning i millisekunder mellan batcher för att hantera API-rate limits. Standard: 1000 ms.
- **API Call Interval (ms)**: Minsta fördröjning i millisekunder *före och efter* varje enskilt LLM API-anrop. Viktigt för API:er med låg hastighetsgräns eller för att undvika 429-fel. Ange 0 för ingen artificiell fördröjning. Standard: 500 ms.
- **Chunk Word Count**: Maximalt antal ord per chunk som skickas till LLM:en. Påverkar antalet API-anrop för stora filer. Standard: 3000.
- **Enable Duplicate Detection**: Växlar den grundläggande kontrollen av dubbla ord i bearbetat innehåll, där resultat visas i konsolen. Standard: På.
- **Max Tokens**: Maximalt antal tokens som LLM:en ska generera per svarschunk. Påverkar kostnad och detaljnivå. Standard: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Översättning
- **Default Target Language**: Välj standardspråket du vill översätta dina anteckningar till. Detta kan åsidosättas i UI:t när översättningskommandot körs. Standard: English.
- **Customise Translation File Save Path**:
  - **Av (standard)**: Översatta filer sparas i *samma mapp* som originalanteckningen.
  - **På**: Låter dig ange en *relativ sökväg* i ditt vault, till exempel `Translations`, där översatta filer ska sparas. Mappar skapas om de inte redan finns.
- **Use custom suffix for translated files**:
  - **Av (standard)**: Översatta filer använder standardsuffixet `_translated.md`, till exempel `DinAnteckning_translated.md`.
  - **På**: Låter dig ange ett anpassat suffix.
- **Custom Suffix**: Synligt endast när ovanstående är aktiverat. Ange det anpassade suffix som ska läggas till översatta filnamn, till exempel `_es` eller `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Innehållsgenerering
- **Enable Research in "Generate from Title"**:
  - **Av (standard)**: "Generate from Title" använder endast titeln som indata.
  - **På**: Utför webbforskning med den konfigurerade **Web Research Provider** och inkluderar resultatet som kontext för LLM:en när innehåll genereras från titeln.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **På (standard)**: Kör automatiskt en syntaxfix för Mermaid efter Mermaid-relaterade arbetsflöden som Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid och Translate.
  - **Av**: Lämnar genererad Mermaid-utdata orörd om du inte kör `Batch Mermaid Fix` manuellt eller lägger till den i ett anpassat arbetsflöde.
- **Output Language**: Välj önskat utmatningsspråk för uppgifterna "Generate from Title" och "Batch Generate from Title".
  - **English (standard)**: Prompts bearbetas och utdata skrivs på engelska.
  - **Andra språk**: LLM:en instrueras att resonera på engelska men leverera den slutliga dokumentationen på det språk du väljer, till exempel Español, Français, 简体中文, 繁體中文, العربية eller हिन्दी.
- **Change Prompt Word**:
  - **Change Prompt Word**: Låter dig ändra promptordet för en specifik uppgift.
  - **Custom Prompt Word**: Ange ditt anpassade promptord för uppgiften.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Av (standard)**: Filer som genereras framgångsrikt flyttas till en undermapp med namnet `[OriginalFolderName]_complete` relativt originalmappens förälder, eller `Vault_complete` om originalmappen låg i roten.
  - **På**: Låter dig ange ett anpassat namn för undermappen där färdiga filer flyttas.
- **Custom Output Folder Name**: Synligt endast när ovanstående är aktiverat. Ange det önskade namnet på undermappen, till exempel `Generated Content` eller `_complete`. Ogiltiga tecken tillåts inte. Om fältet lämnas tomt används `_complete`. Mappen skapas relativt originalmappens förälderkatalog.

#### One-click Workflow Buttons
- **Visual Workflow Builder**: Skapa anpassade workflow-knappar från inbyggda åtgärder utan att skriva DSL för hand.
- **Custom Workflow Buttons DSL**: Avancerade användare kan fortfarande redigera arbetsflödesdefinitionen direkt som text. Ogiltig DSL faller säkert tillbaka till standardarbetsflödet och visar en varning i sidofältet eller inställnings-UI:t.
- **Workflow Error Strategy**:
  - **Stop on Error (standard)**: Stoppar arbetsflödet direkt när ett steg misslyckas.
  - **Continue on Error**: Fortsätter köra senare steg och rapporterar antalet misslyckade åtgärder i slutet.
- **Default Workflow Included**: `One-Click Extract` kedjar `Process File (Add Links)`, `Batch Generate from Titles` och `Batch Mermaid Fix`.

#### Custom Prompt Settings
Denna funktion låter dig åsidosätta standardinstruktionerna, prompts, som skickas till LLM:en för specifika uppgifter, vilket ger dig finmaskig kontroll över utdata.

- **Enable Custom Prompts for Specific Tasks**:
  - **Av (standard)**: Pluginet använder sina inbyggda standardprompts för alla operationer.
  - **På**: Aktiverar möjligheten att ange egna prompts för uppgifterna nedan. Detta är huvudbrytaren för funktionen.

- **Use Custom Prompt for [Task Name]**: Synligt endast när ovanstående är aktiverat.
  - För varje stödd uppgift, som "Add Links", "Generate from Title", "Research & Summarize" och "Extract Concepts", kan du individuellt aktivera eller inaktivera din anpassade prompt.
  - **Av**: Den specifika uppgiften använder standardprompten.
  - **På**: Den specifika uppgiften använder texten du anger i motsvarande "Custom Prompt"-textområde nedan.

- **Custom Prompt Text Area**: Synligt endast när en uppgifts anpassade prompt är aktiverad.
  - **Default Prompt Display**: Pluginet visar standardprompten som referens. Du kan använda knappen **"Copy Default Prompt"** för att kopiera texten som utgångspunkt för din egen anpassade prompt.
  - **Custom Prompt Input**: Här skriver du dina egna instruktioner till LLM:en.
  - **Placeholders**: Du kan och bör använda särskilda placeholders i prompten, som pluginet ersätter med faktiskt innehåll innan begäran skickas till LLM:en. Titta på standardprompten för att se vilka placeholders som finns tillgängliga för varje uppgift. Vanliga placeholders är:
    - `{TITLE}`: Titeln på den aktuella anteckningen.
    - `{RESEARCH_CONTEXT_SECTION}`: Innehållet som samlats in från webbforskning.
    - `{USER_PROMPT}`: Innehållet i den anteckning som bearbetas.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Duplicate Check Scope
- **Duplicate Check Scope Mode**: Styr vilka filer som jämförs mot anteckningarna i din **Concept Note Folder** för att hitta potentiella dubbletter.
  - **Entire Vault (standard)**: Jämför konceptanteckningar mot alla andra anteckningar i vaultet, utom själva Concept Note Folder.
  - **Include Specific Folders Only**: Jämför konceptanteckningar endast mot anteckningar i mapparna som listas nedan.
  - **Exclude Specific Folders**: Jämför konceptanteckningar mot alla anteckningar *förutom* dem i mapparna som listas nedan, och exkluderar även Concept Note Folder.
  - **Concept Folder Only**: Jämför konceptanteckningar endast mot *andra anteckningar inom Concept Note Folder*. Detta hjälper dig hitta dubbletter enbart bland dina genererade begrepp.
- **Include/Exclude Folders**: Synligt endast om läget är 'Include' eller 'Exclude'. Ange *relativa sökvägar* till de mappar du vill inkludera eller exkludera, **en sökväg per rad**. Sökvägar är skiftlägeskänsliga och använder `/` som separator, till exempel `Reference Material/Papers` eller `Daily Notes`. Dessa mappar kan inte vara samma som eller ligga inuti Concept Note Folder.

#### Web Research Provider
- **Search Provider**: Välj mellan `Tavily`, som kräver API-nyckel och rekommenderas, och `DuckDuckGo`, som är experimentellt och ofta blockeras av sökmotorn vid automatiserade förfrågningar. Används för "Research & Summarize Topic" och valfritt för "Generate from Title".
- **Tavily API Key**: Synligt endast om Tavily är valt. Ange din API-nyckel från [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Synligt endast om Tavily är valt. Maximalt antal sökresultat som Tavily ska returnera, 1-20. Standard: 5.
- **Tavily Search Depth**: Synligt endast om Tavily är valt. Välj `basic`, standard, eller `advanced`. Observera att `advanced` ger bättre resultat men kostar 2 API-krediter per sökning i stället för 1.
- **DuckDuckGo Max Results**: Synligt endast om DuckDuckGo är valt. Maximalt antal sökresultat att parsa, 1-10. Standard: 5.
- **DuckDuckGo Content Fetch Timeout**: Synligt endast om DuckDuckGo är valt. Max antal sekunder att vänta när innehåll hämtas från varje DuckDuckGo-resultat-URL. Standard: 15.
- **Max Research Content Tokens**: Ungefärligt maxantal tokens från kombinerade resultat från webbforskning, snippets och hämtat innehåll, som ska inkluderas i sammanfattningsprompten. Hjälper till att hantera context window size och kostnad. Standard: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Focused Learning Domain
- **Enable Focused Learning Domain**:
  - **Av (standard)**: Prompts som skickas till LLM:en använder standardinstruktioner för allmänna syften.
  - **På**: Låter dig ange ett eller flera ämnesområden för att förbättra LLM:ens kontextuella förståelse.
- **Learning Domain**: Synligt endast när ovanstående är aktiverat. Ange dina specifika ämnesområden, till exempel `Materials Science`, `Polymer Physics` eller `Machine Learning`. Detta lägger till raden "Relevant Fields: [...]" i början av prompts, vilket hjälper LLM:en att generera mer korrekta och relevanta länkar och innehåll för ditt studieområde.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Användarguide

### Snabba arbetsflöden och sidofält

- Öppna Notemd-sidofältet för att komma åt grupperade åtgärdssektioner för kärnbearbetning, generering, översättning, kunskap och verktyg.
- Använd området **Quick Workflows** överst i sidofältet för att starta anpassade fler-stegs-knappar.
- Standardarbetsflödet **One-Click Extract** kör `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Arbetsflödets framsteg, loggar per steg och fel visas i sidofältet, med en fastnålad footer som hindrar progress bar och loggområdet från att tryckas undan när sektioner expanderas.
- Progress-kortet håller statustext, en särskild procentindikator och återstående tid lättlästa, och samma anpassade arbetsflöden kan konfigureras om från inställningarna.

### Ursprunglig bearbetning (lägga till wiki-länkar)
Detta är kärnfunktionen som fokuserar på att identifiera begrepp och lägga till `[[wiki-links]]`.

**Viktigt:** Den här processen fungerar endast på `.md`- eller `.txt`-filer. Du kan kostnadsfritt konvertera PDF-filer till MD-filer med [Mineru](https://github.com/opendatalab/MinerU) innan vidare bearbetning.

1. **Använda sidofältet**:
   - Öppna Notemd Sidebar, via trollspöikonen eller command palette.
   - Öppna `.md`- eller `.txt`-filen.
   - Klicka på **"Process File (Add Links)"**.
   - För att bearbeta en mapp klickar du på **"Process Folder (Add Links)"**, väljer mappen och klickar på "Process".
   - Framsteg visas i sidofältet. Du kan avbryta uppgiften via knappen "Cancel Processing" i sidofältet.
   - *Observera för mappbearbetning:* Filer bearbetas i bakgrunden utan att öppnas i editorn.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Använda Command Palette** (`Ctrl+P` eller `Cmd+P`):
   - **En fil**: Öppna filen och kör `Notemd: Process Current File`.
   - **Mapp**: Kör `Notemd: Process Folder`, välj sedan mappen. Filerna bearbetas i bakgrunden utan att öppnas i editorn.
   - En progress modal visas för kommandon från command palette, och den innehåller en cancel-knapp.
   - *Obs:* pluginet tar automatiskt bort inledande rader med `\boxed{` och avslutande rader med `}` om de finns i det slutligt bearbetade innehållet innan det sparas.

### Nya funktioner

1. **Summarise as Mermaid diagram**:
   - Öppna den anteckning du vill sammanfatta.
   - Kör kommandot `Notemd: Summarise as Mermaid diagram`, via command palette eller knappen i sidofältet.
   - Pluginet genererar en ny anteckning med Mermaid-diagrammet.

2. **Translate Note/Selection**:
   - Markera text i en anteckning om du bara vill översätta markeringen, eller kör kommandot utan markering för att översätta hela anteckningen.
   - Kör kommandot `Notemd: Translate Note/Selection`, via command palette eller knappen i sidofältet.
   - En modal visas där du kan bekräfta eller ändra **Target Language**, som standard hämtas från inställningarna i konfigurationen.
   - Pluginet använder den konfigurerade **LLM Provider**, enligt Multi-Model-inställningarna, för att utföra översättningen.
   - Det översatta innehållet sparas till den konfigurerade **Translation Save Path** med rätt suffix och öppnas i **en ny panel till höger** om originalet för enkel jämförelse.
   - Du kan avbryta denna uppgift via knappen i sidofältet eller modalens cancel-knapp.
3. **Batch Translate**:
   - Kör kommandot `Notemd: Batch Translate Folder` från command palette och välj en mapp, eller högerklicka på en mapp i filutforskaren och välj "Batch translate this folder".
   - Pluginet översätter alla Markdown-filer i den valda mappen.
   - Översatta filer sparas på den konfigurerade översättningsvägen men öppnas inte automatiskt.
   - Denna process kan avbrytas via progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Markera text i en anteckning eller säkerställ att anteckningen har en titel, som då används som sökämne.
   - Kör kommandot `Notemd: Research and Summarize Topic`, via command palette eller knappen i sidofältet.
   - Pluginet använder den konfigurerade **Search Provider**, Tavily eller DuckDuckGo, och rätt **LLM Provider** enligt Multi-Model-inställningarna för att hitta och sammanfatta information.
   - Sammanfattningen läggs till i den aktuella anteckningen.
   - Du kan avbryta denna uppgift via knappen i sidofältet eller modalens cancel-knapp.
   - *Obs:* DuckDuckGo-sökningar kan misslyckas på grund av botdetektering. Tavily rekommenderas.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Öppna en anteckning, den kan vara tom.
   - Kör kommandot `Notemd: Generate Content from Title`, via command palette eller knappen i sidofältet.
   - Pluginet använder rätt **LLM Provider**, enligt Multi-Model-inställningarna, för att generera innehåll utifrån anteckningens titel och ersätter eventuellt befintligt innehåll.
   - Om inställningen **"Enable Research in 'Generate from Title'"** är aktiverad utförs först webbforskning, med den konfigurerade **Web Research Provider**, och resultaten inkluderas som kontext i prompten till LLM:en.
   - Du kan avbryta denna uppgift via knappen i sidofältet eller modalens cancel-knapp.

5. **Batch Generate Content from Titles**:
   - Kör kommandot `Notemd: Batch Generate Content from Titles`, via command palette eller knappen i sidofältet.
   - Välj mappen som innehåller de anteckningar du vill bearbeta.
   - Pluginet itererar genom varje `.md`-fil i mappen, exklusive `_processed.md`-filer och filer i den avsedda "complete"-mappen, och genererar innehåll utifrån anteckningens titel och ersätter befintligt innehåll. Filer bearbetas i bakgrunden utan att öppnas i editorn.
   - Filer som bearbetas framgångsrikt flyttas till den konfigurerade "complete"-mappen.
   - Kommandot respekterar inställningen **"Enable Research in 'Generate from Title'"** för varje bearbetad anteckning.
   - Du kan avbryta denna uppgift via knappen i sidofältet eller modalens cancel-knapp.
   - Framsteg och resultat, som antal ändrade filer och fel, visas i sidofältets eller modalens logg.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Säkerställ att **Concept Note Folder Path** är korrekt konfigurerad i inställningarna.
   - Kör `Notemd: Check and Remove Duplicate Concept Notes`, via command palette eller knappen i sidofältet.
   - Pluginet skannar concept note-mappen och jämför filnamn mot anteckningar utanför mappen med flera regler, som exakt matchning, pluralformer, normalisering och innehåll.
   - Om potentiella dubbletter hittas visas en modal med filerna, orsaken till flaggningen och konfliktfilerna.
   - Granska listan noga. Klicka på **"Delete Files"** för att flytta listade filer till systemets papperskorg, eller **"Cancel"** för att inte göra något.
   - Framsteg och resultat visas i sidofältets eller modalens logg.

7. **Extract Concepts (Pure Mode)**:
   - Denna funktion låter dig extrahera begrepp från ett dokument och skapa motsvarande konceptanteckningar *utan* att ändra originalfilen. Den passar utmärkt för att snabbt fylla din kunskapsbas från en samling dokument.
   - **En fil**: Öppna en fil och kör kommandot `Notemd: Extract concepts (create concept notes only)` från command palette, eller klicka på knappen **"Extract concepts (current file)"** i sidofältet.
   - **Mapp**: Kör kommandot `Notemd: Batch extract concepts from folder` från command palette, eller klicka på knappen **"Extract concepts (folder)"** i sidofältet och välj sedan en mapp för att bearbeta alla dess anteckningar.
   - Pluginet läser filerna, identifierar begrepp och skapar nya anteckningar för dem i din valda **Concept Note Folder**, samtidigt som originalfilerna lämnas orörda.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Detta kraftfulla kommando effektiviserar processen att skapa och fylla nya konceptanteckningar.
   - Markera ett ord eller en fras i editorn.
   - Kör kommandot `Notemd: Create Wiki-Link & Generate Note from Selection`, det rekommenderas att binda en hotkey, till exempel `Cmd+Shift+W`.
   - Pluginet kommer att:
     1. Ersätta den markerade texten med en `[[wiki-link]]`.
     2. Kontrollera om en anteckning med den titeln redan finns i din **Concept Note Folder**.
     3. Om den finns läggs en backlink till den aktuella anteckningen till.
     4. Om den inte finns skapas en ny, tom anteckning.
     5. Därefter körs kommandot **"Generate Content from Title"** automatiskt på den nya eller befintliga anteckningen så att den fylls med AI-genererat innehåll.

9. **Extract Concepts and Generate Titles**:
   - Detta kommando kedjar ihop två kraftfulla funktioner till ett strömlinjeformat arbetsflöde.
   - Kör kommandot `Notemd: Extract Concepts and Generate Titles` från command palette, det rekommenderas att binda en hotkey.
   - Pluginet kommer att:
     1. Först köra uppgiften **"Extract concepts (current file)"** på den aktuella aktiva filen.
     2. Därefter automatiskt köra uppgiften **"Batch generate from titles"** på den mapp du har konfigurerat som **Concept note folder path** i inställningarna.
   - Detta låter dig först fylla din kunskapsbas med nya begrepp från ett källdokument och sedan omedelbart utveckla dessa nya konceptanteckningar med AI-genererat innehåll i ett enda steg.

10. **Extract Specific Original Text**:
   - Konfigurera dina frågor i inställningarna under "Extract Specific Original Text".
   - Använd knappen "Extract Specific Original Text" i sidofältet för att bearbeta den aktiva filen.
   - **Merged Mode**: Möjliggör snabbare bearbetning genom att skicka alla frågor i en enda prompt.
   - **Translation**: Översätter valfritt den extraherade texten till ditt konfigurerade språk.
   - **Custom Output**: Konfigurera var och hur den extraherade filen ska sparas.

11. **Batch Mermaid Fix**:
   - Använd knappen "Batch Mermaid Fix" i sidofältet för att skanna en mapp och rätta vanliga Mermaid-syntaxfel.
   - Pluginet rapporterar filer som fortfarande innehåller fel i en fil `mermaid_error_{foldername}.md`.
   - Du kan valfritt konfigurera pluginet att flytta problematiska filer till en separat mapp för granskning.

## LLM-leverantörer som stöds

| Leverantör | Typ | API-nyckel krävs | Anmärkningar |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Moln    | Ja                     | Inbyggt DeepSeek-endpoint med stöd för reasoning-modeller             |
| Qwen               | Moln    | Ja                     | DashScope compatible-mode preset för Qwen / QwQ-modeller             |
| Qwen Code          | Moln    | Ja                     | DashScope-preset för Qwen-kodmodeller                                 |
| Doubao             | Moln    | Ja                     | Volcengine Ark-preset; modellfältet sätts normalt till ditt endpoint-ID |
| Moonshot           | Moln    | Ja                     | Officiellt Kimi / Moonshot-endpoint                                   |
| GLM                | Moln    | Ja                     | Officiellt Zhipu BigModel OpenAI-compatible-endpoint                  |
| Z AI               | Moln    | Ja                     | Internationellt GLM/Zhipu OpenAI-compatible-endpoint; kompletterar `GLM` |
| MiniMax            | Moln    | Ja                     | Officiellt MiniMax chat-completions-endpoint                          |
| Huawei Cloud MaaS  | Moln    | Ja                     | Huawei ModelArts MaaS OpenAI-compatible-endpoint för hostade modeller |
| Baidu Qianfan      | Moln    | Ja                     | Officiellt Qianfan OpenAI-compatible-endpoint för ERNIE-modeller      |
| SiliconFlow        | Moln    | Ja                     | Officiellt SiliconFlow OpenAI-compatible-endpoint för hostade OSS-modeller |
| OpenAI             | Moln    | Ja                     | Stödjer GPT- och o-serie-modeller                                     |
| Anthropic          | Moln    | Ja                     | Stödjer Claude-modeller                                               |
| Google             | Moln    | Ja                     | Stödjer Gemini-modeller                                               |
| Mistral            | Moln    | Ja                     | Stödjer familjerna Mistral och Codestral                              |
| Azure OpenAI       | Moln    | Ja                     | Kräver endpoint, API-nyckel, deployment name och API Version          |
| OpenRouter         | Gateway | Ja                     | Ger tillgång till många leverantörer via OpenRouter-modell-ID:n       |
| xAI                | Moln    | Ja                     | Inbyggt Grok-endpoint                                                 |
| Groq               | Moln    | Ja                     | Snabb OpenAI-compatible-inferens för hostade OSS-modeller             |
| Together           | Moln    | Ja                     | OpenAI-compatible-endpoint för hostade OSS-modeller                   |
| Fireworks          | Moln    | Ja                     | OpenAI-compatible-inferens-endpoint                                   |
| Requesty           | Gateway | Ja                     | Multi-provider-router bakom en enda API-nyckel                        |
| OpenAI Compatible  | Gateway | Valfritt               | Generisk preset för LiteLLM, vLLM, Perplexity, Vercel AI Gateway med mera |
| LMStudio           | Lokal   | Valfritt (`EMPTY`)     | Kör modeller lokalt via LM Studio-server                              |
| Ollama             | Lokal   | Nej                    | Kör modeller lokalt via Ollama-server                                 |

*Obs: För lokala leverantörer, LMStudio och Ollama, säkerställ att respektive serverapplikation körs och är åtkomlig via den konfigurerade Base URL.*
*Obs: För OpenRouter och Requesty ska du använda det leverantörsprefixerade eller fullständiga modell-ID som gatewayen visar, till exempel `google/gemini-flash-1.5` eller `anthropic/claude-3-7-sonnet-latest`.*
*Obs: `Doubao` förväntar sig vanligtvis ett Ark endpoint- eller deployment-ID i modellfältet i stället för ett rått modellfamiljsnamn. Inställningsvyn varnar nu när platshållarvärdet fortfarande finns kvar och blockerar connection tests tills du ersätter det med ett riktigt endpoint-ID.*
*Obs: `Z AI` riktar sig till den internationella `api.z.ai`-linjen, medan `GLM` behåller BigModel-endpointen för Fastlandskina. Välj den preset som motsvarar din kontoregion.*
*Obs: Kinafokuserade presets använder chat-first-anslutningstester så att testet verifierar den faktiskt konfigurerade modellen eller deploymenten, inte bara att API-nyckeln går att nå.*
*Obs: `OpenAI Compatible` är avsett för anpassade gateways och proxies. Ange Base URL, policy för API-nyckel och modell-ID enligt din leverantörs dokumentation.*

## Nätverksanvändning och datahantering

Notemd körs lokalt inne i Obsidian, men vissa funktioner skickar utgående begäranden.

### LLM Provider Calls (konfigurerbara)

- Trigger: filbearbetning, generering, översättning, forskningssammanfattning, Mermaid-sammanfattning samt anslutnings- och diagnostikåtgärder.
- Endpoint: dina konfigurerade leverantörs-Base-URL:er i Notemd-inställningarna.
- Data som skickas: prompttext och uppgiftsinnehåll som krävs för bearbetningen.
- Datahanteringsnotering: API-nycklar konfigureras lokalt i plugininställningarna och används för att signera begäranden från din enhet.

### Web Research Calls (valfritt)

- Trigger: när webbforskning är aktiverad och en sökleverantör har valts.
- Endpoint: Tavily API eller DuckDuckGo-endpoints.
- Data som skickas: din forskningsfråga och nödvändig request-metadata.

### Developer Diagnostics & Debug Logs (valfritt)

- Trigger: API debug mode och diagnostiska åtgärder för utvecklare.
- Lagring: diagnostik- och felloggar skrivs till vaultets rot, till exempel `Notemd_Provider_Diagnostic_*.txt` och `Notemd_Error_Log_*.txt`.
- Risknotering: loggar kan innehålla utdrag ur requests och responses. Granska loggar innan du delar dem offentligt.

### Lokal lagring

- Pluginets konfiguration lagras i `.obsidian/plugins/notemd/data.json`.
- Genererade filer, rapporter och valfria loggar lagras i ditt vault enligt dina inställningar.

## Felsökning

### Vanliga problem
- **Pluginet laddas inte**: Säkerställ att `manifest.json`, `main.js` och `styles.css` ligger i rätt mapp, `<Vault>/.obsidian/plugins/notemd/`, och starta om Obsidian. Kontrollera Developer Console, `Ctrl+Shift+I` eller `Cmd+Option+I`, efter fel vid uppstart.
- **Bearbetningsfel / API-fel**:
  1. **Kontrollera filformatet**: Säkerställ att filen du försöker bearbeta eller kontrollera har filändelsen `.md` eller `.txt`. Notemd stöder för närvarande endast dessa textbaserade format.
  2. Använd kommandot eller knappen "Test LLM Connection" för att verifiera inställningarna för den aktiva leverantören.
  3. Dubbelkolla API Key, Base URL, Model Name och API Version, för Azure. Säkerställ att API-nyckeln är korrekt och har tillräckliga krediter eller behörigheter.
  4. Säkerställ att din lokala LLM-server, LMStudio eller Ollama, körs och att Base URL är korrekt, till exempel `http://localhost:1234/v1` för LMStudio.
  5. Kontrollera din internetanslutning för molnleverantörer.
  6. **För bearbetningsfel i enskilda filer:** Granska Developer Console för detaljerade felmeddelanden. Kopiera dem med knappen i error modal om det behövs.
  7. **För batchbearbetningsfel:** Kontrollera filen `error_processing_filename.log` i vaultets rot för detaljerade felmeddelanden för varje misslyckad fil. Developer Console eller error modal kan visa en sammanfattning eller ett generellt batchfel.
  8. **Automatiska felloggar:** Om en process misslyckas sparar pluginet automatiskt en detaljerad loggfil med namnet `Notemd_Error_Log_[Timestamp].txt` i rotkatalogen för ditt vault. Filen innehåller felmeddelande, stack trace och sessionsloggar. Om du stöter på återkommande problem bör du kontrollera denna fil. Om "API Error Debugging Mode" aktiveras i inställningarna fylls denna logg med ännu mer detaljerad API-responsdata.
  9. **Diagnostik för långa begäranden mot verkligt endpoint (utvecklare)**:
     - Inbyggd väg, rekommenderas först: använd **Settings -> Notemd -> Developer provider diagnostic (long request)** för att köra en runtime-probe på den aktiva leverantören och generera `Notemd_Provider_Diagnostic_*.txt` i vaultets rot.
     - CLI-väg, utanför Obsidian runtime: för reproducerbar jämförelse på endpoint-nivå mellan buffrat och strömmat beteende, använd:
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
       Den genererade rapporten innehåller tidsmätning per försök, `First Byte` och `Duration`, sanerad request-metadata, response headers, råa eller partiella body-fragment, parsade stream-fragment och felpunkter på transportnivå.
- **Anslutningsproblem med LM Studio/Ollama**:
  - **Test Connection misslyckas**: Säkerställ att den lokala servern, LM Studio eller Ollama, körs och att rätt modell är laddad eller tillgänglig.
  - **CORS-fel, Ollama på Windows**: Om du får CORS-fel, Cross-Origin Resource Sharing, när du använder Ollama på Windows kan du behöva sätta miljövariabeln `OLLAMA_ORIGINS`. Du kan göra det genom att köra `set OLLAMA_ORIGINS=*` i kommandotolken innan du startar Ollama. Detta tillåter requests från alla origins.
  - **Aktivera CORS i LM Studio**: För LM Studio kan du aktivera CORS direkt i serverinställningarna, vilket kan vara nödvändigt om Obsidian körs i en webbläsare eller har strikta origin policies.
- **Fel vid skapande av mappar ("File name cannot contain...")**:
  - Detta betyder vanligtvis att sökvägen som angivits i inställningarna, **Processed File Folder Path** eller **Concept Note Folder Path**, är ogiltig *för Obsidian*.
  - **Säkerställ att du använder relativa sökvägar**, till exempel `Processed` eller `Notes/Concepts`, och **inte absoluta sökvägar**, som `C:\Users\...` eller `/Users/...`.
  - Kontrollera ogiltiga tecken: `* " \ / < > : | ? # ^ [ ]`. Observera att `\` är ogiltigt även på Windows i Obsidian-sökvägar. Använd `/` som sökvägsseparator.
- **Prestandaproblem**: Bearbetning av stora filer eller många filer kan ta tid. Minska inställningen "Chunk Word Count" för potentiellt snabbare, men fler, API-anrop. Prova en annan LLM-leverantör eller modell.
- **Oväntad länkning**: Kvaliteten på länkningen beror starkt på LLM:en och prompten. Experimentera med olika modeller eller temperature-inställningar.

## Bidra

Bidrag är välkomna. Se GitHub-repositoryt för riktlinjer: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumentation för underhållare

- [Release Workflow (English)](./docs/maintainer/release-workflow.md)
- [Release Workflow (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Licens

MIT License - Se filen [LICENSE](LICENSE) för detaljer.

---

*Notemd v1.8.0 - Förbättra din Obsidian-kunskapsgraf med AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
