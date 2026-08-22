import { epochToBangkokParts, gregorianToBuddhist } from "../core/calendar.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 1320;
const HEIGHT = 790;
const BAR_TOP = 150;
const BAR_HEIGHT = 560;
const MAIN_X = 70;
const MAIN_W = 180;
const SUB_X = 410;
const SUB_W = 190;
const PHUMI_X = 760;
const PHUMI_W = 180;
const ANU_X = 1040;
const ANU_W = 220;

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
};

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

function styleFor(state) {
  if (state?.quality === "good") return { fill: COLORS.goodFill, text: COLORS.goodText };
  if (state?.quality === "bad") return { fill: COLORS.badFill, text: COLORS.badText };
  return { fill: COLORS.unknownFill, text: COLORS.unknownText };
}

function shortDate(epochMs) {
  const p = epochToBangkokParts(epochMs);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${p.day} ${months[p.month - 1]} ${gregorianToBuddhist(p.year)}`;
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
  const group = svg("g", { class: "annual-main-bar" });
  group.append(svg("rect", { x: MAIN_X, y: BAR_TOP, width: MAIN_W, height: BAR_HEIGHT, rx: 20, fill: style.fill, stroke: style.text, "stroke-width": 1.5 }));
  group.append(text(MAIN_X + MAIN_W / 2, BAR_TOP + 128, String(model.main.planet), "annual-big-number", style.text));
  group.append(text(MAIN_X + MAIN_W / 2, BAR_TOP + 172, planet.shortNameTh, "annual-planet-name", style.text));
  group.append(text(MAIN_X + MAIN_W / 2, BAR_TOP + 210, state.displayNameTh, "annual-position-name", style.text));
  group.append(text(MAIN_X + MAIN_W / 2, BAR_TOP + 350, "อายุ", "annual-age-label", style.text));
  group.append(text(MAIN_X + MAIN_W / 2, BAR_TOP + 420, String(model.completedAgeYears), "annual-big-number", style.text));
  root.append(group);
}

function drawDynamicBar(root, pieces, x, width, model, planetsByNumber, options = {}) {
  const group = svg("g", { class: options.className ?? "annual-dynamic-bar" });
  pieces.forEach((piece) => {
    const { y, height } = segmentY(piece.startEpochMs, piece.endEpochMs, model);
    const style = styleFor(piece.state);
    group.append(svg("rect", {
      x, y, width, height,
      fill: style.fill,
      stroke: "#FFFDF9",
      "stroke-width": 1.5,
    }));
    const planet = planetsByNumber[piece.planet];
    const cy = y + height / 2;
    if (height >= 48) {
      group.append(text(x + width / 2, cy - 7, String(piece.planet), "annual-segment-number", style.text));
      group.append(text(x + width / 2, cy + 13, piece.state.displayNameTh, "annual-segment-position", style.text));
      if (options.showDates && height >= 72) {
        group.append(text(x + width / 2, cy + 31, `${shortDate(piece.startEpochMs)} – ${inclusiveDate(piece.endEpochMs)}`, "annual-segment-date", "#6C625A"));
      }
    } else if (height >= 26) {
      group.append(text(x + width / 2, cy + 5, String(piece.planet), "annual-segment-number compact", style.text));
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
  const sourceX = MAIN_X + MAIN_W;
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
      x1: SUB_X - 18, y1: y, x2: ANU_X + ANU_W + 4, y2: y,
      stroke: COLORS.accent, "stroke-width": 1.4, "stroke-dasharray": "7 6", opacity: .7,
    }));
    root.append(svg("rect", { x: 930, y: y - 13, width: 102, height: 25, rx: 12, fill: "#FFF7F0", stroke: COLORS.accent, "stroke-width": 1 }));
    root.append(text(981, y + 5, `จ.ศ. ${event.csAfter}`, "annual-boundary-label", COLORS.accent));
  });
}

function tinyDate(epochMs) {
  const p = epochToBangkokParts(epochMs);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${p.day} ${months[p.month - 1]}`;
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
        width: ANU_W,
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
    group.append(text(ANU_X + ANU_W / 2, y + height / 2 + 6, String(period.planet), "annual-anutaksa-number", numberColor));
  });

  const boundaries = [{ epochMs: model.yearStartEpochMs }];
  model.anutaksa.forEach((period) => boundaries.push({ epochMs: period.endEpochMs }));
  boundaries.forEach((entry, index) => {
    const isTop = index === 0;
    const y = isTop ? BAR_TOP : segmentY(model.yearStartEpochMs, entry.epochMs, model).height + BAR_TOP;
    group.append(svg("line", {
      x1: ANU_X + ANU_W - 16,
      y1: y,
      x2: ANU_X + ANU_W + 20,
      y2: y,
      stroke: COLORS.line,
      "stroke-width": 1.2,
      "stroke-dasharray": "3 3",
    }));
    group.append(text(ANU_X + ANU_W + 28, y + (isTop ? 11 : -4), tinyDate(entry.epochMs - (isTop ? 0 : 1)), "annual-anutaksa-date", "#5F5751", "start"));
  });
  root.append(group);
}

function drawHeaders(root) {
  const headers = [
    [MAIN_X + MAIN_W / 2, "1 · ดาวเสวยอายุหลัก", "มหาภูติกำเนิด"],
    [SUB_X + SUB_W / 2, "2 · ดาวเสวยแทรก", "มหาภูติประจำปี"],
    [PHUMI_X + PHUMI_W / 2, "3 · ภูมิทักษา", "ภูมิอายุประจำปี"],
    [ANU_X + ANU_W / 2, "4 · อนุทักษา", "8 ช่วงภายในปี"],
  ];
  headers.forEach(([x, title, subtitle]) => {
    root.append(text(x, 74, title, "annual-column-title", "#302B28"));
    root.append(text(x, 99, subtitle, "annual-column-subtitle", "#7C7168"));
  });
  root.append(text(330, 112, "ความสัมพันธ์", "annual-connector-title", "#8A7E74"));
  root.append(text(680, 430, "→", "annual-flow-arrow", "#B9ACA1"));
  root.append(text(990, 430, "→", "annual-flow-arrow", "#B9ACA1"));
}

export function renderAnnualForecast(container, model, planetsByNumber) {
  container.replaceChildren();
  const root = svg("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    class: "annual-forecast-svg",
    role: "img",
    "aria-label": `ผลประจำปี อายุเต็ม ${model.completedAgeYears} ปี อายุย่าง ${model.ageYang}`,
  });
  root.append(svg("rect", { x: 8, y: 8, width: WIDTH - 16, height: HEIGHT - 16, rx: 28, fill: "#FBF7F1", stroke: "#E1D7CD" }));
  drawHeaders(root);
  drawMainBar(root, model, planetsByNumber);
  const subPieces = flattenSubPieces(model);
  drawDynamicBar(root, subPieces, SUB_X, SUB_W, model, planetsByNumber, { className: "annual-sub-bar", showDates: true });
  drawRelationConnectors(root, model);
  drawDynamicBar(root, model.phumi.pieces, PHUMI_X, PHUMI_W, model, planetsByNumber, { className: "annual-phumi-bar", showDates: true });
  drawAnutaksa(root, model, planetsByNumber);
  drawBoundaryEvents(root, model);
  container.append(root);
  return root;
}
