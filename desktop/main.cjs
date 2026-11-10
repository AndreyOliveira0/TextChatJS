const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

const ChatSocketClient = require("../client/models/socket-client.js");
const createCommands = require("../client/modules/commands.js");

let mainWindow = null;
let chatClient = null;
let commandList = null;
let allowLogPrint = false;

function sendEvent(type, data = {}) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("chat:event", { type, ...data });
	}
}

function getCollectionSize(collection) {
	if (!collection) return 0;
	if (typeof collection.size === "number") return collection.size;
	if (Array.isArray(collection)) return collection.length;
	return 0;
}

function getSocketState() {
	if (!chatClient?.ws) {
		return {
			connected: false,
			authenticated: false,
			username: "",
			clients: [],
			rooms: [],
			currentRoom: null
		};
	}

	const ws = chatClient.ws;

	const clients = Array.from(ws.clients?.values?.() ?? []).map(client => ({
		id: client.id,
		username: client.username ?? "Unknown",
		room: client.room?.id
	}));

	const rooms = Array.from(ws.rooms?.values?.() ?? []).map(room => ({
		id: String(room.id ?? room.name),
		name: room.name ?? String(room.id),
		users: getCollectionSize(room.clients),
		hasPassword: room.hasPassword === true,
		maxClients: room.maxClients ?? null,
		owner: room.owner
	}));

	return {
		connected: ws.readyState === 1,
		authenticated: Boolean(ws.authenticated),
		username: ws.username ?? "",
		clients,
		rooms,
		currentRoom: ws.inRoom
			? {
				id: ws.inRoom.id,
				name: ws.inRoom.name,
				owner: ws.inRoom.owner.id,
				maxClients: ws.inRoom.maxClients
			}
			: null
	};
}

function publishState() {
	sendEvent("state", { state: getSocketState() });
}

function closeChatClient(code = 1000, reason = "Client disconnected.") {
	if (chatClient?.ws) {
		chatClient.ws.close(code, reason);
	}
}

ipcMain.handle("chat:connect", async (_event, { host, username }) => {
	if (chatClient) {
		closeChatClient(1000, "Reconnecting.");
		chatClient = null;
	}

	try {
		const url = new URL(
			host.includes("://") ? host : `ws://${host}`
		);

		if (!["ws:", "wss:"].includes(url.protocol)) {
			throw new Error("Invalid WebSocket address.");
		}

		if (!username?.trim()) {
			throw new Error("Please enter a username.");
		}

		const client = new ChatSocketClient({ host: url.href, username: username.trim() });
		chatClient = client;
		commandList = createCommands(client.ws);

		// Override logging methods
		client.error = (err) => {
			console.error(`(ERROR) ${err}`);
			if (chatClient === client) {
				mainWindow?.webContents.send("chat:notification", {
					type: "error",
					message: String(err)
				});
			}
		};

		client.warn = (warning) => {
			console.warn(`(WARNING) ${warning}`);
			if (chatClient === client) {
				mainWindow?.webContents.send("chat:notification", {
					type: "warning",
					message: String(warning)
				});
			}
		};

		client.log = (msg) => {
			if (allowLogPrint) {
				mainWindow.webContents.send("chat:system-message", {
					id: `${Date.now()}-${Math.random()}`,
					message: String(msg),
					system: true,
					timestamp: Date.now()
				});
			}
			console.log(msg);
		};

		// Override close callback
		client.onConnectionClose = function(event) {
			switch(event.code) {
				case 1000: {
					client.warn("Disconnected from the server.");
					break;
				}
				case 4000: {
					client.warn(`Disconnected: ${event.reason}`);
					break;
				}
				default: {
					client.warn(`Connection closed (${event.code}): ${event.reason || "Unknown reason."}`);
					break;
				}
			}
			mainWindow?.webContents.send("chat:socket-closed");
			commandList = null;
		}

		const packetTypes = [
			"handshake",
			"client_join",
			"client_left",
			"chat",
			"register_room",
			"join_room",
			"quit_room",
			"room_closed",
			"server_closed",
			"error"
		];

		for (const type of packetTypes) {
			client.onReceivePacket(type, args => {
				if (chatClient !== client) return;

				sendEvent(type, {
					args,
					state: getSocketState()
				});
			});
		}
		return { success: true };
	} catch (error) {
		chatClient = null;

		return {
			success: false,
			error: error.message
		};
	}
});

ipcMain.handle("chat:get-state", () => getSocketState());

ipcMain.handle("chat:send-message", (_event, message) => {
	if (!chatClient?.ws || !chatClient.ws.authenticated) {
		return { success: false, error: "Not connected." };
	}

	chatClient.ws.sendPacket("chat", { message });
	return { success: true };
});

ipcMain.handle("chat:join-room", (_event, { name, password }) => {
	if (!chatClient?.ws) {
		return { success: false };
	}

	chatClient.ws.sendPacket("join_room", {
		name,
		password
	});

	return { success: true };
});

ipcMain.handle("chat:create-room", (_event, args) => {
	if (!chatClient?.ws) return { success: false };

	chatClient.ws.sendPacket("create_room", {
		name: args.name,
		password: args.password,
		maxClients: args.maxClients
	});

	return { success: true };
});

ipcMain.handle("chat:quit-room", () => {
	if (!chatClient?.ws) return { success: false };

	chatClient.ws.sendPacket("quit_room");
	return { success: true };
});

ipcMain.handle("chat:disconnect", () => {
	closeChatClient(1000, "Client disconnected.");
	return { success: true };
});

ipcMain.handle("chat:execute-command", (event, command, args) => {
	if(chatClient.ws) {
		const entry = commandList[command];

		if (!entry) return { error: `Unknown command: ${command}` };

		entry.execute(args);
		return { success: true };
	}
	return { success: false };
});
ipcMain.handle("chat:set-log-print", (event, enabled) => {
	allowLogPrint = Boolean(enabled);
});

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1100,
		height: 750,
		minWidth: 800,
		minHeight: 550,
		webPreferences: {
			preload: path.join(__dirname, "preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	//mainWindow.webContents.openDevTools();

	if (app.isPackaged) {
		mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
	} else {
		mainWindow.loadURL("http://127.0.0.1:5173");
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	Menu.setApplicationMenu(null);

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	closeChatClient(1000, "Application closed.");

	if (process.platform !== "darwin") {
		app.quit();
	}
});