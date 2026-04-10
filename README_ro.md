
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd pentru Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Citiți documentația în alte limbi: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Îmbunătățirea cunoștințelor multilingve
                  bazată pe AI
==================================================
```

O modalitate ușoară de a vă crea propria bază de cunoștințe!

Notemd vă îmbunătățește fluxul de lucru în Obsidian prin integrarea cu diverse modele de limbaj mari (LLM) pentru a procesa notele multilingve, a genera automat wiki-linkuri pentru conceptele cheie, a crea note de concept corespunzătoare, a efectua cercetări web și a vă ajuta să construiți grafice de cunoștințe puternice.

**Versiune:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Cuprins
- [Pornire Rapidă](#pornire-rapidă)
- [Suport Lingvistic](#suport-lingvistic)
- [Caracteristici](#caracteristici)
- [Instalare](#instalare)
- [Configurare](#configurare)
- [Ghid de Utilizare](#ghid-de-utilizare)
- [Furnizori LLM Suportați](#furnizori-llm-suportați)
- [Utilizarea Rețelei și Gestionarea Datelor](#utilizarea-rețelei-și-gestionarea-datelor)
- [Depanare](#depanare)
- [Contribuție](#contribuție)
- [Documentație pentru Întreținători](#documentație-pentru-întreținători)
- [Licență](#licență)

## Pornire Rapidă

1.  **Instalare și Activare**: Obțineți pluginul din magazinul comunității Obsidian.
2.  **Configurare LLM**: Mergeți la `Setări -> Notemd`, alegeți furnizorul LLM (cum ar fi OpenAI sau unul local ca Ollama) și introduceți cheia API/URL-ul.
3.  **Deschideți Bara Laterală**: Faceți clic pe pictograma baghetă Notemd din bara stângă pentru a deschide bara laterală.
4.  **Procesare Notă**: Deschideți orice notă și faceți clic pe **„Procesare fișier (Adăugare linkuri)”** în bara laterală pentru a adăuga automat `[[wiki-links]]`.
5.  **Rularea Fluxului de Lucru Rapid**: Utilizați butonul implicit **„One-Click Extract”** pentru a înlănțui procesarea, generarea în masă și repararea Mermaid dintr-un singur punct.

Asta e tot! Explorați setările pentru a debloca mai multe funcții, cum ar fi cercetarea web, traducerea și generarea de conținut.

## Suport Lingvistic

### Contract de Comportament Lingvistic

| Aspect | Domeniu | Implicit | Note |
|---|---|---|---|
| `UI Locale` | Doar textul interfeței pluginului | `auto` | Urmează limba Obsidian; cataloagele actuale sunt `en`, `zh-CN`, `zh-TW`. |
| `Limba de Ieșire a Sarcinilor` | Rezultate generate de LLM (linkuri, rezumate) | `en` | Poate fi globală sau per sarcină. |
| `Dezactivare traducere automată` | Sarcinile non-traducere păstrează contextul original | `false` | Sarcinile explicite de `Traducere` impun în continuare limba țintă. |

- Documentația oficială este menținută în engleză și chineză simplificată, cu suport complet pentru peste 30 de limbi.
- Toate limbile suportate sunt legate în antetul de mai sus.

## Caracteristici Principale

### Procesare Documente bazată pe AI
- **Suport Multi-LLM**: Conectare la diverși furnizori LLM cloud și locali.
- **Împărțire Inteligentă**: Împarte automat documentele mari în bucăți gestionabile.
- **Păstrarea Conținutului**: Vizează păstrarea formatării originale în timp ce adaugă structură și linkuri.
- **Logică de Reîncercare**: Reîncercare automată opțională pentru apelurile API eșuate.
- **Presetări pentru China**: Include furnizori precum `Qwen`, `Doubao`, `Moonshot` etc.

### Îmbunătățirea Grafului de Cunoștințe
- **Wiki-Linking Automat**: Identifică și adaugă wiki-linkuri conceptelor de bază.
- **Creare Note de Concept**: Creează automat note noi pentru conceptele descoperite.

### Traducere
- **Traducere AI**: Traduceți conținutul notelor folosind LLM-ul configurat.
- **Traducere în Masă**: Traduceți toate fișierele dintr-un folder selectat.

### Cercetare Web și Generare de Conținut
- **Cercetare Web**: Efectuați căutări prin Tavily sau DuckDuckGo și rezumați rezultatele.
- **Generare din Titlu**: Utilizați titlul notei pentru a genera conținut inițial.
- **Auto-Fix Mermaid**: Repară automat sintaxa diagramelor Mermaid generate.

## Instalare
1. Mergeți la **Setări** → **Pluginuri comunitate**.
2. Asigurați-vă că „Modul restricționat” este oprit.
3. Faceți clic pe **Răsfoire** și căutați „Notemd”.
4. Faceți clic pe **Instalare** și apoi pe **Activare**.

## Licență
Licență MIT - consultați fișierul [LICENSE](LICENSE) pentru detalii.

---
*Notemd v1.8.0 - Îmbunătățiți graful de cunoștințe Obsidian cu AI.*
