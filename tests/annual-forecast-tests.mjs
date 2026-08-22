import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { calculateMahabhutaMap } from "../js/core/mahabhuta.js";
import { calculateChulasakarat } from "../js/core/thaiCalendar.js";
import {
  buildAnnualForecast,
  calculatePhumiYear,
  createAnutaksaProjection,
  relationPolarity,
} from "../js/core/annualForecast.js";
import { getRelationship } from "../js/core/relationships.js";
import { addYearsFromBirth, datePartsToEpoch } from "../js/core/calendar.js";
import {
  buildCalendarMonthSegments,
  formatCalendarMonthLabel,
  getCurrentCalendarMonthSegment,
} from "../js/components/annual-view.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const json = async (name) => JSON.parse(await readFile(`${root}data/${name}`, "utf8"));
const planets = await json("planets.json");
const kalayok = await json("kalayok-positions.json");
const relationships = await json("planet-relationships.json");
const boundaries = await json("annual-boundaries.json");
const annualConfig = await json("annual-forecast.json");

assert.equal(annualConfig.defaultAgeBasis, "yang_age");
assert.equal(annualConfig.calendarMode, "gregorian_proportional_projection");
assert.equal(annualConfig.anutaksaCanonicalYearDays, 360);
assert.equal(
  Object.values(annualConfig.anutaksaDurationsDays).reduce((sum, value) => sum + value, 0),
  360,
);
assert.deepEqual(annualConfig.anutaksaDurationsDays, {
  "1": 20,
  "2": 50,
  "3": 26,
  "4": 57,
  "5": 64,
  "6": 70,
  "7": 33,
  "8": 40,
});

// ภูมิทักษา: อายุย่างเริ่มนับ 1 ที่ดาววันเกิด และวนครบ 8 ปี
const saturnAge1 = calculatePhumiYear({
  birthPlanet: 7,
  completedAgeYears: 0,
  ageBasis: "yang_age",
  config: annualConfig,
});
assert.equal(saturnAge1.calculationAge, 1);
assert.equal(saturnAge1.planet, 7);
assert.equal(saturnAge1.thaksaPosition.nameTh, "บริวาร");

const saturnAge2 = calculatePhumiYear({
  birthPlanet: 7,
  completedAgeYears: 1,
  ageBasis: "yang_age",
  config: annualConfig,
});
assert.equal(saturnAge2.planet, 5);
assert.equal(saturnAge2.thaksaPosition.nameTh, "อายุ");

const saturnAge8 = calculatePhumiYear({
  birthPlanet: 7,
  completedAgeYears: 7,
  ageBasis: "yang_age",
  config: annualConfig,
});
assert.equal(saturnAge8.planet, 4);
assert.equal(saturnAge8.thaksaPosition.nameTh, "กาลี");

const saturnAge9 = calculatePhumiYear({
  birthPlanet: 7,
  completedAgeYears: 8,
  ageBasis: "yang_age",
  config: annualConfig,
});
assert.equal(saturnAge9.planet, 7);
assert.equal(saturnAge9.thaksaPosition.nameTh, "บริวาร");

// โหมดอายุเต็มเป็นคนละโหมดและต้องไม่ถูกสลับโดยเงียบ ๆ
const fullAge = calculatePhumiYear({
  birthPlanet: 7,
  completedAgeYears: 2,
  ageBasis: "full_age",
  config: annualConfig,
});
assert.equal(fullAge.calculationAge, 2);
assert.equal(fullAge.planet, 5);

// อนุทักษาเริ่มจากดาวภูมิอายุ และใช้กำลังจำเพาะคงที่ตามตำรา
const birthDate = { yearBe: 2533, month: 11, day: 22 };
const birthTime = { hour: 7, minute: 0 };
const yearStart = addYearsFromBirth(birthDate, birthTime, 35);
const yearEnd = addYearsFromBirth(birthDate, birthTime, 36);
const projection = createAnutaksaProjection({
  yearStartEpochMs: yearStart,
  yearEndEpochMs: yearEnd,
  phumiPlanet: 4,
  config: annualConfig,
});
assert.deepEqual(projection.map((item) => item.planet), [4, 7, 5, 8, 6, 1, 2, 3]);
assert.deepEqual(projection.map((item) => item.canonicalDays), [57, 33, 64, 40, 70, 20, 50, 26]);
assert.equal(projection[0].startEpochMs, yearStart);
assert.equal(projection.at(-1).endEpochMs, yearEnd);
for (let i = 1; i < projection.length; i += 1) {
  assert.equal(projection[i - 1].endEpochMs, projection[i].startEpochMs);
}

// แท่งเดือนปฏิทินต้องใช้แกนเวลาเดียวกับอนุทักษาและตัดที่รอยต่อเดือนจริง
const monthSegments = buildCalendarMonthSegments({ yearStartEpochMs: yearStart, yearEndEpochMs: yearEnd });
assert.equal(monthSegments[0].startEpochMs, yearStart);
assert.equal(monthSegments.at(-1).endEpochMs, yearEnd);
assert.equal(monthSegments.length, 13, "ปีชีวิตที่เริ่มกลางเดือนต้องมีเดือนต้น/ปลายแบบ partial รวมเป็น 13 ชิ้นที่ต่อเนื่อง");
assert.equal(
  monthSegments[0].endEpochMs,
  datePartsToEpoch({ yearBe: 2568, month: 12, day: 1 }, { hour: 0, minute: 0, second: 0 }),
);
assert.equal(
  monthSegments.at(-1).startEpochMs,
  datePartsToEpoch({ yearBe: 2569, month: 11, day: 1 }, { hour: 0, minute: 0, second: 0 }),
);
for (let i = 1; i < monthSegments.length; i += 1) {
  assert.equal(monthSegments[i - 1].endEpochMs, monthSegments[i].startEpochMs);
}
assert.equal(formatCalendarMonthLabel({ month: 5, yearBe: 2569 }), "พ.ค.69");
const currentMonthProbe = datePartsToEpoch(
  { yearBe: 2569, month: 8, day: 22 },
  { hour: 18, minute: 53, second: 0 },
);
const highlightedMonth = getCurrentCalendarMonthSegment(monthSegments, currentMonthProbe);
assert.ok(highlightedMonth);
assert.equal(highlightedMonth.month, 8);
assert.equal(highlightedMonth.yearBe, 2569);
assert.equal(formatCalendarMonthLabel(highlightedMonth), "ส.ค.69");

// ความสัมพันธ์รองรับผลผสม ไม่บังคับให้เหลือเขียวหรือแดงด้านเดียว
assert.equal(relationPolarity(getRelationship(relationships, 1, 5)), "supportive");
assert.equal(relationPolarity(getRelationship(relationships, 1, 3)), "conflicting");
assert.equal(relationPolarity(getRelationship(relationships, 2, 5)), "mixed");
assert.equal(relationPolarity(getRelationship(relationships, 1, 2)), "neutral");

// ตัวอย่างจริง: เกิดอาทิตย์ 22 พ.ย. 2533, ปีชีวิตอายุเต็ม 35 มีภูมิพุธ (อายุย่าง 36)
const profile = {
  birthDayType: "sunday",
  birthDate,
  birthTime,
  targetDate: { yearBe: 2569, month: 8, day: 22 },
};
const birthPlanet = 1;
const birthCs = calculateChulasakarat(profile.birthDate, profile.birthTime, boundaries);
assert.equal(birthCs.status, "exact");
const natalKalayokMap = calculateMahabhutaMap(birthCs.value, kalayok);
const annual = buildAnnualForecast({
  profile,
  birthPlanet,
  natalKalayokMap,
  planetsData: planets,
  kalayokData: kalayok,
  relationshipsData: relationships,
  boundariesConfig: boundaries,
  annualConfig,
});

assert.equal(annual.completedAgeYears, 35);
assert.equal(annual.ageYang, 36);
assert.equal(annual.phumi.planet, 4);
assert.equal(annual.phumi.thaksaPosition.nameTh, "ศรี");
assert.equal(annual.anutaksa.length, 8);
assert.equal(annual.anutaksa[0].planet, 4);
assert.equal(annual.anutaksa[0].startEpochMs, annual.yearStartEpochMs);
assert.equal(annual.anutaksa.at(-1).endEpochMs, annual.yearEndEpochMs);
assert.ok(annual.subPeriods.length >= 1);
assert.ok(annual.subPeriods.every((item) => item.overlapFraction > 0));
assert.ok(annual.boundaryEvents.length >= 1, "ปีชีวิต พ.ย. 2568–พ.ย. 2569 ต้องคร่อมเถลิงศก 2569");
assert.ok(
  annual.anutaksa.some((period) => period.pieces.length > 1),
  "ต้องมีอย่างน้อยหนึ่งช่วงอนุทักษาที่ถูกแบ่งเมื่อกาลโยคเปลี่ยนกลางปี",
);

// ราหูไม่ถูกยัดเข้ากาลโยค 7 ดาว
const rahuPeriod = annual.anutaksa.find((period) => period.planet === 8);
assert.ok(rahuPeriod);
assert.ok(rahuPeriod.pieces.every((piece) => piece.state.quality === "unknown"));

// UI/architecture checks
const indexSource = await readFile(`${root}index.html`, "utf8");
const appSource = await readFile(`${root}js/app.js`, "utf8");
const annualViewSource = await readFile(`${root}js/components/annual-view.js`, "utf8");
const swSource = await readFile(`${root}sw.js`, "utf8");
assert.match(indexSource, /ผลประจำปี/);
assert.match(indexSource, /อายุย่าง/);
assert.match(indexSource, /อายุเต็ม/);
assert.match(appSource, /buildAnnualForecast/);
assert.match(appSource, /annualAgeBasis/);
assert.match(annualViewSource, /drawRelationConnectors/);
assert.match(annualViewSource, /drawBoundaryEvents/);
assert.match(annualViewSource, /formatCalendarMonthLabel/);
assert.match(annualViewSource, /getCurrentCalendarMonthSegment/);
assert.match(annualViewSource, /monthCurrentFill/);
assert.match(annualViewSource, /จ\.ศ\./);
assert.match(swSource, /maha-thasa-v0\.9\.4/);
assert.match(annualViewSource, /drawMonthBar/);
assert.match(annualViewSource, /hideRahuUnknownLabel/);

console.log("✓ ภูมิทักษาใช้ดาวละ 1 ปี เริ่มนับจากดาวเกิด และอายุย่างเป็นค่าเริ่มต้น");
console.log("✓ อนุทักษาใช้กำลังจำเพาะคงที่ 20, 50, 26, 57, 33, 64, 40, 70 รวม 360 วัน");
console.log("✓ ฉายอนุทักษาลงปีปฏิทินจริงแบบสัดส่วนโดยไม่มีช่องว่างและไม่มีช่วงซ้อน");
console.log("✓ กาลโยคประจำปีเปลี่ยนได้กลางช่วงอนุทักษาเมื่อผ่านเถลิงศก");
console.log("✓ ราหูคงสถานะนอกมหาภูติ และความสัมพันธ์แบบ mixed ไม่ถูกบังคับให้เป็นด้านเดียว");
console.log("✓ เดือนปฏิทินใช้รอยต่อวันที่ 1 ของเดือนจริง และใช้แกนเวลาเดียวกับอนุทักษา");
console.log("✓ หน้าใหม่ ‘ผลประจำปี’ เชื่อมมหาทศา ดาวแทรก ภูมิทักษา อนุทักษา และกาลโยคประจำปีแล้ว");
