// Builds the Anatomn hackathon deck: 9 frames, 1920×1080, click-through.
const W = 1920;
const H = 1080;

const C = {
  ink: "#141816",
  bone: "#f3ecdf",
  bone2: "#e7dfd0",
  blood: "#9d2c2c",
  mute: "#8a8175",
  mute2: "#a3988a",
  line: "#d9d0c3",
  srcInk: "#6f675e",
  metaOnInk: "#b7ad9f",
  metaOnBlood: "#f3d0cc",
  cardLine: "#cfc6b8",
};

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return {r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255};
}
function paint(hex) {
  return [{type: "SOLID", color: rgb(hex)}];
}

let FAMILY = "Inter";
let SEMI = "Semi Bold";
function face(weight) {
  if (weight >= 600) return SEMI;
  if (weight >= 500) return "Medium";
  return "Regular";
}

function text(parent, value, o) {
  const node = figma.createText();
  parent.appendChild(node);
  node.fontName = {family: FAMILY, style: face(o.w || 400)};
  node.fontSize = o.size;
  if (o.ls != null) node.letterSpacing = {unit: "PIXELS", value: o.ls};
  if (o.lh != null) node.lineHeight = {unit: "PIXELS", value: o.lh};
  node.fills = paint(o.color);
  node.characters = value;
  node.textAutoResize = "WIDTH_AND_HEIGHT";
  node.x = o.x;
  node.y = o.y;
  return node;
}

function rect(parent, x, y, w, h, color, stroke) {
  const node = figma.createRectangle();
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  node.resize(w, h);
  node.fills = paint(color);
  if (stroke) {
    node.strokes = paint(stroke);
    node.strokeWeight = 1;
  } else {
    node.strokes = [];
  }
  return node;
}

function frame(name, bg) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(W, H);
  node.x = 0;
  node.y = 0;
  node.fills = paint(bg);
  node.clipsContent = true;
  return node;
}

function kicker(parent, label, onInk) {
  text(parent, label.toUpperCase(), {
    x: 96, y: 72, size: 18, w: 600, ls: 5, color: onInk ? C.mute2 : C.mute,
  });
}
function index(parent, n, onInk) {
  const node = text(parent, n, {
    x: 0, y: 72, size: 18, w: 500, ls: 3.2, color: onInk ? C.mute2 : C.mute,
  });
  node.x = W - 96 - node.width;
}
function source(parent, value, onInk) {
  const node = text(parent, value, {
    x: 96, y: 1004, size: 16, w: 400, color: onInk ? C.srcInk : C.mute,
  });
  node.textAutoResize = "HEIGHT";
  node.resize(W - 192, node.height);
  return node;
}

function slide1() {
  const f = frame("01  Нэг вэб", C.ink);
  rect(f, 0, 0, 14, H, C.blood);
  text(f, "ANATOMN", {x: 96, y: 72, size: 20, w: 600, ls: 8.4, color: C.mute2});
  index(f, "01", true);
  text(f, "Нэг вэб.\nЗузаан номгүй.", {
    x: 96, y: 300, size: 128, w: 600, ls: -5.8, lh: 123, color: C.bone,
  });
  text(f, "АШУҮИС", {x: 96, y: 980, size: 26, w: 500, color: C.mute2});
  const right = text(f, "1,000 оюутан", {x: 0, y: 980, size: 26, w: 500, color: C.mute2});
  right.x = W - 96 - right.width;
  return f;
}

function slide2() {
  const f = frame("02  Асуудал", C.bone);
  kicker(f, "Асуудал", false);
  index(f, "02", false);
  text(f, "1,000", {x: 96, y: 300, size: 220, w: 600, ls: -13, lh: 187, color: C.ink});
  text(f, "оюутан · нэг асуудал", {x: 104, y: 540, size: 42, w: 500, ls: -0.8, color: C.ink});
  rect(f, 980, 300, 1, 360, C.line);
  text(f, "Хүнд.\nЗузаан.\nҮнэтэй ном.", {
    x: 1040, y: 320, size: 84, w: 600, ls: -3.8, lh: 86, color: C.ink,
  });
  source(f, "Багш, оюутан энэ номыг авдаг. Бүгдийг нэг вэб апп дотор.", false);
  return f;
}

function book(parent, x, bg, fg, meta, price, name, pages, stroke) {
  rect(parent, x, 200, 557, 620, bg, stroke);
  text(parent, price, {x: x + 40, y: 240, size: 72, w: 600, ls: -2.8, color: fg});
  text(parent, name, {x: x + 40, y: 640, size: 32, w: 600, ls: -0.6, lh: 40, color: fg});
  text(parent, pages, {x: x + 40, y: 732, size: 22, w: 500, color: meta});
}

function slide3() {
  const f = frame("03  Бодит үнэ", C.bone);
  kicker(f, "Бодит үнэ", false);
  index(f, "03", false);
  book(f, 96, C.ink, C.bone, C.metaOnInk, "$94.99", "Gray's Anatomy\nfor Students", "5-р хэвлэл · 1,168 нүүр");
  book(f, 681, C.blood, C.bone, C.metaOnBlood, "$84.99", "Netter Atlas\nof Human Anatomy", "9-р хэвлэл · 736 нүүр");
  book(f, 1266, C.bone2, C.ink, C.mute, "$89.99", "Gray's Atlas\nof Anatomy", "Номын дэлгүүрийн үнэ", C.cardLine);
  source(f, "Elsevier list · Matthews RUSH bookstore. АНУ-ын нээлттэй үнэ. Монголд хүргэлт нэмэгдэнэ.", false);
  return f;
}

function slide4() {
  const f = frame("04  Харьцуулалт", C.ink);
  kicker(f, "Харьцуулалт", true);
  index(f, "04", true);
  text(f, "972,000₮", {x: 96, y: 400, size: 88, w: 600, ls: -4.4, color: C.bone});
  text(f, "3 ном · нэг оюутан", {x: 96, y: 508, size: 28, w: 500, color: C.mute2});
  text(f, "20×", {x: 860, y: 384, size: 108, w: 600, ls: -6, color: C.blood});
  text(f, "49,000₮", {x: 1180, y: 400, size: 88, w: 600, ls: -4.4, color: C.bone});
  text(f, "Anatomn · 1 жил", {x: 1180, y: 508, size: 28, w: 500, color: C.mute2});
  source(f, "$269.97 × ₮3,598.76 = 971,557₮. Монголбанк, 2026.10.28. Жилийн үнэ бүтээгдэхүүн дээрх багц.", true);
  return f;
}

function slide5() {
  const f = frame("05  Нэг вэб апп", C.bone);
  kicker(f, "Шийдэл", false);
  index(f, "05", false);
  text(f, "Нэг вэб апп.", {x: 96, y: 160, size: 92, w: 600, ls: -4, color: C.ink});
  const rows = ["3D атлас", "AI багш", "Шалгалт", "Хугарал", "Судас"];
  rows.forEach((name, i) => {
    const y = 340 + i * 112;
    rect(f, 96, y, W - 192, 1, C.line);
    text(f, "0" + (i + 1), {x: 96, y: y + 42, size: 22, w: 600, ls: 3, color: C.mute});
    text(f, name, {x: 216, y: y + 32, size: 48, w: 600, ls: -1.4, color: C.ink});
  });
  rect(f, 96, 340 + 5 * 112, W - 192, 1, C.line);
  return f;
}

function slide6() {
  const f = frame("06  Бүтээгдэхүүн", C.ink);
  kicker(f, "Одоо ажиллаж байна", true);
  index(f, "06", true);
  text(f, "2,763", {x: 96, y: 200, size: 200, w: 600, ls: -12, color: C.bone});
  text(f, "сонгож болох бүтэц", {x: 96, y: 400, size: 32, w: 500, color: C.mute});
  const stats = [
    ["16", "биеийн систем"],
    ["205/206", "насанд хүрэгчийн яс"],
    ["6×25", "хугаацаатай шалгалт"],
  ];
  stats.forEach((pair, i) => {
    const x = 96 + i * 586;
    text(f, pair[0], {x, y: 860, size: 64, w: 600, ls: -2.6, color: C.bone});
    text(f, pair[1], {x, y: 940, size: 22, w: 500, color: C.mute});
  });
  return f;
}

function slideWhy() {
  const f = frame("07  Яагаад Anatomn", C.ink);
  kicker(f, "Давуу тал", true);
  index(f, "07", true);
  text(f, "Яагаад Anatomn.", {x: 96, y: 140, size: 72, w: 600, ls: -3.2, color: C.bone});
  const heads = ["", "Anatomn", "Ном", "Гадаад 3D"];
  const cols = [96, 620, 1080, 1500];
  heads.forEach((label, i) => {
    if (!label) return;
    text(f, label, {x: cols[i], y: 280, size: 22, w: 600, ls: 0.8, color: i === 1 ? "#e7c3c0" : C.mute});
  });
  rect(f, 96, 330, W - 192, 1, "#3a423d");
  const rows = [
    ["Монгол хэл", "Монгол + Латин", "Хязгаартай", "Зөвхөн English"],
    ["AI багш", "Gray's дээр", "Байхгүй", "Байхгүй"],
    ["Хугарал", "Лаб дотор", "Байхгүй", "Өндөр үнэ"],
    ["Үнэ", "49,000₮ / жил", "Ном авна", "$80–120 / жил"],
  ];
  rows.forEach((row, r) => {
    const y = 360 + r * 140;
    row.forEach((cell, i) => {
      text(f, cell, {
        x: cols[i], y: y + 36, size: 32, w: 600, ls: -0.6,
        color: i === 0 || i === 1 ? C.bone : C.mute2,
      });
    });
    rect(f, 96, y + 120, W - 192, 1, "#2a302c");
  });
  return f;
}

function slide7() {
  const f = frame("08  Загвар", C.bone);
  kicker(f, "Загвар", false);
  index(f, "08", false);
  text(f, "49,000₮", {x: 96, y: 280, size: 140, w: 600, ls: -7.7, color: C.ink});
  text(f, "нэг суудал · нэг жил", {x: 104, y: 450, size: 36, w: 500, color: C.mute});
  rect(f, 0, 800, W, 280, C.ink);
  text(f, "49 сая₮", {x: 96, y: 870, size: 72, w: 600, ls: -2.8, color: C.bone});
  text(f, "1,000 суудал · сургууль төлдөг", {x: 96, y: 960, size: 22, w: 500, color: C.mute2});
  const side = text(f, "Оюутан 0₮", {x: 0, y: 890, size: 28, w: 500, color: C.bone});
  side.x = W - 96 - side.width;
  const sub = text(f, "Гадуурх багц 9,900₮ / сар", {x: 0, y: 934, size: 28, w: 500, color: C.mute2});
  sub.x = W - 96 - sub.width;
  return f;
}

function slide8() {
  const f = frame("09  1,000 оюутан", C.ink);
  kicker(f, "1,000 оюутан", true);
  index(f, "09", true);
  const cols = [
    ["972 сая", "номын төсөв", C.bone],
    ["49 сая", "лиценз", C.bone],
    ["923 сая", "зөрүү", C.blood],
  ];
  cols.forEach((col, i) => {
    const x = 96 + i * 592;
    text(f, col[0], {x, y: 400, size: 84, w: 600, ls: -4.2, color: col[2]});
    text(f, col[1], {x, y: 510, size: 28, w: 500, color: C.mute2});
  });
  source(f, "АШУҮИС 14,200 суралцагч, 2026.10.28. Кредит 170,000₮ × ~30 = 5.1 сая, Eguur 2025.08.20. 3 ном ≈ жилийн төлбөрийн 19%.", true);
  return f;
}

function slide9() {
  const f = frame("10  Хүсэлт", C.bone);
  kicker(f, "Хүсэлт", false);
  index(f, "10", false);
  text(f, "1,000 суудал.", {x: 96, y: 280, size: 120, w: 600, ls: -6, color: C.ink});
  text(f, "anatomn-test.vercel.app/atlas", {x: 96, y: 560, size: 40, w: 500, ls: -0.8, color: C.blood});
  text(f, "АШУҮИС · нэг холбоос · зузаан номгүй", {x: 96, y: 960, size: 24, w: 500, color: C.mute});
  return f;
}

const NOTES = [
  "01. Anatomn. АШУҮИС-ийн оюутнуудад зориулсан нэг вэб. Зузаан ном үүрэхгүй.",
  "02. 1,000 оюутны асуудал нэг. Багш нар хүнд, зузаан номыг үнэтэй авдаг. Бид түүнийг нэг вэб апп дотор шийднэ. 1,000 нь эхний пилот, судалгааны хувь биш.",
  "03. Бодит үнэ. Gray's Anatomy for Students 5e, Elsevier, $94.99, 1,168 нүүр. Netter Atlas 9e, Elsevier original $84.99, 736 нүүр. Gray's Atlas, Matthews RUSH bookstore, $89.99. АНУ-ын нээлттэй үнэ. Монголд хүргэлт нэмэгдэнэ.",
  "04. $269.97 × Монголбанк 2026.10.28-ны ₮3,598.76 = 971,557₮, слайд дээр 972,000₮. Anatomn-ийн жилийн багц 49,000₮, апп дээр байгаа үнэ. 19.8 дахин, слайд дээр 20×.",
  "05. Нэг холбоос: 3D атлас, AI багш, шалгалт, хугарлын лаб, судсны лаб. AI багш Gray's-ийн 8 бүлгийн бүтцэд зангуудсан. Номын текстийг хуулдаггүй.",
  "06. Одоо нээлттэй. 2,763 сонгож болох бүтэц, 16 систем, насанд хүрэгчийн 205/206 яс, 6 шалгалт × 25 асуулт.",
  "07. Яагаад Anatomn. Монгол + латин. AI багш Gray's-ийн бүлэгт зангуудсан. Хугарлын лаб апп дотор. Ном дээр монгол хязгаартай, AI ба хугарал байхгүй. Гадаад 3D ихэвчлэн зөвхөн англи, хугарлын лаб өндөр үнэтэй, жил нь $80–120. Манай үнэ 49,000₮/жил.",
  "08. Сургууль авна. Нэг суудал жилд 49,000₮. 1,000 суудал = 49 сая₮. Оюутан 0₮. Сургуулиас гадуур сарын багц 9,900₮. Хоёр үнэ апп дээр байна. Төлбөр QPay, SocialPay, банкаар.",
  "09. 1,000 оюутан × 972,000₮ ≈ 972 сая ном. Лиценз 49 сая. Зөрүү 923 сая. АШУҮИС 14,200 суралцагч, mnums.edu.mn, 2026.10.28. Их эмчийн кредит 170,000₮, Eguur 2025.08.20. ~30 кредит × 170,000 = 5.1 сая. 3 ном ≈ жилийн төлбөрийн 19%.",
  "10. Хүсэлт: АШУҮИС дээр 1,000 суудлын пилот. Холбоос нээлттэй.",
];

function link(frames) {
  for (let i = 0; i < frames.length - 1; i++) {
    frames[i].reactions = [{
      trigger: {type: "ON_CLICK"},
      actions: [{
        type: "NODE",
        destinationId: frames[i + 1].id,
        navigation: "NAVIGATE",
        transition: {type: "DISSOLVE", easing: {type: "EASE_OUT"}, duration: 0.2},
      }],
    }];
  }
  figma.currentPage.flowStartingPoints = [{nodeId: frames[0].id, name: "Pitch"}];
}

async function loadFonts() {
  await figma.loadFontAsync({family: "Inter", style: "Regular"});
  await figma.loadFontAsync({family: "Inter", style: "Medium"});
  for (const style of ["Semi Bold", "SemiBold", "Bold"]) {
    try {
      await figma.loadFontAsync({family: "Inter", style});
      SEMI = style;
      return;
    } catch (error) { /* try the next Inter weight name */ }
  }
  throw new Error("Inter Semi Bold олдсонгүй");
}

async function notesPage() {
  const page = figma.createPage();
  page.name = "Яриа";
  await figma.setCurrentPageAsync(page);
  const block = figma.createFrame();
  block.name = "Илтгэгчийн тэмдэглэл";
  block.resize(1400, 1600);
  block.fills = paint(C.bone);
  let y = 64;
  for (const line of NOTES) {
    const node = text(block, line, {x: 48, y, size: 22, w: 400, lh: 32, color: C.ink});
    node.textAutoResize = "HEIGHT";
    node.resize(1300, node.height);
    y += node.height + 28;
  }
  block.resize(1400, y + 48);
}

(async () => {
  await loadFonts();
  const page = figma.currentPage;
  page.name = "Слайд";
  const frames = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6(), slideWhy(), slide7(), slide8(), slide9()];
  frames.forEach((node, i) => {
    page.appendChild(node);
    node.x = i * (W + 160);
    node.y = 0;
  });
  try { link(frames); } catch (error) { figma.notify("Слайд бэлэн. Холбоос тавиагүй: " + error); }
  try { await notesPage(); } catch (error) { figma.notify("Яриа хуудас алгассан"); }
  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView(frames);
  figma.notify("10 слайд бэлэн. Present дээр дар.");
  figma.closePlugin();
})();
