import React from "react";

class ChatPanel extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			message: ""
		};

		this.messagesEndRef = React.createRef();
	}

	componentDidUpdate() {
		this.scrollToBottom();
	}

	scrollToBottom() {
		this.messagesEndRef.current?.scrollIntoView({
			behavior: "smooth"
		});
	}

	handleSendMessage = async (event) => {
		event?.preventDefault();

		const message = this.state.message.trim();

		if (!message) return;

		if (!(await this.executeCommand(message))) {
			this.props.onSendMessage(message);
		}
		this.setState({ message: "" });
	};

	formatTime(timestamp) {
		const date = new Date(timestamp);

		if (Number.isNaN(date.getTime())) return "--:--";

		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
	}

	parseCommandArgs(input) {
		const args = [];
		const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
		let match;

		while ((match = regex.exec(input)) !== null) {
			args.push(match[1] ?? match[2] ?? match[3]);
		}

		return args;
	}

	async executeCommand(input) {
		const trimmed = input.trim();

		// do not trim
		if (!input.startsWith("/")) {
			return false;
		}

		const commandInput = trimmed.slice(1).trim();

		if (!commandInput) {
			return true;
		}

		const command = commandInput.split(/\s+/)[0].toLowerCase();
		const rawArgs = commandInput.slice(command.length).trimStart();

		await window.desktop.setLogPrint(command !== "say");
		const args = this.parseCommandArgs(rawArgs);

		try {
			const result = await window.desktop.executeCommand(command, args);

			if (!result.success) {
				this.props.showNotification("error", result.error || "Command execution failed.");
			}
		} catch (error) {
			this.props.showNotification("error", `Command error: ${error.message}`);
		}
		await window.desktop.setLogPrint(false);
		return true;
	}

	render() {
		const {
			messages = [],
			clients = [],
			currentRoom,
			username,
			onQuitRoom,
			onDisconnect
		} = this.props;

		const userLimit = this.props.roomsEnabled ? currentRoom?.maxClients : this.props.maxClients;
		const roomClients = clients.filter(
			client => client.room === currentRoom?.id
		);

		return (
			<div className="chat-panel">
				<header className="chat-header">
					<div>
						<h2>{currentRoom?.name ?? "Chat"}</h2>
						<span style={{ userSelect: "none" }}>
							Connected as {username}
						</span>
					</div>

					<div className="chat-header-actions">
						{this.props.roomsEnabled && (
							<button onClick={onQuitRoom}>
								Leave room
							</button>
						)}

						<button onClick={onDisconnect} className="disconnect-button">
							Disconnect
						</button>
					</div>
				</header>

				<div className="chat-content">
					<main className="chat-main">
						<div className="message-list">
							{messages.length === 0 ? (
								<p className="empty-messages">
									No messages yet. Start the conversation!
								</p>
							) : (
								messages.map(message => (
									<div
										className={`message ${message.system ? "system-message" : ""}`}
										key={message.id}
									>
										{!message.system && (
											<div className="message-header">
												<strong className={
													message.senderId === undefined || message.senderId === null
														? "server"
														: message.senderId === currentRoom?.owner
															? "room-owner"
															: ""
												}>
													{message.sender}
												</strong>

												<span>{this.formatTime(message.timestamp)}</span>
											</div>
										)}

										<p>{message.message}</p>
									</div>
								))
							)}

							<div ref={this.messagesEndRef} />
						</div>

						<form
							className="message-input"
							onSubmit={this.handleSendMessage}
						>
							<input
								type="text"
								value={this.state.message}
								onChange={event =>
									this.setState({
										message: event.target.value
									})
								}
								placeholder="Write a message..."
								maxLength={this.props.chatMaxLength || 100}
							/>

							<button
								type="submit"
								disabled={!this.state.message.trim()}
							>
								Send
							</button>
						</form>
					</main>

					<aside className="chat-users">
						<h3>
							Users ({roomClients.length}
							{userLimit > 0 && `/${userLimit}`})
						</h3>

						<div className="user-list">
							{roomClients.map(client => (
								<div className="user-item" key={client.id}>
									{client.id === currentRoom?.owner ? (
										<span className="user-owner-icon">★</span>
									) : (
										<span className="user-status" />
									)}
									<span>{client.username}</span>
								</div>
							))}
						</div>
					</aside>
				</div>
			</div>
		);
	}
}
export default ChatPanel;