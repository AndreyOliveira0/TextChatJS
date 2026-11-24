# TextChatJS

**A reusable real-time text chat system built with Node.js and WebSocket.**

TextChatJS is a capstone project focused on developing a modular and reusable foundation for real-time communication applications. It provides a client-server architecture that handles user connections, message exchange, room management, and communication control.

The project is designed to serve as a starting point for developers who want to implement real-time text communication without having to build the entire communication infrastructure from scratch.

## Features

- **Real-time communication:** Exchange messages between connected users using WebSocket.
- **Client-server architecture:** Separate server and client components.
- **Room management:** Create, join, leave, and manage chat rooms.
- **User identification:** Assign unique usernames to connected users.
- **Moderation:** Manage room participants through moderation commands.
- **Packet validation:** Validate incoming packets and their arguments.
- **Rate limiting:** Control message frequency to prevent excessive traffic.
- **Connection management:** Handle handshakes, connection limits, and timeouts.
- **Command-line interface:** Manage and monitor the server through CLI commands.
- **Desktop client:** A graphical desktop application built with React.

## Project Structure

```text
TextChatJS/
├── server/       # WebSocket server implementation
├── client/       # Node.js client implementation
├── shared/       # Some JS functions shared between server and client to handle packet encrypting/decrypting and time printing
└── desktop/      # React-based desktop implementation example application
```

## Technologies

- **Node.js** – Server-side and client-side runtime.
- **WebSocket** – Full-duplex communication between clients and the server.
- **React** – Desktop application interface.
- **JavaScript / TypeScript** – Application development.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- Git

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd TextChatJS
```

Install the dependencies for the desired component. For example:

```bash
cd server
npm install
```

Repeat the installation process for the client and desktop application if needed.

### Configuration

Configure the server using the available environment variables or configuration files.

Common configuration options include:

| Option | Description |
|---|---|
| `ROOMS_ENABLED` | Enables or disables room functionality. |
| `ROOMS_MAX` | Maximum number of rooms. |
| `MESSAGE_MAX_LENGTH` | Maximum message length. |
| `RATE_LIMIT` | Message rate limit. |
| `SERVER_MAX_CONNECTIONS` | Maximum number of simultaneous connections. |
| `HANDSHAKE_TIMEOUT` | Maximum time allowed to complete the handshake. |
| `SERVER_ENABLE_CLI` | Enables the server command-line interface. |

Refer to the server configuration files for the available options and their default values.

### Running

Start the server using its configured entry point:

```bash
node server
```

To start the client using its optional arguments:

```bash
node client --username User --host ws://0.0.0.0:3000 --cli true
```

**Available arguments:**

| Argument | Description |
|---|---|
| --username | Username used to identify the client. |
| --host | WebSocket server address. |
| --cli | Enables or disables the client's command-line interface. |

**Example with custom settings:**

```bash
node client --username Alice --host ws://127.0.0.1:3000 --cli false
```
The exact command may vary depending on the component's entry point and available npm scripts.

## Communication Protocol

TextChatJS uses WebSocket to establish persistent, bidirectional communication between clients and the server.

Communication packets follow a JSON-based structure:

```json
{
  "type": "chat",
  "args": {
    "message": "Hello, world!"
  }
}
```

The `type` field identifies the operation, while `args` contains its associated data.

The server validates incoming packets and processes them according to their respective handlers.

## Project Goals

The main goals of TextChatJS are:

- Develop a functional real-time communication system.
- Implement a modular client-server architecture.
- Provide reusable communication components.
- Evaluate performance, resource consumption, and message delivery.
- Explore the practical application of WebSocket and TCP communication.

## Future Improvements

Possible future developments include:

- Publishing the core system as an independent npm package.
- Supporting file transfers between users.
- Implementing IP-based bans.
- Improving internal modularization and extensibility.
- Expanding the available client implementations.

## Academic Project

TextChatJS was developed as a **Capstone Project**, exploring the development, implementation, and performance evaluation of a reusable real-time chat system.

## License

See the [LICENSE](LICENSE) file for information about usage, redistribution, and attribution.