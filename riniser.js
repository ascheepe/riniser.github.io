function resizeImage() {
  /* 150dpi should really be the minimum */
  const MIN_WIDTH = 1240;
  const MIN_HEIGHT = 1754;

  const input = document.getElementById("image-input");
  const output = document.getElementById("resized-image");
  const downloadButton = document.getElementById("download-button");
  const resolutionWarning = document.getElementById("resolution-warning");
  const aspectWarning = document.getElementById("aspect-warning");

  downloadButton.style.display = "none";
  resolutionWarning.style.display = "none";
  aspectWarning.style.display = "none";

  if (input.files.length !== 1) {
    console.log("resizeImage: no file?");
    return;
  }

  const file = input.files[0];
  const img = new Image();

  img.onload = function () {
    const A4_ASPECT = Math.sqrt(2);

    let width = img.width;
    let height = img.height;

    let image_aspect = 0;
    if (width < height) {
      image_aspect = height / width;
    } else {
      image_aspect = width / height;
    }

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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
