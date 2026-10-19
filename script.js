const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

// ==================================
// CONFIGURACIÓN DE LA NUBE 3D
// ==================================

let rotation = { x: 0, y: 0, z: 0, w: 1 };

let dragging = false;
let previousX = 0;
let previousY = 0;
let lastTime = 0;

let velocityX = 0;
let velocityY = 0;

// Velocidad de giro automático hacia la derecha
const autoSpeed = 0.00022;

// Posiciones tridimensionales alrededor del centro
const positions = [
  [-210, -110, 80],
  [-65, -205, -100],
  [150, -155, 100],
  [220, 20, -100],
  [100, 175, 130],
  [-130, 175, -130],
  [-235, 35, -100],
  [0, 20, 240]
];

// Escalas y pequeñas inclinaciones visuales
const sizes = [1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6];

const angles = [0, 0, 0, 0, 0, 0, 0, 0];

// ==================================
// FUNCIONES DE ROTACIÓN 3D
// ==================================

function multiply(a, b) {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  };
}

function axisRotation(axis, angle) {
  const half = angle / 2;
  const s = Math.sin(half);

  return {
    w: Math.cos(half),
    x: axis === "x" ? s : 0,
    y: axis === "y" ? s : 0,
    z: axis === "z" ? s : 0
  };
}

function normalize(q) {
  const length = Math.hypot(q.x, q.y, q.z, q.w);

  q.x /= length;
  q.y /= length;
  q.z /= length;
  q.w /= length;

  return q;
}

function rotateWorld(horizontal, vertical) {
  const yaw = axisRotation("y", horizontal);
  const pitch = axisRotation("x", vertical);

  rotation = multiply(yaw, rotation);
  rotation = multiply(rotation, pitch);

  normalize(rotation);
}

// Convierte un cuaternión en una rotación CSS
function quaternionToCSS(q) {
  const w = Math.max(-1, Math.min(1, q.w));
  const angle = 2 * Math.acos(w);
  const sinHalf = Math.sqrt(1 - w * w);

  if (sinHalf < 0.00001) {
    return "rotate3d(0, 1, 0, 0rad)";
  }

  const x = q.x / sinHalf;
  const y = q.y / sinHalf;
  const z = q.z / sinHalf;

  return `rotate3d(${x}, ${y}, ${z}, ${angle}rad)`;
}

// ==================================
// PREPARAR LAS FOTOGRAFÍAS
// ==================================

photos.forEach((photo, i) => {
  const [x, y, z] = positions[i];

  const img = photo.querySelector("img");

  photo.style.transform = `
    translate(-50%, -50%)
    translate3d(${x}px, ${y}px, ${z}px)
  `;

  img.style.transform = `
    rotateZ(${angles[i]}deg)
    scale(${sizes[i]})
  `;

  img.draggable = false;
  img.addEventListener("dragstart", event => {
    event.preventDefault();
  });
});

// ==================================
// ACTUALIZAR LA NUBE
// ==================================

function updateWorld() {
  // Rotación completa del conjunto
  world.style.transform = quaternionToCSS(rotation);

  // Rotación inversa de cada fotografía:
  // así siempre mira de frente a la cámara.
  const inverseRotation = {
    x: -rotation.x,
    y: -rotation.y,
    z: -rotation.z,
    w: rotation.w
  };

  const billboardRotation = quaternionToCSS(inverseRotation);

  photos.forEach((photo, i) => {
    const [x, y, z] = positions[i];

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${x}px, ${y}px, ${z}px)
      ${billboardRotation}
    `;
  });
}

// ==================================
// CONTROL CON EL MOUSE
// ==================================

collage.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;

  dragging = true;

  previousX = event.clientX;
  previousY = event.clientY;

  velocityX = 0;
  velocityY = 0;

  collage.classList.add("dragging");
  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", event => {
  if (!dragging) return;

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const horizontal = dx * 0.005;
  const vertical = dy * 0.005;

  rotateWorld(horizontal, vertical);

  velocityX = horizontal * 0.12;
  velocityY = vertical * 0.12;

  previousX = event.clientX;
  previousY = event.clientY;

  updateWorld();
});

function stopDrag() {
  dragging = false;
  collage.classList.remove("dragging");
}

collage.addEventListener("pointerup", stopDrag);
collage.addEventListener("pointercancel", stopDrag);

collage.addEventListener("dragstart", event => {
  event.preventDefault();
});

// ==================================
// ANIMACIÓN AUTOMÁTICA
// ==================================

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (!dragging) {
    // Giro automático hacia la derecha
    rotateWorld(autoSpeed * delta, 0);

    // Inercia del movimiento del mouse
    if (velocityX !== 0 || velocityY !== 0) {
      rotateWorld(velocityX, velocityY);

      velocityX *= 0.96;
      velocityY *= 0.96;

      if (Math.abs(velocityX) < 0.00001) velocityX = 0;
      if (Math.abs(velocityY) < 0.00001) velocityY = 0;
    }
  }

  updateWorld();
  requestAnimationFrame(animate);
}

updateWorld();
requestAnimationFrame(animate);
