import {
  formatDuration,
  formatMainDuration,
  formatPercentage,
  getSegmentTitle,
} from "../utils/format.js";

function createRow(label, value) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");

  wrapper.className = "detail-row";
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);

  return wrapper;
}

function renderEmpty(container) {
  const wrapper = document.createElement("div");
  const orbit = document.createElement("div");
  const title = document.createElement("h2");
  const text = document.createElement("p");

  wrapper.className = "detail-empty";
  orbit.className = "detail-orbit";
  orbit.setAttribute("aria-hidden", "true");
  orbit.textContent = "๑๐๘";
  title.textContent = "เลือกแถบบนวงแหวน";
  text.textContent = "รายละเอียดของพระเคราะห์และระยะเวลาจะแสดงที่นี่";
  wrapper.append(orbit, title, text);
  container.replaceChildren(wrapper);
  container.style.removeProperty("--detail-color");
}

export function renderDetailPanel(container, segment = null, options = {}) {
  if (!segment) {
    renderEmpty(container);
    return;
  }

  const eyebrow = document.createElement("p");
  const title = document.createElement("h2");
  const subtitle = document.createElement("p");
  const colorLine = document.createElement("div");
  const list = document.createElement("dl");
  const color =
    segment.type === "main" ? segment.mainPlanet.color : segment.mainPlanet.color;

  eyebrow.className = "detail-eyebrow";
  title.className = "detail-title";
  subtitle.className = "detail-subtitle";
  colorLine.className = "detail-color-line";
  list.className = "detail-list";

  container.style.setProperty("--detail-color", color);
  eyebrow.textContent = options.isCurrent
    ? "ช่วงที่ตรงกับอายุ"
    : segment.type === "main"
      ? "แถบหลัก"
      : "แถบย่อย";
  title.textContent = getSegmentTitle(segment);
  subtitle.textContent =
    segment.type === "main"
      ? `เลขพระเคราะห์ ${segment.mainPlanet.number}`
      : `${segment.subPlanet.name} ภายในช่วง ${segment.mainPlanet.name}`;

  if (segment.type === "main") {
    list.append(
      createRow("ระยะเวลา", formatMainDuration(segment.mainPlanet.years)),
      createRow("สัดส่วนวงจร", formatPercentage(segment.percentageOfCycle)),
      createRow("จำนวนแถบย่อย", `${segment.subSegments.length} ส่วน`),
    );
  } else {
    list.append(
      createRow("แถบหลัก", segment.mainPlanet.name),
      createRow("แถบย่อย", segment.subPlanet.name),
      createRow("ระยะเวลา", formatDuration(segment.duration)),
      createRow("สัดส่วนในแถบหลัก", formatPercentage(segment.percentageOfMain)),
    );
  }

  container.replaceChildren(eyebrow, title, subtitle, colorLine, list);
}
