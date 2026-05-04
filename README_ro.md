![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Pluginul Notemd pentru Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Citiți documentația și în alte limbi: [Hub lingvistic](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Îmbunătățirea multilingvă a cunoștințelor cu AI
==================================================
```

O modalitate simplă de a-ți crea propria bază de cunoștințe.

Notemd îți îmbunătățește fluxul de lucru din Obsidian prin integrarea cu diverse modele lingvistice mari (LLM) pentru a procesa note multilingve, a genera automat wiki-link-uri pentru conceptele cheie, a crea note de concept corespunzătoare, a face cercetare web și a te ajuta să construiești grafuri de cunoștințe puternice și multe altele.

Dacă iubești să folosești Notemd, te rugăm să iei în considerare [⭐ să dai o stea pe GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) sau [☕️ să-mi cumperi o cafea](https://ko-fi.com/jacobinwwey).

**Versiune:** 1.8.4

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Cuprins

- [Pornire rapidă](#pornire-rapidă)
- [Suport lingvistic](#suport-lingvistic)
- [Funcționalități](#funcționalități)
- [Instalare](#instalare)
- [Configurare](#configurare)
- [Ghid de utilizare](#ghid-de-utilizare)
- [Furnizori LLM acceptați](#furnizori-llm-acceptați)
- [Utilizarea rețelei și gestionarea datelor](#utilizarea-rețelei-și-gestionarea-datelor)
- [Depanare](#depanare)
- [Contribuții](#contribuții)
- [Documentație pentru Întreținători](#documentație-pentru-întreținători)
- [Licență](#licență)

## Pornire rapidă

1.  **Instalează și activează**: ia pluginul din Obsidian Marketplace.
2.  **Configurează LLM-ul**: mergi la `Settings -> Notemd`, selectează furnizorul LLM dorit (de exemplu OpenAI sau unul local precum Ollama) și introdu cheia API/URL-ul.
3.  **Deschide bara laterală**: fă clic pe iconița baghetă Notemd din ribbonul din stânga pentru a deschide sidebarul.
4.  **Procesează o notă**: deschide orice notă și fă clic pe **"Process File (Add Links)"** în sidebar pentru a adăuga automat `[[wiki-links]]` la conceptele cheie.
5.  **Rulează un flux rapid**: folosește butonul implicit **"One-Click Extract"** pentru a lega procesarea, generarea în lot și curățarea Mermaid dintr-un singur punct de intrare.

Atât. Explorează setările pentru a debloca mai multe funcții, precum cercetare web, traducere și generare de conținut.

## Suport lingvistic

### Contract de comportament lingvistic

| Aspect | Domeniu | Implicit | Note |
|---|---|---|---|
| `Limba interfeței` | Doar textul interfeței pluginului (setări, bara laterală, notificări, dialoguri) | `auto` | Urmează localizarea Obsidian; cataloagele actuale de UI sunt `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Limba ieșirii sarcinilor` | Ieșirea generată de LLM pentru sarcini (linkuri, rezumate, generare, extragere, ținta traducerii) | `en` | Poate fi globală sau per sarcină când `Folosește limbi diferite pentru sarcini` este activat. |
| `Dezactivează traducerea automată` | Sarcinile non-Translate păstrează contextul limbii sursă | `false` | Sarcinile explicite `Translate` aplică în continuare limba țintă configurată. |
| Fallback de localizare | Rezolvarea cheilor UI lipsă | locale -> `en` | Menține UI-ul stabil când unele chei nu sunt încă traduse. |

- Documentele sursă întreținute sunt engleza și chineza simplificată, iar traducerile README publicate sunt legate în antetul de mai sus.
- Acoperirea pentru UI locale din aplicație corespunde în prezent exact catalogului explicit din cod: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Fallback-ul la engleză rămâne o plasă de siguranță la nivel de implementare, dar suprafețele vizibile suportate sunt acoperite de teste de regresie și nu ar trebui să revină tăcut la engleză în utilizarea normală.
- Detalii suplimentare și ghidul de contribuție sunt urmărite în [Hubul lingvistic](./docs/i18n/README.md).

## Funcționalități

### Procesare de documente asistată de AI
- **Suport Multi-LLM**: conectare la diverși furnizori LLM din cloud și locali (vezi [Furnizori LLM acceptați](#furnizori-llm-acceptați)).
- **Împărțire inteligentă**: împarte automat documentele mari în bucăți ușor de procesat pe baza numărului de cuvinte.
- **Păstrarea conținutului**: încearcă să mențină formatarea originală în timp ce adaugă structură și linkuri.
- **Urmărirea progresului**: actualizări în timp real prin Notemd Sidebar sau printr-o fereastră modală de progres.
- **Operațiuni anulabile**: anulează orice sarcină de procesare (individuală sau în lot) pornită din sidebar prin butonul ei dedicat de anulare. Operațiunile lansate din paleta de comenzi folosesc o fereastră modală care poate fi și ea anulată.
- **Configurare multi-model**: folosește furnizori LLM diferiți *și* modele specifice pentru sarcini diferite (Add Links, Research, Generate Title, Translate) sau folosește un singur furnizor pentru toate.
- **Stable API Calls (Retry Logic)**: activează opțional reîncercări automate pentru apelurile API LLM eșuate, cu interval și limită de încercări configurabile.
- **Teste de conexiune rezistente pentru furnizori**: dacă primul test de furnizor întâlnește o deconectare tranzitorie de rețea, Notemd trece acum la secvența stabilă de retry înainte de a eșua, acoperind transporturile OpenAI-compatible, Anthropic, Google, Azure OpenAI și Ollama.
- **Fallback de transport în funcție de mediul de rulare**: când un request lung către furnizor este întrerupt de `requestUrl` prin erori tranzitorii de rețea precum `ERR_CONNECTION_CLOSED`, Notemd reîncearcă acum aceeași încercare printr-un transport fallback specific mediului înainte de a intra în bucla configurată de retry: build-urile desktop folosesc Node `http/https`, iar mediile non-desktop folosesc `fetch` din browser. Asta reduce eșecurile false pe gateway-uri lente și proxy-uri inverse.
- **Întărirea lanțului stabil pentru requesturi lungi OpenAI-compatible**: în modul stabil, apelurile OpenAI-compatible folosesc acum o ordine explicită în 3 etape pentru fiecare încercare: transport principal direct cu streaming, apoi transport direct fără streaming, apoi fallback prin `requestUrl` (care poate totuși urca la parsare cu streaming când este necesar). Asta reduce fals-negativele în situațiile în care furnizorii termină răspunsuri buffered, dar pipe-urile de streaming sunt instabile.
- **Fallback de streaming conștient de protocol pentru API-urile LLM**: încercările fallback de lungă durată trec acum la parsare cu streaming conștientă de protocol pentru toate căile LLM integrate, nu doar pentru endpointurile OpenAI-compatible. Notemd gestionează acum SSE în stil OpenAI/Azure, streaming Anthropic Messages, răspunsuri SSE Google Gemini și fluxuri Ollama NDJSON atât pe `http/https` desktop, cât și pe `fetch` non-desktop, iar punctele de intrare rămase în stil OpenAI direct reutilizează aceeași cale fallback comună.
- **Preseturi de furnizori pregătite pentru China**: preseturile integrate acoperă acum `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` și `SiliconFlow` pe lângă furnizorii existenți globali și locali.
- **Procesare în lot fiabilă**: logica îmbunătățită de procesare concurentă, cu **apeluri API eșalonate**, ajută la prevenirea erorilor de rate-limit și asigură performanță stabilă în joburile mari în lot. Noua implementare se asigură că sarcinile pornesc la intervale diferite, nu toate deodată.
- **Raportare exactă a progresului**: a fost corectat un bug prin care bara de progres putea rămâne blocată, astfel încât UI-ul reflectă acum întotdeauna starea reală a operațiunii.
- **Procesare paralelă în lot mai robustă**: a fost rezolvată o problemă prin care operațiunile paralele în lot se opreau prematur, asigurând procesarea fiabilă și eficientă a tuturor fișierelor.
- **Acuratețea barei de progres**: a fost corectat un bug prin care bara de progres pentru comanda "Create Wiki-Link & Generate Note" rămânea blocată la 95%, astfel încât acum afișează corect 100% la finalizare.
- **Depanare API extinsă**: modul "API Error Debugging Mode" capturează acum corpuri complete de răspuns de la furnizorii LLM și serviciile de căutare (Tavily/DuckDuckGo) și înregistrează și o cronologie a transportului pentru fiecare încercare, cu URL-uri de request sanitizate, durată scursă, headere de răspuns, corpuri de răspuns parțiale, conținut de flux parțial parsat și urme de stivă, pentru depanare mai bună în fallback-urile OpenAI-compatible, Anthropic, Google, Azure OpenAI și Ollama.
- **Panou Developer Mode**: setările includ acum un panou dedicat exclusiv dezvoltatorilor pentru diagnosticare, care rămâne ascuns până când "Developer mode" este activat. Acesta permite selectarea căilor de apel pentru diagnostic și rularea repetată a sondelor de stabilitate pentru modul selectat.
- **Sidebar reproiectat**: acțiunile integrate sunt grupate în secțiuni concentrate, cu etichete mai clare, stare live, progres anulabil și loguri copiabile pentru a reduce aglomerarea din sidebar. Subsolul cu progres/log rămâne vizibil chiar și când toate secțiunile sunt expandate, iar starea ready folosește o pistă de progres standby mai clară.
- **Polish de interacțiune și lizibilitate pentru sidebar**: butoanele din sidebar oferă acum feedback mai clar la hover/apăsare/focus, iar butoanele CTA colorate (inclusiv `One-Click Extract` și `Batch generate from titles`) folosesc contrast mai puternic al textului pentru lizibilitate mai bună în teme diferite.
- **Mapare CTA doar pentru acțiuni pe un singur fișier**: stilizarea CTA colorată este rezervată acum doar pentru acțiunile pe fișier individual. Acțiunile pe lot/la nivel de folder și fluxurile mixte folosesc stilizare non-CTA pentru a reduce clickurile greșite legate de amploarea acțiunii.
- **Fluxuri one-click personalizate**: transformă utilitarele integrate din sidebar în butoane personalizate reutilizabile, cu nume definite de utilizator și lanțuri de acțiuni asamblate. Un flux implicit `One-Click Extract` este inclus din start.

### Îmbunătățirea grafului de cunoștințe
- **Wiki-Linking automat**: identifică și adaugă `[[wiki-links]]` la conceptele de bază din notele procesate pe baza ieșirii LLM.
- **Crearea notelor de concept (opțională și personalizabilă)**: creează automat note noi pentru conceptele descoperite într-un folder specificat din vault.
- **Căi de ieșire personalizabile**: configurează căi relative separate în vault pentru salvarea fișierelor procesate și a notelor de concept nou create.
- **Nume de fișiere de ieșire personalizabile (Add Links)**: opțional poți **suprascrie fișierul original** sau poți folosi un sufix/șir de înlocuire personalizat în locul sufixului implicit `_processed.md` la procesarea fișierelor pentru linkuri.
- **Menținerea integrității linkurilor**: gestionare de bază pentru actualizarea linkurilor când notele sunt redenumite sau șterse în vault.
- **Extragere pură de concepte**: extrage concepte și creează note de concept corespunzătoare fără a modifica documentul original. Este ideal pentru popularea unei baze de cunoștințe din documente existente fără a le altera. Funcția are opțiuni configurabile pentru crearea de note de concept minimale și adăugarea de backlink-uri.

### Traducere

- **Traducere asistată de AI**:
    - Tradu conținutul notelor folosind LLM-ul configurat.
    - **Suport pentru fișiere mari**: împarte automat fișierele mari în bucăți mai mici pe baza setării `Chunk word count` înainte de a le trimite către LLM. Fragmentele traduse sunt apoi reunite fără întreruperi într-un singur document.
    - Suportă traducerea între mai multe limbi.
    - Limba țintă poate fi personalizată din setări sau din UI.
    - Deschide automat textul tradus în partea dreaptă a textului original pentru citire ușoară.
- **Traducere în lot**:
    - Tradu toate fișierele dintr-un folder selectat.
    - Suportă procesare paralelă atunci când "Enable Batch Parallelism" este activat.
    - Folosește prompturi personalizate pentru traducere dacă sunt configurate.
	- Adaugă opțiunea "Batch translate this folder" în meniul contextual din exploratorul de fișiere.
- **Dezactivează traducerea automată**: când această opțiune este activată, sarcinile non-Translate nu mai forțează ieșirile într-o anumită limbă, păstrând contextul limbii originale. Sarcina explicită "Translate" va continua să traducă potrivit configurației.

### Cercetare web și generare de conținut
- **Cercetare web și rezumare**:
    - Efectuează căutări web folosind Tavily (necesită cheie API) sau DuckDuckGo (experimental).
    - **Robustețe îmbunătățită a căutării**: căutarea DuckDuckGo include acum logică de parsare îmbunătățită (DOMParser cu fallback Regex) pentru a face față schimbărilor de layout și pentru a asigura rezultate fiabile.
    - Rezumă rezultatele căutării folosind LLM-ul configurat.
    - Limba de ieșire a rezumatului poate fi personalizată din setări.
    - Atașează rezumatele la nota curentă.
    - Limită configurabilă de tokeni pentru conținutul de cercetare trimis către LLM.
- **Generare de conținut din titlu**:
    - Folosește titlul notei pentru a genera conținut inițial prin LLM, înlocuind conținutul existent.
    - **Cercetare opțională**: configurează dacă se efectuează cercetare web (folosind furnizorul selectat) pentru a oferi context generării.
- **Generare de conținut în lot din titluri**: generează conținut pentru toate notele dintr-un folder selectat pe baza titlurilor lor (respectă setarea de cercetare opțională). Fișierele procesate cu succes sunt mutate într-un **subfolder configurabil "complete"** (de exemplu `[foldername]_complete` sau un nume personalizat) pentru a evita reprocesarea.
- **Cuplare cu Mermaid Auto-Fix**: când repararea automată Mermaid este activată, fluxurile de lucru legate de Mermaid repară automat fișierele generate sau folderele de ieșire după procesare. Asta acoperă fluxurile Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid și Translate.

### Funcții utilitare
- **Rezumă ca diagramă Mermaid**:
    - Această funcție îți permite să rezumi conținutul unei note într-o diagramă Mermaid.
    - Limba de ieșire a diagramei Mermaid poate fi personalizată din setări.
    - **Mermaid Output Folder**: configurează folderul în care vor fi salvate fișierele generate cu diagrame Mermaid.
    - **Translate Summarize to Mermaid Output**: traduce opțional conținutul diagramei Mermaid generate în limba țintă configurată.
    - 
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Corectarea simplă a formatării formulelor**:
    - Corectează rapid formulele matematice pe o singură linie delimitate de un singur `$` în blocuri standard `$$`.
    - **Single File**: procesează fișierul curent prin butonul din sidebar sau din paleta de comenzi.
    - **Batch Fix**: procesează toate fișierele dintr-un folder selectat prin butonul din sidebar sau din paleta de comenzi.

- **Verificare duplicate în fișierul curent**: această comandă ajută la identificarea termenilor potențial duplicat din fișierul activ.
- **Detectare duplicate**: verificare de bază a cuvintelor duplicate din conținutul fișierului procesat curent (rezultatele sunt înregistrate în consolă).
- **Check and Remove Duplicate Concept Notes**: identifică note potențial duplicate în **Concept Note Folder** configurat, pe baza potrivirilor exacte de nume, pluralelor, normalizării și conținerii unui singur cuvânt, comparate cu note din afara folderului. Domeniul comparației (ce note din afara folderului de concepte sunt verificate) poate fi configurat la **întregul vault**, **foldere specifice incluse** sau **toate folderele cu excluderea unora specifice**. Afișează o listă detaliată cu motive și fișiere conflictuale, apoi cere confirmare înainte de a muta duplicatele identificate în coșul sistemului. Afișează progresul în timpul ștergerii.
- **Batch Mermaid Fix**: aplică corecții de sintaxă Mermaid și LaTeX tuturor fișierelor Markdown dintr-un folder selectat de utilizator.
    - **Workflow Ready**: poate fi folosită ca utilitar independent sau ca pas într-un buton personalizat de flux one-click.
    - **Error Reporting**: generează un raport `mermaid_error_{foldername}.md` care listează fișierele ce mai conțin posibile erori Mermaid după procesare.
    - **Move Error Files**: mută opțional fișierele cu erori detectate într-un folder specificat pentru revizuire manuală.
    - **Smart Detection**: verifică acum inteligent fișierele pentru erori de sintaxă folosind `mermaid.parse` înainte de a încerca repararea, economisind timp de procesare și evitând editările inutile.
    - **Safe Processing**: se asigură că reparările de sintaxă se aplică exclusiv blocurilor de cod Mermaid, prevenind modificarea accidentală a tabelelor Markdown sau a altui conținut. Include protecții robuste pentru sintaxa tabelelor (de exemplu `| :--- |`) împotriva corecțiilor agresive de debug.
    - **Deep Debug Mode**: dacă erorile persistă după prima reparație, este declanșat un mod avansat de depanare profundă. Acest mod gestionează cazuri limită complexe, inclusiv:
        - **Comment Integration**: unește automat comentariile de la final (care încep cu `%`) în eticheta muchiei (de exemplu `A -- Label --> B; % Comment` devine `A -- "Label(Comment)" --> B;`).
        - **Malformed Arrows**: repară săgețile absorbite în ghilimele (de exemplu `A -- "Label -->" B` devine `A -- "Label" --> B`).
        - **Inline Subgraphs**: convertește etichetele de subgraf inline în etichete de muchii.
        - **Reverse Arrow Fix**: corectează săgețile nestandard `X <-- Y` în `Y --> X`.
        - **Direction Keyword Fix**: se asigură că cuvântul-cheie `direction` este cu litere mici în interiorul subgrafurilor (de exemplu `Direction TB` -> `direction TB`).
        - **Comment Conversion**: convertește comentariile `//` în etichete de muchii (de exemplu `A --> B; // Comment` -> `A -- "Comment" --> B;`).
        - **Duplicate Label Fix**: simplifică etichetele repetate între paranteze pătrate (de exemplu `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Invalid Arrow Fix**: convertește sintaxa invalidă de săgeată `--|>` în forma standard `-->`.
        - **Robust Label & Note Handling**: gestionare îmbunătățită pentru etichete care conțin caractere speciale (precum `/`) și suport mai bun pentru sintaxa personalizată a notelor (`note for ...`), asigurând eliminarea curată a artefactelor precum parantezele finale.
        - **Advanced Fix Mode**: include corecții robuste pentru etichete de noduri neîncadrate în ghilimele care conțin spații, caractere speciale sau paranteze imbricate (de exemplu `Node[Label [Text]]` -> `Node["Label [Text]"]`), asigurând compatibilitatea cu diagrame complexe, precum traseele Stellar Evolution. De asemenea, corectează etichete de muchii malformate (de exemplu `--["Label["-->` în `-- "Label" -->`). În plus, convertește comentariile inline (`Consensus --> Adaptive; # Some advanced consensus` în `Consensus -- "Some advanced consensus" --> Adaptive`) și repară ghilimelele incomplete de la finalul liniilor (`;"` la final devine `"]`).
                        - **Note Conversion**: convertește automat comentariile `note right/left of` și `note :` independente în definiții standard de noduri Mermaid și conexiuni (de exemplu `note right of A: text` devine `NoteA["Note: text"]` legat la `A`), prevenind erorile de sintaxă și îmbunătățind layoutul. Acum suportă atât legături cu săgeată (`-->`), cât și legături solide (`---`).
                        - **Extended Note Support**: convertește automat `note for Node "Content"` și `note of Node "Content"` în noduri standard de notă legate (de exemplu `NoteNode[" Content"]` legat la `Node`), asigurând compatibilitate cu sintaxa extinsă de utilizator.
                        - **Enhanced Note Correction**: redenumește automat notele cu numerotare secvențială (de exemplu `Note1`, `Note2`) pentru a preveni aliasing-ul când există mai multe note.                - **Parallelogram/Shape Fix**: corectează formele malformate de nod, precum `[/["Label["/]`, în forma standard `["Label"]`, asigurând compatibilitatea cu conținutul generat.
                        - **Standardize Pipe Labels**: repară și standardizează automat etichetele muchiilor care conțin pipe-uri, asigurând încadrarea lor corectă în ghilimele (de exemplu `-->|Text|` devine `-->|"Text"|` și `-->|Math|^2|` devine `-->|"Math|^2"|`).
        - **Misplaced Pipe Fix**: corectează etichetele de muchii plasate greșit înainte de săgeată (de exemplu `>|"Label"| A --> B` devine `A -->|"Label"| B`).
                - **Merge Double Labels**: detectează și unește etichetele duble complexe pe o singură muchie (de exemplu `A -- Label1 -- Label2 --> B` sau `A -- Label1 -- Label2 --- B`) într-o singură etichetă curată cu întreruperi de linie (`A -- "Label1<br>Label2" --> B`).
                        - **Unquoted Label Fix**: încadrează automat în ghilimele etichetele de nod care conțin caractere potențial problematice (de exemplu ghilimele, semne egal, operatori matematici) dar nu au ghilimele exterioare (de exemplu `Plot[Plot "A"]` devine `Plot["Plot "A""]`), prevenind erorile de randare.
                        - **Intermediate Node Fix**: împarte muchiile care conțin o definiție de nod intermediar în două muchii separate (de exemplu `A -- B[...] --> C` devine `A --> B[...]` și `B[...] --> C`), asigurând o sintaxă Mermaid validă.
                        - **Concatenated Label Fix**: repară robust definițiile de noduri în care ID-ul este concatenat cu eticheta (de exemplu `SubdivideSubdivide...` devine `Subdivide["Subdivide..."]`), chiar și când este precedat de etichete pipe sau când duplicarea nu este exactă, prin validarea față de ID-uri de nod cunoscute.
                        - **Extract Specific Original Text**:    - Definește o listă de întrebări în setări.
                    - Extrage segmente de text verbatim din nota activă care răspund la aceste întrebări.
                    - **Merged Query Mode**: opțiune de a procesa toate întrebările într-un singur apel API pentru eficiență.
                    - **Translation**: opțiune de a include traduceri ale textului extras în ieșire.
                    - **Custom Output**: cale de salvare și sufix de nume de fișier configurabile pentru fișierul de text extras.- **LLM Connection Test**: verifică setările API pentru furnizorul activ.

## Instalare

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Din Obsidian Marketplace (recomandat)
1. Deschide în Obsidian **Settings** -> **Community plugins**.
2. Asigură-te că "Restricted mode" este **dezactivat**.
3. Fă clic pe **Browse** la Community plugins și caută "Notemd".
4. Fă clic pe **Install**.
5. După instalare, fă clic pe **Enable**.

### Instalare manuală
1. Descarcă cele mai recente asset-uri de release de pe [pagina GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Fiecare release include și `README.md` pentru referință în pachet, dar pentru instalarea manuală ai nevoie doar de `main.js`, `styles.css` și `manifest.json`.
2. Navighează la folderul de configurare al vaultului tău Obsidian: `<YourVault>/.obsidian/plugins/`.
3. Creează un folder nou numit `notemd`.
4. Copiază `main.js`, `styles.css` și `manifest.json` în folderul `notemd`.
5. Repornește Obsidian.
6. Mergi la **Settings** -> **Community plugins** și activează "Notemd".

## Configurare

Accesează setările pluginului prin:
**Settings** -> **Community Plugins** -> **Notemd** (fă clic pe iconița rotiță).

### Configurarea furnizorului LLM
1.  **Furnizor activ**: selectează furnizorul LLM pe care vrei să îl folosești din meniul dropdown.
2.  **Setările furnizorului**: configurează setările specifice pentru furnizorul selectat:
    *   **API Key**: necesară pentru majoritatea furnizorilor cloud (de exemplu OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Nu este necesară pentru Ollama. Este opțională pentru LM Studio și presetul generic `OpenAI Compatible` atunci când endpointul tău acceptă acces anonim sau placeholder.
    *   **Base URL / Endpoint**: endpointul API pentru serviciu. Valorile implicite sunt furnizate, dar poate fi nevoie să îl schimbi pentru modelele locale (LMStudio, Ollama), gateway-uri (OpenRouter, Requesty, OpenAI Compatible) sau deployment-uri Azure specifice. **Necesar pentru Azure OpenAI.**
    *   **Model**: numele/ID-ul modelului specific de folosit (de exemplu `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Asigură-te că modelul este disponibil la endpointul/furnizorul tău.
    *   **Temperature**: controlează aleatorietatea ieșirii LLM-ului (0 = determinist, 1 = creativitate maximă). Valorile mai mici (de exemplu 0.2-0.5) sunt de obicei mai bune pentru sarcini structurate.
    *   **API Version (Azure Only)**: necesară pentru deployment-urile Azure OpenAI (de exemplu `2024-02-15-preview`).
3.  **Testează conexiunea**: folosește butonul "Testează conexiunea" pentru furnizorul activ ca să verifici setările. Furnizorii OpenAI-compatible folosesc acum verificări conștiente de furnizor: endpointuri precum `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` și `OpenAI Compatible` sondează direct `chat/completions`, în timp ce furnizorii cu endpoint `/models` fiabil pot continua să folosească mai întâi listarea de modele. Dacă prima sondă eșuează printr-o deconectare tranzitorie de rețea precum `ERR_CONNECTION_CLOSED`, Notemd trece automat la secvența stabilă de retry în loc să eșueze imediat.
4.  **Gestionează configurațiile furnizorilor**: folosește butoanele "Export Providers" și "Import Providers" pentru a salva/încărca setările furnizorilor LLM într-un fișier `notemd-providers.json` din directorul de configurare al pluginului. Asta permite backup și partajare ușoară.
5.  **Acoperirea preseturilor**: pe lângă furnizorii originali, Notemd include acum preseturi pentru `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` și o țintă generică `OpenAI Compatible` pentru LiteLLM, vLLM, Perplexity, Vercel AI Gateway sau proxy-uri personalizate.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Configurare multi-model
-   **Folosește furnizori diferiți pentru sarcini**:
    *   **Dezactivat (implicit)**: folosește un singur "furnizor activ" (selectat mai sus) pentru toate sarcinile.
    *   **Activat**: îți permite să selectezi un furnizor specific *și* să suprascrii opțional numele modelului pentru fiecare sarcină ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). Dacă câmpul de suprascriere a modelului pentru o sarcină rămâne gol, se folosește modelul implicit configurat pentru furnizorul selectat al acelei sarcini.
-   **Selectează limbi diferite pentru sarcini diferite**:
    *   **Dezactivat (implicit)**: folosește o singură "limbă de ieșire" pentru toate sarcinile.
    *   **Activat**: îți permite să selectezi o limbă specifică pentru fiecare sarcină ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Arhitectura limbii (limba interfeței și limba ieșirii sarcinilor)

-   **Limba interfeței** controlează doar textul interfeței pluginului (etichete de setări, butoane din bara laterală, notificări și dialoguri). Modul implicit `auto` urmează limba curentă a UI-ului din Obsidian.
-   Variantele regionale sau de sistem de scriere sunt acum mapate la cel mai apropiat catalog publicat, în loc să cadă direct la engleză. De exemplu, `fr-CA` folosește franceza, `es-419` folosește spaniola, `pt-PT` folosește portugheza, `zh-Hans` folosește chineza simplificată, iar `zh-Hant-HK` folosește chineza tradițională.
-   **Limba ieșirii sarcinilor** controlează ieșirea generată de model pentru sarcini (linkuri, rezumate, generare de titluri, rezumat Mermaid, extragere de concepte, ținta traducerii).
-   **Per-task language mode** permite fiecărei sarcini să-și rezolve propria limbă de ieșire dintr-un strat de politică unificat în locul suprascrierilor împrăștiate pe module.
-   **Dezactivează traducerea automată** păstrează sarcinile non-Translate în contextul limbii sursă, în timp ce sarcinile explicite Translate aplică în continuare limba țintă configurată.
-   Căile de generare legate de Mermaid urmează aceeași politică lingvistică și pot declanșa în continuare Mermaid auto-fix atunci când este activat.

### Setări pentru apeluri API stabile
-   **Activează apeluri API stabile (logică de reîncercare)**:
    *   **Dezactivat (implicit)**: o singură eroare de apel API va opri sarcina curentă.
    *   **Activat**: reîncearcă automat apelurile API LLM eșuate (util pentru probleme de rețea intermitente sau rate limits).
    *   **Connection Test Fallback**: chiar și atunci când apelurile normale nu rulează deja în mod stabil, testele de conexiune pentru furnizori trec acum în aceeași secvență de retry după prima eroare tranzitorie de rețea.
    *   **Runtime Transport Fallback (Environment-Aware)**: requesturile lungi de sarcini care sunt întrerupte tranzitoriu de `requestUrl` reîncearcă acum aceeași încercare mai întâi printr-un fallback conștient de mediu. Build-urile desktop folosesc Node `http/https`, iar mediile non-desktop folosesc `fetch` din browser. Aceste încercări fallback folosesc acum parsare cu streaming conștientă de protocol pentru căile LLM integrate, acoperind OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE și ieșirea Ollama NDJSON, astfel încât gateway-urile lente să poată returna mai devreme bucăți de corp. Punctele de intrare rămase în stil OpenAI direct reutilizează aceeași cale fallback comună.
    *   **OpenAI-Compatible Stable Order**: în modul stabil, fiecare încercare OpenAI-compatible urmează acum secvența `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` înainte de a fi contabilizată drept încercare eșuată. Asta previne eșecurile prea agresive atunci când doar un singur mod de transport este instabil.
-   **Retry Interval (seconds)**: (vizibil doar când este activat) timpul de așteptare între încercările de retry (1-300 secunde). Implicit: 5.
-   **Maximum Retries**: (vizibil doar când este activat) numărul maxim de încercări de retry (0-10). Implicit: 3.
-   **Mod de depanare a erorilor API**:
    *   **Dezactivat (implicit)**: folosește raportare standard și concisă a erorilor.
    *   **Activat**: activează logare detaliată a erorilor (similară ieșirii verbose DeepSeek) pentru toți furnizorii și toate sarcinile (inclusiv Translate, Search și Connection Tests). Asta include coduri de stare HTTP, text brut de răspuns, cronologii de transport pentru requesturi, URL-uri și headere sanitizate, durate ale încercărilor, headere de răspuns, corpuri de răspuns parțiale, ieșire parțială de flux parsată și urme de stivă, ceea ce este critic pentru depanarea problemelor de conectare API și a resetărilor gateway-urilor upstream.
-   **Developer Mode**:
    *   **Dezactivat (implicit)**: ascunde toate controalele de diagnostic dedicate dezvoltatorilor față de utilizatorii obișnuiți.
    *   **Activat**: afișează un panou dedicat de diagnostic pentru dezvoltatori în Settings.
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: alege calea de rulare pentru fiecare sondă. Furnizorii OpenAI-compatible suportă și moduri forțate suplimentare (`direct streaming`, `direct buffered`, `requestUrl-only`) pe lângă modurile runtime.
    *   **Run Diagnostic**: rulează o singură sondă pentru request lung cu modul de apel selectat și scrie `Notemd_Provider_Diagnostic_*.txt` în rădăcina vaultului.
    *   **Run Stability Test**: repetă sonda pentru un număr configurabil de rulări (1-10) folosind modul de apel selectat și salvează un raport agregat de stabilitate.
    *   **Diagnostic Timeout**: timeout configurabil pentru fiecare rulare (15-3600 secunde).
    *   **Why Use It**: mai rapid decât reproducerea manuală când un furnizor trece de "Test connection" dar eșuează la sarcini reale de lungă durată (de exemplu, traducerea pe gateway-uri lente).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Setări generale

#### Ieșirea fișierelor procesate
-   **Customize Processed File Save Path**:
    *   **Dezactivat (implicit)**: fișierele procesate (de exemplu `YourNote_processed.md`) sunt salvate în *același folder* cu nota originală.
    *   **Activat**: îți permite să specifici o locație personalizată de salvare.
-   **Processed File Folder Path**: (vizibil doar când setarea de mai sus este activată) introdu o *cale relativă* în interiorul vaultului tău (de exemplu `Processed Notes` sau `Output/LLM`) unde vor fi salvate fișierele procesate. Folderele vor fi create dacă nu există. **Nu folosi căi absolute (precum C:\...) sau caractere invalide.**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **Dezactivat (implicit)**: fișierele procesate create de comanda 'Add Links' folosesc sufixul implicit `_processed.md` (de exemplu `YourNote_processed.md`).
    *   **Activat**: îți permite să personalizezi numele fișierului de ieșire folosind setarea de mai jos.
-   **Custom Suffix/Replacement String**: (vizibil doar când setarea de mai sus este activată) introdu șirul folosit pentru numele fișierului de ieșire.
    *   Dacă este lăsat **gol**, fișierul original va fi **suprascris** cu conținutul procesat.
    *   Dacă introduci un șir (de exemplu `_linked`), acesta va fi adăugat la numele de bază original (de exemplu `YourNote_linked.md`). Asigură-te că sufixul nu conține caractere invalide pentru nume de fișier.

-   **Remove Code Fences on Add Links**:
    *   **Dezactivat (implicit)**: delimitatoarele de cod **(\`\\\`\`)** sunt păstrate în conținut când se adaugă linkuri, iar **(\`\\\`markdown)** va fi șters automat.
    *   **Activat**: elimină delimitatoarele de cod din conținut înainte de adăugarea linkurilor.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Ieșirea notelor de concept
-   **Customize Concept Note Path**:
    *   **Dezactivat (implicit)**: crearea automată a notelor pentru `[[linked concepts]]` este dezactivată.
    *   **Activat**: îți permite să specifici un folder unde vor fi create note noi de concept.
-   **Concept Note Folder Path**: (vizibil doar când personalizarea de mai sus este activată) introdu o *cale relativă* în interiorul vaultului tău (de exemplu `Concepts` sau `Generated/Topics`) unde vor fi salvate noile note de concept. Folderele vor fi create dacă nu există. **Trebuie completat dacă personalizarea este activată.** **Nu folosi căi absolute sau caractere invalide.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Ieșirea fișierului de jurnal al conceptelor
-   **Generate Concept Log File**:
    *   **Dezactivat (implicit)**: nu se generează niciun fișier de jurnal.
    *   **Activat**: creează un fișier de jurnal care listează notele de concept nou create după procesare. Formatul este:
        ```
        generează xx fișiere md de concepte
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (vizibil doar când "Generate Concept Log File" este activat)
    *   **Dezactivat (implicit)**: fișierul de jurnal este salvat în **Concept Note Folder Path** (dacă este specificat) sau în rădăcina vaultului în caz contrar.
    *   **Activat**: îți permite să specifici un folder personalizat pentru fișierul de jurnal.
-   **Concept Log Folder Path**: (vizibil doar când "Customize Log File Save Path" este activat) introdu o *cale relativă* în interiorul vaultului tău (de exemplu `Logs/Notemd`) unde ar trebui salvat fișierul de jurnal. **Trebuie completat dacă personalizarea este activată.**
-   **Customize Log File Name**: (vizibil doar când "Generate Concept Log File" este activat)
    *   **Dezactivat (implicit)**: fișierul de jurnal se numește `Generate.log`.
    *   **Activat**: îți permite să specifici un nume personalizat pentru fișierul de jurnal.
-   **Concept Log File Name**: (vizibil doar când "Customize Log File Name" este activat) introdu numele de fișier dorit (de exemplu `ConceptCreation.log`). **Trebuie completat dacă personalizarea este activată.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Sarcina de extragere a conceptelor
-   **Creează note minime de concept**:
    *   **On (Default)**: notele de concept nou create vor conține doar titlul (de exemplu `# Concept`).
    *   **Off**: notele de concept pot include conținut suplimentar, precum un backlink "Linked From", dacă acesta nu este dezactivat prin setarea de mai jos.
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: nu adaugă un backlink la documentul sursă în nota de concept în timpul extragerii.
    *   **On**: adaugă o secțiune "Linked From" cu un backlink către fișierul sursă.

#### Extrage textul original specific
-   **Questions for extraction**: introdu o listă de întrebări (una pe linie) pentru care vrei ca AI-ul să extragă răspunsuri verbatim din notele tale.
-   **Translate output to corresponding language**:
    *   **Off (Default)**: produce doar textul extras în limba lui originală.
    *   **On**: adaugă o traducere a textului extras în limba selectată pentru această sarcină.
-   **Merged query mode**:
    *   **Off**: procesează fiecare întrebare individual (precizie mai mare, dar mai multe apeluri API).
    *   **On**: trimite toate întrebările într-un singur prompt (mai rapid și cu mai puține apeluri API).
-   **Customise extracted text save path & filename**:
    *   **Off**: salvează în același folder cu fișierul original, cu sufixul `_Extracted`.
    *   **On**: îți permite să specifici un folder și un sufix de nume de fișier personalizate pentru ieșire.

#### Remediere Mermaid în lot
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: detectarea erorilor este omisă după procesare.
    *   **On**: scanează fișierele procesate pentru erori Mermaid rămase și generează un raport `mermaid_error_{foldername}.md`.
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: fișierele cu erori rămân pe loc.
    *   **On**: mută orice fișier care încă mai conține erori de sintaxă Mermaid după tentativa de reparare într-un folder dedicat pentru revizuire manuală.
-   **Mermaid error folder path**: (vizibil dacă setarea de mai sus este activată) folderul în care sunt mutate fișierele cu erori.

#### Parametri de procesare
-   **Enable Batch Parallelism**:
    *   **Dezactivat (implicit)**: sarcinile de procesare în lot (precum "Process Folder" sau "Batch Generate from Titles") procesează fișierele unul câte unul (serial).
    *   **Activat**: permite pluginului să proceseze mai multe fișiere simultan, ceea ce poate accelera semnificativ joburile mari în lot.
-   **Batch Concurrency**: (vizibil doar când paralelismul este activat) setează numărul maxim de fișiere procesate în paralel. Un număr mai mare poate fi mai rapid, dar folosește mai multe resurse și poate atinge limitele API. (Implicit: 1, Interval: 1-20)
-   **Batch Size**: (vizibil doar când paralelismul este activat) numărul de fișiere grupate într-un singur lot. (Implicit: 50, Interval: 10-200)
-   **Delay Between Batches (ms)**: (vizibil doar când paralelismul este activat) o întârziere opțională în milisecunde între procesarea fiecărui lot, care poate ajuta la gestionarea rate-limit-urilor API. (Implicit: 1000ms)
-   **API Call Interval (ms)**: întârzierea minimă în milisecunde *înainte și după* fiecare apel individual LLM API. Critică pentru API-uri cu rată mică sau pentru a preveni erorile 429. Setează la 0 pentru fără întârziere artificială. (Implicit: 500ms)
-   **Chunk Word Count**: numărul maxim de cuvinte per bucată trimisă către LLM. Influențează numărul de apeluri API pentru fișierele mari. (Implicit: 3000)
-   **Enable Duplicate Detection**: comută verificarea de bază a cuvintelor duplicate în conținutul procesat (rezultatul apare în consolă). (Implicit: Activat)
-   **Max Tokens**: numărul maxim de tokeni pe care LLM-ul ar trebui să-i genereze per fragment de răspuns. Influențează costul și detaliul. (Implicit: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Traducere
-   **Default Target Language**: selectează limba implicită în care vrei să îți traduci notele. Aceasta poate fi suprascrisă în UI când rulezi comanda de traducere. (Implicit: English)
-   **Customise Translation File Save Path**:
    *   **Dezactivat (implicit)**: fișierele traduse sunt salvate în *același folder* cu nota originală.
    *   **Activat**: îți permite să specifici o *cale relativă* în interiorul vaultului tău (de exemplu `Translations`) unde vor fi salvate fișierele traduse. Folderele vor fi create dacă nu există.
-   **Use custom suffix for translated files**:
    *   **Dezactivat (implicit)**: fișierele traduse folosesc sufixul implicit `_translated.md` (de exemplu `YourNote_translated.md`).
    *   **Activat**: îți permite să specifici un sufix personalizat.
-   **Custom Suffix**: (vizibil doar când setarea de mai sus este activată) introdu sufixul personalizat de adăugat la numele fișierelor traduse (de exemplu `_es` sau `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generare de conținut
-   **Enable Research in "Generate from Title"**:
    *   **Dezactivat (implicit)**: "Generate from Title" folosește doar titlul ca intrare.
    *   **Activat**: efectuează cercetare web folosind **Web Research Provider** configurat și include rezultatele drept context pentru LLM în timpul generării bazate pe titlu.
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **Activat (implicit)**: rulează automat o trecere de reparare a sintaxei Mermaid după fluxurile legate de Mermaid, precum Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid și Translate.
    *   **Dezactivat**: lasă ieșirea Mermaid generată neatinsă, cu excepția cazului în care rulezi manual `Batch Mermaid Fix` sau îl adaugi într-un flux personalizat.
-   **Output Language**: (nou) selectează limba de ieșire dorită pentru sarcinile "Generate from Title" și "Batch Generate from Title".
    *   **English (Default)**: prompturile sunt procesate și ieșirea este generată în engleză.
    *   **Other Languages**: LLM-ul este instruit să își facă raționamentul în engleză, dar să furnizeze documentația finală în limba selectată (de exemplu Español, Français, 简体中文, 繁體中文, العربية, हिन्दी etc.).
-   **Change Prompt Word**: (nou)
    *   **Change Prompt Word**: îți permite să schimbi cuvântul de prompt pentru o sarcină specifică.
    *   **Custom Prompt Word**: introdu cuvântul de prompt personalizat pentru sarcină.
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **Dezactivat (implicit)**: fișierele generate cu succes sunt mutate într-un subfolder numit `[OriginalFolderName]_complete` relativ la părintele folderului original (sau `Vault_complete` dacă folderul original era rădăcina).
    *   **Activat**: îți permite să specifici un nume personalizat pentru subfolderul în care sunt mutate fișierele finalizate.
-   **Custom Output Folder Name**: (vizibil doar când setarea de mai sus este activată) introdu numele dorit pentru subfolder (de exemplu `Generated Content`, `_complete`). Caracterele invalide nu sunt permise. Implicit este `_complete` dacă este lăsat gol. Acest folder este creat relativ la directorul părinte al folderului original.

#### Butoane de flux cu un singur clic
-   **Visual Workflow Builder**: creează butoane personalizate de flux din acțiuni integrate fără a scrie manual DSL-ul.
-   **Custom Workflow Buttons DSL**: utilizatorii avansați pot edita în continuare direct textul definiției fluxului. Un DSL invalid revine în siguranță la fluxul implicit și afișează un avertisment în UI-ul din sidebar/setări.
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: oprește imediat fluxul când un pas eșuează.
    *   **Continue on Error**: continuă rularea pașilor ulteriori și raportează la final numărul de acțiuni eșuate.
-   **Default Workflow Included**: `One-Click Extract` leagă `Process File (Add Links)`, `Batch Generate from Titles` și `Batch Mermaid Fix`.

#### Setări pentru instrucțiuni personalizate
Această funcție îți permite să suprascrii instrucțiunile implicite (prompturile) trimise către LLM pentru sarcini specifice, oferindu-ți control fin asupra ieșirii.

-   **Enable Custom Prompts for Specific Tasks**:
    *   **Dezactivat (implicit)**: pluginul folosește prompturile implicite integrate pentru toate operațiunile.
    *   **Activat**: activează posibilitatea de a seta prompturi personalizate pentru sarcinile listate mai jos. Acesta este comutatorul principal pentru această funcție.

-   **Use Custom Prompt for [Task Name]**: (vizibil doar când setarea de mai sus este activată)
    *   Pentru fiecare sarcină acceptată ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts"), poți activa sau dezactiva individual promptul tău personalizat.
    *   **Disabled**: această sarcină va folosi promptul implicit.
    *   **Activat**: această sarcină va folosi textul pe care îl furnizezi în zona de text "Custom Prompt" corespunzătoare de mai jos.

-   **Custom Prompt Text Area**: (vizibil doar când promptul personalizat pentru o sarcină este activat)
    *   **Default Prompt Display**: pentru referință, pluginul afișează promptul implicit pe care l-ar folosi în mod normal pentru sarcina respectivă. Poți folosi butonul **"Copy Default Prompt"** pentru a copia acest text ca punct de plecare pentru propriul tău prompt personalizat.
    *   **Custom Prompt Input**: aici îți scrii propriile instrucțiuni pentru LLM.
    *   **Placeholders**: poți (și ar trebui) să folosești în promptul tău placeholder-e speciale, pe care pluginul le va înlocui cu conținutul real înainte de a trimite requestul către LLM. Consultă promptul implicit pentru a vedea ce placeholder-e sunt disponibile pentru fiecare sarcină. Placeholder-ele comune includ:
        *   `{TITLE}`: titlul notei curente.
        *   `{RESEARCH_CONTEXT_SECTION}`: conținutul adunat din cercetarea web.
        *   `{USER_PROMPT}`: conținutul notei procesate.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Domeniul verificării duplicatelor
-   **Duplicate Check Scope Mode**: controlează ce fișiere sunt verificate față de notele din Concept Note Folder pentru duplicate potențiale.
    *   **Entire Vault (Default)**: compară notele de concept cu toate celelalte note din vault (excluzând chiar Concept Note Folder).
    *   **Include Specific Folders Only**: compară notele de concept doar cu notele din folderele listate mai jos.
    *   **Exclude Specific Folders**: compară notele de concept cu toate notele *cu excepția* celor din folderele listate mai jos (și excluzând de asemenea Concept Note Folder).
    *   **Concept Folder Only**: compară notele de concept doar cu *alte note din Concept Note Folder*. Asta ajută la găsirea duplicatelor exclusiv în conceptele generate.
-   **Include/Exclude Folders**: (vizibil doar dacă modul este 'Include' sau 'Exclude') introdu *căile relative* ale folderelor pe care vrei să le incluzi sau excluzi, **o cale pe linie**. Căile sunt case-sensitive și folosesc `/` ca separator (de exemplu `Reference Material/Papers` sau `Daily Notes`). Aceste foldere nu pot fi identice cu sau în interiorul Concept Note Folder.

#### Furnizor de cercetare web
-   **Search Provider**: alege între `Tavily` (necesită cheie API, recomandat) și `DuckDuckGo` (experimental, adesea blocat de motorul de căutare pentru requesturi automatizate). Este folosit pentru "Research & Summarize Topic" și opțional pentru "Generate from Title".
-   **Tavily API Key**: (vizibil doar dacă este selectat Tavily) introdu cheia ta API de la [tavily.com](https://tavily.com/).
-   **Tavily Max Results**: (vizibil doar dacă este selectat Tavily) numărul maxim de rezultate pe care Tavily ar trebui să le întoarcă (1-20). Implicit: 5.
-   **Tavily Search Depth**: (vizibil doar dacă este selectat Tavily) alege `basic` (implicit) sau `advanced`. Notă: `advanced` oferă rezultate mai bune, dar costă 2 credite API per căutare în loc de 1.
-   **DuckDuckGo Max Results**: (vizibil doar dacă este selectat DuckDuckGo) numărul maxim de rezultate de căutare de parsat (1-10). Implicit: 5.
-   **DuckDuckGo Content Fetch Timeout**: (vizibil doar dacă este selectat DuckDuckGo) numărul maxim de secunde de așteptare când se încearcă preluarea conținutului din fiecare URL rezultat DuckDuckGo. Implicit: 15.
-   **Max Research Content Tokens**: numărul aproximativ maxim de tokeni din rezultatele combinate de cercetare web (fragmente/conținut preluat) care să fie incluse în promptul de rezumare. Ajută la gestionarea dimensiunii ferestrei de context și a costului. (Implicit: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Domeniu de învățare focalizat
-   **Enable Focused Learning Domain**:
    *   **Dezactivat (implicit)**: prompturile trimise către LLM folosesc instrucțiunile standard, de uz general.
    *   **Activat**: îți permite să specifici unul sau mai multe domenii de studiu pentru a îmbunătăți înțelegerea contextuală a LLM-ului.
-   **Learning Domain**: (vizibil doar când setarea de mai sus este activată) introdu domeniul/domeniile tale specifice, de exemplu 'Materials Science', 'Polymer Physics', 'Machine Learning'. Asta va adăuga o linie "Relevant Fields: [...]" la începutul prompturilor, ajutând LLM-ul să genereze linkuri și conținut mai precise și mai relevante pentru aria ta de studiu.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Ghid de utilizare

### Fluxuri rapide și bară laterală

-   Deschide sidebarul Notemd pentru a accesa secțiuni grupate de acțiuni pentru procesarea de bază, generare, traducere, knowledge și utilitare.
-   Folosește zona **Fluxuri de lucru rapide** din partea de sus a sidebarului pentru a lansa butoane personalizate cu mai mulți pași.
-   Fluxul implicit **One-Click Extract** rulează `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
-   Progresul fluxului, logurile per pas și eșecurile sunt afișate în sidebar, cu un footer fix care împiedică bara de progres și zona de log să fie împinse afară când secțiunile sunt expandate.
-   Cardul de progres păstrează lizibile dintr-o privire textul de stare, o pastilă dedicată procentului și timpul rămas, iar aceleași fluxuri personalizate pot fi reconfigurate din setări.

### Procesarea originală (adăugarea de wiki-link-uri)
Aceasta este funcționalitatea de bază, axată pe identificarea conceptelor și adăugarea de `[[wiki-links]]`.

**Important:** acest proces funcționează doar pe fișiere `.md` sau `.txt`. Poți converti gratuit fișiere PDF în fișiere MD folosind [Mineru](https://github.com/opendatalab/MinerU) înainte de procesare suplimentară.

1.  **Folosind sidebarul**:
    *   Deschide Notemd Sidebar (iconița baghetă sau paleta de comenzi).
    *   Deschide fișierul `.md` sau `.txt`.
    *   Fă clic pe **"Process File (Add Links)"**.
    *   Pentru a procesa un folder: fă clic pe **"Process Folder (Add Links)"**, selectează folderul și fă clic pe "Process".
    *   Progresul este afișat în sidebar. Poți anula sarcina folosind butonul "Cancel Processing" din sidebar.
    *   *Notă pentru procesarea folderelor:* fișierele sunt procesate în fundal fără a fi deschise în editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Folosind paleta de comenzi** (`Ctrl+P` sau `Cmd+P`):
    *   **Single File**: deschide fișierul și rulează `Notemd: Process Current File`.
    *   **Folder**: rulează `Notemd: Process Folder`, apoi selectează folderul. Fișierele sunt procesate în fundal fără a fi deschise în editor.
    *   Pentru acțiunile lansate din paleta de comenzi apare o fereastră modală de progres, care include un buton de anulare.
    *   *Notă:* pluginul elimină automat liniile de început `\boxed{` și liniile finale `}` dacă sunt găsite în conținutul procesat final înainte de salvare.

### Funcții noi

1.  **Rezumă ca diagramă Mermaid**:
    *   Deschide nota pe care vrei să o rezumi.
    *   Rulează comanda `Notemd: Summarise as Mermaid diagram` (din paleta de comenzi sau prin butonul din sidebar).
    *   Pluginul va genera o notă nouă cu diagrama Mermaid.

2.  **Translate Note/Selection**:
    *   Selectează text într-o notă pentru a traduce doar acea selecție sau invocă comanda fără nicio selecție pentru a traduce întreaga notă.
    *   Rulează comanda `Notemd: Translate Note/Selection` (din paleta de comenzi sau prin butonul din sidebar).
    *   Va apărea o fereastră modală care îți permite să confirmi sau să schimbi **Target Language** (valoarea implicită fiind cea specificată în Configuration).
    *   Pluginul folosește **LLM Provider** configurat (pe baza setărilor Multi-Model) pentru a efectua traducerea.
    *   Conținutul tradus este salvat în **Translation Save Path** configurată, cu sufixul corespunzător, și este deschis într-un **panou nou în dreapta** conținutului original pentru comparație ușoară.
    *   Poți anula această sarcină din butonul din sidebar sau din butonul de anulare al ferestrei modale.
3.  **Traducere în lot**:
    *   Rulează comanda `Notemd: Batch Translate Folder` din paleta de comenzi și selectează un folder sau fă clic dreapta pe un folder în exploratorul de fișiere și alege "Batch translate this folder".
    *   Pluginul va traduce toate fișierele Markdown din folderul selectat.
    *   Fișierele traduse sunt salvate în calea de traducere configurată, dar nu sunt deschise automat.
    *   Acest proces poate fi anulat din fereastra modală de progres.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   Selectează text într-o notă SAU asigură-te că nota are un titlu (acesta va fi subiectul căutării).
    *   Rulează comanda `Notemd: Research and Summarize Topic` (din paleta de comenzi sau prin butonul din sidebar).
    *   Pluginul folosește **Search Provider** configurat (Tavily/DuckDuckGo) și **LLM Provider** potrivit (pe baza setărilor Multi-Model) pentru a găsi și rezuma informațiile.
    *   Rezumatul este adăugat la nota curentă.
    *   Poți anula această sarcină din butonul din sidebar sau din butonul de anulare al ferestrei modale.
    *   *Notă:* căutările DuckDuckGo pot eșua din cauza detecției de boți. Tavily este recomandat.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   Deschide o notă (poate fi și goală).
    *   Rulează comanda `Notemd: Generate Content from Title` (din paleta de comenzi sau prin butonul din sidebar).
    *   Pluginul folosește **LLM Provider** potrivit (pe baza setărilor Multi-Model) pentru a genera conținut pe baza titlului notei, înlocuind orice conținut existent.
    *   Dacă setarea **"Enable Research in 'Generate from Title'"** este activată, mai întâi va efectua cercetare web (folosind **Web Research Provider** configurat) și va include acel context în promptul trimis către LLM.
    *   Poți anula această sarcină din butonul din sidebar sau din butonul de anulare al ferestrei modale.

5.  **Batch Generate Content from Titles**:
    *   Rulează comanda `Notemd: Batch Generate Content from Titles` (din paleta de comenzi sau prin butonul din sidebar).
    *   Selectează folderul care conține notele pe care vrei să le procesezi.
    *   Pluginul va itera prin fiecare fișier `.md` din folder (excluzând fișierele `_processed.md` și fișierele din folderul desemnat "complete"), va genera conținut pe baza titlului notei și va înlocui conținutul existent. Fișierele sunt procesate în fundal fără a fi deschise în editor.
    *   Fișierele procesate cu succes sunt mutate în folderul configurat "complete".
    *   Această comandă respectă setarea **"Enable Research in 'Generate from Title'"** pentru fiecare notă procesată.
    *   Poți anula această sarcină din butonul din sidebar sau din butonul de anulare al ferestrei modale.
    *   Progresul și rezultatele (numărul de fișiere modificate, erori) sunt afișate în logul din sidebar/modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   Asigură-te că **Concept Note Folder Path** este configurată corect în setări.
    *   Rulează `Notemd: Check and Remove Duplicate Concept Notes` (din paleta de comenzi sau prin butonul din sidebar).
    *   Pluginul scanează folderul de note de concept și compară numele de fișiere cu notele din afara folderului folosind mai multe reguli (potrivire exactă, plural, normalizare, conținere).
    *   Dacă sunt găsite duplicate potențiale, apare o fereastră modală care listează fișierele, motivul pentru care au fost marcate și fișierele aflate în conflict.
    *   Revizuiește cu atenție lista. Fă clic pe **"Delete Files"** pentru a muta fișierele listate în coșul sistemului sau pe **"Cancel"** pentru a nu face nicio modificare.
    *   Progresul și rezultatele sunt afișate în logul din sidebar/modal.

7.  **Extract Concepts (Pure Mode)**:
    *   Această funcție îți permite să extragi concepte dintr-un document și să creezi notele de concept corespunzătoare *fără* a modifica fișierul original. Este perfectă pentru a popula rapid baza ta de cunoștințe dintr-un set de documente.
    *   **Single File**: deschide un fișier și rulează comanda `Notemd: Extract concepts (create concept notes only)` din paleta de comenzi sau fă clic pe butonul **"Extract concepts (current file)"** din sidebar.
    *   **Folder**: rulează comanda `Notemd: Batch extract concepts from folder` din paleta de comenzi sau fă clic pe butonul **"Extract concepts (folder)"** din sidebar, apoi selectează un folder pentru a-i procesa toate notele.
    *   Pluginul va citi fișierele, va identifica conceptele și va crea note noi pentru acestea în **Concept Note Folder** desemnat, lăsând fișierele originale neatinse.

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   Această comandă puternică simplifică procesul de creare și populare a noilor note de concept.
    *   Selectează un cuvânt sau o expresie în editor.
    *   Rulează comanda `Notemd: Create Wiki-Link & Generate Note from Selection` (este recomandat să îi atribui o tastă rapidă, de exemplu `Cmd+Shift+W`).
    *   Pluginul va:
        1.  Înlocui textul selectat cu un `[[wiki-link]]`.
        2.  Verifica dacă există deja o notă cu acel titlu în **Concept Note Folder**.
        3.  Dacă există, adaugă un backlink către nota curentă.
        4.  Dacă nu există, creează o notă nouă, goală.
        5.  Apoi rulează automat comanda **"Generate Content from Title"** pe nota nouă sau existentă, populând-o cu conținut generat de AI.

9.  **Extract Concepts and Generate Titles**:
    *   Această comandă leagă două funcții puternice într-un flux simplificat.
    *   Rulează comanda `Notemd: Extract Concepts and Generate Titles` din paleta de comenzi (este recomandat să îi atribui o tastă rapidă).
    *   Pluginul va:
        1.  Mai întâi va rula sarcina **"Extract concepts (current file)"** pe fișierul activ în acel moment.
        2.  Apoi va rula automat sarcina **"Batch generate from titles"** pe folderul pe care l-ai configurat în setări ca **Concept note folder path**.
    *   Asta îți permite să populezi mai întâi baza de cunoștințe cu concepte noi dintr-un document sursă și apoi să dezvolți imediat acele note noi de concept cu conținut generat de AI într-un singur pas.

10. **Extract Specific Original Text**:
    *   Configurează întrebările în setări, la "Extract Specific Original Text".
    *   Folosește butonul "Extract Specific Original Text" din sidebar pentru a procesa fișierul activ.
    *   **Merged Mode**: permite procesare mai rapidă prin trimiterea tuturor întrebărilor într-un singur prompt.
    *   **Translation**: traduce opțional textul extras în limba ta configurată.
    *   **Custom Output**: configurează unde și cum este salvat fișierul extras.

11. **Batch Mermaid Fix**:
    *   Folosește butonul "Batch Mermaid Fix" din sidebar pentru a scana un folder și a repara erorile comune de sintaxă Mermaid.
    *   Pluginul va raporta orice fișier care încă mai conține erori într-un fișier `mermaid_error_{foldername}.md`.
    *   Configurează opțional pluginul astfel încât să mute aceste fișiere problematice într-un folder separat pentru revizuire.

## Furnizori LLM acceptați

| Furnizor          | Tip        | Necesită cheie API     | Observații                                                            |
|-------------------|------------|------------------------|-----------------------------------------------------------------------|
| DeepSeek          | Găzduit    | Da                     | Endpoint DeepSeek nativ, cu suport pentru modele de reasoning         |
| Qwen              | Găzduit    | Da                     | Preset DashScope compatible-mode pentru modelele Qwen / QwQ           |
| Qwen Code         | Găzduit    | Da                     | Preset DashScope axat pe coding pentru modelele Qwen coder            |
| Doubao            | Găzduit    | Da                     | Preset Volcengine Ark; de obicei setezi câmpul model la endpoint ID-ul tău |
| Moonshot          | Găzduit    | Da                     | Endpoint oficial Kimi / Moonshot                                      |
| GLM               | Găzduit    | Da                     | Endpoint oficial Zhipu BigModel OpenAI-compatible                     |
| Z AI              | Găzduit    | Da                     | Endpoint internațional GLM/Zhipu OpenAI-compatible; completează `GLM` |
| MiniMax           | Găzduit    | Da                     | Endpoint oficial MiniMax chat-completions                             |
| Huawei Cloud MaaS | Găzduit    | Da                     | Endpoint Huawei ModelArts MaaS OpenAI-compatible pentru modele hostate |
| Baidu Qianfan     | Găzduit    | Da                     | Endpoint oficial Qianfan OpenAI-compatible pentru modelele ERNIE      |
| SiliconFlow       | Găzduit    | Da                     | Endpoint oficial SiliconFlow OpenAI-compatible pentru modele OSS hostate |
| OpenAI            | Găzduit    | Da                     | Suportă modelele GPT și seria o                                       |
| Anthropic         | Găzduit    | Da                     | Suportă modelele Claude                                               |
| Google            | Găzduit    | Da                     | Suportă modelele Gemini                                               |
| Mistral           | Găzduit    | Da                     | Suportă familiile Mistral și Codestral                                |
| Azure OpenAI      | Găzduit    | Da                     | Necesită Endpoint, API Key, nume de deployment și API Version         |
| OpenRouter        | Intermediar | Da                    | Acces la mulți furnizori prin ID-uri de model OpenRouter              |
| xAI               | Găzduit    | Da                     | Endpoint Grok nativ                                                   |
| Groq              | Găzduit    | Da                     | Inferență rapidă OpenAI-compatible pentru modele OSS hostate          |
| Together          | Găzduit    | Da                     | Endpoint OpenAI-compatible pentru modele OSS hostate                  |
| Fireworks         | Găzduit    | Da                     | Endpoint de inferență OpenAI-compatible                               |
| Requesty          | Intermediar | Da                    | Router multi-furnizor în spatele unei singure chei API                |
| OpenAI Compatible | Intermediar | Opțional             | Preset generic pentru LiteLLM, vLLM, Perplexity, Vercel AI Gateway etc. |
| LMStudio          | Rulat local | Opțional (`EMPTY`)    | Rulează modele local prin serverul LM Studio                          |
| Ollama            | Rulat local | Nu                    | Rulează modele local prin serverul Ollama                             |

*Notă: pentru furnizorii locali (LMStudio, Ollama), asigură-te că aplicația server respectivă rulează și este accesibilă la Base URL-ul configurat.*
*Notă: pentru OpenRouter și Requesty, folosește identificatorul complet/al furnizorului afișat de gateway (de exemplu `google/gemini-flash-1.5` sau `anthropic/claude-3-7-sonnet-latest`).*
*Notă: `Doubao` se așteaptă de obicei la un Ark endpoint/deployment ID în câmpul model, nu la un nume brut de familie de model. Ecranul de setări avertizează acum când valoarea placeholder este încă prezentă și blochează testele de conexiune până când o înlocuiești cu un endpoint ID real.*
*Notă: `Z AI` țintește linia internațională `api.z.ai`, în timp ce `GLM` păstrează endpointul BigModel din China continentală. Alege presetul care se potrivește regiunii contului tău.*
*Notă: preseturile orientate spre China folosesc verificări de conexiune chat-first, astfel încât testul validează modelul/deploymentul configurat efectiv, nu doar accesibilitatea cheii API.*
*Notă: `OpenAI Compatible` este destinat gateway-urilor și proxy-urilor personalizate. Setează Base URL-ul, politica cheii API și model ID-ul conform documentației furnizorului tău.*

## Utilizarea rețelei și gestionarea datelor

Notemd rulează local în interiorul Obsidian, dar unele funcții trimit requesturi externe.

### Apeluri către furnizorii LLM (configurabile)

- Trigger: procesare de fișiere, generare, traducere, rezumare de cercetare, rezumare Mermaid și acțiuni de conexiune/diagnostic.
- Endpoint: Base URL-ul/Base URL-urile configurate pentru furnizor în setările Notemd.
- Date trimise: textul promptului și conținutul sarcinii necesar procesării.
- Notă privind gestionarea datelor: cheile API sunt configurate local în setările pluginului și sunt folosite pentru a semna requesturile de pe dispozitivul tău.

### Apeluri de cercetare web (opționale)

- Trigger: atunci când cercetarea web este activată și este selectat un furnizor de căutare.
- Endpoint: API-ul Tavily sau endpointurile DuckDuckGo.
- Date trimise: interogarea ta de cercetare și metadatele necesare ale requestului.

### Diagnosticare pentru dezvoltatori și jurnale de depanare (opționale)

- Trigger: modul API debug și acțiunile de diagnostic pentru dezvoltatori.
- Stocare: logurile de diagnostic și de eroare sunt scrise în rădăcina vaultului tău (de exemplu `Notemd_Provider_Diagnostic_*.txt` și `Notemd_Error_Log_*.txt`).
- Notă de risc: logurile pot conține extrase din requesturi/răspunsuri. Revizuiește logurile înainte de a le partaja public.

### Stocare locală

- Configurația pluginului este stocată în `.obsidian/plugins/notemd/data.json`.
- Fișierele generate, rapoartele și logurile opționale sunt stocate în vaultul tău conform setărilor tale.

## Depanare

### Probleme comune
-   **Pluginul nu se încarcă**: asigură-te că `manifest.json`, `main.js`, `styles.css` sunt în folderul corect (`<Vault>/.obsidian/plugins/notemd/`) și repornește Obsidian. Verifică Developer Console (`Ctrl+Shift+I` sau `Cmd+Option+I`) pentru erori la pornire.
-   **Eșecuri de procesare / erori API**:
    1.  **Verifică formatul fișierului**: asigură-te că fișierul pe care încerci să îl procesezi sau să îl verifici are extensia `.md` sau `.txt`. Notemd suportă în prezent doar aceste formate text.
    2.  Folosește comanda/butonul "Test LLM Connection" pentru a verifica setările furnizorului activ.
    3.  Verifică din nou API Key, Base URL, Model Name și API Version (pentru Azure). Asigură-te că cheia API este corectă și are suficiente credite/permisii.
    4.  Asigură-te că serverul tău local LLM (LMStudio, Ollama) rulează și că Base URL-ul este corect (de exemplu `http://localhost:1234/v1` pentru LMStudio).
    5.  Verifică conexiunea la internet pentru furnizorii cloud.
    6.  **Pentru erori de procesare a unui singur fișier:** consultă Developer Console pentru mesaje detaliate de eroare. Copiază-le cu butonul din fereastra modală de eroare dacă este necesar.
    7.  **Pentru erori de procesare în lot:** verifică fișierul `error_processing_filename.log` din rădăcina vaultului pentru mesaje detaliate de eroare pentru fiecare fișier eșuat. Developer Console sau fereastra modală de eroare pot afișa doar un rezumat sau o eroare generală de batch.
    8.  **Jurnale automate de eroare:** dacă un proces eșuează, pluginul salvează automat un fișier de jurnal detaliat numit `Notemd_Error_Log_[Timestamp].txt` în directorul rădăcină al vaultului. Acest fișier conține mesajul de eroare, urmele de stivă și logurile de sesiune. Dacă întâlnești probleme persistente, verifică acest fișier. Activarea "API Error Debugging Mode" în setări va popula acest jurnal cu date și mai detaliate despre răspunsurile API.
    9.  **Diagnosticare pentru requesturi lungi către endpointul real (dezvoltatori)**:
        - Cale din plugin (recomandată mai întâi): folosește **Settings -> Notemd -> Developer provider diagnostic (long request)** pentru a rula o sondă runtime pe furnizorul activ și pentru a genera `Notemd_Provider_Diagnostic_*.txt` în rădăcina vaultului.
        - Cale CLI (în afara runtime-ului Obsidian): pentru comparație reproductibilă la nivel de endpoint între comportamentul buffered și streaming, folosește:
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
        Raportul generat conține timpi per încercare (`First Byte`, `Duration`), metadate de request sanitizate, headere de răspuns, fragmente brute/parțiale de corp, fragmente de flux parsate și puncte de eșec ale stratului de transport.
-   **Probleme de conectare LM Studio/Ollama**:
    *   **Testul conexiunii eșuează**: asigură-te că serverul local (LM Studio sau Ollama) rulează și că modelul corect este încărcat/disponibil.
    *   **CORS Errors (Ollama pe Windows)**: dacă întâlnești erori CORS (Cross-Origin Resource Sharing) când folosești Ollama pe Windows, poate fi nevoie să setezi variabila de mediu `OLLAMA_ORIGINS`. Poți face asta rulând `set OLLAMA_ORIGINS=*` în command prompt înainte de a porni Ollama. Asta permite requesturi din orice origine.
    *   **Enable CORS in LM Studio**: pentru LM Studio, poți activa CORS direct din setările serverului, ceea ce poate fi necesar dacă Obsidian rulează în browser sau are politici stricte de origine.
-   **Erori la crearea folderelor ("File name cannot contain...")**:
    *   Asta înseamnă de obicei că calea furnizată în setări (**Processed File Folder Path** sau **Concept Note Folder Path**) este invalidă *pentru Obsidian*.
    *   **Asigură-te că folosești căi relative** (de exemplu `Processed`, `Notes/Concepts`) și **nu căi absolute** (de exemplu `C:\Users\...`, `/Users/...`).
    *   Verifică existența caracterelor invalide: `* " \ / < > : | ? # ^ [ ]`. Reține că `\` este invalid chiar și pe Windows pentru căile Obsidian. Folosește `/` drept separator de cale.
-   **Probleme de performanță**: procesarea fișierelor mari sau a multor fișiere poate dura. Redu setarea "Chunk Word Count" pentru apeluri API potențial mai rapide (dar mai numeroase). Încearcă alt furnizor LLM sau alt model.
-   **Legare neașteptată**: calitatea legării depinde foarte mult de LLM și de prompt. Experimentează cu modele diferite sau cu setări de temperatură diferite.

## Contribuții

Contribuțiile sunt binevenite. Consultă repository-ul GitHub pentru ghiduri: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Documentație pentru Întreținători

- [Flux de lansare (engleză)](./docs/maintainer/release-workflow.md)
- [Flux de lansare (chineză simplificată)](./docs/maintainer/release-workflow.zh-CN.md)

## Licență

Licență MIT - vezi fișierul [LICENSE](LICENSE) pentru detalii.

---


*Notemd v1.8.4 - Îmbunătățește-ți graful de cunoștințe din Obsidian cu AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
