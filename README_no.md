![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Notemd-plugin for Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Les dokumentasjon på flere språk: [Språksenter](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-drevet flerspråklig kunnskapsforbedring
==================================================
```

En enkel måte å bygge din egen kunnskapsbase på.

Notemd forbedrer Obsidian-arbeidsflyten din ved å integrere med ulike store språkmodeller (LLM-er) for å behandle de flerspråklige notatene dine, automatisk generere wiki-lenker for nøkkelbegreper, opprette tilsvarende konseptnotater, utføre nettforskning og hjelpe deg med å bygge kraftige kunnskapsgrafer med mer.

Hvis du elsker å bruke Notemd, vennligst vurder [⭐ å gi en stjerne på GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) eller [☕️ kjøp en kaffe til meg](https://ko-fi.com/jacobinwwey).

**Versjon:** 1.8.4

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Innholdsfortegnelse

- [Hurtigstart](#hurtigstart)
- [Språkstøtte](#språkstøtte)
- [Funksjoner](#funksjoner)
- [Installasjon](#installasjon)
- [Konfigurasjon](#konfigurasjon)
- [Brukerveiledning](#brukerveiledning)
- [Støttede LLM-leverandører](#støttede-llm-leverandører)
- [Nettverksbruk og datahåndtering](#nettverksbruk-og-datahåndtering)
- [Feilsøking](#feilsøking)
- [Bidra](#bidra)
- [Dokumentasjon for vedlikeholdere](#dokumentasjon-for-vedlikeholdere)
- [Lisens](#lisens)

## Hurtigstart

1. **Installer og aktiver**: Hent pluginen fra Obsidian Marketplace.
2. **Konfigurer LLM**: Gå til `Settings -> Notemd`, velg LLM-leverandøren du vil bruke, for eksempel OpenAI eller en lokal leverandør som Ollama, og skriv inn API-nøkkel/URL.
3. **Åpne sidepanelet**: Klikk på Notemd-tryllestavikonet i venstre bånd for å åpne sidepanelet.
4. **Behandle et notat**: Åpne et hvilket som helst notat og klikk på **"Process File (Add Links)"** i sidepanelet for automatisk å legge til `[[wiki-links]]` til nøkkelbegreper.
5. **Kjør en rask arbeidsflyt**: Bruk standardknappen **"One-Click Extract"** for å kjede sammen behandling, batchgenerering og Mermaid-opprydding fra ett inngangspunkt.

Det er alt. Utforsk innstillingene for å låse opp flere funksjoner som nettforskning, oversettelse og innholdsgenerering.

## Språkstøtte

### Avtale for språkoppførsel

| Tema | Omfang | Standard | Merknader |
|---|---|---|---|
| `Grensesnittsspråk` | Kun tekst i pluginens brukergrensesnitt (innstillinger, sidepanel, varsler, dialoger) | `auto` | Følger Obsidians språkinnstilling; dagens UI-kataloger er `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN` og `zh-TW`. |
| `Oppgaveutdataspråk` | LLM-generert oppgaveutdata (lenker, sammendrag, generering, uttrekk, oversettelsesmål) | `en` | Kan være globalt eller per oppgave når `Bruk ulike språk for oppgaver` er aktivert. |
| `Slå av automatisk oversettelse` | Ikke-Translate-oppgaver beholder kontekst på kildespråket | `false` | Eksplisitte `Translate`-oppgaver håndhever fortsatt det konfigurerte målspråket. |
| Reservspråk | Oppslag for manglende UI-nøkler | locale -> `en` | Holder brukergrensesnittet stabilt når noen nøkler fortsatt mangler oversettelse. |

- De vedlikeholdte kildedokumentene er engelsk og forenklet kinesisk, og publiserte README-oversettelser er lenket i overskriften ovenfor.
- Appens dekning av UI-lokaler samsvarer nå nøyaktig med den eksplisitte katalogen i koden: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Engelsk fallback forblir et sikkerhetsnett i implementasjonen, men støttede synlige flater er dekket av regresjonstester og bør ikke i det stille falle tilbake til engelsk ved normal bruk.
- Flere detaljer og retningslinjer for bidrag spores i [Språksenteret](./docs/i18n/README.md).

## Funksjoner

### AI-drevet dokumentbehandling
- **Støtte for flere LLM-er**: Koble til ulike skybaserte og lokale LLM-leverandører. Se [Støttede LLM-leverandører](#støttede-llm-leverandører).
- **Smart chunking**: Deler automatisk store dokumenter opp i håndterbare biter basert på ordtelling.
- **Bevaring av innhold**: Har som mål å beholde den opprinnelige formateringen samtidig som struktur og lenker legges til.
- **Fremdriftssporing**: Sanntidsoppdateringer via Notemd Sidebar eller en fremdriftsmodal.
- **Avbrytbare operasjoner**: Du kan avbryte enhver behandlingsoppgave, enkeltfil eller batch, som startes fra sidepanelet via en egen avbrytknapp. Operasjoner fra kommandopaletten bruker en modal som også kan avbrytes.
- **Konfigurasjon med flere modeller**: Bruk ulike LLM-leverandører og bestemte modeller for forskjellige oppgaver, som Add Links, Research, Generate Title og Translate, eller bruk én leverandør til alt.
- **Stabile API-kall (gjenforsøkslogikk)**: Aktiver valgfritt automatiske gjenforsøk for mislykkede LLM-API-kall med konfigurerbart intervall og forsøkstak.
- **Mer robuste tilkoblingstester mot leverandører**: Hvis den første leverandørtesten treffer en midlertidig nettverksfrakobling, faller Notemd nå tilbake til den stabile gjenforsøkssekvensen før testen feiler. Dette dekker OpenAI-compatible, Anthropic, Google, Azure OpenAI og Ollama.
- **Kjøretidsbevisst transport-fallback**: Når en langvarig leverandørforespørsel blir droppet av `requestUrl` med midlertidige nettverksfeil som `ERR_CONNECTION_CLOSED`, prøver Notemd nå samme forsøk på nytt via en miljøspesifikk fallback-transport før den går inn i den konfigurerte gjenforsøksløkka. Desktop-bygger bruker Node `http/https`, mens ikke-desktopmiljøer bruker nettleser-`fetch`. Dette reduserer falske feil på trege gateways og reverse proxy-er.
- **Forsterket kjede for lange OpenAI-compatible-forespørsler**: I stabil modus bruker OpenAI-compatible-kall nå en eksplisitt tretrinnsrekkefølge per forsøk: direkte streaming-transport, deretter direkte ikke-streaming-transport, og til slutt `requestUrl`-fallback, som fortsatt kan oppgraderes til streamet parsing ved behov. Dette reduserer falske negative feil når leverandøren faktisk fullfører bufrede svar, men streaming-røret er ustabilt.
- **Protokollbevisst streaming-fallback på tvers av LLM-API-er**: Fallback-forsøk for langvarige kall oppgraderes nå til protokollbevisst streamet parsing på tvers av alle innebygde LLM-stier, ikke bare OpenAI-compatible-endepunkter. Notemd håndterer nå OpenAI/Azure-stil SSE, Anthropic Messages-streaming, Google Gemini SSE og Ollama NDJSON både på desktop `http/https` og ikke-desktop `fetch`, og de øvrige direkte leverandørinngangene i OpenAI-stil gjenbruker den samme delte fallback-stien.
- **Kina-klare leverandørforhåndsinnstillinger**: Innebygde forhåndsinnstillinger dekker nå `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` og `SiliconFlow`, i tillegg til de eksisterende globale og lokale leverandørene.
- **Pålitelig batchbehandling**: Logikken for samtidig behandling er forbedret med **staggered API calls** for å unngå rate limiting og sikre stabil ytelse i store batchjobber. Oppgavene startes nå med ulike intervaller i stedet for alt på én gang.
- **Presis fremdriftsrapportering**: En feil som kunne få fremdriftslinjen til å henge seg opp er rettet, slik at UI-et alltid viser den faktiske statusen til operasjonen.
- **Robust parallell batchbehandling**: Et problem der parallelle batchoperasjoner stoppet for tidlig er løst, slik at alle filer behandles pålitelig og effektivt.
- **Nøyaktig fremdriftslinje**: En feil som gjorde at fremdriftslinjen for kommandoen "Create Wiki-Link & Generate Note" stoppet på 95 %, er rettet, slik at den nå korrekt viser 100 % ved fullføring.
- **Forbedret API-feilsøking**: "API Error Debugging Mode" fanger nå opp komplette svarlegemer fra LLM-leverandører og søketjenester som Tavily og DuckDuckGo, og logger også en transporttidslinje per forsøk med sanerte forespørsels-URL-er, varighet, svarhoder, delvise svarlegemer, parsede delvise streamfragmenter og stack traces for bedre feilsøking på tvers av OpenAI-compatible, Anthropic, Google, Azure OpenAI og Ollama-fallbacker.
- **Panel for utviklermodus**: Innstillingene inkluderer nå et eget diagnostikkpanel kun for utviklere, som forblir skjult med mindre "Developer mode" er aktivert. Panelet støtter valg av diagnostisk kallsti og gjentatte stabilitetsprober for valgt modus.
- **Redesignet sidepanel**: Innebygde handlinger er gruppert i mer fokuserte seksjoner med tydeligere etiketter, live-status, avbrytbar fremdrift og kopierbare logger for å redusere rot i sidepanelet. Bunnteksten for fremdrift og logg forblir nå synlig selv når alle seksjoner er utvidet, og klar-tilstand bruker et tydeligere standby-spor.
- **Forbedret interaksjon og lesbarhet i sidepanelet**: Knapper i sidepanelet gir nå tydeligere hover-, trykk- og fokusrespons, og fargerike CTA-knapper, inkludert `One-Click Extract` og `Batch generate from titles`, bruker sterkere tekstkontrast for bedre lesbarhet på tvers av temaer.
- **CTA-stil kun for enkeltfiler**: Fargerik CTA-styling er nå reservert for handlinger på enkeltfiler. Batch- eller mappenivåhandlinger og blandede arbeidsflyter bruker ikke-CTA-styling for å redusere feilklikk knyttet til handlingens omfang.
- **Tilpassede ettklikksarbeidsflyter**: Gjør innebygde verktøy i sidepanelet om til gjenbrukbare tilpassede knapper med brukerdefinerte navn og sammensatte handlingskjeder. En standard arbeidsflyt `One-Click Extract` følger med fra start.

### Forbedring av kunnskapsgraf
- **Automatisk wiki-lenking**: Identifiserer og legger til `[[wiki-links]]` til kjernebegreper i behandlede notater basert på LLM-utdata.
- **Opprettelse av konseptnotater (valgfritt og tilpassbart)**: Oppretter automatisk nye notater for oppdagede begreper i en angitt mappe i vaulten din.
- **Tilpassbare utdata-stier**: Konfigurer separate relative stier i vaulten for lagring av behandlede filer og nyopprettede konseptnotater.
- **Tilpassbare utdatafilnavn (Add Links)**: Du kan valgfritt **overskrive den opprinnelige filen** eller bruke et tilpasset suffiks eller en erstatningsstreng i stedet for standarden `_processed.md` når filer behandles for lenker.
- **Opprettholdt lenkeintegritet**: Grunnleggende håndtering for å oppdatere lenker når notater får nytt navn eller slettes i vaulten.
- **Rent konseptuttrekk**: Trekk ut begreper og opprett tilsvarende konseptnotater uten å endre originaldokumentet. Dette er ideelt for å fylle en kunnskapsbase fra eksisterende dokumenter uten å endre dem. Funksjonen har konfigurerbare valg for minimale konseptnotater og backlinks.

### Oversettelse

- **AI-drevet oversettelse**:
  - Oversett notatinnhold ved hjelp av den konfigurerte LLM-en.
  - **Støtte for store filer**: Store filer deles automatisk opp i mindre biter basert på innstillingen `Chunk word count` før de sendes til LLM-en. De oversatte bitene settes deretter sømløst sammen igjen til ett dokument.
  - Støtter oversettelse mellom flere språk.
  - Tilpassbart målspråk i innstillingene eller i UI-et.
  - Åpner automatisk den oversatte teksten til høyre for originalteksten for enklere lesing.
- **Batchoversettelse**:
  - Oversett alle filer i en valgt mappe.
  - Støtter parallell behandling når "Enable Batch Parallelism" er slått på.
  - Bruker tilpassede prompts for oversettelse hvis dette er konfigurert.
  - Legger til alternativet "Batch translate this folder" i kontekstmenyen i filutforskeren.
- **Slå av automatisk oversettelse**: Når dette alternativet er aktivert, vil oppgaver som ikke er Translate ikke lenger tvinge utdata til et bestemt språk, og konteksten på originalspråket beholdes. Den eksplisitte "Translate"-oppgaven utfører fortsatt oversettelse slik det er konfigurert.

### Nettforskning og innholdsgenerering
- **Nettforskning og oppsummering**:
  - Utfør nettsøk med Tavily, som krever API-nøkkel, eller DuckDuckGo, som er eksperimentelt.
  - **Forbedret søkerobusthet**: DuckDuckGo-søk har nå forbedret parserlogikk, `DOMParser` med regex-fallback, for å håndtere layoutendringer og sikre pålitelige resultater.
  - Oppsummer søkeresultater med den konfigurerte LLM-en.
  - Språket i sammendraget kan tilpasses i innstillingene.
  - Legg sammendrag til i det gjeldende notatet.
  - Konfigurerbar token-grense for forskningsinnhold som sendes til LLM-en.
- **Innholdsgenerering fra tittel**:
  - Bruk notattittelen til å generere innledende innhold via LLM, som erstatter eksisterende innhold.
  - **Valgfri research**: Konfigurer om pluginen skal utføre nettforskning, med valgt leverandør, for å gi kontekst til genereringen.
- **Batch-innholdsgenerering fra titler**: Generer innhold for alle notater i en valgt mappe basert på titlene deres, og respekter den valgfrie research-innstillingen. Filer som behandles vellykket flyttes til en **konfigurerbar "complete"-undermappe**, for eksempel `[foldername]_complete` eller et tilpasset navn, for å unngå ny behandling.
- **Mermaid auto-fix-kobling**: Når Mermaid auto-fix er aktivert, reparerer Mermaid-relaterte arbeidsflyter nå automatisk genererte filer eller utdata-mapper etter behandling. Dette dekker Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid og Translate.

### Hjelpefunksjoner
- **Oppsummer som Mermaid-diagram**:
  - Denne funksjonen lar deg oppsummere innholdet i et notat som et Mermaid-diagram.
  - Utdata-språket i Mermaid-diagrammet kan tilpasses i innstillingene.
  - **Mermaid Output Folder**: Konfigurer mappen der genererte Mermaid-diagramfiler skal lagres.
  - **Translate Summarize to Mermaid Output**: Oversett valgfritt innholdet i det genererte Mermaid-diagrammet til det konfigurerte målspråket.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Enkel korrigering av formelformat**:
  - Retter raskt matematiske formler på én linje, avgrenset av enkel `$`, til standardblokker med doble `$$`.
  - **Enkeltfil**: Behandle gjeldende fil via knappen i sidepanelet eller kommandopaletten.
  - **Batch-fiks**: Behandle alle filer i en valgt mappe via knappen i sidepanelet eller kommandopaletten.

- **Sjekk duplikater i gjeldende fil**: Denne kommandoen hjelper deg med å identifisere potensielle duplikate termer i den aktive filen.
- **Duplikatdeteksjon**: Grunnleggende kontroll av duplikate ord i innholdet i den aktuelt behandlede filen, resultatene logges til konsollen.
- **Sjekk og fjern dupliserte konseptnotater**: Identifiserer potensielle duplikatnotater i den konfigurerte **Concept Note Folder** basert på eksakte navnetreff, flertallsformer, normalisering og innehold av enkeltord sammenlignet med notater utenfor mappen. Omfanget av sammenligningen kan konfigureres til **hele vaulten**, **bestemte inkluderte mapper** eller **alle mapper unntatt bestemte unntak**. Viser en detaljert liste med årsaker og konfliktfiler, og ber deretter om bekreftelse før identifiserte duplikater flyttes til systemets papirkurv. Viser fremdrift under slettingen.
- **Batch Mermaid-fiks**: Bruker Mermaid- og LaTeX-syntakskorrigeringer på alle Markdown-filer i en mappe valgt av brukeren.
  - **Klar for arbeidsflyter**: Kan brukes som et selvstendig verktøy eller som et steg i en tilpasset ettklikksarbeidsflyt.
  - **Feilrapportering**: Genererer en `mermaid_error_{foldername}.md`-rapport som viser filer som fortsatt inneholder potensielle Mermaid-feil etter behandling.
  - **Flytt feilfiler**: Flytter valgfritt filer med oppdagede feil til en angitt mappe for manuell gjennomgang.
  - **Smart deteksjon**: Kontrollerer nå intelligent filer for syntaksfeil med `mermaid.parse` før den forsøker å rette dem, noe som sparer behandlingstid og unngår unødvendige redigeringer.
  - **Sikker behandling**: Sørger for at syntaksrettinger bare brukes på Mermaid-kodeblokker, slik at Markdown-tabeller eller annet innhold ikke endres ved et uhell. Inneholder robuste sikkerhetstiltak for å beskytte tabellsyntaks som `| :--- |` mot aggressive debug-rettinger.
  - **Deep Debug Mode**: Hvis feil fortsatt finnes etter første retting, utløses en avansert deep debug-modus. Denne modusen håndterer komplekse edge cases, blant annet:
    - **Comment Integration**: Slår automatisk sammen etterfølgende kommentarer som starter med `%` inn i etiketten på kanten, for eksempel blir `A -- Label --> B; % Comment` til `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Retter piler som har blitt absorbert inn i anførselstegn, for eksempel blir `A -- "Label -->" B` til `A -- "Label" --> B`.
    - **Inline Subgraphs**: Konverterer inline-subgraph-etiketter til edge labels.
    - **Reverse Arrow Fix**: Korrigerer ikke-standard `X <-- Y`-piler til `Y --> X`.
    - **Direction Keyword Fix**: Sikrer at nøkkelordet `direction` er med små bokstaver inne i subgraphs, for eksempel `Direction TB` -> `direction TB`.
    - **Comment Conversion**: Konverterer `//`-kommentarer til edge labels, for eksempel `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Forenkler gjentatte etiketter i klammer, for eksempel `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Konverterer ugyldig pilsyntaks `--|>` til standard `-->`.
    - **Robust håndtering av etiketter og notater**: Forbedret håndtering av etiketter som inneholder spesialtegn, som `/`, og bedre støtte for tilpasset note-syntaks, `note for ...`, samtidig som artefakter som hengende `]` fjernes rent.
    - **Advanced Fix Mode**: Inneholder robuste rettelser for usiterte node-etiketter med mellomrom, spesialtegn eller nestede klammer, for eksempel `Node[Label [Text]]` -> `Node["Label [Text]"]`, slik at komplekse diagrammer som Stellar Evolution-stier forblir kompatible. Den korrigerer også feilformede edge labels, for eksempel `--["Label["-->` til `-- "Label" -->`. I tillegg konverteres inline comments, som `Consensus --> Adaptive; # Some advanced consensus`, til `Consensus -- "Some advanced consensus" --> Adaptive`, og ufullstendige anførselstegn ved slutten av linjen fikses ved at `;"` på slutten erstattes med `"]`.
    - **Note Conversion**: Konverterer automatisk `note right/left of` og frittstående `note :`-kommentarer til standard Mermaid-node-definisjoner og koblinger, for eksempel blir `note right of A: text` til `NoteA["Note: text"]` koblet til `A`, for å unngå syntaksfeil og forbedre layouten. Støtter nå både pilkoblinger (`-->`) og heltrukne koblinger (`---`).
    - **Extended Note Support**: Konverterer automatisk `note for Node "Content"` og `note of Node "Content"` til standard koblede note-noder, for eksempel `NoteNode[" Content"]` koblet til `Node`, slik at brukerutvidet syntaks er kompatibel.
    - **Enhanced Note Correction**: Gir automatisk nytt navn til notater med sekvensiell nummerering, for eksempel `Note1`, `Note2`, for å unngå alias-problemer når flere notater finnes.
    - **Parallelogram/Shape Fix**: Korrigerer feilformede nodeformer som `[/["Label["/]` til standard `["Label"]`, slik at generert innhold forblir kompatibelt.
    - **Standardize Pipe Labels**: Retter og standardiserer automatisk edge labels som inneholder pipes, slik at de siteres korrekt, for eksempel blir `-->|Text|` til `-->|"Text"|`, og `-->|Math|^2|` blir til `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Korrigerer feilplasserte edge labels som står foran pilen, for eksempel blir `>|"Label"| A --> B` til `A -->|"Label"| B`.
    - **Merge Double Labels**: Oppdager og slår sammen komplekse doble etiketter på én edge, for eksempel `A -- Label1 -- Label2 --> B` eller `A -- Label1 -- Label2 --- B`, til én ren etikett med linjeskift: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Setter automatisk anførselstegn rundt node-etiketter som inneholder potensielt problematiske tegn, som anførselstegn, likhetstegn eller matematiske operatorer, men mangler ytre anførselstegn, for eksempel blir `Plot[Plot "A"]` til `Plot["Plot "A""]`, for å unngå gjengivelsesfeil.
    - **Intermediate Node Fix**: Deler opp kanter som inneholder en mellomliggende nodedefinisjon i to separate kanter, for eksempel blir `A -- B[...] --> C` til `A --> B[...]` og `B[...] --> C`, noe som gir gyldig Mermaid-syntaks.
    - **Concatenated Label Fix**: Retter robust nodedefinisjoner der ID-en er slått sammen med etiketten, for eksempel blir `SubdivideSubdivide...` til `Subdivide["Subdivide..."]`, selv når den er foranlediget av pipe labels eller når dupliseringen ikke er helt eksakt, ved å validere mot kjente node-ID-er.
- **Ekstraher spesifikk originaltekst**:
  - Definer en liste med spørsmål i innstillingene.
  - Trekker ut ordrette tekstsegmenter fra det aktive notatet som besvarer disse spørsmålene.
  - **Merged Query Mode**: Valgfri behandling av alle spørsmål i ett API-kall for bedre effektivitet.
  - **Translation**: Valgfri inkludering av oversettelser av den ekstraherte teksten i utdata.
  - **Custom Output**: Konfigurerbar lagringssti og filnavnssuffiks for den ekstraherte tekstfilen.
- **LLM-tilkoblingstest**: Verifiser API-innstillingene for den aktive leverandøren.

## Installasjon

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Fra Obsidian Marketplace (anbefalt)
1. Åpne Obsidian **Settings** -> **Community plugins**.
2. Sørg for at "Restricted mode" er **av**.
3. Klikk på **Browse** community plugins og søk etter "Notemd".
4. Klikk på **Install**.
5. Når installasjonen er ferdig, klikker du på **Enable**.

### Manuell installasjon
1. Last ned de nyeste release-filene fra [GitHub Releases-siden](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Hver release inneholder også `README.md` som pakket referanse, men manuell installasjon krever bare `main.js`, `styles.css` og `manifest.json`.
2. Gå til konfigurasjonsmappen for Obsidian-vaulten din: `<YourVault>/.obsidian/plugins/`.
3. Opprett en ny mappe med navnet `notemd`.
4. Kopier `main.js`, `styles.css` og `manifest.json` inn i mappen `notemd`.
5. Start Obsidian på nytt.
6. Gå til **Settings** -> **Community plugins** og aktiver "Notemd".

## Konfigurasjon

Du finner plugininnstillingene via:
**Settings** -> **Community Plugins** -> **Notemd** (klikk på tannhjulikonet).

### Konfigurasjon av LLM-leverandør
1. **Aktiv leverandør**: Velg LLM-leverandøren du vil bruke fra rullegardinlisten.
2. **Leverandørinnstillinger**: Konfigurer de spesifikke innstillingene for den valgte leverandøren:
   - **API Key**: Kreves for de fleste skyleverandører, som OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks og Requesty. Trengs ikke for Ollama. Valgfri for LM Studio og den generiske forhåndsinnstillingen `OpenAI Compatible` når endepunktet ditt godtar anonym eller placeholder-basert tilgang.
   - **Base URL / Endpoint**: API-endepunktet for tjenesten. Standardverdier følger med, men du kan trenge å endre dette for lokale modeller, som LMStudio og Ollama, gateways som OpenRouter, Requesty og OpenAI Compatible, eller bestemte Azure-distribusjoner. **Påkrevd for Azure OpenAI.**
   - **Model**: Det spesifikke modellnavnet eller modell-ID-en som skal brukes, for eksempel `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` eller `anthropic/claude-3-7-sonnet-latest`. Sørg for at modellen er tilgjengelig hos endepunktet eller leverandøren din.
   - **Temperature**: Styrer hvor tilfeldig LLM-utdata blir, 0 = deterministisk, 1 = maksimal kreativitet. Lavere verdier, for eksempel 0.2-0.5, er vanligvis bedre for strukturerte oppgaver.
   - **API Version (kun Azure)**: Kreves for Azure OpenAI-distribusjoner, for eksempel `2024-02-15-preview`.
3. **Test forbindelse**: Bruk knappen "Test forbindelse" for den aktive leverandøren for å verifisere innstillingene dine. OpenAI-compatible-leverandører bruker nå leverandørbevisste kontroller: endepunkter som `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` og `OpenAI Compatible` tester `chat/completions` direkte, mens leverandører med et pålitelig `/models`-endepunkt fortsatt kan starte med modellopplisting. Hvis den første testen feiler med en midlertidig nettverksfrakobling som `ERR_CONNECTION_CLOSED`, faller Notemd automatisk tilbake til den stabile gjenforsøkssekvensen i stedet for å feile umiddelbart.
4. **Administrer leverandørkonfigurasjoner**: Bruk knappene "Export Providers" og "Import Providers" for å lagre eller laste LLM-leverandørinnstillingene dine til eller fra en `notemd-providers.json`-fil i pluginens konfigurasjonsmappe. Dette gjør sikkerhetskopiering og deling enkelt.
5. **Forhåndsinnstillingsdekning**: I tillegg til de opprinnelige leverandørene inkluderer Notemd nå forhåndsdefinerte oppføringer for `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` og et generisk mål `OpenAI Compatible` for LiteLLM, vLLM, Perplexity, Vercel AI Gateway eller tilpassede proxyer.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Konfigurasjon med flere modeller
- **Bruk forskjellige leverandører for oppgaver**:
  - **Av (standard)**: Bruker den ene "aktive leverandøren" som er valgt over, for alle oppgaver.
  - **På**: Lar deg velge en bestemt leverandør og valgfritt overstyre modellnavnet for hver oppgave, som "Add Links", "Research & Summarize", "Generate from Title", "Translate" og "Extract Concepts". Hvis feltet for modelloverstyring står tomt, brukes standardmodellen som er konfigurert for leverandøren som er valgt for den aktuelle oppgaven.
- **Velg forskjellige språk for forskjellige oppgaver**:
  - **Av (standard)**: Bruker samme utdataspråk for alle oppgaver.
  - **På**: Lar deg velge et bestemt språk for hver oppgave, som "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" og "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Språkarkitektur (grensesnittsspråk og oppgaveutdataspråk)

- **Grensesnittsspråk** styrer bare tekst i pluginens grensesnitt, som etiketter i innstillinger, knapper i sidepanelet, varsler og dialoger. Standardmodusen `auto` følger Obsidians nåværende UI-språk.
- Regionale eller skriftspesifikke varianter blir nå knyttet til nærmeste publiserte katalog i stedet for å falle rett tilbake til engelsk. For eksempel bruker `fr-CA` fransk, `es-419` spansk, `pt-PT` portugisisk, `zh-Hans` forenklet kinesisk og `zh-Hant-HK` tradisjonell kinesisk.
- **Oppgaveutdataspråk** styrer modellgenerert utdata for oppgaver, som lenker, sammendrag, tittelgenerering, Mermaid-sammendrag, konseptuttrekk og oversettelsesmål.
- **Per-task language mode** lar hver oppgave avgjøre sitt eget utdata-språk fra et samlet policy-lag i stedet for spredte overstyringer i enkeltmoduler.
- **Slå av automatisk oversettelse** gjør at oppgaver som ikke er Translate bevarer konteksten på kildespråket, mens eksplisitte Translate-oppgaver fortsatt håndhever det konfigurerte målspråket.
- Mermaid-relaterte genereringsstier følger den samme språkpolitikken og kan fortsatt utløse Mermaid auto-fix når dette er aktivert.

### Innstillinger for stabile API-kall
- **Aktiver stabile API-kall (gjentakslogikk)**:
  - **Av (standard)**: Ett enkelt mislykket API-kall stopper den gjeldende oppgaven.
  - **På**: Prøver automatisk på nytt ved mislykkede LLM-API-kall, nyttig ved ustabile nettverk eller rate limits.
  - **Connection Test Fallback**: Selv når vanlige kall ikke allerede kjører i stable mode, bytter tilkoblingstester nå til den samme gjenforsøkssekvensen etter den første midlertidige nettverksfeilen.
  - **Runtime Transport Fallback (miljøbevisst)**: Langvarige oppgaveforespørsler som midlertidig blir droppet av `requestUrl`, prøves nå først igjen via en miljøbevisst fallback. Desktop-bygger bruker Node `http/https`; ikke-desktopmiljøer bruker nettleser-`fetch`. Disse fallback-forsøkene bruker nå protokollbevisst streamet parsing på tvers av de innebygde LLM-stiene, og dekker OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE og Ollama NDJSON, slik at trege gateways kan begynne å returnere body-chunks tidligere. De øvrige direkte leverandørinngangene i OpenAI-stil gjenbruker den samme delte fallback-stien.
  - **OpenAI-Compatible Stable Order**: I stable mode følger hvert OpenAI-compatible-forsøk nå `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` før forsøket telles som mislykket. Dette forhindrer for aggressive feil når bare én transportmodus er ustabil.
- **Retry Interval (seconds)**: Bare synlig når funksjonen er aktivert. Tiden mellom gjenforsøk, 1-300 sekunder. Standard: 5.
- **Maximum Retries**: Bare synlig når funksjonen er aktivert. Maksimalt antall gjenforsøk, 0-10. Standard: 3.
- **Feilsøkingsmodus for API-feil**:
  - **Av (standard)**: Bruker standardisert, konsis feilrapportering.
  - **På**: Aktiverer detaljert feillogging, tilsvarende DeepSeeks utfyllende utdata, for alle leverandører og oppgaver, inkludert Translate, Search og Connection Tests. Dette inkluderer HTTP-statuskoder, rå responstekst, transporttidslinjer for forespørsler, sanerte forespørsels-URL-er og headere, forløpt varighet per forsøk, svarhoder, delvise svarlegemer, parsede delvise streamutdata og stack traces, noe som er avgjørende ved feilsøking av API-tilkobling og upstream gateway-resets.
- **Developer Mode**:
  - **Av (standard)**: Skjuler alle diagnostiske kontroller som kun er ment for utviklere.
  - **På**: Viser et eget utviklerdiagnostikkpanel i Settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Velg kjøretidssti per probe. OpenAI-compatible-leverandører støtter også ekstra tvungne moduser som `direct streaming`, `direct buffered` og `requestUrl-only`, i tillegg til kjøretidsmodusene.
  - **Run Diagnostic**: Kjører én probe for lang forespørsel med valgt call mode og skriver `Notemd_Provider_Diagnostic_*.txt` i roten av vaulten.
  - **Run Stability Test**: Gjentar proben et konfigurerbart antall ganger, 1-10, med valgt call mode og lagrer en samlet stabilitetsrapport.
  - **Diagnostic Timeout**: Konfigurerbar timeout per kjøring, 15-3600 sekunder.
  - **Why Use It**: Raskere enn manuell reproduksjon når en leverandør består "Test connection", men feiler på virkelige langvarige oppgaver, for eksempel oversettelse via trege gateways.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Generelle innstillinger

#### Utdata for behandlede filer
- **Customize Processed File Save Path**:
  - **Av (standard)**: Behandlede filer, for eksempel `DittNotat_processed.md`, lagres i *samme mappe* som originalnotatet.
  - **På**: Lar deg angi en tilpasset lagringsplassering.
- **Processed File Folder Path**: Bare synlig når innstillingen over er aktivert. Angi en *relativ sti* i vaulten din, for eksempel `Processed Notes` eller `Output/LLM`, der behandlede filer skal lagres. Mapper opprettes automatisk hvis de ikke finnes. **Ikke bruk absolutte stier som `C:\...` eller ugyldige tegn.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Av (standard)**: Filer som opprettes av kommandoen "Add Links" bruker standardsuffikset `_processed.md`, for eksempel `DittNotat_processed.md`.
  - **På**: Lar deg tilpasse utdatafilnavnet med innstillingen under.
- **Custom Suffix/Replacement String**: Bare synlig når innstillingen over er aktivert. Skriv inn strengen som skal brukes i utdatafilnavnet.
  - Hvis feltet står **tomt**, vil originalfilen bli **overskrevet** med det behandlede innholdet.
  - Hvis du skriver inn en streng, for eksempel `_linked`, legges den til det opprinnelige basisnavnet, for eksempel `DittNotat_linked.md`. Sørg for at suffikset ikke inneholder ugyldige tegn for filnavn.

- **Remove Code Fences on Add Links**:
  - **Av (standard)**: Code fences **(\`\\\`\`)** beholdes i innholdet når lenker legges til, og **(\`\\\`markdown)** fjernes automatisk.
  - **På**: Fjerner code fences fra innholdet før lenker legges til.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Utdata for konseptnotater
- **Customize Concept Note Path**:
  - **Av (standard)**: Automatisk opprettelse av notater for `[[linked concepts]]` er deaktivert.
  - **På**: Lar deg angi en mappe der nye konseptnotater skal opprettes.
- **Concept Note Folder Path**: Bare synlig når innstillingen over er aktivert. Angi en *relativ sti* i vaulten din, for eksempel `Concepts` eller `Generated/Topics`, der nye konseptnotater skal lagres. Mapper opprettes automatisk hvis de ikke finnes. **Må fylles ut hvis tilpasning er aktivert.** **Ikke bruk absolutte stier eller ugyldige tegn.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Utdata for konseptloggfil
- **Generate Concept Log File**:
  - **Av (standard)**: Ingen loggfil genereres.
  - **På**: Oppretter en loggfil som viser nyopprettede konseptnotater etter behandling. Formatet er:
    ```
    generer xx konsept-md-filer
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Bare synlig når "Generate Concept Log File" er aktivert.
  - **Av (standard)**: Loggfilen lagres i **Concept Note Folder Path** hvis den er angitt, ellers i roten av vaulten.
  - **På**: Lar deg angi en tilpasset mappe for loggfilen.
- **Concept Log Folder Path**: Bare synlig når "Customize Log File Save Path" er aktivert. Angi en *relativ sti* i vaulten din, for eksempel `Logs/Notemd`, der loggfilen skal lagres. **Må fylles ut hvis tilpasning er aktivert.**
- **Customize Log File Name**: Bare synlig når "Generate Concept Log File" er aktivert.
  - **Av (standard)**: Loggfilen heter `Generate.log`.
  - **På**: Lar deg angi et tilpasset navn for loggfilen.
- **Concept Log File Name**: Bare synlig når "Customize Log File Name" er aktivert. Skriv inn ønsket filnavn, for eksempel `ConceptCreation.log`. **Må fylles ut hvis tilpasning er aktivert.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Oppgaven "Ekstraher begreper"
- **Opprett minimale konseptnotater**:
  - **På (standard)**: Nyopprettede konseptnotater vil bare inneholde tittelen, for eksempel `# Begrep`.
  - **Av**: Konseptnotater kan inneholde ekstra innhold, som en "Linked From"-backlink, hvis det ikke er deaktivert av innstillingen under.
- **Add "Linked From" backlink**:
  - **Av (standard)**: Legger ikke til en backlink til kildedokumentet i konseptnotatet under uttrekk.
  - **På**: Legger til en "Linked From"-seksjon med backlink til kildefilen.

#### Ekstraher spesifikk originaltekst
- **Questions for extraction**: Skriv inn en liste med spørsmål, ett per linje, som du vil at AI-en skal trekke ut ordrette svar på fra notatene dine.
- **Translate output to corresponding language**:
  - **Av (standard)**: Returnerer bare den ekstraherte teksten på originalspråket.
  - **På**: Legger til en oversettelse av den ekstraherte teksten på språket som er valgt for denne oppgaven.
- **Merged query mode**:
  - **Av**: Behandler hvert spørsmål individuelt, noe som gir høyere presisjon, men flere API-kall.
  - **På**: Sender alle spørsmålene i én enkelt prompt, noe som gir raskere behandling og færre API-kall.
- **Customise extracted text save path & filename**:
  - **Av**: Lagrer i samme mappe som originalfilen med suffikset `_Extracted`.
  - **På**: Lar deg angi en tilpasset utdata-mappe og et filnavnssuffiks.

#### Batch Mermaid-fiks
- **Enable Mermaid Error Detection**:
  - **Av (standard)**: Feildeteksjon hoppes over etter behandling.
  - **På**: Skanner behandlede filer for gjenværende Mermaid-syntaksfeil og genererer en `mermaid_error_{foldername}.md`-rapport.
- **Move files with Mermaid errors to specified folder**:
  - **Av**: Filer med feil forblir der de er.
  - **På**: Flytter alle filer som fortsatt inneholder Mermaid-syntaksfeil etter rettingsforsøket til en dedikert mappe for manuell gjennomgang.
- **Mermaid error folder path**: Synlig hvis innstillingen over er aktivert. Mappen feilfiler skal flyttes til.

#### Behandlingsparametere
- **Enable Batch Parallelism**:
  - **Av (standard)**: Batchoppgaver, som "Process Folder" eller "Batch Generate from Titles", behandler filer én etter én, serielt.
  - **På**: Lar pluginen behandle flere filer samtidig, noe som kan gjøre store batchjobber betydelig raskere.
- **Batch Concurrency**: Bare synlig når parallellitet er aktivert. Angir maks antall filer som behandles parallelt. Et høyere tall kan være raskere, men bruker flere ressurser og kan treffe API-rate limits. Standard: 1, område: 1-20.
- **Batch Size**: Bare synlig når parallellitet er aktivert. Antall filer som grupperes i én batch. Standard: 50, område: 10-200.
- **Delay Between Batches (ms)**: Bare synlig når parallellitet er aktivert. Valgfri forsinkelse i millisekunder mellom hver batch, som kan hjelpe med å håndtere API-rate limits. Standard: 1000 ms.
- **API Call Interval (ms)**: Minimumsforsinkelse i millisekunder *før og etter* hvert enkelt LLM-API-kall. Viktig for API-er med lav grense eller for å unngå 429-feil. Sett til 0 for ingen kunstig forsinkelse. Standard: 500 ms.
- **Chunk Word Count**: Maksimalt antall ord per chunk som sendes til LLM-en. Påvirker antallet API-kall for store filer. Standard: 3000.
- **Enable Duplicate Detection**: Slår grunnleggende kontroll av duplikate ord i behandlet innhold av eller på, resultater vises i konsollen. Standard: På.
- **Max Tokens**: Maksimalt antall tokens LLM-en skal generere per svar-chunk. Påvirker kostnad og detaljnivå. Standard: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Oversettelse
- **Default Target Language**: Velg standardspråket du vil oversette notatene dine til. Dette kan overstyres i UI-et når du kjører oversettelseskommandoen. Standard: English.
- **Customise Translation File Save Path**:
  - **Av (standard)**: Oversatte filer lagres i *samme mappe* som originalnotatet.
  - **På**: Lar deg angi en *relativ sti* i vaulten din, for eksempel `Translations`, der oversatte filer skal lagres. Mapper opprettes automatisk hvis de ikke finnes.
- **Use custom suffix for translated files**:
  - **Av (standard)**: Oversatte filer bruker standardsuffikset `_translated.md`, for eksempel `DittNotat_translated.md`.
  - **På**: Lar deg angi et tilpasset suffiks.
- **Custom Suffix**: Bare synlig når innstillingen over er aktivert. Skriv inn det tilpassede suffikset som skal legges til oversatte filnavn, for eksempel `_es` eller `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Innholdsgenerering
- **Enable Research in "Generate from Title"**:
  - **Av (standard)**: "Generate from Title" bruker bare tittelen som inndata.
  - **På**: Utfører nettforskning med den konfigurerte **Web Research Provider** og inkluderer funnene som kontekst for LLM-en under tittelbasert generering.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **På (standard)**: Kjører automatisk en Mermaid-syntaksretting etter Mermaid-relaterte arbeidsflyter som Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid og Translate.
  - **Av**: Lar generert Mermaid-utdata være urørt med mindre du kjører `Batch Mermaid Fix` manuelt eller legger det til i en tilpasset arbeidsflyt.
- **Output Language**: Velg ønsket utdata-språk for oppgavene "Generate from Title" og "Batch Generate from Title".
  - **English (standard)**: Prompts behandles og utdata leveres på engelsk.
  - **Andre språk**: LLM-en instrueres til å gjøre resonneringen på engelsk, men levere den endelige dokumentasjonen på språket du velger, for eksempel Español, Français, 简体中文, 繁體中文, العربية eller हिन्दी.
- **Change Prompt Word**:
  - **Change Prompt Word**: Lar deg endre prompt-ordet for en bestemt oppgave.
  - **Custom Prompt Word**: Skriv inn ditt tilpassede prompt-ord for oppgaven.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Av (standard)**: Filer som genereres vellykket flyttes til en undermappe med navnet `[OriginalFolderName]_complete` relativt til foreldremappen til originalmappen, eller `Vault_complete` hvis originalmappen var roten.
  - **På**: Lar deg angi et tilpasset navn for undermappen der ferdige filer flyttes.
- **Custom Output Folder Name**: Bare synlig når innstillingen over er aktivert. Skriv inn ønsket navn på undermappen, for eksempel `Generated Content` eller `_complete`. Ugyldige tegn er ikke tillatt. Hvis feltet står tomt, brukes `_complete`. Mappen opprettes relativt til foreldremappen til originalmappen.

#### Ettklikks arbeidsflytknapper
- **Visual Workflow Builder**: Opprett tilpassede arbeidsflytknapper fra innebygde handlinger uten å skrive DSL manuelt.
- **Custom Workflow Buttons DSL**: Avanserte brukere kan fortsatt redigere teksten i arbeidsflytdefinisjonen direkte. Ugyldig DSL faller trygt tilbake til standardarbeidsflyten og viser en advarsel i UI-et til sidepanelet eller innstillingene.
- **Workflow Error Strategy**:
  - **Stop on Error (standard)**: Stopper arbeidsflyten umiddelbart når ett steg feiler.
  - **Continue on Error**: Fortsetter med senere steg og rapporterer antallet mislykkede handlinger til slutt.
- **Default Workflow Included**: `One-Click Extract` kjeder sammen `Process File (Add Links)`, `Batch Generate from Titles` og `Batch Mermaid Fix`.

#### Tilpassede ledetekstinnstillinger
Denne funksjonen lar deg overstyre standardinstruksjonene, promptene, som sendes til LLM-en for bestemte oppgaver, og gir deg finmasket kontroll over utdata.

- **Enable Custom Prompts for Specific Tasks**:
  - **Av (standard)**: Pluginen bruker de innebygde standardpromptene for alle operasjoner.
  - **På**: Aktiverer muligheten til å angi tilpassede prompts for oppgavene som er listet under. Dette er hovedbryteren for funksjonen.

- **Use Custom Prompt for [Task Name]**: Bare synlig når innstillingen over er aktivert.
  - For hver støttede oppgave, som "Add Links", "Generate from Title", "Research & Summarize" og "Extract Concepts", kan du slå til eller fra den tilpassede prompten din individuelt.
  - **Av**: Den spesifikke oppgaven bruker standardprompten.
  - **På**: Den spesifikke oppgaven bruker teksten du skriver i det tilhørende tekstfeltet "Custom Prompt" under.

- **Custom Prompt Text Area**: Bare synlig når en oppgaves tilpassede prompt er aktivert.
  - **Default Prompt Display**: Pluginen viser standardprompten som referanse. Du kan bruke knappen **"Copy Default Prompt"** til å kopiere denne teksten som utgangspunkt for din egen tilpassede prompt.
  - **Custom Prompt Input**: Her skriver du egne instruksjoner til LLM-en.
  - **Placeholders**: Du kan, og bør, bruke spesielle placeholders i prompten, som pluginen erstatter med faktisk innhold før forespørselen sendes til LLM-en. Se standardprompten for å se hvilke placeholders som er tilgjengelige for hver oppgave. Vanlige placeholders er:
    - `{TITLE}`: Tittelen på det nåværende notatet.
    - `{RESEARCH_CONTEXT_SECTION}`: Innholdet som er samlet inn fra nettforskning.
    - `{USER_PROMPT}`: Innholdet i notatet som behandles.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Omfang for duplikatsjekk
- **Duplicate Check Scope Mode**: Styrer hvilke filer som sammenlignes mot notatene i **Concept Note Folder** for å finne potensielle duplikater.
  - **Entire Vault (standard)**: Sammenligner konseptnotater med alle andre notater i vaulten, unntatt selve Concept Note Folder.
  - **Include Specific Folders Only**: Sammenligner konseptnotater bare med notater i mappene som er listet under.
  - **Exclude Specific Folders**: Sammenligner konseptnotater med alle notater *unntatt* dem i mappene som er listet under, og ekskluderer også Concept Note Folder.
  - **Concept Folder Only**: Sammenligner konseptnotater bare med *andre notater i selve Concept Note Folder*. Dette hjelper deg å finne duplikater bare blant de genererte begrepene dine.
- **Include/Exclude Folders**: Bare synlig hvis modus er 'Include' eller 'Exclude'. Skriv inn de *relative stiene* til mappene du vil inkludere eller ekskludere, **én sti per linje**. Stier er store/små bokstavfølsomme og bruker `/` som skilletegn, for eksempel `Reference Material/Papers` eller `Daily Notes`. Disse mappene kan ikke være de samme som eller ligge inne i Concept Note Folder.

#### Leverandør for nettforskning
- **Search Provider**: Velg mellom `Tavily`, som krever API-nøkkel og anbefales, og `DuckDuckGo`, som er eksperimentell og ofte blokkeres av søkemotoren ved automatiserte forespørsler. Brukes for "Research & Summarize Topic" og valgfritt for "Generate from Title".
- **Tavily API Key**: Bare synlig hvis Tavily er valgt. Skriv inn API-nøkkelen din fra [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Bare synlig hvis Tavily er valgt. Maksimalt antall søkeresultater Tavily skal returnere, 1-20. Standard: 5.
- **Tavily Search Depth**: Bare synlig hvis Tavily er valgt. Velg `basic`, standard, eller `advanced`. Merk at `advanced` gir bedre resultater, men koster 2 API-kreditter per søk i stedet for 1.
- **DuckDuckGo Max Results**: Bare synlig hvis DuckDuckGo er valgt. Maksimalt antall søkeresultater som skal parses, 1-10. Standard: 5.
- **DuckDuckGo Content Fetch Timeout**: Bare synlig hvis DuckDuckGo er valgt. Maks antall sekunder det ventes når innhold fra hver DuckDuckGo-resultat-URL hentes. Standard: 15.
- **Max Research Content Tokens**: Omtrentlig maksimalt antall tokens fra kombinerte nettforskningsresultater, snippets og hentet innhold som skal inkluderes i oppsummeringsprompten. Hjelper med å styre størrelsen på context window og kostnad. Standard: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Fokusert læringsdomene
- **Enable Focused Learning Domain**:
  - **Av (standard)**: Prompts som sendes til LLM-en bruker standardinstruksjoner for generelle formål.
  - **På**: Lar deg spesifisere ett eller flere fagfelt for å forbedre den kontekstuelle forståelsen til LLM-en.
- **Learning Domain**: Bare synlig når innstillingen over er aktivert. Skriv inn dine spesifikke fagfelt, for eksempel `Materials Science`, `Polymer Physics` eller `Machine Learning`. Dette legger til linjen "Relevant Fields: [...]" i starten av promptene, noe som hjelper LLM-en med å generere mer presise og relevante lenker og mer relevant innhold for ditt fagområde.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Brukerveiledning

### Raske arbeidsflyter og sidepanel

- Åpne Notemd-sidepanelet for å få tilgang til grupperte handlingsseksjoner for kjernebehandling, generering, oversettelse, kunnskap og verktøy.
- Bruk området **Raske arbeidsflyter** øverst i sidepanelet for å starte tilpassede flerstegsknapper.
- Standardarbeidsflyten **One-Click Extract** kjører `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Arbeidsflytfremdrift, logger per steg og feil vises i sidepanelet, med en festet bunntekst som beskytter fremdriftslinjen og loggområdet mot å bli skjøvet bort av utvidede seksjoner.
- Fremdriftskortet holder statustekst, en egen prosentindikator og gjenværende tid lett lesbare ved et raskt blikk, og de samme tilpassede arbeidsflytene kan konfigureres på nytt fra innstillingene.

### Opprinnelig behandling (legge til wiki-lenker)
Dette er kjernefunksjonen som fokuserer på å identifisere begreper og legge til `[[wiki-links]]`.

**Viktig:** Denne prosessen fungerer bare på `.md`- eller `.txt`-filer. Du kan gratis konvertere PDF-filer til MD-filer med [Mineru](https://github.com/opendatalab/MinerU) før videre behandling.

1. **Bruke sidepanelet**:
   - Åpne Notemd-sidepanelet via tryllestavikonet eller kommandopaletten.
   - Åpne `.md`- eller `.txt`-filen.
   - Klikk på **"Process File (Add Links)"**.
   - For å behandle en mappe: klikk på **"Process Folder (Add Links)"**, velg mappen og klikk "Process".
   - Fremdrift vises i sidepanelet. Du kan avbryte oppgaven med knappen "Cancel Processing" i sidepanelet.
   - *Merknad om mappebehandling:* Filer behandles i bakgrunnen uten å bli åpnet i redigeringsprogrammet.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Bruke kommandopaletten** (`Ctrl+P` eller `Cmd+P`):
   - **Enkeltfil**: Åpne filen og kjør `Notemd: Process Current File`.
   - **Mappe**: Kjør `Notemd: Process Folder`, og velg deretter mappen. Filer behandles i bakgrunnen uten å bli åpnet i redigeringsprogrammet.
   - En fremdriftsmodal vises for handlinger fra kommandopaletten, og denne inkluderer en avbrytknapp.
   - *Merk:* pluginen fjerner automatisk innledende linjer med `\boxed{` og avsluttende linjer med `}` i det endelig behandlede innholdet før lagring, hvis slike linjer finnes.

### Nye funksjoner

1. **Oppsummer som Mermaid-diagram**:
   - Åpne notatet du vil oppsummere.
   - Kjør kommandoen `Notemd: Summarise as Mermaid diagram`, via kommandopaletten eller knappen i sidepanelet.
   - Pluginen genererer et nytt notat med Mermaid-diagrammet.

2. **Translate Note/Selection**:
   - Marker tekst i et notat hvis du bare vil oversette markeringen, eller kjør kommandoen uten markering for å oversette hele notatet.
   - Kjør kommandoen `Notemd: Translate Note/Selection`, via kommandopaletten eller knappen i sidepanelet.
   - En modal vises der du kan bekrefte eller endre **Target Language**, som standard hentes fra innstillingen i konfigurasjonen.
   - Pluginen bruker den konfigurerte **LLM Provider**, i henhold til Multi-Model-innstillingene, for å utføre oversettelsen.
   - Det oversatte innholdet lagres på den konfigurerte **Translation Save Path** med riktig suffiks, og åpnes i **en ny rute til høyre** for originalinnholdet for enkel sammenligning.
   - Du kan avbryte denne oppgaven via knappen i sidepanelet eller avbrytknappen i modalen.
3. **Batchoversettelse**:
   - Kjør kommandoen `Notemd: Batch Translate Folder` fra kommandopaletten og velg en mappe, eller høyreklikk på en mappe i filutforskeren og velg "Batch translate this folder".
   - Pluginen oversetter alle Markdown-filer i den valgte mappen.
   - Oversatte filer lagres på den konfigurerte oversettelsesstien, men åpnes ikke automatisk.
   - Denne prosessen kan avbrytes via fremdriftsmodalen.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Marker tekst i et notat, eller sørg for at notatet har en tittel som brukes som søkeemne.
   - Kjør kommandoen `Notemd: Research and Summarize Topic`, via kommandopaletten eller knappen i sidepanelet.
   - Pluginen bruker den konfigurerte **Search Provider**, Tavily eller DuckDuckGo, og passende **LLM Provider** i henhold til Multi-Model-innstillingene for å finne og oppsummere informasjon.
   - Sammendraget legges til det gjeldende notatet.
   - Du kan avbryte denne oppgaven via knappen i sidepanelet eller avbrytknappen i modalen.
   - *Merk:* DuckDuckGo-søk kan feile på grunn av bot-detektering. Tavily anbefales.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Åpne et notat, det kan være tomt.
   - Kjør kommandoen `Notemd: Generate Content from Title`, via kommandopaletten eller knappen i sidepanelet.
   - Pluginen bruker passende **LLM Provider**, i henhold til Multi-Model-innstillingene, til å generere innhold basert på tittelen til notatet og erstatte eksisterende innhold.
   - Hvis innstillingen **"Enable Research in 'Generate from Title'"** er aktivert, utføres først nettforskning med den konfigurerte **Web Research Provider**, og resultatene inkluderes som kontekst i prompten som sendes til LLM-en.
   - Du kan avbryte denne oppgaven via knappen i sidepanelet eller avbrytknappen i modalen.

5. **Batch Generate Content from Titles**:
   - Kjør kommandoen `Notemd: Batch Generate Content from Titles`, via kommandopaletten eller knappen i sidepanelet.
   - Velg mappen som inneholder notatene du vil behandle.
   - Pluginen går gjennom hver `.md`-fil i mappen, unntatt `_processed.md`-filer og filer i den utpekte "complete"-mappen, og genererer innhold basert på notattittelen mens eksisterende innhold erstattes. Filer behandles i bakgrunnen uten å bli åpnet i redigeringsprogrammet.
   - Filer som behandles vellykket flyttes til den konfigurerte "complete"-mappen.
   - Kommandoen respekterer innstillingen **"Enable Research in 'Generate from Title'"** for hvert notat som behandles.
   - Du kan avbryte denne oppgaven via knappen i sidepanelet eller avbrytknappen i modalen.
   - Fremdrift og resultater, som antall endrede filer og feil, vises i loggen i sidepanelet eller modalen.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Sørg for at **Concept Note Folder Path** er riktig konfigurert i innstillingene.
   - Kjør `Notemd: Check and Remove Duplicate Concept Notes`, via kommandopaletten eller knappen i sidepanelet.
   - Pluginen skanner concept note-mappen og sammenligner filnavn med notater utenfor mappen ved hjelp av flere regler, som eksakt treff, flertallsformer, normalisering og innehold.
   - Hvis potensielle duplikater blir funnet, vises et modalvindu som viser filene, årsaken til at de ble flagget og konfliktfilene.
   - Gå nøye gjennom listen. Klikk **"Delete Files"** for å flytte de listede filene til systemets papirkurv, eller **"Cancel"** for ikke å gjøre noe.
   - Fremdrift og resultater vises i loggen i sidepanelet eller modalen.

7. **Extract Concepts (Pure Mode)**:
   - Denne funksjonen lar deg trekke ut begreper fra et dokument og opprette tilsvarende konseptnotater *uten* å endre originalfilen. Den er perfekt for å fylle kunnskapsbasen din raskt fra et sett med dokumenter.
   - **Enkeltfil**: Åpne en fil og kjør kommandoen `Notemd: Extract concepts (create concept notes only)` fra kommandopaletten, eller klikk knappen **"Extract concepts (current file)"** i sidepanelet.
   - **Mappe**: Kjør kommandoen `Notemd: Batch extract concepts from folder` fra kommandopaletten, eller klikk knappen **"Extract concepts (folder)"** i sidepanelet og velg deretter en mappe som skal behandles.
   - Pluginen leser filene, identifiserer begreper og oppretter nye notater for dem i den valgte **Concept Note Folder**, mens originalfilene forblir urørt.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Denne kraftige kommandoen strømlinjeformer prosessen med å opprette og fylle ut nye konseptnotater.
   - Marker et ord eller en frase i redigeringsprogrammet.
   - Kjør kommandoen `Notemd: Create Wiki-Link & Generate Note from Selection`; det anbefales å tildele en hurtigtast, for eksempel `Cmd+Shift+W`.
   - Pluginen vil:
     1. Erstatte den markerte teksten med en `[[wiki-link]]`.
     2. Kontrollere om et notat med den tittelen allerede finnes i **Concept Note Folder**.
     3. Hvis det finnes, legger pluginen til en backlink til det nåværende notatet.
     4. Hvis det ikke finnes, oppretter den et nytt, tomt notat.
     5. Deretter kjører den automatisk kommandoen **"Generate Content from Title"** på det nye eller eksisterende notatet, og fyller det med AI-generert innhold.

9. **Extract Concepts and Generate Titles**:
   - Denne kommandoen kjeder sammen to sterke funksjoner til én strømlinjeformet arbeidsflyt.
   - Kjør kommandoen `Notemd: Extract Concepts and Generate Titles` fra kommandopaletten; det anbefales å tildele en hurtigtast.
   - Pluginen vil:
     1. Først kjøre oppgaven **"Extract concepts (current file)"** på den gjeldende aktive filen.
     2. Deretter automatisk kjøre oppgaven **"Batch generate from titles"** på mappen du har konfigurert som **Concept note folder path** i innstillingene.
   - Dette gjør at du først kan fylle kunnskapsbasen med nye begreper fra et kildedokument, og deretter umiddelbart utvide disse nye konseptnotatene med AI-generert innhold i ett samlet steg.

10. **Extract Specific Original Text**:
   - Konfigurer spørsmålene dine i innstillingene under "Extract Specific Original Text".
   - Bruk knappen "Extract Specific Original Text" i sidepanelet for å behandle den aktive filen.
   - **Merged Mode**: Gjør behandlingen raskere ved å sende alle spørsmål i én prompt.
   - **Translation**: Oversetter valgfritt den ekstraherte teksten til det konfigurerte språket ditt.
   - **Custom Output**: Konfigurer hvor og hvordan den ekstraherte filen lagres.

11. **Batch Mermaid Fix**:
   - Bruk knappen "Batch Mermaid Fix" i sidepanelet for å skanne en mappe og rette vanlige Mermaid-syntaksfeil.
   - Pluginen rapporterer filer som fortsatt inneholder feil i en fil `mermaid_error_{foldername}.md`.
   - Du kan valgfritt konfigurere pluginen til å flytte disse problematiske filene til en separat mappe for gjennomgang.

## Støttede LLM-leverandører

| Leverandør | Type | Krever API-nøkkel | Merknader |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Ja                     | Opprinnelig DeepSeek-endepunkt med håndtering av reasoning-modeller   |
| Qwen               | Cloud   | Ja                     | DashScope compatible-mode preset for Qwen / QwQ-modeller              |
| Qwen Code          | Cloud   | Ja                     | DashScope-forhåndsinnstilling med fokus på koderelaterte Qwen-modeller |
| Doubao             | Cloud   | Ja                     | Volcengine Ark-forhåndsinnstilling; model-feltet settes vanligvis til endpoint-ID-en din |
| Moonshot           | Cloud   | Ja                     | Offisielt Kimi / Moonshot-endepunkt                                   |
| GLM                | Cloud   | Ja                     | Offisielt Zhipu BigModel OpenAI-compatible-endepunkt                  |
| Z AI               | Cloud   | Ja                     | Internasjonalt GLM/Zhipu OpenAI-compatible-endepunkt; kompletterer `GLM` |
| MiniMax            | Cloud   | Ja                     | Offisielt MiniMax chat-completions-endepunkt                          |
| Huawei Cloud MaaS  | Cloud   | Ja                     | Huawei ModelArts MaaS OpenAI-compatible-endepunkt for hostede modeller |
| Baidu Qianfan      | Cloud   | Ja                     | Offisielt Qianfan OpenAI-compatible-endepunkt for ERNIE-modeller      |
| SiliconFlow        | Cloud   | Ja                     | Offisielt SiliconFlow OpenAI-compatible-endepunkt for hostede OSS-modeller |
| OpenAI             | Cloud   | Ja                     | Støtter GPT- og o-serie-modeller                                      |
| Anthropic          | Cloud   | Ja                     | Støtter Claude-modeller                                               |
| Google             | Cloud   | Ja                     | Støtter Gemini-modeller                                               |
| Mistral            | Cloud   | Ja                     | Støtter Mistral- og Codestral-familiene                               |
| Azure OpenAI       | Cloud   | Ja                     | Krever endpoint, API-nøkkel, deployment name og API Version           |
| OpenRouter         | Gateway | Ja                     | Gir tilgang til mange leverandører via OpenRouter-model-ID-er         |
| xAI                | Cloud   | Ja                     | Native Grok-endepunkt                                                 |
| Groq               | Cloud   | Ja                     | Rask OpenAI-compatible-inferens for hostede OSS-modeller              |
| Together           | Cloud   | Ja                     | OpenAI-compatible-endepunkt for hostede OSS-modeller                  |
| Fireworks          | Cloud   | Ja                     | OpenAI-compatible inferens-endepunkt                                  |
| Requesty           | Gateway | Ja                     | Multi-provider-ruter bak én API-nøkkel                                |
| OpenAI Compatible  | Gateway | Valgfritt              | Generisk forhåndsinnstilling for LiteLLM, vLLM, Perplexity, Vercel AI Gateway osv. |
| LMStudio           | Local   | Valgfritt (`EMPTY`)    | Kjører modeller lokalt via LM Studio-server                           |
| Ollama             | Local   | Nei                    | Kjører modeller lokalt via Ollama-server                              |

*Merk: For lokale leverandører, LMStudio og Ollama, må du sørge for at den respektive serverapplikasjonen kjører og er tilgjengelig via den konfigurerte Base URL.*
*Merk: For OpenRouter og Requesty må du bruke det leverandør-prefiksede eller fulle modell-ID-et som gatewayen viser, for eksempel `google/gemini-flash-1.5` eller `anthropic/claude-3-7-sonnet-latest`.*
*Merk: `Doubao` forventer vanligvis et Ark endpoint- eller deployment-ID i model-feltet, i stedet for et rått modellfamilienavn. Innstillingsskjermen advarer nå når placeholder-verdien fortsatt er til stede, og blokkerer connection tests til du erstatter den med et faktisk endpoint-ID.*
*Merk: `Z AI` peker mot den internasjonale `api.z.ai`-linjen, mens `GLM` fortsatt bruker BigModel-endepunktet for Fastlands-Kina. Velg forhåndsinnstillingen som matcher kontoregionen din.*
*Merk: Kina-fokuserte forhåndsinnstillinger bruker chat-first-tilkoblingstester, slik at testen validerer den faktisk konfigurerte modellen eller deploymenten og ikke bare rekkevidden til API-nøkkelen.*
*Merk: `OpenAI Compatible` er ment for tilpassede gateways og proxyer. Angi Base URL, API-nøkkelpolicy og modell-ID i henhold til dokumentasjonen fra leverandøren din.*

## Nettverksbruk og datahåndtering

Notemd kjører lokalt inne i Obsidian, men noen funksjoner sender utgående forespørsler.

### Kall til LLM-leverandører (konfigurerbart)

- Trigger: filbehandling, generering, oversettelse, forskningsoppsummering, Mermaid-oppsummering samt tilkoblings- og diagnosehandlinger.
- Endepunkt: Base URL-ene til leverandørene du har konfigurert i Notemd-innstillingene.
- Data som sendes: prompttekst og oppgaveinnhold som kreves for behandlingen.
- Merknad om datahåndtering: API-nøkler konfigureres lokalt i plugininnstillingene og brukes til å signere forespørsler fra enheten din.

### Kall til nettforskning (valgfritt)

- Trigger: når nettforskning er aktivert og en søkeleverandør er valgt.
- Endepunkt: Tavily API eller DuckDuckGo-endepunkter.
- Data som sendes: forskningsspørringen din og nødvendig forespørselsmetadata.

### Utviklerdiagnostikk og feilsøkingslogger (valgfritt)

- Trigger: API debug mode og utviklerdiagnostiske handlinger.
- Lagring: diagnose- og feillogger skrives til roten av vaulten, for eksempel `Notemd_Provider_Diagnostic_*.txt` og `Notemd_Error_Log_*.txt`.
- Risikonotat: logger kan inneholde utdrag av forespørsler og svar. Gå gjennom loggene før du deler dem offentlig.

### Lokal lagring

- Pluginkonfigurasjonen lagres i `.obsidian/plugins/notemd/data.json`.
- Genererte filer, rapporter og valgfrie logger lagres i vaulten i henhold til innstillingene dine.

## Feilsøking

### Vanlige problemer
- **Pluginen lastes ikke inn**: Sørg for at `manifest.json`, `main.js` og `styles.css` ligger i riktig mappe, `<Vault>/.obsidian/plugins/notemd/`, og start Obsidian på nytt. Sjekk Developer Console, `Ctrl+Shift+I` eller `Cmd+Option+I`, for feil ved oppstart.
- **Behandlingsfeil / API-feil**:
  1. **Sjekk filformatet**: Sørg for at filen du prøver å behandle eller kontrollere har filendelsen `.md` eller `.txt`. Notemd støtter for øyeblikket bare disse tekstbaserte formatene.
  2. Bruk kommandoen eller knappen "Test LLM Connection" for å verifisere innstillingene for den aktive leverandøren.
  3. Dobbeltsjekk API Key, Base URL, Model Name og API Version, for Azure. Sørg for at API-nøkkelen er korrekt og har tilstrekkelige kreditter eller tillatelser.
  4. Sørg for at den lokale LLM-serveren din, LMStudio eller Ollama, kjører, og at Base URL er korrekt, for eksempel `http://localhost:1234/v1` for LMStudio.
  5. Sjekk internettforbindelsen din for skyleverandører.
  6. **For feil ved behandling av enkeltfil:** Gå gjennom Developer Console for detaljerte feilmeldinger. Kopier dem med knappen i error modal hvis det er nødvendig.
  7. **For batchbehandlingsfeil:** Sjekk filen `error_processing_filename.log` i roten av vaulten for detaljerte feilmeldinger for hver fil som feilet. Developer Console eller error modal kan vise et sammendrag eller en generell batchfeil.
  8. **Automatiske feillogger:** Hvis en prosess feiler, lagrer pluginen automatisk en detaljert loggfil med navnet `Notemd_Error_Log_[Timestamp].txt` i rotmappen til vaulten. Filen inneholder feilmelding, stack trace og øktlogger. Hvis du opplever vedvarende problemer, bør du kontrollere denne filen. Hvis du aktiverer "API Error Debugging Mode" i innstillingene, fylles denne loggen med enda mer detaljerte API-responsdata.
  9. **Diagnostikk av lange forespørsler mot reelt endepunkt (utvikler)**:
     - Innebygget sti, anbefalt først: bruk **Settings -> Notemd -> Developer provider diagnostic (long request)** for å kjøre en kjøretidsprobe mot den aktive leverandøren og generere `Notemd_Provider_Diagnostic_*.txt` i roten av vaulten.
     - CLI-sti, utenfor Obsidian runtime: bruk følgende for reproducerbar sammenligning på endepunktnivå mellom bufret og streamet oppførsel:
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
       Den genererte rapporten inneholder timing per forsøk, `First Byte` og `Duration`, sanert forespørselsmetadata, svarhoder, rå eller delvise body-fragmenter, parsede streamfragmenter og feilpunkter på transportlaget.
- **Problemer med LM Studio/Ollama-tilkobling**:
  - **Tilkoblingstest feiler**: Sørg for at den lokale serveren, LM Studio eller Ollama, kjører, og at riktig modell er lastet inn eller tilgjengelig.
  - **CORS-feil, Ollama på Windows**: Hvis du får CORS-feil, Cross-Origin Resource Sharing, når du bruker Ollama på Windows, kan det hende du må sette miljøvariabelen `OLLAMA_ORIGINS`. Det kan du gjøre ved å kjøre `set OLLAMA_ORIGINS=*` i ledeteksten før du starter Ollama. Dette tillater forespørsler fra alle origins.
  - **Aktiver CORS i LM Studio**: For LM Studio kan du aktivere CORS direkte i serverinnstillingene, noe som kan være nødvendig hvis Obsidian kjører i en nettleser eller har strenge origin policies.
- **Feil ved mappeopprettelse ("File name cannot contain...")**:
  - Dette betyr vanligvis at stien som er angitt i innstillingene, **Processed File Folder Path** eller **Concept Note Folder Path**, er ugyldig *for Obsidian*.
  - **Sørg for at du bruker relative stier**, for eksempel `Processed` eller `Notes/Concepts`, og **ikke absolutte stier**, som `C:\Users\...` eller `/Users/...`.
  - Sjekk ugyldige tegn: `* " \ / < > : | ? # ^ [ ]`. Merk at `\` også er ugyldig på Windows i Obsidian-stier. Bruk `/` som skilletegn i stier.
- **Ytelsesproblemer**: Behandling av store filer eller mange filer kan ta tid. Reduser innstillingen "Chunk Word Count" for potensielt raskere, men flere, API-kall. Prøv en annen LLM-leverandør eller modell.
- **Uventet lenking**: Kvaliteten på lenking avhenger i stor grad av LLM-en og prompten. Eksperimenter med ulike modeller eller temperature-innstillinger.

## Bidra

Bidrag er velkomne. Se GitHub-repositoriet for retningslinjer: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumentasjon for vedlikeholdere

- [Utgivelsesarbeidsflyt (engelsk)](./docs/maintainer/release-workflow.md)
- [Utgivelsesarbeidsflyt (forenklet kinesisk)](./docs/maintainer/release-workflow.zh-CN.md)

## Lisens

MIT License - Se filen [LICENSE](LICENSE) for detaljer.

---


*Notemd v1.8.4 - Forbedre Obsidian-kunnskapsgrafen din med AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
