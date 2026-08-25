const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let camera = null;
const viewers = new Set();

function send(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

wss.on("connection", (ws) => {
    console.log("Client connecté");

    ws.on("message", (raw) => {
        let message;

        try {
            message = JSON.parse(raw.toString());
        } catch {
            return;
        }

        // Une caméra vient de se connecter
        if (message.type === "camera") {
            camera = ws;

            console.log("Caméra connectée");

            // Prévenir les spectateurs
            for (const viewer of viewers) {
                send(viewer, {
                    type: "camera-online"
                });
            }

            return;
        }

        // Un spectateur vient de se connecter
        if (message.type === "viewer") {
            viewers.add(ws);

            send(ws, {
                type: camera ? "camera-online" : "camera-offline"
            });

            // Demande à la caméra de créer une connexion WebRTC
            if (camera) {
                send(camera, {
                    type: "viewer-connected"
                });
            }

            return;
        }

        // Signalisation WebRTC
        if (message.type === "offer") {
            for (const viewer of viewers) {
                send(viewer, {
                    type: "offer",
                    offer: message.offer
                });
            }

            return;
        }

        if (message.type === "answer") {
            if (camera) {
                send(camera, {
                    type: "answer",
                    answer: message.answer
                });
            }

            return;
        }

        if (message.type === "ice") {
            if (message.target === "camera" && camera) {
                send(camera, {
                    type: "ice",
                    candidate: message.candidate
                });
            }

            if (message.target === "viewer") {
                for (const viewer of viewers) {
                    send(viewer, {
                        type: "ice",
                        candidate: message.candidate
                    });
                }
            }
        }
    });

    ws.on("close", () => {
        if (ws === camera) {
            camera = null;

            console.log("Caméra déconnectée");

            for (const viewer of viewers) {
                send(viewer, {
                    type: "camera-offline"
                });
            }
        }

        viewers.delete(ws);

        console.log("Client déconnecté");
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
