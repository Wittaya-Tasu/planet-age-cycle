import { TIME_RULES } from "../data/durations.js";

export function calculateSubDurationMinutes(mainYears, subWeight) {
  return mainYears * subWeight * TIME_RULES.subDurationFactor;
}

export function astroMinutesToDuration(totalAstroMinutes) {
  if (!Number.isFinite(totalAstroMinutes) || totalAstroMinutes < 0) {
    throw new Error("จำนวนนาทีโหราศาสตร์ต้องเป็นเลขศูนย์หรือจำนวนบวก");
  }

  let remaining = Math.round(totalAstroMinutes);
  const years = Math.floor(remaining / TIME_RULES.astroMinutesPerYear);
  remaining %= TIME_RULES.astroMinutesPerYear;

  const months = Math.floor(remaining / TIME_RULES.astroMinutesPerMonth);
  remaining %= TIME_RULES.astroMinutesPerMonth;

  const days = Math.floor(remaining / TIME_RULES.astroMinutesPerDay);
  const minutes = remaining % TIME_RULES.astroMinutesPerDay;

  return Object.freeze({
    years,
    months,
    days,
    minutes,
    totalAstroMinutes: Math.round(totalAstroMinutes),
  });
}

export function calculateSubDuration(mainYears, subWeight) {
  return astroMinutesToDuration(calculateSubDurationMinutes(mainYears, subWeight));
}
