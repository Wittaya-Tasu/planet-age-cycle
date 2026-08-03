import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildWheelModel } from "../js/core/angles.js";
import { validateWheelModel } from "../js/utils/validation.js";
import { buildCycle, findCurrentPeriod, validateCycleGeometry } from "../js/core/periodCalculator.js";
import {
  bangkokPartsToEpochMs,
  birthdayAnniversaryEpochMs,
  formatThaiShortDateTime,
} from "../js/core/calendar.js";
import {
  getActiveSegmentRelationBadge,
  getPlanetRelation,
  getSegmentRelationBadge,
} from "../js/core/relations.js";
const model = buildWheelModel();
const validation = validateWheelModel(model);
assert.equal(validation.valid, true, validation.errors.join("\n"));
assert.equal(model.mainSegments.length, 8);
assert.equal(model.subSegments.length, 64);
assert.deepEqual(
  buildWheelModel(7).mainSegments.map(
    (segment) => segment.mainNumber,
  ),
  [7, 5, 8, 6, 1, 2, 3, 4],
);
assert.equal(buildWheelModel(7).mainSegments[0].startAngle, -90);
assert.deepEqual(
  buildWheelModel(6).mainSegments.map(
    (segment) => segment.mainNumber,
  ),
  [6, 1, 2, 3, 4, 7, 5, 8],
);
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
assert.equal(
  datasets.relationsData.displayScope.mode,
  "all-periods",
);
const activeMainMars = {
  key: "main-3",
  type: "main",
  mainNumber: 3,
};
const inactiveMainJupiter = {
  key: "main-5",
  type: "main",
  mainNumber: 5,
};
const activeSubJupiter = {
  key: "sub-3-5",
  type: "sub",
  mainNumber: 3,
  subNumber: 5,
};
const inactiveSubMars = {
  key: "sub-1-3",
  type: "sub",
  mainNumber: 1,
  subNumber: 3,
};
assert.equal(
  getActiveSegmentRelationBadge(
    datasets.relationsData,
    "sunday",
    activeMainMars,
    activeMainMars,
  ).status,
  "bad",
);
assert.equal(
  getSegmentRelationBadge(
    datasets.relationsData,
    "sunday",
    inactiveMainJupiter,
  ).status,
  "good",
);
assert.equal(
  getActiveSegmentRelationBadge(
    datasets.relationsData,
    "sunday",
    inactiveMainJupiter,
    activeMainMars,
  ),
  null,
);
assert.equal(
  getSegmentRelationBadge(
    datasets.relationsData,
    "sunday",
    activeSubJupiter,
  ).status,
  "good",
);
assert.equal(
  getSegmentRelationBadge(
    datasets.relationsData,
    "sunday",
    inactiveSubMars,
  ).status,
  "bad",
);
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
assert.match(sw, /planet-age-cycle-v0\.6\.0/);
assert.match(sw, /js\/core\/exportImage\.js/);
assert.match(sw, /js\/components\/timeline\.js/);
const wheelSource = await readFile(`${root}js/components/wheel.js`, "utf8");
const timelineSource = await readFile(`${root}js/components/timeline.js`, "utf8");
const tooltipSource = await readFile(`${root}js/components/tooltip.js`, "utf8");
const detailSource = await readFile(`${root}js/components/detail-panel.js`, "utf8");
const indexSource = await readFile(`${root}index.html`, "utf8");
const exportSource = await readFile(`${root}js/core/exportImage.js`, "utf8");
const appSource = await readFile(`${root}js/app.js`, "utf8");
const summarySource = await readFile(
  `${root}js/components/journey-summary.js`,
  "utf8",
);
const layoutSource = await readFile(`${root}css/layout.css`, "utf8");
assert.doesNotMatch(wheelSource, /text\.textContent\s*=\s*segment\.subPlanet\.number/);
assert.match(wheelSource, /relation-marker/);
assert.doesNotMatch(wheelSource, /birth-start-ring/);
assert.match(wheelSource, /journey-current-arrow/);
assert.match(wheelSource, /mainRelation: 218/);
assert.match(wheelSource, /getSegmentRelationBadge/);
assert.doesNotMatch(tooltipSource, /formatPercentage/);
assert.doesNotMatch(detailSource, /สัดส่วนในแถบหลัก/);
assert.match(detailSource, /คำพยากรณ์และรายละเอียด/);
assert.match(detailSource, /options\.period && !isCurrentSub/);
assert.match(indexSource, /id="save-image-button"/);
assert.match(indexSource, /id="view-wheel-button"/);
assert.match(indexSource, /id="view-timeline-button"/);
assert.match(exportSource, /visualizationMode/);
assert.match(exportSource, /Timeline แนวนอน/);
assert.match(appSource, /renderTimeline/);
assert.match(appSource, /setVisualizationMode/);
assert.match(summarySource, /formatThaiShortDateTime/);
assert.match(layoutSource, /timeline-container/);
assert.match(layoutSource, /view-switch/);
assert.equal(
  formatThaiShortDateTime(
    bangkokPartsToEpochMs({
      year: 2026,
      month: 5,
      day: 18,
      hour: 9,
      minute: 5,
    }),
  ),
  "18 พ.ค. 2569 09:05 น.",
);
console.log("✓ วงล้อหมุนให้พระเคราะห์วันเกิดเริ่มที่ 12 นาฬิกา");
console.log("✓ คำพยากรณ์ 64 ช่องและข้อมูลพระอังคารแทรกพระพุธถูกต้อง");
console.log("✓ ปฏิทินจริงและนโยบาย 29 กุมภาพันธ์ถูกต้อง");
console.log("✓ แถบย่อยปิดพอดีกับแถบหลักทุกกลุ่ม");
console.log("✓ สัญลักษณ์ดี/ไม่ดีแสดงล่วงหน้าทั้งแถบหลักและแถบย่อย");
console.log("✓ เพิ่มมุมมอง Timeline แนวนอนและปุ่มสลับมุมมองแล้ว");
console.log("✓ เดือนแบบย่อและแถบความคืบหน้าช่วงปัจจุบันยังถูกต้อง");
console.log("✓ ปุ่มบันทึกภาพและ Offline cache v0.6.0 พร้อมใช้งาน");
