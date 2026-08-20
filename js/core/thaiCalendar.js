import {
  buddhistToGregorian,
  datePartsToEpoch,
  gregorianToBuddhist,
} from "./calendar.js";

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

// เกณฑ์อัตตาเถลิงศกตามคัมภีร์สุริยยาตร์
const DEFAULT_SURIYAYATRA = Object.freeze({
  epochCeYear: 638,
  epochMonth: 3,
  epochDay: 25,
  solarYearKammach: 292_207,
  epochKammach: 373,
  kammachPerDay: 800,
  bangkokLocalMeanUtcOffsetMinutes: 6 * 60 + 42,
  thailandStandardUtcOffsetMinutes: 7 * 60,
});

function getSuriyayatraConfig(config = {}) {
  const source = config.suriyayatra ?? config;
  return {
    ...DEFAULT_SURIYAYATRA,
    ...(source.constants ?? {}),
    ...(source.timeConvention ?? {}),
  };
}

function utcParts(epochMs) {
  const date = new Date(epochMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

function compareDateToBoundary(date, boundary) {
  const ceYear = buddhistToGregorian(date.yearBe);
  const dateKey = ceYear * 10_000 + date.month * 100 + date.day;
  const boundaryKey = boundary.standardParts.year * 10_000 + boundary.standardParts.month * 100 + boundary.standardParts.day;
  return dateKey - boundaryKey;
}

/**
 * คำนวณวันเวลาเถลิงศกของปี ค.ศ. ตามเกณฑ์สุริยยาตร์
 *
 * สูตรแกนกลาง:
 *   JD = ((292207 * CS) + 373) / 800 + 1954167.5
 * โดย CS = CE - 638
 *
 * สูตรดังกล่าวให้เวลาในขนบเวลาท้องถิ่นกรุงเทพฯเดิม (UTC+06:42)
 * ระบบจึงบวกส่วนต่าง 18 นาที เพื่อเปรียบเทียบกับเวลาไทยมาตรฐาน UTC+07:00
 */
export function calculateThaloengSokBoundary(ceYear, config = {}) {
  if (!Number.isInteger(ceYear)) throw new Error("ปี ค.ศ. สำหรับคำนวณเถลิงศกต้องเป็นจำนวนเต็ม");

  const c = getSuriyayatraConfig(config);
  const chulasakarat = ceYear - c.epochCeYear;
  const suriyayatraDays = ((c.solarYearKammach * chulasakarat) + c.epochKammach) / c.kammachPerDay;

  // ใช้ Date.UTC เป็นตัวแปลง proleptic Gregorian เท่านั้น จึงอ่านค่าด้วย getUTC* เพื่อไม่ให้ timezone ของเครื่องมีผล
  const epochPseudoUtc = Date.UTC(c.epochCeYear, c.epochMonth - 1, c.epochDay, 0, 0, 0);
  const localMeanPseudoUtc = Math.round(epochPseudoUtc + suriyayatraDays * DAY_MS);
  const standardAdjustmentMinutes = c.thailandStandardUtcOffsetMinutes - c.bangkokLocalMeanUtcOffsetMinutes;
  const standardPseudoUtc = localMeanPseudoUtc + standardAdjustmentMinutes * MINUTE_MS;

  const localMeanParts = utcParts(localMeanPseudoUtc);
  const standardParts = utcParts(standardPseudoUtc);
  const standardEpochMs = datePartsToEpoch(
    {
      yearBe: gregorianToBuddhist(standardParts.year),
      month: standardParts.month,
      day: standardParts.day,
    },
    {
      hour: standardParts.hour,
      minute: standardParts.minute,
      second: standardParts.second,
    },
  );

  return {
    ceYear,
    chulasakarat,
    csBefore: chulasakarat - 1,
    csAfter: chulasakarat,
    localMeanParts,
    standardParts,
    standardEpochMs,
    standardAdjustmentMinutes,
    method: config.calculationMethod ?? "suriyayatra-thaloeng-sok-v1",
  };
}

export function calculateChulasakarat(date, time, config = {}) {
  const ceYear = buddhistToGregorian(date.yearBe);
  const boundary = calculateThaloengSokBoundary(ceYear, config);
  const comparison = compareDateToBoundary(date, boundary);
  const warnings = [];
  const validationRange = config.validationScope?.myHoraCoverageBe;
  if (Array.isArray(validationRange) && validationRange.length === 2) {
    const [minBe, maxBe] = validationRange;
    if (date.yearBe < minBe || date.yearBe > maxBe) {
      warnings.push(`ปี พ.ศ. ${date.yearBe} อยู่นอกช่วง ${minBe}–${maxBe} ที่ชุดทดสอบของโครงการสอบทานกับ MyHora โดยตรง ผลยังคำนวณจากสูตรสุริยยาตร์ แต่ควรสอบทานเพิ่มเติมหากใช้กับข้อมูลประวัติศาสตร์`);
    }
  }

  if (comparison < 0) {
    return {
      status: "exact",
      value: boundary.csBefore,
      method: boundary.method,
      boundary,
      warnings,
    };
  }

  if (comparison > 0) {
    return {
      status: "exact",
      value: boundary.csAfter,
      method: boundary.method,
      boundary,
      warnings,
    };
  }

  if (!time) {
    return {
      status: "ambiguous",
      values: [boundary.csBefore, boundary.csAfter],
      method: boundary.method,
      boundary,
      warnings: [
        ...warnings,
        "เกิดตรงวันเถลิงศกแต่ไม่ทราบเวลา จึงระบุจุลศักราชได้สองค่า ระบบไม่สมมติเวลาเกิดเป็น 00:00 น.",
      ],
    };
  }

  const birthEpochMs = datePartsToEpoch(date, time);
  return {
    status: "exact",
    value: birthEpochMs >= boundary.standardEpochMs ? boundary.csAfter : boundary.csBefore,
    method: boundary.method,
    boundary,
    warnings,
  };
}
