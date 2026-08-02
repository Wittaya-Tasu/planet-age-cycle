const EPSILON = 1e-8;

export function validatePlanets(planetsData) {
  const errors = [];
  if (planetsData.planets.length !== 8) errors.push("planets must contain 8 items");
  const totalYears = planetsData.planets.reduce((sum, item) => sum + item.years, 0);
  const totalAngle = planetsData.planets.reduce((sum, item) => sum + item.mainAngleDegrees, 0);
  if (totalYears !== 108) errors.push(`main years total is ${totalYears}, expected 108`);
  if (Math.abs(totalAngle - 360) > EPSILON) errors.push(`main angle total is ${totalAngle}, expected 360`);
  return errors;
}

export function validateSubperiods(subperiodsData) {
  const errors = [];
  if (subperiodsData.mainPeriods.length !== 8) errors.push("mainPeriods must contain 8 items");
  for (const main of subperiodsData.mainPeriods) {
    if (main.subperiods.length !== 8) {
      errors.push(`main ${main.mainPlanet} does not contain 8 subperiods`);
      continue;
    }
    const angle = main.subperiods.reduce((sum, item) => sum + item.angleDegrees, 0);
    const minutes = main.subperiods.reduce((sum, item) => sum + item.astroMinutes, 0);
    if (Math.abs(angle - main.mainAngleDegrees) > EPSILON) {
      errors.push(`main ${main.mainPlanet} sub angles do not match parent`);
    }
    if (minutes !== main.mainYears * 21600) {
      errors.push(`main ${main.mainPlanet} astro minutes do not match parent`);
    }
  }
  return errors;
}

export function validatePredictions(predictionsData) {
  const errors = [];
  if (predictionsData.predictions.length !== 64) {
    errors.push(`predictions contains ${predictionsData.predictions.length}, expected 64`);
  }
  const ids = new Set();
  for (const item of predictionsData.predictions) {
    if (ids.has(item.id)) errors.push(`duplicate prediction id ${item.id}`);
    ids.add(item.id);
  }
  return errors;
}

export function validateAll({ planetsData, subperiodsData, predictionsData }) {
  return [
    ...validatePlanets(planetsData),
    ...validateSubperiods(subperiodsData),
    ...validatePredictions(predictionsData)
  ];
}
