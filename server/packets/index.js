// Defines all available packet types for the packet manager
module.exports = {
	connection: require("./connection.js"),
	chat: require("./chat.js"),
	moderation: require("./moderation.js"),
	rooms: require("./rooms.js"),
}