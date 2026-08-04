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
import { collectWheelRelationMarkers } from "../js/components/wheel.js";
import { collectTimelineRelationMarkers } from "../js/components/timeline.js";
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

const relationMarkerContext = (birthDayType) => ({
  relationsData: datasets.relationsData,
  birthDayType,
});
const countMarkers = (markers, status) =>
  markers.filter((item) => item.relation.status === status).length;

const sundayWheelMarkers = collectWheelRelationMarkers(
  model,
  relationMarkerContext("sunday"),
);
const sundayTimelineMarkers = collectTimelineRelationMarkers(
  model,
  relationMarkerContext("sunday"),
);
assert.equal(sundayWheelMarkers.length, 18);
assert.equal(countMarkers(sundayWheelMarkers, "good"), 9);
assert.equal(countMarkers(sundayWheelMarkers, "bad"), 9);
assert.equal(sundayTimelineMarkers.length, 18);
assert.equal(countMarkers(sundayTimelineMarkers, "good"), 9);
assert.equal(countMarkers(sundayTimelineMarkers, "bad"), 9);

const thursdayWheelMarkers = collectWheelRelationMarkers(
  model,
  relationMarkerContext("thursday"),
);
assert.equal(thursdayWheelMarkers.length, 9);
assert.equal(countMarkers(thursdayWheelMarkers, "good"), 9);
assert.equal(countMarkers(thursdayWheelMarkers, "bad"), 0);

const fridayTimelineMarkers = collectTimelineRelationMarkers(
  model,
  relationMarkerContext("friday"),
);
assert.equal(fridayTimelineMarkers.length, 18);
assert.equal(countMarkers(fridayTimelineMarkers, "good"), 9);
assert.equal(countMarkers(fridayTimelineMarkers, "bad"), 9);
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
assert.match(sw, /planet-age-cycle-v0\.7\.0/);
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
assert.match(wheelSource, /mainRelation: 180/);
assert.match(wheelSource, /getSegmentRelationBadge/);
assert.match(wheelSource, /collectWheelRelationMarkers/);
assert.match(wheelSource, /data-layer": "relations"/);
const wheelAppendSource = wheelSource.slice(
  wheelSource.lastIndexOf("svg.append("),
);
assert.ok(
  wheelAppendSource.indexOf("createCenter(age, birthDay)") <
    wheelAppendSource.indexOf("createRelationOverlay(model, context)"),
);
assert.doesNotMatch(tooltipSource, /formatPercentage/);
assert.doesNotMatch(detailSource, /สัดส่วนในแถบหลัก/);
assert.match(detailSource, /คำพยากรณ์และรายละเอียด/);
assert.match(detailSource, /options\.period && !isCurrentSub/);
assert.match(indexSource, /id="save-image-button"/);
assert.match(indexSource, /id="view-wheel-button"/);
assert.match(indexSource, /id="view-timeline-button"/);
assert.match(exportSource, /visualizationMode/);
assert.match(exportSource, /Timeline แนวนอน/);
assert.match(exportSource, /EXPORT_TIMELINE_HEIGHT = 2070/);
assert.match(appSource, /renderTimeline/);
assert.match(appSource, /setVisualizationMode/);
assert.doesNotMatch(appSource, /requestAnimationFrame\(\(\) => timelineController\?\.scrollToCurrent/);
assert.match(summarySource, /formatThaiShortDateTime/);
assert.match(layoutSource, /timeline-container/);
assert.match(layoutSource, /view-switch/);
assert.match(layoutSource, /timeline-row-surface/);
assert.match(timelineSource, /one-main-period-per-row/);
assert.match(timelineSource, /createAgeRange/);
assert.match(timelineSource, /MAX_MAIN_YEARS = 21/);
assert.match(timelineSource, /collectTimelineRelationMarkers/);
assert.doesNotMatch(timelineSource, /createAxis/);
assert.doesNotMatch(indexSource, /class="interaction-hint"/);
assert.doesNotMatch(
  indexSource,
  /ตำแหน่ง 12 นาฬิกาคือพระเคราะห์ประจำวันเกิด/,
);
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
console.log("✓ สัญลักษณ์ดีและไม่ดีแสดงครบตามวันเกิด ทั้งวงล้อและ Timeline");
console.log("✓ Timeline แยกพระเคราะห์หลักเป็น 8 แถวและแสดงช่วงอายุครบ");
console.log("✓ เดือนแบบย่อและแถบความคืบหน้าช่วงปัจจุบันยังถูกต้อง");
console.log("✓ ปุ่มบันทึกภาพและ Offline cache v0.7.0 พร้อมใช้งาน");
