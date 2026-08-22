# วิธีอัปเดต มหาทศา v0.9.1 → v0.9.2

## ไฟล์สำคัญที่เปลี่ยน

- `index.html`
- `css/layout.css`
- `css/annual.css`
- `css/responsive.css`
- `js/app.js`
- `js/components/annual-view.js`
- `package.json`
- `sw.js`
- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `README.md`
- `README-UPDATE-v0.9.2.md`
- `TEST-REPORT-v0.9.2.md`
- `UPDATE-MANIFEST-v0.9.2.json`

## สิ่งที่เปลี่ยนหลัก

1. เปลี่ยนช่องวันที่คำนวณอายุเป็น `วันที่ / เดือน / ปี พ.ศ.`
2. หน้า `ผลประจำปี` ปรับแท่งหลัก 4 แท่งให้กว้างเท่ากัน
3. เลขอายุในแท่ง `ดาวเสวยอายุหลัก` ผูกกับโหมด `อายุย่าง / อายุเต็ม`
4. เพิ่มแถบเดือนปฏิทิน 12 เดือนทางขวาของแท่งอนุทักษา
5. PWA cache เปลี่ยนเป็น `maha-thasa-v0.9.2`

## วิธีนำขึ้น GitHub

1. แตก ZIP ชุดอัปเดต หรือแทนที่ไฟล์ตามรายการด้านบน
2. Commit และ push ไปยัง branch ที่ใช้ deploy
3. รอ GitHub Pages build ใหม่
4. หากเปิดหน้าเว็บแล้วยังเห็นหน้าตาเก่า ให้ hard refresh หรือปิด Service Worker cache เดิม

## หมายเหตุ

- Local storage key เปลี่ยนเป็น `maha-thasa-profile-v0.9.2` เพื่อหลีกเลี่ยงข้อมูลค้างจากโครง input แบบเดิม
- ทดสอบผ่าน `npm test` แล้ว
