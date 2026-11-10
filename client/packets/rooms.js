// Define "Rooms" packets listed in server documentation
const packets = new Map();

// A new server was successfully created in the server, store its data
packets.set("register_room", function(ws, args) {
	const l = new Map();
	for (let id of args.clients) {
		l.set(id, ws.clients.get(id));
	}

	const room = {
		id: args.id,
		name: args.name,
		hasPassword: args.hasPassword,
		maxClients: args.maxClients,
		clients: args.clients ?? [],
		owner: ws.clients.get(args.owner)
	};
	ws.rooms.set(room.id, room);

	for (const id of room.clients) {
		ws.clients.get(id).room = room;
	}
});

// A client joined a room, update this client's data
packets.set("join_room", function(ws, args) {
	const client = ws.clients.get(args.id);
	const room = ws.rooms.get(args.room);
	client.room = room;
	room.clients.push(client.id);

	if(client.id == ws.id) {
		ws.inRoom = room;
		if(room.owner.id == client.id) {
			ws.parent.log(`You have successfully created the room \"${room.name}\"!`)
		} else {
			ws.parent.log(`You have joined the room \"${room.name}\"!`)
		}
	} else if(room == ws.inRoom) {
		ws.parent.log(`${client.username} joined the room.`);
	}
});

// A client left a room, update this client's data
packets.set("quit_room", function(ws, args) {
	const client = ws.clients.get(args.id);
	const room = ws.rooms.get(args.room);
	const index = room.clients.indexOf(client.id);
	if (index > -1) room.clients.splice(index, 1);

	// If you are the one who left the room, ws uses inRoom instead
	if(client.id == ws.id) {
		ws.inRoom = undefined;
	} else {
		client.room = undefined;
	}

	const username = client.id != ws.id ? client.username : "You";

	switch(args.reason) {
		case "server_kick": {
			ws.parent.log(`${username} got kicked from the room by the server operator.`);
			break;
		}
		case "kick": {
			ws.parent.log(`${username} got kicked from the room.`);
			break;
		}
		case "disconnect": {
			ws.parent.log(`${username} left the room.`);
			break;
		}
		default: {
			ws.parent.log(`${username} left the room. (Reason: "${args.reason}")`);
			break;
		}
	}

	const yourRoom = ws.clients.get(ws.id).room;
	if(yourRoom == room && room.owner.id == client.id) {
		// Owner of the room left
		switch(args.reason) {
			case "server_kick":
			case "kick": {
				ws.parent.warn("This room will be closed because the owner got kicked.");
				break;
			}
			case "disconnect": {
				ws.parent.warn("This room will be closed because the owner left.");
					break;
			}
			default: {
				ws.parent.warn(`This room will be closed because the owner left. (Reason: "${args.reason}")`);
				break;
			}
		}
	}
});

// A room got closed, clear room data from all clients inside it
packets.set("room_closed", function(ws, args) {
	const room = ws.rooms.get(args.room);
	room.clients.forEach(id => {
		const client = ws.clients.get(id);
		if(client.room == room) {
			if (client.id === ws.id) {
				ws.inRoom = undefined;
			}
			client.room = undefined;
		}
	});
	ws.rooms.delete(args.room);
});

module.exports = packets;