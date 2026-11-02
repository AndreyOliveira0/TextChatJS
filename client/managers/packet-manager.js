class PacketManager {
	constructor(ws) {
		this.ws = ws;
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

	handle(packet) {
		const handler = this.handlers.get(packet.type);
		if (!handler) {
			console.error(`(ERROR) Unhandled packet of type "${packet.type}"`);
			return;
		}
		handler(this.ws, packet.args);
	}
}

module.exports = PacketManager;