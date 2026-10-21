const collage = document.querySelector(".collage");
const world = document.querySelector("#world");
const photos = [...document.querySelectorAll(".photo-slot")];

if (!collage || !world || photos.length === 0) {
  console.warn("No se encontró la nube o sus imágenes.");
} else {

  // Evitar el arrastre nativo de imágenes y videos
  collage.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  // =====================================
  // CONFIGURACIÓN
  // =====================================

  const mobileMode = window.matchMedia("(max-width: 700px)").matches;

  let zoom = 0.70;
  let minZoom = 0.35;
  let maxZoom = 2.0;

  // Rotación automática
  const autoSpeed = 0.00040;

  // Sensibilidad del arrastre
  const sensitivity = 0.0032;

  // Inercia
  const inertiaStrength = 0.00065;
  const inertiaBlend = 0.40;
  const maxVelocity = 0.006;
  const friction = 0.93;

  // Distancia mínima para distinguir un clic de un arrastre
  const dragThreshold = 5;

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

    return Math.min(fitWidth, fitHeight) * 1.22;
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
      0.30 * Math.sin(i * 2.4) +
      0.18 * Math.cos(i * 1.7);

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Escritorio: nube horizontal
    // Celular: nube vertical
    const scaleX = mobileMode ? 520 : 1000;
    const scaleY = mobileMode ? 820 : 543;
    const scaleZ = mobileMode ? 300 : 850;

    return [
      x * scaleX * irregular,
      y * scaleY * irregular,
      z * scaleZ * irregular
    ];
  });

  // =====================================
  // ROTACIÓN 3D
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
      Math.max(0, 1 - normalized.w * normalized.w)
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

    // Las imágenes siempre miran hacia la cámara
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
  // VARIABLES DE MOVIMIENTO
  // =====================================

  let dragging = false;

  let previousX = 0;
  let previousY = 0;

  let velocityX = 0;
  let velocityY = 0;

  let lastPointerTime = 0;

  // Detección de clic o arrastre en escritorio
  let pointerDownX = 0;
  let pointerDownY = 0;
  let movedDuringDrag = false;

  // Detección de arrastre en celular
  let suppressClick = false;

  const activePointers = new Map();

  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  // =====================================
  // CONTROL DE INERCIA
  // =====================================

  function limitVelocity(value) {
    return Math.max(
      -maxVelocity,
      Math.min(maxVelocity, value)
    );
  }

  function updateInertia(dx, dy, eventTime) {
    const elapsed = lastPointerTime
      ? Math.max(8, Math.min(50, eventTime - lastPointerTime))
      : 16.67;

    const frameFactor = 16.67 / elapsed;

    const targetX = limitVelocity(
      dx * inertiaStrength * frameFactor
    );

    const targetY = limitVelocity(
      dy * inertiaStrength * frameFactor
    );

    velocityX =
      velocityX * (1 - inertiaBlend) +
      targetX * inertiaBlend;

    velocityY =
      velocityY * (1 - inertiaBlend) +
      targetY * inertiaBlend;

    velocityX = limitVelocity(velocityX);
    velocityY = limitVelocity(velocityY);

    lastPointerTime = eventTime;
  }

  function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  // =====================================
  // GIRAR LA NUBE
  // =====================================

  function rotateWorld(dx, dy) {
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

    // CELULAR
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

        lastPointerTime = event.timeStamp;

        velocityX = 0;
        velocityY = 0;
      }

      if (activePointers.size === 2) {
        dragging = false;

        velocityX = 0;
        velocityY = 0;

        const points = [...activePointers.values()];

        pinchStartDistance = getDistance(
          points[0],
          points[1]
        );

        pinchStartZoom = zoom;
      }

      return;
    }

    // ESCRITORIO
    // Permite arrastrar incluso encima de imágenes y videos

    dragging = true;

    previousX = event.clientX;
    previousY = event.clientY;

    pointerDownX = event.clientX;
    pointerDownY = event.clientY;

    movedDuringDrag = false;

    velocityX = 0;
    velocityY = 0;

    lastPointerTime = event.timeStamp;

    collage.classList.add("dragging");
  });

  // =====================================
  // MOVIMIENTO DEL DEDO O MOUSE
  // =====================================

  window.addEventListener("pointermove", (event) => {

    // CELULAR
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

        if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
          suppressClick = true;
        }

        rotateWorld(dx, dy);
        updateInertia(dx, dy, event.timeStamp);

        previousX = event.clientX;
        previousY = event.clientY;
      }

      return;
    }

    // ESCRITORIO
    if (!dragging) return;

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    // Detectar desplazamiento total desde el inicio
    const totalX = event.clientX - pointerDownX;
    const totalY = event.clientY - pointerDownY;

    if (
      Math.abs(totalX) > dragThreshold ||
      Math.abs(totalY) > dragThreshold
    ) {
      movedDuringDrag = true;
    }

    // Rotación directa
    rotateWorld(dx, dy);

    // Actualizar inercia
    updateInertia(dx, dy, event.timeStamp);

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

        lastPointerTime = performance.now();

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

  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  // =====================================
  // EVITAR CLICS ACCIDENTALES
  // =====================================

  collage.addEventListener("click", (event) => {

    // ESCRITORIO
    if (!mobileMode && movedDuringDrag) {
      event.preventDefault();
      event.stopPropagation();

      movedDuringDrag = false;
      return;
    }

    // CELULAR
    if (mobileMode && suppressClick) {
      event.preventDefault();
      event.stopPropagation();

      suppressClick = false;
    }

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

  // =====================================
  // ANIMACIÓN
  // =====================================

  let lastFrameTime = 0;

  function animate(timestamp = 0) {

    // Normalizar velocidad entre distintas frecuencias de pantalla
    const delta = lastFrameTime
      ? Math.min((timestamp - lastFrameTime) / 16.67, 2)
      : 1;

    lastFrameTime = timestamp;

    if (!dragging) {

      // INERCIA DESPUÉS DE SOLTAR
      if (
        Math.abs(velocityX) > 0.000001 ||
        Math.abs(velocityY) > 0.000001
      ) {
        rotation = normalizeQuaternion(
          multiplyQuaternion(
            axisRotation(
              { x: 0, y: 1, z: 0 },
              velocityX * delta
            ),
            rotation
          )
        );

        rotation = normalizeQuaternion(
          multiplyQuaternion(
            axisRotation(
              { x: 1, y: 0, z: 0 },
              velocityY * delta
            ),
            rotation
          )
        );

        // Desaceleración
        const damping = Math.pow(friction, delta);

        velocityX *= damping;
        velocityY *= damping;

      } else {
        velocityX = 0;
        velocityY = 0;
      }

      // ROTACIÓN AUTOMÁTICA
      rotation = normalizeQuaternion(
        multiplyQuaternion(
          axisRotation(
            { x: 0, y: 1, z: 0 },
            autoSpeed * delta
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
