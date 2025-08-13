const axios = require("axios");
const fs = require("fs");

const templates = {
  SALUDO_INICIAL_LOTUS: "saludo_inicial_lotus",
  CONSULTAR_PEDIDOS_LOTUS: "consultar_pedidos_lotus",
  DETALLE_PEDIDO_LOTUS: "detalle_pedido_lotus",
  SOLICITUD_REEMBOLSO_LOTUS: "solicitud_reembolso_lotus",
  SOPORTE_TECNICO_LOTUS: "soporte_tecnico_lotus",
  TRANSFERENCIA_ASESOR_LOTUS: "transferencia_asesor_lotus",
  MENSAJE_ERROR_LOTUS: "mensaje_error",
  CONFIRMACION_REEMBOLSO_LOTUS: "confirmacion_reembolso_lotus"
};

// Mapeo de variables esperadas por cada plantilla
const variablesPorPlantilla = {
  saludo_inicial: ["nombre_cliente"],
  consultar_pedidos: [
    "nombre_cliente",
    "codigo_pedido1",
    "estado_pedido1",
    "codigo_pedido2",
    "estado_pedido2"
  ],
  detalle_pedido: [
    "codigo_pedido",
    "fecha_pedido",
    "estado_pedido",
    "monto_total"
  ],
  solicitud_reembolso: ["nombre_cliente"],
  soporte_tecnico: ["nombre_cliente"],
  transferencia_asesor: [],
  mensaje_error: ["nombre_cliente"],
  confirmacion_reembolso: ["codigo_pedido"]
};

// Utilidad para limpiar texto y asegurar longitud
function sanitize(text) {
  const cleaned = text.replace(/[\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return cleaned.slice(0, 1024);
}

// Token de acceso generado en la consola de Meta
const accessToken = "EAAKuMVxp1FYBPOG663hUklVI0cgyAZA8oiJ9CBqE7MoXnm6nAvKZA4qjKkCBcezZCLhfQEPD8r22ZBTScP6gI540TIu52ZCGSOILZB53HQWI5fUdc31xiUfHO9ZAB5wEL1hxZBMww0GOWwzHBAZA9A5IlxyZASkCn0tROJkTZCZCzNrBcZADEx0t4hmwadVZCTMnQPhU1cQwZDZD";
const phoneNumberId = "653490954522539";

// Función para limpiar y validar el número
function procesarNumero(to) {
  if (!to) throw new Error("Número de destinatario no válido");
  return to.startsWith("521") ? to.replace(/^521/, "52") : to;
}

// Función genérica para construir y enviar payloads
async function enviarPayload(to, templateName, components = []) {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  to = procesarNumero(to);

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es_MX" },
      components,
    },
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers });
    logExitoso(payload, response.data);
  } catch (error) {
    logError(payload, error);
  }
}

// Funciones específicas
async function enviarPlantillaWhatsApp(to, templateName, variables = []) {
  const components = variables.length
    ? [
        {
          type: "body",
          parameters: variables.map(v => ({
            type: "text",
            text: sanitize(String(v))
          }))
        }
      ]
    : [];
  await enviarPayload(to, templateName, components);
}

async function enviarPlantillaErrorGenerico(to, errorMessage) {
  const components = [
    {
      type: "body",
      parameters: [{ type: "text", text: errorMessage }],
    },
  ];
  await enviarPayload(to, templates.ERROR_GENERICO, components);
}

async function enviarMensajeTexto(to, text) {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: procesarNumero(to),
    type: "text",
    text: { body: text },
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers });
    logExitoso(payload, response.data);
  } catch (error) {
    logError(payload, error);
  }
}

// Funciones auxiliares para logging
function logExitoso(payload, responseData) {
  const logMessage = `${new Date().toISOString()} - Enviado: ${JSON.stringify(payload)}\nRespuesta: ${JSON.stringify(responseData)}\n`;
  fs.appendFileSync("template_log.txt", logMessage);
  console.log("Plantilla enviada exitosamente:", responseData);
}

function logError(payload, error) {
  const errorData = error.response?.data || error.message;
  const logMessage = `${new Date().toISOString()} - Error enviando: ${JSON.stringify(payload)}\nError: ${JSON.stringify(errorData)}\n`;
  fs.appendFileSync("template_log.txt", logMessage);
  console.error("Error enviando plantilla:", errorData);
}

module.exports = {
  templates,
  enviarPlantillaWhatsApp,
  enviarPlantillaErrorGenerico,
  enviarMensajeTexto,
};
