// Define "Error Handling" packets listed in server documentation
const packets = new Map();

// Server returns an error, print to console
packets.set("error", function(ws, args) {
	ws.parent.error(args.error);
});

module.exports = packets;