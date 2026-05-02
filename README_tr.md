![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# Obsidian için Notemd Eklentisi

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Daha fazla dilde belgeler için: [Dil Merkezi](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Yapay Zeka Destekli Çok Dilli Bilgi Geliştirme
==================================================
```

Kendi bilgi tabanınızı oluşturmanın kolay bir yolu.

Notemd, çok dilli notlarınızı işlemek, anahtar kavramlar için otomatik wiki bağlantıları oluşturmak, ilgili kavram notları üretmek, web araştırması yapmak ve güçlü bilgi grafikleri kurmanıza yardımcı olmak için çeşitli büyük dil modelleriyle (LLM) entegre olarak Obsidian iş akışınızı geliştirir.

**Sürüm:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

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

1. **Kur ve Etkinleştir**: Eklentiyi Obsidian Marketplace'ten yükleyin.
2. **LLM Yapılandır**: `Settings -> Notemd` yoluna gidin, kullanmak istediğiniz LLM sağlayıcısını seçin, örneğin OpenAI veya Ollama gibi yerel bir sağlayıcı, ardından API anahtarınızı ya da URL'nizi girin.
3. **Kenar Çubuğunu Aç**: Kenar çubuğunu açmak için sol şeritteki Notemd sihirli değnek simgesine tıklayın.
4. **Not İşle**: Herhangi bir notu açın ve anahtar kavramlara otomatik olarak `[[wiki-links]]` eklemek için kenar çubuğundaki **"Process File (Add Links)"** düğmesine tıklayın.
5. **Hızlı Bir İş Akışı Çalıştırın**: Varsayılan **"One-Click Extract"** düğmesini kullanarak işleme, toplu üretim ve Mermaid temizliğini tek giriş noktasından zincirleyin.

Hepsi bu kadar. Web araştırması, çeviri ve içerik üretimi gibi daha fazla özelliğin kilidini açmak için ayarları keşfedin.

## Dil Desteği

### Dil Davranışı Sözleşmesi

| Konu | Kapsam | Varsayılan | Notlar |
|---|---|---|---|
| `Arayüz dili` | Yalnızca eklenti arayüzü metinleri (ayarlar, kenar çubuğu, bildirimler, diyaloglar) | `auto` | Obsidian yerel ayarını izler; mevcut arayüz katalogları `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN` ve `zh-TW`'dir. |
| `Görev çıktı dili` | LLM tarafından oluşturulan görev çıktısı (bağlantılar, özetler, üretim, çıkarım, çeviri hedefi) | `en` | `Görevler için farklı diller kullan` etkinse genel ya da görev bazlı olabilir. |
| `Otomatik çeviriyi devre dışı bırak` | Translate dışındaki görevler kaynak dil bağlamını korur | `false` | Açık `Translate` görevleri yine de yapılandırılmış hedef dili zorlar. |
| `Yedek dil` | Eksik arayüz anahtarlarının çözümü | locale -> `en` | Bazı anahtarlar çevrilmemiş olsa bile arayüzü kararlı tutar. |

- Bakımı yapılan kaynak belgeler İngilizce ve Basitleştirilmiş Çince'dir; yayımlanmış README çevirileri yukarıdaki başlıkta bağlantılanmıştır.
- Uygulama içi UI yerel dil kapsamı şu anda koddaki açık katalogla tam olarak eşleşmektedir: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- İngilizce fallback uygulama düzeyinde bir güvenlik ağı olarak kalır, ancak desteklenen görünür yüzeyler regresyon testleriyle güvence altındadır ve normal kullanımda sessizce İngilizceye dönmemelidir.
- Daha fazla ayrıntı ve katkı yönergeleri [Dil Merkezi](./docs/i18n/README.md) üzerinden izlenir.

## Özellikler

### Yapay Zeka Destekli Doküman İşleme
- **Çoklu LLM Desteği**: Farklı bulut ve yerel LLM sağlayıcılarına bağlanın. Bkz. [Desteklenen LLM Sağlayıcıları](#desteklenen-llm-sağlayıcıları).
- **Akıllı Bölme**: Büyük dokümanları kelime sayısına göre otomatik olarak yönetilebilir parçalara ayırır.
- **İçerik Koruma**: Yapı ve bağlantılar eklenirken orijinal biçimlendirmeyi korumayı amaçlar.
- **İlerleme Takibi**: Notemd Sidebar veya ilerleme modali üzerinden gerçek zamanlı güncellemeler sağlar.
- **İptal Edilebilir İşlemler**: Kenar çubuğundan başlatılan tekil veya toplu tüm işleme görevleri kendi iptal düğmeleriyle durdurulabilir. Komut paleti işlemleri de iptal edilebilen bir modal kullanır.
- **Çoklu Model Yapılandırması**: Add Links, Research, Generate Title ve Translate gibi farklı görevler için farklı LLM sağlayıcıları ve belirli modeller kullanın ya da tüm görevlerde tek bir sağlayıcı kullanın.
- **Kararlı API Çağrıları (Yeniden Deneme Mantığı)**: Başarısız LLM API çağrıları için otomatik yeniden denemeleri, yapılandırılabilir aralıklar ve deneme sınırlarıyla isteğe bağlı olarak etkinleştirin.
- **Daha Dayanıklı Sağlayıcı Bağlantı Testleri**: İlk sağlayıcı testi geçici bir ağ kopmasına denk gelirse, Notemd artık doğrudan başarısız olmak yerine kararlı yeniden deneme dizisine geçer. Bu kapsam OpenAI-compatible, Anthropic, Google, Azure OpenAI ve Ollama yollarını içerir.
- **Çalışma Ortamına Duyarlı Yedek Taşıma Yolu**: Uzun süren bir sağlayıcı isteği `requestUrl` tarafından `ERR_CONNECTION_CLOSED` gibi geçici ağ hatalarıyla kesildiğinde, Notemd yapılandırılmış yeniden deneme döngüsüne girmeden önce aynı denemeyi ortam farkındalıklı bir yedek taşıma yoluyla tekrarlar. Masaüstü sürümler Node `http/https`, masaüstü olmayan ortamlar ise tarayıcı `fetch` kullanır. Bu, yavaş ağ geçitleri ve reverse proxy'lerdeki yanlış başarısızlıkları azaltır.
- **OpenAI-Compatible Kararlı Uzun İstek Zinciri Sertleştirmesi**: Kararlı modda OpenAI-compatible çağrılar artık her deneme için açık bir üç aşamalı sıra izler: önce doğrudan akışlı taşıma, sonra doğrudan akışsız taşıma, ardından gerekirse yeniden akışlı ayrıştırmaya yükseltilebilen `requestUrl` yedek yolu. Bu, sağlayıcı tamponlu yanıtları üretmiş olsa bile akış hattı kararsız olduğunda yanlış negatifleri azaltır.
- **LLM API Yüzeyinin Tamamında Protokol Farkındalıklı Akışlı Yedek Yol**: Uzun süren yedek denemeler artık yalnızca OpenAI-compatible uç noktalarda değil, tüm yerleşik LLM yollarında protokol farkındalıklı akışlı ayrıştırma kullanır. Notemd artık OpenAI/Azure tarzı SSE, Anthropic Messages akışı, Google Gemini SSE ve Ollama NDJSON akışlarını hem masaüstü `http/https` hem de masaüstü olmayan `fetch` yollarında işler; kalan doğrudan OpenAI tarzı sağlayıcı girişleri de aynı ortak yedek yolu yeniden kullanır.
- **Çin'e Hazır Sağlayıcı Ön Ayarları**: Yerleşik ön ayarlar artık mevcut küresel ve yerel sağlayıcıların yanında `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` ve `SiliconFlow` seçeneklerini de kapsar.
- **Güvenilir Toplu İşleme**: Eşzamanlı işleme mantığı, hız sınırı hatalarını önlemek ve büyük toplu işlerde kararlı performans sağlamak için **zamana yayılmış API çağrıları** yaklaşımıyla iyileştirildi. Görevler artık aynı anda değil, farklı aralıklarla başlatılır.
- **Doğru İlerleme Raporlaması**: İlerleme çubuğunun takılı kalmasına neden olabilen bir hata giderildi; böylece arayüz artık işlemin gerçek durumunu doğru yansıtır.
- **Sağlam Paralel Toplu İşleme**: Paralel toplu işlemlerin erken durmasına yol açan bir sorun çözüldü; böylece tüm dosyalar güvenilir ve verimli biçimde işlenir.
- **İlerleme Çubuğu Doğruluğu**: "Create Wiki-Link & Generate Note" komutunun ilerleme çubuğunu yüzde 95'te takılı bırakabilen hata giderildi; artık tamamlandığında doğru biçimde yüzde 100 gösterir.
- **Geliştirilmiş API Hata Ayıklaması**: "API Error Debugging Mode" artık LLM sağlayıcıları ve Tavily/DuckDuckGo gibi arama servislerinden tam yanıt gövdelerini yakalar; ayrıca temizlenmiş istek URL'leri, süreler, yanıt başlıkları, kısmi yanıt gövdeleri, ayrıştırılmış kısmi akış içerikleri ve yığın izleriyle deneme bazlı bir taşıma zaman çizelgesi de kaydeder. Bu, OpenAI-compatible, Anthropic, Google, Azure OpenAI ve Ollama yedek yollarında sorun gidermeyi kolaylaştırır.
- **Geliştirici Modu Paneli**: Ayarlar artık yalnızca geliştiricilere yönelik özel bir tanılama paneli içerir ve "Developer mode" etkinleştirilmedikçe gizli kalır. Seçili mod için tanılama çağrı yollarını ve tekrarlı kararlılık testlerini destekler.
- **Yeniden Tasarlanan Kenar Çubuğu**: Yerleşik eylemler, daha net etiketler, canlı durum, iptal edilebilir ilerleme ve kopyalanabilir günlükler ile daha odaklı bölümlerde gruplanmıştır. Böylece kenar çubuğu karmaşası azalır. İlerleme/günlük alt kısmı tüm bölümler açık olsa bile görünür kalır ve hazır durum daha anlaşılır bir bekleme izi kullanır.
- **Kenar Çubuğu Etkileşimi ve Okunabilirlik İyileştirmeleri**: Kenar çubuğu düğmeleri artık hover, basma ve odak durumlarında daha net geri bildirim verir. `One-Click Extract` ve `Batch generate from titles` dahil renkli CTA düğmeleri ise farklı temalarda daha iyi okunabilirlik için daha güçlü metin kontrastı kullanır.
- **Tek Dosya CTA Eşlemesi**: Renkli CTA stili artık yalnızca tek dosya eylemlerine ayrılmıştır. Toplu/klasör düzeyi işlemler ve karışık iş akışları, eylem kapsamının yanlış anlaşılmasından doğan tıklama hatalarını azaltmak için CTA dışı stil kullanır.
- **Özel Tek Tık İş Akışları**: Kenar çubuğundaki yerleşik yardımcı araçları, kullanıcı tanımlı adlar ve birleştirilmiş eylem zincirleriyle yeniden kullanılabilir özel düğmelere dönüştürün. Varsayılan `One-Click Extract` iş akışı hazır gelir.

### Bilgi Grafiği Geliştirme
- **Otomatik Wiki-Bağlantılama**: LLM çıktısına göre işlenmiş notalardaki temel kavramları belirler ve onlara `[[wiki-links]]` ekler.
- **Kavram Notu Oluşturma (İsteğe Bağlı ve Özelleştirilebilir)**: Keşfedilen kavramlar için vault içinde belirttiğiniz klasörde otomatik olarak yeni notlar oluşturur.
- **Özelleştirilebilir Çıktı Yolları**: İşlenmiş dosyalar ile yeni oluşturulan kavram notaları için vault içinde ayrı göreli yollar yapılandırın.
- **Özelleştirilebilir Çıktı Dosya Adları (Add Links)**: Dosyaları bağlantı eklemek için işlerken varsayılan `_processed.md` yerine isteğe bağlı olarak **orijinal dosyanın üzerine yazabilir** ya da özel bir sonek/değiştirme dizesi kullanabilirsiniz.
- **Bağlantı Bütünlüğünü Koruma**: Vault içindeki notalar yeniden adlandırıldığında veya silindiğinde bağlantıları güncellemek için temel bir koruma sağlar.
- **Saf Kavram Çıkarma**: Orijinal dokümanı değiştirmeden kavramları çıkarır ve onlara karşılık gelen kavram notalarını oluşturur. Bu, mevcut dokümanlardan bilgi tabanı oluştururken kaynağı bozmadan ilerlemek için idealdir. Özellik, minimal kavram notları ve geri bağlantılar için yapılandırılabilir seçenekler sunar.

### Çeviri

- **Yapay Zeka Destekli Çeviri**:
  - Not içeriğini yapılandırılmış LLM ile çevirir.
  - **Büyük Dosya Desteği**: Büyük dosyalar, LLM'e gönderilmeden önce `Chunk word count` ayarına göre otomatik olarak daha küçük parçalara bölünür. Çevrilen parçalar daha sonra tek bir dokümanda sorunsuz biçimde birleştirilir.
  - Birden çok dil arasında çeviri yapılmasını destekler.
  - Hedef dil ayarlardan veya arayüzden özelleştirilebilir.
  - Çevrilen metni kolay karşılaştırma için orijinal metnin sağ tarafında otomatik olarak açar.
- **Toplu Çeviri**:
  - Seçilen klasördeki tüm dosyaları çevirir.
  - "Enable Batch Parallelism" açık olduğunda paralel işlemeyi destekler.
  - Yapılandırılmışsa çeviri için özel istemler kullanır.
  - Dosya gezgininin bağlam menüsüne "Batch translate this folder" seçeneğini ekler.
- **Otomatik çeviriyi devre dışı bırak**: Bu seçenek etkin olduğunda, Translate dışındaki görevler artık çıktıyı belirli bir dile zorlamaz ve kaynak dil bağlamını korur. Açık "Translate" görevi ise yapılandırıldığı şekilde çeviriyi sürdürür.

### Web Araştırması ve İçerik Oluşturma
- **Web Araştırması ve Özetleme**:
  - Tavily (API anahtarı gerekir) veya DuckDuckGo (deneysel) ile web araması yapın.
  - **Geliştirilmiş Arama Dayanıklılığı**: DuckDuckGo araması artık yerleşim değişikliklerine uyum sağlamak ve güvenilir sonuç üretmek için `DOMParser` ile regex fallback kombinasyonunu kullanır.
  - Arama sonuçlarını yapılandırılmış LLM ile özetleyin.
  - Özetin çıktı dili ayarlardan özelleştirilebilir.
  - Özetleri mevcut nota ekleyin.
  - LLM'e gönderilecek araştırma içeriği için ayarlanabilir token sınırı sunar.
- **Başlıktan İçerik Üretimi**:
  - LLM aracılığıyla başlangıç içeriği üretmek için nota başlığını kullanır ve mevcut içeriği bununla değiştirir.
  - **İsteğe Bağlı Araştırma**: Seçilen sağlayıcıyla web araştırması yapılıp yapılmayacağını yapılandırarak üretim için bağlamsal bilgi sağlayın.
- **Başlıklardan Toplu İçerik Üretimi**: Seçilen klasördeki tüm notalar için başlıklarına göre içerik üretir ve isteğe bağlı araştırma ayarına uyar. Başarıyla işlenen dosyalar, yeniden işlenmemeleri için **yapılandırılabilir bir "complete" alt klasörüne** taşınır, örneğin `[foldername]_complete` veya özel bir ad.
- **Mermaid Auto-Fix Bağlantısı**: Mermaid auto-fix etkin olduğunda, Mermaid ile ilgili iş akışları artık işlem sonrası üretilen dosyaları veya çıktı klasörlerini otomatik olarak onarır. Bu kapsama Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ve Translate akışları dahildir.

### Yardımcı Özellikler
- **Mermaid diyagramı olarak özetle**:
  - Bu özellik, bir notun içeriğini Mermaid diyagramı olarak özetlemenizi sağlar.
  - Mermaid diyagramının çıktı dili ayarlarda özelleştirilebilir.
  - **Mermaid Output Folder**: Oluşturulan Mermaid diyagram dosyalarının kaydedileceği klasörü yapılandırın.
  - **Translate Summarize to Mermaid Output**: İsterseniz oluşturulan Mermaid diyagram içeriğini yapılandırılmış hedef dile çevirin.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Basit Formül Biçimi Düzeltme**:
  - Tek satırda, tek `$` ile çevrelenmiş matematiksel ifadeleri hızlıca standart `$$` bloklarına dönüştürür.
  - **Tek Dosya**: Mevcut dosyayı kenar çubuğu düğmesi veya komut paleti üzerinden işleyin.
  - **Toplu Düzeltme**: Seçilen klasördeki tüm dosyaları kenar çubuğu düğmesi veya komut paleti üzerinden işleyin.

- **Check for Duplicates in Current File**: Bu komut, etkin dosyadaki potansiyel yinelenen terimleri belirlemenize yardımcı olur.
- **Duplicate Detection**: O anda işlenmekte olan dosya içeriğindeki yinelenen sözcükler için temel bir kontrol yapar. Sonuçlar konsola yazılır.
- **Check and Remove Duplicate Concept Notes**: Yapılandırılmış **Concept Note Folder** içindeki potansiyel yinelenen notları, klasör dışındaki notalarla tam ad eşleşmeleri, çoğul biçimler, normalizasyon ve tek kelime içerme karşılaştırmalarına göre belirler. Karşılaştırmanın kapsamı **tüm vault**, **yalnızca belirli dahil klasörler** veya **belirli klasörler hariç tüm klasörler** olarak ayarlanabilir. Nedenleri ve çakışan dosyaları içeren ayrıntılı bir liste gösterir; ardından belirlenen yinelenen notları sistem çöp kutusuna taşımadan önce onay ister. Silme sırasında ilerlemeyi gösterir.
- **Toplu Mermaid Düzeltmesi**: Kullanıcının seçtiği klasördeki tüm Markdown dosyalarına Mermaid ve LaTeX söz dizimi düzeltmeleri uygular.
  - **İş Akışına Hazır**: Tek başına yardımcı araç olarak ya da özel bir tek tık iş akışı düğmesinde adım olarak kullanılabilir.
  - **Hata Raporlama**: İşlemden sonra hâlâ potansiyel Mermaid hataları içeren dosyaları listeleyen `mermaid_error_{foldername}.md` raporu üretir.
  - **Hatalı Dosyaları Taşı**: Tespit edilen hatalı dosyaları isteğe bağlı olarak ayrı bir klasöre taşıyarak manuel incelemeye bırakır.
  - **Akıllı Tespit**: Artık gereksiz düzenlemeleri önlemek ve işleme süresini azaltmak için düzeltmeye başlamadan önce dosyalarda `mermaid.parse` ile söz dizimi hatası kontrolü yapar.
  - **Güvenli İşleme**: Söz dizimi düzeltmelerinin yalnızca Mermaid kod bloklarına uygulanmasını sağlar; böylece Markdown tabloları veya diğer içerikler yanlışlıkla değiştirilmez. `| :--- |` gibi tablo söz dizimlerini agresif hata ayıklama düzeltmelerinden koruyan sağlam önlemler içerir.
  - **Deep Debug Mode**: İlk düzeltmeden sonra hatalar sürerse gelişmiş bir deep debug modu tetiklenir. Bu mod aşağıdakiler de dahil olmak üzere karmaşık edge case'leri işler:
    - **Comment Integration**: `%` ile başlayan sondaki yorumları otomatik olarak kenar etiketine ekler; örneğin `A -- Label --> B; % Comment`, `A -- "Label(Comment)" --> B;` olur.
    - **Malformed Arrows**: Tırnakların içine çekilmiş okları düzeltir; örneğin `A -- "Label -->" B`, `A -- "Label" --> B` olur.
    - **Inline Subgraphs**: Satır içi subgraph etiketlerini edge label'lara dönüştürür.
    - **Reverse Arrow Fix**: Standart olmayan `X <-- Y` oklarını `Y --> X` biçimine çevirir.
    - **Direction Keyword Fix**: `direction` anahtar sözcüğünün subgraph içinde küçük harfle yazılmasını sağlar; örneğin `Direction TB` -> `direction TB`.
    - **Comment Conversion**: `//` yorumlarını edge label'lara dönüştürür; örneğin `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Yinelenen köşeli parantez etiketlerini sadeleştirir; örneğin `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Geçersiz `--|>` ok söz dizimini standart `-->` biçimine dönüştürür.
    - **Sağlam Etiket ve Not İşleme**: `/` gibi özel karakterler içeren etiketlerde geliştirilmiş işleme sunar, `note for ...` gibi özel note söz dizimlerini daha iyi destekler ve sonda kalan `]` gibi artıkları temizler.
    - **Advanced Fix Mode**: Boşluk, özel karakter veya iç içe köşeli parantez içeren tırnaksız düğüm etiketleri için sağlam düzeltmeler sağlar; örneğin `Node[Label [Text]]` -> `Node["Label [Text]"]`. Böylece Stellar Evolution yolları gibi karmaşık diyagramlarla uyumluluk korunur. Ayrıca `--["Label["-->` gibi bozuk edge label'ları `-- "Label" -->` biçimine düzeltir. `Consensus --> Adaptive; # Some advanced consensus` gibi satır içi yorumları `Consensus -- "Some advanced consensus" --> Adaptive` biçimine çevirir ve satır sonundaki eksik tırnakları `;"` yerine `"]` kullanarak düzeltir.
    - **Note Conversion**: `note right/left of` ve bağımsız `note :` yorumlarını otomatik olarak standart Mermaid düğüm tanımlarına ve bağlantılarına dönüştürür; örneğin `note right of A: text`, `A` düğümüne bağlanan `NoteA["Note: text"]` olur. Bu, söz dizimi hatalarını önler ve yerleşimi iyileştirir. Artık hem ok bağlantılarını (`-->`) hem de düz bağlantıları (`---`) destekler.
    - **Extended Note Support**: `note for Node "Content"` ve `note of Node "Content"` biçimlerini otomatik olarak standart bağlantılı note düğümlerine dönüştürür; örneğin `Node` ile bağlı `NoteNode[" Content"]`, böylece kullanıcı uzantılı söz dizimi uyumlu kalır.
    - **Enhanced Note Correction**: Birden fazla note bulunduğunda takma ad çakışmalarını önlemek için `Note1`, `Note2` gibi artan numaralarla note adlarını otomatik olarak yeniden yazar.
    - **Parallelogram/Shape Fix**: `[/["Label["/]` gibi bozuk düğüm şekillerini standart `["Label"]` biçimine düzeltir; böylece oluşturulan içerik uyumlu kalır.
    - **Standardize Pipe Labels**: Pipe içeren edge label'ları otomatik olarak düzeltir ve standartlaştırır; örneğin `-->|Text|`, `-->|"Text"|` olur ve `-->|Math|^2|`, `-->|"Math|^2"|` biçimine dönüşür.
    - **Misplaced Pipe Fix**: Okun önüne gelmiş edge label'ları düzeltir; örneğin `>|"Label"| A --> B`, `A -->|"Label"| B` olur.
    - **Merge Double Labels**: Aynı edge üzerindeki karmaşık çift etiketleri, örneğin `A -- Label1 -- Label2 --> B` veya `A -- Label1 -- Label2 --- B`, satır kırılımlı tek bir temiz etikete dönüştürür: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Tırnak işareti, eşittir işareti veya matematik operatörleri gibi sorun çıkarabilecek karakterler içeren ama dış tırnakları eksik olan düğüm etiketlerini otomatik olarak tırnak içine alır; örneğin `Plot[Plot "A"]`, `Plot["Plot "A""]` olur ve render hataları önlenir.
    - **Intermediate Node Fix**: Ara düğüm tanımı içeren kenarları iki ayrı kenara böler; örneğin `A -- B[...] --> C`, `A --> B[...]` ve `B[...] --> C` olur. Böylece geçerli Mermaid söz dizimi sağlanır.
    - **Concatenated Label Fix**: ID'nin etiketle birleştiği düğüm tanımlarını, örneğin `SubdivideSubdivide...`, bilinen node ID'lerine karşı doğrulayarak `Subdivide["Subdivide..."]` biçimine güvenli şekilde düzeltir; bu, pipe label'larıyla başlaması veya tekrarın tam eşleşmemesi durumlarında da çalışır.
- **Extract Specific Original Text**:
  - Ayarlarda bir soru listesi tanımlayın.
  - Bu sorulara yanıt veren kelimesi kelimesine metin parçalarını aktif notadan çıkarır.
  - **Merged Query Mode**: Verimlilik için tüm soruları tek API çağrısında işleme seçeneği sunar.
  - **Translation**: Çıkarılan metnin çevirilerini de sonuca ekleme seçeneği sunar.
  - **Custom Output**: Çıkarılan metin dosyası için yapılandırılabilir kayıt yolu ve dosya adı son eki sağlar.
- **LLM Bağlantı Testi**: Etkin sağlayıcı için API ayarlarını doğrulayın.

## Kurulum

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Obsidian Marketplace Üzerinden (Önerilen)
1. Obsidian'da **Settings** -> **Community plugins** bölümünü açın.
2. "Restricted mode" seçeneğinin **kapalı** olduğundan emin olun.
3. **Browse** community plugins'e tıklayın ve "Notemd" arayın.
4. **Install** düğmesine tıklayın.
5. Kurulum tamamlandıktan sonra **Enable** düğmesine tıklayın.

### Manuel Kurulum
1. En son sürüm dosyalarını [GitHub Releases sayfasından](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) indirin. Her sürüm pakete referans olarak `README.md` de ekler; ancak manuel kurulum için yalnızca `main.js`, `styles.css` ve `manifest.json` gerekir.
2. Obsidian vault'unuzun yapılandırma klasörüne gidin: `<YourVault>/.obsidian/plugins/`.
3. `notemd` adlı yeni bir klasör oluşturun.
4. `main.js`, `styles.css` ve `manifest.json` dosyalarını `notemd` klasörüne kopyalayın.
5. Obsidian'ı yeniden başlatın.
6. **Settings** -> **Community plugins** bölümüne gidin ve "Notemd"i etkinleştirin.

## Yapılandırma

Eklenti ayarlarına erişim:
**Settings** -> **Community Plugins** -> **Notemd** (dişli simgesine tıklayın).

### LLM Sağlayıcı Yapılandırması
1. **Etkin Sağlayıcı**: Açılır listeden kullanmak istediğiniz LLM sağlayıcısını seçin.
2. **Sağlayıcı Ayarları**: Seçilen sağlayıcıya ait özel ayarları yapılandırın:
   - **API Key**: OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks ve Requesty gibi çoğu bulut sağlayıcısı için gereklidir. Ollama için gerekmez. Uç noktanız anonim veya placeholder erişimini kabul ediyorsa LM Studio ve genel `OpenAI Compatible` ön ayarı için isteğe bağlıdır.
   - **Base URL / Endpoint**: Hizmetin API uç noktasıdır. Varsayılan değerler sağlanır; ancak LMStudio, Ollama gibi yerel modeller, OpenRouter, Requesty, OpenAI Compatible gibi gateway'ler veya belirli Azure deployment'ları için bunu değiştirmeniz gerekebilir. **Azure OpenAI için zorunludur.**
   - **Model**: Kullanılacak belirli model adı veya model ID'si, örneğin `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` veya `anthropic/claude-3-7-sonnet-latest`. Modelin sağlayıcınızda veya uç noktanızda kullanılabilir olduğundan emin olun.
   - **Sıcaklık**: LLM çıktısının rastgeleliğini kontrol eder (0 = deterministik, 1 = maksimum yaratıcılık). Daha düşük değerler, örneğin 0.2-0.5, yapılandırılmış görevlerde genellikle daha iyi sonuç verir.
   - **API Version (Yalnızca Azure)**: Azure OpenAI deployment'ları için zorunludur, örneğin `2024-02-15-preview`.
3. **Bağlantıyı Test Et**: Ayarlarınızı doğrulamak için etkin sağlayıcıya ait "Bağlantıyı Test Et" düğmesini kullanın. OpenAI-compatible sağlayıcılar artık sağlayıcı farkındalıklı kontroller kullanır: `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` ve `OpenAI Compatible` gibi uç noktalar `chat/completions` yolunu doğrudan test eder; güvenilir bir `/models` endpoint'i olan sağlayıcılar ise hâlâ önce model listelemeyi kullanabilir. İlk test `ERR_CONNECTION_CLOSED` gibi geçici ağ kopmasıyla başarısız olursa, Notemd artık hemen hata vermek yerine otomatik olarak kararlı yeniden deneme dizisine geçer.
4. **Sağlayıcı Yapılandırmalarını Yönet**: LLM sağlayıcı ayarlarınızı eklentinin yapılandırma dizinindeki `notemd-providers.json` dosyasına kaydetmek veya oradan yüklemek için "Dışa Aktar" ve "İçe Aktar" düğmelerini kullanın. Bu, yedekleme ve paylaşımı kolaylaştırır.
5. **Hazır Ayar Kapsamı**: Orijinal sağlayıcıların yanında Notemd artık `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` ve LiteLLM, vLLM, Perplexity, Vercel AI Gateway veya özel proxy'ler için genel bir `OpenAI Compatible` hedefi içerir.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Çoklu Model Yapılandırması
- **Görevler için farklı sağlayıcılar kullan**:
  - **Devre Dışı (Varsayılan)**: Yukarıda seçilen tek "Etkin Sağlayıcı" tüm görevler için kullanılır.
  - **Etkin**: "Add Links", "Research & Summarize", "Generate from Title", "Translate" ve "Extract Concepts" gibi her görev için belirli bir sağlayıcı seçmenize ve isteğe bağlı olarak model adını geçersiz kılmanıza olanak tanır. Bir görev için model override alanı boş bırakılırsa, o görev için seçilen sağlayıcıya ait varsayılan model kullanılır.
- **Farklı görevler için farklı diller seç**:
  - **Devre Dışı (Varsayılan)**: Tüm görevlerde tek bir çıktı dili kullanır.
  - **Etkin**: "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" ve "Extract Concepts" gibi görevlerin her biri için ayrı dil seçmenize olanak tanır.

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Dil Mimarisi (Arayüz Dili ve Görev Çıktı Dili)

- **Arayüz dili**, yalnızca eklenti arayüz metinlerini (ayar etiketleri, kenar çubuğu düğmeleri, bildirimler ve diyaloglar) kontrol eder. Varsayılan `auto` modu Obsidian'ın mevcut arayüz dilini izler.
- Bölgesel veya yazı sistemi varyantları artık doğrudan İngilizceye düşmek yerine en yakın yayımlanmış kataloğa eşlenir. Örneğin `fr-CA` Fransızca, `es-419` İspanyolca, `pt-PT` Portekizce, `zh-Hans` Basitleştirilmiş Çince ve `zh-Hant-HK` Geleneksel Çince kullanır.
- **Görev çıktı dili**, model tarafından üretilen görev çıktısını (bağlantılar, özetler, başlık üretimi, Mermaid özeti, kavram çıkarımı, çeviri hedefi) kontrol eder.
- **Görev başına dil modu**, her görevin çıktı dilini farklı modüllerde dağınık geçersiz kılmalar yerine birleşik bir ilke katmanı üzerinden çözmesine olanak tanır.
- **Otomatik çeviriyi devre dışı bırak**, Translate dışındaki görevleri kaynak dil bağlamında tutar; açık Translate görevleri ise yapılandırılmış hedef dili uygulamaya devam eder.
- Mermaid ile ilgili üretim yolları da aynı dil ilkesini izler ve etkinse Mermaid otomatik düzeltmesini tetiklemeye devam edebilir.

### Kararlı API Çağrı Ayarları
- **Kararlı API Çağrılarını Etkinleştir (yeniden deneme mantığı)**:
  - **Devre Dışı (Varsayılan)**: Tek bir API çağrısı hatası mevcut görevi durdurur.
  - **Etkin**: Başarısız LLM API çağrılarını otomatik olarak yeniden dener; aralıklı ağ sorunları veya rate limit durumlarında yararlıdır.
  - **Bağlantı Testi Yedek Yolu**: Normal çağrılar zaten kararlı modda çalışmıyor olsa bile, sağlayıcı bağlantı testleri artık ilk geçici ağ hatasından sonra aynı yeniden deneme dizisine geçer.
  - **Çalışma Zamanı Taşıma Yedek Yolu (Ortam Farkındalıklı)**: `requestUrl` tarafından geçici olarak düşürülen uzun görev istekleri artık önce aynı denemeyi ortam farkındalıklı bir yedek yoldan yeniden dener. Masaüstü sürümler Node `http/https`; masaüstü olmayan ortamlar tarayıcı `fetch` kullanır. Bu yedek denemeler artık yerleşik LLM yollarında protokol farkındalıklı akışlı ayrıştırma kullanır ve OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE ve Ollama NDJSON'ı kapsar; böylece yavaş ağ geçitleri gövde parçalarını daha erken döndürebilir. Kalan doğrudan OpenAI tarzı sağlayıcı girişleri de aynı ortak yedek yolu yeniden kullanır.
  - **OpenAI-Compatible Kararlı Sıra**: Kararlı modda her OpenAI-compatible denemesi artık başarısız sayılmadan önce `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` sırasını izler. Bu, yalnızca tek bir taşıma modu sorunlu olduğunda aşırı agresif hataları önler.
- **Retry Interval (seconds)**: Yalnızca bu özellik etkin olduğunda görünür. Yeniden denemeler arasındaki bekleme süresi 1-300 saniyedir. Varsayılan: 5.
- **Maximum Retries**: Yalnızca bu özellik etkin olduğunda görünür. Maksimum yeniden deneme sayısı 0-10'dur. Varsayılan: 3.
- **API Hata Ayıklama Modu**:
  - **Devre Dışı (Varsayılan)**: Standart ve kısa hata raporlaması kullanır.
  - **Etkin**: Translate, Search ve Connection Tests dahil tüm sağlayıcılar ve görevler için DeepSeek benzeri ayrıntılı hata günlüklerini etkinleştirir. Bu kapsama HTTP durum kodları, ham yanıt metni, istek taşıma zaman çizelgeleri, temizlenmiş istek URL'leri ve başlıklar, deneme süreleri, yanıt başlıkları, kısmi yanıt gövdeleri, ayrıştırılmış kısmi akış çıktısı ve yığın izleri girer. Bu veriler API bağlantı sorunları ve upstream ağ geçidi sıfırlamalarını gidermede kritiktir.
- **Developer Mode**:
  - **Devre Dışı (Varsayılan)**: Geliştiriciye özel tüm tanılama denetimlerini normal kullanıcılardan gizler.
  - **Etkin**: Ayarlarda özel bir geliştirici tanılama paneli gösterir.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Her probe için runtime yolunu seçin. OpenAI-compatible sağlayıcılar, runtime modlarına ek olarak `direct streaming`, `direct buffered` ve `requestUrl-only` gibi zorlanmış modları da destekler.
  - **Run Diagnostic**: Seçilen call mode ile tek bir uzun istek probe'u çalıştırır ve vault köküne `Notemd_Provider_Diagnostic_*.txt` yazar.
  - **Run Stability Test**: Aynı probe'u seçilen call mode ile yapılandırılabilir sayıda (1-10) tekrarlar ve toplu bir kararlılık raporu kaydeder.
  - **Diagnostic Timeout**: Her çalıştırma için yapılandırılabilir zaman aşımı, 15-3600 saniye.
  - **Why Use It**: Bir sağlayıcı "Test connection" testini geçip gerçek uzun görevlerde, örneğin yavaş gateway'lerde çeviri sırasında, başarısız olduğunda manuel tekrar üretimden daha hızlıdır.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Genel Ayarlar

#### İşlenmiş Dosya Çıktısı
- **Customize Processed File Save Path**:
  - **Devre Dışı (Varsayılan)**: İşlenmiş dosyalar, örneğin `YourNote_processed.md`, orijinal notla *aynı klasöre* kaydedilir.
  - **Etkin**: Özel bir kayıt konumu belirlemenize olanak tanır.
- **Processed File Folder Path**: Yalnızca yukarıdaki seçenek açıkken görünür. İşlenmiş dosyaların kaydedileceği vault içindeki *göreli yolu* girin, örneğin `Processed Notes` veya `Output/LLM`. Klasörler yoksa otomatik oluşturulur. **`C:\...` gibi mutlak yollar veya geçersiz karakterler kullanmayın.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Devre Dışı (Varsayılan)**: "Add Links" komutuyla üretilen dosyalar varsayılan `_processed.md` son ekini kullanır, örneğin `YourNote_processed.md`.
  - **Etkin**: Aşağıdaki ayarla çıktı dosya adını özelleştirmenize olanak tanır.
- **Custom Suffix/Replacement String**: Yalnızca yukarıdaki seçenek açıkken görünür. Çıktı dosya adında kullanılacak dizgiyi girin.
  - Boş bırakılırsa orijinal dosyanın üzerine **yazılır**.
  - Bir dizgi girerseniz, örneğin `_linked`, bu dizi orijinal temel ada eklenir; örneğin `YourNote_linked.md`. Son ekin geçersiz dosya adı karakterleri içermediğinden emin olun.

- **Remove Code Fences on Add Links**:
  - **Devre Dışı (Varsayılan)**: Code fences **(\`\\\`\`)** bağlantı eklenirken içerikte tutulur ve **(\`\\\`markdown)** otomatik silinir.
  - **Etkin**: Bağlantı eklenmeden önce içerikteki code fence'leri kaldırır.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Kavram Notu Çıktısı
- **Customize Concept Note Path**:
  - **Devre Dışı (Varsayılan)**: `[[linked concepts]]` için otomatik not oluşturma devre dışıdır.
  - **Etkin**: Yeni kavram notalarının oluşturulacağı klasörü belirtmenizi sağlar.
- **Concept Note Folder Path**: Yalnızca yukarıdaki seçenek açıkken görünür. Yeni kavram notalarının kaydedileceği vault içindeki *göreli yolu* girin, örneğin `Concepts` veya `Generated/Topics`. Klasörler yoksa otomatik oluşturulur. **Özelleştirme açıksa doldurulması zorunludur.** **Mutlak yollar veya geçersiz karakterler kullanmayın.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Kavram Günlük Dosyası Çıktısı
- **Generate Concept Log File**:
  - **Devre Dışı (Varsayılan)**: Günlük dosyası oluşturulmaz.
  - **Etkin**: İşlemden sonra yeni oluşturulan kavram notalarını listeleyen bir günlük dosyası üretir. Biçim şöyledir:
    ```
    xx kavram md dosyası oluştur
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Yalnızca "Generate Concept Log File" açıkken görünür.
  - **Devre Dışı (Varsayılan)**: Günlük dosyası, varsa **Concept Note Folder Path** içinde; yoksa vault kökünde kaydedilir.
  - **Etkin**: Günlük dosyası için özel bir klasör belirtmenize olanak tanır.
- **Concept Log Folder Path**: Yalnızca "Customize Log File Save Path" açıkken görünür. Günlük dosyasının kaydedileceği vault içindeki *göreli yolu* girin, örneğin `Logs/Notemd`. **Özelleştirme açıksa doldurulması zorunludur.**
- **Customize Log File Name**: Yalnızca "Generate Concept Log File" açıkken görünür.
  - **Devre Dışı (Varsayılan)**: Günlük dosyasının adı `Generate.log` olur.
  - **Etkin**: Günlük dosyası için özel bir ad belirlemenizi sağlar.
- **Concept Log File Name**: Yalnızca "Customize Log File Name" açıkken görünür. İstenen dosya adını girin, örneğin `ConceptCreation.log`. **Özelleştirme açıksa doldurulması zorunludur.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Kavram Çıkarma Görevi
- **En küçük kavram notlarını oluştur**:
  - **Açık (Varsayılan)**: Yeni oluşturulan kavram notaları yalnızca başlığı içerir, örneğin `# Kavram`.
  - **Kapalı**: Kavram notaları, alttaki ayarla kapatılmamışsa "Linked From" geri bağlantısı gibi ek içerik içerebilir.
- **Add "Linked From" backlink**:
  - **Kapalı (Varsayılan)**: Çıkarma sırasında kavram notuna kaynak dokümana geri bağlantı eklemez.
  - **Açık**: Kaynak dosyaya geri bağlantı içeren bir "Linked From" bölümü ekler.

#### Belirli Özgün Metni Ayıkla
- **Questions for extraction**: Notlarınızdan kelimesi kelimesine yanıtların ayıklanmasını istediğiniz soruları satır başına bir soru olacak şekilde girin.
- **Translate output to corresponding language**:
  - **Kapalı (Varsayılan)**: Yalnızca ayıklanan metni orijinal dilinde üretir.
  - **Açık**: Ayıklanan metnin bu görev için seçilen dilde çevirisini ekler.
- **Merged query mode**:
  - **Kapalı**: Her soruyu ayrı işler; daha yüksek doğruluk sağlar ama daha fazla API çağrısı kullanır.
  - **Açık**: Tüm soruları tek promptta gönderir; daha hızlı ve daha az API çağrılıdır.
- **Customise extracted text save path & filename**:
  - **Kapalı**: Orijinal dosyayla aynı klasöre `_Extracted` son ekiyle kaydeder.
  - **Açık**: Özel bir çıktı klasörü ve dosya adı son eki tanımlamanızı sağlar.

#### Toplu Mermaid Düzeltmesi
- **Enable Mermaid Error Detection**:
  - **Kapalı (Varsayılan)**: İşlem sonrası hata tespiti atlanır.
  - **Açık**: İşlenmiş dosyaları kalan Mermaid söz dizimi hataları için tarar ve `mermaid_error_{foldername}.md` raporu üretir.
- **Move files with Mermaid errors to specified folder**:
  - **Kapalı**: Hatalı dosyalar yerinde kalır.
  - **Açık**: Düzeltme girişiminden sonra hâlâ Mermaid söz dizimi hatası içeren dosyaları manuel inceleme için özel bir klasöre taşır.
- **Mermaid error folder path**: Yukarıdaki seçenek etkinse görünür. Hatalı dosyaların taşınacağı klasördür.

#### İşleme Parametreleri
- **Enable Batch Parallelism**:
  - **Devre Dışı (Varsayılan)**: "Process Folder" veya "Batch Generate from Titles" gibi toplu görevler dosyaları tek tek, seri biçimde işler.
  - **Etkin**: Eklentinin birden fazla dosyayı eşzamanlı işlemesine izin verir; bu, büyük toplu işlerde ciddi hız kazancı sağlayabilir.
- **Batch Concurrency**: Yalnızca paralellik açıksa görünür. Paralel işlenecek maksimum dosya sayısını belirler. Daha yüksek değer daha hızlı olabilir, ancak daha fazla kaynak tüketir ve API rate limit'e çarpabilir. Varsayılan: 1, aralık: 1-20.
- **Batch Size**: Yalnızca paralellik açıksa görünür. Tek bir batch içinde gruplanacak dosya sayısıdır. Varsayılan: 50, aralık: 10-200.
- **Delay Between Batches (ms)**: Yalnızca paralellik açıksa görünür. Batch'ler arasına eklenecek isteğe bağlı gecikmedir; API rate limit yönetimine yardımcı olabilir. Varsayılan: 1000 ms.
- **API Call Interval (ms)**: Her bir LLM API çağrısından *önce ve sonra* uygulanacak minimum gecikme (milisaniye). Düşük oran limitli API'lerde veya 429 hatalarını önlemek için önemlidir. Yapay gecikme istemiyorsanız 0 girin. Varsayılan: 500 ms.
- **Chunk Word Count**: LLM'e gönderilecek parça başına maksimum kelime sayısıdır. Büyük dosyalar için API çağrısı sayısını etkiler. Varsayılan: 3000.
- **Enable Duplicate Detection**: İşlenmiş içerikte yinelenen sözcükler için temel denetimi açıp kapatır. Sonuçlar konsola yazılır. Varsayılan: Etkin.
- **Max Tokens**: LLM'in yanıt parçası başına üretebileceği maksimum token sayısıdır. Maliyeti ve ayrıntı düzeyini etkiler. Varsayılan: 4096.
<img width="795" height="274" alt="İşleme parametreleri   Dil ayarları" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Çeviri
- **Default Target Language**: Notlarınızı varsayılan olarak çevirmek istediğiniz dili seçin. Bu değer çeviri komutunu çalıştırırken arayüzden değiştirilebilir. Varsayılan: English.
- **Customise Translation File Save Path**:
  - **Devre Dışı (Varsayılan)**: Çevrilen dosyalar orijinal notla *aynı klasöre* kaydedilir.
  - **Etkin**: Çevrilen dosyaların kaydedileceği vault içindeki *göreli yolu* tanımlamanıza olanak tanır, örneğin `Translations`. Klasör yoksa oluşturulur.
- **Use custom suffix for translated files**:
  - **Devre Dışı (Varsayılan)**: Çevrilen dosyalar varsayılan `_translated.md` son ekini kullanır, örneğin `YourNote_translated.md`.
  - **Etkin**: Özel bir son ek belirtmenize olanak tanır.
- **Custom Suffix**: Yalnızca yukarıdaki seçenek açıkken görünür. Çevrilen dosya adına eklenecek özel son eki girin, örneğin `_es` veya `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### İçerik Oluşturma
- **Enable Research in "Generate from Title"**:
  - **Devre Dışı (Varsayılan)**: "Generate from Title" yalnızca başlığı girdi olarak kullanır.
  - **Etkin**: Yapılandırılmış **Web Research Provider** ile web araştırması yapar ve bulunan sonuçları LLM'e verilecek bağlam olarak ekler.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Etkin (Varsayılan)**: Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ve Translate gibi Mermaid ile ilgili iş akışlarından sonra otomatik olarak Mermaid söz dizimi düzeltmesi çalıştırır.
  - **Devre Dışı**: `Batch Mermaid Fix` elle çalıştırılana veya özel bir iş akışına eklenene kadar üretilen Mermaid çıktısını olduğu gibi bırakır.
- **Output Language**: "Generate from Title" ve "Batch Generate from Title" görevleri için istenen çıktı dilini seçin.
  - **English (Varsayılan)**: İstemler İngilizce işlenir ve çıktı İngilizce üretilir.
  - **Diğer Diller**: LLM'den akıl yürütmeyi İngilizce yapması, ancak son dokümantasyonu seçtiğiniz dilde, örneğin Español, Français, 简体中文, 繁體中文, العربية veya हिन्दी olarak üretmesi istenir.
- **Change Prompt Word**:
  - **Change Prompt Word**: Belirli bir görev için prompt sözcüğünü değiştirmenize olanak tanır.
  - **Custom Prompt Word**: İlgili görev için kendi prompt sözcüğünüzü girin.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Devre Dışı (Varsayılan)**: Başarıyla oluşturulan dosyalar, orijinal klasörün üst dizinine göre `[OriginalFolderName]_complete` adlı alt klasöre, orijinal klasör kökse `Vault_complete` klasörüne taşınır.
  - **Etkin**: Tamamlanan dosyaların taşınacağı alt klasör için özel bir ad belirlemenizi sağlar.
- **Custom Output Folder Name**: Yalnızca yukarıdaki seçenek açıkken görünür. Alt klasör için istediğiniz adı girin, örneğin `Generated Content` veya `_complete`. Geçersiz karakterlere izin verilmez. Boş bırakılırsa `_complete` kullanılır. Klasör, orijinal klasörün üst dizinine göre oluşturulur.

#### Tek Tık İş Akışı Düğmeleri
- **Visual Workflow Builder**: Dahili eylemlerden özel iş akışı düğmeleri oluşturun; DSL'i elle yazmanız gerekmez.
- **Custom Workflow Buttons DSL**: İleri düzey kullanıcılar iş akışı tanım metnini doğrudan düzenleyebilir. Geçersiz DSL güvenli şekilde varsayılan iş akışına geri döner ve kenar çubuğu/ayarlar arayüzünde bir uyarı gösterir.
- **Workflow Error Strategy**:
  - **Stop on Error (Varsayılan)**: Bir adım başarısız olduğunda iş akışını hemen durdurur.
  - **Continue on Error**: Sonraki adımları çalıştırmaya devam eder ve sonda başarısız eylem sayısını raporlar.
- **Default Workflow Included**: `One-Click Extract`, `Process File (Add Links)`, `Batch Generate from Titles` ve `Batch Mermaid Fix` adımlarını zincirler.

#### Özel İstem Ayarları
Bu özellik, belirli görevler için LLM'e gönderilen varsayılan yönergeleri (istemleri) geçersiz kılmanıza olanak tanır ve çıktı üzerinde daha ince kontrol sağlar.

- **Enable Custom Prompts for Specific Tasks**:
  - **Devre Dışı (Varsayılan)**: Eklenti tüm işlemler için kendi yerleşik varsayılan istemlerini kullanır.
  - **Etkin**: Aşağıda listelenen görevler için özel istemler tanımlayabilmenizi sağlar. Bu, özelliğin ana anahtarıdır.

- **Use Custom Prompt for [Task Name]**: Yalnızca yukarıdaki seçenek etkin olduğunda görünür.
  - "Add Links", "Generate from Title", "Research & Summarize" ve "Extract Concepts" gibi desteklenen görevlerin her biri için özel isteminizi ayrı ayrı açıp kapatabilirsiniz.
  - **Devre Dışı**: İlgili görev varsayılan istemi kullanır.
  - **Etkin**: İlgili görev aşağıdaki "Custom Prompt" alanına yazdığınız metni kullanır.

- **Custom Prompt Text Area**: Yalnızca bir görevin özel istemi etkin olduğunda görünür.
  - **Default Prompt Display**: Eklenti, normalde kullanacağı varsayılan istemi referans için gösterir. Bunu başlangıç noktası yapmak için **"Copy Default Prompt"** düğmesini kullanabilirsiniz.
  - **Custom Prompt Input**: Burada LLM için kendi talimatlarınızı yazarsınız.
  - **Placeholders**: İsteminizde, eklentinin isteği LLM'e göndermeden önce gerçek içerikle değiştireceği özel yer tutucular kullanabilirsiniz ve kullanmalısınız. Her görev için hangi yer tutucuların desteklendiğini görmek için varsayılan isteme bakın. Yaygın yer tutucular şunlardır:
    - `{TITLE}`: Geçerli notun başlığı.
    - `{RESEARCH_CONTEXT_SECTION}`: Web araştırmasından toplanan içerik.
    - `{USER_PROMPT}`: İşlenmekte olan notun içeriği.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Yinelenen kontrol kapsamı   Özel istem ayarları" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Yinelenen Kontrol Kapsamı
- **Duplicate Check Scope Mode**: **Concept Note Folder** içindeki notalar için potansiyel yinelenenleri bulmak amacıyla hangi dosyaların karşılaştırılacağını kontrol eder.
  - **Entire Vault (Varsayılan)**: Kavram notalarını vault'taki diğer tüm notalarla karşılaştırır (Concept Note Folder hariç).
  - **Include Specific Folders Only**: Kavram notalarını yalnızca aşağıda listelenen klasörlerdeki notalarla karşılaştırır.
  - **Exclude Specific Folders**: Kavram notalarını aşağıda listelenen klasörler dışındaki tüm notalarla karşılaştırır ve Concept Note Folder'ı da hariç tutar.
  - **Concept Folder Only**: Kavram notalarını yalnızca *Concept Note Folder içindeki diğer notalarla* karşılaştırır. Bu, yalnızca oluşturulmuş kavramlar arasında yinelenenleri bulmaya yardımcı olur.
- **Include/Exclude Folders**: Yalnızca mod 'Include' veya 'Exclude' ise görünür. Dahil etmek veya hariç tutmak istediğiniz klasörlerin *göreli yollarını* **satır başına bir yol** olacak şekilde girin. Yollar büyük/küçük harfe duyarlıdır ve ayraç olarak `/` kullanır, örneğin `Reference Material/Papers` veya `Daily Notes`. Bu klasörler Concept Note Folder ile aynı olamaz ve onun içinde bulunamaz.

#### Web Araştırma Sağlayıcısı
- **Search Provider**: `Tavily` (API anahtarı gerekir, önerilir) ile `DuckDuckGo` (deneysel, otomatik isteklerde sıklıkla engellenir) arasında seçim yapın. "Research & Summarize Topic" için ve isteğe bağlı olarak "Generate from Title" için kullanılır.
- **Tavily API Key**: Yalnızca Tavily seçiliyse görünür. [tavily.com](https://tavily.com/) üzerinden alınan API anahtarınızı girin.
- **Tavily Max Results**: Yalnızca Tavily seçiliyse görünür. Tavily'nin döndüreceği maksimum arama sonucu sayısı 1-20. Varsayılan: 5.
- **Tavily Search Depth**: Yalnızca Tavily seçiliyse görünür. `basic` (varsayılan) veya `advanced` seçin. Not: `advanced` daha iyi sonuç verir, ancak arama başına 1 yerine 2 API kredisi tüketir.
- **DuckDuckGo Max Results**: Yalnızca DuckDuckGo seçiliyse görünür. Ayrıştırılacak maksimum arama sonucu sayısı 1-10. Varsayılan: 5.
- **DuckDuckGo Content Fetch Timeout**: Yalnızca DuckDuckGo seçiliyse görünür. Her DuckDuckGo sonuç URL'sinden içerik çekmeye çalışırken beklenecek maksimum saniye sayısı. Varsayılan: 15.
- **Max Research Content Tokens**: Özetleme istemine dahil edilecek birleşik web araştırması sonuçları, alıntılar ve çekilmiş içerikten gelen yaklaşık maksimum token sayısıdır. Bağlam penceresi boyutunu ve maliyeti kontrol etmeye yardımcı olur. Varsayılan: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Odaklı Öğrenme Alanı
- **Enable Focused Learning Domain**:
  - **Devre Dışı (Varsayılan)**: LLM'e gönderilen istemler standart genel amaçlı talimatları kullanır.
  - **Etkin**: LLM'in bağlamsal kavrayışını geliştirmek için bir veya daha fazla çalışma alanı belirtmenize olanak tanır.
- **Learning Domain**: Yalnızca yukarıdaki seçenek etkin olduğunda görünür. `Materials Science`, `Polymer Physics` veya `Machine Learning` gibi alanlarınızı girin. Bu bilgi istemlerin başına "Relevant Fields: [...]" satırını ekler ve LLM'in çalışma alanınız için daha doğru ve ilgili bağlantılar ile içerik üretmesine yardımcı olur.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Kullanım Kılavuzu

### Hızlı İş Akışları ve Kenar Çubuğu

- Çekirdek işleme, üretim, çeviri, bilgi ve yardımcı araçlar için gruplanmış eylem bölümlerine erişmek üzere Notemd kenar çubuğunu açın.
- Kenar çubuğunun üst kısmındaki **Hızlı İş Akışları** alanını, özel çok adımlı düğmeleri başlatmak için kullanın.
- Varsayılan **One-Click Extract** iş akışı `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix` sırasını çalıştırır.
- İş akışı ilerlemesi, adım bazlı günlükler ve hatalar kenar çubuğunda gösterilir. Sabitlenmiş alt bölüm, ilerleme çubuğu ve günlük alanının açılmış bölümler nedeniyle görünmez hale gelmesini engeller.
- İlerleme kartı durum metnini, ayrı yüzde kapsülünü ve kalan süreyi tek bakışta okunabilir tutar; aynı özel iş akışları ayarlardan yeniden yapılandırılabilir.

### Özgün İşleme (Wiki-Link Ekleme)
Bu, kavramları tanımlamaya ve `[[wiki-links]]` eklemeye odaklanan temel işlevdir.

**Önemli:** Bu süreç yalnızca `.md` veya `.txt` dosyalarıyla çalışır. Daha ileri işlemeden önce PDF dosyalarını ücretsiz olarak [Mineru](https://github.com/opendatalab/MinerU) ile MD dosyalarına dönüştürebilirsiniz.

1. **Kenar Çubuğunu Kullanma**:
   - Notemd Sidebar'ı açın (sihirli değnek simgesi veya komut paleti).
   - `.md` veya `.txt` dosyasını açın.
   - **"Process File (Add Links)"** düğmesine tıklayın.
   - Bir klasörü işlemek için: **"Process Folder (Add Links)"** düğmesine tıklayın, klasörü seçin ve "Process"e basın.
   - İlerleme kenar çubuğunda gösterilir. Görevi kenar çubuğundaki "Cancel Processing" düğmesiyle iptal edebilirsiniz.
   - *Klasör işleme notu:* Dosyalar editörde açılmadan arka planda işlenir.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Komut Paleti Kullanma** (`Ctrl+P` veya `Cmd+P`):
   - **Tek Dosya**: Dosyayı açın ve `Notemd: Process Current File` komutunu çalıştırın.
   - **Klasör**: `Notemd: Process Folder` komutunu çalıştırın ve ardından klasörü seçin. Dosyalar editörde açılmadan arka planda işlenir.
   - Komut paleti eylemleri için iptal düğmesi de içeren bir ilerleme modali görünür.
   - *Not:* Eklenti, son işlenmiş içerik kaydedilmeden önce varsa baştaki `\boxed{` satırlarını ve sondaki `}` satırlarını otomatik olarak kaldırır.

### Yeni Özellikler

1. **Mermaid diyagramı olarak özetle**:
   - Özetlemek istediğiniz notu açın.
   - `Notemd: Summarise as Mermaid diagram` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - Eklenti Mermaid diyagramı içeren yeni bir not oluşturur.

2. **Translate Note/Selection**:
   - Yalnızca seçimi çevirmek istiyorsanız not içindeki metni seçin veya komutu seçimsiz çalıştırarak tüm notu çevirtin.
   - `Notemd: Translate Note/Selection` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - **Target Language** değerini onaylayabileceğiniz veya değiştirebileceğiniz bir modal açılır; varsayılan değer Yapılandırma bölümündeki ayardan gelir.
   - Eklenti çeviriyi yapmak için Multi-Model ayarlarına göre yapılandırılmış **LLM Provider**'ı kullanır.
   - Çevrilen içerik, yapılandırılmış **Translation Save Path** içine uygun son ekle kaydedilir ve kolay karşılaştırma için **orijinal içeriğin sağında yeni bir bölmede** açılır.
   - Bu görev kenar çubuğu düğmesi veya modal iptal düğmesi ile iptal edilebilir.
3. **Toplu Çeviri**:
   - Komut paletinden `Notemd: Batch Translate Folder` komutunu çalıştırıp bir klasör seçin veya dosya gezgininde bir klasöre sağ tıklayıp "Batch translate this folder" seçeneğini kullanın.
   - Eklenti seçilen klasördeki tüm Markdown dosyalarını çevirir.
   - Çevrilen dosyalar yapılandırılmış çeviri yoluna kaydedilir, ancak otomatik olarak açılmaz.
   - Bu süreç ilerleme modalinden iptal edilebilir.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Not içinde bir metin seçin veya notun başlığa sahip olduğundan emin olun; bu başlık arama konusu olarak kullanılır.
   - `Notemd: Research and Summarize Topic` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - Eklenti bilgi bulup özetlemek için yapılandırılmış **Search Provider**'ı (Tavily/DuckDuckGo) ve Multi-Model ayarlarına göre uygun **LLM Provider**'ı kullanır.
   - Özet mevcut nota eklenir.
   - Bu görev kenar çubuğu düğmesi veya modal iptal düğmesi ile iptal edilebilir.
   - *Not:* DuckDuckGo aramaları bot algılama nedeniyle başarısız olabilir. Tavily önerilir.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Bir not açın (boş olabilir).
   - `Notemd: Generate Content from Title` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - Eklenti, not başlığına göre içerik oluşturmak ve mevcut içeriği bununla değiştirmek için Multi-Model ayarlarına göre uygun **LLM Provider**'ı kullanır.
   - **"Enable Research in 'Generate from Title'"** ayarı açıksa, önce yapılandırılmış **Web Research Provider** üzerinden web araştırması yapılır ve elde edilen bağlam LLM'e gönderilen isteme eklenir.
   - Bu görev kenar çubuğu düğmesi veya modal iptal düğmesi ile iptal edilebilir.

5. **Batch Generate Content from Titles**:
   - `Notemd: Batch Generate Content from Titles` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - İşlemek istediğiniz notaları içeren klasörü seçin.
   - Eklenti, klasördeki her `.md` dosyasını (`_processed.md` dosyaları ve belirlenen "complete" klasöründekiler hariç) başlığa göre içerik üreterek işler ve mevcut içeriği değiştirir. Dosyalar editörde açılmadan arka planda işlenir.
   - Başarıyla işlenen dosyalar yapılandırılmış "complete" klasörüne taşınır.
   - Bu komut, işlenen her not için **"Enable Research in 'Generate from Title'"** ayarına uyar.
   - Bu görev kenar çubuğu düğmesi veya modal iptal düğmesi ile iptal edilebilir.
   - İlerleme ve sonuçlar (değiştirilen dosya sayısı, hatalar) kenar çubuğu veya modal günlüğünde gösterilir.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Ayarlarda **Concept Note Folder Path** değerinin doğru yapılandırıldığından emin olun.
   - `Notemd: Check and Remove Duplicate Concept Notes` komutunu çalıştırın (komut paleti veya kenar çubuğu düğmesiyle).
   - Eklenti kavram notu klasörünü tarar ve dosya adlarını klasör dışındaki notlarla tam eşleşme, çoğul biçim, normalizasyon ve içerme gibi çeşitli kurallara göre karşılaştırır.
   - Potansiyel yinelenenler bulunursa dosyaları, işaretlenme nedenlerini ve çakışan dosyaları listeleyen bir modal pencere açılır.
   - Listeyi dikkatlice inceleyin. Listelenen dosyaları sistem çöp kutusuna taşımak için **"Delete Files"**, hiçbir işlem yapmamak için **"Cancel"** düğmesini kullanın.
   - İlerleme ve sonuçlar kenar çubuğu veya modal günlüğünde gösterilir.

7. **Extract Concepts (Pure Mode)**:
   - Bu özellik, bir dokümandan kavramları çıkarıp orijinal dosyayı değiştirmeden karşılık gelen kavram notlarını oluşturmanızı sağlar. Bir doküman setinden bilgi tabanınızı hızlıca doldurmak için idealdir.
   - **Tek Dosya**: Bir dosya açın ve komut paletinden `Notemd: Extract concepts (create concept notes only)` komutunu çalıştırın veya kenar çubuğundaki **"Extract concepts (current file)"** düğmesine tıklayın.
   - **Klasör**: Komut paletinden `Notemd: Batch extract concepts from folder` komutunu çalıştırın veya kenar çubuğundaki **"Extract concepts (folder)"** düğmesine tıklayıp işlenecek klasörü seçin.
   - Eklenti dosyaları okur, kavramları belirler ve özgün dosyaları bozmadan bunlar için belirlenen **Concept Note Folder** içinde yeni notlar oluşturur.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Bu güçlü komut, yeni kavram notaları oluşturup doldurma sürecini sadeleştirir.
   - Editörde bir kelime ya da ifade seçin.
   - `Notemd: Create Wiki-Link & Generate Note from Selection` komutunu çalıştırın (örneğin `Cmd+Shift+W` gibi bir kısayol atamanız önerilir).
   - Eklenti şunları yapar:
     1. Seçili metni bir `[[wiki-link]]` ile değiştirir.
     2. Bu başlıkta bir notun **Concept Note Folder** içinde zaten var olup olmadığını kontrol eder.
     3. Varsa mevcut nota geri bağlantı ekler.
     4. Yoksa yeni, boş bir not oluşturur.
     5. Ardından yeni veya mevcut not üzerinde **"Generate Content from Title"** komutunu otomatik olarak çalıştırır ve notu AI üretimi içerikle doldurur.

9. **Extract Concepts and Generate Titles**:
   - Bu komut iki güçlü özelliği tek bir akıcı iş akışında zincirler.
   - `Notemd: Extract Concepts and Generate Titles` komutunu komut paletinden çalıştırın (buna bir kısayol atamanız önerilir).
   - Eklenti şunları yapar:
     1. Önce mevcut aktif dosya üzerinde **"Extract concepts (current file)"** görevini çalıştırır.
     2. Sonra ayarlarda **Concept note folder path** olarak belirttiğiniz klasör üzerinde otomatik olarak **"Batch generate from titles"** görevini çalıştırır.
   - Böylece önce bir kaynak dokümandan yeni kavramlarla bilgi tabanınızı genişletir, ardından bu yeni kavram notalarını aynı akışta AI üretimi içerikle hemen zenginleştirirsiniz.

10. **Extract Specific Original Text**:
   - Sorularınızı ayarlarda "Extract Specific Original Text" bölümünde tanımlayın.
   - Etkin dosyayı işlemek için kenar çubuğundaki "Extract Specific Original Text" düğmesini kullanın.
   - **Merged Mode**: Tüm soruları tek promptta göndererek işlemeyi hızlandırır.
   - **Translation**: Çıkarılan metni isteğe bağlı olarak yapılandırılmış dilinize çevirir.
   - **Custom Output**: Çıktı dosyasının nereye ve nasıl kaydedileceğini yapılandırmanızı sağlar.

11. **Batch Mermaid Fix**:
   - Klasörü tarayıp yaygın Mermaid söz dizimi hatalarını düzeltmek için kenar çubuğundaki "Batch Mermaid Fix" düğmesini kullanın.
   - Eklenti, hâlâ hatalı olan dosyaları `mermaid_error_{foldername}.md` dosyasında raporlar.
   - İsterseniz bu problemli dosyaları inceleme için ayrı bir klasöre taşımaya da yapılandırabilirsiniz.

## Desteklenen LLM Sağlayıcıları

| Sağlayıcı | Tür | API Anahtarı Gerekli | Notlar |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Bulut      | Evet                   | Reasoning model desteğine sahip yerel DeepSeek uç noktası             |
| Qwen               | Bulut      | Evet                   | Qwen / QwQ modelleri için DashScope compatible-mode ön ayarı          |
| Qwen Code          | Bulut      | Evet                   | Qwen kod modelleri için DashScope odaklı ön ayar                      |
| Doubao             | Bulut      | Evet                   | Volcengine Ark ön ayarı; model alanı genelde endpoint ID'nizdir       |
| Moonshot           | Bulut      | Evet                   | Resmî Kimi / Moonshot uç noktası                                      |
| GLM                | Bulut      | Evet                   | Resmî Zhipu BigModel OpenAI-compatible uç noktası                     |
| Z AI               | Bulut      | Evet                   | Uluslararası GLM/Zhipu OpenAI-compatible uç noktası; `GLM`'i tamamlar |
| MiniMax            | Bulut      | Evet                   | Resmî MiniMax chat-completions uç noktası                             |
| Huawei Cloud MaaS  | Bulut      | Evet                   | Barındırılan modeller için Huawei ModelArts MaaS OpenAI-compatible uç noktası |
| Baidu Qianfan      | Bulut      | Evet                   | ERNIE modelleri için resmî Qianfan OpenAI-compatible uç noktası       |
| SiliconFlow        | Bulut      | Evet                   | Barındırılan OSS modelleri için resmî SiliconFlow OpenAI-compatible uç noktası |
| OpenAI             | Bulut      | Evet                   | GPT ve o-serisi modelleri destekler                                   |
| Anthropic          | Bulut      | Evet                   | Claude modellerini destekler                                          |
| Google             | Bulut      | Evet                   | Gemini modellerini destekler                                          |
| Mistral            | Bulut      | Evet                   | Mistral ve Codestral ailelerini destekler                             |
| Azure OpenAI       | Bulut      | Evet                   | Endpoint, API Key, dağıtım adı ve API Version gerektirir              |
| OpenRouter         | Ağ Geçidi | Evet                   | OpenRouter model ID'leri üzerinden birçok sağlayıcıya erişim sağlar   |
| xAI                | Bulut      | Evet                   | Yerel Grok uç noktası                                                 |
| Groq               | Bulut      | Evet                   | Barındırılan OSS modelleri için hızlı OpenAI-compatible çıkarım       |
| Together           | Bulut      | Evet                   | Barındırılan OSS modelleri için OpenAI-compatible uç nokta            |
| Fireworks          | Bulut      | Evet                   | OpenAI-compatible çıkarım uç noktası                                  |
| Requesty           | Ağ Geçidi | Evet                   | Tek API anahtarı arkasında çoklu sağlayıcı yönlendirmesi              |
| OpenAI Compatible  | Ağ Geçidi | İsteğe Bağlı           | LiteLLM, vLLM, Perplexity, Vercel AI Gateway vb. için genel ön ayar   |
| LMStudio           | Yerel      | İsteğe Bağlı (`EMPTY`) | Modelleri LM Studio sunucusu üzerinden yerel çalıştırır               |
| Ollama             | Yerel      | Hayır                  | Modelleri Ollama sunucusu üzerinden yerel çalıştırır                  |

*Not: Yerel sağlayıcılar (LMStudio, Ollama) için ilgili sunucu uygulamasının çalıştığından ve yapılandırılmış Base URL üzerinden erişilebilir olduğundan emin olun.*
*Not: OpenRouter ve Requesty için gateway'in gösterdiği sağlayıcı önekli veya tam model tanımlayıcısını kullanın; örneğin `google/gemini-flash-1.5` veya `anthropic/claude-3-7-sonnet-latest`.*
*Not: `Doubao`, model alanında ham model ailesi adı yerine genellikle Ark endpoint/deployment ID bekler. Ayar ekranı artık placeholder değerin hâlâ yerinde olduğunu uyarır ve gerçek endpoint ID girilene kadar connection testlerini engeller.*
*Not: `Z AI` uluslararası `api.z.ai` hattını hedeflerken, `GLM` Çin anakarası BigModel uç noktasını kullanmaya devam eder. Hesap bölgenize uyan ön ayarı seçin.*
*Not: Çin odaklı ön ayarlar chat-first bağlantı testleri kullanır; böylece test yalnızca API anahtarının ulaşılabilirliğini değil, gerçekten yapılandırılmış model/deployment'ı doğrular.*
*Not: `OpenAI Compatible`, özel gateway ve proxy'ler için tasarlanmıştır. Base URL, API anahtarı politikası ve model ID'sini sağlayıcınızın belgelerine göre ayarlayın.*

## Ağ Kullanımı ve Veri İşleme

Notemd, Obsidian içinde yerel olarak çalışır; ancak bazı özellikler dış ağ istekleri gönderir.

### LLM Sağlayıcı Çağrıları (Yapılandırılabilir)

- Tetikleyiciler: dosya işleme, içerik üretimi, çeviri, araştırma özeti, Mermaid özeti ve bağlantı/tanılama eylemleri.
- Uç nokta: Notemd ayarlarında yapılandırdığınız sağlayıcı Base URL'leri.
- Gönderilen veri: işlem için gereken istem metni ve görev içeriği.
- Veri işleme notu: API anahtarları eklenti ayarlarında yerel olarak yapılandırılır ve cihazınızdan gönderilen istekleri imzalamak için kullanılır.

### Web Araştırma Çağrıları (İsteğe Bağlı)

- Tetikleyici: web araştırması etkin olduğunda ve bir arama sağlayıcısı seçildiğinde.
- Uç nokta: Tavily API veya DuckDuckGo uç noktaları.
- Gönderilen veri: araştırma sorgunuz ve gerekli istek meta verileri.

### Geliştirici Tanılama ve Hata Ayıklama Günlükleri (İsteğe Bağlı)

- Tetikleyici: API hata ayıklama modu ve geliştirici tanılama eylemleri.
- Depolama: tanılama ve hata günlükleri vault köküne yazılır; örneğin `Notemd_Provider_Diagnostic_*.txt` ve `Notemd_Error_Log_*.txt`.
- Risk notu: günlükler istek ve yanıt parçaları içerebilir. Bunları herkese açık paylaşmadan önce içeriğini gözden geçirin.

### Yerel Depolama

- Eklenti yapılandırması `.obsidian/plugins/notemd/data.json` dosyasında saklanır.
- Oluşturulan dosyalar, raporlar ve isteğe bağlı günlükler vault içinde ayarlarınıza göre saklanır.

## Sorun Giderme

### Yaygın Sorunlar
- **Eklenti Yüklenmiyor**: `manifest.json`, `main.js` ve `styles.css` dosyalarının doğru klasörde (`<Vault>/.obsidian/plugins/notemd/`) bulunduğundan emin olun ve Obsidian'ı yeniden başlatın. Açılışta hata olup olmadığını görmek için Developer Console'u (`Ctrl+Shift+I` veya `Cmd+Option+I`) kontrol edin.
- **İşleme Hataları / API Hataları**:
  1. **Dosya Biçimini Kontrol Edin**: İşlemek veya denetlemek istediğiniz dosyanın `.md` ya da `.txt` uzantılı olduğundan emin olun. Notemd şu anda yalnızca bu metin tabanlı biçimleri destekler.
  2. Etkin sağlayıcının ayarlarını doğrulamak için "Test LLM Connection" komutunu veya düğmesini kullanın.
  3. API Key, Base URL, Model Name ve API Version (Azure için) değerlerini tekrar kontrol edin. API anahtarının doğru olduğundan ve yeterli kredi/yetkiye sahip olduğundan emin olun.
  4. Yerel LLM sunucunuzun (LMStudio veya Ollama) çalıştığından ve Base URL'nin doğru olduğundan emin olun; örneğin LMStudio için `http://localhost:1234/v1`.
  5. Bulut sağlayıcıları için internet bağlantınızı kontrol edin.
  6. **Tek dosya işleme hatalarında:** Daha ayrıntılı hata mesajları için Developer Console'u inceleyin. Gerekirse hata modalindeki düğmeyle bunları kopyalayın.
  7. **Toplu işleme hatalarında:** Her başarısız dosya için ayrıntılı hata mesajları içeren `error_processing_filename.log` dosyasını vault kökünde kontrol edin. Developer Console veya hata modali özet bir hata gösterebilir.
  8. **Otomatik Hata Günlükleri:** Bir süreç başarısız olursa eklenti vault köküne `Notemd_Error_Log_[Timestamp].txt` adlı ayrıntılı bir günlük dosyası kaydeder. Bu dosya hata mesajını, yığın izini ve oturum günlüklerini içerir. Kalıcı sorunlarda bu dosyayı inceleyin. Ayarlardan "API Error Debugging Mode" etkinleştirilirse bu günlük çok daha ayrıntılı API yanıt verileri içerir.
  9. **Gerçek Uç Nokta Uzun İstek Tanılaması (Geliştirici)**:
     - Eklenti içi yol (önce önerilen): Etkin sağlayıcı üzerinde runtime probe çalıştırıp vault köküne `Notemd_Provider_Diagnostic_*.txt` üretmek için **Settings -> Notemd -> Developer provider diagnostic (long request)** yolunu kullanın.
     - CLI yolu (Obsidian runtime dışında): Tamponlu ve akışlı davranışı uç nokta seviyesinde karşılaştırmak için şunu kullanın:
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
       Oluşturulan rapor deneme başına zamanlamayı (`First Byte`, `Duration`), temizlenmiş istek meta verisini, yanıt başlıklarını, ham/kısmi gövde parçalarını, ayrıştırılmış akış parçalarını ve taşıma katmanındaki hata noktalarını içerir.
- **LM Studio/Ollama Bağlantı Sorunları**:
  - **Bağlantı testi başarısız**: Yerel sunucunun (LM Studio veya Ollama) çalıştığından ve doğru modelin yüklü/erişilebilir olduğundan emin olun.
  - **CORS Hataları (Windows'ta Ollama)**: Windows'ta Ollama kullanırken CORS (Cross-Origin Resource Sharing) hatası alırsanız `OLLAMA_ORIGINS` ortam değişkenini ayarlamanız gerekebilir. Bunu Ollama'yı başlatmadan önce komut isteminde `set OLLAMA_ORIGINS=*` çalıştırarak yapabilirsiniz. Bu, her kaynaktan gelen isteklere izin verir.
  - **LM Studio'da CORS'u Etkinleştir**: LM Studio için CORS desteğini sunucu ayarlarından doğrudan açabilirsiniz; Obsidian bir tarayıcı içinde çalışıyorsa veya sıkı origin politikalarına sahipse bu gerekebilir.
- **Klasör Oluşturma Hataları ("File name cannot contain...")**:
  - Bu hata genellikle ayarlarda verilen yolun (**Processed File Folder Path** veya **Concept Note Folder Path**) *Obsidian açısından* geçersiz olduğu anlamına gelir.
  - **Göreli yollar kullandığınızdan emin olun**, örneğin `Processed` veya `Notes/Concepts`; **mutlak yollar**, örneğin `C:\Users\...` veya `/Users/...`, kullanmayın.
  - Geçersiz karakterleri kontrol edin: `* " \ / < > : | ? # ^ [ ]`. Obsidian yollarında Windows'ta bile `\` geçersizdir. Yol ayırıcı olarak `/` kullanın.
- **Performans Sorunları**: Büyük dosyaların veya çok sayıda dosyanın işlenmesi zaman alabilir. Daha hızlı ama daha fazla API çağrısı için "Chunk Word Count" ayarını azaltın. Farklı bir LLM sağlayıcısı veya model deneyin.
- **Beklenmeyen Bağlantılama**: Bağlantılama kalitesi büyük ölçüde LLM'e ve isteme bağlıdır. Farklı modeller veya sıcaklık ayarları deneyin.

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır. Yönergeler için GitHub deposuna bakın: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Bakımcı Dokümantasyonu

- [Sürüm İş Akışı (İngilizce)](./docs/maintainer/release-workflow.md)
- [Sürüm İş Akışı (Basitleştirilmiş Çince)](./docs/maintainer/release-workflow.zh-CN.md)

## Lisans

MIT Lisansı - Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - Obsidian bilgi grafiğinizi yapay zeka ile geliştirin.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
