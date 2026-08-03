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

export function buildWheelModel(
  startPlanet = PLANET_SEQUENCE[0],
) {
  const mainSequence = rotateSequence(
    PLANET_SEQUENCE,
    Number(startPlanet),
  );

  let currentMainAngle = START_ANGLE;
  let currentMainYear = 0;

  const mainSegments = mainSequence.map((mainNumber, mainIndex) => {
    const mainPlanet = getPlanet(mainNumber);
    const mainAngle = calculateMainAngle(mainPlanet.years);
    const mainStartAngle = currentMainAngle;
    const mainStartYear = currentMainYear;
    const mainEndYear = mainStartYear + mainPlanet.years;
    const mainEndAngle =
      mainIndex === mainSequence.length - 1
        ? START_ANGLE + FULL_CIRCLE
        : mainStartAngle + mainAngle;
    const subSequence = rotateSequence(
      PLANET_SEQUENCE,
      mainNumber,
    );

    let currentSubAngle = mainStartAngle;
    let currentSubYear = mainStartYear;

    const subSegments = subSequence.map((subNumber, subIndex) => {
      const subPlanet = getPlanet(subNumber);
      const subAngle = calculateSubAngle(
        mainAngle,
        subPlanet.years,
      );
      const subDurationYears =
        (mainPlanet.years * subPlanet.years) /
        TOTAL_CYCLE_YEARS;
      const subStartAngle = currentSubAngle;
      const subStartYear = currentSubYear;
      const subEndAngle =
        subIndex === subSequence.length - 1
          ? mainEndAngle
          : subStartAngle + subAngle;
      const subEndYear =
        subIndex === subSequence.length - 1
          ? mainEndYear
          : subStartYear + subDurationYears;

      currentSubAngle = subEndAngle;
      currentSubYear = subEndYear;

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
        startYear: subStartYear,
        endYear: subEndYear,
        durationYears: subEndYear - subStartYear,
        duration: calculateSubDuration(
          mainPlanet.years,
          subPlanet.years,
        ),
        percentageOfMain:
          (subPlanet.years / TOTAL_CYCLE_YEARS) * 100,
        percentageOfCycle:
          ((subEndAngle - subStartAngle) /
            FULL_CIRCLE) *
          100,
      });
    });

    currentMainAngle = mainEndAngle;
    currentMainYear = mainEndYear;

    return Object.freeze({
      key: `main-${mainNumber}`,
      type: "main",
      mainNumber,
      mainPlanet,
      startAngle: mainStartAngle,
      endAngle: mainEndAngle,
      angle: mainEndAngle - mainStartAngle,
      startYear: mainStartYear,
      endYear: mainEndYear,
      percentageOfCycle:
        (mainPlanet.years / TOTAL_CYCLE_YEARS) * 100,
      subSegments: Object.freeze(subSegments),
    });
  });

  return Object.freeze({
    startPlanet: Number(startPlanet),
    mainSequence,
    mainSegments: Object.freeze(mainSegments),
    subSegments: Object.freeze(
      mainSegments.flatMap(
        (segment) => segment.subSegments,
      ),
    ),
    planets: PLANETS,
  });
}
