import { FULL_CIRCLE, START_ANGLE } from "./angles.js";
import { TOTAL_CYCLE_YEARS } from "../data/planets.js";

export const BUDDHIST_ERA_OFFSET = 543;
const DAY_MILLISECONDS = 86_400_000;
const POSITION_EPSILON = 1e-9;

export function daysInGregorianMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function createCivilDate({ day, month, yearBe }) {
  const numericDay = Number(day);
  const numericMonth = Number(month);
  const numericYearBe = Number(yearBe);
  const year = numericYearBe - BUDDHIST_ERA_OFFSET;

  if (!Number.isInteger(numericYearBe) || numericYearBe < 2300 || numericYearBe > 2800) {
    throw new Error("กรุณาระบุปี พ.ศ. ให้ถูกต้อง");
  }
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    throw new Error("กรุณาเลือกเดือนให้ถูกต้อง");
  }
  if (
    !Number.isInteger(numericDay) ||
    numericDay < 1 ||
    numericDay > daysInGregorianMonth(year, numericMonth)
  ) {
    throw new Error("วันที่ที่ระบุไม่มีอยู่จริงในเดือนและปีที่เลือก");
  }

  return new Date(Date.UTC(year, numericMonth - 1, numericDay));
}

export function dateToParts(date) {
  return Object.freeze({
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    yearBe: date.getUTCFullYear() + BUDDHIST_ERA_OFFSET,
  });
}

export function getTodayParts(now = new Date()) {
  return Object.freeze({
    day: now.getDate(),
    month: now.getMonth() + 1,
    yearBe: now.getFullYear() + BUDDHIST_ERA_OFFSET,
  });
}

function addBirthCalendarOffset(birthDate, years, months) {
  const birthYear = birthDate.getUTCFullYear();
  const birthMonthIndex = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();
  const totalMonthIndex = birthMonthIndex + months;
  const targetYear = birthYear + years + Math.floor(totalMonthIndex / 12);
  const targetMonthIndex = ((totalMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(
    birthDay,
    daysInGregorianMonth(targetYear, targetMonthIndex + 1),
  );

  return new Date(Date.UTC(targetYear, targetMonthIndex, targetDay));
}

export function calculateCalendarAge(birthDate, targetDate) {
  if (!(birthDate instanceof Date) || !(targetDate instanceof Date)) {
    throw new Error("ข้อมูลวันที่ไม่ถูกต้อง");
  }
  if (targetDate < birthDate) {
    throw new Error("วันที่เป้าหมายต้องไม่อยู่ก่อนวันเกิด");
  }

  let years = targetDate.getUTCFullYear() - birthDate.getUTCFullYear();
  if (addBirthCalendarOffset(birthDate, years, 0) > targetDate) {
    years -= 1;
  }

  let months = 0;
  while (
    months < 11 &&
    addBirthCalendarOffset(birthDate, years, months + 1) <= targetDate
  ) {
    months += 1;
  }

  const cursor = addBirthCalendarOffset(birthDate, years, months);
  const days = Math.round((targetDate.getTime() - cursor.getTime()) / DAY_MILLISECONDS);

  return Object.freeze({ years, months, days });
}

export function ageToCycleYears(age) {
  return age.years + age.months / 12 + age.days / 360;
}

function findActiveSegment(model, cyclePositionYears) {
  const position =
    cyclePositionYears >= TOTAL_CYCLE_YEARS - POSITION_EPSILON
      ? 0
      : cyclePositionYears;
  const mainSegment =
    model.mainSegments.find(
      (segment) =>
        position >= segment.startYear - POSITION_EPSILON &&
        position < segment.endYear - POSITION_EPSILON,
    ) ?? model.mainSegments[0];
  const subSegment =
    mainSegment.subSegments.find(
      (segment) =>
        position >= segment.startYear - POSITION_EPSILON &&
        position < segment.endYear - POSITION_EPSILON,
    ) ?? mainSegment.subSegments[0];

  return { mainSegment, subSegment };
}

export function createJourneyState(model, birthDay, age) {
  const birthMain = model.mainSegments.find(
    (segment) => segment.mainNumber === birthDay.planetNumber,
  );

  if (!birthMain) {
    throw new Error("ไม่พบแถบเริ่มต้นของวันเกิด");
  }

  const totalAgeYears = ageToCycleYears(age);
  const rawRemainder = totalAgeYears % TOTAL_CYCLE_YEARS;
  const progressYears =
    totalAgeYears > 0 && Math.abs(rawRemainder) < POSITION_EPSILON
      ? TOTAL_CYCLE_YEARS
      : rawRemainder;
  const positionRemainder =
    progressYears === TOTAL_CYCLE_YEARS ? 0 : progressYears;
  const cyclePositionYears =
    (birthMain.startYear + positionRemainder) % TOTAL_CYCLE_YEARS;
  const progressAngle = (progressYears / TOTAL_CYCLE_YEARS) * FULL_CIRCLE;
  const currentAngle =
    START_ANGLE + (cyclePositionYears / TOTAL_CYCLE_YEARS) * FULL_CIRCLE;
  const { mainSegment, subSegment } = findActiveSegment(
    model,
    cyclePositionYears,
  );

  return Object.freeze({
    birthDay,
    age,
    totalAgeYears,
    completedCycles: Math.floor(totalAgeYears / TOTAL_CYCLE_YEARS),
    progressYears,
    progressAngle,
    startAngle: birthMain.startAngle,
    currentAngle,
    cyclePositionYears,
    activeMain: mainSegment,
    activeSub: subSegment,
    yearsInsideMain: cyclePositionYears - mainSegment.startYear,
    yearsInsideSub: cyclePositionYears - subSegment.startYear,
  });
}
