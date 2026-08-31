# radar

> Preview this chart using the "Preview diagram" command in Notemd.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Radar profile of current capabilities across reliability, latency, and operability on a shared 10-point scale. Cost and coverage axes appeared in the source but lacked series values, so they are omitted from the plotted radar while remaining visible in the evidence references.",
  "width": 560,
  "height": 560,
  "title": {
    "text": "Capability profile",
    "anchor": "start"
  },
  "layer": [
    {
      "data": {
        "values": [
          {
            "x": 0,
            "y": -0.25,
            "order": 0,
            "gridId": "grid-0.25"
          },
          {
            "x": 0.216506,
            "y": 0.125,
            "order": 1,
            "gridId": "grid-0.25"
          },
          {
            "x": -0.216506,
            "y": 0.125,
            "order": 2,
            "gridId": "grid-0.25"
          },
          {
            "x": 0,
            "y": -0.25,
            "order": 3,
            "gridId": "grid-0.25"
          },
          {
            "x": 0,
            "y": -0.5,
            "order": 0,
            "gridId": "grid-0.5"
          },
          {
            "x": 0.433013,
            "y": 0.25,
            "order": 1,
            "gridId": "grid-0.5"
          },
          {
            "x": -0.433013,
            "y": 0.25,
            "order": 2,
            "gridId": "grid-0.5"
          },
          {
            "x": 0,
            "y": -0.5,
            "order": 3,
            "gridId": "grid-0.5"
          },
          {
            "x": 0,
            "y": -0.75,
            "order": 0,
            "gridId": "grid-0.75"
          },
          {
            "x": 0.649519,
            "y": 0.375,
            "order": 1,
            "gridId": "grid-0.75"
          },
          {
            "x": -0.649519,
            "y": 0.375,
            "order": 2,
            "gridId": "grid-0.75"
          },
          {
            "x": 0,
            "y": -0.75,
            "order": 3,
            "gridId": "grid-0.75"
          },
          {
            "x": 0,
            "y": -1,
            "order": 0,
            "gridId": "grid-1"
          },
          {
            "x": 0.866025,
            "y": 0.5,
            "order": 1,
            "gridId": "grid-1"
          },
          {
            "x": -0.866025,
            "y": 0.5,
            "order": 2,
            "gridId": "grid-1"
          },
          {
            "x": 0,
            "y": -1,
            "order": 3,
            "gridId": "grid-1"
          }
        ]
      },
      "mark": {
        "type": "line",
        "color": "#cbd5e1",
        "strokeDash": [
          3,
          3
        ],
        "strokeWidth": 1
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "detail": {
          "field": "gridId",
          "type": "nominal"
        },
        "order": {
          "field": "order",
          "type": "quantitative"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "x": 0,
            "y": 0,
            "order": 0,
            "axisId": "reliability"
          },
          {
            "x": 0,
            "y": -1,
            "order": 1,
            "axisId": "reliability"
          },
          {
            "x": 0,
            "y": 0,
            "order": 0,
            "axisId": "latency"
          },
          {
            "x": 0.866025,
            "y": 0.5,
            "order": 1,
            "axisId": "latency"
          },
          {
            "x": 0,
            "y": 0,
            "order": 0,
            "axisId": "operability"
          },
          {
            "x": -0.866025,
            "y": 0.5,
            "order": 1,
            "axisId": "operability"
          }
        ]
      },
      "mark": {
        "type": "line",
        "color": "#94a3b8",
        "strokeWidth": 1
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "detail": {
          "field": "axisId",
          "type": "nominal"
        },
        "order": {
          "field": "order",
          "type": "quantitative"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "x": 0,
            "y": -0.7,
            "order": 0,
            "series": "Current",
            "seriesId": "current",
            "axisId": "reliability",
            "value": 7
          },
          {
            "x": 0.433013,
            "y": 0.25,
            "order": 1,
            "series": "Current",
            "seriesId": "current",
            "axisId": "latency",
            "value": 5
          },
          {
            "x": -0.519615,
            "y": 0.3,
            "order": 2,
            "series": "Current",
            "seriesId": "current",
            "axisId": "operability",
            "value": 6
          },
          {
            "x": 0,
            "y": -0.7,
            "order": 3,
            "series": "Current",
            "seriesId": "current",
            "axisId": "reliability",
            "value": 7
          }
        ]
      },
      "mark": {
        "type": "line",
        "strokeWidth": 2
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "color": {
          "field": "series",
          "type": "nominal",
          "title": "Profile"
        },
        "detail": {
          "field": "seriesId",
          "type": "nominal"
        },
        "order": {
          "field": "order",
          "type": "quantitative"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "x": 0,
            "y": -0.7,
            "order": 0,
            "series": "Current",
            "seriesId": "current",
            "axisId": "reliability",
            "value": 7
          },
          {
            "x": 0.433013,
            "y": 0.25,
            "order": 1,
            "series": "Current",
            "seriesId": "current",
            "axisId": "latency",
            "value": 5
          },
          {
            "x": -0.519615,
            "y": 0.3,
            "order": 2,
            "series": "Current",
            "seriesId": "current",
            "axisId": "operability",
            "value": 6
          }
        ]
      },
      "mark": {
        "type": "point",
        "filled": true,
        "size": 56
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "color": {
          "field": "series",
          "type": "nominal",
          "title": "Profile"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "x": 0,
            "y": -1.14,
            "order": 0,
            "label": "Reliability",
            "axisId": "reliability"
          },
          {
            "x": 0.987269,
            "y": 0.57,
            "order": 0,
            "label": "Latency",
            "axisId": "latency"
          },
          {
            "x": -0.987269,
            "y": 0.57,
            "order": 0,
            "label": "Operability",
            "axisId": "operability"
          }
        ]
      },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": 12
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "scale": {
            "domain": [
              -1.25,
              1.25
            ]
          },
          "axis": null
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    }
  ],
  "config": {
    "view": {
      "stroke": null
    },
    "axis": {
      "grid": false,
      "domain": false,
      "ticks": false,
      "labels": false
    },
    "legend": {
      "orient": "bottom"
    }
  }
}
```
