# พระเคราะห์เสวยอายุ

WebApp แสดงวงจร “พระเคราะห์เสวยอายุ” เป็นวงแหวน SVG ซ้อนกัน 2 ชั้น
โดยคำนวณความกว้างของทุกแถบตามสัดส่วนเวลาจริงในวงจร 108 ปี

## Repository ที่แนะนำ

| รายการ | ค่าแนะนำ |
|---|---|
| ชื่อ Repository | `planet-age-cycle` |
| ประเภท | Public |
| Branch | `main` |
| GitHub Pages source | Deploy from a branch → `main` → `/ (root)` |
| URL หลังเผยแพร่ | `https://wittaya-tasu.github.io/planet-age-cycle/` |

## ฟีเจอร์ใน v0.1.0

- วงแหวนหลัก 8 ส่วน เรียง `1 → 2 → 3 → 4 → 7 → 5 → 8 → 6`
- วงแหวนย่อย 8 ส่วนต่อแถบหลัก รวม 64 ส่วน
- ขนาดแถบหลักและแถบย่อยคำนวณตามสัดส่วนเวลา ไม่ได้แบ่งเท่ากัน
- Tooltip เมื่อชี้เมาส์ และแผงรายละเอียดเมื่อแตะหรือคลิก
- ใช้งานด้วยคีย์บอร์ดด้วยปุ่ม `Tab`, `Enter` และ `Space`
- Responsive สำหรับ iPhone 16+, iPad Pro 13 นิ้ว และคอมพิวเตอร์
- PWA พร้อมติดตั้งบน Home Screen และเก็บไฟล์สำหรับใช้งานออฟไลน์
- Validation ตรวจผลรวม 108 ปี, 360 องศา และ 64 แถบย่อยก่อนวาด

## วิธีนำขึ้น GitHub Pages

1. เข้า GitHub แล้วสร้าง Repository ใหม่ชื่อ `planet-age-cycle`
2. เลือก `Public` และกดสร้าง Repository
3. แตกไฟล์ ZIP ที่ได้รับ
4. อัปโหลด **ไฟล์และโฟลเดอร์ทั้งหมดภายในโฟลเดอร์ `planet-age-cycle`**
   ไปไว้ที่ระดับบนสุดของ Repository
5. เปิด `Settings → Pages`
6. ที่หัวข้อ `Build and deployment` เลือก:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
7. กด `Save` แล้วรอ GitHub สร้างหน้าเว็บ
8. เปิด `https://wittaya-tasu.github.io/planet-age-cycle/`

> อย่าอัปโหลดไฟล์ ZIP ทั้งก้อนเข้า Repository เพราะ GitHub Pages จะไม่แตก ZIP ให้

## เพิ่มเป็น App บน iPhone หรือ iPad

1. เปิดลิงก์ WebApp ด้วย Safari
2. แตะปุ่ม **แชร์**
3. เลือก **เพิ่มไปยังหน้าจอโฮม**
4. ตรวจชื่อ “เสวยอายุ” แล้วแตะ **เพิ่ม**

WebApp รองรับทั้งแนวตั้งและแนวนอน และใช้พื้นที่ Safe Area ของอุปกรณ์ Apple

## เปิดทดสอบในเครื่อง

เนื่องจากโค้ดใช้ JavaScript ES Modules ไม่ควรเปิด `index.html` ด้วยการดับเบิลคลิก
ให้เปิดผ่าน Local Server:

```bash
python3 -m http.server 8000
```

จากนั้นเปิด `http://localhost:8000`

## รัน Automated Checks

ต้องมี Node.js 18 ขึ้นไป:

```bash
npm test
```

ชุดทดสอบจะตรวจ:

- ลำดับและจำนวนแถบหลัก
- ผลรวม 108 ปีและ 360 องศา
- จำนวนแถบย่อยรวม 64 ส่วน
- ลำดับย่อยแบบหมุน Array
- ผลรวมเวลาย่อยของแต่ละกลุ่ม
- ตัวอย่างการแปลง ปี เดือน วัน นาที
- Web App Manifest

## สูตรสำคัญ

```text
mainAngle = mainYears ÷ 108 × 360
subAngle = mainAngle × subPlanetWeight ÷ 108
totalAstroMinutes = mainYears × subPlanetWeight × 200
```

เกณฑ์หน่วยเวลา:

| หน่วย | เท่ากับ |
|---|---:|
| 60 นาทีโหราศาสตร์ | 1 วัน |
| 30 วัน | 1 เดือน |
| 12 เดือน | 1 ปี |
| 1 ปี | 21,600 นาทีโหราศาสตร์ |

## โครงสร้างไฟล์

```text
planet-age-cycle/
├── index.html
├── manifest.webmanifest
├── sw.js
├── package.json
├── README.md
├── PROJECT_STATE.md
├── CHANGELOG.md
├── assets/
│   ├── icons/
│   └── images/
├── css/
├── js/
│   ├── app.js
│   ├── data/
│   ├── core/
│   ├── components/
│   └── utils/
├── knowledge/
└── tests/
```

## ข้อจำกัดของเวอร์ชันแรก

เวอร์ชันนี้ยังไม่มี:

- การรับวันเกิด
- การคำนวณช่วงเสวยอายุปัจจุบันของแต่ละบุคคล
- การไฮไลต์ช่วงปัจจุบัน
- คำทำนาย
- ระบบสมาชิกและฐานข้อมูลออนไลน์

ข้อมูลและสูตรหลักถูกแยกจาก UI แล้ว จึงสามารถเพิ่มความสามารถเหล่านี้ในเวอร์ชันถัดไปได้
