const WebSocket = typeof window !== "undefined" ? window.WebSocket : require("ws"); //Browser flexibility
const PacketManager = require("../managers/packet-manager.js");
const server_config = require("../modules/server_config.js");

class ChatSocketClient {
	constructor(config) {
		const _username = config.username;
		const _host = config.host;

		// Initialization of WebSocket connection
		const ws = new WebSocket(_host);
		ws.parent = this;
		this.ws = ws;

		// Event system
		this._packetReceived = new Map();

		// Packet utils
		const { packetEncode, packetDecode } = require("../../shared/utils/packet.js");
		const packets = new PacketManager(ws);

		// Implement necessary socket variables/functions
		ws.sendPacket = function(type, data) {
			const limit = server_config.rateLimit;
			if (ws.authenticated && limit > 0) {
				const now = Date.now();

				// Remove oldest timestamps outside the one-second window
				while (ws.packetTimestamps.length > 0) {
					if (now - ws.packetTimestamps[0] < 1000) break;
					ws.packetTimestamps.shift();
				}

				if (ws.packetTimestamps.length >= limit) {
					const waitTime = (1000 - (now - ws.packetTimestamps[0])) / 1000;
					ws.parent.warn(`You must wait ${waitTime.toFixed(1)} seconds before sending another packet.`);
					return false;
				}
				ws.packetTimestamps.push(now);
			}

			if (ws.readyState !== WebSocket.OPEN) {
				ws.parent.error("Cannot send packet: Not connected.");
				return false;
			}
			
			try {
				ws.send(packetEncode(type, data));
			} catch (error) {
				ws.parent.error(error.message);
			}
			return true;
		};
		ws.clients = new Map();
		ws.rooms = new Map();
		ws.id = -1; // ID is overwritten once you connect to the server
		ws.inRoom = undefined;
		ws.username = _username;
		ws.authenticated = false;
		ws.packetTimestamps = [];
		console.log(`Connecting to ${_host}...`);

		// Server config/.env variables
		ws.onopen = (event) => this.onConnectionOpen(event);
		ws.onerror = (event) => this.onConnectionError(event);
		ws.onclose = (event) => this.onConnectionClose(event);

		ws.onmessage = (event) => {
			let packet;
			try {
				packet = packetDecode(event.data);
			} catch (error) {
				this.error(error.message);
			}

			if (!packet) {
				ws.close(1002, "Invalid packet.");
				return;
			}
			packets.handle(packet);
			this.onPacketReceived(packet.type, packet.args);
		};
	}

	// Socket events
	onConnectionOpen(event) {
		this.log("Server reached! Sending handshake...");
		this.ws.sendPacket("handshake", { username: this.ws.username });
	}
	onConnectionError(error) {
		this.error(`(ERROR) WebSocket: ${error.message}`);
	}
	onConnectionClose(event) {
		switch(event.code) {
			case 1000: {
				this.log("Disconnected from the server.");
				break;
			}
			case 4000: {
				this.log(`Disconnected: ${event.reason}`);
				break;
			}
			default: {
				this.log(`Connection closed (${event.code}): ${event.reason || "Unknown reason."}`);
				break;
			}
		}
		process.exit(0);
	}
	
	// Event logging
	onReceivePacket(type, fn) {
		this._packetReceived.set(type, fn);
	}
	onPacketReceived(type, args) {
		if(!this._packetReceived.has(type)) {
			return false;
		}
		const ev = this._packetReceived.get(type);
		ev(args);
		return true;
	}
	error(err) {
		console.error(`(ERROR) ${err}`);
	}
	warn(warning) {
		console.warn(`(WARNING) ${warning}`);
	}
	log(msg) {
		console.log(msg);
	}
}

module.exports = ChatSocketClient;