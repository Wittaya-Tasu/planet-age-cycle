import { formatNumber } from "../utils/format.js";

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
  const heading = document.createElement("div");
  const eyebrow = document.createElement("p");
  const title = document.createElement("h2");
  const rows = document.createElement("div");

  heading.className = "journey-summary-heading";
  eyebrow.className = "journey-summary-eyebrow";
  title.className = "journey-summary-title";
  rows.className = "journey-summary-rows";
  eyebrow.textContent = "ตำแหน่งตามอายุ";
  title.textContent =
    `${journey.activeSub.subPlanet.name}แทรก${journey.activeMain.mainPlanet.name}`;

  rows.append(
    createSummaryRow("จุดเริ่ม", `วัน${journey.birthDay.label}`),
    createSummaryRow("แถบหลัก", journey.activeMain.mainPlanet.name),
    createSummaryRow(
      "ตำแหน่งในแถบหลัก",
      `${formatNumber(journey.yearsInsideMain, 1, 1)} ปี`,
    ),
  );

  if (journey.completedCycles > 0) {
    rows.append(
      createSummaryRow("วงจรที่ผ่าน", `${journey.completedCycles} รอบ`),
    );
  }

  heading.append(eyebrow, title);
  container.replaceChildren(heading, rows);
}
