const EXPORT_WIDTH = 1600;
const EXPORT_WHEEL_HEIGHT = 1180;
const EXPORT_TIMELINE_HEIGHT = 2070;
const BACKGROUND = "#f3eee5";
const SURFACE = "#fffdf9";
const INK = "#29221e";
const MUTED = "#746b65";
const ACCENT = "#6f1d1b";
const LINE = "rgba(70, 47, 33, 0.14)";

const SVG_STYLE_PROPERTIES = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "paint-order",
  "filter",
  "display",
  "visibility",
];

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawCard(context, x, y, width, height) {
  context.save();
  context.shadowColor = "rgba(64, 40, 23, 0.10)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 12;
  context.fillStyle = SURFACE;
  roundedRect(context, x, y, width, height, 28);
  context.fill();
  context.restore();
  context.strokeStyle = LINE;
  context.lineWidth = 1;
  roundedRect(context, x, y, width, height, 28);
  context.stroke();
}

function segmentText(text) {
  if (!text) return [];

  if (typeof Intl?.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("th", { granularity: "word" });
    return [...segmenter.segment(text)].map((item) => item.segment);
  }

  return text.split(/(\s+)/).filter(Boolean);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const chunks = segmentText(text);
  const lines = [];
  let line = "";

  chunks.forEach((chunk) => {
    const candidate = `${line}${chunk}`;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line.trim());
      line = chunk.trimStart();
    } else {
      line = candidate;
    }
  });

  if (line.trim()) lines.push(line.trim());
  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines && visibleLines.length) {
    let last = visibleLines.at(-1);
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visibleLines[visibleLines.length - 1] = `${last}…`;
  }

  visibleLines.forEach((value, index) => {
    context.fillText(value, x, y + index * lineHeight);
  });

  return y + visibleLines.length * lineHeight;
}

function inlineSvgStyles(sourceSvg, clonedSvg) {
  const sourceNodes = [sourceSvg, ...sourceSvg.querySelectorAll("*")];
  const clonedNodes = [clonedSvg, ...clonedSvg.querySelectorAll("*")];

  sourceNodes.forEach((sourceNode, index) => {
    const targetNode = clonedNodes[index];
    if (!targetNode) return;
    const style = window.getComputedStyle(sourceNode);
    const declarations = SVG_STYLE_PROPERTIES.map(
      (property) => `${property}:${style.getPropertyValue(property)}`,
    );
    targetNode.setAttribute("style", declarations.join(";"));
  });
}

async function svgToImage(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", svg.viewBox.baseVal.width || 800);
  clone.setAttribute("height", svg.viewBox.baseVal.height || 800);
  inlineSvgStyles(svg, clone);

  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("ไม่สามารถแปลงผังเป็นรูปภาพได้"));
    });
    image.src = url;
    return await loaded;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function extractRows(container, rowSelector, termSelector, valueSelector) {
  return [...container.querySelectorAll(rowSelector)].map((row) => ({
    label: row.querySelector(termSelector)?.textContent?.trim() ?? "",
    value: row.querySelector(valueSelector)?.textContent?.trim() ?? "",
  }));
}

function drawRows(context, rows, x, y, width, limit = rows.length) {
  let cursorY = y;

  rows.slice(0, limit).forEach(({ label, value }) => {
    context.fillStyle = MUTED;
    context.font = '600 23px "Sarabun", sans-serif';
    context.fillText(label, x, cursorY);

    context.fillStyle = INK;
    context.font = '700 23px "Sarabun", sans-serif';
    cursorY = drawWrappedText(context, value, x + 190, cursorY, width - 190, 31, 2);
    cursorY += 13;
  });

  return cursorY;
}

function drawBadges(context, badges, x, y) {
  let cursorX = x;

  badges.forEach((badge) => {
    const isBad = badge.classList.contains("relation-bad") || badge.classList.contains("effect-bad");
    const isMixed = badge.classList.contains("effect-mixed");
    const fill = isBad
      ? "rgba(165, 29, 39, 0.14)"
      : isMixed
        ? "rgba(224, 173, 25, 0.22)"
        : "rgba(46, 111, 78, 0.15)";
    const ink = isBad ? "#8d1f28" : isMixed ? "#6b4d0b" : "#1f603f";
    const text = badge.textContent.trim();
    context.font = '800 21px "Sarabun", sans-serif';
    const width = context.measureText(text).width + 34;

    context.fillStyle = fill;
    roundedRect(context, cursorX, y - 23, width, 38, 19);
    context.fill();
    context.fillStyle = ink;
    context.fillText(text, cursorX + 17, y + 3);
    cursorX += width + 10;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("ไม่สามารถสร้างไฟล์ PNG ได้"));
    }, "image/png");
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function buildFilename(now = new Date(), visualizationMode = "wheel") {
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ];
  return `planet-age-cycle-${visualizationMode}-${parts.join("")}.png`;
}

function drawHeader(context, profileBirthText, profileTargetText, visualizationMode) {
  context.fillStyle = ACCENT;
  context.font = '800 27px "Sarabun", sans-serif';
  context.fillText("โหราศาสตร์ไทย · วงจรตามสัดส่วนเวลา", 64, 60);
  context.fillStyle = INK;
  context.font = '800 54px "Sarabun", sans-serif';
  context.fillText("พระเคราะห์เสวยอายุ", 64, 122);
  context.fillStyle = MUTED;
  context.font = '600 25px "Sarabun", sans-serif';
  context.fillText(profileBirthText, 64, 169);
  context.fillText(profileTargetText, 64, 207);

  const chipText = visualizationMode === "timeline" ? "มุมมอง: Timeline แนวนอน" : "มุมมอง: วงล้อ";
  context.font = '800 21px "Sarabun", sans-serif';
  const chipWidth = context.measureText(chipText).width + 40;
  context.fillStyle = "rgba(111, 29, 27, 0.10)";
  roundedRect(context, EXPORT_WIDTH - chipWidth - 48, 42, chipWidth, 42, 21);
  context.fill();
  context.fillStyle = ACCENT;
  context.fillText(chipText, EXPORT_WIDTH - chipWidth - 28, 70);
}

function drawWheelLayout(context, visualImage, journeySummary, detailPanel) {
  drawCard(context, 42, 238, 870, 870);
  context.drawImage(visualImage, 72, 268, 810, 810);

  const cardX = 946;
  const cardWidth = 612;
  const journeyRows = extractRows(
    journeySummary,
    ".journey-summary-row",
    "span",
    "strong",
  );
  const journeyTitle = journeySummary.querySelector("h2")?.textContent?.trim() ?? "ช่วงชีวิตปัจจุบัน";

  drawCard(context, cardX, 238, cardWidth, 392);
  context.fillStyle = ACCENT;
  context.font = '800 22px "Sarabun", sans-serif';
  context.fillText("ช่วงชีวิตปัจจุบัน", cardX + 32, 282);
  context.fillStyle = INK;
  context.font = '800 33px "Sarabun", sans-serif';
  let cursorY = drawWrappedText(
    context,
    journeyTitle,
    cardX + 32,
    328,
    cardWidth - 64,
    42,
    2,
  );
  cursorY += 16;
  drawRows(context, journeyRows, cardX + 32, cursorY, cardWidth - 64, 5);

  drawDetailCard(context, detailPanel, cardX, 658, cardWidth, 450, 4);
}

function drawDetailCard(context, detailPanel, x, y, width, height, rowLimit = 4) {
  drawCard(context, x, y, width, height);
  const detailEyebrow = detailPanel.querySelector(".detail-eyebrow")?.textContent?.trim() ?? "รายละเอียด";
  const detailTitle = detailPanel.querySelector("h2")?.textContent?.trim() ?? "รายละเอียดช่วง";
  const detailRows = extractRows(detailPanel, ".detail-row", "dt", "dd");
  const badges = [...detailPanel.querySelectorAll(".prediction-badge")];

  context.fillStyle = ACCENT;
  context.font = '800 22px "Sarabun", sans-serif';
  context.fillText(detailEyebrow, x + 32, y + 46);
  context.fillStyle = INK;
  context.font = '800 31px "Sarabun", sans-serif';
  let cursorY = drawWrappedText(
    context,
    detailTitle,
    x + 32,
    y + 90,
    width - 64,
    39,
    2,
  );
  cursorY += 12;
  cursorY = drawRows(context, detailRows, x + 32, cursorY, width - 64, rowLimit);

  if (badges.length) {
    drawBadges(context, badges, x + 32, cursorY + 8);
  }
}

function drawImageContain(context, image, x, y, width, height) {
  const sourceWidth = image.naturalWidth || image.width || width;
  const sourceHeight = image.naturalHeight || image.height || height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawTimelineLayout(context, visualImage, journeySummary, detailPanel) {
  drawCard(context, 42, 238, 1516, 1080);
  drawImageContain(context, visualImage, 68, 264, 1464, 1028);

  const journeyRows = extractRows(
    journeySummary,
    ".journey-summary-row",
    "span",
    "strong",
  );
  const journeyTitle =
    journeySummary.querySelector("h2")?.textContent?.trim() ??
    "ช่วงชีวิตปัจจุบัน";

  drawCard(context, 42, 1350, 742, 640);
  context.fillStyle = ACCENT;
  context.font = '800 22px "Sarabun", sans-serif';
  context.fillText("ช่วงชีวิตปัจจุบัน", 74, 1394);
  context.fillStyle = INK;
  context.font = '800 31px "Sarabun", sans-serif';
  let cursorY = drawWrappedText(
    context,
    journeyTitle,
    74,
    1438,
    678,
    39,
    2,
  );
  cursorY += 12;
  drawRows(context, journeyRows, 74, cursorY, 678, 6);

  drawDetailCard(context, detailPanel, 816, 1350, 742, 640, 6);
}

export async function saveDashboardImage({
  visualizationContainer,
  visualizationMode,
  journeySummary,
  detailPanel,
  profileBirthText,
  profileTargetText,
}) {
  const svg = visualizationContainer.querySelector("svg");
  if (!svg) throw new Error("ยังไม่มีผังสำหรับบันทึกภาพ");

  if (document.fonts?.ready) await document.fonts.ready;
  const visualImage = await svgToImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height =
    visualizationMode === "timeline"
      ? EXPORT_TIMELINE_HEIGHT
      : EXPORT_WHEEL_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างรูปภาพ");

  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  drawHeader(context, profileBirthText, profileTargetText, visualizationMode);

  if (visualizationMode === "timeline") {
    drawTimelineLayout(context, visualImage, journeySummary, detailPanel);
  } else {
    drawWheelLayout(context, visualImage, journeySummary, detailPanel);
  }

  context.fillStyle = MUTED;
  context.font = '500 18px "Sarabun", sans-serif';
  context.fillText(
    "ข้อมูลตามหลักโหราศาสตร์ ใช้ประกอบการพิจารณา ไม่ใช่ข้อยืนยันเหตุการณ์",
    64,
    canvas.height - 30,
  );

  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, buildFilename(new Date(), visualizationMode));
}
