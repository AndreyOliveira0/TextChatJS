// Define "Chat" packets listed in server documentation
const packets = new Map();

// Prints a received message to console (either sent by yourself, from another user or by the server)
packets.set("chat", function(ws, args) {
	const id = args.sender;
	if(id !== undefined) {
		let username = ws.clients.get(id)?.username;
		console.log(`(CHAT) ${username}: ${args.message}`);
	} else {
		console.log(`SERVER: ${args.message}`);
	}
});

module.exports = packets;