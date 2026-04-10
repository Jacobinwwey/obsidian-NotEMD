
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
      Peningkatan Pengetahuan Pelbagai Bahasa
                 Berasaskan AI
==================================================
```

Cara mudah untuk membina pangkalan pengetahuan anda sendiri!

Notemd meningkatkan aliran kerja Obsidian anda dengan menyepadukan pelbagai Model Bahasa Besar (LLM) untuk memproses nota pelbagai bahasa anda, menjana pautan wiki secara automatik untuk konsep utama, mencipta nota konsep yang berkaitan, melakukan penyelidikan web dan membantu anda membina graf pengetahuan yang hebat.

**Versi:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Isi Kandungan
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
- [Dokumentasi Penyelenggara](#dokumentasi-penyelenggara)
- [Lesen](#lesen)

## Permulaan Pantas

1.  **Pasang & Aktifkan**: Dapatkan plugin dari kedai komuniti Obsidian.
2.  **Konfigurasi LLM**: Pergi ke `Tetapan -> Notemd`, pilih penyedia LLM anda (seperti OpenAI atau penyedia tempatan seperti Ollama), dan masukkan kunci API/URL anda.
3.  **Buka Bar Sisi**: Klik ikon tongkat ajaib Notemd pada reben kiri untuk membuka bar sisi.
4.  **Proses Nota**: Buka mana-mana nota dan klik **"Proses Fail (Tambah Pautan)"** dalam bar sisi untuk menambah `[[wiki-links]]` secara automatik ke konsep utama.
5.  **Jalankan Aliran Kerja Pantas**: Gunakan butang lalai **"One-Click Extract"** untuk merantai pemprosesan, penjanaan batch, dan pembaikan Mermaid dari satu titik.

Selesai! Terokai tetapan untuk membuka lebih banyak ciri seperti penyelidikan web, terjemahan dan penjanaan kandungan.

## Sokongan Bahasa

### Kontrak Tingkah Laku Bahasa

| Aspek | Skop | Lalai | Nota |
|---|---|---|---|
| `UI Locale` | Hanya teks antara muka plugin | `auto` | Mengikut bahasa Obsidian; katalog semasa: `en`, `zh-CN`, `zh-TW`. |
| `Bahasa Output Tugasan` | Output yang dijana LLM (pautan, ringkasan) | `en` | Boleh secara global atau mengikut tugasan. |
| `Matikan terjemahan automatik` | Tugasan bukan terjemahan mengekalkan konteks asal | `false` | Tugasan `Terjemah` eksplisit tetap mengikut bahasa sasaran. |

- Dokumentasi rasmi diselenggara dalam bahasa Inggeris dan Mandarin Mudah, dengan sokongan penuh untuk lebih 30 bahasa.
- Semua bahasa yang disokong dipautkan di pengepala atas.

## Ciri Utama

### Pemprosesan Dokumen Berasaskan AI
- **Sokongan Multi-LLM**: Sambung ke pelbagai penyedia LLM awan dan tempatan.
- **Smart Chunking**: Membahagi dokumen besar kepada bahagian kecil secara automatik.
- **Pemeliharaan Kandungan**: Mengekalkan format asal sambil menambah struktur dan pautan.
- **Logik Cubaan Semula**: Cubaan semula automatik pilihan untuk panggilan API yang gagal.
- **Pratetap untuk China**: Termasuk penyedia seperti `Qwen`, `Doubao`, `Moonshot` dll.

### Peningkatan Graf Pengetahuan
- **Wiki-Linking Automatik**: Mengenal pasti dan menambah pautan wiki ke konsep teras.
- **Penciptaan Nota Konsep**: Mencipta nota baru secara automatik untuk konsep yang ditemui.

### Terjemahan
- **Terjemahan AI**: Terjemah kandungan nota menggunakan LLM yang dikonfigurasi.
- **Terjemahan Batch**: Terjemah semua fail dalam folder yang dipilih.

### Penyelidikan Web & Penjanaan Kandungan
- **Penyelidikan Web**: Lakukan carian melalui Tavily atau DuckDuckGo dan ringkaskan hasil.
- **Bina dari Tajuk**: Gunakan tajuk nota untuk menjana kandungan awal.
- **Pembaikan Automatik Mermaid**: Membaiki sintaks gambar rajah Mermaid yang dijana secara automatik.

## Pemasangan
1. Buka Obsidian **Tetapan** → **Plugin komuniti**.
2. Pastikan "Mod terhad" dimatikan.
3. Klik **Semak imbas** dan cari "Notemd".
4. Klik **Pasang** dan kemudian **Aktifkan**.

## Lesen
Lesen MIT - Lihat fail [LICENSE](LICENSE) untuk butiran.

---
*Notemd v1.8.0 - Tingkatkan graf pengetahuan Obsidian anda dengan AI.*
