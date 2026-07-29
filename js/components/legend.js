export function renderLegend(container, mainSegments, onSelect) {
  const fragment = document.createDocumentFragment();

  mainSegments.forEach((segment) => {
    const button = document.createElement("button");
    const swatch = document.createElement("span");
    const nameWrap = document.createElement("span");
    const number = document.createElement("span");
    const name = document.createElement("span");
    const years = document.createElement("span");

    button.type = "button";
    button.className = "legend-item";
    button.style.setProperty("--legend-color", segment.mainPlanet.color);
    button.dataset.segmentKey = segment.key;
    button.setAttribute(
      "aria-label",
      `เลือก ${segment.mainPlanet.name} ระยะเวลา ${segment.mainPlanet.years} ปี`,
    );

    swatch.className = "legend-swatch";
    swatch.setAttribute("aria-hidden", "true");
    number.className = "legend-number";
    number.textContent = segment.mainPlanet.number;
    name.className = "legend-name";
    name.textContent = segment.mainPlanet.name;
    nameWrap.append(number, document.createElement("br"), name);
    years.className = "legend-years";
    years.textContent = `${segment.mainPlanet.years} ปี`;

    button.append(swatch, nameWrap, years);
    button.addEventListener("click", () => onSelect(segment));
    fragment.append(button);
  });

  container.replaceChildren(fragment);
}
