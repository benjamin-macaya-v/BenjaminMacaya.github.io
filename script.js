const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

let rotationX = -10;
let rotationY = -20;

let velocityX = 0;
let velocityY = 0;

let dragging = false;
let previousX = 0;
let previousY = 0;

// Posiciones de la nube orbital
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

// Distribuir fotografías
photos.forEach((photo, i) => {
  const [x, y, z] = positions[i];

  photo.dataset.depth = z;

  photo.style.transform = `
    translate(-50%, -50%)
    translate3d(${x}px, ${y}px, ${z}px)
  `;

  photo.style.zIndex = Math.round(z + 500);

  // Orientación decorativa fija respecto a la cámara
  photo.querySelector("img").style.transform = `
    rotateZ(${angles[i]}deg)
    scale(${sizes[i]})
  `;
});

// Rotación del mundo
function updateWorld() {
  world.style.transform = `
    rotateX(${rotationX}deg)
    rotateY(${rotationY}deg)
  `;

  // Compensar la rotación para que cada foto mire a cámara
  photos.forEach((photo) => {
    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(
        ${positions[photos.indexOf(photo)][0]}px,
        ${positions[photos.indexOf(photo)][1]}px,
        ${positions[photos.indexOf(photo)][2]}px
      )
      rotateY(${-rotationY}deg)
      rotateX(${-rotationX}deg)
    `;
  });
}

updateWorld();

// Arrastrar el universo
collage.addEventListener("pointerdown", (event) => {
  dragging = true;

  previousX = event.clientX;
  previousY = event.clientY;

  velocityX = 0;
  velocityY = 0;

  collage.classList.add("dragging");
  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", (event) => {
  if (!dragging) return;

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  rotationY += dx * 0.4;
  rotationX -= dy * 0.3;

  rotationX = Math.max(-80, Math.min(80, rotationX));

  velocityY = dx * 0.12;
  velocityX = -dy * 0.09;

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

// Inercia
function animate() {
  if (!dragging) {
    rotationY += velocityY;
    rotationX += velocityX;

    velocityX *= 0.96;
    velocityY *= 0.96;

    if (Math.abs(velocityX) < 0.001) velocityX = 0;
    if (Math.abs(velocityY) < 0.001) velocityY = 0;

    updateWorld();
  }

  requestAnimationFrame(animate);
}

animate();
