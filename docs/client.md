# Client Commands

1. help: Show available commands
2. say: Sends a message to all clients, usage: say <message>
3. createroom: Creates a room, usage: createroom <name> <password (optional)> <max users (optional)>
4. joinroom: Join a room, usage: joinroom <id/name> <password (optional)>
5. quitroom: Leaves the room you are in.
6. kick: Kicks a client from the room, usage: kick <id/username>
7. status: Shows users and rooms.
8. quit: Disconnect from the server

# Packet types sent by the client

### Connection
* "handshake": Sends username to finish authentication after receiving server information
  * Arguments:
    * "username": Client username.

* "ping": Sends a ping request to the server.
  * Arguments:
    * "timestamp": Timestamp of the moment you sent the request.

### Chat
* "chat": Send message to chat.
  * Arguments:
    * "message": Message to send.

### Moderation
* "room_kick": Kicks a client from your room.
  * Arguments:
    * "id": Client ID/Name to kick.

### Rooms
* "create_room": Send request to create a room.
  * Arguments:
    * "name": Room Name.
    * "password": Password (Optional).

* "join_room": Send request to join a room.
  * Arguments:
    * "name": Room Name.
    * "password": Password (Optional).

* "quit_room": Send request to quit from the connected room.