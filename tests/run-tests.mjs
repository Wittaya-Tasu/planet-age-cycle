import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { calculateCalendarAge, datePartsToEpoch } from "../js/core/calendar.js";
import { calculateChulasakarat } from "../js/core/thaiCalendar.js";
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

const beforeBoundary = calculateChulasakarat(
  { yearBe: 2527, month: 4, day: 15 },
  { hour: 17, minute: 50 },
  boundaries,
);
assert.equal(beforeBoundary.status, "exact");
assert.equal(beforeBoundary.value, 1345);

const atBoundary = calculateChulasakarat(
  { yearBe: 2527, month: 4, day: 15 },
  { hour: 17, minute: 51 },
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

const aprilWithoutBoundary = calculateChulasakarat(
  { yearBe: 2533, month: 4, day: 20 },
  { hour: 7, minute: 0 },
  boundaries,
);
assert.equal(aprilWithoutBoundary.status, "ambiguous");

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
assert.equal(getKalayokState(map1388, 5).quality, "bad"); // มรณะ

assert.equal(canonicalPair(7, 6), "6-7");
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
const appSource = await readFile(`${root}js/app.js`, "utf8");
assert.doesNotMatch(appSource, /predictions\.json|day-planet-relations/);
assert.match(appSource, /calculateChulasakarat/);
assert.match(appSource, /calculateMahabhutaMap/);
const swSource = await readFile(`${root}sw.js`, "utf8");
assert.match(swSource, /maha-thasa-v0\.8\.0/);
assert.doesNotMatch(swSource, /predictions\.json|day-planet-relations\.json/);

console.log("✓ มหาทศา v0.8.0: ลำดับ 108 ปีและดาวแทรกถูกต้อง");
console.log("✓ พุธกลางคืนยังเริ่มด้วยราหู (8) เฉพาะระบบเสวยอายุ");
console.log("✓ กาลโยคมหาภูติใช้เฉพาะดาว 1–7 และตัวอย่าง จ.ศ. 1388 ถูกต้อง");
console.log("✓ วันเวลาเถลิงศก 15 เม.ย. 2527 17:51 แยก จ.ศ. 1345/1346 ถูกต้อง");
console.log("✓ เดือนเมษายนที่ไม่มี boundary ที่ตรวจสอบแล้วคืนค่า ambiguous ไม่เดา");
console.log("✓ ความสัมพันธ์ 6 ประเภทและ badge คู่มิตร/คู่ศัตรูพร้อมใช้งาน");
console.log("✓ ระบบใหม่ไม่โหลดคำพยากรณ์เดิมและไม่ใช้ ✓/! เดิม");
console.log("✓ PNG export ไม่มี regression EXPORT_HEIGHT");
