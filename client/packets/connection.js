const server_config = require("../modules/server_config.js");

// Define "Connection" packets listed in server documentation
const packets = new Map();

// Server sent final handshake to client,
// set server_config variables to save the server's information
packets.set("handshake", function(ws, args) {
	for (let client of (args.clients ?? [])) {
		ws.clients.set(client.id, {
			id: client.id,
			username: client.username,
			room: undefined,
		});
	}
	ws.id = args.id;
	ws.username = args.username;
	
	// Store server variables
	server_config.maxClients = args.maxClients;
	server_config.chatMaxLength = args.chatMaxLength;
	server_config.rateLimit = args.rateLimit;
	server_config.roomsEnabled = args.roomsEnabled;
	server_config.roomsMaxUsers = args.roomsMaxUsers;
	ws.authenticated = true;
});

// Server response from ping check
packets.set("pong", function(ws, args) {
	const timestamp = args.timestamp;
	if(typeof timestamp !== "number" || !Number.isFinite(timestamp) || timestamp <= 0) {
		ws.parent.error("Invalid timestamp formatting sent!");
		return;
	}

	const latency = Date.now() - args.timestamp;
	ws.parent.log(`> Latency: ${latency}`);
});

// Received data from a new client
packets.set("client_join", function(ws, args) {
	const id = args.id;
	const username = args.username;
	ws.clients.set(args.id, { id, username });
	ws.parent.log(`${username} connected to the server.`);
});

// Erases client data due to disconnection
packets.set("client_left", function(ws, args) {
	const username = ws.clients.get(args.id).username;
	ws.clients.delete(args.id);
	if(!ws.inRoom) {
		// Suppress warning if you're inside a room
		switch(args.reason) {
			case "kick": {
				ws.parent.log(`${username} got kicked from the server.`);
				break;
			}
			case "disconnect": {
				ws.parent.log(`${username} left the server.`);
				break;
			}
			default: {
				ws.parent.log(`${username} left the server. (Reason: "${args.reason}")`);
				break;
			}
		}
	}
});

// Server initialized shutdown sequence
packets.set("server_closed", function(ws) {
	ws.close(4000, "Server has been closed.");
});

module.exports = packets;