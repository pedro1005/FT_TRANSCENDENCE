# Backend Integration Contracts

## Purpose

This document defines the **integration contracts between the backend and all external systems** it interacts with.

This is not about framework mechanics.
It is about **system boundaries and responsibilities**.

The goal is to answer: "What does the backend depend on, what does it expose, and what guarantees does it make?"

By the end, you should understand:

- Which systems the backend depends on
- What the backend guarantees to other systems
- Where ownership lies
- What happens when dependencies fail
- How contracts evolve safely

---

## Backend as an Integration Hub

Our backend connects:

- Frontend (HTTP + WebSocket)
- Database (PostgreSQL via Prisma)
- Authentication system (JWT)
- Reverse proxy (Nginx)
- Container runtime (Docker)
- Configuration system (environment variables)

The backend is responsible for:

- Defining API contracts
- Enforcing validation
- Maintaining state consistency
- Protecting internal logic

Clear boundaries prevent confusion.

---

## Frontend Integration (HTTP Contracts)

HTTP endpoints define the contract between frontend and backend.

Example:

```ts
POST /auth/login
GET /users/profile
POST /matchmaking/invite
```

Each endpoint must define:

- Request body DTO
- Response DTO
- Possible status codes
- Error structure

Example contract:

### Request

```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (success)

```json
{
  "accessToken": "jwt_token"
}
```

### Response (failure)

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

Rules:

- Backend defines contract.
- Frontend consumes contract.
- DTOs define shape.
- Validation enforces correctness.

If contract changes, frontend must adapt.

---

## Frontend Integration (WebSocket Contracts)

WebSocket contracts are event-based.

Example events:

Client → Server:

- `match:invite`
- `game:move`

Server → Client:

- `match:start`
- `game:update`
- `game:end`

Each event must define:

- Event name
- Payload DTO
- Who can emit it
- Expected server behavior

Example:

Client sends:

```json
{
  "event": "game:move",
  "data": { "x": 2, "y": 1 }
}
```

Server responds:

```json
{
  "event": "game:update",
  "data": { "board": [...], "currentPlayer": "user_123" }
}
```

Rules:

- Server is authoritative.
- Payloads validated using DTOs.
- No raw database models exposed.
- Event naming consistent and versioned if needed.

---

## Database Integration Contract

Backend owns:

- Prisma schema
- Migrations
- Data consistency rules

Database guarantees:

- Persistent storage
- Transaction integrity
- Constraint enforcement

Backend guarantees:

- Queries respect relational integrity
- Transactions used for atomic operations
- No direct SQL outside Prisma

Failure mode:

- If database is unreachable → backend must not start.
- If query fails → service must propagate error correctly.

---

## Authentication Contract

Authentication uses JWT.

Backend guarantees:

- Tokens contain user identifier (`sub`)
- Tokens have expiration
- Tokens are signed with secret
- Protected routes enforce validation

Frontend guarantees:

- Token is sent in `Authorization` header
- Token is stored securely (frontend responsibility)

WebSocket integration:

- Token sent during handshake
- Gateway validates token
- User identity attached to socket

If token is invalid:

- HTTP → 401 Unauthorized
- WebSocket → immediate disconnect

---

## Reverse Proxy (Nginx) Contract

Nginx responsibilities:

- HTTPS termination
- Forward requests to backend
- Possibly rate limiting

Backend assumptions:

- Receives HTTP from proxy
- Trusts forwarded headers when configured
- Does not manage SSL certificates

Important configuration:

```ts
app.set('trust proxy', 1);
```

Without correct proxy trust settings:

- IP-based rate limiting may fail
- Logging may show proxy IP instead of client IP

Backend must align with deployment environment.

---

## Docker Runtime Contract

Docker responsibilities:

- Provide environment variables
- Run backend container
- Connect to database container

Backend responsibilities:

- Exit if required config missing
- Handle SIGTERM for graceful shutdown
- Close Prisma connection properly

Graceful shutdown ensures:

- Active connections close
- Database connection released
- No corrupted state

---

## Configuration Contract

Backend expects:

- DATABASE_URL
- JWT_SECRET
- PORT
- FRONTEND_URL

Backend guarantees:

- Startup validation
- No secret exposure
- Fail-fast behavior on missing variables

Environment is external.
Code is internal.

---

## Error Handling Contract

Backend guarantees:

- Consistent error structure
- Meaningful status codes
- No internal stack traces exposed in production

Example error format:

```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "Bad Request"
}
```

Frontend must rely on this structure.

---

## Module Ownership Rules

Each module owns:

- Its services
- Its business rules
- Its data access patterns

Example ownership:

- Auth → token issuance
- Users → profile updates
- Game → match lifecycle
- Matchmaking → pairing logic
- WebSocket → real-time communication

No module should bypass another module’s service layer.

Example violation:

GameService directly updating user stats via Prisma without going through UsersService.

That breaks modular boundaries.

---

## Versioning and Contract Evolution

Contracts will evolve.

Rules:

- Add fields without breaking old clients when possible.
- Avoid renaming or removing fields abruptly.
- Version APIs if breaking changes are unavoidable.
- Coordinate changes with frontend team.

Contract stability is critical.
