function resizeImage() {
  const MIN_WIDTH = 1240;
  const MIN_HEIGHT = 1754;

  const input = document.getElementById("image-input");
  const output = document.getElementById("resized-image");
  const downloadButton = document.getElementById("download-button");

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
      document.getElementById("resolution-warning").textContent =
        "⚠ Afbeelding is eigenlijk te klein om te printen!";
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
  };

  img.src = URL.createObjectURL(file);
}

/* ---------------- wiring ---------------- */

document.getElementById("image-input").addEventListener("change", resizeImage);

/*
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
*/
