const server_config = require("../modules/server_config.js");

module.exports = function(ws) {
	const commandList = {
		help: {
			description: "Show available commands",
			args: 0,
			execute: () => {
				const msg = [];
				msg.push("> Listing available commands...");
				for (const [i, [cmdKey, cmd]] of Object.entries(commandList).entries()) {
					msg.push(`[${i + 1}] ${cmdKey}: ${cmd.description}`);
				}
				ws.parent.log(msg.join("\n"));
			}
		},
		say: {
			description: "Sends a message to all clients, usage: say <message>",
			args: 1,
			execute: (args) => {
				if(server_config.roomsEnabled && ws.inRoom === undefined) {
					ws.parent.error(`You must create or join a room to talk!`);
					return;
				}

				// Block messages that are too long (This is also handled in the server-side for safety)
				let message = args.join(" ").trim();
				if(message.length == 0) {
					ws.parent.error(`Message cannot be empty.`);
					return;
				}
				else if(message.length > server_config.chatMaxLength) {
					ws.parent.error(`Could not send message because its too long: ${message.length} / ${server_config.chatMaxLength} digits.`);
					return;
				}
				ws.sendPacket("chat", { message });
			},
		},
		createroom: {
			description: "Creates a room, usage: createroom <name> <password (optional)> <max users (optional)>",
			args: 3,
			execute: (args) => {
				if(!server_config.roomsEnabled) {
					ws.parent.error("Command disabled: Rooms are disabled in this server.");
					return;
				}

				const roomName = (args[0] ?? "").trim();
				const roomPass = (args[1] ?? "");
				if(roomName.length == 0) {
					ws.parent.error("Invalid room name.");
					return;
				}

				if(roomName.length > 24) {
					ws.parent.error(`Room name is too long: ${roomName.length} / 24 digits.`)
					return;
				}

				if(roomPass.length > 24) {
					ws.parent.error(`Room password is too long: ${roomPass.length} / 24 digits.`)
					return;
				}
				ws.sendPacket("create_room", { name: roomName, ... (roomPass.length > 0 && { password: roomPass }), ... (args[2] && { maxClients: args[2] }) });
			}
		},
		joinroom: {
			description: "Join a room, usage: joinroom <id/name> <password (optional)>",
			args: 2,
			execute: (args) => {
				if(!server_config.roomsEnabled) {
					ws.parent.error("Command disabled: Rooms are disabled in this server.");
					return;
				}

				if(!args[0] || args[0].length == 0) {
					ws.parent.error("Invalid room name.");
					return;
				}

				if(ws.inRoom == args[0]) {
					ws.parent.error("You are already in this room.");
					return;
				}
				ws.sendPacket("join_room", { name: args[0], ... (args[1] && { password: args[1] }) });
			}
		},
		quitroom: {
			description: "Leaves the room you are in.",
			args: 0,
			execute: () => {
				if(!server_config.roomsEnabled) {
					ws.parent.error("Command disabled: Rooms are disabled in this server.");
					return;
				}

				if(ws.inRoom === undefined) {
					ws.parent.error("You are not in a room!");
					return;
				}
				ws.sendPacket("quit_room");
			}
		},
		kick: {
			description: "Kicks a client from the room, usage: kick <id/username>",
			args: 1,
			execute: (args) => {
				if(!server_config.roomsEnabled) {
					ws.parent.error("Command disabled: Rooms are disabled in this server.");
					return;
				}

				if(ws.inRoom === undefined || ws.inRoom.owner.id != ws.id) {
					ws.parent.error("You must be owner of this room to use this command!");
					return;
				}

				let toKick = undefined;
				const clientName = args[0];
				if(!clientName || clientName.length == 0) {
					ws.parent.error("Invalid username.");
					return;
				}

				for (const id of ws.inRoom.clients.values()) {
					const user = ws.clients.get(id);
					if(user.id == clientName || user.username.toLowerCase() == String(clientName).toLowerCase().trim()) {
						toKick = user;
						break;
					}
				}

				if(toKick.id == ws.id) {
					ws.parent.error("You cannot kick yourself.");
					return;
				}
				ws.sendPacket("room_kick", { user: clientName });
			}
		},
		status: {
			description: "Shows users and rooms.",
			args: 0,
			execute: () => {
				const clientsConnected = ws.clients.size;
				const roomsCount = ws.rooms.size;
				const clientsStatus = server_config.maxClients > 0
					? `${clientsConnected} / ${server_config.maxClients}`
					: `${clientsConnected}`;

				let usersList = "";
				if(clientsConnected > 0) {
					const names = [];
					for (let client of ws.clients.values()) {
						names.push(client.username);
					}
					usersList = names.join(", ");
				} else {
					usersList = "None";
				}

				let output = `> Server Status:` +
					`\n-- Clients (${clientsStatus}): ${usersList}`;
				
				if(server_config.roomsEnabled) {
					output += `\n-- Rooms (${roomsCount}):`;
					if(ws.rooms.size > 0) {
						for (let room of ws.rooms.values()) {
							const names = [];
							room.clients.forEach(id => {
								const user = ws.clients.get(id);
								let username = user.username;
								if(room.owner == user) username = `✮ ${username}`; //Add a star mark to the owner

								names.push(username);
							});
							output += `\n    - ${room.name} (${room.clients.length} / ${room.maxClients}): ${names.join(", ")}`;
						}
					} else {
						output += " None";
					}
				}
				ws.parent.log(output);
			}
		},
		ping: {
			description: "Send a ping packet to the server.",
			args: 0,
			execute: () => {
				const timestamp = Date.now();
				ws.sendPacket("ping", { timestamp });
			}
		},
		quit: {
			description: "Disconnect from the server",
			args: 0,
			execute: () => {
				ws.close(1000);
			}
		}
	};
	return commandList;
}