const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

let positionX = 0;
let dragging = false;
let previousX = 0;
let lastTime = 0;

const autoSpeed = 0.025;

// Posiciones 3D de las ocho imágenes
const positions = [
  [-250, -100, 100],
  [100, -190, -120],
  [270, 30, 80],
  [-100, 160, -220],
  [40, 50, 240],
  [-300, 100, -80],
  [180, 180, -180],
  [-30, -230, 30]
];

// Tamaños relativos de cada fotografía
const sizes = [1, 0.8, 1.15, 0.9, 1.1, 0.85, 1, 0.95];

// Inclinación individual de las fotografías
const angles = [-8, 12, -5, 9, -12, 6, 15, -7];

// Distribuir las imágenes en el espacio 3D
photos.forEach((photo, i) => {
  const [x, y, z] = positions[i];

  photo.style.transform = `
    translate(-50%, -50%)
    translate3d(${x}px, ${y}px, ${z}px)
  `;

  const img = photo.querySelector("img");

  img.style.transform = `
    rotateZ(${angles[i]}deg)
    scale(${sizes[i]})
  `;

  img.draggable = false;
});

// Mover toda la nube sin alterar las posiciones individuales
function updateWorld() {
  world.style.transform = `
    translate3d(${positionX}px, 0, 0)
  `;
}

// Movimiento con el mouse
collage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  dragging = true;
  previousX = event.clientX;

  collage.classList.add("dragging");
  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", (event) => {
  if (!dragging) return;

  const dx = event.clientX - previousX;

  positionX += dx;
  previousX = event.clientX;

  updateWorld();
});

function stopDrag() {
  dragging = false;
  collage.classList.remove("dragging");
}

collage.addEventListener("pointerup", stopDrag);
collage.addEventListener("pointercancel", stopDrag);

collage.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

// Movimiento automático de toda la nube hacia la derecha
function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (!dragging) {
    positionX += autoSpeed * delta;
  }

  updateWorld();
  requestAnimationFrame(animate);
}

updateWorld();
requestAnimationFrame(animate);
