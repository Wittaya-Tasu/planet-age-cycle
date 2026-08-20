const BANGKOK_OFFSET = "+07:00";
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_SHORT_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export const BE_OFFSET = 543;

export function buddhistToGregorian(yearBe) {
  return Number(yearBe) - BE_OFFSET;
}

export function gregorianToBuddhist(yearCe) {
  return Number(yearCe) + BE_OFFSET;
}

export function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function validateCivilDate({ yearBe, month, day }) {
  const year = buddhistToGregorian(yearBe);
  if (!Number.isInteger(year) || year < 1) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  return Number.isInteger(day) && day >= 1 && day <= daysInMonth(year, month);
}

export function datePartsToEpoch({ yearBe, month, day }, time = null, defaultHour = 12) {
  const ce = buddhistToGregorian(yearBe);
  const hour = time?.hour ?? defaultHour;
  const minute = time?.minute ?? 0;
  const second = time?.second ?? 0;
  const iso = `${String(ce).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}${BANGKOK_OFFSET}`;
  return Date.parse(iso);
}

export function epochToBangkokParts(epochMs) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(epochMs));
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

export function civilWeekday({ yearBe, month, day }) {
  const ce = buddhistToGregorian(yearBe);
  return new Date(Date.UTC(ce, month - 1, day)).getUTCDay();
}

export function civilWeekdayName(date) {
  return THAI_WEEKDAYS[civilWeekday(date)];
}

export function addYearsFromBirth(birthDate, time, years) {
  const targetCe = buddhistToGregorian(birthDate.yearBe) + years;
  const month = birthDate.month;
  let day = birthDate.day;
  if (month === 2 && day === 29 && !isLeapYear(targetCe)) day = 28;
  return datePartsToEpoch({ yearBe: gregorianToBuddhist(targetCe), month, day }, time, 12);
}

export function interpolateEpoch(startEpochMs, endEpochMs, fraction) {
  return Math.round(startEpochMs + (endEpochMs - startEpochMs) * fraction);
}

export function calculateCalendarAge(birth, target) {
  const birthCe = buddhistToGregorian(birth.yearBe);
  const targetCe = buddhistToGregorian(target.yearBe);
  let years = targetCe - birthCe;
  let months = target.month - birth.month;
  let days = target.day - birth.day;

  if (days < 0) {
    months -= 1;
    const previousMonth = target.month === 1 ? 12 : target.month - 1;
    const previousYear = target.month === 1 ? targetCe - 1 : targetCe;
    days += daysInMonth(previousYear, previousMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function compareCivilDates(a, b) {
  const av = buddhistToGregorian(a.yearBe) * 10000 + a.month * 100 + a.day;
  const bv = buddhistToGregorian(b.yearBe) * 10000 + b.month * 100 + b.day;
  return av - bv;
}

export function currentBangkokDate() {
  const p = epochToBangkokParts(Date.now());
  return { yearBe: gregorianToBuddhist(p.year), month: p.month, day: p.day };
}

export function isTodayBangkok(date) {
  return compareCivilDates(date, currentBangkokDate()) === 0;
}

export function targetDateToEpoch(date) {
  if (isTodayBangkok(date)) return Date.now();
  return datePartsToEpoch(date, { hour: 12, minute: 0 }, 12);
}

export function formatThaiDate(date) {
  return `${date.day} ${THAI_MONTHS[date.month - 1]} ${date.yearBe}`;
}

export function formatThaiDateShortFromEpoch(epochMs, includeTime = true) {
  const p = epochToBangkokParts(epochMs);
  const base = `${p.day} ${THAI_SHORT_MONTHS[p.month - 1]} ${gregorianToBuddhist(p.year)}`;
  if (!includeTime) return base;
  return `${base} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")} น.`;
}

export function formatAge(age) {
  return `${age.years} ปี ${age.months} เดือน ${age.days} วัน`;
}

export function calendarDifferenceDates(startEpochMs, endEpochMs) {
  const a = epochToBangkokParts(startEpochMs);
  const b = epochToBangkokParts(endEpochMs);
  return calculateCalendarAge(
    { yearBe: gregorianToBuddhist(a.year), month: a.month, day: a.day },
    { yearBe: gregorianToBuddhist(b.year), month: b.month, day: b.day },
  );
}
