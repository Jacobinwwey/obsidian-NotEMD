
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-Plugin für Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Dokumentation in weiteren Sprachen lesen: [Language Hub](./docs/i18n/README.md)

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

**Version:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Inhaltsverzeichnis
- [Schnellstart](#schnellstart)
- [Sprachunterstützung](#sprachunterstützung)
- [Funktionen](#funktionen)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Benutzerhandbuch](#benutzerhandbuch)
- [Unterstützte LLM-Anbieter](#unterstützte-llm-anbieter)
- [Netzwerknutzung & Datenverarbeitung](#netzwerknutzung--datenverarbeitung)
- [Fehlerbehebung](#fehlerbehebung)
- [Mitwirken](#mitwirken)
- [Dokumentation für Maintainer](#dokumentation-für-maintainer)
- [Lizenz](#lizenz)

## Schnellstart

1.  **Installieren & Aktivieren**: Holen Sie sich das Plugin aus dem Obsidian Community Store.
2.  **LLM konfigurieren**: Gehen Sie zu `Einstellungen -> Notemd`, wählen Sie Ihren LLM-Anbieter (wie OpenAI oder einen lokalen wie Ollama) und geben Sie Ihren API-Schlüssel/URL ein.
3.  **Seitenleiste öffnen**: Klicken Sie auf das Notemd-Zauberstab-Symbol in der linken Leiste, um die Seitenleiste zu öffnen.
4.  **Notiz verarbeiten**: Öffnen Sie eine beliebige Notiz und klicken Sie in der Seitenleiste auf **"Datei verarbeiten (Links hinzufügen)"**, um automatisch `[[wiki-links]]` hinzuzufügen.
5.  **Schnell-Workflow ausführen**: Verwenden Sie die Standard-Schaltfläche **"One-Click Extract"**, um Verarbeitung, Batch-Generierung und Mermaid-Bereinigung von einem einzigen Punkt aus zu verketten.

Das ist alles! Erkunden Sie die Einstellungen, um weitere Funktionen wie Web-Recherche, Übersetzung und Inhaltsgenerierung freizuschalten.

## Sprachunterstützung

### Sprachverhaltensvertrag

| Bereich | Umfang | Standard | Hinweise |
|---|---|---|---|
| `UI Locale` | Nur Plugin-Oberflächentext (Einstellungen, Seitenleiste) | `auto` | Folgt dem Obsidian-Gebietsschema; aktuelle Kataloge: `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Von LLM generierte Aufgabenausgabe (Links, Zusammenfassungen) | `en` | Kann global oder pro Aufgabe eingestellt werden. |
| `Disable auto translation` | Nicht-Übersetzungsaufgaben behalten den Originalkontext bei | `false` | Explizite `Übersetzen`-Aufgaben erzwingen weiterhin die Zielsprache. |

- Die offizielle Dokumentation wird in Englisch und vereinfachtem Chinesisch gepflegt, mit voller Unterstützung für über 30 Sprachen.
- Alle unterstützten Sprachen sind im Header oben verlinkt.

## Hauptfunktionen

### KI-gestützte Dokumentenverarbeitung
- **Multi-LLM-Unterstützung**: Verbindung zu verschiedenen Cloud- und lokalen LLM-Anbietern.
- **Smart Chunking**: Teilt große Dokumente automatisch in handliche Stücke auf.
- **Inhaltserhaltung**: Behält die ursprüngliche Formatierung bei, während Struktur und Links hinzugefügt werden.
- **Retry-Logik**: Optionaler automatischer Neustart bei fehlgeschlagenen API-Aufrufen.
- **Voreinstellungen für China**: Enthält Anbieter wie `Qwen`, `Doubao`, `Moonshot` usw.

### Wissensgraph-Verbesserung
- **Automatisches Wiki-Linking**: Identifiziert und fügt Wiki-Links zu Kernkonzepten hinzu.
- **Erstellung von Konzeptnotizen**: Erstellt automatisch neue Notizen für entdeckte Konzepte.

### Übersetzung
- **KI-Übersetzung**: Übersetzt Notizinhalte mit dem konfigurierten LLM.
- **Batch-Übersetzung**: Übersetzt alle Dateien in einem ausgewählten Ordner.

### Web-Recherche & Inhaltsgenerierung
- **Web-Recherche**: Führt Suchen über Tavily oder DuckDuckGo durch und fasst Ergebnisse zusammen.
- **Generierung aus Titel**: Nutzt den Notiztitel zur Generierung von Inhalten.
- **Mermaid Auto-Fix**: Repariert automatisch die Syntax generierter Mermaid-Diagramme.

## Installation
1. Gehen Sie zu **Einstellungen** → **Community-Plugins**.
2. Deaktivieren Sie den "Eingeschränkten Modus".
3. Klicken Sie auf **Durchsuchen** und suchen Sie nach "Notemd".
4. Klicken Sie auf **Installieren** und dann auf **Aktivieren**.

## Lizenz
MIT-Lizenz - Siehe Datei [LICENSE](LICENSE) für Details.

---
*Notemd v1.8.0 - Verbessern Sie Ihren Obsidian-Wissensgraphen mit KI.*
