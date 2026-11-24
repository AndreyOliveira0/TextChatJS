// Command line arguments: --username, --host, --cli
const { parseArgs } = require("node:util");

const config = {
	options: {
		username: {
			type: "string",
			short: "u",
			default: "User"
		},
		host: {
			type: "string",
			short: "h",
			default: "ws://0.0.0.0:3000"
		},
		cli: {
			type: "string",
			short: "c",
			default: "true"
		}
	},
	allowPositionals: false,
};
const { values } = parseArgs(config);
module.exports = values;