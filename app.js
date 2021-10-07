const url = new URL(location.href);
const s = url.searchParams.get('pixelSize')*1|| 30 ;
const lw = url.searchParams.get('lineWidth')*1 || 0.2 ;

url.searchParams.set('pixelSize',s);
url.searchParams.set('lineWidth',lw);
history.pushState(null, '', url);

// Set as an option ?
const colA = "rgb(10,10,10)"; 
const colB = "rgb(180,180,180)"; 


const rect = document.body.getBoundingClientRect();
const w = Math.ceil(rect.width / s) * s;
const h = Math.ceil(rect.height / s) * s;
const ws = w / s;
const hs = h / s;
const canvas = createCanvas(w, h);
const store = createCanvas(ws, hs);
const pA = createPatternImage(s, lw, false);
const pB = createPatternImage(s, lw, true);
const sr = pA.dpr * s;
const elVideo = document.createElement("video");

init().catch(console.warn);

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: 1,
    audio: 0
  });
  document.body.appendChild(canvas.el);
  elVideo.height = hs;
  elVideo.width = ws;
  // if src is not stream
  elVideo.crossOrigin = "Anonymous";
  elVideo.loop = true;
  elVideo.srcObject = stream;
  elVideo.addEventListener("canplay", draw, false);
  elVideo.play();
}

function draw() {
  const cox = canvas.ctx;
  const cx = store.ctx;
  cx.drawImage(elVideo, 0, 0, ws, hs);
  const dt = cx.getImageData(0, 0, ws, hs).data;
  cox.clearRect(0, 0, w, h);
  let p, t, x, y;
  for (y = 0; y < hs; y++) {
    for (x = 0; x < ws; x++) {
      p = 4 * x + 4 * y * ws;
      //t = (dt[p] + dt[p + 1] + dt[p + 2])/ 768;
      t = dt[p] / 255; //reds
      if (t > 0.5) {
        cox.drawImage(pA.el, x * sr, y * sr, sr, sr);
      } else {
        cox.drawImage(pB.el, x * sr, y * sr, sr, sr);
      }
    }
  }
  const id = requestAnimationFrame(draw);
}

function createCanvas(w, h) {
  const elCanvas = document.createElement("canvas");
  const ctx = elCanvas.getContext("2d");
  const r = window.devicePixelRatio;
  const wr = w * r;
  const hr = h * r;
  elCanvas.width = wr;
  elCanvas.height = hr;
  elCanvas.style.width = w + "px";
  elCanvas.style.height = h + "px";
  return {
    ctx: ctx,
    el: elCanvas,
    dpr: r
  };
}

function createPatternImage(s, lw, flip) {
  const canvas = createCanvas(s, s);
  const ctxCell = canvas.ctx;
  const sr = canvas.dpr * s;
  const l = lw / s / 2;
  const gr = ctxCell.createLinearGradient(0, 0, sr, sr);
  const stops = [0, l, 0.5 - l, 0.5 + l, 1 - l, 1];
  for (let i = 0; i < stops.length - 1; i++) {
    gr.addColorStop(stops[i], i % 2 ? colA : colB);
    gr.addColorStop(stops[i + 1], i % 2 ? colA : colB);
  }
  ctxCell.fillStyle = gr;
  if (flip) {
    ctxCell.transform(-1, 0, 0, 1, sr, 0);
  }
  ctxCell.fillRect(0, 0, sr, sr);
  return canvas;
}


