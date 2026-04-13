# NestJS Configuration

## Purpose

This document explains how **configuration and environment variables are handled in our NestJS backend**.

The goal is to answer: "How does our backend manage secrets and environment-specific settings in a safe, predictable way?"

By the end, you should grasp the importance of externalized configuration, NestJS environment variable loading, integration with modules and services, startup validation, secret protection rules, and the differences between development and production configurations.

---

## Why Configuration Exists

Backend applications require values that change between environments:

- Database URL
- JWT secret
- Token expiration time
- CORS origins
- Port number
- Feature flags

Hardcoding these values inside the codebase creates problems:

- Secrets become visible in version control
- Deployments require code changes
- Different environments cannot share the same build

**Configuration must live outside the code.**

---

## Environment Variables

Environment variables are key-value pairs provided to the process at runtime.

Example:

```text
DATABASE_URL=postgresql://user:password@localhost:5432/app
JWT_SECRET=my-super-secret-key
PORT=3000
```

These values are accessed in Node.js via:

```ts
process.env.DATABASE_URL
```

However, directly using `process.env` everywhere leads to:

- Unstructured access
- Hard-to-test code
- No validation at startup
- Hidden dependencies

**NestJS solves this with the `ConfigModule`.**

---

## ConfigModule in NestJS

ConfigModule centralizes configuration management.

```ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class CoreModule {}
```

`isGlobal: true` means:

- ConfigService can be injected anywhere
- No need to import ConfigModule repeatedly

This module is typically registered in a CoreModule.

---

## Using ConfigService

Instead of accessing `process.env` directly we use ConfigService to retrieve configuration values. For example:

```ts
const jwtSecret = this.configService.get<string>('JWT_SECRET');
```

This approach enhances code readability and maintainability, ensuring that all configuration access is managed through a single service.

Example:

```ts
@Injectable()
export class AuthService {

  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

Benefits:

- Centralized configuration access
- Typed retrieval
- Easier mocking in tests

Services depend on ConfigService via dependency injection.

---

## Startup Validation (Fail Fast)

If a required environment variable is missing, the backend should not start.

```ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    PORT: Joi.number().required(),
  }),
});
```

If validation fails, the application crashes at startup and an error message will explain missing variables

Failing fast prevents undefined behavior later.

---

## Configuration Ownership

Configuration should not be scattered across modules.

**Rules:**

- CoreModule owns ConfigModule
- Services request configuration through DI
- No service reads `process.env` directly
- Secrets are never logged

Example ownership:

- AuthService → JWT_SECRET
- PrismaService → DATABASE_URL
- App bootstrap → PORT

Each service only accesses what it needs.

---

## Development vs Production

Development environment:

- `.env` file stored locally
- Loaded automatically by ConfigModule
- Contains test database credentials

Production environment:

- Variables injected via Docker or orchestration system
- No `.env` file in container image
- Secrets managed externally

The backend code does not change between environments.

Only configuration changes.

---

## Configuration and Prisma Integration

Prisma typically reads `DATABASE_URL` from environment.

Example:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This means:

- Prisma depends on environment configuration
- Backend must ensure variable exists before Prisma initializes

Startup validation ensures consistency.

---

## Configuration and WebSockets

WebSocket settings may include:

- CORS origin
- Namespace
- Port (if separate)

Example:

```ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
```

Better pattern:

Inject ConfigService and pass config dynamically.

Avoid hardcoding environment-dependent values in decorators when possible.

---

## Configuration and Reverse Proxy (Nginx)

If running behind a reverse proxy:

- Backend receives HTTP from proxy
- HTTPS termination happens at proxy level
- `X-Forwarded-For` header contains real IP

If needed:

```ts
app.set('trust proxy', 1);
```

This affects:

- Rate limiting
- Logging
- Security decisions

Configuration must reflect deployment assumptions.

---

## Docker Integration

When running in Docker:

Environment variables are passed via:

```yaml
environment:
  - DATABASE_URL=...
  - JWT_SECRET=...
```

Or via `.env` file referenced by docker-compose.

Backend should not assume local file paths or machine-specific settings.

---

## Security Rules

Never:

- Commit secrets to version control
- Log JWT secrets
- Return environment values in responses

Configuration must be treated as sensitive input.

---

## Testing and Configuration

In unit tests:

You may mock ConfigService:

```ts
{
  provide: ConfigService,
  useValue: {
    get: jest.fn().mockReturnValue('test-secret'),
  },
}
```

This avoids dependency on real environment variables.
