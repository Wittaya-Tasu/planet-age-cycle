# TEST REPORT — มหาทศา v0.9.0

## Automated tests

คำสั่ง:

```bash
npm test
```

ผล: **ผ่านทั้งหมด**

## Regression เดิม

- ลำดับดาว 108 ปี
- ดาวแทรกปิดพอดีกับช่วงดาวหลัก
- พุธกลางคืนเริ่มราหูตามกฎโครงการ
- เถลิงศก/จุลศักราชสุริยยาตร์
- กาลโยคมหาภูติ
- ความสัมพันธ์หลายแท็ก
- Wheel / Timeline UI invariants
- PNG export และ regression `EXPORT_HEIGHT`
- Sarabun / PWA cache

## Tests ใหม่

- ภูมิทักษาดาวละ 1 ปีและเริ่มจากดาววันเกิด
- อายุย่างเป็น default; อายุเต็มเป็น explicit mode
- remainder 8 / การวนรอบภูมิ
- กำลังจำเพาะอนุทักษารวม 360 วัน
- ค่าอังคาร = 26 และพฤหัส = 64 ตามค่าคงที่ต้นฉบับ
- ลำดับอนุทักษาเริ่มจากดาวภูมิอายุ
- Gregorian proportional projection ปิดครบวันเกิดปีนี้→ปีถัดไป ไม่มี gap/overlap
- รอยต่อเถลิงศกแบ่ง dynamic Mahabhuta state กลางช่วงได้
- ราหูไม่ถูกสร้างตำแหน่งกาลโยคปลอม
- relationship polarity: supportive / conflicting / mixed / neutral
- หน้า `ผลประจำปี`, age-basis control และ annual SVG อยู่ใน app shell
- Service Worker cache เป็น `maha-thasa-v0.9.0`

## Syntax check

ตรวจ `node --check` กับ JavaScript ใหม่/แก้ไขสำคัญแล้วผ่าน
