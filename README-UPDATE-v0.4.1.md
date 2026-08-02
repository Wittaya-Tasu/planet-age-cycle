# วิธีอัปเดต WebApp เป็น v0.4.1

## ไฟล์ที่ต้องอัปโหลดแทนที่

| Path |
|---|
| `index.html` |
| `package.json` |
| `sw.js` |
| `CHANGELOG.md` |
| `PROJECT_STATE.md` |
| `README.md` |
| `css/wheel.css` |
| `css/responsive.css` |
| `js/components/wheel.js` |
| `js/components/detail-panel.js` |
| `tests/run-tests.mjs` |

## สิ่งที่เปลี่ยน

1. สัญลักษณ์ดี/ไม่ดีในแถบหลักถูกเยื้องออกจากเลขพระเคราะห์
2. สัญลักษณ์แถบย่อยย้ายไปอยู่นอกวงแหวนและมีเส้นเชื่อม
3. กล่อง “ช่วงชีวิตปัจจุบัน” อยู่เหนือกล่องรายละเอียด
4. กล่องรายละเอียดตัดข้อมูลที่ซ้ำกับกล่องช่วงชีวิตปัจจุบัน
5. Cache อัปเดตเป็น `planet-age-cycle-v0.4.1`

## วิธีอัปโหลด

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `planet-age-cycle-v0.4.1-update-only`
3. เข้า Repository แล้วเลือก **Add file → Upload files**
4. ลากไฟล์และโฟลเดอร์ทั้งหมดไปวางที่ระดับบนสุด
5. ยืนยันการแทนที่ไฟล์เดิม และ Commit
6. รอ GitHub Pages เผยแพร่
7. ปิด WebApp เดิมแล้วเปิดใหม่

> ชุดนี้ไม่รวม `data/predictions.json` จึงไม่เขียนทับข้อมูล “พระพุธแทรกพระราหู” ที่เพิ่มไว้แล้ว
