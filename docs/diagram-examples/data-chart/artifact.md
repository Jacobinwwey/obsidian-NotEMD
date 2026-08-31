# dataChart

> Preview this chart using the "Preview diagram" command in Notemd.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Render time increases from baseline to board to presentation.",
  "width": 640,
  "height": 360,
  "data": {
    "values": [
      {
        "x": "baseline",
        "y": 12,
        "series": "Render time"
      },
      {
        "x": "board",
        "y": 16,
        "series": "Render time"
      },
      {
        "x": "presentation",
        "y": 19,
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
