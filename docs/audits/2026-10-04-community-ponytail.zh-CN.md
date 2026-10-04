# 架构与代码审查 — 2026-10-04

范围：main 的 d99309780679 基线及 1.9.10 候选改动。使用 ponytail-audit 的 delete / native / reuse / shrink / yagni 分类审查复杂度，另行检查正确性和安全。社区页面包含 646 项扫描发现，按规则与描述归为 108 组；这些数量不是已确认缺陷数。以下明确区分证据等级。

## 架构与责任边界

命令与侧栏动作进入 NotemdPlugin，再进入操作契约与宿主适配器。图表生成先规划语义类型，经共享 provider 传输调用模型，再解析校验 DiagramSpec 并选择 renderer。Target descriptor 拥有文件机制；能力投影连接类型、renderer 和输出格式。预览与导出适配器消费 artifact；Vault 交付边界负责命名、避让冲突、receipt 与可恢复历史。Slidev 演示导出维持独立桌面子系统及不同的环境依赖。

入口和设置页是较大的组合根，但文件长度不能单独证明需要增加 facade。已确认问题主要出现在外部边界：导入 SVG 获得 DOM 权限、本地密钥的持久化归属错误、桌面依赖在功能检测之前进入移动端 bundle。只把方法搬到更多类中而不修正契约，会保留原缺陷。

## 已确认缺陷及修复

| 优先级 | 根因 | 修复与证据 |
|---|---|---|
| P1 | Vault 伴随 SVG 经 previewSvg 直接进入宿主 innerHTML；导出适配没有删除事件属性或限定 CSS。 | 浏览器 SVG 边界使用 DOMPurify 和静态 SVG CSS 属性白名单；挂载使用接收元素的 ownerDocument。移除活动嵌入、外部资源、事件属性，保留向量文字、内部引用、渐变与 marker。 |
| P1 | localServer 静态导入 fs/path；即使 isDesktopOnly=false，移动端加载入口时已执行 Node require。 | Node 依赖仅在桌面操作内懒加载；真实浏览器加载最终生产 bundle，拒绝所有 Node 模块导入。 |
| P1 | 设备共享 localStorage key 导致跨 Vault 配置泄漏；本地写失败被吞掉，密钥又从 data.json 排除。 | 改用 App 的 Vault 隔离存储并传播写失败。旧列表只能显式导入，保留全局记录和已有配置，可替换未使用默认项，不自动复制到其他 Vault。 |
| P1 | 服务器监听所有网卡并允许 wildcard CORS。 | 仅监听 loopback，精确校验 Host/Origin，限定 GET/HEAD，解码后与 realpath 双重目录包含检查，设置 UTF-8 和 nosniff。 |
| P2 | 探测与真实绑定分离；关闭看不到待启动实例；共享消费者可以关闭彼此的监听器。 | await 前登记待启动状态，真实绑定处理端口冲突，规范化目录 key，成对获取与释放引用，卸载取消全部实例；实际监听测试覆盖并发和关闭。 |
| P2 | local-only 开关位于 provider 缺失分支。 | 仅在有效选中 provider 下显示并绑定。 |
| P2 | 收藏原生事件未处理保存拒绝；复制尚未完成就报告成功。 | 收藏失败恢复状态并显示错误；复制等待完成，明确处理 clipboard 不可用。 |
| P2 | 用户明确删除时硬编码系统回收站选项。 | 使用 FileManager.trashFile 遵守 Vault 删除偏好；自动生成章节清理仍按独立所有权语义处理。 |

新 SVG 边界在发布前也捕获了三项回归：组合图丢失样式作用域、输入指定相同 scope ID 后干扰另一图形、重复导出造成作用域选择器膨胀。现在先组合原始面板，再分别限定每个嵌套 SVG 的样式；每次接收边界生成新的 scope ID 并重绑定旧选择器。浏览器回归检查实际计算颜色与隔离效果，而非只搜索字符串。校验后的源 CSS 与接收作用域分离保存，可见样式与源规则元数据都在边界重新校验，使打开/导出循环保持稳定；伪造元数据不能获取宿主或网络权限。旧 foreignObject 中的中文在移除活动 HTML 前转换为向量文字。

## Ponytail 决策

- **native：** 使用 node:module.builtinModules 替代 builtin-modules，同时覆盖 node: 前缀。模块列表归平台所有，额外依赖重复维护该知识。
- **delete：** 检查 src/scripts/.github 后移除无直接调用的 lodash 与 @types/lodash。传递依赖仍使用 lodash，不能据此声称整个依赖树不存在漏洞。
- **reuse：** 桌面检测复用已有 platformUtils；主 DOM SVG 挂载统一权限边界，避免各 UI 维护不等价的局部净化规则。
- **shrink：** 删除临时端口探测服务器，由正式服务器负责绑定和重试。
- **保留：** 类型目录、target descriptor、能力投影和操作契约回答不同问题。保留并校验连接；合并为巨型目录会混淆语义规划、产物机制和 UI 策略。
- **保留：** receipt 与恢复 manifest 保存部分成功及冻结输出设置；这些复杂度具有实际用户价值，不应缩为单一成功/失败标记。
- **yagni：** 不为局部修复增加事件总线、通用导出服务、设置 facade 或全局迁移框架。

## 剩余风险与不能成立的结论

1. Mermaid iframe 仍依赖 allow-scripts、allow-same-origin 和 parent bridge，不能作为强隔离边界。本次锁定 Mermaid 安全配置，并让两条父桥渲染路径统一进入安全 SVG 返回边界；后续 opaque-origin 消息桥需要同时迁移契约、视口行为和发布资产。单独删除 same-origin 会破坏渲染。
2. 浏览器 SVG 净化不代表纯 Node/offline 原始 SVG 已普遍安全；任何后续 DOM 消费者仍需净化，文档明确此限制。
3. Obsidian 1.13 原生设置发现属于前向兼容缺口；当前 SDK 与 1Knowledge 宿主为 1.12.7，缺少已验证的新 API 契约。确认接口后从现有 catalog 派生，不能手工复制另一套搜索标签。
4. 固定源码的 new Function 导入 shim 是 CSP 与设计债务，不证明笔记文字被拼接执行。Playwright page.evaluate 内构造器与元素同 realm，相关 instanceof 发现不是 Obsidian 弹出窗口缺陷。
5. 删除链接时共享 global regex 的疑点尚未确认，replace 可能重置 lastIndex；没有运行反例不能标成已复现 bug。
6. realpath/stat/read 间文件替换需要同机写权限；未确认远程目录包含检查绕过。演示 HTML 本来具有脚本执行能力，必须保持 loopback。
7. 设置保存跨两个存储，不是原子事务。本地写失败传播可防止静默丢密钥；并发事务持久化仍需先测得乱序失败案例并明确回滚责任。
8. 根 Mermaid 升至 11.17.2 并锁定依赖；导出工具链仍有 advisories，按实际执行暴露评估，不强制 major 升级，也不声称零漏洞。
9. 单一 main.js 仍含较重 renderer；现有 render-host 审计证明自包含包装，不证明独立运行时隔离。后续拆分必须同步交付、审计、版本化运行时资产。
10. 原生 Drawnix 拖动后连线附着仍需真实消费端证据；路由正确与关系元数据保留不等于编辑器附着语义已通过。

## 发布策略

先交付安全与所有权修复，保持已工作的生成链路。旧凭据保留，按 Vault 显式导入；保留用户请求 PNG、兼容副本、各类型独立格式选择、无固定关系配额和独立演示设置。以 fresh build、全量 Jest、lint ratchet、UI/render-host 审计、真实 1Knowledge CLI、双语文档及全部网站语言为门禁。推送 main 后核对 Linux/Windows CI，以唯一 publisher 发布数字 tag 1.9.10，校验四个不可变资产，再在公开 Release 与 chronicle 完成后显式部署 Pages。当前执行证据见双语计划与验收记录。
