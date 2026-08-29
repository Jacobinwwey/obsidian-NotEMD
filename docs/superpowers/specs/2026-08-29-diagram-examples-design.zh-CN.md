---
date: 2026-08-29
last_updated: 2026-08-29
topic: diagram-examples
status: approved
canonical_for:
  - diagram-examples
  - real-vault-diagram-evidence
supersedes: []
superseded_by: null
implementation_plan: docs/superpowers/plans/2026-08-29-diagram-examples-implementation.zh-CN.md
---

# 图表示例与实机 Vault 证据设计

## 决策

在 `docs/diagram-examples/` 建立由 catalog 驱动的学习与证据目录。目录为当前 33 个可执行图表类型各建立一个子目录，包含双语输入笔记，以及在已配置的 `E:\1Knowledge` Vault 中通过真实 provider 生成并复制的图表/Artifact 结果。

该目录与 `docs/assets/diagrams/` 明确分离。现有 gallery 是用于产品预览覆盖的确定性 fixture gallery；新目录是学习资料与集成实测记录。只有当插件真实的 provider 生成命令成功完成，且复制的文件确实来自该次运行时，结果才能标记为 real-vault evidence。

实现应围绕现有命令和导出边界建立小型 catalog 驱动编排器，不得引入第二套图表 renderer、复制参考截图，或维护一份与 fixture 重复的手工类型列表。

## 目标与非目标

目标：

- 为每个可执行 catalog 类型提供一份英文输入 Markdown 和一份简体中文输入 Markdown。
- 使用运行中的 `E:\1Knowledge` Vault 与已配置 provider 实测全部类型。
- 保存便于快速检查的真实 Artifact 与图像证据。
- 让每个示例同时具备学习价值：说明输入事实、选择的类型/target，以及输出中应关注的阅读线索。
- 通过 manifest、每类型 machine-test 记录、哈希和 `check` 模式实现可重复、可审计的运行。
- 只保存 Vault 相对路径和脱敏运行元数据，使仓库保持可移植。
- 将双语入口加入 docs 站点导航，确保资料可发现。

非目标：

- 替换现有静态 gallery 或其 fixture 生成流程。
- 在没有现有 consumer 门禁时宣称 Draw.io、Drawnix、Circuitikz 或其他外部消费者兼容。
- 提交 provider 凭据、完整本地路径、含 secret 的请求体或未脱敏 provider 日志。
- 新增 diagram DSL，或改变 diagram catalog、renderer 契约、preview UI。
- provider 失败时静默回退到 fixture 并将其标记为成功示例。

## 目录契约

```text
docs/diagram-examples/
  README.md
  README.zh-CN.md
  manifest.json
  <type-id>/
    input.md
    input.zh-CN.md
    result.svg
    result.png
    artifact.<target-extension>
    machine-test.json
```

`<type-id>` 必须是 `EXECUTABLE_DIAGRAM_TYPES` 中的稳定 ID，不得使用显示标题或 fixture ID。实现必须创建且只创建每个可执行 ID 对应的一个目录，并拒绝重复或缺失 ID。

每类文件只承担一个职责：

- `input.md`：提交给 provider 的英文源笔记。
- `input.zh-CN.md`：语义等价的简体中文源笔记，保留相同事实、标识符和关系，并翻译说明性文字。
- `artifact.<target-extension>`：真实命令写出的主 Artifact。扩展名从所选 render target descriptor 解析，不能按语义类型猜测。
- `result.svg`：真实运行提供的 SVG 视觉 companion。若 target 本身输出 SVG，则它就是主视觉结果；若 target 无法产生 SVG，必须明确记录，不得伪造转换。
- `result.png`：真实运行提供的 PNG 视觉 companion。PNG 必须沿用现有导出路径和固定导出参数。
- `machine-test.json`：记录该类型的运行契约、状态、元数据与诊断，不得包含凭据或未脱敏 provider payload。

顶层两个 README 解释流程、状态词汇、输入/输出的阅读方式，并链接全部 33 个示例。英文和中文采用兄弟文件，遵循仓库现有文档约定。

## Manifest Schema

`manifest.json` 是机器可读索引，也是 `check` 模式的输入。其可追加 schema 为：

```ts
interface DiagramExamplesManifest {
    schemaVersion: 1;
    generatedAt: string;
    catalogSource: 'src/diagram/diagramTypeCatalog.ts';
    expectedCount: number;
    entries: DiagramExampleManifestEntry[];
}

interface DiagramExampleManifestEntry {
    typeId: string;
    fixtureId: string;
    title: string;
    intent: string;
    target: string;
    inputPath: string;
    inputZhPath: string;
    artifactPath: string | null;
    svgPath: string | null;
    pngPath: string | null;
    status: 'passed' | 'failed' | 'unavailable';
    providerId: string | null;
    model: string | null;
    generatedAt: string | null;
    artifactSha256: string | null;
    svgSha256: string | null;
    pngSha256: string | null;
    sourceNotePath: string | null;
    diagnostic: string | null;
}
```

Manifest 只保存仓库相对文档路径。`sourceNotePath` 是临时/证据前缀下的 Vault 相对路径；复制完成并清理 Vault 后，只作为逻辑标识保留。禁止绝对路径、包含凭据的 API URL、授权 header 和原始 provider 响应。provider 与 model 名称可以保留，因为它们是有用的实测证据且不是 secret。

`generatedAt` 仅作说明，不应单独导致 `check` 失败。哈希、类型成员、文件存在性、状态和路径一致性属于硬校验。失败或 unavailable 是有效证据，但会让 generation 命令返回非零，除非调用方明确选择仅报告模式；`check` 始终报告这些状态。

## 源文档与生成流程

每个 catalog 行按 catalog 顺序执行以下流程：

```text
catalog 行 + fixture 自有示例语义
  -> 双语输入 Markdown
  -> 临时 Vault 源笔记
  -> 带 requestedTypeId + requestedRenderTarget 的 maintainer diagram.generate
  -> provider 生成 Artifact 与 companion 发现
  -> 复制 Artifact/SVG/PNG 到 docs/diagram-examples/<type-id>/
  -> 写 machine-test 记录与 manifest 行
  -> 删除临时源笔记和 Vault 中生成的文件
```

输入笔记从 catalog 自有的可执行 fixture 契约派生，不复制 gallery 图片。请求必须传递 `requestedTypeId` 及该行声明的默认 target（或明确记录的兼容 target），防止 planner 推断出其他类型。操作仍复用现有 host-neutral `diagram.generate` 契约，通过 maintainer bridge 和官方 Obsidian `eval` fallback 调用。

生成器可以使用 Vault 外的短生命周期本地 staging 目录保存请求和复制结果。每个示例结束或整次运行结束时删除 staging。若需要 bundle reload，只能使用已经验证的官方 CLI `eval` disable/enable 序列；不能依赖当前桌面会话中不可靠的 `plugin:reload`。

结果发现优先使用 operation 返回的 `outputPath` 和 follow-through metadata，其次使用 `diagramCommandHostAdapter.ts` 已有的 companion 约定。写入前必须确认每个复制结果属于本次源笔记和目标类型，不能把上一次运行的旧文件当作当前证据。

## 状态与错误处理

每个示例只有一个终态：

- `passed`：provider 生成成功，请求的类型/target 匹配，至少复制了主 Artifact 或视觉 companion，且展示校验通过。
- `failed`：provider 或 renderer 报错、输出格式错误、类型/target 不匹配，或复制/哈希校验失败。
- `unavailable`：当前 Vault/runtime 无法执行所配置 provider 或 target。这是明确限制，不是成功。

失败必须按类型隔离，保证一次运行记录所有尝试过的类型。写完记录并完成清理后，只要有 `failed` 或 `unavailable`，进程就返回非零。清理放在 `finally` 中并且幂等：只能删除生成器专属临时前缀下的文件，绝不删除用户已有笔记或已有 Artifact。

错误文本必须限制长度并脱敏。记录可以包含错误码、阶段（`input`、`provider`、`render`、`copy`、`validation` 或 `cleanup`）和短消息，但不得包含请求 header、API key、完整 provider response 或绝对机器路径。

provider 超时时该示例为 `failed`，记录超时并继续清理。不能无限重试，也不能把不完整 Artifact 标为 passed。重新运行只替换对应示例目录的生成文件，且必须先验证新结果；其他文档和用户修改保持不变。

## 学习内容契约

每对输入文件必须包含：

1. 简短标题与用途。
2. 与该类型相符、包含命名实体/关系/数值的紧凑场景。
3. 与 catalog 行一致的 `Requested diagram type` 和 `Requested render target`。
4. 两到三个阅读线索，说明学习者应在输出中确认什么。
5. 说明该文件是输入示例，输出是带有 provider 元数据记录的 real-vault evidence。

双语输入必须事实和语义等价。不得要求模型输出 Mermaid、SVG、Vega-Lite、TikZ、坐标、CSS 或其他 renderer 语法；这些边界由生产 prompt profile 管理。定量示例必须提供明确数值和单位。结构型示例必须在对应 profile 限制内提供有界节点、边或层级。

## 文档导航

将新的英文和简体中文 README 页面按 gallery 的语言专属标签和链接方式加入 VitePress navigation/sidebar。README 链接全部类型目录和 manifest。导航本身不嵌入生成二进制；每类型页面可以引用本地 `result.png`，方便快速查看。

现有 `docs/diagram-gallery*` 页面保持不变，最多增加一个指向实机证据目录的交叉链接。静态 gallery 声明和 real-vault evidence 声明必须在文字和视觉上保持区分。

## 确定性与可复现

以下是生成器的确定性输入：

- catalog 顺序和 ID；
- fixture 自有示例语义；
- target 与 compatibility mode；
- 输入语言对；
- 现有导出契约中的尺寸/PPI；
- manifest 路径规则与 `sha256` 哈希算法。

provider 输出可能变化。因此 manifest 记录 provider/model 和时间，并用 status 与哈希描述本次捕获结果；不宣称独立 provider 调用之间字节完全一致。`check` 校验已提交捕获结果与 manifest；新的 `generate` 创建新证据集并明确记录变化的哈希。

## 测试与验收

仅当以下条件全部满足才接受实现：

- catalog 枚举得到恰好 33 个唯一示例目录；
- 每个目录都有双语输入 Markdown 和有效 machine-test 记录；
- 每个 passed 条目都有真实 Artifact 或视觉 companion、有效 SHA-256 哈希，以及匹配的类型/target 元数据；
- manifest 路径没有逃出 `docs/diagram-examples/`；
- 生成记录不含绝对 Vault 路径或疑似 secret 的 provider 数据；
- 运行结束后 Vault 中不存在临时源笔记和生成 Artifact；
- `generate --check`（或仓库等价命令）能发现缺失文件、过期哈希、重复 ID 和 catalog 漂移；
- focused tests 覆盖 catalog 到目录映射、manifest 校验、脱敏、清理和失败聚合；
- 完整 Jest、build、docs build、gallery check、bundle verifier 与 `git diff --check` 通过；
- 生成文档同时能从两套语言导航树访问。

实现计划必须对生成器纯函数采用 TDD，并为真实命令边界提供受保护的集成测试。CI 中的集成测试可以使用确定性的 fake maintainer response；但实际 `E:\1Knowledge` 运行必须作为 release/evidence 输出记录，不能被 fake 取代。

## 拒绝的替代方案

- **平铺文件**：目录少，但类型身份难以扫描，input/result/artifact 名称容易冲突。
- **按 renderer family 分组**：结构紧凑，却要求用户先理解 target 分类，且更容易隐藏 catalog 漂移。
- **只复制 fixture**：确定性高、成本低，但不能测试 provider 配置或真实 Obsidian 命令路径，会把静态输出误标为集成证据。
- **每类一个中英合并 Markdown**：与仓库 sibling language convention 冲突，也让 VitePress 语言路由不稳定。

