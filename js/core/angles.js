import {
  PLANETS,
  PLANET_SEQUENCE,
  TOTAL_CYCLE_YEARS,
  getPlanet,
} from "../data/planets.js";
import { rotateSequence } from "./sequence.js";
import { calculateSubDuration } from "./time.js";

export const FULL_CIRCLE = 360;
export const START_ANGLE = -90;

export function calculateMainAngle(mainYears) {
  return (mainYears / TOTAL_CYCLE_YEARS) * FULL_CIRCLE;
}

export function calculateSubAngle(mainAngle, subPlanetWeight) {
  return (mainAngle * subPlanetWeight) / TOTAL_CYCLE_YEARS;
}

export function buildWheelModel() {
  let currentMainAngle = START_ANGLE;

  const mainSegments = PLANET_SEQUENCE.map((mainNumber, mainIndex) => {
    const mainPlanet = getPlanet(mainNumber);
    const mainAngle = calculateMainAngle(mainPlanet.years);
    const mainStartAngle = currentMainAngle;
    const mainEndAngle =
      mainIndex === PLANET_SEQUENCE.length - 1
        ? START_ANGLE + FULL_CIRCLE
        : mainStartAngle + mainAngle;
    const subSequence = rotateSequence(PLANET_SEQUENCE, mainNumber);

    let currentSubAngle = mainStartAngle;
    const subSegments = subSequence.map((subNumber, subIndex) => {
      const subPlanet = getPlanet(subNumber);
      const subAngle = calculateSubAngle(mainAngle, subPlanet.years);
      const subStartAngle = currentSubAngle;
      const subEndAngle =
        subIndex === subSequence.length - 1
          ? mainEndAngle
          : subStartAngle + subAngle;

      currentSubAngle = subEndAngle;

      return Object.freeze({
        key: `sub-${mainNumber}-${subNumber}`,
        type: "sub",
        mainNumber,
        subNumber,
        mainPlanet,
        subPlanet,
        startAngle: subStartAngle,
        endAngle: subEndAngle,
        angle: subEndAngle - subStartAngle,
        duration: calculateSubDuration(mainPlanet.years, subPlanet.years),
        percentageOfMain: (subPlanet.years / TOTAL_CYCLE_YEARS) * 100,
        percentageOfCycle: ((subEndAngle - subStartAngle) / FULL_CIRCLE) * 100,
      });
    });

    currentMainAngle = mainEndAngle;

    return Object.freeze({
      key: `main-${mainNumber}`,
      type: "main",
      mainNumber,
      mainPlanet,
      startAngle: mainStartAngle,
      endAngle: mainEndAngle,
      angle: mainEndAngle - mainStartAngle,
      percentageOfCycle: (mainPlanet.years / TOTAL_CYCLE_YEARS) * 100,
      subSegments: Object.freeze(subSegments),
    });
  });

  return Object.freeze({
    mainSegments: Object.freeze(mainSegments),
    subSegments: Object.freeze(mainSegments.flatMap((segment) => segment.subSegments)),
    planets: PLANETS,
  });
}
