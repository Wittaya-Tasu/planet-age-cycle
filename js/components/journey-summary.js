import { formatThaiDateTime, formatDurationTh } from "../core/calendar.js";

function createSummaryRow(label, value) {
  const row = document.createElement("div");
  const term = document.createElement("span");
  const detail = document.createElement("strong");
  row.className = "journey-summary-row";
  term.textContent = label;
  detail.textContent = value;
  row.append(term, detail);
  return row;
}

export function renderJourneySummary(container, journey) {
  const { periodResult } = journey;
  const heading = document.createElement("div");
  const eyebrow = document.createElement("p");
  const title = document.createElement("h2");
  const rows = document.createElement("div");

  heading.className = "journey-summary-heading";
  eyebrow.className = "journey-summary-eyebrow";
  title.className = "journey-summary-title";
  rows.className = "journey-summary-rows";
  eyebrow.textContent = "ช่วงชีวิตปัจจุบัน";
  title.textContent = periodResult.current.titleTh;

  rows.append(
    createSummaryRow("แถบหลัก", journey.activeMain.mainPlanet.name),
    createSummaryRow("เริ่มช่วงนี้", formatThaiDateTime(periodResult.current.startEpochMs)),
    createSummaryRow("สิ้นสุดช่วงนี้", formatThaiDateTime(periodResult.current.endEpochMs)),
    createSummaryRow("เวลาที่เหลือ", formatDurationTh(periodResult.remaining)),
    createSummaryRow("ช่วงถัดไป", periodResult.next.titleTh),
  );

  if (journey.completedCycles > 0) {
    rows.append(createSummaryRow("วงจรที่ผ่าน", `${journey.completedCycles} รอบ`));
  }

  if (periodResult.leapDayNoticeTh) {
    const notice = document.createElement("p");
    notice.className = "leap-day-notice compact-notice";
    notice.textContent = periodResult.leapDayNoticeTh;
    heading.append(eyebrow, title);
    container.replaceChildren(heading, rows, notice);
    return;
  }

  heading.append(eyebrow, title);
  container.replaceChildren(heading, rows);
}
