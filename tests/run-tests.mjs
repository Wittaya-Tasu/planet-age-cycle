import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { calculateCalendarAge } from "../js/core/calendar.js";
import {
  calculateChulasakarat,
  calculateThaloengSokBoundary,
} from "../js/core/thaiCalendar.js";
import { calculateMahabhutaMap, getKalayokState } from "../js/core/mahabhuta.js";
import { canonicalPair, getRelationship } from "../js/core/relationships.js";
import { buildCycle, rotateSequence, traditionalSubDuration, validateCycle } from "../js/core/mahadasha.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const json = async (name) => JSON.parse(await readFile(`${root}data/${name}`, "utf8"));
const planets = await json("planets.json");
const kalayok = await json("kalayok-positions.json");
const relationships = await json("planet-relationships.json");
const boundaries = await json("annual-boundaries.json");

assert.deepEqual(planets.sequence, [1, 2, 3, 4, 7, 5, 8, 6]);
assert.equal(planets.planets.reduce((sum, p) => sum + p.years, 0), 108);
assert.deepEqual(rotateSequence(planets.sequence, 7), [7, 5, 8, 6, 1, 2, 3, 4]);
assert.equal(planets.birthDayStartPlanet["wednesday-night"], 8);
assert.equal(planets.planets.find((p) => p.number === 8).nature, "bapa");
assert.equal(planets.planets.find((p) => p.number === 5).nature, "subha");

const cycle = buildCycle({
  birthDate: { yearBe: 2527, month: 4, day: 21 },
  birthTime: { hour: 1, minute: 49 },
  startPlanet: 7,
  cycleIndex: 0,
  planetsData: planets,
});
assert.equal(cycle.mainPeriods.length, 8);
assert.equal(validateCycle(cycle), true);
assert.equal(cycle.mainPeriods[0].planet, 7);
assert.equal(cycle.mainPeriods[0].years, 10);
assert.equal(cycle.mainPeriods[0].subperiods.length, 8);
assert.equal(cycle.mainPeriods[0].subperiods[0].subPlanet, 7);
assert.equal(cycle.mainPeriods[0].subperiods.at(-1).endEpochMs, cycle.mainPeriods[0].endEpochMs);

const saturnInSaturn = traditionalSubDuration(10, 10);
assert.deepEqual(saturnInSaturn, { years: 0, months: 11, days: 3, hours: 8 });

const b1984 = calculateThaloengSokBoundary(1984, boundaries);
assert.deepEqual(b1984.localMeanParts, { year: 1984, month: 4, day: 15, hour: 17, minute: 51, second: 0 });
assert.deepEqual(b1984.standardParts, { year: 1984, month: 4, day: 15, hour: 18, minute: 9, second: 0 });
assert.equal(b1984.csAfter, 1346);

const b2026 = calculateThaloengSokBoundary(2026, boundaries);
assert.deepEqual(b2026.localMeanParts, { year: 2026, month: 4, day: 16, hour: 14, minute: 40, second: 12 });
assert.deepEqual(b2026.standardParts, { year: 2026, month: 4, day: 16, hour: 14, minute: 58, second: 12 });
assert.equal(b2026.csAfter, 1388);

for (const sample of boundaries.validationSamples) {
  const boundary = calculateThaloengSokBoundary(sample.ceYear, boundaries);
  const pad = (value) => String(value).padStart(2, "0");
  const localMean = `${boundary.localMeanParts.year}-${pad(boundary.localMeanParts.month)}-${pad(boundary.localMeanParts.day)}T${pad(boundary.localMeanParts.hour)}:${pad(boundary.localMeanParts.minute)}:${pad(boundary.localMeanParts.second)}+06:42`;
  const standard = `${boundary.standardParts.year}-${pad(boundary.standardParts.month)}-${pad(boundary.standardParts.day)}T${pad(boundary.standardParts.hour)}:${pad(boundary.standardParts.minute)}:${pad(boundary.standardParts.second)}+07:00`;
  assert.equal(localMean, sample.localMean, `local mean mismatch: BE ${sample.beYear}`);
  assert.equal(standard, sample.thailandStandard, `standard time mismatch: BE ${sample.beYear}`);
}

const beforeBoundary = calculateChulasakarat(
  { yearBe: 2527, month: 4, day: 15 },
  { hour: 18, minute: 8 },
  boundaries,
);
assert.equal(beforeBoundary.status, "exact");
assert.equal(beforeBoundary.value, 1345);

const atBoundary = calculateChulasakarat(
  { yearBe: 2527, month: 4, day: 15 },
  { hour: 18, minute: 9 },
  boundaries,
);
assert.equal(atBoundary.value, 1346);

const unknownTimeBoundary = calculateChulasakarat(
  { yearBe: 2527, month: 4, day: 15 },
  null,
  boundaries,
);
assert.equal(unknownTimeBoundary.status, "ambiguous");
assert.deepEqual(unknownTimeBoundary.values, [1345, 1346]);

const april1990 = calculateChulasakarat(
  { yearBe: 2533, month: 4, day: 20 },
  { hour: 7, minute: 0 },
  boundaries,
);
assert.equal(april1990.status, "exact");
assert.equal(april1990.value, 1352);

const before2026Boundary = calculateChulasakarat(
  { yearBe: 2569, month: 4, day: 16 },
  { hour: 14, minute: 57 },
  boundaries,
);
assert.equal(before2026Boundary.value, 1387);
const after2026Boundary = calculateChulasakarat(
  { yearBe: 2569, month: 4, day: 16 },
  { hour: 14, minute: 59 },
  boundaries,
);
assert.equal(after2026Boundary.value, 1388);

const outsideValidation = calculateChulasakarat(
  { yearBe: 2200, month: 5, day: 1 },
  null,
  boundaries,
);
assert.ok(outsideValidation.warnings.some((message) => message.includes("นอกช่วง")));

const march = calculateChulasakarat({ yearBe: 2569, month: 3, day: 1 }, null, boundaries);
assert.equal(march.value, 1387);
const may = calculateChulasakarat({ yearBe: 2569, month: 5, day: 1 }, null, boundaries);
assert.equal(may.value, 1388);

const map1388 = calculateMahabhutaMap(1388, kalayok);
assert.equal(map1388.remainder, 2);
assert.equal(map1388.byPlanet[1].key, "thong_chai");
assert.equal(map1388.byPlanet[2].key, "lokawinasa");
assert.equal(map1388.byPlanet[7].key, "racha_chok");
assert.equal(getKalayokState(map1388, 8).quality, "unknown");
assert.equal(getKalayokState(map1388, 5).quality, "bad");

assert.equal(canonicalPair(7, 6), "6-7");
const selfRelation = getRelationship(relationships, 1, 1);
assert.deepEqual(selfRelation.otherLabels, []);
assert.deepEqual(selfRelation.otherShortLabels, []);
assert.deepEqual(selfRelation.labels, []);

const saturnVenus = getRelationship(relationships, 7, 6);
assert.equal(saturnVenus.primaryBadge, "enemy");
assert.deepEqual(saturnVenus.otherLabels, ["คู่ศัตรูธาตุ"]);
assert.deepEqual(saturnVenus.otherShortLabels, ["ธาตุ"]);
assert.equal(saturnVenus.otherItems[0].color, "#8E2630");
const saturnRahu = getRelationship(relationships, 7, 8);
assert.equal(saturnRahu.primaryBadge, "friend");
assert.equal(saturnRahu.shortLabels[0], "มิตร");
const saturnSun = getRelationship(relationships, 7, 1);
assert.deepEqual(saturnSun.otherShortLabels, ["ธาตุ"]);
assert.equal(saturnSun.otherItems[0].color, "#315F9E");
const moonJupiter = getRelationship(relationships, 2, 5);
assert.ok(moonJupiter.tags.includes("elemental_pair") && moonJupiter.tags.includes("enemy"));

assert.deepEqual(
  calculateCalendarAge({ yearBe: 2533, month: 11, day: 22 }, { yearBe: 2569, month: 8, day: 3 }),
  { years: 35, months: 8, days: 12 },
);

const exportSource = await readFile(`${root}js/core/exportImage.js`, "utf8");
assert.doesNotMatch(exportSource, /EXPORT_HEIGHT/);
assert.match(exportSource, /Sarabun/);
assert.match(exportSource, /supplementaryContainer/);
assert.match(exportSource, /sub-explorer/);
const appSource = await readFile(`${root}js/app.js`, "utf8");
assert.match(appSource, /calculateChulasakarat/);
assert.match(appSource, /calculateMahabhutaMap/);
assert.doesNotMatch(appSource, /weekdayWarning/);
assert.doesNotMatch(appSource, /civilWeekdayName/);
const indexSource = await readFile(`${root}index.html`, "utf8");
assert.match(indexSource, /css\/fonts\.css/);
assert.match(indexSource, /v0\.8\.2/);
assert.doesNotMatch(indexSource, /โหราศาสตร์ไทย · มหาทักษา/);
assert.doesNotMatch(indexSource, /ดาวเสวยอายุ 108 ปี · กาลโยคมหาภูติกำเนิด · ความสัมพันธ์ของดาว/);
assert.doesNotMatch(indexSource, /หลักการคำนวณ จ\.ศ\./);
assert.doesNotMatch(indexSource, /id="form-warning"/);
const baseCss = await readFile(`${root}css/base.css`, "utf8");
const visualCss = await readFile(`${root}css/visuals.css`, "utf8");
const layoutCss = await readFile(`${root}css/layout.css`, "utf8");
assert.match(baseCss, /font-family: "Sarabun"/);
assert.match(visualCss, /font-family: "Sarabun"/);
assert.match(visualCss, /paint-order: stroke/);
assert.match(layoutCss, /grid-template-columns: repeat\(3/);
const wheelSource = await readFile(`${root}js/components/wheel.js`, "utf8");
const timelineSource = await readFile(`${root}js/components/timeline.js`, "utf8");
assert.match(wheelSource, /planet\.nameTh/);
assert.doesNotMatch(wheelSource, /"ดาววันเกิด"/);
assert.doesNotMatch(wheelSource, /r: 60/);
assert.match(wheelSource, /item\.shortLabelTh/);
assert.match(timelineSource, /item\.shortLabelTh/);
const swSource = await readFile(`${root}sw.js`, "utf8");
assert.match(swSource, /maha-thasa-v0\.8\.2/);
assert.match(swSource, /css\/fonts\.css/);

console.log("✓ มหาทศา v0.8.2: ลำดับ 108 ปีและดาวแทรกยังถูกต้อง");
console.log("✓ คำนวณเถลิงศก/จ.ศ. และมหาภูติกำเนิดยังผ่าน regression เดิม");
console.log("✓ ตัด weekday mismatch warning ออกจาก UI โดยไม่เปลี่ยน birth-day start planet");
console.log("✓ Header กระชับและ toolbar 3 ปุ่มอยู่แถวเดียวกัน");
console.log("✓ Wheel center แสดงชื่อพระเคราะห์วันเกิดและไม่มีวงเล็กด้านใน");
console.log("✓ ความสัมพันธ์ใช้คำสั้นและสีแยก ธาตุ/สมพล แบบสนับสนุนหรือขัดแย้ง");
console.log("✓ Wheel PNG export รวมกล่องรายละเอียดดาวแทรกด้านล่าง");
console.log("✓ PWA cache เป็น maha-thasa-v0.8.2");
