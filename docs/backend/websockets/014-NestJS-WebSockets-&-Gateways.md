# NestJS Websockets & Gateways

## Purpose

This document explains how **WebSocket Gateways integrate into our NestJS backend**. The goal is to answer "How does our backend handle real-time communication, and how does that fit into our module architecture?"

By the end, you should grasp the key concepts of NestJS Gateways, including event flow, WebSocket authentication, room usage, game state management, disconnect handling, and essential architectural rules.

---

## What is a Gateway

In NestJS, a **Gateway** is the WebSocket equivalent of a controller.

Controllers handle HTTP requests. Gateways handle WebSocket events.

Example structure:

```ts
@WebSocketGateway()
export class GameGateway {

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('game:move')
  handleMove(client: Socket, payload: MoveDto) {
    // Handle event
  }

  handleConnection(client: Socket) {}
  handleDisconnect(client: Socket) {}
}
```

- Listens for events
- Emits events
- Manages connection lifecycle

But it should not contain business logic.

---

## Architectural Position of Gateways

The layering is similar to HTTP:

```mermaid
WebSocket Event
   ↓
Gateway
   ↓
Service (GameService / MatchmakingService)
   ↓
Prisma (if needed)
   ↓
Emit update
```

Gateway = transport layer.

Service = domain logic.

**Never put game rules inside the gateway.**

---

## Event Naming Conventions

Events must be predictable and structured.

- `match:invite`
- `match:accept`
- `game:move`
- `game:update`
- `game:end`

**Rules:**

- Use namespaced event names (`domain:action`)
- Keep payload DTOs explicit
- Never send raw database models directly

This keeps frontend/backend contract clean.

---

## Handling Events

Example:

```ts
@SubscribeMessage('game:move')
async handleMove(
  @ConnectedSocket() client: Socket,
  @MessageBody() dto: GameMoveDto,
) {
  const result = await this.gameService.processMove(
    client.data.userId,
    dto,
  );

  this.server.to(result.roomId).emit('game:update', result.state);
}
```

Key points:

- Gateway extracts minimal context
- Delegates logic to GameService
- Emits result
- Does not calculate winner or validate moves itself

---

## Rooms and Match Isolation

For multiplayer matches, each match should use a room.

Example:

```ts
client.join(matchId);
```

To emit only to players in that match:

```ts
this.server.to(matchId).emit('game:update', newState);
```

This ensures:

- Isolation between matches
- No data leakage across sessions
- Efficient broadcasting

Room ID usually equals match ID.

---

## WebSocket Authentication

HTTP authentication uses guards and JWT.

WebSockets must also authenticate, but differently.

When client connects:

- It sends token during handshake.
- Gateway validates token.
- User info is attached to `client.data`.

Example:

```ts
async handleConnection(client: Socket) {

  const token = client.handshake.auth?.token;

  if (!token) {
    client.disconnect();
    return;
  }

  try {
    const payload = this.jwtService.verify(token);
    client.data.userId = payload.sub;
  } catch {
    client.disconnect();
  }
}
```

- Reject invalid connections immediately.
- Never trust client-provided IDs.
- Attach user identity once, reuse later.

---

## Disconnect Handling

Disconnects are critical in real-time games.

Example:

```ts
async handleDisconnect(client: Socket) {

  const userId = client.data.userId;

  await this.gameService.handleDisconnect(userId);
}
```

Service may:

- Mark match as abandoned
- Determine winner
- Update stats
- Notify remaining player

**Disconnect logic must be centralized in GameService.**

---

## Server Authority Model

For competitive games, backend must be authoritative.

That means:

- Client sends intended action.
- Server validates move.
- Server updates state.
- Server broadcasts result.

Never trust client-side state.

---

## Gateway as a Provider

**Gateways are providers.**

They can inject services:

```ts
constructor(
  private readonly gameService: GameService,
  private readonly jwtService: JwtService,
) {}
```

If MatchmakingService needs to notify players -> **It should inject the gateway.**

Example:

```ts
constructor(private readonly gameGateway: GameGateway) {}
```

**But avoid circular dependencies.**

If GameGateway depends on GameService, and GameService depends on GameGateway, architecture is wrong.

Better pattern:

- Gateway emits events.
- Service triggers gateway methods.
- But domain logic remains in service.

---

## DTOs for WebSocket Events

**WebSocket payloads must use DTOs.**

Example:

```ts
export class GameMoveDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}
```

Even WebSocket events can use ValidationPipe.

**Never accept `any` payloads.**

---

## Module Boundaries

Example module relationships:

- GameGateway → GameService
- MatchmakingService → GameService
- MatchmakingService → GameGateway
- GameService → Prisma
- UsersService → Prisma

**Users module should not depend on WebSocket.**

**WebSocket module should not depend on Users logic unless necessary.**

**Keep dependencies directional.**

---

## Mental Model

HTTP = request/response.

WebSocket = event stream.

Gateway handles transport.
Service handles rules.
Prisma handles persistence.

If gateway contains domain logic, architecture is leaking.
