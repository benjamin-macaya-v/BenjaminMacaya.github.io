const collage = document.querySelector(".collage");
const world = document.querySelector("#world");

let positionX = 0;
let velocityX = 0;
let dragging = false;
let previousX = 0;

const autoSpeed = 0.025; // Velocidad del movimiento automático
let lastTime = 0;

function updateWorld() {
  world.style.transform = `translate3d(${positionX}px, 0, 0)`;
}

collage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  dragging = true;
  previousX = event.clientX;
  velocityX = 0;

  collage.classList.add("dragging");
  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", (event) => {
  if (!dragging) return;

  const dx = event.clientX - previousX;

  positionX += dx;
  velocityX = dx * 0.08;

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

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (!dragging) {
    // Desplaza todo el conjunto hacia la derecha
    positionX += autoSpeed * delta;

    // Conserva un poco de inercia después de arrastrar
    positionX += velocityX * delta;
    velocityX *= 0.94;

    if (Math.abs(velocityX) < 0.001) {
      velocityX = 0;
    }
  }

  updateWorld();
  requestAnimationFrame(animate);
}

updateWorld();
requestAnimationFrame(animate);
