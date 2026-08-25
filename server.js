const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
    console.log("Client connecté");

    ws.on("message", (message) => {
        // Transmet le message à tous les autres clients
        for (const client of wss.clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });

    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
