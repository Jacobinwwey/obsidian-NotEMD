
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-tillegg for Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Les dokumentasjon på flere språk: [Language Hub](./docs/i18n/README.md)

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

En enkel måte å lage din egen kunnskapsbase på!

Notemd forbedrer Obsidian-arbeidsflyten din ved å integrere med ulike store språkmodeller (LLM) for å behandle dine flerspråklige notater, automatisk generere wiki-lenker for nøkkelbegreper, opprette tilsvarende konseptnotater, utføre nettforskning og hjelpe deg med å bygge kraftige kunnskapsgrafer.

**Versjon:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Innholdsfortegnelse
- [Hurtigstart](#hurtigstart)
- [Språkstøtte](#språkstøtte)
- [Funksjoner](#funksjoner)
- [Installasjon](#installasjon)
- [Konfigurasjon](#konfigurasjon)
- [Brukerveiledning](#brukerveiledning)
- [Støttede LLM-leverandører](#støttede-llm-leverandører)
- [Nettbruks- og databehandling](#nettbruks--og-databehandling)
- [Feilsøking](#feilsøking)
- [Bidra](#bidra)
- [Dokumentasjon for vedlikeholdere](#dokumentasjon-for-vedlikeholdere)
- [Lisens](#lisens)

## Hurtigstart

1.  **Installer og aktiver**: Hent tillegget fra Obsidians community-butikk.
2.  **Konfigurer LLM**: Gå til `Innstillinger -> Notemd`, velg din LLM-leverandør (som OpenAI eller en lokal som Ollama), og skriv inn din API-nøkkel/URL.
3.  **Åpne sidefeltet**: Klikk på Notemd-tryllestavikonet i venstre felt for å åpne sidefeltet.
4.  **Behandle et notat**: Åpne et notat og klikk på **"Behandle fil (Legg til lenker)"** i sidefeltet for automatisk å legge til `[[wiki-links]]`.
5.  **Kjør hurtigarbeidsflyt**: Bruk standardknappen **"One-Click Extract"** for å koble sammen behandling, batch-generering og Mermaid-opprydding fra ett sted.

Det er alt! Utforsk innstillingene for å låse opp flere funksjoner som nettforskning, oversettelse og innholdsgenerering.

## Språkstøtte

### Språkadferdsavtale

| Aspekt | Omfang | Standard | Merknader |
|---|---|---|---|
| `UI Locale` | Kun tekst i tilleggsgrensesnittet | `auto` | Følger Obsidians språk; nåværende kataloger: `en`, `zh-CN`, `zh-TW`. |
| `Oppgave-utdataspråk` | LLM-generert utdata (lenker, sammendrag) | `en` | Kan være globalt eller per oppgave. |
| `Deaktiver auto-oversettelse` | Ikke-oversettelsesoppgaver beholder original kontekst | `false` | Eksplisitte `Oversett`-oppgaver tvinger fortsatt målspråket. |

- Offisiell dokumentasjon vedlikeholdes på engelsk og forenklet kinesisk, med full støtte for over 30 språk.
- Alle støttede språk er lenket i overskriften ovenfor.

## Hovedfunksjoner

### AI-drevet dokumentbehandling
- **Multi-LLM støtte**: Koble til ulike sky- og lokale LLM-leverandører.
- **Smart Chunking**: Deler automatisk opp store dokumenter i håndterbare deler.
- **Bevaring av innhold**: Bevarer original formatering mens struktur og lenker legges til.
- **Retry-logikk**: Valgfri automatisk gjentakelse ved mislykkede API-kall.
- **Kina-klare forhåndsinnstillinger**: Inkluderer leverandører som `Qwen`, `Doubao`, `Moonshot` osv.

### Forbedring av kunnskapsgraf
- **Automatisk Wiki-lenking**: Identifiserer og legger til wiki-lenker til kjernekonserter.
- **Opprettelse av konseptnotater**: Oppretter automatisk nye notater for oppdagede konsepter.

### Oversettelse
- **AI-drevet oversettelse**: Oversett notatinnhold med konfigurert LLM.
- **Batch-oversettelse**: Oversett alle filer i en valgt mappe.

### Nettforskning og innholdsgenerering
- **Nettforskning**: Søk via Tavily eller DuckDuckGo og oppsummer resultater.
- **Generer fra tittel**: Bruk notatets tittel til å generere innledende innhold.
- **Mermaid Auto-Fix**: Reparerer automatisk syntaks i genererte Mermaid-diagrammer.

## Installasjon
1. Gå til **Innstillinger** → **Community-tillegg**.
2. Sørg for at "Begrenset modus" er **slått av**.
3. Klikk på **Bla gjennom** og søk etter "Notemd".
4. Klikk på **Installer** og deretter på **Aktiver**.

## Lisens
MIT-lisens - Se filen [LICENSE](LICENSE) for detaljer.

---
*Notemd v1.8.0 - Forbedre din Obsidian-kunnskapsgraf med AI.*
