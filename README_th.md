![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# ปลั๊กอิน Notemd สำหรับ Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

อ่านเอกสารในภาษาอื่นได้ที่: [ศูนย์รวมภาษา](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 การยกระดับคลังความรู้หลายภาษาด้วย AI
==================================================
```

วิธีง่ายๆ ในการสร้างฐานความรู้ของคุณเอง!

Notemd ช่วยยกระดับเวิร์กโฟลว์ใน Obsidian ของคุณด้วยการเชื่อมต่อกับ Large Language Models (LLMs) หลายประเภท เพื่อประมวลผลโน้ตหลายภาษาของคุณ สร้าง `[[wiki-links]]` สำหรับแนวคิดสำคัญโดยอัตโนมัติ สร้างโน้ตแนวคิดที่เกี่ยวข้อง ทำเว็บรีเสิร์ช และช่วยให้คุณสร้างกราฟความรู้ที่ทรงพลังยิ่งขึ้น

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

**เวอร์ชัน:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## สารบัญ

- [เริ่มต้นใช้งานด่วน](#เริ่มต้นใช้งานด่วน)
- [การรองรับภาษา](#การรองรับภาษา)
- [คุณสมบัติ](#คุณสมบัติ)
- [การติดตั้ง](#การติดตั้ง)
- [การกำหนดค่า](#การกำหนดค่า)
- [คู่มือการใช้งาน](#คู่มือการใช้งาน)
- [ผู้ให้บริการ LLM ที่รองรับ](#ผู้ให้บริการ-llm-ที่รองรับ)
- [การใช้เครือข่ายและการจัดการข้อมูล](#การใช้เครือข่ายและการจัดการข้อมูล)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)
- [การมีส่วนร่วม](#การมีส่วนร่วม)
- [เอกสารสำหรับผู้ดูแล](#เอกสารสำหรับผู้ดูแล)
- [ใบอนุญาต](#ใบอนุญาต)

## เริ่มต้นใช้งานด่วน

1.  **ติดตั้งและเปิดใช้งาน**: ติดตั้งปลั๊กอินจาก Obsidian Marketplace
2.  **กำหนดค่า LLM**: ไปที่ `Settings -> Notemd` เลือกผู้ให้บริการ LLM ของคุณ (เช่น OpenAI หรือผู้ให้บริการภายในเครื่องอย่าง Ollama) แล้วกรอก API key/URL
3.  **เปิดแถบข้าง**: คลิกไอคอนไม้กายสิทธิ์ของ Notemd บนแถบด้านซ้ายเพื่อเปิดแถบข้าง
4.  **ประมวลผลโน้ต**: เปิดโน้ตใดก็ได้แล้วคลิก **"Process File (Add Links)"** ในแถบข้าง เพื่อเพิ่ม `[[wiki-links]]` ให้แนวคิดสำคัญโดยอัตโนมัติ
5.  **รันเวิร์กโฟลว์ด่วน**: ใช้ปุ่มเริ่มต้น **"One-Click Extract"** เพื่อเชื่อมการประมวลผล การสร้างแบบกลุ่ม และการซ่อม Mermaid จากจุดเริ่มต้นเดียว

เพียงเท่านี้ก็พร้อมใช้งานแล้ว สำรวจการตั้งค่าเพิ่มเติมเพื่อปลดล็อกฟีเจอร์อย่างเว็บรีเสิร์ช การแปล และการสร้างเนื้อหา

## การรองรับภาษา

### ข้อกำหนดพฤติกรรมด้านภาษา

| ประเด็น | ขอบเขต | ค่าเริ่มต้น | หมายเหตุ |
|---|---|---|---|
| `ภาษาส่วนติดต่อ` | เฉพาะข้อความ UI ของปลั๊กอิน (การตั้งค่า, แถบข้าง, การแจ้งเตือน, กล่องโต้ตอบ) | `auto` | ตาม locale ของ Obsidian; แค็ตตาล็อก UI ปัจจุบันคือ `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW` |
| `ภาษาผลลัพธ์ของงาน` | ผลลัพธ์ของงานที่สร้างโดย LLM (ลิงก์, บทสรุป, การสร้างเนื้อหา, การสกัด, ภาษาเป้าหมายของการแปล) | `en` | ตั้งค่าแบบรวมศูนย์หรือแยกตามงานได้เมื่อเปิด `ใช้ภาษาต่างกันสำหรับแต่ละงาน` |
| `ปิดการแปลอัตโนมัติ` | งานที่ไม่ใช่ Translate จะคงบริบทภาษาต้นฉบับไว้ | `false` | งาน `Translate` แบบระบุชัดจะยังคงบังคับใช้ภาษาเป้าหมายที่กำหนดไว้ |
| `ภาษาสำรอง` | การหา key ของ UI เมื่อคำแปลขาดหาย | locale -> `en` | ช่วยให้ UI เสถียรแม้บาง key ยังไม่ได้แปล |

- เอกสารต้นทางที่ดูแลรักษาอยู่คือภาษาอังกฤษและภาษาจีนตัวย่อ และลิงก์ README ที่เผยแพร่แล้วอยู่ในส่วนหัวด้านบน
- การครอบคลุม UI locale ภายในแอปในปัจจุบันตรงกับแคตตาล็อกแบบระบุชัดในโค้ดทั้งหมด: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- English fallback ยังคงเป็นตาข่ายนิรภัยระดับ implementation แต่ส่วนติดต่อที่มองเห็นได้ซึ่งประกาศรองรับมี regression tests ครอบคลุม และไม่ควรเงียบ ๆ กลับไปใช้ภาษาอังกฤษในการใช้งานปกติ
- รายละเอียดเพิ่มเติมและแนวทางการมีส่วนร่วมติดตามได้ที่ [ศูนย์รวมภาษา](./docs/i18n/README.md)

## คุณสมบัติ

### การประมวลผลเอกสารด้วย AI
- **รองรับ Multi-LLM**: เชื่อมต่อกับผู้ให้บริการ LLM ทั้งบนคลาวด์และภายในเครื่องได้หลายราย (ดู [ผู้ให้บริการ LLM ที่รองรับ](#ผู้ให้บริการ-llm-ที่รองรับ))
- **Smart Chunking**: แบ่งเอกสารขนาดใหญ่ออกเป็นช่วงที่จัดการได้โดยอัตโนมัติตามจำนวนคำ
- **การคงรูปเนื้อหา**: พยายามรักษารูปแบบต้นฉบับไว้ขณะเพิ่มโครงสร้างและลิงก์
- **ติดตามความคืบหน้า**: แสดงอัปเดตแบบเรียลไทม์ผ่านแถบข้างของ Notemd หรือหน้าต่างความคืบหน้า
- **ยกเลิกงานได้**: ยกเลิกงานประมวลผลใดก็ได้ (เดี่ยวหรือแบบกลุ่ม) ที่เริ่มจากแถบข้างผ่านปุ่มยกเลิกเฉพาะ งานจากพาเล็ตคำสั่งจะใช้หน้าต่างโมดัลที่ยกเลิกได้เช่นกัน
- **กำหนดค่าหลายโมเดล**: ใช้ผู้ให้บริการ LLM ต่างกัน *และ* ระบุโมเดลเฉพาะสำหรับงานแต่ละประเภท (Add Links, Research, Generate Title, Translate) หรือใช้ผู้ให้บริการเดียวสำหรับทุกงานก็ได้
- **Stable API Calls (Retry Logic)**: เปิดใช้การลองใหม่อัตโนมัติสำหรับการเรียก LLM API ที่ล้มเหลว พร้อมช่วงเวลาและจำนวนครั้งที่ปรับแต่งได้
- **การทดสอบการเชื่อมต่อผู้ให้บริการที่ทนทานขึ้น**: หากการทดสอบผู้ให้บริการครั้งแรกเจอการตัดการเชื่อมต่อเครือข่ายแบบชั่วคราว Notemd จะสลับไปใช้ลำดับ retry แบบเสถียรก่อนจึงค่อยล้มเหลว ครอบคลุม transport ของ OpenAI-compatible, Anthropic, Google, Azure OpenAI และ Ollama
- **fallback ของ transport ตามสภาพแวดล้อมรันไทม์**: เมื่อคำขอผู้ให้บริการที่ใช้เวลานานถูกตัดโดย `requestUrl` จากข้อผิดพลาดเครือข่ายชั่วคราวอย่าง `ERR_CONNECTION_CLOSED` ตอนนี้ Notemd จะลองซ้ำความพยายามเดิมผ่าน transport สำรองตามสภาพแวดล้อมก่อนเข้าสู่ลูป retry ที่กำหนดไว้: บนเดสก์ท็อปจะใช้ Node `http/https` ส่วนสภาพแวดล้อมที่ไม่ใช่เดสก์ท็อปจะใช้ `fetch` ของเบราว์เซอร์ ช่วยลด false failure บน gateway และ reverse proxy ที่ช้า
- **เสริมความแข็งแรงให้ลำดับคำขอขนาดยาวของ OpenAI-compatible**: ในโหมดเสถียร การเรียก OpenAI-compatible จะใช้ลำดับ 3 ขั้นอย่างชัดเจนต่อหนึ่งความพยายาม: direct streaming transport หลัก, direct non-stream transport และ `requestUrl` fallback (ซึ่งยังอัปเกรดเป็น streamed parsing ได้เมื่อจำเป็น) ช่วยลด false negative ในกรณีที่ผู้ให้บริการตอบแบบ buffered ได้ครบแต่ streaming pipe ไม่เสถียร
- **streaming fallback แบบรู้โปรโตคอลสำหรับทุก LLM API**: ความพยายาม fallback สำหรับคำขอระยะยาวจะอัปเกรดไปใช้ streamed parsing แบบรู้โปรโตคอลในทุกเส้นทาง LLM ภายใน ไม่จำกัดเฉพาะ endpoint แบบ OpenAI-compatible ตอนนี้ Notemd รองรับ OpenAI/Azure-style SSE, Anthropic Messages streaming, Google Gemini SSE responses และ Ollama NDJSON streams ทั้งบน `http/https` ของเดสก์ท็อปและ `fetch` ของสภาพแวดล้อมที่ไม่ใช่เดสก์ท็อป ส่วน entrypoint แบบ OpenAI-style โดยตรงที่เหลือก็ใช้ shared fallback path เดียวกันนี้
- **preset พร้อมใช้งานสำหรับตลาดจีน**: preset ภายในตอนนี้ครอบคลุม `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` และ `SiliconFlow` เพิ่มจากผู้ให้บริการ global และ local เดิม
- **ประมวลผลแบบกลุ่มได้เสถียร**: ปรับปรุงตรรกะการประมวลผลพร้อมกันด้วย **การเรียก API แบบเหลื่อมเวลา** เพื่อป้องกันข้อผิดพลาด rate limit และคงประสิทธิภาพที่เสถียรในงานกลุ่มขนาดใหญ่ การทำงานแบบใหม่ทำให้แต่ละงานเริ่มต่างจังหวะกันแทนที่จะเริ่มพร้อมกันทั้งหมด
- **รายงานความคืบหน้าถูกต้องขึ้น**: แก้บั๊กที่แถบความคืบหน้าอาจค้าง ทำให้ UI สะท้อนสถานะจริงของงานเสมอ
- **การประมวลผลแบบขนานที่ทนทานขึ้น**: แก้ปัญหาที่งานกลุ่มแบบขนานหยุดก่อนเวลา ทำให้ไฟล์ทั้งหมดถูกประมวลผลได้อย่างเชื่อถือได้และมีประสิทธิภาพ
- **ความแม่นยำของแถบความคืบหน้า**: แก้บั๊กที่แถบความคืบหน้าของคำสั่ง "Create Wiki-Link & Generate Note" ค้างอยู่ที่ 95% และตอนนี้จะแสดง 100% เมื่อเสร็จสมบูรณ์
- **ดีบัก API ละเอียดขึ้น**: "API Error Debugging Mode" ตอนนี้จับ response body เต็มจากผู้ให้บริการ LLM และบริการค้นหา (Tavily/DuckDuckGo) ได้ และยังบันทึก transport timeline รายความพยายามพร้อม request URL ที่ sanitize แล้ว, เวลาที่ใช้ไป, response headers, partial response bodies, parsed partial stream content และสแต็กเทรซ เพื่อช่วย troubleshooting ได้ดีขึ้นกับ fallback ของ OpenAI-compatible, Anthropic, Google, Azure OpenAI และ Ollama
- **แผง Developer Mode**: ในการตั้งค่าตอนนี้มีแผง diagnostics สำหรับนักพัฒนาโดยเฉพาะ ซึ่งจะซ่อนไว้จนกว่าจะเปิด "Developer mode" รองรับการเลือก diagnostic call path และรัน stability probe ซ้ำตามโหมดที่เลือก
- **ออกแบบแถบข้างใหม่**: action ในตัวถูกจัดกลุ่มเป็นส่วนที่โฟกัสมากขึ้น พร้อมป้ายกำกับที่ชัดเจนขึ้น สถานะแบบสด ความคืบหน้าที่ยกเลิกได้ และ log ที่คัดลอกได้เพื่อลดความรกของแถบข้าง ส่วน footer ของ progress/log จะคงมองเห็นได้แม้ขยายทุก section แล้ว และสถานะพร้อมใช้งานจะใช้แถบ progress แบบ standby ที่ชัดเจนกว่าเดิม
- **ปรับปรุงปฏิสัมพันธ์และความอ่านง่ายของแถบข้าง**: ปุ่มในแถบข้างจะแสดง feedback ตอน hover/press/focus ชัดขึ้น และปุ่ม CTA สีสด (รวมถึง `One-Click Extract` และ `Batch generate from titles`) ใช้ความต่างของข้อความที่แรงขึ้นเพื่อให้อ่านง่ายในหลายธีม
- **กำหนด CTA เฉพาะงานไฟล์เดี่ยว**: สไตล์ CTA สีสดจะใช้กับ action ระดับไฟล์เดี่ยวเท่านั้น ส่วน action ระดับกลุ่ม/โฟลเดอร์และ workflow แบบผสมจะใช้สไตล์ที่ไม่ใช่ CTA เพื่อลดการคลิกผิดเพราะเข้าใจขอบเขต action ผิด
- **เวิร์กโฟลว์คลิกเดียวแบบกำหนดเอง**: เปลี่ยน utility ในแถบข้างที่มีมาให้เป็นปุ่มแบบใช้ซ้ำได้ โดยตั้งชื่อเองและประกอบ action chain เองได้ มี workflow เริ่มต้น `One-Click Extract` ให้พร้อมใช้ทันที


### การเสริมกราฟความรู้
- **สร้าง Wiki-Link อัตโนมัติ**: ระบุแนวคิดหลักและเพิ่ม `[[wiki-links]]` ลงในโน้ตที่ประมวลผลแล้วตามผลลัพธ์จาก LLM
- **สร้างโน้ตแนวคิด (ไม่บังคับและปรับแต่งได้)**: สร้างโน้ตใหม่สำหรับแนวคิดที่ค้นพบโดยอัตโนมัติในโฟลเดอร์ที่ระบุภายใน vault
- **กำหนด path ผลลัพธ์ได้**: ตั้ง path แบบ relative แยกกันภายใน vault สำหรับบันทึกไฟล์ที่ประมวลผลแล้วและโน้ตแนวคิดที่สร้างใหม่
- **กำหนดชื่อไฟล์ผลลัพธ์เองได้ (Add Links)**: เลือก **เขียนทับไฟล์ต้นฉบับ** ได้ หรือใช้ suffix/replacement string แบบกำหนดเองแทน `_processed.md` ตอนประมวลผลไฟล์เพื่อเพิ่มลิงก์
- **ดูแลความสมบูรณ์ของลิงก์**: มีการจัดการพื้นฐานเพื่ออัปเดตลิงก์เมื่อโน้ตถูกเปลี่ยนชื่อหรือลบภายใน vault
- **การสกัดแนวคิดล้วนๆ**: สกัดแนวคิดและสร้างโน้ตแนวคิดที่เกี่ยวข้องโดยไม่แก้ไขเอกสารต้นฉบับ เหมาะสำหรับเติมฐานความรู้จากเอกสารเดิมโดยไม่แตะต้องไฟล์ต้นทาง ฟีเจอร์นี้ปรับแต่งได้ทั้งการสร้างโน้ตแนวคิดแบบขั้นต่ำและการเพิ่ม backlink


### การแปลภาษา

- **การแปลด้วย AI**:
    - แปลเนื้อหาโน้ตโดยใช้ LLM ที่กำหนดค่าไว้
    - **รองรับไฟล์ขนาดใหญ่**: แบ่งไฟล์ขนาดใหญ่ออกเป็นช่วงย่อยโดยอัตโนมัติตามการตั้งค่า `Chunk word count` ก่อนส่งไปยัง LLM จากนั้นจะรวมผลแปลกลับเป็นเอกสารเดียวอย่างต่อเนื่อง
    - รองรับการแปลระหว่างหลายภาษา
    - ปรับแต่งภาษาเป้าหมายได้ทั้งใน settings และใน UI
    - เปิดข้อความที่แปลแล้วทางด้านขวาของต้นฉบับโดยอัตโนมัติเพื่ออ่านเทียบกันได้ง่าย
- **การแปลแบบแบตช์**:
    - แปลไฟล์ทั้งหมดภายในโฟลเดอร์ที่เลือก
    - รองรับการประมวลผลพร้อมกันเมื่อเปิด "Enable Batch Parallelism"
    - ใช้ prompt แบบกำหนดเองสำหรับการแปลได้หากมีการตั้งค่าไว้
	- เพิ่มตัวเลือก "Batch translate this folder" ในเมนูคลิกขวาของ file explorer
- **ปิดการแปลอัตโนมัติ**: เมื่อเปิดตัวเลือกนี้ งานที่ไม่ใช่ Translate จะไม่บังคับให้ผลลัพธ์ออกมาเป็นภาษาใดภาษาหนึ่งอีกต่อไป และจะคงบริบทภาษาต้นฉบับไว้ ส่วนงาน "Translate" แบบ explicit จะยังแปลตามค่าที่กำหนดไว้เหมือนเดิม


### เว็บรีเสิร์ชและการสร้างเนื้อหา
- **เว็บรีเสิร์ชและสรุปผล**:
    - ค้นหาเว็บผ่าน Tavily (ต้องใช้ API key) หรือ DuckDuckGo (experimental)
    - **เสถียรภาพการค้นหาที่ดีขึ้น**: ตอนนี้การค้นหา DuckDuckGo ใช้ตรรกะ parsing ที่ดีขึ้น (DOMParser พร้อม Regex fallback) เพื่อรับมือกับการเปลี่ยน layout และให้ผลลัพธ์ที่เชื่อถือได้
    - สรุปผลการค้นหาด้วย LLM ที่กำหนดไว้
    - ปรับภาษาเอาต์พุตของบทสรุปได้ใน settings
    - ต่อท้ายบทสรุปลงในโน้ตปัจจุบัน
    - กำหนดขีดจำกัด token สำหรับเนื้อหารีเสิร์ชที่ส่งเข้า LLM ได้
- **สร้างเนื้อหาจากชื่อเรื่อง**:
    - ใช้ชื่อโน้ตเพื่อสร้างเนื้อหาเริ่มต้นผ่าน LLM โดยแทนที่เนื้อหาเดิม
    - **รีเสิร์ชเสริมได้**: ตั้งค่าได้ว่าจะทำเว็บรีเสิร์ชหรือไม่ (โดยใช้ผู้ให้บริการที่เลือก) เพื่อส่งบริบทประกอบการสร้าง
- **สร้างเนื้อหาแบบกลุ่มจากชื่อเรื่อง**: สร้างเนื้อหาให้โน้ตทั้งหมดในโฟลเดอร์ที่เลือกตามชื่อเรื่องของแต่ละไฟล์ (เคารพการตั้งค่ารีเสิร์ชเสริม) ไฟล์ที่ประมวลผลสำเร็จจะถูกย้ายไปยัง **subfolder "complete" ที่กำหนดได้** (เช่น `[foldername]_complete` หรือชื่อที่กำหนดเอง) เพื่อหลีกเลี่ยงการประมวลผลซ้ำ
- **Mermaid Auto-Fix Coupling**: เมื่อเปิด Mermaid auto-fix แล้ว workflow ที่เกี่ยวข้องกับ Mermaid จะซ่อมไฟล์ที่สร้างหรือโฟลเดอร์ผลลัพธ์ให้อัตโนมัติหลังการประมวลผล ครอบคลุม Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid และ Translate


### ฟีเจอร์อรรถประโยชน์
- **สรุปเป็นแผนภาพ Mermaid**:
    - ฟีเจอร์นี้ช่วยสรุปเนื้อหาในโน้ตให้ออกมาเป็น Mermaid diagram
    - ปรับภาษาเอาต์พุตของ Mermaid diagram ได้ใน settings
    - **Mermaid Output Folder**: กำหนดโฟลเดอร์ที่จะบันทึกไฟล์ Mermaid diagram ที่สร้างขึ้น
    - **Translate Summarize to Mermaid Output**: เลือกแปลเนื้อหา Mermaid diagram ที่สร้างแล้วให้เป็นภาษาเป้าหมายที่กำหนดได้

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **แก้รูปแบบสูตรอย่างง่าย**:
    - แก้สูตรคณิตศาสตร์แบบบรรทัดเดียวที่คั่นด้วย `$` เดี่ยวให้เป็นบล็อก `$$` มาตรฐานได้อย่างรวดเร็ว
    - **ไฟล์เดี่ยว**: ประมวลผลไฟล์ปัจจุบันผ่านปุ่มในแถบข้างหรือผ่านพาเล็ตคำสั่ง
    - **แก้แบบกลุ่ม**: ประมวลผลทุกไฟล์ในโฟลเดอร์ที่เลือกผ่านปุ่มในแถบข้างหรือผ่านพาเล็ตคำสั่ง

- **ตรวจหาคำซ้ำในไฟล์ปัจจุบัน**: คำสั่งนี้ช่วยระบุคำหรือคำศัพท์ที่อาจซ้ำกันภายในไฟล์ที่กำลังเปิดอยู่
- **ตรวจจับรายการซ้ำ**: ตรวจสอบคำซ้ำในเนื้อหาของไฟล์ที่เพิ่งประมวลผลแบบพื้นฐาน (ผลลัพธ์จะบันทึกใน console)
- **Check and Remove Duplicate Concept Notes**: ระบุโน้ตที่อาจซ้ำกันภายใน **Concept Note Folder** ที่กำหนดไว้ โดยอิงจากชื่อที่ตรงกันแบบเป๊ะ รูปพหูพจน์ การ normalize และการมีคำเดี่ยวซ้อนทับกันเมื่อเทียบกับโน้ตนอกโฟลเดอร์ดังกล่าว ขอบเขตการเปรียบเทียบ (ว่าจะตรวจโน้ตนอก concept folder ใดบ้าง) ปรับได้เป็น **ทั้ง vault**, **เฉพาะโฟลเดอร์ที่รวมไว้**, หรือ **ทุกโฟลเดอร์ยกเว้นบางโฟลเดอร์** จากนั้นจะแสดงรายการรายละเอียดพร้อมเหตุผลและไฟล์ที่ชนกัน และขอการยืนยันก่อนย้ายรายการซ้ำที่พบไปยัง system trash พร้อมแสดงความคืบหน้าระหว่างลบ
- **Batch Mermaid Fix**: ใช้การแก้ syntax ของ Mermaid และ LaTeX กับไฟล์ Markdown ทุกไฟล์ภายในโฟลเดอร์ที่ผู้ใช้เลือก
    - **พร้อมใช้ใน workflow**: ใช้เป็น utility เดี่ยวๆ หรือใช้เป็นขั้นตอนหนึ่งในปุ่ม workflow แบบคลิกเดียวที่กำหนดเองก็ได้
    - **รายงานข้อผิดพลาด**: สร้างรายงาน `mermaid_error_{foldername}.md` แสดงรายการไฟล์ที่ยังคงมี Mermaid error ที่อาจเป็นไปได้หลังประมวลผล
    - **ย้ายไฟล์ที่มี error**: เลือกย้ายไฟล์ที่ยังตรวจพบ error ไปยังโฟลเดอร์เฉพาะสำหรับตรวจสอบด้วยมือได้
    - **Smart Detection**: ตอนนี้ตรวจไฟล์ด้วย `mermaid.parse` อย่างชาญฉลาดก่อนพยายามแก้ syntax ช่วยประหยัดเวลาประมวลผลและหลีกเลี่ยงการแก้ไฟล์โดยไม่จำเป็น
    - **การประมวลผลอย่างปลอดภัย**: รับประกันว่าการแก้ syntax จะทำเฉพาะภายใน Mermaid code block เท่านั้น ป้องกันการแก้ Markdown table หรือเนื้อหาอื่นโดยไม่ตั้งใจ และมีมาตรการป้องกันเพิ่มเติมเพื่อไม่ให้ syntax ของตาราง (เช่น `| :--- |`) ถูกแก้แรงเกินไปจาก debug fix
    - **Deep Debug Mode**: หากยังมี error หลังการแก้รอบแรก จะเข้าสู่โหมด deep debug ขั้นสูงเพื่อจัดการ edge case ที่ซับซ้อน เช่น
        - **รวมคอมเมนต์เข้ากับ label**: รวมคอมเมนต์ท้ายบรรทัด (ขึ้นต้นด้วย `%`) เข้าไปใน edge label โดยอัตโนมัติ (เช่น `A -- Label --> B; % Comment` จะกลายเป็น `A -- "Label(Comment)" --> B;`)
        - **ลูกศรผิดรูป**: แก้ลูกศรที่ถูกดูดเข้าไปในเครื่องหมายคำพูด (เช่น `A -- "Label -->" B` จะกลายเป็น `A -- "Label" --> B`)
        - **Inline Subgraphs**: แปลง inline subgraph label ให้กลายเป็น edge label
        - **Reverse Arrow Fix**: แก้ลูกศร `X <-- Y` ที่ไม่เป็นมาตรฐานให้เป็น `Y --> X`
        - **Direction Keyword Fix**: บังคับให้คำว่า `direction` เป็นตัวพิมพ์เล็กภายใน subgraph (เช่น `Direction TB` -> `direction TB`)
        - **Comment Conversion**: แปลงคอมเมนต์ `//` ให้เป็น edge label (เช่น `A --> B; // Comment` -> `A -- "Comment" --> B;`)
        - **Duplicate Label Fix**: ทำ label แบบวงเล็บซ้ำให้เรียบง่ายขึ้น (เช่น `Node["Label"]["Label"]` -> `Node["Label"]`)
        - **Invalid Arrow Fix**: แปลง syntax ลูกศรที่ไม่ถูกต้อง `--|>` ให้เป็น `-->` มาตรฐาน
        - **จัดการ label และ note ได้ทนทานขึ้น**: ปรับปรุงการจัดการ label ที่มีอักขระพิเศษ (เช่น `/`) และรองรับ syntax note แบบกำหนดเอง (`note for ...`) ได้ดีขึ้น เพื่อให้สิ่งตกค้างอย่างวงเล็บปิดท้ายถูกลบออกอย่างสะอาด
        - **Advanced Fix Mode**: มีการแก้ไขที่ทนทานสำหรับ node label ที่ไม่มีเครื่องหมายคำพูดแต่มีช่องว่าง อักขระพิเศษ หรือวงเล็บซ้อน (เช่น `Node[Label [Text]]` -> `Node["Label [Text]"]`) เพื่อรองรับ diagram ซับซ้อนอย่างเส้นทาง Stellar Evolution และยังแก้ edge label ที่ผิดรูป (เช่น `--["Label["-->` เป็น `-- "Label" -->`) เพิ่มเติมยังแปลง inline comments (`Consensus --> Adaptive; # Some advanced consensus` เป็น `Consensus -- "Some advanced consensus" --> Adaptive`) และแก้เครื่องหมายคำพูดที่ปิดไม่ครบตอนท้ายบรรทัด (`;"` ที่ท้ายบรรทัดจะถูกแทนด้วย `"]`)
                        - **Note Conversion**: แปลง `note right/left of` และคอมเมนต์ `note :` แบบเดี่ยวให้เป็น Mermaid node definition และ connection แบบมาตรฐานโดยอัตโนมัติ (เช่น `note right of A: text` จะกลายเป็น `NoteA["Note: text"]` และลิงก์เข้ากับ `A`) ช่วยป้องกัน syntax error และทำให้ layout ดีขึ้น ตอนนี้รองรับทั้งลิงก์แบบลูกศร (`-->`) และลิงก์แบบเส้นทึบ (`---`)
                        - **รองรับ note เพิ่มเติม**: แปลง `note for Node "Content"` และ `note of Node "Content"` ให้เป็น linked note node แบบมาตรฐานโดยอัตโนมัติ (เช่น `NoteNode[" Content"]` ลิงก์กับ `Node`) เพื่อให้เข้ากันได้กับ syntax ส่วนขยายของผู้ใช้
                        - **การแก้ note ที่ดีขึ้น**: เปลี่ยนชื่อ note ให้มีเลขลำดับ (`Note1`, `Note2`) โดยอัตโนมัติ เพื่อหลีกเลี่ยงปัญหา alias ซ้ำเมื่อมีหลาย note                - **Parallelogram/Shape Fix**: แก้ node shape ที่ผิดรูปอย่าง `[/["Label["/]` ให้เป็น `["Label"]` มาตรฐาน เพื่อให้ใช้กับเนื้อหาที่สร้างขึ้นได้
                        - **ปรับมาตรฐาน pipe labels**: แก้และจัดรูป edge label ที่มี pipe ให้เป็นแบบมีเครื่องหมายคำพูดอย่างถูกต้องโดยอัตโนมัติ (เช่น `-->|Text|` จะกลายเป็น `-->|"Text"|` และ `-->|Math|^2|` จะกลายเป็น `-->|"Math|^2"|`)
        - **Misplaced Pipe Fix**: แก้ edge label ที่วางผิดตำแหน่งก่อนลูกศร (เช่น `>|"Label"| A --> B` จะกลายเป็น `A -->|"Label"| B`)
                - **Merge Double Labels**: ตรวจจับและรวม label ซ้อนบน edge เดียวกัน (เช่น `A -- Label1 -- Label2 --> B` หรือ `A -- Label1 -- Label2 --- B`) ให้เป็น label เดียวแบบสะอาดพร้อมตัวแบ่งบรรทัด (`A -- "Label1<br>Label2" --> B`)
                        - **Unquoted Label Fix**: ใส่เครื่องหมายคำพูดให้ node label ที่มีอักขระที่ก่อปัญหาได้ (เช่น เครื่องหมายคำพูด เครื่องหมายเท่ากับ เครื่องหมายคณิตศาสตร์) แต่ยังไม่มีเครื่องหมายคำพูดภายนอก (เช่น `Plot[Plot "A"]` จะกลายเป็น `Plot["Plot "A""]`) เพื่อป้องกัน render error
                        - **Intermediate Node Fix**: แยก edge ที่มีการนิยาม intermediate node อยู่ภายในออกเป็นสอง edge แยกกัน (เช่น `A -- B[...] --> C` จะกลายเป็น `A --> B[...]` และ `B[...] --> C`) เพื่อให้เป็น Mermaid syntax ที่ถูกต้อง
                        - **Concatenated Label Fix**: แก้ node definition ที่ ID ถูกนำไปต่อชนกับ label อย่างทนทาน (เช่น `SubdivideSubdivide...` จะกลายเป็น `Subdivide["Subdivide..."]`) แม้จะมี pipe label นำหน้าหรือการซ้ำไม่ตรงกันเป๊ะ โดยอาศัยการตรวจสอบกับ node ID ที่รู้จักอยู่แล้ว
                        - **Extract Specific Original Text**:    - กำหนดรายการคำถามใน settings
                    - ดึงข้อความต้นฉบับแบบ verbatim จากโน้ตที่กำลังเปิดอยู่ซึ่งตอบคำถามเหล่านั้น
                    - **Merged Query Mode**: ตัวเลือกสำหรับประมวลผลทุกคำถามในการเรียก API เดียวเพื่อประสิทธิภาพที่ดีขึ้น
                    - **Translation**: ตัวเลือกในการเพิ่มคำแปลของข้อความที่ดึงมาไว้ในผลลัพธ์
                    - **Custom Output**: กำหนด path การบันทึกและ suffix ของชื่อไฟล์สำหรับไฟล์ข้อความที่ดึงออกมาได้- **LLM Connection Test**: ตรวจสอบการตั้งค่า API ของผู้ให้บริการที่ใช้งานอยู่


## การติดตั้ง

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### จาก Obsidian Marketplace (แนะนำ)
1. เปิด Obsidian **Settings** → **Community plugins**
2. ตรวจสอบว่า "Restricted mode" เป็น **off**
3. คลิก **Browse** community plugins แล้วค้นหา "Notemd"
4. คลิก **Install**
5. เมื่อติดตั้งเสร็จ ให้คลิก **Enable**

### ติดตั้งด้วยตนเอง
1. ดาวน์โหลด asset ของ release ล่าสุดจาก [หน้า GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) แต่ละ release จะมี `README.md` สำหรับอ้างอิงในแพ็กเกจด้วย แต่การติดตั้งด้วยตนเองต้องใช้เพียง `main.js`, `styles.css` และ `manifest.json`
2. ไปยังโฟลเดอร์การตั้งค่าของ Obsidian vault ของคุณ: `<YourVault>/.obsidian/plugins/`
3. สร้างโฟลเดอร์ใหม่ชื่อ `notemd`
4. คัดลอก `main.js`, `styles.css` และ `manifest.json` ไปไว้ในโฟลเดอร์ `notemd`
5. รีสตาร์ต Obsidian
6. ไปที่ **Settings** → **Community plugins** แล้วเปิดใช้ "Notemd"

## การกำหนดค่า

เข้าถึงการตั้งค่าปลั๊กอินผ่าน:
**Settings** → **Community Plugins** → **Notemd** (คลิกไอคอนรูปเฟือง)

### การกำหนดค่าผู้ให้บริการ LLM
1.  **ผู้ให้บริการที่ใช้งานอยู่**: เลือกผู้ให้บริการ LLM ที่คุณต้องการใช้จากเมนูแบบเลื่อนลง
2.  **การตั้งค่าผู้ให้บริการ**: ตั้งค่ารายละเอียดเฉพาะของผู้ให้บริการที่เลือก:
    *   **API Key**: จำเป็นสำหรับผู้ให้บริการคลาวด์ส่วนใหญ่ (เช่น OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty) ไม่จำเป็นสำหรับ Ollama และเป็น optional สำหรับ LM Studio และ preset แบบ generic `OpenAI Compatible` เมื่อ endpoint ของคุณยอมรับ anonymous หรือ placeholder access
    *   **Base URL / Endpoint**: API endpoint ของบริการ โดยมีค่าเริ่มต้นให้ แต่คุณอาจต้องเปลี่ยนค่านี้สำหรับโมเดลในเครื่อง (LMStudio, Ollama), gateway (OpenRouter, Requesty, OpenAI Compatible) หรือ Azure deployment เฉพาะ **จำเป็นสำหรับ Azure OpenAI**
    *   **Model**: ชื่อ/ID ของโมเดลที่ต้องการใช้ (เช่น `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`) ตรวจสอบให้แน่ใจว่าโมเดลนั้นมีอยู่ที่ endpoint/ผู้ให้บริการของคุณ
    *   **Temperature**: ควบคุมระดับความสุ่มของผลลัพธ์จาก LLM (0=กำหนดแน่นอน, 1=สร้างสรรค์สูงสุด) ค่าต่ำกว่า (เช่น 0.2-0.5) มักเหมาะกว่าสำหรับงานที่มีโครงสร้าง
    *   **API Version (Azure Only)**: จำเป็นสำหรับ Azure OpenAI deployment (เช่น `2024-02-15-preview`)
3.  **ทดสอบการเชื่อมต่อ**: ใช้ปุ่ม "ทดสอบการเชื่อมต่อ" สำหรับผู้ให้บริการที่กำลังใช้งานเพื่อตรวจสอบการตั้งค่า ผู้ให้บริการ OpenAI-compatible ตอนนี้ใช้การตรวจสอบแบบรู้จักผู้ให้บริการ: endpoint เช่น `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` และ `OpenAI Compatible` จะ probe `chat/completions` โดยตรง ขณะที่ผู้ให้บริการที่มี `/models` endpoint ที่เชื่อถือได้ยังสามารถลองดึงรายชื่อโมเดลก่อน หาก probe แรกพลาดเพราะการตัดการเชื่อมต่อเครือข่ายชั่วคราว เช่น `ERR_CONNECTION_CLOSED` Notemd จะ fallback ไปใช้ stable retry sequence โดยอัตโนมัติแทนการล้มเหลวทันที
4.  **จัดการการกำหนดค่าผู้ให้บริการ**: ใช้ปุ่ม "ส่งออกผู้ให้บริการ" และ "นำเข้าผู้ให้บริการ" เพื่อบันทึก/โหลดการตั้งค่าผู้ให้บริการ LLM ของคุณไปยัง/จากไฟล์ `notemd-providers.json` ภายในไดเรกทอรีการกำหนดค่าของปลั๊กอิน ช่วยให้สำรองข้อมูลและแชร์ได้ง่าย
5.  **ขอบเขตของพรีเซ็ต**: นอกเหนือจากผู้ให้บริการดั้งเดิมแล้ว ตอนนี้ Notemd ยังมี preset สำหรับ `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` และปลายทาง generic `OpenAI Compatible` สำหรับ LiteLLM, vLLM, Perplexity, Vercel AI Gateway หรือ proxy แบบกำหนดเอง
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### การกำหนดค่าหลายโมเดล
-   **ใช้ผู้ให้บริการที่แตกต่างกันสำหรับแต่ละงาน**:
    *   **ปิด (ค่าเริ่มต้น)**: ใช้ "ผู้ให้บริการที่ใช้งานอยู่" เพียงตัวเดียว (ที่เลือกไว้ด้านบน) สำหรับทุกงาน
    *   **เปิด**: ให้คุณเลือกผู้ให้บริการเฉพาะ *และ* เลือกระบุชื่อโมเดล override แยกตามงานได้ ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts") หากปล่อยช่อง model override ของงานนั้นว่างไว้ ระบบจะใช้โมเดล default ของผู้ให้บริการที่เลือกสำหรับงานนั้น
-   **เลือกภาษาที่แตกต่างกันสำหรับแต่ละงาน**:
    *   **ปิด (ค่าเริ่มต้น)**: ใช้ภาษาผลลัพธ์เพียงค่าเดียวสำหรับทุกงาน
    *   **เปิด**: ให้คุณเลือกภาษาเฉพาะสำหรับแต่ละงาน ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts")

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### สถาปัตยกรรมภาษา (ภาษาส่วนติดต่อและภาษาผลลัพธ์ของงาน)

-   **ภาษาส่วนติดต่อ** ควบคุมเฉพาะข้อความอินเทอร์เฟซของปลั๊กอิน (ป้ายกำกับในการตั้งค่า ปุ่มในแถบข้าง การแจ้งเตือน และกล่องโต้ตอบ) ค่าเริ่มต้น `auto` จะตามภาษาของ UI ใน Obsidian ปัจจุบัน
-   รูปแบบแปรผันตามภูมิภาคหรือระบบอักษรจะถูกจับคู่ไปยังชุดภาษาที่เผยแพร่ซึ่งใกล้ที่สุด แทนที่จะถอยกลับไปเป็นภาษาอังกฤษทันที ตัวอย่างเช่น `fr-CA` ใช้ภาษาฝรั่งเศส `es-419` ใช้ภาษาสเปน `pt-PT` ใช้ภาษาโปรตุเกส `zh-Hans` ใช้ภาษาจีนตัวย่อ และ `zh-Hant-HK` ใช้ภาษาจีนตัวเต็ม
-   **ภาษาผลลัพธ์ของงาน** ควบคุมผลลัพธ์ของงานที่โมเดลสร้างขึ้น (ลิงก์ บทสรุป การสร้างชื่อเรื่อง บทสรุป Mermaid การสกัดแนวคิด และภาษาเป้าหมายของการแปล)
-   **โหมดภาษาแยกตามงาน** ทำให้งานแต่ละงานกำหนดภาษาผลลัพธ์ผ่านชั้นนโยบายเดียว แทนที่จะใช้ค่าทับซ้อนกระจัดกระจายในแต่ละโมดูล
-   **ปิดการแปลอัตโนมัติ** ช่วยให้งานที่ไม่ใช่ Translate คงบริบทภาษาต้นฉบับไว้ ขณะที่งาน Translate แบบ explicit จะยังคงบังคับใช้ภาษาเป้าหมายที่ตั้งไว้
-   เส้นทางการสร้างที่เกี่ยวกับ Mermaid จะใช้นโยบายภาษาเดียวกัน และยังคงเรียก Mermaid auto-fix ได้เมื่อเปิดใช้งาน

### การตั้งค่าการเรียก API แบบเสถียร
-   **เปิดใช้การเรียก API ที่เสถียร (ตรรกะการลองใหม่)**:
    *   **ปิด (ค่าเริ่มต้น)**: หากการเรียก API ครั้งเดียวล้มเหลว งานปัจจุบันจะหยุดทันที
    *   **เปิด**: ลองใหม่สำหรับการเรียก LLM API ที่ล้มเหลวโดยอัตโนมัติ (มีประโยชน์เมื่อมีปัญหาเครือข่ายเป็นครั้งคราวหรือเจอ rate limit)
    *   **Connection Test Fallback**: แม้การเรียกปกติจะยังไม่ได้อยู่ใน stable mode การทดสอบการเชื่อมต่อของผู้ให้บริการก็จะสลับเข้าสู่ลำดับ retry เดียวกันหลังเจอความล้มเหลวจากเครือข่ายชั่วคราวครั้งแรก
    *   **Runtime Transport Fallback (Environment-Aware)**: คำขอของงานที่ใช้เวลานานและถูกตัดชั่วคราวโดย `requestUrl` จะลองความพยายามเดิมอีกครั้งผ่าน fallback ตามสภาพแวดล้อมก่อน เดสก์ท็อปจะใช้ Node `http/https`; สภาพแวดล้อมที่ไม่ใช่เดสก์ท็อปจะใช้ `fetch` ของเบราว์เซอร์ และ fallback เหล่านั้นตอนนี้ใช้ protocol-aware streaming parsing ครอบคลุมทุกเส้นทาง LLM ภายใน ทั้ง OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE และ Ollama NDJSON output ทำให้ gateway ที่ช้าสามารถคืน body chunks ได้เร็วขึ้น ส่วน entrypoint แบบ OpenAI-style โดยตรงที่เหลือก็ใช้ shared fallback path เดียวกัน
    *   **OpenAI-Compatible Stable Order**: ใน stable mode ความพยายามของ OpenAI-compatible แต่ละครั้งจะใช้ลำดับ `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` ก่อนจะนับว่าเป็นความพยายามที่ล้มเหลว ช่วยไม่ให้ระบบตัดสินว่าล้มเหลวเร็วเกินไปเมื่อมีเพียง transport mode บางตัวที่ไม่เสถียร
-   **Retry Interval (seconds)**: (แสดงเมื่อเปิดใช้งานเท่านั้น) เวลาระหว่างการลองใหม่แต่ละครั้ง (1-300 วินาที) ค่าเริ่มต้น: 5
-   **Maximum Retries**: (แสดงเมื่อเปิดใช้งานเท่านั้น) จำนวนครั้งสูงสุดที่อนุญาตให้ลองใหม่ (0-10) ค่าเริ่มต้น: 3
-   **โหมดดีบักข้อผิดพลาดของ API**:
    *   **ปิด (ค่าเริ่มต้น)**: ใช้การรายงานข้อผิดพลาดแบบมาตรฐานและกระชับ
    *   **เปิด**: เปิดการบันทึกข้อผิดพลาดแบบละเอียด (คล้าย verbose output ของ DeepSeek) สำหรับทุกผู้ให้บริการและทุกงาน (รวมถึง Translate, Search และ Connection Tests) ซึ่งรวมถึง HTTP status codes, raw response text, request transport timelines, request URLs และ headers ที่ sanitize แล้ว, เวลาของแต่ละความพยายาม, response headers, partial response bodies, parsed partial stream output และสแต็กเทรซ ซึ่งจำเป็นมากสำหรับ troubleshooting ปัญหาการเชื่อมต่อ API และการรีเซ็ตของ upstream gateway
-   **Developer Mode**:
    *   **ปิด (ค่าเริ่มต้น)**: ซ่อน control ด้าน diagnostics ที่ใช้เฉพาะนักพัฒนาทั้งหมดจากผู้ใช้ทั่วไป
    *   **เปิด**: แสดงแผง developer diagnostics โดยเฉพาะใน Settings
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: เลือก runtime path ต่อหนึ่ง probe ได้ ผู้ให้บริการ OpenAI-compatible รองรับโหมดบังคับเพิ่มเติม (`direct streaming`, `direct buffered`, `requestUrl-only`) นอกเหนือจาก runtime modes
    *   **Run Diagnostic**: รัน long-request probe หนึ่งครั้งด้วย call mode ที่เลือก แล้วเขียน `Notemd_Provider_Diagnostic_*.txt` ไว้ที่ root ของ vault
    *   **Run Stability Test**: รัน probe ซ้ำตามจำนวนรอบที่กำหนดได้ (1-10) โดยใช้ call mode ที่เลือก แล้วบันทึกรายงานเสถียรภาพแบบรวม
    *   **Diagnostic Timeout**: กำหนด timeout ต่อรอบได้ (15-3600 วินาที)
    *   **เหตุผลที่ควรใช้**: เร็วกว่าการลองทำซ้ำด้วยมือ เมื่อผู้ให้บริการผ่าน "Test connection" แต่ล้มเหลวกับงานจริงที่ใช้เวลานาน (เช่น การแปลผ่าน gateway ที่ช้า)
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### การตั้งค่าทั่วไป

#### ผลลัพธ์ของไฟล์ที่ประมวลผลแล้ว
-   **Customize Processed File Save Path**:
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ที่ประมวลผลแล้ว (เช่น `YourNote_processed.md`) จะถูกบันทึกไว้ใน *โฟลเดอร์เดียวกัน* กับโน้ตต้นฉบับ
    *   **เปิด**: ให้คุณระบุตำแหน่งบันทึกแบบกำหนดเองได้
-   **Processed File Folder Path**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น) กรอก *path แบบ relative* ภายใน vault ของคุณ (เช่น `Processed Notes` หรือ `Output/LLM`) ที่ต้องการใช้บันทึกไฟล์ที่ประมวลผลแล้ว ระบบจะสร้างโฟลเดอร์ให้หากยังไม่มี **ห้ามใช้ path แบบ absolute (เช่น C:\...) หรืออักขระที่ไม่ถูกต้อง**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ที่สร้างจากคำสั่ง 'Add Links' จะใช้ suffix เริ่มต้น `_processed.md` (เช่น `YourNote_processed.md`)
    *   **เปิด**: ให้คุณกำหนดชื่อไฟล์ผลลัพธ์เองผ่านการตั้งค่าด้านล่าง
-   **Custom Suffix/Replacement String**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น) กรอกสตริงที่ต้องการใช้สำหรับชื่อไฟล์ผลลัพธ์
    *   หากปล่อยให้ **ว่าง** ระบบจะ **เขียนทับ** ไฟล์ต้นฉบับด้วยเนื้อหาที่ประมวลผลแล้ว
    *   หากกรอกสตริง (เช่น `_linked`) ระบบจะนำไปต่อท้ายชื่อฐานเดิม (เช่น `YourNote_linked.md`) ตรวจสอบให้แน่ใจว่า suffix ไม่มีอักขระที่ใช้เป็นชื่อไฟล์ไม่ได้

-   **Remove Code Fences on Add Links**:
    *   **ปิด (ค่าเริ่มต้น)**: จะเก็บ code fences **(\`\\\`\`)** ไว้ในเนื้อหาระหว่างเพิ่มลิงก์ และ **(\`\\\`markdown)** จะถูกลบออกโดยอัตโนมัติ
    *   **เปิด**: ลบ code fences ออกจากเนื้อหาก่อนทำการเพิ่มลิงก์
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### ผลลัพธ์ของโน้ตแนวคิด
-   **Customize Concept Note Path**:
    *   **ปิด (ค่าเริ่มต้น)**: ปิดการสร้างโน้ตสำหรับ `[[linked concepts]]` แบบอัตโนมัติ
    *   **เปิด**: ให้คุณระบุโฟลเดอร์สำหรับสร้างโน้ตแนวคิดใหม่ได้
-   **Concept Note Folder Path**: (แสดงเมื่อเปิดการปรับแต่งข้างต้นเท่านั้น) กรอก *path แบบ relative* ภายใน vault ของคุณ (เช่น `Concepts` หรือ `Generated/Topics`) ที่ต้องการใช้บันทึกโน้ตแนวคิดใหม่ ระบบจะสร้างโฟลเดอร์ให้หากยังไม่มี **ต้องกรอกหากเปิดใช้การปรับแต่ง** และ **ห้ามใช้ path แบบ absolute หรืออักขระที่ไม่ถูกต้อง**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### ผลลัพธ์ไฟล์บันทึกแนวคิด
-   **Generate Concept Log File**:
    *   **ปิด (ค่าเริ่มต้น)**: จะไม่สร้างไฟล์ log
    *   **เปิด**: สร้างไฟล์ log ที่แสดงรายการโน้ตแนวคิดใหม่หลังการประมวลผล โดยมีรูปแบบดังนี้:
        ```
        สร้างไฟล์ md แนวคิด xx ไฟล์
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (แสดงเมื่อเปิด "Generate Concept Log File" เท่านั้น)
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ log จะถูกบันทึกไว้ใน **Concept Note Folder Path** (ถ้ามีระบุ) หรือที่ root ของ vault หากไม่มี
    *   **เปิด**: ให้คุณระบุโฟลเดอร์สำหรับไฟล์ log เองได้
-   **Concept Log Folder Path**: (แสดงเมื่อเปิด "Customize Log File Save Path" เท่านั้น) กรอก *path แบบ relative* ภายใน vault ของคุณ (เช่น `Logs/Notemd`) ที่ต้องการใช้บันทึกไฟล์ log **ต้องกรอกหากเปิดใช้การปรับแต่ง**
-   **Customize Log File Name**: (แสดงเมื่อเปิด "Generate Concept Log File" เท่านั้น)
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ log จะใช้ชื่อ `Generate.log`
    *   **เปิด**: ให้คุณกำหนดชื่อไฟล์ log เองได้
-   **Concept Log File Name**: (แสดงเมื่อเปิด "Customize Log File Name" เท่านั้น) กรอกชื่อไฟล์ที่ต้องการ (เช่น `ConceptCreation.log`) **ต้องกรอกหากเปิดใช้การปรับแต่ง**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### งานสกัดแนวคิด
-   **สร้างโน้ตแนวคิดแบบสั้นที่สุด**:
    *   **On (Default)**: โน้ตแนวคิดที่สร้างใหม่จะมีเฉพาะชื่อเรื่องเท่านั้น (เช่น `# Concept`)
    *   **Off**: โน้ตแนวคิดอาจมีเนื้อหาเพิ่มเติม เช่น backlink "Linked From" หากไม่ได้ปิดไว้ด้วยการตั้งค่าด้านล่าง
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: จะไม่เพิ่ม backlink กลับไปยังเอกสารต้นทางในโน้ตแนวคิดระหว่างการสกัด
    *   **On**: เพิ่มส่วน "Linked From" พร้อม backlink ไปยังไฟล์ต้นทาง

#### การดึงข้อความต้นฉบับเฉพาะส่วน
-   **Questions for extraction**: กรอกรายการคำถาม (หนึ่งคำถามต่อบรรทัด) ที่คุณต้องการให้ AI ดึงคำตอบแบบ verbatim จากโน้ตของคุณ
-   **Translate output to corresponding language**:
    *   **Off (Default)**: แสดงเฉพาะข้อความที่ดึงมาในภาษาต้นฉบับ
    *   **On**: ต่อท้ายคำแปลของข้อความที่ดึงมาในภาษาที่เลือกสำหรับงานนี้
-   **Merged query mode**:
    *   **Off**: ประมวลผลแต่ละคำถามแยกกัน (แม่นยำสูงกว่าแต่ใช้ API call มากกว่า)
    *   **On**: ส่งคำถามทั้งหมดใน prompt เดียว (เร็วกว่าและใช้ API call น้อยกว่า)
-   **Customise extracted text save path & filename**:
    *   **Off**: บันทึกไว้ในโฟลเดอร์เดียวกับไฟล์ต้นฉบับโดยใช้ suffix `_Extracted`
    *   **On**: ให้คุณกำหนดโฟลเดอร์ปลายทางและ suffix ของชื่อไฟล์เองได้

#### การซ่อม Mermaid แบบกลุ่ม
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: จะไม่ตรวจหา error หลังประมวลผล
    *   **On**: สแกนไฟล์ที่ประมวลผลแล้วเพื่อหา Mermaid syntax error ที่ยังคงเหลืออยู่ และสร้างรายงาน `mermaid_error_{foldername}.md`
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: ไฟล์ที่มี error จะคงอยู่ที่เดิม
    *   **On**: ย้ายไฟล์ที่ยังมี Mermaid syntax error หลังพยายามแก้ไปยังโฟลเดอร์เฉพาะสำหรับตรวจสอบด้วยมือ
-   **Mermaid error folder path**: (แสดงเมื่อเปิดตัวเลือกด้านบน) โฟลเดอร์สำหรับย้ายไฟล์ที่มี error ไปเก็บ

#### พารามิเตอร์การประมวลผล
-   **Enable Batch Parallelism**:
    *   **ปิด (ค่าเริ่มต้น)**: งานประมวลผลแบบกลุ่ม (เช่น "Process Folder" หรือ "Batch Generate from Titles") จะประมวลผลทีละไฟล์แบบอนุกรม
    *   **เปิด**: อนุญาตให้ปลั๊กอินประมวลผลหลายไฟล์พร้อมกัน ซึ่งช่วยเร่งงานกลุ่มขนาดใหญ่ได้มาก
-   **Batch Concurrency**: (แสดงเมื่อเปิด parallelism เท่านั้น) กำหนดจำนวนไฟล์สูงสุดที่ประมวลผลพร้อมกัน ยิ่งค่าสูงอาจยิ่งเร็วแต่ใช้ทรัพยากรมากขึ้นและอาจชน rate limit ของ API ได้ (ค่าเริ่มต้น: 1, ช่วง: 1-20)
-   **Batch Size**: (แสดงเมื่อเปิด parallelism เท่านั้น) จำนวนไฟล์ที่จะจัดรวมเป็นหนึ่ง batch (ค่าเริ่มต้น: 50, ช่วง: 10-200)
-   **Delay Between Batches (ms)**: (แสดงเมื่อเปิด parallelism เท่านั้น) ระยะหน่วงเป็นมิลลิวินาทีระหว่างแต่ละ batch เพื่อช่วยจัดการ rate limit ของ API ได้ (ค่าเริ่มต้น: 1000ms)
-   **API Call Interval (ms)**: ระยะหน่วงขั้นต่ำเป็นมิลลิวินาที *ก่อนและหลัง* การเรียก LLM API แต่ละครั้ง สำคัญมากสำหรับ API ที่รับอัตราต่ำหรือเพื่อหลีกเลี่ยง 429 ตั้งเป็น 0 เพื่อไม่เพิ่มดีเลย์เทียม (ค่าเริ่มต้น: 500ms)
-   **Chunk Word Count**: จำนวนคำสูงสุดต่อ chunk ที่ส่งเข้า LLM ส่งผลต่อจำนวน API call สำหรับไฟล์ขนาดใหญ่ (ค่าเริ่มต้น: 3000)
-   **Enable Duplicate Detection**: เปิด/ปิดการตรวจคำซ้ำภายในเนื้อหาที่ประมวลผลแล้วแบบพื้นฐาน (ผลลัพธ์ดูใน console) (ค่าเริ่มต้น: เปิด)
-   **Max Tokens**: จำนวน token สูงสุดที่ LLM ควรสร้างต่อ response chunk มีผลต่อค่าใช้จ่ายและความละเอียด (ค่าเริ่มต้น: 4096)
<img width="795" height="274" alt="พารามิเตอร์การประมวลผล   การตั้งค่าภาษา" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### การแปลภาษา
-   **Default Target Language**: เลือกภาษาเริ่มต้นที่คุณต้องการใช้แปลโน้ตของคุณ ค่านี้ override ได้จาก UI ตอนรันคำสั่งแปล (ค่าเริ่มต้น: English)
-   **Customise Translation File Save Path**:
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ที่แปลแล้วจะถูกบันทึกไว้ใน *โฟลเดอร์เดียวกัน* กับโน้ตต้นฉบับ
    *   **เปิด**: ให้คุณระบุ *path แบบ relative* ภายใน vault (เช่น `Translations`) ที่จะใช้บันทึกไฟล์แปล ระบบจะสร้างโฟลเดอร์ให้หากยังไม่มี
-   **Use custom suffix for translated files**:
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์แปลจะใช้ suffix เริ่มต้น `_translated.md` (เช่น `YourNote_translated.md`)
    *   **เปิด**: ให้คุณกำหนด suffix เองได้
-   **Custom Suffix**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น) กรอก suffix ที่ต้องการนำไปต่อท้ายชื่อไฟล์แปล (เช่น `_es` หรือ `_fr`)
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### การสร้างเนื้อหา
-   **Enable Research in "Generate from Title"**:
    *   **ปิด (ค่าเริ่มต้น)**: "Generate from Title" จะใช้เพียงชื่อเรื่องเป็นอินพุต
    *   **เปิด**: ทำเว็บรีเสิร์ชผ่าน **Web Research Provider** ที่กำหนด แล้วใส่ผลลัพธ์เป็นบริบทให้ LLM ระหว่างการสร้างจากชื่อเรื่อง
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **เปิด (ค่าเริ่มต้น)**: รันขั้นตอนแก้ Mermaid syntax โดยอัตโนมัติหลัง workflow ที่เกี่ยวกับ Mermaid เช่น Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid และ Translate
    *   **Disabled**: ปล่อยผลลัพธ์ Mermaid ที่สร้างไว้ตามเดิม เว้นแต่คุณจะรัน `Batch Mermaid Fix` ด้วยตัวเองหรือเพิ่มไว้ใน workflow แบบกำหนดเอง
-   **Output Language**: (ใหม่) เลือกภาษาผลลัพธ์ที่ต้องการสำหรับงาน "Generate from Title" และ "Batch Generate from Title"
    *   **English (Default)**: ประมวลผล prompt และส่งออกเป็นภาษาอังกฤษ
    *   **ภาษาอื่น**: LLM จะถูกสั่งให้ใช้การให้เหตุผลภายในเป็นภาษาอังกฤษ แต่ส่งเอกสารผลลัพธ์สุดท้ายในภาษาที่คุณเลือก (เช่น Español, Français, 简体中文, 繁體中文, العربية, हिन्दी ฯลฯ)
-   **Change Prompt Word**: (ใหม่)
    *   **Change Prompt Word**: อนุญาตให้คุณเปลี่ยนคำสั่ง prompt สำหรับงานเฉพาะได้
    *   **Custom Prompt Word**: กรอกคำ prompt แบบกำหนดเองสำหรับงานนั้น
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **ปิด (ค่าเริ่มต้น)**: ไฟล์ที่สร้างสำเร็จจะถูกย้ายไปยัง subfolder ชื่อ `[OriginalFolderName]_complete` ซึ่งอยู่ relative กับโฟลเดอร์แม่ของโฟลเดอร์เดิม (หรือ `Vault_complete` หากโฟลเดอร์เดิมคือ root)
    *   **เปิด**: ให้คุณกำหนดชื่อ subfolder ที่จะใช้ย้ายไฟล์ที่ประมวลผลสำเร็จเองได้
-   **Custom Output Folder Name**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น) กรอกชื่อ subfolder ที่ต้องการ (เช่น `Generated Content`, `_complete`) ห้ามใช้อักขระที่ไม่ถูกต้อง หากปล่อยว่างจะใช้ `_complete` ค่าเริ่มต้น โฟลเดอร์นี้จะถูกสร้างโดยอ้างอิงจาก parent directory ของโฟลเดอร์เดิม

#### ปุ่มเวิร์กโฟลว์คลิกเดียว
-   **Visual Workflow Builder**: สร้างปุ่ม workflow แบบกำหนดเองจาก action ภายใน โดยไม่ต้องเขียน DSL ด้วยมือ
-   **Custom Workflow Buttons DSL**: ผู้ใช้ขั้นสูงยังสามารถแก้ข้อความนิยาม workflow โดยตรงได้ หาก DSL ไม่ถูกต้อง ระบบจะ fallback ไปใช้ workflow เริ่มต้นอย่างปลอดภัยและแสดงคำเตือนใน UI ของแถบข้าง/การตั้งค่า
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: หยุด workflow ทันทีเมื่อมีขั้นตอนใดขั้นตอนหนึ่งล้มเหลว
    *   **Continue on Error**: ดำเนินขั้นตอนถัดไปต่อ แล้วรายงานจำนวน action ที่ล้มเหลวเมื่อจบ
-   **Default Workflow Included**: `One-Click Extract` จะ chain `Process File (Add Links)`, `Batch Generate from Titles` และ `Batch Mermaid Fix`

#### การตั้งค่าคำสั่งแบบกำหนดเอง
ฟีเจอร์นี้ช่วยให้คุณ override คำสั่งเริ่มต้น (prompts) ที่ส่งไปยัง LLM สำหรับงานเฉพาะ ทำให้ควบคุมผลลัพธ์ได้ละเอียดมากขึ้น

-   **Enable Custom Prompts for Specific Tasks**:
    *   **ปิด (ค่าเริ่มต้น)**: ปลั๊กอินจะใช้ prompt เริ่มต้นที่มีมาให้สำหรับทุกการทำงาน
    *   **เปิด**: เปิดความสามารถในการตั้ง custom prompt สำหรับงานที่ระบุด้านล่าง นี่คือ master switch ของฟีเจอร์นี้

-   **Use Custom Prompt for [Task Name]**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น)
    *   สำหรับแต่ละงานที่รองรับ ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts") คุณสามารถเปิดหรือปิด custom prompt แยกกันได้
    *   **Disabled**: งานนี้จะใช้ prompt เริ่มต้น
    *   **เปิด**: งานนี้จะใช้ข้อความที่คุณกรอกในช่อง "Custom Prompt" ด้านล่าง

-   **Custom Prompt Text Area**: (แสดงเมื่อเปิด custom prompt ของงานนั้น)
    *   **แสดง Default Prompt**: ปลั๊กอินจะแสดง prompt เริ่มต้นที่ปกติใช้กับงานนั้นเพื่ออ้างอิง คุณสามารถใช้ปุ่ม **"Copy Default Prompt"** เพื่อคัดลอกข้อความนี้ไปเป็นจุดเริ่มต้นของ custom prompt ของคุณ
    *   **ช่องกรอก Custom Prompt**: ตรงนี้คือพื้นที่สำหรับเขียนคำสั่งของคุณเองให้ LLM
    *   **Placeholders**: คุณสามารถ (และควร) ใช้ placeholder พิเศษใน prompt ซึ่งปลั๊กอินจะแทนที่ด้วยเนื้อหาจริงก่อนส่งคำขอไปยัง LLM ดูจาก default prompt เพื่อทราบว่าแต่ละงานรองรับ placeholder ใดบ้าง placeholder ทั่วไป ได้แก่:
        *   `{TITLE}`: ชื่อเรื่องของโน้ตปัจจุบัน
        *   `{RESEARCH_CONTEXT_SECTION}`: เนื้อหาที่รวบรวมได้จากเว็บรีเสิร์ช
        *   `{USER_PROMPT}`: เนื้อหาของโน้ตที่กำลังถูกประมวลผล

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="ขอบเขตการตรวจสอบรายการซ้ำ   การตั้งค่าคำสั่งแบบกำหนดเอง" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### ขอบเขตการตรวจสอบรายการซ้ำ
-   **Duplicate Check Scope Mode**: ควบคุมว่าจะตรวจไฟล์ใดบ้างเทียบกับโน้ตใน Concept Note Folder ของคุณเพื่อหารายการซ้ำที่เป็นไปได้
    *   **Entire Vault (Default)**: เปรียบเทียบโน้ตแนวคิดกับโน้ตอื่นทั้งหมดใน vault (ยกเว้น Concept Note Folder เอง)
    *   **Include Specific Folders Only**: เปรียบเทียบโน้ตแนวคิดเฉพาะกับโน้ตในโฟลเดอร์ที่ระบุด้านล่างเท่านั้น
    *   **Exclude Specific Folders**: เปรียบเทียบโน้ตแนวคิดกับโน้ตทุกไฟล์ *ยกเว้น* ที่อยู่ในโฟลเดอร์ที่ระบุด้านล่าง (และยกเว้น Concept Note Folder ด้วย)
    *   **Concept Folder Only**: เปรียบเทียบโน้ตแนวคิดเฉพาะกับ *โน้ตอื่นภายใน Concept Note Folder เดียวกัน* ช่วยให้ค้นหารายการซ้ำภายในชุดโน้ตที่สร้างขึ้นเองได้
-   **Include/Exclude Folders**: (แสดงเมื่อ Mode เป็น 'Include' หรือ 'Exclude' เท่านั้น) กรอก *path แบบ relative* ของโฟลเดอร์ที่คุณต้องการรวมเข้าหรือยกเว้น **หนึ่ง path ต่อหนึ่งบรรทัด** path จะ case-sensitive และใช้ `/` เป็นตัวคั่น (เช่น `Reference Material/Papers` หรือ `Daily Notes`) โฟลเดอร์เหล่านี้ต้องไม่ใช่หรืออยู่ภายใน Concept Note Folder

#### ผู้ให้บริการเว็บรีเสิร์ช
-   **Search Provider**: เลือกระหว่าง `Tavily` (ต้องใช้ API key, แนะนำ) และ `DuckDuckGo` (experimental และมักถูกเสิร์ชเอนจินบล็อกคำขอแบบอัตโนมัติ) ใช้สำหรับ "Research & Summarize Topic" และใช้กับ "Generate from Title" แบบไม่บังคับ
-   **Tavily API Key**: (แสดงเมื่อเลือก Tavily เท่านั้น) กรอก API key ของคุณจาก [tavily.com](https://tavily.com/)
-   **Tavily Max Results**: (แสดงเมื่อเลือก Tavily เท่านั้น) จำนวนผลลัพธ์สูงสุดที่ Tavily จะส่งกลับ (1-20) ค่าเริ่มต้น: 5
-   **Tavily Search Depth**: (แสดงเมื่อเลือก Tavily เท่านั้น) เลือกระหว่าง `basic` (ค่าเริ่มต้น) หรือ `advanced` หมายเหตุ: `advanced` ให้ผลลัพธ์ดีกว่า แต่ใช้ 2 API credits ต่อการค้นหาแทน 1
-   **DuckDuckGo Max Results**: (แสดงเมื่อเลือก DuckDuckGo เท่านั้น) จำนวนผลลัพธ์สูงสุดที่จะ parse (1-10) ค่าเริ่มต้น: 5
-   **DuckDuckGo Content Fetch Timeout**: (แสดงเมื่อเลือก DuckDuckGo เท่านั้น) จำนวนวินาทีสูงสุดที่จะรอเมื่อพยายามดึงเนื้อหาจาก URL ของผลลัพธ์แต่ละรายการ ค่าเริ่มต้น: 15
-   **Max Research Content Tokens**: จำนวน token สูงสุดโดยประมาณจากผลลัพธ์เว็บรีเสิร์ชรวม (snippets/เนื้อหาที่ดึงมา) ที่จะรวมเข้าใน prompt สรุปผล ช่วยจัดการขนาด context window และต้นทุน (ค่าเริ่มต้น: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### โดเมนการเรียนรู้แบบโฟกัส
-   **Enable Focused Learning Domain**:
    *   **ปิด (ค่าเริ่มต้น)**: prompt ที่ส่งไปยัง LLM จะใช้คำสั่งมาตรฐานทั่วไป
    *   **เปิด**: ให้คุณระบุสาขาวิชาหนึ่งหรือหลายสาขาเพื่อช่วยให้ LLM เข้าใจบริบทได้ดีขึ้น
-   **Learning Domain**: (แสดงเมื่อเปิดตัวเลือกด้านบนเท่านั้น) กรอกสาขาที่เฉพาะเจาะจงของคุณ เช่น 'Materials Science', 'Polymer Physics', 'Machine Learning' ระบบจะเพิ่มบรรทัด "Relevant Fields: [...]" ไว้ตอนต้นของ prompt เพื่อช่วยให้ LLM สร้างลิงก์และเนื้อหาที่แม่นยำและเกี่ยวข้องกับสาขาของคุณมากขึ้น
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## คู่มือการใช้งาน

### เวิร์กโฟลว์ด่วนและแถบข้าง

-   เปิดแถบข้างของ Notemd เพื่อเข้าถึง action sections ที่จัดกลุ่มไว้สำหรับการประมวลผลหลัก การสร้างเนื้อหา การแปล ความรู้ และ utility
-   ใช้พื้นที่ **เวิร์กโฟลว์ด่วน** ด้านบนของแถบข้างเพื่อเปิดใช้ปุ่มหลายขั้นตอนแบบกำหนดเอง
-   workflow เริ่มต้น **One-Click Extract** จะรัน `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`
-   ความคืบหน้าของ workflow, log รายขั้นตอน และความล้มเหลวต่างๆ จะแสดงในแถบข้าง พร้อม footer แบบ pinned ที่ช่วยป้องกันไม่ให้แถบความคืบหน้าและพื้นที่ log ถูกบีบหายไปเมื่อมีการขยาย section หลายส่วน
-   การ์ดความคืบหน้าจะแสดง status text, percentage pill เฉพาะ และเวลาที่เหลือให้อ่านได้ชัดเจนในทันที และ workflow แบบกำหนดเองชุดเดียวกันนี้ยังกลับไปปรับแต่งได้จาก settings

### การประมวลผลต้นฉบับ (เพิ่ม Wiki-Links)
นี่คือความสามารถหลักที่เน้นการระบุแนวคิดและเพิ่ม `[[wiki-links]]`

**สำคัญ:** กระบวนการนี้ทำงานเฉพาะกับไฟล์ `.md` หรือ `.txt` เท่านั้น คุณสามารถแปลงไฟล์ PDF เป็น MD ได้ฟรีด้วย [Mineru](https://github.com/opendatalab/MinerU) ก่อนนำมาประมวลผลต่อ

1.  **ใช้งานผ่านแถบข้าง**:
    *   เปิดแถบข้างของ Notemd (ไอคอนไม้กายสิทธิ์หรือผ่านพาเล็ตคำสั่ง)
    *   เปิดไฟล์ `.md` หรือ `.txt`
    *   คลิก **"Process File (Add Links)"**
    *   หากต้องการประมวลผลทั้งโฟลเดอร์: คลิก **"Process Folder (Add Links)"** เลือกโฟลเดอร์ แล้วคลิก "Process"
    *   ความคืบหน้าจะแสดงในแถบข้าง คุณสามารถยกเลิกงานได้ผ่านปุ่ม "Cancel Processing" ในแถบข้าง
    *   *หมายเหตุสำหรับการประมวลผลโฟลเดอร์:* ไฟล์จะถูกประมวลผลในพื้นหลังโดยไม่เปิดใน editor

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **ใช้งานผ่านพาเล็ตคำสั่ง** (`Ctrl+P` หรือ `Cmd+P`):
    *   **ไฟล์เดี่ยว**: เปิดไฟล์แล้วรัน `Notemd: Process Current File`
    *   **โฟลเดอร์**: รัน `Notemd: Process Folder` แล้วเลือกโฟลเดอร์ ไฟล์จะถูกประมวลผลในพื้นหลังโดยไม่เปิดใน editor
    *   สำหรับ action ที่เริ่มจากพาเล็ตคำสั่ง จะมี progress modal ปรากฏขึ้นพร้อมปุ่มยกเลิก
    *   *หมายเหตุ:* ปลั๊กอินจะลบ `\boxed{` ที่ขึ้นต้นและ `}` ที่ปิดท้ายโดยอัตโนมัติ หากพบในเนื้อหาที่ประมวลผลขั้นสุดท้ายก่อนบันทึก

### ฟีเจอร์ใหม่

1.  **สรุปเป็นแผนภาพ Mermaid**:
    *   เปิดโน้ตที่คุณต้องการสรุป
    *   รันคำสั่ง `Notemd: Summarise as Mermaid diagram` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   ปลั๊กอินจะสร้างโน้ตใหม่ที่มี Mermaid diagram

2.  **Translate Note/Selection**:
    *   เลือกข้อความในโน้ตหากต้องการแปลเฉพาะส่วนนั้น หรือเรียกคำสั่งโดยไม่เลือกอะไรเพื่อแปลทั้งโน้ต
    *   รันคำสั่ง `Notemd: Translate Note/Selection` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   จะมีหน้าต่างโมดัลให้คุณยืนยันหรือเปลี่ยน **Target Language** (โดยใช้ค่า default จากที่กำหนดไว้ใน Configuration)
    *   ปลั๊กอินจะใช้ **LLM Provider** ที่กำหนดไว้ (อิงตามการตั้งค่า Multi-Model) เพื่อทำการแปล
    *   เนื้อหาที่แปลแล้วจะถูกบันทึกไปยัง **Translation Save Path** ที่กำหนดไว้พร้อม suffix ที่เหมาะสม และเปิดใน **pane ใหม่ทางด้านขวา** ของเนื้อหาต้นฉบับเพื่อเปรียบเทียบได้ง่าย
    *   คุณสามารถยกเลิกงานนี้ผ่านปุ่มในแถบข้างหรือปุ่มยกเลิกในโมดัล
3.  **การแปลแบบแบตช์**:
    *   รันคำสั่ง `Notemd: Batch Translate Folder` จากพาเล็ตคำสั่งแล้วเลือกโฟลเดอร์ หรือคลิกขวาที่โฟลเดอร์ใน file explorer แล้วเลือก "Batch translate this folder"
    *   ปลั๊กอินจะแปลไฟล์ Markdown ทั้งหมดในโฟลเดอร์ที่เลือก
    *   ไฟล์ที่แปลแล้วจะถูกบันทึกไว้ตาม translation path ที่กำหนด แต่จะไม่ถูกเปิดโดยอัตโนมัติ
    *   กระบวนการนี้ยกเลิกได้ผ่าน progress modal

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   เลือกข้อความในโน้ต หรือทำให้แน่ใจว่าโน้ตมีชื่อเรื่อง (ซึ่งจะถูกใช้เป็นหัวข้อค้นหา)
    *   รันคำสั่ง `Notemd: Research and Summarize Topic` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   ปลั๊กอินจะใช้ **Search Provider** ที่กำหนดไว้ (Tavily/DuckDuckGo) และ **LLM Provider** ที่เหมาะสม (อิงตามการตั้งค่า Multi-Model) เพื่อค้นหาและสรุปข้อมูล
    *   บทสรุปจะถูกต่อท้ายลงในโน้ตปัจจุบัน
    *   คุณสามารถยกเลิกงานนี้ผ่านปุ่มในแถบข้างหรือปุ่มยกเลิกในโมดัล
    *   *หมายเหตุ:* การค้นหาผ่าน DuckDuckGo อาจล้มเหลวเพราะถูกตรวจจับว่าเป็นบอต Tavily แนะนำมากกว่า

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   เปิดโน้ตหนึ่งไฟล์ (อาจว่างก็ได้)
    *   รันคำสั่ง `Notemd: Generate Content from Title` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   ปลั๊กอินจะใช้ **LLM Provider** ที่เหมาะสม (อิงตามการตั้งค่า Multi-Model) เพื่อสร้างเนื้อหาจากชื่อเรื่องของโน้ต และแทนที่เนื้อหาเดิม
    *   หากเปิดการตั้งค่า **"Enable Research in 'Generate from Title'"** ไว้ ระบบจะทำเว็บรีเสิร์ชก่อน (โดยใช้ **Web Research Provider** ที่กำหนด) และใส่บริบทนั้นลงใน prompt ที่ส่งให้ LLM
    *   คุณสามารถยกเลิกงานนี้ผ่านปุ่มในแถบข้างหรือปุ่มยกเลิกในโมดัล

5.  **Batch Generate Content from Titles**:
    *   รันคำสั่ง `Notemd: Batch Generate Content from Titles` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   เลือกโฟลเดอร์ที่มีโน้ตที่คุณต้องการประมวลผล
    *   ปลั๊กอินจะไล่ไปตามไฟล์ `.md` แต่ละไฟล์ในโฟลเดอร์ (ยกเว้นไฟล์ `_processed.md` และไฟล์ในโฟลเดอร์ "complete" ที่กำหนดไว้) แล้วสร้างเนื้อหาจากชื่อเรื่องและแทนที่เนื้อหาเดิม โดยประมวลผลไฟล์ในพื้นหลังโดยไม่เปิดใน editor
    *   ไฟล์ที่ประมวลผลสำเร็จจะถูกย้ายไปยังโฟลเดอร์ "complete" ที่กำหนดไว้
    *   คำสั่งนี้จะเคารพการตั้งค่า **"Enable Research in 'Generate from Title'"** สำหรับทุกโน้ตที่ประมวลผล
    *   คุณสามารถยกเลิกงานนี้ผ่านปุ่มในแถบข้างหรือปุ่มยกเลิกในโมดัล
    *   ความคืบหน้าและผลลัพธ์ (จำนวนไฟล์ที่แก้ไข, ข้อผิดพลาด) จะแสดงใน log ของแถบข้าง/โมดัล
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   ตรวจสอบให้แน่ใจว่าได้ตั้งค่า **Concept Note Folder Path** ไว้อย่างถูกต้องใน settings
    *   รัน `Notemd: Check and Remove Duplicate Concept Notes` (ผ่านพาเล็ตคำสั่งหรือปุ่มในแถบข้าง)
    *   ปลั๊กอินจะสแกน concept note folder และเปรียบเทียบชื่อไฟล์กับโน้ตนอกโฟลเดอร์โดยใช้กฎหลายแบบ (exact match, plurals, normalization, containment)
    *   หากพบรายการที่อาจซ้ำ จะมีหน้าต่างโมดัลแสดงรายชื่อไฟล์ เหตุผลที่ถูกทำเครื่องหมาย และไฟล์ที่ชนกัน
    *   ตรวจรายการอย่างระมัดระวัง คลิก **"Delete Files"** เพื่อย้ายไฟล์เหล่านั้นไปยัง system trash หรือคลิก **"Cancel"** หากไม่ต้องการทำอะไร
    *   ความคืบหน้าและผลลัพธ์จะแสดงใน log ของแถบข้าง/โมดัล

7.  **Extract Concepts (Pure Mode)**:
    *   ฟีเจอร์นี้ช่วยให้คุณสกัดแนวคิดจากเอกสารและสร้าง concept note ที่เกี่ยวข้อง *โดยไม่* แก้ไขไฟล์ต้นฉบับ เหมาะมากสำหรับเติมฐานความรู้จากชุดเอกสารอย่างรวดเร็ว
    *   **ไฟล์เดี่ยว**: เปิดไฟล์แล้วรันคำสั่ง `Notemd: Extract concepts (create concept notes only)` จากพาเล็ตคำสั่ง หรือคลิกปุ่ม **"Extract concepts (current file)"** ในแถบข้าง
    *   **โฟลเดอร์**: รันคำสั่ง `Notemd: Batch extract concepts from folder` จากพาเล็ตคำสั่ง หรือคลิก **"Extract concepts (folder)"** ในแถบข้าง จากนั้นเลือกโฟลเดอร์เพื่อประมวลผลโน้ตทั้งหมดในนั้น
    *   ปลั๊กอินจะอ่านไฟล์ ระบุแนวคิด และสร้างโน้ตใหม่สำหรับแนวคิดเหล่านั้นใน **Concept Note Folder** ที่คุณกำหนด โดยปล่อยไฟล์ต้นฉบับไว้เหมือนเดิม

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   คำสั่งทรงพลังนี้ช่วยย่อกระบวนการสร้างและเติมเนื้อหาให้ concept note ใหม่
    *   เลือกคำหรือวลีหนึ่งใน editor
    *   รันคำสั่ง `Notemd: Create Wiki-Link & Generate Note from Selection` (แนะนำให้กำหนด hotkey ให้ เช่น `Cmd+Shift+W`)
    *   ปลั๊กอินจะ:
        1.  แทนที่ข้อความที่เลือกด้วย `[[wiki-link]]`
        2.  ตรวจว่ามีโน้ตชื่อเดียวกันนี้อยู่แล้วใน **Concept Note Folder** หรือไม่
        3.  หากมีอยู่แล้ว ระบบจะเพิ่ม backlink กลับมายังโน้ตปัจจุบัน
        4.  หากยังไม่มี จะสร้างโน้ตว่างใหม่
        5.  จากนั้นจะรันคำสั่ง **"Generate Content from Title"** กับโน้ตใหม่หรือโน้ตเดิมโดยอัตโนมัติ เพื่อเติมเนื้อหาที่สร้างด้วย AI ลงไป

9.  **Extract Concepts and Generate Titles**:
    *   คำสั่งนี้เชื่อมสองฟีเจอร์ทรงพลังเข้าด้วยกันเพื่อให้ workflow ลื่นขึ้น
    *   รันคำสั่ง `Notemd: Extract Concepts and Generate Titles` จากพาเล็ตคำสั่ง (แนะนำให้กำหนด hotkey ให้ด้วย)
    *   ปลั๊กอินจะ:
        1.  รันงาน **"Extract concepts (current file)"** กับไฟล์ที่กำลัง active อยู่ก่อน
        2.  จากนั้นจะรันงาน **"Batch generate from titles"** กับโฟลเดอร์ที่คุณตั้งไว้เป็น **Concept note folder path** ใน settings โดยอัตโนมัติ
    *   ทำให้คุณสามารถเติมฐานความรู้ด้วยแนวคิดใหม่จากเอกสารต้นทางก่อน แล้วให้ AI สร้างเนื้อหาให้ concept note ใหม่เหล่านั้นต่อได้ทันทีภายในขั้นตอนเดียว

10. **Extract Specific Original Text**:
    *   ตั้งคำถามของคุณใน settings ภายใต้ "Extract Specific Original Text"
    *   ใช้ปุ่ม "Extract Specific Original Text" ในแถบข้างเพื่อประมวลผลไฟล์ที่กำลัง active
    *   **Merged Mode**: ช่วยให้ประมวลผลได้เร็วขึ้นด้วยการส่งทุกคำถามใน prompt เดียว
    *   **Translation**: เลือกให้แปลข้อความที่สกัดได้เป็นภาษาที่คุณกำหนด
    *   **Custom Output**: กำหนดได้ว่าจะบันทึกไฟล์ที่สกัดออกมาไว้ที่ไหนและใช้ชื่ออย่างไร

11. **Batch Mermaid Fix**:
    *   ใช้ปุ่ม "Batch Mermaid Fix" ในแถบข้างเพื่อสแกนโฟลเดอร์และแก้ Mermaid syntax error ที่พบบ่อย
    *   ปลั๊กอินจะรายงานไฟล์ที่ยังมี error อยู่ผ่านไฟล์ `mermaid_error_{foldername}.md`
    *   และยังตั้งค่าได้ให้ย้ายไฟล์ที่มีปัญหาเหล่านั้นไปยังโฟลเดอร์แยกต่างหากเพื่อใช้ตรวจสอบต่อ

## ผู้ให้บริการ LLM ที่รองรับ

| ผู้ให้บริการ        | ประเภท     | ต้องใช้ API Key        | หมายเหตุ                                                                |
|--------------------|------------|------------------------|-------------------------------------------------------------------------|
| DeepSeek           | คลาวด์     | ใช่                    | endpoint ของ DeepSeek โดยตรง พร้อมการจัดการ reasoning-model            |
| Qwen               | คลาวด์     | ใช่                    | preset โหมด compatible ของ DashScope สำหรับโมเดล Qwen / QwQ            |
| Qwen Code          | คลาวด์     | ใช่                    | preset ที่โฟกัสงานโค้ดของ DashScope สำหรับโมเดล Qwen coder             |
| Doubao             | คลาวด์     | ใช่                    | preset ของ Volcengine Ark; โดยทั่วไปควรตั้งช่อง model เป็น endpoint ID |
| Moonshot           | คลาวด์     | ใช่                    | endpoint อย่างเป็นทางการของ Kimi / Moonshot                            |
| GLM                | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible อย่างเป็นทางการของ Zhipu BigModel      |
| Z AI               | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible ของ GLM/Zhipu สำหรับนอกจีน; เสริมจาก `GLM` |
| MiniMax            | คลาวด์     | ใช่                    | endpoint chat-completions อย่างเป็นทางการของ MiniMax                   |
| Huawei Cloud MaaS  | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible ของ Huawei ModelArts MaaS สำหรับโมเดลโฮสต์ |
| Baidu Qianfan      | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible อย่างเป็นทางการของ Qianfan สำหรับ ERNIE |
| SiliconFlow        | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible อย่างเป็นทางการของ SiliconFlow สำหรับ OSS ที่โฮสต์ |
| OpenAI             | คลาวด์     | ใช่                    | รองรับโมเดล GPT และตระกูล o-series                                     |
| Anthropic          | คลาวด์     | ใช่                    | รองรับโมเดล Claude                                                     |
| Google             | คลาวด์     | ใช่                    | รองรับโมเดล Gemini                                                     |
| Mistral            | คลาวด์     | ใช่                    | รองรับตระกูล Mistral และ Codestral                                     |
| Azure OpenAI       | คลาวด์     | ใช่                    | ต้องใช้ Endpoint, API Key, deployment name และ API Version             |
| OpenRouter         | เกตเวย์    | ใช่                    | เข้าถึงผู้ให้บริการหลายรายผ่าน model ID ของ OpenRouter                 |
| xAI                | คลาวด์     | ใช่                    | endpoint โดยตรงของ Grok                                                |
| Groq               | คลาวด์     | ใช่                    | inference แบบ OpenAI-compatible ความเร็วสูงสำหรับโมเดล OSS ที่โฮสต์     |
| Together           | คลาวด์     | ใช่                    | endpoint แบบ OpenAI-compatible สำหรับโมเดล OSS ที่โฮสต์                 |
| Fireworks          | คลาวด์     | ใช่                    | endpoint สำหรับ inference แบบ OpenAI-compatible                        |
| Requesty           | เกตเวย์    | ใช่                    | เราเตอร์หลายผู้ให้บริการภายใต้ API key เดียว                         |
| OpenAI Compatible  | เกตเวย์    | ไม่บังคับ             | preset ทั่วไปสำหรับ LiteLLM, vLLM, Perplexity, Vercel AI Gateway ฯลฯ   |
| LMStudio           | ภายในเครื่อง | ไม่บังคับ (`EMPTY`) | รันโมเดลในเครื่องผ่าน LM Studio server                                 |
| Ollama             | ภายในเครื่อง | ไม่                   | รันโมเดลในเครื่องผ่าน Ollama server                                    |

*หมายเหตุ: สำหรับผู้ให้บริการภายในเครื่อง (LMStudio, Ollama) โปรดตรวจสอบว่าแอปเซิร์ฟเวอร์ที่เกี่ยวข้องกำลังทำงานและเข้าถึงได้ผ่าน Base URL ที่กำหนด*
*หมายเหตุ: สำหรับ OpenRouter และ Requesty ให้ใช้ตัวระบุโมเดลแบบเต็ม/มี prefix ผู้ให้บริการตามที่ gateway แสดง (เช่น `google/gemini-flash-1.5` หรือ `anthropic/claude-3-7-sonnet-latest`)*
*หมายเหตุ: `Doubao` โดยทั่วไปคาดหวัง Ark endpoint/deployment ID ในช่อง model มากกว่าชื่อ family ของโมเดลดิบ ตอนนี้หน้าการตั้งค่าจะแจ้งเตือนหากยังใช้ค่า placeholder อยู่ และจะบล็อกการทดสอบการเชื่อมต่อจนกว่าคุณจะแทนที่ด้วย endpoint ID จริง*
*หมายเหตุ: `Z AI` ใช้สาย `api.z.ai` สำหรับผู้ใช้ต่างประเทศ ส่วน `GLM` ยังคงใช้ BigModel endpoint สำหรับจีนแผ่นดินใหญ่ เลือก preset ให้ตรงกับ region ของบัญชีคุณ*
*หมายเหตุ: preset ที่โฟกัสตลาดจีนจะใช้การตรวจสอบการเชื่อมต่อแบบ chat-first เพื่อให้การทดสอบตรวจสอบโมเดล/ดีพลอยเมนต์จริงที่ตั้งไว้ ไม่ใช่แค่การเข้าถึง API key*
*หมายเหตุ: `OpenAI Compatible` ตั้งใจไว้สำหรับ gateway และ proxy แบบกำหนดเอง ให้ตั้ง Base URL, นโยบาย API key และ model ID ตามเอกสารของผู้ให้บริการของคุณ*

## การใช้เครือข่ายและการจัดการข้อมูล

Notemd รันแบบ local ภายใน Obsidian แต่บางฟีเจอร์จะมีการส่งคำขอออกภายนอก

### การเรียกผู้ให้บริการ LLM (ปรับแต่งได้)

- Trigger: การประมวลผลไฟล์ การสร้างเนื้อหา การแปล การสรุปจากรีเสิร์ช การสรุป Mermaid และ action ที่เกี่ยวข้องกับการเชื่อมต่อ/diagnostic
- Endpoint: provider base URL(s) ที่คุณกำหนดใน settings ของ Notemd
- ข้อมูลที่ส่ง: ข้อความ prompt และเนื้อหาของงานที่จำเป็นต่อการประมวลผล
- หมายเหตุด้านการจัดการข้อมูล: API keys ถูกตั้งค่าใน plugin settings ภายในเครื่อง และถูกใช้เพื่อเซ็นคำขอจากอุปกรณ์ของคุณ

### การเรียกเว็บรีเสิร์ช (ไม่บังคับ)

- Trigger: เมื่อเปิดใช้งานเว็บรีเสิร์ชและเลือกผู้ให้บริการค้นหาไว้
- Endpoint: Tavily API หรือ endpoint ของ DuckDuckGo
- ข้อมูลที่ส่ง: คำค้นรีเสิร์ชของคุณและ metadata ของคำขอที่จำเป็น

### การวินิจฉัยสำหรับนักพัฒนาและบันทึกดีบัก (ไม่บังคับ)

- Trigger: โหมด API debug และ action ด้าน developer diagnostics
- การจัดเก็บ: log สำหรับ diagnostics และ errors จะถูกเขียนไว้ที่ root ของ vault (เช่น `Notemd_Provider_Diagnostic_*.txt` และ `Notemd_Error_Log_*.txt`)
- หมายเหตุด้านความเสี่ยง: log อาจมี excerpt ของ request/response อยู่ ควรตรวจสอบก่อนแชร์ออกสาธารณะ

### การจัดเก็บข้อมูลในเครื่อง

- การตั้งค่าของปลั๊กอินถูกเก็บไว้ที่ `.obsidian/plugins/notemd/data.json`
- ไฟล์ที่สร้าง รายงาน และ log เสริมต่างๆ จะถูกเก็บใน vault ของคุณตาม settings ที่ตั้งไว้

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
-   **ปลั๊กอินไม่โหลด**: ตรวจสอบให้แน่ใจว่า `manifest.json`, `main.js`, `styles.css` อยู่ในโฟลเดอร์ที่ถูกต้อง (`<Vault>/.obsidian/plugins/notemd/`) แล้วรีสตาร์ต Obsidian ตรวจสอบ Developer Console (`Ctrl+Shift+I` หรือ `Cmd+Option+I`) เพื่อดู error ตอนเริ่มต้น
-   **การประมวลผลล้มเหลว / API Errors**:
    1.  **ตรวจสอบรูปแบบไฟล์**: ให้แน่ใจว่าไฟล์ที่คุณพยายามประมวลผลหรือตรวจสอบมีนามสกุล `.md` หรือ `.txt` เท่านั้น ปัจจุบัน Notemd รองรับเฉพาะไฟล์ข้อความสองรูปแบบนี้
    2.  ใช้คำสั่ง/ปุ่ม "Test LLM Connection" เพื่อตรวจสอบการตั้งค่าของผู้ให้บริการที่กำลังใช้งาน
    3.  ตรวจสอบ API Key, Base URL, Model Name และ API Version (สำหรับ Azure) ซ้ำอีกครั้ง ให้แน่ใจว่า API key ถูกต้องและมี credits/permissions เพียงพอ
    4.  ตรวจสอบให้แน่ใจว่า local LLM server ของคุณ (LMStudio, Ollama) กำลังทำงาน และ Base URL ถูกต้อง (เช่น `http://localhost:1234/v1` สำหรับ LMStudio)
    5.  ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณในกรณีใช้ผู้ให้บริการคลาวด์
    6.  **สำหรับข้อผิดพลาดขณะประมวลผลไฟล์เดี่ยว:** ตรวจดูข้อความ error แบบละเอียดใน Developer Console และหากต้องการสามารถคัดลอกผ่านปุ่มใน error modal ได้
    7.  **สำหรับข้อผิดพลาดขณะประมวลผลแบบกลุ่ม:** ตรวจดูไฟล์ `error_processing_filename.log` ที่ root ของ vault เพื่อดูข้อความ error รายไฟล์ที่ล้มเหลว โดย Developer Console หรือ error modal อาจแสดงเพียงสรุปหรือ error ของงานกลุ่มแบบรวม
    8.  **บันทึกข้อผิดพลาดอัตโนมัติ:** หากกระบวนการล้มเหลว ปลั๊กอินจะบันทึกไฟล์ log แบบละเอียดชื่อ `Notemd_Error_Log_[Timestamp].txt` ไว้ที่ root ของ vault ไฟล์นี้ประกอบด้วยข้อความข้อผิดพลาด, สแต็กเทรซ และ session logs หากคุณเจอปัญหาซ้ำๆ โปรดตรวจไฟล์นี้ การเปิด "API Error Debugging Mode" ใน settings จะเติม log นี้ด้วยข้อมูล API response ที่ละเอียดมากขึ้นอีก
    9.  **การวินิจฉัยคำขอขนาดยาวกับ endpoint จริง (สำหรับนักพัฒนา)**:
        - เส้นทางภายในปลั๊กอิน (แนะนำให้ลองก่อน): ใช้ **Settings -> Notemd -> Developer provider diagnostic (long request)** เพื่อรัน runtime probe บนผู้ให้บริการปัจจุบัน และสร้าง `Notemd_Provider_Diagnostic_*.txt` ที่ root ของ vault
        - เส้นทาง CLI (นอก Obsidian runtime): หากต้องการเปรียบเทียบระดับ endpoint ระหว่างพฤติกรรมแบบ buffered และ streaming อย่างทำซ้ำได้ ให้ใช้:
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
        รายงานที่สร้างจะประกอบด้วยเวลาในแต่ละความพยายาม (`First Byte`, `Duration`), request metadata ที่ sanitize แล้ว, response headers, raw/partial body fragments, parsed stream fragments และจุดที่ transport layer ล้มเหลว
-   **ปัญหาการเชื่อมต่อ LM Studio/Ollama**:
    *   **การทดสอบการเชื่อมต่อล้มเหลว**: ให้แน่ใจว่า local server (LM Studio หรือ Ollama) กำลังทำงานและมีการโหลด/เปิดให้ใช้โมเดลที่ถูกต้องอยู่
    *   **CORS Errors (Ollama on Windows)**: หากคุณเจอ CORS (Cross-Origin Resource Sharing) error ขณะใช้ Ollama บน Windows อาจต้องตั้ง environment variable `OLLAMA_ORIGINS` โดยรัน `set OLLAMA_ORIGINS=*` ใน command prompt ก่อนเริ่ม Ollama เพื่ออนุญาตคำขอจากทุก origin
    *   **Enable CORS in LM Studio**: สำหรับ LM Studio คุณสามารถเปิด CORS ได้โดยตรงใน server settings ซึ่งอาจจำเป็นหาก Obsidian รันในเบราว์เซอร์หรือมีนโยบาย origin ที่เข้มงวด
-   **ข้อผิดพลาดในการสร้างโฟลเดอร์ ("File name cannot contain...")**:
    *   โดยทั่วไปหมายความว่า path ที่กรอกไว้ใน settings (**Processed File Folder Path** หรือ **Concept Note Folder Path**) ไม่ถูกต้อง *สำหรับ Obsidian*
    *   **ตรวจสอบให้ใช้ path แบบ relative** (เช่น `Processed`, `Notes/Concepts`) และ **ไม่ใช่ path แบบ absolute** (เช่น `C:\Users\...`, `/Users/...`)
    *   ตรวจดูอักขระที่ไม่อนุญาต: `* " \ / < > : | ? # ^ [ ]` โปรดทราบว่า `\` ก็ใช้ไม่ได้กับ path ของ Obsidian แม้บน Windows ให้ใช้ `/` เป็นตัวคั่น path แทน
-   **ปัญหาด้านประสิทธิภาพ**: การประมวลผลไฟล์ขนาดใหญ่หรือจำนวนมากอาจใช้เวลา ลองลดค่า "Chunk Word Count" เพื่อให้ API call เร็วขึ้น (แต่จำนวนครั้งจะมากขึ้น) หรือทดลองเปลี่ยนผู้ให้บริการ LLM/โมเดล
-   **การลิงก์ที่ไม่คาดคิด**: คุณภาพของการลิงก์ขึ้นอยู่กับ LLM และ prompt อย่างมาก ลองใช้โมเดลอื่นหรือปรับค่าอุณหภูมิที่ต่างกัน

## การมีส่วนร่วม

ยินดีต้อนรับทุกการมีส่วนร่วม โปรดดูแนวทางเพิ่มเติมได้จาก GitHub repository: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## เอกสารสำหรับผู้ดูแล

- [เวิร์กโฟลว์การออกรุ่น (ภาษาอังกฤษ)](./docs/maintainer/release-workflow.md)
- [เวิร์กโฟลว์การออกรุ่น (ภาษาจีนตัวย่อ)](./docs/maintainer/release-workflow.zh-CN.md)

## ใบอนุญาต

MIT License - ดูรายละเอียดได้ในไฟล์ [LICENSE](LICENSE)

---


*Notemd v1.8.3 - ยกระดับกราฟความรู้ใน Obsidian ของคุณด้วย AI*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
