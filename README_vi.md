
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Tiện ích Notemd cho Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Đọc tài liệu bằng các ngôn ngữ khác: [Trung tâm Ngôn ngữ](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Công cụ tăng cường tri thức đa ngôn ngữ
                  hỗ trợ bởi AI
==================================================
```

Cách dễ dàng để tạo cơ sở tri thức của riêng bạn!

Notemd cải thiện quy trình làm việc của bạn trong Obsidian bằng cách tích hợp với nhiều Mô hình Ngôn ngữ Lớn (LLM) khác nhau để xử lý các ghi chú đa ngôn ngữ, tự động tạo wiki-link cho các khái niệm chính, tạo ghi chú khái niệm tương ứng, thực hiện nghiên cứu web và giúp bạn xây dựng biểu đồ tri thức mạnh mẽ.

**Phiên bản:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Mục lục
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Hỗ trợ ngôn ngữ](#hỗ-trợ-ngôn-ngữ)
- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Các nhà cung cấp LLM được hỗ trợ](#các-nhà-cung-cấp-llm-được-hỗ-trợ)
- [Sử dụng mạng và xử lý dữ liệu](#sử-dụng-mạng-và-xử-lý-dữ-liệu)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Đóng góp](#đóng-góp)
- [Tài liệu cho người bảo trì](#tài-liệu-cho-người-bảo-trì)
- [Giấy phép](#giấy-phép)

## Bắt đầu nhanh

1.  **Cài đặt & Bật**: Tải tiện ích từ cửa hàng cộng đồng Obsidian.
2.  **Cấu hình LLM**: Đi tới `Cài đặt -> Notemd`, chọn nhà cung cấp LLM (như OpenAI hoặc nhà cung cấp cục bộ như Ollama) và nhập khóa API/URL.
3.  **Mở thanh bên**: Nhấp vào biểu tượng đũa thần Notemd ở thanh công cụ bên trái để mở thanh bên.
4.  **Xử lý ghi chú**: Mở bất kỳ ghi chú nào và nhấp vào **"Xử lý tệp (Thêm liên kết)"** trong thanh bên để tự động thêm `[[wiki-links]]` cho các khái niệm chính.
5.  **Chạy quy trình nhanh**: Sử dụng nút mặc định **"One-Click Extract"** để thực hiện chuỗi xử lý, tạo hàng loạt và sửa lỗi Mermaid chỉ trong một bước.

Xong! Khám phá thêm các cài đặt để mở khóa các tính năng như nghiên cứu web, dịch thuật và tạo nội dung.

## Hỗ trợ ngôn ngữ

### Quy ước hành vi ngôn ngữ

| Khía cạnh | Phạm vi | Mặc định | Ghi chú |
|---|---|---|---|
| `UI Locale` | Chỉ văn bản giao diện tiện ích | `auto` | Theo ngôn ngữ của Obsidian; hiện có: `en`, `zh-CN`, `zh-TW`. |
| `Ngôn ngữ đầu ra` | Kết quả tạo bởi LLM (liên kết, tóm tắt) | `en` | Có thể là chung hoặc theo từng tác vụ. |
| `Tắt dịch tự động` | Các tác vụ không phải dịch sẽ giữ nguyên ngữ cảnh gốc | `false` | Các tác vụ `Dịch` rõ ràng vẫn thực thi theo ngôn ngữ mục tiêu. |

- Tài liệu chính thức được duy trì bằng tiếng Anh và tiếng Trung giản thể, hỗ trợ đầy đủ cho hơn 30 ngôn ngữ.
- Tất cả các ngôn ngữ được hỗ trợ đều được liên kết ở phần đầu trang.

## Các tính năng chính

### Xử lý tài liệu bằng AI
- **Hỗ trợ đa LLM**: Kết nối với nhiều nhà cung cấp LLM đám mây và cục bộ.
- **Chia nhỏ thông minh**: Tự động chia các tài liệu lớn thành các phần nhỏ dễ quản lý.
- **Giữ nguyên nội dung**: Duy trì định dạng gốc trong khi thêm cấu trúc và liên kết.
- **Logic thử lại**: Tự động thử lại tùy chọn khi cuộc gọi API thất bại.
- **Cài đặt sẵn cho Trung Quốc**: Bao gồm các nhà cung cấp như `Qwen`, `Doubao`, `Moonshot`, v.v.

### Tăng cường biểu đồ tri thức
- **Liên kết Wiki tự động**: Xác định và thêm wiki-link cho các khái niệm cốt lõi.
- **Tạo ghi chú khái niệm**: Tự động tạo ghi chú mới cho các khái niệm được phát hiện.

### Dịch thuật
- **Dịch thuật bằng AI**: Dịch nội dung ghi chú bằng LLM đã cấu hình.
- **Dịch hàng loạt**: Dịch tất cả các tệp trong một thư mục đã chọn.

### Nghiên cứu Web và tạo nội dung
- **Nghiên cứu Web**: Tìm kiếm qua Tavily hoặc DuckDuckGo và tóm tắt kết quả.
- **Tạo từ tiêu đề**: Sử dụng tiêu đề ghi chú để tạo nội dung ban đầu.
- **Tự động sửa Mermaid**: Tự động sửa cú pháp của các biểu đồ Mermaid được tạo ra.

## Cài đặt
1. Mở Obsidian **Cài đặt** → **Tiện ích cộng đồng**.
2. Đảm bảo đã tắt "Chế độ hạn chế".
3. Nhấp vào **Duyệt** và tìm kiếm "Notemd".
4. Nhấp vào **Cài đặt** và sau đó chọn **Bật**.

## Giấy phép
Giấy phép MIT - Xem tệp [LICENSE](LICENSE) để biết chi tiết.

---
*Notemd v1.8.0 - Tăng cường biểu đồ tri thức Obsidian của bạn với AI.*
