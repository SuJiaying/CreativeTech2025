let handPose;
let video;
let hands = [];

function preload() {
  // Load the handPose model
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 640);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  // video = createCapture(VIDEO,{ flipped:true })
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
}

function draw() {
  background(255);
  // Draw the webcam video
  image(video, 0, 0, width, 480);

  drawCenterBox();

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
    }
  }

  const { compPct, humanPct } = computeScores();
  drawScoreCard(compPct, humanPct); //在下方空白区域绘制双滑块
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}


//在视频正中画一个参考方框
function drawCenterBox() {
  const cx = 320, cy = 240;
  push();
  noFill();
  stroke(255, 255, 255, 180);
  strokeWeight(2);
  rectMode(CENTER);
  rect(cx, cy, 100, 100, 10);
  pop();
}

// 计算👁️与💻的百分比
function computeScores() {
  // 默认值（无手时）
  let compPct = 0;   // 💻
  let humanPct = 0;  // 👁️

  if (hands.length === 0) {
    return { compPct, humanPct };
  }

  const hand = hands[0]; //用第一只手驱动评分
  const pts = hand.keypoints
    .filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));

  if (pts.length === 0) return { compPct, humanPct };

  //画面与中心区参数
  const W = 640, H = 480;
  const cx = W / 2, cy = H / 2;
  const centerHalf = 50;
  const r0 = centerHalf; // 中心区边界半径（从中心到边框）
  const rMax = dist(cx, cy, 0, 0); // 到角落的距离（~400）

  //是否有关键点越界出视频画面
  const anyOut =
    pts.some(p => p.x < 0 || p.x > W || p.y < 0 || p.y > H);

  //是否全部关键点都在中心方框内
  const allInCenter =
    pts.every(p =>
      Math.abs(p.x - cx) <= centerHalf &&
      Math.abs(p.y - cy) <= centerHalf
    );

  if (anyOut) {
    //机器100%，人0%
    compPct = 100;
    humanPct = 0;
    return { compPct, humanPct };
  }

  if (allInCenter) {
    //人100%，机器0%
    humanPct = 100;
    compPct = 0;
    return { compPct, humanPct };
  }

  //其余情况：按质心离中心的距离线性映射
  const centroid = pts.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= pts.length;
  centroid.y /= pts.length;

  const d = dist(centroid.x, centroid.y, cx, cy);
  let t = (d - r0) / (rMax - r0);
  t = constrain(t, 0, 1);

  compPct = Math.round(t * 100);        // 💻
  humanPct = Math.round((1 - t) * 100); // 👁️
  return { compPct, humanPct };
}

//画布底部画卡片和两条滑块
function drawScoreCard(compPct, humanPct) {
  //卡片区域
  const cardW = 520;
  const cardH = 100;
  const cardX = (width - cardW) / 2;
  const cardY = 500;

  //样式
  push();
  //卡片背景
  noStroke();
  fill(255, 255, 255, 240);
  rect(cardX, cardY, cardW, cardH, 16);
  //阴影
  drawingContext.shadowColor = 'rgba(0,0,0,0.12)';
  drawingContext.shadowBlur = 12;
  pop();

  //内边距与条形参数
  const padX = 18;
  const padY = 14;
  const barW = cardW - padX * 2 - 60;
  const barH = 18;
  const labelW = 40; //左侧图标/文字宽度
  const gap = 18;

  //machine's perspective
  drawLabeledBar(
    cardX + padX,
    cardY + padY,
    labelW,
    barW,
    barH,
    '💻',
    compPct
  );

  //human's perspective
  drawLabeledBar(
    cardX + padX,
    cardY + padY + barH + gap,
    labelW,
    barW,
    barH,
    '👁️',
    humanPct
  );
}

//带标签的进度条
function drawLabeledBar(x, y, labelW, barW, barH, labelText, pct) {
  push();
  textFont('sans-serif');
  textSize(16);
  textAlign(LEFT, CENTER);
  noStroke();
  fill(60, 60, 60);
  text(labelText, x, y + barH / 2);

  //背条
  const bx = x + labelW + 8;
  const by = y;
  push();
  noStroke();
  fill(245);
  rect(bx, by, barW, barH, 8);
  pop();

  //前景进度
  const w = map(pct, 0, 100, 0, barW);
  push();
  noStroke();
  //颜色：上条橙、下条粉
  fill(255, 140, 0, 220); // 橙
  if (labelText === '👁️') fill(255, 105, 180, 180); // 粉
  rect(bx, by, w, barH, 8);
  pop();

  //右侧百分比
  textAlign(RIGHT, CENTER);
  fill(80);
  text(`${pct}%`, bx + barW + 50, y + barH / 2);
  pop();
}
