# NestJS Modules

## Purpose

This document provides a deep dive into NestJS modules: what they are, how they work, how they interact, and how to design module boundaries. By the end, you'll understand how to organize your application into cohesive, maintainable modules.

---

## What a Module Is

**A module is a class annotated with the `@Module()` decorator.**

Modules are NestJS's way of organizing an application into cohesive blocks of functionality.

**Think of a module as a folder that contains everything related to one feature:**

```mermaid
auth/
├── auth.controller.ts    ← HTTP handlers for auth endpoints
├── auth.service.ts       ← Business logic for authentication
├── auth.module.ts        ← Module definition (wires everything together)
├── dto/
│   └── login.dto.ts      ← Data validation
└── guards/
    └── jwt-auth.guard.ts ← Route protection
```

**The module file (`auth.module.ts`) declares:**\

- What this module provides (controllers, services)
- What this module needs from other modules (imports)
- What this module exposes to other modules (exports)

---

## Module Anatomy

### Basic Structure

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],           // Other modules this module depends on
  controllers: [],       // Controllers belonging to this module
  providers: [],         // Services/providers belonging to this module
  exports: [],           // What other modules can use from this module
})
export class AuthModule {}
```

---

### The `@Module()` Decorator Properties

**1. `imports`** - Other modules this module needs

```typescript
@Module({
  imports: [UsersModule, JwtModule],
  // ...
})
export class AuthModule {}
```

**Meaning:** AuthModule depends on UsersModule and JwtModule.

**2. `controllers`** - HTTP request handlers

```typescript
@Module({
  controllers: [AuthController],
  // ...
})
export class AuthModule {}
```

**Meaning:** This module provides the AuthController to handle HTTP requests.

**3. `providers`** - Services, repositories, helpers, etc.

```typescript
@Module({
  providers: [AuthService, PasswordService],
  // ...
})
export class AuthModule {}
```

**Meaning:** This module provides AuthService and PasswordService.

**4. `exports`** - What other modules can use

```typescript
@Module({
  providers: [AuthService, PasswordService],
  exports: [AuthService],  // Only AuthService is accessible to other modules
})
export class AuthModule {}
```

**Meaning:**

- AuthService can be injected in other modules that import AuthModule
- PasswordService is private to AuthModule (not exported)

---

## Complete Example: Auth Module

### File: `auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,              // Need UsersService to find users
    PassportModule,           // Authentication framework
    JwtModule.register({      // JWT token generation
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],  // HTTP endpoints: /auth/login, /auth/register
  providers: [AuthService, JwtStrategy],  // Business logic + JWT strategy
  exports: [AuthService],         // Other modules can use AuthService
})
export class AuthModule {}
```

**What this means:**

1. **Imports UsersModule** → Can inject `UsersService` in `AuthService`
2. **Imports JwtModule** → Can inject `JwtService` to generate tokens
3. **Provides AuthController** → Handles `/auth/*` routes
4. **Provides AuthService** → Contains login/register logic
5. **Exports AuthService** → Other modules can use `AuthService`

### How This Module Is Used

**Other modules import AuthModule:**

```typescript
@Module({
  imports: [AuthModule],  // Import entire AuthModule
  // ...
})
export class SomeOtherModule {}
```

**Now `SomeOtherModule` can inject `AuthService`:**

```typescript
@Injectable()
export class SomeService {
  constructor(private authService: AuthService) {}
  // Can use authService.validateToken(), etc.
}
```

**But cannot inject `JwtStrategy`** (not exported).

---

## Dependency Injection in Modules

### How Providers Are Resolved

**When you inject a service, NestJS looks for it in:**

1. **Current module's providers**
2. **Imported modules' exports**

**Example:**

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,  // ← Where does this come from?
    private jwtService: JwtService,      // ← And this?
  ) {}
}
```

**NestJS resolution:**

1. `UsersService` → Not in `AuthModule.providers`
   - Check `AuthModule.imports`
   - Find `UsersModule`
   - Check `UsersModule.exports`
   - Found! Use `UsersService` from `UsersModule`

2. `JwtService` → Not in `AuthModule.providers`
   - Check `AuthModule.imports`
   - Find `JwtModule`
   - `JwtModule` exports `JwtService`
   - Found! Use `JwtService`

**If not found anywhere → NestJS throws an error at startup.**

---

## Module Interactions

### Example: Auth Module Uses Users Module

**Scenario:** AuthService needs to find users by email.

**users.module.ts:**

```typescript
@Module({
  providers: [UsersService],
  exports: [UsersService],  // ← Export so other modules can use it
})
export class UsersModule {}
```

**auth.module.ts:**

```typescript
@Module({
  imports: [UsersModule],  // ← Import UsersModule
  providers: [AuthService],
})
export class AuthModule {}
```

**auth.service.ts:**

```typescript
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  // ✅ Can inject UsersService because:
  // 1. AuthModule imports UsersModule
  // 2. UsersModule exports UsersService

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    // ...
  }
}
```

### Circular Dependencies (Problem)

**What happens if two modules need each other?**

```typescript
// auth.module.ts
@Module({
  imports: [UsersModule],
  // ...
})
export class AuthModule {}

// users.module.ts
@Module({
  imports: [AuthModule],  // ❌ Circular dependency!
  // ...
})
export class UsersModule {}
```

**Is possible to work around this using `forwardRef()`** but this is not a good practice at all!

```typescript
@Module({
  imports: [forwardRef(() => UsersModule)],
})
export class AuthModule {}

@Module({
  imports: [forwardRef(() => AuthModule)],
})
export class UsersModule {}
```

**Best practice:** Avoid circular dependencies through good design.

---

## Dynamic Modules

### What Are Dynamic Modules?

**Dynamic modules are configured at runtime.**

**Example: Database connection**

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'secret',
    }),
  ],
})
export class AppModule {}
```

**The `forRoot()` method returns a dynamically configured module.**

### Common Pattern: `forRoot()` and `forFeature()`

**Many NestJS libraries use this pattern:**

**`forRoot()`** - Configure once in root module

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
```

**`forFeature()`** - Configure per feature module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),  // Register entities for this module
  ],
})
export class UsersModule {}
```

## Global Modules

**When every module needs to import one specific module.** This gets very repetitive and annoying.

```typescript
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

**You only import once in `AppModule`:**

```typescript
@Module({
  imports: [ConfigModule],  // Import once
})
export class AppModule {}
```

**All modules can inject `ConfigService` without importing `ConfigModule`.**

**Rule of thumb:** If 80%+ of modules need it, make it global.

---

## Our Project's Module Structure

### Planned Modules

```mermaid
src/
├── modules/
│   ├── auth/
│   │   └── auth.module.ts
│   ├── users/
│   │   └── users.module.ts
│   ├── game/
│   │   └── game.module.ts
│   ├── matchmaking/
│   │   └── matchmaking.module.ts
│   └── websocket/
│       └── websocket.module.ts
│
├── core/
│   └── core.module.ts        ← Database, config (global)
│
├── shared/
│   └── shared.module.ts      ← Utilities
│
└── app.module.ts             ← Root module
```

### Module Dependency Graph

```mermaid
AppModule
  ├── CoreModule (global)
  ├── AuthModule
  │   └── imports: [UsersModule]
  ├── UsersModule
  │   └── imports: []
  ├── GameModule
  │   └── imports: [UsersModule]
  ├── MatchmakingModule
  │   └── imports: [UsersModule, GameModule, WebsocketModule]
  └── WebsocketModule
      └── imports: [GameModule]
```

### Auth Module (Detailed)

```typescript
// src/modules/auth/auth.module.ts

@Module({
  imports: [
    UsersModule,              // To find/create users
    JwtModule.register({      // To generate tokens
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PassportModule,           // Authentication strategies
  ],
  controllers: [AuthController],  // Endpoints: /auth/login, /auth/register
  providers: [
    AuthService,              // Business logic
    JwtStrategy,              // JWT validation strategy
    LocalStrategy,            // Username/password validation
  ],
  exports: [AuthService],     // Other modules can validate tokens
})
export class AuthModule {}
```

---

### Users Module (Detailed)

```typescript
// src/modules/users/users.module.ts

@Module({
  imports: [],                    // No dependencies (low-level module)
  controllers: [UsersController], // Endpoints: /users/profile, /users/stats
  providers: [UsersService],      // Business logic
  exports: [UsersService],        // AuthModule and others need this
})
export class UsersModule {}
```

---

### Game Module (Detailed)

```typescript
// src/modules/game/game.module.ts

@Module({
  imports: [UsersModule],         // To update player stats
  controllers: [GameController],  // Endpoints: /game/matches/:id
  providers: [GameService],       // Game logic
  exports: [GameService],         // MatchmakingModule creates matches
})
export class GameModule {}
```

---

### Matchmaking Module (Detailed)

```typescript
// src/modules/matchmaking/matchmaking.module.ts

@Module({
  imports: [
    UsersModule,        // Check if users exist
    GameModule,         // Create matches
    WebsocketModule,    // Notify players
  ],
  controllers: [MatchmakingController],  // Endpoints: /matchmaking/invite
  providers: [MatchmakingService],       // Pairing logic
  exports: [MatchmakingService],         // Not typically needed outside
})
export class MatchmakingModule {}
```

---

### WebSocket Module (Detailed)

```typescript
// src/modules/websocket/websocket.module.ts

@Module({
  imports: [GameModule],          // To update game state
  providers: [WebsocketGateway],  // WebSocket event handlers
  exports: [WebsocketGateway],    // MatchmakingModule sends notifications
})
export class WebsocketModule {}
```

---

### Core Module (Global)

```typescript
// src/core/core.module.ts

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [PrismaService, LoggerService],
  exports: [PrismaService, LoggerService],
})
export class CoreModule {}
```

**Available everywhere without importing.**

---

### Root Module (AppModule)

```typescript
// src/app.module.ts

@Module({
  imports: [
    CoreModule,          // Global utilities
    AuthModule,
    UsersModule,
    GameModule,
    MatchmakingModule,
    WebsocketModule,
  ],
})
export class AppModule {}
```

**This is the entry point that ties everything together.**

---

## Module Lifecycle

### Initialization Order

**NestJS initializes modules in dependency order:**

1. **Modules with no dependencies first**
   - `CoreModule` (global)
   - `UsersModule` (no imports)

2. **Modules that depend on (1)**
   - `AuthModule` (imports `UsersModule`)
   - `GameModule` (imports `UsersModule`)

3. **Modules that depend on (2)**
   - `MatchmakingModule` (imports `GameModule`, `UsersModule`)

**If initialization fails at any step, the application doesn't start.**

---

### Module Lifecycle Hooks

**Modules can hook into lifecycle events:**

```typescript
@Module({
  // ...
})
export class SomeModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    console.log('Module initialized');
    // Setup logic (connect to external service, etc.)
  }

  async onModuleDestroy() {
    console.log('Module destroyed');
    // Cleanup logic (close connections, etc.)
  }
}
```

**Common use cases:**

- `onModuleInit` - Connect to database, warm up caches
- `onModuleDestroy` - Close database connections, save state

---

## Testing Modules

### Module Testing

**You can test modules in isolation:**

```typescript
describe('AuthModule', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
```

**Testing modules validates:**

- Dependencies resolve correctly
- No circular dependencies
- Providers are injectable

---

### Mocking Dependencies in Tests

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    AuthService,
    {
      provide: UsersService,
      useValue: mockUsersService,  // Mock UsersService
    },
    {
      provide: JwtService,
      useValue: mockJwtService,    // Mock JwtService
    },
  ],
}).compile();
```

**This tests `AuthService` without real `UsersService` or `JwtService`.**
