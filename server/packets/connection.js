const config = require("../modules/config.js");

// Define "Connection" packets listed in client documentation
const packets = new Map();

// Client connects -> Client sends handshake -> Server receives handshake -> Server sends a final handshake to the client
packets.set("handshake", function(server, client, ws, args) {
	let origUsername = args.username;
	if(origUsername === undefined || typeof origUsername != "string" || origUsername.trim().length == 0) {
		origUsername = "User";
	} else {
		origUsername = origUsername.trim();
	}

	// Check for duplicated usernames and concatenate a numerical postfix to differentiate users
	const usernamesList = server.manager.getClientList().map(client => client.username);
	let username = origUsername;

	let i = 1;
	while(usernamesList.includes(username)) {
		username = `${origUsername}-${i}`;
		i++;
	}

	server.send(ws, "handshake", {
		maxClients: config.maxClients,
		chatMaxLength: config.chatMaxLength,
		rateLimit: config.rateLimit,
		roomsEnabled: config.roomsEnabled,
		roomsMaxUsers: config.roomsMaxUsers,
		clients: server.manager.getClientList(),
		id: client.id,
		username
	});

	// Send all rooms' data for sync
	for (const room of server.manager.rooms.values()) {
		server.send(ws, "register_room", room.parseRoomData());
	}

	// client_join must be sent before approving user to avoid any potential conflicts with client list.
	server.broadcast("client_join", { id: client.id, username });
	client.approve(username);
	server.writeLog(`${username} connected to the server.`);
});

// Client is requesting latency
packets.set("ping", function(server, _, ws, args) {
	const timestamp = args.timestamp;
	if(typeof timestamp !== "number" || !Number.isFinite(timestamp) || timestamp <= 0) {
		server.send(ws, "error", { error: "Invalid timestamp formatting sent!" });
		return;
	}
	server.send(ws, "pong", { timestamp });
});

module.exports = packets;