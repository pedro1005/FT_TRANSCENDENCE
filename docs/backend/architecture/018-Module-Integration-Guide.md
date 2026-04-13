# Module Integration Guide

## Purpose

This document explains **how backend modules interact in real execution scenarios**.

It is not about what a module is. It is about how modules collaborate during actual system behavior.

By the end, you should understand request flows across modules, allowed cross-module calls, circular dependency avoidance, responsibility distribution, and real-world scenario execution.

---

## The Dependency Direction Rule

Before examining scenarios, define one strict rule:

Dependencies flow inward toward domain logic.

For example:

- Controllers depend on services.
- Services depend on other services (if exported).
- Services depend on Prisma.
- Gateways depend on services.

But:

- Users module should not depend on Game module.
- Low-level modules should not depend on high-level orchestration modules.

Think in terms of ownership and domain boundaries.

---

## Scenario 1: User Login (HTTP Flow)

### Step 1 — HTTP Request

Frontend sends:

```ts
POST /auth/login
```

### Step 2 — AuthController

- Extracts LoginDto
- Calls AuthService.login()

### Step 3 — AuthService

- Calls UsersService.findByEmail()
- Validates password
- Generates JWT
- Returns token

### Step 4 — Response

Controller returns token to frontend.

### Module Interaction

```mermaid
AuthController
   ↓
AuthService
   ↓
UsersService
   ↓
PrismaService
```

UsersService does not depend on AuthService.
AuthService depends on UsersService.

This direction is intentional.

---

## Scenario 2: Start Online Match

### Step 1 — HTTP Request

```ts
POST /matchmaking/invite
```

### Step 2 — MatchmakingController

- Extracts DTO
- Calls MatchmakingService.invite()

### Step 3 — MatchmakingService

- Verifies both players exist (UsersService)
- Creates match (GameService)
- Notifies players (GameGateway)

### Step 4 — GameGateway

- Emits `match:start` event to both players' room

### Module Interaction

```mermaid
MatchmakingService
   ↓
UsersService
   ↓
GameService
   ↓
PrismaService
   ↓
GameGateway (emit event)
```

Important:

- Matchmaking does not update database directly.
- GameService owns match creation.
- Gateway only emits events.

---

## Scenario 3: Player Makes a Move (WebSocket Flow)

### Step 1 — Client Sends Event

```ts
event: game:move
payload: { x: 2, y: 1 }
```

### Step 2 — GameGateway

- Extracts user identity from socket
- Validates payload
- Calls GameService.processMove()

### Step 3 — GameService

- Validates move rules
- Updates match state
- Persists state if needed
- Determines next player

### Step 4 — GameGateway

- Emits updated state to match room

### Module Interaction

```mermaid
GameGateway
   ↓
GameService
   ↓
PrismaService
   ↓
GameGateway (emit)
```

Game logic stays inside GameService.

Gateway is transport only.

---

## Scenario 4: Player Disconnects

### Step 1 — Socket Disconnects

Gateway's `handleDisconnect()` fires.

### Step 2 — GameGateway

- Retrieves user identity
- Calls GameService.handleDisconnect()

### Step 3 — GameService

- Determines if match should end
- Sets winner
- Updates stats (via UsersService)
- Persists match result
- Notifies opponent via Gateway

### Module Interaction

```mermaid
GameGateway
   ↓
GameService
   ↓
UsersService
   ↓
PrismaService
   ↓
GameGateway (emit)
```

GameService coordinates logic.

UsersService handles stat updates.

---

## Avoiding Circular Dependencies

A circular dependency occurs when:

- GameService depends on UsersService
- UsersService depends on GameService

This is incorrect.

Correct structure:

UsersService should not know about GameService.

If shared logic is needed:

- Extract to a third service
- Or restructure responsibility

Ownership must be unidirectional.

---

## Module Responsibility Summary

Auth Module:

- Token generation
- Credential validation

Users Module:

- Profile data
- Stats

Game Module:

- Match state
- Game rules
- End-of-game logic

Matchmaking Module:

. Pairing players
. Starting matches

WebSocket Module:

- Real-time transport
- Event broadcasting

Core Module:

- Prisma
- Config
- Shared infrastructure

Each module owns its domain.

---

## Data Ownership Rules

Even though Prisma schema is shared, logical ownership exists.

Example:

- Only UsersService modifies user stats.
- Only GameService modifies match state.
- MatchmakingService does not update stats directly.
- No module directly manipulates another module's tables.

All changes go through that module's service.

---

## Transaction Coordination

When multiple modules are involved in a critical operation:

The highest-level coordinating service should own the transaction.

**Example:**

GameService ends match and updates stats in a transaction.

Not UsersService.

Coordination happens at domain level.

---

## Cross-Module Communication Pattern

Allowed:

```text
Service A → Service B (exported)
```

Not allowed:

```text
Service A → Prisma (modifying data owned by B)
```

Respect boundaries.
