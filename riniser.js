const A4_ASPECT = Math.sqrt(2);

const downloadButton = document.getElementById("download-button");
const resolutionWarning = document.getElementById("resolution-warning");
const aspectWarning = document.getElementById("aspect-warning");
const labelCheckbox = document.getElementById("is-label");
const input = document.getElementById("image-input");
const output = document.getElementById("resized-image");
let previewUrl = null;

function toLabel(img) {
  const width = img.width;
  const height = img.height;
  let pageWidth = width * 2;
  let pageHeight = height * 2;

  if (pageHeight / pageWidth > A4_ASPECT) {
    pageWidth = pageHeight / A4_ASPECT;
  } else {
    pageHeight = pageWidth * A4_ASPECT;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageWidth);
  canvas.height = Math.round(pageHeight);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function toA4(img) {
  /* 150dpi should really be the minimum */
  const MIN_SMALL_SIDE = 1240;
  const MIN_LONG_SIDE = 1754;

  let width = img.width;
  let height = img.height;
  const image_aspect = Math.max(width, height) / Math.min(width, height);

  if (Math.abs(image_aspect - A4_ASPECT) > (A4_ASPECT / 10)) {
    aspectWarning.textContent = "⚠ Afbeelding is erg vervormd!";
    aspectWarning.style.display = "block";
  }

  let tooSmall = false;
  if (width < height) {
    height = Math.round(width * A4_ASPECT);
    tooSmall = width < MIN_SMALL_SIDE || height < MIN_LONG_SIDE;
  } else {
    width = Math.round(height * A4_ASPECT);
    tooSmall = width < MIN_LONG_SIDE || height < MIN_SMALL_SIDE;
  }

  if (tooSmall) {
    resolutionWarning.textContent = "⚠ Afbeelding is te klein!";
    resolutionWarning.style.display = "block";
  }


  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function resizeImage() {
  if (input.files.length !== 1) {
    console.log("resizeImage: no file?");
    return;
  }

  const isLabel = labelCheckbox.checked;

  resolutionWarning.style.display = "none";
  aspectWarning.style.display = "none";
  downloadButton.style.display = "none";
  output.style.borderStyle = isLabel ? "solid" : "none";

  const file = input.files[0];
  const img = new Image();

  img.onload = function () {
    let resizeHandler = isLabel ? toLabel : toA4;
    const canvas = resizeHandler(img);

    canvas.toBlob(blob => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      previewUrl = URL.createObjectURL(blob);
      output.src = previewUrl;

      downloadButton.onclick = function() {
        const a = document.createElement("a");
        a.href = previewUrl;

        const filename = file.name.replace(/\.[^.]+$/, "");
        const extension = file.name.split(".").pop();
        const newName = filename + "-A4." + extension;
        a.download = newName;
        a.click();
      }
      downloadButton.style.display = "block";
    });

    URL.revokeObjectURL(img.src);
  };

  img.src = URL.createObjectURL(file);
}

/* ---------------- wiring ---------------- */

input.addEventListener("change", resizeImage);
labelCheckbox.addEventListener("change", resizeImage);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
