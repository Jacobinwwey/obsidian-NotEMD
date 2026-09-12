# Office fidelity / 中文排版

## Editable text

**Bold 中文** and regular Latin share a baseline. Inline `const retry = 3` must remain readable.

- First item / 第一项
- A second item with enough text to wrap onto another line without a second bullet or overlapping paragraphs.

<p style="font-family: 'Notemd Deliberately Missing Font', 'Microsoft YaHei', sans-serif">Missing-font fallback: 缺字回退仍然可编辑。</p>

## Table metrics

| Contract | English and Chinese | Status |
| --- | --- | --- |
| Cancellation | 晚到响应不能重新写入文件 | Verified |
| Recovery | Keep externally edited content and retain the recoverable preimage. | Verified |
| Bounds | Long cell text wraps inside the cell with padding on every side. 这段中文不能覆盖相邻单元格。 | Review |

<table><tr><th colspan="2">Merged header / 合并标题</th></tr><tr><td>Left 左</td><td>Right 右</td></tr></table>

## Layer order

<div style="position:relative;width:700px;height:220px;background:#e2e8f0;padding:20px"><div style="position:absolute;left:40px;top:40px;width:400px;height:100px;background:#2563eb;color:white;padding:16px">Background layer / 背层</div><div style="position:absolute;left:300px;top:90px;width:300px;height:90px;background:#f59e0b;padding:16px">Foreground layer / 前层</div></div>

## Diagram fallback

```mermaid
flowchart LR
    A[输入 Input] --> B[处理 Work]
    B --> C[输出 Output]
```

Mermaid geometry remains an explicit image fallback. Surrounding text stays editable.
