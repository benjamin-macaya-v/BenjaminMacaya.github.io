const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

if (!collage || !world || photos.length === 0) {
  console.warn("No se encontró la nube o sus imágenes.");
} else {

  // =====================================
  // CONFIGURACIÓN GENERAL
  // =====================================

  const mobileMode = window.matchMedia("(max-width: 700px)").matches;

  let zoom = 1;
  let minZoom = 0.45;
  let maxZoom = 1.8;

  // Rotación automática muy lenta
  const autoSpeed = mobileMode ? 0.000003 : 0.000004;

  // =====================================
  // ZOOM INICIAL PARA CELULAR
  // =====================================

  function getMobileFitZoom() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const cloudWidth = 1750;
    const cloudHeight = 2600;

    const fitWidth = (width * 0.98) / cloudWidth;
    const fitHeight = (height * 0.90) / cloudHeight;

    return Math.min(fitWidth, fitHeight) * 1.12;
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

  // =====================================
  // DISTRIBUCIÓN DE LAS IMÁGENES
  // =====================================

  const positions = photos.map((photo, i) => {
    const total = photos.length;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const y = 1 - (2 * (i + 0.5)) / total;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * i;

    const irregular =
      1 +
      0.22 * Math.sin(i * 2.4) +
      0.12 * Math.cos(i * 1.7);

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Escritorio: nube horizontal
    // Celular: nube vertical
    const scaleX = mobileMode ? 520 : 800;
    const scaleY = mobileMode ? 820 : 430;
    const scaleZ = mobileMode ? 260 : 540;

    return [
      x * scaleX * irregular,
      y * scaleY * irregular,
      z * scaleZ * irregular
    ];
  });

  // =====================================
  // ROTACIÓN 3D CON CUATERNIONES
  // =====================================

  let rotation = {
    x: 0,
    y: 0,
    z: 0,
    w: 1
  };

  function multiplyQuaternion(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
  }

  function axisRotation(axis, angle) {
    const half = angle / 2;
    const sin = Math.sin(half);

    return {
      x: axis.x * sin,
      y: axis.y * sin,
      z: axis.z * sin,
      w: Math.cos(half)
    };
  }

  function normalizeQuaternion(q) {
    const length = Math.sqrt(
      q.x * q.x +
      q.y * q.y +
      q.z * q.z +
      q.w * q.w
    );

    return {
      x: q.x / length,
      y: q.y / length,
      z: q.z / length,
      w: q.w / length
    };
  }

  function quaternionToCSS(q) {
    const normalized = normalizeQuaternion(q);

    const angle = 2 * Math.acos(
      Math.max(-1, Math.min(1, normalized.w))
    );

    const sinHalf = Math.sqrt(
      1 - normalized.w * normalized.w
    );

    if (sinHalf < 0.0001) {
      return "rotate3d(0, 1, 0, 0deg)";
    }

    const x = normalized.x / sinHalf;
    const y = normalized.y / sinHalf;
    const z = normalized.z / sinHalf;

    return `rotate3d(${x}, ${y}, ${z}, ${angle}rad)`;
  }

  // =====================================
  // ACTUALIZAR LA NUBE
  // =====================================

  function updateWorld() {
    world.style.transform = quaternionToCSS(rotation);

    // Mantener las imágenes mirando hacia la cámara
    const inverseRotation = {
      x: -rotation.x,
      y: -rotation.y,
      z: -rotation.z,
      w: rotation.w
    };

    const billboard = quaternionToCSS(inverseRotation);

    photos.forEach((photo, i) => {
      const [x, y, z] = positions[i];

      photo.style.transform = `
        translate(-50%, -50%)
        translate3d(${x}px, ${y}px, ${z}px)
        ${billboard}
      `;
    });
  }

  // =====================================
  // PREPARAR IMÁGENES Y VIDEOS
  // =====================================

  photos.forEach((photo) => {
    const media = photo.querySelector("img, video");

    if (!media) return;

    media.draggable = false;

    media.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    if (media.tagName === "VIDEO") {
      media.muted = true;
      media.loop = true;
      media.playsInline = true;

      media.play().catch(() => {});
    }
  });

  // =====================================
  // ROTACIÓN MANUAL
  // =====================================

  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  let velocityX = 0;
  let velocityY = 0;

  let suppressClick = false;

  const activePointers = new Map();

  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  function rotateWorld(dx, dy) {
    const sensitivity = 0.003;

    const rotateY = axisRotation(
      { x: 0, y: 1, z: 0 },
      dx * sensitivity
    );

    const rotateX = axisRotation(
      { x: 1, y: 0, z: 0 },
      dy * sensitivity
    );

    rotation = normalizeQuaternion(
      multiplyQuaternion(rotateY, rotation)
    );

    rotation = normalizeQuaternion(
      multiplyQuaternion(rotateX, rotation)
    );
  }

  // =====================================
  // INICIO DEL ARRASTRE
  // =====================================

  collage.addEventListener("pointerdown", (event) => {

    suppressClick = false;

    // En escritorio, solo arrastrar desde el fondo
    if (
      !mobileMode &&
      event.target.closest(".photo-slot a, .photo-slot img, .photo-slot video")
    ) {
      return;
    }

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
      }

      if (activePointers.size === 2) {
        dragging = false;

        const points = [...activePointers.values()];

        pinchStartDistance = getDistance(
          points[0],
          points[1]
        );

        pinchStartZoom = zoom;
      }

      return;
    }

    dragging = true;

    previousX = event.clientX;
    previousY = event.clientY;

    velocityX = 0;
    velocityY = 0;

    collage.classList.add("dragging");
  });

  // =====================================
  // MOVIMIENTO DEL DEDO O MOUSE
  // =====================================

  collage.addEventListener("pointermove", (event) => {

    if (mobileMode) {

      if (!activePointers.has(event.pointerId)) return;

      activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      // DOS DEDOS: ZOOM
      if (activePointers.size === 2) {
        const points = [...activePointers.values()];

        const currentDistance = getDistance(
          points[0],
          points[1]
        );

        if (pinchStartDistance > 0) {
          const ratio = currentDistance / pinchStartDistance;

          zoom = Math.max(
            minZoom,
            Math.min(maxZoom, pinchStartZoom * ratio)
          );

          applyZoom();
        }

        return;
      }

      // UN DEDO: ROTACIÓN
      if (activePointers.size === 1 && dragging) {

        const dx = event.clientX - previousX;
        const dy = event.clientY - previousY;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          suppressClick = true;
        }

        rotateWorld(dx, dy);

        // Inercia reducida al soltar
        velocityX = dx * 0.008;
        velocityY = dy * 0.008;
        
        velocityX = limitVelocity(velocityX);
        velocityY = limitVelocity(velocityY);
        
        previousX = event.clientX;
        previousY = event.clientY;
      }

      return;
    }

    // ESCRITORIO
    if (!dragging) return;

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    rotateWorld(dx, dy);

    // Inercia reducida al soltar
    velocityX = dx * 0.008;
    velocityY = dy * 0.008;
    
    velocityX = limitVelocity(velocityX);
    velocityY = limitVelocity(velocityY);
    
    previousX = event.clientX;
    previousY = event.clientY;
  });

  // =====================================
  // TERMINAR ARRASTRE
  // =====================================

  function stopDrag(event) {

    if (mobileMode) {

      activePointers.delete(event.pointerId);

      if (activePointers.size === 1) {
        const remaining = [...activePointers.values()][0];

        previousX = remaining.x;
        previousY = remaining.y;

        dragging = true;
      }

      if (activePointers.size === 0) {
        dragging = false;
      }

      return;
    }

    dragging = false;
    collage.classList.remove("dragging");
  }

  collage.addEventListener("pointerup", stopDrag);
  collage.addEventListener("pointercancel", stopDrag);

  // =====================================
  // EVITAR ABRIR ENLACES AL GIRAR
  // =====================================

  collage.addEventListener("click", (event) => {
    if (!mobileMode || !suppressClick) return;

    event.preventDefault();
    event.stopPropagation();

    suppressClick = false;
  }, true);

  // =====================================
  // ZOOM CON RUEDA EN ESCRITORIO
  // =====================================

  if (!mobileMode) {
    collage.addEventListener("wheel", (event) => {
      event.preventDefault();

      const zoomSpeed = 0.001;

      zoom -= event.deltaY * zoomSpeed;

      zoom = Math.max(
        minZoom,
        Math.min(maxZoom, zoom)
      );

      applyZoom();

    }, { passive: false });
  }
  
function limitVelocity(value, max = 0.025) {
  return Math.max(-max, Math.min(max, value));
}
  // =====================================
  // ANIMACIÓN AUTOMÁTICA
  // =====================================

  function animate() {

    if (!dragging) {

      // Inercia
      rotation = normalizeQuaternion(
        multiplyQuaternion(
          axisRotation(
            { x: 0, y: 1, z: 0 },
            velocityX
          ),
          rotation
        )
      );

      rotation = normalizeQuaternion(
        multiplyQuaternion(
          axisRotation(
            { x: 1, y: 0, z: 0 },
            velocityY
          ),
          rotation
        )
      );

      // La inercia se desvanece progresivamente
      const friction = mobileMode ? 0.82 : 0.82;

      velocityX *= friction;
      velocityY *= friction;

      // Rotación automática lenta
      rotation = normalizeQuaternion(
        multiplyQuaternion(
          axisRotation(
            { x: 0, y: 1, z: 0 },
            autoSpeed
          ),
          rotation
        )
      );
    }

    updateWorld();

    requestAnimationFrame(animate);
  }

  // =====================================
  // INICIAR
  // =====================================

  updateWorld();
  animate();

}
