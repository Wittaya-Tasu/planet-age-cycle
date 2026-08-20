async function loadJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ: ${path}`);
  return response.json();
}

export async function loadAppData(base = "./data") {
  const [planets, kalayok, relationships, boundaries] = await Promise.all([
    loadJson(`${base}/planets.json`),
    loadJson(`${base}/kalayok-positions.json`),
    loadJson(`${base}/planet-relationships.json`),
    loadJson(`${base}/annual-boundaries.json`),
  ]);
  return { planets, kalayok, relationships, boundaries };
}
