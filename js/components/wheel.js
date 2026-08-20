import { getKalayokState } from "../core/mahabhuta.js";
import { getRelationship } from "../core/relationships.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SIZE = 900;
const C = SIZE / 2;
const R = {
  center: 148,
  mainInner: 205,
  mainOuter: 306,
  subInner: 312,
  subOuter: 395,
  arrow: 407,
};

const COLORS = {
  goodFill: "#DCEFE3",
  goodText: "#195D3A",
  badFill: "#F6DDDF",
  badText: "#8E2630",
  unknownFill: "#ECEBE8",
  unknownText: "#2F2C29",
  friend: "#17633E",
  enemy: "#8E2630",
  relationLine: "#8A7566",
};

function svg(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
}

function polar(radius, angleDeg) {
  const angle = (angleDeg - 90) * Math.PI / 180;
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
}

function arcPath(inner, outer, start, end) {
  const p1 = polar(outer, start);
  const p2 = polar(outer, end);
  const p3 = polar(inner, end);
  const p4 = polar(inner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

function stateStyle(state) {
  if (state.quality === "good") return { fill: COLORS.goodFill, text: COLORS.goodText };
  if (state.quality === "bad") return { fill: COLORS.badFill, text: COLORS.badText };
  return { fill: COLORS.unknownFill, text: COLORS.unknownText };
}

function createText(x, y, text, className, fill = null) {
  const el = svg("text", { x, y, class: className, "text-anchor": "middle" });
  if (fill) el.setAttribute("fill", fill);
  el.textContent = text;
  return el;
}

function createRelationPill(x, y, relation) {
  if (!relation.primaryBadge) return null;
  const group = svg("g", { class: `wheel-primary-relation ${relation.primaryBadge}` });
  const fill = relation.primaryBadge === "friend" ? COLORS.friend : COLORS.enemy;
  group.append(svg("rect", { x: x - 20, y: y - 22, width: 40, height: 40, rx: 14, fill }));
  return group;
}

function createDashedRelations(model, context) {
  const group = svg("g", { class: "wheel-relation-lines", "aria-hidden": "true" });
  model.mainSegments.forEach((segment) => {
    const relation = getRelationship(context.relationshipsData, context.birthPlanet, segment.planet);
    if (!relation.otherLabels.length) return;
    const mid = (segment.startAngle + segment.endAngle) / 2;
    const start = polar(R.center + 5, mid);
    const end = polar(R.mainInner - 4, mid);
    const label = polar(177, mid);
    group.append(svg("line", {
      x1: start.x, y1: start.y, x2: end.x, y2: end.y,
      stroke: COLORS.relationLine, "stroke-width": 1.5, "stroke-dasharray": "5 5",
    }));
    const textValue = relation.otherLabels.join(" / ");
    const width = Math.min(120, 14 + textValue.length * 7);
    group.append(svg("rect", {
      x: label.x - width / 2, y: label.y - 11, width, height: 21, rx: 10,
      fill: "#FFFDF9", stroke: "#D9CEC4", "stroke-width": 1,
    }));
    group.append(createText(label.x, label.y + 4, textValue, "wheel-relation-label", "#655548"));
  });
  return group;
}

function createCenter(context) {
  const group = svg("g", { class: "wheel-center" });
  const state = getKalayokState(context.kalayokMap, context.birthPlanet);
  const style = stateStyle(state);
  const planet = context.planetsByNumber[context.birthPlanet];
  const natureColor = planet.nature === "bapa" ? COLORS.badText : COLORS.goodText;
  group.append(svg("circle", { cx: C, cy: C, r: R.center, fill: "#FFFCF7", stroke: "#D8CCC1", "stroke-width": 1.5 }));
  group.append(svg("circle", { cx: C, cy: C - 6, r: 60, fill: "none", stroke: style.text, "stroke-width": 1.2, opacity: 0.55 }));
  group.append(createText(C, C - 58, "ดาววันเกิด", "center-eyebrow", "#75695F"));
  group.append(createText(C, C + 12, String(context.birthPlanet), "center-birth-number", style.text));
  group.append(createText(C + 54, C - 28, "✱", "center-nature-star", natureColor));
  group.append(createText(C, C + 50, planet.nature === "bapa" ? "บาปเคราะห์" : "ศุภเคราะห์", "center-nature-label", natureColor));
  group.append(createText(C, C + 84, `อายุ ${context.age.years} ปี ${context.age.months} เดือน ${context.age.days} วัน`, "center-age", "#4D4540"));
  return group;
}

function buildAngles(cycle, planetsByNumber) {
  let angle = 0;
  return cycle.mainPeriods.map((main) => {
    const span = main.years / 108 * 360;
    const start = angle;
    const end = angle + span;
    angle = end;
    let subAngle = start;
    const subSegments = main.subperiods.map((sub) => {
      const subPlanet = planetsByNumber[sub.subPlanet];
      const subSpan = span * subPlanet.years / 108;
      const item = { ...sub, startAngle: subAngle, endAngle: subAngle + subSpan };
      subAngle += subSpan;
      return item;
    });
    return { ...main, startAngle: start, endAngle: end, subSegments };
  });
}

export function renderWheel(container, context, handlers) {
  container.replaceChildren();
  const model = { mainSegments: buildAngles(context.cycle, context.planetsByNumber) };
  const root = svg("svg", { viewBox: `0 0 ${SIZE} ${SIZE}`, class: "maha-wheel", role: "img", "aria-label": "วงกลมมหาทศา 108 ปี" });
  root.append(svg("circle", { cx: C, cy: C, r: R.subOuter + 7, fill: "#FBF7F1", stroke: "#E1D7CD" }));

  const mainGroup = svg("g", { class: "main-ring" });
  const subGroup = svg("g", { class: "sub-ring" });

  model.mainSegments.forEach((segment) => {
    const state = getKalayokState(context.kalayokMap, segment.planet);
    const style = stateStyle(state);
    const isCurrent = segment.planet === context.current.main.planet;
    const group = svg("g", { class: `wheel-main-segment state-${state.quality}${isCurrent ? " is-current" : ""}`, tabindex: 0, role: "button" });
    group.dataset.planet = segment.planet;
    group.append(svg("path", {
      d: arcPath(R.mainInner, R.mainOuter, segment.startAngle, segment.endAngle),
      fill: style.fill,
      stroke: isCurrent ? "#6F1D1B" : "#FFFCF7",
      "stroke-width": isCurrent ? 4 : 2,
    }));
    const mid = (segment.startAngle + segment.endAngle) / 2;
    const pos = polar(256, mid);
    const relation = getRelationship(context.relationshipsData, context.birthPlanet, segment.planet);
    const pill = createRelationPill(pos.x, pos.y - 2, relation);
    if (pill) group.append(pill);
    group.append(createText(pos.x, pos.y + 8, String(segment.planet), "wheel-main-number", relation.primaryBadge ? "#FFFFFF" : style.text));
    group.append(createText(pos.x, pos.y + 30, state.displayNameTh, "wheel-position-name", style.text));
    group.addEventListener("click", () => handlers.onMainSelect(segment));
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handlers.onMainSelect(segment); } });
    mainGroup.append(group);

    segment.subSegments.forEach((sub) => {
      const subState = getKalayokState(context.kalayokMap, sub.subPlanet);
      const subStyle = stateStyle(subState);
      const subCurrent = sub.mainPlanet === context.current.main.planet && sub.subPlanet === context.current.sub.subPlanet;
      const subEl = svg("g", { class: `wheel-sub-segment state-${subState.quality}${subCurrent ? " is-current" : ""}` });
      subEl.append(svg("path", {
        d: arcPath(R.subInner, R.subOuter, sub.startAngle, sub.endAngle),
        fill: subStyle.fill,
        stroke: subCurrent ? "#6F1D1B" : "#FFFCF7",
        "stroke-width": subCurrent ? 3 : 1.5,
      }));
      const subMid = (sub.startAngle + sub.endAngle) / 2;
      const subPos = polar(352, subMid);
      subEl.append(createText(subPos.x, subPos.y + 5, String(sub.subPlanet), "wheel-sub-number", subStyle.text));
      const subRelation = getRelationship(context.relationshipsData, context.birthPlanet, sub.subPlanet);
      if (subRelation.primaryBadge) {
        const badgePos = polar(R.subOuter + 4, subMid);
        subEl.append(svg("circle", {
          cx: badgePos.x, cy: badgePos.y, r: 8,
          fill: subRelation.primaryBadge === "friend" ? COLORS.friend : COLORS.enemy,
          stroke: "#FFF", "stroke-width": 2,
        }));
      }
      const title = svg("title");
      title.textContent = `${context.planetsByNumber[sub.subPlanet].nameTh}แทรก · ${subState.displayNameTh} · ${sub.traditionalDurationText}${subRelation.labels.length ? ` · ${subRelation.labels.join(" / ")}` : ""}`;
      subEl.append(title);
      subGroup.append(subEl);
    });
  });

  root.append(mainGroup, subGroup, createDashedRelations(model, context), createCenter(context));

  const currentMain = model.mainSegments.find((item) => item.planet === context.current.main.planet);
  const currentSub = currentMain?.subSegments.find((item) => item.subPlanet === context.current.sub.subPlanet);
  if (currentSub) {
    const progress = Math.max(0, Math.min(1, (context.targetEpochMs - context.current.sub.startEpochMs) / (context.current.sub.endEpochMs - context.current.sub.startEpochMs)));
    const angle = currentSub.startAngle + (currentSub.endAngle - currentSub.startAngle) * progress;
    const p = polar(R.arrow, angle);
    const marker = svg("g", { class: "current-arrow", transform: `translate(${p.x} ${p.y}) rotate(${angle})` });
    marker.append(svg("path", { d: "M -8 8 L 0 -10 L 8 8 Z", fill: "#6F1D1B", stroke: "#FFF", "stroke-width": 2 }));
    root.append(marker);
  }

  container.append(root);
  return model;
}
