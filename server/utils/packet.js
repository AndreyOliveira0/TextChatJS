module.exports = (server) => {
	function packetEncode(type, args) {
		try {
			// Packet type validation
			if (typeof type !== "string" || type.trim().length === 0) {
				throw new Error("Invalid packet type");
			}
			const packet = { type };

			// Packet args validation
			if (args !== undefined) {
				if (typeof args !== "object" || args === null || Array.isArray(args)) {
					throw new Error("Invalid packet arguments");
				}
				packet.args = args;
			}
			return JSON.stringify(packet);
		} catch (error) {
			server.writeLog(`(ERROR) Failed to encode packet: ${error.message}`);
			return null;
		}
	}

	function packetDecode(data) {
		try {
			const packet = JSON.parse(data);

			// Packet type validation
			if (typeof packet !== "object" || packet === null || Array.isArray(packet) ||
				typeof packet.type !== "string" || packet.type.trim().length === 0)
			{
				throw new Error("Invalid packet type");
			}

			// Packet args validation
			if (packet.args !== undefined &&
				(typeof packet.args !== "object" || packet.args === null || Array.isArray(packet.args)))
			{
				throw new Error("Invalid packet arguments");
			}

			return {
				type: packet.type,
				args: packet.args ?? {}
			};
		} catch (error) {
			server.writeLog(`(ERROR) Failed to decode packet: ${error.message}`);
			return null;
		}
	}
	return { packetEncode, packetDecode };
};