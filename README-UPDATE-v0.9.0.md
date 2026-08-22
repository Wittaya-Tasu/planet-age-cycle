# วิธีอัปเดต มหาทศา v0.8.2 → v0.9.0

ชุดนี้เป็น **update-only** สำหรับ Repository `Wittaya-Tasu/planet-age-cycle` ที่ฐานเป็น v0.8.2

## ไฟล์ใหม่

- `css/annual.css`
- `data/annual-forecast.json`
- `js/core/annualForecast.js`
- `js/components/annual-view.js`
- `knowledge/07-มหาทักษา-ภูมิทักษา.md`
- `knowledge/08-มหาทักษา-อนุทักษาพยากรณ์.md`
- `tests/annual-forecast-tests.mjs`
- `README-UPDATE-v0.9.0.md`
- `TEST-REPORT-v0.9.0.md`

## ไฟล์ที่แทนที่

- `index.html`
- `package.json`
- `sw.js`
- `js/app.js`
- `js/data/loadData.js`
- `js/core/exportImage.js`
- `tests/run-tests.mjs`
- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `README.md`

## วิธีอัปโหลด

1. สำรอง Repository v0.8.2 ก่อน
2. แตก ZIP `maha-thasa-v0.9.0-update-only.zip`
3. อัปโหลดไฟล์และโฟลเดอร์ทั้งหมดไปที่ root ของ Repository
4. ยืนยันการแทนที่ไฟล์เดิมและ Commit
5. รอ GitHub Pages deploy
6. ปิด WebApp เดิมทุกแท็บ แล้วเปิดใหม่ / Hard Refresh เพื่อให้ Service Worker เปลี่ยน cache เป็น `maha-thasa-v0.9.0`

## จุดตรวจหลังอัปเดต

- หลังคำนวณต้องเห็น Tab `มหาทศา` และ `ผลประจำปี`
- หน้าผลประจำปีต้องมีแท่ง 4 ชั้นจากซ้ายไปขวา
- อนุทักษาต้องมี 8 ช่วงและวันเริ่ม–สิ้นสุด
- ถ้าปีชีวิตคร่อมเถลิงศก ต้องเห็นเส้น `จ.ศ.` และสีประจำปีเปลี่ยนตามรอยต่อ
- ราหูต้องเป็นสีเทาในชั้นกาลโยค
- ปุ่มบันทึกภาพต้องทำงานทั้งหน้ามหาทศาและหน้าผลประจำปี
