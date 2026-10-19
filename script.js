const collage = document.querySelector(".collage");
const world = document.querySelector("#world");

let positionX = 0;
let dragging = false;
let previousX = 0;
let lastTime = 0;

const autoSpeed = 0.025;

function updateWorld() {
  world.style.transform = `translate3d(${positionX}px, 0, 0)`;
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

// Movimiento automático de TODO el conjunto
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

requestAnimationFrame(animate);
