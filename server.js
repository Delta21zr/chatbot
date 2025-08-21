// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const handleIncomingMessage = require("./messageHandling");

const app = express();
const PORT = 3001;
const VERIFY_TOKEN = "Test1234";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

// Webhook GET  y POST
app.route("/webhook")
  .get((req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFICADO");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  })
  .post(async (req, res) => {
    try {
      await handleIncomingMessage(req.body);
      res.status(200).send({ status: "ok" });
    } catch (err) {
      console.error("Error procesando mensaje:", err);
      res.status(500).send({ status: "error", message: err.message });
    }
  });

// Ruta de prueba
app.get("/test", async (req, res) => {
  try {
    const testPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: "521612345678", type: "text", text: { body: "hola" } },
                ],
              },
            },
          ],
        },
      ],
    };
    await handleIncomingMessage(testPayload);
    res.send("Mensaje procesado y plantilla enviada");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error enviando mensaje");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
