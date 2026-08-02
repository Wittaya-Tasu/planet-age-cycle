import { TOTAL_CYCLE_YEARS } from "../data/planets.js";

const FULL_CIRCLE = 360;
const START_ANGLE = -90;

function clockwiseDistance(startAngle, endAngle) {
  return ((endAngle - startAngle) % FULL_CIRCLE + FULL_CIRCLE) % FULL_CIRCLE;
}

export function createCalendarJourneyState(model, birthDay, periodResult, targetEpochMs) {
  const activeMain = model.mainSegments.find(
    (segment) => segment.mainNumber === periodResult.current.mainPlanet,
  );
  const activeSub = activeMain?.subSegments.find(
    (segment) => segment.subNumber === periodResult.current.subPlanet,
  );
  const birthMain = model.mainSegments.find(
    (segment) => segment.mainNumber === birthDay.planetNumber,
  );

  if (!activeMain || !activeSub || !birthMain) {
    throw new Error("ไม่พบตำแหน่งช่วงชีวิตบนวงแหวน");
  }

  const durationMs = periodResult.current.endEpochMs - periodResult.current.startEpochMs;
  const elapsedMs = Math.max(0, Math.min(durationMs, targetEpochMs - periodResult.current.startEpochMs));
  const subProgress = durationMs > 0 ? elapsedMs / durationMs : 0;
  const currentAngle =
    activeSub.startAngle + (activeSub.endAngle - activeSub.startAngle) * subProgress;
  let progressAngle = clockwiseDistance(birthMain.startAngle, currentAngle);

  if (periodResult.currentAge.years >= TOTAL_CYCLE_YEARS && progressAngle < 1e-9) {
    progressAngle = FULL_CIRCLE;
  }

  return Object.freeze({
    birthDay,
    age: periodResult.currentAge,
    completedCycles: periodResult.cycle.cycleIndex,
    progressAngle,
    startAngle: birthMain.startAngle,
    currentAngle,
    activeMain,
    activeSub,
    yearsInsideMain: 0,
    yearsInsideSub: 0,
    periodResult,
    startReferenceAngle: START_ANGLE,
  });
}
