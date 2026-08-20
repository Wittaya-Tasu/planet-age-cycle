# วิธีอัปเดตมหาทศาเป็น v0.8.2

ให้อัปโหลดไฟล์ใน ZIP นี้ทับไฟล์เดิมที่ root ของ Repository

## ไฟล์ที่เปลี่ยน

- `index.html`
- `package.json`
- `sw.js`
- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `README.md`
- `README-UPDATE-v0.8.2.md`
- `data/planet-relationships.json`
- `css/layout.css`
- `css/visuals.css`
- `css/responsive.css`
- `js/app.js`
- `js/core/relationships.js`
- `js/core/exportImage.js`
- `js/components/wheel.js`
- `js/components/timeline.js`
- `js/components/subperiod-explorer.js`
- `tests/run-tests.mjs`

## หลัง Commit

1. รอ GitHub Pages deploy
2. ปิด WebApp เดิมทุกแท็บ
3. เปิดใหม่ หรือ Hard Refresh
4. ตรวจว่า version badge เป็น `v0.8.2`
5. ทดสอบทั้ง `วงกลม`, `Timeline` และ `บันทึกภาพ`

Service Worker cache เปลี่ยนเป็น `maha-thasa-v0.8.2`
