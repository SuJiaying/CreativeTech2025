let apples = [];
let slots = []; // 现在不参与计算，只是保留
let maxGap = 200; // 用于把 gap 映射到 0~1（可按手感调大/调小）
let minGapLimit = -5; // 允许负 gap 的下限（更“挤”更低熵），比如要 -10 就改这里

// 9 张苹果图片（a01 最低 entropy → a09 最高 entropy）
let appleImgs = [];
let bgImg;

function preload() {
  bgImg = loadImage("background.jpg");

  appleImgs[0] = loadImage("a01.png");
  appleImgs[1] = loadImage("a02.png");
  appleImgs[2] = loadImage("a03.png");
  appleImgs[3] = loadImage("a04.png");
  appleImgs[4] = loadImage("a05.png");
  appleImgs[5] = loadImage("a06.png");
  appleImgs[6] = loadImage("a07.png");
  appleImgs[7] = loadImage("a08.png");
  appleImgs[8] = loadImage("a09.png");
}

function setup() {
let canvas =createCanvas(600, 600)
  canvas.parent('apple');

  // ✅ 统一高度（宽度由每张图片自己的比例决定）
  let targetH = 70;

  // 初始化 8 个苹果（你现在写的是 8）
  for (let i = 0; i < 8; i++) {
    let a = {
      x: random(120, width - 120),
      y: random(120, height - 120),
      h: targetH,
      dragging: false,
      offsetX: 0,
      offsetY: 0
    };
    apples.push(a);
  }

  // slots 保留不用（如果你想匹配数量，可以把 5 改成 8）
  let slotX = width / 2;
  let startY = 120;
  let gap = 80;
  for (let i = 0; i < 5; i++) {
    slots.push({ x: slotX, y: startY + i * gap });
  }

  textAlign(CENTER, TOP);
  textSize(24);
}

function draw() {
  // 背景铺满画布（直接拉伸适配 600x600）
  imageMode(CORNER);
  image(bgImg, 0, 0, width, height);

  let t = computeEntropyByTouching(); // 0 低熵 / 1 高熵
  let imgIndex = floor(lerp(0, 8, t));
  imgIndex = constrain(imgIndex, 0, 8);

  for (let a of apples) {
    drawApple(a, appleImgs[imgIndex]);
  }

  fill(255);
  text(
    "Drag the apples.\n" +
      "Entropy: " + nf(t, 1, 2),
    width / 2,
    40
  );
}

/**
 * entropy 定义（“边缘紧贴 & 间隙均匀”最低熵）：
 * 1) 每个苹果用统一的“感知半径” r = h/2（不依赖图片比例）
 * 2) 对每个苹果，找它与其他苹果的最小边缘间隙 minGap
 *    gap = centerDist - (rA + rB)
 *    gap 允许为负（代表挤压/重叠），最低限制到 minGapLimit
 * 3) 取所有 minGap 的 meanGap 和 stdGap
 * 4) entropy = (meanGap + stdGap) / maxGap → 映射到 0~1
 */
function computeEntropyByTouching() {
  let n = apples.length;
  if (n <= 1) return 0;

  let gaps = [];

  for (let i = 0; i < n; i++) {
    let a = apples[i];
    let rA = a.h * 0.5; // ✅ 统一半径（只跟高度有关）

    let minGap = Infinity;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let b = apples[j];
      let rB = b.h * 0.5;

      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let centerDist = Math.sqrt(dx * dx + dy * dy);

      // 边缘间隙：中心距 - 半径和
      let gap = centerDist - (rA + rB);

      // ✅ 允许负值，但设下限（例如 -5 或 -10）
      gap = max(minGapLimit, gap);

      if (gap < minGap) minGap = gap;
    }

    gaps.push(minGap);
  }

  // mean
  let sum = 0;
  for (let g of gaps) sum += g;
  let meanGap = sum / gaps.length;

  // std
  let varSum = 0;
  for (let g of gaps) varSum += (g - meanGap) * (g - meanGap);
  let stdGap = Math.sqrt(varSum / gaps.length);

  // 映射到 0~1（越小越低熵；越大越高熵）
  let t = (meanGap + stdGap) / maxGap;
  return constrain(t, 0, 1);
}

/**
 * ✅ 保持图片原始比例，只统一高度
 * 宽度由当前 img 的原始宽高比决定
 */
function drawApple(a, img) {
  imageMode(CENTER);

  let aspect = img.width / img.height;
  let w = a.h * aspect;

  image(img, a.x, a.y, w, a.h);
}

// 拖拽交互
function mousePressed() {
  for (let i = apples.length - 1; i >= 0; i--) {
    let a = apples[i];

    // 这里为了不拉伸判断：点击范围用“统一的 h”近似即可
    // 如果你想更精确，可以用当前图的 aspect 去算 w
    let hitW = a.h; // 简化点击框：正方形
    let hitH = a.h;

    if (
      mouseX > a.x - hitW / 2 &&
      mouseX < a.x + hitW / 2 &&
      mouseY > a.y - hitH / 2 &&
      mouseY < a.y + hitH / 2
    ) {
      a.dragging = true;
      a.offsetX = a.x - mouseX;
      a.offsetY = a.y - mouseY;

      // 放到最上层
      apples.push(apples.splice(i, 1)[0]);
      break;
    }
  }
}

function mouseDragged() {
  for (let a of apples) {
    if (a.dragging) {
      // 边界用 h 做近似（不严格但够稳定）
      a.x = constrain(mouseX + a.offsetX, a.h / 2, width - a.h / 2);
      a.y = constrain(mouseY + a.offsetY, a.h / 2, height - a.h / 2);
    }
  }
}

function mouseReleased() {
  for (let a of apples) a.dragging = false;
}
