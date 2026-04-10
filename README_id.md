
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd untuk Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Baca dokumentasi dalam bahasa lain: [Pusat Bahasa](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Peningkatan Pengetahuan Multibahasa
                Berbasis AI
==================================================
```

Cara mudah untuk membuat basis pengetahuan Anda sendiri!

Notemd meningkatkan alur kerja Obsidian Anda dengan berintegrasi dengan berbagai Model Bahasa Besar (LLM) untuk memproses catatan multibahasa Anda, secara otomatis menghasilkan tautan wiki untuk konsep-konsep kunci, membuat catatan konsep yang sesuai, melakukan riset web, dan membantu Anda membangun grafik pengetahuan yang kuat.

**Versi:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

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
- [Dokumentasi Pemelihara](#dokumentasi-pemelihara)
- [Lisensi](#lisensi)

## Mulai Cepat

1.  **Instal & Aktifkan**: Dapatkan plugin dari toko komunitas Obsidian.
2.  **Konfigurasi LLM**: Buka `Pengaturan -> Notemd`, pilih penyedia LLM Anda (seperti OpenAI atau penyedia lokal seperti Ollama), dan masukkan kunci API/URL Anda.
3.  **Buka Bilah Sisi**: Klik ikon tongkat sihir Notemd di pita kiri untuk membuka bilah sisi.
4.  **Proses Catatan**: Buka catatan apa pun dan klik **"Proses File (Tambah Tautan)"** di bilah sisi untuk menambahkan `[[wiki-links]]` secara otomatis ke konsep kunci.
5.  **Jalankan Alur Kerja Cepat**: Gunakan tombol default **"One-Click Extract"** untuk merantai pemrosesan, pembuatan batch, dan perbaikan Mermaid dari satu titik.

Selesai! Jelajahi pengaturan untuk membuka lebih banyak fitur seperti riset web, terjemahan, dan pembuatan konten.

## Dukungan Bahasa

### Kontrak Perilaku Bahasa

| Aspek | Cakupan | Default | Catatan |
|---|---|---|---|
| `UI Locale` | Hanya teks antarmuka plugin | `auto` | Mengikuti bahasa Obsidian; katalog saat ini: `en`, `zh-CN`, `zh-TW`. |
| `Bahasa Output Tugas` | Output yang dihasilkan LLM (tautan, ringkasan) | `en` | Bisa global atau per tugas. |
| `Nonaktifkan terjemahan otomatis` | Tugas non-terjemahan tetap menggunakan konteks asli | `false` | Tugas `Terjemahkan` eksplisit tetap mengikuti bahasa target. |

- Dokumentasi resmi dikelola dalam bahasa Inggris dan Mandarin Sederhana, dengan dukungan penuh untuk lebih dari 30 bahasa.
- Semua bahasa yang didukung ditautkan di header atas.

## Fitur Utama

### Pemrosesan Dokumen Berbasis AI
- **Dukungan Multi-LLM**: Terhubung ke berbagai penyedia LLM cloud dan lokal.
- **Smart Chunking**: Membagi dokumen besar menjadi bagian-bagian kecil secara otomatis.
- **Pelestarian Konten**: Menjaga format asli sambil menambahkan struktur dan tautan.
- **Logika Percobaan Ulang**: Percobaan ulang otomatis opsional untuk panggilan API yang gagal.
- **Preset untuk Tiongkok**: Termasuk penyedia seperti `Qwen`, `Doubao`, `Moonshot` dll.

### Peningkatan Grafik Pengetahuan
- **Wiki-Linking Otomatis**: Mengidentifikasi dan menambahkan tautan wiki ke konsep inti.
- **Pembuatan Catatan Konsep**: Secara otomatis membuat catatan baru untuk konsep yang ditemukan.

### Terjemahan
- **Terjemahan AI**: Terjemahkan konten catatan menggunakan LLM yang dikonfigurasi.
- **Terjemahan Batch**: Terjemahkan semua file dalam folder yang dipilih.

### Riset Web & Pembuatan Konten
- **Riset Web**: Lakukan pencarian via Tavily atau DuckDuckGo dan ringkas hasilnya.
- **Buat dari Judul**: Gunakan judul catatan untuk menghasilkan konten awal.
- **Perbaikan Otomatis Mermaid**: Secara otomatis memperbaiki sintaks diagram Mermaid yang dihasilkan.

## Instalasi
1. Buka Obsidian **Pengaturan** → **Plugin komunitas**.
2. Pastikan "Mode terbatas" mati.
3. Klik **Telusuri** dan cari "Notemd".
4. Klik **Instal** lalu **Aktifkan**.

## Lisensi
Lisensi MIT - Lihat file [LICENSE](LICENSE) untuk detailnya.

---
*Notemd v1.8.0 - Tingkatkan grafik pengetahuan Obsidian Anda dengan AI.*
