function packetEncode(type, args) {
	// Packet type validation
	if (typeof type !== "string" || type.trim().length === 0) {
		throw new Error("Invalid packet type");
	}

	let packet;
	try {
		packet = { type };
	} catch (error) {
		throw new Error(`Failed to encode packet: ${error.message}`, { cause: error });
	}

	// Packet args validation
	if (args !== undefined) {
		if (typeof args !== "object" || args === null || Array.isArray(args)) {
			throw new Error("Invalid packet arguments");
		}
		packet.args = args;
	}
	return JSON.stringify(packet);
}

function packetDecode(data) {
	let packet;
	try {
		packet = JSON.parse(data);
	} catch (error) {
		throw new Error(`Failed to decode packet: ${error.message}`, { cause: error });
	}

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
}

module.exports = { packetEncode, packetDecode };