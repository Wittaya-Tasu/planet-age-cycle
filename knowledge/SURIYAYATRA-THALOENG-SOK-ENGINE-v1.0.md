# Suriyayatra Thaloeng Sok Engine v1.0

## วัตถุประสงค์

ให้มหาทศาคำนวณรอยต่อปีจุลศักราชภายใน WebApp โดยไม่ต้องเรียกเว็บไซต์ภายนอกทุกครั้ง

## สูตรที่ใช้

```text
CS = CE - 638
JD เถลิงศก = ((292207 × CS) + 373) / 800 + 1954167.5
```

ค่าหลัก `292207`, `373`, `800` เป็นเกณฑ์ของระบบสุริยยาตร์สำหรับปีสุริยะและอัตตาเถลิงศก

## Time convention

แหล่งสอบทาน MyHora ระบุเวลาเถลิงศกในเวลาท้องถิ่นกรุงเทพฯเดิม `UTC+06:42` และระบุว่าหากเทียบกับเวลามาตรฐานไทยปัจจุบัน `UTC+07:00` ให้บวก 18 นาที

ดังนั้นระบบเก็บทั้ง:

- `localMeanParts`
- `standardParts`

และใช้ `standardParts` สำหรับเปรียบเทียบกับเวลาเกิดที่ผู้ใช้กรอก

## Runtime policy

- คำนวณใน browser
- ไม่ scrape MyHora
- ไม่เรียก API ภายนอก
- MyHora ใช้เป็น validation fixture เท่านั้น
- หาก validation source กับสูตรขัดกัน ให้หยุดและตรวจสอบ ไม่ปรับค่าเองแบบเงียบ ๆ

## Unknown birth time

ถ้าเกิดตรงวันเถลิงศกและเวลาเกิดเป็น `null`:

```text
status = ambiguous
values = [CS ก่อนเถลิงศก, CS หลังเถลิงศก]
```

ห้ามสมมติ 00:00 น.

## Validation samples

เก็บตัวอย่างหลายช่วงเวลาใน `data/annual-boundaries.json` เพื่อให้ test ตรวจ regression ของสูตรและ time conversion
