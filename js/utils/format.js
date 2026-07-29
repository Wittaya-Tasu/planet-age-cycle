export function formatNumber(value, maximumFractionDigits = 1, minimumFractionDigits = 1) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

export function formatAngle(angle) {
  return `${formatNumber(angle, 4)}°`;
}

export function formatPercentage(value) {
  return `${formatNumber(value, 1, 1)}%`;
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

export function formatThaiDate(parts) {
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return `${parts.day} ${monthNames[parts.month - 1]} ${parts.yearBe}`;
}

export function formatCalendarAge(age) {
  return `${age.years} ปี ${age.months} เดือน ${age.days} วัน`;
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
