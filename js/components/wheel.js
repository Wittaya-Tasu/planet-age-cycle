import {
  describeArcLine,
  describeArcSegment,
  getLabelPosition,
  getMidAngle,
  mixWithWhite,
  polarToCartesian,
} from "../core/geometry.js";
import { getSegmentAriaLabel } from "../utils/format.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_SIZE = 800;
const CENTER = VIEWBOX_SIZE / 2;
const RADII = Object.freeze({
  center: 190,
  mainInner: 196,
  mainOuter: 295,
  journey: 298,
  subInner: 301,
  subOuter: 382,
});

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function createBackdrop() {
  const group = svgElement("g", { "aria-hidden": "true" });
  const backdrop = svgElement("circle", {
    cx: CENTER,
    cy: CENTER,
    r: 390,
    class: "wheel-backdrop",
  });
  const guideOuter = svgElement("circle", {
    cx: CENTER,
    cy: CENTER,
    r: 347,
    class: "wheel-guide",
  });
  const guideInner = svgElement("circle", {
    cx: CENTER,
    cy: CENTER,
    r: 246,
    class: "wheel-guide",
  });

  group.append(backdrop, guideOuter, guideInner);
  return group;
}

function createCenter(age, birthDay) {
  const group = svgElement("g", { "aria-hidden": "true" });
  const disc = svgElement("circle", {
    cx: CENTER,
    cy: CENTER,
    r: RADII.center,
    class: "center-disc",
  });
  const orbit = svgElement("circle", {
    cx: CENTER,
    cy: CENTER,
    r: 160,
    class: "center-orbit",
  });
  const knot = svgElement("circle", {
    cx: CENTER,
    cy: 328,
    r: 4,
    class: "center-knot",
  });
  const label = svgElement("text", {
    x: CENTER,
    y: 358,
    class: "center-age-label",
  });
  const years = svgElement("text", {
    x: CENTER,
    y: 414,
    class: "center-age-years",
  });
  const yearsNumber = svgElement("tspan", {
    class: "center-age-number",
  });
  const yearsUnit = svgElement("tspan", {
    dx: 8,
    class: "center-age-unit",
  });
  const remainder = svgElement("text", {
    x: CENTER,
    y: 449,
    class: "center-age-remainder",
  });
  const startDay = svgElement("text", {
    x: CENTER,
    y: 478,
    class: "center-start-day",
  });

  label.textContent = "อายุเต็ม";
  yearsNumber.textContent = age.years;
  yearsUnit.textContent = "ปี";
  years.append(yearsNumber, yearsUnit);
  remainder.textContent = `${age.months} เดือน ${age.days} วัน`;
  startDay.textContent = `จุดเริ่ม · วัน${birthDay.label}`;
  group.append(disc, orbit, knot, label, years, remainder, startDay);

  return group;
}

function createJourneyOverlay(journey) {
  const group = svgElement("g", {
    class: "journey-overlay",
    role: "img",
    "aria-label": `เส้นทางอายุจากวัน${journey.birthDay.label}ถึงอายุ ${journey.age.years} ปี ${journey.age.months} เดือน ${journey.age.days} วัน`,
  });
  const path = svgElement("path", {
    d: describeArcLine(
      CENTER,
      CENTER,
      RADII.journey,
      journey.startAngle,
      journey.startAngle + journey.progressAngle,
    ),
    class: "journey-path",
  });
  const startPosition = polarToCartesian(
    CENTER,
    CENTER,
    RADII.journey,
    journey.startAngle,
  );
  const currentPosition = polarToCartesian(
    CENTER,
    CENTER,
    RADII.journey,
    journey.currentAngle,
  );
  const startDot = svgElement("circle", {
    cx: startPosition.x,
    cy: startPosition.y,
    r: 7,
    class: "journey-dot journey-start-dot",
  });
  const currentHalo = svgElement("circle", {
    cx: currentPosition.x,
    cy: currentPosition.y,
    r: 10,
    class: "journey-current-halo",
  });
  const currentDot = svgElement("circle", {
    cx: currentPosition.x,
    cy: currentPosition.y,
    r: 5.5,
    class: "journey-dot journey-current-dot",
  });
  const startTitle = svgElement("title");
  const currentTitle = svgElement("title");

  startTitle.textContent = `จุดเริ่มวัน${journey.birthDay.label}`;
  currentTitle.textContent =
    `ตำแหน่งอายุ ${journey.age.years} ปี ${journey.age.months} เดือน ${journey.age.days} วัน`;
  startDot.append(startTitle);
  currentDot.append(currentTitle);
  group.append(path, startDot, currentHalo, currentDot);

  return group;
}

function createMainLabel(segment) {
  const midAngle = getMidAngle(segment.startAngle, segment.endAngle);
  const position = getLabelPosition(CENTER, CENTER, 247, midAngle);
  const text = svgElement("text", {
    x: position.x,
    y: position.y - 3,
    class: "wheel-label",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });
  const number = svgElement("tspan", {
    x: position.x,
    dy: 0,
    class: "main-label-number",
  });
  const name = svgElement("tspan", {
    x: position.x,
    dy: 18,
    class: "main-label-name",
  });

  number.textContent = segment.mainPlanet.number;
  name.textContent = segment.mainPlanet.shortName;
  text.append(number, name);
  return text;
}

function createSubLabel(segment) {
  const midAngle = getMidAngle(segment.startAngle, segment.endAngle);
  const position = getLabelPosition(CENTER, CENTER, 342, midAngle);
  const text = svgElement("text", {
    x: position.x,
    y: position.y + 5,
    class: "wheel-label sub-label",
    style: `--label-color: ${segment.mainPlanet.labelColor}`,
  });

  text.textContent = segment.subPlanet.number;
  return text;
}

function bindInteractions(group, segment, handlers) {
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", getSegmentAriaLabel(segment));
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

function createMainSegment(segment, handlers, journey) {
  const currentClass =
    segment.key === journey.activeMain.key ? " is-current-main" : "";
  const group = svgElement("g", {
    class: `wheel-segment main-segment${currentClass}`,
  });
  const path = svgElement("path", {
    d: describeArcSegment(
      CENTER,
      CENTER,
      RADII.mainInner,
      RADII.mainOuter,
      segment.startAngle,
      segment.endAngle,
    ),
    fill: segment.mainPlanet.color,
  });

  bindInteractions(group, segment, handlers);
  group.append(path, createMainLabel(segment));
  return group;
}

function createSubSegment(segment, index, handlers, journey) {
  const tightClass = segment.angle < 4.2 ? " is-tight" : "";
  const currentClass =
    segment.key === journey.activeSub.key ? " is-current-sub" : "";
  const group = svgElement("g", {
    class: `wheel-segment sub-segment${tightClass}${currentClass}`,
  });
  const lightRatio = 0.08 + (index % 4) * 0.085;
  const path = svgElement("path", {
    d: describeArcSegment(
      CENTER,
      CENTER,
      RADII.subInner,
      RADII.subOuter,
      segment.startAngle,
      segment.endAngle,
    ),
    fill: mixWithWhite(segment.mainPlanet.color, lightRatio),
  });

  bindInteractions(group, segment, handlers);
  group.append(path, createSubLabel(segment));
  return group;
}

export function renderWheel(container, model, handlers, context) {
  const { age, birthDay, journey } = context;
  const svg = svgElement("svg", {
    class: "planet-wheel",
    viewBox: `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`,
    role: "img",
    "aria-labelledby": "wheel-svg-title wheel-svg-description",
  });
  const title = svgElement("title", { id: "wheel-svg-title" });
  const description = svgElement("desc", { id: "wheel-svg-description" });
  const mainGroup = svgElement("g", { "data-ring": "main" });
  const subGroup = svgElement("g", { "data-ring": "sub" });

  title.textContent = "วงแหวนพระเคราะห์เสวยอายุ";
  description.textContent =
    `จุดเริ่มวัน${birthDay.label} เส้นประแสดงการเดินทางตามอายุ ` +
    `${age.years} ปี ${age.months} เดือน ${age.days} วัน`;

  model.mainSegments.forEach((segment) => {
    mainGroup.append(createMainSegment(segment, handlers, journey));
    segment.subSegments.forEach((subSegment, index) => {
      subGroup.append(createSubSegment(subSegment, index, handlers, journey));
    });
  });

  svg.append(
    title,
    description,
    createBackdrop(),
    mainGroup,
    subGroup,
    createJourneyOverlay(journey),
    createCenter(age, birthDay),
  );
  container.replaceChildren(svg);

  return {
    setSelected(segment) {
      svg.querySelectorAll(".wheel-segment.is-selected").forEach((element) => {
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
  };
}
