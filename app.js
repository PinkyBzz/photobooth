const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const previewSection = document.getElementById('preview-section');
const cameraSection = document.getElementById('camera-section');
const previewCanvas = document.getElementById('preview-canvas');
const retakeBtn = document.getElementById('retake-btn');
const nextBtn = document.getElementById('next-btn');
const resultSection = document.getElementById('result-section');
const polaroidContainer = document.getElementById('polaroid-container');
const bgColorPicker = document.getElementById('bg-color-picker');
const downloadBtn = document.getElementById('download-btn');
const restartBtn = document.getElementById('restart-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn');

const ctx = previewCanvas.getContext('2d');

let photos = [];
let currentPhotoIndex = 0;
let stream = null;
let facingMode = 'environment'; // default to back camera

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function capturePhoto() {
  const width = video.videoWidth;
  const height = video.videoHeight;
  previewCanvas.width = width;
  previewCanvas.height = height;
  ctx.drawImage(video, 0, 0, width, height);
  const dataUrl = previewCanvas.toDataURL('image/png');
  return dataUrl;
}

function showPreview(photoDataUrl) {
  cameraSection.classList.add('hidden');
  previewSection.classList.remove('hidden');
  previewCanvas.width = previewCanvas.width; // clear canvas
  const img = new Image();
  img.onload = () => {
    previewCanvas.width = img.width;
    previewCanvas.height = img.height;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = photoDataUrl;
}

function showCamera() {
  previewSection.classList.add('hidden');
  cameraSection.classList.remove('hidden');
}

function showResult() {
  previewSection.classList.add('hidden');
  cameraSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  renderPolaroids();
}

function renderPolaroids() {
  polaroidContainer.innerHTML = '';
  const bgColor = bgColorPicker.value;
  polaroidContainer.style.backgroundColor = bgColor;

  // Arrange 4 photos in a neat 2x2 grid with no rotation
  photos.forEach((photo, i) => {
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';
    // No absolute positioning or rotation
    const img = document.createElement('img');
    img.src = photo;
    img.alt = `Photo ${i + 1}`;
    polaroid.appendChild(img);
    polaroidContainer.appendChild(polaroid);
  });
}

function downloadResult() {
  // Compose final image with background and photos arranged in neat 2x2 grid with subtle shadow and preserved aspect ratio
  const canvas = document.createElement('canvas');
  const width = 360;
  const height = 400;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  // Background color
  context.fillStyle = bgColorPicker.value;
  context.fillRect(0, 0, width, height);

  // Photo max size and margin
  const maxPhotoWidth = 160;
  const maxPhotoHeight = 200;
  const margin = 15;

  photos.forEach((photo, i) => {
    const img = new Image();
    img.src = photo;
    img.onload = () => {
      const x = (i % 2) * (maxPhotoWidth + margin) + margin;
      const y = Math.floor(i / 2) * (maxPhotoHeight + margin) + margin;

      // Calculate aspect ratio to fit inside max dimensions
      let drawWidth = img.width;
      let drawHeight = img.height;
      const aspectRatio = img.width / img.height;

      if (drawWidth > maxPhotoWidth) {
        drawWidth = maxPhotoWidth;
        drawHeight = drawWidth / aspectRatio;
      }
      if (drawHeight > maxPhotoHeight) {
        drawHeight = maxPhotoHeight;
        drawWidth = drawHeight * aspectRatio;
      }

      // Center photo inside polaroid border area
      const borderSize = 8;
      const borderX = x - borderSize / 2;
      const borderY = y - borderSize / 2;
      const borderWidth = maxPhotoWidth + borderSize;
      const borderHeight = maxPhotoHeight + borderSize;

      // Draw subtle shadow for separation instead of white border
      context.shadowColor = 'rgba(0,0,0,0.15)';
      context.shadowBlur = 8;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;

      // Draw photo background (same as bg color) to blend with canvas
      context.fillStyle = bgColorPicker.value;
      context.fillRect(borderX, borderY, borderWidth, borderHeight);

      // Draw photo centered inside border
      const photoX = borderX + (borderWidth - drawWidth) / 2;
      const photoY = borderY + (borderHeight - drawHeight) / 2;
      context.drawImage(img, photoX, photoY, drawWidth, drawHeight);

      // Reset shadow for next draw
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      // After last image loaded, trigger download
      if (i === photos.length - 1) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = 'photobooth.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }, 100);
      }
    };
  });
}

function resetApp() {
  photos = [];
  currentPhotoIndex = 0;
  resultSection.classList.add('hidden');
  showCamera();
  startCamera();
}

captureBtn.addEventListener('click', () => {
  const photo = capturePhoto();
  photos[currentPhotoIndex] = photo;
  showPreview(photo);
});

retakeBtn.addEventListener('click', () => {
  showCamera();
});

nextBtn.addEventListener('click', () => {
  currentPhotoIndex++;
  if (currentPhotoIndex < 4) {
    showCamera();
  } else {
    stopCamera();
    showResult();
  }
});

bgColorPicker.addEventListener('input', () => {
  polaroidContainer.style.backgroundColor = bgColorPicker.value;
});

downloadBtn.addEventListener('click', () => {
  downloadResult();
});

restartBtn.addEventListener('click', () => {
  resetApp();
});

switchCameraBtn.addEventListener('click', async () => {
  if (facingMode === 'environment') {
    facingMode = 'user';
  } else {
    facingMode = 'environment';
  }
  stopCamera();
  await startCamera();
});

window.addEventListener('load', () => {
  startCamera();
});
