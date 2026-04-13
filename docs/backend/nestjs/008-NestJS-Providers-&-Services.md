# NestJS Providers & Services

## Purpose

This document provides a deep dive into **Providers** and **Services** in NestJS. By the end, you should grasp the concepts of providers, services, dependency injection, business logic structure, backend architecture, and cross-module interactions.

Controllers receive requests.
**Services make decisions.**

---

## Providers

A **provider** is any class that can be injected via NestJS’s dependency injection system.

In practice, most providers are:

- Services
- Repositories
- Helpers
- Factories
- External integrations

A provider is defined using:

```ts
@Injectable()
export class UsersService {}
```

Then registered inside a module:

```ts
@Module({
  providers: [UsersService],
})
export class UsersModule {}
```

Once registered, it can be injected elsewhere.

## Services

A **service** is a specific type of provider responsible for:

- Business logic
- Decision-making
- Coordination between components
- Enforcing rules

Services are the core of backend architecture.

Example:

```ts
@Injectable()
export class UsersService {
  async findById(id: string) {
    // Business logic here
  }
}
```

**Controllers should never contain business logic. They delegate to services.**

---

## Dependency Injection (DI)

### Without DI (Manual Instantiation)

```ts
const usersService = new UsersService();
```

This approach couples the controller directly to a concrete class, forces you to manage the instance lifecycle yourself, and makes unit tests harder because you cannot easily swap in a mock or stub.

### With NestJS Dependency Injection

```ts
@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {}

}
```

With DI, NestJS creates the `UsersService` instance, controls when it is created and destroyed, and injects it into the controller automatically, so **you never construct service instances by hand**.

---

## How Dependency Resolution Works

When a service is injected:

```ts
constructor(private usersService: UsersService)
```

NestJS looks for:

1. The current module’s `providers`
2. Imported modules’ `exports`

If it cannot find it → application fails at startup.

---

## Service Structure

```ts
@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isValid = await this.verifyPassword(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: this.jwtService.sign({ sub: user.id }),
    };
  }

  private async verifyPassword(input: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(input, hashed);
  }
}
```

- Service orchestrates logic
- Uses other services
- Throws exceptions
- Contains private helper methods
- Does not know about HTTP layer

---

## Service Responsibilities

**A service may:**

- Validate business rules
- Coordinate multiple repositories
- Emit WebSocket events
- Trigger side effects
- Enforce permissions
- Transform data

**A service should NOT:**

- Extract HTTP parameters
- Handle request objects
- Manually format responses
- Access `@Req()` or `@Res()`

Services operate independently of transport layer.

---

## Layered Design

In our project:

```mermaid
Controller
   ↓
Service
   ↓
Repository (Prisma layer)
   ↓
Database
```

**Controllers depend on services. Services depend on repositories. Repositories depend on Prisma.**

**Never reverse this direction.**

---

## Example: Matchmaking Service

```ts
@Injectable()
export class MatchmakingService {

  constructor(
    private readonly usersService: UsersService,
    private readonly gameService: GameService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async createMatch(player1Id: string, player2Id: string) {

    const player1 = await this.usersService.findById(player1Id);
    const player2 = await this.usersService.findById(player2Id);

    if (!player1 || !player2) {
      throw new NotFoundException('Player not found');
    }

    const match = await this.gameService.createMatch(player1Id, player2Id);

    this.websocketGateway.notifyMatchStart(match.id);

    return match;
  }
}
```

- Coordinates 3 dependencies
- Applies validation rules
- Triggers real-time events
- Returns domain data

**Controllers should never do this level of orchestration.**

---

## Cross-Module Services

If a service must be used in another module:

### 1. Provide it

```ts
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 2. Import the module

```ts
@Module({
  imports: [UsersModule],
})
export class AuthModule {}
```

### 3. Inject it

```ts
constructor(private usersService: UsersService) {}
```

**Exporting is mandatory for cross-module usage.**

---

## Service Testing

Services are easy to test because they do not depend on HTTP.

Example:

```ts
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should login successfully', async () => {
    const result = await service.login({ email: 'test', password: '123' });
    expect(result).toBeDefined();
  });
});
```

This works because business logic is isolated.

---

## In Our Project

Expected core services:

### AuthService

- register()
- login()
- validateToken()

### UsersService

- findById()
- findByEmail()
- updateProfile()

### GameService

- createMatch()
- updateGameState()
- endMatch()

### MatchmakingService

- invite()
- accept()
- pairPlayers()

### WebsocketGateway (special provider)

- Emits events
- Handles connection state
