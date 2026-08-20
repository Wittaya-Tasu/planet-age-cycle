# Test Report — มหาทศา v0.8.1

## Automated test

คำสั่ง:

```bash
npm test
```

ผลล่าสุด: **PASS**

ตรวจสอบแล้ว:

- ลำดับดาว 8 ดวงและ 108 ปี
- ดาวแทรก 8 ช่วงปิดพอดีกับดาวหลัก
- พุธกลางคืน → ราหู (8) ยังคงเดิม
- self-relation คืน `otherLabels: []`
- Wheel / Timeline มี defensive check ต่อ relation ที่ไม่มี label
- Sarabun ถูกเรียกใช้ใน UI / SVG / PNG
- เถลิงศก พ.ศ. 2527 และ พ.ศ. 2569 ตรงกับ validation source
- validation samples พ.ศ. 2300, 2400, 2500, 2527, 2569, 2600 ตรงกับสูตร
- เวลาไทยมาตรฐาน UTC+07:00 ถูกปรับจาก local mean Bangkok UTC+06:42 +18 นาที
- ไม่ทราบเวลาเกิดตรงวันเถลิงศก → `ambiguous`
- regression `EXPORT_HEIGHT` ไม่กลับมา
- Service Worker เป็น `maha-thasa-v0.8.1`

## JavaScript syntax

ตรวจ `node --check` กับไฟล์หลักที่เปลี่ยนแล้ว: **PASS**
