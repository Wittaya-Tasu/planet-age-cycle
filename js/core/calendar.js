/**
 * Gregorian/Buddhist calendar helpers for the พระเคราะห์เสวยอายุ WebApp.
 * All calculations use a fixed Asia/Bangkok offset (+07:00).
 */

export const BANGKOK_OFFSET_MINUTES = 420;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function buddhistToGregorian(yearBE) {
  return Number(yearBE) - 543;
}

export function gregorianToBuddhist(yearCE) {
  return Number(yearCE) + 543;
}

export function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  if (month < 1 || month > 12) throw new RangeError("month must be 1-12");
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function normalizeBirthParts(input) {
  const year = input.year ?? (input.yearBE != null ? buddhistToGregorian(input.yearBE) : undefined);
  const result = {
    year: Number(year),
    month: Number(input.month),
    day: Number(input.day),
    hour: Number(input.hour ?? 0),
    minute: Number(input.minute ?? 0)
  };
  validateDateParts(result);
  return result;
}

export function validateDateParts(parts) {
  const { year, month, day, hour = 0, minute = 0 } = parts;
  if (!Number.isInteger(year) || year < 1) throw new RangeError("invalid year");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("invalid month");
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError("invalid day for month");
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError("invalid hour");
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError("invalid minute");
  return true;
}

export function bangkokPartsToEpochMs(input) {
  const p = normalizeBirthParts(input);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) -
    BANGKOK_OFFSET_MINUTES * MINUTE_MS;
}

export function epochMsToBangkokParts(epochMs) {
  const d = new Date(epochMs + BANGKOK_OFFSET_MINUTES * MINUTE_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes()
  };
}

export function addCalendarYearsClamped(input, yearsToAdd) {
  const p = normalizeBirthParts(input);
  if (!Number.isInteger(yearsToAdd)) throw new TypeError("yearsToAdd must be an integer");
  const targetYear = p.year + yearsToAdd;
  const targetDay = Math.min(p.day, daysInMonth(targetYear, p.month));
  return {
    parts: { ...p, year: targetYear, day: targetDay },
    adjustedForLeapDay: p.month === 2 && p.day === 29 && targetDay === 28
  };
}

/**
 * Uses the original birth date as the anchor every time.
 * A 29-Feb birth maps to 28-Feb in non-leap years and returns to 29-Feb in leap years.
 */
export function birthdayAnniversaryEpochMs(birthInput, elapsedYears) {
  const result = addCalendarYearsClamped(birthInput, elapsedYears);
  return {
    epochMs: bangkokPartsToEpochMs(result.parts),
    adjustedForLeapDay: result.adjustedForLeapDay,
    parts: result.parts
  };
}

export function addCalendarMonthsClamped(input, monthsToAdd) {
  const p = normalizeBirthParts(input);
  if (!Number.isInteger(monthsToAdd)) throw new TypeError("monthsToAdd must be an integer");
  const zeroBased = (p.month - 1) + monthsToAdd;
  const targetYear = p.year + Math.floor(zeroBased / 12);
  const targetMonth = ((zeroBased % 12) + 12) % 12 + 1;
  const targetDay = Math.min(p.day, daysInMonth(targetYear, targetMonth));
  return { ...p, year: targetYear, month: targetMonth, day: targetDay };
}

export function addCalendarDays(input, daysToAdd) {
  const p = normalizeBirthParts(input);
  const ms = bangkokPartsToEpochMs(p) + daysToAdd * DAY_MS;
  return epochMsToBangkokParts(ms);
}

export function getGregorianWeekday(input) {
  const p = normalizeBirthParts(input);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

export function isLeapDayBirth(input) {
  const p = normalizeBirthParts(input);
  return p.month === 2 && p.day === 29;
}

export function getLeapDayNoticeTh(input) {
  return isLeapDayBirth(input)
    ? "ผู้เกิดวันที่ 29 กุมภาพันธ์: ในปีที่ไม่มีวันที่ 29 กุมภาพันธ์ ระบบจะใช้วันที่ 28 กุมภาพันธ์ เวลาเดิมเป็นวันครบรอบชั่วคราว และจะกลับไปใช้วันที่ 29 กุมภาพันธ์ในปีอธิกสุรทิน"
    : null;
}

function compareParts(a, b) {
  return bangkokPartsToEpochMs(a) - bangkokPartsToEpochMs(b);
}

/**
 * Calendar difference in Bangkok time. Useful for current age and time remaining.
 * Seconds are intentionally omitted because the source system uses minute precision.
 */
export function calendarDifference(startEpochMs, endEpochMs) {
  if (endEpochMs < startEpochMs) throw new RangeError("end must not be before start");

  const start = epochMsToBangkokParts(startEpochMs);
  const endMs = endEpochMs;

  let years = Math.max(0, epochMsToBangkokParts(endMs).year - start.year);
  while (bangkokPartsToEpochMs(addCalendarYearsClamped(start, years).parts) > endMs) years -= 1;
  while (bangkokPartsToEpochMs(addCalendarYearsClamped(start, years + 1).parts) <= endMs) years += 1;

  let cursor = addCalendarYearsClamped(start, years).parts;
  let months = 0;
  while (months < 11) {
    const next = addCalendarMonthsClamped(cursor, 1);
    if (bangkokPartsToEpochMs(next) > endMs) break;
    cursor = next;
    months += 1;
  }

  let days = 0;
  while (days < 31) {
    const next = addCalendarDays(cursor, 1);
    if (bangkokPartsToEpochMs(next) > endMs) break;
    cursor = next;
    days += 1;
  }

  const remainderMinutes = Math.max(
    0,
    Math.floor((endMs - bangkokPartsToEpochMs(cursor)) / MINUTE_MS)
  );
  const hours = Math.floor(remainderMinutes / 60);
  const minutes = remainderMinutes % 60;

  return { years, months, days, hours, minutes };
}

export function formatThaiDateTime(epochMs, { includeTime = true } = {}) {
  const options = {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "buddhist"
  };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = false;
  }
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", options).format(new Date(epochMs));
}

export function formatDurationTh(duration) {
  const parts = [];
  if (duration.years) parts.push(`${duration.years} ปี`);
  if (duration.months) parts.push(`${duration.months} เดือน`);
  if (duration.days) parts.push(`${duration.days} วัน`);
  if (duration.hours) parts.push(`${duration.hours} ชั่วโมง`);
  if (duration.minutes) parts.push(`${duration.minutes} นาที`);
  return parts.length ? parts.join(" ") : "0 นาที";
}
