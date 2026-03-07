function toLabel(img) {
  const canvas = document.createElement("canvas");

  const width = img.width;
  const height = img.height;

  if (width > height) {
    canvas.height = img.height * 2;
    canvas.width = Math.round(img.width * 2 * Math.sqrt(2));
  } else {
    canvas.width = img.width * 2;
    canvas.height = Math.round(img.height * 2 * Math.sqrt(2));
  }

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function toA4(img) {
  /* 150dpi should really be the minimum */
  const MIN_WIDTH = 1240;
  const MIN_HEIGHT = 1754;
  const A4_ASPECT = Math.sqrt(2);

  const resolutionWarning = document.getElementById("resolution-warning");
  const aspectWarning = document.getElementById("aspect-warning");

  let width = img.width;
  let height = img.height;
  let image_aspect = Math.max(width, height) / Math.min(width, height);

  if (Math.abs(image_aspect - A4_ASPECT) > (A4_ASPECT / 10)) {
    aspectWarning.textContent = "⚠ Afbeelding is erg vervormd!";
    aspectWarning.style.display = "block";
  }

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    resolutionWarning.textContent = "⚠ Afbeelding is veel te klein!";
    resolutionWarning.style.display = "block";
  }

  if (width < height) {
    height = Math.round(width * A4_ASPECT);
  } else {
    width = Math.round(height * A4_ASPECT);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function resizeImage() {
  const input = document.getElementById("image-input");
  const output = document.getElementById("resized-image");
  const isLabel = document.getElementById("is-label").checked;
  const downloadButton = document.getElementById("download-button");
  const resolutionWarning = document.getElementById("resolution-warning");
  const aspectWarning = document.getElementById("aspect-warning");

  resolutionWarning.style.display = "none";
  aspectWarning.style.display = "none";
  downloadButton.style.display = "none";

  if (input.files.length !== 1) {
    console.log("resizeImage: no file?");
    return;
  }

  const file = input.files[0];
  const img = new Image();

  img.onload = function () {
    let resizeHandler;
    if (isLabel) {
      resizeHandler = toLabel;
    } else {
      resizeHandler = toA4;
    }

    const canvas = resizeHandler(img);
    const dataURL = canvas.toDataURL(file.type);
    output.src = dataURL;

    downloadButton.onclick = function() {
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "resized-image";
      a.click();
    }
    downloadButton.style.display = "block";

    URL.revokeObjectURL(img.src);
  };

  img.src = URL.createObjectURL(file);
}

/* ---------------- wiring ---------------- */

document.getElementById("image-input").addEventListener("change", resizeImage);
document.getElementById("is-label").addEventListener("change", resizeImage);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
