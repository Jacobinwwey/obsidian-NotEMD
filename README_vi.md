![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Tiện ích Notemd cho Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Đọc tài liệu bằng nhiều ngôn ngữ hơn tại: [Trung tâm ngôn ngữ](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Tăng cường cơ sở tri thức đa ngôn ngữ bằng AI
==================================================
```

Một cách dễ dàng để xây dựng cơ sở tri thức của riêng bạn.

Notemd nâng cấp quy trình làm việc trong Obsidian bằng cách tích hợp với nhiều Mô hình Ngôn ngữ Lớn, LLM, để xử lý ghi chú đa ngôn ngữ, tự động tạo wiki-link cho các khái niệm chính, tạo concept note tương ứng, thực hiện nghiên cứu web và giúp bạn xây dựng knowledge graph mạnh mẽ cùng nhiều khả năng khác.

**Phiên bản:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Mục lục

- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Hỗ trợ ngôn ngữ](#hỗ-trợ-ngôn-ngữ)
- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Nhà cung cấp LLM được hỗ trợ](#nhà-cung-cấp-llm-được-hỗ-trợ)
- [Sử dụng mạng và xử lý dữ liệu](#sử-dụng-mạng-và-xử-lý-dữ-liệu)
- [Khắc phục sự cố](#khắc-phục-sự-cố)
- [Đóng góp](#đóng-góp)
- [Tài liệu dành cho người bảo trì](#tài-liệu-dành-cho-người-bảo-trì)
- [Giấy phép](#giấy-phép)

## Bắt đầu nhanh

1. **Cài đặt và bật**: lấy tiện ích từ Obsidian Marketplace.
2. **Cấu hình LLM**: vào `Settings -> Notemd`, chọn nhà cung cấp LLM bạn muốn dùng, như OpenAI hoặc nhà cung cấp cục bộ như Ollama, rồi nhập API key hoặc URL.
3. **Mở sidebar**: nhấp vào biểu tượng cây đũa thần Notemd trên ribbon bên trái để mở sidebar.
4. **Xử lý một ghi chú**: mở bất kỳ ghi chú nào rồi nhấp **"Process File (Add Links)"** trong sidebar để tự động thêm `[[wiki-links]]` vào các khái niệm chính.
5. **Chạy một quick workflow**: dùng nút mặc định **"One-Click Extract"** để nối chuỗi xử lý, tạo nội dung hàng loạt và dọn Mermaid chỉ từ một điểm vào.

Vậy là xong. Hãy khám phá phần settings để mở khóa thêm các tính năng như nghiên cứu web, dịch thuật và tạo nội dung.

## Hỗ trợ ngôn ngữ

### Hợp đồng hành vi ngôn ngữ

| Mối quan tâm | Phạm vi | Mặc định | Ghi chú |
|---|---|---|---|
| `Ngôn ngữ giao diện` | Chỉ văn bản giao diện của tiện ích, gồm cài đặt, thanh bên, thông báo và hộp thoại | `auto` | Đi theo locale của Obsidian; các UI catalog hiện có là `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Ngôn ngữ đầu ra tác vụ` | Đầu ra tác vụ do LLM tạo ra, gồm liên kết, tóm tắt, tạo nội dung, trích xuất và ngôn ngữ đích khi dịch | `en` | Có thể dùng chung hoặc theo từng tác vụ khi bật `Dùng các ngôn ngữ khác nhau cho từng tác vụ`. |
| `Tắt dịch tự động` | Các tác vụ không phải Translate giữ nguyên ngữ cảnh ngôn ngữ nguồn | `false` | Các tác vụ `Translate` rõ ràng vẫn áp dụng bắt buộc ngôn ngữ đích đã cấu hình. |
| Locale dự phòng | Giải quyết các khóa UI bị thiếu | locale -> `en` | Giữ UI ổn định khi vẫn còn khóa chưa được dịch. |

- Tài liệu nguồn được duy trì là tiếng Anh và tiếng Trung giản thể, và các bản dịch README đã xuất bản được liên kết ở phần đầu trang phía trên.
- Phạm vi hỗ trợ UI locale trong ứng dụng hiện khớp chính xác với danh mục tường minh trong mã: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Fallback tiếng Anh vẫn là lưới an toàn ở tầng triển khai, nhưng các bề mặt hiển thị được hỗ trợ đã được bao phủ bằng regression tests và không nên âm thầm quay về tiếng Anh trong sử dụng bình thường.
- Thông tin chi tiết hơn và hướng dẫn đóng góp được theo dõi trong [Trung tâm ngôn ngữ](./docs/i18n/README.md).

## Tính năng

### Xử lý tài liệu bằng AI
- **Hỗ trợ Multi-LLM**: kết nối tới nhiều nhà cung cấp LLM trên đám mây và cục bộ. Xem [Nhà cung cấp LLM được hỗ trợ](#nhà-cung-cấp-llm-được-hỗ-trợ).
- **Chia nhỏ thông minh**: tự động chia các tài liệu lớn thành các phần dễ xử lý theo số từ.
- **Giữ nguyên nội dung**: cố gắng giữ nguyên định dạng gốc trong khi thêm cấu trúc và liên kết.
- **Theo dõi tiến độ**: cập nhật theo thời gian thực qua Notemd Sidebar hoặc progress modal.
- **Thao tác có thể hủy**: hủy mọi tác vụ xử lý, đơn lẻ hoặc hàng loạt, được khởi chạy từ sidebar bằng nút cancel riêng. Các thao tác từ bảng lệnh dùng modal cũng có thể bị hủy.
- **Cấu hình nhiều mô hình**: dùng các nhà cung cấp LLM khác nhau và các model cụ thể cho từng tác vụ như Add Links, Research, Generate Title và Translate, hoặc dùng một nhà cung cấp cho tất cả.
- **Stable API Calls (Retry Logic)**: tùy chọn bật retry tự động cho các cuộc gọi LLM API thất bại với khoảng cách và số lần thử có thể cấu hình.
- **Kiểm tra kết nối nhà cung cấp bền bỉ hơn**: nếu lần kiểm tra đầu tiên gặp ngắt kết nối mạng tạm thời, Notemd sẽ rơi về chuỗi retry ổn định trước khi báo lỗi cuối cùng. Điều này bao phủ các đường truyền OpenAI-compatible, Anthropic, Google, Azure OpenAI và Ollama.
- **Fallback transport theo môi trường runtime**: khi một yêu cầu dài tới nhà cung cấp bị `requestUrl` làm rớt do lỗi mạng tạm thời như `ERR_CONNECTION_CLOSED`, Notemd sẽ thử lại chính attempt đó qua fallback transport theo môi trường trước khi đi vào vòng lặp retry đã cấu hình. Bản desktop dùng Node `http/https`, còn môi trường non-desktop dùng `fetch` của trình duyệt. Điều này giúp giảm false failure trên gateway chậm và reverse proxy.
- **Gia cố chuỗi long request ổn định cho OpenAI-Compatible**: trong stable mode, các lời gọi OpenAI-compatible hiện dùng thứ tự 3 bước rõ ràng cho mỗi attempt: direct streaming transport chính, sau đó direct non-stream transport, rồi đến `requestUrl` fallback, và vẫn có thể nâng lên streamed parsing nếu cần. Cách này giảm false negative khi nhà cung cấp hoàn tất buffered response nhưng đường ống streaming không ổn định.
- **Fallback streaming nhận biết giao thức trên toàn bộ LLM API**: các fallback attempt chạy lâu giờ chuyển sang streamed parsing có nhận biết giao thức trên mọi đường LLM tích hợp sẵn, không chỉ các endpoint OpenAI-compatible. Notemd hiện xử lý OpenAI/Azure-style SSE, Anthropic Messages streaming, phản hồi Google Gemini SSE và Ollama NDJSON trên cả `http/https` desktop lẫn `fetch` non-desktop, còn các entrypoint direct OpenAI-style khác cũng tái sử dụng cùng shared fallback path này.
- **Preset sẵn sàng cho các nhà cung cấp Trung Quốc**: preset tích hợp hiện bao phủ `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` và `SiliconFlow`, ngoài các nhà cung cấp toàn cầu và cục bộ có sẵn.
- **Xử lý hàng loạt đáng tin cậy**: cải thiện logic xử lý đồng thời bằng **các lệnh gọi API giãn cách** để tránh lỗi rate-limiting và đảm bảo hiệu năng ổn định khi chạy batch job lớn. Cách triển khai mới đảm bảo các tác vụ được khởi tạo theo các khoảng thời gian khác nhau thay vì đồng loạt.
- **Báo cáo tiến độ chính xác**: đã sửa lỗi khiến progress bar có thể bị kẹt, bảo đảm UI luôn phản ánh đúng trạng thái thực của tác vụ.
- **Xử lý batch song song vững chắc hơn**: đã giải quyết lỗi khiến các thao tác batch song song dừng sớm, giúp mọi file được xử lý đáng tin cậy và hiệu quả.
- **Độ chính xác của progress bar**: đã sửa lỗi khiến progress bar của lệnh "Create Wiki-Link & Generate Note" bị dừng ở 95%, và giờ sẽ hiển thị đúng 100% khi hoàn tất.
- **Gỡ lỗi API nâng cao**: "API Error Debugging Mode" hiện thu thập full response body từ nhà cung cấp LLM và các dịch vụ tìm kiếm như Tavily hoặc DuckDuckGo, đồng thời ghi lại transport timeline cho từng attempt với request URL đã được làm sạch, thời lượng, response headers, partial response body, nội dung stream đã parse một phần và dấu vết ngăn xếp để hỗ trợ tốt hơn cho việc khắc phục sự cố trên các đường OpenAI-compatible, Anthropic, Google, Azure OpenAI và Ollama.
- **Bảng Developer Mode**: settings hiện có một bảng chẩn đoán dành riêng cho developer, chỉ hiển thị khi bật "Developer mode". Bảng này hỗ trợ chọn diagnostic call path và chạy lặp stability probe cho chế độ đã chọn.
- **Sidebar được thiết kế lại**: các hành động tích hợp được nhóm thành các section tập trung hơn, với nhãn rõ ràng hơn, live status, tiến độ có thể hủy và log có thể sao chép để giảm sự lộn xộn trên sidebar. Phần chân progress hoặc log giờ vẫn hiển thị kể cả khi mọi section được mở rộng, và trạng thái sẵn sàng dùng standby progress track rõ ràng hơn.
- **Tối ưu tương tác và khả năng đọc của sidebar**: các nút trong sidebar nay có phản hồi hover, press và focus rõ ràng hơn, còn các nút CTA nhiều màu, gồm `One-Click Extract` và `Batch generate from titles`, có độ tương phản văn bản mạnh hơn để dễ đọc trên nhiều theme.
- **Ánh xạ CTA chỉ cho hành động trên một file**: kiểu CTA nhiều màu giờ chỉ dành cho các hành động single-file. Các hành động ở mức batch hoặc folder và các workflow pha trộn dùng kiểu không-CTA để giảm nhầm lẫn về phạm vi thao tác.
- **Workflow one-click tùy chỉnh**: biến các công cụ sidebar tích hợp sẵn thành các nút tùy chỉnh có thể tái sử dụng với tên gọi riêng và chuỗi hành động riêng. Workflow mặc định `One-Click Extract` có sẵn ngay sau khi cài đặt.

### Mở rộng đồ thị tri thức
- **Tự động tạo wiki-link**: xác định các khái niệm quan trọng và thêm `[[wiki-links]]` vào các ghi chú đã xử lý dựa trên đầu ra của LLM.
- **Tạo concept note, tùy chọn và có thể cấu hình**: tự động tạo các ghi chú mới cho những khái niệm được phát hiện trong thư mục vault đã chỉ định.
- **Đường dẫn đầu ra có thể cấu hình**: thiết lập các đường dẫn tương đối riêng biệt trong vault để lưu file đã xử lý và concept note mới được tạo.
- **Tên file đầu ra có thể cấu hình cho Add Links**: bạn có thể tùy chọn **ghi đè file gốc** hoặc dùng suffix hay replacement string tùy chỉnh thay cho `_processed.md` mặc định khi xử lý file để thêm liên kết.
- **Duy trì tính toàn vẹn liên kết**: hỗ trợ cơ bản cho việc cập nhật liên kết khi ghi chú được đổi hoặc xóa khỏi vault.
- **Trích xuất khái niệm thuần túy**: trích xuất khái niệm và tạo concept note tương ứng mà *không* sửa tài liệu nguồn. Đây là cách hay để xây dựng cơ sở tri thức từ các tài liệu sẵn có mà không thay đổi chúng. Tính năng này có các tùy chọn có thể cấu hình cho concept note tối giản và backlink.

### Dịch thuật

- **Dịch thuật bằng AI**:
  - Dịch nội dung ghi chú bằng LLM đã cấu hình.
  - **Hỗ trợ file lớn**: file lớn được tự động chia thành nhiều phần nhỏ hơn theo tham số `Chunk word count` trước khi gửi tới LLM. Sau đó các đoạn đã dịch được ghép lại mượt mà thành một tài liệu duy nhất.
  - Hỗ trợ dịch giữa nhiều ngôn ngữ.
  - Có thể cấu hình ngôn ngữ đích trong settings hoặc trong UI.
  - Tự động mở nội dung đã dịch ở panel bên phải nội dung gốc để đọc và so sánh thuận tiện hơn.
- **Dịch hàng loạt**:
  - Dịch tất cả file trong thư mục đã chọn.
  - Hỗ trợ xử lý song song khi bật "Enable Batch Parallelism".
  - Dùng custom prompt cho dịch thuật nếu bạn đã cấu hình.
  - Thêm mục "Batch translate this folder" vào menu chuột phải trong file explorer.
- **Tắt dịch tự động**: khi tùy chọn này được bật, các tác vụ không phải Translate sẽ không còn ép đầu ra sang một ngôn ngữ cụ thể nữa và sẽ giữ nguyên ngữ cảnh ngôn ngữ nguồn. Tác vụ "Translate" rõ ràng vẫn dịch theo cấu hình đã thiết lập.

### Nghiên cứu web và tạo nội dung
- **Nghiên cứu web và tóm tắt**:
  - Thực hiện tìm kiếm web bằng Tavily, cần API key, hoặc DuckDuckGo, ở trạng thái thực nghiệm.
  - **Tăng độ bền của tìm kiếm**: tìm kiếm DuckDuckGo giờ dùng logic parsing được cải thiện, `DOMParser` kèm Regex fallback, để xử lý khi bố cục thay đổi và giữ kết quả đáng tin cậy.
  - Tóm tắt kết quả tìm kiếm bằng LLM đã cấu hình.
  - Có thể tùy chỉnh ngôn ngữ đầu ra của bản tóm tắt trong settings.
  - Nối phần tóm tắt vào ghi chú hiện tại.
  - Có thể cấu hình giới hạn token cho research content gửi tới LLM.
- **Tạo nội dung từ tiêu đề**:
  - Dùng tiêu đề ghi chú để tạo nội dung ban đầu qua LLM, thay thế nội dung đang có.
  - **Tùy chọn nghiên cứu**: cấu hình có thực hiện web research bằng nhà cung cấp đã chọn để cung cấp ngữ cảnh cho việc tạo nội dung hay không.
- **Tạo nội dung hàng loạt từ tiêu đề**: tạo nội dung cho mọi ghi chú trong một thư mục được chọn dựa trên tiêu đề của chúng, đồng thời tôn trọng thiết lập nghiên cứu tùy chọn. Các file xử lý thành công được chuyển vào **subfolder "complete" có thể cấu hình**, ví dụ `[foldername]_complete` hoặc tên tùy chỉnh, để tránh xử lý lại.
- **Ghép với Mermaid auto-fix**: khi Mermaid auto-fix được bật, các luồng liên quan đến Mermaid sẽ tự động sửa file tạo ra hoặc thư mục đầu ra sau khi xử lý. Điều này bao phủ Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid và Translate.

### Tính năng tiện ích
- **Tóm tắt thành sơ đồ Mermaid**:
  - Tính năng này cho phép bạn tóm tắt nội dung của một ghi chú thành Mermaid diagram.
  - Có thể tùy chỉnh ngôn ngữ đầu ra của Mermaid diagram trong settings.
  - **Mermaid Output Folder**: cấu hình thư mục nơi các file Mermaid diagram được tạo sẽ được lưu.
  - **Translate Summarize to Mermaid Output**: tùy chọn dịch nội dung Mermaid được tạo sang ngôn ngữ đích đã cấu hình.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Sửa nhanh định dạng công thức đơn giản**:
  - Sửa nhanh các công thức toán một dòng được bao bởi một dấu `$` thành khối chuẩn `$$`.
  - **Single File**: xử lý file hiện tại qua nút sidebar hoặc bảng lệnh.
  - **Batch Fix**: xử lý tất cả file trong thư mục đã chọn qua nút sidebar hoặc bảng lệnh.

- **Check for Duplicates in Current File**: lệnh này giúp xác định các thuật ngữ có khả năng trùng lặp trong file đang hoạt động.
- **Duplicate Detection**: kiểm tra cơ bản các từ trùng lặp trong nội dung của file hiện đang được xử lý, kết quả được ghi vào console.
- **Check and Remove Duplicate Concept Notes**: xác định các ghi chú có khả năng trùng lặp trong **Concept Note Folder** đã cấu hình dựa trên trùng tên tuyệt đối, dạng số nhiều, chuẩn hóa và chứa một từ đơn khi so với các ghi chú bên ngoài thư mục đó. Phạm vi so sánh, tức các ghi chú bên ngoài concept folder nào sẽ được kiểm tra, có thể cấu hình là **toàn bộ vault**, **chỉ các thư mục được chỉ định để bao gồm** hoặc **mọi thư mục ngoại trừ các thư mục bị loại trừ**. Tính năng sẽ hiển thị danh sách chi tiết với lý do và file xung đột, sau đó yêu cầu xác nhận trước khi chuyển các bản sao trùng lặp được xác định vào system trash. Nó cũng hiển thị tiến độ trong khi xóa.
- **Batch Mermaid Fix**: áp dụng chỉnh sửa cú pháp Mermaid và LaTeX cho tất cả Markdown file trong thư mục do người dùng chọn.
  - **Sẵn sàng cho workflow**: có thể dùng như một tiện ích độc lập hoặc như một bước bên trong custom one-click workflow button.
  - **Báo lỗi**: tạo báo cáo `mermaid_error_{foldername}.md` liệt kê các file vẫn còn lỗi Mermaid tiềm ẩn sau khi xử lý.
  - **Di chuyển file lỗi**: tùy chọn chuyển các file có lỗi được phát hiện sang một thư mục riêng để review thủ công.
  - **Phát hiện thông minh**: giờ kiểm tra file bằng `mermaid.parse` để tìm syntax error trước khi cố sửa, giúp tiết kiệm thời gian xử lý và tránh chỉnh sửa không cần thiết.
  - **Xử lý an toàn**: đảm bảo các sửa đổi cú pháp chỉ được áp dụng cho Mermaid code block, tránh vô tình sửa bảng Markdown hoặc các nội dung khác. Đồng thời có các cơ chế bảo vệ chắc chắn để giữ an toàn cho table syntax như `| :--- |` khỏi các sửa chữa debug quá mạnh.
  - **Deep Debug Mode**: nếu lỗi vẫn còn sau lần sửa đầu tiên, một chế độ deep debug nâng cao sẽ được kích hoạt. Chế độ này xử lý nhiều edge case phức tạp, bao gồm:
    - **Comment Integration**: tự động trộn các comment ở cuối dòng, bắt đầu bằng `%`, vào edge label, ví dụ `A -- Label --> B; % Comment` trở thành `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: sửa các mũi tên bị nuốt vào trong dấu nháy, ví dụ `A -- "Label -->" B` thành `A -- "Label" --> B`.
    - **Inline Subgraphs**: chuyển inline subgraph labels thành edge labels.
    - **Reverse Arrow Fix**: sửa mũi tên không chuẩn `X <-- Y` thành `Y --> X`.
    - **Direction Keyword Fix**: đảm bảo từ khóa `direction` viết thường bên trong subgraph, ví dụ `Direction TB` -> `direction TB`.
    - **Comment Conversion**: chuyển comment `//` thành edge labels, ví dụ `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: đơn giản hóa các bracketed label lặp, ví dụ `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: đổi cú pháp mũi tên không hợp lệ `--|>` sang `-->` chuẩn.
    - **Xử lý label và ghi chú mạnh hơn**: cải thiện việc xử lý các label có ký tự đặc biệt như `/` và hỗ trợ tốt hơn cho cú pháp ghi chú tùy chỉnh như `note for ...`, đồng thời dọn sạch các phần thừa như dấu ngoặc đóng ở cuối.
    - **Advanced Fix Mode**: bao gồm các sửa lỗi chắc chắn cho node label không có dấu nháy nhưng chứa khoảng trắng, ký tự đặc biệt hoặc ngoặc lồng nhau, ví dụ `Node[Label [Text]]` -> `Node["Label [Text]"]`, nhằm bảo đảm tương thích với các biểu đồ phức tạp như đường tiến hóa sao. Nó cũng sửa malformed edge label, ví dụ `--["Label["-->` thành `-- "Label" -->`. Ngoài ra còn chuyển inline comment như `Consensus --> Adaptive; # Some advanced consensus` thành `Consensus -- "Some advanced consensus" --> Adaptive`, đồng thời sửa dấu nháy chưa đóng ở cuối dòng, thay phần cuối `;"` thành `"]`.
    - **Note Conversion**: tự động chuyển `note right/left of` và comment đơn lẻ `note :` thành định nghĩa node Mermaid chuẩn và liên kết, ví dụ `note right of A: text` sẽ thành `NoteA["Note: text"]` được nối với `A`, giúp tránh syntax error và cải thiện bố cục. Hiện hỗ trợ cả arrow link (`-->`) và solid link (`---`).
    - **Extended Note Support**: tự động chuyển `note for Node "Content"` và `note of Node "Content"` thành note node liên kết chuẩn, ví dụ `NoteNode[" Content"]` liên kết với `Node`, đảm bảo tương thích với cú pháp mở rộng do người dùng thêm vào.
    - **Enhanced Note Correction**: tự động đổi tên ghi chú theo thứ tự, ví dụ `Note1`, `Note2`, để tránh vấn đề alias khi có nhiều ghi chú cùng lúc.
    - **Parallelogram/Shape Fix**: sửa các hình node sai định dạng như `[/["Label["/]` về dạng chuẩn `["Label"]`, giúp tương thích với nội dung được tạo.
    - **Standardize Pipe Labels**: tự động sửa và chuẩn hóa edge labels chứa dấu pipe, bảo đảm chúng được đặt trong dấu nháy đúng cách, ví dụ `-->|Text|` thành `-->|"Text"|` và `-->|Math|^2|` thành `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: sửa edge labels bị đặt sai chỗ ở trước mũi tên, ví dụ `>|"Label"| A --> B` trở thành `A -->|"Label"| B`.
    - **Merge Double Labels**: phát hiện và gộp các edge có hai label phức tạp, ví dụ `A -- Label1 -- Label2 --> B` hoặc `A -- Label1 -- Label2 --- B`, thành một label sạch duy nhất có xuống dòng, `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: tự động thêm dấu nháy cho node label chứa ký tự dễ gây lỗi như dấu nháy, dấu bằng hoặc toán tử toán học nhưng thiếu dấu nháy ngoài, ví dụ `Plot[Plot "A"]` thành `Plot["Plot "A""]`, để ngăn render error.
    - **Intermediate Node Fix**: tách các edge chứa định nghĩa intermediate node thành hai edge riêng, ví dụ `A -- B[...] --> C` thành `A --> B[...]` và `B[...] --> C`, bảo đảm Mermaid syntax hợp lệ.
    - **Concatenated Label Fix**: sửa một cách chắc chắn các định nghĩa node mà ID dính liền với label, ví dụ `SubdivideSubdivide...` thành `Subdivide["Subdivide..."]`, kể cả khi phía trước có pipe labels hoặc phần lặp không hoàn toàn giống hệt, bằng cách đối chiếu với danh sách node ID đã biết.
- **Extract Specific Original Text**:
  - Xác định danh sách câu hỏi trong settings.
  - Trích xuất các đoạn văn bản nguyên văn từ ghi chú đang hoạt động để trả lời các câu hỏi đó.
  - **Merged Query Mode**: tùy chọn xử lý tất cả câu hỏi trong một API call để tăng hiệu quả.
  - **Translation**: tùy chọn kèm theo bản dịch của phần văn bản được trích xuất trong đầu ra.
  - **Custom Output**: đường dẫn lưu và suffix tên file cho file văn bản trích xuất có thể cấu hình.
- **LLM Connection Test**: xác minh API settings cho nhà cung cấp đang hoạt động.

## Cài đặt

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Từ Obsidian Marketplace (khuyến nghị)
1. Mở **Settings** -> **Community plugins** trong Obsidian.
2. Đảm bảo "Restricted mode" đang **tắt**.
3. Nhấp **Browse** community plugins và tìm "Notemd".
4. Nhấp **Install**.
5. Sau khi cài xong, nhấp **Enable**.

### Cài đặt thủ công
1. Tải các release asset mới nhất từ [trang GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Mỗi release cũng có `README.md` để tham khảo trong gói, nhưng cài đặt thủ công chỉ cần `main.js`, `styles.css` và `manifest.json`.
2. Đi tới thư mục cấu hình của Obsidian vault: `<YourVault>/.obsidian/plugins/`.
3. Tạo một thư mục mới tên là `notemd`.
4. Sao chép `main.js`, `styles.css` và `manifest.json` vào thư mục `notemd`.
5. Khởi động lại Obsidian.
6. Vào **Settings** -> **Community plugins** và bật "Notemd".

## Cấu hình

Truy cập settings của tiện ích qua:
**Settings** -> **Community Plugins** -> **Notemd** (nhấp biểu tượng bánh răng).

### Cấu hình nhà cung cấp LLM
1. **Nhà cung cấp đang hoạt động**: chọn nhà cung cấp LLM bạn muốn dùng từ menu thả xuống.
2. **Cài đặt nhà cung cấp**: cấu hình các mục cụ thể cho nhà cung cấp đã chọn:
   - **API Key**: bắt buộc với hầu hết nhà cung cấp đám mây, ví dụ OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks và Requesty. Không cần cho Ollama. Tùy chọn đối với LM Studio và preset chung `OpenAI Compatible` khi endpoint của bạn chấp nhận truy cập ẩn danh hoặc placeholder.
   - **Base URL / Endpoint**: API endpoint của dịch vụ. Đã có giá trị mặc định, nhưng bạn có thể cần đổi giá trị này cho model cục bộ như LMStudio và Ollama, các gateway như OpenRouter, Requesty và OpenAI Compatible, hoặc các Azure deployment cụ thể. **Bắt buộc đối với Azure OpenAI.**
   - **Model**: tên hoặc ID model cụ thể cần dùng, ví dụ `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` hoặc `anthropic/claude-3-7-sonnet-latest`. Hãy chắc chắn model này có sẵn tại endpoint hoặc nhà cung cấp của bạn.
   - **Temperature**: điều khiển độ ngẫu nhiên trong đầu ra của LLM, 0 = quyết định, 1 = sáng tạo tối đa. Giá trị thấp hơn, ví dụ 0.2-0.5, thường tốt hơn cho các tác vụ có cấu trúc.
   - **API Version (Azure Only)**: bắt buộc cho Azure OpenAI deployment, ví dụ `2024-02-15-preview`.
3. **Kiểm tra kết nối**: dùng nút "Kiểm tra kết nối" cho nhà cung cấp đang hoạt động để xác minh cấu hình của bạn. Các nhà cung cấp OpenAI-compatible hiện dùng kiểm tra nhận biết nhà cung cấp: các endpoint như `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` và `OpenAI Compatible` sẽ probe `chat/completions` trực tiếp, còn các nhà cung cấp có `/models` endpoint đáng tin cậy vẫn có thể dùng danh sách model trước. Nếu lần probe đầu tiên thất bại do ngắt mạng tạm thời như `ERR_CONNECTION_CLOSED`, Notemd sẽ tự động rơi về chuỗi retry ổn định thay vì báo lỗi ngay lập tức.
4. **Quản lý cấu hình nhà cung cấp**: dùng các nút "Xuất nhà cung cấp" và "Nhập nhà cung cấp" để lưu hoặc nạp cấu hình nhà cung cấp LLM vào hoặc từ file `notemd-providers.json` trong thư mục cấu hình của tiện ích. Điều này giúp sao lưu và chia sẻ dễ dàng hơn.
5. **Phạm vi preset**: ngoài các nhà cung cấp gốc, Notemd hiện còn bao gồm các preset cho `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` và một mục tiêu `OpenAI Compatible` chung dành cho LiteLLM, vLLM, Perplexity, Vercel AI Gateway hoặc proxy tùy chỉnh.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Cấu hình đa mô hình
- **Sử dụng các nhà cung cấp khác nhau cho từng tác vụ**:
  - **Tắt (mặc định)**: dùng một "Nhà cung cấp đang hoạt động" duy nhất được chọn ở trên cho mọi tác vụ.
  - **Bật**: cho phép bạn chọn một nhà cung cấp cụ thể và tùy chọn override tên model cho từng tác vụ, như "Add Links", "Research & Summarize", "Generate from Title", "Translate" và "Extract Concepts". Nếu trường override model cho một tác vụ để trống, tiện ích sẽ dùng model mặc định đã cấu hình cho nhà cung cấp được chọn của tác vụ đó.
- **Chọn các ngôn ngữ khác nhau cho từng tác vụ**:
  - **Tắt (mặc định)**: dùng một ngôn ngữ đầu ra duy nhất cho mọi tác vụ.
  - **Bật**: cho phép bạn chọn một ngôn ngữ cụ thể cho từng tác vụ, như "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" và "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Kiến trúc ngôn ngữ (Ngôn ngữ giao diện và ngôn ngữ đầu ra tác vụ)

- **Ngôn ngữ giao diện** chỉ điều khiển văn bản giao diện của tiện ích, như nhãn cài đặt, nút thanh bên, thông báo và hộp thoại. Chế độ mặc định `auto` đi theo ngôn ngữ UI hiện tại của Obsidian.
- **Ngôn ngữ đầu ra tác vụ** điều khiển đầu ra tác vụ do model tạo ra, như liên kết, bản tóm tắt, tạo tiêu đề, tóm tắt Mermaid, trích xuất khái niệm và ngôn ngữ đích khi dịch.
- **Chế độ ngôn ngữ theo tác vụ** cho phép mỗi tác vụ tự quyết định ngôn ngữ đầu ra từ một lớp chính sách thống nhất thay vì các ghi đè rải rác theo từng module.
- **Tắt dịch tự động** giữ các tác vụ không phải Translate trong ngữ cảnh ngôn ngữ nguồn, còn các tác vụ Translate rõ ràng vẫn áp dụng ngôn ngữ đích đã cấu hình.
- Các đường sinh nội dung liên quan tới Mermaid cũng đi theo cùng chính sách ngôn ngữ và vẫn có thể kích hoạt Mermaid tự sửa khi được bật.

### Cài đặt cuộc gọi API ổn định
- **Bật các lệnh gọi API ổn định (logic thử lại)**:
  - **Tắt (mặc định)**: một lỗi API call duy nhất sẽ dừng tác vụ hiện tại.
  - **Bật**: tự động retry các LLM API call thất bại, hữu ích cho lỗi mạng chập chờn hoặc rate limit.
  - **Connection Test Fallback**: ngay cả khi các lời gọi thông thường chưa chạy sẵn trong stable mode, các bài test kết nối nhà cung cấp giờ cũng chuyển sang cùng chuỗi retry đó sau lỗi mạng tạm thời đầu tiên.
  - **Runtime Transport Fallback (Environment-Aware)**: các long-running task request bị `requestUrl` làm rớt tạm thời giờ sẽ thử lại chính attempt đó trước qua một fallback nhận biết môi trường. Bản desktop dùng Node `http/https`, môi trường non-desktop dùng `fetch` của trình duyệt. Các fallback attempt này giờ dùng protocol-aware streaming parsing trên các đường LLM tích hợp sẵn, bao phủ OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE và đầu ra Ollama NDJSON, nhờ đó các gateway chậm có thể trả body chunk sớm hơn. Các direct OpenAI-style provider entrypoint còn lại cũng tái sử dụng cùng shared fallback path đó.
  - **OpenAI-Compatible Stable Order**: trong stable mode, mỗi OpenAI-compatible attempt giờ sẽ đi theo thứ tự `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` trước khi bị tính là thất bại. Điều này ngăn các lỗi quá hung hăng khi chỉ có một transport mode bị chập chờn.
- **Retry Interval (seconds)**: chỉ hiển thị khi đã bật. Thời gian chờ giữa các lần retry, từ 1 đến 300 giây. Mặc định: 5.
- **Maximum Retries**: chỉ hiển thị khi đã bật. Số lần retry tối đa, từ 0 đến 10. Mặc định: 3.
- **Chế độ gỡ lỗi lỗi API**:
  - **Tắt (mặc định)**: dùng kiểu báo lỗi tiêu chuẩn và gọn.
  - **Bật**: kích hoạt error logging chi tiết, tương tự verbose output của DeepSeek, cho mọi nhà cung cấp và tác vụ, gồm Translate, Search và Connection Tests. Điều này bao gồm HTTP status code, raw response text, request transport timeline, request URL và header đã được làm sạch, elapsed attempt duration, response header, partial response body, partial stream output đã parse và stack trace, rất quan trọng để khắc phục sự cố kết nối API và các lần reset từ upstream gateway.
- **Developer Mode**:
  - **Tắt (mặc định)**: ẩn toàn bộ điều khiển chẩn đoán chỉ dành cho developer khỏi người dùng thông thường.
  - **Bật**: hiển thị một developer diagnostics panel riêng trong Settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: chọn runtime path cho từng probe. Các nhà cung cấp OpenAI-compatible hỗ trợ thêm các mode ép buộc `direct streaming`, `direct buffered` và `requestUrl-only`, ngoài các runtime mode.
  - **Run Diagnostic**: chạy một long-request probe với call mode đã chọn và ghi `Notemd_Provider_Diagnostic_*.txt` vào thư mục gốc của vault.
  - **Run Stability Test**: lặp lại probe với số lần có thể cấu hình, từ 1 đến 10, với call mode đã chọn và lưu một stability report tổng hợp.
  - **Diagnostic Timeout**: timeout có thể cấu hình cho mỗi lần chạy, từ 15 đến 3600 giây.
  - **Why Use It**: nhanh hơn việc tái hiện thủ công khi một nhà cung cấp vượt qua "Test connection" nhưng lại thất bại ở các tác vụ dài thực tế, ví dụ dịch thuật qua gateway chậm.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Cài đặt chung

#### Đầu ra file đã xử lý
- **Customize Processed File Save Path**:
  - **Tắt (mặc định)**: các file đã xử lý, ví dụ `YourNote_processed.md`, được lưu trong *chính thư mục* của ghi chú gốc.
  - **Bật**: cho phép bạn chỉ định vị trí lưu tùy chỉnh.
- **Processed File Folder Path**: chỉ hiển thị khi bật tùy chọn trên. Nhập *đường dẫn tương đối* trong vault, ví dụ `Processed Notes` hoặc `Output/LLM`, nơi các file đã xử lý sẽ được lưu. Thư mục sẽ được tạo nếu chưa tồn tại. **Không dùng đường dẫn tuyệt đối như `C:\...` hoặc ký tự không hợp lệ.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Tắt (mặc định)**: các file được tạo bởi lệnh 'Add Links' dùng suffix mặc định `_processed.md`, ví dụ `YourNote_processed.md`.
  - **Bật**: cho phép bạn tùy chỉnh tên file đầu ra qua cài đặt bên dưới.
- **Custom Suffix/Replacement String**: chỉ hiển thị khi bật tùy chọn trên. Nhập chuỗi cần dùng cho tên file đầu ra.
  - Nếu để **trống**, file gốc sẽ bị **ghi đè** bằng nội dung đã xử lý.
  - Nếu nhập một chuỗi, ví dụ `_linked`, nó sẽ được nối vào tên gốc, ví dụ `YourNote_linked.md`. Hãy chắc chắn suffix không chứa ký tự không hợp lệ của tên file.

- **Remove Code Fences on Add Links**:
  - **Tắt (mặc định)**: code fence **(\`\\\`\`)** được giữ lại trong nội dung khi thêm liên kết, còn **(\`\\\`markdown)** sẽ bị xóa tự động.
  - **Bật**: xóa code fence khỏi nội dung trước khi thêm liên kết.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Đầu ra ghi chú khái niệm
- **Customize Concept Note Path**:
  - **Tắt (mặc định)**: việc tự động tạo ghi chú cho `[[linked concepts]]` bị tắt.
  - **Bật**: cho phép bạn chỉ định một thư mục nơi các concept note mới sẽ được tạo.
- **Concept Note Folder Path**: chỉ hiển thị khi bật tùy chọn trên. Nhập *đường dẫn tương đối* trong vault, ví dụ `Concepts` hoặc `Generated/Topics`, nơi concept note mới sẽ được lưu. Thư mục sẽ được tạo nếu chưa tồn tại. **Bắt buộc phải điền nếu đã bật tùy chỉnh.** **Không dùng đường dẫn tuyệt đối hoặc ký tự không hợp lệ.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Đầu ra file log khái niệm
- **Generate Concept Log File**:
  - **Tắt (mặc định)**: không tạo file log.
  - **Bật**: tạo một file log liệt kê các concept note mới được tạo sau khi xử lý. Định dạng là:
    ```
    tạo xx tệp md khái niệm
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: chỉ hiển thị khi bật "Generate Concept Log File".
  - **Tắt (mặc định)**: file log được lưu trong **Concept Note Folder Path**, nếu có chỉ định, hoặc ở thư mục gốc của vault nếu không.
  - **Bật**: cho phép chỉ định thư mục tùy chỉnh cho file log.
- **Concept Log Folder Path**: chỉ hiển thị khi bật "Customize Log File Save Path". Nhập *đường dẫn tương đối* trong vault, ví dụ `Logs/Notemd`, nơi file log sẽ được lưu. **Bắt buộc phải điền nếu đã bật tùy chỉnh.**
- **Customize Log File Name**: chỉ hiển thị khi bật "Generate Concept Log File".
  - **Tắt (mặc định)**: file log có tên `Generate.log`.
  - **Bật**: cho phép đặt tên tùy chỉnh cho file log.
- **Concept Log File Name**: chỉ hiển thị khi bật "Customize Log File Name". Nhập tên file mong muốn, ví dụ `ConceptCreation.log`. **Bắt buộc phải điền nếu đã bật tùy chỉnh.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tác vụ trích xuất khái niệm
- **Tạo ghi chú khái niệm tối giản**:
  - **On (Default)**: concept note mới tạo sẽ chỉ chứa tiêu đề, ví dụ `# Concept`.
  - **Off**: concept note có thể chứa nội dung bổ sung, như backlink "Linked From", nếu không bị tắt bởi cài đặt bên dưới.
- **Add "Linked From" backlink**:
  - **Off (Default)**: không thêm backlink về tài liệu nguồn trong concept note khi extract.
  - **On**: thêm section "Linked From" kèm backlink tới file nguồn.

#### Trích xuất văn bản gốc cụ thể
- **Questions for extraction**: nhập danh sách câu hỏi, mỗi câu một dòng, mà bạn muốn AI trích xuất câu trả lời nguyên văn từ ghi chú của mình.
- **Translate output to corresponding language**:
  - **Off (Default)**: chỉ xuất phần văn bản đã trích xuất bằng ngôn ngữ gốc của nó.
  - **On**: nối thêm bản dịch của phần văn bản đã trích xuất bằng ngôn ngữ được chọn cho tác vụ này.
- **Merged query mode**:
  - **Off**: xử lý từng câu hỏi riêng lẻ, cho độ chính xác cao hơn nhưng tốn nhiều API call hơn.
  - **On**: gửi tất cả câu hỏi trong một prompt duy nhất, nhanh hơn và ít API call hơn.
- **Customise extracted text save path & filename**:
  - **Off**: lưu trong cùng thư mục với file gốc với suffix `_Extracted`.
  - **On**: cho phép chỉ định thư mục đầu ra và suffix tên file tùy chỉnh.

#### Sửa Mermaid hàng loạt
- **Enable Mermaid Error Detection**:
  - **Off (Default)**: bỏ qua bước phát hiện lỗi sau khi xử lý.
  - **On**: quét file đã xử lý để tìm lỗi cú pháp Mermaid còn sót lại và tạo báo cáo `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: file có lỗi giữ nguyên tại chỗ.
  - **On**: di chuyển mọi file vẫn còn Mermaid syntax error sau lần sửa sang một thư mục riêng để review thủ công.
- **Mermaid error folder path**: chỉ hiển thị nếu tùy chọn trên được bật. Thư mục dùng để chuyển các file lỗi vào.

#### Tham số xử lý
- **Enable Batch Parallelism**:
  - **Tắt (mặc định)**: các tác vụ batch, như "Process Folder" hoặc "Batch Generate from Titles", xử lý file lần lượt từng cái, theo kiểu tuần tự.
  - **Bật**: cho phép tiện ích xử lý nhiều file đồng thời, giúp tăng tốc đáng kể với batch job lớn.
- **Batch Concurrency**: chỉ hiển thị khi bật parallelism. Đặt số lượng file tối đa được xử lý song song. Giá trị cao hơn có thể nhanh hơn nhưng dùng nhiều tài nguyên hơn và có thể chạm rate limit của API. Mặc định: 1, phạm vi: 1-20.
- **Batch Size**: chỉ hiển thị khi bật parallelism. Số file được gom vào một batch. Mặc định: 50, phạm vi: 10-200.
- **Delay Between Batches (ms)**: chỉ hiển thị khi bật parallelism. Độ trễ tùy chọn tính bằng mili giây giữa các batch, giúp kiểm soát API rate limit. Mặc định: 1000 ms.
- **API Call Interval (ms)**: độ trễ tối thiểu tính bằng mili giây *trước và sau* mỗi cuộc gọi LLM API riêng lẻ. Rất quan trọng đối với API có hạn mức thấp hoặc để tránh lỗi 429. Đặt 0 nếu không muốn thêm độ trễ nhân tạo. Mặc định: 500 ms.
- **Chunk Word Count**: số từ tối đa cho mỗi chunk gửi tới LLM. Ảnh hưởng tới số lượng API call đối với file lớn. Mặc định: 3000.
- **Enable Duplicate Detection**: bật hoặc tắt việc kiểm tra cơ bản các từ trùng lặp trong nội dung đã xử lý, kết quả hiện trong console. Mặc định: bật.
- **Max Tokens**: số token tối đa mà LLM nên tạo ra cho mỗi response chunk. Ảnh hưởng đến chi phí và mức độ chi tiết. Mặc định: 4096.
<img width="795" height="274" alt="Tham số xử lý   Cài đặt ngôn ngữ" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Dịch thuật
- **Default Target Language**: chọn ngôn ngữ mặc định mà bạn muốn dịch ghi chú sang. Bạn có thể override trong UI khi chạy lệnh dịch. Mặc định: English.
- **Customise Translation File Save Path**:
  - **Tắt (mặc định)**: file đã dịch được lưu trong *cùng thư mục* với ghi chú gốc.
  - **Bật**: cho phép chỉ định *đường dẫn tương đối* trong vault, ví dụ `Translations`, nơi file dịch sẽ được lưu. Thư mục sẽ được tạo nếu chưa tồn tại.
- **Use custom suffix for translated files**:
  - **Tắt (mặc định)**: file dịch dùng suffix mặc định `_translated.md`, ví dụ `YourNote_translated.md`.
  - **Bật**: cho phép chỉ định suffix tùy chỉnh.
- **Custom Suffix**: chỉ hiển thị khi bật tùy chọn trên. Nhập suffix tùy chỉnh cần nối vào tên file dịch, ví dụ `_es` hoặc `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Tạo nội dung
- **Enable Research in "Generate from Title"**:
  - **Tắt (mặc định)**: "Generate from Title" chỉ dùng tiêu đề làm đầu vào.
  - **Bật**: thực hiện web research bằng **Web Research Provider** đã cấu hình và đưa kết quả vào làm context cho LLM trong khi tạo nội dung từ tiêu đề.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Bật (mặc định)**: tự động chạy một lượt sửa cú pháp Mermaid sau các workflow liên quan đến Mermaid, như Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid và Translate.
  - **Tắt**: giữ nguyên đầu ra Mermaid được tạo, trừ khi bạn tự chạy `Batch Mermaid Fix` hoặc thêm nó vào một custom workflow.
- **Output Language**: mới. Chọn ngôn ngữ đầu ra mong muốn cho các tác vụ "Generate from Title" và "Batch Generate from Title".
  - **English (Default)**: prompt được xử lý và đầu ra được tạo bằng tiếng Anh.
  - **Other Languages**: LLM được hướng dẫn suy luận bằng tiếng Anh nhưng trả tài liệu cuối cùng bằng ngôn ngữ bạn đã chọn, ví dụ Español, Français, 简体中文, 繁體中文, العربية, हिन्दी v.v.
- **Change Prompt Word**: mới.
  - **Change Prompt Word**: cho phép bạn thay đổi prompt word cho một tác vụ cụ thể.
  - **Custom Prompt Word**: nhập prompt word tùy chỉnh cho tác vụ đó.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Tắt (mặc định)**: các file được tạo thành công được chuyển đến một subfolder tên `[OriginalFolderName]_complete` nằm tương đối so với thư mục cha của thư mục gốc, hoặc `Vault_complete` nếu thư mục gốc là thư mục root.
  - **Bật**: cho phép bạn chỉ định tên tùy chỉnh cho subfolder nơi các file hoàn thành được chuyển vào.
- **Custom Output Folder Name**: chỉ hiển thị khi bật tùy chọn trên. Nhập tên mong muốn cho subfolder, ví dụ `Generated Content` hoặc `_complete`. Không cho phép ký tự không hợp lệ. Nếu để trống, sẽ dùng `_complete` làm mặc định. Thư mục này được tạo tương đối với thư mục cha của thư mục gốc.

#### Nút quy trình làm việc một lần nhấp
- **Visual Workflow Builder**: tạo các workflow button tùy chỉnh từ các hành động tích hợp sẵn mà không cần tự viết DSL.
- **Custom Workflow Buttons DSL**: người dùng nâng cao vẫn có thể chỉnh trực tiếp văn bản định nghĩa workflow. DSL không hợp lệ sẽ rơi về workflow mặc định một cách an toàn và hiển thị cảnh báo trong UI của sidebar hoặc settings.
- **Workflow Error Strategy**:
  - **Stop on Error (Default)**: dừng workflow ngay khi một bước bị lỗi.
  - **Continue on Error**: tiếp tục chạy các bước phía sau và báo số hành động thất bại ở cuối.
- **Default Workflow Included**: `One-Click Extract` nối `Process File (Add Links)`, `Batch Generate from Titles` và `Batch Mermaid Fix`.

#### Cài đặt lời nhắc tùy chỉnh
Tính năng này cho phép bạn ghi đè các chỉ dẫn mặc định, tức prompt, được gửi tới LLM cho các tác vụ cụ thể, giúp bạn kiểm soát đầu ra ở mức chi tiết.

- **Enable Custom Prompts for Specific Tasks**:
  - **Tắt (mặc định)**: tiện ích dùng prompt mặc định tích hợp sẵn cho mọi thao tác.
  - **Bật**: bật khả năng đặt custom prompt cho các tác vụ được liệt kê bên dưới. Đây là công tắc tổng của tính năng này.

- **Use Custom Prompt for [Task Name]**: chỉ hiển thị khi bật tùy chọn trên.
  - Với từng tác vụ được hỗ trợ, như "Add Links", "Generate from Title", "Research & Summarize" và "Extract Concepts", bạn có thể bật hoặc tắt custom prompt một cách độc lập.
  - **Tắt**: tác vụ cụ thể này sẽ dùng prompt mặc định.
  - **Bật**: tác vụ này sẽ dùng văn bản bạn cung cấp trong vùng "Custom Prompt" tương ứng bên dưới.

- **Custom Prompt Text Area**: chỉ hiển thị khi custom prompt của tác vụ được bật.
  - **Default Prompt Display**: để tham khảo, tiện ích hiển thị prompt mặc định mà lẽ ra nó sẽ dùng cho tác vụ. Bạn có thể dùng nút **"Copy Default Prompt"** để sao chép prompt đó làm điểm xuất phát cho prompt riêng của mình.
  - **Custom Prompt Input**: đây là nơi bạn viết các chỉ dẫn riêng cho LLM.
  - **Placeholders**: bạn có thể và nên dùng các placeholder đặc biệt trong prompt. Tiện ích sẽ thay chúng bằng nội dung thật trước khi gửi yêu cầu tới LLM. Hãy xem prompt mặc định để biết placeholder nào khả dụng cho từng tác vụ. Một số placeholder phổ biến gồm:
    - `{TITLE}`: tiêu đề của ghi chú hiện tại.
    - `{RESEARCH_CONTEXT_SECTION}`: nội dung thu thập từ web research.
    - `{USER_PROMPT}`: nội dung của ghi chú đang được xử lý.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Phạm vi kiểm tra trùng lặp   Cài đặt lời nhắc tùy chỉnh" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Phạm vi kiểm tra trùng lặp
- **Duplicate Check Scope Mode**: điều khiển file nào sẽ được đối chiếu với các ghi chú trong Concept Note Folder của bạn để tìm duplicate tiềm năng.
  - **Entire Vault (Default)**: so sánh concept note với tất cả ghi chú khác trong vault, trừ chính Concept Note Folder.
  - **Include Specific Folders Only**: chỉ so sánh concept note với các ghi chú nằm trong các thư mục được liệt kê bên dưới.
  - **Exclude Specific Folders**: so sánh concept note với tất cả ghi chú *ngoại trừ* những ghi chú nằm trong các thư mục được liệt kê bên dưới, đồng thời cũng loại trừ Concept Note Folder.
  - **Concept Folder Only**: chỉ so sánh concept note với *các ghi chú khác bên trong Concept Note Folder*. Cách này giúp tìm duplicate chỉ trong phần concept được tạo ra.
- **Include/Exclude Folders**: chỉ hiển thị nếu Mode là 'Include' hoặc 'Exclude'. Nhập *đường dẫn tương đối* của các thư mục bạn muốn bao gồm hoặc loại trừ, **mỗi đường dẫn trên một dòng**. Đường dẫn phân biệt hoa thường và dùng `/` làm dấu phân tách, ví dụ `Reference Material/Papers` hoặc `Daily Notes`. Các thư mục này không được trùng hoặc nằm bên trong Concept Note Folder.

#### Nhà cung cấp nghiên cứu web
- **Search Provider**: chọn giữa `Tavily`, yêu cầu API key và được khuyến nghị, và `DuckDuckGo`, ở trạng thái thử nghiệm và thường bị search engine chặn với các yêu cầu tự động. Được dùng cho "Research & Summarize Topic" và tùy chọn cho "Generate from Title".
- **Tavily API Key**: chỉ hiển thị nếu Tavily được chọn. Nhập API key của bạn từ [tavily.com](https://tavily.com/).
- **Tavily Max Results**: chỉ hiển thị nếu Tavily được chọn. Số lượng kết quả tìm kiếm tối đa mà Tavily sẽ trả về, từ 1 đến 20. Mặc định: 5.
- **Tavily Search Depth**: chỉ hiển thị nếu Tavily được chọn. Chọn `basic`, mặc định, hoặc `advanced`. Lưu ý: `advanced` cho kết quả tốt hơn nhưng tốn 2 API credit mỗi lượt tìm kiếm thay vì 1.
- **DuckDuckGo Max Results**: chỉ hiển thị nếu DuckDuckGo được chọn. Số lượng kết quả tối đa sẽ được parse, từ 1 đến 10. Mặc định: 5.
- **DuckDuckGo Content Fetch Timeout**: chỉ hiển thị nếu DuckDuckGo được chọn. Số giây tối đa để chờ khi thử lấy nội dung từ từng URL kết quả DuckDuckGo. Mặc định: 15.
- **Max Research Content Tokens**: số token tối đa gần đúng từ các kết quả research web tổng hợp, snippets hoặc fetched content, sẽ được đưa vào prompt tóm tắt. Tham số này giúp quản lý context window và chi phí. Mặc định: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Miền học tập tập trung
- **Enable Focused Learning Domain**:
  - **Tắt (mặc định)**: prompt gửi tới LLM sẽ dùng các chỉ dẫn chuẩn, mang tính tổng quát.
  - **Bật**: cho phép bạn chỉ định một hoặc nhiều lĩnh vực nghiên cứu để cải thiện khả năng hiểu ngữ cảnh của LLM.
- **Learning Domain**: chỉ hiển thị khi bật tùy chọn trên. Nhập lĩnh vực cụ thể của bạn, ví dụ 'Materials Science', 'Polymer Physics', 'Machine Learning'. Điều này sẽ thêm một dòng "Relevant Fields: [...]" vào đầu prompt, giúp LLM tạo các link và nội dung chính xác, phù hợp hơn với chuyên ngành của bạn.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Hướng dẫn sử dụng

### Quy trình nhanh và thanh bên

- Mở Notemd sidebar để truy cập các section hành động được nhóm lại cho xử lý cốt lõi, tạo nội dung, dịch thuật, tri thức và tiện ích.
- Dùng khu vực **Quy trình nhanh** ở đầu thanh bên để khởi chạy các nút nhiều bước tùy chỉnh.
- Workflow mặc định **One-Click Extract** chạy `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Tiến độ workflow, log theo từng bước và các lỗi được hiển thị trong sidebar, với một footer ghim cố định để giữ cho progress bar và vùng log không bị ép mất khi nhiều section được mở rộng.
- Thẻ tiến độ giữ cho status text, percentage pill riêng biệt và thời gian còn lại dễ đọc ngay lập tức, đồng thời cùng những custom workflow đó cũng có thể được cấu hình lại từ settings.

### Xử lý gốc (thêm Wiki-Links)
Đây là chức năng cốt lõi tập trung vào việc xác định các khái niệm và thêm `[[wiki-links]]`.

**Quan trọng:** tiến trình này chỉ hoạt động với file `.md` hoặc `.txt`. Bạn có thể chuyển PDF sang file MD miễn phí bằng [Mineru](https://github.com/opendatalab/MinerU) trước khi xử lý tiếp.

1. **Dùng Sidebar**:
   - Mở Notemd Sidebar, bằng biểu tượng đũa thần hoặc bảng lệnh.
   - Mở file `.md` hoặc `.txt`.
   - Nhấp **"Process File (Add Links)"**.
   - Để xử lý một thư mục: nhấp **"Process Folder (Add Links)"**, chọn thư mục rồi nhấp "Process".
   - Tiến độ được hiển thị trong sidebar. Bạn có thể hủy tác vụ bằng nút "Cancel Processing" trong sidebar.
   - *Lưu ý với xử lý thư mục:* file được xử lý ở nền mà không mở trong editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Dùng Command Palette** (`Ctrl+P` hoặc `Cmd+P`):
   - **Single File**: mở file rồi chạy `Notemd: Process Current File`.
   - **Folder**: chạy `Notemd: Process Folder`, sau đó chọn thư mục. File được xử lý ở nền mà không mở trong editor.
   - Một progress modal sẽ xuất hiện cho các hành động từ bảng lệnh và có kèm nút cancel.
   - *Lưu ý:* tiện ích sẽ tự động loại bỏ các dòng mở đầu `\boxed{` và các dòng `}` ở cuối nếu xuất hiện trong nội dung đã xử lý cuối cùng trước khi lưu.

### Tính năng mới

1. **Tóm tắt thành sơ đồ Mermaid**:
   - Mở ghi chú mà bạn muốn tóm tắt.
   - Chạy lệnh `Notemd: Summarise as Mermaid diagram` qua bảng lệnh hoặc nút trong sidebar.
   - Tiện ích sẽ tạo một ghi chú mới chứa Mermaid diagram.

2. **Translate Note/Selection**:
   - Chọn văn bản trong một ghi chú nếu bạn chỉ muốn dịch phần chọn, hoặc gọi lệnh mà không chọn gì để dịch toàn bộ ghi chú.
   - Chạy lệnh `Notemd: Translate Note/Selection` qua bảng lệnh hoặc nút trong sidebar.
   - Một modal sẽ hiện ra để bạn xác nhận hoặc thay đổi **Target Language**, mặc định lấy từ setting đã khai báo trong phần Cấu hình.
   - Tiện ích dùng **LLM Provider** đã cấu hình, theo Multi-Model settings, để thực hiện việc dịch.
   - Nội dung được dịch sẽ được lưu vào **Translation Save Path** đã cấu hình, với suffix phù hợp, rồi mở trong **một pane mới ở bên phải** nội dung gốc để tiện so sánh.
   - Bạn có thể hủy tác vụ này qua nút trong sidebar hoặc nút cancel của modal.
3. **Dịch hàng loạt**:
   - Chạy lệnh `Notemd: Batch Translate Folder` từ bảng lệnh và chọn một thư mục, hoặc nhấp chuột phải vào một thư mục trong file explorer rồi chọn "Batch translate this folder".
   - Tiện ích sẽ dịch tất cả Markdown file trong thư mục đã chọn.
   - Các file đã dịch được lưu vào translation path đã cấu hình nhưng không tự động mở ra.
   - Tiến trình này có thể bị hủy qua progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Chọn văn bản trong một ghi chú HOẶC đảm bảo ghi chú có tiêu đề, tiêu đề này sẽ được dùng làm chủ đề tìm kiếm.
   - Chạy lệnh `Notemd: Research and Summarize Topic` qua bảng lệnh hoặc nút trong sidebar.
   - Tiện ích sử dụng **Search Provider** đã cấu hình, Tavily hoặc DuckDuckGo, cùng **LLM Provider** phù hợp, dựa trên Multi-Model settings, để tìm và tóm tắt thông tin.
   - Bản tóm tắt được nối vào ghi chú hiện tại.
   - Bạn có thể hủy tác vụ này qua nút trong sidebar hoặc nút cancel trên modal.
   - *Lưu ý:* tìm kiếm DuckDuckGo có thể thất bại do bot detection. Tavily được khuyến nghị.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Mở một ghi chú, nó có thể đang trống.
   - Chạy lệnh `Notemd: Generate Content from Title` qua bảng lệnh hoặc nút trong sidebar.
   - Tiện ích sẽ dùng **LLM Provider** phù hợp, dựa trên Multi-Model settings, để tạo nội dung từ tiêu đề ghi chú, thay thế bất kỳ nội dung nào đang có.
   - Nếu bật setting **"Enable Research in 'Generate from Title'"**, tiện ích sẽ thực hiện web research trước, dùng **Web Research Provider** đã cấu hình, rồi đưa ngữ cảnh đó vào prompt gửi tới LLM.
   - Bạn có thể hủy tác vụ này qua nút trong sidebar hoặc nút cancel trên modal.

5. **Batch Generate Content from Titles**:
   - Chạy lệnh `Notemd: Batch Generate Content from Titles` qua bảng lệnh hoặc nút trong sidebar.
   - Chọn thư mục chứa các ghi chú mà bạn muốn xử lý.
   - Tiện ích sẽ lặp qua từng file `.md` trong thư mục, loại trừ `_processed.md` file và các file trong thư mục "complete" được chỉ định, tạo nội dung dựa trên tiêu đề rồi thay thế nội dung hiện có. Các file được xử lý ở nền mà không mở trong editor.
   - Các file được xử lý thành công sẽ được chuyển sang thư mục "complete" đã cấu hình.
   - Lệnh này tôn trọng setting **"Enable Research in 'Generate from Title'"** cho từng ghi chú được xử lý.
   - Bạn có thể hủy tác vụ này qua nút trong sidebar hoặc nút cancel trên modal.
   - Tiến độ và kết quả, như số file được sửa và các lỗi, được hiển thị trong sidebar hoặc modal log.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Đảm bảo **Concept Note Folder Path** đã được cấu hình đúng trong settings.
   - Chạy `Notemd: Check and Remove Duplicate Concept Notes` qua bảng lệnh hoặc nút trong sidebar.
   - Tiện ích quét concept note folder và so sánh tên file với các ghi chú bên ngoài thư mục đó bằng nhiều quy tắc như exact match, plural, normalization và containment.
   - Nếu phát hiện duplicate tiềm năng, một modal sẽ xuất hiện liệt kê các file, lý do bị gắn cờ và các file xung đột.
   - Hãy xem kỹ danh sách. Nhấp **"Delete Files"** để chuyển các file liệt kê vào system trash, hoặc nhấp **"Cancel"** để không làm gì.
   - Tiến độ và kết quả được hiển thị trong sidebar hoặc modal log.

7. **Extract Concepts (Pure Mode)**:
   - Tính năng này cho phép bạn trích xuất khái niệm từ tài liệu và tạo concept note tương ứng *mà không* sửa file gốc. Nó rất phù hợp để nhanh chóng lấp đầy cơ sở tri thức từ một bộ tài liệu.
   - **Single File**: mở một file và chạy lệnh `Notemd: Extract concepts (create concept notes only)` từ bảng lệnh hoặc nhấp nút **"Extract concepts (current file)"** trong sidebar.
   - **Folder**: chạy lệnh `Notemd: Batch extract concepts from folder` từ bảng lệnh hoặc nhấp nút **"Extract concepts (folder)"** trong sidebar, sau đó chọn một thư mục để xử lý tất cả ghi chú bên trong.
   - Tiện ích sẽ đọc các file, xác định các khái niệm và tạo ghi chú mới cho chúng trong **Concept Note Folder** đã chỉ định, để nguyên các file gốc.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Lệnh mạnh mẽ này giúp tinh gọn quá trình tạo và điền nội dung cho concept note mới.
   - Chọn một từ hoặc cụm từ trong editor.
   - Chạy lệnh `Notemd: Create Wiki-Link & Generate Note from Selection`; bạn nên gán hotkey cho lệnh này, ví dụ `Cmd+Shift+W`.
   - Tiện ích sẽ:
     1. Thay phần văn bản bạn chọn bằng `[[wiki-link]]`.
     2. Kiểm tra xem đã tồn tại ghi chú có tiêu đề đó trong **Concept Note Folder** hay chưa.
     3. Nếu đã tồn tại, tiện ích sẽ thêm backlink vào ghi chú hiện tại.
     4. Nếu chưa tồn tại, tiện ích sẽ tạo một ghi chú trống mới.
     5. Sau đó tiện ích sẽ tự động chạy lệnh **"Generate Content from Title"** trên ghi chú mới hoặc đã có, rồi điền AI-generated content vào ghi chú đó.

9. **Extract Concepts and Generate Titles**:
   - Lệnh này nối hai tính năng mạnh mẽ thành một workflow liền mạch.
   - Chạy lệnh `Notemd: Extract Concepts and Generate Titles` từ bảng lệnh; bạn nên gán hotkey cho nó.
   - Tiện ích sẽ:
     1. Trước tiên chạy tác vụ **"Extract concepts (current file)"** trên file đang hoạt động.
     2. Sau đó tự động chạy tác vụ **"Batch generate from titles"** trên thư mục mà bạn đã cấu hình trong settings làm **Concept note folder path**.
   - Điều này cho phép bạn trước hết làm giàu cơ sở tri thức bằng các khái niệm mới từ tài liệu nguồn, rồi ngay lập tức mở rộng các concept note mới đó bằng AI-generated content chỉ trong một bước.

10. **Extract Specific Original Text**:
    - Cấu hình các câu hỏi của bạn trong settings ở phần "Extract Specific Original Text".
    - Dùng nút "Extract Specific Original Text" trong sidebar để xử lý file đang hoạt động.
    - **Merged Mode**: giúp xử lý nhanh hơn bằng cách gửi mọi câu hỏi trong một prompt.
    - **Translation**: tùy chọn dịch phần văn bản đã trích xuất sang ngôn ngữ bạn cấu hình.
    - **Custom Output**: cấu hình vị trí và cách lưu file trích xuất.

11. **Batch Mermaid Fix**:
    - Dùng nút "Batch Mermaid Fix" trong sidebar để quét một thư mục và sửa các lỗi cú pháp Mermaid phổ biến.
    - Tiện ích sẽ báo lại các file vẫn còn lỗi trong file `mermaid_error_{foldername}.md`.
    - Bạn cũng có thể cấu hình để di chuyển những file có vấn đề này sang một thư mục riêng để review.

## Nhà cung cấp LLM được hỗ trợ

| Provider           | Type    | API Key Required       | Notes                                                                 |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Đám mây | Có                     | Endpoint DeepSeek gốc với khả năng xử lý reasoning-model              |
| Qwen               | Đám mây | Có                     | Preset DashScope compatible-mode cho các model Qwen / QwQ             |
| Qwen Code          | Đám mây | Có                     | Preset DashScope tập trung cho các model lập trình của Qwen           |
| Doubao             | Đám mây | Có                     | Preset Volcengine Ark; thường bạn sẽ đặt model field thành endpoint ID của mình |
| Moonshot           | Đám mây | Có                     | Endpoint Kimi / Moonshot chính thức                                   |
| GLM                | Đám mây | Có                     | Endpoint OpenAI-compatible chính thức của Zhipu BigModel              |
| Z AI               | Đám mây | Có                     | Endpoint OpenAI-compatible quốc tế của GLM/Zhipu; bổ sung cho `GLM`   |
| MiniMax            | Đám mây | Có                     | Endpoint MiniMax chat-completions chính thức                          |
| Huawei Cloud MaaS  | Đám mây | Có                     | Endpoint OpenAI-compatible Huawei ModelArts MaaS cho hosted model     |
| Baidu Qianfan      | Đám mây | Có                     | Endpoint OpenAI-compatible chính thức của Qianfan cho các model ERNIE |
| SiliconFlow        | Đám mây | Có                     | Endpoint OpenAI-compatible chính thức của SiliconFlow cho hosted OSS model |
| OpenAI             | Đám mây | Có                     | Hỗ trợ GPT và các model o-series                                      |
| Anthropic          | Đám mây | Có                     | Hỗ trợ các model Claude                                               |
| Google             | Đám mây | Có                     | Hỗ trợ các model Gemini                                               |
| Mistral            | Đám mây | Có                     | Hỗ trợ các họ model Mistral và Codestral                              |
| Azure OpenAI       | Đám mây | Có                     | Yêu cầu Endpoint, API Key, deployment name và API Version             |
| OpenRouter         | Cổng    | Có                     | Truy cập nhiều nhà cung cấp thông qua OpenRouter model ID             |
| xAI                | Đám mây | Có                     | Endpoint Grok gốc                                                     |
| Groq               | Đám mây | Có                     | Inference OpenAI-compatible tốc độ cao cho hosted OSS model           |
| Together           | Đám mây | Có                     | Endpoint OpenAI-compatible cho hosted OSS model                       |
| Fireworks          | Đám mây | Có                     | Endpoint inference OpenAI-compatible                                  |
| Requesty           | Cổng    | Có                     | Bộ định tuyến đa nhà cung cấp phía sau một API key                    |
| OpenAI Compatible  | Cổng    | Tùy chọn               | Preset chung cho LiteLLM, vLLM, Perplexity, Vercel AI Gateway, v.v.   |
| LMStudio           | Cục bộ  | Tùy chọn (`EMPTY`)     | Chạy model cục bộ qua máy chủ LM Studio                               |
| Ollama             | Cục bộ  | Không                  | Chạy model cục bộ qua máy chủ Ollama                                  |

*Lưu ý: với các nhà cung cấp cục bộ, LMStudio và Ollama, hãy bảo đảm ứng dụng máy chủ tương ứng đang chạy và truy cập được qua Base URL đã cấu hình.*
*Lưu ý: với OpenRouter và Requesty, hãy dùng model identifier đầy đủ hoặc có tiền tố nhà cung cấp mà gateway hiển thị, ví dụ `google/gemini-flash-1.5` hoặc `anthropic/claude-3-7-sonnet-latest`.*
*Lưu ý: `Doubao` thường mong đợi Ark endpoint hoặc deployment ID trong trường model thay vì tên họ model thô. Màn hình settings giờ sẽ cảnh báo nếu placeholder value vẫn còn hiện diện và chặn connection test cho đến khi bạn thay bằng endpoint ID thật.*
*Lưu ý: `Z AI` nhắm tới tuyến quốc tế `api.z.ai`, còn `GLM` vẫn dùng endpoint BigModel ở Trung Quốc đại lục. Hãy chọn preset phù hợp với vùng tài khoản của bạn.*
*Lưu ý: các preset tập trung vào Trung Quốc dùng chat-first connection check để test xác minh đúng model hoặc deployment đã cấu hình, không chỉ đơn thuần là khả năng truy cập API key.*
*Lưu ý: `OpenAI Compatible` dành cho gateway và proxy tùy chỉnh. Hãy cấu hình Base URL, chính sách API key và model ID theo tài liệu của nhà cung cấp của bạn.*

## Sử dụng mạng và xử lý dữ liệu

Notemd chạy cục bộ bên trong Obsidian, nhưng một số tính năng sẽ gửi yêu cầu ra ngoài.

### Các cuộc gọi tới nhà cung cấp LLM (có thể cấu hình)

- Trigger: xử lý file, tạo nội dung, dịch thuật, tóm tắt nghiên cứu, tóm tắt Mermaid và các thao tác connection hoặc diagnostic.
- Endpoint: các provider base URL bạn cấu hình trong settings của Notemd.
- Dữ liệu được gửi: văn bản prompt và task content cần thiết cho việc xử lý.
- Ghi chú về xử lý dữ liệu: API key được cấu hình cục bộ trong settings của tiện ích và được dùng để ký request từ chính thiết bị của bạn.

### Các cuộc gọi nghiên cứu web (tùy chọn)

- Trigger: khi nghiên cứu web được bật và đã chọn search provider.
- Endpoint: Tavily API hoặc DuckDuckGo endpoint.
- Dữ liệu được gửi: truy vấn nghiên cứu của bạn cùng các request metadata cần thiết.

### Chẩn đoán cho nhà phát triển và nhật ký gỡ lỗi (tùy chọn)

- Trigger: API debug mode và các hành động developer diagnostic.
- Lưu trữ: diagnostic log và error log được ghi vào thư mục gốc của vault, ví dụ `Notemd_Provider_Diagnostic_*.txt` và `Notemd_Error_Log_*.txt`.
- Ghi chú về rủi ro: log có thể chứa các đoạn trích request hoặc response. Hãy review log trước khi chia sẻ công khai.

### Lưu trữ cục bộ

- Cấu hình của tiện ích được lưu trong `.obsidian/plugins/notemd/data.json`.
- File sinh ra, báo cáo và log tùy chọn được lưu trong vault của bạn theo các settings hiện tại.

## Khắc phục sự cố

### Các vấn đề thường gặp
- **Tiện ích không tải**: hãy chắc chắn `manifest.json`, `main.js` và `styles.css` nằm đúng thư mục, tức `<Vault>/.obsidian/plugins/notemd/`, rồi khởi động lại Obsidian. Kiểm tra Developer Console, `Ctrl+Shift+I` hoặc `Cmd+Option+I`, để xem có lỗi nào lúc khởi động hay không.
- **Lỗi xử lý / API error**:
  1. **Kiểm tra định dạng file**: bảo đảm file bạn đang cố xử lý hoặc kiểm tra có đuôi `.md` hoặc `.txt`. Hiện tại Notemd chỉ hỗ trợ các định dạng dựa trên văn bản này.
  2. Dùng lệnh hoặc nút "Test LLM Connection" để xác minh settings cho nhà cung cấp đang hoạt động.
  3. Kiểm tra lại API Key, Base URL, Model Name và API Version, đối với Azure. Bảo đảm API key đúng và có đủ credits hoặc quyền.
  4. Bảo đảm máy chủ LLM cục bộ, LMStudio hoặc Ollama, đang chạy và Base URL là chính xác, ví dụ `http://localhost:1234/v1` cho LMStudio.
  5. Kiểm tra kết nối internet của bạn với các nhà cung cấp đám mây.
  6. **Với lỗi xử lý một file:** xem Developer Console để biết error message chi tiết. Nếu cần, sao chép chúng bằng nút trong error modal.
  7. **Với lỗi xử lý hàng loạt:** kiểm tra file `error_processing_filename.log` trong thư mục gốc của vault để xem error message chi tiết cho từng file bị lỗi. Developer Console hoặc error modal có thể chỉ hiển thị summary hoặc batch error chung.
  8. **Nhật ký lỗi tự động:** nếu một quy trình thất bại, tiện ích sẽ tự động lưu một file log chi tiết tên `Notemd_Error_Log_[Timestamp].txt` trong thư mục gốc của vault. File này chứa error message, dấu vết ngăn xếp và session log. Nếu bạn gặp vấn đề lặp lại, hãy kiểm tra file này. Việc bật "API Error Debugging Mode" trong settings sẽ khiến file log chứa cả API response data chi tiết hơn nữa.
  9. **Chẩn đoán long request trên endpoint thật, dành cho developer**:
     - Đường ngay trong tiện ích, được khuyến nghị trước tiên: dùng **Settings -> Notemd -> Developer provider diagnostic (long request)** để chạy một runtime probe trên nhà cung cấp đang hoạt động và tạo `Notemd_Provider_Diagnostic_*.txt` trong thư mục gốc của vault.
     - Đường CLI, ngoài Obsidian runtime: để so sánh có thể lặp lại ở cấp endpoint giữa buffered và streaming behavior, hãy dùng:
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
       Báo cáo được tạo ra bao gồm timing cho từng attempt, `First Byte` và `Duration`, request metadata đã được làm sạch, response headers, raw hoặc partial body fragment, stream fragment đã parse và các điểm thất bại ở lớp transport.
- **Sự cố kết nối LM Studio/Ollama**:
  - **Kiểm tra kết nối thất bại**: bảo đảm máy chủ cục bộ, LM Studio hoặc Ollama, đang chạy và đúng model đã được nạp hoặc sẵn sàng.
  - **CORS Errors, Ollama trên Windows**: nếu bạn gặp CORS, tức Cross-Origin Resource Sharing error, khi dùng Ollama trên Windows, bạn có thể cần đặt biến môi trường `OLLAMA_ORIGINS`. Bạn làm điều này bằng cách chạy `set OLLAMA_ORIGINS=*` trong command prompt trước khi khởi động Ollama. Cách này cho phép yêu cầu từ mọi origin.
  - **Bật CORS trong LM Studio**: với LM Studio, bạn có thể bật CORS ngay trong server settings; điều này có thể cần thiết nếu Obsidian đang chạy trong trình duyệt hoặc chịu origin policy nghiêm ngặt.
- **Lỗi tạo thư mục ("File name cannot contain...")**:
  - Điều này thường có nghĩa là đường dẫn bạn cung cấp trong settings, tức **Processed File Folder Path** hoặc **Concept Note Folder Path**, là không hợp lệ *đối với Obsidian*.
  - **Hãy chắc chắn bạn đang dùng đường dẫn tương đối**, ví dụ `Processed` hoặc `Notes/Concepts`, và **không dùng đường dẫn tuyệt đối**, ví dụ `C:\Users\...` hoặc `/Users/...`.
  - Kiểm tra các ký tự không hợp lệ: `* " \ / < > : | ? # ^ [ ]`. Lưu ý rằng `\` không hợp lệ ngay cả trên Windows đối với đường dẫn của Obsidian. Hãy dùng `/` làm path separator.
- **Vấn đề hiệu năng**: xử lý file lớn hoặc nhiều file có thể mất thời gian. Giảm setting "Chunk Word Count" nếu bạn muốn các API call có khả năng nhanh hơn, dù nhiều hơn. Hãy thử một nhà cung cấp LLM hoặc model khác.
- **Liên kết không như mong đợi**: chất lượng linking phụ thuộc nhiều vào LLM và prompt. Hãy thử với các model khác hoặc các cài đặt nhiệt độ khác.

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Vui lòng tham khảo kho GitHub để xem hướng dẫn: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Tài liệu dành cho người bảo trì

- [Quy trình phát hành (Tiếng Anh)](./docs/maintainer/release-workflow.md)
- [Quy trình phát hành (Tiếng Trung giản thể)](./docs/maintainer/release-workflow.zh-CN.md)

## Giấy phép

Giấy phép MIT. Xem file [LICENSE](LICENSE) để biết chi tiết.

---

*Notemd v1.8.1 - Nâng cấp knowledge graph Obsidian của bạn bằng AI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
