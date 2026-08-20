import { addYearsFromBirth, calendarDifferenceDates, interpolateEpoch } from "./calendar.js";

export function rotateSequence(sequence, startPlanet) {
  const index = sequence.indexOf(Number(startPlanet));
  if (index < 0) throw new Error(`ไม่พบดาวเริ่มต้น ${startPlanet} ในลำดับมหาทศา`);
  return [...sequence.slice(index), ...sequence.slice(0, index)];
}

export function traditionalSubDuration(mainYears, subYears) {
  let hours = mainYears * subYears * 80; // 108 ส่วนในปีทักษา 360 วัน = 8,640 ชม.; 8,640/108 = 80
  const years = Math.floor(hours / 8640);
  hours -= years * 8640;
  const months = Math.floor(hours / 720);
  hours -= months * 720;
  const days = Math.floor(hours / 24);
  hours -= days * 24;
  return { years, months, days, hours };
}

export function formatTraditionalDuration(duration) {
  const parts = [];
  if (duration.years) parts.push(`${duration.years} ปี`);
  if (duration.months) parts.push(`${duration.months} เดือน`);
  if (duration.days) parts.push(`${duration.days} วัน`);
  if (duration.hours) parts.push(`${duration.hours} ชั่วโมง`);
  return parts.join(" ") || "0 ชั่วโมง";
}

function planetMap(planetsData) {
  return Object.fromEntries(planetsData.planets.map((planet) => [planet.number, planet]));
}

export function buildCycle({ birthDate, birthTime, startPlanet, cycleIndex = 0, planetsData }) {
  const map = planetMap(planetsData);
  const sequence = rotateSequence(planetsData.sequence, startPlanet);
  const baseAge = cycleIndex * planetsData.totalYears;
  let accumulatedYears = baseAge;

  const mainPeriods = sequence.map((mainNumber) => {
    const mainPlanet = map[mainNumber];
    const startAge = accumulatedYears;
    const endAge = accumulatedYears + mainPlanet.years;
    const startEpochMs = addYearsFromBirth(birthDate, birthTime, startAge);
    const endEpochMs = addYearsFromBirth(birthDate, birthTime, endAge);
    const subSequence = rotateSequence(planetsData.sequence, mainNumber);
    let cumulativeWeight = 0;

    const subperiods = subSequence.map((subNumber, index) => {
      const subPlanet = map[subNumber];
      const startFraction = cumulativeWeight / planetsData.totalYears;
      cumulativeWeight += subPlanet.years;
      const endFraction = cumulativeWeight / planetsData.totalYears;
      const subStart = index === 0 ? startEpochMs : interpolateEpoch(startEpochMs, endEpochMs, startFraction);
      const subEnd = index === subSequence.length - 1 ? endEpochMs : interpolateEpoch(startEpochMs, endEpochMs, endFraction);
      return {
        key: `sub-${mainNumber}-${subNumber}`,
        mainPlanet: mainNumber,
        subPlanet: subNumber,
        startEpochMs: subStart,
        endEpochMs: subEnd,
        traditionalDuration: traditionalSubDuration(mainPlanet.years, subPlanet.years),
        traditionalDurationText: formatTraditionalDuration(traditionalSubDuration(mainPlanet.years, subPlanet.years)),
        share: subPlanet.years / planetsData.totalYears,
        index,
      };
    });

    accumulatedYears = endAge;
    return {
      key: `main-${mainNumber}`,
      planet: mainNumber,
      startAge,
      endAge,
      years: mainPlanet.years,
      startEpochMs,
      endEpochMs,
      subperiods,
    };
  });

  return { cycleIndex, startPlanet, sequence, mainPeriods };
}

export function findCurrentPeriod({ birthDate, birthTime, startPlanet, targetEpochMs, age, planetsData }) {
  const cycleIndex = Math.max(0, Math.floor(age.years / planetsData.totalYears));
  const cycle = buildCycle({ birthDate, birthTime, startPlanet, cycleIndex, planetsData });
  let main = cycle.mainPeriods.find((period) => targetEpochMs >= period.startEpochMs && targetEpochMs < period.endEpochMs);
  if (!main && targetEpochMs === cycle.mainPeriods.at(-1).endEpochMs) main = cycle.mainPeriods.at(-1);
  if (!main) main = cycle.mainPeriods[0];
  let sub = main.subperiods.find((period) => targetEpochMs >= period.startEpochMs && targetEpochMs < period.endEpochMs);
  if (!sub && targetEpochMs === main.endEpochMs) sub = main.subperiods.at(-1);
  if (!sub) sub = main.subperiods[0];
  const mainIndex = cycle.mainPeriods.indexOf(main);
  const subIndex = main.subperiods.indexOf(sub);
  const next = subIndex < main.subperiods.length - 1
    ? main.subperiods[subIndex + 1]
    : cycle.mainPeriods[(mainIndex + 1) % cycle.mainPeriods.length]?.subperiods[0] ?? null;

  return {
    cycle,
    main,
    sub,
    next,
    remaining: calendarDifferenceDates(targetEpochMs, sub.endEpochMs),
  };
}

export function validateCycle(cycle) {
  for (const main of cycle.mainPeriods) {
    if (main.subperiods.length !== 8) return false;
    if (main.subperiods[0].startEpochMs !== main.startEpochMs) return false;
    if (main.subperiods.at(-1).endEpochMs !== main.endEpochMs) return false;
    for (let i = 1; i < main.subperiods.length; i += 1) {
      if (main.subperiods[i - 1].endEpochMs !== main.subperiods[i].startEpochMs) return false;
    }
  }
  return true;
}
