const DEG_TO_RAD = Math.PI / 180;

export function polarToCartesian(cx, cy, radius, angle) {
  const radians = angle * DEG_TO_RAD;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

export function describeArcSegment(
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function getMidAngle(startAngle, endAngle) {
  return startAngle + (endAngle - startAngle) / 2;
}

export function getLabelPosition(cx, cy, radius, angle) {
  return polarToCartesian(cx, cy, radius, angle);
}

export function mixWithWhite(hexColor, ratio) {
  const normalized = hexColor.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const mix = (channel) => Math.round(channel + (255 - channel) * ratio);

  return `rgb(${mix(red)}, ${mix(green)}, ${mix(blue)})`;
}
