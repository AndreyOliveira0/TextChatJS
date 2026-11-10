const config = require("../modules/config.js");

// Define "Rooms" packets listed in client documentation
const packets = new Map();

// Client requested to create a room
packets.set("create_room", function(server, client, ws, args) {
	if(!config.roomsEnabled) {
		server.send(ws, "error", {error: "Rooms are disabled in this server."});
		return;
	}

	// Invalid room data
	const roomName = (args.name ?? "").trim();
	const roomPass = args.password;
	if(roomName.length == 0) {
		server.send(ws, "error", {error: "Invalid room name."});
		return;
	}

	if(roomName.length > 24) {
		server.send(ws, "error", {error: `Room name is too long: ${roomName.length} / 24 digits.`});
		return;
	}

	if(roomPass && roomPass.length > 24) {
		server.send(ws, "error", {error: `Room password is too long: ${roomPass.length} / 24 digits.`});
		return;
	}

	const room = server.manager.createRoom({
		name: roomName,
		password: roomPass,
		maxClients: args.maxClients,
		owner: client
	});

	if(room) {
		if(client.room) {
			client.room.removeClient(client);
		}
		server.writeLog(`(LOG) ${client.username} created a room: ${args.name}`);
		server.broadcast("register_room", room.parseRoomData());
		room.addClient(client);
	} else {
		server.send(ws, "error", {error: "This room name is already in use! Try something else."});
	}
});

// Client requested to join an existing room
packets.set("join_room", function(server, client, ws, args) {
	if(!config.roomsEnabled) {
		server.send(ws, "error", {error: "Rooms are disabled in this server."});
		return;
	}

	let room = undefined;
	const roomName = args.name?.trim();
	for (const [id, value] of server.manager.rooms) {
		if (id == roomName || value.name === roomName) {
			room = value;
			break;
		}
	}
	if(room === undefined) {
		server.send(ws, "error", {error: `Room "${roomName}" not found.`});
		return;
	}
	if(client.room == room) {
		server.send(ws, "error", {error: `You are already in this room.`});
		return;
	}
	if(room.hasPassword && room.password != args.password) {
		server.send(ws, "error", {error: `Invalid password.`});
		return;
	}

	if(client.room) {
		client.room.removeClient(client);
	}
	server.writeLog(`(LOG) ${client.username} joined a room: ${args.name}`);
	room.addClient(client);
});

// Client requested to leave the room, if they're the room's owner, it will be closed
packets.set("quit_room", function(server, client, ws) {
	if(!config.roomsEnabled) {
		server.send(ws, "error", {error: "Rooms are disabled in this server."});
		return;
	}

	const room = client.room;
	if(room) {
		server.writeLog(`(LOG) ${client.username} left the room: ${room.name}`);
		room.removeClient(client);
	}
});

module.exports = packets;