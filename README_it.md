![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd per Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Leggi la documentazione in altre lingue: [Centro lingue](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Potenziamento della conoscenza multilingue
             basato sull'IA
==================================================
```

Un modo semplice per creare la tua base di conoscenza!

Notemd potenzia il tuo flusso di lavoro su Obsidian integrandosi con vari Modelli Linguistici di Grandi Dimensioni (LLM) per elaborare le tue note multilingue, generare automaticamente wiki-link per i concetti chiave, creare note di concetto corrispondenti, eseguire ricerche web e aiutarti a costruire potenti grafi di conoscenza.

**Versione:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Sommario

- [Inizio Rapido](#inizio-rapido)
- [Supporto Linguistico](#supporto-linguistico)
- [Caratteristiche](#caratteristiche)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Guida all'Uso](#guida-alluso)
- [Fornitori LLM Supportati](#fornitori-llm-supportati)
- [Utilizzo della Rete e Gestione dei Dati](#utilizzo-della-rete-e-gestione-dei-dati)
- [Risoluzione dei Problemi](#risoluzione-dei-problemi)
- [Contribuire](#contribuire)
- [Documentazione per i Manutentori](#documentazione-per-i-manutentori)
- [Licenza](#licenza)

## Inizio Rapido

1.  **Installa e Attiva**: Ottieni il plugin dal marketplace della community di Obsidian.
2.  **Configura LLM**: Vai in `Impostazioni -> Notemd`, seleziona il tuo fornitore LLM (come OpenAI o uno locale come Ollama) e inserisci la tua chiave API/URL.
3.  **Apri la Barra Laterale**: Clicca sull'icona della bacchetta magica Notemd nella barra laterale sinistra per aprire la vista.
4.  **Elabora una Nota**: Apri una nota e clicca su **"Elabora file (Aggiungi link)"** nella barra laterale per aggiungere automaticamente `[[wiki-links]]` ai concetti chiave.
5.  **Esegui un Workflow Rapido**: Usa il pulsante predefinito **"One-Click Extract"** per concatenare elaborazione, generazione batch e pulizia Mermaid da un unico punto di ingresso.

È tutto! Esplora le impostazioni per sbloccare funzioni come ricerca web, traduzione e generazione di contenuti.

## Supporto Linguistico

### Contratto di Comportamento Linguistico

| Aspetto | Ambito | Predefinito | Note |
|---|---|---|---|
| `Lingua dell'interfaccia` | Solo testo dell'interfaccia del plugin (impostazioni, barra laterale, avvisi, dialoghi) | `auto` | Segue la lingua di Obsidian; i cataloghi attuali sono `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Lingua di output delle attività` | Output delle attività generato dall'LLM (link, riassunti, generazione, estrazione, destinazione traduzione) | `en` | Può essere globale o per singola attività quando `Usa lingue diverse per le attività` è attivato. |
| `Disattiva la traduzione automatica` | Le attività non di traduzione mantengono il contesto originale | `false` | Le attività esplicite di `Traduci` applicano comunque la lingua di destinazione configurata. |
| `Lingua di fallback` | Risoluzione chiavi UI mancanti | locale -> `en` | Mantiene la UI stabile quando alcune chiavi non sono tradotte. |

- I documenti sorgente mantenuti sono inglese e cinese semplificato, e le traduzioni README pubblicate sono collegate nell'intestazione sopra.
- La copertura delle UI locale nell'app corrisponde attualmente esattamente al catalogo esplicito presente nel codice: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Il fallback all'inglese resta una rete di sicurezza implementativa, ma le superfici visibili supportate sono coperte da test di regressione e non dovrebbero ricadere silenziosamente sull'inglese nell'uso normale.
- Ulteriori dettagli e linee guida per i contributori sono disponibili nel [Centro lingue](./docs/i18n/README.md).

## Caratteristiche

### Elaborazione Documenti tramite IA
- **Supporto Multi-LLM**: Connettiti a vari fornitori LLM cloud e locali (vedi [Fornitori LLM Supportati](#fornitori-llm-supportati)).
- **Smart Chunking**: Divide automaticamente documenti lunghi in parti gestibili in base al numero di parole per l'elaborazione.
- **Preservazione dei Contenuti**: Mantiene la formattazione originale aggiungendo struttura e link.
- **Tracciamento del Progresso**: Aggiornamenti in tempo reale tramite la barra laterale Notemd o un modal di progresso.
- **Operazioni Annullabili**: Annulla qualsiasi attività di elaborazione (singola o batch) avviata dalla barra laterale tramite il pulsante di annullamento dedicato. Le operazioni della palette dei comandi usano un modal anch'esso annullabile.
- **Configurazione Multi-Modello**: Usa diversi fornitori LLM *e* modelli specifici per diverse attività (Aggiungi link, Ricerca, Genera titolo, Traduci) o usa un singolo fornitore per tutto.
- **Chiamate API Stabili (Logica di Riprova)**: Attiva opzionalmente riprove automatiche per chiamate API LLM fallite con intervalli e limiti di tentativi configurabili.
- **Test di Connessione Fornitore Resilienti**: Se il primo test fallisce per una disconnessione temporanea, Notemd ora ripiega sulla sequenza di riprova stabile prima di fallire, coprendo i trasporti compatibili con OpenAI, Anthropic, Google, Azure OpenAI e Ollama.
- **Fallback Trasporto Ambiente di Esecuzione**: Quando una richiesta di lunga durata fallisce tramite `requestUrl` con errori di rete transitori come `ERR_CONNECTION_CLOSED`, Notemd ora riprova lo stesso tentativo tramite un trasporto di fallback specifico per l'ambiente prima di entrare nel ciclo di riprova configurato: le build desktop usano Node `http/https`, mentre gli ambienti non desktop usano `fetch` del browser. Questo riduce i falsi fallimenti su gateway lenti e proxy inversi.
- **Rinforzo Catena Richieste Lunghe Stabili compatibili con OpenAI**: In modalità stabile, le chiamate compatibili con OpenAI usano ora un ordine esplicito a 3 stadi per ogni tentativo: trasporto streaming diretto primario, poi trasporto diretto non-streaming, quindi fallback `requestUrl` (che può ancora passare al parsing streaming se necessario). Questo riduce i falsi negativi dove i fornitori completano risposte bufferizzate ma i canali streaming sono instabili.
- **Fallback Streaming Sensibile al Protocollo su tutte le API LLM**: I tentativi di fallback di lunga durata passano ora al parsing streaming sensibile al protocollo su ogni percorso LLM integrato, non solo sugli endpoint compatibili con OpenAI. Notemd gestisce ora SSE stile OpenAI/Azure, streaming messaggi Anthropic, risposte SSE Google Gemini e flussi NDJSON Ollama sia su desktop `http/https` che su `fetch` non desktop, e i restanti punti di ingresso diretti stile OpenAI riutilizzano lo stesso percorso di fallback condiviso.
- **Preset Pronti per la Cina**: I preset integrati coprono ora `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` e `SiliconFlow` oltre ai fornitori globali e locali esistenti.
- **Elaborazione Batch Affidabile**: Logica di elaborazione concorrente migliorata con **chiamate API scaglionate** per evitare errori di limite di velocità e garantire prestazioni stabili durante grandi lavori batch. La nuova implementazione assicura che le attività vengano avviate a intervalli diversi invece di tutte contemporaneamente.
- **Report di Progresso Accurati**: Corretto un bug per cui la barra di progresso poteva bloccarsi, assicurando che l'interfaccia rifletta sempre lo stato reale dell'operazione.
- **Elaborazione Batch Parallela Robusta**: Risolto un problema per cui le operazioni batch parallele si interrompevano prematuramente, assicurando che tutti i file vengano elaborati in modo affidabile ed efficiente.
- **Precisione Barra di Progresso**: Corretto un bug per cui la barra di progresso per il comando "Crea link Wiki e Genera nota" rimaneva al 95%, assicurando che ora mostri correttamente il 100% al completamento.
- **Debugging API Migliorato**: La "Modalità Debug Errori API" cattura ora i corpi di risposta completi dai fornitori LLM e dai servizi di ricerca (Tavily/DuckDuckGo), e registra anche una timeline di trasporto per tentativo con URL di richiesta puliti, durata trascorsa, header di risposta, corpi di risposta parziali, contenuto stream parziale parsato e stack trace per una migliore risoluzione dei problemi sui fallback OpenAI, Anthropic, Google, Azure OpenAI e Ollama.
- **Pannello Modalità Sviluppatore**: Le impostazioni includono ora un pannello diagnostico dedicato ai soli sviluppatori che rimane nascosto a meno che non venga attivata la "Modalità sviluppatore". Supporta la selezione dei percorsi di chiamata diagnostica e l'esecuzione di test di stabilità ripetuti per la modalità selezionata.
- **Barra Laterale Ridisegnata**: Le azioni integrate sono raggruppate in sezioni focalizzate con etichette più chiare, stato live, progresso annullabile e log copiabili per ridurre il disordine. Il piè di pagina progresso/log rimane ora visibile anche quando ogni sezione è espansa, e lo stato di pronto usa un indicatore di attesa più chiaro.
- **Rifinitura Interazione e Leggibilità Barra Laterale**: I pulsanti della barra laterale offrono ora un feedback più chiaro al passaggio del mouse/pressione/focus, e i pulsanti Call-to-Action (CTA) colorati (inclusi `One-Click Extract` e `Batch generate from titles`) usano un contrasto di testo più forte per una migliore leggibilità in diversi temi.
- **Mapping CTA per Singolo File**: Lo stile CTA colorato è ora riservato alle sole azioni su singolo file. Le azioni a livello batch/cartella e i workflow misti usano uno stile non-CTA per ridurre i clic errati sull'ambito dell'azione.
- **Workflow Personalizzati con un Clic**: Trasforma le utility integrate della barra laterale in pulsanti personalizzati riutilizzabili con nomi definiti dall'utente e catene di azioni assemblate. È incluso un workflow predefinito `One-Click Extract`.


### Potenziamento Grafo di Conoscenza
- **Wiki-Linking Automatico**: Identifica e aggiunge `[[wiki-links]]` ai concetti principali all'interno delle note elaborate in base all'output dell'LLM.
- **Creazione Note di Concetto (Opzionale e Personalizzabile)**: Crea automaticamente nuove note per i concetti scoperti in una cartella specifica del vault.
- **Percorsi di Output Personalizzabili**: Configura percorsi relativi separati nel vault per salvare i file elaborati e le note di concetto appena create.
- **Nomi File di Output Personalizzabili (Aggiungi Link)**: Sovrascrivi opzionalmente il **file originale** o usa un suffisso/stringa di sostituzione personalizzato invece del predefinito `_processed.md` quando elabori i file per i link.
- **Mantenimento Integrità Link**: Gestione base per l'aggiornamento dei link quando le note vengono rinominate o eliminate nel vault.
- **Estrazione Concetti Pura**: Estrae concetti e crea le relative note senza modificare il documento originale. Ideale per popolare una base di conoscenza da documenti esistenti senza alterarli. Questa funzione ha opzioni configurabili per creare note di concetto minime e aggiungere backlink.


### Traduzione

- **Traduzione tramite IA**:
    - Traduce il contenuto delle note utilizzando l'LLM configurato.
    - **Supporto File Grandi**: Divide automaticamente i file grandi in pezzi più piccoli in base all'impostazione `Chunk Word Count` prima di inviarli all'LLM. I pezzi tradotti vengono poi combinati senza soluzione di continuità in un unico documento.
    - Supporta la traduzione tra più lingue.
    - Lingua di destinazione personalizzabile nelle impostazioni o nell'interfaccia utente.
    - Apre automaticamente il testo tradotto a destra del testo originale per una facile lettura.
- **Traduzione Batch**:
    - Traduce tutti i file all'interno di una cartella selezionata.
    - Supporta l'elaborazione parallela quando "Parallelismo Batch" è attivato.
    - Usa prompt personalizzati per la traduzione se configurati.
	- Aggiunge l'opzione "Traduci questa cartella in batch" al menu contestuale del file explorer.
- **Disabilita traduzione automatica**: Quando attivata, le attività non di traduzione non forzeranno più gli output in una lingua specifica, preservando il contesto linguistico originale. L'attività esplicita "Traduci" eseguirà comunque la traduzione come configurato.


### Ricerca Web e Generazione Contenuti
- **Ricerca Web e Riassunto**:
    - Effettua ricerche web tramite Tavily (richiede chiave API) o DuckDuckGo (sperimentale).
    - **Robustezza Ricerca Migliorata**: La ricerca DuckDuckGo dispone ora di una logica di parsing migliorata (DOMParser con fallback Regex) per gestire i cambiamenti di layout e garantire risultati affidabili.
    - Riassume i risultati della ricerca utilizzando l'LLM configurato.
    - La lingua di output del riassunto può essere personalizzata nelle impostazioni.
    - Aggiunge i riassunti alla nota corrente.
    - Limite token configurabile per il contenuto della ricerca inviato all'LLM.
- **Generazione Contenuti da Titolo**:
    - Usa il titolo della nota per generare contenuti iniziali tramite LLM, sostituendo i contenuti esistenti.
    - **Ricerca Opzionale**: Configura se eseguire una ricerca web (utilizzando il fornitore selezionato) per fornire contesto alla generazione.
- **Generazione Contenuti Batch da Titoli**: Genera contenuti per tutte le note all'interno di una cartella selezionata in base ai loro titoli (rispetta l'impostazione di ricerca opzionale). I file elaborati con successo vengono spostati in una **sottocartella "completati" configurabile** (es. `[nome_cartella]_complete` o un nome personalizzato) per evitare la rielaborazione.
- **Accoppiamento Auto-Fix Mermaid**: Quando l'auto-fix Mermaid è attivo, i workflow relativi a Mermaid riparano ora automaticamente i file generati o le cartelle di output dopo l'elaborazione. Questo copre i flussi Elabora, Genera da titolo, Generazione batch da titoli, Ricerca e riassunto, Riassumi come Mermaid e Traduci.


### Caratteristiche Utility
- **Riassumi come diagramma Mermaid**:
    - Questa funzione ti consente di riassumere il contenuto di una nota in un diagramma Mermaid.
    - La lingua di output del diagramma Mermaid può essere personalizzata nelle impostazioni.
    - **Cartella Output Mermaid**: Configura la cartella dove verranno salvati i file dei diagrammi Mermaid generati.
    - **Traduci Riassunto in Output Mermaid**: Traduce opzionalmente il contenuto del diagramma Mermaid generato nella lingua di destinazione configurata.
    
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Correzione Semplice Formato Formule**:
    - Corregge rapidamente formule matematiche su riga singola delimitate da un singolo `$` in blocchi standard a doppio `$$`.
    - **File Singolo**: Elabora il file corrente tramite il pulsante della barra laterale o la palette dei comandi.
    - **Correzione Batch**: Elabora tutti i file in una cartella selezionata tramite il pulsante della barra laterale o la palette dei comandi.

- **Controlla Duplicati nel File Corrente**: Questo comando aiuta a identificare potenziali termini duplicati all'interno del file attivo.
- **Rilevamento Duplicati**: Controllo base per parole duplicate all'interno del contenuto del file attualmente elaborato (risultati loggati in console).
- **Controlla e Rimuovi Note di Concetto Duplicate**: Identifica potenziali note duplicate all'interno della **Cartella Note di Concetto** configurata in base a corrispondenze esatte del nome, plurali, normalizzazione e inclusione di parole singole rispetto alle note esterne alla cartella. L'ambito del confronto (quali note esterne alla cartella concetti vengono controllate) può essere configurato per **tutto il vault**, **cartelle incluse specifiche**, o **tutte le cartelle tranne quelle escluse**. Presenta una lista dettagliata con ragioni e file in conflitto, quindi richiede conferma prima di spostare i duplicati identificati nel cestino di sistema. Mostra il progresso durante la rimozione.
- **Correzione Mermaid Batch**: Applica correzioni di sintassi Mermaid e LaTeX a tutti i file Markdown all'interno di una cartella selezionata dall'utente.
    - **Pronto per il Workflow**: Può essere usato come utility standalone o come passaggio all'interno di un pulsante di workflow personalizzato con un clic.
    - **Report Errori**: Genera un report `mermaid_error_{nome_cartella}.md` che elenca i file che contengono ancora potenziali errori Mermaid dopo l'elaborazione.
    - **Sposta File con Errori**: Sposta opzionalmente i file con errori rilevati in una cartella specificata per la revisione manuale.
    - **Rilevamento Intelligente**: Ora controlla intelligentemente i file per errori di sintassi usando `mermaid.parse` prima di tentare le correzioni, risparmiando tempo di elaborazione ed evitando modifiche non necessarie.
    - **Elaborazione Sicura**: Assicura che le correzioni di sintassi siano applicate esclusivamente ai blocchi di codice Mermaid, prevenendo modifiche accidentali a tabelle Markdown o altri contenuti. Include salvaguardie robuste per proteggere la sintassi delle tabelle (es. `| :--- |`) da correzioni di debug aggressive.
    - **Modalità Deep-Debug**: Se gli errori persistono dopo la correzione iniziale, viene attivata una modalità deep-debug avanzata. Questa modalità gestisce casi limite complessi, tra cui:
        - **Integrazione Commenti**: Unisce automaticamente i commenti finali (che iniziano con `%`) nell'etichetta dell'arco (es. `A -- Etichetta --> B; % Commento` diventa `A -- "Etichetta(Commento)" --> B;`).
        - **Frecce Malformate**: Corregge le frecce assorbite dalle virgolette (es. `A -- "Etichetta -->" B` diventa `A -- "Etichetta" --> B`).
        - **Sottografi Inline**: Converte le etichette dei sottografi inline in etichette degli archi.
        - **Correzione Freccia Inversa**: Corregge le frecce `X <-- Y` non standard in `Y --> X`.
        - **Correzione Keyword Direzione**: Assicura che la keyword `direction` sia in minuscolo all'interno dei sottografi (es. `Direction TB` -> `direction TB`).
        - **Conversione Commenti**: Converte i commenti `//` in etichette degli archi (es. `A --> B; // Commento` -> `A -- "Commento" --> B;`).
        - **Correzione Etichette Duplicate**: Semplifica le etichette tra parentesi ripetute (es. `Node["Etichetta"]["Etichetta"]` -> `Node["Etichetta"]`).
        - **Correzione Freccia Invalida**: Converte la sintassi della freccia invalida `--|>` nella standard `-->`.
        - **Gestione Robusta Etichette e Note**: Gestione migliorata per etichette contenenti caratteri speciali (come `/`) e miglior supporto per la sintassi delle note personalizzate (`note for ...`), assicurando che artefatti come le parentesi finali siano rimossi correttamente.
        - **Modalità Correzione Avanzata**: Include correzioni robuste per etichette di nodi senza virgolette contenenti spazi, caratteri speciali o parentesi nidificate (es. `Node[Etichetta [Testo]]` -> `Node["Etichetta [Testo]"]`), garantendo la compatibilità con diagrammi complessi come i percorsi di evoluzione stellare. Corregge anche etichette degli archi malformate (es. `--["Etichetta["-->` in `-- "Etichetta" -->`). Converte inoltre i commenti inline (`Consensus --> Adaptive; # Un consenso avanzato` in `Consensus -- "Un consenso avanzato" --> Adaptive`) e corregge virgolette incomplete a fine riga (`;"` alla fine sostituito con `"]`).
                        - **Conversione Note**: Converte automaticamente i commenti `note right/left of` e i commenti `note :` standalone in definizioni e connessioni di nodi Mermaid standard (es. `note right of A: testo` diventa `NoteA["Note: testo"]` collegato ad `A`), prevenendo errori di sintassi e migliorando il layout. Ora supporta sia collegamenti a freccia (`-->`) che collegamenti solidi (`---`).
                        - **Supporto Note Esteso**: Converte automaticamente `note for Node "Contenuto"` e `note of Node "Contenuto"` in nodi nota collegati standard (es. `NoteNode[" Contenuto"]` collegato a `Node`), garantendo la compatibilità con la sintassi estesa dall'utente.
                        - **Correzione Note Migliorata**: Rinomina automaticamente le note con numerazione sequenziale (es. `Note1`, `Note2`) per evitare problemi di alias quando sono presenti più note.
                        - **Correzione Parallelogramma/Forma**: Corregge forme di nodi malformate come `[/["Etichetta["/]` in forme standard `["Etichetta"]`, garantendo la compatibilità con i contenuti generati.
                        - **Standardizza Etichette Pipe**: Corregge e standardizza automaticamente le etichette degli archi contenenti pipe, assicurando che siano correttamente racchiuse tra virgolette (es. `-->|Testo|` diventa `-->|"Testo"|` e `-->|Math|^2|` diventa `-->|"Math|^2"|`).
        - **Correzione Pipe Mal Posizionata**: Corregge etichette arco mal posizionate che appaiono prima della freccia (es. `>|"Etichetta"| A --> B` diventa `A -->|"Etichetta"| B`).
                - **Unisci Doppie Etichette**: Rileva e unisce doppie etichette complesse su un singolo arco (es. `A -- Etichetta1 -- Etichetta2 --> B` o `A -- Etichetta1 -- Etichetta2 --- B`) in una singola etichetta pulita con interruzioni di riga (`A -- "Etichetta1<br>Etichetta2" --> B`).
                        - **Correzione Etichetta Senza Virgolette**: Racchiude automaticamente tra virgolette le etichette dei nodi che contengono caratteri potenzialmente problematici (es. virgolette, segni uguale, operatori matematici) ma che mancano delle virgolette esterne (es. `Plot[Plot "A"]` diventa `Plot["Plot "A""]`), prevenendo errori di rendering.
                        - **Correzione Nodo Intermedio**: Divide gli archi che contengono una definizione di nodo intermedio in due archi separati (es. `A -- B[...] --> C` diventa `A --> B[...]` e `B[...] --> C`), assicurando una sintassi Mermaid valida.
                        - **Correzione Etichetta Concatenata**: Corregge in modo robusto le definizioni dei nodi dove l'ID è concatenato con l'etichetta (es. `SubdivideSubdivide...` diventa `Subdivide["Subdivide..."]`), anche quando preceduto da etichette pipe o quando la duplicazione non è esatta, validando rispetto agli ID dei nodi noti.
                        - **Estrai Testo Originale Specifico**:
                            - Definisci una lista di domande nelle impostazioni.
                            - Estrae segmenti di testo letterali dalla nota attiva che rispondono a queste domande.
                            - **Modalità Query Unita**: Opzione per elaborare tutte le domande in una singola chiamata API per una maggiore efficienza.
                            - **Traduzione**: Opzione per includere le traduzioni del testo estratto nell'output.
                            - **Output Personalizzato**: Percorso di salvataggio e suffisso nome file configurabili per il file di testo estratto.
- **Test Connessione LLM**: Verifica le impostazioni API per il fornitore attivo.


## Installazione

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Dal Marketplace di Obsidian (Raccomandato)
1. Apri **Impostazioni** di Obsidian → **Plugin della community**.
2. Assicurati che la "Modalità ristretta" sia **disattivata**.
3. Clicca su **Sfoglia** i plugin della community e cerca "Notemd".
4. Clicca su **Installa**.
5. Una volta installato, clicca su **Attiva**.

### Installazione Manuale
1. Scarica gli ultimi asset della release dalla [pagina GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Ogni release include anche un `README.md` come riferimento, ma l'installazione manuale richiede solo `main.js`, `styles.css` e `manifest.json`.
2. Naviga nella cartella di configurazione del tuo vault di Obsidian: `<TuoVault>/.obsidian/plugins/`.
3. Crea una nuova cartella chiamata `notemd`.
4. Copia `main.js`, `styles.css` e `manifest.json` nella cartella `notemd`.
5. Riavvia Obsidian.
6. Vai su **Impostazioni** → **Plugin della community** e attiva "Notemd".

## Configurazione

Accedi alle impostazioni del plugin tramite:
**Impostazioni** → **Plugin della community** → **Notemd** (Clicca sull'icona dell'ingranaggio).

### Configurazione Fornitore LLM
1.  **Fornitore Attivo**: Seleziona il fornitore LLM che desideri utilizzare dal menu a discesa.
2.  **Impostazioni Fornitore**: Configura le impostazioni specifiche per il fornitore selezionato:
    *   **Chiave API**: Richiesta per la maggior parte dei fornitori cloud (es. OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Non necessaria per Ollama. Opzionale per LM Studio e il preset generico `OpenAI Compatible` quando il tuo endpoint accetta accessi anonimi o con placeholder.
    *   **URL Base / Endpoint**: L'endpoint API per il servizio. Sono forniti valori predefiniti, ma potresti doverli cambiare per modelli locali (LMStudio, Ollama), gateway (OpenRouter, Requesty, OpenAI Compatible) o distribuzioni Azure specifiche. **Richiesto per Azure OpenAI.**
    *   **Modello**: Il nome/ID del modello specifico da utilizzare (es. `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Assicurati che il modello sia disponibile presso il tuo endpoint/fornitore.
    *   **Temperatura**: Controlla la casualità dell'output dell'LLM (0=deterministico, 1=massima creatività). Valori bassi (es. 0.2-0.5) sono solitamente migliori per attività strutturate.
    *   **Versione API (Solo Azure)**: Richiesta per le distribuzioni Azure OpenAI (es. `2024-02-15-preview`).
3.  **Test Connessione**: Usa il pulsante "Test connessione" per il fornitore attivo per verificare le tue impostazioni. I fornitori compatibili con OpenAI usano ora controlli specifici per il fornitore: endpoint come `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` e `OpenAI Compatible` interrogano direttamente `chat/completions`, mentre i fornitori con un endpoint `/models` affidabile potrebbero usare prima l'elenco modelli. Se il primo test fallisce per una disconnessione di rete transitoria come `ERR_CONNECTION_CLOSED`, Notemd ripiega automaticamente sulla sequenza di riprova stabile invece di fallire immediatamente.
4.  **Gestisci Configurazioni Fornitore**: Usa i pulsanti "Esporta fornitori" e "Importa fornitori" per salvare/caricare le impostazioni del tuo fornitore LLM in/da un file `notemd-providers.json` all'interno della directory di configurazione del plugin. Questo consente backup e condivisione facili.
5.  **Copertura Preset**: Oltre ai fornitori originali, Notemd include ora voci predefinite per `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` e un target generico `OpenAI Compatible` per LiteLLM, vLLM, Perplexity, Vercel AI Gateway o proxy personalizzati.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Configurazione Multi-Modello
-   **Usa Fornitori Diversi per le Attività**:
    *   **Disattivato (Predefinito)**: Usa l'unico "Fornitore Attivo" (selezionato sopra) per tutte le attività.
    *   **Attivato**: Ti consente di selezionare un fornitore specifico *e* opzionalmente sovrascrivere il nome del modello per ogni attività ("Aggiungi link", "Ricerca e riassunto", "Genera da titolo", "Traduci", "Estrai concetti"). Se il campo di sovrascrittura modello per un'attività viene lasciato vuoto, verrà utilizzato il modello predefinito configurato per il fornitore selezionato di quell'attività.
-   **Seleziona lingue diverse per attività diverse**:
    *   **Disattivato (Predefinito)**: Usa l'unica "Lingua di output" per tutte le attività.
    *   **Attivato**: Ti consente di selezionare una lingua specifica per ogni attività ("Aggiungi link", "Ricerca e riassunto", "Genera da titolo", "Riassumi come diagramma Mermaid", "Estrai concetti").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Architettura linguistica (Lingua dell'interfaccia vs lingua di output delle attività)

-   **Lingua dell'interfaccia** controlla esclusivamente il testo dell'interfaccia del plugin (etichette impostazioni, pulsanti barra laterale, avvisi e dialoghi). La modalità `auto` predefinita segue la lingua attuale della UI di Obsidian.
-   Le varianti regionali o di scrittura ora vengono risolte al catalogo pubblicato più vicino invece di ricadere subito sull'inglese. Ad esempio, `fr-CA` usa il francese, `es-419` usa lo spagnolo, `pt-PT` usa il portoghese, `zh-Hans` usa il cinese semplificato e `zh-Hant-HK` usa il cinese tradizionale.
-   **Lingua di output delle attività** controlla l'output delle attività generato dal modello (link, riassunti, generazione titoli, riassunto Mermaid, estrazione concetti, destinazione traduzione).
-   **La modalità lingua per attività** consente a ogni attività di risolvere la propria lingua di output da un livello di policy unificato invece di sovrascritture sparse per modulo.
-   **Disabilita traduzione automatica** mantiene le attività non di traduzione nel contesto della lingua originale, mentre le attività di traduzione esplicite applicano comunque la lingua di destinazione configurata.
-   I percorsi di generazione relativi a Mermaid seguono la stessa policy linguistica e possono ancora attivare l'auto-fix Mermaid quando abilitato.

### Impostazioni Chiamate API Stabili
-   **Attiva Chiamate API Stabili (Logica di Riprova)**:
    *   **Disattivato (Predefinito)**: Il fallimento di una singola chiamata API interromperà l'attività corrente.
    *   **Attivato**: Ripristina automaticamente le chiamate API LLM fallite (utile per problemi di rete intermittenti o limiti di velocità).
    *   **Fallback Test Connessione**: Anche quando le chiamate normali non sono già eseguite in modalità stabile, i test di connessione fornitore passano ora alla stessa sequenza di riprova dopo il primo fallimento di rete transitorio.
    *   **Fallback Trasporto Runtime (Sensibile all'Ambiente)**: Le richieste di attività di lunga durata che falliscono transitoriamente tramite `requestUrl` ora riprovano lo stesso tentativo tramite un fallback sensibile all'ambiente prima. Le versioni desktop usano Node `http/https`; gli ambienti non desktop usano `fetch` del browser. Quei tentativi di fallback usano ora un parsing streaming sensibile al protocollo attraverso i percorsi LLM integrati, coprendo SSE compatibili con OpenAI, SSE Azure OpenAI, SSE Anthropic Messages, SSE Google Gemini e output NDJSON Ollama, in modo che i gateway lenti possano restituire pezzi di body prima. I restanti punti di ingresso diretti fornitori stile OpenAI riutilizzano lo stesso percorso di fallback condiviso.
    *   **Ordine Stabile compatibile con OpenAI**: In modalità stabile, ogni tentativo compatibile con OpenAI segue ora `streaming diretto -> diretto senza stream -> requestUrl (con fallback streaming quando necessario)` prima di essere contato come tentativo fallito. Questo previene fallimenti eccessivamente aggressivi quando solo una modalità di trasporto è instabile.
-   **Intervallo di Riprova (secondi)**: (Visibile solo se attivato) Tempo di attesa tra i tentativi di riprova (1-300 secondi). Predefinito: 5.
-   **Massimo Numero di Riprove**: (Visibile solo se attivato) Numero massimo di tentativi di riprova (0-10). Predefinito: 3.
-   **Modalità Debug Errori API**:
    *   **Disattivato (Predefinito)**: Usa report di errore standard e concisi.
    *   **Attivato**: Attiva una registrazione dettagliata degli errori (simile all'output verbeuse di DeepSeek) per tutti i fornitori e le attività (inclusi Traduzione, Ricerca e Test Connessione). Questo include codici di stato HTTP, testo di risposta grezzo, timeline di trasporto richiesta, URL e header di richiesta puliti, durate tentativi trascorse, header di risposta, corpi di risposta parziali, output stream parziale parsato e stack trace, cruciali per risolvere problemi di connessione API e reset dei gateway a monte.
-   **Modalità Sviluppatore**:
    *   **Disattivato (Predefinito)**: Nasconde tutti i controlli diagnostici per soli sviluppatori agli utenti normali.
    *   **Attivato**: Mostra un pannello diagnostico dedicato agli sviluppatori nelle Impostazioni.
-   **Diagnostica Fornitore per Sviluppatori (Richiesta Lunga)**:
    *   **Modalità Chiamata Diagnostica**: Scegli il percorso runtime per sonda. I fornitori compatibili con OpenAI supportano modalità forzate aggiuntive (`streaming diretto`, `bufferizzato diretto`, `solo-requestUrl`) oltre alle modalità runtime.
    *   **Esegui Diagnostica**: Esegue una sonda di richiesta lunga con la modalità di chiamata selezionata e scrive `Notemd_Provider_Diagnostic_*.txt` nella root del vault.
    *   **Esegui Test Stabilità**: Ripete la sonda per cicli configurabili (1-10) utilizzando la modalità di chiamata selezionata e salva un report di stabilità aggregato.
    *   **Timeout Diagnostica**: Timeout configurabile per ciclo (15-3600 secondi).
    *   **Perché usarlo**: Più veloce della riproduzione manuale quando un fornitore supera il "Test connessione" ma fallisce su attività reali di lunga durata (es. traduzione su gateway lenti).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Impostazioni Generali

#### Output File Elaborati
-   **Personalizza Percorso Salvataggio File Elaborati**:
    *   **Disattivato (Predefinito)**: I file elaborati (es. `TuaNota_processed.md`) vengono salvati nella *stessa cartella* della nota originale.
    *   **Attivato**: Ti consente di specificare una posizione di salvataggio personalizzata.
-   **Percorso Cartella File Elaborati**: (Visibile solo se attivato sopra) Inserisci un *percorso relativo* all'interno del tuo vault (es. `Note Elaborate` o `Output/LLM`) dove devono essere salvati i file elaborati. Le cartelle verranno create se non esistono. **Non usare percorsi assoluti (come C:\...) o caratteri non validi.**
-   **Usa Nome File di Output Personalizzato per 'Aggiungi Link'**:
    *   **Disattivato (Predefinito)**: I file elaborati creati dal comando 'Aggiungi link' usano il suffisso predefinito `_processed.md` (es. `TuaNota_processed.md`).
    *   **Attivato**: Ti consente di personalizzare il nome del file di output usando l'impostazione sottostante.
-   **Suffisso / Stringa Sostituzione Personalizzato**: (Visibile solo se attivato sopra) Inserisci la stringa da usare per il nome del file di output.
    *   Se lasciato **vuoto**, il file originale verrà **sovrascritto** con il contenuto elaborato.
    *   Se inserisci una stringa (es. `_linked`), verrà aggiunta al nome base originale (es. `TuaNota_linked.md`). Assicurati che il suffisso non contenga caratteri di nome file non validi.

-   **Rimuovi Code Fences all'Aggiunta dei Link**:
    *   **Disattivato (Predefinito)**: I code fences **(\`\\\`\`)** vengono mantenuti nel contenuto durante l'aggiunta dei link, mentre **(\`\\\`markdown)** verrà rimosso automaticamente.
    *   **Attivato**: Rimuove i code fences dal contenuto prima di aggiungere i link.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Output Note di Concetto
-   **Personalizza Percorso Note di Concetto**:
    *   **Disattivato (Predefinito)**: La creazione automatica delle note per i `[[concetti collegati]]` è disabilitata.
    *   **Attivato**: Ti consente di specificare una cartella dove verranno create le nuove note di concetto.
-   **Percorso Cartella Note di Concetto**: (Visibile solo se attivato sopra) Inserisci un *percorso relativo* all'interno del tuo vault (es. `Concetti` o `Generati/Argomenti`) dove devono essere salvate le nuove note di concetto. Le cartelle verranno create se non esistono. **Deve essere compilato se la personalizzazione è attivata.** **Non usare percorsi assoluti o caratteri non validi.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Output File Log Concetti
-   **Genera File Log Concetti**:
    *   **Disattivato (Predefinito)**: Nessun file di log viene generato.
    *   **Attivato**: Crea un file di log che elenca le note di concetto appena create dopo l'elaborazione. Il formato è:
        ```
        genera xx file md di concetti
        1. concetto1
        2. concetto2
        ...
        n. concetton
        ```
-   **Personalizza Percorso Salvataggio File Log**: (Visibile solo quando "Genera File Log Concetti" è attivato)
    *   **Disattivato (Predefinito)**: Il file di log viene salvato nel **Percorso Cartella Note di Concetto** (se specificato) o nella root del vault altrimenti.
    *   **Attivato**: Ti consente di specificare una cartella personalizzata per il file di log.
-   **Percorso Cartella Log Concetti**: (Visibile solo se attivato sopra) Inserisci un *percorso relativo* all'interno del tuo vault (es. `Logs/Notemd`) dove deve essere salvato il file di log. **Deve essere compilato se la personalizzazione è attivata.**
-   **Personalizza Nome File Log**: (Visibile solo quando "Genera File Log Concetti" è attivato)
    *   **Disattivato (Predefinito)**: Il file di log è nominato `Generate.log`.
    *   **Attivato**: Ti consente di specificare un nome personalizzato per il file di log.
-   **Nome File Log Concetti**: (Visibile solo se attivato sopra) Inserisci il nome file desiderato (es. `CreazioneConcetti.log`). **Deve essere compilato se la personalizzazione è attivata.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Attività Estrazione Concetti
-   **Crea note di concetto minime**:
    *   **Attivato (Predefinito)**: Le note di concetto appena create conterranno solo il titolo (es. `# Concetto`).
    *   **Disattivato**: Le note di concetto possono includere contenuti aggiuntivi, come un backlink "Collegato da", se non disabilitato dall'impostazione sottostante.
-   **Aggiungi backlink "Collegato da"**:
    *   **Disattivato (Predefinito)**: Non aggiunge un backlink al documento sorgente nella nota di concetto durante l'estrazione.
    *   **Attivato**: Aggiunge una sezione "Collegato da" con un backlink al file sorgente.

#### Estrai Testo Originale Specifico
-   **Domande per l'estrazione**: Inserisci un elenco di domande (una per riga) per le quali desideri che l'IA estragga risposte letterali dalle tue note.
-   **Traduci output nella lingua corrispondente**:
    *   **Disattivato (Predefinito)**: Produce solo il testo estratto nella sua lingua originale.
    *   **Attivato**: Aggiunge una traduzione del testo estratto nella lingua selezionata per questa attività.
-   **Modalità query unita**:
    *   **Disattivato**: Elabora ogni domanda individualmente (maggiore precisione ma più chiamate API).
    *   **Attivato**: Invia tutte le domande in un unico prompt (più veloce e meno chiamate API).
-   **Personalizza percorso salvataggio e nome file del testo estratto**:
    *   **Disattivato**: Salva nella stessa cartella del file originale con il suffisso `_Extracted`.
    *   **Attivato**: Ti consente di specificare una cartella di output e un suffisso nome file personalizzati.

#### Correzione Mermaid Batch
-   **Attiva Rilevamento Errori Mermaid**:
    *   **Disattivato (Predefinito)**: Il rilevamento errori viene saltato dopo l'elaborazione.
    *   **Attivato**: Scansiona i file elaborati per errori di sintassi Mermaid rimanenti e genera un report `mermaid_error_{nome_cartella}.md`.
-   **Sposta file con errori Mermaid nella cartella specificata**:
    *   **Disattivato**: I file con errori rimangono al loro posto.
    *   **Attivato**: Sposta qualsiasi file che contenga ancora errori di sintassi Mermaid dopo il tentativo di correzione in una cartella dedicata per la revisione manuale.
-   **Percorso cartella errori Mermaid**: (Visibile se attivato sopra) La cartella dove spostare i file con errori.

#### Parametri di Elaborazione
-   **Attiva Parallelismo Batch**:
    *   **Disattivato (Predefinito)**: Le attività di elaborazione batch (come "Elabora cartella" o "Generazione batch da titoli") elaborano i file uno alla volta (in serie).
    *   **Attivato**: Consente al plugin di elaborare più file contemporaneamente, il che può accelerare significativamente i grandi lavori batch.
-   **Concorrenza Batch**: (Visibile solo quando il parallelismo è attivato) Imposta il numero massimo di file da elaborare in parallelo. Un numero più alto può essere più veloce ma consuma più risorse e può raggiungere i limiti di velocità dell'API. (Predefinito: 1, Range: 1-20)
-   **Dimensione Batch**: (Visibile solo quando il parallelismo è attivato) Il numero di file da raggruppare in un singolo batch. (Predefinito: 50, Range: 10-200)
-   **Ritardo tra i Batch (ms)**: (Visibile solo quando il parallelismo è attivato) Un ritardo opzionale in millisecondi tra l'elaborazione di ogni batch, che può aiutare a gestire i limiti di velocità dell'API. (Predefinito: 1000ms)
-   **Intervallo Chiamata API (ms)**: Ritardo minimo in millisecondi *prima e dopo* ogni singola chiamata API LLM. Cruciale per API a bassa velocità o per prevenire errori 429. Imposta a 0 per nessun ritardo artificiale. (Predefinito: 500ms)
-   **Conteggio Parole per Pezzo (Chunk Word Count)**: Massimo numero di parole per pezzo inviato all'LLM. Influenza il numero di chiamate API per file grandi. (Predefinito: 3000)
-   **Attiva Rilevamento Duplicati**: Attiva/disattiva il controllo base per parole duplicate all'interno del contenuto elaborato (risultati in console). (Predefinito: Attivato)
-   **Max Token**: Numero massimo di token che l'LLM deve generare per pezzo di risposta. Influenza costi e dettaglio. (Predefinito: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets%2F74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Traduzione
-   **Lingua di Destinazione Predefinita**: Seleziona la lingua predefinita in cui desideri tradurre le tue note. Questa può essere sovrascritta nella UI durante l'esecuzione del comando di traduzione. (Predefinito: English)
-   **Personalizza Percorso Salvataggio File Tradotti**:
    *   **Disattivato (Predefinito)**: I file tradotti vengono salvati nella *stessa cartella* della nota originale.
    *   **Attivato**: Ti consente di specificare un *percorso relativo* all'interno del tuo vault (es. `Traduzioni`) dove devono essere salvati i file tradotti. Le cartelle verranno create se non esistono.
-   **Usa suffisso personalizzato per i file tradotti**:
    *   **Disattivato (Predefinito)**: I file tradotti usano il suffisso predefinito `_translated.md` (es. `TuaNota_translated.md`).
    *   **Attivato**: Ti consente di specificare un suffisso personalizzato.
-   **Suffisso Personalizzato**: (Visibile solo se attivato sopra) Inserisci il suffisso personalizzato da aggiungere ai nomi dei file tradotti (es. `_it` o `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generazione Contenuti
-   **Attiva Ricerca in 'Genera da Titolo'**:
    *   **Disattivato (Predefinito)**: 'Genera da Titolo' usa solo il titolo come input.
    *   **Attivato**: Esegue una ricerca web utilizzando il **Fornitore Ricerca Web** configurato e include i risultati come contesto per l'LLM durante la generazione basata sul titolo.
-   **Esegui automaticamente la correzione sintassi Mermaid dopo la generazione**:
    *   **Attivato (Predefinito)**: Esegue automaticamente un passaggio di correzione della sintassi Mermaid dopo workflow relativi a Mermaid come Elabora, Genera da titolo, Generazione batch da titoli, Ricerca e riassunto, Riassumi come Mermaid e Traduci.
    *   **Disattivato**: Lascia l'output Mermaid generato inalterato a meno che non si esegua manualmente la `Correzione Mermaid Batch` o la si aggiunga a un workflow personalizzato.
-   **Lingua di Output**: (Nuovo) Seleziona la lingua di output desiderata per le attività "Genera da titolo" e "Generazione batch da titoli".
    *   **Inglese (Predefinito)**: I prompt vengono elaborati e prodotti in inglese.
    *   **Altre Lingue**: Istruisce l'LLM a eseguire il ragionamento in inglese ma a fornire la documentazione finale nella lingua scelta (es. Italiano, Español, Français, 简体中文, 繁體中文, العربية, हिन्दी, ecc.).
-   **Cambia Parola del Prompt**: (Nuovo)
    *   **Cambia Parola del Prompt**: Ti consente di cambiare la parola del prompt per un'attività specifica.
    *   **Parola del Prompt Personalizzata**: Inserisci la tua parola del prompt personalizzata per l'attività.
-   **Usa Cartella Output Personalizzata per 'Genera da Titolo'**:
    *   **Disattivato (Predefinito)**: I file generati con successo vengono spostati in una sottocartella nominata `[NomeCartellaOriginale]_complete` relativa al genitore della cartella originale (o `Vault_complete` se la cartella originale era la root).
    *   **Attivato**: Ti consente di specificare un nome personalizzato per la sottocartella dove vengono spostati i file completati.
-   **Nome Cartella Output Personalizzata**: (Visibile solo se attivato sopra) Inserisci il nome desiderato per la sottocartella (es. `Contenuto Generato`, `_complete`). Caratteri non validi non sono ammessi. Predefinito a `_complete` se lasciato vuoto. Questa cartella viene creata relativa alla directory genitore della cartella originale.

#### Pulsanti Workflow con un Clic
-   **Visual Workflow Builder**: Crea pulsanti workflow personalizzati da azioni integrate senza scrivere manualmente il DSL.
-   **Custom Workflow Button DSL**: Gli utenti avanzati possono ancora modificare direttamente il testo di definizione del workflow. Un DSL non valido ripiega in modo sicuro sul workflow predefinito e mostra un avviso nella barra laterale o nell'interfaccia delle impostazioni.
-   **Strategia Errori Workflow**:
    *   **Ferma su Errore (Predefinito)**: Interrompe immediatamente il workflow non appena un passaggio fallisce.
    *   **Continua su Errore**: Continua a eseguire i passaggi successivi e riporta il numero di azioni fallite alla fine.
-   **Workflow Predefinito Incluso**: `One-Click Extract` concatena `Elabora file (Aggiungi link)`, `Generazione batch da titoli` e `Correzione Mermaid Batch`.

#### Impostazioni Prompt Personalizzati
Questa funzione ti consente di sovrascrivere le istruzioni predefinite (prompt) inviate all'LLM per attività specifiche, offrendoti un controllo preciso sull'output.

-   **Attiva Prompt Personalizzati per Attività Specifiche**:
    *   **Disattivato (Predefinito)**: Il plugin usa i suoi prompt predefiniti integrati per tutte le operazioni.
    *   **Attivato**: Abilita la possibilità di impostare prompt personalizzati per le attività elencate di seguito. Questo è l'interruttore principale per questa funzione.

-   **Usa Prompt Personalizzato per [Nome Attività]**: (Visibile solo se attivato sopra)
    *   Per ogni attività supportata ("Aggiungi link", "Genera da titolo", "Ricerca e riassunto", "Estrai concetti"), puoi attivare o disattivare individualmente il tuo prompt personalizzato.
    *   **Disattivato**: Questa specifica attività userà il prompt predefinito.
    *   **Attivato**: Questa attività userà il testo fornito nell'area di testo "Prompt Personalizzato" corrispondente di seguito.

-   **Area di Testo Prompt Personalizzato**: (Visibile solo quando il prompt personalizzato di un'attività è attivato)
    *   **Visualizzazione Prompt Predefinito**: Per tuo riferimento, il plugin mostra il prompt predefinito che userebbe normalmente per l'attività. Puoi usare il pulsante **"Copia Prompt Predefinito"** per copiare questo testo come punto di partenza per il tuo prompt personalizzato.
    *   **Input Prompt Personalizzato**: Qui scrivi le tue istruzioni per l'LLM.
    *   **Placeholder**: Puoi (e dovresti) usare placeholder speciali nel tuo prompt, che il plugin sostituirà con il contenuto reale prima di inviare la richiesta all'LLM. Fai riferimento al prompt predefinito per vedere quali placeholder sono disponibili per ogni attività. I placeholder comuni includono:
        *   `{TITLE}`: Il titolo della nota corrente.
        *   `{RESEARCH_CONTEXT_SECTION}`: Il contenuto raccolto dalla ricerca web.
        *   `{USER_PROMPT}`: Il contenuto della nota in fase di elaborazione.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Ambito Controllo Duplicati
-   **Modalità Ambito Controllo Duplicati**: Controlla quali file vengono confrontati con le note nella tua Cartella Note di Concetto per trovare potenziali duplicati.
    *   **Tutto il Vault (Predefinito)**: Confronta le note di concetto con tutte le altre note nel vault (esclusa la Cartella Note di Concetto stessa).
    *   **Includi solo Cartelle Specifiche**: Confronta le note di concetto solo con le note all'interno delle cartelle elencate di seguito.
    *   **Escludi Cartelle Specifiche**: Confronta le note di concetto con tutte le note *tranne* quelle all'interno delle cartelle elencate di seguito (ed escludendo anche la Cartella Note di Concetto).
    *   **Solo Cartella Concetti**: Confronta le note di concetto solo con *altre note all'interno della Cartella Note di Concetto*. Aiuta a trovare duplicati puramente all'interno dei concetti generati.
-   **Includi/Escludi Cartelle**: (Visibile solo se la Modalità è 'Includi' o 'Escludi') Inserisci i *percorsi relativi* delle cartelle che desideri includere o escludere, **un percorso per riga**. I percorsi sono sensibili alle maiuscole e usano `/` come separatore (es. `Materiale Riferimento/Articoli` o `Note Giornaliere`). Queste cartelle non possono essere le stesse o trovarsi all'interno della Cartella Note di Concetto.

#### Fornitore Ricerca Web
-   **Fornitore Ricerca**: Scegli tra `Tavily` (richiede chiave API, raccomandato) e `DuckDuckGo` (sperimentale, spesso bloccato dai motori di ricerca per richieste automatizzate). Usato per "Ricerca e riassunto argomento" e opzionalmente per "Genera da titolo".
-   **Chiave API Tavily**: (Visibile solo se Tavily è selezionato) Inserisci la tua chiave API da [tavily.com](https://tavily.com/).
-   **Risultati Max Tavily**: (Visibile solo se Tavily è selezionato) Numero massimo di risultati di ricerca che Tavily deve restituire (1-20). Predefinito: 5.
-   **Profondità Ricerca Tavily**: (Visibile solo se Tavily è selezionato) Scegli tra `basic` (predefinito) o `advanced`. Nota: `advanced` fornisce risultati migliori ma costa 2 crediti API per ricerca invece di 1.
-   **Risultati Max DuckDuckGo**: (Visibile solo se DuckDuckGo è selezionato) Numero massimo di risultati di ricerca da analizzare (1-10). Predefinito: 5.
-   **Timeout Recupero Contenuti DuckDuckGo**: (Visibile solo se DuckDuckGo è selezionato) Secondi massimi di attesa durante il tentativo di recuperare contenuti da ogni URL dei risultati di DuckDuckGo. Predefinito: 15.
-   **Max Token Contenuto Ricerca**: Numero massimo approssimativo di token dei risultati della ricerca web combinati (snippet/contenuto recuperato) da includere nel prompt di riassunto. Aiuta a gestire la dimensione della finestra di contesto e i costi. (Predefinito: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Dominio di Apprendimento Focalizzato
-   **Attiva Dominio di Apprendimento Focalizzato**:
    *   **Disattivato (Predefinito)**: I prompt inviati all'LLM usano le istruzioni standard di carattere generale.
    *   **Attivato**: Ti consente di specificare uno o più campi di studio per migliorare la comprensione contestuale dell'LLM.
-   **Dominio di Apprendimento**: (Visibile solo se attivato sopra) Inserisci i tuoi campi specifici, es. 'Scienza dei Materiali', 'Fisica dei Polimeri', 'Machine Learning'. Questo aggiungerà una riga "Campi Rilevanti: [...]" all'inizio dei prompt, aiutando l'LLM a generare link e contenuti più accurati e pertinenti per la tua specifica area di studio.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Guia all'Uso

### Flussi rapidi e barra laterale

-   Apri la barra laterale Notemd per accedere alle sezioni di azioni raggruppate per elaborazione centrale, generazione, traduzione, conoscenza e utility.
-   Usa l'area **Flussi rapidi** in alto nella barra laterale per lanciare pulsanti multi-passaggio personalizzati.
-   Il workflow predefinito **One-Click Extract** esegue `Elabora file (Aggiungi link)` -> `Generazione batch da titoli` -> `Correzione Mermaid Batch`.
-   Il progresso del workflow, i log per passaggio e i fallimenti sono visualizzati nella barra laterale, con un piè di pagina ancorato che protegge la barra di progresso e l'area dei log dallo scorrimento causato dalle sezioni espanse.
-   La scheda di progresso mantiene leggibili a colpo d'occhio il testo di stato, un indicatore di percentuale dedicato e il tempo rimanente; gli stessi workflow personalizzati possono essere riconfigurati dalle impostazioni.

### Elaborazione Originale (Aggiunta Link Wiki)
Questa è la funzionalità principale focalizzata sull'identificazione dei concetti e sull'aggiunta di `[[wiki-links]]`.

**Importante:** Questo processo funziona solo su file `.md` o `.txt`. Puoi convertire gratuitamente file PDF in file MD usando [Mineru](https://github.com/opendatalab/MinerU) prima di elaborarli ulteriormente.

1.  **Utilizzando la Barra Laterale**:
    *   Apri la barra laterale Notemd (icona bacchetta o palette dei comandi).
    *   Apri il file `.md` o `.txt`.
    *   Clicca su **"Process File (Add Links)"**.
    *   Per elaborare una cartella: Clicca su **"Process Folder (Add Links)"**, seleziona la cartella e clicca su "Process".
    *   Il progresso viene mostrato nella barra laterale. Puoi annullare l'attività usando il pulsante "Annulla Elaborazione" nella barra laterale.
    *   *Nota per l'elaborazione delle cartelle:* I file vengono elaborati in background senza essere aperti nell'editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Utilizzando la Palette dei Comandi** (`Ctrl+P` o `Cmd+P`):
    *   **File Singolo**: Apri il file ed esegui `Notemd: Process Current File`.
    *   **Cartella**: Esegui `Notemd: Process Folder`, quindi seleziona la cartella. I file vengono elaborati in background senza essere aperti nell'editor.
    *   Appare un modal di progresso per le azioni della palette dei comandi, che include un pulsante di annullamento.
    *   *Nota:* il plugin rimuove automaticamente le righe iniziali `\boxed{` e finali `}` se trovate nel contenuto elaborato finale prima del salvataggio.

### Nuove Funzioni

1.  **Riassumi come diagramma Mermaid**:
    *   Apri la nota che desideri riassumere.
    *   Esegui il comando `Notemd: Summarise as Mermaid diagram` (via palette dei comandi o pulsante della barra laterale).
    *   Il plugin genererà una nuova nota con il diagramma Mermaid.

2.  **Traduci Nota/Selezione**:
    *   Seleziona il testo in una nota per tradurre solo quella selezione, oppure invoca il comando senza selezione per tradurre l'intera nota.
    *   Esegui il comando `Notemd: Translate Note/Selection` (via palette dei comandi o pulsante della barra laterale).
    *   Apparirà un modal che ti consentirà di confermare o cambiare la **Lingua di Destinazione** (predefinita in base all'impostazione specificata in Configurazione).
    *   Il plugin usa il **Fornitore LLM** configurato (basato sulle impostazioni Multi-Modello) per eseguire la traduzione.
    *   Il contenuto tradotto viene salvato nel **Percorso Salvataggio Traduzioni** configurato con il suffisso appropriato e aperto in un **nuovo pannello a destra** del contenuto originale per un facile confronto.
    *   Puoi annullare questa attività tramite il pulsante della barra laterale o il pulsante di annullamento del modal.
3.  **Traduzione Batch**:
    *   Esegui il comando `Notemd: Batch Translate Folder` dalla palette dei comandi e seleziona una cartella, oppure fai clic con il tasto destro su una cartella nell'esplora file e scegli "Traduci questa cartella in batch".
    *   Il plugin tradurrà tutti i file Markdown nella cartella selezionata.
    *   I file tradotti vengono salvati nel percorso di traduzione configurato ma non vengono aperti automaticamente.
    *   Questo processo può essere annullato tramite il modal di progresso.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Ricerca e Riassunto Argomento**:
    *   Seleziona il testo in una nota OPPURE assicurati che la nota abbia un titolo (questo sarà l'argomento della ricerca).
    *   Esegui il comando `Notemd: Research and Summarize Topic` (via palette dei comandi o pulsante della barra laterale).
    *   Il plugin usa il **Fornitore Ricerca** configurato (Tavily/DuckDuckGo) e il **Fornitore LLM** appropriato (basato sulle impostazioni Multi-Modello) per trovare e riassumere le informazioni.
    *   Il riassunto viene aggiunto alla nota corrente.
    *   Puoi annullare questa attività tramite il pulsante della barra laterale o il pulsante di annullamento del modal.
    *   *Nota:* Le ricerche su DuckDuckGo possono fallire a causa del rilevamento dei bot. Si raccomanda Tavily.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Genera Contenuti da Titolo**:
    *   Apri una nota (può essere vuota).
    *   Esegui il comando `Notemd: Generate Content from Title` (via palette dei comandi o pulsante della barra laterale).
    *   Il plugin usa il **Fornitore LLM** appropriato (basato sulle impostazioni Multi-Modello) per generare contenuti basati sul titolo della nota, sostituendo qualsiasi contenuto esistente.
    *   Se l'impostazione **"Attiva Ricerca in 'Genera da Titolo'"** è attiva, eseguirà prima una ricerca web (utilizzando il **Fornitore Ricerca Web** configurato) e includerà quel contesto nel prompt inviato all'LLM.
    *   Puoi annullare questa attività tramite il pulsante della barra laterale o il pulsante di annullamento del modal.

5.  **Generazione Contenuti Batch da Titoli**:
    *   Esegui il comando `Notemd: Batch Generate Content from Titles` (via palette dei comandi o pulsante della barra laterale).
    *   Seleziona la cartella contenente le note che desideri elaborare.
    *   Il plugin itererà attraverso ogni file `.md` nella cartella (esclusi i file `_processed.md` e i file nella cartella "complete" designata), generando contenuti basati sul titolo della nota e sostituendo i contenuti esistenti. I file vengono elaborati in background senza essere aperti nell'editor.
    *   I file elaborati con successo vengono spostati nella cartella "complete" configurata.
    *   Questo comando rispetta l'impostazione **"Attiva Ricerca in 'Genera da Titolo'"** per ogni nota elaborata.
    *   Puoi annullare questa attività tramite il pulsante della barra laterale o il pulsante di annullamento del modal.
    *   Il progresso e i risultati (numero di file modificati, errori) vengono mostrati nel log della barra laterale/modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Controlla e Rimuovi Note di Concetto Duplicate**:
    *   Assicurati che il **Percorso Cartella Note di Concetto** sia configurato correttamente nelle impostazioni.
    *   Esegui `Notemd: Check and Remove Duplicate Concept Notes` (via palette dei comandi o pulsante della barra laterale).
    *   Il plugin scansiona la cartella delle note di concetto e confronta i nomi dei file con le note esterne alla cartella utilizzando diverse regole (corrispondenza esatta, plurali, normalizzazione, inclusione).
    *   Se vengono trovati potenziali duplicati, appare una finestra modale che elenca i file, il motivo per cui sono stati contrassegnati e i file in conflitto.
    *   Esamina attentamente l'elenco. Clicca su **"Delete Files"** per spostare i file elencati nel cestino di sistema, o su **"Cancel"** per non intraprendere alcuna azione.
    *   Il progresso e i risultati vengono mostrati nel log della barra laterale/modal.

7.  **Estrai Concetti (Modalità Pura)**:
    *   Questa funzione ti consente di estrarre concetti da un documento e creare le relative note di concetto *senza* alterare il file originale. È perfetto per popolare rapidamente la tua base di conoscenza da un set di documenti.
    *   **File Singolo**: Apri un file ed esegui il comando `Notemd: Extract concepts (create concept notes only)` dalla palette dei comandi oppure clicca sul pulsante **"Extract concepts (current file)"** nella barra laterale.
    *   **Cartella**: Esegui il comando `Notemd: Batch extract concepts from folder` dalla palette dei comandi oppure clicca sul pulsante **"Extract concepts (folder)"** nella barra laterale, quindi seleziona una cartella per elaborare tutte le sue note.
    *   Il plugin leggerà i file, identificherà i concetti e creerà nuove note per essi nella tua **Cartella Note di Concetto** designata, lasciando intatti i file originali.

8.  **Crea Wiki-Link e Genera Nota da Selezione**:
    *   Questo potente comando semplifica il processo di creazione e popolamento di nuove note di concetto.
    *   Seleziona una parola o una frase nel tuo editor.
    *   Esegui il comando `Notemd: Create Wiki-Link & Generate Note from Selection` (si raccomanda di assegnare una scorciatoia da tastiera a questo comando, es. `Cmd+Shift+W`).
    *   Il plugin:
        1.  Sostituirà il testo selezionato con un `[[wiki-link]]`.
        2.  Controllerà se esiste già una nota con quel titolo nella tua **Cartella Note di Concetto**.
        3.  Se esiste, aggiunge un backlink alla nota corrente.
        4.  Se non esiste, crea una nuova nota vuota.
        5.  Quindi esegue automaticamente il comando **"Generate Content from Title"** sulla nota nuova o esistente, popolandola con contenuti generati dall'IA.

9.  **Estrai Concetti e Genera Titoli**:
    *   Questo comando concatena due potenti funzioni per un workflow semplificato.
    *   Esegui il comando `Notemd: Extract Concepts and Generate Titles` dalla palette dei comandi (si raccomanda di assegnare una scorciatoia da tastiera).
    *   Il plugin:
        1.  Per prima cosa, eseguirà l'attività **"Extract concepts (current file)"** sul file attualmente attivo.
        2.  Quindi, eseguirà automaticamente l'attività **"Batch generate from titles"** sulla cartella che hai configurato come **Percorso cartella note di concetto** nelle impostazioni.
    *   Questo ti consente prima di popolare la tua base di conoscenza con nuovi concetti da un documento sorgente e poi di sviluppare immediatamente quelle nuove note di concetto con contenuti generati dall'IA in un unico passaggio.

10. **Estrai Testo Originale Specifico**:
    *   Configura le tue domande nelle impostazioni sotto "Estrai Testo Originale Specifico".
    *   Usa il pulsante "Estrai Testo Originale Specifico" nella barra laterale per elaborare il file attivo.
    *   **Modalità Unita**: Consente un'elaborazione più veloce inviando tutte le domande in un unico prompt.
    *   **Traduzione**: Traduce opzionalmente il testo estratto nella lingua configurata.
    *   **Output Personalizzato**: Configura dove e come viene salvato il file estratto.

11. **Correzione Mermaid Batch**:
    *   Usa il pulsante "Correzione Mermaid Batch" nella barra laterale per scansionare una cartella e correggere i comuni errori di sintassi Mermaid.
    *   Il plugin segnalerà eventuali file che contengono ancora errori in un file `mermaid_error_{nome_cartella}.md`.
    *   Configura opzionalmente il plugin per spostare questi file problematici in una cartella separata per la revisione.

## Fornitori LLM Supportati

| Fornitore          | Tipo    | Chiave API Richiesta   | Note                                                                  |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Sì                     | Endpoint nativo DeepSeek con gestione modelli di ragionamento         |
| Qwen               | Cloud   | Sì                     | Preset modalità compatibile DashScope per modelli Qwen / QwQ          |
| Qwen Code          | Cloud   | Sì                     | Preset focalizzato sul codice DashScope per modelli Qwen coder        |
| Doubao             | Cloud   | Sì                     | Preset Volcengine Ark; solitamente imposta il campo modello sul tuo ID endpoint |
| Moonshot           | Cloud   | Sì                     | Endpoint ufficiale Kimi / Moonshot                                    |
| GLM                | Cloud   | Sì                     | Endpoint ufficiale Zhipu BigModel compatibile con OpenAI              |
| Z AI               | Cloud   | Sì                     | Endpoint ufficiale internazionale GLM/Zhipu; integra `GLM`            |
| MiniMax            | Cloud   | Sì                     | Endpoint ufficiale chat-completions MiniMax                           |
| Huawei Cloud MaaS  | Cloud   | Sì                     | Endpoint Huawei ModelArts MaaS compatibile con OpenAI per modelli ospitati |
| Baidu Qianfan      | Cloud   | Sì                     | Endpoint ufficiale Baidu Qianfan compatibile con OpenAI per modelli ERNIE |
| SiliconFlow        | Cloud   | Sì                     | Endpoint ufficiale SiliconFlow compatibile con OpenAI per modelli OSS ospitati |
| OpenAI             | Cloud   | Sì                     | Supporta modelli GPT e serie o                                        |
| Anthropic          | Cloud   | Sì                     | Supporta modelli Claude                                               |
| Google             | Cloud   | Sì                     | Supporta modelli Gemini                                               |
| Mistral            | Cloud   | Sì                     | Supporta famiglie Mistral e Codestral                                 |
| Azure OpenAI       | Cloud   | Sì                     | Richiede Endpoint, Chiave API, nome distribuzione e Versione API      |
| OpenRouter         | Gateway | Sì                     | Accedi a molti fornitori tramite ID modelli OpenRouter                |
| xAI                | Cloud   | Sì                     | Endpoint nativo Grok                                                  |
| Groq               | Cloud   | Sì                     | Inferenza veloce compatibile con OpenAI per modelli OSS ospitati      |
| Together           | Cloud   | Sì                     | Endpoint compatibile con OpenAI per modelli OSS ospitati              |
| Fireworks          | Cloud   | Sì                     | Endpoint inferenza compatibile con OpenAI                             |
| Requesty           | Gateway | Sì                     | Router multi-fornitore sotto un'unica chiave API                      |
| OpenAI Compatible  | Gateway | Opzionale              | Preset generico per LiteLLM, vLLM, Perplexity, Vercel AI Gateway, ecc.|
| LMStudio           | Locale  | Opzionale (`EMPTY`)    | Esegue modelli localmente via server LM Studio                        |
| Ollama             | Locale  | No                     | Esegue modelli localmente via server Ollama                           |

*Nota: Per i fornitori locali (LMStudio, Ollama), assicurati che la rispettiva applicazione server sia in esecuzione e accessibile all'URL Base configurato.*
*Nota: Per OpenRouter e Requesty, usa l'identificatore modello completo/con prefisso fornitore mostrato dal gateway (es. `google/gemini-flash-1.5` o `anthropic/claude-3-7-sonnet-latest`).*
*Nota: `Doubao` solitamente si aspetta un ID endpoint/distribuzione Ark nel campo modello invece di un nome famiglia modello grezzo. La schermata delle impostazioni ora avverte quando il valore placeholder è ancora presente e blocca i test di connessione finché non lo sostituisci con un ID endpoint reale.*
*Nota: `Z AI` punta alla linea internazionale `api.z.ai`, mentre `GLM` mantiene l'endpoint BigModel nella Cina continentale. Scegli il preset che corrisponde alla regione del tuo account.*
*Nota: I preset focalizzati sulla Cina usano controlli di connessione chat-first in modo che il test validi il modello/distribuzione effettivamente configurato, non solo l'accessibilità della chiave API.*
*Nota: `OpenAI Compatible` è destinato a gateway e proxy personalizzati. Imposta l'URL Base, la policy della chiave API e l'ID modello secondo la documentazione del tuo fornitore.*

## Utilizzo della Rete e Gestione dei Dati

Notemd viene eseguito localmente all'interno di Obsidian, ma alcune funzioni inviano richieste in uscita.

### Chiamate al Fornitore LLM (Configurabili)

- Trigger: elaborazione file, generazione, traduzione, riassunto ricerca, riassunto Mermaid e azioni di connessione/diagnostica.
- Endpoint: i tuoi URL base del fornitore configurati nelle impostazioni di Notemd.
- Dati inviati: testo del prompt e contenuto dell'attività richiesti per l'elaborazione.
- Nota sulla gestione dei dati: le chiavi API sono configurate localmente nelle impostazioni del plugin e usate per firmare le richieste dal tuo dispositivo.

### Chiamate di Ricerca Web (Opzionali)

- Trigger: quando la ricerca web è attiva e viene selezionato un fornitore di ricerca.
- Endpoint: API Tavily o endpoint DuckDuckGo.
- Dati inviati: la tua query di ricerca e i metadati della richiesta richiesti.

### Diagnostica Sviluppatore e Log di Debug (Opzionali)

- Trigger: modalità debug API e azioni diagnostiche sviluppatore.
- Archiviazione: i log diagnostici e di errore sono scritti nella root del tuo vault (es. `Notemd_Provider_Diagnostic_*.txt` e `Notemd_Error_Log_*.txt`).
- Nota sui rischi: i log possono contenere frammenti di richiesta/risposta. Revisiona i log prima di condividerli pubblicamente.

### Archiviazione Locale

- La configurazione del plugin è memorizzata in `.obsidian/plugins/notemd/data.json`.
- I file generati, i report e i log opzionali sono memorizzati nel tuo vault secondo le tue impostazioni.

## Risoluzione dei Problemi

### Problemi Comuni
-   **Il plugin non si carica**: Assicurati che `manifest.json`, `main.js`, `styles.css` siano nella cartella corretta (`<Vault>/.obsidian/plugins/notemd/`) e riavvia Obsidian. Controlla la Console per Sviluppatori (`Ctrl+Shift+I` o `Cmd+Option+I`) per errori all'avvio.
-   **Fallimenti Elaborazione / Errori API**:
    1.  **Controlla il Formato File**: Assicurati che il file che stai cercando di elaborare o controllare abbia un'estensione `.md` o `.txt`. Notemd attualmente supporta solo questi formati testuali.
    2.  Usa il comando/pulsante "Test connessione LLM" per verificare le impostazioni del fornitore attivo.
    3.  Controlla due volte la Chiave API, l'URL Base, il Nome Modello e la Versione API (per Azure). Assicurati che la chiave API sia corretta e abbia crediti/permessi sufficienti.
    4.  Assicurati che il tuo server LLM locale (LMStudio, Ollama) sia in esecuzione e l'URL Base sia corretto (es. `http://localhost:1234/v1` per LMStudio).
    5.  Controlla la tua connessione internet per i fornitori cloud.
    6.  **Per errori di elaborazione di un singolo file:** Controlla la Console per Sviluppatori per messaggi di errore dettagliati. Copiali tramite il pulsante nel modal di errore se necessario.
    7.  **Per errori di elaborazione batch:** Controlla il file `error_processing_filename.log` nella root del tuo vault per messaggi di errore dettagliati per ogni file fallito. La Console per Sviluppatori o il modal di errore potrebbero mostrare un riassunto o un errore batch generale.
    8.  **Log Errori Automatici:** Se un processo fallisce, il plugin salva automaticamente un file di log dettagliato chiamato `Notemd_Error_Log_[Timestamp].txt` nella directory root del tuo vault. Questo file contiene il messaggio di errore, lo stack trace e i log di sessione. Se riscontri problemi persistenti, controlla questo file. L'attivazione della "Modalità Debug Errori API" nelle impostazioni popolerà questo log con dati di risposta API ancora più dettagliati.
    9.  **Diagnostica Richiesta Lunga Endpoint Reale (Sviluppatore)**:
        - Percorso intra-plugin (raccomandato per primo): usa **Impostazioni -> Notemd -> Diagnostica fornitore per sviluppatori (richiesta lunga)** per eseguire una sonda runtime sul fornitore attivo e generare `Notemd_Provider_Diagnostic_*.txt` nella root del vault.
        - Percorso CLI (fuori dal runtime di Obsidian): per un confronto riproducibile a livello di endpoint tra comportamento bufferizzato e streaming, usa:
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
        Il report generato contiene tempistiche per tentativo (`First Byte`, `Duration`), metadati richiesta puliti, header risposta, frammenti body grezzi/parziali, frammenti stream parsati e punti di fallimento del livello trasporto.
-   **Problemi di Connessione LM Studio/Ollama**:
    *   **Fallimento Test Connessione**: Assicurati che il server locale (LM Studio o Ollama) sia in esecuzione e che il modello corretto sia caricato/disponibile.
    *   **Errori CORS (Ollama su Windows)**: Se riscontri errori CORS (Cross-Origin Resource Sharing) usando Ollama su Windows, potresti dover impostare la variabile d'ambiente `OLLAMA_ORIGINS`. Puoi farlo eseguendo `set OLLAMA_ORIGINS=*` nel tuo prompt dei comandi prima di avviare Ollama. Questo consente richieste da qualsiasi origine.
    *   **Abilita CORS in LM Studio**: Per LM Studio, puoi abilitare il CORS direttamente nelle impostazioni del server, il che potrebbe essere necessario se Obsidian viene eseguito in un browser o ha policy di origine rigide.
-   **Errori Creazione Cartella ("Il nome del file non può contenere...")**:
    *   Questo solitamente significa che il percorso fornito nelle impostazioni (**Percorso Cartella File Elaborati** o **Percorso Cartella Note di Concetto**) non è valido *per Obsidian*.
    *   **Assicurati di usare percorsi relativi** (es. `Elaborati`, `Note/Concetti`) e **non percorsi assoluti** (es. `C:\Utenti\...`, `/Users/...`).
    *   Controlla caratteri non validi: `* " \ / < > : | ? # ^ [ ]`. Nota che `\` non è valido nemmeno su Windows per i percorsi di Obsidian. Usa `/` come separatore di percorso.
-   **Problemi di Performance**: L'elaborazione di file grandi o di molti file può richiedere tempo. Riduci l'impostazione "Conteggio Parole per Pezzo" per chiamate API potenzialmente più veloci (ma più numerose). Prova un fornitore o un modello LLM diverso.
-   **Collegamenti Inaspettati**: La qualità dei collegamenti dipende fortemente dall'LLM e dal prompt. Sperimenta con diversi modelli o impostazioni di temperatura.

## Contribuire

I contributi sono i benvenuti! Fai riferimento alla repository GitHub per le linee guida: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## Documentazione per i Manutentori

- [Workflow di Rilascio (Inglese)](./docs/maintainer/release-workflow.md)
- [Workflow di Rilascio (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Licenza

Licenza MIT - Vedi il file [LICENSE](LICENSE) per i dettagli.

---

*Notemd v1.8.1 - Migliora il tuo grafo di conoscenza su Obsidian con l'IA.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
