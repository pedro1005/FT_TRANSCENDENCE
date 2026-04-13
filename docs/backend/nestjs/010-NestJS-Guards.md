# NestJS Guards

## Purpose

This document explains **Guards** in NestJS. By the end, you should understand what a guard is, where it runs in the request lifecycle, the difference between authentication and authorization, how JWT-based authentication works conceptually, how guards fit into module boundaries, and why they protect architectural integrity.

Guards decide whether a request is allowed to proceed.

They are **access control gates**.

In our project:

- **Authentication** → JWT token verification
- **Authorization** → "Can this user modify this resource?"

---

## Where Guards Sit in the Lifecycle

Recall the request flow:

```mermaid
Incoming request → Middleware → Guards → Pipes → Controller → Service → Response
```

Guards run **before** the controller method is executed.

If a guard returns `false` or throws an exception:

- The controller is never called.
- The service is never executed.
- The request ends immediately.

**This makes guards ideal for authentication and authorization.**

---

## Basic Guard Structure

A guard implements `CanActivate`.

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ExampleGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check something
    return true; // allow request
  }
}
```

`ExecutionContext` gives access to:

- HTTP request
- WebSocket context
- RPC context

For now, focus on HTTP.

---

## Applying a Guard

**Method level:**

```ts
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() {
  return "Protected";
}
```

**Controller level:**

```ts
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {}
```

**Global level (applies everywhere):**

```ts
app.useGlobalGuards(new JwtAuthGuard());
```

Be cautious with global guards. They affect the entire application.

---

## JWT Authentication Flow

Conceptually, authentication works like this:

1. User logs in via `/auth/login`.
2. Server validates credentials.
3. Server generates a JWT token.
4. Client stores token.
5. Client sends token in `Authorization` header -> `Authorization: Bearer <token>`
6. Guard extracts token.
7. Guard verifies token.
8. Guard attaches user information to request.
9. Controller executes.

If verification fails → 401 Unauthorized.

---

## Example: Simplified JWT Guard

```ts
@Injectable()
export class JwtAuthGuard implements CanActivate {

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Attach user to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

- Guard does not know about business logic.
- Guard only verifies identity.
- It attaches user data for later use.

---

## Using User Data in Controllers

Once a guard attaches `request.user`, controllers can access it:

```ts
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Req() request) {
  return request.user;
}
```

**Better approach (cleaner):**

Create a custom decorator:

```ts
export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  }
);
```

Then:

```ts
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user) {
  return user;
}
```

This keeps controllers clean.

---

## Authorization Guards

```ts
@Injectable()
export class OwnerGuard implements CanActivate {

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    const resource = await this.resourceService.findById(resourceId);

    if (resource.ownerId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }

    return true;
  }
}
```

This guard ensures:

- Only the owner can modify a resource.

Also, guards can be chained:

```ts
@UseGuards(JwtAuthGuard, OwnerGuard)
```

First authenticate, then authorize.

---

## Guards and Modules

Guards belong to specific modules.

For example:

- `JwtAuthGuard` → AuthModule
- `OwnerGuard` → Depends on resource module

If a guard depends on a service, that service must be:

- Provided in its module
- Exported if used cross-module

Guards are providers.

They follow the same dependency injection rules.

---

## Guards vs Middleware

**Middleware:**

- Runs before guards
- Does not know which controller will handle the request
- Does not know route metadata

**Guards:**

- Know the target handler
- Can read route decorators
- Can apply logic based on metadata

**Use middleware for:**

- Logging
- CORS
- Parsing

**Use guards for:**

- Authentication
- Authorization
- Role enforcement

---

## Guards & WebSockets

Guards also work with WebSocket gateways.

The difference:

```ts
context.switchToWs()
```

Instead of:

```ts
context.switchToHttp()
```

Authentication principles remain the same.

**WebSocket authentication is critical for real-time gameplay.**

---

## Design Boundaries

**Guards should:**

- Verify identity
- Verify permission
- Attach minimal user data
- Fail fast

**Guards should not:**

- Execute domain logic
- Modify data
- Perform heavy computation
- Access unrelated services

**They are gatekeepers, not decision engines.**

---

## In Our Project

**Expected guards:**

**1. JwtAuthGuard**

Verifies token and attaches user.

**2. RoleGuard (if roles are implemented)**

Ensures user has required role.

**3. ResourceOwnershipGuard**

Ensures user owns or has rights over resource.

WebSocket authentication guard for game connections.
