![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd untuk Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Baca dokumentasi dalam lebih banyak bahasa: [Pusat Bahasa](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Peningkatan pangkalan pengetahuan berbilang bahasa dengan AI
==================================================
```

Cara mudah untuk membina pangkalan pengetahuan anda sendiri.

Notemd meningkatkan aliran kerja Obsidian anda dengan menyepadukan pelbagai Large Language Model (LLM) untuk memproses nota berbilang bahasa anda, menjana wiki-link secara automatik untuk konsep utama, mencipta nota konsep yang sepadan, menjalankan penyelidikan web, dan membantu anda membina graf pengetahuan yang kukuh.

**Versi:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Kandungan

- [Permulaan Pantas](#permulaan-pantas)
- [Sokongan Bahasa](#sokongan-bahasa)
- [Ciri-ciri](#ciri-ciri)
- [Pemasangan](#pemasangan)
- [Konfigurasi](#konfigurasi)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Penyedia LLM yang Disokong](#penyedia-llm-yang-disokong)
- [Penggunaan Rangkaian & Pengendalian Data](#penggunaan-rangkaian--pengendalian-data)
- [Penyelesaian Masalah](#penyelesaian-masalah)
- [Sumbangan](#sumbangan)
- [Dokumen Penyelenggara](#dokumen-penyelenggara)
- [Lesen](#lesen)

## Permulaan Pantas

1. **Pasang & Aktifkan**: Dapatkan plugin daripada Obsidian Marketplace.
2. **Konfigurasi LLM**: Pergi ke `Settings -> Notemd`, pilih penyedia LLM anda, seperti OpenAI atau penyedia tempatan seperti Ollama, lalu masukkan API key atau URL anda.
3. **Buka Bar Sisi**: Klik ikon tongkat sihir Notemd di ribbon kiri untuk membuka bar sisi.
4. **Proses Nota**: Buka mana-mana nota dan klik **"Process File (Add Links)"** di bar sisi untuk menambah `[[wiki-links]]` secara automatik kepada konsep utama.
5. **Jalankan Quick Workflow**: Gunakan butang lalai **"One-Click Extract"** untuk merangkai pemprosesan, penjanaan batch, dan pembersihan Mermaid daripada satu titik masuk.

Siap. Terokai tetapan untuk membuka lebih banyak ciri seperti penyelidikan web, terjemahan, dan penjanaan kandungan.

## Sokongan Bahasa

### Kontrak Tingkah Laku Bahasa

| Aspek | Skop | Lalai | Nota |
|---|---|---|---|
| `Bahasa Antaramuka` | Teks UI plugin sahaja, seperti tetapan, bar sisi, notis, dan dialog | `auto` | Mengikut locale Obsidian; katalog UI semasa ialah `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, dan `zh-TW`. |
| `Bahasa Output Tugasan` | Output tugas yang dijana oleh LLM, seperti pautan, ringkasan, penjanaan, pengekstrakan, dan sasaran terjemahan | `en` | Boleh diset secara global atau per tugas apabila `Gunakan bahasa berbeza untuk tugas` diaktifkan. |
| `Nyahaktifkan terjemahan automatik` | Tugas bukan Translate mengekalkan konteks bahasa sumber | `false` | Tugas `Translate` yang eksplisit tetap memaksa bahasa sasaran yang dikonfigurasi. |
| Locale sandaran | Resolusi key UI yang hilang | locale -> `en` | Memastikan UI kekal stabil apabila sebahagian key belum diterjemahkan. |

- Dokumen sumber yang diselenggara ialah bahasa Inggeris dan Cina Ringkas, dan terjemahan README yang telah diterbitkan dipautkan pada pengepala di atas.
- Liputan UI locale dalam aplikasi kini sepadan tepat dengan katalog eksplisit dalam kod: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Fallback bahasa Inggeris kekal sebagai jaringan keselamatan pelaksanaan, tetapi permukaan UI yang disokong dilindungi oleh regression tests dan tidak sepatutnya senyap-senyap kembali ke bahasa Inggeris dalam penggunaan biasa.
- Butiran lanjut dan garis panduan sumbangan dijejak dalam [Pusat Bahasa](./docs/i18n/README.md).

## Ciri-ciri

### Pemprosesan Dokumen Berkuasa AI
- **Sokongan Multi-LLM**: Sambung ke pelbagai penyedia LLM awan dan tempatan. Lihat [Penyedia LLM yang Disokong](#penyedia-llm-yang-disokong).
- **Smart Chunking**: Dokumen besar dibahagikan secara automatik kepada chunk yang mudah diurus berdasarkan bilangan perkataan.
- **Pemeliharaan Kandungan**: Berusaha mengekalkan format asal sambil menambah struktur dan pautan.
- **Penjejakan Kemajuan**: Kemas kini masa nyata melalui Notemd Sidebar atau progress modal.
- **Operasi Boleh Dibatalkan**: Setiap tugas pemprosesan yang dimulakan dari bar sisi boleh dibatalkan melalui butang cancel khusus. Operasi dari command palette menggunakan modal yang juga boleh dibatalkan.
- **Konfigurasi Multi-Model**: Gunakan penyedia LLM yang berbeza dan model khusus untuk tugas yang berlainan, seperti Add Links, Research, Generate Title, dan Translate, atau guna satu penyedia untuk semuanya.
- **Stable API Calls (Retry Logic)**: Anda boleh mengaktifkan retry automatik untuk panggilan API LLM yang gagal dengan selang dan had cubaan yang boleh dikonfigurasi.
- **Ujian Sambungan Penyedia yang Lebih Tahan**: Jika ujian sambungan pertama gagal kerana gangguan rangkaian sementara, Notemd akan bertukar kepada stable retry sequence sebelum menandakan kegagalan. Ini meliputi OpenAI-compatible, Anthropic, Google, Azure OpenAI, dan Ollama.
- **Fallback Transport Mengikut Runtime**: Apabila request panjang ke penyedia diputuskan pada `requestUrl` disebabkan ralat rangkaian sementara seperti `ERR_CONNECTION_CLOSED`, Notemd akan mengulang attempt yang sama melalui fallback transport berdasarkan persekitaran. Build desktop menggunakan Node `http/https`, manakala persekitaran bukan desktop menggunakan browser `fetch`. Ini mengurangkan false failure pada gateway yang perlahan dan reverse proxy.
- **Pengukuhan Rantaian Permintaan Panjang untuk OpenAI-Compatible**: Dalam stable mode, panggilan OpenAI-compatible kini menggunakan susunan tiga peringkat yang jelas bagi setiap attempt: direct streaming transport, direct non-stream transport, kemudian `requestUrl` fallback, yang masih boleh dinaik taraf kepada streamed parsing jika perlu. Ini mengurangkan false negative apabila penyedia menyiapkan buffered responses tetapi saluran streaming tidak stabil.
- **Protocol-Aware Streaming Fallback Merentasi API LLM**: Fallback attempt untuk permintaan panjang kini menggunakan streamed parsing yang memahami protokol pada semua laluan LLM terbina dalam, bukan hanya endpoint OpenAI-compatible. Notemd kini mengendalikan OpenAI/Azure SSE, Anthropic Messages streaming, Google Gemini SSE, dan Ollama NDJSON, sama ada melalui `http/https` desktop atau `fetch` bukan desktop, dan entrypoint lain gaya OpenAI menggunakan fallback path yang sama.
- **Preset Sedia Diguna untuk Penyedia China**: Preset terbina dalam kini merangkumi `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, dan `SiliconFlow`, di samping penyedia global dan tempatan yang sedia ada.
- **Pemprosesan Batch yang Andal**: Logik concurrent processing ditambah baik dengan **staggered API calls** untuk mengelakkan rate limiting dan memastikan prestasi stabil pada batch job yang besar. Tugas kini dimulakan pada sela masa yang berbeza, bukannya serentak.
- **Pelaporan Kemajuan yang Tepat**: Pepijat yang menyebabkan progress bar boleh tersekat telah diperbaiki, jadi UI kini sentiasa mencerminkan status sebenar operasi.
- **Parallel Batch Processing yang Lebih Kukuh**: Masalah yang menyebabkan operasi batch selari terhenti terlalu awal telah diselesaikan, jadi semua fail kini diproses dengan lebih andal dan cekap.
- **Ketepatan Progress Bar**: Pepijat yang menyebabkan progress bar untuk perintah "Create Wiki-Link & Generate Note" tersekat pada 95% telah diperbaiki, dan kini ia memaparkan 100% apabila selesai.
- **API Debugging yang Dipertingkatkan**: "API Error Debugging Mode" kini menangkap full response body daripada penyedia LLM dan perkhidmatan carian, seperti Tavily dan DuckDuckGo, serta merekodkan timeline transport bagi setiap attempt dengan request URL yang telah disanitasi, tempoh, response headers, partial response body, parsed partial stream output, dan stack traces untuk memudahkan troubleshooting pada laluan OpenAI-compatible, Anthropic, Google, Azure OpenAI, dan Ollama fallback.
- **Panel Developer Mode**: Tetapan kini mempunyai panel diagnostik khas untuk developer yang kekal tersembunyi sehingga "Developer mode" diaktifkan. Panel ini menyokong pemilihan diagnostic call path dan menjalankan repeated stability probe untuk mod yang dipilih.
- **Sidebar Direka Semula**: Aksi terbina dalam dikumpulkan ke dalam section yang lebih fokus dengan label yang lebih jelas, status langsung, kemajuan yang boleh dibatalkan, dan log yang boleh disalin untuk mengurangkan kekusutan dalam bar sisi. Footer progress dan log kekal kelihatan walaupun semua section dibuka.
- **Penyempurnaan Interaksi & Keterbacaan Sidebar**: Butang sidebar kini memberikan maklum balas hover, press, dan focus yang lebih jelas, dan butang CTA berwarna, termasuk `One-Click Extract` dan `Batch generate from titles`, mempunyai kontras teks yang lebih kuat untuk keterbacaan yang lebih baik merentas tema.
- **Single-File CTA Mapping**: Gaya CTA berwarna kini dikhususkan hanya untuk aksi single-file. Aksi batch atau peringkat folder dan workflow campuran menggunakan gaya non-CTA untuk mengurangkan salah klik berkaitan skop aksi.
- **Custom One-Click Workflows**: Tukarkan utiliti bar sisi terbina dalam menjadi butang yang boleh digunakan semula dengan nama tersuai dan rangkaian aksi yang dipasang sendiri. Workflow lalai `One-Click Extract` sudah tersedia terus.

### Peningkatan Graf Pengetahuan
- **Automatic Wiki-Linking**: Mengenal pasti konsep teras dan menambah `[[wiki-links]]` ke dalam nota yang diproses berdasarkan output LLM.
- **Penciptaan Nota Konsep yang Opsional & Boleh Dikustomisasi**: Mencipta nota baharu secara automatik untuk konsep yang ditemui dalam folder vault yang anda tentukan.
- **Customizable Output Paths**: Tetapkan laluan relatif berasingan di dalam vault untuk menyimpan processed files dan nota konsep baharu.
- **Customizable Output Filenames (Add Links)**: Anda boleh memilih untuk **menimpa fail asal** atau menggunakan suffix atau replacement string tersuai sebagai ganti `_processed.md` ketika memproses fail bagi menambah pautan.
- **Link Integrity Maintenance**: Terdapat pengendalian asas untuk mengemas kini pautan apabila nota dinamakan semula atau dipadam di dalam vault.
- **Pure Concept Extraction**: Ekstrak konsep dan cipta nota konsep berkaitan tanpa mengubah dokumen asal. Ini sesuai untuk mengisi knowledge base daripada dokumen sedia ada tanpa menyentuh fail sumber. Ciri ini mempunyai pilihan untuk mencipta nota konsep minimum dan menambah backlink.

### Terjemahan

- **AI-Powered Translation**:
  - Menterjemah kandungan nota menggunakan LLM yang dikonfigurasi.
  - **Sokongan Fail Besar**: Fail besar dibahagikan secara automatik kepada chunk yang lebih kecil berdasarkan `Chunk word count` sebelum dihantar ke LLM, kemudian hasil terjemahan digabung semula dengan lancar menjadi satu dokumen.
  - Menyokong terjemahan antara pelbagai bahasa.
  - Bahasa sasaran boleh dikustomisasi daripada tetapan atau UI.
  - Teks terjemahan boleh dibuka secara automatik di pane sebelah kanan teks asal untuk memudahkan perbandingan.
- **Terjemahan kelompok**:
  - Menterjemah semua fail dalam folder yang dipilih.
  - Menyokong pemprosesan selari jika "Enable Batch Parallelism" diaktifkan.
  - Menggunakan custom prompts untuk terjemahan jika sudah dikonfigurasi.
  - Menambah pilihan "Batch translate this folder" ke menu konteks file explorer.
- **Nyahaktifkan terjemahan automatik**: Jika diaktifkan, tugas bukan Translate tidak lagi memaksa output ke bahasa tertentu, jadi konteks bahasa asal kekal terpelihara. Tugas `Translate` yang eksplisit tetap menterjemah mengikut konfigurasi.

### Penyelidikan Web & Penjanaan Kandungan
- **Penyelidikan Web & Ringkasan**:
  - Jalankan carian web menggunakan Tavily (memerlukan API key) atau DuckDuckGo (eksperimen).
  - **Ketahanan Carian yang Dipertingkatkan**: Carian DuckDuckGo kini menggunakan logik parsing yang lebih kukuh (DOMParser dengan Regex fallback) bagi menangani perubahan susun atur dan memastikan hasil yang lebih andal.
  - Ringkaskan hasil carian menggunakan LLM yang dikonfigurasi.
  - Bahasa output ringkasan boleh dikustomisasi dalam tetapan.
  - Tambahkan ringkasan ke nota semasa.
  - Had token yang boleh dikonfigurasi untuk kandungan penyelidikan yang dihantar ke LLM.
- **Penjanaan Kandungan daripada Tajuk**:
  - Gunakan tajuk nota untuk menjana kandungan awal melalui LLM dengan menggantikan kandungan sedia ada.
  - **Penyelidikan Opsional**: Konfigurasikan sama ada hendak menjalankan penyelidikan web terlebih dahulu menggunakan penyedia yang dipilih untuk memberi konteks kepada penjanaan.
- **Batch Content Generation from Titles**: Jana kandungan untuk semua nota dalam folder yang dipilih berdasarkan tajuk masing-masing, dengan mematuhi tetapan penyelidikan opsional. Fail yang berjaya diproses akan dipindahkan ke **subfolder "complete" yang boleh dikonfigurasi**, contohnya `[foldername]_complete` atau nama tersuai, untuk mengelakkan pemprosesan semula.
- **Mermaid Auto-Fix Coupling**: Apabila Mermaid auto-fix diaktifkan, workflow berkaitan Mermaid akan membaiki fail atau folder output yang dijana selepas pemprosesan. Ini merangkumi Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, dan Translate.

### Ciri Utiliti
- **Ringkaskan sebagai diagram Mermaid**:
  - Ciri ini membolehkan anda meringkaskan kandungan nota ke dalam rajah Mermaid.
  - Bahasa output rajah Mermaid boleh dikustomisasi dalam tetapan.
  - **Mermaid Output Folder**: Konfigurasikan folder tempat fail rajah Mermaid yang dijana akan disimpan.
  - **Translate Summarize to Mermaid Output**: Terjemahkan kandungan Mermaid yang dijana secara opsional ke bahasa sasaran yang dikonfigurasi.
  -
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Simple Formula Format Correction**:
  - Membetulkan formula matematik satu baris yang dibatasi oleh `$` tunggal kepada blok `$$` berganda standard.
  - **Single File**: Proses fail semasa melalui butang bar sisi atau command palette.
  - **Batch Fix**: Proses semua fail dalam folder yang dipilih melalui butang bar sisi atau command palette.

- **Check for Duplicates in Current File**: Perintah ini membantu mengenal pasti kemungkinan istilah pendua dalam fail aktif.
- **Duplicate Detection**: Pemeriksaan asas untuk perkataan pendua dalam kandungan fail yang sedang diproses, dengan hasil dicatatkan dalam konsol.
- **Check and Remove Duplicate Concept Notes**: Mengenal pasti kemungkinan nota pendua dalam **Concept Note Folder** yang dikonfigurasi berdasarkan padanan nama tepat, bentuk jamak, normalisasi, dan containment satu perkataan berbanding nota di luar folder. Skop perbandingan, iaitu nota mana di luar folder konsep yang diperiksa, boleh ditetapkan kepada **seluruh vault**, **folder tertentu yang dimasukkan**, atau **semua folder kecuali yang dikecualikan**. Senarai terperinci dengan sebab dan fail yang bercanggah akan dipaparkan, kemudian pengguna diminta mengesahkan sebelum fail pendua dipindahkan ke system trash. Kemajuan semasa pemadaman juga dipaparkan.
- **Batch Mermaid Fix**: Menerapkan pembetulan sintaks Mermaid dan LaTeX ke semua fail Markdown dalam folder yang dipilih pengguna.
  - **Workflow Ready**: Boleh digunakan sebagai utiliti kendiri atau sebagai langkah dalam butang custom one-click workflow.
  - **Error Reporting**: Menjana laporan `mermaid_error_{foldername}.md` yang menyenaraikan fail yang masih mengandungi kemungkinan ralat Mermaid selepas diproses.
  - **Move Error Files**: Secara opsional memindahkan fail yang masih mempunyai ralat ke folder tertentu untuk semakan manual.
  - **Smart Detection**: Kini menyemak fail secara pintar dengan `mermaid.parse` sebelum cuba membaiki sintaks, menjimatkan masa pemprosesan dan mengelakkan suntingan yang tidak perlu.
  - **Safe Processing**: Memastikan pembaikan sintaks hanya diterapkan dalam blok kod Mermaid, supaya jadual Markdown atau kandungan lain tidak diubah secara tidak sengaja. Termasuk perlindungan yang kukuh untuk menjaga sintaks jadual seperti `| :--- |` daripada pembaikan debug yang agresif.
  - **Deep Debug Mode**: Jika ralat masih kekal selepas pembaikan awal, mod debug mendalam akan diaktifkan. Mod ini mengendalikan pelbagai kes tepi yang kompleks, termasuk:
    - **Comment Integration**: Menggabungkan trailing comments yang bermula dengan `%` ke dalam edge label secara automatik, contohnya `A -- Label --> B; % Comment` menjadi `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Membetulkan anak panah yang terserap ke dalam petikan, contohnya `A -- "Label -->" B` menjadi `A -- "Label" --> B`.
    - **Inline Subgraphs**: Menukarkan inline subgraph labels menjadi edge labels.
    - **Reverse Arrow Fix**: Membetulkan anak panah bukan standard `X <-- Y` menjadi `Y --> X`.
    - **Direction Keyword Fix**: Memastikan keyword `direction` dalam subgraph menggunakan huruf kecil, contohnya `Direction TB` menjadi `direction TB`.
    - **Comment Conversion**: Menukarkan komen `//` kepada edge label, contohnya `A --> B; // Comment` menjadi `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Menyederhanakan bracketed labels yang berulang, contohnya `Node["Label"]["Label"]` menjadi `Node["Label"]`.
    - **Invalid Arrow Fix**: Menukar sintaks anak panah tidak sah `--|>` kepada `-->`.
    - **Robust Label & Note Handling**: Menambah baik pengendalian label yang mengandungi aksara khas seperti `/` dan sokongan terhadap sintaks note tersuai seperti `note for ...`, supaya artifak seperti bracket penutup yang tertinggal dapat dibersihkan dengan kemas.
    - **Advanced Fix Mode**: Merangkumi pembaikan kukuh untuk node label tanpa petikan yang mengandungi ruang, aksara khas, atau bracket bersarang, contohnya `Node[Label [Text]]` menjadi `Node["Label [Text]"]`, agar rajah kompleks seperti laluan Stellar Evolution kekal serasi. Ia juga membetulkan edge label yang rosak, contohnya `--["Label["-->` menjadi `-- "Label" -->`. Selain itu, komen sebaris ditukar secara automatik, seperti `Consensus --> Adaptive; # Some advanced consensus` menjadi `Consensus -- "Some advanced consensus" --> Adaptive`, dan petikan tidak lengkap di hujung baris juga dibetulkan.
    - **Note Conversion**: Menukarkan `note right/left of` dan komen `note :` kendiri kepada node Mermaid standard dan sambungan, contohnya `note right of A: text` menjadi `NoteA["Note: text"]` yang dipautkan kepada `A`, untuk mengelakkan ralat sintaks dan memperbaiki susun atur. Kini menyokong sambungan `-->` dan `---`.
    - **Extended Note Support**: Menukarkan `note for Node "Content"` dan `note of Node "Content"` kepada linked note node standard, contohnya `NoteNode[" Content"]` yang dipautkan kepada `Node`, bagi memastikan keserasian dengan sintaks yang diperluas pengguna.
    - **Enhanced Note Correction**: Menamakan semula notes dengan penomboran bersiri secara automatik, seperti `Note1`, `Note2`, bagi mengelakkan isu alias apabila banyak note wujud dalam rajah yang sama.
    - **Parallelogram/Shape Fix**: Membetulkan bentuk node yang rosak, seperti `[/["Label["/]` kepada `["Label"]`, supaya kandungan yang dijana kekal serasi.
    - **Standardize Pipe Labels**: Membetulkan dan menyeragamkan edge label yang mengandungi pipe secara automatik supaya dipetik dengan betul, contohnya `-->|Text|` menjadi `-->|"Text"|` dan `-->|Math|^2|` menjadi `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Membetulkan edge label yang salah tempat sebelum anak panah, contohnya `>|"Label"| A --> B` menjadi `A -->|"Label"| B`.
    - **Merge Double Labels**: Mengesan dan menggabungkan label berganda yang kompleks pada satu edge, seperti `A -- Label1 -- Label2 --> B` atau `A -- Label1 -- Label2 --- B`, menjadi satu label yang bersih dengan line break: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Meletakkan petikan pada node label yang mengandungi aksara bermasalah seperti petikan, tanda sama dengan, atau operator matematik tetapi tiada petikan luar, contohnya `Plot[Plot "A"]` menjadi `Plot["Plot "A""]`, untuk mengelakkan ralat render.
    - **Intermediate Node Fix**: Memecahkan edge yang mengandungi definisi node pertengahan kepada dua edge yang berasingan, contohnya `A -- B[...] --> C` menjadi `A --> B[...]` dan `B[...] --> C`, supaya sintaks Mermaid kekal sah.
    - **Concatenated Label Fix**: Membetulkan definisi node yang ID-nya bercantum dengan label, contohnya `SubdivideSubdivide...` menjadi `Subdivide["Subdivide..."]`, walaupun didahului oleh pipe labels atau apabila penggandaan tidak tepat, dengan memeriksa terhadap node ID yang diketahui.
    - **Extract Specific Original Text**:
      - Tentukan senarai soalan dalam tetapan.
      - Mengekstrak segmen teks asal secara verbatim daripada nota aktif yang menjawab soalan-soalan tersebut.
      - **Merged Query Mode**: Pilihan untuk memproses semua soalan dalam satu API call demi kecekapan.
      - **Translation**: Pilihan untuk memasukkan terjemahan teks yang diekstrak dalam output.
      - **Custom Output**: Laluan simpanan dan suffix nama fail untuk fail teks yang diekstrak boleh dikonfigurasi.
- **LLM Connection Test**: Sahkan tetapan API untuk penyedia aktif.

## Pemasangan

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Dari Obsidian Marketplace (Disyorkan)
1. Buka **Settings** -> **Community plugins** dalam Obsidian.
2. Pastikan "Restricted mode" berada dalam keadaan **off**.
3. Klik **Browse** pada community plugins dan cari "Notemd".
4. Klik **Install**.
5. Selepas pemasangan selesai, klik **Enable**.

### Pemasangan Manual
1. Muat turun aset release terkini daripada [halaman GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Setiap release juga menyertakan `README.md` sebagai rujukan, tetapi pemasangan manual hanya memerlukan `main.js`, `styles.css`, dan `manifest.json`.
2. Pergi ke folder konfigurasi vault Obsidian anda: `<YourVault>/.obsidian/plugins/`.
3. Cipta folder baharu bernama `notemd`.
4. Salin `main.js`, `styles.css`, dan `manifest.json` ke dalam folder `notemd`.
5. Mulakan semula Obsidian.
6. Pergi ke **Settings** -> **Community plugins** dan aktifkan "Notemd".

## Konfigurasi

Akses tetapan plugin melalui:
**Settings** -> **Community Plugins** -> **Notemd** (klik ikon gear).

### Konfigurasi Penyedia LLM
1. **Penyedia aktif**: Pilih penyedia LLM yang ingin anda gunakan daripada menu lungsur.
2. **Tetapan penyedia**: Konfigurasikan tetapan khusus untuk penyedia yang dipilih:
   - **API Key**: Diperlukan bagi kebanyakan penyedia awan, seperti OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, dan Requesty. Tidak diperlukan untuk Ollama. Pilihan untuk LM Studio dan preset generik `OpenAI Compatible` apabila endpoint anda menerima akses anonim atau placeholder.
   - **Base URL / Endpoint**: Endpoint API untuk perkhidmatan tersebut. Nilai lalai disediakan, tetapi anda mungkin perlu mengubahnya untuk model tempatan, seperti LMStudio dan Ollama, gateway seperti OpenRouter, Requesty, dan OpenAI Compatible, atau deployment Azure tertentu. **Wajib untuk Azure OpenAI.**
   - **Model**: Nama model atau model ID khusus yang hendak digunakan, contohnya `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, atau `anthropic/claude-3-7-sonnet-latest`. Pastikan model itu tersedia pada endpoint atau penyedia anda.
   - **Temperature**: Mengawal tahap kebarangkalian rawak dalam output LLM, dengan 0 sebagai deterministik dan 1 sebagai sangat kreatif. Nilai lebih rendah, seperti 0.2 hingga 0.5, biasanya lebih sesuai untuk tugas berstruktur.
   - **API Version (Azure Only)**: Diperlukan untuk deployment Azure OpenAI, contohnya `2024-02-15-preview`.
3. **Uji sambungan**: Gunakan butang "Uji sambungan" untuk penyedia aktif bagi mengesahkan tetapan anda. Penyedia OpenAI-compatible kini menggunakan semakan yang lebih sedar penyedia: endpoint seperti `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio`, dan `OpenAI Compatible` akan menguji `chat/completions` secara terus, manakala penyedia yang mempunyai endpoint `/models` yang boleh dipercayai masih boleh menggunakan penyenaraian model terlebih dahulu. Jika probe pertama gagal disebabkan pemutusan rangkaian sementara seperti `ERR_CONNECTION_CLOSED`, Notemd akan beralih kepada stable retry sequence secara automatik.
4. **Urus konfigurasi penyedia**: Gunakan butang "Export Providers" dan "Import Providers" untuk menyimpan atau memuatkan tetapan penyedia LLM ke atau dari fail `notemd-providers.json` di dalam direktori konfigurasi plugin. Ini memudahkan backup dan perkongsian.
5. **Liputan pratetap**: Selain penyedia asal, Notemd kini menyertakan preset untuk `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, serta sasaran generik `OpenAI Compatible` untuk LiteLLM, vLLM, Perplexity, Vercel AI Gateway, atau proxy tersuai.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Konfigurasi Multi-Model
- **Gunakan penyedia berbeza untuk tugas**:
  - **Dinyahaktifkan (Lalai)**: Menggunakan satu "penyedia aktif" yang dipilih di atas untuk semua tugas.
  - **Diaktifkan**: Membolehkan anda memilih penyedia khusus dan, secara opsional, mengatasi nama model untuk setiap tugas, seperti "Add Links", "Research & Summarize", "Generate from Title", "Translate", dan "Extract Concepts". Jika medan model override untuk sesuatu tugas dibiarkan kosong, ia akan menggunakan model lalai yang dikonfigurasi untuk penyedia tugas tersebut.
- **Pilih bahasa berbeza untuk tugas berbeza**:
  - **Dinyahaktifkan (Lalai)**: Menggunakan satu bahasa output untuk semua tugas.
  - **Diaktifkan**: Membolehkan anda memilih bahasa khusus untuk setiap tugas, seperti "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", dan "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Seni Bina Bahasa (bahasa antaramuka dan bahasa output tugasan)

- **Bahasa Antaramuka** hanya mengawal teks antara muka plugin, termasuk label tetapan, butang bar sisi, notis, dan dialog. Mod lalai `auto` akan mengikut bahasa UI Obsidian semasa.
- Varian serantau atau sistem tulisan kini dipetakan kepada katalog terbitan yang paling hampir, bukannya terus jatuh balik ke bahasa Inggeris. Contohnya, `fr-CA` menggunakan bahasa Perancis, `es-419` menggunakan bahasa Sepanyol, `pt-PT` menggunakan bahasa Portugis, `zh-Hans` menggunakan bahasa Cina Ringkas, dan `zh-Hant-HK` menggunakan bahasa Cina Tradisional.
- **Bahasa Output Tugasan** mengawal output tugas yang dijana model, seperti pautan, ringkasan, penjanaan tajuk, ringkasan Mermaid, pengekstrakan konsep, dan sasaran terjemahan.
- **Per-task language mode** membolehkan setiap tugas menentukan bahasa outputnya melalui satu lapisan dasar bahasa yang bersatu, dan bukannya override yang bertaburan di setiap modul.
- **Nyahaktifkan terjemahan automatik** mengekalkan tugas bukan Translate dalam konteks bahasa sumber, manakala tugas Translate yang eksplisit masih memaksa bahasa sasaran yang dikonfigurasi.
- Laluan penjanaan berkaitan Mermaid mengikuti dasar bahasa yang sama dan masih boleh mencetuskan Mermaid auto-fix apabila diaktifkan.

### Pengaturan Panggilan API Stabil
- **Dayakan panggilan API stabil (logik cuba semula)**:
  - **Dinyahaktifkan (Lalai)**: Satu panggilan API yang gagal akan menghentikan tugas semasa.
  - **Diaktifkan**: Secara automatik mencuba semula panggilan API LLM yang gagal, berguna untuk isu rangkaian yang berselang atau rate limit.
  - **Connection Test Fallback**: Walaupun panggilan biasa tidak dijalankan dalam stable mode, ujian sambungan penyedia kini akan bertukar ke retry sequence yang sama selepas ralat rangkaian sementara yang pertama.
  - **Runtime Transport Fallback (Environment-Aware)**: Request tugas panjang yang terganggu oleh `requestUrl` akibat masalah rangkaian sementara kini akan mencuba semula attempt yang sama melalui fallback berdasarkan persekitaran. Build desktop menggunakan Node `http/https`, manakala persekitaran bukan desktop menggunakan browser `fetch`. Fallback attempt ini kini juga menggunakan streamed parsing yang memahami protokol untuk laluan LLM terbina dalam, meliputi OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE, dan Ollama NDJSON output, supaya gateway perlahan masih boleh memulangkan body chunk dengan lebih awal. Entry point penyedia gaya OpenAI lain menggunakan fallback path yang sama.
  - **OpenAI-Compatible Stable Order**: Dalam stable mode, setiap attempt OpenAI-compatible kini mengikuti urutan `direct streaming -> direct non-stream -> requestUrl (dengan streamed fallback jika perlu)` sebelum sesuatu attempt dikira gagal. Ini mengelakkan kegagalan yang terlalu agresif apabila hanya satu mod pengangkutan bermasalah.
- **Retry Interval (seconds)**: Hanya muncul apabila stable mode diaktifkan. Menentukan masa tunggu antara cubaan semula, antara 1 hingga 300 saat. Lalai: 5 saat.
- **Maximum Retries**: Hanya muncul apabila stable mode diaktifkan. Menentukan jumlah maksimum cubaan semula, antara 0 hingga 10. Lalai: 3.
- **Mod penyahpepijatan ralat API**:
  - **Dinyahaktifkan (Lalai)**: Menggunakan laporan ralat standard yang ringkas.
  - **Diaktifkan**: Mengaktifkan log ralat terperinci untuk semua penyedia dan tugas, termasuk Translate, Search, dan Connection Tests. Ini merangkumi HTTP status code, raw response text, request transport timeline, request URL dan headers yang telah disanitasi, tempoh setiap attempt, response headers, partial response body, parsed partial stream output, dan stack traces, yang penting untuk troubleshooting sambungan API dan reset daripada upstream gateway.
- **Developer Mode**:
  - **Dinyahaktifkan (Lalai)**: Menyembunyikan semua kawalan diagnostik khusus developer daripada pengguna biasa.
  - **Diaktifkan**: Menunjukkan panel diagnostik developer khusus dalam Settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Pilih runtime path untuk setiap probe. Penyedia OpenAI-compatible menyokong mod tambahan yang dipaksa, seperti `direct streaming`, `direct buffered`, dan `requestUrl-only`, selain mod runtime biasa.
  - **Run Diagnostic**: Menjalankan satu long-request probe menggunakan call mode yang dipilih dan menulis `Notemd_Provider_Diagnostic_*.txt` ke root vault.
  - **Run Stability Test**: Mengulangi probe untuk bilangan run yang boleh dikonfigurasi, antara 1 hingga 10, menggunakan call mode yang dipilih dan menyimpan laporan kestabilan agregat.
  - **Diagnostic Timeout**: Timeout setiap run boleh dikonfigurasi antara 15 hingga 3600 saat.
  - **Why Use It**: Lebih pantas daripada pembiakan masalah secara manual apabila penyedia lulus "Test connection" tetapi gagal untuk tugas panjang yang sebenar, contohnya terjemahan melalui gateway perlahan.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Tetapan Umum

#### Hasil Fail Diproses
- **Customize Processed File Save Path**:
  - **Dinyahaktifkan (Lalai)**: Fail yang diproses, seperti `YourNote_processed.md`, disimpan dalam **folder yang sama** dengan nota asal.
  - **Diaktifkan**: Membolehkan anda menentukan lokasi simpanan tersuai.
- **Processed File Folder Path**: Hanya dipaparkan apabila tetapan di atas diaktifkan. Masukkan **laluan relatif** di dalam vault, contohnya `Processed Notes` atau `Output/LLM`, tempat fail yang diproses akan disimpan. Folder akan dicipta jika belum wujud. **Jangan gunakan laluan mutlak seperti C:\... dan jangan gunakan aksara tidak sah.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Dinyahaktifkan (Lalai)**: Fail yang diproses oleh perintah "Add Links" akan menggunakan suffix lalai `_processed.md`, contohnya `YourNote_processed.md`.
  - **Diaktifkan**: Membolehkan anda menyesuaikan nama fail output menggunakan tetapan di bawah.
- **Custom Suffix/Replacement String**: Hanya dipaparkan apabila tetapan di atas diaktifkan. Masukkan string yang hendak digunakan untuk nama fail output.
  - Jika dibiarkan **kosong**, fail asal akan **ditimpa** dengan kandungan yang telah diproses.
  - Jika anda memasukkan string, contohnya `_linked`, ia akan ditambah pada nama asas asal, contohnya `YourNote_linked.md`. Pastikan suffix itu tidak mengandungi aksara nama fail yang tidak sah.

- **Remove Code Fences on Add Links**:
  - **Dinyahaktifkan (Lalai)**: Code fences **(\`\`\`)** dikekalkan dalam kandungan ketika pautan ditambah, dan **(\`\`\`markdown)** akan dipadam secara automatik.
  - **Diaktifkan**: Mengeluarkan code fences daripada kandungan sebelum pautan ditambah.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Hasil Nota Konsep
- **Customize Concept Note Path**:
  - **Dinyahaktifkan (Lalai)**: Penciptaan nota automatik untuk `[[linked concepts]]` dinyahaktifkan.
  - **Diaktifkan**: Membolehkan anda menentukan folder tempat nota konsep baharu akan dicipta.
- **Concept Note Folder Path**: Hanya dipaparkan apabila tetapan di atas diaktifkan. Masukkan **laluan relatif** di dalam vault, contohnya `Concepts` atau `Generated/Topics`, tempat nota konsep baharu akan disimpan. Folder akan dicipta jika belum wujud. **Mesti diisi jika penyesuaian diaktifkan.** **Jangan gunakan laluan mutlak atau aksara tidak sah.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Hasil Fail Log Konsep
- **Generate Concept Log File**:
  - **Dinyahaktifkan (Lalai)**: Tiada fail log dijana.
  - **Diaktifkan**: Mencipta fail log yang menyenaraikan nota konsep baharu selepas pemprosesan. Formatnya ialah:
    ```
    jana xx fail md konsep
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Hanya dipaparkan apabila "Generate Concept Log File" diaktifkan.
  - **Dinyahaktifkan (Lalai)**: Fail log disimpan dalam **Concept Note Folder Path** jika ditetapkan, atau di root vault jika tidak.
  - **Diaktifkan**: Membolehkan anda menentukan folder tersuai untuk fail log.
- **Concept Log Folder Path**: Hanya dipaparkan apabila "Customize Log File Save Path" diaktifkan. Masukkan **laluan relatif** di dalam vault, contohnya `Logs/Notemd`, tempat fail log akan disimpan. **Mesti diisi jika penyesuaian diaktifkan.**
- **Customize Log File Name**: Hanya dipaparkan apabila "Generate Concept Log File" diaktifkan.
  - **Dinyahaktifkan (Lalai)**: Fail log dinamakan `Generate.log`.
  - **Diaktifkan**: Membolehkan anda menentukan nama tersuai untuk fail log.
- **Concept Log File Name**: Hanya dipaparkan apabila "Customize Log File Name" diaktifkan. Masukkan nama fail yang diingini, contohnya `ConceptCreation.log`. **Mesti diisi jika penyesuaian diaktifkan.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tugas Ekstrak Konsep
- **Cipta nota konsep minimum**:
  - **On (Default)**: Nota konsep yang baru dicipta hanya mengandungi tajuk, contohnya `# Concept`.
  - **Off**: Nota konsep boleh mengandungi kandungan tambahan, seperti backlink "Linked From", jika tidak dimatikan oleh tetapan di bawah.
- **Add "Linked From" backlink**:
  - **Off (Default)**: Tidak menambah backlink ke dokumen sumber dalam nota konsep semasa pengekstrakan.
  - **On**: Menambah section "Linked From" berserta backlink ke fail sumber.

#### Ekstrak Teks Asal Tertentu
- **Questions for extraction**: Masukkan senarai soalan, satu per baris, yang anda mahu AI gunakan untuk mengekstrak jawapan verbatim daripada nota anda.
- **Translate output to corresponding language**:
  - **Off (Default)**: Hanya mengeluarkan teks yang diekstrak dalam bahasa asalnya.
  - **On**: Menambah terjemahan bagi teks yang diekstrak dalam bahasa yang dipilih untuk tugas ini.
- **Merged query mode**:
  - **Off**: Memproses setiap soalan secara berasingan, memberikan ketepatan lebih tinggi tetapi memerlukan lebih banyak API call.
  - **On**: Menghantar semua soalan dalam satu prompt, lebih pantas dan kurang API call.
- **Customise extracted text save path & filename**:
  - **Off**: Menyimpan fail dalam folder yang sama seperti fail asal dengan suffix `_Extracted`.
  - **On**: Membolehkan anda menentukan folder output dan suffix nama fail tersuai.

#### Perbaikan Mermaid Batch
- **Enable Mermaid Error Detection**:
  - **Off (Default)**: Pengesanan ralat diabaikan selepas pemprosesan.
  - **On**: Mengimbas fail yang diproses untuk ralat sintaks Mermaid yang masih tinggal dan menjana laporan `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: Fail yang mempunyai ralat kekal di lokasi asal.
  - **On**: Memindahkan fail yang masih mengandungi ralat sintaks Mermaid selepas percubaan pembaikan ke folder khas untuk semakan manual.
- **Mermaid error folder path**: Hanya kelihatan apabila tetapan di atas diaktifkan. Menentukan folder tempat fail yang mempunyai ralat akan dipindahkan.

#### Parameter Pemprosesan
- **Enable Batch Parallelism**:
  - **Dinyahaktifkan (Lalai)**: Tugas pemprosesan batch, seperti "Process Folder" atau "Batch Generate from Titles", memproses fail satu demi satu secara bersiri.
  - **Diaktifkan**: Membolehkan plugin memproses beberapa fail secara serentak, yang boleh mempercepat batch job yang besar dengan ketara.
- **Batch Concurrency**: Hanya kelihatan apabila parallelism diaktifkan. Menetapkan jumlah maksimum fail yang diproses secara selari. Nilai yang lebih tinggi boleh menjadi lebih pantas tetapi menggunakan lebih banyak sumber dan mungkin terkena API rate limit. Lalai: 1, julat: 1 hingga 20.
- **Batch Size**: Hanya kelihatan apabila parallelism diaktifkan. Menetapkan jumlah fail dalam satu batch. Lalai: 50, julat: 10 hingga 200.
- **Delay Between Batches (ms)**: Hanya kelihatan apabila parallelism diaktifkan. Menentukan sela masa dalam milisaat antara satu batch dengan batch seterusnya, membantu mengurus API rate limit. Lalai: 1000 ms.
- **API Call Interval (ms)**: Menentukan sela masa minimum dalam milisaat **sebelum dan selepas** setiap panggilan API LLM. Ini penting untuk API dengan kadar rendah atau untuk mengelakkan ralat 429. Tetapkan kepada 0 untuk tiada kelewatan tambahan. Lalai: 500 ms.
- **Chunk Word Count**: Bilangan maksimum perkataan bagi setiap chunk yang dihantar ke LLM. Ini mempengaruhi bilangan API call untuk fail besar. Lalai: 3000.
- **Enable Duplicate Detection**: Menghidupkan atau mematikan pemeriksaan asas untuk perkataan pendua dalam kandungan yang diproses, dengan hasil dipaparkan dalam konsol. Lalai: aktif.
- **Max Tokens**: Bilangan maksimum token yang dibenarkan untuk dijana oleh LLM bagi setiap response chunk. Ini mempengaruhi kos dan tahap perincian. Lalai: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Terjemahan
- **Default Target Language**: Pilih bahasa sasaran lalai untuk menterjemah nota anda. Ini boleh diubah dalam UI semasa menjalankan perintah terjemahan. Lalai: Inggeris.
- **Customise Translation File Save Path**:
  - **Dinyahaktifkan (Lalai)**: Fail terjemahan disimpan dalam **folder yang sama** seperti nota asal.
  - **Diaktifkan**: Membolehkan anda menentukan **laluan relatif** di dalam vault, seperti `Translations`, tempat fail terjemahan akan disimpan. Folder akan dicipta jika belum wujud.
- **Use custom suffix for translated files**:
  - **Dinyahaktifkan (Lalai)**: Fail terjemahan menggunakan suffix lalai `_translated.md`, contohnya `YourNote_translated.md`.
  - **Diaktifkan**: Membolehkan anda menentukan suffix tersuai.
- **Custom Suffix**: Hanya kelihatan apabila tetapan di atas diaktifkan. Masukkan suffix tersuai yang hendak ditambah pada nama fail terjemahan, contohnya `_es` atau `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Penjanaan Kandungan
- **Enable Research in "Generate from Title"**:
  - **Dinyahaktifkan (Lalai)**: "Generate from Title" hanya menggunakan tajuk sebagai input.
  - **Diaktifkan**: Menjalankan penyelidikan web menggunakan **Web Research Provider** yang dikonfigurasi dan menyertakan penemuan tersebut sebagai konteks untuk LLM semasa menjana kandungan berdasarkan tajuk.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Diaktifkan (Lalai)**: Menjalankan pembaikan sintaks Mermaid secara automatik selepas workflow berkaitan Mermaid, seperti Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, dan Translate.
  - **Disabled**: Membiarkan output Mermaid yang dijana tanpa perubahan melainkan anda menjalankan `Batch Mermaid Fix` secara manual atau menambahkannya ke dalam workflow tersuai.
- **Output Language**: Baharu. Pilih bahasa output yang dikehendaki untuk tugas "Generate from Title" dan "Batch Generate from Title".
  - **English (Default)**: Prompt diproses dan output dijana dalam bahasa Inggeris.
  - **Other Languages**: LLM diarahkan untuk melakukan reasoning dalam bahasa Inggeris tetapi memberikan dokumentasi akhir dalam bahasa yang anda pilih, seperti Espanol, Francais, 简体中文, 繁體中文, العربية, हिन्दी, dan lain-lain.
- **Change Prompt Word**: Baharu.
  - **Change Prompt Word**: Membolehkan anda menukar prompt word untuk tugas tertentu.
  - **Custom Prompt Word**: Masukkan prompt word tersuai anda bagi tugas tersebut.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Dinyahaktifkan (Lalai)**: Fail yang berjaya dijana dipindahkan ke subfolder bernama `[OriginalFolderName]_complete` relatif kepada folder induk asal, atau `Vault_complete` jika folder asal ialah root.
  - **Diaktifkan**: Membolehkan anda menentukan nama tersuai bagi subfolder tempat fail siap dipindahkan.
- **Custom Output Folder Name**: Hanya dipaparkan apabila tetapan di atas diaktifkan. Masukkan nama yang diingini untuk subfolder tersebut, contohnya `Generated Content` atau `_complete`. Aksara tidak sah tidak dibenarkan. Lalai ialah `_complete` jika dibiarkan kosong. Folder ini akan dicipta relatif kepada direktori induk folder asal.

#### Tombol Workflow Sekali Klik
- **Visual Workflow Builder**: Cipta butang workflow tersuai daripada aksi terbina dalam tanpa menulis DSL secara manual.
- **Custom Workflow Buttons DSL**: Pengguna lanjutan masih boleh mengedit definisi workflow secara terus. DSL yang tidak sah akan jatuh semula kepada workflow lalai dengan selamat dan memaparkan amaran dalam UI bar sisi atau tetapan.
- **Workflow Error Strategy**:
  - **Stop on Error (Default)**: Menghentikan workflow serta-merta apabila satu langkah gagal.
  - **Continue on Error**: Meneruskan langkah seterusnya dan melaporkan jumlah aksi yang gagal pada akhir workflow.
- **Default Workflow Included**: `One-Click Extract` menggabungkan `Process File (Add Links)`, `Batch Generate from Titles`, dan `Batch Mermaid Fix`.

#### Pengaturan Prompt Kustom
Ciri ini membolehkan anda mengatasi arahan lalai, iaitu prompts, yang dihantar kepada LLM untuk tugas tertentu, sekali gus memberi anda kawalan yang lebih halus terhadap output.

- **Enable Custom Prompts for Specific Tasks**:
  - **Dinyahaktifkan (Lalai)**: Plugin menggunakan prompt lalai terbina dalam untuk semua operasi.
  - **Diaktifkan**: Mengaktifkan keupayaan untuk menetapkan prompt tersuai bagi tugas-tugas yang disenaraikan di bawah. Ini ialah suis utama bagi ciri ini.

- **Use Custom Prompt for [Task Name]**: Hanya dipaparkan apabila tetapan di atas diaktifkan.
  - Bagi setiap tugas yang disokong, seperti "Add Links", "Generate from Title", "Research & Summarize", dan "Extract Concepts", anda boleh menghidupkan atau mematikan prompt tersuai secara berasingan.
  - **Disabled**: Tugas tertentu ini akan menggunakan prompt lalai.
  - **Diaktifkan**: Tugas ini akan menggunakan teks yang anda masukkan dalam text area "Custom Prompt" yang sepadan di bawah.

- **Custom Prompt Text Area**: Hanya dipaparkan apabila prompt tersuai bagi sesuatu tugas diaktifkan.
  - **Default Prompt Display**: Sebagai rujukan, plugin memaparkan prompt lalai yang biasanya digunakan untuk tugas tersebut. Anda boleh menggunakan butang **"Copy Default Prompt"** untuk menyalin teks itu sebagai titik permulaan bagi prompt tersuai anda.
  - **Custom Prompt Input**: Di sinilah anda menulis arahan anda sendiri untuk LLM.
  - **Placeholders**: Anda boleh dan sepatutnya menggunakan placeholders khas dalam prompt anda. Plugin akan menggantikannya dengan kandungan sebenar sebelum request dihantar kepada LLM. Rujuk prompt lalai untuk melihat placeholders yang tersedia bagi setiap tugas. Placeholders yang biasa termasuk:
    - `{TITLE}`: Tajuk nota semasa.
    - `{RESEARCH_CONTEXT_SECTION}`: Kandungan yang dikumpulkan daripada penyelidikan web.
    - `{USER_PROMPT}`: Kandungan nota yang sedang diproses.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Cakupan Pemeriksaan Duplikat
- **Duplicate Check Scope Mode**: Mengawal fail mana yang diperiksa terhadap nota dalam Concept Note Folder anda untuk kemungkinan duplikat.
  - **Entire Vault (Default)**: Membandingkan nota konsep dengan semua nota lain dalam vault, tidak termasuk Concept Note Folder itu sendiri.
  - **Include Specific Folders Only**: Membandingkan nota konsep hanya dengan nota di dalam folder yang disenaraikan di bawah.
  - **Exclude Specific Folders**: Membandingkan nota konsep dengan semua nota kecuali nota yang berada dalam folder yang disenaraikan di bawah, dan juga mengecualikan Concept Note Folder.
  - **Concept Folder Only**: Membandingkan nota konsep hanya dengan **nota lain dalam Concept Note Folder**. Ini membantu mengesan duplikat yang wujud semata-mata di dalam konsep yang dijana.
- **Include/Exclude Folders**: Hanya dipaparkan jika mod ialah 'Include' atau 'Exclude'. Masukkan **laluan relatif** folder yang ingin anda masukkan atau kecualikan, **satu laluan bagi setiap baris**. Laluan peka huruf besar kecil dan menggunakan `/` sebagai pemisah, contohnya `Reference Material/Papers` atau `Daily Notes`. Folder ini tidak boleh sama dengan atau berada di dalam Concept Note Folder.

#### Penyedia Penyelidikan Web
- **Search Provider**: Pilih antara `Tavily`, yang memerlukan API key dan disyorkan, atau `DuckDuckGo`, yang masih bersifat eksperimen dan kerap disekat oleh enjin carian untuk request automatik. Digunakan bagi "Research & Summarize Topic" dan juga secara opsional untuk "Generate from Title".
- **Tavily API Key**: Hanya dipaparkan jika Tavily dipilih. Masukkan API key anda daripada [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Hanya dipaparkan jika Tavily dipilih. Menentukan bilangan maksimum hasil carian yang akan dikembalikan Tavily, antara 1 hingga 20. Lalai: 5.
- **Tavily Search Depth**: Hanya dipaparkan jika Tavily dipilih. Pilih `basic`, yang merupakan lalai, atau `advanced`. `Advanced` memberikan hasil yang lebih baik tetapi menggunakan 2 API credit bagi setiap carian berbanding 1.
- **DuckDuckGo Max Results**: Hanya dipaparkan jika DuckDuckGo dipilih. Menentukan bilangan maksimum hasil carian yang akan diparsing, antara 1 hingga 10. Lalai: 5.
- **DuckDuckGo Content Fetch Timeout**: Hanya dipaparkan jika DuckDuckGo dipilih. Menentukan tempoh maksimum dalam saat untuk mencuba mendapatkan kandungan daripada setiap URL hasil DuckDuckGo. Lalai: 15.
- **Max Research Content Tokens**: Had anggaran maksimum token daripada gabungan hasil penyelidikan web, termasuk snippets dan fetched content, yang akan dimasukkan dalam prompt ringkasan. Ini membantu mengawal saiz context window dan kos. Lalai: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Domain Pembelajaran Terfokus
- **Enable Focused Learning Domain**:
  - **Dinyahaktifkan (Lalai)**: Prompt yang dihantar ke LLM menggunakan arahan umum standard.
  - **Diaktifkan**: Membolehkan anda menentukan satu atau lebih bidang pengajian untuk meningkatkan pemahaman konteks LLM.
- **Learning Domain**: Hanya dipaparkan apabila tetapan di atas diaktifkan. Masukkan bidang khusus anda, seperti 'Materials Science', 'Polymer Physics', atau 'Machine Learning'. Ini akan menambah baris "Relevant Fields: [...]" pada permulaan prompt, membantu LLM menghasilkan pautan dan kandungan yang lebih tepat untuk bidang kajian anda.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Panduan Penggunaan

### Aliran Kerja Pantas & Bar Sisi

- Buka Notemd Sidebar untuk mengakses kumpulan section aksi bagi pemprosesan teras, penjanaan, terjemahan, pengetahuan, dan utiliti.
- Gunakan kawasan **Aliran Kerja Pantas** di bahagian atas bar sisi untuk melancarkan butang tersuai berbilang langkah.
- Workflow lalai **One-Click Extract** menjalankan `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Kemajuan workflow, log setiap langkah, dan kegagalan dipaparkan dalam bar sisi, bersama footer yang dipinkan untuk memastikan progress bar dan kawasan log tidak tertolak keluar apabila section dibuka.
- Kad kemajuan memastikan teks status, pill peratusan khusus, dan baki masa kekal mudah dibaca, dan workflow tersuai yang sama boleh dikonfigurasikan semula daripada tetapan.

### Pemprosesan Asal (Menambah Wiki-Links)
Ini ialah fungsi teras yang tertumpu pada mengenal pasti konsep dan menambah `[[wiki-links]]`.

**Penting:** Proses ini hanya berfungsi pada fail `.md` atau `.txt`. Anda boleh menukar fail PDF kepada fail MD secara percuma menggunakan [Mineru](https://github.com/opendatalab/MinerU) sebelum meneruskan pemprosesan.

1. **Menggunakan Sidebar**:
   - Buka Notemd Sidebar melalui ikon tongkat sihir atau command palette.
   - Buka fail `.md` atau `.txt`.
   - Klik **"Process File (Add Links)"**.
   - Untuk memproses folder: klik **"Process Folder (Add Links)"**, pilih folder, kemudian klik "Process".
   - Kemajuan dipaparkan dalam bar sisi. Anda boleh membatalkan tugas menggunakan butang "Cancel Processing" di bar sisi.
   - *Nota untuk pemprosesan folder:* Fail diproses di latar belakang tanpa dibuka dalam editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Menggunakan Command Palette** (`Ctrl+P` atau `Cmd+P`):
   - **Single File**: Buka fail dan jalankan `Notemd: Process Current File`.
   - **Folder**: Jalankan `Notemd: Process Folder`, kemudian pilih folder. Fail diproses di latar belakang tanpa dibuka dalam editor.
   - Progress modal akan dipaparkan untuk aksi daripada command palette, lengkap dengan butang cancel.
   - *Nota:* plugin akan membuang baris pembuka `\boxed{` dan baris penutup `}` secara automatik jika dikesan dalam kandungan akhir yang diproses sebelum disimpan.

### Ciri Baharu

1. **Ringkaskan sebagai diagram Mermaid**:
   - Buka nota yang anda mahu ringkaskan.
   - Jalankan perintah `Notemd: Summarise as Mermaid diagram`, sama ada melalui command palette atau butang di bar sisi.
   - Plugin akan menjana nota baharu yang mengandungi rajah Mermaid.

2. **Translate Note/Selection**:
   - Pilih teks dalam nota untuk menterjemah pilihan itu sahaja, atau jalankan perintah tanpa sebarang pilihan untuk menterjemah keseluruhan nota.
   - Jalankan perintah `Notemd: Translate Note/Selection`, sama ada melalui command palette atau butang di bar sisi.
   - Sebuah modal akan muncul untuk membolehkan anda mengesahkan atau menukar **Target Language**, yang secara lalai mengikuti nilai yang ditetapkan dalam konfigurasi.
   - Plugin menggunakan **LLM Provider** yang dikonfigurasi, berdasarkan tetapan Multi-Model, untuk menjalankan terjemahan.
   - Kandungan terjemahan akan disimpan ke **Translation Save Path** yang dikonfigurasi dengan suffix yang sesuai, dan dibuka dalam **pane baharu di sebelah kanan** kandungan asal untuk memudahkan perbandingan.
   - Anda boleh membatalkan tugas ini melalui butang di bar sisi atau butang cancel dalam modal.
3. **Terjemahan kelompok**:
   - Jalankan perintah `Notemd: Batch Translate Folder` daripada command palette dan pilih folder, atau klik kanan folder dalam file explorer lalu pilih "Batch translate this folder".
   - Plugin akan menterjemah semua fail Markdown dalam folder yang dipilih.
   - Fail yang diterjemah disimpan ke laluan terjemahan yang dikonfigurasi tetapi tidak dibuka secara automatik.
   - Proses ini boleh dibatalkan melalui progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Pilih teks dalam nota ATAU pastikan nota mempunyai tajuk, yang akan digunakan sebagai topik carian.
   - Jalankan perintah `Notemd: Research and Summarize Topic`, sama ada melalui command palette atau butang di bar sisi.
   - Plugin menggunakan **Search Provider** yang dikonfigurasi, sama ada Tavily atau DuckDuckGo, bersama **LLM Provider** yang sesuai berdasarkan tetapan Multi-Model untuk mencari dan meringkaskan maklumat.
   - Ringkasan akan ditambah ke nota semasa.
   - Anda boleh membatalkan tugas ini melalui butang di bar sisi atau butang cancel dalam modal.
   - *Nota:* Carian DuckDuckGo boleh gagal disebabkan pengesanan bot. Tavily adalah pilihan yang disyorkan.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Buka satu nota, walaupun kosong.
   - Jalankan perintah `Notemd: Generate Content from Title`, sama ada melalui command palette atau butang di bar sisi.
   - Plugin menggunakan **LLM Provider** yang sesuai berdasarkan tetapan Multi-Model untuk menjana kandungan berdasarkan tajuk nota, lalu menggantikan kandungan sedia ada.
   - Jika tetapan **"Enable Research in 'Generate from Title'"** diaktifkan, plugin akan melakukan penyelidikan web terlebih dahulu menggunakan **Web Research Provider** yang dikonfigurasi dan memasukkan konteks itu ke dalam prompt yang dihantar kepada LLM.
   - Anda boleh membatalkan tugas ini melalui butang di bar sisi atau butang cancel dalam modal.

5. **Batch Generate Content from Titles**:
   - Jalankan perintah `Notemd: Batch Generate Content from Titles`, sama ada melalui command palette atau butang di bar sisi.
   - Pilih folder yang mengandungi nota yang ingin anda proses.
   - Plugin akan melalui setiap fail `.md` dalam folder itu, tidak termasuk fail `_processed.md` dan fail dalam folder "complete" yang ditetapkan, menjana kandungan berdasarkan tajuk nota dan menggantikan kandungan sedia ada. Fail diproses di latar belakang tanpa dibuka dalam editor.
   - Fail yang berjaya diproses akan dipindahkan ke folder "complete" yang dikonfigurasi.
   - Perintah ini mematuhi tetapan **"Enable Research in 'Generate from Title'"** bagi setiap nota yang diproses.
   - Anda boleh membatalkan tugas ini melalui butang di bar sisi atau butang cancel dalam modal.
   - Kemajuan dan hasil, termasuk bilangan fail yang diubah serta ralat, dipaparkan dalam log di bar sisi atau modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Pastikan **Concept Note Folder Path** dikonfigurasi dengan betul dalam tetapan.
   - Jalankan `Notemd: Check and Remove Duplicate Concept Notes`, sama ada melalui command palette atau butang di bar sisi.
   - Plugin akan mengimbas folder nota konsep dan membandingkan nama fail dengan nota di luar folder menggunakan beberapa peraturan, seperti padanan tepat, bentuk jamak, normalisasi, dan containment.
   - Jika kemungkinan duplikat ditemui, sebuah modal akan dipaparkan yang menyenaraikan fail, sebab ia ditandakan, dan fail yang bercanggah.
   - Semak senarai itu dengan teliti. Klik **"Delete Files"** untuk memindahkan fail yang disenaraikan ke system trash, atau klik **"Cancel"** untuk tidak melakukan sebarang tindakan.
   - Kemajuan dan hasil dipaparkan dalam log di bar sisi atau modal.

7. **Extract Concepts (Pure Mode)**:
   - Ciri ini membolehkan anda mengekstrak konsep daripada dokumen dan mencipta nota konsep yang sepadan **tanpa** mengubah fail asal. Ini sangat sesuai untuk mengisi knowledge base dengan cepat daripada sekumpulan dokumen.
   - **Single File**: Buka satu fail dan jalankan perintah `Notemd: Extract concepts (create concept notes only)` daripada command palette, atau klik butang **"Extract concepts (current file)"** dalam bar sisi.
   - **Folder**: Jalankan perintah `Notemd: Batch extract concepts from folder` daripada command palette, atau klik butang **"Extract concepts (folder)"** dalam bar sisi, kemudian pilih folder untuk memproses semua notanya.
   - Plugin akan membaca fail, mengenal pasti konsep, dan mencipta nota baharu untuknya dalam **Concept Note Folder** yang anda tetapkan, sambil membiarkan fail asal tidak berubah.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Perintah berkuasa ini memudahkan proses mencipta dan mengisi nota konsep baharu.
   - Pilih satu perkataan atau frasa dalam editor anda.
   - Jalankan perintah `Notemd: Create Wiki-Link & Generate Note from Selection`. Disyorkan untuk menetapkan hotkey, contohnya `Cmd+Shift+W`.
   - Plugin akan:
     1. Menggantikan teks yang dipilih dengan satu `[[wiki-link]]`.
     2. Menyemak sama ada nota dengan tajuk tersebut sudah wujud dalam **Concept Note Folder** anda.
     3. Jika sudah wujud, ia akan menambah backlink ke nota semasa.
     4. Jika belum wujud, ia akan mencipta nota kosong baharu.
     5. Seterusnya, plugin akan menjalankan perintah **"Generate Content from Title"** secara automatik pada nota baharu atau sedia ada itu untuk mengisinya dengan kandungan yang dijana AI.

9. **Extract Concepts and Generate Titles**:
   - Perintah ini menggabungkan dua ciri berkuasa ke dalam satu workflow yang lebih lancar.
   - Jalankan perintah `Notemd: Extract Concepts and Generate Titles` daripada command palette. Disyorkan untuk menetapkan hotkey baginya.
   - Plugin akan:
     1. Menjalankan tugas **"Extract concepts (current file)"** pada fail aktif semasa.
     2. Kemudian secara automatik menjalankan tugas **"Batch generate from titles"** pada folder yang anda tetapkan sebagai **Concept note folder path** dalam tetapan.
   - Ini membolehkan anda mengisi knowledge base dengan konsep baharu daripada dokumen sumber terlebih dahulu, kemudian terus memperkayakan nota konsep yang baharu itu dengan kandungan yang dijana AI dalam satu langkah.

10. **Extract Specific Original Text**:
    - Konfigurasikan soalan anda dalam tetapan di bawah "Extract Specific Original Text".
    - Gunakan butang "Extract Specific Original Text" di bar sisi untuk memproses fail aktif.
    - **Merged Mode**: Membolehkan pemprosesan lebih pantas dengan menghantar semua soalan dalam satu prompt.
    - **Translation**: Menterjemah teks yang diekstrak ke bahasa yang anda konfigurasikan secara opsional.
    - **Custom Output**: Konfigurasikan tempat simpanan dan cara fail yang diekstrak dinamakan.

11. **Batch Mermaid Fix**:
    - Gunakan butang "Batch Mermaid Fix" di bar sisi untuk mengimbas folder dan membaiki ralat sintaks Mermaid yang lazim.
    - Plugin akan melaporkan fail yang masih mempunyai ralat dalam fail `mermaid_error_{foldername}.md`.
    - Secara opsional anda boleh mengkonfigurasi plugin supaya memindahkan fail yang bermasalah ini ke folder yang berasingan untuk semakan.

## Penyedia LLM yang Disokong

| Provider           | Type    | API key diperlukan     | Nota                                                                  |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Ya                     | Endpoint DeepSeek asli dengan pengendalian reasoning model            |
| Qwen               | Cloud   | Ya                     | Preset mod serasi DashScope untuk model Qwen / QwQ                   |
| Qwen Code          | Cloud   | Ya                     | Preset DashScope berfokus coding untuk model coder Qwen              |
| Doubao             | Cloud   | Ya                     | Preset Volcengine Ark; biasanya model field ditetapkan kepada endpoint ID |
| Moonshot           | Cloud   | Ya                     | Endpoint rasmi Kimi / Moonshot                                       |
| GLM                | Cloud   | Ya                     | Endpoint OpenAI-compatible rasmi Zhipu BigModel                      |
| Z AI               | Cloud   | Ya                     | Endpoint OpenAI-compatible antarabangsa GLM/Zhipu; melengkapi `GLM`  |
| MiniMax            | Cloud   | Ya                     | Endpoint rasmi MiniMax chat-completions                              |
| Huawei Cloud MaaS  | Cloud   | Ya                     | Endpoint OpenAI-compatible Huawei ModelArts MaaS untuk model hosted   |
| Baidu Qianfan      | Cloud   | Ya                     | Endpoint rasmi OpenAI-compatible Qianfan untuk model ERNIE           |
| SiliconFlow        | Cloud   | Ya                     | Endpoint rasmi OpenAI-compatible SiliconFlow untuk model OSS hosted   |
| OpenAI             | Cloud   | Ya                     | Menyokong model GPT dan siri o                                        |
| Anthropic          | Cloud   | Ya                     | Menyokong model Claude                                                |
| Google             | Cloud   | Ya                     | Menyokong model Gemini                                                |
| Mistral            | Cloud   | Ya                     | Menyokong keluarga Mistral dan Codestral                              |
| Azure OpenAI       | Cloud   | Ya                     | Memerlukan endpoint, API key, deployment name, dan API version        |
| OpenRouter         | Gateway | Ya                     | Akses ke banyak penyedia melalui model ID OpenRouter                  |
| xAI                | Cloud   | Ya                     | Endpoint Grok asli                                                    |
| Groq               | Cloud   | Ya                     | Inferens OpenAI-compatible yang pantas untuk model OSS hosted         |
| Together           | Cloud   | Ya                     | Endpoint OpenAI-compatible untuk model OSS hosted                     |
| Fireworks          | Cloud   | Ya                     | Endpoint inferens OpenAI-compatible                                   |
| Requesty           | Gateway | Ya                     | Router multi-penyedia di sebalik satu API key                         |
| OpenAI Compatible  | Gateway | Pilihan                | Preset generik untuk LiteLLM, vLLM, Perplexity, Vercel AI Gateway, dll. |
| LMStudio           | Local   | Pilihan (`EMPTY`)      | Menjalankan model secara tempatan melalui pelayan LM Studio           |
| Ollama             | Local   | Tidak                  | Menjalankan model secara tempatan melalui pelayan Ollama              |

*Nota: Untuk penyedia tempatan seperti LMStudio dan Ollama, pastikan aplikasi pelayan masing-masing sedang berjalan dan boleh dicapai melalui Base URL yang dikonfigurasi.*
*Nota: Untuk OpenRouter dan Requesty, gunakan pengenal model penuh atau yang berawalan penyedia seperti yang dipaparkan oleh gateway, contohnya `google/gemini-flash-1.5` atau `anthropic/claude-3-7-sonnet-latest`.*
*Nota: `Doubao` biasanya menjangka Ark endpoint atau deployment ID dalam model field, bukannya nama keluarga model mentah. Skrin tetapan kini memberi amaran apabila nilai placeholder masih digunakan dan menyekat ujian sambungan sehingga anda menggantikannya dengan endpoint ID sebenar.*
*Nota: `Z AI` menyasar talian antarabangsa `api.z.ai`, manakala `GLM` mengekalkan endpoint BigModel untuk China daratan. Pilih preset yang sepadan dengan rantau akaun anda.*
*Nota: Preset berfokus China menggunakan pemeriksaan sambungan berasaskan chat terlebih dahulu supaya ujian benar-benar mengesahkan model atau deployment yang anda konfigurasikan, bukan sekadar kebolehcapaian API key.*
*Nota: `OpenAI Compatible` bertujuan untuk gateway dan proxy tersuai. Tetapkan Base URL, dasar API key, dan model ID mengikut dokumentasi penyedia anda.*

## Penggunaan Rangkaian & Pengendalian Data

Notemd berjalan secara setempat di dalam Obsidian, tetapi sebahagian ciri menghantar request keluar.

### Panggilan ke Penyedia LLM (Boleh Dikonfigurasi)

- Trigger: pemprosesan fail, penjanaan, terjemahan, ringkasan penyelidikan, ringkasan Mermaid, dan aksi sambungan atau diagnostik.
- Endpoint: Base URL penyedia yang anda konfigurasikan dalam tetapan Notemd.
- Data yang dihantar: teks prompt dan kandungan tugas yang diperlukan untuk pemprosesan.
- Nota pengendalian data: API key dikonfigurasi secara setempat dalam tetapan plugin dan digunakan untuk menandatangani request daripada peranti anda.

### Panggilan Penyelidikan Web (Opsional)

- Trigger: apabila penyelidikan web diaktifkan dan penyedia carian dipilih.
- Endpoint: Tavily API atau endpoint DuckDuckGo.
- Data yang dihantar: query penyelidikan anda dan metadata request yang diperlukan.

### Diagnostik Pengembang & Log Debug (Opsional)

- Trigger: mod debug API dan aksi diagnostik developer.
- Penyimpanan: log diagnostik dan log ralat ditulis ke root vault anda, contohnya `Notemd_Provider_Diagnostic_*.txt` dan `Notemd_Error_Log_*.txt`.
- Nota risiko: log boleh mengandungi petikan request atau response. Semak log sebelum berkongsi secara umum.

### Penyimpanan Lokal

- Konfigurasi plugin disimpan dalam `.obsidian/plugins/notemd/data.json`.
- Fail yang dijana, laporan, dan log opsional disimpan dalam vault anda mengikut tetapan yang dipilih.

## Penyelesaian Masalah

### Masalah Umum
- **Plugin Tidak Dimuatkan**: Pastikan `manifest.json`, `main.js`, dan `styles.css` berada dalam folder yang betul, iaitu `<Vault>/.obsidian/plugins/notemd/`, kemudian mulakan semula Obsidian. Semak Developer Console, melalui `Ctrl+Shift+I` atau `Cmd+Option+I`, untuk melihat ralat semasa startup.
- **Kegagalan Pemprosesan / Ralat API**:
  1. **Semak Format Fail**: Pastikan fail yang anda mahu proses atau semak mempunyai sambungan `.md` atau `.txt`. Pada masa ini Notemd hanya menyokong format berasaskan teks ini.
  2. Gunakan perintah atau butang "Test LLM Connection" untuk mengesahkan tetapan bagi penyedia aktif.
  3. Periksa semula API Key, Base URL, Model Name, dan API Version untuk Azure. Pastikan API key itu betul dan mempunyai kredit atau kebenaran yang mencukupi.
  4. Pastikan pelayan LLM tempatan anda, seperti LMStudio atau Ollama, sedang berjalan dan Base URL yang digunakan adalah betul, contohnya `http://localhost:1234/v1` untuk LMStudio.
  5. Semak sambungan internet anda jika menggunakan penyedia awan.
  6. **Untuk ralat pemprosesan satu fail:** Semak Developer Console untuk mesej ralat yang terperinci. Anda juga boleh menyalinnya menggunakan butang dalam error modal jika perlu.
  7. **Untuk ralat pemprosesan batch:** Semak fail `error_processing_filename.log` dalam root vault anda untuk mesej ralat terperinci bagi setiap fail yang gagal. Developer Console atau error modal mungkin hanya memaparkan ringkasan atau ralat batch umum.
  8. **Log Ralat Automatik:** Jika sesuatu proses gagal, plugin akan menyimpan fail log terperinci bernama `Notemd_Error_Log_[Timestamp].txt` di root vault anda secara automatik. Fail ini mengandungi mesej ralat, stack trace, dan log sesi. Jika anda menghadapi masalah yang berterusan, semak fail ini. Mengaktifkan "API Error Debugging Mode" dalam tetapan akan menjadikan log ini mengandungi data response API yang lebih terperinci.
  9. **Diagnostik endpoint sebenar untuk permintaan panjang (developer)**:
     - Laluan dalam plugin, yang disyorkan sebagai langkah pertama: gunakan **Settings -> Notemd -> Developer provider diagnostic (long request)** untuk menjalankan runtime probe pada penyedia aktif dan menjana `Notemd_Provider_Diagnostic_*.txt` di root vault.
     - Laluan CLI, di luar runtime Obsidian: untuk perbandingan yang boleh dihasilkan semula antara tingkah laku buffered dan streaming pada peringkat endpoint, gunakan:
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
       Laporan yang dijana mengandungi masa bagi setiap attempt, seperti `First Byte` dan `Duration`, metadata request yang telah disanitasi, response headers, petikan body mentah atau separa, fragmen stream yang telah diparsing, serta titik kegagalan di peringkat pengangkutan.
- **Masalah Sambungan LM Studio/Ollama**:
  - **Ujian Sambungan Gagal**: Pastikan pelayan tempatan, sama ada LM Studio atau Ollama, sedang berjalan dan model yang betul telah dimuatkan atau tersedia.
  - **Ralat CORS (Ollama di Windows)**: Jika anda menghadapi ralat CORS ketika menggunakan Ollama di Windows, anda mungkin perlu menetapkan pembolehubah persekitaran `OLLAMA_ORIGINS`. Anda boleh melakukannya dengan menjalankan `set OLLAMA_ORIGINS=*` dalam command prompt sebelum memulakan Ollama. Ini membenarkan request daripada sebarang origin.
  - **Aktifkan CORS dalam LM Studio**: Untuk LM Studio, anda boleh mengaktifkan CORS secara terus dalam tetapan pelayan. Ini mungkin diperlukan jika Obsidian berjalan dalam pelayar atau mempunyai polisi origin yang ketat.
- **Ralat Penciptaan Folder ("File name cannot contain...")**:
  - Ini biasanya bermakna laluan yang anda masukkan dalam tetapan, sama ada **Processed File Folder Path** atau **Concept Note Folder Path**, adalah **tidak sah bagi Obsidian**.
  - **Pastikan anda menggunakan laluan relatif**, seperti `Processed` atau `Notes/Concepts`, dan **bukan laluan mutlak**, seperti `C:\Users\...` atau `/Users/...`.
  - Semak aksara yang tidak sah: `* " \ / < > : | ? # ^ [ ]`. Perhatikan bahawa `\` juga tidak sah pada Windows bagi laluan Obsidian. Gunakan `/` sebagai pemisah laluan.
- **Masalah Prestasi**: Memproses fail yang besar atau banyak fail boleh mengambil masa. Kurangkan tetapan "Chunk Word Count" untuk potensi pemprosesan yang lebih pantas, walaupun dengan lebih banyak API call. Cuba penyedia LLM atau model yang lain jika perlu.
- **Pautan yang Tidak Dijangka**: Kualiti pautan sangat bergantung pada LLM dan prompt yang digunakan. Cuba bereksperimen dengan model atau tetapan temperature yang berbeza.

## Sumbangan

Sumbangan amat dialu-alukan. Sila rujuk repositori GitHub untuk garis panduan: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumen Penyelenggara

- [Aliran keluaran (Bahasa Inggeris)](./docs/maintainer/release-workflow.md)
- [Aliran keluaran (Cina Ringkas)](./docs/maintainer/release-workflow.zh-CN.md)

## Lesen

Lesen MIT - lihat fail [LICENSE](LICENSE) untuk butiran.

---

*Notemd v1.8.1 - Perkayakan graf pengetahuan Obsidian anda dengan AI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
