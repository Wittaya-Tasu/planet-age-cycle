import { datePartsToEpoch, daysInMonth, epochToBangkokParts, gregorianToBuddhist } from "../core/calendar.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 1450;
const HEIGHT = 790;
const BAR_TOP = 150;
const BAR_HEIGHT = 560;
const BAR_W = 170;
const MAIN_X = 70;
const SUB_X = 320;
const PHUMI_X = 570;
const ANU_X = 820;
const MONTH_X = 1070;

const COLORS = {
  goodFill: "#DCEFE3",
  goodText: "#195D3A",
  badFill: "#F6DDDF",
  badText: "#8E2630",
  unknownFill: "#ECEBE8",
  unknownText: "#2F2C29",
  line: "#B8A99D",
  accent: "#6F1D1B",
  supportive: "#17633E",
  conflicting: "#8E2630",
  neutral: "#A79B91",
  monthFill: "#F3EEE8",
  monthText: "#52463D",
};

const THAI_SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function svg(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
}

function text(x, y, value, className, fill = null, anchor = "middle") {
  const el = svg("text", { x, y, class: className, "text-anchor": anchor });
  if (fill) el.setAttribute("fill", fill);
  el.textContent = value;
  return el;
}

function multilineText(x, y, lines, className, fill = null, anchor = "middle", lineHeight = 15) {
  const el = svg("text", { x, y, class: className, "text-anchor": anchor });
  if (fill) el.setAttribute("fill", fill);
  lines.forEach((line, index) => {
    const span = svg("tspan", { x, dy: index === 0 ? 0 : lineHeight });
    span.textContent = line;
    el.append(span);
  });
  return el;
}

function styleFor(state) {
  if (state?.quality === "good") return { fill: COLORS.goodFill, text: COLORS.goodText };
  if (state?.quality === "bad") return { fill: COLORS.badFill, text: COLORS.badText };
  return { fill: COLORS.unknownFill, text: COLORS.unknownText };
}

function shortDate(epochMs) {
  const p = epochToBangkokParts(epochMs);
  return `${p.day} ${THAI_SHORT_MONTHS[p.month - 1]} ${gregorianToBuddhist(p.year)}`;
}

function tinyDate(epochMs) {
  const p = epochToBangkokParts(epochMs);
  return `${p.day} ${THAI_SHORT_MONTHS[p.month - 1]}`;
}

function inclusiveDate(endEpochMs) {
  return shortDate(endEpochMs - 1);
}

function segmentY(startEpochMs, endEpochMs, model) {
  const startFraction = (startEpochMs - model.yearStartEpochMs) / model.yearDurationMs;
  const endFraction = (endEpochMs - model.yearStartEpochMs) / model.yearDurationMs;
  return {
    y: BAR_TOP + startFraction * BAR_HEIGHT,
    height: Math.max(1.5, (endFraction - startFraction) * BAR_HEIGHT),
  };
}

function drawMainBar(root, model, planetsByNumber) {
  const state = model.main.natalState;
  const style = styleFor(state);
  const planet = planetsByNumber[model.main.planet];
  const ageBasisLabel = model.ageBasis === "yang_age" ? "อายุย่าง" : "อายุเต็ม";
  const ageValue = model.calculationAge;
  const group = svg("g", { class: "annual-main-bar" });
  group.append(svg("rect", { x: MAIN_X, y: BAR_TOP, width: BAR_W, height: BAR_HEIGHT, rx: 20, fill: style.fill, stroke: style.text, "stroke-width": 1.5 }));
  group.append(text(MAIN_X + BAR_W / 2, BAR_TOP + 128, String(model.main.planet), "annual-big-number", style.text));
  group.append(text(MAIN_X + BAR_W / 2, BAR_TOP + 172, planet.shortNameTh, "annual-planet-name", style.text));
  group.append(text(MAIN_X + BAR_W / 2, BAR_TOP + 210, state.displayNameTh, "annual-position-name", style.text));
  group.append(text(MAIN_X + BAR_W / 2, BAR_TOP + 350, ageBasisLabel, "annual-age-label", style.text));
  group.append(text(MAIN_X + BAR_W / 2, BAR_TOP + 420, String(ageValue), "annual-big-number", style.text));
  root.append(group);
}

function displayStateName(piece, options = {}) {
  if (options.hideRahuUnknownLabel && piece.planet === 8 && piece.state?.quality === "unknown") return "";
  return piece.state?.displayNameTh ?? "";
}

function drawDynamicBar(root, pieces, x, model, planetsByNumber, options = {}) {
  const group = svg("g", { class: options.className ?? "annual-dynamic-bar" });
  pieces.forEach((piece) => {
    const { y, height } = segmentY(piece.startEpochMs, piece.endEpochMs, model);
    const style = styleFor(piece.state);
    group.append(svg("rect", {
      x, y, width: BAR_W, height,
      fill: style.fill,
      stroke: "#FFFDF9",
      "stroke-width": 1.5,
    }));
    const planet = planetsByNumber[piece.planet];
    const cy = y + height / 2;
    const label = displayStateName(piece, options);
    if (height >= 48) {
      group.append(text(x + BAR_W / 2, cy - 7, String(piece.planet), "annual-segment-number", style.text));
      if (label) {
        group.append(text(x + BAR_W / 2, cy + 13, label, "annual-segment-position", style.text));
      }
      if (options.showDates && height >= 72) {
        group.append(text(x + BAR_W / 2, cy + 31, `${shortDate(piece.startEpochMs)} – ${inclusiveDate(piece.endEpochMs)}`, "annual-segment-date", "#6C625A"));
      }
    } else if (height >= 26) {
      group.append(text(x + BAR_W / 2, cy + 5, String(piece.planet), "annual-segment-number compact", style.text));
    }
    const title = svg("title");
    title.textContent = `${planet?.nameTh ?? piece.planet} · ${piece.state.displayNameTh} · ${shortDate(piece.startEpochMs)} ถึง ${inclusiveDate(piece.endEpochMs)}${piece.chulasakarat ? ` · จ.ศ. ${piece.chulasakarat}` : ""}`;
    group.append(title);
  });
  root.append(group);
}

function flattenSubPieces(model) {
  return model.subPeriods.flatMap((sub) => sub.pieces.map((piece) => ({
    ...piece,
    mainPlanet: sub.mainPlanet,
    relationship: sub.relationship,
    relationshipPolarity: sub.relationshipPolarity,
  })));
}

function relationColor(polarity) {
  if (polarity === "supportive") return COLORS.supportive;
  if (polarity === "conflicting") return COLORS.conflicting;
  return COLORS.neutral;
}

function drawRelationConnectors(root, model) {
  const group = svg("g", { class: "annual-relation-connectors", "aria-hidden": "true" });
  const sourceX = MAIN_X + BAR_W;
  model.subPeriods.forEach((sub) => {
    const targetY = BAR_TOP + (((sub.overlapStartEpochMs + sub.overlapEndEpochMs) / 2 - model.yearStartEpochMs) / model.yearDurationMs) * BAR_HEIGHT;
    const targetX = SUB_X;
    const midX = (sourceX + targetX) / 2;
    group.append(svg("line", {
      x1: sourceX + 8, y1: targetY, x2: targetX - 8, y2: targetY,
      stroke: COLORS.line, "stroke-width": 1.5, "stroke-dasharray": "5 6",
    }));
    const polarity = sub.relationshipPolarity;
    if (polarity === "mixed") {
      const clipId = `annual-mixed-${sub.mainPlanet}-${sub.subPlanet}`;
      const defs = svg("defs");
      const clip = svg("clipPath", { id: clipId });
      clip.append(svg("rect", { x: midX - 11, y: targetY - 11, width: 11, height: 22 }));
      defs.append(clip);
      group.append(defs);
      group.append(svg("circle", { cx: midX, cy: targetY, r: 11, fill: COLORS.conflicting, stroke: "#FFF", "stroke-width": 2 }));
      group.append(svg("circle", { cx: midX, cy: targetY, r: 11, fill: COLORS.supportive, "clip-path": `url(#${clipId})` }));
    } else {
      group.append(svg("circle", { cx: midX, cy: targetY, r: 10, fill: relationColor(polarity), stroke: "#FFF", "stroke-width": 2 }));
    }
    const title = svg("title");
    title.textContent = sub.relationship.labels.length ? sub.relationship.labels.join(" / ") : "ไม่มีความสัมพันธ์ที่กำหนดในตาราง";
    group.append(title);
  });
  root.append(group);
}

function drawBoundaryEvents(root, model) {
  model.boundaryEvents.forEach((event) => {
    const y = BAR_TOP + event.fraction * BAR_HEIGHT;
    root.append(svg("line", {
      x1: SUB_X - 18, y1: y, x2: MONTH_X + BAR_W + 4, y2: y,
      stroke: COLORS.accent, "stroke-width": 1.4, "stroke-dasharray": "7 6", opacity: .7,
    }));
    root.append(svg("rect", { x: 930, y: y - 13, width: 102, height: 25, rx: 12, fill: "#FFF7F0", stroke: COLORS.accent, "stroke-width": 1 }));
    root.append(text(981, y + 5, `จ.ศ. ${event.csAfter}`, "annual-boundary-label", COLORS.accent));
  });
}

function drawAnutaksa(root, model, planetsByNumber) {
  const group = svg("g", { class: "annual-anutaksa-bar" });
  model.anutaksa.forEach((period) => {
    const { y, height } = segmentY(period.startEpochMs, period.endEpochMs, model);
    period.pieces.forEach((piece) => {
      const pieceSeg = segmentY(piece.startEpochMs, piece.endEpochMs, model);
      const style = styleFor(piece.state);
      const textColor = piece.planet === 8 ? COLORS.badText : style.text;
      group.append(svg("rect", {
        x: ANU_X,
        y: pieceSeg.y,
        width: BAR_W,
        height: pieceSeg.height,
        fill: style.fill,
        stroke: "#FFFDF9",
        "stroke-width": 1.5,
      }));
      if (piece.state?.quality !== "unknown" && pieceSeg.height >= 18) {
        group.append(text(ANU_X + 10, pieceSeg.y + pieceSeg.height / 2 + 4, piece.state.displayNameTh, "annual-anutaksa-position", textColor, "start"));
      }
      const title = svg("title");
      title.textContent = `${planetsByNumber[piece.planet]?.nameTh ?? piece.planet} · ${piece.state.displayNameTh} · ${shortDate(piece.startEpochMs)} ถึง ${inclusiveDate(piece.endEpochMs)}${piece.chulasakarat ? ` · จ.ศ. ${piece.chulasakarat}` : ""}`;
      group.append(title);
    });
    const midStyle = styleFor(period.pieces[Math.floor(period.pieces.length / 2)]?.state ?? period.pieces[0]?.state);
    const numberColor = period.planet === 8 ? COLORS.badText : midStyle.text;
    group.append(text(ANU_X + BAR_W / 2, y + height / 2 + 6, String(period.planet), "annual-anutaksa-number", numberColor));
  });

  const boundaries = [model.yearStartEpochMs, ...model.anutaksa.map((period) => period.endEpochMs)];
  boundaries.forEach((epochMs, index) => {
    const isTop = index === 0;
    const y = isTop ? BAR_TOP : segmentY(model.yearStartEpochMs, epochMs, model).height + BAR_TOP;
    group.append(text(ANU_X + BAR_W + 8, y + (isTop ? 4 : -4), tinyDate(epochMs - (isTop ? 0 : 1)), "annual-anutaksa-date", "#5F5751", "start"));
  });
  root.append(group);
}

function addMonthsToEpoch(epochMs, count) {
  const p = epochToBangkokParts(epochMs);
  const rawMonthIndex = p.month - 1 + count;
  const targetYear = p.year + Math.floor(rawMonthIndex / 12);
  const targetMonth = ((rawMonthIndex % 12) + 12) % 12 + 1;
  const targetDay = Math.min(p.day, daysInMonth(targetYear, targetMonth));
  return datePartsToEpoch(
    { yearBe: gregorianToBuddhist(targetYear), month: targetMonth, day: targetDay },
    { hour: p.hour, minute: p.minute, second: p.second },
    12,
  );
}

function buildMonthSegments(model) {
  const segments = [];
  for (let index = 0; index < 12; index += 1) {
    const startEpochMs = index === 0 ? model.yearStartEpochMs : addMonthsToEpoch(model.yearStartEpochMs, index);
    const rawEndEpochMs = index === 11 ? model.yearEndEpochMs : addMonthsToEpoch(model.yearStartEpochMs, index + 1);
    const endEpochMs = index === 11 ? model.yearEndEpochMs : Math.min(rawEndEpochMs, model.yearEndEpochMs);
    const parts = epochToBangkokParts(startEpochMs);
    segments.push({
      index,
      startEpochMs,
      endEpochMs,
      month: parts.month,
      yearBe: gregorianToBuddhist(parts.year),
      label: `${THAI_SHORT_MONTHS[parts.month - 1]} ${gregorianToBuddhist(parts.year)}`,
    });
  }
  return segments;
}

function drawMonthBar(root, model) {
  const group = svg("g", { class: "annual-month-bar" });
  buildMonthSegments(model).forEach((segment) => {
    const { y, height } = segmentY(segment.startEpochMs, segment.endEpochMs, model);
    group.append(svg("rect", {
      x: MONTH_X,
      y,
      width: BAR_W,
      height,
      fill: COLORS.monthFill,
      stroke: "#FFFDF9",
      "stroke-width": 1.5,
    }));
    if (height >= 42) {
      group.append(multilineText(MONTH_X + BAR_W / 2, y + height / 2 - 6, [THAI_SHORT_MONTHS[segment.month - 1], String(segment.yearBe)], "annual-month-label", COLORS.monthText, "middle", 13));
    } else if (height >= 24) {
      group.append(text(MONTH_X + BAR_W / 2, y + height / 2 + 4, THAI_SHORT_MONTHS[segment.month - 1], "annual-month-label compact", COLORS.monthText));
    }
  });
  root.append(group);
}

function drawHeaders(root) {
  const headers = [
    [MAIN_X + BAR_W / 2, "1 · ดาวเสวยอายุหลัก", "มหาภูติกำเนิด"],
    [SUB_X + BAR_W / 2, "2 · ดาวเสวยแทรก", "มหาภูติประจำปี"],
    [PHUMI_X + BAR_W / 2, "3 · ภูมิทักษา", "ภูมิอายุประจำปี"],
    [ANU_X + BAR_W / 2, "4 · อนุทักษา", "8 ช่วงภายในปี"],
  ];
  headers.forEach(([x, title, subtitle]) => {
    root.append(text(x, 74, title, "annual-column-title", "#302B28"));
    root.append(text(x, 99, subtitle, "annual-column-subtitle", "#7C7168"));
  });
  root.append(text((MAIN_X + BAR_W + SUB_X) / 2, 112, "ความสัมพันธ์", "annual-connector-title", "#8A7E74"));
  root.append(text((SUB_X + BAR_W + PHUMI_X) / 2, 430, "→", "annual-flow-arrow", "#B9ACA1"));
  root.append(text((PHUMI_X + BAR_W + ANU_X) / 2, 430, "→", "annual-flow-arrow", "#B9ACA1"));
}

export function renderAnnualForecast(container, model, planetsByNumber) {
  container.replaceChildren();
  const ageBasisLabel = model.ageBasis === "yang_age" ? "อายุย่าง" : "อายุเต็ม";
  const root = svg("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    class: "annual-forecast-svg",
    role: "img",
    "aria-label": `ผลประจำปี ${ageBasisLabel} ${model.calculationAge} ปี`,
  });
  root.append(svg("rect", { x: 8, y: 8, width: WIDTH - 16, height: HEIGHT - 16, rx: 28, fill: "#FBF7F1", stroke: "#E1D7CD" }));
  drawHeaders(root);
  drawMainBar(root, model, planetsByNumber);
  const subPieces = flattenSubPieces(model);
  drawDynamicBar(root, subPieces, SUB_X, model, planetsByNumber, { className: "annual-sub-bar", showDates: true });
  drawRelationConnectors(root, model);
  drawDynamicBar(root, model.phumi.pieces, PHUMI_X, model, planetsByNumber, { className: "annual-phumi-bar", showDates: true, hideRahuUnknownLabel: true });
  drawAnutaksa(root, model, planetsByNumber);
  drawMonthBar(root, model);
  drawBoundaryEvents(root, model);
  container.append(root);
  return root;
}
