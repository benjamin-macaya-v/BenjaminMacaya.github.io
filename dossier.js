(() => {
  "use strict";

  const PDF_URL = "./benjaminmacaya.pdf";

  const loading = document.getElementById("loading");
  const errorBox = document.getElementById("error");
  const bookShell = document.getElementById("book-shell");
  const bookElement = document.getElementById("book");

  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const pageLabel = document.getElementById("page-label");
  const pageCount = document.getElementById("page-count");

  let pageFlip = null;
  let totalPages = 0;

  // =====================================
  // CALIDAD DE RENDERIZADO
  // =====================================

  const MAX_RENDER_WIDTH = 2400;
  const MAX_RENDER_HEIGHT = 3200;

  const JPEG_QUALITY = 0.96;

  const MAX_OUTPUT_SCALE = 2;

  function showError(message) {
    loading.hidden = true;
    bookShell.hidden = true;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  // =====================================
  // CONTROLES DE NAVEGACIÓN
  // =====================================

  function updateControls() {
    if (!pageFlip) return;

    const index = pageFlip.getCurrentPageIndex();
    const orientation = pageFlip.getOrientation();

    prevButton.disabled = index <= 0;
    nextButton.disabled = index >= totalPages - 1;

    if (index === 0) {
      pageLabel.textContent = "Portada";

    } else if (index >= totalPages - 1) {
      pageLabel.textContent = "Contraportada";

    } else if (orientation === "portrait") {
      pageLabel.textContent = `Página ${index + 1}`;

    } else {
      const first = index + 1;
      const last = Math.min(index + 2, totalPages - 1);

      pageLabel.textContent =
        first === last
          ? `Página ${first}`
          : `Páginas ${first}–${last}`;
    }

    pageCount.textContent = `${totalPages} páginas`;
  }

  // =====================================
  // RENDERIZADO DE ALTA CALIDAD
  // =====================================

  async function renderPDFPages(pdf) {
    const images = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {

      loading.textContent =
        `Preparando tu libro... ${pageNumber} de ${pdf.numPages}`;

      const page = await pdf.getPage(pageNumber);

      const baseViewport = page.getViewport({
        scale: 1
      });

      // Calcula una resolución alta manteniendo
      // las proporciones originales del PDF.

      const renderScale = Math.min(
        MAX_RENDER_WIDTH / baseViewport.width,
        MAX_RENDER_HEIGHT / baseViewport.height
      );

      const viewport = page.getViewport({
        scale: renderScale
      });

      const outputScale = Math.min(
        window.devicePixelRatio || 1,
        MAX_OUTPUT_SCALE
      );

      const canvas = document.createElement("canvas");

      const context = canvas.getContext("2d", {
        alpha: false
      });

      if (!context) {
        throw new Error(
          "No se pudo crear el contexto de dibujo."
        );
      }

      canvas.width = Math.floor(
        viewport.width * outputScale
      );

      canvas.height = Math.floor(
        viewport.height * outputScale
      );

      context.fillStyle = "#ffffff";

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      await page.render({
        canvasContext: context,
        viewport: viewport,
        transform: outputScale === 1
          ? null
          : [
              outputScale,
              0,
              0,
              outputScale,
              0,
              0
            ]
      }).promise;

      // Exportación JPEG de alta calidad.

      images.push(
        canvas.toDataURL(
          "image/jpeg",
          JPEG_QUALITY
        )
      );

      // Liberación de memoria.

      canvas.width = 0;
      canvas.height = 0;

      page.cleanup();
    }

    return images;
  }

  // =====================================
  // INICIALIZACIÓN DEL LIBRO
  // =====================================

  async function initBook() {
    try {

      if (!window.pdfjsLib) {
        throw new Error(
          "No se pudo cargar PDF.js."
        );
      }

      if (!window.St || !window.St.PageFlip) {
        throw new Error(
          "No se pudo cargar la biblioteca de animación."
        );
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const loadingTask = pdfjsLib.getDocument({
        url: PDF_URL
      });

      const pdf = await loadingTask.promise;

      totalPages = pdf.numPages;

      if (totalPages < 2) {
        throw new Error(
          "El PDF debe tener al menos dos páginas."
        );
      }

      const firstPage = await pdf.getPage(1);

      const viewport = firstPage.getViewport({
        scale: 1
      });

      // Tamaño de presentación de cada página.

      const pageWidth = 600;

      const pageHeight = Math.round(
        pageWidth * viewport.height / viewport.width
      );

      const images = await renderPDFPages(pdf);

      // =====================================
      // PAGE FLIP
      // =====================================

      pageFlip = new St.PageFlip(bookElement, {

        width: pageWidth,
        height: pageHeight,

        size: "stretch",

        minWidth: 280,
        maxWidth: pageWidth,

        minHeight: 350,
        maxHeight: Math.round(pageHeight * 1.1),

        autoSize: true,
        usePortrait: true,
        showCover: true,
        startPage: 0,

        drawShadow: true,
        maxShadowOpacity: 0.18,

        flippingTime: 750,

        mobileScrollSupport: false,
        clickEventForward: true,
        useMouseEvents: true

      });

      pageFlip.loadFromImages(images);

      pageFlip.on("flip", updateControls);
      pageFlip.on("changeOrientation", updateControls);
      pageFlip.on("init", updateControls);

      loading.hidden = true;
      bookShell.hidden = false;

      updateControls();

    } catch (error) {

      console.error(
        "Error al cargar el ebook:",
        error
      );

      showError(
        "No se pudo abrir el libro. Comprueba que " +
        PDF_URL +
        " esté en la carpeta del proyecto y vuelve a intentarlo."
      );
    }
  }

  // =====================================
  // BOTONES
  // =====================================

  prevButton.addEventListener("click", () => {
    pageFlip?.flipPrev();
  });

  nextButton.addEventListener("click", () => {
    pageFlip?.flipNext();
  });

  initBook();

})();
