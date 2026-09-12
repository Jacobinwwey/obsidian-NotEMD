# Office 保真度与中文排版

## 可编辑文本

**中文粗体 Bold** 与常规 Latin 共用基线。行内代码 `const retry = 3` 必须保持可读。

- 第一项 / First item
- 第二项包含足够长的内容，需要自然换行，不能产生第二个项目符号，也不能覆盖相邻段落。

<p style="font-family: 'Notemd Deliberately Missing Font', 'Microsoft YaHei', sans-serif">缺失字体回退：中文内容仍然可以编辑。</p>

## 表格度量

| 契约 | 中英文内容 | 状态 |
| --- | --- | --- |
| 取消 | 晚到响应不能重新写入文件 | 已验证 |
| 恢复 | 保留外部编辑的内容，并保存可恢复的写入前像。 | 已验证 |
| 边界 | 长文本应在单元格内换行，并保留四周内边距。This text must not overlap an adjacent cell. | 待复核 |

<table><tr><th colspan="2">合并标题 / Merged header</th></tr><tr><td>左 Left</td><td>右 Right</td></tr></table>

## 图层顺序

<div style="position:relative;width:700px;height:220px;background:#e2e8f0;padding:20px"><div style="position:absolute;left:40px;top:40px;width:400px;height:100px;background:#2563eb;color:white;padding:16px">背层 / Background layer</div><div style="position:absolute;left:300px;top:90px;width:300px;height:90px;background:#f59e0b;padding:16px">前层 / Foreground layer</div></div>

## 图表回退

```mermaid
flowchart LR
    A[输入 Input] --> B[处理 Work]
    B --> C[输出 Output]
```

Mermaid 几何继续采用明确的图片 fallback，周围文本保持可编辑。
