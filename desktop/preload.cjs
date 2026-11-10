const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
	connect: config => ipcRenderer.invoke("chat:connect", config),
	getState: () => ipcRenderer.invoke("chat:get-state"),
	sendMessage: message => ipcRenderer.invoke("chat:send-message", message),
	joinRoom: data => ipcRenderer.invoke("chat:join-room", data),
	createRoom: data => ipcRenderer.invoke("chat:create-room", data),
	quitRoom: () => ipcRenderer.invoke("chat:quit-room"),
	disconnect: () => ipcRenderer.invoke("chat:disconnect"),
	executeCommand: (command, args) => ipcRenderer.invoke("chat:execute-command", command, args),
	setLogPrint: (value) => ipcRenderer.invoke("chat:set-log-print", value),

	onPacket: (type, callback) => {
		const listener = (_event, data) => {
			if (data.type === type) {
				callback(data.args, data.state);
			}
		};
		ipcRenderer.on("chat:event", listener);
		return () => ipcRenderer.removeListener("chat:event", listener);
	},
	onNotification: (callback) => {
		const listener = (_event, data) => callback(data);
		ipcRenderer.on("chat:notification", listener);
		return () => ipcRenderer.removeListener("chat:notification", listener);
	},
	onSocketClose: callback => {
		const listener = (_event, data) => callback(data);
		ipcRenderer.on("chat:socket-closed", listener);
		return () => ipcRenderer.removeListener("chat:socket-closed", listener);
	},
	onSystemMessage: callback => {
		const listener = (_event, data) => callback(data);
		ipcRenderer.on("chat:system-message", listener);
		return () => ipcRenderer.removeListener("chat:system-message", listener);
	},
});