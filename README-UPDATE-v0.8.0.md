# วิธีอัปเดต Repository เป็น มหาทศา v0.8.0

v0.8.0 เป็น Major Update จึงแนะนำให้ใช้ **Full Repository ZIP** มากกว่าอัปโหลดเฉพาะ patch

## วิธีที่แนะนำ

1. สำรอง Repository v0.7.1 เดิมไว้ก่อน
2. แตก `maha-thasa-v0.8.0-repository.zip`
3. นำไฟล์ภายในโฟลเดอร์ไปแทนไฟล์ระบบเดิม
4. Commit ขึ้น GitHub
5. รอ GitHub Pages deploy
6. ปิดแท็บ WebApp เดิมทั้งหมด
7. เปิดใหม่และทำ Hard Refresh หนึ่งครั้ง

## ไฟล์เดิมที่ v0.8.0 ไม่ใช้งานแล้ว

ไฟล์เหล่านี้สามารถลบภายหลังได้เพื่อให้ Repository สะอาด:

```text
data/predictions.json
data/day-planet-relations.json
js/core/predictionLookup.js
js/core/relations.js
js/components/detail-panel.js
js/components/legend.js
js/components/tooltip.js
```

หากยังไม่ลบก็ไม่กระทบการทำงาน เพราะ v0.8.0 ไม่ import ไฟล์เหล่านี้

## ข้อจำกัดปฏิทินที่ต้องทราบ

annual boundary dataset ใน package นี้ยังมีข้อมูลเถลิงศกที่ตรวจสอบแล้วเฉพาะตัวอย่าง ค.ศ. 1984 ตามองค์ความรู้ที่ผู้ใช้ส่งมา

ระบบจึง **ไม่เดา** ค่าจุลศักราชสำหรับวันเกิดในเดือนเมษายนของปีที่ยังไม่มี boundary ตรวจสอบ แต่จะแสดงค่าที่เป็นไปได้สองค่าแทน
