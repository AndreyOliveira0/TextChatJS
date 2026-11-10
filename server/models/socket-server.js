
const WebSocket = typeof window !== "undefined" ? window.WebSocket : require("ws"); //Browser flexibility
const ServerManager = require("../managers/server-manager.js");
const PacketManager = require("../managers/packet-manager.js");

// Initialization of the WebSocket servers
class ChatSocketServer {
	constructor(config) {
		const _host = config.host;
		const _port = config.port;

		const server = new WebSocket.Server({ host: _host, port: _port });
		server.parent = this;
		this.server = server;

		// Packet utils
		const { packetEncode, packetDecode } = require("../../shared/utils/packet.js");
		const packets = new PacketManager(server);

		// Add broadcast function for ease of usage since
		// it's not built-in in the WebSocket.Server class
		server.broadcast = function (type, data) {
			for (const ws of server.clients) {
				server.send(ws, type, data);
			}
		};
		server.send = function(ws, type, data) {
			if (ws.readyState === WebSocket.OPEN) {
				try {
					ws.send(packetEncode(type, data));
				} catch (error) {
					server.writeLog(`(ERROR) ${error.message}`);
				}
			}
		}
		const { writeLog } = require("../modules/log.js")();
		server.writeLog = writeLog;

		const manager = new ServerManager(server);
		server.manager = manager;

		server.openSince = Date.now();
		server.isClosing = false;

		// Client connectivity
		server.on('connection', (ws) => {
			if(config.maxClients > 0 && server.manager.getClientCount() >= config.maxClients) {
				ws.close(4000, "Server is full.");
				return;
			}

			const client = server.manager.addClient(ws);
			const timeout = setTimeout(() => {
				if (!client.authenticated) {
					ws.close(1008, "Handshake timeout");
				}
			}, config.handshakeTimeout);

			ws.on("close", () => {
				manager.removeClient(ws);
				if(!server.isClosing && client.authenticated) {
					server.writeLog(client.kicked ?
						`${client.username} got kicked from the server.` :
						`${client.username} left the server.`
					);
					server.broadcast("client_left", { id: client.id, reason: client.kicked ? "kick" : "disconnect" });
				}
				clearTimeout(timeout);
			});

			ws.on("error", (error) => {
				server.writeLog(`(ERROR) Client connection error: ${error.message}`);
			});
			
			// Client packets
			ws.on("message", (data) => {
				let packet;
				try {
					packet = packetDecode(data);
				} catch (error) {
					server.writeLog(`(ERROR) ${error.message}`);
				}

				if (!packet) {
					ws.close(1002, "Invalid packet.");
					return;
				}

				// rate limit
				if (!client.canSendPacket()) {
					return;
				}
				packets.handle(client, ws, packet);
			});
		});
		console.log(`Server started on ws://${_host}:${_port}`);
	}
}
module.exports = ChatSocketServer;