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

export async function saveVisualizationImage({ visualizationContainer, mode, profileText, summaryText }) {
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
  const footerHeight = 70;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.ceil(headerHeight + visualHeight + footerHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างรูปภาพ");

  ctx.fillStyle = "#F3EEE5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6F1D1B";
  ctx.font = "700 26px sans-serif";
  ctx.fillText("มหาทศา · โหราศาสตร์ไทย", 70, 56);
  ctx.fillStyle = "#2F2925";
  ctx.font = "800 48px sans-serif";
  ctx.fillText(mode === "wheel" ? "วงกลมดาวเสวยอายุ" : "Timeline ดาวเสวยอายุ", 70, 116);
  ctx.fillStyle = "#6E655F";
  ctx.font = "500 21px sans-serif";
  ctx.fillText(profileText, 70, 154);
  ctx.fillText(summaryText, 70, 181);

  ctx.fillStyle = "#FFFDF9";
  ctx.strokeStyle = "#DED4CB";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(50, headerHeight, 1500, visualHeight, 24);
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(image, 70, headerHeight + 10, visualWidth, visualHeight - 20);

  ctx.fillStyle = "#81766D";
  ctx.font = "500 18px sans-serif";
  ctx.fillText("ข้อมูลตามหลักโหราศาสตร์ ใช้ประกอบการพิจารณา ไม่ใช่ข้อยืนยันเหตุการณ์", 70, canvas.height - 28);

  const blob = await canvasBlob(canvas);
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  download(blob, `maha-thasa-${mode}-${stamp}.png`);
}
