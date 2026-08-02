import {
  bangkokPartsToEpochMs,
  birthdayAnniversaryEpochMs,
  calendarDifference,
  epochMsToBangkokParts,
  getGregorianWeekday,
  getLeapDayNoticeTh,
  normalizeBirthParts
} from "./calendar.js";

const EPSILON = 1e-8;

export function rotateSequence(sequence, startPlanet) {
  const index = sequence.indexOf(startPlanet);
  if (index < 0) throw new Error(`start planet ${startPlanet} is not in sequence`);
  return [...sequence.slice(index), ...sequence.slice(0, index)];
}

function planetMap(planetsData) {
  return new Map(planetsData.planets.map((planet) => [planet.number, planet]));
}

function subperiodMap(subperiodsData) {
  const map = new Map();
  for (const main of subperiodsData.mainPeriods) {
    for (const sub of main.subperiods) {
      map.set(`${sub.mainPlanet}-${sub.subPlanet}`, sub);
    }
  }
  return map;
}

export function getBirthDayOption(relationsData, birthDayType) {
  const option = relationsData.birthDayTypes.find((item) => item.id === birthDayType);
  if (!option) throw new Error(`unknown birthDayType: ${birthDayType}`);
  return option;
}

export function validateBirthDayType(profile, relationsData) {
  const birth = normalizeBirthParts(profile.birth);
  const option = getBirthDayOption(relationsData, profile.birthDayType);
  const actualWeekday = getGregorianWeekday(birth);
  return {
    valid: actualWeekday === option.weekday,
    actualWeekday,
    selectedWeekday: option.weekday,
    messageTh: actualWeekday === option.weekday
      ? null
      : "วันเกิดที่เลือกไม่ตรงกับวันที่ในปฏิทิน กรุณาตรวจสอบ แต่ระบบยังอนุญาตให้ใช้วันที่ผู้ใช้ยืนยัน"
  };
}

function cycleStartYears(cycleIndex) {
  return cycleIndex * 108;
}

export function buildCycle(profile, cycleIndex, datasets) {
  const { planetsData, subperiodsData, relationsData } = datasets;
  const birth = normalizeBirthParts(profile.birth);
  const options = getBirthDayOption(relationsData, profile.birthDayType);
  const planets = planetMap(planetsData);
  const subMap = subperiodMap(subperiodsData);
  const mainSequence = rotateSequence(planetsData.sequence, options.startPlanet);

  let elapsedYears = cycleStartYears(cycleIndex);
  const cycleStart = birthdayAnniversaryEpochMs(birth, elapsedYears).epochMs;
  const mainPeriods = [];

  for (const mainNumber of mainSequence) {
    const mainPlanet = planets.get(mainNumber);
    const startYearOffset = elapsedYears;
    const endYearOffset = elapsedYears + mainPlanet.years;
    const startEpochMs = birthdayAnniversaryEpochMs(birth, startYearOffset).epochMs;
    const endEpochMs = birthdayAnniversaryEpochMs(birth, endYearOffset).epochMs;
    const parentDurationMs = endEpochMs - startEpochMs;
    const subSequence = rotateSequence(planetsData.sequence, mainNumber);

    let cumulativeWeight = 0;
    const subperiods = subSequence.map((subNumber, index) => {
      const subPlanet = planets.get(subNumber);
      const source = subMap.get(`${mainNumber}-${subNumber}`);
      const subStartEpochMs = index === 0
        ? startEpochMs
        : startEpochMs + Math.round(parentDurationMs * cumulativeWeight / 108);

      cumulativeWeight += subPlanet.weight;
      const subEndEpochMs = index === subSequence.length - 1
        ? endEpochMs
        : startEpochMs + Math.round(parentDurationMs * cumulativeWeight / 108);

      return {
        id: `${mainNumber}-${subNumber}`,
        mainPlanet: mainNumber,
        subPlanet: subNumber,
        titleTh: mainNumber === subNumber
          ? `${subPlanet.nameTh}เสวยอายุตัวเอง`
          : `${subPlanet.nameTh}แทรก${mainPlanet.nameTh}`,
        startEpochMs: subStartEpochMs,
        endEpochMs: subEndEpochMs,
        astroDuration: source.astroDuration,
        angleDegrees: source.angleDegrees,
        shareOfParentPercent: source.shareOfParentPercent
      };
    });

    mainPeriods.push({
      mainPlanet: mainNumber,
      startEpochMs,
      endEpochMs,
      years: mainPlanet.years,
      angleDegrees: mainPlanet.mainAngleDegrees,
      subperiods
    });
    elapsedYears = endYearOffset;
  }

  const cycleEnd = birthdayAnniversaryEpochMs(birth, cycleStartYears(cycleIndex + 1)).epochMs;
  return {
    cycleIndex,
    startPlanet: options.startPlanet,
    mainSequence,
    startEpochMs: cycleStart,
    endEpochMs: cycleEnd,
    mainPeriods
  };
}

export function findCycleIndex(profile, targetEpochMs) {
  const birth = normalizeBirthParts(profile.birth);
  const birthEpochMs = bangkokPartsToEpochMs(birth);
  if (targetEpochMs < birthEpochMs) throw new RangeError("target date is before birth");

  const targetYear = epochMsToBangkokParts(targetEpochMs).year;
  let index = Math.max(0, Math.floor((targetYear - birth.year) / 108));

  while (index > 0 && birthdayAnniversaryEpochMs(birth, cycleStartYears(index)).epochMs > targetEpochMs) {
    index -= 1;
  }
  while (birthdayAnniversaryEpochMs(birth, cycleStartYears(index + 1)).epochMs <= targetEpochMs) {
    index += 1;
  }
  return index;
}

function flattenCycle(cycle) {
  return cycle.mainPeriods.flatMap((main) =>
    main.subperiods.map((sub) => ({ ...sub, mainStartEpochMs: main.startEpochMs, mainEndEpochMs: main.endEpochMs }))
  );
}

export function findCurrentPeriod(profile, targetEpochMs, datasets) {
  const cycleIndex = findCycleIndex(profile, targetEpochMs);
  const cycle = buildCycle(profile, cycleIndex, datasets);
  const periods = flattenCycle(cycle);

  let currentIndex = periods.findIndex(
    (period) => targetEpochMs >= period.startEpochMs && targetEpochMs < period.endEpochMs
  );
  if (currentIndex < 0 && targetEpochMs === cycle.endEpochMs) {
    return findCurrentPeriod(profile, targetEpochMs + 1, datasets);
  }
  if (currentIndex < 0) throw new Error("current period could not be resolved");

  const current = periods[currentIndex];
  let previous = periods[currentIndex - 1] ?? null;
  let next = periods[currentIndex + 1] ?? null;

  if (!previous && cycleIndex > 0) {
    const previousCycle = buildCycle(profile, cycleIndex - 1, datasets);
    previous = flattenCycle(previousCycle).at(-1);
  }
  if (!next) {
    const nextCycle = buildCycle(profile, cycleIndex + 1, datasets);
    next = flattenCycle(nextCycle)[0];
  }

  const birthEpochMs = bangkokPartsToEpochMs(profile.birth);
  return {
    cycle,
    current,
    previous,
    next,
    currentAge: calendarDifference(birthEpochMs, targetEpochMs),
    remaining: calendarDifference(targetEpochMs, current.endEpochMs),
    leapDayNoticeTh: getLeapDayNoticeTh(profile.birth),
    birthDayValidation: validateBirthDayType(profile, datasets.relationsData)
  };
}

export function validateCycleGeometry(cycle) {
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
