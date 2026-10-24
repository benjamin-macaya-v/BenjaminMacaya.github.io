"use strict";

async function copiarCorreo(event) {
  event.preventDefault();

  const correo = "benjamin.macaya.v@gmail.com";

  try {
    await navigator.clipboard.writeText(correo);
    console.log("Correo copiado correctamente.");
  } catch (error) {
    console.error("No se pudo copiar el correo:", error);
  }
}
