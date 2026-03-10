const downloadButton = document.getElementById("download-button");
const noFileError = document.getElementById("no-file-error");
const labelCheckbox = document.getElementById("is-label");
const input = document.getElementById("image-input");
const output = document.getElementById("resized-image");
let previewUrl = null;

function a4scale(width, height) {
  const A4_ASPECT = Math.sqrt(2);

  if (width >= height) {
    // landscape
    if (height / width > A4_ASPECT) {
      width = Math.round(height * A4_ASPECT);
    } else {
      height = Math.round(width / A4_ASPECT);
    }
  } else {
    // portrait
    if (height / width > A4_ASPECT) {
      height = Math.round(width * A4_ASPECT);
    } else {
      width = Math.round(height / A4_ASPECT);
    }
  }

  return { width: width, height: height };
}

function toLabel(img) {
  const { width, height } = a4scale(img.width, img.height);

  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function toA4(img) {
  const { width, height } = a4scale(img.width, img.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function resizeImage() {
  noFileError.style.display = "none";
  downloadButton.style.display = "none";

  if (input.files.length !== 1) {
    noFileError.textContent = "⚠ Selecteer een afbeelding!";
    noFileError.style.display = "block";
    return;
  }

  const isLabel = labelCheckbox.checked;
  output.style.borderStyle = isLabel ? "solid" : "none";

  const file = input.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = function () {
    const canvas = isLabel ? toLabel(img) : toA4(img);

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
}

input.addEventListener("change", resizeImage);
labelCheckbox.addEventListener("change", resizeImage);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
