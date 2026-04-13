# NestJS Overview

## Purpose

This document introduces NestJS: what it is, why it exists, and how it organizes backend applications. By the end, you'll understand NestJS's philosophy, core building blocks, and how it improves on plain Node.js/Express development.

---

## What Is NestJS

**NestJS is a TypeScript-first framework for building scalable Node.js server-side applications.**

**Key characteristics:**

1. **Opinionated** - Provides clear patterns and structure
2. **Modular** - Organizes code into modules
3. **TypeScript-first** - Designed for TypeScript (not JavaScript with types bolted on)
4. **Decorator-based** - Uses `@decorators` extensively
5. **Inspired by Angular** - Shares architectural patterns with Angular frontend framework

It's a **complete framework**, not just a library.

---

## Why NestJS Exists

### The Problem with Plain Node.js/Express

**Express.js** (the most popular Node.js framework) is minimal and unopinionated:

```javascript
// Express example (no structure enforced)
const express = require('express');
const app = express();

app.post('/auth/login', (req, res) => {
  // Login logic here... but where?
  // Directly in the route handler?
  // In a separate file?
  // How do you organize this?
});

app.get('/users/:id', (req, res) => {
  // User logic here...
});

app.post('/matches', (req, res) => {
  // Match logic here...
});

// As the app grows, this becomes spaghetti code
```

---

### How NestJS Solves This

**NestJS enforces:**

1. **Clear structure** - Modules, controllers, services
2. **Separation of concerns** - Each piece has one job
3. **Dependency injection** - Framework manages dependencies
4. **Built-in patterns** - Guards, interceptors, pipes, middleware
5. **TypeScript integration** - Type safety everywhere

**Same login example in NestJS:**

```typescript
// auth.controller.ts - Handles HTTP
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

// auth.service.ts - Business logic
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    // Login logic here
  }
}

// auth.module.ts - Wires everything together
@Module({
  imports: [UsersModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

---

## NestJS Philosophy

### 1. Modularity

**Every feature is a module.**

```text
auth/         ← Auth module
users/        ← Users module
game/         ← Game module
matchmaking/  ← Matchmaking module
```

Each module:

- Is self-contained
- Declares its dependencies
- Exports what other modules can use

**Benefits:**

- Easy to locate code ("Where's login logic?" → "Auth module")
- Easy to test in isolation
- Easy to reuse modules across projects

### 2. Dependency Injection

**The framework manages object creation and wiring.**

**Without DI (manual):**

```typescript
const usersService = new UsersService(new PrismaClient());
const authService = new AuthService(usersService, new JwtService());
const authController = new AuthController(authService);
```

**With DI (automatic):**

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  // NestJS automatically provides AuthService
}
```

**NestJS:**

- Creates instances
- Resolves dependencies
- Manages lifecycle
- Injects where needed

### 3. Decorator-Based Configuration

**Decorators (`@Something`) provide metadata.**

```typescript
@Controller('users')        // "This class handles /users routes"
export class UsersController {
  
  @Get(':id')               // "This method handles GET /users/:id"
  async getUser(@Param('id') id: string) {
    // ...
  }
}
```

**Decorators are instructions to the framework:**

- What routes to handle
- What dependencies to inject
- What validation to apply
- What guards to use

---

### 4. Convention Over Configuration

**NestJS follows conventions:**

- Controllers end with `.controller.ts`
- Services end with `.service.ts`
- Modules end with `.module.ts`
- DTOs end with `.dto.ts`

**File structure follows a pattern:**

```mermaid
auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
├── dto/
│   └── login.dto.ts
└── guards/
    └── jwt-auth.guard.ts
```

---

## Core Building Blocks

### Overview

NestJS applications are built from:

1. **Modules** - Organize features
2. **Controllers** - Handle HTTP requests
3. **Providers** (Services) - Business logic
4. **DTOs** - Data validation
5. **Guards** - Authentication/authorization
6. **Pipes** - Data transformation/validation
7. **Interceptors** - Request/response manipulation
8. **Middleware** - Request preprocessing

**We'll cover each in detail in separate documents. For now, understand what each does.**

---

### 1. Modules

**A module groups related functionality.**

```typescript
@Module({
  imports: [UsersModule, JwtModule],     // Modules this depends on
  controllers: [AuthController],          // HTTP handlers
  providers: [AuthService],               // Services
  exports: [AuthService],                 // What other modules can use
})
export class AuthModule {}
```

**Every NestJS app has:**

- One **root module** (`AppModule`)
- Many **feature modules** (`AuthModule`, `UsersModule`, etc.)

**Modules declare:**

- What they need (`imports`)
- What they provide (`providers`)
- What they expose (`exports`)

---

### 2. Controllers

**Controllers handle incoming HTTP requests.**

```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Controllers:**

- Define routes (`@Get()`, `@Post()`, etc.)
- Extract data from requests (`@Body()`, `@Param()`, etc.)
- Delegate to services
- Return responses

**Controllers should be thin** - they orchestrate, they don't implement business logic.

### 3. Providers (Services)

**Providers contain business logic.**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return {
      access_token: this.jwtService.sign({ sub: user.id })
    };
  }
}
```

**Services:**

- Are marked with `@Injectable()`
- Contain business logic
- Can depend on other services (via constructor injection)
- Are reusable across controllers

---

### 4. DTOs (Data Transfer Objects)

**DTOs define and validate data shape.**

```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**DTOs:**

- Define expected request/response structure
- Include validation rules
- Provide type safety

**Used with ValidationPipe:**

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // loginDto is guaranteed to be valid
  return this.authService.login(loginDto.email, loginDto.password);
}
```

If request doesn't match DTO → automatic 400 Bad Request response.

---

### 5. Guards

**Guards determine if a request should proceed.**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Used to protect routes:**

```typescript
@Controller('users')
export class UsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)  // ← Must be authenticated
  getProfile(@Request() req) {
    return req.user;
  }
}
```

**Guards run before the controller method:**

```mermaid
Request → Guard (check auth) → Controller
              ↓
          Reject if unauthorized
```

---

### 6. Pipes

**Pipes transform or validate data.**

**Validation pipe:**

```typescript
@Post()
async create(@Body(new ValidationPipe()) createDto: CreateUserDto) {
  // Automatically validates createDto against class-validator decorators
}
```

**Transformation pipe:**

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  // ParseIntPipe converts string '123' to number 123
}
```

---

### 7. Interceptors

**Interceptors wrap request/response handling.**

**Use cases:**

- Logging
- Response transformation
- Caching
- Timeout handling

**Example: Logging interceptor**

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before...');
    
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`))
    );
  }
}
```

---

### 8. Middleware

**Middleware runs before route handlers.**

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    console.log(`${req.method} ${req.path}`);
    next();
  }
}
```

**Applied to routes:**

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');  // Apply to all routes
  }
}
```

---

## Request Lifecycle

**The flow through NestJS:**

```mermaid
1. Request arrives
   ↓
2. Middleware (if any)
   ↓
3. Guards (authentication/authorization)
   ↓
4. Interceptors (before)
   ↓
5. Pipes (validation/transformation)
   ↓
6. Controller method
   ↓
7. Service method(s)
   ↓
8. Return value
   ↓
9. Interceptors (after)
   ↓
10. Response sent
```

**Example with authentication:**

```text
POST /users/profile

1. Request arrives
2. LoggerMiddleware logs request
3. JwtAuthGuard checks token → extracts user
4. ValidationPipe validates body
5. Controller method executes
6. Service updates profile
7. Response sent
```

**If guard rejects:**

```text
POST /users/profile (no token)

1. Request arrives
2. JwtAuthGuard checks token → FAILS
3. 401 Unauthorized response sent
   (Controller never called)
```

---

## Application Structure

### Example NestJS Project

```mermaid
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │       └── update-user.dto.ts
│   │
│   ├── game/
│   │   ├── game.controller.ts
│   │   ├── game.service.ts
│   │   ├── game.gateway.ts      ← WebSocket handler
│   │   ├── game.module.ts
│   │   └── dto/
│   │       └── game-move.dto.ts
│   │
│   └── matchmaking/
│       ├── matchmaking.service.ts
│       └── matchmaking.module.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
│
├── config/
│   └── configuration.ts
│
├── app.module.ts       ← Root module
└── main.ts             ← Application entry point
```

### Root Module (AppModule)

**Every NestJS app has a root module:**

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UsersModule,
    GameModule,
    MatchmakingModule,
  ],
})
export class AppModule {}
```

**The root module:**

- Imports all feature modules
- Is the starting point of the application
- Wires everything together

### Entry Point (main.ts)

**The main.ts file bootstraps the application:**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global configuration
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}

bootstrap();
```

**This is where the app starts.**
