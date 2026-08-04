import { getSegmentRelationBadge } from "../core/relations.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_WIDTH = 1680;
const HEADER_HEIGHT = 70;
const ROW_HEIGHT = 122;
const ROW_GAP = 14;
const FOOTER_HEIGHT = 26;
const VIEWBOX_HEIGHT =
  HEADER_HEIGHT + ROW_HEIGHT * 8 + ROW_GAP * 7 + FOOTER_HEIGHT;

const LABEL_X = 34;
const LABEL_WIDTH = 190;
const BAR_X = 250;
const MAX_BAR_WIDTH = 1020;
const AGE_X = 1300;
const AGE_WIDTH = 340;
const MAX_MAIN_YEARS = 21;

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mixWithWhite(hex, ratio) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const channel = (index) => parseInt(normalized.slice(index, index + 2), 16);
  const r = Math.round(channel(0) + (255 - channel(0)) * ratio);
  const g = Math.round(channel(2) + (255 - channel(2)) * ratio);
  const b = Math.round(channel(4) + (255 - channel(4)) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatAge(years) {
  const rounded = Math.round(years * 1000000) / 1000000;
  if (Number.isInteger(rounded)) return `${rounded} ปี`;

  const wholeYears = Math.floor(rounded);
  const totalMonths = (rounded - wholeYears) * 12;
  const wholeMonths = Math.floor(totalMonths + 1e-8);
  const totalDays = (totalMonths - wholeMonths) * 30;
  const wholeDays = Math.round(totalDays);
  const parts = [];
  if (wholeYears) parts.push(`${wholeYears} ปี`);
  if (wholeMonths) parts.push(`${wholeMonths} เดือน`);
  if (wholeDays) parts.push(`${wholeDays} วัน`);
  return parts.join(" ") || "0 ปี";
}

function durationText(segment) {
  if (segment.type === "main") {
    return `${segment.mainPlanet.years} ปี`;
  }

  const parts = [];
  const duration = segment.duration;
  if (duration.years) parts.push(`${duration.years} ปี`);
  if (duration.months) parts.push(`${duration.months} เดือน`);
  if (duration.days) parts.push(`${duration.days} วัน`);
  if (duration.minutes) parts.push(`${duration.minutes} นาที`);
  return parts.join(" ") || "0 นาที";
}

function getSegmentTitle(segment) {
  if (segment.type === "main") return segment.mainPlanet.name;
  if (segment.mainNumber === segment.subNumber) {
    return `${segment.subPlanet.name}เสวยอายุตัวเอง`;
  }
  return `${segment.subPlanet.name}แทรก${segment.mainPlanet.name}`;
}

function getSegmentAriaLabel(segment, relation) {
  const relationText = relation ? ` · ความสัมพันธ์${relation.labelTh}` : "";
  const typeText = segment.type === "main" ? "แถบหลัก" : "แถบย่อย";
  return `${typeText} ${getSegmentTitle(segment)} · ${durationText(segment)}${relationText}`;
}

function relationForSegment(context, segment) {
  if (!context.relationsData || !context.birthDayType) return null;
  return getSegmentRelationBadge(
    context.relationsData,
    context.birthDayType,
    segment,
  );
}

function bindInteractions(group, segment, handlers, relation = null) {
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", getSegmentAriaLabel(segment, relation));
  group.setAttribute("aria-pressed", "false");
  group.dataset.segmentKey = segment.key;

  group.addEventListener("pointerenter", (event) => handlers.onPreview(segment, event));
  group.addEventListener("pointermove", handlers.onPointerMove);
  group.addEventListener("pointerleave", handlers.onPreviewEnd);
  group.addEventListener("focus", () => handlers.onPreview(segment, group));
  group.addEventListener("blur", handlers.onPreviewEnd);
  group.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.onSelect(segment);
  });
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlers.onSelect(segment);
    }
  });
}

function createHeader() {
  const group = svgElement("g", {
    class: "timeline-row-header",
    "aria-hidden": "true",
  });
  const planet = svgElement("text", {
    x: LABEL_X,
    y: 43,
    class: "timeline-header-label timeline-header-left",
  });
  const bars = svgElement("text", {
    x: BAR_X,
    y: 43,
    class: "timeline-header-label timeline-header-left",
  });
  const age = svgElement("text", {
    x: AGE_X,
    y: 43,
    class: "timeline-header-label timeline-header-left",
  });

  planet.textContent = "ลำดับพระเคราะห์";
  bars.textContent = "แถบหลักและแถบย่อยตามสัดส่วนเวลา";
  age.textContent = "ช่วงอายุ";
  group.append(planet, bars, age);
  return group;
}

function createRowBackground(index, y, isCurrent) {
  const group = svgElement("g", {
    class: `timeline-row-background${isCurrent ? " is-current-row" : ""}`,
    "aria-hidden": "true",
  });
  const rect = svgElement("rect", {
    x: 14,
    y,
    width: VIEWBOX_WIDTH - 28,
    height: ROW_HEIGHT,
    rx: 22,
    ry: 22,
    class: "timeline-row-surface",
  });
  const order = svgElement("text", {
    x: 22,
    y: y + 24,
    class: "timeline-row-order",
  });
  order.textContent = String(index + 1);
  group.append(rect, order);
  return group;
}

function createPlanetLabel(segment, rowY) {
  const group = svgElement("g", {
    class: "timeline-planet-label",
    "aria-hidden": "true",
  });
  const chip = svgElement("circle", {
    cx: LABEL_X + 35,
    cy: rowY + 61,
    r: 31,
    fill: segment.mainPlanet.color,
    class: "timeline-planet-chip",
  });
  const number = svgElement("text", {
    x: LABEL_X + 35,
    y: rowY + 69,
    class: "timeline-planet-number",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  const name = svgElement("text", {
    x: LABEL_X + 78,
    y: rowY + 51,
    class: "timeline-planet-name",
  });
  const duration = svgElement("text", {
    x: LABEL_X + 78,
    y: rowY + 77,
    class: "timeline-planet-duration",
  });

  number.textContent = segment.mainPlanet.number;
  name.textContent = segment.mainPlanet.shortName;
  duration.textContent = `${segment.mainPlanet.years} ปี`;
  group.append(chip, number, name, duration);
  return group;
}

function getBarWidth(mainSegment) {
  return (mainSegment.mainPlanet.years / MAX_MAIN_YEARS) * MAX_BAR_WIDTH;
}

function createMainSegment(segment, handlers, context, rowY) {
  const isCurrent = segment.key === context.journey.activeMain.key;
  const relation = relationForSegment(context, segment);
  const group = svgElement("g", {
    class: `timeline-segment timeline-main${isCurrent ? " is-current-main" : ""}`,
  });
  const width = getBarWidth(segment);
  const y = rowY + 19;
  const rect = svgElement("rect", {
    x: BAR_X,
    y,
    width,
    height: 39,
    rx: 12,
    ry: 12,
    fill: segment.mainPlanet.color,
  });
  const label = svgElement("text", {
    x: BAR_X + 16,
    y: y + 26,
    class: "timeline-main-label",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  const endCap = svgElement("text", {
    x: BAR_X + width - 12,
    y: y + 26,
    class: "timeline-main-end-label",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });

  label.textContent = "แถบหลัก";
  endCap.textContent = `${segment.mainPlanet.years} ปี`;
  bindInteractions(group, segment, handlers, relation);
  group.append(rect, label);
  if (width > 160) group.append(endCap);
  return group;
}

function createSubSegment(segment, index, handlers, context, mainSegment, rowY) {
  const isCurrent = segment.key === context.journey.activeSub.key;
  const relation = relationForSegment(context, segment);
  const group = svgElement("g", {
    class: `timeline-segment timeline-sub${isCurrent ? " is-current-sub" : ""}`,
  });
  const mainWidth = getBarWidth(mainSegment);
  const x =
    BAR_X +
    ((segment.startYear - mainSegment.startYear) /
      mainSegment.mainPlanet.years) *
      mainWidth;
  const width =
    ((segment.endYear - segment.startYear) /
      mainSegment.mainPlanet.years) *
      mainWidth;
  const y = rowY + 68;
  const rect = svgElement("rect", {
    x,
    y,
    width,
    height: 35,
    rx: 8,
    ry: 8,
    fill: mixWithWhite(
      segment.mainPlanet.color,
      0.08 + (index % 4) * 0.085,
    ),
  });
  const label = svgElement("text", {
    x: x + width / 2,
    y: y + 24,
    class: "timeline-sub-number",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });

  label.textContent = segment.subPlanet.number;
  bindInteractions(group, segment, handlers, relation);
  group.append(rect);
  if (width > 24) group.append(label);
  return group;
}

function createAgeRange(mainSegment, rowY) {
  const group = svgElement("g", {
    class: "timeline-age-range",
    "aria-hidden": "true",
  });
  const label = svgElement("text", {
    x: AGE_X,
    y: rowY + 45,
    class: "timeline-age-label",
  });
  const value = svgElement("text", {
    x: AGE_X,
    y: rowY + 75,
    class: "timeline-age-value",
  });
  const exact = svgElement("text", {
    x: AGE_X,
    y: rowY + 99,
    class: "timeline-age-exact",
  });

  label.textContent = "ช่วงอายุ";
  value.textContent =
    `${formatAge(mainSegment.startYear)} – ${formatAge(mainSegment.endYear)}`;
  exact.textContent =
    `เริ่ม ${formatAge(mainSegment.startYear)} · สิ้นสุด ${formatAge(mainSegment.endYear)}`;
  group.append(label, value, exact);
  return group;
}

function createRelationMarker(relation, x, y, variant) {
  if (!relation) return null;
  const group = svgElement("g", {
    class: `timeline-relation timeline-relation-${relation.status} timeline-relation-${variant}`,
    transform: `translate(${x} ${y})`,
    "data-relation-status": relation.status,
    "data-relation-variant": variant,
    "aria-hidden": "true",
  });
  const circle = svgElement("circle", {
    cx: 0,
    cy: 0,
    r: variant === "main" ? 11 : 9,
    class: "timeline-relation-shape",
  });
  const text = svgElement("text", {
    x: 0,
    y: 5,
    class: "timeline-relation-text",
  });
  text.textContent = relation.status === "good" ? "✓" : "!";
  group.append(circle, text);
  return group;
}

export function collectTimelineRelationMarkers(model, context) {
  const markers = [];

  model.mainSegments.forEach((mainSegment, rowIndex) => {
    const rowY = HEADER_HEIGHT + rowIndex * (ROW_HEIGHT + ROW_GAP);
    const mainWidth = getBarWidth(mainSegment);
    const mainRelation = relationForSegment(context, mainSegment);
    if (mainRelation) {
      markers.push({
        segment: mainSegment,
        relation: mainRelation,
        variant: "main",
        x: BAR_X + mainWidth / 2,
        y: rowY + 38,
      });
    }

    mainSegment.subSegments.forEach((subSegment) => {
      const relation = relationForSegment(context, subSegment);
      if (!relation) return;
      markers.push({
        segment: subSegment,
        relation,
        variant: "sub",
        x:
          BAR_X +
          (((subSegment.startYear + subSegment.endYear) / 2 -
            mainSegment.startYear) /
            mainSegment.mainPlanet.years) *
            mainWidth,
        y: rowY + 78,
      });
    });
  });

  return markers;
}

function createRelationOverlay(model, context) {
  const overlay = svgElement("g", {
    class: "timeline-relation-overlay",
    "data-layer": "relations",
    "aria-hidden": "true",
  });

  collectTimelineRelationMarkers(model, context).forEach((item) => {
    const marker = createRelationMarker(
      item.relation,
      item.x,
      item.y,
      item.variant,
    );
    if (marker) overlay.append(marker);
  });

  return overlay;
}

function createCurrentMarker(model, context) {
  const activeMainIndex = model.mainSegments.findIndex(
    (segment) => segment.key === context.journey.activeMain.key,
  );
  if (activeMainIndex < 0) return null;

  const mainSegment = model.mainSegments[activeMainIndex];
  const rowY = HEADER_HEIGHT + activeMainIndex * (ROW_HEIGHT + ROW_GAP);
  const mainWidth = getBarWidth(mainSegment);
  const rawCycleYear =
    clamp(context.journey.progressAngle / 360, 0, 1) * 108;
  const cycleYear =
    rawCycleYear >= 108 - 1e-8 && mainSegment.startYear === 0
      ? 0
      : rawCycleYear;
  const fraction = clamp(
    (cycleYear - mainSegment.startYear) /
      mainSegment.mainPlanet.years,
    0,
    1,
  );
  const x = BAR_X + fraction * mainWidth;
  const group = svgElement("g", {
    class: "timeline-current-marker",
    "aria-hidden": "true",
  });
  const line = svgElement("line", {
    x1: x,
    y1: rowY + 12,
    x2: x,
    y2: rowY + 111,
    class: "timeline-current-line",
  });
  const arrow = svgElement("path", {
    d: `M ${x - 9} ${rowY + 10} L ${x + 9} ${rowY + 10} L ${x} ${rowY + 25} Z`,
    class: "timeline-current-arrow",
  });
  const chipWidth = 188;
  const chipX = clamp(
    x - chipWidth / 2,
    BAR_X,
    BAR_X + mainWidth - chipWidth,
  );
  const chip = svgElement("rect", {
    x: chipX,
    y: rowY - 12,
    width: chipWidth,
    height: 27,
    rx: 13,
    ry: 13,
    class: "timeline-current-chip",
  });
  const text = svgElement("text", {
    x: chipX + chipWidth / 2,
    y: rowY + 7,
    class: "timeline-current-text",
  });
  text.textContent =
    `อายุปัจจุบัน ${context.journey.age.years} ปี ${context.journey.age.months} เดือน`;
  group.append(line, chip, text, arrow);
  return group;
}

function createTimelineRow(mainSegment, rowIndex, handlers, context) {
  const rowY = HEADER_HEIGHT + rowIndex * (ROW_HEIGHT + ROW_GAP);
  const row = svgElement("g", {
    class: `timeline-row${
      mainSegment.key === context.journey.activeMain.key
        ? " is-current-row"
        : ""
    }`,
    "data-row-index": rowIndex,
    "data-main-number": mainSegment.mainNumber,
  });

  row.append(
    createRowBackground(
      rowIndex,
      rowY,
      mainSegment.key === context.journey.activeMain.key,
    ),
    createPlanetLabel(mainSegment, rowY),
    createMainSegment(mainSegment, handlers, context, rowY),
  );
  mainSegment.subSegments.forEach((subSegment, index) => {
    row.append(
      createSubSegment(
        subSegment,
        index,
        handlers,
        context,
        mainSegment,
        rowY,
      ),
    );
  });
  row.append(createAgeRange(mainSegment, rowY));
  return row;
}

export function renderTimeline(container, model, handlers, context) {
  const svg = svgElement("svg", {
    class: "planet-timeline",
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    role: "img",
    "aria-labelledby": "timeline-svg-title timeline-svg-description",
  });
  const title = svgElement("title", { id: "timeline-svg-title" });
  const description = svgElement("desc", { id: "timeline-svg-description" });
  const backdrop = svgElement("rect", {
    x: 4,
    y: 4,
    width: VIEWBOX_WIDTH - 8,
    height: VIEWBOX_HEIGHT - 8,
    rx: 28,
    ry: 28,
    class: "timeline-backdrop",
  });
  const rows = svgElement("g", {
    class: "timeline-rows",
    "data-layout": "one-main-period-per-row",
  });

  title.textContent = "Timeline พระเคราะห์เสวยอายุแบบแยกแถว";
  description.textContent =
    `แสดงพระเคราะห์หลัก 8 ช่วงเป็น 8 แถว เริ่มจากวัน${context.birthDay.label} ` +
    `แต่ละแถวมีแถบหลัก แถบย่อยตามสัดส่วนเวลา และช่วงอายุเริ่มถึงสิ้นสุด`;

  model.mainSegments.forEach((mainSegment, rowIndex) => {
    rows.append(
      createTimelineRow(mainSegment, rowIndex, handlers, context),
    );
  });

  const currentMarker = createCurrentMarker(model, context);
  svg.append(
    title,
    description,
    backdrop,
    createHeader(),
    rows,
  );
  if (currentMarker) svg.append(currentMarker);
  // วางเครื่องหมายความสัมพันธ์เป็นชั้นสุดท้าย เพื่อให้ทั้ง ✓ และ ! มองเห็นครบ
  svg.append(createRelationOverlay(model, context));
  container.replaceChildren(svg);

  return {
    setSelected(segment) {
      svg.querySelectorAll(".timeline-segment.is-selected").forEach((element) => {
        element.classList.remove("is-selected");
        element.setAttribute("aria-pressed", "false");
      });

      if (!segment) return;

      const selected = svg.querySelector(`[data-segment-key="${segment.key}"]`);
      if (selected) {
        selected.classList.add("is-selected");
        selected.setAttribute("aria-pressed", "true");
      }
    },
    // ตั้งใจไม่เลื่อนอัตโนมัติ เพื่อให้ผู้ใช้เห็นลำดับตั้งแต่ดาวเกิดแถวแรก
    scrollToCurrent() {},
  };
}
