![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Wtyczka Notemd dla Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Czytaj dokumentację w innych językach: [Centrum języków](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Wspomagane przez AI wielojęzyczne rozwijanie wiedzy
==================================================
```

Prosty sposób na stworzenie własnej bazy wiedzy.

Notemd usprawnia pracę w Obsidianie, integrując się z różnymi dużymi modelami językowymi (LLM), aby przetwarzać wielojęzyczne notatki, automatycznie generować wiki-linki dla kluczowych pojęć, tworzyć odpowiadające im notatki pojęciowe, prowadzić badania w sieci i pomagać budować rozbudowane grafy wiedzy i nie tylko.

Jeśli kochasz korzystać z Notemd, rozważ [⭐ danie gwiazdki na GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) lub [☕️ kup mi kawę](https://ko-fi.com/jacobinwwey).

**Wersja:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Spis treści

- [Szybki start](#szybki-start)
- [Wsparcie językowe](#wsparcie-językowe)
- [Funkcje](#funkcje)
- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Instrukcja użytkowania](#instrukcja-użytkowania)
- [Obsługiwani dostawcy LLM](#obsługiwani-dostawcy-llm)
- [Użycie sieci i obsługa danych](#użycie-sieci-i-obsługa-danych)
- [Rozwiązywanie problemów](#rozwiązywanie-problemów)
- [Współtworzenie](#współtworzenie)
- [Dokumentacja dla opiekunów](#dokumentacja-dla-opiekunów)
- [Licencja](#licencja)

## Szybki start

1. **Zainstaluj i włącz**: Pobierz wtyczkę z Obsidian Marketplace.
2. **Skonfiguruj LLM**: Przejdź do `Settings -> Notemd`, wybierz dostawcę LLM, którego chcesz używać, na przykład OpenAI albo lokalnego dostawcę, takiego jak Ollama, i wpisz klucz API lub URL.
3. **Otwórz pasek boczny**: Kliknij ikonę różdżki Notemd na lewym pasku, aby otworzyć pasek boczny.
4. **Przetwórz notatkę**: Otwórz dowolną notatkę i kliknij **"Process File (Add Links)"** na pasku bocznym, aby automatycznie dodać `[[wiki-links]]` do kluczowych pojęć.
5. **Uruchom szybki przepływ pracy**: Użyj domyślnego przycisku **"One-Click Extract"**, aby połączyć przetwarzanie, generowanie wsadowe i czyszczenie Mermaid z jednego miejsca.

To wszystko. Przejrzyj ustawienia, aby odblokować więcej funkcji, takich jak badania w sieci, tłumaczenie i generowanie treści.

## Wsparcie językowe

### Kontrakt zachowania językowego

| Zagadnienie | Zakres | Domyślnie | Uwagi |
|---|---|---|---|
| `Język interfejsu` | Tylko tekst interfejsu wtyczki (ustawienia, pasek boczny, powiadomienia, okna dialogowe) | `auto` | Podąża za językiem Obsidian; aktualne katalogi UI to `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN` i `zh-TW`. |
| `Język wyników zadań` | Wynik zadania generowany przez LLM (linki, podsumowania, generowanie, ekstrakcja, język docelowy tłumaczenia) | `en` | Może być globalny albo ustawiany per zadanie po włączeniu `Używaj różnych języków dla zadań`. |
| `Wyłącz automatyczne tłumaczenie` | Zadania inne niż Translate zachowują kontekst języka źródłowego | `false` | Jawne zadania `Translate` nadal wymuszają skonfigurowany język docelowy. |
| Język zapasowy | Rozwiązywanie brakujących kluczy UI | locale -> `en` | Utrzymuje stabilność interfejsu, gdy część kluczy nie ma jeszcze tłumaczenia. |

- Utrzymywane dokumenty źródłowe to angielski i uproszczony chiński, a opublikowane tłumaczenia README są podlinkowane w nagłówku powyżej.
- Zakres obsługiwanych locale interfejsu w aplikacji jest obecnie dokładnie zgodny z jawnym katalogiem w kodzie: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Angielski fallback pozostaje siatką bezpieczeństwa implementacji, ale obsługiwane widoczne powierzchnie są objęte testami regresyjnymi i nie powinny po cichu wracać do angielskiego podczas normalnego użycia.
- Dodatkowe szczegóły i wytyczne dotyczące współtworzenia są śledzone w [Centrum języków](./docs/i18n/README.md).

## Funkcje

### Przetwarzanie dokumentów wspomagane AI
- **Wsparcie dla wielu LLM**: Łącz się z różnymi chmurowymi i lokalnymi dostawcami LLM. Zobacz [Obsługiwani dostawcy LLM](#obsługiwani-dostawcy-llm).
- **Inteligentne chunkowanie**: Automatycznie dzieli duże dokumenty na przetwarzalne części na podstawie liczby słów.
- **Zachowanie treści**: Stara się zachować oryginalne formatowanie, jednocześnie dodając strukturę i linki.
- **Śledzenie postępu**: Aktualizacje w czasie rzeczywistym przez pasek boczny Notemd albo okno modalne postępu.
- **Anulowalne operacje**: Każde zadanie przetwarzania, pojedyncze lub wsadowe, uruchomione z paska bocznego można anulować dedykowanym przyciskiem. Operacje uruchamiane z palety poleceń używają modalu, który również można anulować.
- **Konfiguracja wielu modeli**: Używaj różnych dostawców LLM i konkretnych modeli dla różnych zadań, takich jak Add Links, Research, Generate Title i Translate, albo jednego dostawcy do wszystkiego.
- **Stabilne wywołania API (logika ponawiania)**: Opcjonalnie włącz automatyczne ponawianie nieudanych wywołań LLM API z konfigurowalnym interwałem i limitem prób.
- **Bardziej odporne testy połączenia z dostawcami**: Jeśli pierwszy test dostawcy trafi na przejściowe rozłączenie sieciowe, Notemd przełącza się teraz na stabilną sekwencję ponawiania zamiast od razu kończyć się błędem. Obejmuje to ścieżki OpenAI-compatible, Anthropic, Google, Azure OpenAI i Ollama.
- **Awaryjna ścieżka transportu zależna od środowiska uruchomieniowego**: Gdy długie żądanie do dostawcy zostanie przerwane przez `requestUrl` z przejściowym błędem sieciowym, takim jak `ERR_CONNECTION_CLOSED`, Notemd najpierw próbuje tę samą próbę przez awaryjną ścieżkę transportu zależną od środowiska, zanim przejdzie do skonfigurowanej pętli ponawiania. Wersje desktopowe używają Node `http/https`, a środowiska nie-desktopowe używają przeglądarkowego `fetch`. Zmniejsza to liczbę fałszywych błędów przy wolnych gatewayach i reverse proxy.
- **Wzmocniony łańcuch stabilnych długich żądań OpenAI-compatible**: W trybie stabilnym wywołania OpenAI-compatible używają teraz jawnej kolejności trzech etapów dla każdej próby: bezpośredni transport strumieniowy, potem bezpośredni transport bez strumieniowania, a następnie awaryjna ścieżka `requestUrl`, która nadal może zostać podniesiona do parsowania strumieniowego, jeśli będzie to potrzebne. Ogranicza to fałszywe negatywne wyniki, gdy dostawca poprawnie kończy odpowiedź buforowaną, ale potok strumieniowy jest niestabilny.
- **Awaryjna ścieżka strumieniowania świadoma protokołu w całym API LLM**: Długie awaryjne próby przechodzą teraz na parsowanie strumieniowe świadome protokołu we wszystkich wbudowanych ścieżkach LLM, nie tylko na endpointach OpenAI-compatible. Notemd obsługuje teraz OpenAI/Azure SSE, strumieniowanie Anthropic Messages, odpowiedzi Google Gemini SSE i strumienie Ollama NDJSON zarówno przez desktopowe `http/https`, jak i nie-desktopowe `fetch`, a pozostałe bezpośrednie ścieżki dostawców w stylu OpenAI korzystają z tej samej współdzielonej ścieżki awaryjnej.
- **Presety gotowe na rynek chiński**: Wbudowane presety obejmują teraz `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` i `SiliconFlow`, oprócz istniejących globalnych i lokalnych dostawców.
- **Niezawodne przetwarzanie wsadowe**: Logika równoległego przetwarzania została ulepszona dzięki **rozłożonym w czasie wywołaniom API**, aby unikać błędów limitów szybkości i zapewnić stabilne działanie podczas dużych zadań wsadowych. Zadania są teraz uruchamiane w różnych odstępach zamiast jednocześnie.
- **Dokładne raportowanie postępu**: Naprawiono błąd, przez który pasek postępu mógł utknąć, dzięki czemu UI zawsze pokazuje rzeczywisty stan operacji.
- **Odporne równoległe przetwarzanie wsadowe**: Rozwiązano problem, przez który równoległe operacje wsadowe kończyły się zbyt wcześnie, aby wszystkie pliki były przetwarzane niezawodnie i efektywnie.
- **Dokładność paska postępu**: Naprawiono błąd, przez który pasek postępu komendy "Create Wiki-Link & Generate Note" zatrzymywał się na 95%, i teraz poprawnie pokazuje 100% po zakończeniu.
- **Rozszerzone debugowanie API**: "API Error Debugging Mode" przechwytuje teraz pełne treści odpowiedzi od dostawców LLM i usług wyszukiwania, takich jak Tavily i DuckDuckGo, a także zapisuje oś czasu transportu dla każdej próby z oczyszczonymi URL-ami żądań, czasem trwania, nagłówkami odpowiedzi, częściowymi fragmentami odpowiedzi, sparsowaną częściową treścią strumienia i śladami stosu, co ułatwia diagnozowanie problemów na ścieżkach OpenAI-compatible, Anthropic, Google, Azure OpenAI i Ollama.
- **Panel trybu deweloperskiego**: Ustawienia zawierają teraz osobny panel diagnostyczny tylko dla deweloperów, który pozostaje ukryty, dopóki nie włączysz "Developer mode". Obsługuje wybór ścieżek diagnostycznych i powtarzane testy stabilności dla wybranego trybu.
- **Przeprojektowany pasek boczny**: Wbudowane akcje są pogrupowane w bardziej skupione sekcje z czytelniejszymi etykietami, statusem na żywo, anulowalnym postępem i kopiowalnymi logami, aby zmniejszyć bałagan na pasku bocznym. Stopka z postępem i logiem pozostaje teraz widoczna nawet przy rozwinięciu wszystkich sekcji, a stan gotowości używa czytelniejszego paska oczekiwania.
- **Dopracowana interakcja i czytelność paska bocznego**: Przyciski na pasku bocznym mają teraz wyraźniejszą reakcję na hover, press i focus, a kolorowe przyciski CTA, w tym `One-Click Extract` i `Batch generate from titles`, mają mocniejszy kontrast tekstu dla lepszej czytelności w różnych motywach.
- **Mapowanie CTA tylko dla pojedynczych plików**: Kolorowy styl CTA jest teraz zarezerwowany wyłącznie dla akcji na pojedynczym pliku. Akcje wsadowe lub na poziomie folderu oraz mieszane workflow używają stylu nie-CTA, aby ograniczyć pomyłki wynikające z błędnej oceny zakresu akcji.
- **Niestandardowe workflow one-click**: Zamień wbudowane narzędzia paska bocznego w wielokrotnego użytku własne przyciski z definiowanymi nazwami i łańcuchami akcji. Domyślny workflow `One-Click Extract` jest dostępny od razu po instalacji.

### Rozszerzanie grafu wiedzy
- **Automatyczne wiki-linkowanie**: Identyfikuje kluczowe pojęcia i dodaje `[[wiki-links]]` do przetworzonych notatek na podstawie wyniku LLM.
- **Tworzenie notatek pojęciowych (opcjonalne i konfigurowalne)**: Automatycznie tworzy nowe notatki dla wykrytych pojęć w określonym folderze vaultu.
- **Konfigurowalne ścieżki wyjściowe**: Skonfiguruj osobne ścieżki względne w vaultcie dla zapisu przetworzonych plików i nowo tworzonych notatek pojęciowych.
- **Konfigurowalne nazwy plików wyjściowych (Add Links)**: Możesz opcjonalnie **nadpisywać oryginalny plik** albo używać niestandardowego sufiksu lub ciągu zastępującego zamiast domyślnego `_processed.md`, gdy pliki są przetwarzane w celu dodania linków.
- **Utrzymanie integralności linków**: Podstawowa obsługa aktualizacji linków, gdy notatki są zmieniane lub usuwane z vaultu.
- **Czysta ekstrakcja pojęć**: Wyodrębniaj pojęcia i twórz odpowiadające im notatki pojęciowe bez modyfikacji dokumentu źródłowego. To dobre rozwiązanie do budowania bazy wiedzy z istniejących dokumentów bez ich zmieniania. Funkcja ma konfigurowalne opcje minimalnych notatek pojęciowych i backlinków.

### Tłumaczenie

- **Tłumaczenie wspomagane AI**:
  - Tłumacz treść notatek przy użyciu skonfigurowanego LLM.
  - **Obsługa dużych plików**: Duże pliki są automatycznie dzielone na mniejsze części na podstawie ustawienia `Chunk word count`, zanim zostaną wysłane do LLM. Przetłumaczone fragmenty są następnie płynnie łączone z powrotem w jeden dokument.
  - Obsługuje tłumaczenie między wieloma językami.
  - Konfigurowalny język docelowy w ustawieniach lub UI.
  - Automatycznie otwiera przetłumaczony tekst po prawej stronie oryginału dla wygodniejszego czytania.
- **Tłumaczenie wsadowe**:
  - Tłumacz wszystkie pliki w wybranym folderze.
  - Obsługuje przetwarzanie równoległe, gdy włączone jest "Enable Batch Parallelism".
  - Używa niestandardowych promptów do tłumaczenia, jeśli zostały skonfigurowane.
  - Dodaje opcję "Batch translate this folder" do menu kontekstowego eksploratora plików.
- **Wyłącz automatyczne tłumaczenie**: Gdy ta opcja jest włączona, zadania inne niż Translate nie wymuszają już określonego języka wyjściowego i zachowują kontekst języka źródłowego. Jawne zadanie "Translate" nadal wykonuje tłumaczenie zgodnie z konfiguracją.

### Badania w sieci i generowanie treści
- **Badania w sieci i podsumowania**:
  - Wykonuj wyszukiwanie internetowe przez Tavily, które wymaga klucza API, lub DuckDuckGo, które jest eksperymentalne.
  - **Lepsza odporność wyszukiwania**: Wyszukiwanie DuckDuckGo wykorzystuje teraz ulepszoną logikę parsowania, `DOMParser` z fallbackiem regex, aby radzić sobie ze zmianami układu i utrzymywać wiarygodne wyniki.
  - Podsumowuj wyniki wyszukiwania przy użyciu skonfigurowanego LLM.
  - Język podsumowania można dostosować w ustawieniach.
  - Dopisuj podsumowania do bieżącej notatki.
  - Konfigurowalny limit tokenów dla treści badawczej wysyłanej do LLM.
- **Generowanie treści na podstawie tytułu**:
  - Użyj tytułu notatki do wygenerowania początkowej treści przez LLM, zastępując istniejącą zawartość.
  - **Opcjonalne badania**: Skonfiguruj, czy wykonywać badanie w sieci z użyciem wybranego dostawcy, aby dostarczyć kontekst do generowania.
- **Wsadowe generowanie treści z tytułów**: Generuj treść dla wszystkich notatek w wybranym folderze na podstawie ich tytułów, z uwzględnieniem opcjonalnego ustawienia badań. Pomyślnie przetworzone pliki są przenoszone do **konfigurowalnego podfolderu "complete"**, na przykład `[foldername]_complete` albo niestandardowej nazwy, aby uniknąć ponownego przetwarzania.
- **Sprzężenie z Mermaid auto-fix**: Gdy Mermaid auto-fix jest włączone, przepływy związane z Mermaid automatycznie naprawiają wygenerowane pliki lub foldery wyjściowe po przetworzeniu. Obejmuje to Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid i Translate.

### Funkcje pomocnicze
- **Podsumuj jako diagram Mermaid**:
  - Ta funkcja pozwala podsumować treść notatki w formie diagramu Mermaid.
  - Język wyjściowy diagramu Mermaid można ustawić w konfiguracji.
  - **Mermaid Output Folder**: Skonfiguruj folder, w którym mają być zapisywane wygenerowane pliki diagramów Mermaid.
  - **Translate Summarize to Mermaid Output**: Opcjonalnie przetłumacz wygenerowaną treść diagramu Mermaid na skonfigurowany język docelowy.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Prosta korekta formatu wzorów**:
  - Szybko poprawia jednolinijkowe formuły matematyczne ograniczone pojedynczym `$` do standardowych bloków `$$`.
  - **Pojedynczy plik**: Przetwórz bieżący plik przyciskiem w pasku bocznym albo z palety poleceń.
  - **Naprawa wsadowa**: Przetwórz wszystkie pliki w wybranym folderze przyciskiem w pasku bocznym albo z palety poleceń.

- **Check for Duplicates in Current File**: Ta komenda pomaga zidentyfikować potencjalnie zduplikowane terminy w aktywnym pliku.
- **Duplicate Detection**: Podstawowa kontrola zduplikowanych słów w treści aktualnie przetwarzanego pliku, wyniki są logowane do konsoli.
- **Check and Remove Duplicate Concept Notes**: Identyfikuje potencjalne duplikaty notatek w skonfigurowanym **Concept Note Folder** na podstawie dokładnych dopasowań nazw, liczby mnogiej, normalizacji i zawierania pojedynczych słów względem notatek spoza tego folderu. Zakres porównania można skonfigurować jako **cały vault**, **tylko określone dołączone foldery** albo **wszystkie foldery z wykluczeniem określonych wyjątków**. Pokazuje szczegółową listę z powodami i konfliktującymi plikami, a następnie prosi o potwierdzenie przed przeniesieniem zidentyfikowanych duplikatów do systemowego kosza. Pokazuje postęp podczas usuwania.
- **Wsadowa naprawa Mermaid**: Stosuje poprawki składni Mermaid i LaTeX do wszystkich plików Markdown w folderze wybranym przez użytkownika.
  - **Gotowe do użycia w workflow**: Może działać jako samodzielne narzędzie albo krok w niestandardowym przycisku workflow one-click.
  - **Raportowanie błędów**: Generuje raport `mermaid_error_{foldername}.md`, który wymienia pliki nadal zawierające potencjalne błędy Mermaid po przetworzeniu.
  - **Przenoszenie plików z błędami**: Opcjonalnie przenosi pliki z wykrytymi błędami do wskazanego folderu na potrzeby ręcznej weryfikacji.
  - **Inteligentne wykrywanie**: Sprawdza teraz pliki pod kątem błędów składni za pomocą `mermaid.parse` przed próbą naprawy, oszczędzając czas przetwarzania i unikając niepotrzebnych zmian.
  - **Bezpieczne przetwarzanie**: Gwarantuje, że poprawki składni są stosowane wyłącznie do bloków kodu Mermaid, aby przypadkowo nie modyfikować tabel Markdown ani innych treści. Zawiera też solidne zabezpieczenia chroniące składnię tabel, na przykład `| :--- |`, przed zbyt agresywnymi poprawkami debugującymi.
  - **Deep Debug Mode**: Jeśli po pierwszej naprawie nadal występują błędy, uruchamiany jest zaawansowany tryb deep debug. Obsługuje on złożone edge case'y, w tym:
    - **Comment Integration**: Automatycznie scala końcowe komentarze zaczynające się od `%` z etykietą krawędzi, na przykład `A -- Label --> B; % Comment` staje się `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Naprawia strzałki wchłonięte przez cudzysłowy, na przykład `A -- "Label -->" B` staje się `A -- "Label" --> B`.
    - **Inline Subgraphs**: Zamienia etykiety inline subgraph na edge labels.
    - **Reverse Arrow Fix**: Koryguje niestandardowe strzałki `X <-- Y` do postaci `Y --> X`.
    - **Direction Keyword Fix**: Gwarantuje, że słowo kluczowe `direction` jest zapisane małymi literami wewnątrz subgraphów, na przykład `Direction TB` -> `direction TB`.
    - **Comment Conversion**: Zamienia komentarze `//` na edge labels, na przykład `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Upraszcza zduplikowane etykiety w nawiasach, na przykład `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Zamienia nieprawidłową składnię strzałki `--|>` na standardowe `-->`.
    - **Odporna obsługa labeli i notatek**: Ulepszona obsługa etykiet ze znakami specjalnymi, takimi jak `/`, i lepsze wsparcie dla niestandardowej składni notatek, jak `note for ...`, przy jednoczesnym czystym usuwaniu artefaktów takich jak końcowe `]`.
    - **Advanced Fix Mode**: Zawiera solidne poprawki dla niecytowanych etykiet węzłów zawierających spacje, znaki specjalne lub zagnieżdżone nawiasy, na przykład `Node[Label [Text]]` -> `Node["Label [Text]"]`, co zapewnia zgodność ze złożonymi diagramami, takimi jak ścieżki Stellar Evolution. Koryguje także błędne edge labels, na przykład `--["Label["-->` do `-- "Label" -->`. Dodatkowo zamienia komentarze inline, takie jak `Consensus --> Adaptive; # Some advanced consensus`, na `Consensus -- "Some advanced consensus" --> Adaptive`, i poprawia niedomknięte cudzysłowy na końcu linii, zastępując końcowe `;"` przez `"]`.
    - **Note Conversion**: Automatycznie zamienia `note right/left of` oraz samodzielne komentarze `note :` na standardowe definicje węzłów Mermaid i połączenia, na przykład `note right of A: text` staje się `NoteA["Note: text"]` połączonym z `A`, co zapobiega błędom składni i poprawia układ. Obsługuje teraz zarówno połączenia strzałkowe (`-->`), jak i pełne (`---`).
    - **Extended Note Support**: Automatycznie zamienia `note for Node "Content"` i `note of Node "Content"` na standardowe połączone węzły notatek, na przykład `NoteNode[" Content"]` połączone z `Node`, zachowując zgodność z rozszerzoną przez użytkownika składnią.
    - **Enhanced Note Correction**: Automatycznie nadaje notatkom numerację sekwencyjną, na przykład `Note1`, `Note2`, aby uniknąć problemów z aliasami, gdy występuje wiele notatek.
    - **Parallelogram/Shape Fix**: Koryguje błędne kształty węzłów, takie jak `[/["Label["/]`, do standardowego `["Label"]`, zapewniając zgodność z wygenerowaną treścią.
    - **Standardize Pipe Labels**: Automatycznie naprawia i standaryzuje edge labels zawierające pionowe kreski, aby były poprawnie ujmowane w cudzysłowy, na przykład `-->|Text|` staje się `-->|"Text"|`, a `-->|Math|^2|` staje się `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Koryguje nieprawidłowo umieszczone edge labels występujące przed strzałką, na przykład `>|"Label"| A --> B` staje się `A -->|"Label"| B`.
    - **Merge Double Labels**: Wykrywa i scala złożone podwójne etykiety na jednej krawędzi, na przykład `A -- Label1 -- Label2 --> B` albo `A -- Label1 -- Label2 --- B`, w jedną czystą etykietę z podziałami linii: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Automatycznie ujmuje w cudzysłowy etykiety węzłów zawierające potencjalnie problematyczne znaki, takie jak cudzysłowy, znaki równości lub operatory matematyczne, ale pozbawione zewnętrznych cudzysłowów, na przykład `Plot[Plot "A"]` staje się `Plot["Plot "A""]`, aby zapobiec błędom renderowania.
    - **Intermediate Node Fix**: Rozdziela krawędzie zawierające definicję pośredniego węzła na dwie osobne krawędzie, na przykład `A -- B[...] --> C` staje się `A --> B[...]` oraz `B[...] --> C`, zapewniając poprawną składnię Mermaid.
    - **Concatenated Label Fix**: Solidnie poprawia definicje węzłów, w których ID jest sklejone z etykietą, na przykład `SubdivideSubdivide...` staje się `Subdivide["Subdivide..."]`, nawet gdy poprzedzają je pipe labels albo duplikacja nie jest dokładna, przez walidację względem znanych node ID.
- **Extract Specific Original Text**:
  - Zdefiniuj listę pytań w ustawieniach.
  - Wyodrębnia dosłowne fragmenty tekstu z aktywnej notatki odpowiadające tym pytaniom.
  - **Merged Query Mode**: Opcjonalne przetwarzanie wszystkich pytań jednym wywołaniem API dla lepszej wydajności.
  - **Translation**: Opcjonalne dołączanie tłumaczeń wyodrębnionego tekstu do wyniku.
  - **Custom Output**: Konfigurowalna ścieżka zapisu i sufiks nazwy pliku dla wyodrębnionego tekstu.
- **Test połączenia LLM**: Zweryfikuj ustawienia API dla aktywnego dostawcy.

## Instalacja

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Z Obsidian Marketplace (zalecane)
1. Otwórz w Obsidianie **Settings** -> **Community plugins**.
2. Upewnij się, że "Restricted mode" jest **wyłączony**.
3. Kliknij **Browse** community plugins i wyszukaj "Notemd".
4. Kliknij **Install**.
5. Po zakończeniu instalacji kliknij **Enable**.

### Instalacja ręczna
1. Pobierz najnowsze pliki wydania ze [strony GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Każde wydanie zawiera także `README.md` jako referencję w paczce, ale do ręcznej instalacji potrzebujesz jedynie `main.js`, `styles.css` oraz `manifest.json`.
2. Przejdź do folderu konfiguracji swojego vaultu Obsidiana: `<YourVault>/.obsidian/plugins/`.
3. Utwórz nowy folder o nazwie `notemd`.
4. Skopiuj `main.js`, `styles.css` oraz `manifest.json` do folderu `notemd`.
5. Uruchom ponownie Obsidiana.
6. Przejdź do **Settings** -> **Community plugins** i włącz "Notemd".

## Konfiguracja

Dostęp do ustawień wtyczki:
**Settings** -> **Community Plugins** -> **Notemd** (kliknij ikonę koła zębatego).

### Konfiguracja dostawcy LLM
1. **Aktywny dostawca**: Wybierz z listy rozwijanej dostawcę LLM, którego chcesz używać.
2. **Ustawienia dostawcy**: Skonfiguruj szczegółowe ustawienia dla wybranego dostawcy:
   - **API Key**: Wymagany dla większości dostawców chmurowych, takich jak OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks oraz Requesty. Nie jest wymagany dla Ollama. Opcjonalny dla LM Studio i ogólnego presetu `OpenAI Compatible`, jeśli endpoint akceptuje dostęp anonimowy lub placeholderowy.
   - **Base URL / Endpoint**: Endpoint API dla usługi. Dostarczane są wartości domyślne, ale może być konieczna zmiana dla modeli lokalnych, takich jak LMStudio i Ollama, gatewayów takich jak OpenRouter, Requesty i OpenAI Compatible, albo dla konkretnych wdrożeń Azure. **Wymagany dla Azure OpenAI.**
   - **Model**: Konkretna nazwa albo ID modelu, którego chcesz użyć, na przykład `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` albo `anthropic/claude-3-7-sonnet-latest`. Upewnij się, że model jest dostępny u Twojego dostawcy lub endpointu.
   - **Temperature**: Steruje losowością wyjścia LLM, gdzie 0 = deterministycznie, a 1 = maksymalna kreatywność. Niższe wartości, na przykład 0.2-0.5, zwykle lepiej sprawdzają się w zadaniach strukturalnych.
   - **API Version (tylko Azure)**: Wymagany dla wdrożeń Azure OpenAI, na przykład `2024-02-15-preview`.
3. **Test połączenia**: Użyj przycisku "Test połączenia" dla aktywnego dostawcy, aby zweryfikować ustawienia. Dostawcy OpenAI-compatible używają teraz kontroli świadomych dostawcy: endpointy takie jak `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` oraz `OpenAI Compatible` testują bezpośrednio `chat/completions`, a dostawcy z niezawodnym endpointem `/models` mogą nadal najpierw użyć listowania modeli. Jeśli pierwszy test zakończy się przejściowym rozłączeniem sieciowym, takim jak `ERR_CONNECTION_CLOSED`, Notemd automatycznie przełączy się na stabilną sekwencję ponawiania zamiast od razu kończyć się błędem.
4. **Zarządzanie konfiguracjami dostawców**: Użyj przycisków "Export Providers" i "Import Providers", aby zapisać albo wczytać ustawienia dostawców LLM do lub z pliku `notemd-providers.json` w katalogu konfiguracji wtyczki. Ułatwia to tworzenie kopii zapasowych i współdzielenie konfiguracji.
5. **Zakres presetów**: Oprócz pierwotnych dostawców Notemd zawiera teraz predefiniowane wpisy dla `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` oraz ogólnego celu `OpenAI Compatible` dla LiteLLM, vLLM, Perplexity, Vercel AI Gateway albo niestandardowych proxy.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Konfiguracja wielu modeli
- **Używaj różnych dostawców dla zadań**:
  - **Wyłączone (domyślnie)**: Używa pojedynczego "aktywnego dostawcy" wybranego powyżej dla wszystkich zadań.
  - **Włączone**: Pozwala wybrać konkretnego dostawcę i opcjonalnie nadpisać nazwę modelu dla każdego zadania, takiego jak "Add Links", "Research & Summarize", "Generate from Title", "Translate" i "Extract Concepts". Jeżeli pole nadpisania modelu pozostaje puste, używany jest domyślny model skonfigurowany dla dostawcy wybranego dla danego zadania.
- **Wybieraj różne języki dla różnych zadań**:
  - **Wyłączone (domyślnie)**: Używa jednego języka wyników dla wszystkich zadań.
  - **Włączone**: Pozwala wybrać konkretny język dla każdego zadania, na przykład "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" oraz "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Architektura językowa (język interfejsu i język wyników zadań)

- **Język interfejsu** kontroluje wyłącznie teksty interfejsu wtyczki, takie jak etykiety ustawień, przyciski paska bocznego, powiadomienia i okna dialogowe. Domyślny tryb `auto` podąża za aktualnym językiem interfejsu Obsidiana.
- Warianty regionalne lub dotyczące systemu pisma są teraz mapowane do najbliższego opublikowanego katalogu zamiast od razu spadać do angielskiego. Na przykład `fr-CA` używa francuskiego, `es-419` hiszpańskiego, `pt-PT` portugalskiego, `zh-Hans` uproszczonego chińskiego, a `zh-Hant-HK` tradycyjnego chińskiego.
- **Język wyników zadań** steruje wynikiem zadań generowanym przez model, takim jak linki, podsumowania, generowanie tytułów, podsumowania Mermaid, ekstrakcja pojęć i język docelowy tłumaczenia.
- **Per-task language mode** pozwala każdemu zadaniu rozstrzygać swój język wyjściowy poprzez wspólną warstwę polityki zamiast rozproszonych nadpisań modułowych.
- **Wyłącz automatyczne tłumaczenie** utrzymuje zadania inne niż Translate w kontekście języka źródłowego, podczas gdy jawne zadania Translate nadal wymuszają skonfigurowany język docelowy.
- Ścieżki generowania związane z Mermaid podlegają tej samej polityce językowej i nadal mogą uruchamiać Mermaid auto-fix, gdy funkcja jest aktywna.

### Ustawienia stabilnych wywołań API
- **Włącz stabilne wywołania API (logika ponawiania)**:
  - **Wyłączone (domyślnie)**: Pojedyncza awaria wywołania API zatrzyma bieżące zadanie.
  - **Włączone**: Automatycznie ponawia nieudane wywołania LLM API, co jest przydatne przy niestabilnej sieci albo rate limitach.
  - **Awaryjna ścieżka testu połączenia**: Nawet gdy zwykłe wywołania nie działają jeszcze w trybie stabilnym, testy połączenia dostawców przełączają się teraz na tę samą sekwencję ponawiania po pierwszym przejściowym błędzie sieciowym.
  - **Awaryjna ścieżka transportu w czasie działania (świadoma środowiska)**: Długie żądania zadaniowe tymczasowo zerwane przez `requestUrl` próbują teraz ponownie tę samą próbę najpierw przez ścieżkę awaryjną zależną od środowiska. Wersje desktopowe używają Node `http/https`, a środowiska nie-desktopowe używają przeglądarkowego `fetch`. Te awaryjne próby wykorzystują teraz parsowanie strumieniowe świadome protokołu we wszystkich wbudowanych ścieżkach LLM, obejmując OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE i Ollama NDJSON, dzięki czemu wolne gatewaye mogą wcześniej zwracać fragmenty treści odpowiedzi. Pozostałe bezpośrednie ścieżki dostawców w stylu OpenAI używają tej samej współdzielonej ścieżki awaryjnej.
  - **Stabilna kolejność dla OpenAI-compatible**: W trybie stabilnym każda próba OpenAI-compatible przebiega teraz w kolejności `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` zanim zostanie uznana za nieudaną. Ogranicza to zbyt agresywne błędy, gdy niestabilny jest tylko jeden tryb transportu.
- **Retry Interval (seconds)**: Widoczne tylko po włączeniu funkcji. Czas pomiędzy próbami, od 1 do 300 sekund. Domyślnie: 5.
- **Maximum Retries**: Widoczne tylko po włączeniu funkcji. Maksymalna liczba ponowień, od 0 do 10. Domyślnie: 3.
- **Tryb debugowania błędów API**:
  - **Wyłączone (domyślnie)**: Używa standardowego, zwięzłego raportowania błędów.
  - **Włączone**: Aktywuje szczegółowe logowanie błędów, podobne do rozwiniętych logów DeepSeek, dla wszystkich dostawców i zadań, w tym Translate, Search i Connection Tests. Obejmuje to kody statusu HTTP, surowy tekst odpowiedzi, osie czasu transportu żądań, oczyszczone URL-e i nagłówki, czas trwania prób, nagłówki odpowiedzi, częściowe treści odpowiedzi, sparsowany częściowy strumień i ślady stosu, co jest kluczowe przy diagnozowaniu problemów z połączeniem API i resetami gatewaya upstream.
- **Developer Mode**:
  - **Wyłączone (domyślnie)**: Ukrywa wszystkie narzędzia diagnostyczne przeznaczone wyłącznie dla deweloperów.
  - **Włączone**: Pokazuje dedykowany panel diagnostyczny dewelopera w ustawieniach.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Wybierz ścieżkę runtime dla każdej próby diagnostycznej. Dostawcy OpenAI-compatible obsługują także dodatkowe wymuszone tryby `direct streaming`, `direct buffered` i `requestUrl-only` poza zwykłymi trybami runtime.
  - **Run Diagnostic**: Uruchamia pojedynczą próbę długiego żądania z wybranym call mode i zapisuje `Notemd_Provider_Diagnostic_*.txt` w katalogu głównym vaultu.
  - **Run Stability Test**: Powtarza tę próbę konfigurowalną liczbę razy, od 1 do 10, z wybranym call mode i zapisuje zagregowany raport stabilności.
  - **Diagnostic Timeout**: Konfigurowalny timeout dla pojedynczego uruchomienia, od 15 do 3600 sekund.
  - **Why Use It**: Szybsze niż ręczne odtwarzanie problemu, gdy dostawca przechodzi "Test connection", ale zawodzi przy realnych długich zadaniach, na przykład przy tłumaczeniu przez wolny gateway.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Ustawienia ogólne

#### Wyjście przetworzonego pliku
- **Customize Processed File Save Path**:
  - **Wyłączone (domyślnie)**: Przetworzone pliki, na przykład `TwojaNotatka_processed.md`, są zapisywane w *tym samym folderze* co oryginalna notatka.
  - **Włączone**: Pozwala określić niestandardową lokalizację zapisu.
- **Processed File Folder Path**: Widoczne tylko po włączeniu powyższej opcji. Wpisz *ścieżkę względną* w vaultcie, na przykład `Processed Notes` albo `Output/LLM`, gdzie mają być zapisywane przetworzone pliki. Foldery zostaną utworzone, jeśli nie istnieją. **Nie używaj ścieżek bezwzględnych, takich jak `C:\...`, ani niedozwolonych znaków.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Wyłączone (domyślnie)**: Pliki tworzone przez komendę "Add Links" używają domyślnego sufiksu `_processed.md`, na przykład `TwojaNotatka_processed.md`.
  - **Włączone**: Pozwala dostosować nazwę pliku wynikowego za pomocą ustawienia poniżej.
- **Custom Suffix/Replacement String**: Widoczne tylko po włączeniu powyższej opcji. Wpisz ciąg, który ma zostać użyty w nazwie pliku wynikowego.
  - Jeśli pole pozostanie **puste**, oryginalny plik zostanie **nadpisany** przetworzoną treścią.
  - Jeśli wpiszesz ciąg, na przykład `_linked`, zostanie on dodany do oryginalnej nazwy bazowej, na przykład `TwojaNotatka_linked.md`. Upewnij się, że sufiks nie zawiera niedozwolonych znaków nazwy pliku.

- **Remove Code Fences on Add Links**:
  - **Wyłączone (domyślnie)**: Code fences **(\`\\\`\`)** pozostają w treści podczas dodawania linków, a **(\`\\\`markdown)** jest usuwane automatycznie.
  - **Włączone**: Usuwa code fences z treści przed dodaniem linków.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Wyjście notatki pojęciowej
- **Customize Concept Note Path**:
  - **Wyłączone (domyślnie)**: Automatyczne tworzenie notatek dla `[[linked concepts]]` jest wyłączone.
  - **Włączone**: Pozwala wskazać folder, w którym będą tworzone nowe notatki pojęciowe.
- **Concept Note Folder Path**: Widoczne tylko po włączeniu powyższej opcji. Wpisz *ścieżkę względną* w vaultcie, na przykład `Concepts` albo `Generated/Topics`, gdzie mają być zapisywane nowe notatki pojęciowe. Foldery zostaną utworzone, jeśli nie istnieją. **Pole jest wymagane, gdy personalizacja jest włączona.** **Nie używaj ścieżek bezwzględnych ani niedozwolonych znaków.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Wyjście pliku dziennika pojęć
- **Generate Concept Log File**:
  - **Wyłączone (domyślnie)**: Plik logu nie jest tworzony.
  - **Włączone**: Tworzy plik logu z listą nowo utworzonych notatek pojęciowych po przetwarzaniu. Format:
    ```
    wygeneruj xx plików md z pojęciami
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Widoczne tylko, gdy "Generate Concept Log File" jest włączone.
  - **Wyłączone (domyślnie)**: Plik logu jest zapisywany w **Concept Note Folder Path**, jeśli ta ścieżka została podana, albo w katalogu głównym vaultu w przeciwnym razie.
  - **Włączone**: Pozwala wskazać niestandardowy folder dla pliku logu.
- **Concept Log Folder Path**: Widoczne tylko, gdy "Customize Log File Save Path" jest włączone. Wpisz *ścieżkę względną* w vaultcie, na przykład `Logs/Notemd`, gdzie ma być zapisany log. **Pole jest wymagane, jeśli personalizacja jest włączona.**
- **Customize Log File Name**: Widoczne tylko, gdy "Generate Concept Log File" jest włączone.
  - **Wyłączone (domyślnie)**: Plik logu nazywa się `Generate.log`.
  - **Włączone**: Pozwala ustawić niestandardową nazwę pliku logu.
- **Concept Log File Name**: Widoczne tylko, gdy "Customize Log File Name" jest włączone. Wpisz oczekiwaną nazwę pliku, na przykład `ConceptCreation.log`. **Pole jest wymagane, jeśli personalizacja jest włączona.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Zadanie ekstrakcji pojęć
- **Twórz minimalne notatki pojęciowe**:
  - **Włączone (domyślnie)**: Nowo tworzone notatki pojęciowe będą zawierać wyłącznie tytuł, na przykład `# Pojęcie`.
  - **Wyłączone**: Notatki pojęciowe mogą zawierać dodatkową treść, taką jak backlink "Linked From", jeśli nie została wyłączona ustawieniem poniżej.
- **Add "Linked From" backlink**:
  - **Wyłączone (domyślnie)**: Nie dodaje backlinku do dokumentu źródłowego w notatce pojęciowej podczas ekstrakcji.
  - **Włączone**: Dodaje sekcję "Linked From" z backlinkiem do pliku źródłowego.

#### Wyodrębnianie określonego tekstu źródłowego
- **Questions for extraction**: Wpisz listę pytań, po jednym na linię, na które AI ma wyodrębniać dosłowne odpowiedzi z Twoich notatek.
- **Translate output to corresponding language**:
  - **Wyłączone (domyślnie)**: Zwraca tylko wyodrębniony tekst w jego oryginalnym języku.
  - **Włączone**: Dodaje tłumaczenie wyodrębnionego tekstu na język wybrany dla tego zadania.
- **Merged query mode**:
  - **Wyłączone**: Przetwarza każde pytanie osobno, co daje wyższą precyzję, ale wymaga większej liczby wywołań API.
  - **Włączone**: Wysyła wszystkie pytania w jednym promptcie, co daje szybsze działanie i mniej wywołań API.
- **Customise extracted text save path & filename**:
  - **Wyłączone**: Zapisuje wynik w tym samym folderze co oryginalny plik z sufiksem `_Extracted`.
  - **Włączone**: Pozwala określić niestandardowy folder wynikowy i sufiks nazwy pliku.

#### Wsadowa naprawa Mermaid
- **Enable Mermaid Error Detection**:
  - **Wyłączone (domyślnie)**: Wykrywanie błędów jest pomijane po przetworzeniu.
  - **Włączone**: Skanuje przetworzone pliki pod kątem pozostałych błędów składni Mermaid i generuje raport `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Wyłączone**: Pliki z błędami pozostają na miejscu.
  - **Włączone**: Przenosi wszystkie pliki, które nadal zawierają błędy składni Mermaid po próbie naprawy, do dedykowanego folderu do ręcznej kontroli.
- **Mermaid error folder path**: Widoczne po włączeniu powyższej opcji. Folder, do którego mają zostać przeniesione błędne pliki.

#### Parametry przetwarzania
- **Enable Batch Parallelism**:
  - **Wyłączone (domyślnie)**: Zadania wsadowe, takie jak "Process Folder" albo "Batch Generate from Titles", przetwarzają pliki jeden po drugim, sekwencyjnie.
  - **Włączone**: Pozwala wtyczce przetwarzać wiele plików równolegle, co może znacząco przyspieszyć duże wsady.
- **Batch Concurrency**: Widoczne tylko po włączeniu równoległości. Ustawia maksymalną liczbę plików przetwarzanych równolegle. Wyższa liczba może działać szybciej, ale zużywa więcej zasobów i może uderzyć w rate limits API. Domyślnie: 1, zakres: 1-20.
- **Batch Size**: Widoczne tylko po włączeniu równoległości. Liczba plików łączonych w jedną paczkę. Domyślnie: 50, zakres: 10-200.
- **Delay Between Batches (ms)**: Widoczne tylko po włączeniu równoległości. Opcjonalne opóźnienie w milisekundach pomiędzy kolejnymi batchami, które może pomóc w zarządzaniu limitami API. Domyślnie: 1000 ms.
- **API Call Interval (ms)**: Minimalne opóźnienie w milisekundach *przed i po* każdym pojedynczym wywołaniu LLM API. Kluczowe dla API o niskim limicie albo w celu zapobiegania błędom 429. Ustaw 0, aby wyłączyć sztuczne opóźnienie. Domyślnie: 500 ms.
- **Chunk Word Count**: Maksymalna liczba słów na chunk wysyłany do LLM. Wpływa na liczbę wywołań API dla dużych plików. Domyślnie: 3000.
- **Enable Duplicate Detection**: Włącza albo wyłącza podstawową kontrolę duplikatów słów w przetwarzanej treści. Wyniki trafiają do konsoli. Domyślnie: włączone.
- **Max Tokens**: Maksymalna liczba tokenów, które LLM może wygenerować w jednej części odpowiedzi. Wpływa na koszt i szczegółowość. Domyślnie: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Tłumaczenie
- **Default Target Language**: Wybierz domyślny język, na który chcesz tłumaczyć notatki. To ustawienie można nadpisać w UI podczas uruchamiania komendy tłumaczenia. Domyślnie: English.
- **Customise Translation File Save Path**:
  - **Wyłączone (domyślnie)**: Przetłumaczone pliki są zapisywane w *tym samym folderze* co oryginalna notatka.
  - **Włączone**: Pozwala określić *ścieżkę względną* w vaultcie, na przykład `Translations`, gdzie mają być zapisywane przetłumaczone pliki. Foldery zostaną utworzone automatycznie, jeśli nie istnieją.
- **Use custom suffix for translated files**:
  - **Wyłączone (domyślnie)**: Przetłumaczone pliki używają domyślnego sufiksu `_translated.md`, na przykład `TwojaNotatka_translated.md`.
  - **Włączone**: Pozwala wskazać niestandardowy sufiks.
- **Custom Suffix**: Widoczne tylko po włączeniu powyższej opcji. Wpisz niestandardowy sufiks dodawany do nazw przetłumaczonych plików, na przykład `_es` albo `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generowanie treści
- **Enable Research in "Generate from Title"**:
  - **Wyłączone (domyślnie)**: "Generate from Title" używa wyłącznie tytułu jako wejścia.
  - **Włączone**: Wykonuje badania w sieci przez skonfigurowanego **Web Research Provider** i dołącza wyniki jako kontekst dla LLM podczas generowania opartego na tytule.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Włączone (domyślnie)**: Automatycznie uruchamia poprawkę składni Mermaid po workflow związanych z Mermaid, takich jak Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid i Translate.
  - **Wyłączone**: Pozostawia wygenerowane wyjście Mermaid bez zmian, dopóki samodzielnie nie uruchomisz `Batch Mermaid Fix` albo nie dodasz go do niestandardowego workflow.
- **Output Language**: Wybierz oczekiwany język wyjściowy dla zadań "Generate from Title" i "Batch Generate from Title".
  - **English (domyślnie)**: Prompty są przetwarzane i wynik jest generowany po angielsku.
  - **Inne języki**: LLM otrzymuje instrukcję rozumowania po angielsku, ale ma przygotować końcową dokumentację w wybranym języku, na przykład Español, Français, 简体中文, 繁體中文, العربية czy हिन्दी.
- **Change Prompt Word**:
  - **Change Prompt Word**: Pozwala zmienić słowo promptu dla wybranego zadania.
  - **Custom Prompt Word**: Wpisz własne słowo promptu dla danego zadania.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Wyłączone (domyślnie)**: Pomyślnie wygenerowane pliki są przenoszone do podfolderu o nazwie `[OriginalFolderName]_complete` względem nadrzędnego folderu oryginalnego folderu albo `Vault_complete`, jeśli oryginalny folder był korzeniem.
  - **Włączone**: Pozwala określić własną nazwę podfolderu, do którego będą przenoszone ukończone pliki.
- **Custom Output Folder Name**: Widoczne tylko po włączeniu powyższej opcji. Wpisz oczekiwaną nazwę podfolderu, na przykład `Generated Content` albo `_complete`. Niedozwolone znaki nie są akceptowane. Jeśli pole pozostanie puste, użyte zostanie `_complete`. Folder zostanie utworzony względem nadrzędnego katalogu oryginalnego folderu.

#### Przyciski przepływu pracy jednym kliknięciem
- **Visual Workflow Builder**: Twórz niestandardowe przyciski workflow z wbudowanych akcji bez ręcznego pisania DSL.
- **Custom Workflow Buttons DSL**: Zaawansowani użytkownicy nadal mogą bezpośrednio edytować tekst definicji workflow. Niepoprawny DSL bezpiecznie wraca do domyślnego workflow i pokazuje ostrzeżenie w pasku bocznym albo w UI ustawień.
- **Workflow Error Strategy**:
  - **Stop on Error (domyślnie)**: Zatrzymuje workflow natychmiast po niepowodzeniu kroku.
  - **Continue on Error**: Kontynuuje kolejne kroki i raportuje liczbę nieudanych akcji na końcu.
- **Default Workflow Included**: `One-Click Extract` łączy `Process File (Add Links)`, `Batch Generate from Titles` i `Batch Mermaid Fix`.

#### Ustawienia niestandardowych instrukcji
Ta funkcja pozwala nadpisać domyślne instrukcje, czyli prompty wysyłane do LLM dla konkretnych zadań, i zapewnia bardziej precyzyjną kontrolę nad wynikiem.

- **Enable Custom Prompts for Specific Tasks**:
  - **Wyłączone (domyślnie)**: Wtyczka używa swoich wbudowanych domyślnych promptów dla wszystkich operacji.
  - **Włączone**: Umożliwia ustawienie własnych promptów dla zadań wymienionych poniżej. To główny przełącznik tej funkcji.

- **Use Custom Prompt for [Task Name]**: Widoczne tylko po włączeniu powyższej opcji.
  - Dla każdego wspieranego zadania, takiego jak "Add Links", "Generate from Title", "Research & Summarize" czy "Extract Concepts", możesz niezależnie włączyć albo wyłączyć własny prompt.
  - **Wyłączone**: Dane zadanie używa domyślnego promptu.
  - **Włączone**: Dane zadanie używa tekstu wpisanego przez Ciebie w odpowiadającym mu polu "Custom Prompt" poniżej.

- **Custom Prompt Text Area**: Widoczne tylko wtedy, gdy włączono niestandardowy prompt dla danego zadania.
  - **Default Prompt Display**: Wtyczka pokazuje domyślny prompt dla odniesienia. Możesz użyć przycisku **"Copy Default Prompt"**, aby skopiować ten tekst jako punkt startowy dla własnego promptu.
  - **Custom Prompt Input**: To miejsce, w którym wpisujesz własne instrukcje dla LLM.
  - **Placeholders**: Możesz, a nawet powinieneś, używać specjalnych placeholderów w promptach, które wtyczka zastąpi rzeczywistą treścią przed wysłaniem żądania do LLM. Sprawdź domyślny prompt, aby zobaczyć, które placeholdery są dostępne dla każdego zadania. Typowe placeholdery obejmują:
    - `{TITLE}`: Tytuł bieżącej notatki.
    - `{RESEARCH_CONTEXT_SECTION}`: Treść zebrana z badań w sieci.
    - `{USER_PROMPT}`: Treść przetwarzanej notatki.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Zakres sprawdzania duplikatów
- **Duplicate Check Scope Mode**: Steruje tym, które pliki są porównywane z notatkami w **Concept Note Folder** pod kątem potencjalnych duplikatów.
  - **Entire Vault (domyślnie)**: Porównuje notatki pojęciowe ze wszystkimi innymi notatkami w vaultcie, z wyłączeniem samego Concept Note Folder.
  - **Include Specific Folders Only**: Porównuje notatki pojęciowe tylko z notatkami znajdującymi się w folderach podanych poniżej.
  - **Exclude Specific Folders**: Porównuje notatki pojęciowe ze wszystkimi notatkami *poza* tymi w folderach wymienionych poniżej oraz z wyłączeniem Concept Note Folder.
  - **Concept Folder Only**: Porównuje notatki pojęciowe tylko z *innymi notatkami w samym Concept Note Folder*. Pomaga to znaleźć duplikaty wyłącznie wewnątrz wygenerowanych pojęć.
- **Include/Exclude Folders**: Widoczne tylko, jeśli tryb to 'Include' albo 'Exclude'. Wpisz *ścieżki względne* folderów, które chcesz uwzględnić albo wykluczyć, **jedna ścieżka w linii**. Ścieżki rozróżniają wielkość liter i używają `/` jako separatora, na przykład `Reference Material/Papers` albo `Daily Notes`. Te foldery nie mogą być tym samym co Concept Note Folder ani znajdować się wewnątrz niego.

#### Dostawca badań sieciowych
- **Search Provider**: Wybierz `Tavily`, który wymaga klucza API i jest zalecany, albo `DuckDuckGo`, który jest eksperymentalny i często blokowany przez wyszukiwarkę przy zautomatyzowanych żądaniach. Używane do "Research & Summarize Topic" i opcjonalnie do "Generate from Title".
- **Tavily API Key**: Widoczne tylko, jeśli wybrano Tavily. Wpisz swój klucz API z [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Widoczne tylko, jeśli wybrano Tavily. Maksymalna liczba wyników, które Tavily ma zwrócić, od 1 do 20. Domyślnie: 5.
- **Tavily Search Depth**: Widoczne tylko, jeśli wybrano Tavily. Wybierz `basic` (domyślnie) albo `advanced`. Uwaga: `advanced` daje lepsze wyniki, ale kosztuje 2 kredyty API za wyszukanie zamiast 1.
- **DuckDuckGo Max Results**: Widoczne tylko, jeśli wybrano DuckDuckGo. Maksymalna liczba wyników do sparsowania, od 1 do 10. Domyślnie: 5.
- **DuckDuckGo Content Fetch Timeout**: Widoczne tylko, jeśli wybrano DuckDuckGo. Maksymalna liczba sekund oczekiwania podczas pobierania treści z każdego URL-a wyniku DuckDuckGo. Domyślnie: 15.
- **Max Research Content Tokens**: Przybliżony maksymalny limit tokenów pochodzących z połączonych wyników badań w sieci, snippetów i pobranej treści, które zostaną dołączone do promptu podsumowującego. Pomaga kontrolować rozmiar okna kontekstowego i koszt. Domyślnie: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Ukierunkowana dziedzina nauki
- **Enable Focused Learning Domain**:
  - **Wyłączone (domyślnie)**: Prompty wysyłane do LLM używają standardowych instrukcji ogólnego przeznaczenia.
  - **Włączone**: Pozwala określić jedną albo więcej dziedzin nauki, aby poprawić zrozumienie kontekstowe przez LLM.
- **Learning Domain**: Widoczne tylko po włączeniu powyższej opcji. Wpisz swoje konkretne dziedziny, na przykład `Materials Science`, `Polymer Physics` albo `Machine Learning`. Doda to na początku promptów linię "Relevant Fields: [...]", pomagając LLM generować trafniejsze linki i bardziej adekwatną treść dla Twojego obszaru badawczego.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Instrukcja użytkowania

### Szybkie przepływy pracy i pasek boczny

- Otwórz pasek boczny Notemd, aby uzyskać dostęp do pogrupowanych sekcji działań dla głównego przetwarzania, generowania, tłumaczenia, wiedzy i narzędzi pomocniczych.
- Użyj obszaru **Szybkie przepływy pracy** na górze paska bocznego, aby uruchamiać własne wieloetapowe przyciski.
- Domyślny workflow **One-Click Extract** uruchamia `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Postęp workflow, logi dla poszczególnych kroków i błędy są widoczne w pasku bocznym, z przypiętą stopką chroniącą pasek postępu i obszar logów przed zepchnięciem przez rozwinięte sekcje.
- Karta postępu utrzymuje tekst statusu, osobny wskaźnik procentowy i pozostały czas czytelne na pierwszy rzut oka, a te same niestandardowe workflow można rekonfigurować z poziomu ustawień.

### Oryginalne przetwarzanie (dodawanie wiki-linków)
To główna funkcjonalność skupiająca się na identyfikowaniu pojęć i dodawaniu `[[wiki-links]]`.

**Ważne:** Ten proces działa wyłącznie na plikach `.md` albo `.txt`. Przed dalszym przetwarzaniem możesz bezpłatnie przekonwertować pliki PDF do MD przy użyciu [Mineru](https://github.com/opendatalab/MinerU).

1. **Korzystanie z paska bocznego**:
   - Otwórz Notemd Sidebar przez ikonę różdżki albo paletę poleceń.
   - Otwórz plik `.md` albo `.txt`.
   - Kliknij **"Process File (Add Links)"**.
   - Aby przetworzyć folder: kliknij **"Process Folder (Add Links)"**, wybierz folder i kliknij "Process".
   - Postęp jest widoczny na pasku bocznym. Zadanie można anulować przyciskiem "Cancel Processing" na pasku bocznym.
   - *Uwaga dla przetwarzania folderów:* Pliki są przetwarzane w tle bez otwierania ich w edytorze.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Korzystanie z palety poleceń** (`Ctrl+P` albo `Cmd+P`):
   - **Pojedynczy plik**: Otwórz plik i uruchom `Notemd: Process Current File`.
   - **Folder**: Uruchom `Notemd: Process Folder`, a następnie wybierz folder. Pliki są przetwarzane w tle bez otwierania ich w edytorze.
   - Dla akcji wywoływanych z palety poleceń pojawia się modal postępu, który zawiera przycisk anulowania.
   - *Uwaga:* wtyczka automatycznie usuwa początkowe linie `\boxed{` i końcowe linie `}` z końcowej przetworzonej treści przed zapisem, jeśli takie występują.

### Nowe funkcje

1. **Podsumuj jako diagram Mermaid**:
   - Otwórz notatkę, którą chcesz podsumować.
   - Uruchom komendę `Notemd: Summarise as Mermaid diagram` z palety poleceń albo przyciskiem na pasku bocznym.
   - Wtyczka wygeneruje nową notatkę z diagramem Mermaid.

2. **Translate Note/Selection**:
   - Zaznacz tekst w notatce, jeśli chcesz przetłumaczyć tylko zaznaczenie, albo uruchom komendę bez zaznaczenia, aby przetłumaczyć całą notatkę.
   - Uruchom komendę `Notemd: Translate Note/Selection` z palety poleceń albo przyciskiem na pasku bocznym.
   - Pojawi się modal, w którym możesz potwierdzić albo zmienić **Target Language**; domyślna wartość pochodzi z ustawienia z konfiguracji.
   - Wtyczka używa skonfigurowanego **LLM Provider** zgodnie z ustawieniami Multi-Model do wykonania tłumaczenia.
   - Przetłumaczona treść jest zapisywana w skonfigurowanym **Translation Save Path** z odpowiednim sufiksem i otwierana w **nowym panelu po prawej stronie** oryginalnej treści, aby ułatwić porównanie.
   - To zadanie można anulować przyciskiem na pasku bocznym albo przyciskiem anulowania w modalu.
3. **Tłumaczenie wsadowe**:
   - Uruchom komendę `Notemd: Batch Translate Folder` z palety poleceń i wybierz folder albo kliknij prawym przyciskiem folder w eksploratorze plików i wybierz "Batch translate this folder".
   - Wtyczka przetłumaczy wszystkie pliki Markdown w wybranym folderze.
   - Przetłumaczone pliki są zapisywane w skonfigurowanej ścieżce tłumaczenia, ale nie są otwierane automatycznie.
   - Proces ten można anulować w modalu postępu.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Zaznacz tekst w notatce albo upewnij się, że notatka ma tytuł, który posłuży jako temat wyszukiwania.
   - Uruchom komendę `Notemd: Research and Summarize Topic` z palety poleceń albo przyciskiem na pasku bocznym.
   - Wtyczka używa skonfigurowanego **Search Provider** (Tavily albo DuckDuckGo) oraz właściwego **LLM Provider** zgodnie z ustawieniami Multi-Model, aby znaleźć i podsumować informacje.
   - Podsumowanie jest dopisywane do bieżącej notatki.
   - To zadanie można anulować przyciskiem na pasku bocznym albo przyciskiem anulowania w modalu.
   - *Uwaga:* Wyszukiwanie DuckDuckGo może zawodzić z powodu wykrywania botów. Tavily jest zalecane.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Otwórz notatkę, może być pusta.
   - Uruchom komendę `Notemd: Generate Content from Title` z palety poleceń albo przyciskiem na pasku bocznym.
   - Wtyczka używa właściwego **LLM Provider** zgodnie z ustawieniami Multi-Model, aby wygenerować treść na podstawie tytułu notatki i zastąpić nią istniejącą zawartość.
   - Jeśli ustawienie **"Enable Research in 'Generate from Title'"** jest włączone, najpierw wykonywane jest badanie w sieci przez skonfigurowanego **Web Research Provider**, a jego wyniki są dołączane jako kontekst do promptu wysyłanego do LLM.
   - To zadanie można anulować przyciskiem na pasku bocznym albo przyciskiem anulowania w modalu.

5. **Batch Generate Content from Titles**:
   - Uruchom komendę `Notemd: Batch Generate Content from Titles` z palety poleceń albo przyciskiem na pasku bocznym.
   - Wybierz folder zawierający notatki do przetworzenia.
   - Wtyczka przechodzi przez każdy plik `.md` w folderze, z wyłączeniem plików `_processed.md` i plików w docelowym folderze "complete", generując treść na podstawie tytułu notatki i zastępując istniejącą zawartość. Pliki są przetwarzane w tle bez otwierania ich w edytorze.
   - Pomyślnie przetworzone pliki są przenoszone do skonfigurowanego folderu "complete".
   - Komenda respektuje ustawienie **"Enable Research in 'Generate from Title'"** dla każdej przetwarzanej notatki.
   - To zadanie można anulować przyciskiem na pasku bocznym albo przyciskiem anulowania w modalu.
   - Postęp i wyniki, takie jak liczba zmodyfikowanych plików i błędy, są pokazywane w logu paska bocznego albo modalu.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Upewnij się, że **Concept Note Folder Path** jest poprawnie skonfigurowane w ustawieniach.
   - Uruchom `Notemd: Check and Remove Duplicate Concept Notes` z palety poleceń albo przyciskiem na pasku bocznym.
   - Wtyczka skanuje folder z notatkami pojęciowymi i porównuje nazwy plików z notatkami spoza tego folderu według kilku reguł, takich jak dokładne dopasowanie, liczba mnoga, normalizacja i zawieranie.
   - Jeśli zostaną wykryte potencjalne duplikaty, pojawi się modal z listą plików, przyczyną oznaczenia i konfliktującymi plikami.
   - Dokładnie przejrzyj listę. Kliknij **"Delete Files"**, aby przenieść wymienione pliki do systemowego kosza, albo **"Cancel"**, aby nic nie robić.
   - Postęp i wyniki są pokazywane w logu paska bocznego albo modalu.

7. **Extract Concepts (Pure Mode)**:
   - Ta funkcja pozwala wyodrębniać pojęcia z dokumentu i tworzyć odpowiadające im notatki pojęciowe *bez* modyfikowania oryginalnego pliku. To świetne rozwiązanie do szybkiego rozwijania bazy wiedzy na podstawie zestawu dokumentów.
   - **Pojedynczy plik**: Otwórz plik i uruchom komendę `Notemd: Extract concepts (create concept notes only)` z palety poleceń albo kliknij przycisk **"Extract concepts (current file)"** na pasku bocznym.
   - **Folder**: Uruchom komendę `Notemd: Batch extract concepts from folder` z palety poleceń albo kliknij przycisk **"Extract concepts (folder)"** na pasku bocznym i wybierz folder do przetworzenia.
   - Wtyczka odczytuje pliki, identyfikuje pojęcia i tworzy dla nich nowe notatki w określonym **Concept Note Folder**, pozostawiając oryginalne pliki bez zmian.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Ta potężna komenda usprawnia tworzenie i uzupełnianie nowych notatek pojęciowych.
   - Zaznacz słowo albo frazę w edytorze.
   - Uruchom komendę `Notemd: Create Wiki-Link & Generate Note from Selection`; zaleca się przypisanie do niej skrótu klawiaturowego, na przykład `Cmd+Shift+W`.
   - Wtyczka wykona:
     1. Zastąpienie zaznaczonego tekstu `[[wiki-link]]`.
     2. Sprawdzenie, czy notatka o takim tytule już istnieje w **Concept Note Folder**.
     3. Jeśli istnieje, dodanie backlinku do bieżącej notatki.
     4. Jeśli nie istnieje, utworzenie nowej pustej notatki.
     5. Następnie automatyczne uruchomienie komendy **"Generate Content from Title"** dla nowej albo istniejącej notatki i uzupełnienie jej treścią wygenerowaną przez AI.

9. **Extract Concepts and Generate Titles**:
   - Ta komenda łączy dwie potężne funkcje w jeden płynny workflow.
   - Uruchom komendę `Notemd: Extract Concepts and Generate Titles` z palety poleceń; zaleca się przypisanie do niej skrótu klawiaturowego.
   - Wtyczka wykona:
     1. Najpierw zadanie **"Extract concepts (current file)"** na aktualnie aktywnym pliku.
     2. Następnie automatycznie uruchomi zadanie **"Batch generate from titles"** na folderze skonfigurowanym w ustawieniach jako **Concept note folder path**.
   - Pozwala to najpierw zasilić bazę wiedzy nowymi pojęciami z dokumentu źródłowego, a następnie od razu rozbudować nowe notatki pojęciowe treścią wygenerowaną przez AI w jednym kroku.

10. **Extract Specific Original Text**:
   - Skonfiguruj pytania w ustawieniach w sekcji "Extract Specific Original Text".
   - Użyj przycisku "Extract Specific Original Text" na pasku bocznym, aby przetworzyć aktywny plik.
   - **Merged Mode**: Przyspiesza przetwarzanie, wysyłając wszystkie pytania w jednym promptcie.
   - **Translation**: Opcjonalnie tłumaczy wyodrębniony tekst na skonfigurowany język.
   - **Custom Output**: Konfigurujesz miejsce i sposób zapisu pliku wyjściowego.

11. **Batch Mermaid Fix**:
   - Użyj przycisku "Batch Mermaid Fix" na pasku bocznym, aby przeskanować folder i naprawić typowe błędy składni Mermaid.
   - Wtyczka zgłosi pliki nadal zawierające błędy w pliku `mermaid_error_{foldername}.md`.
   - Możesz opcjonalnie skonfigurować wtyczkę tak, aby przenosiła problematyczne pliki do osobnego folderu do przeglądu.

## Obsługiwani dostawcy LLM

| Dostawca | Typ | Wymagany klucz API | Uwagi |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Chmura  | Tak                    | Natywny endpoint DeepSeek z obsługą modeli reasoning                  |
| Qwen               | Chmura  | Tak                    | Preset DashScope compatible-mode dla modeli Qwen / QwQ                |
| Qwen Code          | Chmura  | Tak                    | Preset DashScope skupiony na modelach koderskich Qwen                 |
| Doubao             | Chmura  | Tak                    | Preset Volcengine Ark; pole model zwykle ustawiasz na ID endpointu    |
| Moonshot           | Chmura  | Tak                    | Oficjalny endpoint Kimi / Moonshot                                    |
| GLM                | Chmura  | Tak                    | Oficjalny endpoint Zhipu BigModel zgodny z OpenAI-compatible          |
| Z AI               | Chmura  | Tak                    | Międzynarodowy endpoint GLM/Zhipu zgodny z OpenAI-compatible; uzupełnia `GLM` |
| MiniMax            | Chmura  | Tak                    | Oficjalny endpoint MiniMax chat-completions                           |
| Huawei Cloud MaaS  | Chmura  | Tak                    | Endpoint Huawei ModelArts MaaS zgodny z OpenAI-compatible dla hostowanych modeli |
| Baidu Qianfan      | Chmura  | Tak                    | Oficjalny endpoint Qianfan zgodny z OpenAI-compatible dla modeli ERNIE |
| SiliconFlow        | Chmura  | Tak                    | Oficjalny endpoint SiliconFlow zgodny z OpenAI-compatible dla hostowanych modeli OSS |
| OpenAI             | Chmura  | Tak                    | Obsługuje modele GPT i serię o                                        |
| Anthropic          | Chmura  | Tak                    | Obsługuje modele Claude                                               |
| Google             | Chmura  | Tak                    | Obsługuje modele Gemini                                               |
| Mistral            | Chmura  | Tak                    | Obsługuje rodziny Mistral i Codestral                                 |
| Azure OpenAI       | Chmura  | Tak                    | Wymaga Endpoint, API Key, deployment name i API Version               |
| OpenRouter         | Bramka  | Tak                    | Dostęp do wielu dostawców przez identyfikatory modeli OpenRouter      |
| xAI                | Chmura  | Tak                    | Natywny endpoint Grok                                                 |
| Groq               | Chmura  | Tak                    | Szybka inferencja OpenAI-compatible dla hostowanych modeli OSS        |
| Together           | Chmura  | Tak                    | Endpoint OpenAI-compatible dla hostowanych modeli OSS                 |
| Fireworks          | Chmura  | Tak                    | Endpoint inferencyjny OpenAI-compatible                               |
| Requesty           | Bramka  | Tak                    | Router multi-provider za jednym kluczem API                           |
| OpenAI Compatible  | Bramka  | Opcjonalny             | Ogólny preset dla LiteLLM, vLLM, Perplexity, Vercel AI Gateway itd.   |
| LMStudio           | Lokalny | Opcjonalny (`EMPTY`)   | Uruchamia modele lokalnie przez serwer LM Studio                      |
| Ollama             | Lokalny | Nie                    | Uruchamia modele lokalnie przez serwer Ollama                         |

*Uwaga: W przypadku lokalnych dostawców, LMStudio i Ollama, upewnij się, że odpowiednia aplikacja serwerowa działa i jest osiągalna pod skonfigurowanym Base URL.*
*Uwaga: Dla OpenRouter i Requesty używaj identyfikatora modelu z prefiksem dostawcy albo pełnego ID modelu pokazywanego przez gateway, na przykład `google/gemini-flash-1.5` albo `anthropic/claude-3-7-sonnet-latest`.*
*Uwaga: `Doubao` zwykle oczekuje w polu model identyfikatora endpointu albo deploymentu Ark, a nie surowej nazwy rodziny modeli. Ekran ustawień ostrzega teraz, gdy nadal wpisana jest wartość placeholderowa, i blokuje connection tests, dopóki nie zastąpisz jej prawdziwym ID endpointu.*
*Uwaga: `Z AI` wskazuje na międzynarodową linię `api.z.ai`, a `GLM` zachowuje endpoint BigModel dla Chin kontynentalnych. Wybierz preset zgodny z regionem konta.*
*Uwaga: Presety zorientowane na rynek chiński używają testów połączenia typu chat-first, tak aby test walidował faktycznie skonfigurowany model albo deployment, a nie tylko dostępność klucza API.*
*Uwaga: `OpenAI Compatible` jest przeznaczony dla niestandardowych gatewayów i proxy. Ustaw Base URL, politykę klucza API i model ID zgodnie z dokumentacją dostawcy.*

## Użycie sieci i obsługa danych

Notemd działa lokalnie wewnątrz Obsidiana, ale niektóre funkcje wysyłają żądania na zewnątrz.

### Wywołania dostawców LLM (konfigurowalne)

- Trigger: przetwarzanie plików, generowanie, tłumaczenie, podsumowania badań, podsumowania Mermaid oraz akcje połączeń i diagnostyki.
- Endpoint: skonfigurowane w ustawieniach Notemd bazowe URL-e dostawców.
- Wysyłane dane: tekst promptu oraz treść zadania wymagana do przetwarzania.
- Uwaga o obsłudze danych: klucze API są konfigurowane lokalnie w ustawieniach wtyczki i używane do podpisywania żądań z Twojego urządzenia.

### Wywołania badań sieciowych (opcjonalne)

- Trigger: gdy badania w sieci są włączone i wybrany jest dostawca wyszukiwania.
- Endpoint: Tavily API albo endpointy DuckDuckGo.
- Wysyłane dane: Twoje zapytanie badawcze oraz wymagane metadane żądania.

### Diagnostyka deweloperska i dzienniki śledzenia błędów (opcjonalne)

- Trigger: API debug mode i akcje diagnostyczne dewelopera.
- Przechowywanie: logi diagnostyczne i błędów są zapisywane w katalogu głównym vaultu, na przykład `Notemd_Provider_Diagnostic_*.txt` i `Notemd_Error_Log_*.txt`.
- Uwaga o ryzyku: logi mogą zawierać fragmenty żądań i odpowiedzi. Przed publicznym udostępnieniem przejrzyj ich treść.

### Pamięć lokalna

- Konfiguracja wtyczki jest zapisywana w `.obsidian/plugins/notemd/data.json`.
- Wygenerowane pliki, raporty i opcjonalne logi są przechowywane w vaultcie zgodnie z Twoimi ustawieniami.

## Rozwiązywanie problemów

### Typowe problemy
- **Wtyczka się nie ładuje**: Upewnij się, że `manifest.json`, `main.js` i `styles.css` znajdują się we właściwym folderze, czyli `<Vault>/.obsidian/plugins/notemd/`, i uruchom Obsidiana ponownie. Sprawdź Developer Console (`Ctrl+Shift+I` albo `Cmd+Option+I`) pod kątem błędów przy starcie.
- **Błędy przetwarzania / błędy API**:
  1. **Sprawdź format pliku**: Upewnij się, że plik, który chcesz przetworzyć albo sprawdzić, ma rozszerzenie `.md` albo `.txt`. Notemd obecnie obsługuje tylko te tekstowe formaty.
  2. Użyj komendy albo przycisku "Test LLM Connection", aby zweryfikować ustawienia aktywnego dostawcy.
  3. Ponownie sprawdź API Key, Base URL, Model Name i API Version (dla Azure). Upewnij się, że klucz API jest poprawny i ma odpowiednie kredyty albo uprawnienia.
  4. Upewnij się, że lokalny serwer LLM (LMStudio albo Ollama) działa, a Base URL jest poprawny, na przykład `http://localhost:1234/v1` dla LM Studio.
  5. Sprawdź połączenie z internetem w przypadku dostawców chmurowych.
  6. **Dla błędów przetwarzania pojedynczego pliku:** Przejrzyj Developer Console, aby zobaczyć szczegółowe komunikaty błędów. W razie potrzeby skopiuj je przyciskiem z modalu błędu.
  7. **Dla błędów przetwarzania wsadowego:** Sprawdź plik `error_processing_filename.log` w katalogu głównym vaultu, aby zobaczyć szczegółowe błędy dla każdego nieudanego pliku. Developer Console albo modal błędu mogą pokazywać jedynie podsumowanie albo ogólny błąd batcha.
  8. **Automatyczne logi błędów:** Jeśli proces się nie powiedzie, wtyczka automatycznie zapisuje szczegółowy plik logu o nazwie `Notemd_Error_Log_[Timestamp].txt` w katalogu głównym vaultu. Plik zawiera komunikat błędu, ślad stosu i logi sesji. Jeśli problemy się powtarzają, sprawdź ten plik. Po włączeniu "API Error Debugging Mode" w ustawieniach log będzie zawierał jeszcze bardziej szczegółowe dane odpowiedzi API.
  9. **Diagnostyka długich żądań do realnego endpointu (dla deweloperów)**:
     - Ścieżka wewnątrz wtyczki (zalecana jako pierwsza): użyj **Settings -> Notemd -> Developer provider diagnostic (long request)**, aby uruchomić próbę runtime dla aktywnego dostawcy i wygenerować `Notemd_Provider_Diagnostic_*.txt` w katalogu głównym vaultu.
     - Ścieżka CLI (poza runtime Obsidiana): dla powtarzalnego porównania na poziomie endpointu między zachowaniem buforowanym i streamowanym użyj:
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
       Wygenerowany raport zawiera czasy dla każdej próby (`First Byte`, `Duration`), oczyszczone metadane żądań, nagłówki odpowiedzi, surowe albo częściowe fragmenty treści odpowiedzi, sparsowane fragmenty strumienia i miejsca awarii na warstwie transportu.
- **Problemy z połączeniem LM Studio/Ollama**:
  - **Test połączenia kończy się błędem**: Upewnij się, że lokalny serwer (LM Studio albo Ollama) działa, a odpowiedni model jest załadowany albo dostępny.
  - **Błędy CORS (Ollama na Windowsie)**: Jeśli podczas używania Ollama na Windowsie pojawiają się błędy CORS (Cross-Origin Resource Sharing), może być konieczne ustawienie zmiennej środowiskowej `OLLAMA_ORIGINS`. Możesz to zrobić, uruchamiając `set OLLAMA_ORIGINS=*` w wierszu poleceń przed startem Ollama. Umożliwia to żądania z dowolnego origin.
  - **Włącz CORS w LM Studio**: W przypadku LM Studio możesz włączyć CORS bezpośrednio w ustawieniach serwera, co może być niezbędne, jeśli Obsidian działa w przeglądarce albo ma restrykcyjne zasady origin.
- **Błędy tworzenia folderów ("File name cannot contain...")**:
  - Zwykle oznacza to, że ścieżka podana w ustawieniach (**Processed File Folder Path** albo **Concept Note Folder Path**) jest *nieprawidłowa z punktu widzenia Obsidiana*.
  - **Upewnij się, że używasz ścieżek względnych**, na przykład `Processed` albo `Notes/Concepts`, a **nie ścieżek bezwzględnych**, takich jak `C:\Users\...` albo `/Users/...`.
  - Sprawdź niedozwolone znaki: `* " \ / < > : | ? # ^ [ ]`. Pamiętaj, że `\` jest nieprawidłowe nawet na Windowsie dla ścieżek Obsidiana. Używaj `/` jako separatora.
- **Problemy z wydajnością**: Przetwarzanie dużych plików albo wielu plików może zająć sporo czasu. Zmniejsz ustawienie "Chunk Word Count", jeśli chcesz potencjalnie szybszych, ale częstszych wywołań API. Spróbuj innego dostawcy LLM albo modelu.
- **Nieoczekiwane linkowanie**: Jakość linkowania w dużym stopniu zależy od LLM i promptu. Eksperymentuj z różnymi modelami albo ustawieniami temperatury.

## Współtworzenie

Wkład jest mile widziany. Wskazówki znajdziesz w repozytorium GitHub: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumentacja dla opiekunów

- [Przepływ wydania (angielski)](./docs/maintainer/release-workflow.md)
- [Przepływ wydania (uproszczony chiński)](./docs/maintainer/release-workflow.zh-CN.md)

## Licencja

MIT License - szczegóły znajdują się w pliku [LICENSE](LICENSE).

---


*Notemd v1.8.3 - Rozwijaj swój graf wiedzy w Obsidianie dzięki AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
