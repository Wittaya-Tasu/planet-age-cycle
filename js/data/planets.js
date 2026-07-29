export const PLANET_SEQUENCE = Object.freeze([1, 2, 3, 4, 7, 5, 8, 6]);

export const TOTAL_CYCLE_YEARS = 108;

export const PLANETS = Object.freeze({
  1: Object.freeze({
    number: 1,
    name: "พระอาทิตย์",
    shortName: "อาทิตย์",
    years: 6,
    color: "#c92f35",
    labelColor: "#ffffff",
  }),
  2: Object.freeze({
    number: 2,
    name: "พระจันทร์",
    shortName: "จันทร์",
    years: 15,
    color: "#e0ad19",
    labelColor: "#2a211c",
  }),
  3: Object.freeze({
    number: 3,
    name: "พระอังคาร",
    shortName: "อังคาร",
    years: 8,
    color: "#e96e21",
    labelColor: "#2a211c",
  }),
  4: Object.freeze({
    number: 4,
    name: "พระพุธ",
    shortName: "พุธ",
    years: 17,
    color: "#3d8750",
    labelColor: "#ffffff",
  }),
  7: Object.freeze({
    number: 7,
    name: "พระเสาร์",
    shortName: "เสาร์",
    years: 10,
    color: "#7652a0",
    labelColor: "#ffffff",
  }),
  5: Object.freeze({
    number: 5,
    name: "พระพฤหัสฯ",
    shortName: "พฤหัสฯ",
    years: 19,
    color: "#a97716",
    labelColor: "#ffffff",
  }),
  8: Object.freeze({
    number: 8,
    name: "พระราหู",
    shortName: "ราหู",
    years: 12,
    color: "#30333a",
    labelColor: "#ffffff",
  }),
  6: Object.freeze({
    number: 6,
    name: "พระศุกร์",
    shortName: "ศุกร์",
    years: 21,
    color: "#2873b8",
    labelColor: "#ffffff",
  }),
});

export function getPlanet(number) {
  const planet = PLANETS[number];

  if (!planet) {
    throw new Error(`ไม่พบข้อมูลพระเคราะห์เลข ${number}`);
  }

  return planet;
}
