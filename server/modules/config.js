// Setup .env file/load environment variables
require ("dotenv").config({ quiet: true });

const config = {
	// Connection settings
	host: process.env.SERVER_HOST || "0.0.0.0",
	port: parseInt(process.env.SERVER_PORT) || 3000,
	maxPayload: parseInt(process.env.SERVER_MAX_PAYLOAD) || 16384,

	// Server settings
	maxClients: parseInt(process.env.SERVER_MAX_CONNECTIONS) || 0,
	chatMaxLength: parseInt(process.env.MESSAGE_MAX_LENGTH) || 100,
	rateLimit: parseInt(process.env.RATE_LIMIT) || 5,
	roomsEnabled: process.env.ROOMS_ENABLED === "true",
	roomsMaxUsers: parseInt(process.env.ROOMS_MAX_USERS) || 10,
	handshakeTimeout: parseInt(process.env.HANDSHAKE_TIMEOUT) || 10000,
	cliEnabled: process.env.SERVER_ENABLE_CLI === "true",
	logEnabled: process.env.SERVER_LOG === "true",
};
module.exports = config;