export function canonicalPair(a, b) {
  return [Number(a), Number(b)].sort((x, y) => x - y).join("-");
}

const FALLBACK_SHORT_LABELS = {
  friend: "มิตร",
  enemy: "ศัตรู",
  elemental_pair: "ธาตุ",
  elemental_enemy: "ธาตุ",
  power_pair: "สมพล",
  power_enemy: "สมพล",
};

const FALLBACK_COLORS = {
  friend: "#17633E",
  enemy: "#8E2630",
  elemental_pair: "#315F9E",
  elemental_enemy: "#8E2630",
  power_pair: "#2A91C2",
  power_enemy: "#8E2630",
};

function describeTag(relationshipsData, tag) {
  const type = relationshipsData.types[tag] ?? {};
  return {
    tag,
    labelTh: type.labelTh ?? tag,
    shortLabelTh: type.shortLabelTh ?? FALLBACK_SHORT_LABELS[tag] ?? type.labelTh ?? tag,
    color: type.uiColor ?? FALLBACK_COLORS[tag] ?? "#655548",
    polarity: type.polarity ?? null,
  };
}

function emptyRelationship(a, b) {
  return {
    pair: canonicalPair(a, b),
    tags: [],
    items: [],
    labels: [],
    shortLabels: [],
    primaryBadge: null,
    otherTags: [],
    otherItems: [],
    otherLabels: [],
    otherShortLabels: [],
  };
}

export function getRelationship(relationshipsData, a, b) {
  if (Number(a) === Number(b)) return emptyRelationship(a, b);

  const pair = canonicalPair(a, b);
  const tags = relationshipsData.pairs[pair] ?? [];
  const items = tags.map((tag) => describeTag(relationshipsData, tag));
  let primaryBadge = null;
  if (tags.includes("friend")) primaryBadge = "friend";
  else if (tags.includes("enemy")) primaryBadge = "enemy";

  const otherItems = items.filter((item) => item.tag !== "friend" && item.tag !== "enemy");
  return {
    pair,
    tags,
    items,
    labels: items.map((item) => item.labelTh),
    shortLabels: items.map((item) => item.shortLabelTh),
    primaryBadge,
    otherTags: otherItems.map((item) => item.tag),
    otherItems,
    otherLabels: otherItems.map((item) => item.labelTh),
    otherShortLabels: otherItems.map((item) => item.shortLabelTh),
  };
}
