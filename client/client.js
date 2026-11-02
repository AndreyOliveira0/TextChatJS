const PacketManager = require("./managers/packet-manager.js");
const WebSocket = require("ws");
const config = require("./modules/config.js");
const server_config = require("./modules/server_config.js");

// Initialization of WebSocket connection
const ws = new WebSocket(config.host);

// Packet utils
const { packetEncode, packetDecode } = require("./utils/packet.js");
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
			console.warn(`(WARNING) You must wait ${waitTime.toFixed(1)} seconds before sending another packet.`);
			return false;
		}
		ws.packetTimestamps.push(now);
	}

	if (ws.readyState !== WebSocket.OPEN) {
		console.error("(ERROR) Cannot send packet: Not connected.");
		return false;
	}
	ws.send(packetEncode(type, data));
	return true;
};
ws.clients = new Map();
ws.rooms = new Map();
ws.id = -1; // ID is overwritten once you connect to the server
ws.inRoom = undefined;
ws.username = config.username;
ws.authenticated = false;
ws.packetTimestamps = [];
console.log(`Connecting to ${config.host}...`);

// Server config/.env variables
ws.onopen = () => {
	console.log("Server reached! Sending handshake...");
	ws.sendPacket("handshake", { username: ws.username });
};

ws.onerror = (error) => {
    console.error(`(ERROR) WebSocket: ${error.message}`);
};

ws.onclose = (event) => {
	switch(event.code) {
		case 1000: {
			console.log("Disconnected from the server.");
			break;
		}
		case 4000: {
			console.log(`Disconnected: ${event.reason}`);
			break;
		}
		default: {
			console.log(`Connection closed (${event.code}): ${event.reason || "Unknown reason."}`);
			break;
		}
	}
	process.exit(0);
};

ws.onmessage = (event) => {
	const packet = packetDecode(event.data);
	if (!packet) {
		ws.close(1002, "Invalid packet.");
		return;
	}
	packets.handle(packet);
};

// Setup command line interface for client commands
if(config.cli) {
	require("./modules/cli.js")({ ws });
	console.log(`Type "help" to see the available commands.`);
}