import { buddhistToGregorian, datePartsToEpoch } from "./calendar.js";

export function calculateChulasakarat(date, time, boundaryData) {
  const ceYear = buddhistToGregorian(date.yearBe);
  const candidate = ceYear - 638;
  const previous = candidate - 1;
  const entry = boundaryData.entries.find((item) => item.ceYear === ceYear);

  if (date.month < 4) {
    return { status: "exact", value: previous, method: "outside-april-before-boundary", warnings: [] };
  }
  if (date.month > 4) {
    return { status: "exact", value: candidate, method: "outside-april-after-boundary", warnings: [] };
  }

  if (!entry) {
    return {
      status: "ambiguous",
      values: [previous, candidate],
      method: boundaryData.calculationMethod,
      warnings: ["ปีเกิดอยู่ในเดือนเมษายน แต่ยังไม่มีข้อมูลวันและเวลาเถลิงศกของปีนั้นที่ผ่านการตรวจสอบ จึงไม่เดาค่าจุลศักราช"],
    };
  }

  const boundary = Date.parse(entry.thaloengSokAt);
  const boundaryDate = new Date(boundary);
  const boundaryBangkokDay = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", day: "numeric" }).format(boundaryDate));

  if (date.day < boundaryBangkokDay) return { status: "exact", value: entry.csBefore, method: boundaryData.calculationMethod, boundary: entry, warnings: [] };
  if (date.day > boundaryBangkokDay) return { status: "exact", value: entry.csAfter, method: boundaryData.calculationMethod, boundary: entry, warnings: [] };

  if (!time) {
    return {
      status: "ambiguous",
      values: [entry.csBefore, entry.csAfter],
      method: boundaryData.calculationMethod,
      boundary: entry,
      warnings: ["เกิดตรงวันเถลิงศกแต่ไม่ทราบเวลา จึงต้องแสดงจุลศักราชได้สองค่า"],
    };
  }

  const birthEpoch = datePartsToEpoch(date, time);
  return {
    status: "exact",
    value: birthEpoch >= boundary ? entry.csAfter : entry.csBefore,
    method: boundaryData.calculationMethod,
    boundary: entry,
    warnings: [],
  };
}
