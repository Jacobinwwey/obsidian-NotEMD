![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Notemd-plugin voor Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lees de documentatie in meer talen: [Taalhub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-aangedreven meertalige kennisverrijking
==================================================
```

Een eenvoudige manier om je eigen kennisbank op te bouwen!

Notemd verbetert je Obsidian-workflow door te integreren met verschillende Large Language Models (LLM's) om je meertalige notities te verwerken, automatisch wiki-links voor kernconcepten te genereren, bijbehorende conceptnotities te maken, webonderzoek uit te voeren en je te helpen krachtige kennisgrafieken op te bouwen.

Als je Notemd graag gebruikt, overweeg dan [⭐ een ster te geven op GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) of [☕️ koop een koffie voor mij](https://ko-fi.com/jacobinwwey).

**Versie:** 1.8.4

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Inhoudsopgave

- [Snelstart](#snelstart)
- [Taalondersteuning](#taalondersteuning)
- [Functies](#functies)
- [Installatie](#installatie)
- [Configuratie](#configuratie)
- [Gebruikshandleiding](#gebruikshandleiding)
- [Ondersteunde LLM-aanbieders](#ondersteunde-llm-aanbieders)
- [Netwerkgebruik en gegevensverwerking](#netwerkgebruik-en-gegevensverwerking)
- [Probleemoplossing](#probleemoplossing)
- [Bijdragen](#bijdragen)
- [Documentatie voor maintainers](#documentatie-voor-maintainers)
- [Licentie](#licentie)

## Snelstart

1. **Installeren en inschakelen**: Haal de plugin uit de Obsidian Marketplace.
2. **LLM configureren**: Ga naar `Settings -> Notemd`, selecteer je LLM-provider (zoals OpenAI of een lokale provider zoals Ollama) en voer je API-sleutel/URL in.
3. **Zijbalk openen**: Klik op het Notemd-toverstafpictogram in het linkerlint om de zijbalk te openen.
4. **Een notitie verwerken**: Open een willekeurige notitie en klik in de zijbalk op **"Process File (Add Links)"** om automatisch `[[wiki-links]]` toe te voegen aan kernconcepten.
5. **Een snelle workflow uitvoeren**: Gebruik de standaardknop **"One-Click Extract"** om verwerking, batchgeneratie en Mermaid-opruiming vanuit één ingang te koppelen.

Dat is alles. Verken de instellingen om meer functies vrij te schakelen, zoals webonderzoek, vertaling en contentgeneratie.

## Taalondersteuning

### Taalgedragscontract

| Onderdeel | Reikwijdte | Standaard | Opmerkingen |
|---|---|---|---|
| `Interfacetaal` | Alleen plugin-UI-tekst (instellingen, zijbalk, meldingen, dialoogvensters) | `auto` | Volgt de Obsidian-locale; huidige UI-catalogi zijn `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Taakuitvoertaal` | Door de LLM gegenereerde taakuitvoer (links, samenvattingen, generatie, extractie, vertaald doel) | `en` | Kan globaal zijn of per taak worden ingesteld wanneer `Verschillende talen voor taken gebruiken` is ingeschakeld. |
| `Automatische vertaling uitschakelen` | Niet-Translate-taken behouden broncontext in de oorspronkelijke taal | `false` | Expliciete `Translate`-taken forceren nog steeds de geconfigureerde doeltaal. |
| `Taalfallback` | Resolutie van ontbrekende UI-sleutels | locale -> `en` | Houdt de UI stabiel wanneer sommige sleutels nog niet vertaald zijn. |

- De onderhouden brondocumenten zijn Engels en Vereenvoudigd Chinees, en gepubliceerde README-vertalingen staan hierboven in de kop gelinkt.
- De in-app dekking van UI-lokalen komt momenteel exact overeen met de expliciete catalogus in de code: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- De Engelse fallback blijft een implementatief veiligheidsnet, maar ondersteunde zichtbare oppervlakken zijn afgedekt door regressietests en zouden bij normaal gebruik niet stilletjes naar Engels moeten terugvallen.
- Verdere details en richtlijnen voor bijdragen worden bijgehouden in de [Taalhub](./docs/i18n/README.md).

## Functies

### AI-aangedreven documentverwerking
- **Multi-LLM-ondersteuning**: Verbind met verschillende cloud- en lokale LLM-aanbieders (zie [Ondersteunde LLM-aanbieders](#ondersteunde-llm-aanbieders)).
- **Slim chunken**: Splitst grote documenten automatisch op in beheersbare stukken op basis van woordenaantal.
- **Behoud van inhoud**: Probeert de oorspronkelijke opmaak te behouden terwijl structuur en links worden toegevoegd.
- **Voortgangsregistratie**: Realtime updates via de Notemd-zijbalk of een voortgangsvenster.
- **Annuleerbare bewerkingen**: Annuleer elke verwerkingstaak (enkel bestand of batch) die vanuit de zijbalk is gestart met de eigen annuleerknop. Opdrachten uit het command palette gebruiken een venster dat ook geannuleerd kan worden.
- **Multi-modelconfiguratie**: Gebruik verschillende LLM-providers en specifieke modellen voor verschillende taken (Add Links, Research, Generate Title, Translate), of gebruik één provider voor alles.
- **Stabiele API-calls (retry-logica)**: Schakel optioneel automatische retries in voor mislukte LLM API-calls, met instelbaar interval en limieten voor het aantal pogingen.
- **Robuuste tests van providerverbindingen**: Als de eerste providertest een tijdelijke netwerkverbreking raakt, schakelt Notemd nu over op de stabiele retry-sequentie voordat hij faalt. Dat geldt voor OpenAI-compatibele, Anthropic-, Google-, Azure OpenAI- en Ollama-transports.
- **Transportfallback voor runtime-omgeving**: Wanneer een langlopende providerrequest door `requestUrl` wordt afgebroken met tijdelijke netwerkfouten zoals `ERR_CONNECTION_CLOSED`, probeert Notemd dezelfde poging opnieuw via een omgevingsspecifieke transportfallback voordat de geconfigureerde retry-loop start: desktopbuilds gebruiken Node `http/https`, terwijl niet-desktopomgevingen browser-`fetch` gebruiken. Dat vermindert fout-negatieven op trage gateways en reverse proxies.
- **Versterkte stabiele long-request-keten voor OpenAI-compatibele providers**: In stabiele modus gebruiken OpenAI-compatibele calls nu expliciet een 3-fasenvolgorde per poging: primaire directe streaming-transport, daarna direct non-stream-transport, daarna `requestUrl`-fallback (die nog steeds kan upgraden naar stream-parsing indien nodig). Dat vermindert fout-negatieven wanneer providers wel buffered responses afronden maar streaming-pijplijnen instabiel zijn.
- **Protocolbewuste streamingfallback over LLM-API's heen**: Langlopende fallbackpogingen upgraden nu naar protocolbewuste stream-parsing over elk ingebouwd LLM-pad, niet alleen voor OpenAI-compatibele eindpunten. Notemd verwerkt nu OpenAI/Azure-stijl SSE, Anthropic Messages streaming, Google Gemini SSE-responses en Ollama NDJSON-streams op zowel desktop `http/https` als niet-desktop `fetch`, en de resterende directe OpenAI-stijl providerpaden hergebruiken hetzelfde gedeelde fallbackpad.
- **China-ready provider-presets**: Ingebouwde presets dekken nu `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` en `SiliconFlow`, naast de bestaande globale en lokale providers.
- **Betrouwbare batchverwerking**: Verbeterde gelijktijdige verwerkingslogica met **gespreide API-calls** om rate limiting te voorkomen en stabiele prestaties tijdens grote batchjobs te garanderen. De nieuwe implementatie zorgt ervoor dat taken met intervallen starten in plaats van allemaal tegelijk.
- **Nauwkeurige voortgangsrapportage**: Een bug opgelost waardoor de voortgangsbalk kon vastlopen, zodat de UI nu altijd de werkelijke status van de bewerking toont.
- **Robuuste parallelle batchverwerking**: Een probleem opgelost waarbij parallelle batchbewerkingen voortijdig stilvielen, zodat nu alle bestanden betrouwbaar en efficiënt worden verwerkt.
- **Nauwkeurigheid van de voortgangsbalk**: Een bug opgelost waarbij de voortgangsbalk voor de opdracht "Create Wiki-Link & Generate Note" op 95% kon blijven hangen; deze toont nu correct 100% bij voltooiing.
- **Verbeterde API-debugging**: De modus "API Error Debugging Mode" legt nu volledige response bodies van LLM-providers en zoekdiensten (Tavily/DuckDuckGo) vast en registreert ook per poging een transporttijdlijn met geschoonde request-URL's, verstreken duur, response-headers, gedeeltelijke response-bodies, geparseerde gedeeltelijke streaminhoud en stack traces voor betere troubleshooting over OpenAI-compatibele, Anthropic-, Google-, Azure OpenAI- en Ollama-fallbacks heen.
- **Developer Mode-paneel**: De instellingen bevatten nu een apart diagnostisch paneel voor developers dat verborgen blijft totdat "Developer mode" is ingeschakeld. Het ondersteunt het selecteren van diagnostische call-paden en het uitvoeren van herhaalde stabiliteitsprobes voor de geselecteerde modus.
- **Herontworpen zijbalk**: Ingebouwde acties zijn gegroepeerd in gerichte secties met duidelijkere labels, live status, annuleerbare voortgang en kopieerbare logs om rommel in de zijbalk te verminderen. De voortgangs-/logfooter blijft nu zichtbaar, zelfs wanneer alle secties zijn uitgeklapt, en de ready state gebruikt een duidelijker standby-spoor.
- **Interacties en leesbaarheid van de zijbalk verbeterd**: Knoppen in de zijbalk geven nu duidelijkere hover/press/focus-feedback, en kleurrijke CTA-knoppen (waaronder `One-Click Extract` en `Batch generate from titles`) gebruiken sterker tekstcontrast voor betere leesbaarheid over thema's heen.
- **CTA-toewijzing voor één bestand**: Kleurrijke CTA-styling is nu alleen gereserveerd voor single-file-acties. Batch-/mapacties en gemengde workflows gebruiken geen CTA-styling om missclicks op actiebereik te verminderen.
- **Aangepaste one-click-workflows**: Maak van ingebouwde hulpprogramma's in de zijbalk herbruikbare aangepaste knoppen met gebruikersgedefinieerde namen en samengestelde actieketens. Een standaardworkflow `One-Click Extract` is direct inbegrepen.

### Verbetering van de kennisgrafiek
- **Automatische wiki-linking**: Identificeert kernconcepten en voegt `[[wiki-links]]` toe binnen verwerkte notities op basis van LLM-output.
- **Conceptnotities aanmaken (optioneel en aanpasbaar)**: Maakt automatisch nieuwe notities aan voor ontdekte concepten in een opgegeven map in je vault.
- **Aanpasbare uitvoerpaden**: Configureer aparte relatieve paden binnen je vault voor het opslaan van verwerkte bestanden en nieuw aangemaakte conceptnotities.
- **Aanpasbare uitvoerbestandsnamen (Add Links)**: Kies optioneel om **het originele bestand te overschrijven** of gebruik een aangepaste suffix/vervangingsstring in plaats van de standaard `_processed.md` bij het verwerken van bestanden voor links.
- **Behoud van linkintegriteit**: Basisafhandeling voor het bijwerken van links wanneer notities binnen de vault worden hernoemd of verwijderd.
- **Pure conceptextractie**: Extraheer concepten en maak bijbehorende conceptnotities zonder het oorspronkelijke document te wijzigen. Dit is ideaal om een kennisbank te vullen op basis van bestaande documenten zonder ze aan te passen. Deze functie heeft configureerbare opties voor minimale conceptnotities en backlinks.

### Vertaling

- **AI-aangedreven vertaling**:
  - Vertaal notitie-inhoud met de geconfigureerde LLM.
  - **Ondersteuning voor grote bestanden**: Splitst grote bestanden automatisch op in kleinere chunks op basis van de instelling `Chunk word count` voordat ze naar de LLM worden gestuurd. De vertaalde chunks worden daarna naadloos weer samengevoegd tot één document.
  - Ondersteunt vertalingen tussen meerdere talen.
  - Aanpasbare doeltaal in instellingen of UI.
  - Opent de vertaalde tekst automatisch rechts van de oorspronkelijke tekst voor eenvoudig vergelijken en lezen.
- **Batchvertaling**:
  - Vertaal alle bestanden in een geselecteerde map.
  - Ondersteunt parallelle verwerking wanneer "Enable Batch Parallelism" is ingeschakeld.
  - Gebruikt aangepaste prompts voor vertaling wanneer geconfigureerd.
  - Voegt een optie "Batch translate this folder" toe aan het contextmenu van de bestandsverkenner.
- **Automatische vertaling uitschakelen**: Wanneer deze optie is ingeschakeld, dwingen niet-Translate-taken geen output meer af in een specifieke taal, zodat de oorspronkelijke taalcontext behouden blijft. De expliciete taak "Translate" voert vertaling nog steeds uit zoals geconfigureerd.

### Webonderzoek en contentgeneratie
- **Webonderzoek en samenvatting**:
  - Voer webzoekopdrachten uit met Tavily (API-sleutel vereist) of DuckDuckGo (experimenteel).
  - **Verbeterde robuustheid van zoekopdrachten**: DuckDuckGo-zoekopdrachten gebruiken nu verbeterde parsinglogica (DOMParser met Regex-fallback) om layoutwijzigingen op te vangen en betrouwbare resultaten te leveren.
  - Vat zoekresultaten samen met de geconfigureerde LLM.
  - De outputtaal van de samenvatting kan in de instellingen worden aangepast.
  - Voeg samenvattingen toe aan de huidige notitie.
  - Configureerbare tokenlimiet voor onderzoeksinhoud die naar de LLM wordt gestuurd.
- **Content genereren op basis van titel**:
  - Gebruik de titel van de notitie om via de LLM initiële inhoud te genereren, waarbij bestaande inhoud wordt vervangen.
  - **Optioneel onderzoek**: Configureer of eerst webonderzoek moet worden uitgevoerd (via de geselecteerde provider) om context voor de generatie te leveren.
- **Batch contentgeneratie vanuit titels**: Genereer content voor alle notities binnen een geselecteerde map op basis van hun titels (respecteert de optionele onderzoeksinstelling). Succesvol verwerkte bestanden worden verplaatst naar een **configureerbare "complete"-submap** (bijv. `[foldername]_complete` of een aangepaste naam) om herverwerking te voorkomen.
- **Koppeling met Mermaid auto-fix**: Wanneer Mermaid auto-fix is ingeschakeld, repareren Mermaid-gerelateerde workflows na verwerking automatisch gegenereerde bestanden of uitvoermappen. Dat geldt voor Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid en Translate.

### Hulpfuncties
- **Vat samen als Mermaid-diagram**:
  - Met deze functie kun je de inhoud van een notitie samenvatten in een Mermaid-diagram.
  - De outputtaal van het Mermaid-diagram kan in de instellingen worden aangepast.
  - **Mermaid-uitvoermap**: Configureer de map waarin gegenereerde Mermaid-diagrambestanden worden opgeslagen.
  - **Translate Summarize to Mermaid Output**: Vertaal optioneel de gegenereerde Mermaid-inhoud naar de geconfigureerde doeltaal.
  -
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Eenvoudige correctie van formule-indeling**:
  - Corrigeert snel enkelregelige wiskundige formules die met enkele `$` zijn begrensd naar standaard dubbele `$$`-blokken.
  - **Enkel bestand**: Verwerk het huidige bestand via de zijbalkknop of het command palette.
  - **Batchfix**: Verwerk alle bestanden in een geselecteerde map via de zijbalkknop of het command palette.

- **Check for Duplicates in Current File**: Deze opdracht helpt bij het identificeren van mogelijke dubbele termen in het actieve bestand.
- **Duplicate Detection**: Basiscontrole op dubbele woorden binnen de momenteel verwerkte inhoud van een bestand (resultaten worden in de console gelogd).
- **Check and Remove Duplicate Concept Notes**: Identificeert mogelijke dubbele notities binnen de geconfigureerde **Concept Note Folder** op basis van exacte naammatches, meervouden, normalisatie en enkelwoord-bevatting vergeleken met notities buiten de map. De reikwijdte van de vergelijking (welke notities buiten de conceptmap worden meegenomen) kan worden ingesteld op de **volledige vault**, **specifieke opgenomen mappen** of **alle mappen behalve specifieke uitgesloten mappen**. Toont een gedetailleerde lijst met redenen en conflicterende bestanden en vraagt daarna om bevestiging voordat de gevonden duplicaten naar de systeemprullenbak worden verplaatst. Laat voortgang zien tijdens het verwijderen.
- **Batch Mermaid Fix**: Past Mermaid- en LaTeX-syntaxcorrecties toe op alle Markdown-bestanden binnen een door de gebruiker geselecteerde map.
  - **Workflow-klaar**: Kan als zelfstandige utility worden gebruikt of als stap binnen een aangepaste one-click-workflowknop.
  - **Foutrapportage**: Genereert een rapport `mermaid_error_{foldername}.md` met bestanden die na verwerking nog steeds mogelijke Mermaid-fouten bevatten.
  - **Verplaats foutbestanden**: Verplaatst optioneel bestanden met gedetecteerde fouten naar een opgegeven map voor handmatige controle.
  - **Slimme detectie**: Controleert bestanden nu intelligent op syntaxfouten met `mermaid.parse` voordat fixes worden geprobeerd, waardoor verwerkingstijd wordt bespaard en onnodige bewerkingen worden vermeden.
  - **Veilige verwerking**: Zorgt ervoor dat syntaxfixes uitsluitend binnen Mermaid-codeblokken worden toegepast, zodat Markdown-tabellen of andere inhoud niet per ongeluk worden aangepast. Bevat robuuste beveiligingen om tabelsyntax (bijvoorbeeld `| :--- |`) te beschermen tegen agressieve debugfixes.
  - **Deep Debug Mode**: Als fouten na de eerste fix blijven bestaan, wordt een geavanceerde deep-debugmodus geactiveerd. Die behandelt complexe randgevallen, waaronder:
    - **Comment Integration**: Voegt automatisch trailing comments (beginnend met `%`) samen met het edge-label (bijv. `A -- Label --> B; % Comment` wordt `A -- "Label(Comment)" --> B;`).
    - **Malformed Arrows**: Herstelt pijlen die door aanhalingstekens zijn opgeslokt (bijv. `A -- "Label -->" B` wordt `A -- "Label" --> B`).
    - **Inline Subgraphs**: Zet inline subgraph-labels om naar edge-labels.
    - **Reverse Arrow Fix**: Corrigeert niet-standaard `X <-- Y`-pijlen naar `Y --> X`.
    - **Direction Keyword Fix**: Zorgt dat het trefwoord `direction` in subgraphs in kleine letters staat (bijv. `Direction TB` -> `direction TB`).
    - **Comment Conversion**: Zet `//`-comments om naar edge-labels (bijv. `A --> B; // Comment` -> `A -- "Comment" --> B;`).
    - **Duplicate Label Fix**: Vereenvoudigt herhaalde labels tussen haken (bijv. `Node["Label"]["Label"]` -> `Node["Label"]`).
    - **Invalid Arrow Fix**: Zet ongeldige pijlsyntax `--|>` om naar standaard `-->`.
    - **Robuuste label- en nootafhandeling**: Verbeterde behandeling van labels met speciale tekens (zoals `/`) en betere ondersteuning voor aangepaste note-syntax (`note for ...`), zodat artefacten zoals losse afsluitende haken netjes worden verwijderd.
    - **Advanced Fix Mode**: Bevat robuuste correcties voor niet-gequote node-labels met spaties, speciale tekens of geneste haken (bijv. `Node[Label [Text]]` -> `Node["Label [Text]"]`), zodat ook complexe diagrammen zoals Stellar Evolution-paden compatibel blijven. Corrigeert ook foutieve edge-labels (bijv. `--["Label["-->` naar `-- "Label" -->`). Daarnaast zet het inline comments om (`Consensus --> Adaptive; # Some advanced consensus` naar `Consensus -- "Some advanced consensus" --> Adaptive`) en herstelt onvolledige quotes aan het einde van regels (`;"` aan het eind wordt vervangen door `"]`).
    - **Note Conversion**: Zet automatisch `note right/left of` en losse `note :`-comments om naar standaard Mermaid-node-definities en verbindingen (bijv. `note right of A: text` wordt `NoteA["Note: text"]` gekoppeld aan `A`), om syntaxfouten te voorkomen en de lay-out te verbeteren. Ondersteunt nu zowel pijlkoppelingen (`-->`) als solide koppelingen (`---`).
    - **Extended Note Support**: Zet automatisch `note for Node "Content"` en `note of Node "Content"` om naar standaard gekoppelde note-nodes (bijv. `NoteNode[" Content"]` gekoppeld aan `Node`), zodat ook deze door gebruikers uitgebreide syntax compatibel blijft.
    - **Enhanced Note Correction**: Hernoemt notes automatisch met oplopende nummering (bijv. `Note1`, `Note2`) om aliasing-problemen te voorkomen wanneer meerdere notes aanwezig zijn.
    - **Parallelogram/Shape Fix**: Corrigeert foutieve node-vormen zoals `[/["Label["/]` naar standaard `["Label"]`, zodat gegenereerde inhoud compatibel blijft.
    - **Standardize Pipe Labels**: Herstelt en standaardiseert edge-labels met pipes automatisch, zodat ze correct tussen quotes staan (bijv. `-->|Text|` wordt `-->|"Text"|` en `-->|Math|^2|` wordt `-->|"Math|^2"|`).
    - **Misplaced Pipe Fix**: Corrigeert verkeerd geplaatste edge-labels die vóór de pijl verschijnen (bijv. `>|"Label"| A --> B` wordt `A -->|"Label"| B`).
    - **Merge Double Labels**: Detecteert en voegt complexe dubbele labels op één edge samen (bijv. `A -- Label1 -- Label2 --> B` of `A -- Label1 -- Label2 --- B`) tot één schoon label met regelafbrekingen (`A -- "Label1<br>Label2" --> B`).
    - **Unquoted Label Fix**: Zet node-labels die potentieel problematische tekens bevatten (bijv. quotes, gelijktekens, wiskundige operatoren) maar geen buitenste quotes hebben automatisch tussen quotes (bijv. `Plot[Plot "A"]` wordt `Plot["Plot "A""]`), om renderfouten te voorkomen.
    - **Intermediate Node Fix**: Splitst edges die een tussengelegen nodedefinitie bevatten in twee aparte edges (bijv. `A -- B[...] --> C` wordt `A --> B[...]` en `B[...] --> C`), zodat geldige Mermaid-syntax ontstaat.
    - **Concatenated Label Fix**: Herstelt robuust node-definities waarbij de ID is samengevoegd met het label (bijv. `SubdivideSubdivide...` wordt `Subdivide["Subdivide..."]`), zelfs wanneer er pipe-labels aan voorafgaan of wanneer de duplicatie niet exact is, door te valideren tegen bekende node-ID's.
    - **Extract Specific Original Text**:
      - Definieer een lijst met vragen in de instellingen.
      - Extraheert letterlijke tekstsegmenten uit de actieve notitie die deze vragen beantwoorden.
      - **Merged Query Mode**: Optie om alle vragen in één API-call te verwerken voor meer efficiëntie.
      - **Translation**: Optie om vertalingen van de geëxtraheerde tekst in de output op te nemen.
      - **Custom Output**: Configureerbaar opslagpad en bestandsnaamsuffix voor het geëxtraheerde tekstbestand.
- **LLM Connection Test**: Verifieer de API-instellingen voor de actieve provider.

## Installatie

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Vanuit de Obsidian Marketplace (aanbevolen)
1. Open in Obsidian **Settings** -> **Community plugins**.
2. Controleer of "Restricted mode" **uit** staat.
3. Klik op **Browse** bij community plugins en zoek naar "Notemd".
4. Klik op **Install**.
5. Klik na de installatie op **Enable**.

### Handmatige installatie
1. Download de nieuwste releasebestanden van de [GitHub Releases-pagina](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Elke release bevat ook `README.md` als verpakte referentie, maar voor handmatige installatie zijn alleen `main.js`, `styles.css` en `manifest.json` nodig.
2. Navigeer naar de configuratiemap van je Obsidian-vault: `<YourVault>/.obsidian/plugins/`.
3. Maak een nieuwe map met de naam `notemd`.
4. Kopieer `main.js`, `styles.css` en `manifest.json` naar de map `notemd`.
5. Start Obsidian opnieuw.
6. Ga naar **Settings** -> **Community plugins** en schakel "Notemd" in.

## Configuratie

Toegang tot de plugininstellingen via:
**Settings** -> **Community Plugins** -> **Notemd** (klik op het tandwielpictogram).

### LLM-aanbiederconfiguratie
1. **Actieve provider**: Selecteer in de dropdown de LLM-provider die je wilt gebruiken.
2. **Providerinstellingen**: Configureer de specifieke instellingen voor de gekozen provider:
   - **API Key**: Vereist voor de meeste cloudproviders (bijv. OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Niet nodig voor Ollama. Optioneel voor LM Studio en de generieke preset `OpenAI Compatible` wanneer je eindpunt anonieme of placeholdertoegang accepteert.
   - **Base URL / Endpoint**: Het API-eindpunt voor de dienst. Standaarden worden meegeleverd, maar je moet dit mogelijk aanpassen voor lokale modellen (LMStudio, Ollama), gateways (OpenRouter, Requesty, OpenAI Compatible) of specifieke Azure-deployments. **Vereist voor Azure OpenAI.**
   - **Model**: De specifieke modelnaam/model-ID die gebruikt moet worden (bijv. `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Zorg ervoor dat het model beschikbaar is op je eindpunt/provider.
   - **Temperature**: Bepaalt de willekeur van de LLM-output (0 = deterministisch, 1 = maximale creativiteit). Lagere waarden (bijv. 0.2-0.5) zijn meestal beter voor gestructureerde taken.
   - **API Version (Azure Only)**: Vereist voor Azure OpenAI-deployments (bijv. `2024-02-15-preview`).
3. **Verbinding testen**: Gebruik de knop "Verbinding testen" voor de actieve provider om je instellingen te controleren. OpenAI-compatibele providers gebruiken nu providerbewuste checks: eindpunten zoals `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` en `OpenAI Compatible` testen direct `chat/completions`, terwijl providers met een betrouwbaar `/models`-eindpunt nog steeds eerst modellisting kunnen gebruiken. Als de eerste probe faalt door een tijdelijke netwerkonderbreking zoals `ERR_CONNECTION_CLOSED`, schakelt Notemd automatisch over op de stabiele retry-sequentie in plaats van direct te falen.
4. **Providerconfiguraties beheren**: Gebruik de knoppen "Export Providers" en "Import Providers" om je LLM-providerinstellingen op te slaan/in te laden naar/van een bestand `notemd-providers.json` in de configuratiemap van de plugin. Zo kun je ze eenvoudig back-uppen en delen.
5. **Presetdekking**: Naast de oorspronkelijke providers bevat Notemd nu presetvermeldingen voor `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` en een generiek `OpenAI Compatible`-doel voor LiteLLM, vLLM, Perplexity, Vercel AI Gateway of aangepaste proxies.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-modelconfiguratie
- **Gebruik verschillende providers voor taken**:
  - **Uitgeschakeld (standaard)**: Gebruikt de enkele "actieve provider" (hierboven geselecteerd) voor alle taken.
  - **Ingeschakeld**: Laat je voor elke taak een specifieke provider kiezen en optioneel de modelnaam overschrijven ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). Als het override-veld voor het model van een taak leeg blijft, wordt het standaardmodel gebruikt dat is geconfigureerd voor de provider die voor die taak is gekozen.
- **Selecteer verschillende talen voor verschillende taken**:
  - **Uitgeschakeld (standaard)**: Gebruikt één uitvoertaal voor alle taken.
  - **Ingeschakeld**: Laat je voor elke taak een specifieke taal kiezen ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Taalarchitectuur (interfacetaal en taakuitvoertaal)

- **Interfacetaal** stuurt alleen de tekst van de plugininterface aan (instellingslabels, zijbalkknoppen, meldingen en dialoogvensters). De standaardmodus `auto` volgt de huidige UI-taal van Obsidian.
- Regionale of schriftsysteemvarianten worden nu gekoppeld aan de dichtstbijzijnde gepubliceerde catalogus in plaats van direct terug te vallen op Engels. Bijvoorbeeld: `fr-CA` gebruikt Frans, `es-419` gebruikt Spaans, `pt-PT` gebruikt Portugees, `zh-Hans` gebruikt vereenvoudigd Chinees en `zh-Hant-HK` gebruikt traditioneel Chinees.
- **Taakuitvoertaal** bepaalt de door het model gegenereerde taakoutput (links, samenvattingen, titelgeneratie, Mermaid-samenvatting, conceptextractie, vertaaldoel).
- **Per-task language mode** laat elke taak zijn eigen outputtaal bepalen vanuit één uniforme beleidslaag in plaats van verspreide overrides per module.
- **Automatische vertaling uitschakelen** houdt niet-Translate-taken in de taalcontext van de bron, terwijl expliciete Translate-taken nog steeds de geconfigureerde doeltaal afdwingen.
- Mermaid-gerelateerde generatiepaden volgen hetzelfde taalbeleid en kunnen, wanneer ingeschakeld, nog steeds Mermaid auto-fix activeren.

### Instellingen voor stabiele API-calls
- **Schakel stabiele API-aanroepen in (retry-logica)**:
  - **Uitgeschakeld (standaard)**: Een enkele mislukte API-call stopt de huidige taak.
  - **Ingeschakeld**: Probeert mislukte LLM API-calls automatisch opnieuw (handig bij intermitterende netwerkproblemen of rate limits).
  - **Connection Test Fallback**: Zelfs wanneer normale calls niet al in stabiele modus draaien, schakelen providerverbindingstests nu naar dezelfde retry-sequentie na de eerste tijdelijke netwerkfout.
  - **Runtime Transport Fallback (Environment-Aware)**: Langlopende taakrequests die tijdelijk door `requestUrl` worden afgebroken, proberen dezelfde poging nu eerst opnieuw via een omgevingbewuste fallback. Desktopbuilds gebruiken Node `http/https`; niet-desktopomgevingen gebruiken browser-`fetch`. Die fallbackpogingen gebruiken nu protocolbewuste stream-parsing voor ingebouwde LLM-paden, inclusief OpenAI-compatibele SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE en Ollama NDJSON-output, zodat trage gateways eerder bodychunks kunnen teruggeven. De overige directe OpenAI-stijl providerpaden hergebruiken hetzelfde gedeelde fallbackpad.
  - **OpenAI-Compatible Stable Order**: In stabiele modus volgt elke OpenAI-compatibele poging nu `direct streaming -> direct non-stream -> requestUrl (met streamed fallback indien nodig)` voordat een poging als mislukt telt. Dat voorkomt overdreven agressieve failures wanneer slechts één transportmodus instabiel is.
- **Retry Interval (seconds)**: (Alleen zichtbaar wanneer ingeschakeld) Wachttijd tussen retry-pogingen (1-300 seconden). Standaard: 5.
- **Maximum Retries**: (Alleen zichtbaar wanneer ingeschakeld) Maximaal aantal retry-pogingen (0-10). Standaard: 3.
- **API-foutopsporingsmodus**:
  - **Uitgeschakeld (standaard)**: Gebruikt standaard, beknopte foutmeldingen.
  - **Ingeschakeld**: Activeert gedetailleerde foutlogging (vergelijkbaar met de uitgebreide output van DeepSeek) voor alle providers en taken (inclusief Translate, Search en Connection Tests). Dit bevat HTTP-statuscodes, ruwe responstekst, request-transporttijdlijnen, geschoonde request-URL's en headers, duur per poging, response-headers, gedeeltelijke response-bodies, geparseerde gedeeltelijke streamoutput en stack traces, wat cruciaal is voor troubleshooting van API-verbindingsproblemen en resets van upstream-gateways.
- **Developer Mode**:
  - **Uitgeschakeld (standaard)**: Verbergt alle diagnostische controls voor developers voor normale gebruikers.
  - **Ingeschakeld**: Toont een apart developer-diagnostics-paneel in de instellingen.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Kies het runtimepad per probe. OpenAI-compatibele providers ondersteunen extra geforceerde modi (`direct streaming`, `direct buffered`, `requestUrl-only`) naast runtime-modi.
  - **Run Diagnostic**: Voert één long-request-probe uit met de geselecteerde callmodus en schrijft `Notemd_Provider_Diagnostic_*.txt` weg in de root van de vault.
  - **Run Stability Test**: Herhaalt de probe voor een configureerbaar aantal runs (1-10) met de geselecteerde callmodus en slaat een geaggregeerd stabiliteitsrapport op.
  - **Diagnostic Timeout**: Configureerbare timeout per run (15-3600 seconden).
  - **Why Use It**: Sneller dan handmatig reproduceren wanneer een provider "Test connection" doorstaat maar faalt op echte langlopende taken (bijvoorbeeld vertaling via trage gateways).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Algemene instellingen

#### Uitvoer van verwerkt bestand
- **Customize Processed File Save Path**:
  - **Uitgeschakeld (standaard)**: Verwerkte bestanden (bijv. `YourNote_processed.md`) worden in **dezelfde map** opgeslagen als de oorspronkelijke notitie.
  - **Ingeschakeld**: Laat je een aangepaste opslaglocatie opgeven.
- **Processed File Folder Path**: (Alleen zichtbaar wanneer hierboven ingeschakeld) Voer een **relatief pad** binnen je vault in (bijv. `Processed Notes` of `Output/LLM`) waar verwerkte bestanden moeten worden opgeslagen. Mappen worden aangemaakt als ze niet bestaan. **Gebruik geen absolute paden (zoals C:\...) en geen ongeldige tekens.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Uitgeschakeld (standaard)**: Verwerkte bestanden die zijn gemaakt door de opdracht 'Add Links' gebruiken de standaard `_processed.md`-suffix (bijv. `YourNote_processed.md`).
  - **Ingeschakeld**: Laat je de uitvoerbestandsnaam aanpassen met de instelling hieronder.
- **Custom Suffix/Replacement String**: (Alleen zichtbaar wanneer hierboven ingeschakeld) Voer de string in die je voor de uitvoerbestandsnaam wilt gebruiken.
  - Als dit **leeg** blijft, wordt het oorspronkelijke bestand **overschreven** met de verwerkte inhoud.
  - Als je een string invoert (bijv. `_linked`), wordt die aan de oorspronkelijke basisnaam toegevoegd (bijv. `YourNote_linked.md`). Zorg ervoor dat de suffix geen ongeldige bestandsnaamtekens bevat.

- **Remove Code Fences on Add Links**:
  - **Uitgeschakeld (standaard)**: Code fences **(\`\`\`)** blijven in de inhoud aanwezig bij het toevoegen van links, en **(\`\`\`markdown)** wordt automatisch verwijderd.
  - **Ingeschakeld**: Verwijdert code fences uit de inhoud voordat links worden toegevoegd.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Uitvoer van conceptnotitie
- **Customize Concept Note Path**:
  - **Uitgeschakeld (standaard)**: Automatisch aanmaken van notities voor `[[linked concepts]]` is uitgeschakeld.
  - **Ingeschakeld**: Laat je een map opgeven waarin nieuwe conceptnotities worden aangemaakt.
- **Concept Note Folder Path**: (Alleen zichtbaar wanneer hierboven ingeschakeld) Voer een **relatief pad** binnen je vault in (bijv. `Concepts` of `Generated/Topics`) waar nieuwe conceptnotities moeten worden opgeslagen. Mappen worden aangemaakt als ze niet bestaan. **Moet ingevuld zijn als aanpassing is ingeschakeld.** **Gebruik geen absolute paden of ongeldige tekens.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Uitvoer van conceptlogbestand
- **Generate Concept Log File**:
  - **Uitgeschakeld (standaard)**: Er wordt geen logbestand gegenereerd.
  - **Ingeschakeld**: Maakt na verwerking een logbestand aan met een lijst van nieuw aangemaakte conceptnotities. Het formaat is:
    ```
    genereer xx concept-md-bestanden
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: (Alleen zichtbaar wanneer "Generate Concept Log File" is ingeschakeld)
  - **Uitgeschakeld (standaard)**: Het logbestand wordt opgeslagen in de **Concept Note Folder Path** (indien opgegeven) of anders in de root van de vault.
  - **Ingeschakeld**: Laat je een aangepaste map voor het logbestand opgeven.
- **Concept Log Folder Path**: (Alleen zichtbaar wanneer "Customize Log File Save Path" is ingeschakeld) Voer een **relatief pad** binnen je vault in (bijv. `Logs/Notemd`) waar het logbestand moet worden opgeslagen. **Moet ingevuld zijn als aanpassing is ingeschakeld.**
- **Customize Log File Name**: (Alleen zichtbaar wanneer "Generate Concept Log File" is ingeschakeld)
  - **Uitgeschakeld (standaard)**: Het logbestand heet `Generate.log`.
  - **Ingeschakeld**: Laat je een aangepaste naam voor het logbestand opgeven.
- **Concept Log File Name**: (Alleen zichtbaar wanneer "Customize Log File Name" is ingeschakeld) Voer de gewenste bestandsnaam in (bijv. `ConceptCreation.log`). **Moet ingevuld zijn als aanpassing is ingeschakeld.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Taak 'Concepten extraheren'
- **Minimale conceptnotities maken**:
  - **On (Default)**: Nieuw aangemaakte conceptnotities bevatten alleen de titel (bijv. `# Concept`).
  - **Off**: Conceptnotities kunnen extra inhoud bevatten, zoals een backlink "Linked From", tenzij dit is uitgeschakeld met de instelling hieronder.
- **Add "Linked From" backlink**:
  - **Off (Default)**: Voegt tijdens extractie geen backlink naar het bronbestand toe in de conceptnotitie.
  - **On**: Voegt een sectie "Linked From" toe met een backlink naar het bronbestand.

#### Specifieke oorspronkelijke tekst extraheren
- **Questions for extraction**: Voer een lijst vragen in (één per regel) waarvoor je wilt dat de AI letterlijke antwoorden uit je notities extraheert.
- **Translate output to corresponding language**:
  - **Off (Default)**: Geeft alleen de geëxtraheerde tekst in de oorspronkelijke taal weer.
  - **On**: Voegt een vertaling van de geëxtraheerde tekst toe in de taal die voor deze taak is geselecteerd.
- **Merged query mode**:
  - **Off**: Verwerkt elke vraag afzonderlijk (hogere precisie, maar meer API-calls).
  - **On**: Verstuurt alle vragen in één prompt (sneller en minder API-calls).
- **Customise extracted text save path & filename**:
  - **Off**: Slaat op in dezelfde map als het oorspronkelijke bestand met de suffix `_Extracted`.
  - **On**: Laat je een aangepaste uitvoermap en bestandsnaamsuffix opgeven.

#### Batchgewijze Mermaid-correctie
- **Enable Mermaid Error Detection**:
  - **Off (Default)**: Foutdetectie wordt na verwerking overgeslagen.
  - **On**: Scant verwerkte bestanden op overgebleven Mermaid-syntaxfouten en genereert een rapport `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: Bestanden met fouten blijven staan waar ze zijn.
  - **On**: Verplaatst bestanden die na de fixpoging nog Mermaid-syntaxfouten bevatten naar een aparte map voor handmatige review.
- **Mermaid error folder path**: (Zichtbaar als bovenstaande is ingeschakeld) De map waar foutbestanden naartoe worden verplaatst.

#### Verwerkingsparameters
- **Enable Batch Parallelism**:
  - **Uitgeschakeld (standaard)**: Batchtaken (zoals "Process Folder" of "Batch Generate from Titles") verwerken bestanden één voor één (serieel).
  - **Ingeschakeld**: Laat de plugin meerdere bestanden gelijktijdig verwerken, wat grote batchjobs aanzienlijk kan versnellen.
- **Batch Concurrency**: (Alleen zichtbaar wanneer parallelisme is ingeschakeld) Stelt het maximale aantal bestanden in dat parallel mag worden verwerkt. Een hoger getal kan sneller zijn, maar gebruikt meer resources en kan API-rate-limits raken. (Standaard: 1, bereik: 1-20)
- **Batch Size**: (Alleen zichtbaar wanneer parallelisme is ingeschakeld) Het aantal bestanden dat in één batch wordt gegroepeerd. (Standaard: 50, bereik: 10-200)
- **Delay Between Batches (ms)**: (Alleen zichtbaar wanneer parallelisme is ingeschakeld) Een optionele vertraging in milliseconden tussen batches, wat kan helpen bij het omgaan met API-rate-limits. (Standaard: 1000 ms)
- **API Call Interval (ms)**: Minimale vertraging in milliseconden **voor en na** elke individuele LLM API-call. Cruciaal voor API's met een lage rate of om 429-fouten te voorkomen. Stel in op 0 voor geen kunstmatige vertraging. (Standaard: 500 ms)
- **Chunk Word Count**: Maximaal aantal woorden per chunk dat naar de LLM wordt gestuurd. Beinvloedt het aantal API-calls voor grote bestanden. (Standaard: 3000)
- **Enable Duplicate Detection**: Zet de basiscontrole op dubbele woorden in verwerkte inhoud aan of uit (resultaten in console). (Standaard: ingeschakeld)
- **Max Tokens**: Maximum aantal tokens dat de LLM per responsechunk mag genereren. Beinvloedt kosten en detailniveau. (Standaard: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Vertaling
- **Default Target Language**: Selecteer de standaardtaal waarin je je notities wilt vertalen. Dit kan in de UI worden overschreven wanneer je de vertaalopdracht uitvoert. (Standaard: Engels)
- **Customise Translation File Save Path**:
  - **Uitgeschakeld (standaard)**: Vertaalde bestanden worden opgeslagen in **dezelfde map** als de oorspronkelijke notitie.
  - **Ingeschakeld**: Laat je een **relatief pad** binnen je vault opgeven (bijv. `Translations`) waar vertaalde bestanden moeten worden opgeslagen. Mappen worden aangemaakt als ze niet bestaan.
- **Use custom suffix for translated files**:
  - **Uitgeschakeld (standaard)**: Vertaalde bestanden gebruiken de standaard `_translated.md`-suffix (bijv. `YourNote_translated.md`).
  - **Ingeschakeld**: Laat je een aangepaste suffix opgeven.
- **Custom Suffix**: (Alleen zichtbaar wanneer hierboven ingeschakeld) Voer de aangepaste suffix in die moet worden toegevoegd aan vertaalde bestandsnamen (bijv. `_es` of `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Inhoudsgeneratie
- **Enable Research in "Generate from Title"**:
  - **Uitgeschakeld (standaard)**: "Generate from Title" gebruikt alleen de titel als input.
  - **Ingeschakeld**: Voert webonderzoek uit met de geconfigureerde **Web Research Provider** en gebruikt de gevonden informatie als context voor de LLM tijdens generatie op basis van de titel.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Ingeschakeld (standaard)**: Voert automatisch een Mermaid-syntaxfix uit na Mermaid-gerelateerde workflows zoals Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid en Translate.
  - **Disabled**: Laat gegenereerde Mermaid-output ongemoeid, tenzij je `Batch Mermaid Fix` handmatig uitvoert of toevoegt aan een aangepaste workflow.
- **Output Language**: (Nieuw) Selecteer de gewenste outputtaal voor de taken "Generate from Title" en "Batch Generate from Title".
  - **English (Default)**: Prompts worden verwerkt en output wordt geproduceerd in het Engels.
  - **Other Languages**: De LLM krijgt de instructie om te redeneren in het Engels maar de uiteindelijke documentatie te geven in je geselecteerde taal (bijv. Espanol, Francais,简体中文, 繁體中文, العربية, हिन्दी, enz.).
- **Change Prompt Word**: (Nieuw)
  - **Change Prompt Word**: Hiermee kun je het promptwoord voor een specifieke taak wijzigen.
  - **Custom Prompt Word**: Voer je aangepaste promptwoord voor de taak in.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Uitgeschakeld (standaard)**: Succesvol gegenereerde bestanden worden verplaatst naar een submap met de naam `[OriginalFolderName]_complete` ten opzichte van de bovenliggende map van de oorspronkelijke map (of `Vault_complete` als de oorspronkelijke map de root was).
  - **Ingeschakeld**: Laat je een aangepaste naam opgeven voor de submap waar voltooide bestanden naartoe worden verplaatst.
- **Custom Output Folder Name**: (Alleen zichtbaar wanneer hierboven ingeschakeld) Voer de gewenste naam in voor de submap (bijv. `Generated Content`, `_complete`). Ongeldige tekens zijn niet toegestaan. Standaard `_complete` wanneer leeg. Deze map wordt aangemaakt ten opzichte van de bovenliggende map van de oorspronkelijke map.

#### Workflowknoppen met één klik
- **Visual Workflow Builder**: Maak aangepaste workflowknoppen op basis van ingebouwde acties zonder de DSL met de hand te schrijven.
- **Custom Workflow Buttons DSL**: Gevorderde gebruikers kunnen de definitietekst van workflows nog steeds direct bewerken. Ongeldige DSL valt veilig terug op de standaardworkflow en toont een waarschuwing in de zijbalk/UI van de instellingen.
- **Workflow Error Strategy**:
  - **Stop on Error (Default)**: Stopt de workflow direct wanneer één stap faalt.
  - **Continue on Error**: Gaat door met latere stappen en rapporteert aan het einde het aantal mislukte acties.
- **Default Workflow Included**: `One-Click Extract` koppelt `Process File (Add Links)`, `Batch Generate from Titles` en `Batch Mermaid Fix`.

#### Instellingen voor aangepaste instructies
Met deze functie kun je de standaardinstructies (prompts) die naar de LLM worden gestuurd voor specifieke taken overschrijven, zodat je fijnmazige controle hebt over de output.

- **Enable Custom Prompts for Specific Tasks**:
  - **Uitgeschakeld (standaard)**: De plugin gebruikt voor alle bewerkingen de ingebouwde standaardprompts.
  - **Ingeschakeld**: Activeert de mogelijkheid om aangepaste prompts in te stellen voor de hieronder genoemde taken. Dit is de hoofdschakelaar voor deze functie.

- **Use Custom Prompt for [Task Name]**: (Alleen zichtbaar wanneer bovenstaande is ingeschakeld)
  - Voor elke ondersteunde taak ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts") kun je je aangepaste prompt afzonderlijk in- of uitschakelen.
  - **Disabled**: Deze specifieke taak gebruikt de standaardprompt.
  - **Ingeschakeld**: Deze taak gebruikt de tekst die jij invult in het corresponderende tekstgebied "Custom Prompt".

- **Custom Prompt Text Area**: (Alleen zichtbaar wanneer de aangepaste prompt voor een taak is ingeschakeld)
  - **Default Prompt Display**: Ter referentie toont de plugin de standaardprompt die normaal voor deze taak zou worden gebruikt. Je kunt de knop **"Copy Default Prompt"** gebruiken om deze tekst te kopiëren als startpunt voor je eigen prompt.
  - **Custom Prompt Input**: Hier schrijf je je eigen instructies voor de LLM.
  - **Placeholders**: Je kunt en moet speciale placeholders in je prompt gebruiken. De plugin vervangt die vóór verzending door echte inhoud. Raadpleeg de standaardprompt om te zien welke placeholders voor elke taak beschikbaar zijn. Veelgebruikte placeholders zijn onder meer:
    - `{TITLE}`: De titel van de huidige notitie.
    - `{RESEARCH_CONTEXT_SECTION}`: De inhoud die is verzameld via webonderzoek.
    - `{USER_PROMPT}`: De inhoud van de notitie die wordt verwerkt.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Reikwijdte van duplicaatcontrole
- **Duplicate Check Scope Mode**: Bepaalt welke bestanden worden vergeleken met de notities in je Concept Note Folder op mogelijke duplicaten.
  - **Entire Vault (Default)**: Vergelijkt conceptnotities met alle andere notities in de vault (behalve de Concept Note Folder zelf).
  - **Include Specific Folders Only**: Vergelijkt conceptnotities alleen met notities in de hieronder opgegeven mappen.
  - **Exclude Specific Folders**: Vergelijkt conceptnotities met alle notities **behalve** de notities in de hieronder opgegeven mappen (en exclusief de Concept Note Folder).
  - **Concept Folder Only**: Vergelijkt conceptnotities alleen met **andere notities binnen de Concept Note Folder**. Dit helpt om duplicaten puur binnen je gegenereerde concepten te vinden.
- **Include/Exclude Folders**: (Alleen zichtbaar wanneer Mode op 'Include' of 'Exclude' staat) Voer de **relatieve paden** in van de mappen die je wilt opnemen of uitsluiten, **één pad per regel**. Paden zijn hoofdlettergevoelig en gebruiken `/` als scheidingsteken (bijv. `Reference Material/Papers` of `Daily Notes`). Deze mappen mogen niet gelijk zijn aan of binnen de Concept Note Folder liggen.

#### Webonderzoeksaanbieder
- **Search Provider**: Kies tussen `Tavily` (API-sleutel vereist, aanbevolen) en `DuckDuckGo` (experimenteel, wordt vaak geblokkeerd door de zoekmachine bij geautomatiseerde requests). Gebruikt voor "Research & Summarize Topic" en optioneel voor "Generate from Title".
- **Tavily API Key**: (Alleen zichtbaar als Tavily is geselecteerd) Voer je API-sleutel in van [tavily.com](https://tavily.com/).
- **Tavily Max Results**: (Alleen zichtbaar als Tavily is geselecteerd) Maximum aantal zoekresultaten dat Tavily mag teruggeven (1-20). Standaard: 5.
- **Tavily Search Depth**: (Alleen zichtbaar als Tavily is geselecteerd) Kies `basic` (standaard) of `advanced`. Let op: `advanced` geeft betere resultaten maar kost 2 API-credits per zoekopdracht in plaats van 1.
- **DuckDuckGo Max Results**: (Alleen zichtbaar als DuckDuckGo is geselecteerd) Maximum aantal zoekresultaten om te parsen (1-10). Standaard: 5.
- **DuckDuckGo Content Fetch Timeout**: (Alleen zichtbaar als DuckDuckGo is geselecteerd) Maximum aantal seconden om te wachten bij het ophalen van inhoud van elke DuckDuckGo-resultaat-URL. Standaard: 15.
- **Max Research Content Tokens**: Benaderend maximum aantal tokens uit gecombineerde webonderzoeksresultaten (snippets/opgehaalde inhoud) dat in de samenvattingsprompt wordt opgenomen. Helpt de grootte van het contextvenster en kosten te beheersen. (Standaard: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Gericht leerdomein
- **Enable Focused Learning Domain**:
  - **Uitgeschakeld (standaard)**: Prompts die naar de LLM worden gestuurd gebruiken de standaard algemene instructies.
  - **Ingeschakeld**: Laat je één of meer vakgebieden opgeven om het contextuele begrip van de LLM te verbeteren.
- **Learning Domain**: (Alleen zichtbaar wanneer bovenstaande is ingeschakeld) Voer je specifieke vakgebied(en) in, bijvoorbeeld 'Materials Science', 'Polymer Physics', 'Machine Learning'. Hierdoor wordt een regel "Relevant Fields: [...]" aan het begin van prompts toegevoegd, zodat de LLM nauwkeurigere en relevantere links en inhoud kan genereren voor jouw studiegebied.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Gebruikshandleiding

### Snelle werkstromen en zijbalk

- Open de Notemd-zijbalk om gegroepeerde actiesecties te zien voor core processing, generation, translation, knowledge en utilities.
- Gebruik het gebied **Snelle workflows** bovenaan de zijbalk om aangepaste meerstapsknoppen te starten.
- De standaardworkflow **One-Click Extract** voert `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix` uit.
- Workflowvoortgang, logs per stap en failures worden in de zijbalk getoond, met een vastgepinde footer die voorkomt dat de voortgangsbalk en het loggebied door uitgeklapte secties worden weggedrukt.
- De voortgangskaart houdt statustekst, een aparte percentagepil en resterende tijd in één oogopslag leesbaar, en dezelfde aangepaste workflows kunnen opnieuw vanuit de instellingen worden geconfigureerd.

### Oorspronkelijke verwerking (wiki-links toevoegen)
Dit is de kernfunctionaliteit, gericht op het identificeren van concepten en het toevoegen van `[[wiki-links]]`.

**Belangrijk:** Dit proces werkt alleen met `.md`- of `.txt`-bestanden. Je kunt PDF-bestanden gratis naar MD-bestanden omzetten met [Mineru](https://github.com/opendatalab/MinerU) voordat je ze verder verwerkt.

1. **Via de zijbalk**:
   - Open de Notemd-zijbalk (toverstafpictogram of command palette).
   - Open het `.md`- of `.txt`-bestand.
   - Klik op **"Process File (Add Links)"**.
   - Om een map te verwerken: klik op **"Process Folder (Add Links)"**, selecteer de map en klik op "Process".
   - De voortgang wordt getoond in de zijbalk. Je kunt de taak annuleren met de knop "Cancel Processing" in de zijbalk.
   - *Opmerking voor mapverwerking:* Bestanden worden op de achtergrond verwerkt zonder in de editor geopend te worden.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Via het command palette** (`Ctrl+P` of `Cmd+P`):
   - **Enkel bestand**: Open het bestand en voer `Notemd: Process Current File` uit.
   - **Map**: Voer `Notemd: Process Folder` uit en selecteer daarna de map. Bestanden worden op de achtergrond verwerkt zonder in de editor te worden geopend.
   - Er verschijnt een voortgangsvenster voor acties vanuit het command palette, inclusief annuleerknop.
   - *Opmerking:* de plugin verwijdert automatisch leidende `\boxed{`- en afsluitende `}`-regels als die in de uiteindelijke verwerkte inhoud voorkomen voordat deze wordt opgeslagen.

### Nieuwe functies

1. **Vat samen als Mermaid-diagram**:
   - Open de notitie die je wilt samenvatten.
   - Voer de opdracht `Notemd: Summarise as Mermaid diagram` uit (via het command palette of de zijbalkknop).
   - De plugin genereert een nieuwe notitie met het Mermaid-diagram.

2. **Translate Note/Selection**:
   - Selecteer tekst in een notitie om alleen die selectie te vertalen, of start de opdracht zonder selectie om de volledige notitie te vertalen.
   - Voer de opdracht `Notemd: Translate Note/Selection` uit (via het command palette of de zijbalkknop).
   - Er verschijnt een venster waarin je de **Target Language** kunt bevestigen of wijzigen (standaard de taal uit de configuratie).
   - De plugin gebruikt de geconfigureerde **LLM Provider** (op basis van de Multi-Model-instellingen) om de vertaling uit te voeren.
   - De vertaalde inhoud wordt opgeslagen in de geconfigureerde **Translation Save Path** met de juiste suffix, en geopend in een **nieuw paneel rechts** van de oorspronkelijke inhoud voor eenvoudig vergelijken.
   - Je kunt deze taak annuleren via de zijbalkknop of de annuleerknop in het venster.
3. **Batchvertaling**:
   - Voer de opdracht `Notemd: Batch Translate Folder` uit via het command palette en selecteer een map, of klik met rechts op een map in de bestandsverkenner en kies "Batch translate this folder".
   - De plugin vertaalt alle Markdown-bestanden in de geselecteerde map.
   - Vertaalde bestanden worden opgeslagen op het geconfigureerde vertaalpad maar niet automatisch geopend.
   - Dit proces kan worden geannuleerd via het voortgangsvenster.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Selecteer tekst in een notitie OF zorg dat de notitie een titel heeft (die wordt dan het zoekonderwerp).
   - Voer de opdracht `Notemd: Research and Summarize Topic` uit (via het command palette of de zijbalkknop).
   - De plugin gebruikt de geconfigureerde **Search Provider** (Tavily/DuckDuckGo) en de juiste **LLM Provider** (op basis van de Multi-Model-instellingen) om informatie te vinden en samen te vatten.
   - De samenvatting wordt aan de huidige notitie toegevoegd.
   - Je kunt deze taak annuleren via de zijbalkknop of de annuleerknop in het venster.
   - *Opmerking:* DuckDuckGo-zoekopdrachten kunnen falen door botdetectie. Tavily wordt aanbevolen.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Open een notitie (deze mag leeg zijn).
   - Voer de opdracht `Notemd: Generate Content from Title` uit (via het command palette of de zijbalkknop).
   - De plugin gebruikt de juiste **LLM Provider** (op basis van de Multi-Model-instellingen) om inhoud op basis van de titel van de notitie te genereren en eventuele bestaande inhoud te vervangen.
   - Als de instelling **"Enable Research in 'Generate from Title'"** is ingeschakeld, wordt eerst webonderzoek uitgevoerd (met de geconfigureerde **Web Research Provider**) en wordt die context meegenomen in de prompt die naar de LLM wordt gestuurd.
   - Je kunt deze taak annuleren via de zijbalkknop of de annuleerknop in het venster.

5. **Batch Generate Content from Titles**:
   - Voer de opdracht `Notemd: Batch Generate Content from Titles` uit (via het command palette of de zijbalkknop).
   - Selecteer de map met de notities die je wilt verwerken.
   - De plugin doorloopt elk `.md`-bestand in de map (met uitzondering van `_processed.md`-bestanden en bestanden in de aangewezen "complete"-map), genereert inhoud op basis van de titel van de notitie en vervangt bestaande inhoud. Bestanden worden op de achtergrond verwerkt zonder in de editor te worden geopend.
   - Succesvol verwerkte bestanden worden verplaatst naar de geconfigureerde "complete"-map.
   - Deze opdracht respecteert de instelling **"Enable Research in 'Generate from Title'"** voor elke verwerkte notitie.
   - Je kunt deze taak annuleren via de zijbalkknop of de annuleerknop in het venster.
   - Voortgang en resultaten (aantal gewijzigde bestanden, fouten) worden getoond in het log van de zijbalk/het venster.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Controleer of de **Concept Note Folder Path** correct is geconfigureerd in de instellingen.
   - Voer `Notemd: Check and Remove Duplicate Concept Notes` uit (via het command palette of de zijbalkknop).
   - De plugin scant de conceptnotitiemap en vergelijkt bestandsnamen met notities buiten de map op basis van meerdere regels (exacte match, meervouden, normalisatie, containment).
   - Als mogelijke duplicaten worden gevonden, verschijnt een venster met de bestanden, de reden waarom ze zijn gemarkeerd en de conflicterende bestanden.
   - Controleer de lijst zorgvuldig. Klik op **"Delete Files"** om de vermelde bestanden naar de systeemprullenbak te verplaatsen, of op **"Cancel"** om geen actie te ondernemen.
   - Voortgang en resultaten worden getoond in het log van de zijbalk/het venster.

7. **Extract Concepts (Pure Mode)**:
   - Met deze functie kun je concepten uit een document extraheren en de bijbehorende conceptnotities maken **zonder** het oorspronkelijke bestand te wijzigen. Dat is ideaal om snel je kennisbank te vullen vanuit een set documenten.
   - **Enkel bestand**: Open een bestand en voer de opdracht `Notemd: Extract concepts (create concept notes only)` uit in het command palette, of klik op de knop **"Extract concepts (current file)"** in de zijbalk.
   - **Map**: Voer de opdracht `Notemd: Batch extract concepts from folder` uit in het command palette, of klik op de knop **"Extract concepts (folder)"** in de zijbalk en selecteer daarna een map om alle notities erin te verwerken.
   - De plugin leest de bestanden, identificeert concepten en maakt er nieuwe notities voor aan in je aangewezen **Concept Note Folder**, terwijl de originele bestanden onaangetast blijven.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Deze krachtige opdracht stroomlijnt het proces van het aanmaken en vullen van nieuwe conceptnotities.
   - Selecteer een woord of zin in je editor.
   - Voer de opdracht `Notemd: Create Wiki-Link & Generate Note from Selection` uit (het is aan te raden hier een hotkey voor toe te wijzen, bijvoorbeeld `Cmd+Shift+W`).
   - De plugin doet het volgende:
     1. Vervangt je geselecteerde tekst door een `[[wiki-link]]`.
     2. Controleert of er al een notitie met die titel bestaat in je **Concept Note Folder**.
     3. Als die bestaat, voegt de plugin een backlink toe naar de huidige notitie.
     4. Als die niet bestaat, wordt een nieuwe lege notitie aangemaakt.
     5. Vervolgens wordt automatisch de opdracht **"Generate Content from Title"** uitgevoerd op de nieuwe of bestaande notitie, zodat deze met AI-gegenereerde inhoud wordt gevuld.

9. **Extract Concepts and Generate Titles**:
   - Deze opdracht koppelt twee krachtige functies aan elkaar voor een gestroomlijnde workflow.
   - Voer de opdracht `Notemd: Extract Concepts and Generate Titles` uit via het command palette (het is aan te raden hiervoor een hotkey toe te wijzen).
   - De plugin doet het volgende:
     1. Eerst wordt de taak **"Extract concepts (current file)"** uitgevoerd op het huidige actieve bestand.
     2. Daarna wordt automatisch de taak **"Batch generate from titles"** uitgevoerd op de map die je in de instellingen als **Concept note folder path** hebt geconfigureerd.
   - Zo kun je eerst je kennisbank vullen met nieuwe concepten uit een brondocument en vervolgens die nieuwe conceptnotities meteen met AI-gegenereerde inhoud uitwerken, alles in één stap.

10. **Extract Specific Original Text**:
    - Configureer je vragen in de instellingen onder "Extract Specific Original Text".
    - Gebruik de knop "Extract Specific Original Text" in de zijbalk om het actieve bestand te verwerken.
    - **Merged Mode**: Zorgt voor snellere verwerking door alle vragen in één prompt te verzenden.
    - **Translation**: Vertaalt optioneel de geëxtraheerde tekst naar je geconfigureerde taal.
    - **Custom Output**: Configureer waar en hoe het geëxtraheerde bestand wordt opgeslagen.

11. **Batch Mermaid Fix**:
    - Gebruik de knop "Batch Mermaid Fix" in de zijbalk om een map te scannen en veelvoorkomende Mermaid-syntaxfouten te herstellen.
    - De plugin rapporteert bestanden die nog fouten bevatten in een bestand `mermaid_error_{foldername}.md`.
    - Configureer optioneel dat de plugin deze problematische bestanden naar een aparte map verplaatst voor controle.

## Ondersteunde LLM-aanbieders

| Provider           | Type    | API-sleutel vereist    | Opmerkingen                                                           |
|--------------------|---------|------------------------|------------------------------------------------------------------------|
| DeepSeek           | Cloud   | Ja                     | Native DeepSeek-endpoint met afhandeling voor reasoning-modellen       |
| Qwen               | Cloud   | Ja                     | DashScope compatible-mode-preset voor Qwen / QwQ-modellen             |
| Qwen Code          | Cloud   | Ja                     | DashScope-preset gericht op coding voor Qwen coder-modellen            |
| Doubao             | Cloud   | Ja                     | Volcengine Ark-preset; zet het modelveld meestal op je endpoint-ID     |
| Moonshot           | Cloud   | Ja                     | Officieel Kimi / Moonshot-endpoint                                     |
| GLM                | Cloud   | Ja                     | Officieel Zhipu BigModel OpenAI-compatibel endpoint                    |
| Z AI               | Cloud   | Ja                     | Internationaal GLM/Zhipu OpenAI-compatibel endpoint; aanvulling op `GLM` |
| MiniMax            | Cloud   | Ja                     | Officieel MiniMax chat-completions-endpoint                            |
| Huawei Cloud MaaS  | Cloud   | Ja                     | Huawei ModelArts MaaS OpenAI-compatibel endpoint voor gehoste modellen |
| Baidu Qianfan      | Cloud   | Ja                     | Officieel Qianfan OpenAI-compatibel endpoint voor ERNIE-modellen       |
| SiliconFlow        | Cloud   | Ja                     | Officieel SiliconFlow OpenAI-compatibel endpoint voor gehoste OSS-modellen |
| OpenAI             | Cloud   | Ja                     | Ondersteunt GPT- en o-series-modellen                                  |
| Anthropic          | Cloud   | Ja                     | Ondersteunt Claude-modellen                                            |
| Google             | Cloud   | Ja                     | Ondersteunt Gemini-modellen                                            |
| Mistral            | Cloud   | Ja                     | Ondersteunt Mistral- en Codestral-families                             |
| Azure OpenAI       | Cloud   | Ja                     | Vereist endpoint, API-sleutel, deploymentnaam en API-versie            |
| OpenRouter         | Gateway | Ja                     | Toegang tot veel providers via OpenRouter-model-ID's                   |
| xAI                | Cloud   | Ja                     | Native Grok-endpoint                                                   |
| Groq               | Cloud   | Ja                     | Snelle OpenAI-compatibele inferentie voor gehoste OSS-modellen         |
| Together           | Cloud   | Ja                     | OpenAI-compatibel endpoint voor gehoste OSS-modellen                   |
| Fireworks          | Cloud   | Ja                     | OpenAI-compatibel inferentie-endpoint                                  |
| Requesty           | Gateway | Ja                     | Multi-provider-router achter één API-sleutel                           |
| OpenAI Compatible  | Gateway | Optioneel              | Generieke preset voor LiteLLM, vLLM, Perplexity, Vercel AI Gateway, enz. |
| LMStudio           | Local   | Optioneel (`EMPTY`)    | Draait modellen lokaal via LM Studio-server                            |
| Ollama             | Local   | Nee                    | Draait modellen lokaal via Ollama-server                               |

*Opmerking: voor lokale providers (LMStudio, Ollama) moet de bijbehorende servertoepassing actief zijn en bereikbaar op de geconfigureerde Base URL.*
*Opmerking: voor OpenRouter en Requesty gebruik je de provider-prefixed/volledige modelidentifier die de gateway toont (bijvoorbeeld `google/gemini-flash-1.5` of `anthropic/claude-3-7-sonnet-latest`).*
*Opmerking: `Doubao` verwacht doorgaans een Ark endpoint/deployment-ID in het modelveld in plaats van een ruwe modelfamilienaam. Het instellingenscherm waarschuwt nu wanneer de placeholderwaarde nog aanwezig is en blokkeert verbindingstests totdat je die vervangt door een echte endpoint-ID.*
*Opmerking: `Z AI` richt zich op de internationale lijn `api.z.ai`, terwijl `GLM` het BigModel-endpoint voor mainland China behoudt. Kies de preset die past bij de regio van je account.*
*Opmerking: China-gerichte presets gebruiken chat-first-verbindingstests zodat de test het werkelijk geconfigureerde model/deployment valideert, niet alleen de bereikbaarheid van de API-sleutel.*
*Opmerking: `OpenAI Compatible` is bedoeld voor aangepaste gateways en proxies. Stel Base URL, API-key-beleid en model-ID in volgens de documentatie van je provider.*

## Netwerkgebruik en gegevensverwerking

Notemd draait lokaal in Obsidian, maar sommige functies versturen uitgaande requests.

### LLM-aanbiederoproepen (configureerbaar)

- Trigger: bestandsverwerking, generatie, vertaling, onderzoeksamenvatting, Mermaid-samenvatting en acties voor verbinding/diagnostiek.
- Endpoint: je geconfigureerde provider-Base URL(s) in de Notemd-instellingen.
- Verzonden data: prompttekst en taakinhoud die nodig zijn voor verwerking.
- Opmerking over gegevensverwerking: API-sleutels worden lokaal in de plugininstellingen geconfigureerd en gebruikt om requests vanaf jouw apparaat te ondertekenen.

### Webonderzoek-calls (optioneel)

- Trigger: wanneer webonderzoek is ingeschakeld en een zoekprovider is geselecteerd.
- Endpoint: Tavily API of DuckDuckGo-endpoints.
- Verzonden data: je onderzoeksquery en vereiste requestmetadata.

### Ontwikkelaarsdiagnostiek en foutopsporingslogboeken (optioneel)

- Trigger: API-debugmodus en diagnostische acties voor developers.
- Opslag: diagnostische en foutlogs worden opgeslagen in de root van je vault (bijvoorbeeld `Notemd_Provider_Diagnostic_*.txt` en `Notemd_Error_Log_*.txt`).
- Risico-opmerking: logs kunnen fragmenten van requests/responses bevatten. Controleer logs voordat je ze publiek deelt.

### Lokale opslag

- Pluginconfiguratie wordt opgeslagen in `.obsidian/plugins/notemd/data.json`.
- Gegenereerde bestanden, rapporten en optionele logs worden volgens jouw instellingen in je vault opgeslagen.

## Probleemoplossing

### Veelvoorkomende problemen
- **Plugin laadt niet**: Controleer of `manifest.json`, `main.js` en `styles.css` in de juiste map staan (`<Vault>/.obsidian/plugins/notemd/`) en start Obsidian opnieuw. Controleer de Developer Console (`Ctrl+Shift+I` of `Cmd+Option+I`) op fouten bij het opstarten.
- **Verwerkingsfouten / API-fouten**:
  1. **Controleer het bestandsformaat**: Zorg ervoor dat het bestand dat je wilt verwerken of controleren een extensie `.md` of `.txt` heeft. Notemd ondersteunt momenteel alleen deze tekstgebaseerde formaten.
  2. Gebruik de opdracht/knop "Test LLM Connection" om de instellingen van de actieve provider te verifiëren.
  3. Controleer API Key, Base URL, Model Name en API Version (voor Azure) opnieuw. Zorg dat de API-sleutel correct is en voldoende credits/rechten heeft.
  4. Zorg ervoor dat je lokale LLM-server (LMStudio, Ollama) actief is en dat de Base URL correct is (bijv. `http://localhost:1234/v1` voor LMStudio).
  5. Controleer je internetverbinding voor cloudproviders.
  6. **Voor fouten bij verwerking van één bestand:** Bekijk de Developer Console voor gedetailleerde foutmeldingen. Kopieer ze desgewenst met de knop in het foutvenster.
  7. **Voor batchverwerkingsfouten:** Controleer het bestand `error_processing_filename.log` in de root van je vault voor gedetailleerde foutmeldingen per mislukt bestand. De Developer Console of het foutvenster toont mogelijk alleen een samenvatting of een algemene batchfout.
  8. **Automatische foutlogs:** Als een proces faalt, slaat de plugin automatisch een gedetailleerd logbestand met de naam `Notemd_Error_Log_[Timestamp].txt` op in de root van je vault. Dit bestand bevat de foutmelding, stack trace en sessielogs. Als je hardnekkige problemen hebt, controleer dan dit bestand. Door "API Error Debugging Mode" in de instellingen in te schakelen, wordt dit log gevuld met nog gedetailleerdere API-responsgegevens.
  9. **Diagnostiek van echte endpoints voor long requests (developer)**:
     - In-plugin pad (eerst aanbevolen): gebruik **Settings -> Notemd -> Developer provider diagnostic (long request)** om een runtimeprobe op de actieve provider uit te voeren en `Notemd_Provider_Diagnostic_*.txt` in de root van de vault te genereren.
     - CLI-pad (buiten de Obsidian-runtime): gebruik voor reproduceerbare vergelijking op endpointniveau tussen buffered en streaming-gedrag:
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
       Het gegenereerde rapport bevat timing per poging (`First Byte`, `Duration`), geschoonde requestmetadata, response-headers, ruwe/gedeeltelijke bodyfragmenten, geparseerde streamfragmenten en de precieze punten waar transportfouten optreden.
- **LM Studio/Ollama-verbindingsproblemen**:
  - **Verbindingstest faalt**: Controleer of de lokale server (LM Studio of Ollama) actief is en of het juiste model geladen/beschikbaar is.
  - **CORS-fouten (Ollama op Windows)**: Als je CORS-fouten (Cross-Origin Resource Sharing) krijgt bij gebruik van Ollama op Windows, moet je mogelijk de omgevingsvariabele `OLLAMA_ORIGINS` instellen. Dat kan met `set OLLAMA_ORIGINS=*` in je opdrachtprompt voordat je Ollama start. Dat staat requests vanaf elke origin toe.
  - **CORS inschakelen in LM Studio**: Voor LM Studio kun je CORS direct in de serverinstellingen inschakelen. Dat kan nodig zijn wanneer Obsidian in een browser draait of strikte origin policies hanteert.
- **Fouten bij het aanmaken van mappen ("File name cannot contain...")**:
  - Dit betekent meestal dat het pad dat je in de instellingen hebt opgegeven (**Processed File Folder Path** of **Concept Note Folder Path**) **ongeldig is voor Obsidian**.
  - **Zorg ervoor dat je relatieve paden gebruikt** (bijv. `Processed`, `Notes/Concepts`) en **geen absolute paden** (bijv. `C:\Users\...`, `/Users/...`).
  - Controleer op ongeldige tekens: `* " \ / < > : | ? # ^ [ ]`. Let op dat `\` ook op Windows ongeldig is voor Obsidian-paden. Gebruik `/` als scheidingsteken.
- **Prestatieproblemen**: Het verwerken van grote bestanden of veel bestanden kan tijd kosten. Verlaag de instelling "Chunk Word Count" voor mogelijk snellere (maar talrijkere) API-calls. Probeer een andere LLM-provider of een ander model.
- **Onverwachte linking**: De kwaliteit van de links hangt sterk af van de LLM en de prompt. Experimenteer met verschillende modellen of temperature-instellingen.

## Bijdragen

Bijdragen zijn welkom. Raadpleeg de GitHub-repository voor richtlijnen: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Documentatie voor maintainers

- [Releaseworkflow (Engels)](./docs/maintainer/release-workflow.md)
- [Releaseworkflow (Vereenvoudigd Chinees)](./docs/maintainer/release-workflow.zh-CN.md)

## Licentie

MIT-licentie - Zie het bestand [LICENSE](LICENSE) voor details.

---


*Notemd v1.8.4 - Verrijk je Obsidian-kennisgrafiek met AI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
