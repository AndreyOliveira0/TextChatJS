const config = require("../modules/config.js");

module.exports = function(server) {
	const commandList = {
		help: {
			description: "Show available commands",
			args: 0,
			execute: () => {
				console.log("> Listing available commands...");
				for (const [i, [cmdKey, cmd]] of Object.entries(commandList).entries()) {
					console.log(`[${i + 1}] ${cmdKey}: ${cmd.description}`);
				}
			}
		},
		say: {
			description: "Sends a message to all clients, usage: say <message>",
			args: 1,
			execute: (args) => {
				let message = args.join(" ").trim();
				if(message.length == 0) {
					console.error(`(ERROR) Message cannot be empty.`);
					return;
				}

				server.broadcast("chat", { message });
				server.writeLog(`SERVER: ${message}`);
			}
		},
		kick: {
			description: "Kicks client from the server, usage: kick <id/username>",
			args: 1,
			execute: (args) => {
				let toKick = undefined;
				const clientName = args[0];
				if(!clientName || clientName.length == 0) {
					console.error("(ERROR) Invalid username.");
					return;
				}

				for (const user of server.manager.clients.values()) {
					if(user.id == clientName || user.username.toLowerCase() == String(clientName).toLowerCase().trim()) {
						toKick = user;
						break;
					}
				}

				if(toKick) {
					server.writeLog(`(LOG) Kicked ${toKick.username} from the server.`);
					toKick.kicked = true;
					toKick.ws.close(4000, "You have been kicked from the server.");
				} else {
					console.error("(ERROR) Invalid username.");
				}
			}
		},
		roomkick: {
			description: "Kicks client from their connected room, usage: roomkick <id/username>",
			args: 1,
			execute: (args) => {
				if(!config.roomsEnabled) {
					console.error("(ERROR) Command disabled: Rooms are disabled.");
					return;
				}

				let toKick = undefined;
				const clientName = args[0];
				if(!clientName || clientName.length == 0) {
					console.error("(ERROR) Invalid username.");
					return;
				}

				for (const user of server.manager.clients.values()) {
					if(user.id == clientName || user.username.toLowerCase() == String(clientName).toLowerCase().trim()) {
						toKick = user;
						break;
					}
				}

				if(toKick) {
					const room = toKick.room;
					if(room) {
						server.writeLog(`(LOG) Kicked ${toKick.username} from their room: ${room.name}`);
						room.removeClient(toKick, "server_kick");
					} else {
						console.error(`(ERROR) ${toKick.username} is not inside a room.`);
					}
				} else {
					console.error("(ERROR) Invalid username.");
				}
			}
		},
		status: {
			description: "Shows server status",
			args: 0,
			execute: () => {
				const uptime = Date.now() - server.openSince;
				const seconds = Math.floor(uptime / 1000) % 60;
				const minutes = Math.floor(uptime / (1000 * 60)) % 60;
				const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
				const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

				const uptimeString = [
					days > 0 ? `${days}d` : null,
					hours > 0 ? `${hours}h` : null,
					minutes > 0 ? `${minutes}m` : null,
					`${seconds}s`
				].filter(Boolean).join(" ");

				const clientsConnected = server.manager.getClientCount();
				const roomsCount = server.manager.rooms.size;
				const clientsStatus = config.maxClients > 0
					? `${clientsConnected} / ${config.maxClients}`
					: `${clientsConnected}`;

				let usersList = "";
				if(clientsConnected > 0) {
					const names = [];
					for (let client of server.manager.clients.values()) {
						names.push(client.username);
					}
					usersList = names.join(", ");
				} else {
					usersList = "None";
				}

				let output = `> Server Status:` +
					`\n-- Running for: ${uptimeString}` +
					`\n-- Clients (${clientsStatus}): ${usersList}`;
				
				if(config.roomsEnabled) {
					output += `\n-- Rooms (${roomsCount}):`;
					if(server.manager.getRoomsCount() > 0) {
						for (let room of server.manager.rooms.values()) {
							output += `\n    - ${room.name} (${room.getClientCount()} / ${room.maxClients}): ${room.getClientNames().join(", ")}`;
						}
					} else {
						output += " None";
					}
				}
				console.log(output);
			}
		},
		stop: {
			description: "Stops the server",
			args: 0,
			execute: () => {
				server.writeLog("> Initializing shutdown sequence...");
				server.isClosing = true;
				server.broadcast("server_closed");

				const shutdownTimeout = setTimeout(() => {
					for (const client of server.manager.clients.values()) {
						client.ws?.terminate();
					}
				}, config.handshakeTimeout);

				server.close(() => {
					clearTimeout(shutdownTimeout);
					server.writeLog("--- SERVER STOPPED ---");
				});
			}
		}
	};
	return commandList;
}