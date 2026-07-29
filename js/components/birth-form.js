import { BIRTH_DAYS } from "../data/birth-days.js";
import {
  createCivilDate,
  dateToParts,
  getTodayParts,
} from "../core/age.js";

export const THAI_MONTHS = Object.freeze([
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]);

function populateNumberOptions(select, count, formatter = String) {
  const fragment = document.createDocumentFragment();

  for (let value = 1; value <= count; value += 1) {
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
  populateNumberOptions(form.elements.birthDay, 31);
  populateNumberOptions(form.elements.targetDay, 31);
  populateNumberOptions(
    form.elements.birthMonth,
    12,
    (value) => THAI_MONTHS[value - 1],
  );
  populateNumberOptions(
    form.elements.targetMonth,
    12,
    (value) => THAI_MONTHS[value - 1],
  );
  setTargetToToday(form);
}

export function setTargetToToday(form, now = new Date()) {
  const today = getTodayParts(now);
  form.elements.targetDay.value = String(today.day);
  form.elements.targetMonth.value = String(today.month);
  form.elements.targetYearBe.value = String(today.yearBe);
}

export function readProfileForm(form) {
  const profile = {
    birthWeekday: form.elements.birthWeekday.value,
    birthDate: {
      day: Number(form.elements.birthDay.value),
      month: Number(form.elements.birthMonth.value),
      yearBe: Number(form.elements.birthYearBe.value),
    },
    targetDate: {
      day: Number(form.elements.targetDay.value),
      month: Number(form.elements.targetMonth.value),
      yearBe: Number(form.elements.targetYearBe.value),
    },
  };

  if (!profile.birthWeekday) {
    throw new Error("กรุณาเลือกวันเกิดตามพระเคราะห์");
  }

  const birthDate = createCivilDate(profile.birthDate);
  const targetDate = createCivilDate(profile.targetDate);

  if (targetDate < birthDate) {
    throw new Error("วันที่เป้าหมายต้องไม่อยู่ก่อนวันเกิด");
  }

  return Object.freeze({
    birthWeekday: profile.birthWeekday,
    birthDate: dateToParts(birthDate),
    targetDate: dateToParts(targetDate),
  });
}

export function writeProfileForm(form, profile) {
  form.elements.birthWeekday.value = profile.birthWeekday;
  form.elements.birthDay.value = String(profile.birthDate.day);
  form.elements.birthMonth.value = String(profile.birthDate.month);
  form.elements.birthYearBe.value = String(profile.birthDate.yearBe);
  form.elements.targetDay.value = String(profile.targetDate.day);
  form.elements.targetMonth.value = String(profile.targetDate.month);
  form.elements.targetYearBe.value = String(profile.targetDate.yearBe);
}

export function resetBirthForm(form) {
  form.reset();
  setTargetToToday(form);
  form.elements.birthWeekday.value = "";
  form.elements.birthDay.value = "1";
  form.elements.birthMonth.value = "1";
  form.elements.birthYearBe.value = "";
}
