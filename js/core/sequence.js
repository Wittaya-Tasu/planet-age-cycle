export function rotateSequence(sequence, startPlanet) {
  const index = sequence.indexOf(startPlanet);

  if (index === -1) {
    throw new Error(`ไม่พบเลขพระเคราะห์ ${startPlanet} ในลำดับวงจร`);
  }

  return [...sequence.slice(index), ...sequence.slice(0, index)];
}
