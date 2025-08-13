const axios = require("axios");
const fs = require("fs");
const mysql = require("mysql2/promise");

// Plantillas
const templates = {
  SALUDO_INICIAL_LOTUS: "saludo_inicial_lotus",
  CONSULTAR_PEDIDOS_LOTUS: "consultar_pedidos_lotus",
  DETALLE_PEDIDO_LOTUS: "detalle_pedido_lotus",
  SOLICITUD_REEMBOLSO_LOTUS: "solicitud_reembolso_lotus",
  SOPORTE_TECNICO_LOTUS: "soporte_tecnico_lotus",
  TRANSFERENCIA_ASESOR_LOTUS: "transferencia_asesor_lotus",
  MENSAJE_ERROR_LOTUS: "mensaje_error",
  CONFIRMACION_REEMBOLSO_LOTUS: "confirmacion_reembolso_lotus",
};

// Número de variables que espera cada plantilla
const variablesPorPlantilla = {
  saludo_inicial_lotus: ["nombre_cliente"],
  consultar_pedidos_lotus: ["nombre_cliente", "codigo_pedido1", "estado_pedido1", "codigo_pedido2", "estado_pedido2"],
  detalle_pedido_lotus: ["codigo_pedido","fecha_pedido","estado_pedido","monto_total"],
  solicitud_reembolso_lotus: ["nombre_cliente"],
  soporte_tecnico_lotus: ["nombre_cliente"],
  transferencia_asesor_lotus: [],
  mensaje_error: ["nombre_cliente"],
  confirmacion_reembolso_lotus: ["codigo_pedido"]
};

// Token y phoneNumberId de tu WhatsApp Business
const accessToken = "EAAKuMVxp1FYBPOG663hUklVI0cgyAZA8oiJ9CBqE7MoXnm6nAvKZA4qjKkCBcezZCLhfQEPD8r22ZBTScP6gI540TIu52ZCGSOILZB53HQWI5fUdc31xiUfHO9ZAB5wEL1hxZBMww0GOWwzHBAZA9A5IlxyZASkCn0tROJkTZCZCzNrBcZADEx0t4hmwadVZCTMnQPhU1cQwZDZD";
const phoneNumberId = "653490954522539";

// Sanitizar texto
function sanitize(text) {
  return String(text || "")
    .replace(/[\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 1024);
}

// Validar número
function procesarNumero(to) {
  if (!to) throw new Error("Número de destinatario no válido");
  return to.startsWith("521") ? to.replace(/^521/, "52") : to;
}

// Enviar payload
async function enviarPayload(to, templateName, components = []) {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: procesarNumero(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: "es_MX" },
      components,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    console.log("Plantilla enviada:", response.data);
  } catch (err) {
    console.error("Error enviando plantilla:", err.response?.data || err.message);
  }
}

// Enviar plantilla
async function enviarPlantillaWhatsApp(to, templateName, variables = []) {
  const components = variables.length
    ? [
        {
          type: "body",
          parameters: variables.map(v => ({ type: "text", text: sanitize(v) })),
        },
      ]
    : [];
  await enviarPayload(to, templateName, components);
}

// Enviar texto simple
async function enviarMensajeTexto(to, text) {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: procesarNumero(to),
    type: "text",
    text: { body: sanitize(text) },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    console.log("Mensaje de texto enviado:", response.data);
  } catch (err) {
    console.error("Error enviando mensaje:", err.response?.data || err.message);
  }
}

// Determinar plantilla según mensaje
function determinarPlantilla(mensaje) {
  if (!mensaje || typeof mensaje !== "string") return templates.MENSAJE_ERROR_LOTUS;
  const texto = mensaje.toLowerCase();
  if (texto.includes("hola")) return templates.SALUDO_INICIAL_LOTUS;
  if (texto.includes("mis pedidos") || texto.includes("consultar")) return templates.CONSULTAR_PEDIDOS_LOTUS;
  if (texto.includes("detalle")) return templates.DETALLE_PEDIDO_LOTUS;
  if (texto.includes("reembolso")) return templates.SOLICITUD_REEMBOLSO_LOTUS;
  if (texto.includes("soporte")) return templates.SOPORTE_TECNICO_LOTUS;
  if (texto.includes("asesor")) return templates.TRANSFERENCIA_ASESOR_LOTUS;
  return templates.MENSAJE_ERROR_LOTUS;
}

// Extraer variables desde la base de datos
async function extraerVariables(templateName, filtroUsuario) {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatbot",
  });

  const variableNames = variablesPorPlantilla[templateName] || [];
  const valores = [];

  for (let i = 0; i < variableNames.length; i++) {
    const varName = variableNames[i];
    let valor = "";

    // Mapeo de variables a campos reales
    if (varName === "nombre_cliente") {
      const [rows] = await connection.execute(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [filtroUsuario.id_usuario]
      );
      valor = rows[0]?.nombre || "";
    } else if (varName.startsWith("codigo_pedido") || varName.startsWith("estado_pedido")) {
      valor = varName + "_demo"; // ejemplo, reemplazar según lógica real de pedidos
    } else if (varName === "fecha_pedido") {
      valor = "2025-08-13";
    } else if (varName === "monto_total") {
      valor = "$1000";
    }

    valores.push(valor);
  }

  await connection.end();
  return valores;
}

// Procesar mensaje con variables desde DB
async function procesarMensaje(to, mensaje, filtroUsuario = { id_usuario: 1 }) {
  if (!to) throw new Error("Número vacío");
  const plantilla = determinarPlantilla(mensaje);
  const variables = await extraerVariables(plantilla, filtroUsuario);
  await enviarPlantillaWhatsApp(to, plantilla, variables);
}

module.exports = {
  templates,
  enviarPlantillaWhatsApp,
  enviarMensajeTexto,
  procesarMensaje,
};
