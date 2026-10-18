const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo")];

let rotationY = -15;
let rotationX = -5;

let velocityY = 0;
let velocityX = 0;

let dragging = false;
let lastX = 0;
let lastY = 0;

// Generador de valores aleatorios reproducibles
function random(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

// Crear la nube orbital
function arrangePhotos() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const radiusX = Math.min(width * 0.27, 350);
  const radiusY = Math.min(height * 0.25, 210);

  photos.forEach((photo, i) => {
    const angle = (i / photos.length) * Math.PI * 2;

    // Distribución irregular
    const x = Math.cos(angle) * radiusX
      + (random(i + 20) - 0.5) * 170;

    const y = Math.sin(angle) * radiusY
      + (random(i + 40) - 0.5) * 130;

    // Profundidad
    const z = (random(i + 70) - 0.5) * 500;

    // Diferentes tamaños
    const size = 0.75 + random(i + 100) * 0.65;

    const tilt = (random(i + 150) - 0.5) * 25;
    const turn = (random(i + 180) - 0.5) * 30;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${x}px, ${y}px, ${z}px)
      rotateY(${turn}deg)
      rotateZ(${tilt}deg)
      scale(${size})
    `;

    photo.style.zIndex = Math.round(z + 500);
  });
}

    photo.style.zIndex = Math.round(z + 500);
  });
}

arrangePhotos();

window.addEventListener("resize", arrangePhotos);

// Movimiento del mundo
function updateWorld() {
  world.style.transform = `
    rotateX(${rotationX}deg)
    rotateY(${rotationY}deg)
  `;
}

updateWorld();

// Arrastrar el espacio
collage.addEventListener("pointerdown", (event) => {
  dragging = true;

  lastX = event.clientX;
  lastY = event.clientY;

  velocityX = 0;
  velocityY = 0;

  collage.classList.add("dragging");
  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", (event) => {
  if (!dragging) return;

  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;

  rotationY += dx * 0.35;
  rotationX -= dy * 0.25;

  rotationX = Math.max(-75, Math.min(75, rotationX));

  velocityY = dx * 0.12;
  velocityX = -dy * 0.08;

  lastX = event.clientX;
  lastY = event.clientY;

  updateWorld();
});

function stopDragging() {
  dragging = false;
  collage.classList.remove("dragging");
}

collage.addEventListener("pointerup", stopDragging);
collage.addEventListener("pointercancel", stopDragging);

// Inercia
function animate() {
  if (!dragging) {
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= 0.95;
    velocityX *= 0.95;

    if (Math.abs(velocityY) < 0.005) velocityY = 0;
    if (Math.abs(velocityX) < 0.005) velocityX = 0;

    updateWorld();
  }

  requestAnimationFrame(animate);
}

animate();
