export function getPlanetRelation(relationsData, birthDayType, planetNumber) {
  const dayRelations = relationsData.relations[birthDayType];
  if (!dayRelations) throw new Error(`unknown birthDayType: ${birthDayType}`);
  if (dayRelations.good.includes(planetNumber)) return "good";
  if (dayRelations.bad.includes(planetNumber)) return "bad";
  return null; // Requirement: do not display values absent from the source table.
}

export function getRelationBadge(relationsData, birthDayType, planetNumber) {
  const status = getPlanetRelation(relationsData, birthDayType, planetNumber);
  if (!status) return null;
  return {
    status,
    labelTh: relationsData.displayRules[status].labelTh,
    symbol: relationsData.displayRules[status].symbol
  };
}

export function decoratePeriodRelations(relationsData, birthDayType, period) {
  return {
    ...period,
    mainRelation: getRelationBadge(relationsData, birthDayType, period.mainPlanet),
    subRelation: getRelationBadge(relationsData, birthDayType, period.subPlanet)
  };
}
