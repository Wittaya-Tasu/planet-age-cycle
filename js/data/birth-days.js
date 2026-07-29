export const BIRTH_DAYS = Object.freeze([
  Object.freeze({ id: "sunday", label: "อาทิตย์", planetNumber: 1 }),
  Object.freeze({ id: "monday", label: "จันทร์", planetNumber: 2 }),
  Object.freeze({ id: "tuesday", label: "อังคาร", planetNumber: 3 }),
  Object.freeze({ id: "wednesday-day", label: "พุธ (กลางวัน)", planetNumber: 4 }),
  Object.freeze({ id: "wednesday-night", label: "พุธ (กลางคืน)", planetNumber: 8 }),
  Object.freeze({ id: "thursday", label: "พฤหัสบดี", planetNumber: 5 }),
  Object.freeze({ id: "friday", label: "ศุกร์", planetNumber: 6 }),
  Object.freeze({ id: "saturday", label: "เสาร์", planetNumber: 7 }),
]);

export function getBirthDay(id) {
  const birthDay = BIRTH_DAYS.find((item) => item.id === id);

  if (!birthDay) {
    throw new Error("กรุณาเลือกวันเกิดตามพระเคราะห์");
  }

  return birthDay;
}
