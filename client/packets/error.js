// Define "Error Handling" packets listed in server documentation
const packets = new Map();

// Server returns an error, print to console
packets.set("error", function(_, args) {
	console.error(`(ERROR) ${args.error}`);
});

module.exports = packets;