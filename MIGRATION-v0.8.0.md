# Migration Notes — v0.7.1 → v0.8.0

## Conceptual migration

ระบบเดิม:

```text
Birth → 108-year cycle → prediction text → ✓/! relation
```

ระบบใหม่:

```text
Birth data
  ├─ Civil calendar / age
  ├─ Chulasakarat
  │    └─ Natal Mahabhuta Kalayok (1–7)
  └─ Birth planet
       └─ 108-year Maha Thasa cycle (1,2,3,4,7,5,8,6)
            ├─ main period
            ├─ sub period
            ├─ Mahabhuta visual quality
            └─ planet relationship to birth planet
```

Prediction semantic layer ยังไม่เปิดใช้ใน UI รุ่นนี้
