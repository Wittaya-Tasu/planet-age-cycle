export function formatNumber(value, maximumFractionDigits = 4) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatAngle(angle) {
  return `${formatNumber(angle, 4)}°`;
}

export function formatPercentage(value) {
  return `${formatNumber(value, 4)}%`;
}

export function formatDuration(duration) {
  const parts = [];

  if (duration.years) parts.push(`${duration.years} ปี`);
  if (duration.months) parts.push(`${duration.months} เดือน`);
  if (duration.days) parts.push(`${duration.days} วัน`);
  if (duration.minutes) parts.push(`${duration.minutes} นาที`);

  return parts.length ? parts.join(" ") : "0 นาที";
}

export function formatMainDuration(years) {
  return `${years} ปี`;
}

export function getSegmentTitle(segment) {
  if (segment.type === "main") {
    return `${segment.mainPlanet.number} ${segment.mainPlanet.name}`;
  }

  return `${segment.subPlanet.name}แทรก${segment.mainPlanet.name}`;
}

export function getSegmentAriaLabel(segment) {
  if (segment.type === "main") {
    return `${segment.mainPlanet.name} แถบหลัก ระยะเวลา ${formatMainDuration(segment.mainPlanet.years)}`;
  }

  return `${getSegmentTitle(segment)} ระยะเวลา ${formatDuration(segment.duration)}`;
}
