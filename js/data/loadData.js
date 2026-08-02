async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status}`);
  return response.json();
}

export async function loadPlanetAgeData(basePath = "./data") {
  const [
    planetsData,
    subperiodsData,
    predictionsData,
    relationsData,
    appConfig,
    uiText
  ] = await Promise.all([
    loadJson(`${basePath}/planets.json`),
    loadJson(`${basePath}/subperiods.json`),
    loadJson(`${basePath}/predictions.json`),
    loadJson(`${basePath}/day-planet-relations.json`),
    loadJson(`${basePath}/app-config.json`),
    loadJson(`${basePath}/ui-text.th.json`)
  ]);

  return {
    planetsData,
    subperiodsData,
    predictionsData,
    relationsData,
    appConfig,
    uiText
  };
}
