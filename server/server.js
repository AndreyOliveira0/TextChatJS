const config = require("./modules/config.js");
const ChatSocketServer =  require("./models/socket-server.js");

// Initialize TextChatJS WebSocket
// Change its options through .env file
const server = new ChatSocketServer(config);

// Setup command line interface for server commands
if(config.cliEnabled) {
	const setupCLI = require("./modules/cli.js")(server.server);
	setupCLI();
	console.log(`Type "help" to see the available commands.`);
}