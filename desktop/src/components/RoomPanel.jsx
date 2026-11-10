
import React from "react";

class RoomPanel extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			roomName: "",
			roomPassword: "",
			roomMaxUsers: 10,
			roomsMaxUsers: 10,
			selectedRoom: null,
			password: ""
		};
	}

	createRoom() {
		const name = this.state.roomName.trim();
		const password = this.state.roomPassword;

		if (!name) return;

		this.props.onCreateRoom({
			name,
			password: password || undefined,
			maxClients: this.state.roomMaxUsers
		});

		this.setState({
			roomName: "",
			roomPassword: "",
			roomMaxUsers: 1
		});
	}

	joinRoom(room) {
		if (room.hasPassword === true) {
			this.setState({
				selectedRoom: room,
				password: ""
			});
			return;
		}

		this.props.onJoinRoom(room.name, "");
	}

	confirmJoinRoom() {
		const { selectedRoom, password } = this.state;

		if (!selectedRoom) return;

		this.props.onJoinRoom(selectedRoom.name, password);

		this.setState({
			selectedRoom: null,
			password: ""
		});
	}

	closePasswordModal() {
		this.setState({
			selectedRoom: null,
			password: ""
		});
	}

	render() {
		const { rooms = [], onDisconnect } = this.props;
		const { roomName, roomMaxUsers, roomsMaxUsers, selectedRoom, password } = this.state;

		return (
			<div className="room-panel">
				<div className="select-room">
					<h2>Select a room</h2>
					<button onClick={onDisconnect} className="disconnect-button">
						Disconnect
					</button>
				</div>

				<div className="room-list">
					{rooms.map(room => (
						<button
							className="room-item"
							key={room.id}
							onClick={() => this.joinRoom(room)}
						>
							<div className="room-info">
								<strong>
									{room.hasPassword === true && (
										<span className="room-lock">🔒</span>
									)}
									{room.name}
								</strong>

								<span>
									{room.users}/{room.maxClients} users
								</span>
							</div>

							<span className="room-join-label">Join</span>
						</button>
					))}
				</div>

				<div className="create-room">
					<input
						value={roomName}
						onChange={event =>
							this.setState({ roomName: event.target.value })
						}
						placeholder="New room name"
						onKeyDown={event => {
							if (event.key === "Enter") this.createRoom();
						}}
						maxLength={24}
					/>

					<input
						type="password"
						value={this.state.roomPassword}
						onChange={event =>
							this.setState({ roomPassword: event.target.value })
						}
						placeholder="Password (optional)"
						onKeyDown={event => {
							if (event.key === "Enter") this.createRoom();
						}}
					/>

					<div className="room-max-users">
						<label htmlFor="room-max-users">Max Users</label>

						<input
							id="room-max-users"
							type="number"
							min={1}
							max={roomsMaxUsers}
							step={1}
							value={roomMaxUsers}
							onChange={event => {
								const value = event.target.value;

								if (value === "") return;

								const number = Number(value);

								if (Number.isInteger(number)) {
									this.setState({
										roomMaxUsers: Math.min(
											roomsMaxUsers,
											Math.max(1, number)
										)
									});
								}
							}}
						/>
					</div>

					<button
						disabled={!roomName.trim()}
						onClick={() => this.createRoom()}
					>
						Create room
					</button>
				</div>

				{selectedRoom && (
					<div
						className="password-modal-overlay"
						onMouseDown={event => {
							if (event.target === event.currentTarget) {
								this.closePasswordModal();
							}
						}}
					>
						<div className="password-modal">
							<div className="password-modal-icon">🔒</div>

							<h3>Password protected room</h3>

							<p style={{ userSelect: "none" }}>
								Enter the password to join{" "}
								<strong>{selectedRoom.name}</strong>.
							</p>

							<input
								type="password"
								autoFocus
								placeholder="Room password"
								value={password}
								onChange={event =>
									this.setState({
										password: event.target.value
									})
								}
								onKeyDown={event => {
									if (event.key === "Enter") {
										this.confirmJoinRoom();
									}

									if (event.key === "Escape") {
										this.closePasswordModal();
									}
								}}
							/>

							<div className="password-modal-actions">
								<button
									className="password-cancel"
									onClick={() => this.closePasswordModal()}
								>
									Cancel
								</button>

								<button
									disabled={!password.trim()}
									onClick={() => this.confirmJoinRoom()}
								>
									Join room
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}

export default RoomPanel;