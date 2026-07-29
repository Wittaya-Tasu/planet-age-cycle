import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  buildWheelModel,
  calculateMainAngle,
  calculateSubAngle,
} from "../js/core/angles.js";
import {
  ageToCycleYears,
  calculateCalendarAge,
  createCivilDate,
  createJourneyState,
} from "../js/core/age.js";
import { rotateSequence } from "../js/core/sequence.js";
import {
  astroMinutesToDuration,
  calculateSubDuration,
} from "../js/core/time.js";
import { describeArcLine } from "../js/core/geometry.js";
import { PLANET_SEQUENCE } from "../js/data/planets.js";
import { BIRTH_DAYS, getBirthDay } from "../js/data/birth-days.js";
import { formatPercentage } from "../js/utils/format.js";
import { validateWheelModel } from "../js/utils/validation.js";

const model = buildWheelModel();
const validation = validateWheelModel(model);

assert.equal(validation.valid, true, validation.errors.join("\n"));
assert.deepEqual(
  model.mainSegments.map((segment) => segment.mainNumber),
  PLANET_SEQUENCE,
);
assert.equal(model.mainSegments.length, 8);
assert.equal(model.subSegments.length, 64);

const expectedAngles = new Map([
  [1, 20],
  [2, 50],
  [3, 26.666666666666668],
  [4, 56.666666666666664],
  [7, 33.333333333333336],
  [5, 63.333333333333336],
  [8, 40],
  [6, 70],
]);

for (const [planetNumber, expectedAngle] of expectedAngles) {
  const segment = model.mainSegments.find(
    (candidate) => candidate.mainNumber === planetNumber,
  );
  assert.ok(Math.abs(segment.angle - expectedAngle) < 1e-8);
}

for (const main of model.mainSegments) {
  assert.deepEqual(
    main.subSegments.map((segment) => segment.subNumber),
    rotateSequence(PLANET_SEQUENCE, main.mainNumber),
  );

  const totalSubAngle = main.subSegments.reduce(
    (sum, segment) => sum + segment.angle,
    0,
  );
  assert.ok(Math.abs(totalSubAngle - main.angle) < 1e-8);

  const totalSubMinutes = main.subSegments.reduce(
    (sum, segment) => sum + segment.duration.totalAstroMinutes,
    0,
  );
  assert.equal(totalSubMinutes, main.mainPlanet.years * 21_600);
}

assert.equal(calculateMainAngle(21), 70);
assert.equal(calculateSubAngle(20, 6), 20 / 18);
assert.deepEqual(astroMinutesToDuration(21_600), {
  years: 1,
  months: 0,
  days: 0,
  minutes: 0,
  totalAstroMinutes: 21_600,
});
assert.deepEqual(calculateSubDuration(17, 21), {
  years: 3,
  months: 3,
  days: 20,
  minutes: 0,
  totalAstroMinutes: 71_400,
});
assert.deepEqual(calculateSubDuration(8, 8), {
  years: 0,
  months: 7,
  days: 3,
  minutes: 20,
  totalAstroMinutes: 12_800,
});

assert.deepEqual(
  calculateCalendarAge(
    createCivilDate({ day: 21, month: 4, yearBe: 2527 }),
    createCivilDate({ day: 29, month: 7, yearBe: 2569 }),
  ),
  { years: 42, months: 3, days: 8 },
);
assert.deepEqual(
  calculateCalendarAge(
    createCivilDate({ day: 31, month: 1, yearBe: 2543 }),
    createCivilDate({ day: 1, month: 3, yearBe: 2543 }),
  ),
  { years: 0, months: 1, days: 1 },
);
assert.deepEqual(
  calculateCalendarAge(
    createCivilDate({ day: 29, month: 2, yearBe: 2543 }),
    createCivilDate({ day: 28, month: 2, yearBe: 2544 }),
  ),
  { years: 1, months: 0, days: 0 },
);
assert.ok(
  Math.abs(
    ageToCycleYears({ years: 42, months: 3, days: 21 }) -
      42.30833333333333,
  ) < 1e-10,
);

assert.deepEqual(
  BIRTH_DAYS.map((item) => [item.label, item.planetNumber]),
  [
    ["อาทิตย์", 1],
    ["จันทร์", 2],
    ["อังคาร", 3],
    ["พุธ (กลางวัน)", 4],
    ["พุธ (กลางคืน)", 8],
    ["พฤหัสบดี", 5],
    ["ศุกร์", 6],
    ["เสาร์", 7],
  ],
);

const sundayAge25 = createJourneyState(
  model,
  getBirthDay("sunday"),
  { years: 25, months: 0, days: 0 },
);
assert.equal(sundayAge25.activeMain.mainNumber, 3);
assert.equal(sundayAge25.activeSub.subNumber, 8);
assert.ok(Math.abs(sundayAge25.yearsInsideMain - 4) < 1e-9);
assert.equal(sundayAge25.startAngle, -90);

const mondayAge15 = createJourneyState(
  model,
  getBirthDay("monday"),
  { years: 15, months: 0, days: 0 },
);
assert.equal(mondayAge15.activeMain.mainNumber, 3);
assert.equal(formatPercentage(5.55555), "5.6%");
assert.doesNotMatch(describeArcLine(400, 400, 298, -90, 270), /NaN/);
assert.match(describeArcLine(400, 400, 298, -90, 270), /A 298 298 0 1 1/);

const manifestPath = fileURLToPath(
  new URL("../manifest.webmanifest", import.meta.url),
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.icons.length, 2);

const swText = await readFile(
  fileURLToPath(new URL("../sw.js", import.meta.url)),
  "utf8",
);
assert.match(swText, /planet-age-cycle-v0\.2\.0/);
const appShellSource = swText.match(/const APP_SHELL = (\[[\s\S]*?\]);/);
assert.ok(appShellSource, "ไม่พบรายการ APP_SHELL ใน Service Worker");
const appShell = JSON.parse(appShellSource[1]);

for (const relativePath of appShell) {
  if (relativePath === "./") continue;
  await access(
    fileURLToPath(
      new URL(`../${relativePath.replace(/^\.\//, "")}`, import.meta.url),
    ),
  );
}

const supportingHtml = await readFile(
  fileURLToPath(new URL("../index.html", import.meta.url)),
  "utf8",
);
assert.match(
  supportingHtml,
  /id="supporting-info" class="supporting-info" hidden/,
);

const detailSources = await Promise.all([
  readFile(
    fileURLToPath(new URL("../js/components/tooltip.js", import.meta.url)),
    "utf8",
  ),
  readFile(
    fileURLToPath(new URL("../js/components/detail-panel.js", import.meta.url)),
    "utf8",
  ),
]);
assert.equal(detailSources.some((source) => source.includes("°")), false);
assert.equal(detailSources.some((source) => source.includes("องศา")), false);

console.log("✓ ข้อมูลพระเคราะห์หลัก 8 ส่วน รวม 108 ปี");
console.log("✓ แถบย่อย 64 ส่วน และผลรวมทุกกลุ่มตรงกับแถบหลัก");
console.log("✓ สูตรองศาและหน่วยเวลาโหราศาสตร์ถูกต้อง");
console.log("✓ อายุเต็ม ปี เดือน วัน และวันที่ พ.ศ. ถูกต้อง");
console.log("✓ จุดเริ่ม 8 วันและตำแหน่งอายุบนวงแหวนถูกต้อง");
console.log("✓ Tooltip และรายละเอียดไม่แสดงค่าองศา");
console.log("✓ Web App Manifest และไฟล์ Offline cache ครบถ้วน");
