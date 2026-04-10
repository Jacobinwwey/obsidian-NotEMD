
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd per Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Leggi la documentazione in altre lingue: [Language Hub](./docs/i18n/README.md)

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

Notemd potenzia il tuo flusso di lavoro su Obsidian integrandosi con vari modelli linguistici di grandi dimensioni (LLM) per elaborare le tue note multilingue, generare automaticamente wiki-link per i concetti chiave, creare note di concetto corrispondenti, eseguire ricerche web, aiutandoti a costruire potenti grafi di conoscenza e altro ancora.

**Versione:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

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

1.  **Installa e Attiva**: Ottieni il plugin dal market della community di Obsidian.
2.  **Configura LLM**: Vai in `Impostazioni -> Notemd`, seleziona il tuo fornitore LLM (come OpenAI o uno locale come Ollama) e inserisci la tua chiave API/URL.
3.  **Apri la Barra Laterale**: Clicca sull'icona della bacchetta magica Notemd nella barra laterale sinistra per aprire la vista.
4.  **Elabora una Nota**: Apri una nota e clicca su **"Elabora file (Aggiungi link)"** nella barra laterale per aggiungere automaticamente `[[wiki-links]]`.
5.  **Esegui Workflow Rapido**: Usa il pulsante predefinito **"One-Click Extract"** per concatenare elaborazione, generazione batch e pulizia Mermaid.

È tutto! Esplora le impostazioni per sbloccare funzioni come ricerca web, traduzione e generazione di contenuti.

## Supporto Linguistico

### Contratto di Comportamento Linguistico

| Aspetto | Ambito | Predefinito | Note |
|---|---|---|---|
| `UI Locale` | Solo testo dell'interfaccia (impostazioni, barra laterale) | `auto` | Segue la lingua di Obsidian; cataloghi attuali: `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Output delle attività generato dall'LLM (link, riassunti) | `en` | Può essere globale o per singola attività. |
| `Disable auto translation` | Le attività non di traduzione mantengono il contesto originale | `false` | Le attività esplicite di `Traduci` applicano comunque la lingua di destinazione. |

- La documentazione ufficiale è mantenuta in inglese e cinese semplificato, con supporto completo per oltre 30 lingue.
- Tutte le lingue supportate sono collegate nell'intestazione sopra.

## Caratteristiche Principali

### Elaborazione Documenti tramite IA
- **Supporto Multi-LLM**: Connettiti a vari fornitori LLM cloud e locali.
- **Smart Chunking**: Divide automaticamente documenti lunghi in parti gestibili.
- **Preservazione dei Contenuti**: Mantiene la formattazione originale aggiungendo struttura e link.
- **Logica di Riprova**: Riprova automatica opzionale per chiamate API fallite.
- **Preset per la Cina**: Include fornitori come `Qwen`, `Doubao`, `Moonshot`, ecc.

### Potenziamento Grafo di Conoscenza
- **Wiki-Linking Automatico**: Identifica e aggiunge wiki-link ai concetti principali.
- **Creazione Note di Concetto**: Crea automaticamente nuove note per i concetti scoperti.

### Traduzione
- **Traduzione tramite IA**: Traduce il contenuto delle note con l'LLM configurato.
- **Traduzione Batch**: Traduce tutti i file in una cartella selezionata.

### Ricerca Web e Generazione Contenuti
- **Ricerca Web**: Effettua ricerche tramite Tavily o DuckDuckGo e riassume i risultati.
- **Generazione da Titolo**: Usa il titolo della nota per generare contenuti iniziali.
- **Auto-Fix Mermaid**: Ripara automaticamente la sintassi dei diagrammi Mermaid generati.

## Installazione
1. Vai su **Impostazioni** → **Plugin della community**.
2. Disattiva la "Modalità ristretta".
3. Clicca su **Sfoglia** e cerca "Notemd".
4. Clicca su **Installa** e poi su **Attiva**.

## Licenza
Licenza MIT - Consulta il file [LICENSE](LICENSE) per i dettagli.

---
*Notemd v1.8.0 - Migliora il tuo grafo di conoscenza su Obsidian con l'IA.*
