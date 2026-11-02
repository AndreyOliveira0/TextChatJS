class PacketManager {
	constructor(server) {
		this.server = server;
		this.handlers = new Map();

		// To create a new packet category, import it to "../packets/index.js"
		const packets = require("../packets/");
		for (const category of Object.values(packets)) {
			for (const [type, handler] of category) {
				if (this.handlers.has(type)) {
					throw new Error(`Duplicate packet handler: ${type}`);
				}
				this.handlers.set(type, handler);
			}
		}
	}

	handle(client, ws, packet) {
		const handler = this.handlers.get(packet.type);
		if (!handler) {
			this.server.writeLog(
				`(ERROR) ${client.username} sent an unhandled packet of type "${packet.type}"`
			);
			return;
		}
		handler(this.server, client, ws, packet.args);
	}
}

module.exports = PacketManager;