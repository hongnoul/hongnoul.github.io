(function () {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    // PNG is 128×10 native (8 frames × 16px each, displayed at 8× scale)
    // Frame 5 native: x=80, y=0, w=16, h=10 → scale to 64×40, center in 64×64
    ctx.drawImage(img, 80, 0, 16, 10, 0, 12, 64, 40);
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = canvas.toDataURL();
    document.head.appendChild(link);
  };
  img.src = '/truu.png';
})();
