export function normalizeRemainder(value, divisor = 7) {
  const remainder = value % divisor;
  return remainder === 0 ? divisor : remainder;
}

export function calculateMahabhutaMap(chulasakarat, kalayokData) {
  if (!Number.isInteger(chulasakarat)) throw new Error("ต้องมีจุลศักราชจำนวนเต็มก่อนคำนวณกาลโยคมหาภูติ");
  const startPlanet = normalizeRemainder(chulasakarat, 7);
  const positions = kalayokData.positions;
  const byPlanet = {};
  const byPosition = {};

  positions.forEach((position, index) => {
    const planet = ((startPlanet - 1 + index) % 7) + 1;
    const item = { planet, ...position };
    byPlanet[planet] = item;
    byPosition[position.key] = item;
  });

  return { chulasakarat, remainder: startPlanet, byPlanet, byPosition, positions: positions.map((p) => byPosition[p.key]) };
}

export function getKalayokState(map, planetNumber) {
  if (!map || planetNumber === 8) {
    return { quality: "unknown", displayNameTh: "นอกมหาภูติ", key: "not_defined_in_source" };
  }
  const item = map.byPlanet[planetNumber];
  if (!item) return { quality: "unknown", displayNameTh: "ไม่กำหนด", key: "unknown" };
  return item;
}
