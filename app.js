const configDefault = {
  pixelSize: 30,
  lineWidth: 10,
  colB: "#d87312",
  colA: "#262626",
  threshold: 0.3,
  neighbohrs: 3,
  frames: 6,
};

export class LabShad {
  constructor(config) {
    const lab = this;
    lab.draw = lab.draw.bind(lab);
    lab.config = config || {};
    Object.assign(lab.config, configDefault, config);
    lab.init();
    lab.update();
    lab.stream().catch(console.warn);
  }

  async stream() {
    const lab = this;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: 1,
      audio: 0,
    });
    lab.elVideo.srcObject = stream;
    lab.elVideo.addEventListener("canplay", lab.draw, false);
    lab.elVideo.play();
  }

  init() {
    const lab = this;
    lab.elVideo = document.createElement("video");
    lab.elVideo.crossOrigin = "Anonymous";
    lab.elVideo.loop = true;
    lab.elCanvas = document.createElement("canvas");
    lab.elStore = document.createElement("canvas");
    document.body.appendChild(lab.elCanvas);

    lab._frameWindow = []; // Store the frames in the moving window
    lab.prevImage = null; // Store the previous state/image
  }

  update() {
    const lab = this;
    const rect = document.body.getBoundingClientRect();
    lab.s = lab.config.pixelSize;
    lab.lw = lab.config.lineWidth;
    lab.w = Math.ceil(rect.width / lab.s) * lab.s;
    lab.h = Math.ceil(rect.height / lab.s) * lab.s;
    lab.ws = lab.w / lab.s;
    lab.hs = lab.h / lab.s;
    lab.pA = lab.createPatternImage(lab.s, lab.lw, false);
    lab.pB = lab.createPatternImage(lab.s, lab.lw, true);
    lab.sr = lab.dpr * lab.s;
    lab.elVideo.height = lab.hs;
    lab.elVideo.width = lab.ws;
    lab.setCanvasDim(lab.elCanvas, lab.w, lab.h);
    lab.setCanvasDim(lab.elStore, lab.w, lab.h);
  }

  _averagePixelWithNeighbors(data, x, y, ws) {
    const lab = this;
    let sum = 0;
    let count = 0;
    let to = lab.config.neighbohrs;
    let from = to * -1;
    for (let i = from; i <= to; i++) {
      for (let j = from; j <= to; j++) {
        if (x + i >= 0 && x + i < ws && y + j >= 0 && y + j < lab.hs) {
          const p = 4 * (x + i) + 4 * (y + j) * ws;
          sum += data[p] / 255;
          count++;
        }
      }
    }
    return sum / count;
  }

  draw() {
    const lab = this;
    const {
      elCanvas,
      elStore,
      elVideo,
      ws,
      hs,
      w,
      h,
      sr,
      pA,
      pB,
      config,
      _frameWindow,
    } = lab;

    const cox = elCanvas.getContext("2d", { willReadFrequently: true });
    const cx = elStore.getContext("2d", { willReadFrequently: true });

    cx.drawImage(elVideo, 0, 0, ws, hs);

    const dt = cx.getImageData(0, 0, ws, hs).data;
    _frameWindow.push(dt);

    // If we don't have enough frames yet, return
    if (_frameWindow.length < config.frames) {
      requestAnimationFrame(lab.draw);
      return;
    }

    const lowerThreshold = config.threshold - 0.05; // adjust as needed
    const upperThreshold = config.threshold + 0.05; // adjust as needed

    cox.clearRect(0, 0, w, h);

    for (let y = 0; y < hs; y++) {
      for (let x = 0; x < ws; x++) {
        let total = 0;

        // Calculate average over the temporal window
        for (let i = 0; i < config.frames; i++) {
          total += lab._averagePixelWithNeighbors(_frameWindow[i], x, y, ws);
        }

        const avgValue = total / config.frames;

        if (avgValue > upperThreshold) {
          lab.prevImage = pA.el;
        } else if (avgValue < lowerThreshold) {
          lab.prevImage = pB.el;
        }

        cox.drawImage(lab.prevImage, x * sr, y * sr, sr, sr);
      }
    }

    // Remove the oldest frame from the buffer
    _frameWindow.shift();

    requestAnimationFrame(lab.draw);
  }

  draw_o() {
    const lab = this;
    const { elCanvas, elStore, elVideo, ws, hs, w, h, sr, pA, pB, config } =
      lab;
    const cox = elCanvas.getContext("2d");
    const cx = elStore.getContext("2d");
    cx.drawImage(elVideo, 0, 0, ws, hs);
    const dt = cx.getImageData(0, 0, ws, hs).data;
    const threshold = config.threshold;
    cox.clearRect(0, 0, w, h);
    let img, t;
    for (let y = 0; y < hs; y++) {
      for (let x = 0; x < ws; x++) {
        t = lab._averagePixelWithNeighbors(dt, x, y, ws);
        img = t > threshold ? pA.el : pB.el;
        cox.drawImage(img, x * sr, y * sr, sr, sr);
      }
    }
    requestAnimationFrame(lab.draw);
  }

  get dpr() {
    return window.devicePixelRatio;
  }

  setCanvasDim(c, w, h) {
    const lab = this;
    c.width = w * lab.dpr;
    c.height = h * lab.dpr;
    c.style.width = w + "px";
    c.style.height = h + "px";
  }

  createCanvas(w, h) {
    const lab = this;
    const elCanvas = document.createElement("canvas");
    const ctx = elCanvas.getContext("2d");
    lab.setCanvasDim(elCanvas, w, h);
    return {
      ctx: ctx,
      el: elCanvas,
    };
  }

  createPatternImage(s, lw, flip) {
    const lab = this;
    const canvas = lab.createCanvas(s, s);
    const ctxCell = canvas.ctx;
    const sr = lab.dpr * s;
    const l = lw / s / 2;
    const gr = ctxCell.createLinearGradient(0, 0, sr, sr);
    const stops = [0, l, 0.5 - l, 0.5 + l, 1 - l, 1];
    for (let i = 0; i < stops.length - 1; i++) {
      gr.addColorStop(stops[i], i % 2 ? lab.config.colA : lab.config.colB);
      gr.addColorStop(stops[i + 1], i % 2 ? lab.config.colA : lab.config.colB);
    }
    ctxCell.fillStyle = gr;
    if (flip) {
      ctxCell.transform(-1, 0, 0, 1, sr, 0);
    }
    ctxCell.fillRect(0, 0, sr, sr);
    return canvas;
  }
}
