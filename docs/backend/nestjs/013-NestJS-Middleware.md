# NestJS Middleware

## Purpose

This document explains **Middleware** in NestJS. By the end, you should have a clear understanding of middleware, its lifecycle position, its distinctions from guards, pipes, and interceptors, its appropriate use cases, and the importance of keeping it low-level and generic.

Middleware is the earliest processing layer in the request pipeline.
It operates before NestJS routing logic is fully resolved.

---

## Where Middleware Sits in the Lifecycle

Full request flow:

```mermaid
Incoming request → Middleware → Guards → Interceptors(before) → Pipes → Controller → Service → Interceptors (after) → Response
```

Middleware runs:

- Before guards
- Before route matching metadata is used
- Before validation
- Before controller logic

**It sees the raw request.**

---

## What is Middleware

Middleware is a function (or class) that:

- Receives the request
- Receives the response
- Receives a `next()` function
- Decides whether to continue the pipeline

Basic example:

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}
```

If `next()` is not called, the request stops.

Middleware has full access to the raw Express request and response objects.

---

## Applying Middleware

Middleware is applied inside a module using `configure()`.

```ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

@Module({})
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
```

You can apply it to:

- All routes
- Specific controllers
- Specific paths
- Specific HTTP methods

Example:

```ts
consumer
  .apply(LoggerMiddleware)
  .forRoutes('users');
```

---

## The Reason Middleware Exists

Middleware handles **low-level concerns** that are not specific to business logic.

- Logging raw requests
- CORS configuration
- Parsing request bodies
- Attaching correlation IDs
- Basic rate limiting
- Early request rejection
- Setting headers
- ...

Middleware does not know:

- Which controller will handle the request
- What decorators are applied
- What guards will run
- What DTOs exist

It operates before NestJS-specific abstractions.

---

## Middleware vs Guards

**Middleware:**

- Runs before authentication logic
- Does not know route metadata
- Cannot easily access handler information

**Guards:**

- Know the controller and route
- Can read route metadata
- Designed for authentication and authorization

If you are checking permissions, use a guard.

If you are logging request metadata, use middleware.

---

## Middleware vs Interceptors

**Middleware:**

- Runs before routing
- Cannot modify the response after execution
- Works at raw HTTP level

**Interceptors:**

- Wrap around controller execution
- Can modify responses
- Work at Nest abstraction level

**If you need to modify outgoing data** -> use an interceptor.

**If you need to inspect incoming requests globally** -> use middleware.

---

## Example: Adding a Request ID

Middleware is ideal for attaching metadata to requests.

```ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {

    req['requestId'] = crypto.randomUUID();
    next();
  }
}
```

Later in controllers or services, you can access:

```ts
request.requestId
```

This is useful for logging and tracing.

---

## Middleware & Early Termination

Middleware can terminate requests early.

```ts
use(req: Request, res: Response, next: NextFunction) {

  if (!req.headers['x-api-key']) {
    return res.status(403).json({ message: 'Missing API key' });
  }

  next();
}
```

**Be cautious:** early termination bypasses guards and pipes.

This should only be used for global, low-level policies.

---

## Global Middleware

Some middleware is applied globally by default in NestJS, such as:

- JSON body parsing
- URL-encoded body parsing

You rarely need to implement your own global parsing middleware unless doing advanced configuration.

---

## Middleware and Express

By default, NestJS uses Express (unless configured with Fastify).

Middleware directly interacts with Express objects:

```ts
Request
Response
NextFunction
```

This is lower-level than most Nest abstractions.

If your project switches HTTP adapters, middleware behavior may change.

**Guards and interceptors are more framework-agnostic.**

---

## Middleware & WebSockets

**Middleware is HTTP-specific.**

WebSocket connections use a different lifecycle.

For WebSocket-level authentication, you use:

- Gateway guards
- WebSocket adapters

**Middleware does not protect WebSocket events.**

---

## What Middleware Should Not Do

**Middleware should not:**

- Access the database
- Contain business rules
- Perform domain validation
- Replace guards
- Modify persistent state

It should stay simple and generic.

If middleware becomes complex, it likely belongs in a guard or interceptor.

---

## In Our Project

Potential middleware use cases:

- Logging requests
- Adding correlation IDs
- Global CORS configuration
- Basic rate limiting (if not done at Nginx level)
- Attaching metadata for debugging

Most domain logic will live in services.
Most security logic will live in guards.

Middleware remains minimal.

---

## Mental Model

Middleware prepares raw requests.
Guards decide access.
Pipes validate input.
Controllers orchestrate.
Services execute domain logic.
Interceptors wrap execution.

Middleware is the first contact point.

It should not know about your domain.

## Notes

This document is currently a working draft. Its guidance has not yet been fully reviewed for accuracy and completeness in the context of our project. Treat it as a starting point and update it as we refine our middleware patterns and best practices.
