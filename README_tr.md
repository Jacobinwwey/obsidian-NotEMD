
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Obsidian için Notemd Eklentisi

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Diğer dillerdeki dokümantasyon için: [Dil Merkezi (Language Hub)](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Yapay Zeka Destekli Çok Dilli Bilgi
               Geliştirme Aracı
==================================================
```

Kendi bilgi tabanınızı oluşturmanın kolay bir yolu!

Notemd, çok dilli notlarınızı işlemek, anahtar kavramlar için otomatik olarak wiki bağlantıları oluşturmak, ilgili kavram notlarını oluşturmak, web araştırması yapmak ve güçlü bilgi grafikleri oluşturmanıza yardımcı olmak için çeşitli Büyük Dil Modelleri (LLM'ler) ile entegre olarak Obsidian iş akışınızı geliştirir.

**Sürüm:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## İçindekiler
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Dil Desteği](#dil-desteği)
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [Kullanım Kılavuzu](#kullanım-kılavuzu)
- [Desteklenen LLM Sağlayıcıları](#desteklenen-llm-sağlayıcıları)
- [Ağ Kullanımı ve Veri İşleme](#ağ-kullanımı-ve-veri-işleme)
- [Sorun Giderme](#sorun-giderme)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Bakımcı Dokümantasyonu](#bakımcı-dokümantasyonu)
- [Lisans](#lisans)

## Hızlı Başlangıç

1.  **Kur ve Etkinleştir**: Eklentiyi Obsidian Topluluk Mağazası'ndan edinin.
2.  **LLM Yapılandır**: `Ayarlar -> Notemd` yoluna gidin, LLM sağlayıcınızı seçin (OpenAI veya Ollama gibi yerel bir sağlayıcı) ve API anahtarınızı/URL'nizi girin.
3.  **Yan Paneli Aç**: Yan paneli açmak için sol şeritteki Notemd sihirli değnek simgesine tıklayın.
4.  **Notu İşle**: Herhangi bir notu açın ve anahtar kavramlara otomatik olarak `[[wiki-links]]` eklemek için yan paneldeki **"Dosyayı İşle (Bağlantı Ekle)"** düğmesine tıklayın.
5.  **Hızlı İş Akışını Çalıştır**: İşleme, toplu oluşturma ve Mermaid düzeltmesini tek bir noktadan birbirine bağlamak için varsayılan **"One-Click Extract"** düğmesini kullanın.

Hepsi bu kadar! Web araştırması, çeviri ve içerik oluşturma gibi daha fazla özelliğin kilidini açmak için ayarları keşfedin.

## Dil Desteği

### Dil Davranış Sözleşmesi

| Konu | Kapsam | Varsayılan | Notlar |
|---|---|---|---|
| `UI Locale` | Yalnızca eklenti arayüzü metni | `auto` | Obsidian dilini takip eder; mevcut paketler: `en`, `zh-CN`, `zh-TW`. |
| `Görev Çıktı Dili` | LLM tarafından oluşturulan çıktılar (bağlantılar, özetler) | `en` | Genel veya görev başına ayarlanabilir. |
| `Otomatik çeviriyi devre dışı bırak` | Çeviri dışı görevler orijinal bağlamı korur | `false` | Belirgin `Çevir` görevleri yine de hedef dili uygular. |

- Resmi dokümantasyon İngilizce ve Basitleştirilmiş Çince dillerinde sürdürülmektedir ve 30'dan fazla dil için tam destek sunmaktadır.
- Desteklenen tüm diller yukarıdaki başlıkta listelenmiştir.

## Temel Özellikler

### Yapay Zeka Destekli Belge İşleme
- **Çoklu LLM Desteği**: Çeşitli bulut ve yerel LLM sağlayıcılarına bağlanın.
- **Akıllı Parçalama**: Büyük belgeleri otomatik olarak yönetilebilir parçalara böler.
- **İçerik Koruma**: Yapı ve bağlantı eklerken orijinal biçimlendirmeyi korumayı amaçlar.
- **Yeniden Deneme Mantığı**: Başarısız API çağrıları için isteğe bağlı otomatik yeniden deneme.
- **Çin Hazır Ön Ayarları**: `Qwen`, `Doubao`, `Moonshot` vb. sağlayıcıları içerir.

### Bilgi Grafiği Geliştirme
- **Otomatik Wiki-Bağlantılama**: Anahtar kavramları tanımlar ve wiki bağlantıları ekler.
- **Kavram Notu Oluşturma**: Keşfedilen kavramlar için belirlenen klasörde otomatik olarak yeni notlar oluşturur.

### Çeviri
- **Yapay Zeka Çevirisi**: Not içeriğini yapılandırılmış LLM ile çevirin.
- **Toplu Çeviri**: Seçilen bir klasördeki tüm dosyaları çevirin.

### Web Araştırması ve İçerik Oluşturma
- **Web Araştırması**: Tavily veya DuckDuckGo üzerinden arama yapın ve sonuçları özetleyin.
- **Başlıktan İçerik Oluşturma**: Başlangıç içeriği oluşturmak için not başlığını kullanın.
- **Mermaid Otomatik Düzeltme**: Oluşturulan Mermaid diyagramlarının sözdizimini otomatik olarak onarır.

## Kurulum
1. Obsidian **Ayarlar** → **Topluluk eklentileri**'ni açın.
2. "Kısıtlı mod"un kapalı olduğundan emin olun.
3. **Göz at**'a tıklayın ve "Notemd"i arayın.
4. **Kur**'a ve ardından **Etkinleştir**'e tıklayın.

## Lisens
MIT Lisansı - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---
*Notemd v1.8.0 - Obsidian bilgi grafiğinizi yapay zeka ile geliştirin.*
