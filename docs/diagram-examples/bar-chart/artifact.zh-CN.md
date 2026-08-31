# 功能采用率

> 使用 Notemd 的“预览图表”命令查看此图表。

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Adoption percentages for four features, with Search highest at 82% and History lowest at 31%.",
  "width": 640,
  "height": 360,
  "data": {
    "values": [
      {
        "x": "Search",
        "y": 82,
        "series": "Adoption"
      },
      {
        "x": "Preview",
        "y": 64,
        "series": "Adoption"
      },
      {
        "x": "Export",
        "y": 47,
        "series": "Adoption"
      },
      {
        "x": "History",
        "y": 31,
        "series": "Adoption"
      }
    ]
  },
  "mark": "bar",
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
