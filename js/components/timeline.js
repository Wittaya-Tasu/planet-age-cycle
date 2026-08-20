import { getKalayokState } from "../core/mahabhuta.js";
import { getRelationship } from "../core/relationships.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 1260;
const LEFT = 116;
const MAX_BAR = 770;
const AGE_X = 1010;
const REL_X = 885;
const BASE_ROW = 72;
const EXPANDED_EXTRA = 76;
const TOP = 38;

const COLORS = {
  goodFill: "#DCEFE3",
  goodText: "#195D3A",
  badFill: "#F6DDDF",
  badText: "#8E2630",
  unknownFill: "#ECEBE8",
  unknownText: "#2F2C29",
  friend: "#17633E",
  enemy: "#8E2630",
};

function svg(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
}

function text(x, y, value, className, fill = null, anchor = "start") {
  const el = svg("text", { x, y, class: className, "text-anchor": anchor });
  if (fill) el.setAttribute("fill", fill);
  el.textContent = value;
  return el;
}

function styleFor(state) {
  if (state.quality === "good") return { fill: COLORS.goodFill, text: COLORS.goodText };
  if (state.quality === "bad") return { fill: COLORS.badFill, text: COLORS.badText };
  return { fill: COLORS.unknownFill, text: COLORS.unknownText };
}

function relationChip(x, y, relation) {
  if (!relation.otherLabels.length) return null;
  const label = relation.otherLabels.join(" / ");
  const width = Math.min(168, 18 + label.length * 7);
  const group = svg("g", { class: "timeline-relation-chip" });
  group.append(svg("rect", { x, y: y - 15, width, height: 30, rx: 15, fill: "#FFFDF9", stroke: "#D9CEC4" }));
  group.append(text(x + width / 2, y + 5, label, "timeline-relation-text", "#655548", "middle"));
  return group;
}

function formatAgeRange(startAge, endAge) {
  return `${startAge}–${endAge} ปี`;
}

export function renderTimeline(container, context, handlers, expandedPlanet = null) {
  container.replaceChildren();
  const expandedIndex = context.cycle.mainPeriods.findIndex((item) => item.planet === expandedPlanet);
  const height = TOP * 2 + context.cycle.mainPeriods.length * BASE_ROW + (expandedIndex >= 0 ? EXPANDED_EXTRA : 0);
  const root = svg("svg", { viewBox: `0 0 ${WIDTH} ${height}`, class: "maha-timeline", role: "img", "aria-label": "Timeline มหาทศา 8 ช่วง" });
  root.append(svg("rect", { x: 0, y: 0, width: WIDTH, height, rx: 24, fill: "#FBF7F1", stroke: "#E1D7CD" }));

  let y = TOP;
  context.cycle.mainPeriods.forEach((main, index) => {
    const planet = context.planetsByNumber[main.planet];
    const state = getKalayokState(context.kalayokMap, main.planet);
    const style = styleFor(state);
    const relation = getRelationship(context.relationshipsData, context.birthPlanet, main.planet);
    const barWidth = main.years / 21 * MAX_BAR;
    const isBirth = main.planet === context.birthPlanet && index === 0;
    const isCurrent = main.planet === context.current.main.planet;
    const row = svg("g", { class: `timeline-row state-${state.quality}${isCurrent ? " is-current" : ""}`, role: "button", tabindex: 0 });
    row.dataset.planet = main.planet;

    row.append(text(34, y + 37, String(index + 1).padStart(2, "0"), "timeline-order", "#A4988E"));
    row.append(svg("rect", {
      x: LEFT, y: y + 9, width: barWidth, height: 48, rx: 14,
      fill: style.fill, stroke: isCurrent ? "#6F1D1B" : "#FFFFFF", "stroke-width": isCurrent ? 3 : 1.5,
    }));

    const numberX = LEFT + 32;
    if (relation.primaryBadge) {
      row.append(svg("rect", {
        x: numberX - 22, y: y + 14, width: 44, height: 38, rx: 13,
        fill: relation.primaryBadge === "friend" ? COLORS.friend : COLORS.enemy,
      }));
    }
    row.append(text(numberX, y + 42, String(main.planet), isBirth ? "timeline-planet-number is-birth" : "timeline-planet-number", relation.primaryBadge ? "#FFF" : style.text, "middle"));
    if (isBirth) {
      const natureColor = planet.nature === "bapa" ? COLORS.badText : COLORS.goodText;
      row.append(text(numberX + 29, y + 26, "✱", "timeline-birth-star", natureColor, "middle"));
    }
    row.append(text(LEFT + 66, y + 29, state.displayNameTh, "timeline-position", style.text));
    row.append(text(LEFT + 66, y + 47, `${planet.years} ปี`, "timeline-years", "#6C625A"));

    const chip = relationChip(REL_X, y + 33, relation);
    if (chip) row.append(chip);
    row.append(text(AGE_X, y + 29, "ช่วงอายุ", "timeline-age-label", "#8A7E74"));
    row.append(text(AGE_X, y + 49, formatAgeRange(main.startAge, main.endAge), "timeline-age-value", "#302B28"));

    const title = svg("title");
    title.textContent = `${planet.nameTh}เสวย ${main.years} ปี · ${state.displayNameTh}${relation.labels.length ? ` · ${relation.labels.join(" / ")}` : ""}`;
    row.append(title);
    row.addEventListener("click", () => handlers.onMainSelect(main));
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handlers.onMainSelect(main); } });
    root.append(row);

    if (main.planet === expandedPlanet) {
      const subY = y + 62;
      root.append(text(LEFT, subY + 16, "ดาวแทรก", "timeline-sub-caption", "#786D64"));
      let x = LEFT + 72;
      const available = Math.max(320, barWidth - 72);
      main.subperiods.forEach((sub) => {
        const subPlanet = context.planetsByNumber[sub.subPlanet];
        const subState = getKalayokState(context.kalayokMap, sub.subPlanet);
        const subStyle = styleFor(subState);
        const subWidth = available * subPlanet.years / 108;
        const subRelation = getRelationship(context.relationshipsData, context.birthPlanet, sub.subPlanet);
        const group = svg("g", { class: `timeline-sub-segment state-${subState.quality}` });
        group.append(svg("rect", { x, y: subY, width: subWidth, height: 34, rx: 8, fill: subStyle.fill, stroke: "#FFF", "stroke-width": 1 }));
        if (subWidth > 22) group.append(text(x + subWidth / 2, subY + 22, String(sub.subPlanet), "timeline-sub-number", subStyle.text, "middle"));
        if (subRelation.primaryBadge) {
          group.append(svg("circle", { cx: x + subWidth / 2, cy: subY - 1, r: 6.5, fill: subRelation.primaryBadge === "friend" ? COLORS.friend : COLORS.enemy, stroke: "#FFF", "stroke-width": 1.5 }));
        }
        const subTitle = svg("title");
        subTitle.textContent = `${subPlanet.nameTh}แทรก · ${sub.traditionalDurationText} · ${subState.displayNameTh}${subRelation.labels.length ? ` · ${subRelation.labels.join(" / ")}` : ""}`;
        group.append(subTitle);
        root.append(group);
        x += subWidth;
      });
      root.append(text(AGE_X, subY + 22, "คลิกแถวอื่นเพื่อขยายช่วงนั้น", "timeline-expand-hint", "#8A7E74"));
      y += EXPANDED_EXTRA;
    }

    y += BASE_ROW;
  });

  container.append(root);
}
