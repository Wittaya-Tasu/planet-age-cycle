import { formatDuration, formatMainDuration, formatPercentage, getSegmentTitle } from "../utils/format.js";
import { formatThaiDateTime } from "../core/calendar.js";

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

function badge(text, className) {
  const element = document.createElement("span");
  element.className = `prediction-badge ${className}`;
  element.textContent = text;
  return element;
}

function detailsSection(titleText, values) {
  if (!values?.length) return null;
  const section = document.createElement("section");
  const title = document.createElement("h3");
  const list = document.createElement("ul");
  section.className = "prediction-detail-section";
  title.textContent = titleText;
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  });
  section.append(title, list);
  return section;
}

function renderEmpty(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "detail-empty";
  wrapper.innerHTML = '<div class="detail-orbit" aria-hidden="true">๑๐๘</div><h2>เลือกแถบบนวงแหวน</h2><p>รายละเอียดและคำพยากรณ์จะแสดงที่นี่</p>';
  container.replaceChildren(wrapper);
  container.style.removeProperty("--detail-color");
}

export function renderDetailPanel(container, segment = null, options = {}) {
  if (!segment) return renderEmpty(container);

  const eyebrow = document.createElement("p");
  const title = document.createElement("h2");
  const subtitle = document.createElement("p");
  const colorLine = document.createElement("div");
  const list = document.createElement("dl");
  eyebrow.className = "detail-eyebrow";
  title.className = "detail-title";
  subtitle.className = "detail-subtitle";
  colorLine.className = "detail-color-line";
  list.className = "detail-list";
  container.style.setProperty("--detail-color", segment.mainPlanet.color);
  eyebrow.textContent = options.isCurrent ? "ช่วงที่ตรงกับอายุ" : segment.type === "main" ? "แถบหลัก" : "แถบย่อย";
  title.textContent = getSegmentTitle(segment);
  subtitle.textContent = segment.type === "main" ? `เลขพระเคราะห์ ${segment.mainPlanet.number}` : `${segment.subPlanet.name} ภายในช่วง ${segment.mainPlanet.name}`;

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
    );
  }

  const nodes = [eyebrow, title, subtitle, colorLine, list];

  if (options.period) {
    const dates = document.createElement("dl");
    dates.className = "detail-list period-date-list";
    dates.append(
      createRow("เริ่ม", formatThaiDateTime(options.period.startEpochMs)),
      createRow("สิ้นสุด", formatThaiDateTime(options.period.endEpochMs)),
    );
    nodes.push(dates);
  }

  const badgeRow = document.createElement("div");
  badgeRow.className = "prediction-badges";
  if (options.mainRelation) badgeRow.append(badge(options.mainRelation.labelTh, `relation-${options.mainRelation.status}`));
  if (options.subRelation) badgeRow.append(badge(options.subRelation.labelTh, `relation-${options.subRelation.status}`));
  if (options.prediction?.effect === "mixed") {
    badgeRow.append(badge("ดีและไม่ดี", "effect-mixed"));
  } else if (options.prediction?.effect && options.prediction.effect !== "unknown") {
    badgeRow.append(badge(options.uiText.effect[options.prediction.effect], `effect-${options.prediction.effect}`));
  }
  if (badgeRow.childElementCount) nodes.push(badgeRow);

  if (options.prediction) {
    const summary = document.createElement("p");
    summary.className = "prediction-summary";
    summary.textContent = options.prediction.summaryTh || options.uiText.missingPrediction;
    nodes.push(summary);

    const sections = [
      detailsSection("คำพยากรณ์", options.prediction.details?.prediction),
      detailsSection("ข้อควรระวัง", options.prediction.details?.caution),
      detailsSection("โชคลาภ", options.prediction.details?.luck),
      detailsSection("ทิศโชคลาภ", options.prediction.details?.luckDirection),
      detailsSection("การแก้เคล็ด/บูชา", options.prediction.details?.remedy),
    ].filter(Boolean);
    nodes.push(...sections);

    const disclaimer = document.createElement("p");
    disclaimer.className = "prediction-disclaimer";
    disclaimer.textContent = options.uiText.disclaimer;
    nodes.push(disclaimer);
  }

  container.replaceChildren(...nodes);
}
