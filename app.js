const STORAGE_KEY = "cute-baby-card-data-v1";

const defaultData = {
  title: "",
  nickname: "",
  birthday: "",
  height: "",
  shoeSize: "",
  zodiac: "",
  cycle: "",
  essentialItem: "",
  favoriteMeals: "",
  favoriteDishes: "",
  favoriteFruits: "",
  favoriteDrinks: "",
  dislikedFoods: "",
  dislikedVegetables: "",
  allergies: "",
  fear: "",
  clothingStyle: "",
  likes: "",
  promise: "",
  metDate: "",
  togetherDate: "",
  closing: ""
};

const fieldConfigs = [
  ["birthday", "生日"],
  ["height", "身高"],
  ["shoeSize", "鞋码"],
  ["zodiac", "星座"],
  ["cycle", "经期"],
  ["essentialItem", "常用物品"],
  ["favoriteMeals", "爱吃的零食 / 餐食"],
  ["favoriteDishes", "爱吃的菜"],
  ["favoriteFruits", "爱吃的水果"],
  ["favoriteDrinks", "爱喝的"],
  ["dislikedFoods", "不爱吃的食物"],
  ["dislikedVegetables", "不爱吃的菜"],
  ["allergies", "过敏情况"],
  ["fear", "有点怕什么"],
  ["clothingStyle", "喜欢穿什么"],
  ["likes", "喜欢什么"],
  ["promise", "想对她说 / 承诺"],
  ["metDate", "认识日期"],
  ["togetherDate", "在一起日期"],
  ["closing", "最后想说的话"]
];

const form = document.getElementById("profileForm");
const previewTitle = document.getElementById("previewTitle");
const previewContent = document.getElementById("previewContent");
const statusText = document.getElementById("statusText");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const resetBtn = document.getElementById("resetBtn");
const saveImageBtn = document.getElementById("saveImageBtn");
const exportCanvas = document.getElementById("exportCanvas");
const imageSheet = document.getElementById("imageSheet");
const generatedImage = document.getElementById("generatedImage");
const openImageBtn = document.getElementById("openImageBtn");
const closeImageSheetBtn = document.getElementById("closeImageSheetBtn");

function isMobileLike() {
  return window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches;
}

function isWeChatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function safeParse(encoded) {
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(encoded);
  } catch (error) {
    console.warn("解析本地数据失败:", error);
    return null;
  }
}

function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultData };
    }
    const parsed = safeParse(raw);
    return { ...defaultData, ...parsed };
  } catch (error) {
    console.warn("读取本地数据失败:", error);
    return { ...defaultData };
  }
}

function readFormData() {
  const data = {};
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    data[key] = String(value).trim();
  }

  return data;
}

function saveToLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("本地保存失败:", error);
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

function fillForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function createParagraph(label, value, nickname) {
  const p = document.createElement("p");
  const namePrefix = nickname || "宝宝";
  const strong = document.createElement("strong");
  strong.textContent = `${namePrefix}的${label}：`;
  p.appendChild(strong);
  p.append(document.createTextNode(value));
  return p;
}

function renderCard(data) {
  previewTitle.textContent = data.title || defaultData.title;
  previewContent.innerHTML = "";

  const nickname = data.nickname || defaultData.nickname;
  fieldConfigs.forEach(([key, label]) => {
    if (!data[key]) {
      return;
    }
    previewContent.appendChild(createParagraph(label, data[key], nickname));
  });
}

function syncForm() {
  const data = readFormData();
  renderCard(data);
  saveToLocal(data);
  setStatus("内容已自动保存到当前设备。");
}

function buildBasePageUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function copyShareUrl() {
  const shareUrl = buildBasePageUrl();

  try {
    await navigator.clipboard.writeText(shareUrl);
    setStatus("基础页面链接已复制，发给别人时不会带上你填写的内容。");
  } catch (error) {
    console.warn("复制失败:", error);
    setStatus(`复制失败，请手动复制这个链接：${shareUrl}`);
  }
}

function getWrappedLines(ctx, text, maxWidth) {
  const chars = Array.from(text);
  let line = "";
  const lines = [];

  chars.forEach((char) => {
    const testLine = line + char;
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = getWrappedLines(ctx, text, maxWidth);
  let currentY = y;

  lines.forEach((line) => {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  });

  return currentY;
}

function buildContentBlocks(ctx, data, maxWidth) {
  const nickname = data.nickname || defaultData.nickname;
  const blocks = [];

  fieldConfigs.forEach(([key, label]) => {
    if (!data[key]) {
      return;
    }

    const parts = String(data[key]).split(/\r?\n/).filter(Boolean);
    const values = parts.length > 0 ? parts : [String(data[key])];

    values.forEach((value, index) => {
      const text = index === 0
        ? `${nickname}的${label}：${value}`
        : `续：${value}`;

      blocks.push({
        label,
        lines: getWrappedLines(ctx, text, maxWidth)
      });
    });
  });

  return blocks;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawBow(ctx, centerX, centerY) {
  ctx.save();

  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff4f8";

  ctx.fillStyle = "#ff95bf";
  ctx.beginPath();
  ctx.moveTo(centerX - 4, centerY);
  ctx.quadraticCurveTo(centerX - 28, centerY - 18, centerX - 42, centerY - 4);
  ctx.quadraticCurveTo(centerX - 48, centerY + 10, centerX - 8, centerY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + 4, centerY);
  ctx.quadraticCurveTo(centerX + 28, centerY - 18, centerX + 42, centerY - 4);
  ctx.quadraticCurveTo(centerX + 48, centerY + 10, centerX + 8, centerY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ff5f9b";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#ffdbe8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 3, centerY - 6);
  ctx.lineTo(centerX, centerY + 7);
  ctx.lineTo(centerX + 3, centerY - 6);
  ctx.stroke();

  ctx.restore();
}

function renderCanvas(data) {
  exportCanvas.width = 1080;
  exportCanvas.height = 1680;

  let ctx = exportCanvas.getContext("2d");
  const contentMaxWidth = 840;
  const lineHeight = 52;
  const contentStartY = 340;
  const blockGap = 4;

  ctx.font = "34px 'Microsoft YaHei'";
  const contentBlocks = buildContentBlocks(ctx, data, contentMaxWidth);

  let estimatedContentBottomY = contentStartY;
  contentBlocks.forEach((block) => {
    estimatedContentBottomY += block.lines.length * lineHeight + blockGap;
  });

  const separatorY = estimatedContentBottomY + 28;
  const footerY = separatorY + 60;
  const requiredHeight = Math.max(1680, footerY + 110);
  if (requiredHeight !== exportCanvas.height) {
    exportCanvas.height = requiredHeight;
    ctx = exportCanvas.getContext("2d");
  }

  const width = exportCanvas.width;
  const height = exportCanvas.height;

  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#fff6fb");
  background.addColorStop(1, "#ffe7f1");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.beginPath();
  ctx.arc(140, 140, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(920, 260, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(900, height - 230, 180, 0, Math.PI * 2);
  ctx.fill();

  drawRoundedRect(ctx, 70, 70, width - 140, height - 140, 48);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 192, 219, 0.72)";
  ctx.lineWidth = 4;
  ctx.stroke();

  drawRoundedRect(ctx, 120, 120, 280, 64, 32);
  const pill = ctx.createLinearGradient(120, 120, 400, 184);
  pill.addColorStop(0, "#ffe6f0");
  pill.addColorStop(1, "#fff5d8");
  ctx.fillStyle = pill;
  ctx.fill();

  ctx.fillStyle = "#ff5e9a";
  ctx.font = "bold 30px 'Microsoft YaHei'";
  ctx.fillText("Sweet Notes", 154, 162);

  drawBow(ctx, width - 170, 152);

  ctx.fillStyle = "#5a4057";
  ctx.font = "bold 62px 'Microsoft YaHei'";
  ctx.fillText(data.title || defaultData.title, 120, 270);

  let currentY = contentStartY;

  ctx.fillStyle = "#684e66";
  ctx.font = "34px 'Microsoft YaHei'";
  contentBlocks.forEach((block) => {
    block.lines.forEach((line) => {
      ctx.fillText(line, 120, currentY);
      currentY += lineHeight;
    });
    currentY += blockGap;
  });

  const finalSeparatorY = currentY + 28;
  const finalFooterY = finalSeparatorY + 60;

  ctx.strokeStyle = "rgba(255, 160, 200, 0.7)";
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(120, finalSeparatorY);
  ctx.lineTo(width - 120, finalSeparatorY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#8a6f88";
  ctx.font = "28px 'Microsoft YaHei'";
  ctx.fillText("愿每一条小习惯都被温柔记住", 120, finalFooterY);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

function openImageSheet(dataUrl) {
  generatedImage.src = dataUrl;
  openImageBtn.href = dataUrl;
  imageSheet.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeImageSheet() {
  imageSheet.hidden = true;
  document.body.style.overflow = "";
}

async function saveAsImage() {
  const data = readFormData();
  renderCanvas(data);

  const dataUrl = exportCanvas.toDataURL("image/png");
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], "关于宝宝资料卡.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title: "关于宝宝资料卡",
        text: "这是我做好的资料卡图片。",
        files: [file]
      });
      setStatus("图片已生成，并已打开系统分享。");
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        openImageSheet(dataUrl);
        setStatus("已生成图片，你取消了分享；现在可以长按预览图保存。");
        return;
      }
      console.warn("分享图片失败，改为直接下载:", error);
    }
  }

  if (isMobileLike() || isWeChatBrowser()) {
    openImageSheet(dataUrl);
    setStatus("图片已生成。手机里请长按预览图保存，微信内若受限可点“单独打开图片”。");
    return;
  }

  downloadBlob(blob, "关于宝宝资料卡.png");
  setStatus("图片已保存，浏览器会直接下载这张卡片。若没自动保存，也可再次点击查看预览图。");
}

function resetForm() {
  fillForm(defaultData);
  syncForm();
  setStatus("已清空内容。");
}

function init() {
  const initialData = loadSavedData();
  fillForm(initialData);
  renderCard(initialData);
  setStatus("已准备好开始填写，打开页面默认是空白内容。");

  form.addEventListener("input", syncForm);
  copyLinkBtn.addEventListener("click", copyShareUrl);
  resetBtn.addEventListener("click", resetForm);
  saveImageBtn.addEventListener("click", saveAsImage);
  closeImageSheetBtn.addEventListener("click", closeImageSheet);
  imageSheet.addEventListener("click", (event) => {
    if (event.target === imageSheet || event.target.classList.contains("image-sheet__backdrop")) {
      closeImageSheet();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imageSheet.hidden) {
      closeImageSheet();
    }
  });
}

init();
