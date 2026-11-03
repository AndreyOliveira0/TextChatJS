const config = require("../modules/config.js");

// Define "Chat" packets listed in client documentation
const packets = new Map();

// Chat must contain only "message", the sender's ID is get from the manager to avoid username spoofing
packets.set("chat", function(server, client, ws, args) {
	// Client cant talk if not in a room (and rooms are enabled)
	if(config.roomsEnabled && !client.room) {
		server.send(ws, "error", {error: "You are not in a room!"});
		return;
	}

	// Limit text length to prevent server freezes from excessively long messages
	let message = args.message;
	if(message.length > config.chatMaxLength) {
		message = message.slice(0, config.chatMaxLength);
	}

	const argsToSend = {
		message,
		sender: client.id,
		timestamp: Date.now()
	};

	if(config.roomsEnabled) {
		// Send message to all users on the room
		client.room.send("chat", argsToSend);
		server.writeLog(`(CHAT) ${client.room.name} | ${client.username}: ${message}`);
	} else {
		// Rooms are disabled: Instead, broadcast message to all users
		server.broadcast("chat", argsToSend);
		server.writeLog(`(CHAT) ${client.username}: ${message}`);
	}
});

module.exports = packets;