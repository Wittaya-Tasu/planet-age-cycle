# วิธีอัปเดต WebApp เป็น v0.5.0

## ไฟล์ที่ต้องอัปโหลดแทนที่

| Path |
|---|
| `index.html` |
| `package.json` |
| `sw.js` |
| `CHANGELOG.md` |
| `PROJECT_STATE.md` |
| `README.md` |
| `css/layout.css` |
| `css/wheel.css` |
| `js/app.js` |
| `js/core/angles.js` |
| `js/core/calendar.js` |
| `js/core/calendarJourney.js` |
| `js/components/wheel.js` |
| `js/components/journey-summary.js` |
| `js/components/detail-panel.js` |
| `tests/run-tests.mjs` |

## สิ่งที่เปลี่ยน

1. พระเคราะห์ประจำวันเกิดเริ่มที่ตำแหน่ง 12 นาฬิกา
2. วงล้อทั้งวงหมุนตามวันเกิด แต่สัดส่วนและระยะเวลาทุกแถบไม่เปลี่ยน
3. เอาวงกลมล้อมเลขวันเกิดออก
4. วันที่ในกล่อง “ช่วงชีวิตปัจจุบัน” ใช้ชื่อเดือนแบบย่อ
5. กล่องรายละเอียดแสดงแถบเวลาสีน้ำเงิน/สีเทาของช่วงปัจจุบัน
6. ตัดข้อความสรุปคำพยากรณ์ที่ซ้ำกับรายละเอียด
7. Cache เปลี่ยนเป็น `planet-age-cycle-v0.5.0`

## วิธีอัปโหลด

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `planet-age-cycle-v0.5.0-update-only`
3. เข้า Repository แล้วเลือก **Add file → Upload files**
4. ลากไฟล์และโฟลเดอร์ทั้งหมดไปวางที่ระดับบนสุด
5. ยืนยันการแทนที่ไฟล์เดิม แล้ว Commit
6. รอ GitHub Pages เผยแพร่
7. ปิดหน้า WebApp เดิมแล้วเปิดใหม่

> ชุดนี้ไม่รวม `data/predictions.json` และไม่เขียนทับคำพยากรณ์ 64 ช่วง
