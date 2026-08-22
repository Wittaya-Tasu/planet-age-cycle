function inlineStyles(source, clone) {
  const srcNodes = [source, ...source.querySelectorAll("*")];
  const dstNodes = [clone, ...clone.querySelectorAll("*")];
  const props = ["fill", "stroke", "stroke-width", "stroke-dasharray", "font-family", "font-size", "font-weight", "text-anchor", "opacity", "paint-order"];
  srcNodes.forEach((node, index) => {
    const target = dstNodes[index];
    if (!target) return;
    const computed = getComputedStyle(node);
    target.setAttribute("style", props.map((p) => `${p}:${computed.getPropertyValue(p)}`).join(";"));
  });
}

async function svgToImage(source) {
  const clone = source.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  inlineStyles(source, clone);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    const promise = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("ไม่สามารถแปลงแผนผังเป็นรูปภาพได้"));
    });
    image.src = url;
    return await promise;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("สร้าง PNG ไม่สำเร็จ")), "image/png"));
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCard(ctx, x, y, width, height, radius = 24) {
  ctx.fillStyle = "#FFFDF9";
  ctx.strokeStyle = "#DED4CB";
  ctx.lineWidth = 1;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
}

function textOf(root, selector) {
  return root.querySelector(selector)?.textContent?.trim() ?? "";
}

function drawSupplementaryExplorer(ctx, container, x, y, width) {
  const section = container?.querySelector?.(".sub-explorer");
  if (!section || container.hidden) return 0;
  const height = 500;
  drawCard(ctx, x, y, width, height, 24);

  const title = textOf(section, ".sub-explorer-title") || "รายละเอียดดาวแทรก";
  const age = textOf(section, ".sub-explorer-age");
  ctx.fillStyle = "#6F1D1B";
  ctx.font = '800 25px "Sarabun", sans-serif';
  ctx.fillText(title, x + 28, y + 42);
  ctx.fillStyle = "#756B64";
  ctx.font = '700 19px "Sarabun", sans-serif';
  ctx.textAlign = "right";
  ctx.fillText(age, x + width - 28, y + 42);
  ctx.textAlign = "left";

  const segments = [...section.querySelectorAll(".sub-explorer-segment")];
  if (segments.length) {
    const barX = x + 28;
    const barY = y + 66;
    const barWidth = width - 56;
    const barHeight = 58;
    const weights = segments.map((segment) => Math.max(1, Number(segment.style.flexGrow) || 1));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let cursor = barX;
    segments.forEach((segment, index) => {
      const segmentWidth = index === segments.length - 1 ? barX + barWidth - cursor : barWidth * weights[index] / total;
      const computed = getComputedStyle(segment);
      ctx.fillStyle = computed.backgroundColor || "#ECEBE8";
      ctx.fillRect(cursor, barY, segmentWidth, barHeight);
      ctx.strokeStyle = "#FFFFFF";
      ctx.strokeRect(cursor, barY, segmentWidth, barHeight);
      const number = textOf(segment, ".sub-explorer-number");
      ctx.fillStyle = computed.color || "#2F2C29";
      ctx.font = '900 20px "Sarabun", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(number, cursor + segmentWidth / 2, barY + 34);
      cursor += segmentWidth;
    });
    ctx.textAlign = "left";
  }

  const details = [...section.querySelectorAll(".sub-detail")].slice(0, 8);
  const gridX = x + 28;
  const gridY = y + 146;
  const gap = 10;
  const cols = 4;
  const cardWidth = (width - 56 - gap * (cols - 1)) / cols;
  const cardHeight = 154;

  details.forEach((detail, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const dx = gridX + col * (cardWidth + gap);
    const dy = gridY + row * (cardHeight + gap);
    const computed = getComputedStyle(detail);
    ctx.fillStyle = computed.backgroundColor || "#FBF7F1";
    ctx.strokeStyle = "rgba(94, 76, 64, 0.13)";
    roundedRect(ctx, dx, dy, cardWidth, cardHeight, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = computed.color || "#2F2C29";
    ctx.font = '800 19px "Sarabun", sans-serif';
    ctx.fillText(fitText(ctx, textOf(detail, ".sub-detail-name"), cardWidth - 24), dx + 12, dy + 27);
    ctx.font = '800 15px "Sarabun", sans-serif';
    ctx.fillText(fitText(ctx, textOf(detail, ".sub-detail-position"), cardWidth - 24), dx + 12, dy + 50);
    ctx.fillStyle = "#6F655E";
    ctx.font = '600 14px "Sarabun", sans-serif';
    ctx.fillText(fitText(ctx, textOf(detail, ".sub-detail-duration"), cardWidth - 24), dx + 12, dy + 73);
    ctx.fillText(fitText(ctx, textOf(detail, ".sub-detail-age"), cardWidth - 24), dx + 12, dy + 96);
    ctx.fillText(fitText(ctx, textOf(detail, ".sub-detail-date"), cardWidth - 24), dx + 12, dy + 119);
    const relation = textOf(detail, ".sub-detail-relation");
    if (relation) {
      ctx.fillStyle = "#6F1D1B";
      ctx.font = '800 14px "Sarabun", sans-serif';
      ctx.fillText(fitText(ctx, relation, cardWidth - 24), dx + 12, dy + 142);
    }
  });
  return height;
}

function titleForMode(mode) {
  if (mode === "wheel") return "วงกลมดาวเสวยอายุ";
  if (mode === "timeline") return "Timeline ดาวเสวยอายุ";
  if (mode === "annual") return "ผลประจำปี · ภูมิทักษาและอนุทักษา";
  return "มหาทศา";
}

export async function saveVisualizationImage({ visualizationContainer, supplementaryContainer = null, mode, profileText, summaryText }) {
  const source = visualizationContainer.querySelector("svg");
  if (!source) throw new Error("ยังไม่มีแผนผังสำหรับบันทึกภาพ");
  if (document.fonts?.ready) await document.fonts.ready;
  const image = await svgToImage(source);
  const viewBox = source.viewBox.baseVal;
  const ratio = viewBox.height / viewBox.width;
  const width = 1600;
  const visualWidth = 1460;
  const visualHeight = visualWidth * ratio;
  const headerHeight = 190;
  const supplementHeight = mode === "wheel" && supplementaryContainer?.querySelector?.(".sub-explorer") ? 500 : 0;
  const supplementGap = supplementHeight ? 24 : 0;
  const footerHeight = 70;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.ceil(headerHeight + visualHeight + supplementGap + supplementHeight + footerHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างรูปภาพ");

  ctx.fillStyle = "#F3EEE5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6F1D1B";
  ctx.font = '700 26px "Sarabun", sans-serif';
  ctx.fillText("มหาทศา · โหราศาสตร์ไทย", 70, 56);
  ctx.fillStyle = "#2F2925";
  ctx.font = '800 48px "Sarabun", sans-serif';
  ctx.fillText(titleForMode(mode), 70, 116);
  ctx.fillStyle = "#6E655F";
  ctx.font = '500 21px "Sarabun", sans-serif';
  ctx.fillText(profileText, 70, 154);
  ctx.fillText(summaryText, 70, 181);

  drawCard(ctx, 50, headerHeight, 1500, visualHeight, 24);
  ctx.drawImage(image, 70, headerHeight + 10, visualWidth, visualHeight - 20);
  if (supplementHeight) drawSupplementaryExplorer(ctx, supplementaryContainer, 50, headerHeight + visualHeight + supplementGap, 1500);

  ctx.fillStyle = "#81766D";
  ctx.font = '500 18px "Sarabun", sans-serif';
  ctx.fillText("ข้อมูลตามหลักโหราศาสตร์ ใช้ประกอบการพิจารณา ไม่ใช่ข้อยืนยันเหตุการณ์", 70, canvas.height - 28);

  const blob = await canvasBlob(canvas);
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  download(blob, `maha-thasa-${mode}-${stamp}.png`);
}
