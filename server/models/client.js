const config = require("../modules/config.js");

var idCounter = 0;
class Client {
	constructor(ws, server) {
		this.ws = ws;
		this.server = server;
		this.id = idCounter++;
		this.username = undefined;
		this.authenticated = false;
		this.room = undefined;
		this.kicked = false;
		this.packetTimestamps = [];
	}

	approve(username) {
		this.username = username;
		this.authenticated = true;
	}
	canSendPacket() {
		const limit = config.rateLimit;
		if(!this.authenticated || limit < 1) {
			// Let handshakes not be restricted by rate limit
			return true;
		}

		// Remove timestamps older than one second
		const now = Date.now();
		this.packetTimestamps = this.packetTimestamps.filter(
			timestamp => now - timestamp < 1000
		);

		if (this.packetTimestamps.length >= limit) {
			return false;
		}
		this.packetTimestamps.push(now);
		return true;
	}
}
module.exports = Client;