export function getPlanetRelation(relationsData, birthDayType, planetNumber) {
  const dayRelations = relationsData.relations[birthDayType];
  if (!dayRelations) throw new Error(`unknown birthDayType: ${birthDayType}`);
  if (dayRelations.good.includes(planetNumber)) return "good";
  if (dayRelations.bad.includes(planetNumber)) return "bad";
  return null; // ไม่แสดงค่าที่ไม่ได้อยู่ในตารางความสัมพันธ์
}

export function getRelationBadge(relationsData, birthDayType, planetNumber) {
  const status = getPlanetRelation(relationsData, birthDayType, planetNumber);
  if (!status) return null;

  return {
    status,
    labelTh: relationsData.displayRules[status].labelTh,
    symbol: relationsData.displayRules[status].symbol,
  };
}

export function getActiveSegmentRelationBadge(
  relationsData,
  birthDayType,
  segment,
  activeSegment,
) {
  if (!segment || !activeSegment || segment.key !== activeSegment.key) {
    return null;
  }

  const planetNumber =
    segment.type === "main" ? segment.mainNumber : segment.subNumber;

  return getRelationBadge(relationsData, birthDayType, planetNumber);
}

export function decoratePeriodRelations(relationsData, birthDayType, period) {
  return {
    ...period,
    mainRelation: getRelationBadge(
      relationsData,
      birthDayType,
      period.mainPlanet,
    ),
    subRelation: getRelationBadge(
      relationsData,
      birthDayType,
      period.subPlanet,
    ),
  };
}
