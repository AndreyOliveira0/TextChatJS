const config = require("../modules/config.js");

var idCounter = 0
class Room {
	constructor(server, { name = 'room-name', password, owner, maxClients }) {
		this.server = server;
		this.clients = new Map();
		this.id = idCounter++;

		this.name = name;
		this.owner = owner;
		this.changeMaxClients(parseInt(maxClients, 10));
		this.changePassword(password);
	}

	send(type, data) {
		for (const client of this.clients.values()) {
			this.server.send(client.ws, type, data);
		}
	};

	close() {
		this.server.manager.removeRoom(this);
		for (let client of this.clients.values()) {
			client.room = undefined;
		}
		this.clients.clear();
		this.owner = undefined;
		this.server.broadcast("room_closed", { room: this.id });
		this.server.writeLog(`(LOG) Closed room: ${this.name}`);
	}

	// Room settings
	changeMaxClients(maxClients) {
		if(isNaN(maxClients) || maxClients === undefined) maxClients = config.roomsMaxUsers;
		this.maxClients = Math.max(1, Math.min(config.roomsMaxUsers, maxClients)); // ensure room's max clients is in bounds
	}
	changePassword(password) {
		this.password = password ?? "";
		this.hasPassword = this.password.length > 0;
	}

	// Clients
	addClient(client) {
		this.server.broadcast("join_room", { id: client.id, room: this.id });
		this.clients.set(client.id, client);
		client.room = this;
	}
	removeClient(client, reason = "disconnect") {
		const roomID = client.room.id;
		this.clients.delete(client.id);
		client.room = undefined;

		// Owner of the room left, delete room.
		if(reason == "disconnect") this.server.writeLog(`(LOG) ${client.username} left the room: ${this.name}`);
		this.server.broadcast("quit_room", { id: client.id, room: roomID, reason });
		if(this.owner.id == client.id) {
			this.close();
		}
	}
	getClientNames() {
		const l = [];
		for (let client of this.clients.values()) {
			l.push(client.username);
		}
		return l;
	}
	getClientIDs() {
		//This function is used to parse the room's client list for sending
		const l = [];
		for (let client of this.clients.values()) {
			l.push(client.id);
		}
		return l;
	}
	getClientCount() {
		return this.clients.size;
	}

	// Packet data
	parseRoomData() {
		// This function formats the room's data for packet sending,
		// avoid exposing the real password for clients.
		return {
			id: this.id,
			name: this.name,
			hasPassword: this.hasPassword,
			maxClients: this.maxClients,
			clients: this.getClientIDs(),
			owner: this.owner.id
		};
	}
}
module.exports = Room;