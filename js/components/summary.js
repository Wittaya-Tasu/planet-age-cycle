import { formatAge, formatThaiDateShortFromEpoch } from "../core/calendar.js";

function create(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function renderCurrentSummary(container, { age, current, planetsByNumber, chulasakaratResult, birthTimeKnown }) {
  container.replaceChildren();
  const card = create("section", "current-summary-strip");
  const title = create("div", "summary-primary");
  title.append(
    create("span", "summary-kicker", "ช่วงชีวิตปัจจุบัน"),
    create("strong", "summary-current", `${planetsByNumber[current.main.planet].shortNameTh}เสวย · ${planetsByNumber[current.sub.subPlanet].shortNameTh}แทรก`),
  );
  card.append(title);

  const items = [
    ["อายุ", formatAge(age)],
    ["จ.ศ.กำเนิด", chulasakaratResult.status === "exact" ? String(chulasakaratResult.value) : chulasakaratResult.values.join(" / ")],
    ["เริ่มช่วงย่อย", formatThaiDateShortFromEpoch(current.sub.startEpochMs, birthTimeKnown)],
    ["สิ้นสุดช่วงย่อย", formatThaiDateShortFromEpoch(current.sub.endEpochMs, birthTimeKnown)],
    ["เหลือ", formatAge(current.remaining)],
  ];
  const grid = create("div", "summary-grid");
  items.forEach(([label, value]) => {
    const item = create("div", "summary-item");
    item.append(create("span", "summary-label", label), create("strong", "summary-value", value));
    grid.append(item);
  });
  card.append(grid);

  if (!birthTimeKnown) {
    card.append(create("p", "summary-note", "เวลาเกิดไม่ทราบ: ระบบเก็บเวลาเป็น null และแสดงจุดเปลี่ยนช่วงในระดับวันโดยไม่ใช้เวลาเกิดสมมติในการคำนวณจุลศักราช"));
  }
  container.append(card);
}
