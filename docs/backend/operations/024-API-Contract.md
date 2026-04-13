# API Contracts

## Purpose

This document defines the complete interface between frontend and backend: all HTTP endpoints, all WebSocket events, their request/response formats, and expected behaviors.

**This is the contract that frontend and backend teams agree on.**

---

## HTTP Endpoints

### Authentication Endpoints

#### POST /auth/register

**Purpose:** Create a new user account

**Request:**

```json
{
  "email": "alice@example.com",
  "password": "securepass123",
  "username": "alice"
}
```

**Success Response (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_abc123",
    "email": "alice@example.com",
    "username": "alice"
  }
}
```

**Error Responses:**

- 400: Invalid input (email format, password too short)
- 409: Email already registered

---

#### POST /auth/login

**Purpose:** Log in with email and password

**Request:**

```json
{
  "email": "alice@example.com",
  "password": "securepass123"
}
```

**Success Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_abc123",
    "email": "alice@example.com",
    "username": "alice"
  }
}
```

**Error Responses:**

- 400: Missing email or password
- 401: Invalid credentials

---

### User Endpoints

All user endpoints require authentication (Authorization header).

#### GET /users/profile

**Purpose:** Get current user's profile

**Headers:**

```text
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "id": "user_abc123",
  "email": "alice@example.com",
  "username": "alice",
  "profile": {
    "nickname": "AliceTheGreat",
    "avatar": "https://example.com/avatar.jpg",
    "wins": 15,
    "losses": 8,
    "totalGames": 23
  }
}
```

**Error Responses:**

- 401: Not authenticated

---

#### PATCH /users/profile

**Purpose:** Update current user's profile

**Request:**

```json
{
  "nickname": "NewNickname",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Success Response (200):**

```json
{
  "id": "user_abc123",
  "profile": {
    "nickname": "NewNickname",
    "avatar": "https://example.com/new-avatar.jpg",
    "wins": 15,
    "losses": 8,
    "totalGames": 23
  }
}
```

**Error Responses:**

- 400: Invalid input
- 401: Not authenticated

---

#### GET /users/:id

**Purpose:** Get any user's public profile

**Success Response (200):**

```json
{
  "id": "user_xyz789",
  "username": "bob",
  "profile": {
    "nickname": "BobTheBest",
    "avatar": "https://example.com/bob-avatar.jpg",
    "wins": 20,
    "losses": 5,
    "totalGames": 25
  }
}
```

**Error Responses:**

- 404: User not found

---

#### GET /users

**Purpose:** Get list of online/available users for matchmaking

**Query Parameters:**

- `status`: "online" | "all" (optional, default: "online")
- `limit`: number (optional, default: 10)

**Success Response (200):**

```json
{
  "users": [
    {
      "id": "user_xyz789",
      "username": "bob",
      "status": "online",
      "inMatch": false
    },
    {
      "id": "user_def456",
      "username": "charlie",
      "status": "online",
      "inMatch": true
    }
  ]
}
```

---

### Match Endpoints

#### GET /matches/history

**Purpose:** Get current user's match history

**Query Parameters:**

- `limit`: number (optional, default: 10)
- `offset`: number (optional, default: 0)

**Success Response (200):**

```json
{
  "matches": [
    {
      "id": "match_abc123",
      "player1": {
        "id": "user_abc123",
        "username": "alice"
      },
      "player2": {
        "id": "user_xyz789",
        "username": "bob"
      },
      "winner": {
        "id": "user_abc123",
        "username": "alice"
      },
      "score": {
        "player1": 10,
        "player2": 7
      },
      "status": "COMPLETED",
      "createdAt": "2026-02-15T10:30:00.000Z",
      "completedAt": "2026-02-15T10:45:00.000Z"
    }
  ],
  "total": 23,
  "hasMore": true
}
```

**Error Responses:**

- 401: Not authenticated

---

#### GET /matches/:id

**Purpose:** Get details of a specific match

**Success Response (200):**

```json
{
  "id": "match_abc123",
  "player1": {
    "id": "user_abc123",
    "username": "alice"
  },
  "player2": {
    "id": "user_xyz789",
    "username": "bob"
  },
  "winner": {
    "id": "user_abc123",
    "username": "alice"
  },
  "score": {
    "player1": 10,
    "player2": 7
  },
  "status": "COMPLETED",
  "createdAt": "2026-02-15T10:30:00.000Z",
  "completedAt": "2026-02-15T10:45:00.000Z"
}
```

**Error Responses:**

- 404: Match not found
- 401: Not authenticated

---

## WebSocket Events

### Connection

#### Client → Server: Connection

**When:** Client connects to WebSocket server

**Client sends during handshake:**

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: '<jwt-token>'
  }
});
```

**Server validates token and either:**

- Accepts connection (token valid)
- Rejects connection (token invalid or missing)

---

### Match Invitation Flow

#### Client → Server: match:invite

**Purpose:** Invite another player to a match

**Payload:**

```json
{
  "opponentId": "user_xyz789"
}
```

**Server validates:**

- Both players online?
- Opponent not already in match?
- Sender not already in match?

**If valid:** Server emits `match:invitation` to opponent

**If invalid:** Server emits `error` back to sender

---

#### Server → Client: match:invitation

**Purpose:** Notify player of incoming match invitation

**Payload:**

```json
{
  "from": {
    "id": "user_abc123",
    "username": "alice"
  },
  "invitationId": "invite_xyz789"
}
```

**Client should display:** "alice wants to play against you!"

---

#### Client → Server: match:accept

**Purpose:** Accept a match invitation

**Payload:**

```json
{
  "invitationId": "invite_xyz789"
}
```

**Server:**

1. Creates match in database
2. Creates game state in memory
3. Both players join room `match_<matchId>`
4. Emits `match:start` to both players

---

#### Client → Server: match:decline

**Purpose:** Decline a match invitation

**Payload:**

```json
{
  "invitationId": "invite_xyz789"
}
```

**Server emits:** `match:declined` to the inviter

---

#### Server → Client: match:declined

**Purpose:** Notify inviter that invitation was declined

**Payload:**

```json
{
  "by": {
    "id": "user_xyz789",
    "username": "bob"
  }
}
```

---

### Match Lifecycle

#### Server → Client: match:start

**Purpose:** Notify both players match is starting

**Payload:**

```json
{
  "matchId": "match_abc123",
  "player1": {
    "id": "user_abc123",
    "username": "alice"
  },
  "player2": {
    "id": "user_xyz789",
    "username": "bob"
  },
  "countdown": 3
}
```

**Client should:**

- Navigate to game screen
- Display countdown (3... 2... 1... GO!)
- Prepare to receive game state

---

#### Server → Client: match:countdown

**Purpose:** Countdown before game starts

**Payload:**

```json
{
  "count": 3
}
```

**Emitted every second:** count = 3, 2, 1

**Then:** Game starts, `game:state` events begin

---

### Game Events

#### Client → Server: game:input

**Purpose:** Player sends input (paddle movement)

**Payload:**

```json
{
  "action": "move-up"
}
```

**Valid actions:**

- `"move-up"` - Move paddle up
- `"move-down"` - Move paddle down

**Server:**

- Validates player owns this paddle
- Updates paddle position
- New position broadcast in next `game:state` event

---

#### Server → Client: game:state

**Purpose:** Broadcast current game state (60 FPS)

**Payload:**

```json
{
  "ball": {
    "x": 400,
    "y": 300
  },
  "player1": {
    "paddleY": 250,
    "score": 5
  },
  "player2": {
    "paddleY": 180,
    "score": 3
  }
}
```

**Frequency:** 60 times per second during active gameplay

**Client should:** Render game based on this state

---

#### Server → Client: game:score

**Purpose:** Notify when a point is scored

**Payload:**

```json
{
  "scorer": "player1",
  "score": {
    "player1": 6,
    "player2": 3
  }
}
```

**Client should:** Display score animation

---

#### Server → Client: game:end

**Purpose:** Notify match has ended

**Payload:**

```json
{
  "winner": {
    "id": "user_abc123",
    "username": "alice"
  },
  "finalScore": {
    "player1": 10,
    "player2": 7
  },
  "matchId": "match_abc123"
}
```

**Client should:**

- Display winner
- Show final score
- Navigate to results screen or lobby

---

### Disconnect Events

#### Server → Client: opponent:disconnected

**Purpose:** Notify player their opponent disconnected

**Payload:**

```json
{
  "message": "Your opponent disconnected. You win!",
  "matchId": "match_abc123"
}
```

**Client should:**

- Display message
- End game
- Award win to remaining player

---

### Error Events

#### Server → Client: error

**Purpose:** Notify client of error

**Payload:**

```json
{
  "event": "game:input",
  "message": "Invalid move",
  "code": "INVALID_MOVE"
}
```

**Error codes:**

- `INVALID_MOVE` - Move not allowed
- `NOT_YOUR_TURN` - Tried to move opponent's paddle
- `MATCH_NOT_FOUND` - Match doesn't exist
- `PLAYER_NOT_IN_MATCH` - Player not part of this match

---

## Data Types Reference

### User Object

```typescript
{
  id: string;
  email: string;
  username: string;
  profile?: Profile;
}
```

### Profile Object

```typescript
{
  nickname: string | null;
  avatar: string | null;
  wins: number;
  losses: number;
  totalGames: number;
}
```

### Match Object

```typescript
{
  id: string;
  player1: User;
  player2: User;
  winner: User | null;
  score: {
    player1: number;
    player2: number;
  };
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  createdAt: string;  // ISO 8601
  completedAt: string | null;  // ISO 8601
}
```

### Game State Object

```typescript
{
  ball: {
    x: number;  // 0-800
    y: number;  // 0-600
  };
  player1: {
    paddleY: number;  // 0-500
    score: number;
  };
  player2: {
    paddleY: number;  // 0-500
    score: number;
  };
}
```

---

## Authentication

### HTTP Endpoints

All protected endpoints require:

```text
Authorization: Bearer <jwt-token>
```

**If missing or invalid:** 401 Unauthorized response

---

### WebSocket Connection

Token sent during connection:

```javascript
io('http://localhost:3001', {
  auth: { token: '<jwt-token>' }
});
```

**If invalid:** Connection rejected immediately

---

## Error Response Format

All HTTP errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Email is already registered",
  "error": "Bad Request",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/auth/register"
}
```

**Validation errors (multiple messages):**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Rate Limiting

### HTTP Endpoints

- 100 requests per minute per IP
- If exceeded: 429 Too Many Requests

### WebSocket Events

- game:input: No limit (60 FPS expected)
- match:invite: 10 per minute per user
- Other events: No explicit limit

---

## CORS Policy

**Allowed origins:**

- `http://localhost:3000` (development)
- `https://your-production-domain.com` (production)

**Allowed methods:**

- GET, POST, PATCH, DELETE

**Allowed headers:**

- Content-Type, Authorization

---

## Versioning

**Current version:** v1 (no version prefix in URLs yet)

**If breaking changes needed:**

- New endpoints use `/v2/` prefix
- Old endpoints remain for backward compatibility
- Deprecation warnings issued
- Eventually v1 removed

---

## Contract Evolution

When adding new endpoints or events:

1. **Document first** - Update this file
2. **Get agreement** - Frontend and backend teams review
3. **Implement** - Both sides implement
4. **Test integration** - Verify contract is followed

**Never:**

- Change existing contracts without notice
- Remove fields without deprecation period
- Change response formats silently

---

## Testing the Contract

### HTTP Endpoints

Use Postman, curl, or automated tests:

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234","username":"testuser"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}'
```

### WebSocket Events

Use Socket.IO client library:

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: '<token>' }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('match:invite', { opponentId: 'user_xyz' });
socket.on('match:invitation', (data) => console.log('Invited!', data));
```

---

## Key Takeaways

1. **Frontend and backend must agree** - This document is the contract
2. **Authentication required** - Most endpoints need valid JWT token
3. **Consistent format** - All errors follow same structure
4. **WebSocket = real-time** - HTTP = request/response
5. **Document changes** - Update this file before implementing new features
6. **Version carefully** - Don't break existing clients

**This contract enables frontend and backend to develop independently.**
