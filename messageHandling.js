const { procesarMensaje, templates } = require("./whatsappTemplates");

async function handleIncomingMessage(payload) {
  const firstEntry = payload.entry?.[0];
  const firstChange = firstEntry?.changes?.[0];
  const firstMessage = firstChange?.value?.messages?.[0];

  if (!firstMessage) {
    console.log("Payload sin mensajes válidos");
    return;
  }

  const from = firstMessage.from;
  if (!from) {
    console.log("Número del remitente no encontrado");
    return;
  }

  let bodyText = "";
  if (firstMessage.type === "text") {
    bodyText = firstMessage.text?.body || "";
  } else if (firstMessage.type === "button") {
    bodyText = firstMessage.button?.payload || "";
  }

  // Procesar mensaje usando la función que extrae variables automáticamente
  try {
    await procesarMensaje(from, bodyText, { id_usuario: 1 });
  } catch (err) {
    console.error("Error enviando plantilla:", err);
  }
}

module.exports = handleIncomingMessage;
