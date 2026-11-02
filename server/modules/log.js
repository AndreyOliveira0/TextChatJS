

const fs = require("fs");
const path = require("path");
const config = require("./config.js");
const { getTimeString } = require("../utils/time.js");

module.exports = () => {
	logStream = null;
	if(config.logEnabled) {
		const date = new Date(Date.now());
		const year = date.getUTCFullYear().toString();
		const months = (date.getUTCMonth() + 1).toString().padStart(2, "0");
		const days = date.getUTCDate().toString().padStart(2, "0");
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		const seconds = date.getSeconds().toString().padStart(2, "0");
		const dateStr = `${year}-${months}-${days}_${hours}-${minutes}-${seconds}`;
		
		// Ensure logs directory exists
		const logsDir = path.join(__dirname, "..", "logs");
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}

		// Init log file
		const logFilePath = path.join(logsDir, dateStr + ".txt");
		logStream = fs.createWriteStream(logFilePath, { flags: "a" });
	}

	function writeLog(line) {
		const message = `[${getTimeString()}] ${line}`;
		logStream?.write(message + "\n");
		console.log(message);
	};
	return { writeLog };
}