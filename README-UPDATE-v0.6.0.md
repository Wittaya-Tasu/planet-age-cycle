# วิธีอัปเดต WebApp เป็น v0.6.0

## ไฟล์ที่ต้องอัปโหลดแทนที่

| Path |
|---|
| `index.html` |
| `package.json` |
| `sw.js` |
| `CHANGELOG.md` |
| `PROJECT_STATE.md` |
| `README.md` |
| `README-UPDATE-v0.6.0.md` |
| `data/day-planet-relations.json` |
| `css/layout.css` |
| `css/responsive.css` |
| `js/app.js` |
| `js/core/exportImage.js` |
| `js/core/relations.js` |
| `js/components/wheel.js` |
| `js/components/timeline.js` |

## สิ่งที่เปลี่ยน

1. แสดงสัญลักษณ์ความสัมพันธ์ดี–ไม่ดีล่วงหน้าทั้งวงล้อและ Timeline
2. ย้ายสัญลักษณ์ของแถบหลักไปไว้ด้านในของวงหลัก
3. เพิ่ม Timeline แนวนอน พร้อมเส้นบอกอายุปัจจุบัน
4. คลิก Timeline เพื่อดูรายละเอียดและคำพยากรณ์ได้
5. ปุ่มบันทึกภาพรองรับทั้งวงล้อและ Timeline
6. Cache เปลี่ยนเป็น `planet-age-cycle-v0.6.0`

## วิธีอัปโหลด

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `planet-age-cycle-v0.6.0-update-only`
3. เข้า Repository แล้วเลือก **Add file → Upload files**
4. ลากไฟล์และโฟลเดอร์ทั้งหมดไปวางที่ระดับบนสุด
5. ยืนยันการแทนที่ไฟล์เดิม แล้ว Commit
6. รอ GitHub Pages เผยแพร่
7. ปิดหน้า WebApp เดิมแล้วเปิดใหม่
