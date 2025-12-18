new p5((p) => {
  let items = [];
  let slots = []; // 每张图的目标中心点（slot1 对应 c01, ...）
  let imgs = [];

  let targetH = 150; // ✅ 统一高度 150
  let maxDist = 0;   // 归一化上限（画布对角线）
  let snapEps = 2;   // ✅ 2px 内认为“到位”

  p.preload = () => {
    for (let i = 1; i <= 8; i++) {
      let name = "c" + p.nf(i, 2) + ".png"; // c01.png ... c08.png
      imgs.push(p.loadImage(name));
    }
  };

  p.setup = () => {
    let canvas = p.createCanvas(600, 600);
    canvas.parent("sketchHolder");

    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);

    maxDist = p.dist(0, 0, p.width, p.height);

    // 创建 8 个可拖拽图片对象（每张图都有固定 id = 1..8）
    for (let i = 0; i < 8; i++) {
      let img = imgs[i];
      let aspect = img.width / img.height;
      let w = targetH * aspect;

      items.push({
        id: i + 1, // ✅ 永远不变，用来匹配 slot
        img,
        x: p.random(200, p.width - 200),
        y: p.random(200, p.height - 200),
        w,
        h: targetH,
        dragging: false,
        offsetX: 0,
        offsetY: 0,
      });
    }

    // 目标排布：按图示
    function cxLeftById(id) {
      return getItemById(id).w / 2;
    }
    function cxRightById(id) {
      return p.width - getItemById(id).w / 2;
    }
    function cyTopById(id) {
      return getItemById(id).h / 2;
    }
    function cyBotById(id) {
      return p.height - getItemById(id).h / 2;
    }

    let margin = 50;

    slots = [
      { x: cxLeftById(1) + margin,  y: cyTopById(1) + margin }, // 01 左上

      { x: p.width / 2,             y: cyTopById(2) },          // 02 上中

      { x: cxRightById(3) - margin, y: cyTopById(3) + margin }, // 03 右上

      { x: cxLeftById(4),           y: p.height / 2 },          // 04 左中

      { x: cxRightById(5),          y: p.height / 2 },          // 05 右中

      { x: cxLeftById(6) + margin,  y: cyBotById(6) - margin }, // 06 左下

      { x: p.width / 2,             y: cyBotById(7) },          // 07 下中

      { x: cxRightById(8) - margin, y: cyBotById(8) - margin }, // 08 右下
    ];
  };

  p.draw = () => {
    p.background(255);

    for (let it of items) {
      drawItem(it);
    }

    let t = computeEntropyToSlots();

    p.fill(0);
    p.text("Drag the patterns.\nEntropy: " + p.nf(t, 1, 2), p.width / 2, 20);
  };

  function computeEntropyToSlots() {
    let sum = 0;

    for (let it of items) {
      let s = slots[it.id - 1];
      let d = p.dist(it.x, it.y, s.x, s.y);

      if (d < snapEps) d = 0;
      sum += d;
    }

    let avg = sum / items.length;
    let t = avg / maxDist;
    return p.constrain(t, 0, 1);
  }

  function drawItem(it) {
    p.imageMode(p.CENTER);
    p.image(it.img, it.x, it.y, it.w, it.h);
  }

  function getItemById(id) {
    for (let it of items) {
      if (it.id === id) return it;
    }
    return null;
  }

  // ✅ instance mode 鼠标事件
  p.mousePressed = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      let it = items[i];
      if (
        p.mouseX > it.x - it.w / 2 &&
        p.mouseX < it.x + it.w / 2 &&
        p.mouseY > it.y - it.h / 2 &&
        p.mouseY < it.y + it.h / 2
      ) {
        it.dragging = true;
        it.offsetX = it.x - p.mouseX;
        it.offsetY = it.y - p.mouseY;

        items.push(items.splice(i, 1)[0]); // 置顶
        break;
      }
    }
  };

  p.mouseDragged = () => {
    for (let it of items) {
      if (it.dragging) {
        it.x = p.constrain(p.mouseX + it.offsetX, it.w / 2, p.width - it.w / 2);
        it.y = p.constrain(p.mouseY + it.offsetY, it.h / 2, p.height - it.h / 2);
      }
    }
  };

  p.mouseReleased = () => {
    for (let it of items) it.dragging = false;
  };
});
