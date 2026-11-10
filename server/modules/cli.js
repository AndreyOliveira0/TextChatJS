// Toggleable command line interface (Turn it on/off through .env file)
const config = require("./config.js");

module.exports = (server) => {
	const commandList = require("../modules/commands.js")(server);
	function setupCLI() {
		const readline = require("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.on("line", (input) => {
			const command = input.trim().split(/\s+/)[0].toLowerCase();
			const rawArgs = input.trim().slice(command.length).trimStart();
			if (commandList[command]) {
				const args = parseArgs(
					rawArgs,
					commandList[command].args >= 2
				);
				commandList[command].execute(args);
			} else {
				console.log(`Unknown command: ${command}`);
			}
		});

		function parseArgs(input, parseQuotes = true) {
			if (!parseQuotes) {
				return input ? [input] : [];
			}

			const args = [];
			const regex = /"([^"]*)"|(\S+)/g;
			let match;
			while ((match = regex.exec(input)) !== null) {
				args.push(match[1] ?? match[2]);
			}
			return args;
		}
	}
	return setupCLI;
}