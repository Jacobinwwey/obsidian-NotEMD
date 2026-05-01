![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Plugin Notemd untuk Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Baca dokumentasi dalam lebih banyak bahasa di: [Pusat Bahasa](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Peningkatan Basis Pengetahuan Multi-Bahasa dengan AI
==================================================
```

Cara mudah untuk membangun knowledge base Anda sendiri.

Notemd meningkatkan alur kerja Obsidian Anda dengan mengintegrasikan berbagai Large Language Model (LLM) untuk memproses catatan multi-bahasa, membuat wiki-link otomatis untuk konsep penting, membuat concept note yang sesuai, melakukan riset web, dan membantu Anda membangun knowledge graph yang kuat.

**Versi:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Daftar Isi

- [Mulai Cepat](#mulai-cepat)
- [Dukungan Bahasa](#dukungan-bahasa)
- [Fitur](#fitur)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Penyedia LLM yang Didukung](#penyedia-llm-yang-didukung)
- [Penggunaan Jaringan & Penanganan Data](#penggunaan-jaringan--penanganan-data)
- [Pemecahan Masalah](#pemecahan-masalah)
- [Kontribusi](#kontribusi)
- [Dokumen Maintainer](#dokumen-maintainer)
- [Lisensi](#lisensi)

## Mulai Cepat

1. **Instal & Aktifkan**: dapatkan plugin dari Obsidian Marketplace.
2. **Konfigurasi LLM**: buka `Settings -> Notemd`, pilih penyedia LLM Anda, misalnya OpenAI atau penyedia lokal seperti Ollama, lalu masukkan API key atau URL.
3. **Buka Sidebar**: klik ikon tongkat sihir Notemd di ribbon kiri untuk membuka sidebar.
4. **Proses Catatan**: buka catatan apa pun dan klik **"Process File (Add Links)"** di sidebar untuk menambahkan `[[wiki-links]]` secara otomatis ke konsep penting.
5. **Jalankan Quick Workflow**: gunakan tombol default **"One-Click Extract"** untuk merangkai pemrosesan, generasi batch, dan pembersihan Mermaid dari satu titik masuk.

Selesai. Jelajahi pengaturan untuk membuka fitur tambahan seperti riset web, terjemahan, dan generasi konten.

## Dukungan Bahasa

### Kontrak Perilaku Bahasa

| Aspek | Cakupan | Default | Catatan |
|---|---|---|---|
| `Bahasa antarmuka` | Teks UI plugin saja, seperti pengaturan, sidebar, pemberitahuan, dan dialog | `auto` | Mengikuti locale Obsidian; katalog UI saat ini adalah `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, dan `zh-TW`. |
| `Bahasa output tugas` | Output tugas yang dihasilkan LLM, seperti link, ringkasan, generasi, ekstraksi, dan target terjemahan | `en` | Bisa global atau per-task jika `Gunakan bahasa berbeda untuk tugas` diaktifkan. |
| `Nonaktifkan terjemahan otomatis` | Tugas non-Translate mempertahankan konteks bahasa sumber | `false` | Tugas `Translate` eksplisit tetap memaksa bahasa target yang dikonfigurasi. |
| Locale cadangan | Resolusi key UI yang hilang | locale -> `en` | Menjaga UI tetap stabil ketika sebagian key belum diterjemahkan. |

- Dokumen sumber yang dipelihara adalah bahasa Inggris dan Mandarin Sederhana, dan terjemahan README yang telah diterbitkan ditautkan pada header di atas.
- Cakupan locale UI di dalam aplikasi saat ini persis sesuai dengan katalog eksplisit di kode: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Fallback bahasa Inggris tetap menjadi jaring pengaman implementasi, tetapi permukaan UI yang didukung telah dicakup oleh regression tests dan tidak seharusnya diam-diam kembali ke bahasa Inggris saat penggunaan normal.
- Detail tambahan dan panduan kontribusi dilacak di [Pusat Bahasa](./docs/i18n/README.md).

## Fitur

### Pemrosesan Dokumen Bertenaga AI
- **Dukungan Multi-LLM**: terhubung ke berbagai penyedia LLM cloud dan lokal. Lihat [Penyedia LLM yang Didukung](#penyedia-llm-yang-didukung).
- **Smart Chunking**: dokumen besar otomatis dibagi menjadi chunk yang mudah ditangani berdasarkan jumlah kata.
- **Preservasi Konten**: berupaya menjaga format asli sambil menambahkan struktur dan link.
- **Pelacakan Progress**: pembaruan waktu nyata melalui Notemd Sidebar atau progress modal.
- **Operasi Dapat Dibatalkan**: setiap tugas pemrosesan yang dimulai dari sidebar dapat dibatalkan lewat tombol cancel khusus. Operasi dari command palette menggunakan modal yang juga bisa dibatalkan.
- **Konfigurasi Multi-Model**: gunakan penyedia LLM berbeda dan model spesifik untuk tugas berbeda, seperti Add Links, Research, Generate Title, dan Translate, atau satu penyedia untuk semuanya.
- **Stable API Calls (Retry Logic)**: Anda dapat mengaktifkan retry otomatis untuk panggilan API LLM yang gagal dengan interval dan batas percobaan yang bisa dikonfigurasi.
- **Pengujian Koneksi Penyedia yang Lebih Tangguh**: jika tes koneksi pertama gagal karena pemutusan jaringan sementara, Notemd otomatis berpindah ke stable retry sequence sebelum menyatakan gagal. Ini mencakup OpenAI-compatible, Anthropic, Google, Azure OpenAI, dan Ollama.
- **Fallback Transport Sesuai Runtime**: ketika request panjang ke penyedia terputus di `requestUrl` karena error jaringan sementara seperti `ERR_CONNECTION_CLOSED`, Notemd mengulang attempt yang sama melalui fallback transport berdasarkan lingkungan. Build desktop memakai Node `http/https`, sementara lingkungan non-desktop memakai browser `fetch`. Ini mengurangi false failure pada gateway lambat dan reverse proxy.
- **Penguatan Rantai Permintaan Panjang untuk OpenAI-Compatible**: dalam stable mode, panggilan OpenAI-compatible kini memakai urutan eksplisit tiga tahap per attempt: direct streaming transport, direct non-stream transport, lalu `requestUrl` fallback, yang masih dapat naik ke streamed parsing jika dibutuhkan. Ini mengurangi false negative ketika penyedia menyelesaikan respons buffered tetapi pipa streaming tidak stabil.
- **Protocol-Aware Streaming Fallback di Seluruh API LLM**: fallback attempt untuk permintaan panjang kini menggunakan streamed parsing yang paham protokol di seluruh jalur LLM bawaan, bukan hanya endpoint OpenAI-compatible. Notemd sekarang menangani OpenAI/Azure SSE, Anthropic Messages streaming, Google Gemini SSE, dan Ollama NDJSON, baik di `http/https` desktop maupun `fetch` non-desktop, dan entrypoint lain bergaya OpenAI memakai fallback path yang sama.
- **Preset Siap Pakai untuk Penyedia Tiongkok**: preset bawaan kini mencakup `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, dan `SiliconFlow`, di samping penyedia global dan lokal yang sudah ada.
- **Pemrosesan Batch Andal**: logika concurrent processing ditingkatkan dengan **staggered API calls** untuk mencegah rate limiting dan menjaga performa stabil pada batch job besar. Tugas kini dimulai pada interval yang berbeda, bukan semuanya sekaligus.
- **Pelaporan Progress Akurat**: bug yang membuat progress bar bisa macet telah diperbaiki, sehingga UI kini selalu mencerminkan status operasi yang sebenarnya.
- **Parallel Batch Processing yang Lebih Kuat**: masalah yang membuat operasi batch paralel berhenti terlalu cepat telah diselesaikan, sehingga semua file diproses secara andal dan efisien.
- **Akurasi Progress Bar**: bug yang membuat progress bar untuk perintah "Create Wiki-Link & Generate Note" macet di 95% telah diperbaiki, dan sekarang menampilkan 100% saat selesai.
- **API Debugging yang Ditingkatkan**: "API Error Debugging Mode" kini menangkap full response body dari penyedia LLM dan layanan pencarian, seperti Tavily dan DuckDuckGo, serta mencatat timeline transport per attempt dengan request URL yang sudah disanitasi, durasi, response headers, partial response body, parsed partial stream output, dan stack traces untuk mempermudah troubleshooting di jalur OpenAI-compatible, Anthropic, Google, Azure OpenAI, dan Ollama fallback.
- **Panel Developer Mode**: settings kini memiliki panel diagnostik khusus developer yang tetap tersembunyi sampai "Developer mode" diaktifkan. Panel ini mendukung pemilihan diagnostic call path dan menjalankan repeated stability probe untuk mode yang dipilih.
- **Sidebar yang Didesain Ulang**: aksi bawaan dikelompokkan ke dalam section yang lebih fokus dengan label yang lebih jelas, status live, progress yang bisa dibatalkan, dan log yang bisa disalin untuk mengurangi kekacauan sidebar. Footer progress dan log tetap terlihat meskipun semua section dibuka.
- **Penyempurnaan Interaksi & Keterbacaan Sidebar**: tombol sidebar kini memberi umpan balik hover, press, dan focus yang lebih jelas, dan tombol CTA berwarna, termasuk `One-Click Extract` dan `Batch generate from titles`, memiliki kontras teks yang lebih kuat untuk keterbacaan yang lebih baik di berbagai tema.
- **Single-File CTA Mapping**: gaya CTA berwarna kini dikhususkan hanya untuk aksi single-file. Aksi batch atau tingkat folder dan workflow campuran memakai gaya non-CTA untuk mengurangi salah klik terkait cakupan aksi.
- **Custom One-Click Workflows**: ubah utilitas sidebar bawaan menjadi tombol yang dapat dipakai ulang dengan nama khusus dan rangkaian aksi yang dirakit sendiri. Workflow default `One-Click Extract` sudah tersedia langsung.

### Peningkatan Knowledge Graph
- **Automatic Wiki-Linking**: mengidentifikasi konsep inti dan menambahkan `[[wiki-links]]` ke catatan yang diproses berdasarkan output LLM.
- **Pembuatan Concept Note yang Opsional & Dapat Dikustomisasi**: otomatis membuat catatan baru untuk konsep yang ditemukan di folder vault yang Anda tentukan.
- **Customizable Output Paths**: atur path relatif terpisah di dalam vault untuk menyimpan processed files dan concept note yang baru dibuat.
- **Customizable Output Filenames (Add Links)**: Anda dapat memilih untuk **menimpa file asli** atau memakai suffix atau replacement string kustom sebagai pengganti `_processed.md` saat memproses file untuk menambah link.
- **Link Integrity Maintenance**: ada penanganan dasar untuk memperbarui link ketika catatan diubah nama atau dihapus di dalam vault.
- **Pure Concept Extraction**: ekstrak konsep dan buat concept note terkait tanpa mengubah dokumen asli. Ini ideal untuk mengisi knowledge base dari dokumen yang sudah ada tanpa menyentuh file sumber. Fitur ini memiliki opsi untuk membuat concept note minimal dan menambahkan backlink.

### Terjemahan

- **AI-Powered Translation**:
  - Menerjemahkan konten catatan menggunakan LLM yang dikonfigurasi.
  - **Dukungan File Besar**: file besar otomatis dibagi menjadi chunk yang lebih kecil berdasarkan `Chunk word count` sebelum dikirim ke LLM, lalu hasil terjemahannya digabung kembali dengan mulus menjadi satu dokumen.
  - Mendukung terjemahan antarbanyak bahasa.
  - Bahasa target dapat dikustomisasi dari settings atau UI.
  - Teks hasil terjemahan bisa dibuka otomatis di pane sebelah kanan dari teks asli agar mudah dibandingkan.
- **Terjemahan batch**:
  - Menerjemahkan semua file dalam folder yang dipilih.
  - Mendukung pemrosesan paralel jika "Enable Batch Parallelism" aktif.
  - Menggunakan custom prompts untuk terjemahan jika sudah dikonfigurasi.
  - Menambahkan opsi "Batch translate this folder" ke menu konteks file explorer.
- **Matikan terjemahan otomatis**: jika diaktifkan, tugas non-Translate tidak lagi memaksa output ke bahasa tertentu, sehingga konteks bahasa asli tetap terjaga. Tugas `Translate` eksplisit tetap menerjemahkan sesuai konfigurasi.

### Riset Web & Generasi Konten
- **Riset web dan peringkasan**:
  - Melakukan pencarian web menggunakan Tavily, yang memerlukan API key, atau DuckDuckGo, yang masih eksperimental.
  - **Search Robustness yang Lebih Baik**: DuckDuckGo search sekarang memiliki parsing logic yang lebih tangguh menggunakan DOMParser dengan Regex fallback untuk menghadapi perubahan layout.
  - Merangkum hasil pencarian menggunakan LLM yang dikonfigurasi.
  - Bahasa output ringkasan dapat diatur di settings.
  - Ringkasan ditambahkan ke catatan saat ini.
  - Tersedia batas token yang bisa dikonfigurasi untuk research content yang dikirim ke LLM.
- **Pembuatan konten dari judul**:
  - Menggunakan judul catatan untuk menghasilkan konten awal lewat LLM, menggantikan konten yang sudah ada.
  - **Optional Research**: Anda dapat mengatur agar web research dilakukan terlebih dahulu menggunakan search provider yang dipilih lalu memasukkan hasilnya sebagai context ke prompt.
- **Batch Content Generation from Titles**: menghasilkan konten untuk semua catatan di folder yang dipilih berdasarkan judul masing-masing, sambil tetap menghormati pengaturan riset opsional. File yang berhasil diproses dipindahkan ke **subfolder "complete" yang dapat dikonfigurasi**, seperti `[foldername]_complete` atau nama custom, untuk menghindari pemrosesan ulang.
- **Mermaid Auto-Fix Coupling**: ketika Mermaid auto-fix diaktifkan, alur kerja terkait Mermaid secara otomatis memperbaiki generated files atau output folder setelah pemrosesan. Ini mencakup Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, dan Translate.

### Fitur Utilitas
- **Ringkas sebagai diagram Mermaid**:
  - Fitur ini memungkinkan Anda merangkum isi catatan menjadi Mermaid diagram.
  - Bahasa output Mermaid dapat dikustomisasi di settings.
  - **Mermaid Output Folder**: Anda bisa menentukan folder tempat generated Mermaid files disimpan.
  - **Translate Summarize to Mermaid Output**: Anda dapat memilih untuk menerjemahkan konten Mermaid yang dihasilkan ke bahasa target yang dikonfigurasi.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Simple Formula Format Correction**:
  - Memperbaiki formula matematika satu baris yang dibatasi oleh `$` tunggal menjadi blok `$$` yang standar.
  - **Single File**: memproses file saat ini melalui tombol sidebar atau command palette.
  - **Batch Fix**: memproses semua file di folder yang dipilih melalui tombol sidebar atau command palette.

- **Check for Duplicates in Current File**: perintah ini membantu mengidentifikasi istilah yang mungkin duplikat di file aktif.
- **Duplicate Detection**: pemeriksaan dasar terhadap kata yang berulang di dalam konten file yang diproses. Hasilnya dicatat ke console.
- **Check and Remove Duplicate Concept Notes**: mengidentifikasi concept note yang berpotensi duplikat di dalam **Concept Note Folder** yang dikonfigurasi berdasarkan exact name match, bentuk jamak, normalisasi, dan containment untuk single-word, dibandingkan dengan catatan di luar folder tersebut. Cakupan perbandingan dapat diatur ke **seluruh vault**, **folder include tertentu**, atau **seluruh folder kecuali yang dikecualikan**. Plugin lalu menampilkan daftar rinci beserta alasan dan file yang konflik, serta meminta konfirmasi sebelum memindahkan duplicate yang teridentifikasi ke system trash. Progress penghapusan juga ditampilkan.
- **Batch Mermaid Fix**: menerapkan koreksi sintaks Mermaid dan LaTeX ke semua file Markdown dalam folder yang dipilih pengguna.
  - **Workflow Ready**: dapat dipakai sebagai utilitas mandiri atau sebagai langkah dalam custom one-click workflow button.
  - **Error Reporting**: menghasilkan file `mermaid_error_{foldername}.md` yang mencantumkan file yang masih mengandung potensi error Mermaid setelah diproses.
  - **Move Error Files**: opsional memindahkan file yang masih terdeteksi bermasalah ke folder terpisah untuk review manual.
  - **Smart Detection**: sekarang file diperiksa dulu dengan `mermaid.parse` sebelum dilakukan perbaikan, sehingga menghemat waktu dan menghindari edit yang tidak perlu.
  - **Safe Processing**: perbaikan sintaks diterapkan hanya ke Mermaid code block, sehingga tidak merusak Markdown table atau konten lain. Ada safeguard kuat untuk melindungi syntax tabel seperti `| :--- |`.
  - **Deep Debug Mode**: jika error masih ada setelah perbaikan awal, mode deep debug lanjutan akan dijalankan. Mode ini menangani edge case kompleks, termasuk:
    - **Comment Integration**: menggabungkan komentar ekor yang diawali `%` ke edge label. Contoh `A -- Label --> B; % Comment` menjadi `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: memperbaiki arrow yang terserap ke dalam quote, seperti `A -- "Label -->" B` menjadi `A -- "Label" --> B`.
    - **Inline Subgraphs**: mengonversi inline subgraph labels menjadi edge label.
    - **Reverse Arrow Fix**: memperbaiki `X <-- Y` yang non-standar menjadi `Y --> X`.
    - **Direction Keyword Fix**: memastikan keyword `direction` menjadi huruf kecil di dalam subgraph, misalnya `Direction TB` -> `direction TB`.
    - **Comment Conversion**: mengubah komentar `//` menjadi edge label, misalnya `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: menyederhanakan label yang berulang dalam bracket, misalnya `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: mengubah syntax `--|>` yang tidak valid menjadi `-->`.
    - **Robust Label & Note Handling**: meningkatkan penanganan label yang mengandung karakter khusus seperti `/`, dan memperbaiki dukungan untuk note syntax kustom seperti `note for ...`, sambil menghapus artefak sisa seperti bracket yang tertinggal.
    - **Advanced Fix Mode**: mencakup perbaikan tangguh untuk unquoted node labels yang memiliki spasi, karakter khusus, atau nested brackets, misalnya `Node[Label [Text]]` -> `Node["Label [Text]"]`, agar diagram kompleks seperti Stellar Evolution dapat diproses dengan baik. Juga memperbaiki edge label rusak seperti `--["Label["-->` menjadi `-- "Label" -->`.
    - **Note Conversion**: otomatis mengubah `note right/left of` dan standalone `note :` comments menjadi node dan koneksi Mermaid standar, misalnya `note right of A: text` menjadi `NoteA["Note: text"]` yang terhubung ke `A`. Mendukung arrow links (`-->`) maupun solid links (`---`).
    - **Extended Note Support**: otomatis mengubah `note for Node "Content"` dan `note of Node "Content"` menjadi linked note node standar, misalnya `NoteNode[" Content"]`, yang terhubung ke node asal.
    - **Enhanced Note Correction**: otomatis mengganti nama note dengan penomoran berurutan seperti `Note1`, `Note2`, dan seterusnya untuk mencegah aliasing saat ada banyak note.
    - **Parallelogram/Shape Fix**: memperbaiki shape yang rusak seperti `[/["Label["/]` menjadi `["Label"]`.
    - **Standardize Pipe Labels**: otomatis memperbaiki edge labels dengan pipe dan menstandarkannya agar dikutip dengan benar, misalnya `-->|Text|` menjadi `-->|"Text"|` dan `-->|Math|^2|` menjadi `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: memperbaiki edge label yang berada sebelum arrow, misalnya `>|"Label"| A --> B` menjadi `A -->|"Label"| B`.
    - **Merge Double Labels**: mendeteksi dan menggabungkan double label kompleks pada satu edge, seperti `A -- Label1 -- Label2 --> B`, menjadi satu label dengan line breaks, misalnya `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: secara otomatis mengutip node labels yang mengandung karakter bermasalah seperti quote, `=`, atau operator matematika, tetapi belum memiliki outer quotes.
    - **Intermediate Node Fix**: memisahkan edge yang berisi definisi node perantara menjadi dua edge terpisah. Contohnya `A -- B[...] --> C` menjadi `A --> B[...]` dan `B[...] --> C`.
    - **Concatenated Label Fix**: memperbaiki node definition yang ID-nya menempel dengan label, seperti `SubdivideSubdivide...` menjadi `Subdivide["Subdivide..."]`, bahkan ketika ada pipe labels sebelumnya atau duplikasinya tidak persis sama.
    - **Extract Specific Original Text**:
      - Menyediakan daftar pertanyaan di settings.
      - Mengekstrak potongan teks verbatim dari catatan aktif yang menjawab pertanyaan tersebut.
      - **Merged Query Mode**: memproses semua pertanyaan dalam satu API call untuk efisiensi.
      - **Translation**: menambahkan terjemahan dari teks yang diekstrak ke output.
      - **Custom Output**: menyediakan save path dan suffix nama file yang bisa dikonfigurasi untuk extracted text file.
  - **LLM Connection Test**: untuk memverifikasi pengaturan API penyedia aktif.

## Instalasi

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Dari Obsidian Marketplace (Disarankan)
1. Buka **Settings** -> **Community plugins** di Obsidian.
2. Pastikan "Restricted mode" dalam keadaan **off**.
3. Klik **Browse** pada community plugins dan cari "Notemd".
4. Klik **Install**.
5. Setelah terinstal, klik **Enable**.

### Instalasi Manual
1. Unduh release assets terbaru dari [halaman GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Setiap release juga menyertakan `README.md` sebagai referensi, tetapi untuk instalasi manual Anda hanya memerlukan `main.js`, `styles.css`, dan `manifest.json`.
2. Arahkan ke folder konfigurasi vault Obsidian Anda: `<YourVault>/.obsidian/plugins/`.
3. Buat folder baru bernama `notemd`.
4. Salin `main.js`, `styles.css`, dan `manifest.json` ke folder `notemd`.
5. Restart Obsidian.
6. Buka **Settings** -> **Community plugins** dan aktifkan "Notemd".

## Konfigurasi

Akses settings plugin melalui:
**Settings** -> **Community Plugins** -> **Notemd** (klik ikon gear).

### Konfigurasi Penyedia LLM
1. **Penyedia aktif**: pilih penyedia LLM yang ingin digunakan dari dropdown.
2. **Pengaturan penyedia**: konfigurasikan pengaturan spesifik untuk penyedia yang dipilih:
   - **Kunci API**: diperlukan untuk sebagian besar penyedia cloud, seperti OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, dan Requesty. Tidak dibutuhkan untuk Ollama. Bersifat opsional untuk LM Studio dan preset `OpenAI Compatible` jika endpoint Anda menerima akses anonim atau placeholder.
   - **URL dasar / endpoint**: endpoint API dari layanan. Default sudah disediakan, tetapi Anda mungkin perlu mengubahnya untuk model lokal, seperti LMStudio dan Ollama, untuk gateway seperti OpenRouter, Requesty, dan OpenAI Compatible, atau untuk deployment Azure tertentu. **Wajib untuk Azure OpenAI.**
   - **Model**: nama atau ID model spesifik yang akan digunakan, seperti `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, atau `anthropic/claude-3-7-sonnet-latest`. Pastikan model tersedia pada endpoint atau penyedia Anda.
   - **Temperatur**: mengatur tingkat keacakan output LLM. `0` lebih deterministik, `1` paling kreatif. Nilai rendah seperti `0.2-0.5` biasanya lebih cocok untuk tugas terstruktur.
   - **Versi API (khusus Azure)**: diperlukan untuk deployment Azure OpenAI, misalnya `2024-02-15-preview`.
3. **Uji koneksi**: gunakan tombol "Uji koneksi" untuk penyedia aktif guna memverifikasi pengaturan Anda. Penyedia OpenAI-compatible sekarang menggunakan pengecekan yang menyesuaikan jenis penyedia: endpoint seperti `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio`, dan `OpenAI Compatible` menguji `chat/completions` secara langsung, sedangkan penyedia yang mempunyai endpoint `/models` yang andal masih bisa memulai dengan daftar model. Jika probe pertama gagal karena putus jaringan sementara seperti `ERR_CONNECTION_CLOSED`, Notemd otomatis berpindah ke urutan percobaan ulang stabil alih-alih langsung gagal.
4. **Kelola konfigurasi penyedia**: gunakan tombol "Export Providers" dan "Import Providers" untuk menyimpan atau memuat pengaturan penyedia LLM ke atau dari file `notemd-providers.json` di dalam direktori konfigurasi plugin. Ini memudahkan backup dan berbagi konfigurasi.
5. **Cakupan preset**: selain penyedia asli, Notemd sekarang juga menyertakan preset untuk `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, serta target generik `OpenAI Compatible` untuk LiteLLM, vLLM, Perplexity, Vercel AI Gateway, atau proxy kustom.

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Konfigurasi Multi-Model
- **Gunakan penyedia berbeda untuk tugas**:
  - **Nonaktif (default)**: menggunakan satu "penyedia aktif" untuk semua tugas.
  - **Aktif**: memungkinkan Anda memilih penyedia spesifik dan, jika diinginkan, mengganti nama model untuk setiap tugas, seperti "Add Links", "Research & Summarize", "Generate from Title", "Translate", dan "Extract Concepts". Jika field penggantian model dibiarkan kosong, model default dari penyedia yang dipilih untuk tugas itu yang akan dipakai.
- **Pilih bahasa berbeda untuk tugas berbeda**:
  - **Nonaktif (default)**: menggunakan satu "bahasa output" untuk semua tugas.
  - **Aktif**: memungkinkan pemilihan bahasa spesifik untuk setiap tugas, seperti "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", dan "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Arsitektur Bahasa (locale UI vs bahasa output tugas)

- **Locale UI** hanya mengontrol teks antarmuka plugin, seperti label pengaturan, tombol bilah samping, pemberitahuan, dan dialog. Mode default `auto` mengikuti bahasa UI Obsidian saat ini.
- Varian regional atau sistem tulisan kini dipetakan ke katalog terbitan terdekat alih-alih langsung jatuh ke bahasa Inggris. Misalnya, `fr-CA` memakai bahasa Prancis, `es-419` memakai bahasa Spanyol, `pt-PT` memakai bahasa Portugis, `zh-Hans` memakai bahasa Mandarin Sederhana, dan `zh-Hant-HK` memakai bahasa Mandarin Tradisional.
- **Bahasa output tugas** mengontrol output tugas yang dihasilkan model, seperti link, ringkasan, pembuatan judul, ringkasan Mermaid, ekstraksi konsep, dan target terjemahan.
- **Mode bahasa per tugas** memungkinkan tiap tugas menentukan bahasa output-nya sendiri melalui satu lapisan kebijakan terpadu, bukan melalui penggantian yang tersebar di berbagai modul.
- **Nonaktifkan terjemahan otomatis** menjaga tugas non-Translate tetap berada dalam konteks bahasa sumber, sedangkan tugas Translate yang eksplisit tetap memaksa bahasa target yang telah dikonfigurasi.
- Jalur generasi terkait Mermaid mengikuti kebijakan bahasa yang sama dan masih dapat memicu Mermaid auto-fix ketika diaktifkan.

### Pengaturan Panggilan API Stabil
- **Aktifkan panggilan API stabil (logika percobaan ulang)**:
  - **Nonaktif (default)**: satu kegagalan API akan menghentikan tugas saat ini.
  - **Aktif**: otomatis mencoba ulang panggilan LLM API yang gagal. Ini berguna untuk gangguan jaringan sesekali atau pembatasan laju.
  - **Cadangan uji koneksi**: bahkan ketika panggilan normal tidak berjalan di stable mode, tes koneksi akan berpindah ke urutan percobaan ulang yang sama setelah kegagalan jaringan sementara pertama.
  - **Cadangan transport saat runtime (berdasarkan lingkungan)**: request tugas yang berjalan lama dan putus sementara di `requestUrl` kini akan mengulang attempt yang sama lewat cadangan transport yang menyesuaikan lingkungan. Build desktop menggunakan Node `http/https`; lingkungan non-desktop menggunakan browser `fetch`. Attempt cadangan tersebut sekarang memakai parsing aliran yang paham protokol di seluruh jalur LLM bawaan, mencakup OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE, dan Ollama NDJSON, sehingga gateway lambat bisa mengembalikan potongan body lebih awal. Entrypoint lain bergaya OpenAI langsung memakai jalur cadangan yang sama.
  - **Urutan stabil untuk OpenAI-compatible**: dalam stable mode, setiap OpenAI-compatible attempt kini mengikuti urutan `direct streaming -> direct non-stream -> requestUrl (dengan streamed fallback bila perlu)` sebelum dihitung sebagai attempt gagal. Ini mencegah kegagalan yang terlalu agresif ketika hanya satu mode transport yang bermasalah.
- **Interval percobaan ulang (detik)**: hanya terlihat saat fitur diaktifkan. Menentukan jeda antar percobaan ulang, dari 1 sampai 300 detik. Default: 5.
- **Jumlah maksimum percobaan ulang**: hanya terlihat saat fitur diaktifkan. Menentukan jumlah maksimum percobaan ulang, dari 0 sampai 10. Default: 3.
- **Mode debug kesalahan API**:
  - **Nonaktif (default)**: menggunakan pelaporan error yang ringkas dan standar.
  - **Aktif**: mengaktifkan logging error yang detail untuk semua penyedia dan semua tugas, termasuk Translate, Search, dan Connection Tests. Logging ini mencakup HTTP status codes, raw response text, request transport timelines, sanitized request URLs dan headers, elapsed attempt durations, response headers, partial response bodies, parsed partial stream output, dan stack traces.
- **Mode pengembang**:
  - **Nonaktif (default)**: menyembunyikan semua kontrol diagnostik khusus pengembang.
  - **Aktif**: menampilkan panel diagnostik pengembang khusus di pengaturan.
- **Diagnostik penyedia untuk pengembang (permintaan panjang)**:
  - **Mode panggilan diagnostik**: memilih runtime path untuk setiap probe. Penyedia OpenAI-compatible mendukung forced mode tambahan, seperti `direct streaming`, `direct buffered`, dan `requestUrl-only`, di samping runtime mode biasa.
  - **Jalankan diagnostik**: menjalankan satu long-request probe dengan call mode yang dipilih dan menulis `Notemd_Provider_Diagnostic_*.txt` di root vault.
  - **Jalankan uji stabilitas**: mengulangi probe untuk jumlah run yang dapat dikonfigurasi, dari 1 sampai 10, menggunakan call mode yang dipilih lalu menyimpan aggregated stability report.
  - **Batas waktu diagnostik**: batas waktu per run yang dapat dikonfigurasi, dari 15 sampai 3600 detik.
  - **Mengapa berguna**: lebih cepat daripada reproduksi manual ketika penyedia lolos "Test connection" tetapi gagal pada tugas nyata yang berjalan lama, misalnya terjemahan lewat gateway yang lambat.

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Pengaturan Umum

#### Output File yang Diproses
- **Customize Processed File Save Path**:
  - **Dinonaktifkan (bawaan)**: processed files, misalnya `YourNote_processed.md`, disimpan di **folder yang sama** dengan file asli.
  - **Diaktifkan**: memungkinkan Anda menentukan lokasi simpan khusus.
- **Processed File Folder Path**: hanya terlihat saat opsi di atas aktif. Masukkan **path relatif** di dalam vault, seperti `Processed Notes` atau `Output/LLM`, tempat file hasil pemrosesan akan disimpan. Folder akan dibuat jika belum ada. **Jangan gunakan path absolut seperti `C:\...` atau karakter yang tidak valid.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Dinonaktifkan (bawaan)**: processed files dari perintah Add Links menggunakan suffix default `_processed.md`, misalnya `YourNote_processed.md`.
  - **Diaktifkan**: memungkinkan Anda mengkustomisasi output filename dengan pengaturan di bawah.
- **Custom Suffix/Replacement String**:
  - Jika field ini **kosong**, file asli akan **ditimpa** dengan konten yang telah diproses.
  - Jika Anda memasukkan string seperti `_linked`, string itu akan ditambahkan ke basename file, misalnya `YourNote_linked.md`. Pastikan suffix tidak mengandung karakter nama file yang tidak valid.
- **Remove Code Fences on Add Links**:
  - **Dinonaktifkan (bawaan)**: code fences **(\`\\\`\`)** tetap dipertahankan saat menambahkan link, dan **(\`\\\`markdown)** dihapus otomatis.
  - **Diaktifkan**: menghapus code fences sebelum proses Add Links dijalankan.

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Output Catatan Konsep
- **Customize Concept Note Path**:
  - **Dinonaktifkan (bawaan)**: pembuatan otomatis note untuk `[[linked concepts]]` dimatikan.
  - **Diaktifkan**: memungkinkan Anda memilih folder tempat concept notes baru akan dibuat.
- **Concept Note Folder Path**: hanya terlihat ketika opsi di atas diaktifkan. Masukkan **path relatif** di dalam vault, misalnya `Concepts` atau `Generated/Topics`. Folder akan dibuat otomatis bila belum ada. **Harus diisi jika fitur kustomisasi diaktifkan.** **Jangan gunakan path absolut atau karakter yang tidak valid.**

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Output File Log Konsep
- **Generate Concept Log File**:
  - **Dinonaktifkan (bawaan)**: tidak ada log file yang dibuat.
  - **Diaktifkan**: membuat log file yang berisi daftar concept notes baru setelah pemrosesan. Formatnya adalah:
    ```
    hasilkan xx file md konsep
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: terlihat hanya jika "Generate Concept Log File" aktif.
  - **Dinonaktifkan (bawaan)**: log file disimpan di **Concept Note Folder Path**, bila ada, atau di root vault jika tidak ada.
  - **Diaktifkan**: memungkinkan Anda memilih folder khusus untuk log file.
- **Concept Log Folder Path**: terlihat hanya jika "Customize Log File Save Path" aktif. Masukkan **path relatif** di dalam vault, misalnya `Logs/Notemd`. **Harus diisi bila kustomisasi diaktifkan.**
- **Customize Log File Name**: terlihat hanya jika "Generate Concept Log File" aktif.
  - **Dinonaktifkan (bawaan)**: log file bernama `Generate.log`.
  - **Diaktifkan**: memungkinkan Anda menentukan nama khusus.
- **Concept Log File Name**: terlihat hanya jika "Customize Log File Name" aktif. Masukkan nama file yang diinginkan, seperti `ConceptCreation.log`. **Harus diisi bila kustomisasi diaktifkan.**

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tugas Ekstrak Konsep
- **Buat concept note minimal**:
  - **Aktif (default)**: concept notes yang baru dibuat hanya berisi judul, seperti `# Concept`.
  - **Nonaktif**: concept notes dapat berisi konten tambahan, seperti backlink "Linked From", jika tidak dimatikan oleh pengaturan di bawah.
- **Tambahkan backlink "Linked From"**:
  - **Nonaktif (default)**: tidak menambahkan backlink ke dokumen sumber selama extraction.
  - **Aktif**: menambahkan bagian "Linked From" yang berisi backlink ke file sumber.

#### Ekstrak Teks Asli Tertentu
- **Questions for extraction**: masukkan daftar pertanyaan, satu pertanyaan per baris, yang ingin dijawab dengan kutipan verbatim dari catatan Anda.
- **Translate output to corresponding language**:
  - **Off (Default)**: output hanya berisi teks yang diekstrak dalam bahasa aslinya.
  - **On**: menambahkan terjemahan dari teks yang diekstrak dalam bahasa yang dipilih untuk tugas ini.
- **Merged query mode**:
  - **Off**: memproses tiap pertanyaan secara terpisah. Ini cenderung lebih presisi, tetapi membutuhkan lebih banyak API calls.
  - **On**: mengirim semua pertanyaan dalam satu prompt. Ini lebih cepat dan mengurangi jumlah panggilan API.
- **Customise extracted text save path & filename**:
  - **Off**: menyimpan hasil di folder yang sama dengan file asli menggunakan suffix `_Extracted`.
  - **On**: memungkinkan Anda menentukan output folder dan suffix nama file secara khusus.

#### Perbaikan Mermaid Batch
- **Enable Mermaid Error Detection**:
  - **Off (Default)**: error detection dilewati setelah pemrosesan.
  - **On**: memindai file hasil proses untuk menemukan Mermaid syntax error yang tersisa dan menghasilkan report `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: file yang masih memiliki error tetap berada di tempatnya.
  - **On**: memindahkan file yang masih mengandung Mermaid syntax error setelah proses fix ke folder khusus untuk review manual.
- **Mermaid error folder path**: terlihat jika opsi di atas aktif. Ini adalah folder tujuan file yang bermasalah.

#### Parameter Pemrosesan
- **Enable Batch Parallelism**:
  - **Dinonaktifkan (bawaan)**: tugas batch seperti "Process Folder" atau "Batch Generate from Titles" diproses secara serial, satu file pada satu waktu.
  - **Diaktifkan**: memungkinkan plugin memproses beberapa file secara paralel, sehingga batch besar bisa berjalan lebih cepat.
- **Batch Concurrency**: hanya terlihat jika parallelism aktif. Menentukan jumlah maksimum file yang diproses bersamaan. Nilai lebih tinggi bisa lebih cepat, tetapi menggunakan lebih banyak resource dan mungkin memicu API rate limits. Default: `1`, rentang: `1-20`.
- **Batch Size**: hanya terlihat jika parallelism aktif. Jumlah file yang dikelompokkan ke satu batch. Default: `50`, rentang: `10-200`.
- **Delay Between Batches (ms)**: hanya terlihat jika parallelism aktif. Delay opsional dalam milidetik antara satu batch dan batch berikutnya. Default: `1000ms`.
- **API Call Interval (ms)**: delay minimum sebelum dan sesudah tiap panggilan LLM API. Penting untuk API dengan rate rendah atau untuk menghindari error 429. Atur ke `0` untuk menonaktifkan artificial delay. Default: `500ms`.
- **Chunk Word Count**: jumlah kata maksimum per chunk yang dikirim ke LLM. Ini mempengaruhi jumlah API calls untuk file besar. Default: `3000`.
- **Enable Duplicate Detection**: mengaktifkan pemeriksaan dasar untuk kata duplikat di dalam processed content. Hasilnya muncul di console. Default: aktif.
- **Max Tokens**: jumlah token maksimum yang diizinkan untuk dihasilkan LLM per response chunk. Mempengaruhi biaya dan detail output. Default: `4096`.

<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Terjemahan
- **Default Target Language**: pilih bahasa target default yang Anda inginkan untuk terjemahan catatan. Pengaturan ini dapat dioverride di UI ketika perintah terjemahan dijalankan. Default: English.
- **Customise Translation File Save Path**:
  - **Dinonaktifkan (bawaan)**: translated files disimpan di **folder yang sama** dengan file asli.
  - **Diaktifkan**: memungkinkan Anda menentukan **path relatif** di dalam vault, misalnya `Translations`, tempat translated files akan disimpan. Folder akan dibuat bila belum ada.
- **Use custom suffix for translated files**:
  - **Dinonaktifkan (bawaan)**: translated files menggunakan suffix default `_translated.md`, misalnya `YourNote_translated.md`.
  - **Diaktifkan**: memungkinkan Anda menentukan suffix khusus.
- **Custom Suffix**: hanya terlihat bila opsi di atas aktif. Masukkan suffix khusus untuk nama translated files, misalnya `_es` atau `_fr`.

<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generasi Konten
- **Enable Research in "Generate from Title"**:
  - **Dinonaktifkan (bawaan)**: "Generate from Title" hanya menggunakan judul sebagai input.
  - **Diaktifkan**: melakukan web research memakai **Web Research Provider** yang dikonfigurasi, lalu menyertakan temuan itu sebagai context dalam prompt untuk title-based generation.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Diaktifkan (bawaan)**: otomatis menjalankan proses perbaikan Mermaid syntax setelah workflow terkait Mermaid, seperti Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, dan Translate.
  - **Disabled**: membiarkan Mermaid output tetap seperti yang dihasilkan sampai Anda menjalankan `Batch Mermaid Fix` secara manual atau menambahkannya ke custom workflow.
- **Output Language**:
  - Pilih bahasa output yang diinginkan untuk tugas "Generate from Title" dan "Batch Generate from Title".
  - **English (Default)**: prompt diproses dan dokumentasi akhir dihasilkan dalam bahasa Inggris.
  - **Bahasa lain**: LLM diinstruksikan untuk bernalar dalam bahasa Inggris, tetapi memberikan dokumentasi akhir dalam bahasa yang Anda pilih, seperti Español, Français, 简体中文, 繁體中文, العربية, हिन्दी, dan sebagainya.
- **Change Prompt Word**:
  - Memungkinkan Anda mengubah kata atau frasa prompt untuk tugas tertentu.
  - Di **Custom Prompt Word**, Anda dapat memasukkan kata atau frasa prompt versi Anda sendiri.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Dinonaktifkan (bawaan)**: file yang berhasil dihasilkan dipindahkan ke subfolder bernama `[OriginalFolderName]_complete` relatif terhadap parent folder asli, atau `Vault_complete` bila folder aslinya adalah root vault.
  - **Diaktifkan**: memungkinkan Anda menentukan nama custom untuk subfolder tempat file yang selesai dipindahkan.
- **Custom Output Folder Name**: hanya terlihat bila opsi di atas aktif. Masukkan nama subfolder yang diinginkan, seperti `Generated Content` atau `_complete`. Karakter yang tidak valid tidak diperbolehkan. Bila dibiarkan kosong, `_complete` yang dipakai.

#### Tombol Workflow Sekali Klik
- **Visual Workflow Builder**: membuat custom workflow buttons dari aksi bawaan tanpa perlu menulis DSL secara manual.
- **Custom Workflow Buttons DSL**: advanced users masih dapat mengedit definisi workflow secara langsung dalam bentuk teks. DSL yang tidak valid akan di-fallback dengan aman ke workflow default dan menampilkan warning di UI sidebar maupun settings.
- **Workflow Error Strategy**:
  - **Stop on Error (Default)**: menghentikan workflow segera setelah satu langkah gagal.
  - **Continue on Error**: tetap menjalankan langkah-langkah berikutnya dan melaporkan jumlah aksi yang gagal di akhir.
- **Default Workflow Included**: `One-Click Extract` merangkai `Process File (Add Links)`, `Batch Generate from Titles`, dan `Batch Mermaid Fix`.

#### Pengaturan Prompt Kustom
Fitur ini memungkinkan Anda mengganti instruksi default yang dikirim ke LLM untuk tugas tertentu, sehingga Anda mendapatkan kontrol yang lebih detail terhadap output.

- **Enable Custom Prompts for Specific Tasks**:
  - **Dinonaktifkan (bawaan)**: plugin memakai prompt bawaan untuk semua operasi.
  - **Diaktifkan**: mengaktifkan kemampuan untuk menetapkan custom prompts bagi tugas-tugas yang tercantum di bawah. Ini adalah master switch untuk fitur ini.
- **Use Custom Prompt for [Task Name]**:
  - Untuk tiap tugas yang didukung, seperti "Add Links", "Generate from Title", "Research & Summarize", dan "Extract Concepts", Anda bisa mengaktifkan atau menonaktifkan custom prompt secara individual.
  - **Disabled**: tugas tertentu ini memakai prompt default.
  - **Diaktifkan**: tugas tersebut akan memakai teks yang Anda tulis pada "Custom Prompt" textarea terkait.
- **Custom Prompt Text Area**:
  - **Default Prompt Display**: plugin menampilkan prompt default sebagai referensi. Anda dapat memakai tombol **"Copy Default Prompt"** untuk menyalinnya sebagai titik awal.
  - **Custom Prompt Input**: di sinilah Anda menulis instruksi khusus untuk LLM.
  - **Placeholders**: Anda bisa, dan sebaiknya, menggunakan placeholders khusus di prompt Anda. Plugin akan menggantinya dengan konten aktual sebelum mengirim request ke LLM. Periksa prompt default untuk melihat placeholders yang tersedia untuk tiap tugas. Placeholder umum mencakup:
    - `{TITLE}`: judul catatan saat ini.
    - `{RESEARCH_CONTEXT_SECTION}`: konten yang dikumpulkan dari web research.
    - `{USER_PROMPT}`: konten catatan yang sedang diproses.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Cakupan Pemeriksaan Duplikat
- **Duplicate Check Scope Mode**: mengontrol file mana yang dibandingkan dengan catatan dalam Concept Note Folder untuk mencari duplicate potensial.
  - **Entire Vault (Default)**: membandingkan concept notes dengan semua catatan lain di vault, kecuali Concept Note Folder itu sendiri.
  - **Include Specific Folders Only**: membandingkan concept notes hanya dengan catatan di folder yang tercantum.
  - **Exclude Specific Folders**: membandingkan concept notes dengan semua catatan kecuali yang berada dalam folder yang dikecualikan, dan tentu juga mengecualikan Concept Note Folder.
  - **Concept Folder Only**: membandingkan concept notes hanya dengan **catatan lain di dalam Concept Note Folder itu sendiri**, yang berguna untuk mencari duplicate murni di generated concepts.
- **Include/Exclude Folders**: hanya muncul jika mode adalah `Include` atau `Exclude`. Masukkan **path relatif** untuk folder yang ingin dimasukkan atau dikecualikan, **satu path per baris**. Path peka huruf besar-kecil dan menggunakan `/` sebagai separator, misalnya `Reference Material/Papers` atau `Daily Notes`. Folder-folder ini tidak boleh sama dengan atau berada di dalam Concept Note Folder.

#### Penyedia Riset Web
- **Search Provider**: pilih antara `Tavily`, yang membutuhkan API key dan direkomendasikan, dan `DuckDuckGo`, yang bersifat eksperimental dan sering diblokir untuk automated requests. Ini dipakai oleh "Research & Summarize Topic" dan opsional untuk "Generate from Title".
- **Tavily API Key**: hanya terlihat jika Tavily dipilih. Masukkan API key Anda dari [tavily.com](https://tavily.com/).
- **Tavily Max Results**: hanya terlihat jika Tavily dipilih. Jumlah maksimum hasil pencarian Tavily, dari 1 sampai 20. Default: 5.
- **Tavily Search Depth**: hanya terlihat jika Tavily dipilih. Pilihan `basic`, yang default, atau `advanced`. `advanced` memberi hasil lebih baik tetapi memakan 2 API credits per pencarian.
- **DuckDuckGo Max Results**: hanya terlihat jika DuckDuckGo dipilih. Jumlah maksimum hasil pencarian yang akan diparse, dari 1 sampai 10. Default: 5.
- **DuckDuckGo Content Fetch Timeout**: hanya terlihat jika DuckDuckGo dipilih. Jumlah detik maksimum untuk menunggu konten dari URL hasil DuckDuckGo. Default: 15.
- **Max Research Content Tokens**: batas perkiraan maksimum token dari hasil research web gabungan yang akan dimasukkan ke summarization prompt. Ini membantu mengelola ukuran context window dan biaya. Default: 3000.

<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Domain Pembelajaran Terfokus
- **Enable Focused Learning Domain**:
  - **Dinonaktifkan (bawaan)**: prompt yang dikirim ke LLM memakai instruksi standar umum.
  - **Diaktifkan**: memungkinkan Anda menentukan satu atau lebih bidang studi untuk meningkatkan contextual understanding model.
- **Learning Domain**: hanya terlihat jika opsi di atas aktif. Masukkan bidang Anda, misalnya `Materials Science`, `Polymer Physics`, atau `Machine Learning`. Ini akan menambahkan baris `Relevant Fields: [...]` di awal prompt, membantu LLM menghasilkan links dan konten yang lebih akurat untuk domain Anda.

<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Panduan Penggunaan

### Workflow Cepat & Bilah Samping

- Buka bilah samping Notemd untuk mengakses section tindakan yang dikelompokkan untuk pemrosesan inti, generasi, terjemahan, pengetahuan, dan utilitas.
- Gunakan area **Alur kerja cepat** di bagian atas bilah samping untuk meluncurkan tombol multi-langkah kustom.
- Workflow default **One-Click Extract** menjalankan `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Progres workflow, log per langkah, dan kegagalan ditampilkan di bilah samping, dengan footer tetap yang menjaga progress bar dan area log tetap terlihat saat section dibuka.
- Kartu progres mempertahankan teks status, pilar persentase khusus, dan sisa waktu yang mudah dibaca, dan workflow kustom yang sama dapat dikonfigurasi ulang dari pengaturan.

### Pemrosesan Asli (Menambahkan Wiki-Links)
Ini adalah fungsi inti yang berfokus pada identifikasi konsep dan penambahan `[[wiki-links]]`.

**Penting:** proses ini hanya bekerja pada file `.md` atau `.txt`. Anda dapat mengonversi file PDF ke MD secara gratis menggunakan [Mineru](https://github.com/opendatalab/MinerU) sebelum pemrosesan lebih lanjut.

1. **Menggunakan bilah samping**:
   - Buka Notemd Sidebar melalui ikon tongkat sihir atau command palette.
   - Buka file `.md` atau `.txt`.
   - Klik **"Process File (Add Links)"**.
   - Untuk memproses folder, klik **"Process Folder (Add Links)"**, pilih folder, lalu klik "Process".
   - Progres ditampilkan di bilah samping. Anda bisa membatalkan tugas lewat tombol "Cancel Processing".
   - *Catatan untuk pemrosesan folder:* file diproses di latar belakang tanpa dibuka di editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Menggunakan Command Palette** (`Ctrl+P` atau `Cmd+P`):
   - **Satu file**: buka file lalu jalankan `Notemd: Process Current File`.
   - **Folder**: jalankan `Notemd: Process Folder`, lalu pilih folder. File akan diproses di latar belakang tanpa dibuka di editor.
   - Modal progres muncul untuk aksi command palette dan menyediakan tombol cancel.
   - *Catatan:* plugin otomatis menghapus baris awal `\boxed{` dan baris akhir `}` jika ditemukan dalam konten hasil akhir sebelum penyimpanan.

### Fitur Baru

1. **Ringkas sebagai diagram Mermaid**:
   - Buka catatan yang ingin diringkas.
   - Jalankan perintah `Notemd: Summarise as Mermaid diagram`, melalui command palette atau tombol sidebar.
   - Plugin akan membuat catatan baru berisi Mermaid diagram.

2. **Translate Note/Selection**:
   - Pilih teks di catatan untuk menerjemahkan bagian itu saja, atau jalankan perintah tanpa seleksi untuk menerjemahkan seluruh catatan.
   - Jalankan `Notemd: Translate Note/Selection` melalui command palette atau tombol bilah samping.
   - Akan muncul modal yang memungkinkan Anda mengonfirmasi atau mengubah **Target Language**, dengan default mengikuti pengaturan di Configuration.
   - Plugin menggunakan **LLM Provider** yang telah dikonfigurasi berdasarkan pengaturan multi-model untuk menerjemahkan.
   - Konten hasil terjemahan disimpan ke **Translation Save Path** yang sudah ditentukan dengan suffix yang sesuai dan dibuka di **pane baru di sisi kanan** konten asli agar mudah dibandingkan.
   - Anda dapat membatalkan tugas ini lewat tombol bilah samping atau tombol batal pada modal.

3. **Terjemahan batch**:
   - Jalankan `Notemd: Batch Translate Folder` dari command palette lalu pilih folder, atau klik kanan folder di file explorer dan pilih "Batch translate this folder".
   - Plugin akan menerjemahkan semua file Markdown di folder tersebut.
   - File hasil terjemahan disimpan ke path terjemahan yang sudah dikonfigurasi tetapi tidak dibuka otomatis.
   - Proses dapat dibatalkan melalui progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

4. **Research & Summarize Topic**:
   - Pilih teks dalam catatan, atau pastikan catatan memiliki judul, yang akan dipakai sebagai topik pencarian.
   - Jalankan `Notemd: Research and Summarize Topic` melalui command palette atau tombol bilah samping.
   - Plugin menggunakan **Search Provider** yang telah dipilih, Tavily atau DuckDuckGo, dan **LLM Provider** yang sesuai berdasarkan pengaturan multi-model untuk menemukan dan merangkum informasi.
   - Ringkasan ditambahkan ke catatan saat ini.
   - Tugas ini bisa dibatalkan melalui tombol bilah samping atau tombol batal pada modal.
   - *Catatan:* pencarian DuckDuckGo bisa gagal karena deteksi bot. Tavily lebih direkomendasikan.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

5. **Generate Content from Title**:
   - Buka catatan, dan catatan itu boleh kosong.
   - Jalankan `Notemd: Generate Content from Title` melalui command palette atau tombol bilah samping.
   - Plugin menggunakan **LLM Provider** yang sesuai berdasarkan pengaturan multi-model untuk menghasilkan konten dari judul catatan dan menggantikan konten yang ada.
   - Jika **"Enable Research in 'Generate from Title'"** diaktifkan, plugin akan melakukan web research lebih dahulu menggunakan **Web Research Provider** yang telah dipilih, lalu menyertakan hasilnya sebagai context dalam prompt.
   - Anda dapat membatalkan tugas ini lewat bilah samping atau modal.

6. **Batch Generate Content from Titles**:
   - Jalankan `Notemd: Batch Generate Content from Titles` melalui command palette atau tombol bilah samping.
   - Pilih folder yang berisi catatan-catatan yang ingin Anda proses.
   - Plugin akan memproses tiap file `.md` dalam folder, kecuali file `_processed.md` dan file yang berada di "complete" folder, menghasilkan konten berdasarkan judul dan menggantikan konten yang ada. File diproses di background tanpa dibuka di editor.
   - File yang berhasil diproses dipindahkan ke "complete" folder yang dikonfigurasi.
   - Perintah ini menghormati pengaturan **"Enable Research in 'Generate from Title'"** untuk setiap catatan.
   - Anda dapat membatalkan tugas ini melalui bilah samping atau modal.
   - Progres dan hasil, termasuk jumlah file yang dimodifikasi serta error, ditampilkan dalam log bilah samping atau modal.

<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

7. **Check and Remove Duplicate Concept Notes**:
   - Pastikan **Concept Note Folder Path** telah dikonfigurasi dengan benar.
   - Jalankan `Notemd: Check and Remove Duplicate Concept Notes` melalui command palette atau tombol bilah samping.
   - Plugin memindai concept note folder dan membandingkan nama file dengan catatan di luar folder menggunakan beberapa aturan, seperti exact match, bentuk jamak, normalisasi, dan containment.
   - Jika duplicate potensial ditemukan, sebuah modal akan menampilkan daftar file, alasan penandaan, dan file yang konflik.
   - Tinjau daftarnya dengan cermat. Klik **"Delete Files"** untuk memindahkan file ke system trash, atau **"Cancel"** untuk tidak melakukan perubahan.
   - Progres dan hasil terlihat di bilah samping atau log modal.

8. **Extract Concepts (Pure Mode)**:
   - Fitur ini memungkinkan Anda mengekstrak konsep dari dokumen dan membuat concept notes yang sesuai **tanpa mengubah file asli**. Sangat cocok untuk mengisi knowledge base dari kumpulan dokumen.
   - **Satu file**: buka file lalu jalankan `Notemd: Extract concepts (create concept notes only)` dari command palette, atau klik tombol **"Extract concepts (current file)"** di bilah samping.
   - **Folder**: jalankan `Notemd: Batch extract concepts from folder` dari command palette atau klik tombol **"Extract concepts (folder)"** di bilah samping, lalu pilih folder untuk memproses semua catatan di dalamnya.
   - Plugin akan membaca file, mengenali konsep, dan membuat catatan baru untuk konsep itu di dalam **Concept Note Folder** Anda, tanpa mengubah file sumber.

9. **Create Wiki-Link & Generate Note from Selection**:
   - Perintah ini menyederhanakan proses membuat sekaligus mengisi concept note baru.
   - Pilih kata atau frasa di editor.
   - Jalankan `Notemd: Create Wiki-Link & Generate Note from Selection`, dan sangat disarankan menetapkan hotkey untuknya, misalnya `Cmd+Shift+W`.
   - Plugin akan:
     1. mengganti teks yang dipilih dengan `[[wiki-link]]`;
     2. mengecek apakah catatan dengan judul itu sudah ada di **Concept Note Folder**;
     3. jika sudah ada, menambahkan backlink ke catatan saat ini;
     4. jika belum ada, membuat catatan kosong baru;
     5. lalu menjalankan **"Generate Content from Title"** otomatis pada catatan tersebut, sehingga terisi dengan konten hasil AI.

10. **Extract Concepts and Generate Titles**:
    - Perintah ini menggabungkan dua fitur penting menjadi satu workflow.
    - Jalankan `Notemd: Extract Concepts and Generate Titles` dari command palette, dan sebaiknya beri hotkey.
    - Plugin akan:
      1. terlebih dahulu menjalankan tugas **"Extract concepts (current file)"** pada file aktif;
      2. kemudian secara otomatis menjalankan **"Batch generate from titles"** pada folder yang telah Anda atur sebagai **Concept note folder path** di pengaturan.
    - Ini memungkinkan Anda membangun basis konsep dari satu dokumen sumber lalu langsung mengembangkan concept notes baru tersebut dengan konten AI dalam satu alur.

11. **Extract Specific Original Text**:
    - Konfigurasikan pertanyaan Anda di settings dalam bagian "Extract Specific Original Text".
    - Gunakan tombol "Extract Specific Original Text" di sidebar untuk memproses file aktif.
    - **Merged Mode**: mempercepat pemrosesan dengan mengirim semua pertanyaan dalam satu prompt.
    - **Translation**: opsional menambahkan terjemahan dari teks yang diekstrak ke bahasa yang sudah dikonfigurasi.
    - **Custom Output**: Anda dapat mengatur lokasi dan penamaan file hasil ekstraksi.

12. **Batch Mermaid Fix**:
    - Gunakan tombol "Batch Mermaid Fix" di sidebar untuk memindai folder dan memperbaiki common Mermaid syntax errors.
    - Plugin akan melaporkan file yang masih bermasalah di file `mermaid_error_{foldername}.md`.
    - Anda juga dapat mengatur plugin untuk memindahkan file-file tersebut ke folder terpisah untuk ditinjau.

## Penyedia LLM yang Didukung

| Penyedia | Tipe | API Key Diperlukan | Catatan |
|---|---|---|---|
| DeepSeek | Cloud | Ya | Endpoint DeepSeek asli dengan reasoning-model handling |
| Qwen | Cloud | Ya | Preset DashScope compatible-mode untuk model Qwen / QwQ |
| Qwen Code | Cloud | Ya | Preset berfokus coding untuk model Qwen coder |
| Doubao | Cloud | Ya | Preset Volcengine Ark; biasanya field model diisi endpoint ID |
| Moonshot | Cloud | Ya | Endpoint resmi Kimi / Moonshot |
| GLM | Cloud | Ya | Endpoint resmi Zhipu BigModel yang OpenAI-compatible |
| Z AI | Cloud | Ya | Endpoint internasional GLM/Zhipu yang OpenAI-compatible dan melengkapi `GLM` |
| MiniMax | Cloud | Ya | Endpoint resmi chat-completions MiniMax |
| Huawei Cloud MaaS | Cloud | Ya | Endpoint Huawei ModelArts MaaS yang OpenAI-compatible |
| Baidu Qianfan | Cloud | Ya | Endpoint Qianfan resmi yang OpenAI-compatible untuk model ERNIE |
| SiliconFlow | Cloud | Ya | Endpoint resmi SiliconFlow yang OpenAI-compatible untuk hosted OSS models |
| OpenAI | Cloud | Ya | Mendukung model GPT dan seri o |
| Anthropic | Cloud | Ya | Mendukung model Claude |
| Google | Cloud | Ya | Mendukung model Gemini |
| Mistral | Cloud | Ya | Mendukung keluarga Mistral dan Codestral |
| Azure OpenAI | Cloud | Ya | Memerlukan Endpoint, API Key, deployment name, dan API Version |
| OpenRouter | Gateway | Ya | Akses ke banyak provider melalui OpenRouter model IDs |
| xAI | Cloud | Ya | Endpoint asli Grok |
| Groq | Cloud | Ya | Inference OpenAI-compatible cepat untuk hosted OSS models |
| Together | Cloud | Ya | Endpoint OpenAI-compatible untuk hosted OSS models |
| Fireworks | Cloud | Ya | Endpoint inference OpenAI-compatible |
| Requesty | Gateway | Ya | Multi-provider router dengan satu API key |
| OpenAI Compatible | Gateway | Opsional | Preset generik untuk LiteLLM, vLLM, Perplexity, Vercel AI Gateway, dan lainnya |
| LMStudio | Lokal | Opsional (`EMPTY`) | Menjalankan model secara lokal melalui server LM Studio |
| Ollama | Lokal | Tidak | Menjalankan model secara lokal melalui server Ollama |

*Catatan: untuk penyedia lokal, seperti LMStudio dan Ollama, pastikan server terkait sedang berjalan dan dapat diakses melalui Base URL yang dikonfigurasi.*
*Catatan: untuk OpenRouter dan Requesty, gunakan full model identifier yang ditampilkan gateway, seperti `google/gemini-flash-1.5` atau `anthropic/claude-3-7-sonnet-latest`.*
*Catatan: `Doubao` biasanya mengharapkan Ark endpoint atau deployment ID di field model, bukan sekadar nama family model mentah. UI settings sekarang memberi warning bila placeholder masih dipakai dan akan memblokir test connection sampai Anda menggantinya dengan endpoint ID yang valid.*
*Catatan: `Z AI` menargetkan jalur internasional `api.z.ai`, sedangkan `GLM` tetap memakai endpoint BigModel mainland China. Pilih preset yang cocok dengan region akun Anda.*
*Catatan: preset yang fokus pada penyedia Tiongkok menggunakan chat-first connection checks agar test benar-benar memverifikasi model atau deployment yang Anda konfigurasi, bukan hanya konektivitas API key.*
*Catatan: `OpenAI Compatible` ditujukan untuk custom gateway dan proxy. Konfigurasikan Base URL, kebijakan API key, dan model ID sesuai dokumentasi provider Anda.*

## Penggunaan Jaringan & Penanganan Data

Notemd berjalan secara lokal di dalam Obsidian, tetapi beberapa fitur mengirimkan outbound requests.

### Panggilan ke Penyedia LLM (Dapat Dikonfigurasi)

- Trigger: file processing, generation, translation, research summarization, Mermaid summarization, serta connection dan diagnostic actions.
- Endpoint: base URL penyedia yang Anda konfigurasi di settings Notemd.
- Data yang dikirim: prompt text dan task content yang diperlukan untuk pemrosesan.
- Catatan penanganan data: API keys disimpan secara lokal di settings plugin dan dipakai untuk menandatangani request dari perangkat Anda sendiri.

### Panggilan Riset Web (Opsional)

- Trigger: ketika web research diaktifkan dan search provider dipilih.
- Endpoint: Tavily API atau DuckDuckGo endpoints.
- Data yang dikirim: search query Anda dan request metadata yang diperlukan.

### Diagnostik Pengembang & Log Debug (Opsional)

- Trigger: API debug mode dan developer diagnostic actions.
- Penyimpanan: diagnostic logs dan error logs ditulis ke root vault, misalnya `Notemd_Provider_Diagnostic_*.txt` dan `Notemd_Error_Log_*.txt`.
- Catatan risiko: log bisa berisi potongan request dan response. Tinjau isi log sebelum membagikannya secara publik.

### Penyimpanan Lokal

- Konfigurasi plugin disimpan di `.obsidian/plugins/notemd/data.json`.
- Generated files, report, dan log opsional disimpan di vault Anda sesuai settings.

## Pemecahan Masalah

### Masalah Umum
- **Plugin Tidak Termuat**: pastikan `manifest.json`, `main.js`, dan `styles.css` berada di folder yang benar, yaitu `<Vault>/.obsidian/plugins/notemd/`, lalu restart Obsidian. Periksa Developer Console melalui `Ctrl+Shift+I` atau `Cmd+Option+I` untuk melihat error saat startup.
- **Kegagalan Pemrosesan / API Errors**:
  1. **Periksa Format File**: pastikan file yang ingin diproses atau dicek memiliki ekstensi `.md` atau `.txt`. Saat ini Notemd hanya mendukung format teks tersebut.
  2. Gunakan perintah atau tombol "Test LLM Connection" untuk memverifikasi settings penyedia aktif.
  3. Periksa kembali API Key, Base URL, Model Name, dan API Version, untuk Azure, dan pastikan API key benar serta memiliki kredit dan izin yang cukup.
  4. Pastikan local LLM server, seperti LMStudio atau Ollama, sedang berjalan dan Base URL benar, misalnya `http://localhost:1234/v1` untuk LMStudio.
  5. Periksa koneksi internet jika menggunakan penyedia cloud.
  6. **Untuk single file processing errors:** buka Developer Console untuk melihat pesan error yang detail. Anda bisa menyalinnya menggunakan tombol copy pada error modal bila diperlukan.
  7. **Untuk batch processing errors:** periksa file `error_processing_filename.log` di root vault. File ini berisi detail error untuk tiap file yang gagal. Developer Console atau error modal biasanya hanya menampilkan ringkasan.
  8. **Automatic Error Logs:** jika proses gagal, plugin otomatis menyimpan log detail bernama `Notemd_Error_Log_[Timestamp].txt` di root vault. File ini berisi error message, stack trace, dan session logs. Bila Anda menghadapi masalah yang berulang, periksa file ini. Jika "API Error Debugging Mode" aktif, log akan memuat detail response API yang lebih lengkap.
  9. **Real Endpoint Long-Request Diagnostics (Developer)**:
     - Jalur in-plugin, disarankan sebagai langkah pertama: gunakan **Settings -> Notemd -> Developer provider diagnostic (long request)** untuk menjalankan runtime probe pada penyedia aktif dan menghasilkan `Notemd_Provider_Diagnostic_*.txt` di root vault.
     - Jalur CLI, di luar runtime Obsidian: untuk membandingkan buffered dan streaming behavior pada level endpoint secara reproducible, gunakan:
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
       Report yang dihasilkan berisi timing setiap attempt, seperti `First Byte` dan `Duration`, sanitized request metadata, response headers, raw atau partial body fragments, parsed stream fragments, serta titik kegagalan pada transport layer.
- **Masalah Koneksi LM Studio / Ollama**:
  - **Uji koneksi gagal**: pastikan local server, LM Studio atau Ollama, sedang berjalan dan model yang dibutuhkan sudah dimuat atau tersedia.
  - **CORS Errors untuk Ollama di Windows**: jika Anda menemui CORS error saat menggunakan Ollama di Windows, Anda mungkin perlu menetapkan environment variable `OLLAMA_ORIGINS`. Misalnya dengan menjalankan `set OLLAMA_ORIGINS=*` di command prompt sebelum memulai Ollama.
  - **Aktifkan CORS di LM Studio**: untuk LM Studio, Anda dapat mengaktifkan CORS langsung dari server settings, yang kadang diperlukan jika Obsidian berjalan di browser atau berada di bawah origin policy yang ketat.
- **Folder Creation Errors ("File name cannot contain...")**:
  - Ini biasanya berarti path yang Anda masukkan di settings, misalnya **Processed File Folder Path** atau **Concept Note Folder Path**, tidak valid **bagi Obsidian**.
  - Pastikan Anda menggunakan **path relatif**, misalnya `Processed` atau `Notes/Concepts`, dan **bukan path absolut**, seperti `C:\Users\...` atau `/Users/...`.
  - Periksa karakter yang tidak valid: `* " \ / < > : | ? # ^ [ ]`. Perhatikan bahwa `\` tidak valid untuk path Obsidian bahkan di Windows. Gunakan `/` sebagai separator.
- **Masalah Performa**: pemrosesan file besar atau banyak file bisa memakan waktu. Kurangi "Chunk Word Count" untuk mendapat API calls yang lebih pendek namun lebih banyak. Anda juga dapat mencoba penyedia atau model lain.
- **Link Tak Terduga**: kualitas linking sangat bergantung pada LLM dan prompt. Cobalah model lain atau pengaturan temperature yang berbeda.

## Kontribusi

Kontribusi sangat diterima. Silakan lihat repositori GitHub untuk panduannya: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumen Maintainer

- [Alur Rilis (Bahasa Inggris)](./docs/maintainer/release-workflow.md)
- [Alur Rilis (Tionghoa Sederhana)](./docs/maintainer/release-workflow.zh-CN.md)

## Lisensi

MIT License. Lihat file [LICENSE](LICENSE) untuk detailnya.

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - Tingkatkan knowledge graph Obsidian Anda dengan AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
