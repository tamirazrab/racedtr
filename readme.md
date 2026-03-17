```

---

## Expected output to put in your README

This is what separates you — show them you verified it:
```
POST /ingest
{ "laps": 3, "frames": 89 }

GET /laps
[
  { "lapNumber": 1, "lapTime": 133.2,  "sectors": [{"sector":1,"time":43.6}, {"sector":2,"time":47.4}, {"sector":3,"time":42.2}], "avgSpeed": 221.4, "maxSpeed": 291 },
  { "lapNumber": 2, "lapTime": 132.8,  "sectors": [{"sector":1,"time":42.95},{"sector":2,"time":47.15},{"sector":3,"time":42.7}], "avgSpeed": 223.1, "maxSpeed": 292 },
  { "lapNumber": 3, "lapTime": 137.4,  "sectors": [{"sector":1,"time":44.42},{"sector":2,"time":50.97},{"sector":3,"time":42.01}],"avgSpeed": 216.8, "maxSpeed": 286 }
]

GET /analysis
{
  "bestLap":  { "lapNumber": 2, "lapTime": 132.8 },
  "worstLap": { "lapNumber": 3, "lapTime": 137.4, "delta": 4.6 },
  "problemSector": 2,
  "issue": "tyre_overheat",
  "coachingMessage": "Sector 2 is costing you +3.8s. Front right hit 119°C — tyre is cooked. You're overdriving the entry and destroying what's left. Back off 20 metres earlier. Let the temps come down."
}