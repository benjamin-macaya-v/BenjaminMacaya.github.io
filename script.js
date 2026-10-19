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

const autoSpeed = 0.00022;

const positions = [
  [-310, -180, 100],
  [-80, -300, -150],
  [220, -220, 130],
  [330, 30, -120],
  [140, 270, 180],
  [-200, 260, -170],
  [-350, 30, -100],
  [0, 20, 330]
];

const sizes = [1, 1, 1, 1, 1, 1, 1, 1];

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
  rotation = multiply(axisRotation("y", horizontal), rotation);
  rotation = multiply(rotation, axisRotation("x", vertical));

  normalize(rotation);
}

function quaternionToCSS(q) {
  const w = Math.max(-1, Math.min(1, q.w));
  const angle = 2 * Math.acos(w);
  const sinHalf = Math.sqrt(1 - w * w);

  if (sinHalf < 0.00001) {
    return "rotate3d(0, 1, 0, 0rad)";
  }

  return `rotate3d(
    ${q.x / sinHalf},
    ${q.y / sinHalf},
    ${q.z / sinHalf},
    ${angle}rad
  )`;
}

// ==================================
// PREPARAR LAS FOTOGRAFÍAS
// ==================================

photos.forEach((photo, i) => {
  const media = photo.querySelector("img, video");

  if (!media) return;

  media.draggable = false;

  media.addEventListener("dragstart", event => {
    event.preventDefault();
  });

  // Reproducción automática de los videos
  if (media.tagName === "VIDEO") {
    media.muted = true;
    media.loop = true;
    media.playsInline = true;

    media.play().catch(error => {
      console.log("No se pudo iniciar el video:", error);
    });
  }
});

// ==================================
// ACTUALIZAR LA NUBE
// ==================================

function updateWorld() {
  world.style.transform = quaternionToCSS(rotation);

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
    rotateWorld(autoSpeed * delta, 0);

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

// ==================================
// ABRIR VIDEOS Y GIFS
// ==================================

// ==================================
// LIGHTBOX DE VIDEOS Y GIFS
// ==================================

const lightbox = document.querySelector("#mediaLightbox");
const lightboxVideo = document.querySelector("#lightboxVideo");
const lightboxGif = document.querySelector("#lightboxGif");
const lightboxClose = document.querySelector("#lightboxClose");

photos.forEach(photo => {
  const media = photo.querySelector("video, img");

  if (!media) return;

  const isVideo = media.tagName === "VIDEO";

  const isGif = media.tagName === "IMG" &&
    media.src.toLowerCase().split("?")[0].endsWith(".gif");

  if (!isVideo && !isGif) return;

  media.style.pointerEvents = "auto";
  media.style.cursor = "pointer";

  media.addEventListener("click", async event => {
    event.stopPropagation();

    lightbox.classList.add("active");

    if (isVideo) {
      lightboxGif.style.display = "none";
      lightboxGif.removeAttribute("src");

      lightboxVideo.style.display = "block";

      const source = media.querySelector("source");
      const videoURL = source ? source.src : media.currentSrc || media.src;

      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      lightboxVideo.load();

      lightboxVideo.src = videoURL;
      lightboxVideo.muted = false;
      lightboxVideo.volume = 1;
      lightboxVideo.currentTime = 0;

      lightboxVideo.load();

      lightboxVideo.onloadedmetadata = async () => {
        lightboxVideo.currentTime = 0;

        try {
          await lightboxVideo.play();
        } catch (error) {
          console.log("No se pudo iniciar el video:", error);
        }
      };
    }

    if (isGif) {
      lightboxVideo.pause();
      lightboxVideo.style.display = "none";
      lightboxGif.style.display = "block";
      lightboxGif.src = media.src;
    }
  });
});

// CERRAR LIGHTBOX

function closeLightbox() {
  lightbox.classList.remove("active");

  lightboxVideo.pause();
  lightboxVideo.onloadedmetadata = null;
  lightboxVideo.removeAttribute("src");
  lightboxVideo.load();

  lightboxGif.removeAttribute("src");

  lightboxVideo.style.display = "none";
  lightboxGif.style.display = "none";
}

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});
