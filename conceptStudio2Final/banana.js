let bananas = [];
let slots = []; // 现在不参与计算，只是保留，如果以后想用可以打开
let maxDist = 250;

// 9 张香蕉图片（从青到熟）
let bananaImgs = [];

function preload() {
  // 图片和 sketch.js 在同一层目录
  bananaImgs[0] = loadImage("b01.png");
  bananaImgs[1] = loadImage("b02.png");
  bananaImgs[2] = loadImage("b03.png");
  bananaImgs[3] = loadImage("b04.png");
  bananaImgs[4] = loadImage("b05.png");
  bananaImgs[5] = loadImage("b06.png");
  bananaImgs[6] = loadImage("b07.png");
  bananaImgs[7] = loadImage("b08.png");
  bananaImgs[8] = loadImage("b09.png");
}

function setup() {
let canvas =createCanvas(600, 600)
  canvas.parent('banana');

  
  let targetH = 60;
  let aspect = bananaImgs[0].width / bananaImgs[0].height;
  let targetW = targetH * aspect;

  //初始化5根香蕉
  for (let i = 0; i < 5; i++) {
    let b = {
      x: random(100, width - 100),
      y: random(100, height - 100),
      w: targetW,
      h: targetH,
      dragging: false,
      offsetX: 0,
      offsetY: 0
    };
    bananas.push(b);
  }

  //这个slots目前没在用，只是保留
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
  background(255);

  let t = computeEntropy();
  let imgIndex = floor(lerp(0, 8, t));
  imgIndex = constrain(imgIndex, 0, 8);


  for (let b of bananas) {
    drawBanana(b, bananaImgs[imgIndex]);
  }

  fill(0);
  text(
    "Drag the bananas.\n" +
    "Entropy: " + nf(t, 1, 2),
    width / 2,
    40
  );
}

/**
 * entropy 定义：
 * - 用 PCA 找出“最佳拟合直线”的方向（任意角度）
 * - 计算每个香蕉到这条直线的垂直距离
 * - 平均距离越小 → 越整齐成线 → entropy 越低
 */
function computeEntropy() {
  let n = bananas.length;

  // 1️⃣ 计算中心点（均值）
  let meanX = 0;
  let meanY = 0;
  for (let b of bananas) {
    meanX += b.x;
    meanY += b.y;
  }
  meanX /= n;
  meanY /= n;

  // 2️⃣ 计算协方差矩阵元素
  let Sxx = 0, Syy = 0, Sxy = 0;
  for (let b of bananas) {
    let dx = b.x - meanX;
    let dy = b.y - meanY;
    Sxx += dx * dx;
    Syy += dy * dy;
    Sxy += dx * dy;
  }

  // 极端情况：所有点重合或几乎重合
  if (Sxx + Syy === 0) {
    return 1; // 这里当作“没什么结构”，给高 entropy
  }

  // 3️⃣ PCA 主方向（最佳拟合直线方向）
  let theta = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
  let vx = Math.cos(theta);
  let vy = Math.sin(theta);

  // 对应的法向量（垂直方向）
  let nx = -vy;
  let ny = vx;

  // 4️⃣ 点到直线的垂直距离
  let sumDist = 0;
  for (let b of bananas) {
    let dx = b.x - meanX;
    let dy = b.y - meanY;
    let d = Math.abs(dx * nx + dy * ny); // 投影到法向量
    sumDist += d;
  }

  let avgDist = sumDist / n;

  // 5️⃣ 映射到 0~1
  let t = avgDist / maxDist;
  return constrain(t, 0, 1);
}

function drawBanana(b, img) {
  imageMode(CENTER);
  image(img, b.x, b.y, b.w, b.h);
}

//拖拽香蕉的交互
function mousePressed() {
  for (let i = bananas.length - 1; i >= 0; i--) {
    let b = bananas[i];
    if (
      mouseX > b.x - b.w / 2 &&
      mouseX < b.x + b.w / 2 &&
      mouseY > b.y - b.h / 2 &&
      mouseY < b.y + b.h / 2
    ) {
      b.dragging = true;
      b.offsetX = b.x - mouseX;
      b.offsetY = b.y - mouseY;

      //把拖着的香蕉放到最上层
      bananas.push(bananas.splice(i, 1)[0]);
      break;
    }
  }
}

function mouseDragged() {
  for (let b of bananas) {
    if (b.dragging) {
      b.x = constrain(mouseX + b.offsetX, b.w / 2, width - b.w / 2);
      b.y = constrain(mouseY + b.offsetY, b.h / 2, height - b.h / 2);
    }
  }
}

function mouseReleased() {
  for (let b of bananas) {
    b.dragging = false;
  }
}
