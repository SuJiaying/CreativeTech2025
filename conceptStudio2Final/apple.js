new p5((p) => {
  let apples = [];
  let slots = []; // 现在不参与计算，只是保留
  let maxGap = 200;
  let minGapLimit = -5;

  // 9 张苹果图片（a01 最低 entropy → a09 最高 entropy）
  let appleImgs = [];
  let bgImg;

  p.preload = () => {
    bgImg = p.loadImage("background.jpg");

    appleImgs[0] = p.loadImage("a01.png");
    appleImgs[1] = p.loadImage("a02.png");
    appleImgs[2] = p.loadImage("a03.png");
    appleImgs[3] = p.loadImage("a04.png");
    appleImgs[4] = p.loadImage("a05.png");
    appleImgs[5] = p.loadImage("a06.png");
    appleImgs[6] = p.loadImage("a07.png");
    appleImgs[7] = p.loadImage("a08.png");
    appleImgs[8] = p.loadImage("a09.png");
  };

  p.setup = () => {
    let canvas = p.createCanvas(600, 600);
    canvas.parent("apple");

    let targetH = 70;

    // 初始化 8 个苹果
    for (let i = 0; i < 8; i++) {
      let a = {
        x: p.random(120, p.width - 120),
        y: p.random(120, p.height - 120),
        h: targetH,
        dragging: false,
        offsetX: 0,
        offsetY: 0
      };
      apples.push(a);
    }

    // slots 保留不用
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
    p.imageMode(p.CORNER);
    p.image(bgImg, 0, 0, p.width, p.height);

    let t = computeEntropyByTouching();
    let imgIndex = p.floor(p.lerp(0, 8, t));
    imgIndex = p.constrain(imgIndex, 0, 8);

    for (let a of apples) {
      drawApple(a, appleImgs[imgIndex]);
    }

    p.fill(255);
    p.text(
      "Drag the apples.\n" + "Entropy: " + p.nf(t, 1, 2),
      p.width / 2,
      40
    );
  };

  function computeEntropyByTouching() {
    let n = apples.length;
    if (n <= 1) return 0;

    let gaps = [];

    for (let i = 0; i < n; i++) {
      let a = apples[i];
      let rA = a.h * 0.5;

      let minGap = Infinity;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        let b = apples[j];
        let rB = b.h * 0.5;

        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let centerDist = Math.sqrt(dx * dx + dy * dy);

        let gap = centerDist - (rA + rB);
        gap = Math.max(minGapLimit, gap);

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

    let t = (meanGap + stdGap) / maxGap;
    return p.constrain(t, 0, 1);
  }

  function drawApple(a, img) {
    p.imageMode(p.CENTER);

    let aspect = img.width / img.height;
    let w = a.h * aspect;

    p.image(img, a.x, a.y, w, a.h);
  }

  // ✅ instance mode 的鼠标事件
  p.mousePressed = () => {
    for (let i = apples.length - 1; i >= 0; i--) {
      let a = apples[i];

      let hitW = a.h;
      let hitH = a.h;

      if (
        p.mouseX > a.x - hitW / 2 &&
        p.mouseX < a.x + hitW / 2 &&
        p.mouseY > a.y - hitH / 2 &&
        p.mouseY < a.y + hitH / 2
      ) {
        a.dragging = true;
        a.offsetX = a.x - p.mouseX;
        a.offsetY = a.y - p.mouseY;

        apples.push(apples.splice(i, 1)[0]);
        break;
      }
    }
  };

  p.mouseDragged = () => {
    for (let a of apples) {
      if (a.dragging) {
        a.x = p.constrain(p.mouseX + a.offsetX, a.h / 2, p.width - a.h / 2);
        a.y = p.constrain(p.mouseY + a.offsetY, a.h / 2, p.height - a.h / 2);
      }
    }
  };

  p.mouseReleased = () => {
    for (let a of apples) a.dragging = false;
  };
});
