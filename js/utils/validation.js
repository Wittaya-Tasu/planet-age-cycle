import { PLANET_SEQUENCE, TOTAL_CYCLE_YEARS } from "../data/planets.js";
import { FULL_CIRCLE } from "../core/angles.js";

export const EPSILON = 1e-8;

function nearlyEqual(actual, expected) {
  return Math.abs(actual - expected) <= EPSILON;
}

export function validateWheelModel(model) {
  const errors = [];
  const mainCount = model.mainSegments.length;
  const mainYearsTotal = model.mainSegments.reduce(
    (sum, segment) => sum + segment.mainPlanet.years,
    0,
  );
  const mainAngleTotal = model.mainSegments.reduce(
    (sum, segment) => sum + segment.angle,
    0,
  );
  const weightTotal = PLANET_SEQUENCE.reduce(
    (sum, number) => sum + model.planets[number].years,
    0,
  );
  const subCount = model.subSegments.length;

  if (mainCount !== 8) errors.push(`จำนวนแถบหลักเป็น ${mainCount} แต่ต้องเป็น 8`);
  if (mainYearsTotal !== TOTAL_CYCLE_YEARS) {
    errors.push(`ผลรวมแถบหลักเป็น ${mainYearsTotal} ปี แต่ต้องเป็น 108 ปี`);
  }
  if (!nearlyEqual(mainAngleTotal, FULL_CIRCLE)) {
    errors.push(`ผลรวมองศาแถบหลักเป็น ${mainAngleTotal}° แต่ต้องเป็น 360°`);
  }
  if (weightTotal !== TOTAL_CYCLE_YEARS) {
    errors.push(`ผลรวมค่าน้ำหนักย่อยเป็น ${weightTotal} แต่ต้องเป็น 108`);
  }
  if (subCount !== 64) errors.push(`จำนวนแถบย่อยเป็น ${subCount} แต่ต้องเป็น 64`);

  model.mainSegments.forEach((mainSegment) => {
    if (mainSegment.subSegments.length !== 8) {
      errors.push(
        `${mainSegment.mainPlanet.name} มีแถบย่อย ${mainSegment.subSegments.length} ส่วน แต่ต้องเป็น 8`,
      );
    }

    const subAngleTotal = mainSegment.subSegments.reduce(
      (sum, segment) => sum + segment.angle,
      0,
    );

    if (!nearlyEqual(subAngleTotal, mainSegment.angle)) {
      errors.push(
        `ผลรวมแถบย่อยของ${mainSegment.mainPlanet.name}ไม่เท่ากับแถบหลัก`,
      );
    }

    const subMinuteTotal = mainSegment.subSegments.reduce(
      (sum, segment) => sum + segment.duration.totalAstroMinutes,
      0,
    );
    const expectedMinutes = mainSegment.mainPlanet.years * 21_600;

    if (subMinuteTotal !== expectedMinutes) {
      errors.push(
        `ผลรวมเวลาย่อยของ${mainSegment.mainPlanet.name}เป็น ${subMinuteTotal} นาที แต่ต้องเป็น ${expectedMinutes} นาที`,
      );
    }
  });

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    summary: Object.freeze({
      mainCount,
      mainYearsTotal,
      mainAngleTotal,
      weightTotal,
      subCount,
    }),
  });
}
