const photos = document.querySelectorAll(".photo");

let activePhoto = null;
let offsetX = 0;
let offsetY = 0;
let highestZ = 10;

photos.forEach((photo) => {
  photo.addEventListener("pointerdown", (e) => {
    activePhoto = photo;

    const rect = photo.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    highestZ++;
    photo.style.zIndex = highestZ;

    photo.setPointerCapture(e.pointerId);
    photo.classList.add("dragging");
  });

  photo.addEventListener("pointermove", (e) => {
    if (activePhoto !== photo) return;

    const parent = photo.parentElement.getBoundingClientRect();

    let x = e.clientX - parent.left - offsetX;
    let y = e.clientY - parent.top - offsetY;

    photo.style.left = `${x}px`;
    photo.style.top = `${y}px`;
  });

  photo.addEventListener("pointerup", () => {
    activePhoto = null;
    photo.classList.remove("dragging");
  });

  photo.addEventListener("pointercancel", () => {
    activePhoto = null;
    photo.classList.remove("dragging");
  });
});
