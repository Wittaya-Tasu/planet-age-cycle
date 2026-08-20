import { calendarDifferenceDates, formatAge, formatThaiDateShortFromEpoch } from "../core/calendar.js";
import { getKalayokState } from "../core/mahabhuta.js";
import { getRelationship } from "../core/relationships.js";

function stateClass(state) {
  return state.quality === "good" ? "good" : state.quality === "bad" ? "bad" : "unknown";
}

function create(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function renderSubperiodExplorer(container, { mainPeriod, planetsByNumber, birthPlanet, kalayokMap, relationshipsData, birthEpoch, birthTimeKnown }) {
  container.replaceChildren();
  if (!mainPeriod) return;

  const section = create("section", "sub-explorer");
  const header = create("div", "sub-explorer-header");
  const planet = planetsByNumber[mainPeriod.planet];
  header.append(
    create("div", "sub-explorer-title", `${planet.nameTh}เสวยอายุ ${mainPeriod.years} ปี`),
    create("div", "sub-explorer-age", `อายุ ${mainPeriod.startAge}–${mainPeriod.endAge} ปี`),
  );
  section.append(header);

  const bar = create("div", "sub-explorer-bar");
  mainPeriod.subperiods.forEach((sub) => {
    const subPlanet = planetsByNumber[sub.subPlanet];
    const state = getKalayokState(kalayokMap, sub.subPlanet);
    const relation = getRelationship(relationshipsData, birthPlanet, sub.subPlanet);
    const segment = create("button", `sub-explorer-segment state-${stateClass(state)}`);
    segment.type = "button";
    segment.style.flexGrow = String(subPlanet.years);
    segment.style.flexBasis = "0";
    segment.title = `${subPlanet.nameTh}แทรก · ${sub.traditionalDurationText}`;

    const num = create("span", "sub-explorer-number", String(sub.subPlanet));
    if (relation.primaryBadge) {
      num.classList.add("relation-badge", relation.primaryBadge === "friend" ? "relation-friend" : "relation-enemy");
    }
    segment.append(num);
    if (subPlanet.years >= 10) segment.append(create("small", "sub-explorer-duration-mini", sub.traditionalDurationText.replace(" ชั่วโมง", " ชม.")));
    bar.append(segment);
  });
  section.append(bar);

  const details = create("div", "sub-explorer-details");
  mainPeriod.subperiods.forEach((sub) => {
    const subPlanet = planetsByNumber[sub.subPlanet];
    const state = getKalayokState(kalayokMap, sub.subPlanet);
    const relation = getRelationship(relationshipsData, birthPlanet, sub.subPlanet);
    const item = create("article", `sub-detail state-${stateClass(state)}`);
    const ageStart = calendarDifferenceDates(birthEpoch, sub.startEpochMs);
    const ageEnd = calendarDifferenceDates(birthEpoch, sub.endEpochMs);
    item.append(
      create("div", "sub-detail-name", `${sub.subPlanet} · ${subPlanet.shortNameTh}แทรก`),
      create("div", "sub-detail-position", state.displayNameTh),
      create("div", "sub-detail-duration", sub.traditionalDurationText),
      create("div", "sub-detail-age", `อายุ ${formatAge(ageStart)} → ${formatAge(ageEnd)}`),
      create("div", "sub-detail-date", `${formatThaiDateShortFromEpoch(sub.startEpochMs, birthTimeKnown)} → ${formatThaiDateShortFromEpoch(sub.endEpochMs, birthTimeKnown)}`),
    );
    if (relation.labels.length) item.append(create("div", "sub-detail-relation", relation.labels.join(" · ")));
    details.append(item);
  });
  section.append(details);
  container.append(section);
}
