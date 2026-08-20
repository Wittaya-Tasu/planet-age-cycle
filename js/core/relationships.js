export function canonicalPair(a, b) {
  return [Number(a), Number(b)].sort((x, y) => x - y).join("-");
}

export function getRelationship(relationshipsData, a, b) {
  if (Number(a) === Number(b)) return { pair: canonicalPair(a, b), tags: [], labels: [], primaryBadge: null, otherTags: [] };
  const pair = canonicalPair(a, b);
  const tags = relationshipsData.pairs[pair] ?? [];
  const labels = tags.map((tag) => relationshipsData.types[tag]?.labelTh ?? tag);
  let primaryBadge = null;
  if (tags.includes("friend")) primaryBadge = "friend";
  else if (tags.includes("enemy")) primaryBadge = "enemy";
  const otherTags = tags.filter((tag) => tag !== "friend" && tag !== "enemy");
  return {
    pair,
    tags,
    labels,
    primaryBadge,
    otherTags,
    otherLabels: otherTags.map((tag) => relationshipsData.types[tag]?.labelTh ?? tag),
  };
}
