import { getSegmentRelationBadge } from "../core/relations.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_WIDTH = 2400;
const VIEWBOX_HEIGHT = 360;
const PADDING_X = 58;
const TRACK_WIDTH = VIEWBOX_WIDTH - PADDING_X * 2;
const MAIN_Y = 84;
const MAIN_HEIGHT = 66;
const SUB_Y = 176;
const SUB_HEIGHT = 82;
const AXIS_Y = 282;

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
  if (segment.type === "main") {
    return `${segment.mainPlanet.name}`;
  }
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

function createRelationMarker(relation, x, y, variant = "sub") {
  if (!relation) return null;
  const group = svgElement("g", {
    class: `timeline-relation timeline-relation-${relation.status} timeline-relation-${variant}`,
    transform: `translate(${x} ${y})`,
    "aria-hidden": "true",
  });
  const circle = svgElement("circle", {
    cx: 0,
    cy: 0,
    r: variant === "main" ? 12 : 10,
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

function createMainSegment(segment, handlers, context) {
  const currentClass = segment.key === context.journey.activeMain.key ? " is-current-main" : "";
  const relation = getSegmentRelationBadge(context.relationsData, context.birthDayType, segment);
  const group = svgElement("g", {
    class: `timeline-segment timeline-main${currentClass}`,
  });
  const x = PADDING_X + (segment.startYear / 108) * TRACK_WIDTH;
  const width = ((segment.endYear - segment.startYear) / 108) * TRACK_WIDTH;
  const rect = svgElement("rect", {
    x,
    y: MAIN_Y,
    width,
    height: MAIN_HEIGHT,
    rx: 16,
    ry: 16,
    fill: segment.mainPlanet.color,
  });
  const number = svgElement("text", {
    x: x + width / 2,
    y: MAIN_Y + 28,
    class: "timeline-main-number",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  const name = svgElement("text", {
    x: x + width / 2,
    y: MAIN_Y + 49,
    class: "timeline-main-name",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  number.textContent = segment.mainPlanet.number;
  name.textContent = segment.mainPlanet.shortName;
  bindInteractions(group, segment, handlers, relation);
  group.append(rect, number);
  if (width > 92) group.append(name);

  if (relation) {
    const marker = createRelationMarker(relation, x + width / 2, MAIN_Y + 16, "main");
    if (marker) group.append(marker);
  }

  return group;
}

function createSubSegment(segment, index, handlers, context) {
  const currentClass = segment.key === context.journey.activeSub.key ? " is-current-sub" : "";
  const relation = getSegmentRelationBadge(context.relationsData, context.birthDayType, segment);
  const group = svgElement("g", {
    class: `timeline-segment timeline-sub${currentClass}`,
  });
  const x = PADDING_X + (segment.startYear / 108) * TRACK_WIDTH;
  const width = ((segment.endYear - segment.startYear) / 108) * TRACK_WIDTH;
  const rect = svgElement("rect", {
    x,
    y: SUB_Y,
    width,
    height: SUB_HEIGHT,
    rx: 12,
    ry: 12,
    fill: mixWithWhite(segment.mainPlanet.color, 0.08 + (index % 4) * 0.085),
  });
  const label = svgElement("text", {
    x: x + width / 2,
    y: SUB_Y + SUB_HEIGHT / 2 + 6,
    class: "timeline-sub-number",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  label.textContent = segment.subPlanet.number;
  bindInteractions(group, segment, handlers, relation);
  group.append(rect);
  if (width > 24) group.append(label);
  if (relation) {
    const marker = createRelationMarker(relation, x + width / 2, SUB_Y + 15, "sub");
    if (marker) group.append(marker);
  }
  return group;
}

function createAxis(model) {
  const group = svgElement("g", {
    class: "timeline-axis",
    "aria-hidden": "true",
  });
  const line = svgElement("line", {
    x1: PADDING_X,
    y1: AXIS_Y,
    x2: PADDING_X + TRACK_WIDTH,
    y2: AXIS_Y,
    class: "timeline-axis-line",
  });
  group.append(line);

  const start = svgElement("text", {
    x: PADDING_X,
    y: AXIS_Y + 26,
    class: "timeline-axis-caption timeline-axis-caption-start",
  });
  start.textContent = "เริ่มต้น";
  group.append(start);

  model.mainSegments.forEach((segment) => {
    const x = PADDING_X + (segment.startYear / 108) * TRACK_WIDTH;
    const tick = svgElement("line", {
      x1: x,
      y1: AXIS_Y - 7,
      x2: x,
      y2: AXIS_Y + 7,
      class: "timeline-axis-tick",
    });
    const label = svgElement("text", {
      x,
      y: AXIS_Y + 24,
      class: "timeline-axis-label",
    });
    label.textContent = `${segment.startYear} ปี`;
    group.append(tick, label);
  });

  const endX = PADDING_X + TRACK_WIDTH;
  const endTick = svgElement("line", {
    x1: endX,
    y1: AXIS_Y - 7,
    x2: endX,
    y2: AXIS_Y + 7,
    class: "timeline-axis-tick",
  });
  const endLabel = svgElement("text", {
    x: endX,
    y: AXIS_Y + 24,
    class: "timeline-axis-label timeline-axis-label-end",
  });
  endLabel.textContent = "108 ปี";
  group.append(endTick, endLabel);
  return group;
}

function createCurrentMarker(journey) {
  const x = PADDING_X + (journey.progressAngle / 360) * TRACK_WIDTH;
  const group = svgElement("g", {
    class: "timeline-current-marker",
    "aria-hidden": "true",
  });
  const line = svgElement("line", {
    x1: x,
    y1: 44,
    x2: x,
    y2: SUB_Y + SUB_HEIGHT + 18,
    class: "timeline-current-line",
  });
  const arrow = svgElement("path", {
    d: `M ${x - 9} 48 L ${x + 9} 48 L ${x} 64 Z`,
    class: "timeline-current-arrow",
  });
  const badge = svgElement("rect", {
    x: x - 72,
    y: 10,
    width: 144,
    height: 26,
    rx: 13,
    ry: 13,
    class: "timeline-current-chip",
  });
  const text = svgElement("text", {
    x,
    y: 28,
    class: "timeline-current-text",
  });
  text.textContent = `อายุปัจจุบัน ${journey.age.years} ปี ${journey.age.months} เดือน`;
  group.append(line, badge, text, arrow);
  return { group, x };
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
  const bg = svgElement("rect", {
    x: 10,
    y: 10,
    width: VIEWBOX_WIDTH - 20,
    height: VIEWBOX_HEIGHT - 20,
    rx: 26,
    ry: 26,
    class: "timeline-backdrop",
  });
  const mainGroup = svgElement("g", { "data-track": "main" });
  const subGroup = svgElement("g", { "data-track": "sub" });

  title.textContent = "Timeline พระเคราะห์เสวยอายุ";
  description.textContent =
    `แสดงลำดับแถบหลักและแถบย่อยตามเวลา เริ่มที่วัน${context.birthDay.label} และตำแหน่งอายุปัจจุบัน ${context.journey.age.years} ปี ${context.journey.age.months} เดือน ${context.journey.age.days} วัน`;

  model.mainSegments.forEach((segment) => {
    mainGroup.append(createMainSegment(segment, handlers, context));
    segment.subSegments.forEach((subSegment, index) => {
      subGroup.append(createSubSegment(subSegment, index, handlers, context));
    });
  });

  const currentMarker = createCurrentMarker(context.journey);

  svg.append(
    title,
    description,
    bg,
    createAxis(model),
    mainGroup,
    subGroup,
    currentMarker.group,
  );
  container.replaceChildren(svg);

  const scrollToCurrent = () => {
    const viewportWidth = container.clientWidth;
    const svgWidth = svg.getBoundingClientRect().width || container.scrollWidth || viewportWidth;
    const scaledX = (currentMarker.x / VIEWBOX_WIDTH) * svgWidth;
    const target = clamp(scaledX - viewportWidth / 2, 0, Math.max(0, container.scrollWidth - viewportWidth));
    container.scrollTo({ left: target, behavior: "smooth" });
  };

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
    scrollToCurrent,
  };
}
