
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Wtyczka Notemd dla Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Przeczytaj dokumentację w innych językach: [Centrum Językowe](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Wspomagane przez AI wielojęzyczne
            rozszerzanie wiedzy
==================================================
```

Prosty sposób na stworzenie własnej bazy wiedzy!

Notemd ulepsza Twój przepływ pracy w Obsidian, integrując się z różnymi dużymi modelami językowymi (LLM), aby przetwarzać Twoje wielojęzyczne notatki, automatycznie generować linki wiki dla kluczowych pojęć, tworzyć odpowiednie notatki pojęciowe, przeprowadzać badania w sieci i pomagać w budowaniu potężnych grafów wiedzy.

**Wersja:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Spis treści
- [Szybki start](#szybki-start)
- [Wsparcie językowe](#wsparcie-językowe)
- [Funkcje](#funkcje)
- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Instrukcja obsługi](#instrukcja-obsługi)
- [Obsługiwani dostawcy LLM](#obsługiwani-dostawcy-llm)
- [Użycie sieci i przetwarzanie danych](#użycie-sieci-i-przetwarzanie-danych)
- [Rozwiązywanie problemów](#rozwiązywanie-problemów)
- [Współpraca](#współpraca)
- [Dokumentacja dla opiekunów](#dokumentacja-dla-opiekunów)
- [Licencja](#licencja)

## Szybki start

1.  **Zainstaluj i włącz**: Pobierz wtyczkę ze sklepu społeczności Obsidian.
2.  **Skonfiguruj LLM**: Przejdź do `Ustawienia -> Notemd`, wybierz dostawcę LLM (np. OpenAI lub lokalny Ollama) i wprowadź klucz API/URL.
3.  **Otwórz pasek boczny**: Kliknij ikonę różdżki Notemd na lewym pasku, aby otworzyć widok boczny.
4.  **Przetwórz notatkę**: Otwórz dowolną notatkę i kliknij **"Przetwórz plik (dodaj linki)"** na pasku bocznym, aby automatycznie dodać `[[wiki-links]]`.
5.  **Uruchom szybki przepływ pracy**: Użyj domyślnego przycisku **"One-Click Extract"**, aby połączyć przetwarzanie, generowanie wsadowe i naprawę Mermaid w jednym kroku.

To wszystko! Przejrzyj ustawienia, aby odblokować więcej funkcji, takich jak badania w sieci, tłumaczenie i generowanie treści.

## Wsparcie językowe

### Kontrakt zachowania języka

| Aspekt | Zakres | Domyślnie | Uwagi |
|---|---|---|---|
| `UI Locale` | Tylko tekst interfejsu wtyczki | `auto` | Zgodnie z językiem Obsidian; obecne katalogi: `en`, `zh-CN`, `zh-TW`. |
| `Język wyjściowy zadań` | Wyniki wygenerowane przez LLM (linki, podsumowania) | `en` | Może być globalny lub dla poszczególnych zadań. |
| `Wyłącz autotłumaczenie` | Zadania inne niż tłumaczenie zachowują oryginał | `false` | Jawne zadania `Tłumacz` nadal wymuszają język docelowy. |

- Oficjalna dokumentacja jest prowadzona w języku angielskim i chińskim uproszczonym, z pełnym wsparciem dla ponad 30 języków.
- Wszystkie obsługiwane języki są podlinkowane w nagłówku powyżej.

## Główne funkcje

### Przetwarzanie dokumentów przez AI
- **Wsparcie dla wielu LLM**: Połącz się z różnymi dostawcami chmurowymi i lokalnymi.
- **Inteligentne dzielenie**: Automatycznie dzieli duże dokumenty na mniejsze fragmenty.
- **Zachowanie treści**: Dąży do zachowania oryginalnego formatowania przy dodawaniu struktury i linków.
- **Logika powtórzeń**: Opcjonalne automatyczne ponawianie nieudanych wywołań API.
- **Presety dla Chin**: Zawiera dostawców takich jak `Qwen`, `Doubao`, `Moonshot` itp.

### Rozszerzanie grafu wiedzy
- **Automatyczne linki wiki**: Identyfikuje i dodaje linki wiki do kluczowych pojęć.
- **Tworzenie notatek pojęciowych**: Automatycznie tworzy nowe notatki dla odkrytych pojęć.

### Tłumaczenie
- **Tłumaczenie AI**: Tłumacz treść notatek przy użyciu skonfigurowanego LLM.
- **Tłumaczenie wsadowe**: Tłumacz wszystkie pliki w wybranym folderze.

### Badania w sieci i generowanie treści
- **Badania w sieci**: Przeszukuj internet przez Tavily lub DuckDuckGo i podsumowuj wyniki.
- **Generowanie z tytułu**: Użyj tytułu notatki do wygenerowania wstępnej treści.
- **Auto-naprawa Mermaid**: Automatycznie poprawia składnię wygenerowanych diagramów Mermaid.

## Instalacja
1. Wejdź w **Ustawienia** → **Wtyczki społeczności**.
2. Upewnij się, że "Tryb ograniczony" jest **wyłączony**.
3. Kliknij **Przeglądaj** i wyszukaj "Notemd".
4. Kliknij **Zainstaluj**, a następnie **Włącz**.

## Licencja
Licencja MIT - szczegóły w pliku [LICENSE](LICENSE).

---
*Notemd v1.8.0 - Ulepsz swój graf wiedzy w Obsidian dzięki AI.*
