const fileInput = document.querySelector("#fileInput");
const ratioSelect = document.querySelector("#ratioSelect");
const printSize = document.querySelector("#printSize");
const canvas = document.querySelector("#canvas");
const wrap = document.querySelector("#canvasWrap");
const frame = document.querySelector("#cropFrame");
const sizeInfo = document.querySelector("#sizeInfo");
const resetButton = document.querySelector("#resetButton");
const downloadButton = document.querySelector("#downloadButton");
const printButton = document.querySelector("#printButton");

const ctx = canvas.getContext("2d");
let image = null;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let startPointer = null;
let pinch = null;

function getRatio() {
  const [w, h] = ratioSelect.value.split("/").map(Number);
  return w / h;
}

function updateFrame() {
  const r = getRatio();
  const wrapRatio = wrap.clientWidth / wrap.clientHeight;

  // The frame is always the same ratio. Its size can be changed with the
  // handles without ever changing that ratio.
  if (r >= wrapRatio) {
    frame.style.width = "80%";
    frame.style.height = `${80 * wrapRatio / r}%`;
  } else {
    frame.style.height = "80%";
    frame.style.width = `${80 * r / wrapRatio}%`;
  }

  draw();
  updateInfo();
}

function updateInfo() {
  if (!image) {
    sizeInfo.textContent = "Kies een foto.";
    return;
  }

  const [w, h] = printSize.value.split("x").map(Number);
  sizeInfo.textContent =
    `Kader: ${ratioSelect.options[ratioSelect.selectedIndex].text} · ` +
    `printformaat: ${w} × ${h} mm · zonder witte randen`;
}

function fitImage() {
  if (!image) return;
  const cw = wrap.clientWidth;
  const ch = wrap.clientHeight;

  scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight);
  offsetX = (cw - image.naturalWidth * scale) / 2;
  offsetY = (ch - image.naturalHeight * scale) / 2;
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const cw = wrap.clientWidth;
  const ch = wrap.clientHeight;

  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  if (image) {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      image.naturalWidth * scale,
      image.naturalHeight * scale
    );
  }
}

function frameRect() {
  const a = frame.getBoundingClientRect();
  const b = wrap.getBoundingClientRect();
  return {
    x: a.left - b.left,
    y: a.top - b.top,
    width: a.width,
    height: a.height
  };
}

function cropCanvas() {
  const r = frameRect();

  const sourceX = (r.x - offsetX) / scale;
  const sourceY = (r.y - offsetY) / scale;
  const sourceW = r.width / scale;
  const sourceH = r.height / scale;

  // Use the original pixels wherever possible. This avoids unnecessarily
  // reducing a high-resolution phone photo.
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sourceW));
  out.height = Math.max(1, Math.round(sourceH));

  const outCtx = out.getContext("2d");
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(
    image,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, out.width, out.height
  );

  return out;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  image = new Image();

  image.onload = () => {
    fitImage();
    updateFrame();
    resetButton.disabled = false;
    downloadButton.disabled = false;
    printButton.disabled = false;
    URL.revokeObjectURL(url);
  };

  image.src = url;
});

ratioSelect.addEventListener("change", updateFrame);
printSize.addEventListener("change", updateInfo);

resetButton.addEventListener("click", () => {
  fitImage();
  draw();
});

downloadButton.addEventListener("click", () => {
  if (!image) return;

  cropCanvas().toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uitsnede.jpg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/jpeg", 0.95);
});

printButton.addEventListener("click", () => {
  if (!image) return;

  const crop = cropCanvas();
  const data = crop.toDataURL("image/jpeg", 0.95);
  const [w, h] = printSize.value.split("x");

  const win = window.open("", "_blank");
  if (!win) {
    alert("De browser blokkeerde het printvenster. Sta pop-ups toe voor deze site.");
    return;
  }

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Foto printen</title>
      <style>
        @page { size: ${w}mm ${h}mm; margin: 0; }
        html, body { margin: 0; padding: 0; width: ${w}mm; height: ${h}mm; }
        img { display: block; width: ${w}mm; height: ${h}mm; }
      </style>
    </head>
    <body>
      <img src="${data}" alt="">
      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);
  win.document.close();
});

// Mouse / one-finger dragging.
wrap.addEventListener("pointerdown", event => {
  if (!image) return;
  if (event.pointerType === "touch" && pinch) return;

  dragging = true;
  wrap.setPointerCapture(event.pointerId);
  startPointer = {
    x: event.clientX,
    y: event.clientY,
    offsetX,
    offsetY
  };
});

wrap.addEventListener("pointermove", event => {
  if (!dragging || !image) return;

  offsetX = startPointer.offsetX + event.clientX - startPointer.x;
  offsetY = startPointer.offsetY + event.clientY - startPointer.y;
  draw();
});

wrap.addEventListener("pointerup", () => {
  dragging = false;
});

wrap.addEventListener("pointercancel", () => {
  dragging = false;
});

// Mouse wheel zoom.
wrap.addEventListener("wheel", event => {
  if (!image) return;
  event.preventDefault();

  const oldScale = scale;
  scale *= event.deltaY < 0 ? 1.05 : 0.95;
  zoomAround(
    event.clientX - wrap.getBoundingClientRect().left,
    event.clientY - wrap.getBoundingClientRect().top,
    oldScale
  );
}, { passive: false });

function zoomAround(mx, my, oldScale) {
  offsetX = mx - (mx - offsetX) * (scale / oldScale);
  offsetY = my - (my - offsetY) * (scale / oldScale);
  draw();
}

// Two-finger pinch zoom + pan.
wrap.addEventListener("touchstart", event => {
  if (!image || event.touches.length !== 2) return;
  event.preventDefault();

  const a = event.touches[0];
  const b = event.touches[1];
  const center = {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  };

  pinch = {
    distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    scale,
    center,
    offsetX,
    offsetY
  };
}, { passive: false });

wrap.addEventListener("touchmove", event => {
  if (!image || event.touches.length !== 2 || !pinch) return;
  event.preventDefault();

  const a = event.touches[0];
  const b = event.touches[1];
  const center = {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  };

  const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const oldScale = scale;
  scale = Math.max(0.05, pinch.scale * distance / pinch.distance);

  const rect = wrap.getBoundingClientRect();
  const cx = pinch.center.x - rect.left;
  const cy = pinch.center.y - rect.top;

  // Zoom around the pinch center, then follow the movement of the center.
  offsetX = cx - (cx - pinch.offsetX) * (scale / oldScale)
    + (center.x - pinch.center.x);
  offsetY = cy - (cy - pinch.offsetY) * (scale / oldScale)
    + (center.y - pinch.center.y);

  draw();
}, { passive: false });

wrap.addEventListener("touchend", event => {
  if (event.touches.length < 2) pinch = null;
}, { passive: true });


// Resize the crop frame from its corners while preserving its exact ratio.
// The frame itself never changes ratio; only its scale and position change.
document.querySelectorAll(".corner").forEach(handle => {
  handle.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();

    const rect = frame.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left - wrapRect.left,
      top: rect.top - wrapRect.top,
      width: rect.width,
      height: rect.height
    };

    const r = getRatio();
    const corner = handle.className.split(" ")[1];

    function move(e) {
      let width;

      if (corner === "br") {
        width = start.width + (e.clientX - start.x);
      } else if (corner === "bl") {
        width = start.width - (e.clientX - start.x);
      } else if (corner === "tr") {
        width = start.width + (e.clientX - start.x);
      } else {
        width = start.width - (e.clientX - start.x);
      }

      width = Math.max(60, Math.min(wrap.clientWidth, width));
      const height = width / r;

      let left = start.left;
      let top = start.top;

      if (corner === "bl" || corner === "tl") {
        left = start.left + start.width - width;
      }
      if (corner === "tl" || corner === "tr") {
        top = start.top + start.height - height;
      }

      // Keep the frame inside the workspace.
      left = Math.max(0, Math.min(wrap.clientWidth - width, left));
      top = Math.max(0, Math.min(wrap.clientHeight - height, top));

      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      frame.style.left = `${left + width / 2}px`;
      frame.style.top = `${top + height / 2}px`;
      frame.style.transform = "translate(-50%, -50%)";
      draw();
    }

    function stop() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  });
});

window.addEventListener("resize", () => {
  if (image) updateFrame();
});

updateFrame();
