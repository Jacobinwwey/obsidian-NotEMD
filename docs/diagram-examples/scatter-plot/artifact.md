# dataChart

> Preview this chart using the "Preview diagram" command in Notemd.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Scatter plot of six paired observations showing latency at each sample number.",
  "width": 640,
  "height": 360,
  "data": {
    "values": [
      {
        "x": 1,
        "y": 12,
        "series": "Samples"
      },
      {
        "x": 2,
        "y": 15,
        "series": "Samples"
      },
      {
        "x": 3,
        "y": 18,
        "series": "Samples"
      },
      {
        "x": 4,
        "y": 20,
        "series": "Samples"
      },
      {
        "x": 5,
        "y": 23,
        "series": "Samples"
      },
      {
        "x": 6,
        "y": 29,
        "series": "Samples"
      }
    ]
  },
  "mark": "point",
  "encoding": {
    "x": {
      "field": "x",
      "type": "quantitative",
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
