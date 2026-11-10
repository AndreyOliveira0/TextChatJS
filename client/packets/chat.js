const { getTimeString } = require("../../shared/utils/time.js");

// Define "Chat" packets listed in server documentation
const packets = new Map();

// Prints a received message to console (either sent by yourself, from another user or by the server)
packets.set("chat", function(ws, args) {
	const id = args.sender;
	const timestamp = `[${getTimeString(new Date(Number.isFinite(args.timestamp) ? args.timestamp : Date.now()))}]`;
	if(id !== undefined) {
		let username = ws.clients.get(id)?.username;
		ws.parent.log(`${timestamp} (CHAT) ${username}: ${args.message}`);
	} else {
		ws.parent.log(`${timestamp} SERVER: ${args.message}`);
	}
});

module.exports = packets;