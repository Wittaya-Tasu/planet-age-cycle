# TEST REPORT — มหาทศา v0.9.4

## Automated regression

รันคำสั่ง:

```bash
npm test
```

ผลลัพธ์: **ผ่านทั้งหมด**

## จุดใหม่ที่ตรวจ

- รูปแบบชื่อเดือนย่อ + ปี พ.ศ. 2 หลัก เช่น `พ.ค.69`
- การหา month segment ที่ครอบเวลาปัจจุบัน
- current-month highlight ใช้เฉพาะช่วงเวลาที่อยู่ภายในปีชีวิตที่กำลังแสดง
- regression เดิมของมหาทศา, กาลโยค, ภูมิทักษา, อนุทักษา และ calendar month axis ยังผ่าน
- Service Worker cache เป็น `maha-thasa-v0.9.4`
