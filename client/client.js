const config = require("./modules/config.js");
const ChatSocketClient =  require("./models/socket-client.js");

// Initialize TextChatJS WebSocket
// config: --host (--h), --username (--u), --cli (--c)
const client = new ChatSocketClient(config);

// Setup command line interface for client commands
const _cli = (config.cli == "true");
if(_cli) {
	const setupCLI = require("./modules/cli.js")(client.ws);
	setupCLI();
	console.log(`Type "help" to see the available commands.`);
}