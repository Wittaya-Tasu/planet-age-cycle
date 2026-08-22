import {
  addYearsFromBirth,
  calculateCalendarAge,
  epochToBangkokParts,
  gregorianToBuddhist,
  interpolateEpoch,
} from "./calendar.js";
import { calculateChulasakarat, calculateThaloengSokBoundary } from "./thaiCalendar.js";
import { calculateMahabhutaMap, getKalayokState } from "./mahabhuta.js";
import { findCurrentPeriod, rotateSequence } from "./mahadasha.js";
import { getRelationship } from "./relationships.js";

const EPSILON_MS = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function overlap(startA, endA, startB, endB) {
  const start = Math.max(startA, startB);
  const end = Math.min(endA, endB);
  return end > start ? { startEpochMs: start, endEpochMs: end } : null;
}

function epochInputParts(epochMs) {
  const p = epochToBangkokParts(epochMs);
  return {
    date: { yearBe: gregorianToBuddhist(p.year), month: p.month, day: p.day },
    time: { hour: p.hour, minute: p.minute, second: p.second },
  };
}

export function relationPolarity(relationship) {
  const polarities = new Set(relationship.items.map((item) => item.polarity).filter(Boolean));
  if (polarities.has("supportive") && polarities.has("conflicting")) return "mixed";
  if (polarities.has("supportive")) return "supportive";
  if (polarities.has("conflicting")) return "conflicting";
  return "neutral";
}

export function calculatePhumiYear({ birthPlanet, completedAgeYears, ageBasis, config }) {
  const calculationAge = ageBasis === "full_age" ? completedAgeYears : completedAgeYears + 1;
  if (ageBasis === "full_age" && calculationAge < 1) {
    throw new Error("โหมดอายุเต็มสำหรับภูมิทักษาเริ่มใช้ตั้งแต่อายุเต็ม 1 ปีขึ้นไป");
  }
  const countRemainder = calculationAge % 8;
  const count = countRemainder === 0 ? 8 : countRemainder;
  const rotated = rotateSequence(config.planetarySequence, birthPlanet);
  return {
    ageBasis,
    completedAgeYears,
    ageYang: completedAgeYears + 1,
    calculationAge,
    count,
    planet: rotated[count - 1],
    thaksaPosition: config.thaksaPositions[count - 1],
  };
}

export function createAnutaksaProjection({ yearStartEpochMs, yearEndEpochMs, phumiPlanet, config }) {
  const sequence = rotateSequence(config.planetarySequence, phumiPlanet);
  const total = config.anutaksaCanonicalYearDays;
  let cumulative = 0;
  return sequence.map((planet, index) => {
    const canonicalDays = Number(config.anutaksaDurationsDays[String(planet)]);
    const startFraction = cumulative / total;
    cumulative += canonicalDays;
    const endFraction = cumulative / total;
    return {
      index,
      planet,
      canonicalDays,
      cumulativeStartDay: cumulative - canonicalDays,
      cumulativeEndDayExclusive: cumulative,
      startEpochMs: index === 0
        ? yearStartEpochMs
        : interpolateEpoch(yearStartEpochMs, yearEndEpochMs, startFraction),
      endEpochMs: index === sequence.length - 1
        ? yearEndEpochMs
        : interpolateEpoch(yearStartEpochMs, yearEndEpochMs, endFraction),
      projectionMode: config.calendarMode,
      modernExtension: true,
    };
  });
}

function boundaryEventsBetween(startEpochMs, endEpochMs, boundariesConfig) {
  const start = epochToBangkokParts(startEpochMs);
  const end = epochToBangkokParts(endEpochMs - EPSILON_MS);
  const events = [];
  for (let ceYear = start.year; ceYear <= end.year; ceYear += 1) {
    const boundary = calculateThaloengSokBoundary(ceYear, boundariesConfig);
    if (boundary.standardEpochMs > startEpochMs && boundary.standardEpochMs < endEpochMs) {
      events.push(boundary);
    }
  }
  return events.sort((a, b) => a.standardEpochMs - b.standardEpochMs);
}

function annualStateAtEpoch(epochMs, planet, kalayokData, boundariesConfig) {
  if (planet === 8) {
    return {
      chulasakarat: null,
      map: null,
      state: getKalayokState(null, 8),
    };
  }
  const input = epochInputParts(epochMs);
  const cs = calculateChulasakarat(input.date, input.time, boundariesConfig);
  if (cs.status !== "exact") {
    return {
      chulasakarat: null,
      map: null,
      state: { quality: "unknown", displayNameTh: "จ.ศ. ไม่ชัดเจน", key: "ambiguous" },
    };
  }
  const map = calculateMahabhutaMap(cs.value, kalayokData);
  return {
    chulasakarat: cs.value,
    map,
    state: getKalayokState(map, planet),
  };
}

export function splitByAnnualKalayok({ startEpochMs, endEpochMs, planet, kalayokData, boundariesConfig }) {
  const events = boundaryEventsBetween(startEpochMs, endEpochMs, boundariesConfig);
  const cuts = [startEpochMs, ...events.map((event) => event.standardEpochMs), endEpochMs];
  return cuts.slice(0, -1).map((start, index) => {
    const end = cuts[index + 1];
    const stateAt = annualStateAtEpoch(Math.min(end - EPSILON_MS, start + EPSILON_MS), planet, kalayokData, boundariesConfig);
    return {
      startEpochMs: start,
      endEpochMs: end,
      planet,
      chulasakarat: stateAt.chulasakarat,
      state: stateAt.state,
      durationMs: end - start,
    };
  });
}

export function buildAnnualForecast({
  profile,
  birthPlanet,
  natalKalayokMap,
  planetsData,
  kalayokData,
  relationshipsData,
  boundariesConfig,
  annualConfig,
  ageBasis = annualConfig.defaultAgeBasis,
}) {
  const age = calculateCalendarAge(profile.birthDate, profile.targetDate);
  const completedAgeYears = age.years;
  const yearStartEpochMs = addYearsFromBirth(profile.birthDate, profile.birthTime, completedAgeYears);
  const yearEndEpochMs = addYearsFromBirth(profile.birthDate, profile.birthTime, completedAgeYears + 1);
  const yearDurationMs = yearEndEpochMs - yearStartEpochMs;
  const phumi = calculatePhumiYear({ birthPlanet, completedAgeYears, ageBasis, config: annualConfig });

  const midpointEpoch = Math.round((yearStartEpochMs + yearEndEpochMs) / 2);
  const currentForYear = findCurrentPeriod({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    startPlanet: birthPlanet,
    targetEpochMs: midpointEpoch,
    age: { years: completedAgeYears, months: 6, days: 0 },
    planetsData,
  });
  const main = currentForYear.main;
  const natalMainState = getKalayokState(natalKalayokMap, main.planet);

  const subPeriods = main.subperiods
    .map((sub) => ({ sub, span: overlap(sub.startEpochMs, sub.endEpochMs, yearStartEpochMs, yearEndEpochMs) }))
    .filter((item) => item.span)
    .map(({ sub, span }) => {
      const pieces = splitByAnnualKalayok({
        ...span,
        planet: sub.subPlanet,
        kalayokData,
        boundariesConfig,
      });
      const relationship = getRelationship(relationshipsData, main.planet, sub.subPlanet);
      return {
        ...sub,
        overlapStartEpochMs: span.startEpochMs,
        overlapEndEpochMs: span.endEpochMs,
        overlapFraction: (span.endEpochMs - span.startEpochMs) / yearDurationMs,
        pieces,
        relationship,
        relationshipPolarity: relationPolarity(relationship),
      };
    });

  const phumiPieces = splitByAnnualKalayok({
    startEpochMs: yearStartEpochMs,
    endEpochMs: yearEndEpochMs,
    planet: phumi.planet,
    kalayokData,
    boundariesConfig,
  });

  const anutaksa = createAnutaksaProjection({
    yearStartEpochMs,
    yearEndEpochMs,
    phumiPlanet: phumi.planet,
    config: annualConfig,
  }).map((period) => ({
    ...period,
    pieces: splitByAnnualKalayok({
      startEpochMs: period.startEpochMs,
      endEpochMs: period.endEpochMs,
      planet: period.planet,
      kalayokData,
      boundariesConfig,
    }),
  }));

  const boundaryEvents = boundaryEventsBetween(yearStartEpochMs, yearEndEpochMs, boundariesConfig).map((event) => ({
    epochMs: event.standardEpochMs,
    csBefore: event.csBefore,
    csAfter: event.csAfter,
    fraction: clamp((event.standardEpochMs - yearStartEpochMs) / yearDurationMs, 0, 1),
  }));

  return {
    age,
    ageBasis,
    completedAgeYears,
    ageYang: completedAgeYears + 1,
    calculationAge: phumi.calculationAge,
    yearStartEpochMs,
    yearEndEpochMs,
    yearDurationMs,
    main: {
      planet: main.planet,
      years: main.years,
      natalState: natalMainState,
    },
    subPeriods,
    phumi: {
      ...phumi,
      pieces: phumiPieces,
    },
    anutaksa,
    boundaryEvents,
    metadata: {
      anutaksaCalendarMode: annualConfig.calendarMode,
      canonicalYearDays: annualConfig.anutaksaCanonicalYearDays,
      modernExtension: true,
      birthTimeKnown: Boolean(profile.birthTime),
    },
  };
}
