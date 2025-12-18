new p5((p) => {
  let bananas = [];
  let slots = []; // 现在不参与计算，只是保留
  let maxDist = 250;

  // 9 张香蕉图片（从青到熟）
  let bananaImgs = [];

  p.preload = () => {
    bananaImgs[0] = p.loadImage("b01.png");
    bananaImgs[1] = p.loadImage("b02.png");
    bananaImgs[2] = p.loadImage("b03.png");
    bananaImgs[3] = p.loadImage("b04.png");
    bananaImgs[4] = p.loadImage("b05.png");
    bananaImgs[5] = p.loadImage("b06.png");
    bananaImgs[6] = p.loadImage("b07.png");
    bananaImgs[7] = p.loadImage("b08.png");
    bananaImgs[8] = p.loadImage("b09.png");
  };

  p.setup = () => {
    let canvas = p.createCanvas(600, 600);
    canvas.parent("banana");

    let targetH = 60;
    let aspect = bananaImgs[0].width / bananaImgs[0].height;
    let targetW = targetH * aspect;

    // 初始化 5 根香蕉
    for (let i = 0; i < 5; i++) {
      let b = {
        x: p.random(100, p.width - 100),
        y: p.random(100, p.height - 100),
        w: targetW,
        h: targetH,
        dragging: false,
        offsetX: 0,
        offsetY: 0
      };
      bananas.push(b);
    }

    // slots 目前没用，只保留
    let slotX = p.width / 2;
    let startY = 120;
    let gap = 80;
    for (let i = 0; i < 5; i++) {
      slots.push({ x: slotX, y: startY + i * gap });
    }

    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
  };

  p.draw = () => {
    p.background(255);

    let t = computeEntropy();
    let imgIndex = p.floor(p.lerp(0, 8, t));
    imgIndex = p.constrain(imgIndex, 0, 8);

    for (let b of bananas) {
      drawBanana(b, bananaImgs[imgIndex]);
    }

    p.fill(0);
    p.text(
      "Drag the bananas.\n" + "Entropy: " + p.nf(t, 1, 2),
      p.width / 2,
      40
    );
  };

  /**
   * entropy 定义：
   * - 用 PCA 找出“最佳拟合直线”的方向（任意角度）
   * - 计算每个香蕉到这条直线的垂直距离
   * - 平均距离越小 → 越整齐成线 → entropy 越低
   */
  function computeEntropy() {
    let n = bananas.length;

    // 1) 均值
    let meanX = 0;
    let meanY = 0;
    for (let b of bananas) {
      meanX += b.x;
      meanY += b.y;
    }
    meanX /= n;
    meanY /= n;

    // 2) 协方差矩阵
    let Sxx = 0, Syy = 0, Sxy = 0;
    for (let b of bananas) {
      let dx = b.x - meanX;
      let dy = b.y - meanY;
      Sxx += dx * dx;
      Syy += dy * dy;
      Sxy += dx * dy;
    }

    if (Sxx + Syy === 0) return 1;

    // 3) PCA 主方向
    let theta = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
    let vx = Math.cos(theta);
    let vy = Math.sin(theta);

    // 法向量
    let nx = -vy;
    let ny = vx;

    // 4) 到直线的垂直距离
    let sumDist = 0;
    for (let b of bananas) {
      let dx = b.x - meanX;
      let dy = b.y - meanY;
      let d = Math.abs(dx * nx + dy * ny);
      sumDist += d;
    }

    let avgDist = sumDist / n;

    // 5) 映射到 0~1
    let t = avgDist / maxDist;
    return p.constrain(t, 0, 1);
  }

  function drawBanana(b, img) {
    p.imageMode(p.CENTER);
    p.image(img, b.x, b.y, b.w, b.h);
  }

  // ✅ instance mode 鼠标事件要写成 p.mousePressed / p.mouseDragged / p.mouseReleased
  p.mousePressed = () => {
    for (let i = bananas.length - 1; i >= 0; i--) {
      let b = bananas[i];
      if (
        p.mouseX > b.x - b.w / 2 &&
        p.mouseX < b.x + b.w / 2 &&
        p.mouseY > b.y - b.h / 2 &&
        p.mouseY < b.y + b.h / 2
      ) {
        b.dragging = true;
        b.offsetX = b.x - p.mouseX;
        b.offsetY = b.y - p.mouseY;

        // 置顶
        bananas.push(bananas.splice(i, 1)[0]);
        break;
      }
    }
  };

  p.mouseDragged = () => {
    for (let b of bananas) {
      if (b.dragging) {
        b.x = p.constrain(p.mouseX + b.offsetX, b.w / 2, p.width - b.w / 2);
        b.y = p.constrain(p.mouseY + b.offsetY, b.h / 2, p.height - b.h / 2);
      }
    }
  };

  p.mouseReleased = () => {
    for (let b of bananas) b.dragging = false;
  };
});
