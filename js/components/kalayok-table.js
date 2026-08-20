function create(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function renderKalayokTable(container, { chulasakaratResult, kalayokMap, birthPlanet }) {
  container.replaceChildren();
  const card = create("section", "kalayok-card");
  const header = create("div", "kalayok-header");
  const headingWrap = create("div");
  headingWrap.append(
    create("p", "section-kicker", "กาลโยคมหาภูติกำเนิด"),
    create("h2", "kalayok-title", "ตำแหน่งดาว 7 ดวงในปีเกิด"),
  );
  const cs = create("div", "kalayok-cs");
  if (chulasakaratResult.status === "exact") {
    cs.innerHTML = `<span>จ.ศ.กำเนิด</span><strong>${chulasakaratResult.value}</strong>`;
  } else {
    cs.innerHTML = `<span>จ.ศ.กำเนิด</span><strong>${chulasakaratResult.values.join(" / ")}</strong>`;
  }
  header.append(headingWrap, cs);
  card.append(header);

  if (!kalayokMap) {
    const notice = create("div", "kalayok-warning");
    notice.textContent = chulasakaratResult.warnings?.[0] ?? "ยังไม่สามารถระบุกาลโยคกำเนิดได้เพียงค่าเดียว";
    card.append(notice);
    container.append(card);
    return;
  }

  const grid = create("div", "kalayok-grid");
  kalayokMap.positions.forEach((item) => {
    const cell = create("article", `kalayok-cell quality-${item.quality} severity-${item.severity}`);
    const name = create("div", "kalayok-position", item.displayNameTh);
    const numberWrap = create("div", "kalayok-number-wrap");
    const number = create("span", "kalayok-number", String(item.planet));
    if (item.planet === Number(birthPlanet)) number.classList.add("is-birth-planet");
    numberWrap.append(number);
    cell.append(name, numberWrap);
    grid.append(cell);
  });
  card.append(grid);

  if (Number(birthPlanet) === 8) {
    const note = create("p", "kalayok-note", "ดาววันเกิดคือราหู (8) ซึ่งไม่อยู่ในกาลโยคมหาภูติ 7 ดวง จึงไม่มีช่องใดถูกวงกลมล้อม");
    card.append(note);
  }
  container.append(card);
}
