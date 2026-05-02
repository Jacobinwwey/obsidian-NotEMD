![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Notemd-Plugin für Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Dokumentation in weiteren Sprachen lesen: [Sprachzentrum](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
  KI-gestützte mehrsprachige Wissensverbesserung
==================================================
```

Ein einfacher Weg, Ihre eigene Wissensdatenbank zu erstellen!

Notemd verbessert Ihren Obsidian-Workflow durch die Integration verschiedener großer Sprachmodelle (LLMs), um Ihre mehrsprachigen Notizen zu verarbeiten, automatisch Wiki-Links für Schlüsselkonzepte zu generieren, entsprechende Konzeptnotizen zu erstellen, Web-Recherchen durchzuführen und Ihnen dabei zu helfen, leistungsstarke Wissensgraphen aufzubauen.

If\ you\ love\ using\ Notemd\,\ please\ consider\ \[\�\�\�\ Give\ a\ Star\ on\ GitHub\]\(https\:\/\/github\.com\/Jacobinwwey\/obsidian\-NotEMD\)\ or\ \[\�\�\�\�\�\�\ Buy\ Me\ a\ Coffee\]\(https\:\/\/ko\-fi\.com\/jacobinwwey\)\.

**Version:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Inhaltsverzeichnis

- [Schnellstart](#schnellstart)
- [Sprachunterstützung](#sprachunterstützung)
- [Funktionen](#funktionen)
- [Installationsanleitung](#installation)
- [Konfiguration](#konfiguration)
- [Benutzerhandbuch](#benutzerhandbuch)
- [Unterstützte LLM-Anbieter](#unterstützte-llm-anbieter)
- [Netzwerknutzung & Datenverarbeitung](#netzwerknutzung--datenverarbeitung)
- [Fehlerbehebung](#fehlerbehebung)
- [Mitwirken](#mitwirken)
- [Dokumentation für Maintainer](#dokumentation-für-maintainer)
- [Lizenz](#lizenz)

## Schnellstart

1.  **Installieren & Aktivieren**: Holen Sie sich das Plugin aus dem Obsidian Marketplace.
2.  **LLM konfigurieren**: Gehen Sie zu `Einstellungen -> Notemd`, wählen Sie Ihren LLM-Anbieter (wie OpenAI oder einen lokalen wie Ollama) und geben Sie Ihren API-Schlüssel/URL ein.
3.  **Seitenleiste öffnen**: Klicken Sie auf das Notemd-Zauberstab-Symbol in der linken Leiste, um die Seitenleiste zu öffnen.
4.  **Notiz verarbeiten**: Öffnen Sie eine beliebige Notiz und klicken Sie in der Seitenleiste auf **"Datei verarbeiten (Links hinzufügen)"**, um automatisch `[[wiki-links]]` zu Schlüsselkonzepten hinzuzufügen.
5.  **Schnell-Workflow ausführen**: Verwenden Sie die Standard-Schaltfläche **"One-Click Extract"**, um Verarbeitung, Batch-Generierung und Mermaid-Bereinigung von einem einzigen Einstiegspunkt aus zu verketten.

Das ist alles! Erkunden Sie die Einstellungen, um weitere Funktionen wie Web-Recherche, Übersetzung und Inhaltsgenerierung freizuschalten.

## Sprachunterstützung

### Sprachverhaltensvertrag

| Aspekt | Umfang | Standard | Hinweise |
|---|---|---|---|
| `UI-Sprache` | Nur Text der Plugin-Oberfläche (Einstellungen, Seitenleiste, Hinweise, Dialoge) | `auto` | Folgt dem Obsidian-Gebietsschema; aktuelle Kataloge: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Aufgaben-Ausgabesprache` | Von LLM generierte Aufgabenausgabe (Links, Zusammenfassungen, Generierung, Extraktion, Übersetzungsziel) | `en` | Kann global oder pro Aufgabe eingestellt werden, wenn `Verschiedene Sprachen für Aufgaben verwenden` aktiviert ist. |
| `Automatische Übersetzung deaktivieren` | Nicht-Übersetzungsaufgaben behalten den Originalkontext bei | `false` | Explizite `Übersetzen`-Aufgaben erzwingen weiterhin die konfigurierte Zielsprache. |
| `Sprach-Fallback` | Auflösung fehlender UI-Schlüssel | locale -> `en` | Hält die UI stabil, wenn einige Schlüssel nicht übersetzt sind. |

- Die gepflegten Quelldokumente sind Englisch und vereinfachtes Chinesisch; veröffentlichte README-Übersetzungen sind oben im Kopfbereich verlinkt.
- Die In-App-UI-Locale-Abdeckung entspricht derzeit genau dem expliziten Katalog im Code: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Der englische Fallback bleibt ein Implementierungs-Sicherheitsnetz, aber unterstützte sichtbare Oberflächen sind per Regressionstests abgesichert und sollten im Normalbetrieb nicht stillschweigend auf Englisch zurückfallen.
- Weitere Details und Richtlinien für Mitwirkende finden Sie im [Sprachzentrum](./docs/i18n/README.md).

## Funktionen

### KI-gestützte Dokumentenverarbeitung
- **Multi-LLM-Unterstützung**: Verbindung zu verschiedenen Cloud- und lokalen LLM-Anbietern (siehe [Unterstützte LLM-Anbieter](#unterstützte-llm-anbieter)).
- **Smart Chunking**: Teilt große Dokumente automatisch in handliche Stücke auf, basierend auf der Wortzahl.
- **Inhaltserhaltung**: Behält die ursprüngliche Formatierung bei, während Struktur und Links hinzugefügt werden.
- **Fortschrittsverfolgung**: Echtzeit-Updates über die Notemd-Seitenleiste oder ein Fortschritts-Modal.
- **Abbrechbare Operationen**: Brechen Sie jede Verarbeitungsaufgabe (einzeln oder Batch) über die entsprechende Schaltfläche in der Seitenleiste ab. Befehlspaletten-Operationen verwenden ein Modal, das ebenfalls abgebrochen werden kann.
- **Multi-Modell-Konfiguration**: Verwenden Sie verschiedene LLM-Anbieter *und* spezifische Modelle für unterschiedliche Aufgaben (Links hinzufügen, Forschung, Titel generieren, Übersetzen) oder verwenden Sie einen einzigen Anbieter für alles.
- **Stabile API-Aufrufe (Retry-Logik)**: Aktivieren Sie optional automatische Wiederholungsversuche für fehlgeschlagene LLM-API-Aufrufe mit konfigurierbaren Intervallen und Versuchslimits.
- **Robuste Provider-Verbindungstests**: Wenn der erste Provider-Test auf eine vorübergehende Trennung stößt, greift Notemd nun auf die stabile Wiederholungssequenz zurück, bevor es fehlschlägt. Dies deckt OpenAI-kompatible, Anthropic, Google, Azure OpenAI und Ollama Transporte ab.
- **Laufzeitumgebungs-Transport-Fallback**: Wenn eine lang laufende Provider-Anfrage durch `requestUrl` mit vorübergehenden Netzwerkfehlern wie `ERR_CONNECTION_CLOSED` unterbrochen wird, versucht Notemd nun denselben Versuch über einen umgebungsspezifischen Fallback-Transport erneut, bevor die konfigurierte Wiederholungsschleife beginnt: Desktop-Builds verwenden Node `http/https`, während Nicht-Desktop-Umgebungen das Browser-`fetch` verwenden. Dies reduziert Fehlalarme bei langsamen Gateways und Reverse-Proxies.
- **Verstärkung der stabilen OpenAI-kompatiblen Langzeit-Anfragekette**: Im stabilen Modus verwenden OpenAI-kompatible Aufrufe nun eine explizite 3-Stufen-Reihenfolge für jeden Versuch: primärer direkter Streaming-Transport, dann direkter Nicht-Streaming-Transport, dann `requestUrl` Fallback (der bei Bedarf immer noch auf Streaming-Parsing hochgestuft werden kann). Dies reduziert falsch-negative Ergebnisse, bei denen Provider gepufferte Antworten abschließen, aber Streaming-Pipelines instabil sind.
- **Protokollsensitiver Streaming-Fallback über alle LLM-APIs**: Langzeit-Fallback-Versuche werden nun auf ein protokollsensitives Streaming-Parsing für jeden integrierten LLM-Pfad hochgestuft, nicht nur für OpenAI-kompatible Endpunkte. Notemd verarbeitet nun OpenAI/Azure-Stil SSE, Anthropic Messages Streaming, Google Gemini SSE Antworten und Ollama NDJSON Streams sowohl auf Desktop `http/https` als auch auf Nicht-Desktop `fetch`. Verbleibende direkte OpenAI-Stil Provider-Einstiegspunkte nutzen denselben gemeinsamen Fallback-Pfad.
- **China-Ready Presets**: Integrierte Voreinstellungen decken nun `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` und `SiliconFlow` zusätzlich zu den bestehenden globalen und lokalen Anbietern ab.
- **Zuverlässige Batch-Verarbeitung**: Verbesserte Logik für gleichzeitige Verarbeitung mit **gestaffelten API-Aufrufen**, um Ratenbegrenzungsfehler zu vermeiden und eine stabile Leistung bei großen Batch-Aufträgen zu gewährleisten. Die neue Implementierung stellt sicher, dass Aufgaben in unterschiedlichen Intervallen gestartet werden, anstatt alle gleichzeitig.
- **Genaue Fortschrittsberichte**: Ein Fehler wurde behoben, bei dem der Fortschrittsbalken hängen bleiben konnte, sodass die Benutzeroberfläche immer den tatsächlichen Status der Operation widerspiegelt.
- **Robuste parallele Batch-Verarbeitung**: Ein Problem wurde gelöst, bei dem parallele Batch-Operationen vorzeitig stoppten, um sicherzustellen, dass alle Dateien zuverlässig und effizient verarbeitet werden.
- **Präzision des Fortschrittsbalkens**: Ein Fehler wurde behoben, bei dem der Fortschrittsbalken für den Befehl "Wiki-Link erstellen & Notiz generieren" bei 95 % stehen blieb. Er zeigt nun korrekt 100 % bei Abschluss an.
- **Verbessertes API-Debugging**: Der "API-Fehler-Debugging-Modus" erfasst nun vollständige Antwortkörper von LLM-Anbietern und Suchdiensten (Tavily/DuckDuckGo) und protokolliert zudem eine Transport-Zeitachse pro Versuch mit bereinigten Anfrage-URLs, verstrichener Dauer, Antwort-Headern, teilweisen Antwortkörpern, geparstem teilweisen Stream-Inhalt und Stack-Traces für eine bessere Fehlerbehebung bei OpenAI, Anthropic, Google, Azure OpenAI und Ollama Fallbacks.
- **Entwicklermodus-Panel**: Die Einstellungen enthalten nun ein dediziertes Diagnose-Panel nur für Entwickler, das verborgen bleibt, sofern der "Entwicklermodus" nicht aktiviert ist. Es unterstützt die Auswahl von Diagnose-Aufrufpfaden und die Durchführung wiederholter Stabilitätstests für den gewählten Modus.
- **Neu gestaltete Seitenleiste**: Integrierte Aktionen sind in fokussierte Abschnitte mit klareren Beschriftungen, Live-Status, abbrechbarem Fortschritt und kopierbaren Protokollen gruppiert, um Unordnung zu reduzieren. Die Fußzeile für Fortschritt/Protokoll bleibt nun auch dann sichtbar, wenn jeder Abschnitt erweitert ist, und der Bereitschaftszustand verwendet einen klareren Warte-Fortschrittspfad.
- **Feinschliff der Seitenleisten-Interaktion und Lesbarkeit**: Schaltflächen in der Seitenleiste bieten nun ein klareres Hover/Press/Focus-Feedback, und farbige Call-to-Action (CTA) Schaltflächen (einschließlich `One-Click Extract` und `Batch generate from titles`) verwenden einen stärkeren Textkontrast für bessere Lesbarkeit in verschiedenen Themes.
- **CTA-Mapping für Einzeldateien**: Der farbige CTA-Stil ist nun für Einzeldatei-Aktionen reserviert. Batch-/Ordner-Aktionen und gemischte Workflows verwenden einen Nicht-CTA-Stil, um Fehlklicks beim Aktionsumfang zu reduzieren.
- **Benutzerdefinierte Ein-Klick-Workflows**: Verwandeln Sie integrierte Seitenleisten-Utilities in wiederverwendbare benutzerdefinierte Schaltflächen mit benutzerdefinierten Namen und zusammengestellten Aktionsketten. Ein Standard-Workflow `One-Click Extract` ist enthalten.


### Wissensgraph-Verbesserung
- **Automatisches Wiki-Linking**: Identifiziert und fügt `[[wiki-links]]` zu Kernkonzepten in Ihren verarbeiteten Notizen hinzu, basierend auf der LLM-Ausgabe.
- **Erstellung von Konzeptnotizen (Optional & Anpassbar)**: Erstellt automatisch neue Notizen für entdeckte Konzepte in einem angegebenen Vault-Ordner.
- **Anpassbare Ausgabepfade**: Konfigurieren Sie separate relative Pfade in Ihrem Vault zum Speichern verarbeiteter Dateien und neu erstellter Konzeptnotizen.
- **Anpassbare Ausgabe-Dateinamen (Links hinzufügen)**: Überschreiben Sie optional die **Originaldatei** oder verwenden Sie ein benutzerdefiniertes Suffix/Ersetzungsstring anstelle des Standard-`_processed.md`, wenn Sie Dateien für Links verarbeiten.
- **Wahrung der Link-Integrität**: Grundlegende Handhabung zur Aktualisierung von Links, wenn Notizen innerhalb des Vaults umbenannt oder gelöscht werden.
- **Reine Konzept-Extraktion**: Extrahiert Konzepte und erstellt entsprechende Konzeptnotizen, ohne das Originaldokument zu ändern. Dies ist ideal, um eine Wissensdatenbank aus bestehenden Dokumenten aufzubauen, ohne diese zu verändern. Diese Funktion bietet konfigurierbare Optionen zum Erstellen minimaler Konzeptnotizen und zum Hinzufügen von Backlinks.


### Übersetzung

- **KI-gestützte Übersetzung**:
    - Übersetzt Notizinhalte mit dem konfigurierten LLM.
    - **Unterstützung für große Dateien**: Teilt große Dateien automatisch in kleinere Stücke auf, basierend auf der Einstellung `Chunk Word Count`, bevor sie an das LLM gesendet werden. Die übersetzten Stücke werden dann nahtlos wieder zu einem einzigen Dokument zusammengefügt.
    - Unterstützt die Übersetzung zwischen mehreren Sprachen.
    - Anpassbare Zielsprache in den Einstellungen oder in der Benutzeroberfläche.
    - Öffnet den übersetzten Text automatisch rechts neben dem Originaltext zum einfachen Lesen.
- **Batch-Übersetzung**:
    - Übersetzt alle Dateien in einem ausgewählten Ordner.
    - Unterstützt parallele Verarbeitung, wenn "Batch Parallelism" aktiviert ist.
    - Verwendet benutzerdefinierte Prompts für die Übersetzung, falls konfiguriert.
	- Fügt eine Option "Diesen Ordner stapelweise übersetzen" zum Kontextmenü des Datei-Explorers hinzu.
- **Automatische Übersetzung deaktivieren**: Wenn diese Option aktiviert ist, erzwingen Nicht-Übersetzungsaufgaben keine Ausgaben mehr in einer bestimmten Sprache, wodurch der ursprüngliche Sprachkontext erhalten bleibt. Die explizite Aufgabe "Übersetzen" führt die Übersetzung weiterhin wie konfiguriert durch.


### Web-Recherche & Inhaltsgenerierung
- **Web-Recherche & Zusammenfassung**:
    - Führt Web-Suchen über Tavily (API-Schlüssel erforderlich) oder DuckDuckGo (experimentell) durch.
    - **Verbesserte Such-Robustheit**: Die DuckDuckGo-Suche verfügt nun über eine verbesserte Parsing-Logik (DOMParser mit Regex-Fallback), um Layout-Änderungen zu bewältigen und zuverlässige Ergebnisse zu gewährleisten.
    - Fasst Suchergebnisse mit dem konfigurierten LLM zusammen.
    - Die Ausgabesprache der Zusammenfassung kann in den Einstellungen angepasst werden.
    - Fügt Zusammenfassungen an die aktuelle Notiz an.
    - Konfigurierbares Token-Limit für Forschungsinhalte, die an das LLM gesendet werden.
- **Inhaltsgenerierung aus Titel**:
    - Verwendet den Notiztitel, um mit dem LLM initialen Inhalt zu generieren und vorhandenen Inhalt zu ersetzen.
    - **Optionale Recherche**: Konfigurieren Sie, ob eine Web-Recherche (mit dem gewählten Anbieter) durchgeführt werden soll, um Kontext für die Generierung bereitzustellen.
- **Batch-Inhaltsgenerierung aus Titeln**: Generiert Inhalte für alle Notizen in einem ausgewählten Ordner basierend auf deren Titeln (beachtet die optionale Recherche-Einstellung). Erfolgreich verarbeitete Dateien werden in einen **konfigurierbaren Unterordner "erledigt"** (z. B. `[ordnername]_complete` oder ein benutzerdefinierter Name) verschoben, um eine erneute Verarbeitung zu vermeiden.
- **Mermaid Auto-Fix Kopplung**: Wenn der Mermaid Auto-Fix aktiviert ist, reparieren Mermaid-bezogene Workflows nun automatisch generierte Dateien oder Ausgabeordner nach der Verarbeitung. Dies umfasst die Workflows Verarbeiten, Aus Titel generieren, Batch-Generierung aus Titeln, Recherche & Zusammenfassung, Als Mermaid zusammenfassen und Übersetzen.


### Utility-Funktionen
- **Als Mermaid-Diagramm zusammenfassen**:
    - Diese Funktion ermöglicht es Ihnen, den Inhalt einer Notiz in einem Mermaid-Diagramm zusammenzufassen.
    - Die Ausgabesprache des Mermaid-Diagramms kann in den Einstellungen angepasst werden.
    - **Mermaid-Ausgabeordner**: Konfigurieren Sie den Ordner, in dem generierte Mermaid-Diagrammdateien gespeichert werden.
    - **Zusammenfassung in Mermaid-Ausgabe übersetzen**: Übersetzt optional den Inhalt des generierten Mermaid-Diagramms in die konfigurierte Zielsprache.
    
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Einfache Formel-Format-Korrektur**:
    - Korrigiert schnell einzeilige mathematische Formeln, die durch ein einzelnes `$` begrenzt sind, in Standard-Doppel-`$$`-Blöcke.
    - **Einzeldatei**: Verarbeitet die aktuelle Datei über die Schaltfläche in der Seitenleiste oder die Befehlspalette.
    - **Batch-Korrektur**: Verarbeitet alle Dateien in einem ausgewählten Ordner über die Schaltfläche in der Seitenleiste oder die Befehlspalette.

- **Auf Duplikate in aktueller Datei prüfen**: Dieser Befehl hilft, potenzielle doppelte Begriffe in der aktiven Datei zu identifizieren.
- **Duplikaterkennung**: Grundlegende Prüfung auf doppelte Wörter innerhalb des aktuell verarbeiteten Dateiinhalts (Ergebnisse werden in der Konsole protokolliert).
- **Doppelte Konzeptnotizen prüfen & entfernen**: Identifiziert potenzielle doppelte Notizen innerhalb des konfigurierten **Konzeptnotiz-Ordners**, basierend auf exakten Namensübereinstimmungen, Pluralformen, Normalisierung und Einwort-Enthaltensein im Vergleich zu Notizen außerhalb des Ordners. Der Vergleichsumfang (welche Notizen außerhalb des Konzeptordners geprüft werden) kann auf den **gesamten Vault**, **spezifisch eingeschlossene Ordner** oder **alle Ordner außer spezifisch ausgeschlossenen** konfiguriert werden. Präsentiert eine detaillierte Liste mit Gründen und kollidierenden Dateien und bittet vor dem Verschieben der identifizierten Duplikate in den System-Papierkorb um Bestätigung. Zeigt den Fortschritt während der Entfernung an.
- **Batch-Mermaid-Korrektur**: Wendet Mermaid- und LaTeX-Syntaxkorrekturen auf alle Markdown-Dateien in einem vom Benutzer ausgewählten Ordner an.
    - **Workflow-bereit**: Kann als eigenständiges Utility oder als Schritt innerhalb einer benutzerdefinierten Ein-Klick-Workflow-Schaltfläche verwendet werden.
    - **Fehlerbericht**: Erzeugt einen Bericht `mermaid_error_{ordnername}.md`, der Dateien auflistet, die nach der Verarbeitung noch potenzielle Mermaid-Fehler enthalten.
    - **Fehlerhafte Dateien verschieben**: Verschiebt optional Dateien mit erkannten Fehlern in einen angegebenen Ordner zur manuellen Überprüfung.
    - **Intelligente Erkennung**: Prüft Dateien nun intelligent mit `mermaid.parse` auf Syntaxfehler, bevor Korrekturen versucht werden, was Verarbeitungszeit spart und unnötige Bearbeitungen vermeidet.
    - **Sichere Verarbeitung**: Stellt sicher, dass Syntaxkorrekturen ausschließlich auf Mermaid-Codeblöcke angewendet werden, um versehentliche Änderungen an Markdown-Tabellen oder anderen Inhalten zu verhindern. Enthält robuste Schutzmaßnahmen, um Tabellensyntax (z. B. `| :--- |`) vor aggressiven Debug-Korrekturen zu schützen.
    - **Deep-Debug-Modus**: Wenn nach der initialen Korrektur weiterhin Fehler bestehen, wird ein fortgeschrittener Deep-Debug-Modus ausgelöst. Dieser Modus behandelt komplexe Randfälle, darunter:
        - **Kommentar-Integration**: Führt nachgestellte Kommentare (beginnend mit `%`) automatisch in das Kantenlabel zusammen (z. B. wird `A -- Label --> B; % Kommentar` zu `A -- "Label(Kommentar)" --> B;`).
        - **Fehlerhafte Pfeile**: Korrigiert Pfeile, die von Anführungszeichen absorbiert wurden (z. B. wird `A -- "Label -->" B` zu `A -- "Label" --> B`).
        - **Inline-Subgraphen**: Wandelt Inline-Subgraphenlabels in Kantenlabels um.
        - **Korrektur umgekehrter Pfeile**: Korrigiert nicht standardmäßige `X <-- Y` Pfeile in `Y --> X`.
        - **Korrektur von Richtungs-Keywords**: Stellt sicher, dass das Keyword `direction` innerhalb von Subgraphen kleingeschrieben wird (z. B. `Direction TB` -> `direction TB`).
        - **Kommentar-Umwandlung**: Wandelt `//` Kommentare in Kantenlabels um (z. B. `A --> B; // Kommentar` -> `A -- "Kommentar" --> B;`).
        - **Korrektur doppelter Labels**: Vereinfacht wiederholte Klammerlabels (z. B. `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Korrektur ungültiger Pfeile**: Wandelt ungültige Pfeilsyntax `--|>` in Standard-`-->` um.
        - **Robuste Handhabung von Labels & Notizen**: Verbesserte Handhabung von Labels mit Sonderzeichen (wie `/`) und bessere Unterstützung für benutzerdefinierte Notizsyntax (`note for ...`), um sicherzustellen, dass Artefakte wie nachgestellte Klammern sauber entfernt werden.
        - **Erweiterter Korrekturmodus**: Enthält robuste Korrekturen für nicht in Anführungszeichen gesetzte Knotenlabels, die Leerzeichen, Sonderzeichen oder verschachtelte Klammern enthalten (z. B. `Node[Label [Text]]` -> `Node["Label [Text]"]`), was die Kompatibilität mit komplexen Diagrammen wie Sternentwicklungspfaden sicherstellt. Korrigiert zudem fehlerhafte Kantenlabels (z. B. `--["Label["-->` zu `-- "Label" -->`). Wandelt zusätzlich Inline-Kommentare um (`Consensus --> Adaptive; # Ein fortgeschrittener Konsens` zu `Consensus -- "Ein fortgeschrittener Konsens" --> Adaptive`) und korrigiert unvollständige Anführungszeichen am Zeilenende (`;"` am Ende ersetzt durch `"]`).
                        - **Notiz-Umwandlung**: Wandelt `note right/left of` und eigenständige `note :` Kommentare automatisch in Standard-Mermaid-Knotendefinitionen und -Verbindungen um (z. B. wird `note right of A: text` zu `NoteA["Note: text"]`, verbunden mit `A`), was Syntaxfehler verhindert und das Layout verbessert. Unterstützt nun sowohl Pfeil- (`-->`) als auch durchgehende Verbindungen (`---`).
                        - **Erweiterte Notiz-Unterstützung**: Wandelt `note for Node "Inhalt"` und `note of Node "Inhalt"` automatisch in Standard-verbundene Notizknoten um (z. B. `NoteNode[" Inhalt"]`, verbunden mit `Node`), um die Kompatibilität mit benutzererweiterter Syntax zu gewährleisten.
                        - **Verbesserte Notiz-Korrektur**: Benennt Notizen automatisch mit sequenzieller Nummerierung um (z. B. `Note1`, `Note2`), um Alias-Probleme bei mehreren Notizen zu vermeiden.
                        - **Parallelogramm/Form-Korrektur**: Korrigiert fehlerhafte Knotenformen wie `[/["Label["/]` in Standard-`["Label"]`, um die Kompatibilität mit generierten Inhalten sicherzustellen.
                        - **Pipe-Labels standardisieren**: Korrigiert und standardisiert automatisch Kantenlabels, die Pipes enthalten, und stellt sicher, dass sie korrekt in Anführungszeichen gesetzt sind (z. B. wird `-->|Text|` zu `-->|"Text"|` und `-->|Math|^2|` zu `-->|"Math|^2"|`).
        - **Korrektur falsch platzierter Pipes**: Korrigiert falsch platzierte Kantenlabels, die vor dem Pfeil erscheinen (z. B. wird `>|"Label"| A --> B` zu `A -->|"Label"| B`).
                - **Doppel-Labels zusammenführen**: Erkennt und führt komplexe Doppel-Labels an einer einzelnen Kante zusammen (z. B. `A -- Label1 -- Label2 --> B` oder `A -- Label1 -- Label2 --- B`) in ein einzelnes, sauberes Label mit Zeilenumbrüchen (`A -- "Label1<br>Label2" --> B`).
                        - **Korrektur nicht in Anführungszeichen gesetzter Labels**: Setzt Knotenlabels, die potenziell problematische Zeichen enthalten (z. B. Anführungszeichen, Gleichheitszeichen, mathematische Operatoren), aber keine äußeren Anführungszeichen haben, automatisch in Anführungszeichen (z. B. wird `Plot[Plot "A"]` zu `Plot["Plot "A""]`), um Rendering-Fehler zu vermeiden.
                        - **Korrektur von Zwischenknoten**: Teilt Kanten, die eine Zwischenknotendefinition enthalten, in zwei separate Kanten auf (z. B. wird `A -- B[...] --> C` zu `A --> B[...]` und `B[...] --> C`), um eine gültige Mermaid-Syntax zu gewährleisten.
                        - **Korrektur zusammengefügter Labels**: Korrigiert Knotendefinitionen, bei denen die ID mit dem Label zusammengefügt ist (z. B. wird `SubdivideSubdivide...` zu `Subdivide["Subdivide..."]`), selbst wenn Pipe-Labels vorangestellt sind oder die Verdopplung nicht exakt ist, durch Abgleich mit bekannten Knoten-IDs.
                        - **Spezifischen Originaltext extrahieren**:
                            - Definieren Sie eine Liste von Fragen in den Einstellungen.
                            - Extrahiert wörtliche Textsegmente aus der aktiven Notiz, die diese Fragen beantworten.
                            - **Merged Query Modus**: Option zur Verarbeitung aller Fragen in einem einzigen API-Aufruf für mehr Effizienz.
                            - **Übersetzung**: Option zur Aufnahme von Übersetzungen des extrahierten Textes in die Ausgabe.
                            - **Benutzerdefinierte Ausgabe**: Konfigurierbarer Speicherpfad und Dateinamen-Suffix für die extrahierte Textdatei.
- **LLM-Verbindungstest**: Überprüft die API-Einstellungen für den aktiven Anbieter.


## Installation

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Über den Obsidian Marketplace (Empfohlen)
1. Öffnen Sie Obsidian **Einstellungen** → **Community-Plugins**.
2. Stellen Sie sicher, dass der "Eingeschränkte Modus" **deaktiviert** ist.
3. Klicken Sie auf **Durchsuchen** und suchen Sie nach "Notemd".
4. Klicken Sie auf **Installieren**.
5. Klicken Sie nach der Installation auf **Aktivieren**.

### Manuelle Installation
1. Laden Sie die neuesten Release-Assets von der [GitHub-Release-Seite](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) herunter. Jedes Release enthält auch eine `README.md` als Referenz, aber für die manuelle Installation werden nur `main.js`, `styles.css` und `manifest.json` benötigt.
2. Navigieren Sie zum Konfigurationsordner Ihres Obsidian-Vaults: `<IhrVault>/.obsidian/plugins/`.
3. Erstellen Sie einen neuen Ordner namens `notemd`.
4. Kopieren Sie `main.js`, `styles.css` und `manifest.json` in den Ordner `notemd`.
5. Starten Sie Obsidian neu.
6. Gehen Sie zu **Einstellungen** → **Community-Plugins** und aktivieren Sie "Notemd".

## Konfiguration

Rufen Sie die Plugin-Einstellungen auf über:
**Einstellungen** → **Community-Plugins** → **Notemd** (Klicken Sie auf das Zahnrad-Symbol).

### Konfiguration des LLM-Anbieters
1.  **Aktiver Anbieter**: Wählen Sie den LLM-Anbieter, den Sie verwenden möchten, aus dem Dropdown-Menü.
2.  **Anbieter-Einstellungen**: Konfigurieren Sie die spezifischen Einstellungen für den ausgewählten Anbieter:
    *   **API-Schlüssel**: Erforderlich für die meisten Cloud-Anbieter (z. B. OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Für Ollama nicht erforderlich. Optional für LM Studio und das generische Preset `OpenAI Compatible`, wenn Ihr Endpunkt anonymen Zugriff oder Platzhalter-Schlüssel akzeptiert.
    *   **Basis-URL / Endpunkt**: Der API-Endpunkt für den Dienst. Standardwerte sind vorgegeben, müssen jedoch möglicherweise für lokale Modelle (LMStudio, Ollama), Gateways (OpenRouter, Requesty, OpenAI Compatible) oder spezifische Azure-Bereitstellungen geändert werden. **Erforderlich für Azure OpenAI.**
    *   **Modell**: Der Name/ID des spezifischen zu verwendenden Modells (z. B. `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Stellen Sie sicher, dass das Modell bei Ihrem Endpunkt/Anbieter verfügbar ist.
    *   **Temperatur**: Steuert die Zufälligkeit der LLM-Ausgabe (0=deterministisch, 1=maximale Kreativität). Niedrige Werte (z. B. 0,2–0,5) sind meist besser für strukturierte Aufgaben.
    *   **API-Version (Nur Azure)**: Erforderlich für Azure OpenAI-Bereitstellungen (z. B. `2024-02-15-preview`).
3.  **Verbindung testen**: Verwenden Sie die Schaltfläche "Verbindung testen" für den aktiven Anbieter, um Ihre Einstellungen zu überprüfen. OpenAI-kompatible Anbieter verwenden nun providerspezifische Prüfungen: Endpunkte wie `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` und `OpenAI Compatible` testen `chat/completions` direkt, während Anbieter mit verlässlichem `/models`-Endpunkt eventuell zuerst die Modellliste abrufen. Wenn der erste Test an einer vorübergehenden Netzwerktrennung wie `ERR_CONNECTION_CLOSED` scheitert, greift Notemd automatisch auf die stabile Wiederholungssequenz zurück, anstatt sofort abzubrechen.
4.  **Anbieter-Konfigurationen verwalten**: Verwenden Sie die Schaltflächen "Anbieter exportieren" und "Anbieter importieren", um Ihre LLM-Anbieter-Einstellungen in einer Datei `notemd-providers.json` im Plugin-Konfigurationsverzeichnis zu speichern bzw. von dort zu laden. Dies ermöglicht einfaches Backup und Teilen.
5.  **Preset-Abdeckung**: Neben den ursprünglichen Anbietern enthält Notemd nun vordefinierte Einträge für `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` und ein generisches Ziel `OpenAI Compatible` für LiteLLM, vLLM, Perplexity, Vercel AI Gateway oder benutzerdefinierte Proxies.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-Modell-Konfiguration
-   **Verschiedene Anbieter für Aufgaben verwenden**:
    *   **Deaktiviert (Standard)**: Verwendet den einzelnen oben ausgewählten "Aktiven Anbieter" für alle Aufgaben.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen spezifischen Anbieter auszuwählen *und* optional den Modellnamen für jede Aufgabe zu überschreiben ("Links hinzufügen", "Recherche & Zusammenfassung", "Aus Titel generieren", "Übersetzen", "Konzepte extrahieren"). Wenn das Modell-Überschreibungsfeld für eine Aufgabe leer bleibt, wird das für den ausgewählten Anbieter dieser Aufgabe konfigurierte Standardmodell verwendet.
-   **Verschiedene Sprachen für verschiedene Aufgaben wählen**:
    *   **Deaktiviert (Standard)**: Verwendet die einzelne "Ausgabesprache" für alle Aufgaben.
    *   **Aktiviert**: Ermöglicht es Ihnen, eine spezifische Sprache für jede Aufgabe auszuwählen ("Links hinzufügen", "Recherche & Zusammenfassung", "Aus Titel generieren", "Als Mermaid-Diagramm zusammenfassen", "Konzepte extrahieren").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Spracharchitektur (UI-Sprache vs. Aufgaben-Ausgabesprache)

-   **UI-Sprache** steuert ausschließlich den Text der Plugin-Oberfläche (Einstellungsbeschriftungen, Schaltflächen in der Seitenleiste, Hinweise und Dialoge). Der Standardmodus `auto` folgt der aktuellen UI-Sprache von Obsidian.
-   Regionale und Schriftvarianten werden nun dem nächstliegenden veröffentlichten Katalog zugeordnet, statt direkt auf Englisch zurückzufallen. Zum Beispiel verwendet `fr-CA` Französisch, `es-419` Spanisch, `pt-PT` Portugiesisch, `zh-Hans` vereinfachtes Chinesisch und `zh-Hant-HK` traditionelles Chinesisch.
-   **Aufgaben-Ausgabesprache** steuert die vom Modell generierte Aufgabenausgabe (Links, Zusammenfassungen, Titelgenerierung, Mermaid-Zusammenfassung, Konzepteextraktion, Übersetzungsziel).
-   **Der Modus "Sprache pro Aufgabe"** ermöglicht es jeder Aufgabe, ihre eigene Ausgabesprache über eine einheitliche Richtlinienschicht aufzulösen, anstatt über verstreute Überschreibungen pro Modul.
-   **Automatische Übersetzung deaktivieren** hält Nicht-Übersetzungsaufgaben im ursprünglichen Sprachkontext, während explizite Übersetzungsaufgaben weiterhin die konfigurierte Zielsprache anwenden.
-   Mermaid-bezogene Generierungspfade folgen derselben Sprachrichtlinie und können bei Aktivierung weiterhin den Mermaid Auto-Fix auslösen.

### Einstellungen für stabile API-Aufrufe
-   **Stabile API-Aufrufe aktivieren (Retry-Logik)**:
    *   **Deaktiviert (Standard)**: Der Fehler eines einzelnen API-Aufrufs stoppt die aktuelle Aufgabe.
    *   **Aktiviert**: Wiederholt automatisch fehlgeschlagene LLM-API-Aufrufe (nützlich bei zeitweiligen Netzwerkproblemen oder Ratenbegrenzungen).
    *   **Verbindungstest-Fallback**: Selbst wenn normale Aufrufe nicht bereits im stabilen Modus ausgeführt werden, wechseln Provider-Verbindungstests nun nach dem ersten vorübergehenden Netzwerkfehler auf dieselbe Wiederholungssequenz.
    *   **Laufzeit-Transport-Fallback (Umgebungsbewusst)**: Lang laufende Aufgabenanfragen, die vorübergehend durch `requestUrl` unterbrochen werden, versuchen nun denselben Versuch zuerst über einen umgebungsbewussten Fallback erneut. Desktop-Versionen verwenden Node `http/https`; Nicht-Desktop-Umgebungen verwenden das Browser-`fetch`. Diese Fallback-Versuche nutzen nun protokollsensitives Streaming-Parsing über integrierte LLM-Pfade, was OpenAI-kompatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE und Ollama NDJSON-Ausgabe abdeckt, sodass langsame Gateways Body-Chunks früher zurückgeben können. Verbleibende direkte OpenAI-Stil Provider-Einstiegspunkte nutzen denselben gemeinsamen Fallback-Pfad.
    *   **Stabile OpenAI-kompatible Reihenfolge**: Im stabilen Modus folgt jeder OpenAI-kompatible Versuch nun der Reihenfolge: `direktes Streaming -> direkt ohne Stream -> requestUrl (mit Streaming-Fallback bei Bedarf)`, bevor er als fehlgeschlagener Versuch gezählt wird. Dies verhindert übermäßig aggressive Fehler, wenn nur ein Transportmodus instabil ist.
-   **Wiederholungsintervall (Sekunden)**: (Nur sichtbar, wenn aktiviert) Wartezeit zwischen Wiederholungsversuchen (1–300 Sekunden). Standard: 5.
-   **Maximale Wiederholungen**: (Nur sichtbar, wenn aktiviert) Maximale Anzahl der Wiederholungsversuche (0–10). Standard: 3.
-   **API-Fehler-Debugging-Modus**:
    *   **Deaktiviert (Standard)**: Verwendet standardmäßige, prägnante Fehlerberichte.
    *   **Aktiviert**: Aktiviert die detaillierte Fehlerprotokollierung (ähnlich der verbeusen Ausgabe von DeepSeek) für alle Anbieter und Aufgaben (einschließlich Übersetzung, Suche und Verbindungstests). Dies umfasst HTTP-Statuscodes, rohen Antworttext, Anfrage-Transport-Zeitachsen, bereinigte Anfrage-URLs und -Header, verstrichene Versuchsdauern, Antwort-Header, teilweise Antwortkörper, geparste teilweise Stream-Ausgabe und Stack-Traces, was für die Lösung von API-Verbindungsproblemen und Upstream-Gateway-Resets entscheidend ist.
-   **Entwicklermodus**:
    *   **Deaktiviert (Standard)**: Verbirgt alle Diagnose-Steuerelemente nur für Entwickler vor normalen Benutzern.
    *   **Aktiviert**: Zeigt ein dediziertes Diagnose-Panel für Entwickler in den Einstellungen an.
-   **Provider-Diagnose für Entwickler (Langzeit-Anfrage)**:
    *   **Diagnose-Aufrufmodus**: Wählen Sie den Laufzeitpfad pro Sonde. OpenAI-kompatible Anbieter unterstützen zusätzlich zu den Laufzeitmodi erzwungene Modi (`direktes Streaming`, `direkt gepuffert`, `nur requestUrl`).
    *   **Diagnose ausführen**: Führt eine Langzeit-Anfrage-Sonde mit dem gewählten Aufrufmodus aus und schreibt `Notemd_Provider_Diagnostic_*.txt` in das Root-Verzeichnis des Vaults.
    *   **Stabilitätstest ausführen**: Wiederholt die Sonde für konfigurierbare Durchläufe (1–10) unter Verwendung des gewählten Aufrufmodus und speichert einen aggregierten Stabilitätsbericht.
    *   **Diagnose-Timeout**: Konfigurierbares Timeout pro Durchlauf (15–3600 Sekunden).
    *   **Warum es verwendet wird**: Schneller als manuelle Reproduktion, wenn ein Anbieter "Verbindung testen" besteht, aber bei echten lang laufenden Aufgaben (z. B. Übersetzung bei langsamen Gateways) fehlschlägt.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Allgemeine Einstellungen

#### Ausgabe verarbeiteter Dateien
-   **Speicherpfad für verarbeitete Dateien anpassen**:
    *   **Deaktiviert (Standard)**: Verarbeitete Dateien (z. B. `IhreNotiz_processed.md`) werden im *gleichen Ordner* wie die Originalnotiz gespeichert.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen benutzerdefinierten Speicherort anzugeben.
-   **Ordnerpfad für verarbeitete Dateien**: (Nur sichtbar, wenn oben aktiviert) Geben Sie einen *relativen Pfad* innerhalb Ihres Vaults an (z. B. `Verarbeitete Notizen` oder `Ausgabe/LLM`), in dem verarbeitete Dateien gespeichert werden sollen. Ordner werden erstellt, falls sie nicht existieren. **Verwenden Sie keine absoluten Pfade (wie C:\...) oder ungültige Zeichen.**
-   **Benutzerdefinierten Ausgabedateiname für 'Links hinzufügen' verwenden**:
    *   **Deaktiviert (Standard)**: Verarbeitete Dateien, die durch den Befehl 'Links hinzufügen' erstellt werden, verwenden das Standard-Suffix `_processed.md` (z. B. `IhreNotiz_processed.md`).
    *   **Aktiviert**: Ermöglicht es Ihnen, den Namen der Ausgabedatei mit der untenstehenden Einstellung anzupassen.
-   **Benutzerdefiniertes Suffix / Ersetzungsstring**: (Nur sichtbar, wenn oben aktiviert) Geben Sie den String an, der für den Namen der Ausgabedatei verwendet werden soll.
    *   Wenn das Feld **leer** bleibt, wird die Originaldatei mit dem verarbeiteten Inhalt **überschrieben**.
    *   Wenn Sie einen String eingeben (z. B. `_verlinkt`), wird dieser an den ursprünglichen Basisnamen angehängt (z. B. `IhreNotiz_verlinkt.md`). Stellen Sie sicher, dass das Suffix keine ungültigen Dateinamenszeichen enthält.

-   **Code-Zäune beim Hinzufügen von Links entfernen**:
    *   **Deaktiviert (Standard)**: Code-Zäune **(\`\\\`\`)** bleiben beim Hinzufügen von Links im Inhalt erhalten, wobei **(\`\\\`markdown)** automatisch gelöscht wird.
    *   **Aktiviert**: Entfernt Code-Zäune vor dem Hinzufügen von Links aus dem Inhalt.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Ausgabe von Konzeptnotizen
-   **Pfad für Konzeptnotizen anpassen**:
    *   **Deaktiviert (Standard)**: Die automatische Erstellung von Notizen für `[[verlinkte Konzepte]]` ist deaktiviert.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen Ordner anzugeben, in dem neue Konzeptnotizen erstellt werden.
-   **Ordnerpfad für Konzeptnotizen**: (Nur sichtbar, wenn oben aktiviert) Geben Sie einen *relativen Pfad* innerhalb Ihres Vaults an (z. B. `Konzepte` oder `Generiert/Themen`), in dem neue Konzeptnotizen gespeichert werden sollen. Ordner werden erstellt, falls sie nicht existieren. **Muss ausgefüllt werden, wenn die Anpassung aktiviert ist.** **Verwenden Sie keine absoluten Pfade oder ungültigen Zeichen.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Ausgabe der Konzept-Logdatei
-   **Konzept-Logdatei generieren**:
    *   **Deaktiviert (Standard)**: Es wird keine Logdatei generiert.
    *   **Aktiviert**: Erstellt nach der Verarbeitung eine Logdatei, die die neu erstellten Konzeptnotizen auflistet. Das Format ist:
        ```
        generiere xx Konzepte-MD-Dateien
        1. konzept1
        2. konzept2
        ...
        n. konzeptn
        ```
-   **Speicherpfad für Logdatei anpassen**: (Nur sichtbar, wenn "Konzept-Logdatei generieren" aktiviert ist)
    *   **Deaktiviert (Standard)**: Die Logdatei wird im **Ordnerpfad für Konzeptnotizen** (falls angegeben) oder andernfalls im Vault-Root gespeichert.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen benutzerdefinierten Ordner für die Logdatei anzugeben.
-   **Ordnerpfad für Konzept-Logs**: (Nur sichtbar, wenn oben aktiviert) Geben Sie einen *relativen Pfad* innerhalb Ihres Vaults an (z. B. `Logs/Notemd`), in dem die Logdatei gespeichert werden soll. **Muss ausgefüllt werden, wenn die Anpassung aktiviert ist.**
-   **Name der Logdatei anpassen**: (Nur sichtbar, wenn "Konzept-Logdatei generieren" aktiviert ist)
    *   **Deaktiviert (Standard)**: Die Logdatei heißt `Generate.log`.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen benutzerdefinierten Namen für die Logdatei anzugeben.
-   **Name der Konzept-Logdatei**: (Nur sichtbar, wenn oben aktiviert) Geben Sie den gewünschten Dateinamen an (z. B. `KonzeptErstellung.log`). **Muss ausgefüllt werden, wenn die Anpassung aktiviert ist.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Aufgabe "Konzepte extrahieren"
-   **Minimale Konzeptnotizen erstellen**:
    *   **An (Standard)**: Neu erstellte Konzeptnotizen enthalten nur den Titel (z. B. `# Konzept`).
    *   **Aus**: Konzeptnotizen können zusätzliche Inhalte enthalten, wie einen "Verlinkt von" Backlink, sofern dies nicht durch die untenstehende Einstellung deaktiviert ist.
-   **"Verlinkt von" Backlink hinzufügen**:
    *   **Deaktiviert (Standard)**: Fügt während der Extraktion keinen Backlink zum Quelldokument in der Konzeptnotiz hinzu.
    *   **Aktiviert**: Fügt einen Abschnitt "Verlinkt von" mit einem Backlink zur Quelldatei hinzu.

#### Spezifischen Originaltext extrahieren
-   **Fragen für die Extraktion**: Geben Sie eine Liste von Fragen ein (eine pro Zeile), für die die KI wörtliche Antworten aus Ihren Notizen extrahieren soll.
-   **Ausgabe in entsprechende Sprache übersetzen**:
    *   **Deaktiviert (Standard)**: Gibt nur den extrahierten Text in seiner Originalsprache aus.
    *   **Aktiviert**: Fügt eine Übersetzung des extrahierten Textes in der für diese Aufgabe gewählten Sprache hinzu.
-   **Merged Query Modus**:
    *   **Deaktiviert**: Verarbeitet jede Frage einzeln (höhere Präzision, aber mehr API-Aufrufe).
    *   **Aktiviert**: Sendet alle Fragen in einem einzigen Prompt (schneller und weniger API-Aufrufe).
-   **Speicherpfad und Dateiname für extrahierten Text anpassen**:
    *   **Deaktiviert**: Speichert im gleichen Ordner wie die Originaldatei mit dem Suffix `_Extracted`.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen benutzerdefinierten Ausgabeordner und ein Suffix für den Dateinamen anzugeben.

#### Batch-Mermaid-Korrektur
-   **Mermaid-Fehlererkennung aktivieren**:
    *   **Deaktiviert (Standard)**: Überspringt die Fehlererkennung nach der Verarbeitung.
    *   **Aktiviert**: Scannt verarbeitete Dateien auf verbleibende Mermaid-Syntaxfehler und erzeugt einen Bericht `mermaid_error_{ordnername}.md`.
-   **Dateien mit Mermaid-Fehlern in angegebenen Ordner verschieben**:
    *   **Deaktiviert**: Dateien mit Fehlern bleiben an ihrem Platz.
    *   **Aktiviert**: Verschiebt jede Datei, die nach dem Korrekturversuch noch Mermaid-Syntaxfehler enthält, in einen dedizierten Ordner zur manuellen Überprüfung.
-   **Ordnerpfad für Mermaid-Fehler**: (Sichtbar, wenn oben aktiviert) Der Ordner, in den fehlerhafte Dateien verschoben werden sollen.

#### Verarbeitungsparameter
-   **Batch-Parallelismus aktivieren**:
    *   **Deaktiviert (Standard)**: Batch-Verarbeitungsaufgaben (wie "Ordner verarbeiten" oder "Batch-Generierung aus Titeln") verarbeiten Dateien nacheinander (seriell).
    *   **Aktiviert**: Ermöglicht es dem Plugin, mehrere Dateien gleichzeitig zu verarbeiten, was große Batch-Aufträge erheblich beschleunigen kann.
-   **Batch-Nebenläufigkeit**: (Nur sichtbar, wenn Parallelismus aktiviert ist) Legt die maximale Anzahl der parallel zu verarbeitenden Dateien fest. Höhere Zahlen können schneller sein, verbrauchen aber mehr Ressourcen und können API-Ratenbegrenzungen erreichen. (Standard: 1, Bereich: 1–20)
-   **Batch-Größe**: (Nur sichtbar, wenn Parallelismus aktiviert ist) Die Anzahl der in einem Batch zusammengefassten Dateien. (Standard: 50, Bereich: 10–200)
-   **Verzögerung zwischen Batches (ms)**: (Nur sichtbar, wenn Parallelismus aktiviert ist) Eine optionale Verzögerung in Millisekunden zwischen der Verarbeitung jedes Batches, was bei der Verwaltung von API-Ratenbegrenzungen helfen kann. (Standard: 1000ms)
-   **API-Aufruf-Intervall (ms)**: Minimale Verzögerung in Millisekunden *vor und nach* jedem einzelnen LLM-API-Aufruf. Entscheidend für langsamere APIs oder zur Vermeidung von 429-Fehlern. Auf 0 setzen für keine künstliche Verzögerung. (Standard: 500ms)
-   **Wortanzahl pro Chunk**: Maximale Wortzahl pro an das LLM gesendetem Chunk. Beeinflusst die Anzahl der API-Aufrufe bei großen Dateien. (Standard: 3000)
-   **Duplikaterkennung aktivieren**: Schaltet die grundlegende Prüfung auf doppelte Wörter innerhalb des verarbeiteten Inhalts um (Ergebnisse in der Konsole). (Standard: Aktiviert)
-   **Max Tokens**: Maximale Anzahl an Tokens, die das LLM pro Antwort-Chunk generieren soll. Beeinflusst Kosten und Detailgrad. (Standard: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets%2F74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Übersetzung
-   **Standard-Zielsprache**: Wählen Sie die Standardsprache aus, in die Sie Ihre Notizen übersetzen möchten. Dies kann in der UI beim Ausführen des Übersetzungsbefehls überschrieben werden. (Standard: Englisch)
-   **Speicherpfad für übersetzte Dateien anpassen**:
    *   **Deaktiviert (Standard)**: Übersetzte Dateien werden im *gleichen Ordner* wie die Originalnotiz gespeichert.
    *   **Aktiviert**: Ermöglicht es Ihnen, einen *relativen Pfad* innerhalb Ihres Vaults anzugeben (z. B. `Übersetzungen`), in dem übersetzte Dateien gespeichert werden sollen. Ordner werden erstellt, falls sie nicht existieren.
-   **Benutzerdefiniertes Suffix für übersetzte Dateien verwenden**:
    *   **Deaktiviert (Standard)**: Übersetzte Dateien verwenden das Standard-Suffix `_translated.md` (z. B. `IhreNotiz_translated.md`).
    *   **Aktiviert**: Ermöglicht es Ihnen, ein benutzerdefiniertes Suffix anzugeben.
-   **Benutzerdefiniertes Suffix**: (Nur sichtbar, wenn oben aktiviert) Geben Sie das benutzerdefinierte Suffix an, das an die Namen übersetzter Dateien angehängt werden soll (z. B. `_de` oder `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Inhaltsgenerierung
-   **Forschung in 'Aus Titel generieren' aktivieren**:
    *   **Deaktiviert (Standard)**: 'Aus Titel generieren' verwendet nur den Titel als Eingabe.
    *   **Aktiviert**: Führt eine Web-Recherche mit dem konfigurierten **Web-Recherche-Anbieter** durch und bezieht die Ergebnisse als Kontext für das LLM während der titelbasierten Generierung ein.
-   **Mermaid-Syntaxkorrektur nach Generierung automatisch ausführen**:
    *   **Aktiviert (Standard)**: Führt automatisch einen Mermaid-Syntaxkorrektur-Durchlauf nach Mermaid-bezogenen Workflows wie Verarbeiten, Aus Titel generieren, Batch-Generierung aus Titeln, Recherche & Zusammenfassung, Als Mermaid zusammenfassen und Übersetzen aus.
    *   **Deaktiviert**: Lässt die generierte Mermaid-Ausgabe unverändert, es sei denn, Sie führen die `Batch-Mermaid-Korrektur` manuell aus oder fügen sie einem benutzerdefinierten Workflow hinzu.
-   **Ausgabesprache**: (Neu) Wählen Sie die gewünschte Ausgabesprache für die Aufgaben "Aus Titel generieren" und "Batch-Generierung aus Titeln".
    *   **Englisch (Standard)**: Prompts werden in Englisch verarbeitet und ausgegeben.
    *   **Andere Sprachen**: Weist das LLM an, seine Überlegungen in Englisch anzustellen, aber die endgültige Dokumentation in der Sprache Ihrer Wahl bereitzustellen (z. B. Spanisch, Französisch, Vereinfachtes Chinesisch, Traditionelles Chinesisch, Arabisch, Hindi usw.).
-   **Prompt-Wort ändern**: (Neu)
    *   **Prompt-Wort ändern**: Ermöglicht es Ihnen, das Prompt-Wort für eine spezifische Aufgabe zu ändern.
    *   **Benutzerdefiniertes Prompt-Wort**: Geben Sie Ihr benutzerdefiniertes Prompt-Wort für die Aufgabe ein.
-   **Benutzerdefinierten Ausgabeordner für 'Aus Titel generieren' verwenden**:
    *   **Deaktiviert (Standard)**: Erfolgreich generierte Dateien werden in einen Unterordner namens `[OriginalOrdnerName]_complete` relativ zum Elternverzeichnis des Originalordners verschoben (oder `Vault_complete`, wenn der Originalordner das Root war).
    *   **Aktiviert**: Ermöglicht es Ihnen, einen benutzerdefinierten Namen für den Unterordner anzugeben, in den fertige Dateien verschoben werden.
-   **Name des benutzerdefinierten Ausgabeordners**: (Nur sichtbar, wenn oben aktiviert) Geben Sie den gewünschten Namen für den Unterordner an (z. B. `Generierter Inhalt`, `_complete`). Ungültige Zeichen sind nicht zulässig. Standardmäßig `_complete`, wenn leer gelassen. Dieser Ordner wird relativ zum übergeordneten Verzeichnis des Originalordners erstellt.

#### Ein-Klick-Workflow-Schaltflächen
-   **Visueller Workflow-Builder**: Erstellen Sie benutzerdefinierte Workflow-Schaltflächen aus integrierten Aktionen, ohne die DSL manuell schreiben zu müssen.
-   **Custom Workflow Button DSL**: Fortgeschrittene Benutzer können den Text der Workflow-Definition weiterhin direkt bearbeiten. Eine ungültige DSL greift sicher auf den Standard-Workflow zurück und zeigt eine Warnung in der Seitenleiste/Einstellungsoberfläche an.
-   **Workflow-Fehlerstrategie**:
    *   **Bei Fehler stoppen (Standard)**: Stoppt den Workflow sofort, wenn ein Schritt fehlschlägt.
    *   **Bei Fehler fortfahren**: Fährt mit der Ausführung nachfolgender Schritte fort und berichtet am Ende die Anzahl der fehlgeschlagenen Aktionen.
-   **Integrierter Standard-Workflow**: `One-Click Extract` verketten `Datei verarbeiten (Links hinzufügen)`, `Batch-Generierung aus Titeln` und `Batch-Mermaid-Korrektur`.

#### Einstellungen für benutzerdefinierte Prompts
Diese Funktion ermöglicht es Ihnen, die Standardanweisungen (Prompts), die für spezifische Aufgaben an das LLM gesendet werden, zu überschreiben und so die Ausgabe präzise zu steuern.

-   **Benutzerdefinierte Prompts für spezifische Aufgaben aktivieren**:
    *   **Deaktiviert (Standard)**: Das Plugin verwendet seine integrierten Standard-Prompts für alle Operationen.
    *   **Aktiviert**: Aktiviert die Fähigkeit, benutzerdefinierte Prompts für die unten aufgeführten Aufgaben festzulegen. Dies ist der Hauptschalter für diese Funktion.

-   **Benutzerdefinierten Prompt für [Aufgabenname] verwenden**: (Nur sichtbar, wenn oben aktiviert)
    *   Für jede unterstützte Aufgabe ("Links hinzufügen", "Aus Titel generieren", "Recherche & Zusammenfassung", "Konzepte extrahieren") können Sie Ihren benutzerdefinierten Prompt einzeln aktivieren oder deaktivieren.
    *   **Deaktiviert**: Diese spezifische Aufgabe verwendet den Standard-Prompt.
    *   **Aktiviert**: Diese Aufgabe verwendet den Text, den Sie im entsprechenden Textbereich "Benutzerdefinierter Prompt" unten angeben.

-   **Textbereich für benutzerdefinierten Prompt**: (Nur sichtbar, wenn der benutzerdefinierte Prompt einer Aufgabe aktiviert ist)
    *   **Anzeige des Standard-Prompts**: Zu Ihrer Referenz zeigt das Plugin den Standard-Prompt an, den es normalerweise für die Aufgabe verwenden würde. Sie können die Schaltfläche **"Standard-Prompt kopieren"** verwenden, um diesen Text als Ausgangspunkt für Ihren eigenen benutzerdefinierten Prompt zu kopieren.
    *   **Eingabe des benutzerdefinierten Prompts**: Hier schreiben Sie Ihre eigenen Anweisungen für das LLM.
    *   **Platzhalter**: Sie können (und sollten) spezielle Platzhalter in Ihrem Prompt verwenden, die das Plugin vor dem Senden der Anfrage an das LLM durch den tatsächlichen Inhalt ersetzt. Schauen Sie im Standard-Prompt nach, welche Platzhalter für jede Aufgabe verfügbar sind. Gängige Platzhalter sind:
        *   `{TITLE}`: Der Titel der aktuellen Notiz.
        *   `{RESEARCH_CONTEXT_SECTION}`: Der aus der Web-Recherche gesammelte Inhalt.
        *   `{USER_PROMPT}`: Der Inhalt der zu verarbeitenden Notiz.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Umfang der Duplikatsprüfung
-   **Umfangsmodus der Duplikatsprüfung**: Steuert, welche Dateien mit den Notizen in Ihrem Konzeptnotiz-Ordner verglichen werden, um potenzielle Duplikate zu finden.
    *   **Gesamter Vault (Standard)**: Vergleicht Konzeptnotizen mit allen anderen Notizen im Vault (außer dem Konzeptnotiz-Ordner selbst).
    *   **Nur spezifische Ordner einschließen**: Vergleicht Konzeptnotizen nur mit Notizen innerhalb der unten aufgeführten Ordner.
    *   **Spezifische Ordner ausschließen**: Vergleicht Konzeptnotizen mit allen Notizen *außer* denen innerhalb der unten aufgeführten Ordner (und schließt auch den Konzeptnotiz-Ordner aus).
    *   **Nur Konzeptordner**: Vergleicht Konzeptnotizen nur mit *anderen Notizen innerhalb des Konzeptnotiz-Ordners*. Dies hilft, Duplikate rein innerhalb Ihrer generierten Konzepte zu finden.
-   **Ordner einschließen/ausschließen**: (Nur sichtbar, wenn der Modus 'Einschließen' oder 'Ausschließen' ist) Geben Sie die *relativen Pfade* der Ordner ein, die Sie einschließen oder ausschließen möchten, **einen Pfad pro Zeile**. Pfade beachten Groß-/Kleinschreibung und verwenden `/` als Trennzeichen (z. B. `Referenzmaterial/Fachartikel` oder `Tagesnotizen`). Diese Ordner dürfen nicht identisch mit dem Konzeptnotiz-Ordner sein oder darin liegen.

#### Web-Recherche-Anbieter
-   **Suchanbieter**: Wählen Sie zwischen `Tavily` (API-Schlüssel erforderlich, empfohlen) und `DuckDuckGo` (experimentell, wird oft von der Suchmaschine für automatisierte Anfragen blockiert). Wird für "Thema recherchieren & zusammenfassen" und optional für "Aus Titel generieren" verwendet.
-   **Tavily API-Schlüssel**: (Nur sichtbar, wenn Tavily ausgewählt ist) Geben Sie Ihren API-Schlüssel von [tavily.com](https://tavily.com/) ein.
-   **Maximale Tavily-Ergebnisse**: (Nur sichtbar, wenn Tavily ausgewählt ist) Maximale Anzahl der Suchergebnisse, die Tavily zurückgeben soll (1–20). Standard: 5.
-   **Tavily-Suchtiefe**: (Nur sichtbar, wenn Tavily ausgewählt ist) Wählen Sie zwischen `basic` (Standard) oder `advanced`. Hinweis: `advanced` liefert bessere Ergebnisse, kostet aber 2 API-Credits pro Suche anstelle von 1.
-   **Maximale DuckDuckGo-Ergebnisse**: (Nur sichtbar, wenn DuckDuckGo ausgewählt ist) Maximale Anzahl der zu parsende Suchergebnisse (1–10). Standard: 5.
-   **DuckDuckGo Content Fetch Timeout**: (Nur sichtbar, wenn DuckDuckGo ausgewählt ist) Maximale Anzahl an Sekunden, die beim Versuch gewartet werden soll, Inhalt von jeder DuckDuckGo-Ergebnis-URL abzurufen. Standard: 15.
-   **Max Research Content Tokens**: Ungefähre maximale Anzahl an Tokens der kombinierten Web-Recherche-Ergebnisse (Snippets/abgeholter Inhalt), die in den Zusammenfassungs-Prompt aufgenommen werden sollen. Hilft bei der Verwaltung der Kontextfenster-Größe und der Kosten. (Standard: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Fokussierter Lernbereich
-   **Fokussierten Lernbereich aktivieren**:
    *   **Deaktiviert (Standard)**: Prompts, die an das LLM gesendet werden, verwenden die standardmäßigen allgemeinen Anweisungen.
    *   **Aktiviert**: Ermöglicht es Ihnen, ein oder mehrere Studiengebiete anzugeben, um das Kontextverständnis des LLMs zu verbessern.
-   **Lernbereich**: (Nur sichtbar, wenn oben aktiviert) Geben Sie Ihr(e) spezifischen Fachgebiete ein, z. B. 'Materialwissenschaft', 'Polymerphysik', 'Maschinelles Lernen'. Dies fügt am Anfang der Prompts eine Zeile "Relevante Gebiete: [...]" hinzu, die dem LLM hilft, genauere und relevantere Links und Inhalte für Ihr spezifisches Studiengebiet zu generieren.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Benutzerhandbuch

### Schnelle Workflows & Seitenleiste

-   Öffnen Sie die Notemd-Seitenleiste, um auf gruppierte Aktionsbereiche für Kernverarbeitung, Generierung, Übersetzung, Wissen und Utilities zuzugreifen.
-   Verwenden Sie den Bereich **Schnelle Workflows** oben in der Seitenleiste, um benutzerdefinierte mehrstufige Schaltflächen zu starten.
-   Der Standard-Workflow **One-Click Extract** führt `Datei verarbeiten (Links hinzufügen)` -> `Batch-Generierung aus Titeln` -> `Batch-Mermaid-Korrektur` aus.
-   Der Workflow-Fortschritt, Protokolle pro Schritt und Fehler werden in der Seitenleiste angezeigt, wobei eine fixierte Fußzeile verhindert, dass der Fortschrittsbalken und der Protokollbereich durch erweiterte Abschnitte verdrängt werden.
-   Die Fortschrittskarte hält den Statustext, eine dedizierte Prozentanzeige und die verbleibende Zeit auf einen Blick lesbar. Dieselben benutzerdefinierten Workflows können in den Einstellungen neu konfiguriert werden.

### Ursprüngliche Verarbeitung (Wiki-Links hinzufügen)
Dies ist die Kernfunktionalität, die darauf fokussiert ist, Konzepte zu identifizieren und `[[wiki-links]]` hinzuzufügen.

**Wichtig:** Dieser Prozess funktioniert nur bei `.md` oder `.txt` Dateien. Sie können PDF-Dateien kostenlos mit [Mineru](https://github.com/opendatalab/MinerU) in MD-Dateien konvertieren, bevor Sie sie weiter verarbeiten.

1.  **Über die Seitenleiste**:
    *   Öffnen Sie die Notemd-Seitenleiste (Zauberstab-Symbol oder Befehlspalette).
    *   Öffnen Sie die `.md` oder `.txt` Datei.
    *   Klicken Sie auf **"Datei verarbeiten (Links hinzufügen)"**.
    *   Um einen Ordner zu verarbeiten: Klicken Sie auf **"Ordner verarbeiten (Links hinzufügen)"**, wählen Sie den Ordner aus und klicken Sie auf "Verarbeiten".
    *   Der Fortschritt wird in der Seitenleiste angezeigt. Sie können die Aufgabe über die Schaltfläche "Verarbeitung abbrechen" in der Seitenleiste beenden.
    *   *Hinweis zur Ordnerverarbeitung:* Dateien werden im Hintergrund verarbeitet, ohne im Editor geöffnet zu werden.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Über die Befehlspalette** (`Strg+P` oder `Cmd+P`):
    *   **Einzeldatei**: Öffnen Sie die Datei und führen Sie `Notemd: Process Current File` aus.
    *   **Ordner**: Führen Sie `Notemd: Process Folder` aus und wählen Sie dann den Ordner. Dateien werden im Hintergrund verarbeitet, ohne im Editor geöffnet zu werden.
    *   Ein Fortschritts-Modal erscheint für Befehlspaletten-Aktionen, inklusive einer Abbrechen-Schaltfläche.
    *   *Hinweis:* Das Plugin entfernt automatisch führende `\boxed{` und schließende `}` Zeilen, falls diese im finalen verarbeiteten Inhalt vor dem Speichern gefunden werden.

### Neue Funktionen

1.  **Als Mermaid-Diagramm zusammenfassen**:
    *   Öffnen Sie die Notiz, die Sie zusammenfassen möchten.
    *   Führen Sie den Befehl `Notemd: Summarise as Mermaid diagram` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Das Plugin generiert eine neue Notiz mit dem Mermaid-Diagramm.

2.  **Notiz/Auswahl übersetzen**:
    *   Wählen Sie Text in einer Notiz aus, um nur diese Auswahl zu übersetzen, oder rufen Sie den Befehl ohne Auswahl auf, um die gesamte Notiz zu übersetzen.
    *   Führen Sie den Befehl `Notemd: Translate Note/Selection` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Ein Modal erscheint, in dem Sie die **Zielsprache** bestätigen oder ändern können (Standard gemäß der Einstellung in der Konfiguration).
    *   Das Plugin verwendet den konfigurierten **LLM-Anbieter** (basierend auf den Multi-Modell-Einstellungen), um die Übersetzung durchzuführen.
    *   Der übersetzte Inhalt wird im konfigurierten **Speicherpfad für Übersetzungen** mit dem entsprechenden Suffix gespeichert und in einem **neuen Panel rechts** neben dem Originalinhalt zum einfachen Vergleich geöffnet.
    *   Sie können diese Aufgabe über die Schaltfläche in der Seitenleiste oder die Abbrechen-Schaltfläche im Modal beenden.
3.  **Batch-Übersetzung**:
    *   Führen Sie den Befehl `Notemd: Batch Translate Folder` über die Befehlspalette aus und wählen Sie einen Ordner, oder klicken Sie mit der rechten Maustaste auf einen Ordner im Datei-Explorer und wählen Sie "Diesen Ordner stapelweise übersetzen".
    *   Das Plugin übersetzt alle Markdown-Dateien im ausgewählten Ordner.
    *   Die übersetzten Dateien werden im konfigurierten Übersetzungspfad gespeichert, aber nicht automatisch geöffnet.
    *   Dieser Prozess kann über das Fortschritts-Modal abgebrochen werden.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Thema recherchieren & zusammenfassen**:
    *   Wählen Sie Text in einer Notiz aus ODER stellen Sie sicher, dass die Notiz einen Titel hat (dieser wird das Suchthema sein).
    *   Führen Sie den Befehl `Notemd: Research and Summarize Topic` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Das Plugin verwendet den konfigurierten **Suchanbieter** (Tavily/DuckDuckGo) und den entsprechenden **LLM-Anbieter** (basierend auf den Multi-Modell-Einstellungen), um Informationen zu finden und zusammenzufassen.
    *   Die Zusammenfassung wird an die aktuelle Notiz angehängt.
    *   Sie können diese Aufgabe über die Schaltfläche in der Seitenleiste oder die Abbrechen-Schaltfläche im Modal beenden.
    *   *Hinweis:* DuckDuckGo-Suchen können aufgrund von Bot-Erkennung fehlschlagen. Tavily wird empfohlen.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Inhalt aus Titel generieren**:
    *   Öffnen Sie eine Notiz (kann leer sein).
    *   Führen Sie den Befehl `Notemd: Generate Content from Title` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Das Plugin verwendet den entsprechenden **LLM-Anbieter** (basierend auf den Multi-Modell-Einstellungen), um basierend auf dem Titel der Notiz Inhalt zu generieren und vorhandenen Inhalt zu ersetzen.
    *   Wenn die Einstellung **"Forschung in 'Aus Titel generieren' aktivieren"** eingeschaltet ist, wird zuerst eine Web-Recherche durchgeführt (mit dem konfigurierten **Web-Recherche-Anbieter**) und dieser Kontext in den an das LLM gesendeten Prompt einbezogen.
    *   Sie können diese Aufgabe über die Schaltfläche in der Seitenleiste oder die Abbrechen-Schaltfläche im Modal beenden.

5.  **Batch-Inhaltsgenerierung aus Titeln**:
    *   Führen Sie den Befehl `Notemd: Batch Generate Content from Titles` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Wählen Sie den Ordner aus, der die zu verarbeitenden Notizen enthält.
    *   Das Plugin geht jede `.md`-Datei im Ordner durch (ausgenommen `_processed.md`-Dateien und Dateien im angegebenen "complete"-Ordner), generiert Inhalt basierend auf dem Titel der Notiz und ersetzt vorhandenen Inhalt. Dateien werden im Hintergrund verarbeitet, ohne im Editor geöffnet zu werden.
    *   Erfolgreich verarbeitete Dateien werden in den konfigurierten "complete"-Ordner verschoben.
    *   Dieser Befehl beachtet die Einstellung **"Forschung in 'Aus Titel generieren' aktivieren"** für jede verarbeitete Notiz.
    *   Sie können diese Aufgabe über die Schaltfläche in der Seitenleiste oder die Abbrechen-Schaltfläche im Modal beenden.
    *   Fortschritt und Ergebnisse (Anzahl modifizierter Dateien, Fehler) werden in der Seitenleiste/im Modal-Log angezeigt.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Doppelte Konzeptnotizen prüfen & entfernen**:
    *   Stellen Sie sicher, dass der **Ordnerpfad für Konzeptnotizen** in den Einstellungen korrekt konfiguriert ist.
    *   Führen Sie `Notemd: Check and Remove Duplicate Concept Notes` aus (über die Befehlspalette oder die Schaltfläche in der Seitenleiste).
    *   Das Plugin scannt den Konzeptnotiz-Ordner und vergleicht Dateinamen mit Notizen außerhalb des Ordners anhand verschiedener Regeln (exakte Übereinstimmung, Pluralformen, Normalisierung, Enthaltensein).
    *   Wenn potenzielle Duplikate gefunden werden, erscheint ein Modal-Fenster, das die Dateien, den Grund für die Markierung und die kollidierenden Dateien auflistet.
    *   Überprüfen Sie die Liste sorgfältig. Klicken Sie auf **"Delete Files"**, um die aufgelisteten Dateien in den System-Papierkorb zu verschieben, oder auf **"Cancel"**, um keine Aktion auszuführen.
    *   Fortschritt und Ergebnisse werden in der Seitenleiste/im Modal-Log angezeigt.

7.  **Konzepte extrahieren (Reiner Modus)**:
    *   Diese Funktion ermöglicht es Ihnen, Konzepte aus einem Dokument zu extrahieren und entsprechende Konzeptnotizen zu erstellen, *ohne* die Originaldatei zu verändern. Es ist perfekt, um Ihre Wissensdatenbank schnell aus einer Reihe von Dokumenten aufzubauen.
    *   **Einzeldatei**: Öffnen Sie eine Datei und führen Sie den Befehl `Notemd: Extract concepts (create concept notes only)` aus der Befehlspalette aus oder klicken Sie auf die Schaltfläche **"Extract concepts (current file)"** in der Seitenleiste.
    *   **Ordner**: Führen Sie den Befehl `Notemd: Batch extract concepts from folder` aus der Befehlspalette aus oder klicken Sie auf die Schaltfläche **"Extract concepts (folder)"** in der Seitenleiste und wählen Sie dann einen Ordner aus, um alle darin enthaltenen Notizen zu verarbeiten.
    *   Das Plugin liest die Dateien, identifiziert die Konzepte und erstellt neue Notizen dafür in Ihrem angegebenen **Konzeptnotiz-Ordner**, wobei Ihre Originaldateien unberührt bleiben.

8.  **Wiki-Link erstellen & Notiz aus Auswahl generieren**:
    *   Dieser leistungsstarke Befehl rationalisiert den Prozess der Erstellung und Befüllung neuer Konzeptnotizen.
    *   Wählen Sie ein Wort oder eine Phrase in Ihrem Editor aus.
    *   Führen Sie den Befehl `Notemd: Create Wiki-Link & Generate Note from Selection` aus (es wird empfohlen, hierfür einen Hotkey zuzuweisen, z. B. `Cmd+Shift+W`).
    *   Das Plugin wird:
        1.  Ihren markierten Text durch einen `[[wiki-link]]` ersetzen.
        2.  Prüfen, ob in Ihrem **Konzeptnotiz-Ordner** bereits eine Notiz mit diesem Titel existiert.
        3.  Falls ja, einen Backlink zur aktuellen Notiz hinzufügen.
        4.  Falls nein, eine neue leere Notiz erstellen.
        5.  Dann automatisch den Befehl **"Generate Content from Title"** auf der neuen oder bestehenden Notiz ausführen und sie mit KI-generiertem Inhalt befüllen.

9.  **Konzepte extrahieren und Titel generieren**:
    *   Dieser Befehl verknüpft zwei leistungsstarke Funktionen für einen vereinfachten Workflow.
    *   Führen Sie den Befehl `Notemd: Extract Concepts and Generate Titles` aus der Befehlspalette aus (es wird empfohlen, hierfür einen Hotkey zuzuweisen).
    *   Das Plugin wird:
        1.  Zuerst die Aufgabe **"Extract concepts (current file)"** auf der aktuell aktiven Datei ausführen.
        2.  Anschließend automatisch die Aufgabe **"Batch-Generierung aus Titeln"** auf dem Ordner ausführen, den Sie in den Einstellungen als Ihren **Ordnerpfad für Konzeptnotizen** konfiguriert haben.
    *   Dies ermöglicht es Ihnen, Ihre Wissensdatenbank zuerst mit neuen Konzepten aus einem Quelldokument zu befüllen und diese neuen Konzeptnotizen dann sofort in einem Schritt mit KI-generiertem Inhalt auszuarbeiten.

10. **Spezifischen Originaltext extrahieren**:
    *   Konfigurieren Sie Ihre Fragen in den Einstellungen unter "Spezifischen Originaltext extrahieren".
    *   Verwenden Sie die Schaltfläche "Spezifischen Originaltext extrahieren" in der Seitenleiste, um die aktive Datei zu verarbeiten.
    *   **Merged Modus**: Ermöglicht schnellere Verarbeitung, indem alle Fragen in einem einzigen Prompt gesendet werden.
    *   **Übersetzung**: Übersetzt optional den extrahierten Text in Ihre konfigurierte Sprache.
    *   **Benutzerdefinierte Ausgabe**: Konfigurieren Sie, wo und wie die extrahierte Datei gespeichert wird.

11. **Batch-Mermaid-Korrektur**:
    *   Verwenden Sie die Schaltfläche "Batch-Mermaid-Korrektur" in der Seitenleiste, um einen Ordner zu scannen und gängige Mermaid-Syntaxfehler zu beheben.
    *   Das Plugin berichtet alle Dateien, die nach wie vor Fehler enthalten, in einer Datei `mermaid_error_{ordnername}.md`.
    *   Konfigurieren Sie das Plugin optional so, dass diese problematischen Dateien zur Überprüfung in einen separaten Ordner verschoben werden.

## Unterstützte LLM-Anbieter

| Anbieter           | Typ     | API-Schlüssel erforderlich | Hinweise                                                              |
|--------------------|---------|----------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Ja                         | Nativer DeepSeek-Endpunkt mit Handhabung von Reasoning-Modellen       |
| Qwen               | Cloud   | Ja                         | DashScope-kompatibles Preset für Qwen / QwQ Modelle                   |
| Qwen Code          | Cloud   | Ja                         | Code-fokussiertes DashScope-Preset für Qwen Coder Modelle             |
| Doubao             | Cloud   | Ja                         | Volcengine Ark Preset; setzen Sie das Modellfeld meist auf Ihre Endpunkt-ID |
| Moonshot           | Cloud   | Ja                         | Offizieller Kimi / Moonshot Endpunkt                                  |
| GLM                | Cloud   | Ja                         | Offizieller Zhipu BigModel OpenAI-kompatibler Endpunkt                |
| Z AI               | Cloud   | Ja                         | Offizieller internationaler GLM/Zhipu OpenAI-kompatibler Endpunkt     |
| MiniMax            | Cloud   | Ja                         | Offizieller MiniMax chat-completions Endpunkt                         |
| Huawei Cloud MaaS  | Cloud   | Ja                         | OpenAI-kompatibler Huawei ModelArts MaaS Endpunkt für gehostete Modelle |
| Baidu Qianfan      | Cloud   | Ja                         | Offizieller Baidu Qianfan OpenAI-kompatibler Endpunkt für ERNIE-Modelle |
| SiliconFlow        | Cloud   | Ja                         | Offizieller SiliconFlow OpenAI-kompatibler Endpunkt für gehostete Modelle |
| OpenAI             | Cloud   | Ja                         | Unterstützt GPT und o-Serie Modelle                                   |
| Anthropic          | Cloud   | Ja                         | Unterstützt Claude Modelle                                            |
| Google             | Cloud   | Ja                         | Unterstützt Gemini Modelle                                            |
| Mistral            | Cloud   | Ja                         | Unterstützt Mistral und Codestral Familien                            |
| Azure OpenAI       | Cloud   | Ja                         | Erfordert Endpunkt, API-Schlüssel, Deployment-Name und API-Version    |
| OpenRouter         | Gateway | Ja                         | Zugriff auf viele Anbieter über OpenRouter Modell-IDs                 |
| xAI                | Cloud   | Ja                         | Nativer Grok-Endpunkt                                                 |
| Groq               | Cloud   | Ja                         | Schnelle OpenAI-kompatible Inferenz für gehostete OSS-Modelle         |
| Together           | Cloud   | Ja                         | OpenAI-kompatibler Endpunkt für gehostete OSS-Modelle                 |
| Fireworks          | Cloud   | Ja                         | OpenAI-kompatibler Inferenz-Endpunkt                                  |
| Requesty           | Gateway | Ja                         | Multi-Provider-Router unter einem einzigen API-Schlüssel              |
| OpenAI Compatible  | Gateway | Optional                   | Generisches Preset für LiteLLM, vLLM, Perplexity, Vercel AI Gateway usw. |
| LMStudio           | Lokal   | Optional (`EMPTY`)         | Führt Modelle lokal über LM Studio Server aus                         |
| Ollama             | Lokal   | Nein                       | Führt Modelle lokal über Ollama Server aus                            |

*Hinweis: Stellen Sie bei lokalen Anbietern (LMStudio, Ollama) sicher, dass die jeweilige Server-Anwendung läuft und über die konfigurierte Basis-URL erreichbar ist.*
*Hinweis: Verwenden Sie bei OpenRouter und Requesty den vollständigen/mit Provider-Präfix versehenen Modell-Identifikator, der vom Gateway angezeigt wird (z. B. `google/gemini-flash-1.5` oder `anthropic/claude-3-7-sonnet-latest`).*
*Hinweis: `Doubao` erwartet normalerweise eine Ark-Endpunkt-/Bereitstellungs-ID im Modellfeld anstelle eines reinen Modellfamiliennamens. Der Einstellungsbildschirm warnt nun, wenn der Platzhalterwert noch vorhanden ist, und blockiert Verbindungstests, bis Sie ihn durch eine echte Endpunkt-ID ersetzen.*
*Hinweis: `Z AI` zielt auf die internationale `api.z.ai`-Linie ab, während `GLM` den BigModel-Endpunkt in Festlandchina beibehält. Wählen Sie das Preset, das zu Ihrer Kontoregion passt.*
*Hinweis: China-fokussierte Presets verwenden Chat-First-Verbindungsprüfungen, damit der Test das tatsächlich konfigurierte Modell/Deployment validiert, nicht nur die Erreichbarkeit des API-Schlüssels.*
*Hinweis: `OpenAI Compatible` ist für benutzerdefinierte Gateways und Proxies gedacht. Setzen Sie die Basis-URL, API-Schlüssel-Richtlinie und Modell-ID gemäß Ihrer Anbieterdokumentation.*

## Netzwerknutzung & Datenverarbeitung

Notemd läuft lokal innerhalb von Obsidian, aber einige Funktionen senden ausgehende Anfragen.

### LLM-Provider-Aufrufe (Konfigurierbar)

- Auslöser: Dateiverarbeitung, Generierung, Übersetzung, Forschungszusammenfassung, Mermaid-Zusammenfassung sowie Verbindungs-/Diagnoseaktionen.
- Endpunkt: Ihre in den Notemd-Einstellungen konfigurierten Provider-Basis-URLs.
- Gesendete Daten: Für die Verarbeitung erforderlicher Prompt-Text und Aufgabeninhalt.
- Hinweis zur Datenhandhabung: API-Schlüssel werden lokal in den Plugin-Einstellungen konfiguriert und zum Signieren von Anfragen von Ihrem Gerät verwendet.

### Web-Recherche-Aufrufe (Optional)

- Auslöser: Wenn Web-Recherche aktiviert ist und ein Suchanbieter ausgewählt wurde.
- Endpunkt: Tavily API oder DuckDuckGo Endpunkte.
- Gesendete Daten: Ihre Suchanfrage und erforderliche Anfrage-Metadaten.

### Entwicklerdiagnose und Debug-Logs (Optional)

- Auslöser: API-Debugging-Modus und Entwicklerdiagnose-Aktionen.
- Speicherung: Diagnose- und Fehlerprotokolle werden in das Stammverzeichnis Ihres Vaults geschrieben (z. B. `Notemd_Provider_Diagnostic_*.txt` und `Notemd_Error_Log_*.txt`).
- Risikohinweis: Protokolle können Anfrage-/Antwortfragmente enthalten. Bitte überprüfen Sie Protokolle, bevor Sie sie öffentlich teilen.

### Lokale Speicherung

- Die Plugin-Konfiguration wird in `.obsidian/plugins/notemd/data.json` gespeichert.
- Generierte Dateien, Berichte und optionale Protokolle werden gemäß Ihren Einstellungen in Ihrem Vault gespeichert.

## Fehlerbehebung

### Gängige Probleme
-   **Plugin lädt nicht**: Stellen Sie sicher, dass `manifest.json`, `main.js`, `styles.css` im richtigen Ordner sind (`<Vault>/.obsidian/plugins/notemd/`) und starten Sie Obsidian neu. Prüfen Sie die Entwicklerkonsole (`Strg+Umschalt+I` oder `Cmd+Option+I`) auf Fehler beim Start.
-   **Verarbeitungsfehler / API-Fehler**:
    1.  **Dateiformat prüfen**: Stellen Sie sicher, dass die Datei, die Sie verarbeiten oder prüfen möchten, die Endung `.md` oder `.txt` hat. Notemd unterstützt derzeit nur diese textbasierten Formate.
    2.  Verwenden Sie den Befehl/die Schaltfläche "LLM-Verbindung testen", um die Einstellungen des aktiven Anbieters zu überprüfen.
    3.  Prüfen Sie API-Schlüssel, Basis-URL, Modellname und API-Version (für Azure) doppelt. Stellen Sie sicher, dass der API-Schlüssel korrekt ist und über ausreichend Guthaben/Berechtigungen verfügt.
    4.  Stellen Sie sicher, dass Ihr lokaler LLM-Server (LMStudio, Ollama) läuft und die Basis-URL korrekt ist (z. B. `http://localhost:1234/v1` für LMStudio).
    5.  Prüfen Sie Ihre Internetverbindung für Cloud-Anbieter.
    6.  **Bei Einzeldatei-Verarbeitungsfehlern:** Prüfen Sie die Entwicklerkonsole auf detaillierte Fehlermeldungen. Kopieren Sie diese bei Bedarf über die Schaltfläche im Fehler-Modal.
    7.  **Bei Batch-Verarbeitungsfehlern:** Prüfen Sie die Datei `error_processing_filename.log` im Stammverzeichnis Ihres Vaults auf detaillierte Fehlermeldungen für jede fehlgeschlagene Datei. Die Entwicklerkonsole oder das Fehler-Modal zeigt eventuell eine Zusammenfassung oder einen allgemeinen Batch-Fehler.
    8.  **Automatische Fehlerprotokolle:** Wenn ein Prozess fehlschlägt, speichert das Plugin automatisch eine detaillierte Logdatei namens `Notemd_Error_Log_[Zeitstempel].txt` im Stammverzeichnis Ihres Vaults. Diese Datei enthält die Fehlermeldung, den Stack-Trace und Sitzungsprotokolle. Bei anhaltenden Problemen prüfen Sie bitte diese Datei. Durch Aktivieren des "API-Fehler-Debugging-Modus" in den Einstellungen wird dieses Protokoll mit noch detaillierteren API-Antwortdaten befüllt.
    9.  **Langzeit-Anfrage-Diagnose am echten Endpunkt (Entwickler)**:
        - Pfad innerhalb des Plugins (zuerst empfohlen): Verwenden Sie **Einstellungen -> Notemd -> Provider-Diagnose für Entwickler (Langzeit-Anfrage)**, um eine Laufzeit-Sonde über den aktiven Provider auszuführen und `Notemd_Provider_Diagnostic_*.txt` im Vault-Root zu generieren.
        - CLI-Pfad (außerhalb der Obsidian-Laufzeit): Für einen reproduzierbaren Vergleich auf Endpunkt-Ebene zwischen gepuffertem und Streaming-Verhalten verwenden Sie:
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
        Der generierte Bericht enthält Timings pro Versuch (`First Byte`, `Duration`), bereinigte Anfrage-Metadaten, Antwort-Header, rohe/teilweise Body-Fragmente, geparste Stream-Chunks und Fehlerpunkte der Transportschicht.
-   **Verbindungsprobleme mit LM Studio/Ollama**:
    *   **Verbindungstest fehlgeschlagen**: Stellen Sie sicher, dass der lokale Server (LM Studio oder Ollama) läuft und das richtige Modell geladen/verfügbar ist.
    *   **CORS-Fehler (Ollama unter Windows)**: Wenn bei der Verwendung von Ollama unter Windows CORS-Fehler (Cross-Origin Resource Sharing) auftreten, müssen Sie eventuell die Umgebungsvariable `OLLAMA_ORIGINS` setzen. Dies können Sie tun, indem Sie `set OLLAMA_ORIGINS=*` in Ihrer Eingabeaufforderung ausführen, bevor Sie Ollama starten. Dies erlaubt Anfragen von jedem Ursprung.
    *   **CORS in LM Studio aktivieren**: Bei LM Studio können Sie CORS direkt in den Server-Einstellungen aktivieren, was erforderlich sein kann, wenn Obsidian in einem Browser läuft oder strenge Origin-Richtlinien hat.
-   **Fehler bei der Ordnererstellung ("Dateiname darf nicht enthalten...")**:
    *   Dies bedeutet normalerweise, dass der in den Einstellungen angegebene Pfad (**Ordnerpfad für verarbeitete Dateien** oder **Ordnerpfad für Konzeptnotizen**) für *Obsidian* ungültig ist.
    *   **Stellen Sie sicher, dass Sie relative Pfade verwenden** (z. B. `Verarbeitet`, `Notizen/Konzepte`) und **keine absoluten Pfade** (z. B. `C:\Benutzer\...`, `/Users/...`).
    *   Prüfen Sie auf ungültige Zeichen: `* " \ / < > : | ? # ^ [ ]`. Beachten Sie, dass `\` selbst unter Windows für Obsidian-Pfade ungültig ist. Verwenden Sie `/` als Pfadtrenner.
-   **Leistungsprobleme**: Die Verarbeitung großer Dateien oder vieler Dateien kann Zeit in Anspruch nehmen. Verringern Sie die Einstellung "Wortanzahl pro Chunk" für potenziell schnellere (aber zahlreichere) API-Aufrufe. Versuchen Sie einen anderen LLM-Anbieter oder ein anderes Modell.
-   **Unerwartete Verlinkungen**: Die Qualität der Links hängt stark vom LLM und dem Prompt ab. Experimentieren Sie mit verschiedenen Modellen oder Temperatureinstellungen.

## Mitwirken

Beiträge sind willkommen! Bitte schauen Sie im GitHub-Repository nach Richtlinien: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## Dokumentation für Maintainer

- [Release-Workflow (Englisch)](./docs/maintainer/release-workflow.md)
- [Release-Workflow (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Lizenz

MIT-Lizenz - Siehe Datei [LICENSE](LICENSE) für Details.

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - Verbessern Sie Ihren Obsidian-Wissensgraphen mit KI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
