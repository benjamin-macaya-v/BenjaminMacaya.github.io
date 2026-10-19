const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

let positionX = 0;
let dragging = false;
let previousX = 0;
let lastTime = 0;

const autoSpeed = 0.012;

// Distribución de la nube 3D
const positions = [
  [-170, -100, 80],
  [0, -170, -100],
  [170, -90, 60],
  [-190, 80, -100],
  [0, 60, 150],
  [180, 100, -80],
  [-80, 180, -160],
  [100, 190, 30]
];

const sizes = [0.9, 0.8, 1, 0.85, 1.1, 0.9, 0.8, 0.95];

const angles = [-8, 10, -5, 8, -10, 6, 12, -7];

// Crear la distribución
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

// Movimiento del conjunto
function updateWorld() {
  world.style.transform = `
    translate3d(${positionX}px, 0, 0)
  `;
}

// Arrastrar con el mouse
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

// Evitar arrastrar las imágenes individualmente
collage.addEventListener("dragstart", event => {
  event.preventDefault();
});

// Movimiento automático
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
