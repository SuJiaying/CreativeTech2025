let items = [];
let slots = []; // 每张图的目标中心点（slot1 对应 c01, ...）
let imgs = [];

let targetH = 150; // ✅ 统一高度 150
let maxDist = 0; // 归一化上限（画布对角线）
let snapEps = 2; // ✅ 2px 内认为“到位”（让最低熵更容易到 0）

function preload() {
  for (let i = 1; i <= 8; i++) {
    let name = "c" + nf(i, 2) + ".png"; // c01.png ... c08.png
    imgs.push(loadImage(name));
  }
}

function setup() {
  createCanvas(600, 600);
  textAlign(CENTER, TOP);
  textSize(24);

  maxDist = dist(0, 0, width, height);

  // 创建 8 个可拖拽图片对象（每张图都有固定 id = 1..8）
  for (let i = 0; i < 8; i++) {
    let img = imgs[i];
    let aspect = img.width / img.height;
    let w = targetH * aspect;

    items.push({
      id: i + 1, // ✅ 永远不变，用来匹配 slot
      img,
      x: random(200, width - 200),
      y: random(200, height - 200),
      w,
      h: targetH,
      dragging: false,
      offsetX: 0,
      offsetY: 0,
    });
  }

  // 目标排布：按图示
  // 01 左上角，02 上中，03 右上角
  // 04 左中，05 右中
  // 06 左下角，07 下中，08 右下角
  // 为了“顶边/顶角”，中心点用 w/2 和 h/2 算
  function cxLeftById(id) {
    return getItemById(id).w / 2;
  }
  function cxRightById(id) {
    return width - getItemById(id).w / 2;
  }
  function cyTopById(id) {
    return getItemById(id).h / 2;
  }
  function cyBotById(id) {
    return height - getItemById(id).h / 2;
  }

  let margin = 50;
  slots = [
    { x: cxLeftById(1) + margin, y: cyTopById(1) + margin },

    // 02 上中（不变）
    { x: width / 2, y: cyTopById(2) },

    // 03 右上：x 离右边 25（所以中心点往左 25），y 离上边 25
    { x: cxRightById(3) - margin, y: cyTopById(3) + margin },

    // 04 左中（不变）
    { x: cxLeftById(4), y: height / 2 },

    // 05 右中（不变）
    { x: cxRightById(5), y: height / 2 },

    // 06 左下：x 离左边 25，y 离下边 25（所以中心点往上 25）
    { x: cxLeftById(6) + margin, y: cyBotById(6) - margin },

    // 07 下中（不变）
    { x: width / 2, y: cyBotById(7) },

    // 08 右下：x 往左 25，y 往上 25
    { x: cxRightById(8) - margin, y: cyBotById(8) - margin },
  ];
}

function draw() {
  background(255);

  // 画图片（items 顺序可能变化，但 entropy 不受影响）
  for (let it of items) {
    drawItem(it);
  }

  // entropy
  let t = computeEntropyToSlots();

  fill(0);
  text("Drag the patterns.\nEntropy: " + nf(t, 1, 2), width / 2, 20);
}

/**
 * ✅ entropy：按“每张图到自己对应 slot 的距离”计算
 * 关键点：用 it.id 匹配 slots[it.id - 1]，不依赖 items 数组顺序
 */
function computeEntropyToSlots() {
  let sum = 0;

  for (let it of items) {
    let s = slots[it.id - 1];
    let d = dist(it.x, it.y, s.x, s.y);

    // 小阈值：2px 内当作完全到位
    if (d < snapEps) d = 0;

    sum += d;
  }

  let avg = sum / items.length;
  let t = avg / maxDist;
  return constrain(t, 0, 1);
}

function drawItem(it) {
  imageMode(CENTER);
  image(it.img, it.x, it.y, it.w, it.h);
}

// 通过 id 找到对应 item（id 从 1 到 8）
function getItemById(id) {
  for (let it of items) {
    if (it.id === id) return it;
  }
  return null;
}

// 拖拽交互：精确按 w/h 点击
function mousePressed() {
  for (let i = items.length - 1; i >= 0; i--) {
    let it = items[i];
    if (
      mouseX > it.x - it.w / 2 &&
      mouseX < it.x + it.w / 2 &&
      mouseY > it.y - it.h / 2 &&
      mouseY < it.y + it.h / 2
    ) {
      it.dragging = true;
      it.offsetX = it.x - mouseX;
      it.offsetY = it.y - mouseY;

      // 置顶显示：改变绘制顺序，但不影响 entropy（因为 entropy 用 id 匹配）
      items.push(items.splice(i, 1)[0]);
      break;
    }
  }
}

function mouseDragged() {
  for (let it of items) {
    if (it.dragging) {
      it.x = constrain(mouseX + it.offsetX, it.w / 2, width - it.w / 2);
      it.y = constrain(mouseY + it.offsetY, it.h / 2, height - it.h / 2);
    }
  }
}

function mouseReleased() {
  for (let it of items) it.dragging = false;
}
