import React, { useState, useEffect, useRef } from "react";
import ChatPanel from "./components/ChatPanel.jsx";
import ConnectionPanel from "./components/ConnectionPanel.jsx";
import RoomPanel from "./components/RoomPanel.jsx";

export default function App() {
	const [screen, setScreen] = useState("connection");
	const [username, setUsername] = useState("");
	const [maxClients, setMaxClients] = useState(0);
	const [chatMaxLength, setChatMaxLength] = useState(100);
	const [rateLimit, setRateLimit] = useState(5);
	const [roomsEnabled, setRoomsEnabled] = useState(true);
	const [roomsMaxUsers, setRoomsMaxUsers] = useState(10);
	const [rooms, setRooms] = useState([]);
	const [clients, setClients] = useState([]);
	const [currentRoom, setCurrentRoom] = useState(null);
	const [messages, setMessages] = useState([]);
	const [notification, setNotification] = useState(null);
	const userId = useRef(-1);
	const notificationTimer = useRef(null);
	const connected = useRef(false);

	function updateState(state) {
		if (!state) return;

		setRooms(state.rooms ?? []);
		setClients(state.clients ?? []);
		setCurrentRoom(state.currentRoom ?? null);
	}

	async function refreshState() {
		try {
			const state = await window.desktop.getState();
			updateState(state);
			return state;
		} catch (error) {
			showNotification("error", `Failed to retrieve socket state: ${error}`);
			return null;
		}
	}

	useEffect(() => {
		const unsubscribers = [];

		const onReceivePacket = (type, callback) => {
			const unsubscribe = window.desktop.onPacket(type, callback);
			unsubscribers.push(unsubscribe);
		};

		// Connection
		onReceivePacket("handshake", (args, state) => {
			const canHaveRooms = (args?.roomsEnabled === true);
			connected.current = true;
			setUsername(args?.username ?? "");
			setMaxClients(args?.maxClients || 0);
			setChatMaxLength(args?.chatMaxLength || 100);
			setRateLimit(args?.rateLimit || 5);
			setRoomsEnabled(canHaveRooms);
			setRoomsMaxUsers(args?.roomsMaxUsers || 10);
			userId.current = args?.id;

			setScreen(canHaveRooms ? "rooms" : "chat");

			if (state) {
				updateState(state);
			} else {
				refreshState();
			}
		});
		onReceivePacket("client_join", async (_args, state) => {
			if (state) updateState(state);

			const currentState = state ?? await refreshState();
			if(!currentState?.roomsEnabled && _args?.id !== userId.current) {
				setMessages(previous => [
					...previous,
					{
						id: Date.now(),
						system: true,
						message: `${state?.clients?.find(client => client.id === _args?.id)?.username} connected to the server.`,
						timestamp: Date.now()
					}
				]);
			}
		});
		onReceivePacket("client_left", async (_args, state) => {
			if (state) updateState(state);

			const currentState = state ?? await refreshState();
			if(!currentState?.roomsEnabled && _args?.id !== userId.current) {
				setMessages(previous => [
					...previous,
					{
						id: Date.now(),
						system: true,
						message: `${state?.clients?.find(client => client.id === _args?.id)?.username} left the server.`, //undefined
						timestamp: Date.now()
					}
				]);
			}
		});

		// Chat
		onReceivePacket("chat", async (args, state) => {
			if (typeof args?.message !== "string") return;

			const currentState = state ?? await refreshState();

			const senderClient = args.sender === undefined
				? null
				: currentState?.clients?.find(
					client => client.id === args.sender
				);

			setMessages(previous => [
				...previous,
				{
					id: `${Date.now()}-${Math.random()}`,
					senderId: args.sender,
					sender: senderClient?.username ?? "SERVER",
					message: args.message,
					timestamp: typeof args.timestamp === "number"
						? args.timestamp
						: Date.now()
				}
			]);
		});

		// Rooms
		onReceivePacket("register_room", (_args, state) => {
			if (state) {
				updateState(state);
			} else {
				refreshState();
			}
		});

		onReceivePacket("join_room", async (_args, state) => {
			if (state) updateState(state);

			if (_args?.id === userId.current) {
				setScreen("chat");
			}
			else if(_args?.room == state?.currentRoom?.id) {
				setMessages(previous => [
					...previous,
					{
						id: Date.now(),
						system: true,
						message: `${state?.clients?.find(client => client.id === _args?.id)?.username} joined the room.`,
						timestamp: Date.now()
					}
				]);
			}
		});

		onReceivePacket("quit_room", async (_args, state) => {
			if (state) updateState(state);

			const currentState = state ?? await refreshState();
			if (_args?.id === userId.current) {
				setCurrentRoom(null);
				setMessages([]);
				setScreen("rooms");
			}
			else if(_args?.room == state?.currentRoom?.id) {
				setMessages(previous => [
					...previous,
					{
						id: Date.now(),
						system: true,
						message: `${state?.clients?.find(client => client.id === _args?.id)?.username} left the room.`,
						timestamp: Date.now()
					}
				]);
			}
		});

		onReceivePacket("room_closed", (_args, state) => {
			if (state) updateState(state);

			if (_args?.room === state?.currentRoom?.id) {
				setCurrentRoom(null);
				setMessages([]);
				setScreen("rooms");
			}
		});

		// Error handling
		onReceivePacket("error", (_args) => {
			const message = _args?.error || "An error occurred.";
			showNotification("error", message);
		});

		onReceivePacket("server_closed", async () => {
			await closedSocket();
			showNotification("warning", "The server has closed.");
		});

		const unsubscribeNotification = window.desktop.onNotification(
			({ type, message }) => {
				showNotification(type, message);
			}
		);
		unsubscribers.push(unsubscribeNotification);
		
		const unsubscribeSocketClose = window.desktop.onSocketClose(
			() => {
				closedSocket();
			}
		);
		unsubscribers.push(unsubscribeSocketClose);

		const unsubscribeSystemMessage = window.desktop.onSystemMessage(message => {
			setMessages(previous => [...previous, message]);
		});

		unsubscribers.push(unsubscribeSystemMessage);

		return () => {
			unsubscribers.forEach(unsubscribe => unsubscribe?.());
		};
	}, []);

	async function connect(address, name) {
		setMessages([]);
		setUsername(name);

		try {
			const result = await window.desktop.connect({
				host: address,
				username: name
			});

			if (!result.success) {
				showNotification("error", result.error);
			}
		} catch (error) {
			showNotification("error", error.message);
		}
	}

	async function sendMessage(message) {
		await window.desktop.sendMessage(message);
	}

	function joinRoom(roomName, password = "") {
		return window.desktop.joinRoom({
			name: roomName,
			password
		});
	}

	async function quitRoom() {
		await window.desktop.quitRoom();
	}

	async function createRoom(args) {
		await window.desktop.createRoom(args);
	}

	async function disconnect() {
		await window.desktop.disconnect();
	}

	function showNotification(type, message) {
		if (!message) return;

		clearTimeout(notificationTimer.current);

		setNotification({
			id: Date.now(),
			type,
			message
		});

		notificationTimer.current = setTimeout(() => {
			setNotification(null);
		}, 5000);
	}

	async function closedSocket() {
		connected.current = false;
		setRooms([]);
		setClients([]);
		setCurrentRoom(null);
		setMessages([]);
		setScreen("connection");
		await refreshState();
	}

	return (
		<div className="app">
			{screen === "chat" && (
				<ChatPanel
					messages={messages}
					clients={clients}
					currentRoom={currentRoom}
					username={username}
					maxClients={maxClients}
					chatMaxLength={chatMaxLength}
					rateLimit={rateLimit}
					roomsEnabled={roomsEnabled}
					showNotification={showNotification}
					onSendMessage={sendMessage}
					onQuitRoom={quitRoom}
					onDisconnect={disconnect}
				/>
			)}

			{screen === "connection" && (
				<ConnectionPanel
					onConnect={connect}
				/>
			)}

			{screen === "rooms" && (
				<RoomPanel
					userId={userId}
					rooms={rooms}
					roomsMaxUsers={roomsMaxUsers}
					onJoinRoom={joinRoom}
					onCreateRoom={createRoom}
					onDisconnect={disconnect}
				/>
			)}
			<div className="notification-container">
				{notification && (
					<div
						key={notification.id}
						className={`notification notification-${notification.type}`}
							onClick={() => {
								clearTimeout(notificationTimer.current);
								setNotification(null);
							}}
							title="Click to dismiss"
						>
						<span className="notification-icon">
							{notification.type === "error" ? "✕" : "⚠"}
						</span>

						<span className="notification-message">
							{notification.message}
						</span>

						<div className="notification-progress" />
					</div>
				)}
			</div>
		</div>
	);
}