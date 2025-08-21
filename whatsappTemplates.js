  const axios = require("axios");
  const mysql = require("mysql2/promise");

  // Plantillas
  const templates = {
    SALUDO_INICIAL_LOTUS: "saludo_inicial_lotus",
    CONSULTAR_PEDIDOS_LOTUS: "consultar_pedidos_lotus",
    DETALLE_PEDIDO_LOTUS: "detalle_pedido_lotus",
    SOLICITUD_REEMBOLSO_LOTUS: "solicitud_reembolso_lotus",
    SOPORTE_TECNICO_LOTUS: "soporte_tecnico_lotus",
    TRANSFERENCIA_ASESOR_LOTUS: "transferencia_asesor_lotus",
    MENSAJE_ERROR_LOTUS: "mensaje_error_lotus",
    CONFIRMACION_REEMBOLSO_LOTUS: "confirmacion_reembolso_lotus",
    INSTRUCCIONES_BLACK_LOTUS: "instrucciones_black_lotus",
  };

  // Token 
  const accessToken = "EAAKuMVxp1FYBPOG663hUklVI0cgyAZA8oiJ9CBqE7MoXnm6nAvKZA4qjKkCBcezZCLhfQEPD8r22ZBTScP6gI540TIu52ZCGSOILZB53HQWI5fUdc31xiUfHO9ZAB5wEL1hxZBMww0GOWwzHBAZA9A5IlxyZASkCn0tROJkTZCZCzNrBcZADEx0t4hmwadVZCTMnQPhU1cQwZDZD";
  const phoneNumberId = "653490954522539";

  // Sanitizar el texto 
  function sanitize(text) {
    return String(text || "")
      .replace(/[\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 1024);
  }

  //  Validar número
  function procesarNumero(to) {
    if (!to) throw new Error("Número de destinatario no válido");
    return to.startsWith("521") ? to.replace(/^521/, "52") : to;
  }

  //  Enviar payload 
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

  // enviar plantilla con variables imagen 
  async function enviarPlantillaWhatsApp(to, templateName, variables = [], imageUrl = null) {
    const components = [];

    // si hay variables de texto se agregan 
    if (variables.length) {
      components.push({
        type: "body",
        parameters: variables.map(v => ({ type: "text", text: sanitize(v) })),
      });
    }

    //agregar header de tipo IMAGE
    if (imageUrl) {
      components.unshift({
        type: "header",
        parameters: [
          {
            type: "image",
            image: { link: imageUrl },
          },
        ],
      });
    }

    await enviarPayload(to, templateName, components);
  }


  // enviar texto simpl
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

  //Determinar plantilla 
  function determinarPlantilla(mensaje) {   
    if (!mensaje || typeof mensaje !== "string") return templates.MENSAJE_ERROR_LOTUS;

    const texto = mensaje.toLowerCase();

    const saludoKeywords = ["hola", "buenos días", "buenas tardes", "hey", "qué tal", "Hola"];
    const pedidoKeywords = ["pedido", "orden", "compra"];
    const detalleKeywords = ["detalle"];
    const reembolsoKeywords = ["reembolso", "devolución"];
    const soporteKeywords = ["soporte", "ayuda", "problema tecnico", "no funciona"];
    const asesorKeywords = ["asesor", "hablar con un asesor", "quiero hablar con un asesor", "contactar asesor", "soporte humano"];

    if (saludoKeywords.some(p => texto.includes(p))) return templates.SALUDO_INICIAL_LOTUS;
    if (pedidoKeywords.some(p => texto.includes(p))) return templates.CONSULTAR_PEDIDOS_LOTUS;
    if (detalleKeywords.some(p => texto.includes(p))) return templates.DETALLE_PEDIDO_LOTUS;
    if (reembolsoKeywords.some(p => texto.includes(p))) return templates.SOLICITUD_REEMBOLSO_LOTUS;
    if (soporteKeywords.some(p => texto.includes(p))) return templates.SOPORTE_TECNICO_LOTUS;
    if (asesorKeywords.some(p => texto.includes(p))) return templates.TRANSFERENCIA_ASESOR_LOTUS;

    return templates.MENSAJE_ERROR_LOTUS;
  }

  //Extraer variables   
  async function extraerVariables(templateName, filtroUsuario) {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "chatbot",
    });

    let valores = [];

    switch(templateName) {
      case "saludo_inicial_lotus":
      case "solicitud_reembolso_lotus":
      case "soporte_tecnico_lotus":
      case "mensaje_error_lotus":
        const [userRows] = await connection.execute(
          "SELECT nombre FROM usuarios WHERE id = ?",
          [filtroUsuario.id_usuario]
        );
        valores = [userRows[0]?.nombre || ""];
        break;

      case "consultar_pedidos_lotus":
        const [user] = await connection.execute(
          "SELECT nombre FROM usuarios WHERE id = ?",
          [filtroUsuario.id_usuario]
        );
        const [pedidoRows] = await connection.execute(
          "SELECT codigo_pedido, estado FROM pedidos WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 2",
          [filtroUsuario.id_usuario]
        );
        valores = [
          user[0]?.nombre || "",
          pedidoRows[0]?.codigo_pedido || "",
          pedidoRows[0]?.estado || "",
          pedidoRows[1]?.codigo_pedido || "",
          pedidoRows[1]?.estado || "",
        ];
        break;

      case "detalle_pedido_lotus":
        if (!filtroUsuario.codigo_pedido) break;
        const [detalleRows] = await connection.execute(
          "SELECT codigo_pedido, fecha, estado, total FROM pedidos WHERE codigo_pedido = ?",
          [filtroUsuario.codigo_pedido]
        );
        if (detalleRows.length) {
          valores = [
            detalleRows[0]?.codigo_pedido || "",
            detalleRows[0]?.fecha || "",
            detalleRows[0]?.estado || "",
            detalleRows[0]?.total || "",
          ];
        }
        break;

      case "confirmacion_reembolso_lotus":
      case "INSTRUCCIONES_BLACK_LOTUS":
        valores = [filtroUsuario.codigo_pedido || ""];
        break;

      case "transferencia_asesor_lotus":
        valores = [];
        break;
    }

    await connection.end();
    return valores;
  }

  // Manejo de estado
  const estadosUsuarios = {};

  //rocesar mensaje con flujo de reembolso 
  async function procesarMensaje(to, mensaje, filtroUsuario = { id_usuario: 1, codigo_pedido: null }) {
    if (!to) throw new Error("Número vacío");

    const usuarioId = filtroUsuario.id_usuario;
    estadosUsuarios[usuarioId] = estadosUsuarios[usuarioId] || {};
    const texto = mensaje.trim();

    //  sui el usuario está en flujo de reembolso y envía código de pedido
  if (estadosUsuarios[usuarioId].esperandoReembolso && /^[A-Z]{3}\d{3,}$/i.test(texto)) {
    filtroUsuario.codigo_pedido = texto.toUpperCase();
  
    // Plantilla de confirmación de reembolso
    const plantillaConfirmacion = "confirmacion_reembolso_lotus";
    const variablesConfirmacion = await extraerVariables(plantillaConfirmacion, filtroUsuario);
    await enviarPlantillaWhatsApp(to, plantillaConfirmacion, variablesConfirmacion);

    //Plantilla de instrucciones de la imagen
  await enviarPlantillaWhatsApp(
    to,
    templates.INSTRUCCIONES_BLACK_LOTUS,
    [],
    "https://drive.google.com/uc?export=view&id=1nlHN_VRwiVlfg5GMX4J4tPZWoUa-L7R0" // URL de la imagen
  );


    // Limpiar estado
    estadosUsuarios[usuarioId].esperandoReembolso = false;
    return;
  }


    // Si e lmensaje contiene "reembolso"
    if (texto.toLowerCase().includes("reembolso")) {
      estadosUsuarios[usuarioId].esperandoReembolso = true;

      const plantilla = templates.SOLICITUD_REEMBOLSO_LOTUS;
      const variables = await extraerVariables(plantilla, filtroUsuario);
      await enviarPlantillaWhatsApp(to, plantilla, variables);
      return;
    }

    //Si el mensaje es un código de pedido normal
    if (/^[A-Z]{3}\d{3,}$/i.test(texto)) {
      filtroUsuario.codigo_pedido = texto.toUpperCase();

      const plantilla = templates.DETALLE_PEDIDO_LOTUS;
      const variables = await extraerVariables(plantilla, filtroUsuario);
      await enviarPlantillaWhatsApp(to, plantilla, variables);
      return;
    }

    //Plantillas normales según keywords
    const plantilla = determinarPlantilla(texto);
    const variables = await extraerVariables(plantilla, filtroUsuario);
    await enviarPlantillaWhatsApp(to, plantilla, variables);
  }

  module.exports = {
    templates,
    enviarPlantillaWhatsApp,
    enviarMensajeTexto,
    procesarMensaje,
  };
