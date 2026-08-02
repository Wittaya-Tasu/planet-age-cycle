# วิธีอัปเดต WebApp เป็น v0.4.2

## ไฟล์ที่ต้องอัปโหลดแทนที่

| Path |
|---|
| `index.html` |
| `package.json` |
| `sw.js` |
| `CHANGELOG.md` |
| `PROJECT_STATE.md` |
| `README.md` |
| `data/day-planet-relations.json` |
| `js/core/relations.js` |
| `js/components/wheel.js` |
| `tests/run-tests.mjs` |

## เงื่อนไขใหม่

สัญลักษณ์ดี/ไม่ดีจะแสดงเฉพาะช่วงที่ตรงกับอายุปัจจุบัน:

| วงแหวน | วิธีตรวจ |
|---|---|
| แถบหลักปัจจุบัน | ตรวจดาวเสวยกับวันเกิด |
| แถบย่อยปัจจุบัน | ตรวจดาวแทรกกับวันเกิด |
| แถบอื่น | ไม่แสดง |
| ดาวที่ไม่มีในตาราง | ไม่แสดง |

## วิธีอัปโหลด

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `planet-age-cycle-v0.4.2-update-only`
3. เข้า Repository แล้วเลือก **Add file → Upload files**
4. ลากไฟล์และโฟลเดอร์ทั้งหมดไปวางที่ระดับบนสุด
5. ยืนยันการแทนที่ไฟล์เดิม แล้ว Commit
6. รอ GitHub Pages อัปเดต
7. ปิด WebApp เดิมและเปิดใหม่ เพื่อรับ Cache v0.4.2

> ชุดนี้ไม่รวม `data/predictions.json` จึงไม่เขียนทับคำพยากรณ์ทั้ง 64 ช่วง
