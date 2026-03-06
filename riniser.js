function resizeImage() {
  /* 150dpi should really be the minimum */
  const MIN_WIDTH = 1240;
  const MIN_HEIGHT = 1754;

  const input = document.getElementById("image-input");
  const output = document.getElementById("resized-image");
  const downloadButton = document.getElementById("download-button");
  const resolutionWarning = document.getElementById("resolution-warning");

  downloadButton.style.display = "none";

  if (input.files.length !== 1) {
    console.log("resizeImage: no file?");
    return;
  }

  const file = input.files[0];
  const img = new Image();

  img.onload = function () {
    const A4_RATIO = Math.sqrt(2);

    let width = img.width;
    let height = img.height;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      var quality = 0;
      if (width < MIN_WIDTH) {
        quality = Math.round(100 * width / MIN_WIDTH);
      } else {
        quality = Math.round(100 * height / MIN_HEIGHT);
      }
      resolutionWarning.textContent =
        "⚠ Afbeelding is eigenlijk te klein om te printen! (" + quality + "% ok)";
    } else {
      resolutionWarning.textContent = "";
    }

    if (width < height) {
      height = Math.round(width * A4_RATIO);
    } else {
      width = Math.round(height * A4_RATIO);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const dataURL = canvas.toDataURL(file.type);
    output.src = dataURL;

    downloadButton.onclick = function() {
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "resized-image";
      a.click();
    }

    downloadButton.style.display = "inline-block";

    URL.revokeObjectURL(img.src);
  };

  img.src = URL.createObjectURL(file);
}

/* ---------------- wiring ---------------- */

document.getElementById("image-input").addEventListener("change", resizeImage);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
