# Server Commands

1. help: Show available commands
2. say: Sends a message to all clients, usage: say <message>
3. kick: Kicks client from the server, usage: kick <id/username>
4. roomkick: Kicks client from their connected room, usage: roomkick <id/username>
5. status: Shows server status
6. stop: Stops the server

# Packet types sent by the server

### Connection
* "handshake": Server sends public information environment variables to the client, expecting a return with their username.
  * Arguments:
    * "maxClients": Value from "SERVER_MAX_CONNECTIONS".
    * "chatMaxLength": Value from "MESSAGE_MAX_LENGTH".
    * "rateLimit": Value from "RATE_LIMIT".
    * "roomsEnabled": Value from "ROOMS_ENABLED".
    * "roomsMax": Value from "ROOMS_MAX".
    * "clients": Client array: {id, username}
    * "id": Assigned client ID to the new client.
    * "username": Username the server assigned to you in case of duplicated/invalid names.

  * Note: Limits set by the server are enforced server-side for exploit prevention.

* "client_join": Broadcasts client connected.
  * Arguments:
    * "id": Client ID.
    * "username": Client username.

* "client_left": Broadcasts client left.
  * Arguments:
    * "id": Client ID.
    * "reason": Possible reasons can be "disconnect" or "kick".

* "server_closed": Force disconnection because the server process was closed.

### Chat
* "chat": Send message to all clients connected to the server.
  * Arguments:
    * "sender": Client ID from sender of the message, leave empty for server messages.
    * "message": Message to send.
    * "timestamp": Date/timestamp for the time the message is sent, "number" type variable.

### Rooms
* "register_room": Adds a new room's data into the map.

* "join_room": Client successfully connected to the room.
  * Arguments:
    * "id": Client ID.
    * "room": Room ID.
    * "forced": Client was forcefully put into the room by the server's operator.

* "quit_room": Client left the connected room.
  * Arguments:
    * "id": Client ID.
    * "reason": Possible reasons can be "disconnect, "server_kick" or "kick".

* "room_closed": Room closed by the owner, all users inside have their room ID reset.
  * Arguments:
    * "room": Room ID.

### Error Handling
* "error": Send an error message to the client.