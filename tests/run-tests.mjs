import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  buildWheelModel,
  calculateMainAngle,
  calculateSubAngle,
} from "../js/core/angles.js";
import { rotateSequence } from "../js/core/sequence.js";
import {
  astroMinutesToDuration,
  calculateSubDuration,
} from "../js/core/time.js";
import { PLANET_SEQUENCE } from "../js/data/planets.js";
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

const manifestPath = fileURLToPath(
  new URL("../manifest.webmanifest", import.meta.url),
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.icons.length, 2);

console.log("✓ ข้อมูลพระเคราะห์หลัก 8 ส่วน รวม 108 ปี");
console.log("✓ แถบย่อย 64 ส่วน และผลรวมทุกกลุ่มตรงกับแถบหลัก");
console.log("✓ สูตรองศาและหน่วยเวลาโหราศาสตร์ถูกต้อง");
console.log("✓ Web App Manifest พร้อมโหมด standalone");
