const config = require("../modules/config.js");

// Define "Moderation" packets listed in client documentation
const packets = new Map();

// Client kicked another user from their room
packets.set("room_kick", function(server, client, ws, args) {
	if(!config.roomsEnabled) {
		server.send(ws, "error", {error: "Rooms are disabled in this server."});
		return;
	}

	const room = client.room;
	if(!room || room.owner != client) {
		server.send(ws, "error", {error: "You must be the room's owner to use this command."});
		return;
	}

	let toKick = undefined;
	const clientName = args.user;
	if(!clientName) {
		server.send(ws, "error", {error: "Invalid username."});
		return;
	}

	for (const user of room.clients.values()) {
		if(user.id == clientName || user.username.toLowerCase() == String(clientName).toLowerCase().trim()) {
			toKick = user;
			break;
		}
	}

	if(toKick == client) {
		server.send(ws, "error", {error: "You cannot kick yourself."});
		return;
	}

	if(toKick?.room == client.room) {
		server.writeLog(`(LOG) ${client.username} kicked ${toKick.username} from the room: ${room.name}`);
		room.removeClient(toKick, "kick");
	} else {
		server.send(ws, "error", {error: "Could not kick an invalid user from this room."});
	}
});

module.exports = packets;