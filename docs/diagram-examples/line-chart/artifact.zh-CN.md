# 渲染时间趋势

> 使用 Notemd 的“预览图表”命令查看此图表。

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Render time decreases across versions v1 to v4, from 22 to 12.",
  "width": 640,
  "height": 360,
  "data": {
    "values": [
      {
        "x": "v1",
        "y": 22,
        "series": "Render time"
      },
      {
        "x": "v2",
        "y": 19,
        "series": "Render time"
      },
      {
        "x": "v3",
        "y": 16,
        "series": "Render time"
      },
      {
        "x": "v4",
        "y": 12,
        "series": "Render time"
      }
    ]
  },
  "mark": "line",
  "encoding": {
    "x": {
      "field": "x",
      "type": "ordinal",
      "title": "Category"
    },
    "y": {
      "field": "y",
      "type": "quantitative",
      "title": "Value"
    }
  }
}
```
