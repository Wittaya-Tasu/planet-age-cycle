# วิธีอัปเดต มหาทศา v0.8.0 → v0.8.1

## เป้าหมายของรุ่นนี้

1. แก้หน้า Wheel ว่าง
2. ใช้ Sarabun ทั้งระบบ
3. เปลี่ยนการหาจุลศักราชเป็น Suriyayatra engine ที่คำนวณใน WebApp โดยไม่เรียก MyHora runtime

## วิธีติดตั้ง

1. สำรอง Repository ปัจจุบัน
2. แตก `maha-thasa-v0.8.1-update-only.zip`
3. อัปโหลดไฟล์และโฟลเดอร์ภายใน ZIP ไปที่ root ของ Repository เดิม โดยรักษา path
4. ยืนยันการแทนที่ไฟล์เดิม
5. Commit
6. รอ GitHub Pages deploy
7. ปิดแท็บ WebApp เดิมทั้งหมด แล้วเปิดใหม่ / Hard Refresh เพื่อให้ Service Worker เปลี่ยนจาก v0.8.0 เป็น v0.8.1

## หมายเหตุ Font

ไฟล์ Sarabun `.woff2` มีอยู่ใน `assets/fonts/` ของ Repository เดิมอยู่แล้ว รุ่นนี้เพียงเปิดใช้ `css/fonts.css` และเปลี่ยน stylesheet/PNG export ให้เรียก Sarabun อย่างสม่ำเสมอ

## ไฟล์หลักที่เปลี่ยน

- `index.html`
- `package.json`
- `sw.js`
- `css/fonts.css`
- `css/base.css`
- `css/visuals.css`
- `js/core/relationships.js`
- `js/components/wheel.js`
- `js/components/timeline.js`
- `js/core/exportImage.js`
- `js/core/thaiCalendar.js`
- `data/annual-boundaries.json`
- `tests/run-tests.mjs`
- เอกสาร README / CHANGELOG / PROJECT_STATE
