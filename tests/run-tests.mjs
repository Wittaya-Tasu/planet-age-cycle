import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildWheelModel } from "../js/core/angles.js";
import { validateWheelModel } from "../js/utils/validation.js";
import { loadPlanetAgeData } from "../js/data/loadData.js";
import { buildCycle, findCurrentPeriod, validateCycleGeometry } from "../js/core/periodCalculator.js";
import { bangkokPartsToEpochMs, birthdayAnniversaryEpochMs } from "../js/core/calendar.js";
import { getPlanetRelation } from "../js/core/relations.js";

const model = buildWheelModel();
const validation = validateWheelModel(model);
assert.equal(validation.valid, true, validation.errors.join("\n"));
assert.equal(model.mainSegments.length, 8);
assert.equal(model.subSegments.length, 64);

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (name) => JSON.parse(await readFile(`${root}data/${name}`, "utf8"));
const datasets = {
  planetsData: await readJson("planets.json"),
  subperiodsData: await readJson("subperiods.json"),
  predictionsData: await readJson("predictions.json"),
  relationsData: await readJson("day-planet-relations.json"),
  appConfig: await readJson("app-config.json"),
  uiText: await readJson("ui-text.th.json"),
};

assert.equal(datasets.predictionsData.predictions.length, 64);
assert.equal(datasets.predictionsData.predictions.find((p) => p.id === "4-3").sourceDuration.months, 3);
assert.equal(datasets.predictionsData.predictions.find((p) => p.id === "4-3").sourceDuration.days, 3);
assert.equal(datasets.predictionsData.predictions.find((p) => p.id === "4-3").sourceDuration.minutes, 20);
assert.equal(datasets.relationsData.unspecifiedBehavior, "hide");

assert.equal(getPlanetRelation(datasets.relationsData, "sunday", 5), "good");
assert.equal(getPlanetRelation(datasets.relationsData, "sunday", 3), "bad");
assert.equal(getPlanetRelation(datasets.relationsData, "sunday", 2), null);
assert.equal(getPlanetRelation(datasets.relationsData, "wednesday-night", 7), "good");
assert.equal(getPlanetRelation(datasets.relationsData, "saturday", 6), "bad");

const profile = {
  birthDayType: "saturday",
  birth: { yearBE: 2527, month: 4, day: 21, hour: 1, minute: 49 },
};
const cycle = buildCycle(profile, 0, datasets);
assert.equal(validateCycleGeometry(cycle), true);
for (const main of cycle.mainPeriods) {
  assert.equal(main.subperiods[0].startEpochMs, main.startEpochMs);
  assert.equal(main.subperiods.at(-1).endEpochMs, main.endEpochMs);
}

const leapBirth = { yearBE: 2543, month: 2, day: 29, hour: 8, minute: 30 };
const nonLeapAnniversary = birthdayAnniversaryEpochMs(leapBirth, 1).parts;
assert.deepEqual(nonLeapAnniversary, { year: 2001, month: 2, day: 28, hour: 8, minute: 30 });
const leapAgain = birthdayAnniversaryEpochMs(leapBirth, 4).parts;
assert.deepEqual(leapAgain, { year: 2004, month: 2, day: 29, hour: 8, minute: 30 });

const target = bangkokPartsToEpochMs({ year: 2026, month: 8, day: 2, hour: 20, minute: 0 });
const result = findCurrentPeriod(profile, target, datasets);
assert.ok(result.current.startEpochMs <= target && target < result.current.endEpochMs);
assert.ok(result.next);

const sw = await readFile(`${root}sw.js`, "utf8");
assert.match(sw, /planet-age-cycle-v0\.4\.1/);
assert.match(sw, /data\/predictions\.json/);
assert.match(sw, /js\/core\/exportImage\.js/);


const wheelSource = await readFile(`${root}js/components/wheel.js`, "utf8");
const tooltipSource = await readFile(`${root}js/components/tooltip.js`, "utf8");
const detailSource = await readFile(`${root}js/components/detail-panel.js`, "utf8");
const indexSource = await readFile(`${root}index.html`, "utf8");
const exportSource = await readFile(`${root}js/core/exportImage.js`, "utf8");

assert.doesNotMatch(wheelSource, /text\.textContent\s*=\s*segment\.subPlanet\.number/);
assert.match(wheelSource, /relation-marker/);
assert.match(wheelSource, /birth-start-ring/);
assert.match(wheelSource, /journey-current-arrow/);
assert.match(wheelSource, /subRelation:\s*398/);
assert.match(wheelSource, /relation-marker-leader/);
assert.match(wheelSource, /getMainRelationAngle/);
assert.doesNotMatch(tooltipSource, /formatPercentage/);
assert.doesNotMatch(detailSource, /สัดส่วนในแถบหลัก/);
assert.match(detailSource, /คำพยากรณ์และรายละเอียด/);
assert.match(detailSource, /options\.period && !isCurrentSub/);
assert.match(indexSource, /id="save-image-button"/);
assert.ok(indexSource.indexOf('id="journey-summary"') < indexSource.indexOf('id="detail-panel"'));
assert.match(exportSource, /saveDashboardImage/);

console.log("✓ วงแหวน 8 แถบหลักและ 64 แถบย่อยถูกต้อง");
console.log("✓ คำพยากรณ์ 64 ช่องและข้อมูลพระอังคารแทรกพระพุธถูกต้อง");
console.log("✓ ปฏิทินจริงและนโยบาย 29 กุมภาพันธ์ถูกต้อง");
console.log("✓ แถบย่อยปิดพอดีกับแถบหลักทุกกลุ่ม");
console.log("✓ สัญลักษณ์ดี/ไม่ดี จุดเริ่ม และลูกศรแสดงผลตามข้อกำหนด");
console.log("✓ Tooltip และแผงรายละเอียดไม่แสดงสัดส่วนที่ตัดออก");
console.log("✓ ตำแหน่งสัญลักษณ์และลำดับกล่องข้อมูล v0.4.1 ถูกต้อง");
console.log("✓ ปุ่มบันทึกภาพและ Offline cache v0.4.1 พร้อมใช้งาน");
