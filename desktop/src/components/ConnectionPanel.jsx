import React from "react";

class ConnectionPanel extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			address: localStorage.getItem("serverAddress") || "ws://127.0.0.1:3000",
			username: localStorage.getItem("username") || ""
		};
	}

	connect() {
		const { address, username } = this.state;

		localStorage.setItem("serverAddress", address);
		localStorage.setItem("username", username);

		this.props.onConnect(address, username);
	}

	render() {
		const { address, username } = this.state;

		return (
			<div className="connection-panel">
				<h2>TextChatJS - React.js Example</h2>

				<div className="connection-form">
					<input
						value={address}
						onChange={event => this.setState({ address: event.target.value })}
						placeholder="Server address"
					/>

					<input
						value={username}
						onChange={event => this.setState({ username: event.target.value })}
						placeholder="Username"
					/>

					<button onClick={() => this.connect()}>
						Connect
					</button>
				</div>
			</div>
		);
	}
}
export default ConnectionPanel;