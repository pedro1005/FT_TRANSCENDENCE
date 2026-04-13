# WebSocket Fundamentals

## Purpose

This document explains what WebSockets are, why they exist, and how they differ from HTTP. By the end, you'll understand when to use WebSockets vs HTTP, and how WebSocket communication works for real-time features like online gameplay.

---

## HTTP - Request-Response

Remember from backend fundamentals: HTTP follows a strict **request-response** pattern.

**The client always initiates:**

```json
Client:  "Hey server, give me user profile"
Server:  "Here's the profile: { id: 123, name: 'Alice' }"

Client:  "Hey server, update my username"
Server:  "Done. Username updated."
```

**The server cannot initiate communication.**

### This is a Problem for Real-Time Applications

**Scenario: Online Pong Game**

Imagine using only HTTP:

```json
Every 100ms, the client asks:
Client:  "Did my opponent move their paddle?"
Server:  "No"

Client:  "Did my opponent move their paddle?"
Server:  "No"

Client:  "Did my opponent move their paddle?"
Server:  "Yes, to position Y=250"

Client:  "Did the ball position change?"
Server:  "Yes, ball is now at X=400, Y=300"
```

**This is called polling**, and it's terrible:

- **Wasteful** - Most requests get "no changes"
- **Slow** - Always 100ms delay (at best)
- **Bandwidth heavy** - Constant requests even when nothing happens
- **Server load** - Thousands of unnecessary requests per second

### What We Need for Real-Time Communication

**Requirements for a Pong game:**

- **Server can push updates** - "Ball moved to X=400, Y=300"
- **Instant delivery** - No polling delay
- **Bidirectional** - Both client and server send messages freely
- **Efficient** - Only send data when something changes

**HTTP cannot do this. WebSockets can!**

## What WebSockets Are

### Definition

A **WebSocket** is a **persistent, bidirectional communication channel** between client and server.

**Key differences from HTTP:**

| HTTP | WebSocket |
| --- | --- |
| Request → Response | Continuous connection |
| Client initiates only | Both can initiate |
| New connection per request | One persistent connection |
| Stateless | Stateful (connection remains open) |

### How WebSockets Work

#### **1. Initial Handshake (HTTP Upgrade)**

WebSocket connections **start as HTTP**, then upgrade:

```js
Client:  GET /game-socket HTTP/1.1
         Upgrade: websocket
         Connection: Upgrade

Server:  HTTP/1.1 101 Switching Protocols
         Upgrade: websocket
         Connection: Upgrade
```

After this handshake, the connection **stays open** and becomes a WebSocket.

#### **2. Bidirectional Communication**

Once connected, **both sides can send messages anytime:**

```js
Server → Client:  { event: "game:update", data: { ballX: 400, ballY: 300 } }
Client → Server:  { event: "game:move", data: { paddleY: 250 } }
Server → Client:  { event: "game:score", data: { player1: 5, player2: 3 } }
Client → Server:  { event: "game:move", data: { paddleY: 270 } }
```

No request-response pattern. Just continuous message exchange.

#### **3. Connection Lifecycle**

```text
Client connects → WebSocket open
   ↓
Client/Server exchange messages (bidirectional)
   ↓
Connection closes (intentional or network failure)
```

**Connection remains open until:**

- Client explicitly disconnects
- Server explicitly disconnects
- Network failure
- Timeout (no activity)

---

## Events and Messages

### Event-Based Communication

WebSocket messages are typically **events** with **data payloads**.

**Structure:**

```typescript
{
  event: "event-name",
  data: { /* event-specific data */ }
}
```

**Examples for Project:**

**Player moves paddle:**

```typescript
{
  event: "game:move",
  data: {
    playerId: "user_123",
    paddleY: 250
  }
}
```

**Server updates game state:**

```typescript
{
  event: "game:state",
  data: {
    ball: { x: 400, y: 300, velocityX: 5, velocityY: 3 },
    player1Paddle: { y: 250 },
    player2Paddle: { y: 180 },
    score: { player1: 5, player2: 3 }
  }
}
```

**Match ends:**

```typescript
{
  event: "game:end",
  data: {
    winnerId: "user_123",
    finalScore: { player1: 10, player2: 8 }
  }
}
```

---

## Server-to-Client vs Client-to-Server

### Client Sends (Emitting Events)

**Frontend code:**

```typescript
// User pressed "up arrow"
socket.emit("game:move", { direction: "up" });

// User wants to challenge opponent
socket.emit("match:invite", { opponentId: "user_456" });
```

**Backend receives:**

```typescript
socket.on("game:move", (data) => {
  console.log("Player moved:", data.direction);
  // Update game state
});

socket.on("match:invite", (data) => {
  console.log("Invite sent to:", data.opponentId);
  // Notify opponent
});
```

### Server Sends (Broadcasting Events)

**Backend code:**

```typescript
// Send to one specific client
socket.emit("match:accepted", { matchId: "match_789" });

// Send to all connected clients
io.emit("server:announcement", { message: "Server restarting in 5 minutes" });

// Send to clients in a specific room (more on rooms later)
io.to("match_789").emit("game:state", gameState);
```

**Frontend receives:**

```typescript
socket.on("match:accepted", (data) => {
  console.log("Match accepted:", data.matchId);
  // Navigate to game screen
});

socket.on("game:state", (data) => {
  console.log("Game state updated:", data);
  // Render new ball/paddle positions
});
```

---

## Rooms

A **room** is a group of connected clients.

**Server creates a room and adds clients:**

```typescript
// Player 1 joins match_789
socket.join("match_789");

// Player 2 joins match_789
socket.join("match_789");
```

**Server sends to everyone in the room:**

```typescript
io.to("match_789").emit("game:state", {
  ball: { x: 400, y: 300 },
  // ... game state
});
```

**Only players in `match_789` receive this message.**

### Multiple Rooms

A client can be in multiple rooms:

```typescript
socket.join("lobby");        // General chat room
socket.join("match_789");    // Current match
socket.join("friends_123");  // Friends group
```

**Server can target specific rooms:**

```typescript
io.to("lobby").emit("announcement", { message: "New tournament starting!" });
io.to("match_789").emit("game:update", gameState);
```

### Leaving Rooms

```typescript
socket.leave("match_789");  // Player left the match
```

**When a client disconnects, they automatically leave all rooms.**

---

## Connection Management

### Detecting Connections

**Server detects when a client connects:**

```typescript
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // socket.id is a unique identifier for this connection
});
```

### Detecting Disconnections

**Server detects when a client disconnects:**

```typescript
io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    
    // Clean up (remove from active players, end match, etc.)
  });
});
```

### Handling Disconnects in a Game

**Scenario: Player disconnects during match**

```typescript
io.on("connection", (socket) => {
  // Player joins a match
  socket.on("match:join", (data) => {
    socket.join(data.matchId);
    activeMatches.set(socket.id, data.matchId);
  });
  
  // Player disconnects
  socket.on("disconnect", () => {
    const matchId = activeMatches.get(socket.id);
    
    if (matchId) {
      // Notify opponent
      socket.to(matchId).emit("opponent:disconnected", {
        message: "Your opponent has disconnected. You win!"
      });
      
      // End the match
      endMatch(matchId, socket.id);
    }
  });
});
```

---

### Reconnection

**WebSocket libraries (like Socket.IO) support automatic reconnection:**

```typescript
// Frontend
const socket = io("http://localhost:3000", {
  reconnection: true,           // Enable reconnection
  reconnectionAttempts: 5,      // Try 5 times
  reconnectionDelay: 1000       // Wait 1 second between attempts
});

socket.on("reconnect", () => {
  console.log("Reconnected to server!");
  // Re-join rooms, sync state, etc.
});
```

**Use case:**

Player's WiFi drops for 2 seconds -> Socket.IO automatically reconnects -> Player rejoins match room - Game continues

---

## Authentication

### Token-Based Authentication

Without authentication:

```typescript
// Anyone can connect and pretend to be any user
socket.emit("game:move", { playerId: "user_123", paddleY: 250 });
```

**Flow:**

1. **User logs in via HTTP** (gets JWT token)
2. **User connects to WebSocket** (sends token in handshake)
3. **Server verifies token** (extracts user ID)
4. **Server associates connection with user**

**Frontend:**

```typescript
const token = localStorage.getItem("authToken");

const socket = io("http://localhost:3000", {
  auth: {
    token: token  // Send token during connection
  }
});
```

**Backend:**

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error("Authentication error: No token"));
  }
  
  try {
    const user = verifyJWT(token);  // Verify token
    socket.userId = user.id;        // Attach user ID to socket
    next();                         // Allow connection
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);  // We know who they are
});
```

---

## When to Use HTTP vs WebSockets

**HTTP for:**

- `/auth/login` - User logs in
- `/auth/register` - User creates account
- `/users/profile` - Get profile data
- `/matches` - Fetch match history

**WebSockets for:**

- `game:move` - Player moves paddle
- `game:state` - Server broadcasts game state
- `match:invite` - Player challenges opponent
- `match:accepted` - Opponent accepts challenge
- `opponent:disconnected` - Opponent left

**When they work together:**

- User logs in (HTTP) → receives token
- User connects to WebSocket (with token)
- User challenges opponent (WebSocket)
- Match starts (WebSocket events for gameplay)
- Match ends → stats saved (HTTP API call)
- User views match history (HTTP)

---

## Example: Practical Application

### Complete Multiplayer Match Flow

**1. Players connect:**

```typescript
// Both players connect to WebSocket
socket.connect();  // Authenticated with JWT token
```

**2. Player 1 invites Player 2:**

```typescript
// Player 1 frontend
socket.emit("match:invite", { opponentId: "user_456" });
```

**3. Backend notifies Player 2:**

```typescript
// Backend
socket.on("match:invite", (data) => {
  const { opponentId } = data;
  const inviterId = socket.userId;
  
  // Send to opponent's socket
  io.to(getSocketId(opponentId)).emit("match:invitation", {
    from: inviterId,
    message: "You've been challenged!"
  });
});
```

**4. Player 2 accepts:**

```typescript
// Player 2 frontend
socket.emit("match:accept", { inviterId: "user_123" });
```

**5. Backend creates match and room:**

```typescript
// Backend
socket.on("match:accept", (data) => {
  const player1Id = data.inviterId;
  const player2Id = socket.userId;
  const matchId = createMatch(player1Id, player2Id);
  
  // Both players join room
  getSocket(player1Id).join(matchId);
  getSocket(player2Id).join(matchId);
  
  // Notify both players
  io.to(matchId).emit("match:start", {
    matchId,
    player1Id,
    player2Id
  });
});
```

**6. Game loop starts:**

```typescript
// Backend (runs 60 times per second)
setInterval(() => {
  const gameState = updateGameState(matchId);
  
  io.to(matchId).emit("game:state", {
    ball: gameState.ball,
    player1Paddle: gameState.player1Paddle,
    player2Paddle: gameState.player2Paddle,
    score: gameState.score
  });
}, 1000 / 60);  // 60 FPS
```

**7. Players send inputs:**

```typescript
// Player frontend (when arrow key pressed)
socket.emit("game:input", { action: "move-up" });
```

**8. Backend processes inputs:**

```typescript
socket.on("game:input", (data) => {
  const playerId = socket.userId;
  updatePlayerPaddle(matchId, playerId, data.action);
  // Game state will be broadcast in next loop iteration
});
```

**9. Game ends:**

```typescript
// Backend (when score reaches 10)
if (gameState.score.player1 === 10) {
  io.to(matchId).emit("game:end", {
    winnerId: player1Id,
    finalScore: gameState.score
  });
  
  saveMatchResult(matchId, player1Id, gameState.score);
  
  // Clean up
  io.in(matchId).socketsLeave(matchId);
}
```

**10. Players disconnect:**

```typescript
// Frontend
socket.disconnect();

// Backend detects
socket.on("disconnect", () => {
  // Handle early disconnect (award win to opponent)
});
```
