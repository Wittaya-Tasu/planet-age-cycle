# วิธีอัปเดต WebApp เป็น v0.7.1

เวอร์ชันนี้เป็น **Hotfix สำหรับปุ่มบันทึกภาพ** จาก v0.7.0

## ปัญหาที่แก้

เมื่อกด **บันทึกภาพ** ใน v0.7.0 ระบบขึ้นข้อความ:

```text
EXPORT_HEIGHT is not defined
```

สาเหตุคือ `exportImage.js` เปลี่ยนมาใช้ความสูงแยกสำหรับวงล้อและ Timeline แล้ว แต่ยังเหลือการอ้างอิงตัวแปรเก่า `EXPORT_HEIGHT` อยู่หนึ่งจุด

## ไฟล์ที่ต้องอัปโหลดแทนที่

- `index.html`
- `package.json`
- `sw.js`
- `CHANGELOG.md`
- `README-UPDATE-v0.7.1.md`
- `js/core/exportImage.js`
- `tests/run-tests.mjs`

## หลังอัปโหลด

1. Commit ไฟล์ทั้งหมด
2. รอ GitHub Pages อัปเดต
3. ปิด WebApp เดิมทุกแท็บ
4. เปิด WebApp ใหม่ แล้วทำ Hard Refresh หนึ่งครั้ง
5. ทดสอบปุ่ม **บันทึกภาพ** ทั้งมุมมองวงล้อและ Timeline

Cache ใหม่คือ `planet-age-cycle-v0.7.1`
