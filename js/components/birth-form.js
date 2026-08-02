import { BIRTH_DAYS } from "../data/birth-days.js";
import { createCivilDate, dateToParts, getTodayParts } from "../core/age.js";

export const THAI_MONTHS = Object.freeze([
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]);

function populateNumberOptions(select, start, end, formatter = String) {
  const fragment = document.createDocumentFragment();
  for (let value = start; value <= end; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = formatter(value);
    fragment.append(option);
  }
  select.replaceChildren(fragment);
}

export function initializeBirthForm(form) {
  const weekdaySelect = form.elements.birthWeekday;
  const placeholder = weekdaySelect.querySelector('option[value=""]');
  const weekdayFragment = document.createDocumentFragment();
  BIRTH_DAYS.forEach((birthDay) => {
    const option = document.createElement("option");
    option.value = birthDay.id;
    option.textContent = birthDay.label;
    weekdayFragment.append(option);
  });
  weekdaySelect.replaceChildren(placeholder, weekdayFragment);
  populateNumberOptions(form.elements.birthDay, 1, 31);
  populateNumberOptions(form.elements.targetDay, 1, 31);
  populateNumberOptions(form.elements.birthMonth, 1, 12, (value) => THAI_MONTHS[value - 1]);
  populateNumberOptions(form.elements.targetMonth, 1, 12, (value) => THAI_MONTHS[value - 1]);
  populateNumberOptions(form.elements.birthHour, 0, 23, (value) => String(value).padStart(2, "0"));
  populateNumberOptions(form.elements.birthMinute, 0, 59, (value) => String(value).padStart(2, "0"));
  populateNumberOptions(form.elements.targetHour, 0, 23, (value) => String(value).padStart(2, "0"));
  populateNumberOptions(form.elements.targetMinute, 0, 59, (value) => String(value).padStart(2, "0"));
  setTargetToToday(form);
}

export function setTargetToToday(form, now = new Date()) {
  const today = getTodayParts(now);
  form.elements.targetDay.value = String(today.day);
  form.elements.targetMonth.value = String(today.month);
  form.elements.targetYearBe.value = String(today.yearBe);
  form.elements.targetHour.value = String(now.getHours());
  form.elements.targetMinute.value = String(now.getMinutes());
}

export function readProfileForm(form) {
  const profile = {
    birthWeekday: form.elements.birthWeekday.value,
    birthDate: {
      day: Number(form.elements.birthDay.value),
      month: Number(form.elements.birthMonth.value),
      yearBe: Number(form.elements.birthYearBe.value),
    },
    birthTime: {
      hour: Number(form.elements.birthHour.value),
      minute: Number(form.elements.birthMinute.value),
    },
    targetDate: {
      day: Number(form.elements.targetDay.value),
      month: Number(form.elements.targetMonth.value),
      yearBe: Number(form.elements.targetYearBe.value),
    },
    targetTime: {
      hour: Number(form.elements.targetHour.value),
      minute: Number(form.elements.targetMinute.value),
    },
  };

  if (!profile.birthWeekday) throw new Error("กรุณาเลือกวันเกิดตามพระเคราะห์");
  const birthDate = createCivilDate(profile.birthDate);
  const targetDate = createCivilDate(profile.targetDate);
  if (targetDate < birthDate) throw new Error("วันที่เป้าหมายต้องไม่อยู่ก่อนวันเกิด");

  return Object.freeze({
    birthWeekday: profile.birthWeekday,
    birthDate: dateToParts(birthDate),
    birthTime: Object.freeze(profile.birthTime),
    targetDate: dateToParts(targetDate),
    targetTime: Object.freeze(profile.targetTime),
  });
}

export function writeProfileForm(form, profile) {
  form.elements.birthWeekday.value = profile.birthWeekday;
  form.elements.birthDay.value = String(profile.birthDate.day);
  form.elements.birthMonth.value = String(profile.birthDate.month);
  form.elements.birthYearBe.value = String(profile.birthDate.yearBe);
  form.elements.birthHour.value = String(profile.birthTime?.hour ?? 0);
  form.elements.birthMinute.value = String(profile.birthTime?.minute ?? 0);
  form.elements.targetDay.value = String(profile.targetDate.day);
  form.elements.targetMonth.value = String(profile.targetDate.month);
  form.elements.targetYearBe.value = String(profile.targetDate.yearBe);
  form.elements.targetHour.value = String(profile.targetTime?.hour ?? 12);
  form.elements.targetMinute.value = String(profile.targetTime?.minute ?? 0);
}

export function resetBirthForm(form) {
  form.reset();
  setTargetToToday(form);
  form.elements.birthWeekday.value = "";
  form.elements.birthDay.value = "1";
  form.elements.birthMonth.value = "1";
  form.elements.birthYearBe.value = "";
  form.elements.birthHour.value = "0";
  form.elements.birthMinute.value = "0";
}
