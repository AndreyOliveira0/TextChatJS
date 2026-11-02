const Room = require("../models/room.js");
const Client = require("../models/client.js");

class ServerManager {
	constructor(server) {
		this.server = server;
		this.clients = new Map();
		this.rooms = new Map();
	}

	// Clients
	addClient(ws) {
		const client = new Client(ws, this.server);
		this.clients.set(ws, client);
		return client;
	}
	removeClient(ws) {
		if(!this.clients.has(ws)) return;

		const client = this.clients.get(ws);
		client.room?.removeClient(client);
		this.clients.delete(ws);
	}
	getClientList() {
		const l = [];
		for (let client of this.clients.values()) {
			if(client.authenticated) {
				l.push({ id: client.id, username: client.username });
			}
		}
		return l;
	}
	getClientCount() {
		return this.clients.size;
	}

	// Rooms
	createRoom(data) {
		for (let room of this.rooms.values()) {
			if(data.name === room.name) {
				// Checks room by name to see if it already exists
				// if so, do not create room.
				return null;
			}
		}
		return this.addRoom(data);
	}
	addRoom(data) {
		const room = new Room(this.server, data);
		this.rooms.set(room.id, room);
		return room;
	}
	removeRoom(room) {
		if(!this.rooms.has(room.id)) return;

		this.rooms.delete(room.id);
	}
	getRoomList() {
		const l = [];
		for (let room of this.rooms.values()) {
			l.push(room.parseRoomData());
		}
		return l;
	}
	getRoomsCount() {
		return this.rooms.size;
	}
}

module.exports = ServerManager;