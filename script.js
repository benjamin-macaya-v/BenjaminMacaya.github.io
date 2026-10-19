const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

let rotation = { x: 0, y: 0, z: 0, w: 1 };

let velocityX = 0;
let velocityY = 0;

let dragging = false;
let previousX = 0;
let previousY = 0;

let elapsed = 0;
let lastTime = 0;

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

const sizes = [1, 0.8, 1.15, 0.9, 1.1, 0.85, 1, 0.95];
const angles = [-8, 12, -5, 9, -12, 6, 15, -7];

// Movimiento orbital independiente
const orbitData = photos.map((photo, i) => ({
  radiusX: 18 + (i % 3) * 12,
  radiusY: 15 + (i % 4) * 10,
  radiusZ: 20 + (i % 3) * 12,
  speed: 0.00012 + i * 0.000025,
  phase: i * 1.3
}));

function multiply(a, b) {
  return {
    w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
    x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
    y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
    z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w
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

function rotateWorld(dx, dy) {
  const horizontal = axisRotation("y", dx);
  const vertical = axisRotation("x", dy);

  rotation = multiply(horizontal, rotation);
  rotation = multiply(rotation, vertical);

  const length = Math.hypot(
    rotation.x, rotation.y, rotation.z, rotation.w
  );

  rotation.x /= length;
  rotation.y /= length;
  rotation.z /= length;
  rotation.w /= length;
}

// Preparar fotografías
photos.forEach((photo, i) => {
  photo.style.zIndex = Math.round(positions[i][2] + 500);

  const img = photo.querySelector("img");

  img.style.transform = `
    rotateZ(${angles[i]}deg)
    scale(${sizes[i]})
  `;

  img.draggable = false;
  img.addEventListener("dragstart", e => e.preventDefault());
});

// Actualizar universo y fotografías
function updateWorld() {
  const { x, y, z, w } = rotation;

  world.style.transform = `
    matrix3d(
      ${1-2*(y*y+z*z)}, ${2*(x*y+z*w)}, ${2*(x*z-y*w)}, 0,
      ${2*(x*y-z*w)}, ${1-2*(x*x+z*z)}, ${2*(y*z+x*w)}, 0,
      ${2*(x*z+y*w)}, ${2*(y*z-x*w)}, ${1-2*(x*x+y*y)}, 0,
      0, 0, 0, 1
    )
  `;

  photos.forEach((photo, i) => {
    const [px, py, pz] = positions[i];
    const orbit = orbitData[i];

    const t = elapsed * orbit.speed + orbit.phase;

    const x = px + Math.cos(t) * orbit.radiusX;
    const y = py + Math.sin(t) * orbit.radiusY;
    const z = pz + Math.sin(t * 0.7) * orbit.radiusZ;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${x}px, ${y}px, ${z}px)
      rotate3d(${rotation.x}, ${rotation.y}, ${rotation.z}, ${2*Math.acos(rotation.w)}rad)
    `;
  });
}

// Arrastrar universo
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

  velocityX = vertical * 0.12;
  velocityY = horizontal * 0.12;

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

collage.addEventListener("selectstart", e => e.preventDefault());
collage.addEventListener("dragstart", e => e.preventDefault());

// Animación continua
function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  elapsed += delta;

  if (!dragging) {
    rotateWorld(velocityY, velocityX);

    velocityX *= 0.96;
    velocityY *= 0.96;

    if (Math.abs(velocityX) < 0.00001) velocityX = 0;
    if (Math.abs(velocityY) < 0.00001) velocityY = 0;
  }

  updateWorld();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
