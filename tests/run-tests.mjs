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

// สูตรสุริยยาตร์ต้องสร้างวันเวลาเถลิงศกได้เองโดยไม่เรียก network
const b1984 = calculateThaloengSokBoundary(1984, boundaries);
assert.deepEqual(b1984.localMeanParts, { year: 1984, month: 4, day: 15, hour: 17, minute: 51, second: 0 });
assert.deepEqual(b1984.standardParts, { year: 1984, month: 4, day: 15, hour: 18, minute: 9, second: 0 });
assert.equal(b1984.csAfter, 1346);

const b2026 = calculateThaloengSokBoundary(2026, boundaries);
assert.deepEqual(b2026.localMeanParts, { year: 2026, month: 4, day: 16, hour: 14, minute: 40, second: 12 });
assert.deepEqual(b2026.standardParts, { year: 2026, month: 4, day: 16, hour: 14, minute: 58, second: 12 });
assert.equal(b2026.csAfter, 1388);

// ตรวจ validation samples ที่เก็บจาก MyHora ต้องตรงกับสูตรทุกตัวอย่าง
for (const sample of boundaries.validationSamples) {
  const boundary = calculateThaloengSokBoundary(sample.ceYear, boundaries);
  const pad = (value) => String(value).padStart(2, "0");
  const localMean = `${boundary.localMeanParts.year}-${pad(boundary.localMeanParts.month)}-${pad(boundary.localMeanParts.day)}T${pad(boundary.localMeanParts.hour)}:${pad(boundary.localMeanParts.minute)}:${pad(boundary.localMeanParts.second)}+06:42`;
  const standard = `${boundary.standardParts.year}-${pad(boundary.standardParts.month)}-${pad(boundary.standardParts.day)}T${pad(boundary.standardParts.hour)}:${pad(boundary.standardParts.minute)}:${pad(boundary.standardParts.second)}+07:00`;
  assert.equal(localMean, sample.localMean, `local mean mismatch: BE ${sample.beYear}`);
  assert.equal(standard, sample.thailandStandard, `standard time mismatch: BE ${sample.beYear}`);
}

// เวลาเกิดของผู้ใช้เป็นเวลามาตรฐานประเทศไทย UTC+07:00
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

// เดือนเมษายนทุกปีต้องคำนวณได้ ไม่ต้องมี annual table รายปีอีกต่อไป
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
assert.deepEqual(selfRelation.labels, []);

const saturnVenus = getRelationship(relationships, 7, 6);
assert.equal(saturnVenus.primaryBadge, "enemy");
assert.deepEqual(saturnVenus.otherLabels, ["คู่ศัตรูธาตุ"]);
const saturnRahu = getRelationship(relationships, 7, 8);
assert.equal(saturnRahu.primaryBadge, "friend");
const saturnSun = getRelationship(relationships, 7, 1);
assert.deepEqual(saturnSun.otherLabels, ["คู่ธาตุ"]);
const moonJupiter = getRelationship(relationships, 2, 5);
assert.ok(moonJupiter.tags.includes("elemental_pair") && moonJupiter.tags.includes("enemy"));

assert.deepEqual(
  calculateCalendarAge({ yearBe: 2533, month: 11, day: 22 }, { yearBe: 2569, month: 8, day: 3 }),
  { years: 35, months: 8, days: 12 },
);

const exportSource = await readFile(`${root}js/core/exportImage.js`, "utf8");
assert.doesNotMatch(exportSource, /EXPORT_HEIGHT/);
assert.match(exportSource, /Sarabun/);
const appSource = await readFile(`${root}js/app.js`, "utf8");
assert.match(appSource, /calculateChulasakarat/);
assert.match(appSource, /calculateMahabhutaMap/);
const indexSource = await readFile(`${root}index.html`, "utf8");
assert.match(indexSource, /css\/fonts\.css/);
assert.match(indexSource, /v0\.8\.1/);
const baseCss = await readFile(`${root}css/base.css`, "utf8");
const visualCss = await readFile(`${root}css/visuals.css`, "utf8");
assert.match(baseCss, /font-family: "Sarabun"/);
assert.match(visualCss, /font-family: "Sarabun"/);
const wheelSource = await readFile(`${root}js/components/wheel.js`, "utf8");
const timelineSource = await readFile(`${root}js/components/timeline.js`, "utf8");
assert.match(wheelSource, /otherLabels\?\.length/);
assert.match(timelineSource, /otherLabels\?\.length/);
const swSource = await readFile(`${root}sw.js`, "utf8");
assert.match(swSource, /maha-thasa-v0\.8\.1/);
assert.match(swSource, /css\/fonts\.css/);

console.log("✓ มหาทศา v0.8.1: ลำดับ 108 ปีและดาวแทรกยังถูกต้อง");
console.log("✓ แก้ regression ความสัมพันธ์ดาวกับตัวเองที่ทำให้ Wheel/Timeline ไม่ render");
console.log("✓ ใช้ Sarabun ทั้ง UI, SVG และ PNG export");
console.log("✓ คำนวณเถลิงศกจากสูตรสุริยยาตร์ภายในระบบ ไม่ต้องเรียก MyHora runtime");
console.log("✓ validation samples MyHora พ.ศ.2300, 2400, 2500, 2527, 2569, 2600 ตรงกับสูตร");
console.log("✓ เปรียบเทียบเวลาเกิดด้วยเวลามาตรฐานประเทศไทย UTC+07:00 หลังปรับ +18 นาที");
console.log("✓ ไม่ทราบเวลาเกิดตรงวันเถลิงศกยังคืนค่า ambiguous ตามหลักเดิม");
console.log("✓ PNG export ไม่มี regression EXPORT_HEIGHT");
