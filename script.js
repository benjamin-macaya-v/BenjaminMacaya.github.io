const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

// Comprobar que existen los elementos necesarios
if (!collage || !world) {
  console.error("No se encontró .collage o #world en el HTML.");
} else {

// ==================================
// CONFIGURACIÓN GENERAL
// ==================================

const mobileMode = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;

let zoom = 1;
let minZoom = 0.45;
let maxZoom = 1.8;

let rotation = { x: 0, y: 0, z: 0, w: 1 };

let dragging = false;
let previousX = 0;
let previousY = 0;
let lastTime = 0;

let velocityX = 0;
let velocityY = 0;

let suppressClick = false;

const activePointers = new Map();

let pinchStartDistance = 0;
let pinchStartZoom = 1;

const autoSpeed = mobileMode ? 0.00005 : 0.00010;

// ==================================
// ZOOM INICIAL PARA CELULARES
// ==================================

function getMobileFitZoom() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Dimensiones aproximadas de toda la nube
  const cloudWidth = 2424;
  const cloudHeight = 1502;

  const fitWidth = (width * 0.90) / cloudWidth;
  const fitHeight = (height * 0.76) / cloudHeight;

  return Math.min(fitWidth, fitHeight);
}

function applyZoom() {
  world.style.scale = zoom;
}

if (mobileMode) {
  const fitZoom = getMobileFitZoom();

  zoom = fitZoom;
  minZoom = fitZoom * 0.65;
  maxZoom = fitZoom * 3.5;

  applyZoom();
}

// ==================================
// ZOOM CON RUEDA EN COMPUTADOR
// ==================================

collage.addEventListener("wheel", (event) => {
  if (mobileMode) return;

  event.preventDefault();

  zoom += event.deltaY * -0.001;

  zoom = Math.min(maxZoom, Math.max(minZoom, zoom));

  applyZoom();
}, { passive: false });

// ==================================
// POSICIONES DE LA NUBE 3D
// ==================================

const positions = photos.map((photo, i) => {
  const total = photos.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const y = 1 - (2 * (i + 0.5)) / total;
  const radius = Math.sqrt(1 - y * y);
  const angle = goldenAngle * i;

  const irregular =
    1 + 0.22 * Math.sin(i * 2.4) + 0.12 * Math.cos(i * 1.7);

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  const scaleX = 800;
  const scaleY = 430;
  const scaleZ = 540;

  return [
    x * scaleX * irregular,
    y * scaleY * irregular,
    z * scaleZ * irregular
  ];
});

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

  if (length === 0) return q;

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
// PREPARAR IMÁGENES Y VIDEOS
// ==================================

photos.forEach(photo => {
  const media = photo.querySelector("img, video");

  if (!media) return;

  media.draggable = false;

  media.addEventListener("dragstart", event => {
    event.preventDefault();
  });

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
    const position = positions[i];

    if (!position) return;

    const [x, y, z] = position;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${x}px, ${y}px, ${z}px)
      ${billboardRotation}
    `;
  });
}

// ==================================
// FUNCIONES PARA EL GESTO DE PINZA
// ==================================

function getPointerDistance() {
  const points = [...activePointers.values()];

  if (points.length < 2) return 0;

  const dx = points[0].x - points[1].x;
  const dy = points[0].y - points[1].y;

  return Math.hypot(dx, dy);
}

function updatePinchZoom() {
  const distance = getPointerDistance();

  if (!distance || !pinchStartDistance) return;

  const ratio = distance / pinchStartDistance;

  zoom = Math.min(
    maxZoom,
    Math.max(minZoom, pinchStartZoom * ratio)
  );

  applyZoom();
}

// ==================================
// CONTROL CON EL MOUSE Y EL TÁCTIL
// ==================================

collage.addEventListener("pointerdown", event => {

  // En escritorio, las imágenes siguen siendo clicables
  if (!mobileMode &&
      event.target.closest(".photo-slot a, .photo-slot video, .photo-slot img")) {
    return;
  }

  if (!mobileMode && event.button !== 0) return;

  if (mobileMode) {
    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    collage.setPointerCapture(event.pointerId);

    if (activePointers.size === 1) {
      dragging = true;

      previousX = event.clientX;
      previousY = event.clientY;

      velocityX = 0;
      velocityY = 0;
    }

    if (activePointers.size === 2) {
      dragging = false;

      pinchStartDistance = getPointerDistance();
      pinchStartZoom = zoom;
    }

    collage.classList.add("dragging");
    return;
  }

  dragging = true;

  previousX = event.clientX;
  previousY = event.clientY;

  velocityX = 0;
  velocityY = 0;

  collage.classList.add("dragging");

  collage.setPointerCapture(event.pointerId);
});

collage.addEventListener("pointermove", event => {

  if (mobileMode) {
    if (!activePointers.has(event.pointerId)) return;

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (activePointers.size >= 2) {
      updatePinchZoom();
      return;
    }

    if (!dragging) return;

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    const horizontal = dx * 0.003;
    const vertical = dy * 0.003;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      suppressClick = true;
    }

    rotateWorld(horizontal, vertical);

    velocityX = horizontal * 0.10;
    velocityY = vertical * 0.10;

    previousX = event.clientX;
    previousY = event.clientY;

    updateWorld();
    return;
  }

  if (!dragging) return;

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const horizontal = dx * 0.003;
  const vertical = dy * 0.003;

  rotateWorld(horizontal, vertical);

  velocityX = horizontal * 0.12;
  velocityY = vertical * 0.12;

  previousX = event.clientX;
  previousY = event.clientY;

  updateWorld();
});

// ==================================
// FINALIZAR ARRASTRE
// ==================================

function stopDrag(event) {
  if (mobileMode) {
    activePointers.delete(event.pointerId);

    if (activePointers.size === 1) {
      const remaining = [...activePointers.values()][0];

      previousX = remaining.x;
      previousY = remaining.y;

      pinchStartDistance = 0;
      dragging = true;
    } else if (activePointers.size === 0) {
      dragging = false;
      pinchStartDistance = 0;
    } else {
      dragging = false;
    }

    if (activePointers.size === 0) {
      collage.classList.remove("dragging");
    }

    return;
  }

  dragging = false;
  collage.classList.remove("dragging");
}

collage.addEventListener("pointerup", stopDrag);
collage.addEventListener("pointercancel", stopDrag);
collage.addEventListener("lostpointercapture", stopDrag);

collage.addEventListener("click", event => {
  if (!mobileMode || !suppressClick) return;

  event.preventDefault();
  event.stopPropagation();

  suppressClick = false;
}, true);

collage.addEventListener("dragstart", event => {
  event.preventDefault();
});

// ==================================
// AJUSTAR ZOOM SI CAMBIA LA PANTALLA
// ==================================

window.addEventListener("resize", () => {
  if (!mobileMode) return;

  const fitZoom = getMobileFitZoom();

  minZoom = fitZoom * 0.65;
  maxZoom = fitZoom * 3.5;

  zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  applyZoom();
});

// ==================================
// ANIMACIÓN AUTOMÁTICA
// ==================================

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const delta = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (!dragging && activePointers.size === 0) {

    rotateWorld(autoSpeed * delta, 0);

    if (velocityX !== 0 || velocityY !== 0) {
      rotateWorld(velocityX, velocityY);

      velocityX *= mobileMode ? 0.93 : 0.96;
      velocityY *= mobileMode ? 0.93 : 0.96;

      if (Math.abs(velocityX) < 0.00001) velocityX = 0;
      if (Math.abs(velocityY) < 0.00001) velocityY = 0;
    }
  }

  updateWorld();
  requestAnimationFrame(animate);
}

// ==================================
// INICIAR
// ==================================

updateWorld();
requestAnimationFrame(animate);

}
